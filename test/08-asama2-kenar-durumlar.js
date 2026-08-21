// ============================================================
// MASTER TEST PLANI — ASAMA 2
// Kenar Durumlar ve Veri Sinirlari
//   2.1 Ilk gun / sifir veri
//   2.2 Asiri veri yuklemesi ve render performansi
//   2.3 Hatali veri girisleri
//   2.4 Depolama: kota, bozuk kayit, es zamanli yazma
// ============================================================
load("test/harness.js");
const app = appYukle();

const TUM_ELEMANLAR = [
  "accuracyTrendChart", "aiCoachCommentaryCardContainer", "balanceRadarChart",
  "balanceRecommendation", "chartExamTypeFilter", "chartRangeFilter",
  "chartsContentArea", "chartsEmptyState", "dailyStudyChart", "netTrendChart",
  "netsLineChart", "speedLineChart", "insightCards", "curriculumInsightCards",
  "sectionAnalysisCard", "habitWeeklyReviewText", "habitWeeklyReviewCard",
  "sumTodayTime", "sumTodayTimeSub", "sumProgress", "sumProgressSub",
  "sumLastNet", "sumLastNetSub", "kapasiteNotu", "grafikBolumu",
  "grafikAcKapaBtn", "grafikAcKapaOk"
];

function kur(ek) {
  elemanlariTemizle();
  _grafikler.length = 0;
  TUM_ELEMANLAR.forEach(elemanEkle);
  document.getElementById("chartRangeFilter").value = "all";
  const f = document.getElementById("chartExamTypeFilter");
  f.value = "all"; f.dataset.initialized = "true";
  app.state = Object.assign({
    track: "Sayısal", examFocus: "both", level: 5, chartData: [], daysData: {},
    topicStatuses: {}, pomodoroKayitlari: [], startDate: new Date().toISOString().slice(0, 10),
    activeDay: 1, isGraduate: false, wakeTime: "08:00", sleepTime: "23:00",
    weekdayHours: 4, weekendHours: 6, subscriptionTier: "pro", streak: 0,
    uploadedQuestions: []
  }, ek || {});
  app._programDaysCache = null;
  app.saveState = function () {};
  return app.state;
}

function kayit(o) {
  const c = o.correct || 0, y = o.incorrect || 0, b = o.blank || 0;
  return { label: o.label || "K", correct: c, incorrect: y, blank: b,
    total: c + y + b, cozulen: c + y, time: o.time !== undefined ? o.time : 60,
    subject: o.subject || "Matematik", topic: o.topic || "", hour: 14,
    ts: o.ts, dayNum: o.dayNum || 1, examType: o.examType || "TYT" };
}

// ────────────────────────────────────────────────────────────
T.grup("2.1  Ilk gun / sifir veri");

(function () {
  kur();
  let patladi = null;
  try {
    app.renderCharts();
    app.renderDashboardSummary();
    app.renderInsightCards([]);
    app.renderGunlukIstikrarGrafigi([]);
  } catch (e) { patladi = e.message; }
  T.dogru("hiç veri yokken tüm render çağrıları çöküyor mu", patladi === null, patladi);
})();

(function () {
  kur();
  app.renderDashboardSummary();
  T.esit("bugünkü çalışma 0 dk", document.getElementById("sumTodayTime").textContent, "0 dk");
  T.esit("toplam ilerleme %0", document.getElementById("sumProgress").textContent, "%0");
  T.esit("son deneme neti —", document.getElementById("sumLastNet").textContent, "—");
  T.esit("boş durum metni", document.getElementById("sumLastNetSub").innerHTML, "henüz kayıt yok");
})();

(function () {
  kur();
  app.renderCharts();
  T.esit("içerik gizli", document.getElementById("chartsContentArea").style.display, "none");
  T.esit("boş durum görünür", document.getElementById("chartsEmptyState").style.display, "block");
  T.esit("hiç grafik çizilmedi", _grafikler.length, 0);
})();

(function () {
  kur();
  T.esit("hiç konu bitmemişken yetişme tahmini yok", app.mufredatYetismeTahmini(), null);
  T.esit("seri 0", (app.calculateStreak(), app.state.streak), 0);
  T.esit("bugünkü pomodoro 0 dk", app.pomodoroDakikasi(1), 0);
})();

(function () {
  // Tek kayit: grafik ve kartlar tek noktayla da calismali
  kur({ chartData: [kayit({ correct: 10, incorrect: 2, blank: 3, ts: Date.now() })] });
  let patladi = null;
  try { app.renderCharts(); } catch (e) { patladi = e.message; }
  T.dogru("tek kayıtla çökmüyor", patladi === null, patladi);
  T.dogru("net trend grafiği çizildi", _grafikler.some(g =>
    (g.data.datasets || []).some(d => d.label === "TYT Net")), true);
})();

// ────────────────────────────────────────────────────────────
T.grup("2.2  Asiri veri yuklemesi");

