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
  // Salt okunur modda gorev isaretlenemez.
  // REGRESYON: bu denetim yalnizca cagrilmayan toggleTaskCompleted()
  // icinde duruyordu; gercekte kullanilan toggleTodayTaskCompleted()
  // korumasizdi ve suresi dolmus kullanici gorev isaretleyebiliyordu.
  paket("free");
  elemanEkle("coachModalTitle"); elemanEkle("coachModalBody"); elemanEkle("coachModalQuote");
  app.state.daysData = { 1: { completed: false, tasks: [{ id: "t1", subject: "Matematik", topic: "Limit", completed: false }] } };
  app.renderTodayPanel = function () {};
  let patladi = null;
  try { app.toggleTodayTaskCompleted(1, 0); } catch (e) { patladi = e.message; }
  T.dogru("görev işaretleme çökmüyor", patladi === null, patladi);
  T.esit("salt okunur modda görev tamamlanmadı",
         app.state.daysData[1].tasks[0].completed, false);

  // Denemesi suren kullanici isaretleyebilmeli (kilit fazla kisitlamasin)
  paket("pro");
  app.state.daysData = { 1: { completed: false, tasks: [{ id: "t1", subject: "Matematik", topic: "Limit", completed: false }] } };
  app.calculateFocusScore = function () {};
  app.renderDashboard = function () {};
  app.saveState = function () {};
  app.triggerEndDayCheck = function () {};
  app.toggleTodayTaskCompleted(1, 0);
  T.esit("açık pakette görev tamamlanıyor",
         app.state.daysData[1].tasks[0].completed, true);
})();


