// Canlı site: hesap akışı (https://aikocum.com.tr) — yalnızca CANLI=1 ile.
// Her koşum bir adet "smoke-*@ornek.com" hesabı açar (üretim DB'sinde kalır).
const { test, expect } = require("@playwright/test");
const URL = "https://aikocum.com.tr/";

test("canlı: API ile kayıt, arayüzden giriş, sunucu paketi state'e iniyor", async ({ page, request }) => {
  const eposta = `smoke-ui-${Date.now()}@ornek.com`, parola = "Smoke-Parola-1";
  const r = await request.post(URL + "api/kayit", { data: { eposta, parola, ad: "Duman UI" } });
  expect(r.status()).toBe(201);

  const hatalar = [];
  page.on("pageerror", e => hatalar.push(e.message));
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL);
  await page.evaluate(() => app.hesapGirisAc());
  await page.fill("#hesapGirisEposta", eposta);
  await page.fill("#hesapGirisParola", parola);
  await page.press("#hesapGirisParola", "Enter");
  await page.waitForFunction(() => localStorage.getItem("aikocum_oturum"), null, { timeout: 15000 });
  const d = await page.evaluate(() => ({ paket: app.state.sunucuHesap.paket, kalan: app.state.sunucuHesap.deneme_kalan_gun,
    seviye: app.aktifPaketSeviyesi(), tokenStateDe: JSON.stringify(app.state).includes(localStorage.getItem("aikocum_oturum")) }));
  expect(d.paket).toBe("deneme"); expect(d.kalan).toBe(7); expect(d.seviye).toBe(3); expect(d.tokenStateDe).toBe(false);

  // Sayfa yenilenince /api/ben ile tazelenmeli (SW artik /api'ye dokunmuyor)
  await page.goto(URL);
  await page.waitForFunction(() => app.state.sunucuHesap && app.state.sunucuHesap.senk > Date.now() - 10000, null, { timeout: 15000 });
  expect(hatalar).toEqual([]);
});