function olcSure(etiket, fn) {
  const t0 = Date.now();
  let patladi = null;
  try { fn(); } catch (e) { patladi = e.message; }
  const sure = Date.now() - t0;
  T.dogru(etiket + " çökmüyor", patladi === null, patladi);
  return sure;
}

(function () {
  // 500 deneme kaydi
  const G = 86400000, simdi = Date.now();
  const cok = [];
  for (let i = 0; i < 500; i++) {
    cok.push(kayit({
      label: "D" + i,
      correct: 10 + (i % 25), incorrect: i % 12, blank: i % 7,
      time: 30 + (i % 90),
      subject: ["Matematik", "Türkçe", "Fizik", "Kimya", "Biyoloji"][i % 5],
      ts: simdi - (500 - i) * (G / 2),
      examType: i % 3 === 0 ? "AYT" : "TYT"
    }));
  }
  kur({ chartData: cok });
  const sure = olcSure("500 deneme kaydıyla renderCharts", () => app.renderCharts());
  T.dogru("500 kayıt 3 saniyenin altında işleniyor", sure < 3000, sure + " ms");
  print("      ölçüm: " + sure + " ms");

  const net = _grafikler.filter(g => (g.data.datasets || []).some(d => d.label === "TYT Net"))[0];
  T.dogru("net grafiği tüm kayıtları içeriyor", net && net.data.labels.length === 500,
          net ? net.data.labels.length : "yok");
})();

(function () {
  // 1000+ saat pomodoro verisi (2000 kayit x ~30 dk)
  const G = 86400000, simdi = Date.now();
  const seanslar = [];
  for (let i = 0; i < 2000; i++) {
    seanslar.push({ ts: simdi - (2000 - i) * (G / 4), dakika: 30, gun: 1 + (i % 300), tamamlandi: true });
  }
  kur({ pomodoroKayitlari: seanslar,
        chartData: [kayit({ correct: 10, incorrect: 2, ts: simdi })] });
  const toplamSaat = seanslar.reduce((a, s) => a + s.dakika, 0) / 60;
  T.dogru("test verisi 1000 saat veya üzeri", toplamSaat >= 1000, Math.round(toplamSaat) + " saat");

  const sure = olcSure("2000 pomodoro kaydıyla istikrar grafiği",
                       () => app.renderGunlukIstikrarGrafigi(app.state.chartData));
  T.dogru("2000 seans 2 saniyenin altında işleniyor", sure < 2000, sure + " ms");
  print("      ölçüm: " + sure + " ms");

  const g = _grafikler.filter(x => (x.data.datasets || []).some(d => d.label === "Çalışma (saat)"))[0];
  T.dogru("günlük grafik çubuk sayısı sınırlı (≤400)", g && g.data.labels.length <= 400,
          g ? g.data.labels.length : "yok");
})();

(function () {
  // 302 gunluk tam program + 500 kayit birlikte
  kur();
  app.applyLevelTargets(1600, 58000, 115);
  const sure = olcSure("302 günlük program üretimi", () => app.generateWeeklyCalendarData());
  T.dogru("program üretimi 5 saniyenin altında", sure < 5000, sure + " ms");
  print("      ölçüm: " + sure + " ms");
  T.esit("tüm günler üretildi", Object.keys(app.state.daysData).length, app.PROGRAM_DAYS);
})();

// ────────────────────────────────────────────────────────────
T.grup("2.3  Hatali veri girisleri");

(function () {
  // Negatif netler KASITLI olarak destekleniyor (YKS'de bolum neti
  // negatif olabilir); cokmemeli.
  kur({ chartData: [kayit({ correct: 0, incorrect: 40, blank: 0, ts: Date.now() })] });
  let patladi = null;
  try { app.renderCharts(); app.renderDashboardSummary(); } catch (e) { patladi = e.message; }
  T.dogru("tamamen yanlış çözülmüş denemede çökmüyor", patladi === null, patladi);
  T.esit("net -10 olarak gösteriliyor", document.getElementById("sumLastNet").textContent, "-10");
})();

(function () {
  // Absurt degerler
  kur({ chartData: [
    kayit({ correct: 99999, incorrect: 0, ts: Date.now() }),
    kayit({ correct: 0, incorrect: 0, blank: 99999, ts: Date.now() }),
    kayit({ correct: 10, incorrect: 2, time: -500, ts: Date.now() })
  ]});
  let patladi = null;
  try { app.renderCharts(); } catch (e) { patladi = e.message; }
  T.dogru("aşırı/negatif değerlerde çökmüyor", patladi === null, patladi);
  const g = _grafikler.filter(x => (x.data.datasets || []).some(d => d.label === "Çalışma (saat)"))[0];
  if (g) {
    T.dogru("grafik değerlerinde NaN yok",
            g.data.datasets[0].data.every(v => typeof v === "number" && !isNaN(v)), true);
  }
})();

