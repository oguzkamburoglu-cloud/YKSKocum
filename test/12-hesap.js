// ============================================================
// GRUP 12 — Hesap / oturum istemcisi (Dilim 2)
// ------------------------------------------------------------
// Yetki karari sunucuya tasindi: state.sunucuHesap doluysa paket ORADAN
// okunur; istemcideki subscriptionTier/trialStartDate artik yalnizca
// hesapsiz (eski) kullanicilar icin yedektir. Bu dosya:
//   - token saklama (state'e DEGIL, ayri anahtara)
//   - sunucu paketinin kilit kararina yansimasi (B-1/B-3 kapanisi)
//   - 401'de token dusmesi, ag hatasinda son bilinenin korunmasi
//   - sihirbaz parola dogrulamasi ve deneme baslatma akisi
// fetch, harness'in window.__fetch kancasiyla kurgulanir.
// ============================================================
load("test/harness.js");
const app = appYukle();
const Hesap = window.Hesap;

function taze() {
  elemanlariTemizle();
  localStorage.clear();
  app.state = {
    startDate: "2026-08-21", daysData: {}, subscriptionTier: "pending", trialStartDate: null,
    sunucuHesap: null, hesapBekliyor: false, name: "Ada", email: "ada@ornek.com",
    track: "Sayısal", examFocus: "both", isLoggedOut: false
  };
  app.MONETIZATION_ENABLED = true;
  app.saveState = function () {};
  app.paketKilitleriniUygula = function () {};
  app.showToast = function () {};
  app.openModal = function (id) { app._acilanModal = id; };
  app.closeModal = function () {};
  app.startMainDashboard = function () { app._panelAcildi = true; };
  app._acilanModal = null; app._panelAcildi = false; app._kayitParola = null;
  Hesap.bagla(app);
  Hesap.tokenSil();
}
const kullanici = (ek) => Object.assign({ id: 1, eposta: "ada@ornek.com", ad: "Ada", rol: "ogrenci",
  paket: "deneme", deneme_bitti: false, deneme_kalan_gun: 7, sunucu_zamani: 1787400000 }, ek || {});