(function () {
  // Deneme suresi oturum ACIKKEN dolarsa diger yazma yollari da kilitli
  // olmali (giris kapisi bu durumda devreye girmez).
  paket("free");
  elemanEkle("coachModalTitle"); elemanEkle("coachModalBody"); elemanEkle("coachModalQuote");
  elemanEkle("customTaskTopic").value = "Limit";
  elemanEkle("plannerProgName").value = "Deneme Programi";
  app.state.savedPrograms = [];
  app.state.daysData = { 1: { completed: false, tasks: [{ id: "t1", completed: false }] } };
  app.isPlanning = false;

  app.submitCustomTask();
  T.esit("kilitliyken ozel gorev eklenemiyor", app.state.daysData[1].tasks.length, 1);

  app.plannerSaveProgram();
  T.esit("kilitliyken program kaydedilemiyor", app.state.savedPrograms.length, 0);

  app.deleteOutlookTask(1, "t1");
  T.esit("kilitliyken gorev silinemiyor", app.state.daysData[1].tasks.length, 1);

  app.generateAIProgramFromCreator();
  T.esit("kilitliyken AI programi uretilemiyor", app.state.savedPrograms.length, 0);
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
T.grup("6.7  'Sinava kadar' plani ve indirim");

function sinavaKalan(gun) {
  app.getExamDate = function () { const d = new Date(); d.setDate(d.getDate() + gun); return d; };
}
const GERCEK_SINAV = app.getExamDate;

(function () {
  paket("pending");
  app.state.faturaDonemi = "aylik";
  const p = app.PAKETLER.filter(x => x.id === "standart")[0];
  T.esit("aylık tutar", app.paketFiyati(p).tutar, 499);
  T.esit("aylık birim", app.paketFiyati(p).birim, "₺/ay");
})();

(function () {
  // TAM SEZON: musterinin belirledigi fiyatlar
  paket("pending");
  app.state.faturaDonemi = "sinavaKadar";
  sinavaKalan(300);   // ~10 ay
  const beklenen = { baslangic: 1999, standart: 2999, pro: 3999 };
  Object.keys(beklenen).forEach(id => {
    const p = app.PAKETLER.filter(x => x.id === id)[0];
    T.esit("'" + p.ad + "' tam sezon fiyatı", app.paketFiyati(p).tutar, beklenen[id]);
  });
  app.getExamDate = GERCEK_SINAV;
})();

(function () {
  // EN KRITIK KURAL: tek seferlik odeme HICBIR ZAMAN aylik toplamdan
  // pahali olmamali. Sabit fiyatla Ocak'tan sonra alan zarar ediyordu.
  paket("pending");
  app.state.faturaDonemi = "sinavaKadar";
  const pahali = [], azIndirim = [];
  [330, 300, 260, 230, 200, 170, 140, 110, 80, 50, 30, 14, 3, 1].forEach(gun => {
    sinavaKalan(gun);
    app.PAKETLER.forEach(p => {
      const f = app.paketFiyati(p);
      if (f.tutar >= f.aylikToplam) pahali.push(gun + "g " + p.ad + ": " + f.tutar + ">=" + f.aylikToplam);
      if (f.indirimYuzde < 20) azIndirim.push(gun + "g " + p.ad + ": %" + f.indirimYuzde);
    });
  });
  app.getExamDate = GERCEK_SINAV;
  T.esit("hiçbir tarihte aylıktan pahalı değil", pahali.length, 0);
  if (pahali.length) print("      " + pahali.slice(0, 3).join(" | "));
  T.esit("her tarihte en az %20 indirim", azIndirim.length, 0);
  if (azIndirim.length) print("      " + azIndirim.slice(0, 3).join(" | "));
})();

(function () {
  // Fiyat kalan sureyle ORANTILI kisalmali
  paket("pending");
  app.state.faturaDonemi = "sinavaKadar";
  const p = app.PAKETLER.filter(x => x.id === "pro")[0];
  sinavaKalan(300); const uzun = app.paketFiyati(p).tutar;
  sinavaKalan(110); const orta = app.paketFiyati(p).tutar;
  sinavaKalan(50);  const kisa = app.paketFiyati(p).tutar;
  app.getExamDate = GERCEK_SINAV;
  T.dogru("süre kısaldıkça fiyat düşüyor", uzun > orta && orta > kisa, uzun + ">" + orta + ">" + kisa);
})();

(function () {
  // Yuvarlama: tum fiyatlar x99 ile bitmeli
  paket("pending");
  app.state.faturaDonemi = "sinavaKadar";
  const bozuk = [];
  [300, 200, 110, 50, 14].forEach(gun => {
    sinavaKalan(gun);
    app.PAKETLER.forEach(p => {
      const t = app.paketFiyati(p).tutar;
      if (t % 100 !== 99) bozuk.push(gun + "g " + p.ad + ": " + t);
    });
  });
  app.getExamDate = GERCEK_SINAV;
  T.esit("tüm fiyatlar 99 ile bitiyor", bozuk.length, 0);
  if (bozuk.length) print("      " + bozuk.slice(0, 3).join(" | "));
})();

(function () {
  // Plan kimligi kisitlamayi BOZMAMALI
  T.esit("'standart_sinavaKadar' -> 'standart'", app.paketKimligi("standart_sinavaKadar"), "standart");
  T.esit("'pro_sinavaKadar' -> 'pro'", app.paketKimligi("pro_sinavaKadar"), "pro");
  T.esit("son ek yoksa aynen döner", app.paketKimligi("baslangic"), "baslangic");

  paket("standart_sinavaKadar");
  T.dogru("sınava kadar Standart, analizi açıyor", app.ozellikAcikMi("analiz"), true);
  T.dogru("sınava kadar Standart, sesli girişi açmıyor", !app.ozellikAcikMi("sesliGiris"), true);
  paket("pro_sinavaKadar");
  T.dogru("sınava kadar Pro tüm özellikleri açıyor",
          TUM_OZELLIKLER.every(o => app.ozellikAcikMi(o)), true);
})();

(function () {
  paket("pending");
  delete app.state.faturaDonemi;
  T.esit("dönem belirtilmemişse aylık", app.faturaDonemi(), "aylik");
  app.state.faturaDonemi = "saçma";
  T.esit("geçersiz dönem aylığa düşer", app.faturaDonemi(), "aylik");
  app.state.faturaDonemi = "sinavaKadar";
  T.esit("geçerli dönem korunuyor", app.faturaDonemi(), "sinavaKadar");
})();

(function () {
  // Sinav gecmisse kalan ay 1'in altina dusmemeli
  paket("pending");
  sinavaKalan(-30);
  T.dogru("sınav geçmişse kalan ay en az 1", app.sinavaKalanAy() >= 1, app.sinavaKalanAy());
  app.getExamDate = GERCEK_SINAV;
})();

T.ozet();