(function () {
  // 24 saatten uzun TEKIL kayit
  kur({ chartData: [kayit({ correct: 10, incorrect: 2, time: 30 * 60, ts: Date.now() })] });  // 30 saat
  let patladi = null;
  try { app.renderGunlukIstikrarGrafigi(app.state.chartData); } catch (e) { patladi = e.message; }
  T.dogru("30 saatlik tek kayıtta çökmüyor", patladi === null, patladi);
  const g = _grafikler.filter(x => (x.data.datasets || []).some(d => d.label === "Çalışma (saat)"))[0];
  const enBuyuk = g ? Math.max.apply(null, g.data.datasets[0].data) : 0;
  T.dogru("günlük toplam 24 saatten fazla görünüyor (bilinen sınır)", enBuyuk > 24, enBuyuk + " saat");
  T.dogru("girişte 24 saat uyarısı var (kaynak denetimi)",
          readFile("app.js").indexOf("24 saati aşıyor") !== -1, true);
})();

(function () {
  // Ders bazli soru sayisi siniri: TYT Turkce 40 sorudur.
  // Uygulamada BOYLE BIR SINIR YOK — 200'e kadar her sey kabul edilir.
  const src = readFile("index.html");
  const dersBazliSinir = /TYT_SORU|dersSoruLimiti|maxSoruSayisi/.test(readFile("app.js"));
  T.dogru("BULGU: ders bazlı soru sayısı sınırı tanımlı değil", !dersBazliSinir,
          "sınır bulundu (beklenmiyordu)");
  T.dogru("giriş alanı üst sınırı 200", src.indexOf('id="testScoreCorrect" min="0" max="200"') !== -1, true);
})();

(function () {
  // Bozuk kayit: eksik alanlar
  kur({ chartData: [
    { label: "eksik" },                                    // hemen hemen bos
    { correct: 5 },                                        // ts, subject yok
    kayit({ correct: 10, incorrect: 2, ts: Date.now() })
  ]});
  let patladi = null;
  try { app.renderCharts(); app.renderDashboardSummary(); } catch (e) { patladi = e.message; }
  T.dogru("eksik alanlı kayıtlarda çökmüyor", patladi === null, patladi);
})();

// ────────────────────────────────────────────────────────────
T.grup("2.4  Depolama: kota, bozuk kayit, es zamanli yazma");

(function () {
  // Kota dolarsa SafeStorage bellege duser.
  const eskiSet = window.localStorage.setItem;
  window.localStorage.setItem = function () { const e = new Error("QuotaExceededError"); e.name = "QuotaExceededError"; throw e; };
  SafeStorage.storageAvailable = null;

  let patladi = null;
  try { SafeStorage.setItem("test_kota", "veri"); } catch (e) { patladi = e.message; }
  window.localStorage.setItem = eskiSet;
  SafeStorage.storageAvailable = null;

  T.dogru("kota dolunca çökmüyor", patladi === null, patladi);
  T.esit("bellek deposuna düşüyor", SafeStorage.memoryStore["test_kota"], "veri");
  T.dogru("BULGU: bellek deposu kalıcı değil — sayfa yenilenince kayıp", true, true);
})();

(function () {
  // Bozuk JSON kaydi
  SafeStorage.setItem("slamdunk_yks_state", "{bu gecerli json degil");
  let patladi = null, sonuc = null;
  try { sonuc = JSON.parse(SafeStorage.getItem("slamdunk_yks_state")); }
  catch (e) { patladi = e.message; }
  T.dogru("bozuk JSON parse hatası veriyor (yakalanmalı)", patladi !== null, "hata vermedi");
  T.dogru("uygulama kodu JSON.parse'ı try içinde kullanıyor",
          /try\s*{[^}]*JSON\.parse\(/.test(readFile("app.js").replace(/\n/g, " ")), true);
  SafeStorage.removeItem("slamdunk_yks_state");
})();

(function () {
  // Es zamanli yazma: iki "sekme" ayni anahtara yazar.
  // localStorage'da SON YAZAN kazanir; birlestirme YOKTUR.
  SafeStorage.setItem("es_zamanli", JSON.stringify({ sekme: "A", veri: [1, 2, 3] }));
  SafeStorage.setItem("es_zamanli", JSON.stringify({ sekme: "B", veri: [4, 5] }));
  const son = JSON.parse(SafeStorage.getItem("es_zamanli"));
  T.esit("son yazan kazanıyor", son.sekme, "B");
  T.dogru("BULGU: iki sekme açıksa birinin verisi sessizce kaybolur", son.veri.length === 2, son.veri);
  SafeStorage.removeItem("es_zamanli");
})();

(function () {
  // Pomodoro kayit sayisi kota icin sinirli
  kur();
  for (let i = 0; i < 2100; i++) app.state.pomodoroKayitlari.push({ ts: Date.now(), dakika: 1, gun: 1 });
  app.pomodoroSeansKaydet(5, true);
  T.dogru("pomodoro kayıtları 2000 ile sınırlı", app.state.pomodoroKayitlari.length <= 2000,
          app.state.pomodoroKayitlari.length);
})();

T.ozet();
