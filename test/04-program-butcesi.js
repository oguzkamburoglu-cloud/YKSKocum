// ============================================================
// GRUP 4 — Program ureticisi gunluk butceye uyuyor mu?
// Regresyon korumasi: "program saatlere sigmiyor" uyarisi
// acilista tekrar cikmasin.
// ============================================================
load("test/harness.js");
const app = appYukle();

function programUret(st) {
  elemanlariTemizle();
  app.state = Object.assign({
    track: "Sayısal", examFocus: "both", level: 5, chartData: [], daysData: {},
    standardDaysData: null, topicStatuses: {}, startDate: "2026-08-21",
    activeDay: 1, studyRoute: "balanced", selectedProgramType: "standard",
    programAccepted: true, isGraduate: false,
    weekdayHours: 4, weekendHours: 6, wakeTime: "08:00", sleepTime: "23:00"
  }, st || {});
  app._programDaysCache = null;
  app.applyLevelTargets(1600, 58000, 115);
  app.generateWeeklyCalendarData();
  return app.state.daysData;
}

function olc() {
  const gunler = app.state.daysData;
  let toplamDk = 0, gunSayisi = 0, imkansiz = 0, enAzGorev = 999;
  Object.keys(gunler).forEach(k => {
    const g = gunler[k];
    if (!g || !Array.isArray(g.tasks)) return;
    gunSayisi++;
    if (g.tasks.length < enAzGorev) enAzGorev = g.tasks.length;
    g.tasks.forEach(t => {
      const dk = app.parseDurationMinutes(t.duration) || 0;
      toplamDk += dk;
      // Soru basina 30 saniyeden az sure = uygulanamaz gorev
      if (t.qCount && dk > 0 && (dk / t.qCount) < 0.5) imkansiz++;
    });
  });
  return { toplamDk, gunSayisi, imkansiz, enAzGorev,
           tasanGun: (app._scheduleFitIssues || []).length };
}

const SENARYOLAR = [
  ["okula giden, seviye 5, 4/6 saat", {}],
  ["mezun, seviye 5, 8/8 saat", { isGraduate: true, weekdayHours: 8, weekendHours: 8 }],
  ["okula giden, seviye 3", { level: 3 }],
  ["okula giden, seviye 8 (en ağır)", { level: 8 }],
  ["düşük kapasite, 2/3 saat", { weekdayHours: 2, weekendHours: 3 }],
  ["geç yatan, 08:00–01:00", { sleepTime: "01:00" }],
  ["Eşit Ağırlık alanı", { track: "Eşit Ağırlık" }],
  ["Dil alanı", { track: "Dil" }]
];

T.grup("4.1  Hicbir gun fiziksel pencereyi asmiyor");
SENARYOLAR.forEach(([ad, st]) => {
  programUret(st);
  const m = olc();
  T.esit(ad + " → taşan gün yok", m.tasanGun, 0);
});

T.grup("4.2  Uygulanamaz gorev uretilmiyor");
SENARYOLAR.forEach(([ad, st]) => {
  programUret(st);
  const m = olc();
  T.esit(ad + " → soru başına <30 sn görev yok", m.imkansiz, 0);
});

T.grup("4.3  Gunler bosalmiyor, gunluk butce asilmiyor");
SENARYOLAR.forEach(([ad, st]) => {
  programUret(st);
  const m = olc();
  T.dogru(ad + " → her günde en az 2 görev", m.enAzGorev >= 2, m.enAzGorev);
});

(function () {
  programUret({});
  const gunler = app.state.daysData;
  let asanNormal = 0, asanDeneme = 0, ornek = null;
  Object.keys(gunler).forEach(k => {
    const g = gunler[k];
    if (!g || !Array.isArray(g.tasks)) return;
    const gun = parseInt(k, 10);
    const hg = app.programGunHaftaninGunu(gun);
    const butce = app.gunlukCalismaButcesi(hg);
    const toplam = g.tasks.reduce((a, t) => a + (app.parseDurationMinutes(t.duration) || 0), 0);
    if (toplam <= butce) return;
    // DENEME GUNLERI BILINCLI ISTISNADIR: gercek bir TYT denemesi 165,
    // AYT 180 dakikadir ve KISALTILAMAZ — sinav provasinin anlami budur.
    // Bu gunler beyan edilen gunluk kapasiteyi asabilir; asmamasi gereken
    // fiziksel penceredir ve onu 4.1 test ediyor.
    if (g.isMockDay) { asanDeneme++; return; }
    asanNormal++;
    if (!ornek) ornek = gun + ". gün: " + toplam + " dk > " + butce + " dk";
  });
  T.esit("bütçeyi aşan NORMAL çalışma günü", asanNormal, 0);
  if (asanNormal) print("      örnek: " + ornek);
  T.dogru("deneme günleri bilinçli olarak bütçe üstünde olabilir", asanDeneme >= 0, asanDeneme);
})();

T.grup("4.4  Gunluk butce DOLDURULUYOR (bos kapasite kalmıyor)");

