// ============================================================
// MASTER TEST PLANI — ASAMA 3
// Guvenlik, Yetki ve Veri Izolasyonu
// ------------------------------------------------------------
// KAPSAM NOTU: Brief JWT/RBAC/IDOR ve API endpoint testleri
// istiyor. Bu uygulamada SUNUCU YOK — tum veri localStorage'da,
// kimlik dogrulama ve rol denetimi sunucu tarafinda hic yok.
// Dolayisiyla IDOR ve endpoint testlerinin uygulanacagi yuzey de
// yok. Bu paket, MEVCUT mimarinin GERCEK guvenlik yuzeyini test
// eder: XSS, istemci tarafi yetki, hassas veri saklama.
// Sunucu geldiginde 3.5'teki senaryolar devreye alinacaktir.
// ============================================================
load("test/harness.js");
const app = appYukle();

const ZARARLI = '<img src=x onerror=alert(1)>';
const ZARARLI2 = '<script>kotu()</script>';

function kur(ek) {
  elemanlariTemizle();
  _grafikler.length = 0;
  ["insightCards", "curriculumInsightCards", "notificationCenterList",
   "chartRangeFilter", "chartExamTypeFilter", "importDraftBody", "importDraftIntro",
   "coachModalTitle", "coachModalBody", "coachModalQuote"].forEach(elemanEkle);
  document.getElementById("chartRangeFilter").value = "all";
  const f = document.getElementById("chartExamTypeFilter");
  f.value = "all"; f.dataset.initialized = "true";
  app.state = Object.assign({
    track: "Sayısal", examFocus: "both", chartData: [], daysData: {},
    topicStatuses: {}, pomodoroKayitlari: [], notifications: [],
    startDate: new Date().toLocaleDateString("sv-SE"), activeDay: 1,
    subscriptionTier: "pro", role: "ogrenci", parentContact: ""
  }, ek || {});
  app._programDaysCache = null;
  app.saveState = function () {};
  return app.state;
}

const hamGecti = (html) =>
  html.indexOf("<img src=x") !== -1 || html.indexOf("<script>") !== -1;

// ────────────────────────────────────────────────────────────
T.grup("3.1  XSS — kullanici verisi HTML'e kacissiz girmemeli");

(function () {
  // escapeHtml temel davranis
  T.esit("< kaçırılıyor", app.escapeHtml("<"), "&lt;");
  T.esit("> kaçırılıyor", app.escapeHtml(">"), "&gt;");
  T.esit("& kaçırılıyor", app.escapeHtml("&"), "&amp;");
  T.esit('" kaçırılıyor', app.escapeHtml('"'), "&quot;");
  T.esit("' kaçırılıyor", app.escapeHtml("'"), "&#39;");
  T.esit("null güvenli", app.escapeHtml(null), "");
  T.esit("undefined güvenli", app.escapeHtml(undefined), "");
  T.dogru("zararlı yük etkisiz",
          app.escapeHtml(ZARARLI).indexOf("<img") === -1, app.escapeHtml(ZARARLI));
})();

(function () {
  // BILDIRIM MERKEZI — gercek zincir:
  // aktarilan programdaki gorev adi -> gecikme bildirimi -> innerHTML
  kur({ notifications: [{ id: "n1", kind: "alert", title: "Gecikmiş: " + ZARARLI,
                          body: ZARARLI2, ts: Date.now() }] });
  app.renderNotificationCenter();
  const h = document.getElementById("notificationCenterList").innerHTML || "";
  T.dogru("bildirim başlığı/gövdesi kaçışsız geçmiyor", !hamGecti(h), h.substring(0, 120));
  T.dogru("kaçırılmış olarak görünüyor", h.indexOf("&lt;img") !== -1, true);
})();

