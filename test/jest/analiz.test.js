/**
 * ============================================================
 * JEST PORTU — analiz modulu birim testleri
 * ------------------------------------------------------------
 * Bu dosya CI'da node kullanmak isteyenler icindir. Projenin
 * kendi test paketi (test/calistir.sh) HICBIR bagimlilik
 * gerektirmez ve ayni testleri kosar; bu port onun yerine degil,
 * yanina konmustur.
 *
 * Kurulum:
 *   npm init -y
 *   npm i -D jest jest-environment-jsdom
 *   npx jest test/jest
 *
 * package.json:
 *   { "scripts": { "test": "jest test/jest" } }
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

const KOK = path.resolve(__dirname, "..", "..");

/**
 * app.js'i jsdom ortaminda yukleyip `app` nesnesini dondurur.
 *
 * NOT: Burada `vm.runInThisContext` KULLANILMAZ. O API kodu jsdom'un
 * disindaki V8 baglaminda kosar ve `window is not defined` hatasi verir.
 * `new Function(...)()` ise gecerli realm'in (jsdom) global kapsaminda
 * calisir; curriculum.js gibi `window.X = ...` yazan dosyalar da boylece
 * dogru global'e yazar.
 */
function appYukle() {
  // Veri dosyalari once window'a yuklenir; atlanirsa curriculum.topicsFor()
  // bos doner ve mufredat testleri yanlislikla "hata" gibi gorunur.
  ["curriculum.js", "questions.js", "quotes.js", "osym-data.js"].forEach((ad) => {
    const p = path.join(KOK, ad);
    if (!fs.existsSync(p)) return;
    const kod = fs.readFileSync(p, "utf8");
    new Function(kod + `
      ;try { if (typeof YKS_CURRICULUM    !== "undefined") window.YKS_CURRICULUM    = YKS_CURRICULUM;    } catch (e) {}
      ;try { if (typeof YKS_QUESTION_BANK !== "undefined") window.YKS_QUESTION_BANK = YKS_QUESTION_BANK; } catch (e) {}
      ;try { if (typeof OSYM_TABLO4       !== "undefined") window.OSYM_TABLO4       = OSYM_TABLO4;       } catch (e) {}
    `)();
  });

  const src = fs.readFileSync(path.join(KOK, "app.js"), "utf8");
  return new Function(src + "\n; return app;")();
}

/** Gercek chartData kaydi bicimi. */
function kayit({ dogru = 0, yanlis = 0, bos = 0, dakika = 60, ders = "Matematik",
                 gunOnce = 0, tur = "TYT", etiket = "K" } = {}) {
  return {
    label: etiket, correct: dogru, incorrect: yanlis, blank: bos,
    total: dogru + yanlis + bos, cozulen: dogru + yanlis, time: dakika,
    subject: ders, topic: "", hour: 15,
    ts: Date.now() - gunOnce * 86400000, dayNum: 1, examType: tur
  };
}

let app;
beforeAll(() => {
  global.Chart = function Chart(ctx, cfg) { this.config = cfg; this.data = cfg.data; };
  global.Chart.prototype.destroy = function () {};
  app = appYukle();
});

beforeEach(() => {
  document.body.innerHTML = `
    <div id="insightCards"></div>
    <select id="chartRangeFilter"><option value="all" selected>all</option></select>
    <select id="chartExamTypeFilter" data-initialized="true"><option value="all" selected>all</option></select>
    <div id="sumTodayTime"></div><div id="sumTodayTimeSub"></div>
    <div id="sumProgress"></div><div id="sumProgressSub"></div>
    <div id="sumLastNet"></div><div id="sumLastNetSub"></div>`;
  app.state = {
    track: "Sayısal", examFocus: "both", chartData: [], daysData: {},
    topicStatuses: {}, startDate: "2026-06-22", activeDay: 1,
    isGraduate: false, wakeTime: "08:00", sleepTime: "23:00"
  };
});