// Regresyon: uretici "day % 7" kullaniyordu, gercek takvim gunu degil.
// Program gunu 2 gercekte Cumartesi olmasina ragmen Sali sayilip hafta
// ici butcesi uygulaniyor, gun 6 gercekte Carsamba iken hafta sonu
// butcesi aliyordu. Ayrica deneme/tekrar gunleri hafta sonuna denk
// gelince ogrencinin EN COK vakti oldugu gunler bos geciyordu.
(function () {
  programUret({});
  const gunler = app.state.daysData;
  const grup = {};
  Object.keys(gunler).forEach(k => {
    const g = gunler[k];
    if (!g || !Array.isArray(g.tasks)) return;
    const gun = parseInt(k, 10);
    const hg = app.programGunHaftaninGunu(gun);
    const dk = g.tasks.reduce((a, t) => a + (app.parseDurationMinutes(t.duration) || 0), 0);
    const e = grup[hg] = grup[hg] || { n: 0, dk: 0, butce: app.gunlukCalismaButcesi(hg) };
    e.n++; e.dk += dk;
  });

  // Hafta sonu gunleri (0 = Pazar, 6 = Cumartesi)
  [0, 6].forEach(hg => {
    const e = grup[hg];
    if (!e) return;
    const doluluk = Math.round((e.dk / e.n) / e.butce * 100);
    T.dogru("hafta sonu (gün " + hg + ") doluluğu ≥ %60", doluluk >= 60, "%" + doluluk);
  });

  // Hafta ici
  [1, 2, 4, 5].forEach(hg => {
    const e = grup[hg];
    if (!e) return;
    const doluluk = Math.round((e.dk / e.n) / e.butce * 100);
    T.dogru("hafta içi (gün " + hg + ") doluluğu ≥ %70", doluluk >= 70, "%" + doluluk);
  });
})();

(function () {
  // Uretici GERCEK takvim gununu kullanmali
  const src = readFile("app.js");
  T.esit("üreticide 'day % 7' kalıbı kalmadı",
         (src.match(/const dayOfWeek = day % 7/g) || []).length, 0);
  T.dogru("programGunHaftaninGunu kullanılıyor",
          src.indexOf("const dayOfWeek = this.programGunHaftaninGunu(day)") !== -1, true);
})();

(function () {
  // Uretilen toplam, hedefin makul bandinda olmali (kapasite izin verdiginde)
  programUret({});
  const m = olc();
  const saat = Math.round(m.toplamDk / 60);
  const hedef = app.state.totalHoursTarget;
  T.dogru("üretilen toplam hedefin %85'inden az değil",
          saat >= hedef * 0.85, saat + " sa / hedef " + hedef);
})();

T.grup("4.5  Haftanin gunu HER YERDE ayni hesaplaniyor");

// Uretici gercek takvim gunune gecirildi ama cizelgeyi yeniden kuran
// yollar (tekrar ekleme, gorev tasima, planlayici kaydi) "gun % 7"
// kullanmaya devam ediyordu. Ayni gun iki farkli haftanin gunu
// sayilinca cizelge yanlis saatte basliyordu: gercek Cumartesi'ye
// hafta ici baslangici (16:00) uygulaniyordu.
(function () {
  const src = readFile("app.js");
  // buildDaySchedule / dailyCapacityMinutes cagrilarinda "% 7" kalmamali
  const kalan = (src.match(/(?:buildDaySchedule|dailyCapacityMinutes)\([^)]*%\s*7/g) || []);
  T.esit("çizelge/kapasite çağrılarında '% 7' kalmadı", kalan.length, 0);
})();

(function () {
  // Uretilen programda her gunun cizelgesi, o gunun GERCEK haftanin
  // gunune gore kurulmus olmali: hafta sonu gunleri sabah baslar.
  programUret({});
  const gunler = app.state.daysData;
  let haftaSonuSabah = 0, haftaSonuToplam = 0, yanlis = null;
  Object.keys(gunler).forEach(k => {
    const g = gunler[k];
    if (!g || !Array.isArray(g.schedule) || g.schedule.length === 0) return;
    const gun = parseInt(k, 10);
    const hg = app.programGunHaftaninGunu(gun);
    if (hg !== 0 && hg !== 6) return;          // yalnizca hafta sonu
    if (g.isMockDay || g.isFinalPhase) return;
    haftaSonuToplam++;
    const ilkSaatli = g.schedule.filter(e => e.startTime)[0];
    if (!ilkSaatli) { haftaSonuSabah++; return; }   // ogun/mola yoksa sayma
    const saat = parseInt(String(ilkSaatli.startTime).split(":")[0], 10);
    if (saat < 16) haftaSonuSabah++;
    else if (!yanlis) yanlis = gun + ". gün (" + ilkSaatli.startTime + ")";
  });
  if (haftaSonuToplam > 0) {
    T.dogru("hafta sonu günleri hafta içi saatiyle başlamıyor",
            haftaSonuSabah === haftaSonuToplam,
            yanlis || (haftaSonuSabah + "/" + haftaSonuToplam));
  }
})();

T.grup("4.6  Seviye hala programi farklilastiriyor");
(function () {
  programUret({ level: 3 }); const sv3 = olc().toplamDk;
  programUret({ level: 8 }); const sv8 = olc().toplamDk;
  T.dogru("seviye 8 programı seviye 3'ten hafif değil", sv8 >= sv3,
          "sv3=" + Math.round(sv3/60) + " sa, sv8=" + Math.round(sv8/60) + " sa");
})();

T.ozet();
