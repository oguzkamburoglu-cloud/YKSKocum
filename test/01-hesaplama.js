// ============================================================
// GRUP 1 — Veri Hesaplama ve Matematiksel Dogruluk
// Kosum:  jsc test/01-hesaplama.js   (calistir.sh ile)
// ============================================================
load("test/harness.js");
const app = appYukle();

// Ortak kurulum: analiz kartlarinin yazildigi kap
function kurulum(state) {
  elemanlariTemizle();
  elemanEkle("insightCards");
  elemanEkle("chartRangeFilter").value = "all";
  elemanEkle("chartExamTypeFilter").value = "all";
  ["sumTodayTime","sumTodayTimeSub","sumProgress","sumProgressSub","sumLastNet","sumLastNetSub"]
    .forEach(elemanEkle);
  app.state = Object.assign({
    track: "Sayısal", examFocus: "both", chartData: [], daysData: {},
    topicStatuses: {}, startDate: "2026-06-22", activeDay: 1, isGraduate: false,
    wakeTime: "08:00", sleepTime: "23:00", weekdayCapacity: 4, weekendCapacity: 6
  }, state || {});
  return app.state;
}

function kayit(o) {
  const c = o.correct || 0, y = o.incorrect || 0, b = o.blank || 0;
  return Object.assign({
    label: o.label || "K", correct: c, incorrect: y, blank: b,
    total: c + y + b, cozulen: c + y, time: o.time || 60,
    subject: o.subject || "Matematik", topic: o.topic || "",
    hour: 14, ts: o.ts !== undefined ? o.ts : Date.now(),
    dayNum: o.dayNum || 1, examType: o.examType || "TYT"
  }, {});
}

// Kartlardan metin cikarmak icin: renderInsightCards innerHTML yazar
function kartMetni() {
  return (document.getElementById("insightCards").innerHTML || "");
}

// ────────────────────────────────────────────────────────────
T.grup("1.1  Net hesabi — kusuratli durumlar (D − Y/4)");

// Musteri ornegi: 13 dogru, 3 yanlis = 12.25
(function () {
  kurulum({ chartData: [kayit({ correct: 13, incorrect: 3, blank: 4, subject: "Matematik" })] });
  app.renderDashboardSummary();
  const g = document.getElementById("sumLastNet").textContent;
  T.esit("13D 3Y → 12.25 net (özet kartı)", g, "12.25");
})();

// Ceyreklik kusuratlarin hepsi
(function () {
  const durumlar = [
    { d: 13, y: 3, net: 12.25 }, { d: 20, y: 2, net: 19.5 },
    { d: 10, y: 1, net: 9.75 },  { d: 40, y: 4, net: 39 },
    { d: 0,  y: 4, net: -1 },    { d: 1,  y: 7, net: -0.75 }
  ];
  durumlar.forEach(function (x) {
    kurulum({ chartData: [kayit({ correct: x.d, incorrect: x.y })] });
    app.renderDashboardSummary();
    const g = parseFloat(document.getElementById("sumLastNet").textContent);
    T.esit(x.d + "D " + x.y + "Y → " + x.net, g, x.net);
  });
})();

// ────────────────────────────────────────────────────────────
T.grup("1.2  Net tanimi tutarliligi (negatif net kirpiliyor mu?)");

(function () {
  // Verim karti karsilastirma yaptigi icin en az 2 ders ister.
  const veri = [
    kayit({ correct: 30, incorrect: 4, subject: "Türkçe", time: 60 }),
    kayit({ correct: 2, incorrect: 20, blank: 0, subject: "Fizik", time: 60 })
  ];
  kurulum({ chartData: veri });

  app.renderDashboardSummary();                       // son kayit = Fizik
  const ozetNet = parseFloat(document.getElementById("sumLastNet").textContent);

  app.renderInsightCards(veri);
  const html = kartMetni();
  const m = html.match(/Fizik<\/strong>\s*<span[^>]*>[^<]*?·\s*(-?[0-9.]+)\s*net/);
  const verimNet = m ? parseFloat(m[1]) : null;

  T.esit("özet kartı neti (2D 20Y)", ozetNet, -3);
  T.esit("verim kartı neti (2D 20Y)", verimNet, -3);
  T.dogru("iki kart aynı net değerini gösteriyor", ozetNet === verimNet,
          "ozet=" + ozetNet + " verim=" + verimNet);
})();