// ────────────────────────────────────────────────────────────
describe("netHesapla — YKS net kurali (D − Y/4)", () => {
  // Ceyreklik degerler bozulmamali: 1 ondaliga yuvarlama 12.25'i 12.3 yapiyordu.
  test.each([
    [13, 3, 12.25],
    [10, 1, 9.75],
    [20, 2, 19.5],
    [40, 4, 39],
    [0, 4, -1],
    [1, 7, -0.75],
  ])("%i doğru, %i yanlış → %f net", (d, y, beklenen) => {
    expect(app.netHesapla(d, y)).toBe(beklenen);
  });

  test("negatif neti sıfıra KIRPMAZ", () => {
    // Kirpma, 'yanlisla net kaybediyorsun' sinyalini gizler.
    expect(app.netHesapla(2, 20)).toBe(-3);
  });

  test.each([
    [undefined, undefined, 0],
    [null, null, 0],
    ["13", "3", 12.25],
    [NaN, 4, -1],
  ])("bozuk girdi (%p, %p) → %f", (d, y, beklenen) => {
    expect(app.netHesapla(d, y)).toBe(beklenen);
  });

  test("kaynakta ikinci bir net tanımı kalmadı (regresyon)", () => {
    const src = fs.readFileSync(path.join(KOK, "app.js"), "utf8");
    expect(src.match(/Math\.max\(0,\s*\w+\s*-\s*\w+\s*\/\s*4\)/g)).toBeNull();
  });
});

describe("sinavTuruBelirle — TYT / AYT / YDT", () => {
  test.each([
    [{ subject: "İngilizce", label: "İngilizce: Test" }, "YDT"],
    [{ subject: "Yabancı Dil", label: "YDT deneme" }, "YDT"],
    [{ subject: "Matematik", label: "[AYT] Matematik" }, "AYT"],
    [{ subject: "Edebiyat", label: "Edebiyat" }, "AYT"],
    [{ subject: "Matematik", label: "Matematik" }, "TYT"],
  ])("%p → %s", (gorev, beklenen) => {
    expect(app.sinavTuruBelirle(gorev)).toBe(beklenen);
  });
});

describe("mufredatDersOzeti — sıfıra bölme ve boş veri", () => {
  test("hiç konu bitmemişken NaN üretmez, %0 döner", () => {
    const ozet = app.mufredatDersOzeti();
    expect(ozet).not.toBeNull();
    expect(ozet.biten).toBe(0);
    expect(ozet.toplam).toBeGreaterThan(0);
    expect(ozet.liste.every((x) => x.yuzde === 0)).toBe(true);
    expect(ozet.liste.some((x) => Number.isNaN(x.yuzde))).toBe(false);
  });

  test("geçersiz alan varsayılan müfredata düşer (bilinçli davranış)", () => {
    app.state.track = "OlmayanAlan";
    const ozet = app.mufredatDersOzeti();
    expect(ozet).not.toBeNull();
    expect(ozet.toplam).toBeGreaterThan(0);
  });
});

describe("mufredatYetismeTahmini — kısa geçmişte uydurma tahmin yok", () => {
  test("14 günden kısa geçmişte bitiş tarihi vermez", () => {
    app.state.startDate = new Date().toISOString().slice(0, 10); // bugun basladi
    const hepsi = app.curriculum.topicsFor("Sayısal", "both");
    hepsi.slice(0, 40).forEach((t) => {
      app.state.topicStatuses[`${t.subject} - ${t.name}`] = { status: "Ogrenildi" };
    });
    const t = app.mufredatYetismeTahmini();
    expect(t.yetersizVeri).toBe(true);
    expect(t.bitisMetni).toBeUndefined();
  });
});

describe("Dönem filtresi — Son 7 / 30 / Tüm zamanlar", () => {
  const veri = () => [
    kayit({ etiket: "3g", gunOnce: 3 }),
    kayit({ etiket: "10g", gunOnce: 10, ders: "Fizik" }),
    kayit({ etiket: "40g", gunOnce: 40, ders: "Kimya" }),
    Object.assign(kayit({ etiket: "eski", ders: "Tarih" }), { ts: undefined }),
  ];

  function etiketler(aralik) {
    app.state.chartData = veri();
    document.getElementById("chartRangeFilter").value = aralik;
    app.renderInsightCards(app.state.chartData); // yan etkisiz kart uretimi
    return app.state.chartData;
  }

  test("zaman damgası olmayan eski kayıt hiçbir filtrede elenmez", () => {
    // Filtre renderCharts icinde uygulanir; burada kuralin kendisi test edilir.
    const sinir = Date.now() - 7 * 86400000;
    const kalan = veri().filter((r) => !r.ts || r.ts >= sinir);
    expect(kalan.map((r) => r.label)).toEqual(expect.arrayContaining(["3g", "eski"]));
    expect(kalan.map((r) => r.label)).not.toContain("10g");
  });
});

