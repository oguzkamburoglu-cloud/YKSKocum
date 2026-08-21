// ============================================================
// MASTER TEST PLANI — ASAMA 1
// Is Mantigi ve Hesaplama Dogrulugu
//   1.1 Net hesaplama ve sinir degerler
//   1.2 Zaman, gun sayaci (streak) ve saat dilimi
//   1.3 Konu yetisme tahmini algoritmasi
// ============================================================
load("test/harness.js");
const app = appYukle();

function kur(gecenGun, ek) {
  elemanlariTemizle();
  const bas = new Date();
  bas.setDate(bas.getDate() - (gecenGun || 0));
  app.state = Object.assign({
    track: "Sayısal", examFocus: "both", level: 5,
    startDate: bas.toLocaleDateString("sv-SE"),
    activeDay: 1, daysData: {}, chartData: [], topicStatuses: {},
    streak: 0, isGraduate: false, wakeTime: "08:00", sleepTime: "23:00",
    weekdayHours: 4, weekendHours: 6, subscriptionTier: "pro"
  }, ek || {});
  app._programDaysCache = null;
  return app.state;
}

// ────────────────────────────────────────────────────────────
T.grup("1.1  Net hesaplama — kusurat ve sinir degerler");

// YKS kurali: net = dogru - yanlis/4. Netler CEYREKLIK adimlarla gelir.
[
  [17, 7, 15.25],   // musteri ornegi
  [13, 3, 12.25],
  [10, 1,  9.75],
  [20, 2, 19.5 ],
  [40, 4, 39   ],
  [ 0, 0,  0   ],
  [ 0, 4, -1   ],   // hic dogru yok, negatif net
  [ 1, 7, -0.75],
  [40, 0, 40   ],   // tam dogru
  [ 0, 40, -10 ],   // tam yanlis
].forEach(([d, y, beklenen]) => {
  T.esit(d + " doğru, " + y + " yanlış = " + beklenen + " net", app.netHesapla(d, y), beklenen);
});

(function () {
  // Bos birakilan ders: hic soru cozulmemis
  T.esit("tamamen boş bırakılan ders = 0 net", app.netHesapla(0, 0), 0);
  // Bozuk girdi
  T.esit("undefined girdi", app.netHesapla(undefined, undefined), 0);
  T.esit("null girdi", app.netHesapla(null, null), 0);
  T.esit("metin girdi", app.netHesapla("17", "7"), 15.25);
  T.esit("NaN girdi", app.netHesapla(NaN, NaN), 0);
  T.esit("negatif doğru", app.netHesapla(-5, 3), -5.75);
  // Ceyreklik hassasiyet korunuyor mu?
  T.dogru("sonuç 2 ondalığa yuvarlanıyor",
          String(app.netHesapla(17, 7)).split(".")[1].length <= 2, app.netHesapla(17, 7));
})();

(function () {
  // Kayan nokta birikimi: 100 kayidin neti tek tek toplandiginda
  // 0.1+0.2 gibi hatalar birikmemeli.
  let toplam = 0;
  for (let i = 0; i < 100; i++) toplam += app.netHesapla(17, 7);   // 100 x 15.25
  T.yakinEsit("100 kaydın net toplamı", Math.round(toplam * 100) / 100, 1525, 0.01);
})();

T.grup("1.2  Gun sayaci (streak) ve zaman");

(function () {
  // REGRESYON: seri, ogrencinin BAKTIGI gune gore degisiyordu.
  kur(2);   // bugun 3. gun
  [1, 2, 3].forEach(d => app.state.daysData[d] = { completed: true, tasks: [{ completed: true }] });

  const seri = (bakilan) => { app.state.activeDay = bakilan; app.calculateStreak(); return app.state.streak; };
  const a = seri(1), b = seri(3), c = seri(50);
  T.dogru("seri, bakılan güne göre değişmiyor", a === b && b === c, a + "/" + b + "/" + c);
  T.esit("seri bugünden geriye sayıyor", a, 3);
})();

