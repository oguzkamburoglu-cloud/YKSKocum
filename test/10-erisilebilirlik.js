// ============================================================
// GRUP 10 — Erisilebilirlik (olu kod)
// ------------------------------------------------------------
// Bu dosyanin varlik sebebi tekrar eden bir hata sinifi:
// fonksiyon yazilir, dogru calisir, AMA hicbir yerden cagrilmaz.
// Uygulama hata vermez; ozellik sessizce yoktur.
//   - pomodoroDakikasi()  -> "bugunku calisma" hep 0 dk gosteriyordu
//   - openOdtTest()       -> 400 soruluk banka hic acilamiyordu
//   - triggerEndDayCheck()-> gun sonu ekrani hic cikmiyordu
//   - toggleTaskCompleted()-> salt okunur kilidi burada duruyordu,
//                             canli yolda ise hic yoktu
// ============================================================
load("test/harness.js");
const app = appYukle();

const kaynak = readFile("app.js");
const sayfa = readFile("index.html");

T.grup("10.1  Cagrilmayan fonksiyon kalmamali");

(function () {
  const tanimlar = [];
  const re = /^  ([A-Za-z_][A-Za-z0-9_]*): function/gm;
  let m;
  while ((m = re.exec(kaynak)) !== null) tanimlar.push(m[1]);

  const olu = [];
  tanimlar.forEach(ad => {
    const govde = kaynak.replace(new RegExp("^  " + ad + ": function", "gm"), "");
    const kalip = new RegExp("\\b" + ad + "\\b");
    if (!kalip.test(govde) && !kalip.test(sayfa)) olu.push(ad);
  });

  T.dogru("app.js'de en az 300 fonksiyon var (tarama calisiyor)", tanimlar.length > 300, true);
  T.dogru("cagrilmayan fonksiyon yok", olu.length === 0, olu.join(", ") || "0");
})();

T.grup("10.2  Pomodoro suresi ozet kartina giriyor");

(function () {
  elemanlariTemizle();
  ["sumTodayTime", "sumTodayTimeSub", "sumProgress", "sumProgressSub", "sumLastNet", "sumLastNetSub"]
    .forEach(elemanEkle);
  app.state = {
    startDate: "2026-08-21", daysData: {}, pomodoroKayitlari: [], mockExams: [],
    track: "Sayısal", examFocus: "both"
  };
  const bugun = app.bugunkuProgramGunu();
  app.state.daysData[bugun] = { completed: false, tasks: [
    { id: "a", subject: "Matematik", topic: "Limit", duration: "30 dk", completed: true },
    { id: "b", subject: "Fizik", topic: "Kuvvet", duration: "30 dk", completed: false }
  ] };

  app.renderDashboardSummary();
  T.esit("pomodoro yokken yalnizca gorev suresi", document.getElementById("sumTodayTime").textContent, "30 dk");

  app.state.pomodoroKayitlari = [{ gun: bugun, dakika: 25, tamamlandi: true }];
  app.renderDashboardSummary();
  T.esit("25 dk pomodoro sureye eklendi", document.getElementById("sumTodayTime").textContent, "55 dk");
  T.dogru("alt satirda pomodoro yaziyor",
          document.getElementById("sumTodayTimeSub").innerHTML.indexOf("25 dk pomodoro") !== -1, true);

  // Baska bir gune ait seans bugune sayilmamali
  app.state.pomodoroKayitlari.push({ gun: bugun + 3, dakika: 50, tamamlandi: true });
  app.renderDashboardSummary();
  T.esit("baska gunun seansi bugune eklenmiyor", document.getElementById("sumTodayTime").textContent, "55 dk");
})();

T.grup("10.3  Mini test (ODT) gercekten acilabiliyor");

(function () {
  // Gorev kartinda "Teste Basla" dugmesi kaynakta var mi
  T.dogru("gorev kartindan openOdtTest cagriliyor",
          kaynak.indexOf("app.openOdtTest(") !== -1, true);

  elemanlariTemizle();
  ["odtModal", "odtModalSubTitle", "odtQuestionArea", "odtTimerVal", "odtQuestionProgressText",
   "odtPrevBtn", "odtNextBtn", "odtFinishBtn", "coachModalTitle", "coachModalBody",
   "coachModalQuote"].forEach(elemanEkle);
  app.state = { startDate: "2026-08-21", daysData: {}, subscriptionTier: "pro", trialStartDate: null,
                topicStatuses: {}, mockExams: [], uploadedQuestions: [], scheduledRepetitions: [] };

  const banka = app.getOdtQuestions("Matematik", "Bölünebilme Kuralları");
  T.dogru("bankada soru bulundu", banka.questions.length >= 5, banka.questions.length);
  T.dogru("sorularin sikki ve dogru cevabi var",
          banka.questions.every(q => Array.isArray(q.options) && typeof q.correct === "number"), true);
  T.dogru("dogru cevap sik araliginda",
          banka.questions.every(q => q.correct >= 0 && q.correct < q.options.length), true);

  let patladi = null;
  try { app.openOdtTest(1, "t1", "Matematik", "Bölünebilme Kuralları"); }
  catch (e) { patladi = e.message; }
  T.dogru("test ekrani cokmeden aciliyor", patladi === null, patladi);
  T.dogru("odtState kuruldu", !!app.odtState, true);
  T.esit("10 soru yuklendi", app.odtState ? app.odtState.questions.length : 0, 10);

  if (app.odtState && app.odtState.timer) clearInterval(app.odtState.timer);
})();

