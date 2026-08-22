/**
 * AI Koçum — hesap / oturum istemcisi (Dilim 2)
 * ---------------------------------------------------------------
 * Sunucu API'sine (sunucu/api) tek kapidan konusur. Amac: paket, deneme
 * suresi ve rol kararinin ISTEMCIDEN SUNUCUYA tasinmasi (red-team
 * B-1/B-2/B-3). Calisma verisi (program, netler) bu dilimde hala cihazda.
 *
 * Ilkeler:
 *  - Token yalnizca localStorage "aikocum_oturum" anahtarinda; state'e
 *    (slamdunk_yks_state) ASLA yazilmaz -> dışa aktarma/yedek dosyalarina sizmaz.
 *  - Cevrimdisi-once: sunucuya ulasilamazsa son bilinen hesap bilgisi
 *    kullanilir; 7 gunden eskiyse guvenli tarafa (kilitli) dusulur.
 *  - 401 = oturum gecersiz: token silinir, kullaniciya giris sorulur.
 */
const Hesap = {
  ANAHTAR: "aikocum_oturum",
  API: "/api",
  TAZELIK_GUN: 7,
  app: null,

  bagla: function(appRef) { this.app = appRef; return this; },

  // ---- token --------------------------------------------------------
  token: function() {
    try { return (localStorage.getItem(this.ANAHTAR) || "").trim(); } catch (e) { return ""; }
  },
  tokenYaz: function(t) { try { localStorage.setItem(this.ANAHTAR, t); } catch (e) {} },
  tokenSil: function() { try { localStorage.removeItem(this.ANAHTAR); } catch (e) {} },
  varMi: function() { return this.token().length > 0; },

  // ---- ham istek ----------------------------------------------------
  // Donus: { ok, kod, ...sunucu govdesi }. Ag hatasi: { ok:false, kod:0, ag:true }
  istek: async function(yol, secenek) {
    const s = secenek || {};
    const basliklar = { "Accept": "application/json" };
    if (s.govde) basliklar["Content-Type"] = "application/json";
    if (s.yetki !== false && this.token()) basliklar["Authorization"] = "Bearer " + this.token();
    let r;
    try {
      r = await fetch(this.API + yol, {
        method: s.yontem || "GET",
        headers: basliklar,
        body: s.govde ? JSON.stringify(s.govde) : undefined,
        credentials: "same-origin"
      });
    } catch (e) {
      return { ok: false, kod: 0, ag: true, hata: "Sunucuya ulaşılamadı" };
    }
    let d = {};
    try { d = await r.json(); } catch (e) {}
    return Object.assign({ kod: r.status }, d, { ok: !!r.ok && d.ok !== false });
  },

  cihazAdi: function() {
    try { return String(navigator.userAgent || "").slice(0, 120); } catch (e) { return ""; }
  },

  // ---- uc noktalar --------------------------------------------------
  kayit: async function(eposta, parola, ad) {
    const s = await this.istek("/kayit", { yontem: "POST", yetki: false,
      govde: { eposta: eposta, parola: parola, ad: ad || "", cihaz: this.cihazAdi() } });
    if (s.ok && s.token) { this.tokenYaz(s.token); this.uygula(s.kullanici); }
    return s;
  },

  giris: async function(eposta, parola) {
    const s = await this.istek("/giris", { yontem: "POST", yetki: false,
      govde: { eposta: eposta, parola: parola, cihaz: this.cihazAdi() } });
    if (s.ok && s.token) { this.tokenYaz(s.token); this.uygula(s.kullanici); }
    return s;
  },

  cikis: async function() {
    if (this.varMi()) { try { await this.istek("/cikis", { yontem: "POST" }); } catch (e) {} }
    this.tokenSil();
    if (this.app && this.app.state) { this.app.state.sunucuHesap = null; this.app.saveState(); }
  },

  // Sunucudan guncel hesap bilgisini ceker; token yoksa hic istek atmaz.
  ben: async function() {
    if (!this.varMi()) return { ok: false, kod: 0, yok: true };
    const s = await this.istek("/ben");
    if (s.ok) this.uygula(s.kullanici);
    else if (s.kod === 401) {
      // Oturum sunucuda gecersiz (cikis yapilmis / suresi dolmus)
      this.tokenSil();
      if (this.app && this.app.state) { this.app.state.sunucuHesap = null; this.app.saveState(); }
    }
    return s;
  },

  // ---- state'e uygulama --------------------------------------------
  // Sunucunun "kullanici" gorunumunu state.sunucuHesap'a yazar ve yerel
  // paket alanini sunucuyla hizalar. Yetki karari bundan sonra
  // app.aktifPaketSeviyesi() icinde sunucuHesap'tan okunur.
  uygula: function(k) {
    if (!this.app || !this.app.state || !k) return;
    this.app.state.sunucuHesap = {
      id: k.id, eposta: k.eposta, ad: k.ad, rol: k.rol,
      paket: k.paket, deneme_bitti: !!k.deneme_bitti,
      deneme_kalan_gun: typeof k.deneme_kalan_gun === "number" ? k.deneme_kalan_gun : null,
      senk: Date.now()
    };
    this.app.state.subscriptionTier = this.yerelPaket(k.paket);
    if (k.eposta && !this.app.state.email) this.app.state.email = k.eposta;
    if (k.ad && !this.app.state.name) this.app.state.name = k.ad;
    this.app.saveState();
    if (typeof this.app.paketKilitleriniUygula === "function") {
      try { this.app.paketKilitleriniUygula(); } catch (e) {}
    }
  },

  // Sunucu paket adi -> istemcinin PAKET_SEVIYE anahtari
  yerelPaket: function(p) {
    if (p === "deneme") return "trial";
    return p || "free";
  },

  // Son senkron yeterince taze mi? (cevrimdisi karar icin)
  taze: function() {
    const h = this.app && this.app.state && this.app.state.sunucuHesap;
    return !!h && (Date.now() - (h.senk || 0)) < this.TAZELIK_GUN * 86400000;
  }
};

if (typeof window !== "undefined") window.Hesap = Hesap;