// Uygulamanin BASKA yerlerindeki net tanimiyla karsilastir
(function () {
  // Tek net tanimi: app.netHesapla. Negatifi kirpmamali, 2 ondalik olmali.
  T.dogru("netHesapla fonksiyonu var", typeof app.netHesapla === "function", typeof app.netHesapla);
  T.esit("netHesapla(2, 20) negatifi kırpmıyor", app.netHesapla(2, 20), -3);
  T.esit("netHesapla(13, 3) çeyreği koruyor", app.netHesapla(13, 3), 12.25);
  T.esit("netHesapla(0, 0)", app.netHesapla(0, 0), 0);
  T.esit("netHesapla(undefined, undefined) → 0", app.netHesapla(undefined, undefined), 0);
  T.esit("netHesapla('13', '3') metin girdide de doğru", app.netHesapla("13", "3"), 12.25);
  T.esit("netHesapla(NaN, 4) → -1", app.netHesapla(NaN, 4), -1);

  // Kaynakta net baglaminda kirpma kalmamis olmali (regresyon korumasi)
  const src = readFile("app.js");
  const kirpanlar = (src.match(/Math\.max\(0,\s*\w+\s*-\s*\w+\s*\/\s*4\)/g) || []);
  T.esit("kaynakta 'Math.max(0, D - Y/4)' kalıbı kalmadı", kirpanlar.length, 0);
})();

// ────────────────────────────────────────────────────────────
T.grup("1.3  Zaman / Net verimlilik orani");

(function () {
  const veri = [
    kayit({ subject: "Fizik",  correct: 8,  incorrect: 4, time: 600 }),  // 10 sa → 7 net
    kayit({ subject: "Kimya",  correct: 22, incorrect: 8, time: 300 })   // 5 sa → 20 net
  ];
  kurulum({ chartData: veri });
  app.renderInsightCards(veri);
  const html = kartMetni();

  // Fizik: net = 8 - 1 = 7 ; saat = 10 ; 0.7 net/saat
  // Kimya: net = 22 - 2 = 20 ; saat = 5 ; 4 net/saat
  T.dogru("Fizik 0.7 net/saat", html.indexOf("0.7 net/saat") !== -1, html.indexOf("0.7") !== -1);
  T.dogru("Kimya 4 net/saat", html.indexOf("4 net/saat") !== -1, true);
  T.dogru("verimsiz ders uyarısı Fizik'i işaret ediyor",
          /Fizik dersine ayırdığın süre karşılığını vermiyor/.test(html), true);
})();

// Sifir sure — bolme hatasi olmamali
(function () {
  const veri = [kayit({ subject: "Tarih", correct: 10, incorrect: 0, time: 0 })];
  kurulum({ chartData: veri });
  let patladi = false;
  try { app.renderInsightCards(veri); } catch (e) { patladi = true; }
  T.dogru("süre 0 iken çökmüyor", !patladi, "istisna atıldı");
})();

// ────────────────────────────────────────────────────────────
T.grup("1.4  Konu bitirme yuzdesi — sifira bolme ve bos veri");

(function () {
  kurulum({ topicStatuses: {} });
  const ozet = app.mufredatDersOzeti();
  T.dogru("hiç konu bitmemişken özet null dönmüyor", ozet !== null, ozet);
  if (ozet) {
    T.esit("biten konu 0", ozet.biten, 0);
    T.dogru("toplam konu > 0", ozet.toplam > 0, ozet.toplam);
    const hepsiSifir = ozet.liste.every(function (x) { return x.yuzde === 0; });
    T.dogru("tüm dersler %0", hepsiSifir, true);
    const nanVar = ozet.liste.some(function (x) { return isNaN(x.yuzde); });
    T.dogru("hiçbir yüzde NaN değil", !nanVar, "NaN üretildi");
  }
})();

(function () {
  // Gecersiz alan: subjectKeysFor BILINCLI olarak "Sayısal"a duser
  // (kodda acikca `|| g.trackSubjects["Sayısal"]`). Beklenen davranis
  // cokmek degil, varsayilan mufredatla devam etmektir.
  kurulum({ track: "OlmayanAlan", topicStatuses: {} });
  let patladi = false, ozet = null;
  try { ozet = app.mufredatDersOzeti(); } catch (e) { patladi = true; }
  T.dogru("geçersiz alanda çökmüyor", !patladi, "istisna atıldı");
  T.dogru("geçersiz alanda varsayılan müfredata düşüyor", ozet !== null && ozet.toplam > 0, ozet);
})();

(function () {
  // Yuzde yuvarlama: 1/3 -> %33
  kurulum({});
  const hepsi = app.curriculum.topicsFor("Sayısal", "both");
  const durum = {};
  const mat = hepsi.filter(function (t) { return t.subject === "Matematik" && t.exam === "TYT"; });
  const ucteBir = Math.floor(mat.length / 3);
  mat.slice(0, ucteBir).forEach(function (t) { durum[t.subject + " - " + t.name] = { status: "Ogrenildi" }; });
  app.state.topicStatuses = durum;
  const ozet = app.mufredatDersOzeti();
  const satir = ozet.liste.filter(function (x) { return /Matematik/.test(x.ders); })[0];
  T.esit("Matematik biten sayısı", satir.biten, ucteBir);
  T.esit("yüzde = round(biten/toplam*100)", satir.yuzde, Math.round(ucteBir / mat.length * 100));
})();

T.ozet();
