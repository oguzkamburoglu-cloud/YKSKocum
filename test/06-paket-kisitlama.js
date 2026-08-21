// ============================================================
// GRUP 6 — Paket kisitlamalari
// Paketler tanimliydi ama hicbir seyi kisitlamiyordu; odeme
// baglandiginda satin alan ile almayan arasinda fark olmayacakti.
// ============================================================
load("test/harness.js");
const app = appYukle();

function paket(tier) {
  elemanlariTemizle();
  app.state = { subscriptionTier: tier, trialStartDate: new Date().toISOString() };
  return app;
}

const TUM_OZELLIKLER = [
  "programOlustur", "gunlukHaftalik", "aylikYillik",
  "mufredat", "hataZindani", "analiz", "kaynakKitap", "veliRaporu",
  "fotoPdf", "sesliGiris", "aiKoc", "tercihMotoru", "aliskanlik"
];

function acikOlanlar(tier) {
  paket(tier);
  return TUM_OZELLIKLER.filter(o => app.ozellikAcikMi(o));
}

// ────────────────────────────────────────────────────────────
T.grup("6.1  Paket seviyeleri dogru siralaniyor");

(function () {
  T.dogru("free < baslangic", app.PAKET_SEVIYE.free < app.PAKET_SEVIYE.baslangic, true);
  T.dogru("baslangic < standart", app.PAKET_SEVIYE.baslangic < app.PAKET_SEVIYE.standart, true);
  T.dogru("standart < pro", app.PAKET_SEVIYE.standart < app.PAKET_SEVIYE.pro, true);
  T.esit("deneme Pro seviyesinde", app.PAKET_SEVIYE.trial, app.PAKET_SEVIYE.pro);
})();

T.grup("6.2  Her paket dogru ozellikleri aciyor");

(function () {
  const b = acikOlanlar("baslangic");
  T.dogru("Başlangıç: program oluşturma açık", b.indexOf("programOlustur") !== -1, b);
  T.dogru("Başlangıç: aylık/yıllık açık", b.indexOf("aylikYillik") !== -1, b);
  T.dogru("Başlangıç: analiz KAPALI", b.indexOf("analiz") === -1, b);
  T.dogru("Başlangıç: hata zindanı KAPALI", b.indexOf("hataZindani") === -1, b);
  T.dogru("Başlangıç: müfredat KAPALI", b.indexOf("mufredat") === -1, b);
  T.dogru("Başlangıç: sesli giriş KAPALI", b.indexOf("sesliGiris") === -1, b);
  T.esit("Başlangıç toplam açık özellik", b.length, 3);
})();

(function () {
  const st = acikOlanlar("standart");
  T.dogru("Standart: analiz açık", st.indexOf("analiz") !== -1, st);
  T.dogru("Standart: hata zindanı açık", st.indexOf("hataZindani") !== -1, st);
  T.dogru("Standart: müfredat açık", st.indexOf("mufredat") !== -1, st);
  T.dogru("Standart: veli raporu açık", st.indexOf("veliRaporu") !== -1, st);
  T.dogru("Standart: fotoğraf/PDF KAPALI", st.indexOf("fotoPdf") === -1, st);
  T.dogru("Standart: sesli giriş KAPALI", st.indexOf("sesliGiris") === -1, st);
  T.dogru("Standart: alışkanlık KAPALI", st.indexOf("aliskanlik") === -1, st);
  T.dogru("Standart, Başlangıç'ın hepsini kapsıyor",
          acikOlanlar("baslangic").every(o => st.indexOf(o) !== -1), true);
})();

(function () {
  const pro = acikOlanlar("pro");
  T.esit("Pro: tüm özellikler açık", pro.length, TUM_OZELLIKLER.length);
  T.dogru("Pro, Standart'ın hepsini kapsıyor",
          acikOlanlar("standart").every(o => pro.indexOf(o) !== -1), true);
})();

(function () {
  const d = acikOlanlar("trial");
  T.esit("Deneme: tüm özellikler açık", d.length, TUM_OZELLIKLER.length);
})();

