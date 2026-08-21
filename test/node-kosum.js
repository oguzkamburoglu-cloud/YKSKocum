#!/usr/bin/env node
/**
 * ============================================================
 * NODE KOSUM KABUGU
 * ------------------------------------------------------------
 * Test paketi JavaScriptCore (jsc) icin yazildi; jsc yalnizca
 * macOS'ta hazir gelir. CI (Linux) icin ayni test dosyalarini
 * Node altinda kosar — testler DEGISMEZ.
 *
 * jsc'nin uc yerlesigini saglar:
 *   readFile(yol)  -> dosya icerigi
 *   print(...)     -> stdout
 *   load(yol)      -> dosyayi AYNI kapsamda calistirir
 *
 * load() ozel: jsc'de yuklenen dosyanin top-level const'lari
 * cagiran kapsamda gorunur. Node'da bunu taklit etmek icin
 * load(...) satirlari dosya icerigiyle DEGISTIRILIR ve butun
 * kod tek kapsamda calistirilir.
 *
 * Kullanim:
 *   node test/node-kosum.js              # tum testler
 *   node test/node-kosum.js test/01-*.js # tek dosya
 * ============================================================
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const KOK = path.resolve(__dirname, "..");

function oku(yol) {
  return fs.readFileSync(path.resolve(KOK, yol), "utf8");
}

/** load("x") cagrilarini dosya icerigiyle degistirir (ic ice destekli). */
function loadlariAc(kod, yuklenen) {
  return kod.replace(/^\s*load\(\s*["']([^"']+)["']\s*\);?\s*$/gm, (tam, yol) => {
    if (yuklenen.has(yol)) return "";          // ayni dosya iki kez yuklenmesin
    yuklenen.add(yol);
    return loadlariAc(oku(yol), yuklenen);
  });
}

function dosyaKos(testYolu) {
  const kod = loadlariAc(oku(testYolu), new Set());
  let cikti = "";
  const sandbox = {
    readFile: oku,
    print: (...a) => { const s = a.join(" "); cikti += s + "\n"; console.log(s); },
    load: () => {},                             // kalan cagrilar zaten acildi
    console, Date, Math, JSON, RegExp, Error, TypeError,
    Object, Array, String, Number, Boolean, Set, Map, Symbol,
    isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
    globalThis: null
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  try {
    vm.runInContext(kod, sandbox, { filename: testYolu });
  } catch (e) {
    console.log("  ✗ KOSUM HATASI: " + e.message);
    return { gecen: 0, kalan: 1 };
  }
  // T.ozet() ciktisindan sayilari al
  const m = cikti.match(/TOPLAM:\s*(\d+)\s+GEÇEN:\s*(\d+)\s+KALAN:\s*(\d+)/);
  return m ? { gecen: +m[2], kalan: +m[3] } : { gecen: 0, kalan: 1 };
}

const hedefler = process.argv.length > 2
  ? process.argv.slice(2)
  : fs.readdirSync(path.join(KOK, "test"))
      .filter((f) => /^\d+.*\.js$/.test(f))
      .sort()
      .map((f) => "test/" + f);

let toplamGecen = 0, toplamKalan = 0;
for (const t of hedefler) {
  console.log("\n════════ " + t + " ════════");
  const s = dosyaKos(t);
  toplamGecen += s.gecen;
  toplamKalan += s.kalan;
}

console.log("\n" + "═".repeat(60));
console.log("  GENEL TOPLAM: " + (toplamGecen + toplamKalan) +
            "   GEÇEN: " + toplamGecen + "   KALAN: " + toplamKalan);
console.log("═".repeat(60));
process.exit(toplamKalan === 0 ? 0 : 1);