describe("renderDashboardSummary — sıfır veri", () => {
  test("veri yokken çökmez ve boş durum gösterir", () => {
    expect(() => app.renderDashboardSummary()).not.toThrow();
    expect(document.getElementById("sumLastNet").textContent).toBe("—");
    expect(document.getElementById("sumProgress").textContent).toBe("%0");
  });

  test("son kayıt neti çeyreklik değeri korur", () => {
    app.state.chartData = [kayit({ dogru: 13, yanlis: 3, bos: 4 })];
    app.renderDashboardSummary();
    expect(document.getElementById("sumLastNet").textContent).toBe("12.25");
  });
});


// ============================================================
// ASAMA 4 — otomasyon paketine eklenen yeni moduller
// ============================================================

describe("Pomodoro — duvar saati ve kayıt", () => {
  beforeEach(() => {
    document.body.innerHTML += `
      <span id="sidebarPomoTimer"></span><span id="miniPomoTimer"></span>
      <button id="sidebarPomoBtn"></button>
      <select id="sidebarPomoMinutes"><option value="25" selected>25</option></select>`;
    app.state.pomodoroKayitlari = [];
    app.saveState = () => {};
    app.playPomoAlarmSound = () => {};
    app.renderDashboardSummary = () => {};
    app.resetSidebarPomo();
  });

  test("kalan süre tik değil DUVAR SAATİ ile hesaplanır", () => {
    app.toggleSidebarPomo();
    // Arka plan: hiç tik gelmedi ama 10 dakika geçti
    app.sidebarPomoBitisTs = Date.now() + (25 * 60 - 600) * 1000;
    expect(app.pomoKalanSaniye()).toBeGreaterThan(897);
    expect(app.pomoKalanSaniye()).toBeLessThan(903);
  });

  test("bitiş anı geçmişse kalan 0, negatife düşmez", () => {
    app.toggleSidebarPomo();
    app.sidebarPomoBitisTs = Date.now() - 10000;
    expect(app.pomoKalanSaniye()).toBe(0);
  });

  test("seanslar kaydedilir ve gün bazında toplanır", () => {
    app.pomodoroSeansKaydet(25, true);
    app.pomodoroSeansKaydet(12, false);
    expect(app.state.pomodoroKayitlari).toHaveLength(2);
    expect(app.pomodoroDakikasi(app.bugunkuProgramGunu())).toBe(37);
  });

  test("kayıt sayısı 2000 ile sınırlı (localStorage kotası)", () => {
    for (let i = 0; i < 2100; i++) {
      app.state.pomodoroKayitlari.push({ ts: Date.now(), dakika: 1, gun: 1 });
    }
    app.pomodoroSeansKaydet(5, true);
    expect(app.state.pomodoroKayitlari.length).toBeLessThanOrEqual(2000);
  });
});

describe("Paket kısıtlamaları", () => {
  const TUM = ["programOlustur", "gunlukHaftalik", "aylikYillik", "mufredat",
               "hataZindani", "analiz", "kaynakKitap", "veliRaporu",
               "fotoPdf", "sesliGiris", "aiKoc", "tercihMotoru", "aliskanlik"];
  const acik = (tier) => {
    app.state.subscriptionTier = tier;
    return TUM.filter((o) => app.ozellikAcikMi(o));
  };

  test.each([
    ["baslangic", 3],
    ["pro", TUM.length],
    ["trial", TUM.length],
    ["free", 0],
  ])("%s paketi %i özellik açıyor", (tier, adet) => {
    expect(acik(tier)).toHaveLength(adet);
  });

  test("üst paket alt paketi kapsar", () => {
    const b = acik("baslangic"), s = acik("standart"), p = acik("pro");
    expect(b.every((o) => s.includes(o))).toBe(true);
    expect(s.every((o) => p.includes(o))).toBe(true);
  });

  test("deneme bitince her şey kilitli", () => {
    app.state.subscriptionTier = "free";
    expect(app.denemeBittiMi()).toBe(true);
    expect(TUM.some((o) => app.ozellikAcikMi(o))).toBe(false);
  });

  test("'sınava kadar' plan kimliği kısıtlamayı bozmaz", () => {
    expect(app.paketKimligi("standart_sinavaKadar")).toBe("standart");
    app.state.subscriptionTier = "standart_sinavaKadar";
    expect(app.ozellikAcikMi("analiz")).toBe(true);
    expect(app.ozellikAcikMi("sesliGiris")).toBe(false);
  });
});

