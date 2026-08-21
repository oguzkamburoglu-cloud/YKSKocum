// ============================================================
// GRUP 2 — Gorsellestirme Verisi ve Edge Case
//   2.1 Sifir veri  2.2 Uc degerler  2.3 Filtreleme
// ============================================================
load("test/harness.js");
const app = appYukle();

const GUN = 86400000;

function kurulum(state) {
  elemanlariTemizle();
  _grafikler.length = 0;
  ["accuracyTrendChart","aiCoachCommentaryCardContainer","balanceRadarChart","balanceRecommendation","chartExamTypeFilter","chartRangeFilter","chartsContentArea","chartsEmptyState","dailyStudyChart","netTrendChart","netsLineChart","speedLineChart","insightCards","sectionAnalysisCard","habitWeeklyReviewText","habitWeeklyReviewCard",
   "sumTodayTime","sumTodayTimeSub","sumProgress","sumProgressSub","sumLastNet","sumLastNetSub"]
    .forEach(elemanEkle);
  elemanEkle("chartRangeFilter").value = "all";
  const f = elemanEkle("chartExamTypeFilter"); f.value = "all"; f.dataset.initialized = "true";
  app.state = Object.assign({
    track: "Sayısal", examFocus: "both", chartData: [], daysData: {},
    topicStatuses: {}, startDate: "2026-06-22", activeDay: 1, isGraduate: false,
    wakeTime: "08:00", sleepTime: "23:00", uploadedQuestions: []
  }, state || {});
  return app.state;
}

function kayit(o) {
  const c = o.correct || 0, y = o.incorrect || 0, b = o.blank || 0;
  return { label: o.label || "K", correct: c, incorrect: y, blank: b,
    total: c + y + b, cozulen: c + y, time: o.time !== undefined ? o.time : 60,
    subject: o.subject || "Matematik", topic: o.topic || "", hour: 14,
    ts: o.ts, dayNum: o.dayNum || 1, examType: o.examType || "TYT" };
}
// Grafigi veri seti ETIKETIYLE tam eslesme uzerinden bulur.
// Gevsek arama "Net" gibi bir parcayla yanlis grafigi (Hedef vs Mevcut
// Net cubuk grafigi) yakaliyordu.
function grafikBulEtiket(tamEtiket) {
  return _grafikler.filter(g =>
    (g.data && g.data.datasets || []).some(d => d.label === tamEtiket))[0];
}

// ────────────────────────────────────────────────────────────
T.grup("2.1  Sifir veri — cokme yok, bos durum gosteriliyor");

(function () {
  kurulum({ chartData: [] });
  let patladi = null;
  try { app.renderCharts(); } catch (e) { patladi = e.message; }
  T.dogru("veri yokken renderCharts çökmüyor", patladi === null, patladi);
  T.esit("içerik alanı gizli", document.getElementById("chartsContentArea").style.display, "none");
  T.esit("boş durum görünür", document.getElementById("chartsEmptyState").style.display, "block");
  T.esit("hiç grafik çizilmedi", _grafikler.length, 0);
})();

(function () {
  kurulum({ chartData: [] });
  let patladi = null;
  try { app.renderDashboardSummary(); } catch (e) { patladi = e.message; }
  T.dogru("veri yokken özet kartları çökmüyor", patladi === null, patladi);
  T.esit("son deneme neti '—'", document.getElementById("sumLastNet").textContent, "—");
  T.esit("son deneme alt metni", document.getElementById("sumLastNetSub").innerHTML, "henüz kayıt yok");
  T.esit("bugünkü çalışma 0 dk", document.getElementById("sumTodayTime").textContent, "0 dk");
  T.esit("toplam ilerleme %0", document.getElementById("sumProgress").textContent, "%0");
})();