(function () {
  const f = acikOlanlar("free");
  T.esit("Deneme bitmiş (free): hiçbir özellik açık değil", f.length, 0);
})();

T.grup("6.3  Deneme bitince TAM KILIT");

(function () {
  paket("free");
  T.dogru("deneme bitmiş kullanıcı kilitli", app.denemeBittiMi(), true);
  paket("baslangic");
  T.dogru("Başlangıç kilitli DEĞİL", !app.denemeBittiMi(), false);
  paket("trial");
  T.dogru("deneme sürerken kilitli DEĞİL", !app.denemeBittiMi(), false);
  paket("pending");
  T.dogru("paket seçilmemiş kullanıcı 'deneme bitti' sayılmaz", !app.denemeBittiMi(), true);
  T.dogru("eski ad saltOkunurMu hâlâ çalışıyor", typeof app.saltOkunurMu === "function", true);
})();

(function () {
  // Deneme bitince uygulamaya GIRILEMEZ: dogrudan paket ekrani
  paket("free");
  ["subscriptionModal", "paketIcerik", "coachModalTitle", "coachModalBody", "coachModalQuote"]
    .forEach(elemanEkle);
  let acildi = false;
  const eski = app.showSubscriptionModal;
  app.showSubscriptionModal = function () { acildi = true; };
  let patladi = null;
  try { app.startMainDashboard(); } catch (e) { patladi = e.message; }
  app.showSubscriptionModal = eski;
  T.dogru("startMainDashboard çökmüyor", patladi === null, patladi);
  T.dogru("paket ekranı açılıyor", acildi, true);
})();

(function () {
  // Paket ekrani KAPATILAMAZ
  paket("free");
  elemanEkle("subscriptionModal");
  let uyarildi = false;
  const eskiAlert = alert;
  try {
    // harness'te alert no-op; kapanma girisimini modal sinifiyla olcelim
    app.closeSubscriptionModal();
    const m = document.getElementById("subscriptionModal");
    T.dogru("modal kapanmadı", !m.classList.contains("kapandi"), true);
  } catch (e) {
    T.dogru("kapatma çökmüyor", false, e.message);
  }
})();

(function () {
  // Salt okunur modda gorev isaretlenemez
  paket("free");
  elemanEkle("coachModalTitle"); elemanEkle("coachModalBody"); elemanEkle("coachModalQuote");
  const kutu = { checked: true };
  let patladi = null;
  try { app.toggleTaskCompleted("t1", kutu); } catch (e) { patladi = e.message; }
  T.dogru("görev işaretleme çökmüyor", patladi === null, patladi);
  T.esit("işaret geri alındı", kutu.checked, false);
})();

T.grup("6.4  Kilitli sekmeye gecilemiyor");

(function () {
  paket("baslangic");
  elemanEkle("coachModalTitle"); elemanEkle("coachModalBody"); elemanEkle("coachModalQuote");
  app.state.activeTab = "today";
  app.switchTab("charts");                    // analiz -> Standart gerekiyor
  T.esit("Başlangıç kullanıcısı analiz sekmesine geçemiyor", app.state.activeTab, "today");

  paket("standart");
  app.state.activeTab = "today";
  elemanEkle("panel-charts"); elemanEkle("tabBtn-charts");
  app.switchTab("charts");
  T.esit("Standart kullanıcısı analiz sekmesine geçebiliyor", app.state.activeTab, "charts");
})();

T.grup("6.5  Paket sistemi kapaliyken hicbir sey kisitlanmaz");

(function () {
  const eski = app.MONETIZATION_ENABLED;
  app.MONETIZATION_ENABLED = false;
  paket("free");
  T.dogru("MONETIZATION_ENABLED=false iken tüm özellikler açık",
          TUM_OZELLIKLER.every(o => app.ozellikAcikMi(o)), true);
  T.dogru("salt okunur değil", !app.saltOkunurMu(), true);
  app.MONETIZATION_ENABLED = eski;
})();

T.grup("6.6  Paket tanimlari ile kisitlama tutarli");

