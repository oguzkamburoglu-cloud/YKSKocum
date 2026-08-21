// ============================================================
// GRUP 3 — Mock Data ile Render Dogrulamasi
//   Rapor kartlari ve grafik komponentleri dogru ciziliyor mu?
// ============================================================
load("test/harness.js");
load("test/mock-veri.js");
const app = appYukle();

const GEREKLI_ELEMANLAR = [
  "accuracyTrendChart","aiCoachCommentaryCardContainer","balanceRadarChart",
  "balanceRecommendation","chartExamTypeFilter","chartRangeFilter",
  "chartsContentArea","chartsEmptyState","dailyStudyChart","netTrendChart",
  "netsLineChart","speedLineChart","insightCards","curriculumInsightCards","sectionAnalysisCard",
  "habitWeeklyReviewText","habitWeeklyReviewCard",
  "sumTodayTime","sumTodayTimeSub","sumProgress","sumProgressSub",
  "sumLastNet","sumLastNetSub"
];

function senaryoKur(ek) {
  elemanlariTemizle();
  _grafikler.length = 0;
  GEREKLI_ELEMANLAR.forEach(elemanEkle);
  document.getElementById("chartRangeFilter").value = "all";
  const f = document.getElementById("chartExamTypeFilter");
  f.value = "all"; f.dataset.initialized = "true";

  const mk = mockKonuDurumlari(app);
  const bas = new Date(SIMDI - 60 * GUN);
  app.state = Object.assign({
    track: "Sayısal", examFocus: "both",
    chartData: mockKayitlar(), daysData: mockGunler(),
    topicStatuses: mk.durum,
    startDate: bas.toLocaleDateString("sv-SE"),
    activeDay: 60, isGraduate: false, wakeTime: "08:00", sleepTime: "23:00",
    uploadedQuestions: []
  }, ek || {});
  app._programDaysCache = null;
  return mk;
}

// Kartlar MODULLERE dagitildi: performans kartlari AI Calisma
// Analizi'nde, mufredat kartlari Mufredat Haritasi'nda yasar.
const kartHtml = () =>
  (document.getElementById("insightCards").innerHTML || "") +
  (document.getElementById("curriculumInsightCards").innerHTML || "");
const perfHtml = () => document.getElementById("insightCards").innerHTML || "";
const mufHtml  = () => document.getElementById("curriculumInsightCards").innerHTML || "";
const grafik = (etiket) => _grafikler.filter(g =>
  (g.data && g.data.datasets || []).some(d => d.label === etiket))[0];
// Belirli bir kartin govdesini adiyla ceker
function kart(baslik) {
  const h = kartHtml();
  const i = h.indexOf(baslik);
  if (i === -1) return null;
  const son = h.indexOf('<div class="glass-card"', i);
  return h.substring(i, son === -1 ? h.length : son);
}

// ────────────────────────────────────────────────────────────
T.grup("3.1  Tum analiz kartlari mock veriyle ciziliyor");

(function () {
  senaryoKur();
  let patladi = null;
  try { app.renderCharts(); } catch (e) { patladi = e.message; }
  T.dogru("renderCharts çökmüyor", patladi === null, patladi);

  const beklenen = [
    "Boş mu Bırakıyorsun, Yanlış mı Yapıyorsun?",
    "Harcadığın Zaman Karşılığını Veriyor mu?",
    "Haftalık Karnen",
    "En Çok Net Kaçırdığın Konular",
    "Zamanını Nasıl Bölüştürdün?",
    "Ders Bazlı Müfredat İlerlemen",
    "Müfredatı Sınava Yetiştirebilecek misin?"
  ];
  beklenen.forEach(b => T.dogru("kart var: " + b, kartHtml().indexOf(b) !== -1, false));
  T.esit("performans kart alanı görünür", document.getElementById("insightCards").style.display, "block");
  T.esit("müfredat kart alanı görünür", document.getElementById("curriculumInsightCards").style.display, "block");

  // MODUL AYRIMI: mufredat kartlari performans kabinda OLMAMALI
  T.dogru("müfredat kartları performans modülüne sızmıyor",
          perfHtml().indexOf("Ders Bazlı Müfredat") === -1, true);
  T.dogru("performans kartları müfredat modülüne sızmıyor",
          mufHtml().indexOf("En Çok Net Kaçırdığın") === -1, true);
})();