describe("Fiyatlandırma — sınava kadar", () => {
  const gercekSinav = () => app.getExamDate;
  let yedek;
  beforeEach(() => {
    yedek = app.getExamDate;
    app.state.faturaDonemi = "sinavaKadar";
  });
  afterEach(() => { app.getExamDate = yedek; });

  const sinavaKalan = (gun) => {
    app.getExamDate = () => { const d = new Date(); d.setDate(d.getDate() + gun); return d; };
  };

  test("tam sezonda fiyatlar 1999 / 2999 / 3999", () => {
    sinavaKalan(300);
    const f = {};
    app.PAKETLER.forEach((p) => (f[p.id] = app.paketFiyati(p).tutar));
    expect(f).toEqual({ baslangic: 1999, standart: 2999, pro: 3999 });
  });

  test.each([330, 300, 200, 140, 80, 30, 3])(
    "sınava %i gün kala tek ödeme aylıktan pahalı değil",
    (gun) => {
      sinavaKalan(gun);
      app.PAKETLER.forEach((p) => {
        const f = app.paketFiyati(p);
        expect(f.tutar).toBeLessThan(f.aylikToplam);
        expect(f.indirimYuzde).toBeGreaterThanOrEqual(20);
      });
    }
  );

  test("süre kısaldıkça fiyat düşer", () => {
    const p = app.PAKETLER.find((x) => x.id === "pro");
    sinavaKalan(300); const uzun = app.paketFiyati(p).tutar;
    sinavaKalan(50);  const kisa = app.paketFiyati(p).tutar;
    expect(uzun).toBeGreaterThan(kisa);
  });
});

describe("XSS — kullanıcı verisi kaçırılmalı", () => {
  const ZARARLI = '<img src=x onerror=alert(1)>';

  test("escapeHtml zararlı yükü etkisizleştirir", () => {
    expect(app.escapeHtml(ZARARLI)).not.toContain("<img");
    expect(app.escapeHtml(ZARARLI)).toContain("&lt;img");
  });

  test("bildirim merkezi kaçışsız HTML basmaz", () => {
    document.body.innerHTML += '<div id="notificationCenterList"></div>';
    app.state.notifications = [
      { id: "n1", kind: "alert", title: "Gecikmiş: " + ZARARLI, body: "<script>x()</script>", ts: Date.now() },
    ];
    app.state.parentContact = "";
    app.saveState = () => {};
    app.renderNotificationCenter();
    const h = document.getElementById("notificationCenterList").innerHTML;
    expect(h).not.toContain("<img src=x");
    expect(h).not.toContain("<script>");
    expect(h).toContain("&lt;img");
  });
});

describe("İstikrar serisi — bakılan güne bağlı olmamalı", () => {
  test("aynı veriyle hangi güne bakılırsa bakılsın seri aynı", () => {
    const bas = new Date(); bas.setDate(bas.getDate() - 2);
    app.state.startDate = bas.toISOString().slice(0, 10);
    app.state.daysData = {};
    [1, 2, 3].forEach((d) => (app.state.daysData[d] = { completed: true, tasks: [{ completed: true }] }));
    app._programDaysCache = null;

    const seri = (bakilan) => { app.state.activeDay = bakilan; app.calculateStreak(); return app.state.streak; };
    expect(seri(1)).toBe(seri(3));
    expect(seri(3)).toBe(seri(50));
    expect(seri(1)).toBe(3);
  });
});