(function () {
  // PAKETLER listesindeki her paket icin en az bir ozellik tanimli olmali
  (app.PAKETLER || []).forEach(p => {
    const sahip = Object.keys(app.OZELLIK_PAKETI).filter(k => app.OZELLIK_PAKETI[k] === p.id);
    T.dogru("'" + p.ad + "' paketine bağlı özellik var", sahip.length > 0, sahip);
  });
  // Her ozellik gecerli bir pakete bagli olmali
  const gecerli = (app.PAKETLER || []).map(p => p.id);
  const hatali = Object.keys(app.OZELLIK_PAKETI).filter(k => gecerli.indexOf(app.OZELLIK_PAKETI[k]) === -1);
  T.esit("geçersiz pakete bağlı özellik yok", hatali.length, 0);
  // Her ozelligin okunur bir adi olmali
  const adsiz = Object.keys(app.OZELLIK_PAKETI).filter(k => !app.OZELLIK_ADI[k]);
  T.esit("adı olmayan özellik yok", adsiz.length, 0);
})();

// ────────────────────────────────────────────────────────────
T.grup("6.7  Yillik plan ve indirim");

(function () {
  paket("pending");
  app.state.faturaDonemi = "aylik";
  const p = app.PAKETLER.filter(x => x.id === "standart")[0];

  const a = app.paketFiyati(p);
  T.esit("aylık tutar", a.tutar, 499);
  T.esit("aylık birim", a.birim, "₺/ay");

  app.state.faturaDonemi = "yillik";
  const y = app.paketFiyati(p);
  T.esit("yıllık tutar", y.tutar, 4990);
  T.esit("yıllık birim", y.birim, "₺/yıl");
  T.esit("12 ay peşin tutarı", y.aylikToplam, 5988);
  T.esit("tasarruf = 2 aylık ücret", y.tasarruf, 499 * 2);
  T.esit("aylık karşılığı", y.aylikKarsilik, Math.round(4990 / 12));
  T.dogru("indirim oranı %15-20 arasında", y.indirimYuzde >= 15 && y.indirimYuzde <= 20, y.indirimYuzde);
})();

(function () {
  // Her pakette yillik fiyat = 10 aylik ucret olmali
  app.state.faturaDonemi = "yillik";
  app.PAKETLER.forEach(p => {
    const f = app.paketFiyati(p);
    T.esit("'" + p.ad + "' yıllık = " + (12 - app.HEDIYE_AY) + " aylık ücret",
           f.tutar, p.fiyat * (12 - app.HEDIYE_AY));
    T.dogru("'" + p.ad + "' yıllık, 12 ay peşinden ucuz", f.tutar < p.fiyat * 12, f.tutar);
  });
})();

(function () {
  // Yillik plan kimligi kisitlamayi BOZMAMALI
  T.esit("'standart_yillik' -> 'standart'", app.paketKimligi("standart_yillik"), "standart");
  T.esit("'pro_yillik' -> 'pro'", app.paketKimligi("pro_yillik"), "pro");
  T.esit("son ek yoksa aynen döner", app.paketKimligi("baslangic"), "baslangic");

  paket("standart_yillik");
  T.dogru("yıllık Standart, analiz özelliğini açıyor", app.ozellikAcikMi("analiz"), true);
  T.dogru("yıllık Standart, sesli girişi açmıyor", !app.ozellikAcikMi("sesliGiris"), true);
  T.dogru("yıllık Standart salt okunur değil", !app.saltOkunurMu(), true);

  paket("pro_yillik");
  T.dogru("yıllık Pro tüm özellikleri açıyor",
          TUM_OZELLIKLER.every(o => app.ozellikAcikMi(o)), true);
})();

(function () {
  // Varsayilan donem aylik olmali
  paket("pending");
  delete app.state.faturaDonemi;
  T.esit("dönem belirtilmemişse aylık", app.faturaDonemi(), "aylik");
  app.state.faturaDonemi = "saçma";
  T.esit("geçersiz dönem aylığa düşer", app.faturaDonemi(), "aylik");
})();

T.ozet();
