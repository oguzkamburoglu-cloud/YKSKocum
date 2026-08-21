// ============================================================
// GRUP 5 — Taslak ekrani siralama
// Regresyon: gun ici ASAGI tasima calismiyordu (taslakTasi
// "hedefin onune birak" mantigi yuzunden no-op oluyordu) ve
// surukle-birak mobilde HIC calismiyordu (HTML5 drag olaylari).
// ============================================================
load("test/harness.js");
const app = appYukle();

function kur(gunler) {
  elemanlariTemizle();
  elemanEkle("importDraftBody");
  elemanEkle("importDraftIntro");
  app.state = {
    track: "Sayısal", examFocus: "both", startDate: "2026-08-21",
    isGraduate: false, wakeTime: "08:00", sleepTime: "23:00",
    weekdayHours: 4, weekendHours: 6
  };
  app._programDaysCache = null;
  app._taslak = { gunler: JSON.parse(JSON.stringify(gunler)), kaynak: "ses" };
}

const G = () => Object.keys(app._taslak ? app._taslak.gunler : {})
  .map(Number).sort((a, b) => a - b)
  .map(k => k + ":[" + app._taslak.gunler[k].map(t => t.subject).join(",") + "]")
  .join(" ");

const gorev = (ad) => ({ subject: ad, topic: ad, label: ad, duration: "45 dk", qCount: 20 });
const UC_BIR = {
  1: [gorev("A"), gorev("B"), gorev("C")],
  2: [gorev("D")]
};

T.grup("5.1  Gun ici siralama — her iki yon");

(function () {
  kur(UC_BIR); app.taslakGorevKaydir(1, 0, 1);
  T.esit("ilk görev bir aşağı", G(), "1:[B,A,C] 2:[D]");
})();
(function () {
  kur(UC_BIR); app.taslakGorevKaydir(1, 1, 1);
  T.esit("ortadaki görev bir aşağı", G(), "1:[A,C,B] 2:[D]");
})();
(function () {
  kur(UC_BIR); app.taslakGorevKaydir(1, 2, -1);
  T.esit("son görev bir yukarı", G(), "1:[A,C,B] 2:[D]");
})();
(function () {
  kur(UC_BIR); app.taslakGorevKaydir(1, 1, -1);
  T.esit("ortadaki görev bir yukarı", G(), "1:[B,A,C] 2:[D]");
})();

T.grup("5.2  Gun sinirlari");

(function () {
  kur(UC_BIR); app.taslakGorevKaydir(1, 0, -1);
  T.esit("ilk günün ilk görevi yukarı → değişmez", G(), "1:[A,B,C] 2:[D]");
})();
(function () {
  kur(UC_BIR); app.taslakGorevKaydir(2, 0, 1);
  T.esit("son günün son görevi aşağı → değişmez", G(), "1:[A,B,C] 2:[D]");
})();
(function () {
  kur(UC_BIR); app.taslakGorevKaydir(1, 2, 1);
  T.esit("gün sonundan aşağı → sonraki günün başına", G(), "1:[A,B] 2:[C,D]");
})();
(function () {
  kur(UC_BIR); app.taslakGorevKaydir(2, 0, -1);
  T.esit("gün başından yukarı → önceki günün sonuna (gün boşalır)", G(), "1:[A,B,C,D]");
})();

T.grup("5.3  Surukle-birak semantigi (taslakTasi)");

(function () {
  kur(UC_BIR); app.taslakTasi({ gun: 1, idx: 2 }, { gun: 1, idx: 0 });
  T.esit("C'yi A'nın üstüne bırak", G(), "1:[C,A,B] 2:[D]");
})();
(function () {
  kur(UC_BIR); app.taslakTasi({ gun: 1, idx: 0 }, { gun: 2, idx: 0 });
  T.esit("A'yı 2. güne taşı", G(), "1:[B,C] 2:[A,D]");
})();
(function () {
  kur(UC_BIR); app.taslakTasi({ gun: 1, idx: 0 }, { gun: 1, idx: 0 });
  T.esit("kendi yerine bırak → değişmez", G(), "1:[A,B,C] 2:[D]");
})();
(function () {
  kur(UC_BIR); app.taslakTasi({ gun: 9, idx: 0 }, { gun: 1, idx: 0 });
  T.esit("olmayan günden taşıma → değişmez", G(), "1:[A,B,C] 2:[D]");
})();

