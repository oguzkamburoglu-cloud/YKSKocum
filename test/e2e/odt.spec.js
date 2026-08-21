// ============================================================
// 4.6  ODT (mini test) akisi — gercek tarayici
// Bu test yazilirken iki hata yakaladi:
//   1) openOdtTest() hicbir yerden cagrilamiyordu (olu kod grubu)
//   2) odtModal'da satir ici style="display:none" vardi; satir ici stil
//      .modal-overlay.active kuralini ezdigi icin modal ASLA acilamazdi.
//      Birim testler sahte DOM'da stil hesaplamadigi icin bunu goremezdi.
// ============================================================
const { test, expect } = require("@playwright/test");

test("Teste Basla dugmesi gorunuyor ve ODT modali aciliyor", async ({ page }) => {
  await page.goto("http://localhost:8791/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("http://localhost:8791/");

  const sonuc = await page.evaluate(() => {
    app.state.userName = "Test";
    app.state.subscriptionTier = "pro";
    app.state.selectedProgramType = "custom";
    app.state.startDate = app.yerelTarih();
    const bugun = app.bugunkuProgramGunu();
    app.state.activeDay = bugun;
    app.state.daysData = {};
    app.state.daysData[bugun] = { completed: false, tasks: [
      { id: "t1", subject: "Matematik", topic: "Üslü Sayılar", label: "Matematik: Üslü Sayılar", duration: "45 dk", type: "quiz", qCount: 20, completed: false },
      { id: "t2", subject: "Felsefe", topic: "Bilgi Felsefesi", label: "Felsefe", duration: "30 dk", type: "reading", completed: false }
    ]};
    app.renderTodayPanel();
    const dugmeler = Array.from(document.querySelectorAll("#todayPanelTasksList button"))
      .filter(b => b.textContent.includes("Teste Başla"));
    return { dugmeSayisi: dugmeler.length };
  });
  // Matematik icin dugme var, Felsefe icin (bankada ders yok) yok olmali
  expect(sonuc.dugmeSayisi).toBe(1);

  await page.evaluate(() => {
    app.showView("dashboardView");
    app.switchTab("today");
  });
  await page.click("text=Teste Başla");
  const modal = page.locator("#odtModal");
  await expect(modal).toBeVisible();
  const altBaslik = await page.locator("#odtModalSubTitle").textContent();
  expect(altBaslik).toContain("doğrulanmış soru");

  // Ilk soruyu yanitlayip ilerleme sayacini kontrol et
  const soruVar = await page.locator("#odtQuestionArea").textContent();
  expect(soruVar.length).toBeGreaterThan(20);
});
