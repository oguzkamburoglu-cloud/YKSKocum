// ============================================================
// AI Koçum — test kosum ortami (JavaScriptCore icin)
// app.js tarayici icin yazildi; burada DOM ve depolama taklit edilir
// ki hesaplama fonksiyonlari sunucusuz/tarayicisiz kosulabilsin.
// ============================================================

function sahteEleman(id) {
  const el = {
    id: id, value: "", textContent: "", innerHTML: "", hidden: false,
    dataset: {}, style: {},
    classList: (function () {
      const kume = {};
      return {
        add(c) { kume[c] = 1; },
        remove(c) { delete kume[c]; },
        contains(c) { return !!kume[c]; },
        // toggle EKSIKTI: uygulama kodu classList.toggle kullaniyor,
        // harness'te olmayinca "not a function" hatasi uygulama hatasi
        // gibi gorunuyordu.
        toggle(c, zorla) {
          const varMi = !!kume[c];
          const olsun = zorla === undefined ? !varMi : !!zorla;
          if (olsun) kume[c] = 1; else delete kume[c];
          return olsun;
        }
      };
    })(),
    children: [], options: [],
    appendChild(c){ this.children.push(c); return c; },
    querySelector(){ return null; }, querySelectorAll(){ return []; },
    addEventListener(){}, removeEventListener(){}, focus(){},
    getContext(){ return {}; }, scrollIntoView(){},
    getBoundingClientRect(){ return {width:0,height:0,top:0,left:0}; },
    checkValidity(){ return true; }, closest(){ return null; },
    setAttribute(){}, removeAttribute(){}, getAttribute(){ return null; }
  };
  return el;
}

const _elemanlar = {};
const document = {
  _el: _elemanlar,
  getElementById(id) { return _elemanlar[id] || null; },
  createElement(tag) { return sahteEleman("yeni_" + tag); },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {},
  body: sahteEleman("body"),
  documentElement: sahteEleman("html")
};

function elemanEkle(id) { _elemanlar[id] = sahteEleman(id); return _elemanlar[id]; }
function elemanlariTemizle() { for (const k in _elemanlar) delete _elemanlar[k]; }

const localStorage = {
  _d: {},
  getItem(k){ return this._d[k] !== undefined ? this._d[k] : null; },
  setItem(k,v){ this._d[k] = String(v); },
  removeItem(k){ delete this._d[k]; },
  clear(){ this._d = {}; }
};

// Chart.js taklidi — olusturulan grafiklerin verisi incelenebilsin
const _grafikler = [];
function Chart(ctx, cfg) { this.config = cfg; this.data = cfg.data; _grafikler.push(this); }
Chart.prototype.destroy = function(){};

const window = {
  localStorage: localStorage, addEventListener(){}, matchMedia(){ return {matches:false, addListener(){}}; },
  location: { href: "", search: "", pathname: "/" },
  navigator: { onLine: true, serviceWorker: null, userAgent: "test" },
  Chart: Chart, setTimeout: function(f){ return 0; }, clearTimeout(){}, 
  setInterval: function(){ return 0; }, clearInterval(){}
};
const navigator = window.navigator;
const alert = function(){};
const confirm = function(){ return true; };
const setTimeout = function(){ return 0; };
const clearTimeout = function(){};
const setInterval = function(){ return 0; };
const clearInterval = function(){};
const fetch = function(){ return { then(){ return this; }, catch(){ return this; } }; };
const console = { log: print, warn: print, error: print, info: print };

// ── Basit test cercevesi ────────────────────────────────────
const T = {
  gecen: 0, kalan: 0, hatalar: [], suanki: "",
  grup(ad) { this.suanki = ad; print("\n── " + ad + " " + "─".repeat(Math.max(0, 54 - ad.length))); },
  esit(ad, bulunan, beklenen) {
    const ok = Object.is(bulunan, beklenen) ||
               (typeof bulunan === "number" && typeof beklenen === "number" &&
                Math.abs(bulunan - beklenen) < 1e-9);
    this._yaz(ok, ad, bulunan, beklenen);
  },
  dogru(ad, kosul, aciklama) { this._yaz(!!kosul, ad, kosul, aciklama || true); },
  yakinEsit(ad, bulunan, beklenen, tol) {
    const ok = typeof bulunan === "number" && Math.abs(bulunan - beklenen) <= (tol || 0.01);
    this._yaz(ok, ad, bulunan, beklenen);
  },
  _yaz(ok, ad, bulunan, beklenen) {
    if (ok) { this.gecen++; print("  ✓ " + ad); }
    else {
      this.kalan++;
      const s = "  ✗ " + ad + "\n      bulunan : " + JSON.stringify(bulunan) +
                "\n      beklenen: " + JSON.stringify(beklenen);
      print(s);
      this.hatalar.push(this.suanki + " → " + ad + " (bulunan " + JSON.stringify(bulunan) +
                        ", beklenen " + JSON.stringify(beklenen) + ")");
    }
  },
  ozet() {
    print("\n" + "═".repeat(60));
    print("  TOPLAM: " + (this.gecen + this.kalan) + "   GEÇEN: " + this.gecen + "   KALAN: " + this.kalan);
    if (this.hatalar.length) {
      print("\n  BAŞARISIZ TESTLER:");
      this.hatalar.forEach((h, i) => print("   " + (i+1) + ") " + h));
    }
    print("═".repeat(60));
    return this.kalan === 0;
  }
};

// Veri dosyalarini window'a yukler (app.js bunlari window uzerinden okur).
// Bu adim atlanirsa curriculum.topicsFor() bos doner ve mufredat
// testleri yanlislikla "uygulama hatasi" gibi gorunur.
function veriDosyalariniYukle() {
  const dosyalar = [
    ["curriculum.js", "YKS_CURRICULUM"],
    ["questions.js",  "YKS_QUESTION_BANK"],
    ["quotes.js",     null],
    ["osym-data.js",  "OSYM_TABLO4"]
  ];
  dosyalar.forEach(function (d) {
    const ad = d[0], degisken = d[1];
    let src;
    try { src = readFile(ad); } catch (e) { return; }  // yoksa atla
    try {
      const fn = new Function("window", "document", "console",
        src + (degisken ? "\n; try { window." + degisken + " = " + degisken + "; } catch(e){}" : ""));
      fn(window, document, console);
    } catch (e) { print("  ! " + ad + " yuklenemedi: " + e.message); }
  });
}

// app.js'i yukle ve app nesnesini dondur
function appYukle() {
  veriDosyalariniYukle();
  const src = readFile("app.js");
  const fn = new Function(
    "document","window","localStorage","navigator","Chart","alert","confirm",
    "setTimeout","clearTimeout","setInterval","clearInterval","fetch","console",
    // app.js icindeki modul-ici sabitler (SafeStorage gibi) disaridan
    // gorunmez; testlerin erisebilmesi icin window'a baglanir.
    src + "\n; try { window.SafeStorage = SafeStorage; } catch (e) {}" +
          "\n; return typeof app !== 'undefined' ? app : null;"
  );
  const app = fn(document, window, localStorage, navigator, Chart, alert, confirm,
                 setTimeout, clearTimeout, setInterval, clearInterval, fetch, console);
  if (window.SafeStorage) globalThis.SafeStorage = window.SafeStorage;
  return app;
}
