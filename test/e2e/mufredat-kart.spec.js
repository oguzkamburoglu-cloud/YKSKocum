// "Ders Bazlı Müfredat İlerlemen" kartının aç/kapa düğmesi çalışmalı.
// Regresyon: kart curriculumInsightCards içindeyken, aç/kapa yalnızca
// insightCards'a bakıyordu → düğme hiçbir şey yapmıyordu.
const { test, expect } = require("@playwright/test");

test("müfredat kartı aç/kapa çalışıyor", async ({ page }) => {
  await page.goto("http://localhost:8791/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("http://localhost:8791/");
  const r = await page.evaluate(() => {
    app.state.subscriptionTier = "pro";
    // Müfredatta en az bir konu "çalışıldı" olsun ki kart üretilsin
    app.state.topicStatuses = app.state.topicStatuses || {};
    // 14+ günlük geçmiş şartı yoksa kart yine de üretilir (mufredatDersOzeti)
    app.renderInsightCards(app.state.chartData || []);
    const kap = document.getElementById("curriculumInsightCards");
    const btn = kap && kap.querySelector('button[onclick*="analizKartiAcKapa"]');
    if (!btn) return { kartYok: true };
    const govde = btn.nextElementSibling;
    const oncesi = getComputedStyle(govde).display;
    const anahtar = btn.getAttribute("onclick").match(/'([^']+)'/)[1];
    app.analizKartiAcKapa(anahtar);
    const sonrasi = getComputedStyle(govde).display;
    app.analizKartiAcKapa(anahtar);
    const geri = getComputedStyle(govde).display;
    return { oncesi, sonrasi, geri, degisti: oncesi !== sonrasi };
  });
  expect(r.kartYok).toBeFalsy();
  expect(r.degisti).toBe(true);      // düğme durumu değiştirdi
  expect(r.geri).toBe(r.oncesi);     // ikinci tık geri aldı
});
