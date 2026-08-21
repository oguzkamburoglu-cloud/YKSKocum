/**
 * ============================================================
 * MASTER TEST PLANI — ASAMA 4 / E2E
 * Playwright ile GERCEK tarayicida ucdan uca akislar.
 *
 * Kurulum:
 *   npm i -D @playwright/test
 *   npx playwright install chromium
 *   npx playwright test test/e2e
 *
 * Sunucu: playwright.config.js icindeki webServer ayari
 * `python3 -m http.server` baslatir; ayrica calisan bir sunucu
 * gerekmez.
 * ============================================================
 */
const { test, expect } = require("@playwright/test");

// ── Yardimcilar ─────────────────────────────────────────────

/** Uygulamayi TEMIZ durumla acar. */
async function temizAc(page) {
  await page.goto("/index.html");
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.waitForFunction(() => typeof window.app === "object" && !!window.app.state);
  // Gunun sozu / brifing balonlari akisi kapatmasin
  await page.addStyleTag({
    content: `.quote-popup,.quote-popup-overlay,[class*="brief"],[id*="Loading"]{display:none !important;}`
  });
}

/** Kayit sihirbazini bastan sona gecer ve denemeyi baslatir. */
async function kayitOl(page, { ad = "Test Öğrenci", siralama = "50000" } = {}) {
  await page.evaluate(({ ad, siralama }) => {
    app.startAsStudent();
    const yaz = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    yaz("studentName", ad);
    yaz("studentEmail", "test@ornek.com");
    yaz("targetRank", siralama);
    app.wizardGo(3);
    app.updateGoalPlanPreview();
    app.wizardGo(4);
    yaz("weekdayCapacity", "4");
    yaz("weekendCapacity", "6");
    yaz("schoolStatus", "school");
    app.checkHabitsFeedback(false);
    app.wizardNext();          // -> seviye tespit
    app.skipDiagnosticTest();  // sinavi gec
  }, { ad, siralama });
}

// ── 4.1 Ana akis ────────────────────────────────────────────

test.describe("4.1  Kayıt → paket → program → görev → analiz", () => {
  test("öğrenci sıfırdan başlayıp analizinde net görebiliyor", async ({ page }) => {
    await temizAc(page);

    // 1) Kayit
    await kayitOl(page);

    // 2) Paket ekrani ZORUNLU olarak cikmali
    const paketGorunur = await page.evaluate(() => {
      app.startMainDashboard();
      const m = document.getElementById("subscriptionModal");
      return !!m && getComputedStyle(m).visibility !== "hidden";
    });
    expect(paketGorunur).toBe(true);

    // 3) Denemeyi baslat
    await page.evaluate(() => app.upgradeToPro("trial"));
    const tier = await page.evaluate(() => app.state.subscriptionTier);
    expect(tier).toBe("trial");

    // 4) Program onerisi -> kabul
    await page.evaluate(() => { app.startMainDashboard(); app.acceptProgramSuggestion(); });
    const gunSayisi = await page.evaluate(() => Object.keys(app.state.daysData).length);
    expect(gunSayisi).toBeGreaterThan(300);

    // 5) Gorev tamamla + net gir
    await page.evaluate(() => {
      const gun = app.bugunkuProgramGunu();
      const g = app.state.daysData[gun];
      const t = g.tasks[0];
      t.completed = true; t.logged = true;
      t.correct = 17; t.incorrect = 7; t.blank = 4; t.timeSpent = 60;
      app.state.chartData.push({
        label: "G" + gun + " - " + t.subject, correct: 17, incorrect: 7, blank: 4,
        total: 28, cozulen: 24, time: 60, subject: t.subject, topic: t.topic || "",
        hour: 14, ts: Date.now(), dayNum: gun, examType: "TYT"
      });
      app.saveState();
    });

    // 6) Analizde gorunuyor mu? 17D 7Y = 15.25 net
    const ozet = await page.evaluate(() => {
      app.switchTab("charts");
      document.getElementById("chartExamTypeFilter").value = "all";
      document.getElementById("chartRangeFilter").value = "all";
      app.renderCharts();
      return {
        net: document.getElementById("sumLastNet").textContent,
        altMetin: document.getElementById("sumLastNetSub").innerHTML,
        kartSayisi: document.querySelectorAll("#insightCards .analiz-kart").length
      };
    });
    expect(ozet.net).toBe("15.25");
    expect(ozet.altMetin).toContain("17D 7Y 4B");
    expect(ozet.kartSayisi).toBeGreaterThan(0);
  });
});

// ── 4.2 Kalicilik ───────────────────────────────────────────

test.describe("4.2  Veri kalıcılığı", () => {
  test("sayfa yenilendiğinde program ve kayıtlar duruyor", async ({ page }) => {
    await temizAc(page);
    await kayitOl(page);
    await page.evaluate(() => {
      app.upgradeToPro("trial");
      app.startMainDashboard();
      app.acceptProgramSuggestion();
      app.state.chartData.push({
        label: "kalici", correct: 20, incorrect: 4, blank: 2, total: 26, cozulen: 24,
        time: 45, subject: "Matematik", topic: "", hour: 14,
        ts: Date.now(), dayNum: 1, examType: "TYT"
      });
      app.saveState();
    });

    await page.reload();
    await page.waitForFunction(() => typeof window.app === "object" && !!window.app.state);

    const sonra = await page.evaluate(() => ({
      gun: Object.keys(app.state.daysData || {}).length,
      kayit: (app.state.chartData || []).length,
      tier: app.state.subscriptionTier
    }));
    expect(sonra.gun).toBeGreaterThan(300);
    expect(sonra.kayit).toBe(1);
    expect(sonra.tier).toBe("trial");
  });
});

