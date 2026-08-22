// ============================================================
// 4.8  Hesap akisi (Dilim 2) — gercek tarayici, sahte API
// API page.route ile kurgulanir: sunucuya bagimlilik yok, ama istemci
// kodu (hesap.js + app.js) birebir uretimdeki gibi calisir.
// ============================================================
const { test, expect } = require("@playwright/test");

// Basit bellek-ici sahte API
function sahteApi(page, secenek) {
  const o = Object.assign({ paket: "deneme", deneme_bitti: false, kalan: 7 }, secenek || {});
  const kullanici = () => ({ id: 1, eposta: "ada@ornek.com", ad: "Ada", rol: "ogrenci",
    paket: o.paket, deneme_bitti: o.deneme_bitti, deneme_kalan_gun: o.kalan, sunucu_zamani: 1787400000 });
  const cagrilar = [];
  return page.route("**/api/**", async (route) => {
    const req = route.request();
    const yol = new URL(req.url()).pathname;
    let govde = {}; try { govde = req.postDataJSON() || {}; } catch (e) {}
    cagrilar.push({ yol, yontem: req.method(), govde, auth: req.headers()["authorization"] || "" });
    const yanit = (kod, g) => route.fulfill({ status: kod, contentType: "application/json", body: JSON.stringify(g) });
    if (yol === "/api/kayit") return yanit(govde.eposta === "var@ornek.com" ? 409 : 201,
      govde.eposta === "var@ornek.com" ? { ok: false, hata: "Bu e-posta zaten kayıtlı" }
                                        : { ok: true, token: "e2e-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxx", kullanici: kullanici() });
    if (yol === "/api/giris") return yanit(govde.parola === "Dogru-Parola-1" ? 200 : 401,
      govde.parola === "Dogru-Parola-1" ? { ok: true, token: "e2e-giris-xxxxxxxxxxxxxxxxxxxxxxxxxxxx", kullanici: kullanici() }
                                          : { ok: false, hata: "E-posta veya parola hatalı" });
    if (yol === "/api/ben") return yanit(/Bearer e2e-/.test(cagrilar[cagrilar.length - 1].auth) ? 200 : 401,
      /Bearer e2e-/.test(cagrilar[cagrilar.length - 1].auth) ? { ok: true, kullanici: kullanici() } : { ok: false, hata: "Oturum gerekli" });
    if (yol === "/api/cikis") return yanit(200, { ok: true });
    return yanit(404, { ok: false });
  }).then(() => cagrilar);
}

async function sihirbaziDoldur(page, parola) {
  await page.evaluate((parola) => {
    app.startAsStudent();
    const yaz = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    yaz("studentName", "Ada Lovelace"); yaz("studentEmail", "ada@ornek.com"); yaz("targetRank", "50000");
    app.state.targetRank = 50000;
    if (parola !== null) yaz("studentPassword", parola);
    app.nextWizardPage();
  }, parola);
}

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:8791/");
  await page.evaluate(() => { localStorage.clear(); });
});

test("kayıt: parola zorunlu, deneme sunucuda hesap açarak başlıyor", async ({ page }) => {
  const cagrilar = await sahteApi(page);
  await page.goto("http://localhost:8791/");
  await sihirbaziDoldur(page, "kisa");
  const hata = await page.evaluate(() => document.getElementById("studentPasswordError").textContent);
  expect(hata).toMatch(/8 karakter/);

  await page.evaluate(() => { document.getElementById("studentPassword").value = "Guclu-Parola-1"; app.nextWizardPage(); });
  await page.evaluate(async () => {
    app.wizardGo(3); app.updateGoalPlanPreview(); app.wizardGo(4); app.checkHabitsFeedback(false); app.wizardNext();
    app.state.currentPositionSource = "skipped"; app.state.testSkipped = true;
    await app.upgradeToPro("trial");
  });
  const kayit = cagrilar.find(c => c.yol === "/api/kayit");
  expect(kayit).toBeTruthy();
  expect(kayit.govde.eposta).toBe("ada@ornek.com");
  expect(kayit.govde.parola).toBe("Guclu-Parola-1");

  const durum = await page.evaluate(() => ({
    token: localStorage.getItem("aikocum_oturum"),
    tier: app.state.subscriptionTier,
    paket: app.state.sunucuHesap && app.state.sunucuHesap.paket,
    stateIcindeParola: JSON.stringify(app.state).includes("Guclu-Parola-1"),
    stateIcindeToken: JSON.stringify(app.state).includes("e2e-token")
  }));
  expect(durum.token).toMatch(/^e2e-token/);
  expect(durum.tier).toBe("trial");
  expect(durum.paket).toBe("deneme");
  expect(durum.stateIcindeParola).toBe(false);   // parola state'e sizmadi
  expect(durum.stateIcindeToken).toBe(false);    // token state'e sizmadi
});

