// ============================================================
// MOCK VERI — gercekci, DETERMINISTIK bir ogrenci senaryosu
// Testler arasinda paylasilir. Rastgelelik yoktur: ayni girdi
// her kosumda ayni ciktiyi vermeli.
// ============================================================
const GUN = 86400000;

// Sabit referans an: testler "bugun"e gore degil bu ana gore kurulur.
// (Gercek Date.now() kullanilsaydi gece yarisini gecen kosumlarda
//  "son 7 gun" sinirlari kayar, testler ara sira kalirdi.)
const SIMDI = Date.now();

function mockKayit(gunOnce, ders, dogru, yanlis, bos, dakika, tur) {
  return {
    label: `G${60 - gunOnce} - ${ders}`,
    correct: dogru, incorrect: yanlis, blank: bos,
    total: dogru + yanlis + bos, cozulen: dogru + yanlis,
    time: dakika, subject: ders, topic: "", hour: 15,
    ts: SIMDI - gunOnce * GUN, dayNum: 60 - gunOnce,
    examType: tur || "TYT"
  };
}

// Senaryo: 8 haftalik gecmis.
//  - Matematik : cok YANLIS yapiyor (sallama egilimi)
//  - Tarih     : cok BOS birakiyor (konu eksigi)
//  - Fizik     : cok zaman harciyor, az net aliyor (verimsiz)
//  - Türkçe    : dengeli ve verimli
//  - Son hafta : Türkçe'de belirgin gelisme
function mockKayitlar() {
  const k = [];
  for (let i = 0; i < 6; i++) k.push(mockKayit(45 - i * 7, "Matematik", 22, 14, 4, 60, "TYT"));
  for (let i = 0; i < 5; i++) k.push(mockKayit(44 - i * 8, "Tarih", 10, 3, 27, 45, "TYT"));
  for (let i = 0; i < 5; i++) k.push(mockKayit(43 - i * 8, "Fizik", 8, 6, 6, 180, "AYT"));
  // Türkçe: gecen hafta 20 net, bu hafta 30 net -> +10 gelisme
  k.push(mockKayit(10, "Türkçe", 22, 8, 5, 50, "TYT"));   // gecen hafta
  k.push(mockKayit(9,  "Türkçe", 22, 8, 5, 50, "TYT"));
  k.push(mockKayit(3,  "Türkçe", 32, 8, 5, 50, "TYT"));   // bu hafta
  k.push(mockKayit(2,  "Türkçe", 32, 8, 5, 50, "TYT"));
  return k;
}

// Konu bazli kayip: gorev kayitlari (daysData)
function mockGunler() {
  const konular = [
    ["Türev", "Matematik", 9, 3], ["Limit", "Matematik", 5, 2],
    ["Optik", "Fizik", 6, 4], ["Kalıtım", "Biyoloji", 3, 2],
    ["Paragraf", "Türkçe", 2, 1]
  ];
  const g = {};
  konular.forEach((k, i) => {
    g[i + 1] = { completed: true, tasks: [{
      id: "t" + i, label: k[0], subject: k[1], topic: k[0],
      completed: true, logged: true, correct: 20,
      incorrect: k[2], blank: k[3], timeSpent: 45, duration: "45 dk"
    }]};
  });
  return g;
}

// Mufredat: TYT Matematik'in yarisi, TYT Türkçe'nin ceyregi bitmis
function mockKonuDurumlari(app) {
  const hepsi = app.curriculum.topicsFor("Sayısal", "both");
  const durum = {};
  const al = (ders, sinav, oran) => {
    const liste = hepsi.filter(t => t.subject === ders && t.exam === sinav);
    liste.slice(0, Math.floor(liste.length * oran))
         .forEach(t => durum[t.subject + " - " + t.name] = { status: "Ogrenildi" });
    return liste.length;
  };
  const matToplam = al("Matematik", "TYT", 0.5);
  const turToplam = al("Türkçe", "TYT", 0.25);
  return { durum, matToplam, turToplam };
}