(function () {
  kur(4);   // bugun 5. gun
  [1, 2, 3].forEach(d => app.state.daysData[d] = { completed: true, tasks: [{ completed: true }] });
  app.state.daysData[4] = { completed: false, tasks: [{ completed: false }] };
  app.state.daysData[5] = { completed: true, tasks: [{ completed: true }] };
  app.calculateStreak();
  T.esit("arada kaçırılan gün seriyi kırıyor", app.state.streak, 1);
})();

(function () {
  kur(3);   // bugun 4. gun
  [1, 2, 3].forEach(d => app.state.daysData[d] = { completed: true, tasks: [{ completed: true }] });
  // bugun henuz tamamlanmadi
  app.state.daysData[4] = { completed: false, tasks: [{ completed: false }] };
  app.calculateStreak();
  T.esit("bugün tamamlanmamışsa dünkü seri korunur", app.state.streak, 3);
})();

(function () {
  kur(0);   // ilk gun
  app.calculateStreak();
  T.esit("hiç görev tamamlanmamışken seri 0", app.state.streak, 0);
})();

(function () {
  // Gun numarasi TAKVIM tarihinden turuyor; gece yarisi gecisi
  // otomatik olarak dogru gunu verir.
  kur(0);
  const bugun = app.bugunkuProgramGunu();
  kur(1);
  const yarin = app.bugunkuProgramGunu();
  T.esit("bir gün geçince program günü 1 artıyor", yarin - bugun, 1);
})();

(function () {
  // REGRESYON: "bugun"un tarihi UTC'den aliniyordu.
  // new Date().toISOString().split("T")[0] Turkiye'de (UTC+3) gece
  // 00:00-03:00 arasinda DUNUN tarihini veriyordu. Gece 01:00'de kayit
  // olan ogrencinin program baslangici bir gun geri kayiyordu.
  const simdi = new Date();
  const yerelBeklenen = simdi.getFullYear() + "-" +
    String(simdi.getMonth() + 1).padStart(2, "0") + "-" +
    String(simdi.getDate()).padStart(2, "0");
  T.esit("yerelTarih() yerel günü veriyor", app.yerelTarih(), yerelBeklenen);
  T.dogru("UTC'ye göre kaymıyor",
          app.yerelTarih() === yerelBeklenen, "UTC: " + simdi.toISOString().split("T")[0]);

  // Gece yarisindan hemen sonra bile dogru olmali
  const gece = new Date(); gece.setHours(0, 30, 0, 0);
  const geceBeklenen = gece.getFullYear() + "-" +
    String(gece.getMonth() + 1).padStart(2, "0") + "-" +
    String(gece.getDate()).padStart(2, "0");
  T.esit("00:30'da doğru gün", app.yerelTarih(gece), geceBeklenen);

  // Gecersiz tarih
  T.esit("geçersiz tarihte boş dönüyor", app.yerelTarih(new Date("olmayan")), "");

  // Kaynak denetimi: tarih icin toISOString kalmamali
  const src = readFile("app.js");
  T.esit("kaynakta 'toISOString().split(\"T\")[0]' kalmadı",
         (src.match(/toISOString\(\)\.split\("T"\)\[0\]/g) || []).length, 0);
})();

(function () {
  // Saat dilimi / yaz saati: gun farki tam sayi kalmali.
  // 30 Mart 2025 Turkiye'de saat degisimi yok ama test yine de
  // yerel saate bagimliligi olcer.
  const kirilan = [];
  for (let g = 0; g <= 400; g += 7) {
    kur(g);
    const d = app.bugunkuProgramGunu();
    if (!Number.isInteger(d) || d < 1) kirilan.push(g + " gün önce -> " + d);
  }
  T.esit("400 güne kadar program günü hep geçerli tam sayı", kirilan.length, 0);
  if (kirilan.length) print("      " + kirilan.slice(0, 3).join(", "));
})();

(function () {
  // Gelecek tarihli baslangic (kullanici ileri tarih girdi)
  kur(-10);   // baslangic 10 gun SONRA
  const d = app.bugunkuProgramGunu();
  T.dogru("gelecek tarihli başlangıçta gün 1'in altına düşmüyor", d >= 1, d);
})();

T.grup("1.2b  Pomodoro — duvar saati ve kayit");