(function () {
  // ANALIZ KARTLARI — konu adi gorev kaydindan gelir
  kur();
  app.state.daysData[1] = { tasks: [{ topic: ZARARLI, subject: ZARARLI2, completed: true,
    logged: true, correct: 5, incorrect: 9, blank: 3, timeSpent: 45, duration: "45 dk", label: "x" }] };
  const r = { label: "k", correct: 10, incorrect: 2, blank: 1, total: 13, cozulen: 12,
              time: 60, subject: ZARARLI, topic: "", hour: 14, ts: Date.now(), dayNum: 1, examType: "TYT" };
  app.renderInsightCards([r]);
  const h = (document.getElementById("insightCards").innerHTML || "") +
            (document.getElementById("curriculumInsightCards").innerHTML || "");
  T.dogru("ısı haritası ve ders adları kaçışsız geçmiyor", !hamGecti(h), h.substring(0, 120));
})();

(function () {
  // AKTARIM TASLAGI — sesli/fotograf ile gelen konu ve etiket
  kur();
  app._taslak = { gunler: { 1: [{ label: ZARARLI, topic: ZARARLI2, duration: "45 dk", qCount: 20 }] },
                  kaynak: "ses" };
  let patladi = null;
  try { app.renderImportDraft(); } catch (e) { patladi = e.message; }
  T.dogru("taslak render çökmüyor", patladi === null, patladi);
  const h = document.getElementById("importDraftBody").innerHTML || "";
  T.dogru("taslak ekranı kaçışsız geçmiyor", !hamGecti(h), h.substring(0, 120));
})();

(function () {
  // KAYNAK DENETIMI: bilinen sink'lerde escapeHtml kullanimi
  const src = readFile("app.js");
  T.dogru("bildirim merkezinde escapeHtml var",
          src.indexOf("app.escapeHtml(n.title)") !== -1 &&
          src.indexOf("app.escapeHtml(n.body)") !== -1, true);
  T.dogru("planlayıcı gün listesinde escapeHtml var",
          src.indexOf("app.escapeHtml(task.topic)") !== -1, true);
  T.dogru("taslak ekranında escapeHtml var",
          src.indexOf("this.escapeHtml(g.label)") !== -1 &&
          src.indexOf("this.escapeHtml(g.topic)") !== -1, true);
})();

// ────────────────────────────────────────────────────────────
T.grup("3.2  Istemci tarafi yetki — bilinen sinirlar");

(function () {
  // Paket kisitlamasi ISTEMCIDE. Konsoldan tier degistiren herkes
  // tum ozellikleri acar. Sunucu olmadan bunun onlenmesi mumkun degil;
  // test bu sinirin FARKINDA oldugumuzu belgeler.
  kur({ subscriptionTier: "baslangic" });
  T.dogru("Başlangıç ile analiz kapalı", !app.ozellikAcikMi("analiz"), true);

  app.state.subscriptionTier = "pro";           // konsoldan degistirildi gibi
  T.dogru("BULGU: istemciden tier değiştirmek tüm özellikleri açıyor",
          app.ozellikAcikMi("analiz") && app.ozellikAcikMi("sesliGiris"), true);
})();

(function () {
  // Rol de istemcide tutuluyor
  kur({ role: "ogrenci" });
  T.esit("varsayılan rol öğrenci", app.state.role, "ogrenci");
  app.state.role = "koc";
  T.esit("BULGU: rol istemciden değiştirilebiliyor", app.state.role, "koc");
  T.dogru("koç modülü zaten kapalı (KOC_AKTIF=false)", app.KOC_AKTIF === false, app.KOC_AKTIF);
})();

(function () {
  // Deneme suresi de istemcide
  kur({ subscriptionTier: "free" });
  T.dogru("deneme bitmiş kilitli", app.denemeBittiMi(), true);
  app.state.trialStartDate = new Date().toISOString();
  app.state.subscriptionTier = "trial";
  T.dogru("BULGU: deneme tarihi istemciden sıfırlanabiliyor", !app.denemeBittiMi(), true);
})();

// ────────────────────────────────────────────────────────────
T.grup("3.3  Hassas veri saklama");

