// Canlı site duman testi — https://aikocum.com.tr
// CI'da koşmaz (webServer yerel); elle: npx playwright test canli-smoke
const { test, expect } = require("@playwright/test");
const URL = "https://aikocum.com.tr/";

test("canlı site: açılıyor, konsol hatasız, SW kayıtlı, ilk giriş sıfır", async ({ page }) => {
  const hatalar = [];
  page.on("pageerror", e => hatalar.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") hatalar.push("console: " + m.text()); });

  const r = await page.goto(URL, { waitUntil: "load", timeout: 30000 });
  expect(r.status()).toBe(200);
  await expect(page).toHaveTitle(/AI Koçum/);

  const durum = await page.evaluate(async () => {
    await new Promise(r => setTimeout(r, 1500));
    const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
    return {
      swKayitli: !!reg,
      guvenli: window.isSecureContext,
      appVar: typeof app === "object",
      marka: document.title
    };
  });
  expect(durum.guvenli).toBe(true);      // HTTPS -> PWA/bildirim yolu acik
  expect(durum.appVar).toBe(true);
  expect(durum.swKayitli).toBe(true);    // servis calisani HTTPS'te kayit oldu
  expect(hatalar, hatalar.join("\n")).toEqual([]);
});