function pomoKur() {
  kur(0);
  ["sidebarPomoTimer", "miniPomoTimer", "sidebarPomoBtn"].forEach(elemanEkle);
  elemanEkle("sidebarPomoMinutes").value = "25";
  app.state.pomodoroKayitlari = [];
  app.saveState = function () {};
  app.playPomoAlarmSound = function () {};
  app.renderDashboardSummary = function () {};
  app.resetSidebarPomo();
}

(function () {
  // REGRESYON: zamanlayici TIK sayiyordu. Tarayici arka plandaki
  // sekmede setInterval'i kistiginda 25 dakikalik seans gercek zamanda
  // cok daha uzun suruyordu. Artik duvar saatinden hesaplaniyor.
  pomoKur();
  T.esit("başlangıç 25 dk", app.sidebarPomoRemainingSeconds, 1500);

  app.toggleSidebarPomo();
  T.dogru("çalışıyor", app.sidebarPomoIsRunning, true);
  T.dogru("bitiş zaman damgası kuruldu", typeof app.sidebarPomoBitisTs === "number", app.sidebarPomoBitisTs);

  // Arka plan: hic tik gelmedi ama 10 dakika gecti
  app.sidebarPomoBitisTs = Date.now() + (25 * 60 - 600) * 1000;
  T.yakinEsit("hiç tik gelmeden 10 dk sonra kalan süre doğru", app.pomoKalanSaniye(), 900, 3);

  // Cihaz uyudu: bitis ani gecti
  app.sidebarPomoBitisTs = Date.now() - 5000;
  T.esit("bitiş geçmişse kalan 0", app.pomoKalanSaniye(), 0);
  T.dogru("kalan süre negatife düşmüyor", app.pomoKalanSaniye() >= 0, true);
})();

(function () {
  // REGRESYON: seans hicbir yere kaydedilmiyordu; "pomodoro verisi"
  // diye bir sey yoktu ve calisma suresi analizine katkisi sifirdi.
  pomoKur();
  T.dogru("pomodoroSeansKaydet var", typeof app.pomodoroSeansKaydet === "function", true);
  app.pomodoroSeansKaydet(25, true);
  app.pomodoroSeansKaydet(12, false);
  T.esit("iki seans kaydedildi", app.state.pomodoroKayitlari.length, 2);
  T.esit("bugünkü toplam pomodoro dakikası", app.pomodoroDakikasi(app.bugunkuProgramGunu()), 37);
  T.dogru("kayıtta zaman damgası var", !!app.state.pomodoroKayitlari[0].ts, true);
  T.dogru("tamamlanma durumu kaydediliyor",
          app.state.pomodoroKayitlari[0].tamamlandi === true &&
          app.state.pomodoroKayitlari[1].tamamlandi === false, true);
  T.esit("başka güne ait dakika 0", app.pomodoroDakikasi(999), 0);
})();

(function () {
  // localStorage kotasi dolmasin: kayit sayisi sinirli
  pomoKur();
  for (let i = 0; i < 2100; i++) app.state.pomodoroKayitlari.push({ ts: Date.now(), dakika: 1, gun: 1 });
  app.pomodoroSeansKaydet(5, true);
  T.dogru("kayıt sayısı 2000 ile sınırlı", app.state.pomodoroKayitlari.length <= 2000,
          app.state.pomodoroKayitlari.length);
})();

(function () {
  // Duraklatinca gecen sure kaydedilmeli
  pomoKur();
  app.toggleSidebarPomo();                                  // baslat
  app.sidebarPomoBitisTs = Date.now() + (25 * 60 - 300) * 1000;  // 5 dk gecti
  app.toggleSidebarPomo();                                  // durdur
  T.dogru("duraklatınca geçen süre kaydedildi", app.state.pomodoroKayitlari.length === 1,
          app.state.pomodoroKayitlari.length);
  if (app.state.pomodoroKayitlari.length) {
    T.yakinEsit("kaydedilen süre ~5 dk", app.state.pomodoroKayitlari[0].dakika, 5, 1);
  }
  T.dogru("durdurunca çalışmıyor", !app.sidebarPomoIsRunning, true);
})();

T.grup("1.3  Konu yetisme tahmini algoritmasi");

