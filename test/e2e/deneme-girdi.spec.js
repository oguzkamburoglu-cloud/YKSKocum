// ============================================================
// 4.7  Deneme girdi sinir denetimi (Katman A / BULGU A1)
// Native max=200 kaba ustsiniri zaten yakalar; asil eklenen denetim
// TESTIN KENDI soru sayisini asma: 40 soruluk teste 50 dogru native'i
// gecer ama capraz-alan denetimi reddeder (uyari cikar, kayit yazilmaz).
// ============================================================
const { test, expect } = require("@playwright/test");

test("hedefi asan deneme girdisi reddediliyor", async ({ page }) => {
  await page.goto("http://localhost:8791/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("http://localhost:8791/");

  const r = await page.evaluate(() => {
    app.state.subscriptionTier = "pro";
    app.state.selectedProgramType = "custom";
    app.state.daysData = { 1: { completed: false, tasks: [
      { id: "q1", subject: "Matematik", topic: "Limit", type: "quiz", qCount: 40, completed: false, logged: false }
    ]}};
    app._pendingCompleteDay = 1;
    app._pendingCompleteIdx = 0;
    const yaz = (id, v) => { const e = document.getElementById(id); if (e) e.value = String(v); };
    yaz("testScoreCorrect", 50);   // 40 soruluk teste 50 dogru (native max=200'u gecer)
    yaz("testScoreWrong", 0);
    yaz("testScoreTime", 30);

    let uyarildi = false;
    const eskiAlert = window.alert;
    window.alert = () => { uyarildi = true; };
    app.submitTestScore();
    window.alert = eskiAlert;

    return { uyarildi, kaydedildi: !!app.state.daysData[1].tasks[0].logged,
             correct: app.state.daysData[1].tasks[0].correct };
  });
  expect(r.uyarildi).toBe(true);       // uyari cikti
  expect(r.kaydedildi).toBe(false);    // kayit yazilmadi
  expect(r.correct).toBeUndefined();   // task.correct atanmadi
});

test("gecerli deneme girdisi kabul ediliyor", async ({ page }) => {
  await page.goto("http://localhost:8791/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("http://localhost:8791/");
  const r = await page.evaluate(() => {
    app.state.subscriptionTier = "pro";
    app.state.selectedProgramType = "custom";
    app.state.daysData = { 1: { completed: false, tasks: [
      { id: "q1", subject: "Matematik", topic: "Limit", type: "quiz", qCount: 40, completed: false, logged: false }
    ]}};
    app._pendingCompleteDay = 1; app._pendingCompleteIdx = 0;
    const yaz = (id, v) => { const e = document.getElementById(id); if (e) e.value = String(v); };
    yaz("testScoreCorrect", 30); yaz("testScoreWrong", 8); yaz("testScoreTime", 45);
    window.alert = () => {};
    app.submitTestScore();
    const t = app.state.daysData[1].tasks[0];
    return { logged: t.logged, correct: t.correct, incorrect: t.incorrect,
             net: app.netHesapla(t.correct, t.incorrect) };
  });
  expect(r.logged).toBe(true);
  expect(r.correct).toBe(30);
  expect(r.net).toBeCloseTo(28, 2);   // 30 - 8/4 = 28
});
