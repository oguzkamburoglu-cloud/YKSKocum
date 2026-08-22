// "Kendim Kurayım" dendiğinde oluşturucu doğrudan CUSTOM modda açılmalı;
// tekrar "AI Oluştursun" ekranı çıkmamalı.
const { test, expect } = require("@playwright/test");

test("kendim kurayım → custom panel açık, AI paneli gizli", async ({ page }) => {
  await page.goto("http://localhost:8791/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("http://localhost:8791/");
  const r = await page.evaluate(() => {
    app.state.subscriptionTier = "pro";
    app.showView("dashboardView");
    app.declineProgramSuggestion();
    const ai = document.getElementById("progMode-ai");
    const custom = document.getElementById("progMode-custom");
    const aiBtn = document.getElementById("progModeBtn-ai");
    const customBtn = document.getElementById("progModeBtn-custom");
    return {
      aiGizli: getComputedStyle(ai).display === "none",
      customAcik: getComputedStyle(custom).display !== "none",
      customBtnAktif: customBtn.classList.contains("active"),
      aiBtnAktif: aiBtn.classList.contains("active")
    };
  });
  expect(r.aiGizli).toBe(true);
  expect(r.customAcik).toBe(true);
  expect(r.customBtnAktif).toBe(true);
  expect(r.aiBtnAktif).toBe(false);
});
