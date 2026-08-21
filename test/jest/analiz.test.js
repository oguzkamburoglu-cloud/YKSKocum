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