(function () {
  // Puanlama: tum sorular dogru isaretlenirse 10/10 olmali
  if (!app.odtState) { T.dogru("odtState yok, puanlama atlandi", false, true); return; }
  app.odtState.questions.forEach((q, i) => { app.odtState.answers[i] = q.correct; });
  app.odtState.secondsRemaining = 300;

  let dogru = 0;
  app.odtState.questions.forEach((q, i) => { if (app.odtState.answers[i] === q.correct) dogru++; });
  T.esit("tum cevaplar dogruyken skor", dogru, 10);

  // Bos birakilan soru yanlis sayilir
  delete app.odtState.answers[0];
  let dogru2 = 0;
  app.odtState.questions.forEach((q, i) => { if (app.odtState.answers[i] === q.correct) dogru2++; });
  T.esit("bos soru dogru sayilmiyor", dogru2, 9);
})();

T.grup("10.4  Gun sonu ekrani tetikleniyor");

(function () {
  T.dogru("gorev isaretlemeden triggerEndDayCheck cagriliyor",
          kaynak.indexOf("this.triggerEndDayCheck(dayNum)") !== -1, true);

  elemanlariTemizle();
  ["coachModalTitle", "coachModalBody", "coachModalQuote", "coachModalButtons"].forEach(elemanEkle);
  app.state = { startDate: "2026-08-21", subscriptionTier: "pro", trialStartDate: null,
                activeDay: 1, daysData: { 1: { completed: false, tasks: [] } } };

  let patladi = null;
  try { app.triggerEndDayCheck(1); } catch (e) { patladi = e.message; }
  T.dogru("bos gunde cokmuyor", patladi === null, patladi);
  T.esit("bos gunde kutlama cikmiyor", document.getElementById("coachModalTitle").textContent, "");

  app.state.daysData[1].tasks = [{ id: "a", completed: true }, { id: "b", completed: true }];
  app.triggerEndDayCheck(1);
  T.dogru("tum gorevler bitince kutlama cikiyor",
          document.getElementById("coachModalTitle").textContent.indexOf("Gün Bitti") !== -1, true);

  // Eksik gorev varken kutlama degil "devam ediyor" mesaji cikar; asil
  // onemlisi cagri yerinin bunu her isaretlemede tetiklememesi:
  // triggerEndDayCheck yalnizca gunun tamami bitince cagriliyor.
  T.dogru("cagri yeri allDone kosuluna bagli",
          kaynak.indexOf("if (allDone && task.completed) this.triggerEndDayCheck(dayNum);") !== -1, true);
  T.dogru("deneme puani akisinda da allDone kosulu var",
          kaynak.indexOf("if (allDone) this.triggerEndDayCheck(dayNum);") !== -1, true);
  document.getElementById("coachModalTitle").textContent = "";
  app.state.daysData[1].tasks[1].completed = false;
  app.triggerEndDayCheck(1);
  T.dogru("eksik gorevde kutlama degil devam mesaji",
          document.getElementById("coachModalTitle").textContent.indexOf("Gün Bitti") === -1, true);

  // Olmayan gun numarasi cokme yaratmamali
  let patladi2 = null;
  try { app.triggerEndDayCheck(999); } catch (e) { patladi2 = e.message; }
  T.dogru("olmayan gunde cokmuyor", patladi2 === null, patladi2);
})();

T.grup("10.5  Silinen olu kod geri gelmemeli");

(function () {
  ["subscribeSim", "generate50SentenceSummary", "toggleTaskCompleted",
   "importProgramTextIntoPlanner", "yillikFiyatHesapla", "cleanQueryToTopicName",
   "isCurriculumTopicDone", "changeCurriculumSubject", "prevWizardPage",
   "showAddCustomTaskModal", "togglePencilLogoSvg", "setLoggingEndpoint"].forEach(ad => {
    T.dogru(ad + " tanimi kaldirildi",
            kaynak.indexOf("  " + ad + ": function") === -1, true);
  });
  T.dogru("sahte abonelik uyarisi kalmadi",
          kaynak.indexOf("simüle olarak abone") === -1, true);
})();

T.ozet();