// ────────────────────────────────────────────────────────────
T.grup("3.2  Kart icerikleri — dogru tani ve renk kodu");

(function () {
  senaryoKur(); app.renderCharts();
  const k = kart("Boş mu Bırakıyorsun");

  // Tarih: 10D 3Y 27B -> bos %67.5 -> "konu eksigi", SARI
  T.dogru("Tarih 'konu eksiği' tanısı alıyor",
          /Tarih[\s\S]{0,400}?konu eksiği/.test(k), k && k.substring(0, 300));
  // Matematik: 22D 14Y 4B -> yanlis %35 -> "dikkat/sallama", KIRMIZI
  T.dogru("Matematik 'hata yapıyorsun' tanısı alıyor",
          /Matematik[\s\S]{0,400}?hata yapıyorsun ya da sallıyorsun/.test(k), true);
  T.dogru("kritik durum kırmızı renkle işaretli", /var\(--danger\)/.test(k), true);
  T.dogru("dikkat durumu sarı renkle işaretli", /var\(--warning\)/.test(k), true);
})();

(function () {
  senaryoKur(); app.renderCharts();
  const k = kart("Harcadığın Zaman");
  // Fizik: 5 kayit x 180 dk = 15 saat, net 5x(8-1.5)=32.5 -> ~2.2 net/saat
  // Türkçe: 4 kayit x 50 dk = 3.33 saat, net 22-2+22-2+32-2+32-2=100 -> ~30 net/saat
  T.dogru("verimsiz ders Fizik olarak işaretleniyor",
          /Fizik dersine ayırdığın süre karşılığını vermiyor/.test(k), true);
  T.dogru("net/saat değerleri yazılıyor", /net\/saat/.test(k), true);
})();

(function () {
  senaryoKur(); app.renderCharts();
  const k = kart("En Çok Net Kaçırdığın");
  T.dogru("ilk sırada Türev var (9Y+3B=12)", k.indexOf("Türev") < k.indexOf("Optik"), k.substring(0,200));
  T.dogru("kaçırılan soru sayısı gösteriliyor", /12 soru/.test(k), true);
  T.dogru("yanlış/boş kırılımı var", /9 yanlış · 3 boş/.test(k), true);
  T.dogru("öncelik cümlesi Türev'i işaret ediyor",
          /Türev<\/strong> konusundan/.test(k), true);
})();

(function () {
  senaryoKur(); app.renderCharts();
  const k = kart("Haftalık Karnen");
  T.dogru("toplam saat yazılıyor", /Bu hafta toplam çalışma/.test(k), true);
  T.dogru("en çok gelişen ders Türkçe", /En çok geliştiğin ders[\s\S]{0,220}?Türkçe/.test(k), k);
  T.dogru("odak konusu Türev", /Odaklanman gereken konu[\s\S]{0,220}?Türev/.test(k), true);
})();

(function () {
  const mk = senaryoKur(); app.renderCharts();
  const k = kart("Ders Bazlı Müfredat");
  const beklenenMat = Math.round(Math.floor(mk.matToplam * 0.5) / mk.matToplam * 100);
  T.dogru("TYT Matematik yüzdesi doğru",
          new RegExp("TYT Matematik[\\s\\S]{0,200}?%" + beklenenMat).test(k),
          "beklenen %" + beklenenMat + " — " + (k || "").substring(0, 260));
  T.dogru("hiç başlanmamış ders %0 gösteriliyor", /%0/.test(k), true);
})();

// ────────────────────────────────────────────────────────────
T.grup("3.3  Grafik komponentleri — veri seti bicimi");