(function () {
  kurulum({ chartData: [] });
  let patladi = null;
  try { app.renderInsightCards([]); } catch (e) { patladi = e.message; }
  T.dogru("boş kayıtla analiz kartları çökmüyor", patladi === null, patladi);
  const ic = document.getElementById("insightCards").innerHTML;
  // Calisma verisine BAGLI hicbir kart cikmamali. Mufredat ilerlemesi
  // deneme kaydina bagli olmadigi icin gorunebilir; bu kasitli.
  T.dogru("boş/yanlış kartı yok", ic.indexOf("Boş mu Bırakıyorsun") === -1, true);
  T.dogru("verim kartı yok", ic.indexOf("Karşılığını Veriyor") === -1, true);
  T.dogru("haftalık karne yok", ic.indexOf("Haftalık Karnen") === -1, true);
  T.dogru("hata ısı haritası yok", ic.indexOf("En Çok Net Kaçırdığın") === -1, true);
})();

(function () {
  kurulum({ topicStatuses: {} });
  const t = app.mufredatYetismeTahmini();
  T.dogru("hiç konu bitmemişken tahmin null", t === null, t);
})();

// ────────────────────────────────────────────────────────────
T.grup("2.2  Uc degerler");

(function () {
  // Gunde 25 saat calisma iddiasi (1500 dk) — takvimde imkansiz
  kurulum({ chartData: [kayit({ time: 1500, correct: 10, incorrect: 2, ts: Date.now() })] });
  let patladi = null;
  try { app.renderCharts(); } catch (e) { patladi = e.message; }
  T.dogru("25 saatlik kayıtta çökmüyor", patladi === null, patladi);
  const g = grafikBulEtiket("Çalışma (saat)");
  const saat = g ? g.data.datasets[0].data[0] : null;
  T.esit("grafikte 25 saat olarak görünüyor", saat, 25);
  // Veri BILEREK kirpilmiyor (ogrencinin kaydi onundur); bunun yerine
  // girisde uyari verilir. Uyari mantigi submitTestScore icinde.
  T.dogru("imkansız günlük toplam için uyarı mantığı var",
          readFile("app.js").indexOf("24 saati aşıyor") !== -1, true);
})();

(function () {
  // Negatif ve absurt girdiler
  kurulum({ chartData: [
    kayit({ correct: -5, incorrect: 3, ts: Date.now() }),
    kayit({ correct: 10, incorrect: -2, ts: Date.now() }),
    kayit({ correct: 10, incorrect: 2, time: -30, ts: Date.now() })
  ]});
  let patladi = null;
  try { app.renderCharts(); app.renderDashboardSummary(); } catch (e) { patladi = e.message; }
  T.dogru("negatif girdilerde çökmüyor", patladi === null, patladi);
  T.esit("netHesapla(-5, 3) = -5.75", app.netHesapla(-5, 3), -5.75);
  const gun = grafikBulEtiket("Çalışma (saat)");
  const toplamSaat = gun ? gun.data.datasets[0].data.reduce((a,b)=>a+b,0) : null;
  T.dogru("negatif süre toplam çalışmayı azaltmıyor", toplamSaat >= 0,
          "toplam " + toplamSaat + " saat");
})();

(function () {
  // Bos sayisi cozulen sorudan buyuk (tutarsiz kayit)
  kurulum({ chartData: [kayit({ correct: 2, incorrect: 1, blank: 500, ts: Date.now() })] });
  let patladi = null;
  try { app.renderInsightCards(app.state.chartData); } catch (e) { patladi = e.message; }
  T.dogru("aşırı boş sayısında çökmüyor", patladi === null, patladi);
  const html = document.getElementById("insightCards").innerHTML;
  T.dogru("boş oranı %100'ü aşmıyor", !/%1[0-9][0-9]|%[2-9][0-9][0-9]/.test(html),
          (html.match(/%\d+/g) || []).join(" "));
})();

(function () {
  // Cok uzun zaman araligi — gunluk grafik sinirsiz buyumemeli
  const simdi = Date.now();
  kurulum({ chartData: [
    kayit({ ts: simdi - 3 * 365 * GUN, subject: "Matematik" }),
    kayit({ ts: simdi, subject: "Matematik" })
  ]});
  let patladi = null;
  try { app.renderCharts(); } catch (e) { patladi = e.message; }
  T.dogru("3 yıllık aralıkta çökmüyor", patladi === null, patladi);
  const g = grafikBulEtiket("Çalışma (saat)");
  const barSayisi = g ? g.data.labels.length : 0;
  T.dogru("günlük grafik makul sayıda çubukla sınırlı", barSayisi <= 400,
          barSayisi + " çubuk");
})();