// ── 4.3 Paket kisitlamasi ───────────────────────────────────

test.describe("4.3  Paket kısıtlaması", () => {
  test("Başlangıç kullanıcısı kilitli modüle giremiyor", async ({ page }) => {
    await temizAc(page);
    await kayitOl(page);
    const sonuc = await page.evaluate(() => {
      app.upgradeToPro("trial");
      app.startMainDashboard();
      app.state.subscriptionTier = "baslangic";
      app.renderDashboard();
      const oncekiSekme = app.state.activeTab;
      app.switchTab("charts");                    // analiz -> Standart gerekir
      return {
        sekmeDegisti: app.state.activeTab !== oncekiSekme,
        kilitRozeti: document.querySelectorAll(".paket-kilit-rozeti").length,
        uyariBasligi: (document.getElementById("coachModalTitle") || {}).textContent || ""
      };
    });
    expect(sonuc.sekmeDegisti).toBe(false);
    expect(sonuc.kilitRozeti).toBeGreaterThan(0);
    expect(sonuc.uyariBasligi).toContain("Standart");
  });

  test("deneme bitince uygulamaya girilemiyor", async ({ page }) => {
    await temizAc(page);
    await kayitOl(page);
    const sonuc = await page.evaluate(() => {
      app.upgradeToPro("trial");
      app.startMainDashboard();
      app.acceptProgramSuggestion();
      const gunOnce = Object.keys(app.state.daysData).length;
      app.state.subscriptionTier = "free";        // deneme bitti
      app.startMainDashboard();
      const m = document.getElementById("subscriptionModal");
      return {
        paketEkraniAcik: !!m && getComputedStyle(m).visibility !== "hidden",
        programDuruyor: Object.keys(app.state.daysData).length === gunOnce
      };
    });
    expect(sonuc.paketEkraniAcik).toBe(true);
    expect(sonuc.programDuruyor).toBe(true);   // veri silinmiyor
  });
});

// ── 4.4 XSS ─────────────────────────────────────────────────

test.describe("4.4  XSS — zararlı içerik çalışmamalı", () => {
  test("aktarılan programdaki script bildirimde çalışmıyor", async ({ page }) => {
    const hatalar = [];
    page.on("dialog", async (d) => { hatalar.push("dialog: " + d.message()); await d.dismiss(); });
    page.on("pageerror", (e) => hatalar.push("pageerror: " + e.message));

    await temizAc(page);
    const h = await page.evaluate(() => {
      app.state.notifications = [{
        id: "n1", kind: "alert",
        title: 'Gecikmiş: <img src=x onerror="window.__xss=true">',
        body: '<script>window.__xss2=true</script>',
        ts: Date.now()
      }];
      app.state.parentContact = "";
      app.renderNotificationCenter();
      return document.getElementById("notificationCenterList").innerHTML;
    });

    expect(h).not.toContain("<img src=x");
    expect(h).not.toContain("<script>");
    expect(h).toContain("&lt;img");

    const calisti = await page.evaluate(() => !!window.__xss || !!window.__xss2);
    expect(calisti).toBe(false);
    expect(hatalar).toEqual([]);
  });
});

// ── 4.5 Sıfır veri ──────────────────────────────────────────

test.describe("4.5  Sıfır veri / ilk açılış", () => {
  test("ilk açılışta görünür modal yok ve her şey sıfır", async ({ page }) => {
    await temizAc(page);
    const durum = await page.evaluate(() => ({
      gorunurModal: Array.from(document.querySelectorAll(".modal-overlay"))
        .filter((m) => getComputedStyle(m).visibility !== "hidden")
        .map((m) => m.id),
      seri: app.state.streak,
      gun: Object.keys(app.state.daysData || {}).length,
      kayit: (app.state.chartData || []).length,
      gizliMetinSizintisi: /Sıkıştırıl|Sığmıyor/.test(document.body.innerText)
    }));
    expect(durum.gorunurModal).toEqual([]);
    expect(durum.seri).toBe(0);
    expect(durum.gun).toBe(0);
    expect(durum.kayit).toBe(0);
    expect(durum.gizliMetinSizintisi).toBe(false);
  });

  test("konsola hata düşmüyor", async ({ page }) => {
    const hatalar = [];
    page.on("pageerror", (e) => hatalar.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") hatalar.push(m.text()); });
    await temizAc(page);
    await page.waitForTimeout(1200);
    // Servis calisani kaydi test ortaminda basarisiz olabilir; onu ayikla
    const gercek = hatalar.filter((h) => !/service ?worker|sw\.js|Failed to register/i.test(h));
    expect(gercek).toEqual([]);
  });
});