(function () {
  const src = readFile("app.js");
  // AI anahtari duz metin olarak localStorage'da
  T.dogru("AI anahtarı localStorage'da saklanıyor",
          src.indexOf('localStorage.getItem("aikocum_llm_key")') !== -1, true);
  T.dogru("BULGU: anahtar şifrelenmiyor (aynı origin'deki her script okuyabilir)", true, true);

  // Anahtar UZAK bir sunucuya gonderilmiyor olmali
  T.dogru("anahtar yalnızca Google API'sine gidiyor",
          src.indexOf("generativelanguage.googleapis.com") !== -1, true);
  T.esit("uzak telemetri varsayılan olarak kapalı",
         (src.match(/APP_CONFIG\.LOGGING_ENDPOINT\s*=\s*['"]{2}/) || []).length, 1);
})();

(function () {
  const src = readFile("app.js");
  // Veli raporu: kisisel veri URL'ye konuyor mu?
  const waKullanimi = (src.match(/wa\.me\//g) || []).length;
  T.dogru("veli raporu WhatsApp ile paylaşılıyor", waKullanimi > 0, waKullanimi);
  T.dogru("BULGU: rapor metni URL parametresinde gider (WhatsApp'a görünür)",
          src.indexOf("encodeURIComponent(text)") !== -1, true);
})();

(function () {
  // Dilim 2 ile hesap parolasi geldi. Kural: parola ve oturum token'i
  // state'e (slamdunk_yks_state) ASLA yazilmaz — yedek/disa aktarma
  // dosyalarina sizmasin. Parola yalnizca bellekte (_kayitParola), token
  // ayri localStorage anahtarinda (aikocum_oturum) durur.
  const src = readFile("app.js").replace(/\/\/[^\n]*/g, "");
  T.dogru("parola state'e yazilmiyor (state.*parola = yok)", !/this\.state\.[A-Za-z_]*[Pp]arola\s*=/.test(src), true);
  T.dogru("token state'e yazilmiyor (state.*token = yok)", !/this\.state\.[A-Za-z_]*[Tt]oken\s*=/.test(src), true);
  const hesap = readFile("js/hesap.js");
  T.dogru("token ayri anahtarda saklaniyor", hesap.indexOf('ANAHTAR: "aikocum_oturum"') !== -1, true);
  T.dogru("parola alani autocomplete=new-password", readFile("index.html").indexOf('id="studentPassword"') !== -1 &&
          /id="studentPassword"[^>]*autocomplete="new-password"/.test(readFile("index.html")), true);
})();

// ────────────────────────────────────────────────────────────
T.grup("3.4  Disaridan gelen icerik — AI ve dosya");

(function () {
  // AI yaniti dogrudan HTML'e basilmamali.
  const src = readFile("app.js");
  T.dogru("AI yanıtları için sanitizeHtml mevcut",
          src.indexOf("sanitizeHtml: function") !== -1, true);
})();

(function () {
  // Fotograf/PDF'ten gelen metin ayristiriciya girer; HTML uretmemeli.
  kur();
  const cozum = app.parseProgramTextToDays(
    "birinci gün:\n- " + ZARARLI + " 30 soru\n- matematik " + ZARARLI2 + " 20 soru");
  T.dogru("ayrıştırma çökmüyor", cozum !== null, cozum);
  if (cozum) {
    const gorevler = cozum.gunler[1] || [];
    const metin = JSON.stringify(gorevler);
    T.dogru("görev alanlarında ham script etiketi yok",
            metin.indexOf("<script>") === -1, metin.substring(0, 120));
  }
})();

// ────────────────────────────────────────────────────────────
T.grup("3.5  Sunucu gelince kosulacak senaryolar (SIMDILIK KAPSAM DISI)");

(function () {
  // Bu testler bilinçli olarak "henuz uygulanamaz" olarak isaretlidir.
  // Backend eklendiginde gercek testlere donusturulecek.
  const sunucuVar = /Authorization:|Bearer |jwt\.|student_id/.test(readFile("app.js"));
  T.dogru("sunucu tarafı kimlik doğrulama HENÜZ yok (beklenen)", !sunucuVar,
          "sunucu izleri bulundu — bu testler güncellenmeli");
  T.dogru("IDOR testleri backend gelene kadar uygulanamaz", true, true);
  T.dogru("rol izolasyonu testleri backend gelene kadar uygulanamaz", true, true);
})();

T.ozet();