(function () {
  // Sinav havuzu istenen sayidan kucuk
  const havuz = [{id:"a",topic:"K1",year:2024},{id:"b",topic:"K2",year:2023}];
  const s = app.karistirilmisSinavSorulari(havuz, 25);
  T.esit("havuz 2 iken 2 soru dönüyor (kopya üretmiyor)", s.length, 2);
  const idler = s.map(q => q.id);
  T.esit("kopya yok", new Set(idler).size, idler.length);
  T.esit("boş havuzda boş dizi", app.karistirilmisSinavSorulari([], 25).length, 0);
  T.esit("null havuzda boş dizi", app.karistirilmisSinavSorulari(null, 25).length, 0);
})();

// ────────────────────────────────────────────────────────────
T.grup("2.3  Filtreleme — Son 7 / 30 gun / Tum zamanlar");

(function () {
  const simdi = Date.now();
  const veri = [
    kayit({ label: "3 gun once",  ts: simdi - 3 * GUN,  subject: "Matematik" }),
    kayit({ label: "10 gun once", ts: simdi - 10 * GUN, subject: "Fizik" }),
    kayit({ label: "40 gun once", ts: simdi - 40 * GUN, subject: "Kimya" }),
    kayit({ label: "eski kayit",  ts: undefined,        subject: "Tarih" })   // ts yok
  ];

  const olc = (aralik) => {
    kurulum({ chartData: veri });
    document.getElementById("chartRangeFilter").value = aralik;
    app.renderCharts();
    const g = grafikBulEtiket("TYT Net");
    return g ? g.data.labels.slice() : [];
  };

  const y7 = olc("7");
  T.dogru("Son 7 gün: 3 günlük kayıt var", y7.indexOf("3 gun once") !== -1, y7);
  T.dogru("Son 7 gün: 10 günlük kayıt YOK", y7.indexOf("10 gun once") === -1, y7);
  T.dogru("Son 7 gün: 40 günlük kayıt YOK", y7.indexOf("40 gun once") === -1, y7);
  T.dogru("Son 7 gün: zaman damgasız eski kayıt korunuyor",
          y7.indexOf("eski kayit") !== -1, y7);

  const y30 = olc("30");
  T.dogru("Son 30 gün: 10 günlük kayıt var", y30.indexOf("10 gun once") !== -1, y30);
  T.dogru("Son 30 gün: 40 günlük kayıt YOK", y30.indexOf("40 gun once") === -1, y30);

  const hepsi = olc("all");
  T.esit("Tüm zamanlar: 4 kaydın hepsi", hepsi.length, 4);
})();

(function () {
  // Secilen donemde hic kayit yoksa bos durum gosterilmeli
  const simdi = Date.now();
  kurulum({ chartData: [kayit({ ts: simdi - 100 * GUN })] });
  document.getElementById("chartRangeFilter").value = "7";
  let patladi = null;
  try { app.renderCharts(); } catch (e) { patladi = e.message; }
  T.dogru("boş dönemde çökmüyor", patladi === null, patladi);
  T.esit("boş dönemde içerik gizli", document.getElementById("chartsContentArea").style.display, "none");
  T.esit("boş dönemde boş durum görünür", document.getElementById("chartsEmptyState").style.display, "block");
})();

(function () {
  // TYT / AYT / YDT ayrimi
  const simdi = Date.now();
  kurulum({ chartData: [
    kayit({ label: "tyt", ts: simdi, examType: "TYT" }),
    kayit({ label: "ayt", ts: simdi, examType: "AYT" }),
    kayit({ label: "ydt", ts: simdi, examType: "YDT", subject: "İngilizce" })
  ]});
  app.renderCharts();
  const g = grafikBulEtiket("TYT Net");
  const seriler = g ? g.data.datasets.map(d => d.label) : [];
  T.dogru("TYT serisi var", seriler.indexOf("TYT Net") !== -1, seriler);
  T.dogru("AYT serisi var", seriler.indexOf("AYT Net") !== -1, seriler);
  T.dogru("YDT (Dil) serisi var", seriler.indexOf("YDT Net") !== -1, seriler);
})();

T.ozet();