(function () {
  senaryoKur(); app.renderCharts();

  const net = grafik("TYT Net");
  T.dogru("net trend grafiği çizildi", !!net, _grafikler.length);
  if (net) {
    T.esit("net grafiği tipi line", net.config.type, "line");
    const seriler = net.data.datasets.map(d => d.label);
    T.dogru("TYT ve AYT ayrı seri", seriler.indexOf("TYT Net") !== -1 && seriler.indexOf("AYT Net") !== -1, seriler);
    T.esit("etiket sayısı = kayıt sayısı", net.data.labels.length, app.state.chartData.length);
    const tytSeri = net.data.datasets.filter(d => d.label === "TYT Net")[0];
    T.esit("TYT serisi kayıt sayısı kadar nokta", tytSeri.data.length, app.state.chartData.length);
    T.dogru("AYT noktaları TYT serisinde null", tytSeri.data.some(v => v === null), true);
    T.dogru("spanGaps açık (boşluklar çizgiyi kesmiyor)", tytSeri.spanGaps === true, tytSeri.spanGaps);
  }

  const gun = grafik("Çalışma (saat)");
  T.dogru("günlük istikrar grafiği çizildi", !!gun, true);
  if (gun) {
    T.esit("günlük grafik tipi bar", gun.config.type, "bar");
    T.dogru("çalışılmayan günler 0 olarak var", gun.data.datasets[0].data.some(v => v === 0), true);
    T.dogru("sıfır günler soluk renkte",
            gun.data.datasets[0].backgroundColor.some(c => /148,163,184/.test(c)), true);
    T.dogru("tüm değerler sayı", gun.data.datasets[0].data.every(v => typeof v === "number" && !isNaN(v)), true);
  }

  T.dogru("hedef/mevcut net grafiği çizildi", _grafikler.length >= 5, _grafikler.length);
  T.dogru("ders dengesi radar grafiği çizildi",
          _grafikler.some(g => g.config.type === "radar"), true);
})();

// ────────────────────────────────────────────────────────────
T.grup("3.4  Dashboard ozet kartlari");

(function () {
  senaryoKur();
  // Bugunun gorevleri: 2 tamam (45+60 dk), 1 eksik
  const bugun = app.bugunkuProgramGunu();
  app.state.daysData[bugun] = { tasks: [
    { label: "A", completed: true, logged: true, timeSpent: 45, duration: "45 dk" },
    { label: "B", completed: true, logged: true, timeSpent: 60, duration: "60 dk" },
    { label: "C", completed: false, duration: "30 dk" }
  ]};
  app.renderDashboardSummary();

  T.esit("bugünkü çalışma 1 sa 45 dk", document.getElementById("sumTodayTime").textContent, "1 sa 45 dk");
  T.esit("bugün görev oranı", document.getElementById("sumTodayTimeSub").innerHTML, "2/3 görev tamam");

  const sonKayit = app.state.chartData[app.state.chartData.length - 1];
  const beklenenNet = app.netHesapla(sonKayit.correct, sonKayit.incorrect);
  T.esit("son deneme neti", document.getElementById("sumLastNet").textContent, String(beklenenNet));
  T.dogru("son deneme D/Y/B kırılımı",
          /\d+D \d+Y \d+B/.test(document.getElementById("sumLastNetSub").innerHTML),
          document.getElementById("sumLastNetSub").innerHTML);
  T.dogru("toplam ilerleme yüzde biçiminde",
          /^%\d+$/.test(document.getElementById("sumProgress").textContent),
          document.getElementById("sumProgress").textContent);
})();

// ────────────────────────────────────────────────────────────
T.grup("3.5  Belirlenimcilik — ayni girdi ayni cikti");

(function () {
  senaryoKur(); app.renderCharts();
  const ilk = kartHtml();
  senaryoKur(); app.renderCharts();
  const ikinci = kartHtml();
  T.dogru("aynı mock veri iki koşumda aynı kartları üretiyor", ilk === ikinci,
          "çıktı değişti (uzunluk " + ilk.length + " vs " + ikinci.length + ")");
})();

T.ozet();