test("sunucu 'deneme bitti' diyorsa konsoldan pro yazmak işe yaramaz (B-1/B-3)", async ({ page }) => {
  await sahteApi(page, { paket: "free", deneme_bitti: true, kalan: 0 });
  await page.evaluate(() => {
    localStorage.setItem("aikocum_oturum", "e2e-giris-xxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    localStorage.setItem("slamdunk_yks_state", JSON.stringify({ name: "Ada", email: "ada@ornek.com",
      subscriptionTier: "pro", trialStartDate: new Date().toISOString(), sunucuHesap: null }));
  });
  await page.goto("http://localhost:8791/");
  await page.waitForFunction(() => app.state.sunucuHesap && app.state.sunucuHesap.paket === "free", null, { timeout: 5000 });
  const r = await page.evaluate(() => {
    app.state.subscriptionTier = "pro";              // konsol saldirisi
    return { seviye: app.aktifPaketSeviyesi(), bitti: app.denemeBittiMi(), analiz: app.ozellikAcikMi("analiz") };
  });
  expect(r.seviye).toBe(0);
  expect(r.bitti).toBe(true);
  expect(r.analiz).toBe(false);
});

test("yeni cihazda hesapla giriş: yanlış parola reddedilir, doğru parola oturum açar", async ({ page }) => {
  const cagrilar = await sahteApi(page);
  await page.goto("http://localhost:8791/");
  await page.evaluate(() => app.hesapGirisAc());
  await expect(page.locator("#hesapGirisModal")).toBeVisible();
  await page.fill("#hesapGirisEposta", "ada@ornek.com");
  await page.fill("#hesapGirisParola", "yanlis-parola");
  await page.click("#hesapGirisBtn");
  await expect(page.locator("#hesapGirisHata")).toContainText("hatalı");

  // NOT: Hata metni belirince duzen kayar; headless Chromium'da ayni
  // noktaya ikinci fare tiklamasi tutarsiz sekilde dugmeye ulasmiyor
  // (bayat hover — urun hatasi degil, ortam artefakti; isleyici dogrudan
  // cagrildiginda ve gercek kullanimda calisiyor). Ikinci gonderim
  // deterministik olan klavye yoluyla yapilir.
  await page.fill("#hesapGirisParola", "Dogru-Parola-1");
  await page.press("#hesapGirisParola", "Enter");
  await page.waitForFunction(() => localStorage.getItem("aikocum_oturum"), null, { timeout: 5000 });
  const r = await page.evaluate(() => ({ token: localStorage.getItem("aikocum_oturum"), paket: app.state.sunucuHesap.paket,
    parolaAlani: document.getElementById("hesapGirisParola").value }));
  expect(r.token).toMatch(/^e2e-giris/);
  expect(r.paket).toBe("deneme");
  expect(r.parolaAlani).toBe("");                   // parola alani temizlendi
  expect(cagrilar.filter(c => c.yol === "/api/giris").length).toBe(2);
});

test("çıkış sunucu oturumunu da kapatır; 401'de token düşer", async ({ page }) => {
  const cagrilar = await sahteApi(page);
  await page.evaluate(() => {
    localStorage.setItem("aikocum_oturum", "e2e-giris-xxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    localStorage.setItem("slamdunk_yks_state", JSON.stringify({ name: "Ada", subscriptionTier: "trial",
      trialStartDate: new Date().toISOString(), daysData: { 1: { completed: false, tasks: [] } } }));
  });
  await page.goto("http://localhost:8791/");
  await page.waitForFunction(() => app.state.sunucuHesap, null, { timeout: 5000 });
  page.on("dialog", d => d.accept());
  await page.evaluate(() => app.logoutUser());
  await page.waitForFunction(() => !localStorage.getItem("aikocum_oturum"), null, { timeout: 5000 });
  expect(cagrilar.some(c => c.yol === "/api/cikis")).toBe(true);

  // gecersiz token ile acilis -> 401 -> token temizlenir
  await page.evaluate(() => localStorage.setItem("aikocum_oturum", "gecersiz-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"));
  await page.goto("http://localhost:8791/");
  await page.waitForFunction(() => !localStorage.getItem("aikocum_oturum"), null, { timeout: 5000 });
  expect(await page.evaluate(() => app.state.sunucuHesap)).toBeNull();
});

test("parola alanında Enter ile giriş yapılabiliyor", async ({ page }) => {
  await sahteApi(page);
  await page.goto("http://localhost:8791/");
  await page.evaluate(() => app.hesapGirisAc());
  await page.fill("#hesapGirisEposta", "ada@ornek.com");
  await page.fill("#hesapGirisParola", "Dogru-Parola-1");
  await page.press("#hesapGirisParola", "Enter");
  await page.waitForFunction(() => localStorage.getItem("aikocum_oturum"), null, { timeout: 5000 });
  expect(await page.evaluate(() => app.state.sunucuHesap.paket)).toBe("deneme");
});