(function () {
  // Yetersiz gecmis: uydurma tahmin verilmemeli
  kur(3);
  const hepsi = app.curriculum.topicsFor("Sayısal", "both");
  hepsi.slice(0, 40).forEach(t => app.state.topicStatuses[t.subject + " - " + t.name] = { status: "Ogrenildi" });
  const t = app.mufredatYetismeTahmini();
  T.dogru("14 günden kısa geçmişte tahmin verilmiyor", t && t.yetersizVeri === true, t);
  T.dogru("uydurma bitiş tarihi yok", !t.bitisMetni, t && t.bitisMetni);
})();

(function () {
  // Yeterli gecmis: hiz = biten / gecen gun
  kur(60);
  const hepsi = app.curriculum.topicsFor("Sayısal", "both");
  const biten = 60;
  hepsi.slice(0, biten).forEach(t => app.state.topicStatuses[t.subject + " - " + t.name] = { status: "Ogrenildi" });
  const t = app.mufredatYetismeTahmini();

  T.esit("biten konu sayısı", t.biten, biten);
  T.esit("toplam konu sayısı", t.toplam, hepsi.length);
  T.esit("yüzde = round(biten/toplam*100)", t.yuzde, Math.round(biten / hepsi.length * 100));

  const bugun = app.bugunkuProgramGunu();
  const beklenenHiz = Math.round((biten / bugun) * 7 * 10) / 10;
  T.yakinEsit("haftalık hız = (biten/geçen gün)*7", t.hiz, beklenenHiz, 0.15);

  const kalanKonu = hepsi.length - biten;
  const gerekenGun = Math.ceil(kalanKonu / (biten / bugun));
  T.esit("gereken gün = kalan konu / günlük hız", t.gerekenGun, gerekenGun);
  T.esit("yetişiyor mu = gereken <= kalan", t.yetisiyor, gerekenGun <= t.kalanGun);
})();

(function () {
  // Hic konu bitmemis: tahmin yok
  kur(60);
  app.state.topicStatuses = {};
  T.esit("hiç konu bitmemişken tahmin null", app.mufredatYetismeTahmini(), null);
})();

(function () {
  // Tum konular bitmis: kalan 0, gereken gun 0
  kur(60);
  const hepsi = app.curriculum.topicsFor("Sayısal", "both");
  hepsi.forEach(t => app.state.topicStatuses[t.subject + " - " + t.name] = { status: "Ogrenildi" });
  const t = app.mufredatYetismeTahmini();
  T.esit("tüm konular bitmiş → %100", t.yuzde, 100);
  T.esit("gereken gün 0", t.gerekenGun, 0);
  T.dogru("yetişiyor", t.yetisiyor, true);
})();

(function () {
  // Sinav gecmisse kalan gun negatife dusmemeli
  kur(60);
  const eski = app.getExamDate;
  app.getExamDate = function () { const d = new Date(); d.setDate(d.getDate() - 5); return d; };
  const hepsi = app.curriculum.topicsFor("Sayısal", "both");
  hepsi.slice(0, 30).forEach(t => app.state.topicStatuses[t.subject + " - " + t.name] = { status: "Ogrenildi" });
  const t = app.mufredatYetismeTahmini();
  app.getExamDate = eski;
  T.dogru("sınav geçmişse kalan gün negatif değil", t && t.kalanGun >= 0, t && t.kalanGun);
})();

T.grup("1.X  Kapasite-hedef kiyasi yalnizca AI programinda");

(function () {
  app.state = { startDate: "2026-08-21", totalHoursTarget: 1700, level: 7,
    weekdayHours: 4, weekendHours: 6, wakeTime: "08:00", sleepTime: "23:00",
    isGraduate: false, schoolStatus: "none",
    selectedProgramType: "custom", uretilenToplamSaat: 1283 };
  app._programDaysCache = null;
  T.esit("kendi programinda kiyas gosterilmiyor", app.kapasiteHedefKarsilastir(), null);

  app.state.selectedProgramType = "standard";
  const k = app.kapasiteHedefKarsilastir();
  T.dogru("AI programinda kiyas calisiyor", k !== null && typeof k.yeterli === "boolean", true);
})();

T.ozet();