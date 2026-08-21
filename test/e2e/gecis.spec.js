const { test, expect } = require("@playwright/test");

test("eski onaysiz program yuklemede temizleniyor", async ({ page }) => {
  await page.goto("http://localhost:8791/");
  // Eski surumun biraktigi kayit: program dolu ama programAccepted yok
  await page.evaluate(() => {
    const gunler = {};
    for (let d = 1; d <= 30; d++) gunler[d] = { completed: false, tasks: [
      { id: "eski_" + d, subject: "Matematik", topic: "Limit", label: "Matematik", duration: "45 dk", completed: false }
    ]};
    localStorage.setItem("slamdunk_yks_state", JSON.stringify({
      name: "Eski Kullanıcı", email: "e@o.com", subscriptionTier: "trial",
      trialStartDate: new Date().toISOString(), selectedProgramType: "standard",
      daysData: gunler, standardDaysData: gunler,
      notifications: [{ id: 1, title: "Geciken görev", body: "Matematik: Limit", read: false }],
      startDate: "2026-06-01"
    }));
  });
  await page.goto("http://localhost:8791/");
  const r = await page.evaluate(() => {
    const g = app.state.daysData || {};
    return {
      doluGun: Object.keys(g).filter(k => g[k] && g[k].tasks && g[k].tasks.length > 0).length,
      bildirim: (app.state.notifications || []).length,
      kabul: app.state.programAccepted
    };
  });
  expect(r.doluGun).toBe(0);
  expect(r.bildirim).toBe(0);
  expect(r.kabul).toBe(false);
});

test("kabul edilmis program yuklemede korunuyor", async ({ page }) => {
  await page.goto("http://localhost:8791/");
  await page.evaluate(() => {
    const gunler = {};
    for (let d = 1; d <= 300; d++) gunler[d] = { completed: false, tasks: [
      { id: "math_routine_" + d, subject: "Matematik", topic: "Limit", label: "Matematik", duration: "45 dk", completed: false }
    ]};
    localStorage.setItem("slamdunk_yks_state", JSON.stringify({
      name: "Kabul Etmiş", email: "k@o.com", subscriptionTier: "trial",
      trialStartDate: new Date().toISOString(), selectedProgramType: "standard",
      programAccepted: true, daysData: gunler, standardDaysData: gunler,
      startDate: "2026-08-01"
    }));
  });
  await page.goto("http://localhost:8791/");
  const dolu = await page.evaluate(() => {
    const g = app.state.daysData || {};
    return Object.keys(g).filter(k => g[k] && g[k].tasks && g[k].tasks.length > 0).length;
  });
  expect(dolu).toBeGreaterThan(0);
});

test("yeniden kayitta eski kabul damgasi program uretmiyor", async ({ page }) => {
  await page.goto("http://localhost:8791/");
  // Ayni cihazda daha once kabul edilmis bir program var
  await page.evaluate(() => {
    localStorage.setItem("slamdunk_yks_state", JSON.stringify({
      name: "Önceki Kullanıcı", email: "o@o.com", subscriptionTier: "trial",
      trialStartDate: new Date().toISOString(), selectedProgramType: "standard",
      programAccepted: true, daysData: {}, standardDaysData: {},
      startDate: "2026-07-01", level: 8
    }));
  });
  await page.goto("http://localhost:8791/");
  const r = await page.evaluate(() => {
    // Yeni kayit: hicbir sey secmeden sihirbazdan gecip iceri gir
    app.startAsStudent();
    const yaz = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    yaz("studentName", "Yeni Kayıt"); yaz("studentEmail", "y@o.com"); yaz("targetRank", "5000");
    app.wizardGo(3); app.updateGoalPlanPreview(); app.wizardGo(4);
    yaz("weekdayCapacity", "4"); yaz("weekendCapacity", "6");
    app.checkHabitsFeedback(false);
    app.wizardNext();
    app.state.diagnosticAccuracy = null;
    app.state.currentPositionSource = "skipped";
    app.state.testSkipped = true;
    app.upgradeToPro("trial");
    app.startMainDashboard();
    const g = app.state.daysData || {};
    return {
      kabul: app.state.programAccepted,
      doluGun: Object.keys(g).filter(k => g[k] && g[k].tasks && g[k].tasks.length > 0).length,
      bildirim: (app.state.notifications || []).length
    };
  });
  expect(r.kabul).toBe(false);
  expect(r.doluGun).toBe(0);     // hicbir sey secmeden program DOLU GELMEMELI
  expect(r.bildirim).toBe(0);    // brifing bildirimi de olmamali
});