(async function () {

T.grup("12.1  Token saklama");
taze();
T.dogru("Hesap modulu yuklendi", !!Hesap && typeof Hesap.ben === "function", true);
T.esit("baslangicta token yok", Hesap.varMi(), false);
Hesap.tokenYaz("abc-123");
T.esit("token yazildi", Hesap.token(), "abc-123");
T.dogru("token state'e SIZMIYOR", JSON.stringify(app.state).indexOf("abc-123") === -1, true);
T.dogru("token ayri anahtarda", localStorage.getItem("aikocum_oturum") === "abc-123", true);
Hesap.tokenSil();
T.esit("token silindi", Hesap.varMi(), false);

T.grup("12.2  Sunucu paketi kilit kararini belirler (B-1 / B-3)");
taze();
// Hesapsiz: eski yerel mantik yedek olarak calisir
app.state.subscriptionTier = "pro";
T.esit("hesapsiz: yerel tier okunur (yedek)", app.aktifPaketSeviyesi(), 3);

// Hesap bagli + sunucu 'free' diyor: konsoldan tier='pro' yazmak ise yaramaz
Hesap.uygula(kullanici({ paket: "free", deneme_bitti: true, deneme_kalan_gun: 0 }));
app.state.subscriptionTier = "pro";            // SALDIRI: konsol enjeksiyonu
T.esit("sunucu free diyorsa seviye 0 (konsol 'pro' ise yaramaz)", app.aktifPaketSeviyesi(), 0);
T.esit("deneme bitti karari sunucudan", app.denemeBittiMi(), true);

// Sunucu deneme diyor: tam erisim
Hesap.uygula(kullanici({ paket: "deneme" }));
T.esit("sunucu deneme -> trial seviyesi (3)", app.aktifPaketSeviyesi(), 3);
T.esit("yerel tier sunucuyla hizalandi", app.state.subscriptionTier, "trial");
app.state.trialStartDate = "2000-01-01T00:00:00.000Z";   // SALDIRI: yerel tarih oynama
T.esit("yerel trialStartDate manipulasyonu kararı degistirmez", app.denemeBittiMi(), false);

Hesap.uygula(kullanici({ paket: "standart" }));
T.esit("sunucu standart -> 2", app.aktifPaketSeviyesi(), 2);
Hesap.uygula(kullanici({ paket: "uydurma" }));
T.esit("bilinmeyen sunucu paketi -> 0 (guvenli)", app.aktifPaketSeviyesi(), 0);

T.grup("12.3  ben(): sunucu yaniti ve 401");
taze();
Hesap.tokenYaz("gecerli-token-xxxxxxxxxxxxxxxxxxxxxxxxxx");
let sonIstek = null;
window.__fetch = async function (url, opts) {
  sonIstek = { url: url, opts: opts };
  return sahteYanit(200, { ok: true, kullanici: kullanici({ paket: "pro", deneme_kalan_gun: 0 }) });
};
let s = await Hesap.ben();
T.esit("ben ok", s.ok, true);
T.esit("istek /api/ben'e gitti", sonIstek.url, "/api/ben");
T.dogru("Bearer basligi gonderildi", /^Bearer gecerli-token/.test(sonIstek.opts.headers.Authorization), true);
T.esit("sunucu pro -> seviye 3", app.aktifPaketSeviyesi(), 3);
T.esit("sunucuHesap.paket yazildi", app.state.sunucuHesap.paket, "pro");

window.__fetch = async function () { return sahteYanit(401, { ok: false, hata: "Oturum gerekli" }); };
s = await Hesap.ben();
T.esit("401 -> ok false", s.ok, false);
T.esit("401 -> token silindi", Hesap.varMi(), false);
T.esit("401 -> sunucuHesap temizlendi", app.state.sunucuHesap, null);

taze();
T.esit("token yokken ben() istek atmaz", (await Hesap.ben()).yok, true);

T.grup("12.4  Ag hatasi: son bilinen korunur, tazelik");
taze();
Hesap.tokenYaz("t-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
Hesap.uygula(kullanici({ paket: "standart" }));
window.__fetch = async function () { throw new Error("offline"); };
s = await Hesap.ben();
T.esit("ag hatasi bayragi", s.ag, true);
T.esit("ag hatasinda token DUSMEZ", Hesap.varMi(), true);
T.esit("ag hatasinda son bilinen paket korunur", app.aktifPaketSeviyesi(), 2);
T.esit("senk tazedir", Hesap.taze(), true);
app.state.sunucuHesap.senk = Date.now() - 8 * 86400000;
T.esit("8 gun eski senk taze degil", Hesap.taze(), false);

T.grup("12.5  kayit() / giris() / cikis()");
taze();
let govde = null;
window.__fetch = async function (url, opts) {
  govde = JSON.parse(opts.body);
  return sahteYanit(201, { ok: true, token: "yeni-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxx", kullanici: kullanici() });
};
s = await Hesap.kayit("ada@ornek.com", "Guclu-Parola-1", "Ada");
T.esit("kayit ok", s.ok, true);
T.esit("govde eposta", govde.eposta, "ada@ornek.com");
T.esit("govde parola gonderildi", govde.parola, "Guclu-Parola-1");
T.esit("token saklandi", Hesap.token(), "yeni-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxx");
T.esit("sunucuHesap kuruldu", app.state.sunucuHesap.eposta, "ada@ornek.com");
T.dogru("parola state'e SIZMADI", JSON.stringify(app.state).indexOf("Guclu-Parola-1") === -1, true);

window.__fetch = async function () { return sahteYanit(200, { ok: true }); };
await Hesap.cikis();
T.esit("cikis -> token silindi", Hesap.varMi(), false);
T.esit("cikis -> sunucuHesap null", app.state.sunucuHesap, null);

window.__fetch = async function () { return sahteYanit(401, { ok: false, hata: "E-posta veya parola hatalı" }); };
s = await Hesap.giris("ada@ornek.com", "yanlis");
T.esit("yanlis giris ok=false", s.ok, false);
T.esit("yanlis giris token vermez", Hesap.varMi(), false);

T.grup("12.6  Sihirbaz parola dogrulamasi");
taze();
["studentName", "studentEmail", "studentPassword", "studentPasswordError", "studentEmailError", "targetDepartment"].forEach(elemanEkle);
app.state.targetRank = 50000;
app.showWizardPage = function (n) { app._sayfa = n; };
app.checkHabitsFeedback = function () {};
document.getElementById("studentName").value = "Ada Lovelace";
document.getElementById("studentEmail").value = "ada@ornek.com";
document.getElementById("studentPassword").value = "kisa";
app.nextWizardPage();
T.dogru("kisa parola: ilerlemedi", app._sayfa !== 2, true);
T.dogru("kisa parola: hata metni", /8 karakter/.test(document.getElementById("studentPasswordError").textContent), true);
document.getElementById("studentPassword").value = "Guclu-Parola-1";
app.nextWizardPage();
T.esit("gecerli parola: 2. sayfaya gecti", app._sayfa, 2);
T.esit("parola bellekte (deneme icin)", app._kayitParola, "Guclu-Parola-1");
T.dogru("parola state'te DEGIL", JSON.stringify(app.state).indexOf("Guclu-Parola-1") === -1, true);

// Zaten giris yapilmissa parola istenmez
taze();
["studentName", "studentEmail", "studentPassword", "studentPasswordError", "studentEmailError", "targetDepartment"].forEach(elemanEkle);
app.state.targetRank = 50000; app.showWizardPage = function (n) { app._sayfa = n; }; app.checkHabitsFeedback = function () {};
Hesap.tokenYaz("var-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
document.getElementById("studentName").value = "Ada"; document.getElementById("studentEmail").value = "ada@ornek.com";
document.getElementById("studentPassword").value = "";
app.nextWizardPage();
T.esit("giris yapilmis: parolasiz ilerledi", app._sayfa, 2);

T.grup("12.7  Deneme baslatma hesap acar");
taze();
elemanEkle("subscriptionModal");
app._kayitParola = "Guclu-Parola-1";
let kayitGovde = null;
window.__fetch = async function (url, opts) {
  kayitGovde = { url: url, govde: JSON.parse(opts.body) };
  return sahteYanit(201, { ok: true, token: "tok-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", kullanici: kullanici() });
};
await app.upgradeToPro("trial");
T.esit("deneme -> /api/kayit cagrildi", kayitGovde.url, "/api/kayit");
T.esit("kayit sihirbaz e-postasiyla", kayitGovde.govde.eposta, "ada@ornek.com");
T.esit("deneme sunucudan: tier trial", app.state.subscriptionTier, "trial");
T.esit("parola bellekten silindi", app._kayitParola, null);
T.esit("panel acildi", app._panelAcildi, true);
T.esit("yerel trialStartDate YAZILMADI (sunucu saati gecerli)", app.state.trialStartDate, null);

// 409: e-posta kayitli -> giris modali, deneme BASLAMAZ
taze(); elemanEkle("subscriptionModal"); elemanEkle("hesapGirisHata"); elemanEkle("hesapGirisEposta");
app._kayitParola = "Guclu-Parola-1";
window.__fetch = async function () { return sahteYanit(409, { ok: false, hata: "Bu e-posta zaten kayıtlı" }); };
await app.upgradeToPro("trial");
T.esit("409 -> giris modali acildi", app._acilanModal, "hesapGirisModal");
T.esit("409 -> panel ACILMADI", app._panelAcildi, false);
T.esit("409 -> tier degismedi", app.state.subscriptionTier, "pending");

// Parola yok (sayfa yenilendi): giris modali
taze(); elemanEkle("subscriptionModal"); elemanEkle("hesapGirisHata"); elemanEkle("hesapGirisEposta");
await app.upgradeToPro("trial");
T.esit("parola yokken giris modali", app._acilanModal, "hesapGirisModal");

// Cevrimdisi: yerel deneme yedek olarak baslar, hesap beklemede
taze(); elemanEkle("subscriptionModal");
app._kayitParola = "Guclu-Parola-1";
window.__fetch = async function () { throw new Error("offline"); };
await app.upgradeToPro("trial");
T.esit("cevrimdisi -> yerel deneme basladi", app.state.subscriptionTier, "trial");
T.esit("cevrimdisi -> hesapBekliyor", app.state.hesapBekliyor, true);
T.esit("cevrimdisi -> panel acildi", app._panelAcildi, true);

window.__fetch = undefined;
T.ozet();
})();
