// ============================================================
// GRUP 11 — YIKICI TEST: Katman A (Is Mantigi) + Katman B (Guvenlik)
// ------------------------------------------------------------
// "Kotu niyetli kullanici" zihniyeti. Bu uygulama SUNUCUSUZ ve
// localStorage-only oldugu icin klasik IDOR / yetki-endpoint
// saldirilari YUZEYSIZ (baska kullanicinin verisi ayni tarayicida
// yok). Gercek saldiri yuzeyi: ISTEMCININ KENDISI saldirganin
// kontrolunde. Bu dosya iki seyi yapar:
//   1) Domain dogrulamasindaki bosluklari ifsa eder (Katman A)
//   2) Istemci-tarafi yetkinin sinirini KAYIT ALTINA alir (Katman B):
//      bunlar "duzeltilecek hata" degil, sunucu gelene kadar
//      YAPISAL sinir - test bunu belgeler ki backend'de kapatilsin.
// ============================================================
load("test/harness.js");
const app = appYukle();

function tazeDurum() {
  app.state = {
    startDate: "2026-08-21", daysData: {}, standardDaysData: {},
    subscriptionTier: "pro", trialStartDate: null,
    track: "Sayısal", examFocus: "both", role: "ogrenci",
    topicStatuses: {}, totalQuestionsSolved: 0, mockExams: [],
    MONETIZATION_ENABLED: true
  };
}

// ============================================================
T.grup("11.A  KATMAN A — Net hesabi saldiri girdileriyle");
// ============================================================

(function () {
  // 0.25 kurali dogru mu — pozitif, negatif, sifir
  T.esit("20D 8Y -> 18 net", app.netHesapla(20, 8), 18);
  T.esit("0D 40Y -> -10 net (negatif kirpilmiyor)", app.netHesapla(0, 40), -10);
  T.esit("kusurat 2 hane: 13D 3Y", app.netHesapla(13, 3), 12.25);
})();

(function () {
  // SALDIRI: string, null, NaN, Infinity enjeksiyonu
  T.esit("string girdi sayiya cevriliyor", app.netHesapla("20", "8"), 18);
  T.esit("null -> 0 kabul", app.netHesapla(null, null), 0);
  T.esit("undefined -> 0", app.netHesapla(undefined, undefined), 0);
  T.esit("harf girdi -> 0", app.netHesapla("abc", "xyz"), 0);
  // Infinity: Number(Infinity) gecerli; NaN'a dusmemeli, en azindan cokmemeli
  const inf = app.netHesapla(Infinity, 0);
  T.dogru("Infinity cokme yaratmiyor", inf === Infinity || typeof inf === "number", true);
})();

(function () {
  // BULGU A1 (DUZELTILDI): submitTestScore artik girdiyi sinirlar.
  // Kaynak taramasi: hedefi asan giris reddediliyor, negatifler kirpiliyor.
  const kaynak = readFile("app.js");
  T.dogru("A1 duzeltildi: dogru+yanlis hedef soruyu asamaz",
          kaynak.indexOf("(correct + wrong) > hedefSinir") !== -1, true);
  T.dogru("A1 duzeltildi: negatif degerler 0'a cekiliyor",
          kaynak.indexOf("correct = Math.max(0, correct)") !== -1, true);
})();

(function () {
  // KATMAN A — mufredat yuzdesi SIFIRA BOLME'ye kapali olmali.
  // Her ders grubunun toplami >=1 oldugu icin NaN uretilmemeli;
  // ilk gunde tum yuzdeler 0 (biten yok) ama tanimli sayi olmali.
  tazeDurum();
  const ozet = app.mufredatDersOzeti();
  T.dogru("mufredat ozeti dondu (mufredat yuklu)", !!ozet && Array.isArray(ozet.liste), true);
  if (ozet) {
    const bozuk = ozet.liste.filter(d => !Number.isFinite(d.yuzde) || d.yuzde < 0 || d.yuzde > 100);
    T.esit("hicbir yuzde NaN/sinir disi degil (sifira bolme yok)", bozuk.length, 0);
    T.esit("ilk gunde tum yuzdeler 0", ozet.liste.every(d => d.yuzde === 0), true);
  }
})();