T.grup("5.4  Mobil destegi — kaynak denetimi");

(function () {
  const src = readFile("app.js");
  // HTML5 drag olaylari mobil tarayicilarda tetiklenmez.
  T.esit("taslakta HTML5 'dragstart' dinleyicisi kalmadı",
         (src.match(/addEventListener\("dragstart"/g) || []).length, 0);
  T.dogru("pointerdown kullanılıyor", src.indexOf('addEventListener("pointerdown"') !== -1, true);
  T.dogru("tutamaçta touch-action:none var", /touch-action:\s*none/.test(src), true);
  T.dogru("klavye için ok düğmeleri var", src.indexOf('aria-label="Yukarı taşı"') !== -1, true);
  T.dogru("setPointerCapture ile kayıp hareket önleniyor", src.indexOf("setPointerCapture") !== -1, true);
})();

// ============================================================
// 5.5  ONAY AKISI
// Regresyon: "Onayla ve Programa Ekle" dendiginde uygulama
// plannerCreateNewProgramFromScratch() cagirip "Kendi Programimi
// Olustur" ekranini aciyordu. Kullanici programini zaten sesle
// olusturmusken ayni is bir kez daha soruluyordu; ustelik tampona
// AI standart plani kopyalandigi icin okunan gunler baska bir
// planin icine karisiyor ve "Programi Kaydet"e basilmadikca
// hicbir sey kaydedilmiyordu.
// ============================================================
T.grup("5.5  Onay akisi — planlayici acilmamali");

(function () {
  kur(UC_BIR);
  elemanEkle("importFollowUpBody");
  elemanEkle("importFollowUpSummary");
  app.state.savedPrograms = [];
  app.state.standardDaysData = { 1: { completed: false, tasks: [gorev("AI-1"), gorev("AI-2")] } };
  app.state.activeCustomProgramId = null;
  app.state.selectedProgramType = "standard";

  const acilan = [];
  app.openModal = function (id) { acilan.push(id); };
  app.closeModal = function () {};
  app.showToast = function () {};
  ["renderDashboard", "renderTodayPanel", "renderDetailedMonthlyCalendar", "renderCurriculumMap",
   "updateHeaderStats", "saveState", "switchTab", "syncCustomProgramListSelector",
   "syncProgramTypeUI", "calculateFocusScore", "renderMonthlyCalendarGrid",
   "plannerSelectDay", "plannerUpdateDaySelectDates", "scheduleWeeklyRenewalReminder"]
    .forEach(ad => { app[ad] = function () {}; });

  app.confirmImportDraft();

  T.dogru("planlayici (customProgramPlannerModal) acilmadi",
          acilan.indexOf("customProgramPlannerModal") === -1, true);
  T.dogru("isPlanning acik kalmadi", app.isPlanning === false, true);

  const tamponGunler = Object.keys(app.plannerBuffer || {})
    .filter(k => app.plannerBuffer[k].tasks.length > 0).map(Number).sort((a, b) => a - b);
  T.esit("tampona yalnizca okunan gunler yazildi", tamponGunler.join(","), "1,2");
  T.dogru("AI standart plani tampona karismadi",
          JSON.stringify(app.plannerBuffer).indexOf("AI-1") === -1, true);
})();

(function () {
  // Sorular yanitlanmadan da program kaydedilmeli ("Simdilik gec").
  kur(UC_BIR);
  app.state.savedPrograms = [];
  app.state.standardDaysData = {};
  app.openModal = function () {};
  app.closeModal = function () {};
  app.showToast = function () {};
  app.confirmImportDraft();
  app._sonAktarim = { importedDays: [1, 2], taskCount: 4 };
  app.importFollowUpSkip();

  T.esit("program kaydedildi", (app.state.savedPrograms || []).length, 1);
  T.esit("aktif program tipi", app.state.selectedProgramType, "custom");
  T.dogru("aktif program kimligi atandi",
          app.state.activeCustomProgramId === app.state.savedPrograms[0].id, true);
  const kayitli = app.state.savedPrograms[0].daysData;
  T.esit("1. gun gorev sayisi", kayitli[1].tasks.length, 3);
  T.dogru("1. gunun saat akisi kuruldu", (kayitli[1].schedule || []).length > 0, true);
  T.dogru("tampon serbest birakildi", app.plannerBuffer === null, true);
  T.dogru("aktarim modu kapandi", app._aktarimModu === false, true);
})();

T.ozet();