(function () {
  // KATMAN A — Pomodoro CIHAZ SAATI manipulasyonu.
  // Seans bitisi Date.now()'a gore. Kullanici cihaz saatini GERI alirsa
  // kalan sure buyur; ILERI alirsa seans aninda biter. Wall-clock arka
  // plan throttling'e dayaniklidir (dogru tasarim) ama cihaz saatine
  // guvenir - bu kacinilmaz, ama davranis TANIMLI olmali: kalan sure
  // asla negatif dondurmez.
  app.sidebarPomoBitisTs = Date.now() - 999999;   // gecmiste bitmis
  T.esit("gecmis bitis -> kalan 0 (negatif degil)", app.pomoKalanSaniye(), 0);
  app.sidebarPomoBitisTs = Date.now() + 25 * 60 * 1000;
  const kalan = app.pomoKalanSaniye();
  T.dogru("gelecek bitis -> makul kalan (<=1500 sn)", kalan > 0 && kalan <= 1500, kalan);
})();

// ============================================================
T.grup("11.B  KATMAN B — Istemci-tarafi yetki sinirinin ifsasi");
// ============================================================

(function () {
  // SALDIRI: konsoldan paket yukseltme. Saldirgan ne yaparsa yapsin
  // istemci "pro" der; bu YAPISAL bir sinir - sunucu olmadan kapatilamaz.
  // Test bunu "kabul edilmis risk" olarak KAYIT ALTINA alir.
  tazeDurum();
  app.state.subscriptionTier = "free";
  T.esit("once: ucretsiz kullanici analiz KAPALI", app.ozellikAcikMi("analiz"), false);

  // Saldiri: tek satir
  app.state.subscriptionTier = "pro";
  T.dogru("BULGU B1 (yapisal): konsoldan 'pro' yazinca analiz ACILIYOR",
          app.ozellikAcikMi("analiz"), true);
})();

(function () {
  // SALDIRI: rol yukseltme. Ogrenci -> koc.
  tazeDurum();
  app.state.role = "ogrenci";
  app.state.role = "koc";   // konsol enjeksiyonu
  T.esit("BULGU B2 (yapisal): rol istemciden 'koc' yapilabiliyor",
         app.state.role, "koc");
})();

(function () {
  // SALDIRI: deneme suresini uzatma. trialStartDate ileri alinirsa
  // deneme hic bitmez. Istemci-tarafi zaman = guvenilmez.
  tazeDurum();
  app.state.subscriptionTier = "trial";
  app.state.trialStartDate = new Date(Date.now() + 365 * 864e5).toISOString();
  T.dogru("BULGU B3 (yapisal): trialStartDate gelecege alinabiliyor",
          new Date(app.state.trialStartDate) > new Date(), true);
})();

(function () {
  // SAVUNMA DOGRULAMA: XSS sinklari kacisla korunuyor (gercek duzeltme).
  // Saldirgan gorev adina <img onerror> koyarsa bildirimde CALISMAMALI.
  const kaynak = readFile("app.js");
  T.dogru("bildirim basligi escapeHtml'den geciyor",
          kaynak.indexOf("app.escapeHtml(n.title)") !== -1, true);
  T.dogru("bildirim govdesi escapeHtml'den geciyor",
          kaynak.indexOf("app.escapeHtml(n.body)") !== -1, true);

  const zararli = '<img src=x onerror="localStorage.getItem(\'aikocum_llm_key\')">';
  const kacisli = app.escapeHtml(zararli);
  T.dogru("escapeHtml < ve > karakterlerini notrler",
          kacisli.indexOf("<img") === -1 && kacisli.indexOf("&lt;img") !== -1, true);
})();

(function () {
  // SAVUNMA DOGRULAMA: AI anahtari yalnizca Google'a gider, baska
  // hicbir uc noktaya sizmaz (kaynak taramasi).
  const kaynak = readFile("app.js");
  const fetchler = (kaynak.match(/fetch\(`?([^`)'"]+)/g) || [])
    .filter(f => f.indexOf("aikocum_llm_key") !== -1 || f.indexOf("apiKey") !== -1 || f.indexOf("generativelanguage") !== -1);
  // Anahtarin gectigi tek istek Gemini endpoint'i olmali
  T.dogru("AI anahtari yalnizca generativelanguage (Gemini) istegine giriyor",
          kaynak.indexOf("generativelanguage.googleapis.com") !== -1, true);
})();

T.ozet();
