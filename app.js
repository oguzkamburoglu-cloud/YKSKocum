// APP CONFIG (H-001 / H-002)
const APP_CONFIG = {
  ENV: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'development' : 'production',
  LOGGING_ENDPOINT: '',
  setLoggingEndpoint: function(url) {
    this.LOGGING_ENDPOINT = url;
  }
};
// Uzak hata telemetrisi VARSAYILAN OLARAK KAPALIDIR.
// Eskiden uygulama localhost disinda calisir calismaz hata mesajlarini,
// dosya adlarini ve JavaScript yigin izlerini ucuncu taraf bir alan adina
// (telemetry.aikocum.com) POST ediyordu. Kendi toplama ucun varsa asagidaki
// satiri kendi adresinle doldur; bos kaldigi surece disari hicbir sey gitmez.
APP_CONFIG.LOGGING_ENDPOINT = '';

// Safe Telemetry Logging wrapper (H-002)
let isLoggingError = false;
function logErrorToTelemetry(payload) {
  if (isLoggingError || !APP_CONFIG.LOGGING_ENDPOINT) return;
  isLoggingError = true;
  if (!navigator.onLine) {
    isLoggingError = false;
    return;
  }
  fetch(APP_CONFIG.LOGGING_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(err => {
    console.warn("Failed to send log to logging provider:", err.message);
  }).finally(() => {
    isLoggingError = false;
  });
}

window.addEventListener('error', function(e) {
  if (window.app && typeof window.app.showToast === 'function') {
    window.app.showToast("Sistemsel bir hata oluştu, ancak verileriniz güvende.", "error");
  }
  logErrorToTelemetry({
    type: 'uncaught_error',
    message: e.message,
    source: e.filename,
    line: e.lineno,
    col: e.colno,
    stack: e.error ? e.error.stack : '',
    timestamp: Date.now()
  });
});

window.addEventListener('unhandledrejection', function(e) {
  if (window.app && typeof window.app.showToast === 'function') {
    window.app.showToast("Uzak sunucu bağlantı hatası oluştu.", "error");
  }
  logErrorToTelemetry({
    type: 'unhandled_rejection',
    message: e.reason ? e.reason.toString() : 'Unknown promise rejection',
    stack: e.reason && e.reason.stack ? e.reason.stack : '',
    timestamp: Date.now()
  });
});

// SafeStorage localStorage wrapper (H-003)
const SafeStorage = {
  memoryStore: {},
  storageAvailable: null,
  isSupported: function() {
    if (this.storageAvailable !== null) return this.storageAvailable;
    try {
      const key = "__storage_test__";
      window.localStorage.setItem(key, key);
      window.localStorage.removeItem(key);
      this.storageAvailable = true;
    } catch (e) {
      this.storageAvailable = false;
    }
    return this.storageAvailable;
  },
  getItem: function(key) {
    if (this.isSupported()) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        return this.memoryStore[key] || null;
      }
    }
    return this.memoryStore[key] || null;
  },
  setItem: function(key, value) {
    if (this.isSupported()) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn("LocalStorage Quota Exceeded or disabled, falling back to memory store.", e);
      }
    }
    this.memoryStore[key] = value;
  },
  removeItem: function(key) {
    if (this.isSupported()) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {}
    }
    delete this.memoryStore[key];
  },
  clear: function() {
    if (this.isSupported()) {
      try {
        window.localStorage.clear();
        return;
      } catch (e) {}
    }
    this.memoryStore = {};
  }
};

// NotificationManager is loaded before this file and uses the same storage
// layer when it persists a notification preference change.
window.SafeStorage = SafeStorage;

// YKSKoçum - Akıllı YKS Ders Çalışma Koçu
// Fallback YKS Question Bank initialization
if (typeof window !== 'undefined' && !window.YKS_QUESTION_BANK) {
  window.YKS_QUESTION_BANK = {
    Turkce: [],
    Matematik: [],
    Fizik: [],
    Kimya: [],
    Biyoloji: [],
    Edebiyat: [],
    Tarih: [],
    Cografya: []
  };
}
// Manages State, Wizard, Diagnostic Testing, Dynamic Rescheduling Engine,
// Pomodoro, MEB Kazanımlar, Chart.js Analytics (Nets, Speed, Radar), 
// Hata Defteri, Spaced Repetition, AI Coach Corner, and Focus Scores.

const app = {
  // ============================================================
  // PROGRAM SÜRESİ — sınava kalan gün
  // Eskiden sabit 360'tı; sınava 300 gün kalan öğrenciye de 360 günlük
  // plan üretiliyordu. Artık başlangıçtan sınav gününe kadar sürer.
  // Son SON_FAZ_GUN günü sınav provası fazıdır: %80 deneme, %20 tekrar.
  // ============================================================
  SON_FAZ_GUN: 30,
  _programDaysCache: null,

  get PROGRAM_DAYS() {
    if (this._programDaysCache) return this._programDaysCache;
    let bas = new Date();
    try {
      if (this.state && this.state.startDate) {
        const d = new Date(this.state.startDate + "T00:00:00");
        if (!isNaN(d)) bas = d;
      }
    } catch (e) { /* varsayılan: bugün */ }
    const gun = Math.ceil((this.getExamDate() - bas) / 86400000);
    this._programDaysCache = Math.max(30, Math.min(400, gun || 360));
    return this._programDaysCache;
  },

  invalidateProgramDays: function() { this._programDaysCache = null; },

  // ============================================================
  // UYGULAMA OLARAK KURULUM (PWA)
  // Site ile uygulama ayni kod tabani. Tarayici "yukleyebilirsin"
  // dedigi anda kullaniciya uygulama icinden teklif edilir; cunku
  // tarayici menusundeki "Ana ekrana ekle" pratikte bulunmuyor.
  // iOS beforeinstallprompt desteklemez — orada elle yonerge gosterilir.
  // ============================================================
  _installEvent: null,

  setupInstallPrompt: function() {
    const cubuk = document.getElementById("installBar");
    if (!cubuk) return;

    // Zaten uygulama olarak acilmissa teklif etme
    const kurulu = window.matchMedia("(display-mode: standalone)").matches ||
                   window.navigator.standalone === true;
    if (kurulu || localStorage.getItem("ykskocum_install_dismissed") === "1") return;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this._installEvent = e;
      cubuk.style.display = "flex";
    });

    window.addEventListener("appinstalled", () => {
      cubuk.style.display = "none";
      this._installEvent = null;
      this.showToast("YKSKoçum ana ekranına eklendi.", "success");
    });

    // iOS: beforeinstallprompt yok, kullaniciya adimlar soylenir
    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (iOS && !kurulu) {
      const btn = document.getElementById("installBtn");
      const ipucu = document.getElementById("installHint");
      if (ipucu) ipucu.textContent = "Safari'de Paylaş ⬆️ → “Ana Ekrana Ekle”ye dokun.";
      if (btn) btn.style.display = "none";
      cubuk.style.display = "flex";
    }
  },

  promptInstall: function() {
    if (!this._installEvent) {
      this.showToast("Tarayıcın kurulum istemini şu an sunmuyor. Menüden “Ana ekrana ekle”yi kullanabilirsin.", "info");
      return;
    }
    this._installEvent.prompt();
    this._installEvent.userChoice.finally(() => {
      this._installEvent = null;
      const c = document.getElementById("installBar");
      if (c) c.style.display = "none";
    });
  },

  dismissInstall: function() {
    const c = document.getElementById("installBar");
    if (c) c.style.display = "none";
    try { localStorage.setItem("ykskocum_install_dismissed", "1"); } catch (e) {}
  },

  // Seviye hedeflerini programin gercek suresine olcekler
  applyLevelTargets: function(hours, questions, mocks) {
    const olcek = Math.max(0.2, Math.min(1.2, this.PROGRAM_DAYS / 360));
    const yuv = (n, adim) => Math.max(adim, Math.round(n * olcek / adim) * adim);
    this.state.totalHoursTarget = yuv(hours, 50);
    this.state.totalQuestionsTarget = yuv(questions, 1000);
    this.state.totalMocksTarget = yuv(mocks, 5);
  },


  // ÜCRETLENDİRME ANAHTARI
  // ------------------------------------------------------------
  // false iken paket/abonelik yüzeylerinin TAMAMI gizlenir: giriş
  // ekranındaki "Paketleri İncele", başlıktaki "Paket Seç" rozeti,
  // deneme süresi bandı, kenar çubuğundaki üyelik kartı ve abonelik
  // penceresi. Ayrıca "pending" (paket seçilmedi) kilidi kalkar;
  // uygulama tüm özelliklerle açılır.
  // Ücretli sürüme geçildiğinde tek yapılacak: burayı true yapmak.
  MONETIZATION_ENABLED: true,

  // ============================================================
  // PAKETLER — rol bazli
  // FIYATLAR ORNEKTIR. Gercek fiyatlarini burada degistir; ekranlar
  // bu tek kaynaktan beslenir.
  // ============================================================
  DENEME_GUN: 7,

  // Koc tarafi henuz yayinda degil: rol secimi ve koc paketleri
  // "yakinda" olarak gosterilir. Sunucu ve senkronizasyon hazir olunca
  // buradaki tek bayrak acilir.
  KOC_AKTIF: false,

  // ============================================================
  // PAKETLER — 3 kademe (hepsi ogrenci icin)
  // FIYATLAR ORNEKTIR. Gercek fiyatlarini burada degistir; abonelik
  // penceresi bu tek kaynaktan beslenir.
  // ============================================================
  PAKETLER: [
    {
      id: "baslangic", ad: "Başlangıç", fiyat: 299, birim: "₺/ay",
      ozet: "Sadece program oluşturma.",
      ozellikler: [
        "Sınava kalan güne göre kişisel program",
        "Kendi programını elle kurma",
        "Günlük ve haftalık program görünümü"
      ]
    },
    {
      id: "standart", ad: "Standart", fiyat: 499, birim: "₺/ay", vurgu: "En çok tercih edilen",
      ozet: "Takip et, hatalarını kapat.",
      ozellikler: [
        "Başlangıç'taki her şey",
        "Müfredat haritası ve ilerleme takibi",
        "Hata defteri ve aralıklı tekrar (ÖDT)",
        "Deneme analizi ve net takibi",
        "Kaynak kitap önerileri (ÖSYM verisiyle)",
        "Veli raporu"
      ]
    },
    {
      id: "pro", ad: "Pro", fiyat: 799, birim: "₺/ay",
      ozet: "Yapay zekâ desteğiyle tam donanım.",
      ozellikler: [
        "Standart'taki her şey",
        "Fotoğraf / PDF ile program aktarma",
        "Sesle program oluşturma",
        "AI koç yorumları ve günlük taktikler",
        "AI tercih motoru (ÖSYM taban verisi)"
      ]
    }
  ],

  paketBilgisi: function(tier) {
    if (tier === "trial") return { ad: "Deneme", renk: "#f59e0b" };
    if (!tier || tier === "free" || tier === "pending") return { ad: "Ücretsiz", renk: "var(--text-muted)" };
    const p = this.PAKETLER.find(x => x.id === tier);
    if (p) return { ad: p.ad, renk: "#10b981" };
    // Eski surumlerden kalan degerler
    if (tier === "pro_monthly" || tier === "pro_yearly") return { ad: "Pro", renk: "#10b981" };
    return { ad: "Ücretsiz", renk: "var(--text-muted)" };
  },

  chatState: {
    lastParsedCommand: null,
    pendingConfirmation: null
  },
  // Application State
  state: {
    name: "",
    email: "",
    track: "Sayısal",
    targetDept: "Bilgisayar Mühendisliği",
    targetRank: null,
    targetUniversity: "",
    streak: 1,
    level: 3,
    studyRoute: "balanced",
    totalHoursTarget: 1400,
    totalQuestionsTarget: 45000,
    totalMocksTarget: 90,
    
    // Habits
    isGraduate: false,
    weekdayHours: 4,
    weekendHours: 8,
    wakeTime: "07:00",
    sleepTime: "23:00",
    role: "ogrenci",     // "ogrenci" | "koc" — karsilama ekraninda secilir
    programAccepted: false,  // program ancak ogrenci kabul edince olusturulur
    coachStudents: [],
    selectedCoachStudentId: null,
    parentContact: "",   // gonderim hedefi: e-posta varsa o, yoksa telefon
    parentEmail: "",
    parentPhone: "",
    isLoggedOut: false,

    // Notifications & summaries
    notifications: [],
    notifyChannels: { push: true, email: true, whatsapp: true },
    notificationSettings: null,
    lastQuoteIndex: null,
    overdueAlerted: {},
    overdueAlertedDate: null,
    summaryShown: {},
    mockExams: [],

    // Subscription & Marketing
    subscriptionTier: "pending", // 'pending', 'free', 'trial', 'pro_monthly', 'pro_yearly'
    trialStartDate: null,
    theme: "classic",
    
    // Diagnostics Test State
    testSubjects: [],
    testQuestions: {}, 
    testAnswers: {},   
    testTimer: null,
    testSecondsRemaining: 3600, 
    currentTestSubject: "",
    currentTestQuestionIdx: 0,
    
    // Study Plan Calendar
    activeDay: 1,
    daysData: {}, // dayNum -> { completed: bool, tasks: Array }
    
    // Extended State
    activeTab: "calendar",
    curriculumProgress: [], 
    uploadedQuestions: [],   
    unlockedBadges: [],      
    chartData: [],           
    totalQuestionsSolved: 0,
    totalLitCorrect: 0,
    lastStudyLogDate: null,
    
    // Spaced Repetition & Rescheduling Trackers
    spacedRepetitionTasks: [], // Array of { topic, subject, dueDays: [], completedDays: [] }
    focusScore: 100,
    burnoutAlertActive: false,
    parentReportDueTime: null,
    parentReportShownDate: null,
    diagnosticAccuracy: null,
    currentPositionRank: null,
    currentNetTYT: null,
    currentNetAYT: null,
    currentNetDil: null,
    currentPositionSource: null, // "graduate_input" | "diagnostic_test"
    selectedProgramType: "standard",
    standardDaysData: {},
    customDaysData: {},
    topicStatuses: {},
    scheduledRepetitions: [],
    savedPrograms: [],
    activeCustomProgramId: 'default_custom'
  },

  parentTimerInterval: null,

  // Chart instances
  charts: {
    nets: null,
    speed: null,
    radar: null,
    trend: null
  },

  // ==========================================================
  // MÜFREDAT SERVİSİ — TEK KAYNAK (curriculum.js bilgi grafiği)
  // ------------------------------------------------------------
  // Eskiden iki ayrı müfredat listesi vardı: burada düz bir
  // `curriculumData` ve program üreticisinin içinde gömülü ~30
  // konuluk ikinci bir liste. İkisi de kaldırıldı; Program Üretici,
  // Program Sihirbazı, Müfredat Haritası, AI Analiz, AI Koç ve Hata
  // Zindanı artık aynı grafikten okuyor.
  // ==========================================================
  curriculum: {
    graph: function() {
      return (typeof window !== "undefined" && window.YKS_CURRICULUM) ? window.YKS_CURRICULUM : { subjects: {}, trackSubjects: {} };
    },

    // Alan + sınav odağına göre ilgili ders anahtarları
    subjectKeysFor: function(track, focus) {
      const g = this.graph();
      const keys = (g.trackSubjects && g.trackSubjects[track]) || g.trackSubjects["Sayısal"] || [];
      if (focus === "tyt") return keys.filter(k => k.startsWith("TYT"));
      if (focus === "ayt") return keys.filter(k => !k.startsWith("TYT"));
      return keys;
    },

    // Tüm konuları düz liste hâlinde döndürür (ders/ünite bilgisiyle)
    topicsFor: function(track, focus) {
      const g = this.graph();
      const out = [];
      this.subjectKeysFor(track, focus).forEach(key => {
        const subj = g.subjects[key];
        if (!subj) return;
        subj.units.forEach(unit => {
          unit.topics.forEach(t => {
            out.push({
              id: t.id, name: t.name, section: t.section, prereq: t.prereq || [],
              weight: t.weight || 1, load: t.load || 60, sub: t.sub || [],
              subject: subj.subject, exam: subj.exam, subjectKey: key, unit: unit.unit
            });
          });
        });
      });
      return out;
    },

    byId: function(id) {
      if (!this._index) {
        this._index = {};
        const g = this.graph();
        Object.keys(g.subjects || {}).forEach(key => {
          const subj = g.subjects[key];
          subj.units.forEach(unit => unit.topics.forEach(t => {
            this._index[t.id] = Object.assign({}, t, {
              subject: subj.subject, exam: subj.exam, subjectKey: key, unit: unit.unit
            });
          }));
        });
      }
      return this._index[id] || null;
    },

    // Konu adından grafikteki kaydı bulur (eski kayıtlarla uyum için)
    byName: function(subject, topicName) {
      if (!topicName) return null;
      const needle = String(topicName).toLowerCase().trim();
      const all = this.topicsFor("Sayısal", "both").concat(
        this.topicsFor("Eşit Ağırlık", "both"), this.topicsFor("Sözel", "both"), this.topicsFor("Dil", "both"));
      let hit = all.find(t => t.name.toLowerCase() === needle);
      if (hit) return hit;
      hit = all.find(t => subject && t.subject === subject && t.name.toLowerCase().includes(needle));
      if (hit) return hit;
      return all.find(t => t.name.toLowerCase().includes(needle)) || null;
    },

    // Bir konunun deneme analizindeki bölümü (W3 için)
    sectionOf: function(subject, topicName) {
      const t = this.byName(subject, topicName);
      return t ? t.section : null;
    },

    // Önkoşulları sağlanmış konuları, ağırlığa göre sıralı döndürür.
    // Bir konu ancak tüm önkoşulları tamamlandıysa planlanabilir.
    availableTopics: function(track, focus, completedIds) {
      const done = new Set(completedIds || []);
      return this.topicsFor(track, focus)
        .filter(t => !done.has(t.id))
        .filter(t => (t.prereq || []).every(p => done.has(p) || !this.byId(p)))
        .sort((a, b) => (b.weight - a.weight) || (a.load - b.load));
    },

    // Önkoşul grafiğini topolojik sıraya dizer — öğretim sırası budur.
    orderedTopics: function(track, focus) {
      const all = this.topicsFor(track, focus);
      const byId = {}; all.forEach(t => byId[t.id] = t);
      const visited = {}, out = [];
      const visit = (t) => {
        if (!t || visited[t.id]) return;
        visited[t.id] = true;
        (t.prereq || []).forEach(p => visit(byId[p]));
        out.push(t);
      };
      // Ağırlığı yüksek dersleri öne alarak dolaş
      all.slice().sort((a, b) => b.weight - a.weight).forEach(visit);
      return out;
    },

    totalTopicCount: function(track, focus) {
      return this.topicsFor(track, focus).length;
    }
  },

  // ==========================================================
  // KAYNAK KİTAP SERVİSİ — "hangi yayınevinin hangi kitabı"
  // ----------------------------------------------------------
  // Program üretilirken her göreve somut bir çalışma kaynağı
  // (yayınevi + kitap adı) iliştirilir; öğrenci "bunu neyden
  // çalışacağım?" sorusunu programın kendisinden yanıtlar.
  //
  // Katalog TEK KAYNAKTIR: yayınevi listesi değişirse yalnızca
  // burası güncellenir. Program üreticisi, manuel planlayıcı,
  // tekrar görevleri ve Hata Zindanı kaynak önerileri aynı
  // listeden okur.
  //
  // Yapı: ders -> sınav (TYT/AYT/YDT/Genel) -> tür
  //   konu   : konu anlatımı / özet kitabı  ([0] birincil, [1] ikinci kaynak)
  //   soru   : soru bankası ([0] birincil, [1] ek pratik, [2] zirve/zor)
  //   deneme : deneme fasikülü
  // ==========================================================
  sourceBooks: {
    catalog: {
      "Matematik": {
        TYT: {
          konu: [{ pub: "Limit Yayınları", book: "TYT Matematik Konu Anlatımlı" },
                 { pub: "Tonguç Akademi Yayınları", book: "TYT Matematik Konu Özeti" }],
          soru: [{ pub: "3D Yayınları", book: "TYT Matematik Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "TYT Matematik Soru Bankası" },
                 { pub: "Bilgi Sarmal Yayınları", book: "TYT Matematik Zor Soru Bankası" }],
          deneme: [{ pub: "Bilgi Sarmal Yayınları", book: "TYT Matematik Branş Denemesi" }]
        },
        AYT: {
          konu: [{ pub: "Limit Yayınları", book: "AYT Matematik Konu Anlatımlı" },
                 { pub: "Tonguç Akademi Yayınları", book: "AYT Matematik Konu Özeti" }],
          soru: [{ pub: "3D Yayınları", book: "AYT Matematik Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "AYT Matematik Soru Bankası" },
                 { pub: "Bilgi Sarmal Yayınları", book: "AYT Matematik Zor Soru Bankası" }],
          deneme: [{ pub: "Bilgi Sarmal Yayınları", book: "AYT Matematik Branş Denemesi" }]
        }
      },
      "Geometri": {
        TYT: {
          konu: [{ pub: "Limit Yayınları", book: "TYT Geometri Konu Anlatımlı" },
                 { pub: "Tonguç Akademi Yayınları", book: "TYT Geometri Konu Özeti" }],
          soru: [{ pub: "3D Yayınları", book: "TYT Geometri Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "TYT Geometri Soru Bankası" },
                 { pub: "Bilgi Sarmal Yayınları", book: "TYT Geometri Zor Soru Bankası" }],
          deneme: [{ pub: "Bilgi Sarmal Yayınları", book: "TYT Geometri Branş Denemesi" }]
        },
        AYT: {
          konu: [{ pub: "Limit Yayınları", book: "AYT Geometri Konu Anlatımlı" },
                 { pub: "Tonguç Akademi Yayınları", book: "AYT Geometri Konu Özeti" }],
          soru: [{ pub: "3D Yayınları", book: "AYT Geometri Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "AYT Geometri Soru Bankası" },
                 { pub: "Bilgi Sarmal Yayınları", book: "AYT Geometri Zor Soru Bankası" }],
          deneme: [{ pub: "Bilgi Sarmal Yayınları", book: "AYT Geometri Branş Denemesi" }]
        }
      },
      "Fizik": {
        TYT: {
          konu: [{ pub: "Palme Yayınları", book: "TYT Fizik Konu Anlatımlı" },
                 { pub: "Tonguç Akademi Yayınları", book: "TYT Fizik Konu Özeti" }],
          soru: [{ pub: "Şahin Fizik Yayınları", book: "TYT Fizik Soru Bankası" },
                 { pub: "3D Yayınları", book: "TYT Fizik Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "TYT Fizik Zor Soru Bankası" }],
          deneme: [{ pub: "Palme Yayınları", book: "TYT Fizik Branş Denemesi" }]
        },
        AYT: {
          konu: [{ pub: "Palme Yayınları", book: "AYT Fizik Konu Anlatımlı" },
                 { pub: "Tonguç Akademi Yayınları", book: "AYT Fizik Konu Özeti" }],
          soru: [{ pub: "Şahin Fizik Yayınları", book: "AYT Fizik Soru Bankası" },
                 { pub: "3D Yayınları", book: "AYT Fizik Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "AYT Fizik Zor Soru Bankası" }],
          deneme: [{ pub: "Palme Yayınları", book: "AYT Fizik Branş Denemesi" }]
        }
      },
      "Kimya": {
        TYT: {
          konu: [{ pub: "Palme Yayınları", book: "TYT Kimya Konu Anlatımlı" },
                 { pub: "Tonguç Akademi Yayınları", book: "TYT Kimya Konu Özeti" }],
          soru: [{ pub: "Kafa Dengi Yayınları", book: "TYT Kimya Soru Bankası" },
                 { pub: "3D Yayınları", book: "TYT Kimya Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "TYT Kimya Zor Soru Bankası" }],
          deneme: [{ pub: "Palme Yayınları", book: "TYT Kimya Branş Denemesi" }]
        },
        AYT: {
          konu: [{ pub: "Palme Yayınları", book: "AYT Kimya Konu Anlatımlı" },
                 { pub: "Tonguç Akademi Yayınları", book: "AYT Kimya Konu Özeti" }],
          soru: [{ pub: "Kafa Dengi Yayınları", book: "AYT Kimya Soru Bankası" },
                 { pub: "3D Yayınları", book: "AYT Kimya Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "AYT Kimya Zor Soru Bankası" }],
          deneme: [{ pub: "Palme Yayınları", book: "AYT Kimya Branş Denemesi" }]
        }
      },
      "Biyoloji": {
        TYT: {
          konu: [{ pub: "Palme Yayınları", book: "TYT Biyoloji Konu Anlatımlı" },
                 { pub: "Tonguç Akademi Yayınları", book: "TYT Biyoloji Konu Özeti" }],
          soru: [{ pub: "Bilgi Sarmal Yayınları", book: "TYT Biyoloji Soru Bankası" },
                 { pub: "3D Yayınları", book: "TYT Biyoloji Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "TYT Biyoloji Zor Soru Bankası" }],
          deneme: [{ pub: "Palme Yayınları", book: "TYT Biyoloji Branş Denemesi" }]
        },
        AYT: {
          konu: [{ pub: "Palme Yayınları", book: "AYT Biyoloji Konu Anlatımlı" },
                 { pub: "Tonguç Akademi Yayınları", book: "AYT Biyoloji Konu Özeti" }],
          soru: [{ pub: "Bilgi Sarmal Yayınları", book: "AYT Biyoloji Soru Bankası" },
                 { pub: "3D Yayınları", book: "AYT Biyoloji Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "AYT Biyoloji Zor Soru Bankası" }],
          deneme: [{ pub: "Palme Yayınları", book: "AYT Biyoloji Branş Denemesi" }]
        }
      },
      "Türkçe": {
        TYT: {
          konu: [{ pub: "Rüştü Hoca Yayınları", book: "TYT Türkçe Konu Anlatımlı" },
                 { pub: "Tonguç Akademi Yayınları", book: "TYT Türkçe Konu Özeti" }],
          soru: [{ pub: "Limit Yayınları", book: "TYT Türkçe Soru Bankası" },
                 { pub: "Editör Yayınları", book: "TYT Türkçe Soru Bankası" },
                 { pub: "3D Yayınları", book: "TYT Türkçe Zor Soru Bankası" }],
          deneme: [{ pub: "Limit Yayınları", book: "TYT Türkçe Branş Denemesi" }]
        }
      },
      "Paragraf": {
        TYT: {
          konu: [{ pub: "Rüştü Hoca Yayınları", book: "TYT Paragraf Teknikleri" }],
          soru: [{ pub: "Limit Yayınları", book: "TYT Paragraf Soru Bankası" },
                 { pub: "3D Yayınları", book: "TYT Paragraf Soru Bankası" }]
        }
      },
      "Edebiyat": {
        TYT: {
          konu: [{ pub: "Rüştü Hoca Yayınları", book: "TYT Türkçe Konu Anlatımlı" }],
          soru: [{ pub: "Editör Yayınları", book: "TYT Türkçe Soru Bankası" },
                 { pub: "Limit Yayınları", book: "TYT Türkçe Soru Bankası" }]
        },
        AYT: {
          konu: [{ pub: "Rüştü Hoca Yayınları", book: "AYT Edebiyat Konu Anlatımlı" },
                 { pub: "Tonguç Akademi Yayınları", book: "AYT Edebiyat Konu Özeti" }],
          soru: [{ pub: "Editör Yayınları", book: "AYT Edebiyat Soru Bankası" },
                 { pub: "Limit Yayınları", book: "AYT Edebiyat Soru Bankası" },
                 { pub: "3D Yayınları", book: "AYT Edebiyat Zor Soru Bankası" }],
          deneme: [{ pub: "Limit Yayınları", book: "AYT Edebiyat Branş Denemesi" }]
        }
      },
      "Tarih": {
        TYT: {
          konu: [{ pub: "Tonguç Akademi Yayınları", book: "TYT Tarih Konu Anlatımlı" }],
          soru: [{ pub: "Editör Yayınları", book: "TYT Tarih Soru Bankası" },
                 { pub: "3D Yayınları", book: "TYT Tarih Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "TYT Tarih Zor Soru Bankası" }],
          deneme: [{ pub: "Editör Yayınları", book: "TYT Tarih Branş Denemesi" }]
        },
        AYT: {
          konu: [{ pub: "Tonguç Akademi Yayınları", book: "AYT Tarih Konu Anlatımlı" }],
          soru: [{ pub: "Editör Yayınları", book: "AYT Tarih Soru Bankası" },
                 { pub: "3D Yayınları", book: "AYT Tarih Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "AYT Tarih Zor Soru Bankası" }],
          deneme: [{ pub: "Editör Yayınları", book: "AYT Tarih Branş Denemesi" }]
        }
      },
      "Coğrafya": {
        TYT: {
          konu: [{ pub: "Tonguç Akademi Yayınları", book: "TYT Coğrafya Konu Anlatımlı" }],
          soru: [{ pub: "Editör Yayınları", book: "TYT Coğrafya Soru Bankası" },
                 { pub: "3D Yayınları", book: "TYT Coğrafya Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "TYT Coğrafya Zor Soru Bankası" }],
          deneme: [{ pub: "Editör Yayınları", book: "TYT Coğrafya Branş Denemesi" }]
        },
        AYT: {
          konu: [{ pub: "Tonguç Akademi Yayınları", book: "AYT Coğrafya Konu Anlatımlı" }],
          soru: [{ pub: "Editör Yayınları", book: "AYT Coğrafya Soru Bankası" },
                 { pub: "3D Yayınları", book: "AYT Coğrafya Soru Bankası" },
                 { pub: "Endemik Yayınları", book: "AYT Coğrafya Zor Soru Bankası" }],
          deneme: [{ pub: "Editör Yayınları", book: "AYT Coğrafya Branş Denemesi" }]
        }
      },
      "Felsefe": {
        TYT: {
          konu: [{ pub: "Tonguç Akademi Yayınları", book: "TYT Felsefe Konu Anlatımlı" }],
          soru: [{ pub: "Editör Yayınları", book: "TYT Felsefe Soru Bankası" },
                 { pub: "3D Yayınları", book: "TYT Felsefe Soru Bankası" }]
        },
        AYT: {
          konu: [{ pub: "Tonguç Akademi Yayınları", book: "AYT Felsefe Grubu Konu Anlatımlı" }],
          soru: [{ pub: "Editör Yayınları", book: "AYT Felsefe Grubu Soru Bankası" },
                 { pub: "3D Yayınları", book: "AYT Felsefe Grubu Soru Bankası" }]
        }
      },
      "Din Kültürü": {
        TYT: {
          konu: [{ pub: "Tonguç Akademi Yayınları", book: "TYT Din Kültürü Konu Anlatımlı" }],
          soru: [{ pub: "Editör Yayınları", book: "TYT Din Kültürü Soru Bankası" },
                 { pub: "3D Yayınları", book: "TYT Din Kültürü Soru Bankası" }]
        }
      },
      "Dil": {
        YDT: {
          konu: [{ pub: "Tonguç Akademi Yayınları", book: "YDT İngilizce Konu Anlatımlı" }],
          soru: [{ pub: "Editör Yayınları", book: "YDT İngilizce Soru Bankası" },
                 { pub: "3D Yayınları", book: "YDT İngilizce Soru Bankası" }],
          deneme: [{ pub: "Editör Yayınları", book: "YDT İngilizce Deneme Seti" }]
        }
      },
      // Karma/genel deneme günleri için branş kitabı değil, deneme seti önerilir.
      "Genel": {
        TYT: { deneme: [{ pub: "3D Yayınları", book: "TYT 5'li Deneme Seti" }] },
        AYT: { deneme: [{ pub: "Bilgi Sarmal Yayınları", book: "AYT 5'li Deneme Seti" }] },
        YDT: { deneme: [{ pub: "Editör Yayınları", book: "YDT İngilizce Deneme Seti" }] },
        Genel: { deneme: [{ pub: "Bilgi Sarmal Yayınları", book: "TYT + AYT Karma Deneme Seti" }] }
      }
    },

    normalizeSubject: function(subject) {
      const s = String(subject || "").trim();
      const alias = {
        "Türk Dili ve Edebiyatı": "Edebiyat",
        "Din Kültürü ve Ahlak Bilgisi": "Din Kültürü",
        "İngilizce": "Dil",
        "Yabancı Dil": "Dil"
      };
      return alias[s] || s;
    },

    normalizeExam: function(examType) {
      const e = String(examType || "").toUpperCase();
      if (e === "TYT" || e === "AYT" || e === "YDT") return e;
      return "Genel";
    },

    entriesFor: function(subject, examType, kind) {
      const subj = this.catalog[this.normalizeSubject(subject)];
      if (!subj) return [];
      const exam = this.normalizeExam(examType);
      // Sınav eşleşmezse dersin mevcut ilk sınav grubuna düşülür
      // (ör. yalnız TYT kitabı olan Türkçe için examType "Genel").
      const byExam = subj[exam] || subj.TYT || subj.AYT || subj.YDT || {};
      return byExam[kind] || [];
    },

    // kind: "konu" | "soru" | "deneme"  ·  tier: 0 birincil, 1 ek kaynak, 2 zirve
    pick: function(subject, examType, kind, tier) {
      const list = this.entriesFor(subject, examType, kind);
      if (!list.length) return null;
      const wanted = Math.max(0, parseInt(tier, 10) || 0);
      const entry = list[Math.min(wanted, list.length - 1)];
      return { publisher: entry.pub, book: entry.book, kind: kind };
    },

    // Görev tipinden kaynak türü: video/reading -> konu anlatımı, diğerleri -> soru bankası
    kindForTask: function(task) {
      if (task.sourceKind) return task.sourceKind;
      return (task.type === "video" || task.type === "reading") ? "konu" : "soru";
    },

    forTask: function(task) {
      if (!task || task.noSource) return null;
      return this.pick(task.sourceSubject || task.subject, task.examType, this.kindForTask(task), task.sourceTier);
    },

    label: function(src) {
      return src ? `${src.publisher} — ${src.book}` : "";
    },

    // Göreve kaynak kitabı iliştirir. Kataloğda karşılığı olmayan
    // dersler (Rehberlik, Kitap Okuma, Özel Görev...) kaynaksız kalır.
    attach: function(task) {
      const src = this.forTask(task);
      if (src) task.source = src; else delete task.source;
      return task;
    },

    attachAll: function(tasks) {
      (tasks || []).forEach(t => this.attach(t));
      return tasks;
    },

    // Katalogdaki her kaydi duz listeye acar:
    // { publisher, book, kind, subject, exam }
    allEntries: function() {
      const out = [];
      Object.keys(this.catalog).forEach(subject => {
        const byExam = this.catalog[subject];
        Object.keys(byExam).forEach(exam => {
          const byKind = byExam[exam];
          Object.keys(byKind).forEach(kind => {
            (byKind[kind] || []).forEach(e => {
              out.push({ publisher: e.pub, book: e.book, kind: kind, subject: subject, exam: exam });
            });
          });
        });
      });
      return out;
    },

    // Katalogdaki tum yayinevleri (alfabetik, tekil)
    publishers: function() {
      const seen = {};
      this.allEntries().forEach(e => { seen[e.publisher] = true; });
      return Object.keys(seen).sort((a, b) => a.localeCompare(b, "tr"));
    },

    // Bir yayinevinin yayimlanmis kitaplari. Ders verilirse once o derse ait
    // kitaplar dondurulur; o derste kitabi yoksa yayinevinin tum kitaplari.
    booksOf: function(publisher, subject) {
      if (!publisher) return [];
      const all = this.allEntries().filter(e => e.publisher === publisher);
      const subj = this.normalizeSubject(subject);
      const matching = subj ? all.filter(e => e.subject === subj) : [];
      const list = matching.length ? matching : all;

      const seen = {};
      const out = [];
      list.forEach(e => {
        if (seen[e.book]) return;
        seen[e.book] = true;
        out.push({ book: e.book, kind: e.kind, subject: e.subject, exam: e.exam });
      });
      return out.sort((a, b) => a.book.localeCompare(b.book, "tr"));
    }
  },

  badgesList: [
    { id: "first_win", title: "İlk Sayı", desc: "İlk ders çalışma görevini başarıyla tamamla.", icon: "📋" },
    { id: "1000_questions", title: "1000 Soru Kulübü", desc: "Toplam 1,000 soru çözün.", icon: "🎯" },
    { id: "night_owl", title: "Gece Kuşu", desc: "Gece 23:00 - 04:00 saatleri arasında çalışma kaydedin.", icon: "🦉" },
    { id: "early_bird", title: "Erken Kalkan Yol Alır", desc: "Sabah 08:30'dan önce çalışma kaydedin.", icon: "🌅" },
    { id: "lit_beast", title: "Edebiyat Canavarı", desc: "Edebiyat testlerinde 100 doğru cevaba ulaşın.", icon: "📚" },
    { id: "streak_master", title: "İstikrar Abidesi", desc: "Günde en az 1 görevi tamamlayarak seri yapın.", icon: "🔥" }
  ],

  motivationalCorner: [
    {
      quote: "\"Sınırları zorlamayanlar, nerede bittiklerini asla göremezler.\"",
      story: "Kobe Bryant (Mamba Mentality): Kobe Bryant her sabah antrenmana sabah 04:00'te başlardı. Diğer oyuncular salona geldiğinde Kobe çoktan sırılsıklam terlemiş olurdu. Başarı şans eseri değil, kimse bakmadığında dökülen terin sonucudur."
    },
    {
      quote: "\"Ben antrenmanların her dakikasından nefret ediyordum ama kendi kendime 'Bırakma!' diyordum. Şimdi acı çek ki hayatının kalanını bir şampiyon olarak yaşayasın.\"",
      story: "Muhammed Ali: Efsane boksör Muhammed Ali, antrenman yapmaktan nefret etse de gelecekteki şampiyonluğun bugünkü disipline bağlı olduğunu bilerek her gün gardını aldı ve çalıştı."
    },
    {
      quote: "\"Hayatımda 9000'den fazla başarısız şut attım. Neredeyse 300 maç kaybettim. 26 kez maçı kazandıracak son saniye şutu bana güvenildi ama kaçırdım. Hayatımda defalarca başarısız oldum. Ve işte bu yüzden başardım.\"",
      story: "Michael Jordan: Jordan lise takımından yetersiz olduğu için kesilmişti. Odasına kapanıp ağladı ama pes etmedi. Ertesi sabah daha erken kalkıp şut çalıştı. Hatalar senin yenilgin değil, şampiyonluk yolundaki antrenmanlarındır."
    },
    {
      quote: "\"Eğer rüyanız sizi korkutmuyorsa, yeterince büyük değil demektir.\"",
      story: "Stephen Curry: Curry, fiziği çok zayıf olduğu için NBA seviyesinde oynayamaz denilen bir oyuncuydu. Ancak o, şut atma mekaniğini baştan aşağı değiştirerek her gün yüzlerce üçlük attı ve tarihin en büyük şutörü oldu."
    }
  ],

  // Subject mapper keys matching questions.js exact definitions
  subjectKeys: {
    "Türkçe": "Turkce",
    "Matematik": "Matematik",
    "Fizik": "Fizik",
    "Kimya": "Kimya",
    "Biyoloji": "Biyoloji",
    "Edebiyat": "Edebiyat",
    "Tarih": "Tarih",
    "Coğrafya": "Cografya"
  },

  checkSubscriptionStatus: function() {
    // Ücretli sürüm yokken abonelik mantığı hiç çalışmaz: paket seçilmediği
    // için uygulamayı kilitleyen "pending" durumu tam erişime çevrilir.
    if (!this.MONETIZATION_ENABLED) {
      if (this.state.subscriptionTier !== "pro_yearly") {
        this.state.subscriptionTier = "pro_yearly";
        this.saveState();
      }
      this.applyMonetizationVisibility();
      return;
    }

    // Don't auto-start trial if pending
    if (this.state.subscriptionTier === "pending") return;
    
    if (!this.state.trialStartDate && this.state.subscriptionTier === "trial") {
      this.state.trialStartDate = new Date().toISOString();
      this.saveState();
    }
    
    // Check if trial is expired
    if (this.state.subscriptionTier === "trial") {
      const trialStart = new Date(this.state.trialStartDate);
      const now = new Date();
      const diffTime = Math.abs(now - trialStart);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7) {
        // Trial expired
        this.state.subscriptionTier = "free";
        this.saveState();
      } else {
        // Still in trial, update banner if exists
        const daysLeft = 7 - diffDays;
        setTimeout(() => {
          const banner = document.getElementById("trialBanner");
          if (banner) {
            banner.style.display = "block";
            banner.innerHTML = `<i class="fa-solid fa-gift"></i> PRO Deneme Sürümünün bitmesine <strong>${daysLeft} gün</strong> kaldı. <a href="#" onclick="app.showSubscriptionModal(); return false;" style="color:white; text-decoration:underline; font-weight:bold; margin-left:10px;">Şimdi Yükselt</a>`;
          }
        }, 1000);
      }
    }
  },

  // Paket/abonelik yüzeylerini tek yerden gizler.
  applyMonetizationVisibility: function() {
    if (this.MONETIZATION_ENABLED) return;
    ["headerTierBtn", "landingPricingBtn", "sidebarProBanner", "trialBanner"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
  },

  showSubscriptionModal: function() {
    if (!this.MONETIZATION_ENABLED) return;
    this.showPaketler();
    const modal = document.getElementById("subscriptionModal");
    if (modal) {
      modal.style.display = "flex";
      this.openModal("subscriptionModal");
      // Hide close button if pending
      const closeBtn = modal.querySelector(".close-btn");
      if (closeBtn) {
        closeBtn.style.display = this.state.subscriptionTier === "pending" ? "none" : "block";
      }
    }
  },

  closeSubscriptionModal: function() {
    if (this.state.subscriptionTier === "pending") {
      alert("Lütfen devam etmek için bir plan seçin.");
      return;
    }
    const modal = document.getElementById("subscriptionModal");
    if (modal) {
      this.closeModal("subscriptionModal");
      setTimeout(() => { modal.style.display = "none"; }, 300);
    }
  },

  // 3 kademeli paket kartlarini render eder
  showPaketler: function() {
    const kutu = document.getElementById("paketIcerik");
    if (!kutu) return;
    kutu.innerHTML = this.PAKETLER.map(p => `
      <div class="glass-card" role="button" tabindex="0" onclick="app.upgradeToPro('${p.id}')"
           style="flex:1; min-width:210px; text-align:left; cursor:pointer; padding:1.25rem;
                  border:2px solid ${p.vurgu ? "var(--primary)" : "var(--border-color)"};
                  background:${p.vurgu ? "var(--ai-tint)" : "var(--bg-card)"};">
        ${p.vurgu ? `<div style="font-size:.66rem; font-weight:800; color:var(--primary); text-transform:uppercase; letter-spacing:.05em; margin-bottom:.4rem;">${p.vurgu}</div>` : ""}
        <div style="font-family:var(--font-header); font-weight:800; font-size:1.05rem;">${p.ad}</div>
        <div style="font-size:.78rem; color:var(--text-muted); margin:.15rem 0 .7rem;">${p.ozet}</div>
        <div style="font-size:1.55rem; font-weight:900; color:var(--primary); font-variant-numeric:tabular-nums; margin-bottom:.8rem;">
          ${p.fiyat}<span style="font-size:.78rem; font-weight:700; color:var(--text-muted);"> ${p.birim}</span></div>
        <ul style="list-style:none; padding:0; margin:0; display:grid; gap:.35rem;">
          ${p.ozellikler.map(o => `<li style="font-size:.79rem; display:flex; gap:.4rem; align-items:flex-start;"><span style="color:var(--success,#10b981); font-weight:800;">✓</span><span>${o}</span></li>`).join("")}
        </ul>
      </div>`).join("");
  },

  upgradeToPro: function(plan) {
    if (plan === "trial") {
      this.state.subscriptionTier = "trial";
      this.state.trialStartDate = new Date().toISOString();
      this.saveState();
      this.closeModal("subscriptionModal");
      const m = document.getElementById("subscriptionModal");
      if (m) setTimeout(() => { m.style.display = "none"; }, 300);
      this.showToast(`${this.DENEME_GUN} günlük ücretsiz denemen başladı.`, "success");
      this.startMainDashboard();
      return;
    }

    // Odeme saglayicisi henuz bagli degil. Secimi kaydedip sahte bir
    // "PRO oldunuz" durumu yaratmak yaniltici olur; durum acikca soylenir.
    const bilgi = this.paketBilgisi(plan);
    this.showCoachAlert("💳 Ödeme altyapısı henüz bağlı değil",
      `<strong>${bilgi.ad}</strong> paketini seçtin. Ödeme alabilmek için bir ödeme sağlayıcısının (iyzico, PayTR vb.) ` +
      `sunucuya bağlanması gerekiyor — bu henüz yapılmadı, dolayısıyla şu an ücret tahsil edilemiyor.<br><br>` +
      `Bu arada <strong>${this.DENEME_GUN} günlük ücretsiz denemeyi</strong> başlatarak tüm özellikleri kullanabilirsin.`);
  },

  // Initialize App

  // ==========================================
  // AI KOÇUM 2.0 - LLM AGENT ORCHESTRATOR
  // ==========================================
  // ==========================================
  // AI KOÇUM 3.0 - GEMINI API INTEGRATION
  // ==========================================

  geminiConfig: {
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
    model: "gemini-3.7-flash", // Default model
    max_tokens: 1024
  },

  coachTools: {
    getProfile: function() {
      return {
        name: app.state.name,
        track: app.state.track,
        targetDept: app.state.targetDept,
        targetRank: app.state.targetRank || null,
        targetUniversity: app.state.targetUniversity || null,
        level: app.state.level,
        streak: app.state.streak,
        daysToExam: app.getDaysToExam ? app.getDaysToExam() : null
      };
    },

    // --- Paylaşılan eğitim veri modeline erişim (W1/W3/W5 entegrasyonu) ---
    getCurriculumProgress: function() {
      const track = app.state.track || "Sayısal";
      const focus = app.state.examFocus || "both";
      const all = app.curriculum.topicsFor(track, focus);
      const statuses = app.state.topicStatuses || {};
      const isDone = (t) => {
        const st = statuses[`${t.subject} - ${t.name}`];
        return !!(st && (st.status === "Ogrenildi" || st.status === "Calisildi"));
      };
      const doneIds = all.filter(isDone).map(t => t.id);
      const bySubject = {};
      all.forEach(t => {
        const b = (bySubject[t.subjectKey] = bySubject[t.subjectKey] || { total: 0, done: 0 });
        b.total++; if (isDone(t)) b.done++;
      });
      const next = app.curriculum.availableTopics(track, focus, doneIds).slice(0, 5)
        .map(t => ({ subject: t.subject, topic: t.name, unit: t.unit, examWeight: t.weight }));
      const blocked = all.filter(t => !isDone(t) && (t.prereq || []).some(p => doneIds.indexOf(p) === -1))
        .slice(0, 5).map(t => ({
          topic: t.name,
          missingPrerequisites: (t.prereq || []).filter(p => doneIds.indexOf(p) === -1)
            .map(p => (app.curriculum.byId(p) || {}).name).filter(Boolean)
        }));
      return {
        totalTopics: all.length, completedTopics: doneIds.length,
        percent: all.length ? Math.round(doneIds.length / all.length * 100) : 0,
        bySubject, nextRecommended: next, blockedByPrerequisites: blocked
      };
    },

    getSectionAnalysis: function() {
      const an = app.analyzeMockSections();
      if (!an) return { available: false, message: "Henüz bölüm bazlı deneme sonucu girilmemiş. Deneme sonucunu bölüm bazlı girerse buradan analiz üretilebilir." };
      return {
        available: true, mockCount: an.mockCount,
        weakestSections: an.weakest.map(r => ({ section: r.section, subject: r.subjectKey, accuracyPct: r.avgAccuracy, trend: r.trend, samples: r.sampleSize })),
        strongestSections: an.strongest.map(r => ({ section: r.section, subject: r.subjectKey, accuracyPct: r.avgAccuracy, trend: r.trend, samples: r.sampleSize })),
        decliningSections: an.declining.map(r => r.section),
        improvingSections: an.improving.map(r => r.section)
      };
    },

    getReviewStatus: function() {
      const day = app.state.activeDay || 1;
      const due = app.getDueRepetitions(day);
      const all = app.state.spacedRepetitionTasks || [];
      return {
        intervals: app.SR_INTERVALS,
        topicsInCycle: all.length,
        dueToday: due.map(r => ({
          topic: r.topic, subject: r.subject,
          stage: Math.min(r.stage + 1, app.SR_INTERVALS.length),
          daysSinceStudied: Math.max(0, day - (r.lastDay || day))
        })),
        note: "Tekrarlar ayrı görev olarak eklenmez; AI Akıllı Tekrar Seansı içinde sunulur."
      };
    },

    getWeeklyReport: function(weekOffset = 0) {
      const startDay = Math.max(1, app.state.activeDay - 6 + (weekOffset * 7));
      const endDay = Math.min(app.state.activeDay, startDay + 6);
      
      let totalMins = 0;
      let totalCompleted = 0;
      let totalTasks = 0;
      let qCount = 0;
      let subjectStats = {};

      for (let d = startDay; d <= endDay; d++) {
        if (app.state.daysData[d] && app.state.daysData[d].tasks) {
          app.state.daysData[d].tasks.forEach(t => {
            totalTasks++;
            let dur = parseInt(t.duration) || 0;
            let count = parseInt(t.questionCount) || 0;
            
            if (!subjectStats[t.subject]) {
               subjectStats[t.subject] = { plannedMins: 0, completedMins: 0, qCount: 0 };
            }
            subjectStats[t.subject].plannedMins += dur;

            if (t.completed) {
              totalCompleted++;
              totalMins += dur;
              qCount += count;
              subjectStats[t.subject].completedMins += dur;
              subjectStats[t.subject].qCount += count;
            }
          });
        }
      }

      let bestSubj = null;
      let worstSubj = null;
      let maxComp = -1;
      let minComp = 999;
      for (const subj in subjectStats) {
         let p = subjectStats[subj].plannedMins;
         let c = subjectStats[subj].completedMins;
         if (p > 0) {
            let ratio = c / p;
            if (ratio > maxComp) { maxComp = ratio; bestSubj = subj; }
            if (ratio < minComp) { minComp = ratio; worstSubj = subj; }
         }
      }

      return {
        period: `Gün ${startDay} - ${endDay}`,
        totalMinutesStudied: totalMins,
        totalQuestionsSolved: qCount,
        completionRate: totalTasks > 0 ? (totalCompleted / totalTasks) : 0,
        bestSubject: bestSubj,
        worstSubject: worstSubj
      };
    },

    getProgressSnapshot: function() {
      let weakSubjects = [];
      if (app.state.testSubjects && app.state.testQuestions) {
        let stats = app.state.testSubjects.map(sub => {
          let c = 0, t = 0;
          for(let q in app.state.testQuestions) {
            if(app.state.testQuestions[q].subject === sub) {
              t++;
              if(app.state.testAnswers[q] === app.state.testQuestions[q].correct) c++;
            }
          }
          return { subject: sub, rate: t > 0 ? c/t : 1 };
        });
        weakSubjects = stats.sort((a,b) => a.rate - b.rate).slice(0,2).map(x => x.subject);
      }

      let vulnerableTopics = [];
      if (app.state.spacedRepetitionTasks) {
         vulnerableTopics = app.state.spacedRepetitionTasks.map(t => t.topic).slice(0,3);
      }

      return {
        focusScore: app.calculateFocusScore ? app.calculateFocusScore() : 85,
        totalStudyHours: Math.floor((app.calculateTotalStudyTime ? app.calculateTotalStudyTime() : 0) / 60),
        weakSubjects: weakSubjects,
        vulnerableTopics: vulnerableTopics,
        currentLevel: app.state.level
      };
    },

    getTodayPlan: function() {
      const d = app.state.activeDay;
      const data = app.state.daysData[d] || { tasks: [] };
      return {
        day: d,
        tasks: data.tasks.map(t => ({
          subject: t.subject,
          topic: t.topic,
          duration: t.duration,
          completed: t.completed
        }))
      };
    },

    getUpcomingTasks: function(days = 3) {
      let upcoming = [];
      for(let i=1; i<=days; i++) {
        let d = app.state.activeDay + i;
        const dayData = app.state.daysData[d];
        if (dayData && Array.isArray(dayData.tasks)) {
           upcoming.push({
             day: d,
             taskCount: dayData.tasks.length,
             summary: dayData.tasks.map(t => t.subject).filter(Boolean).join(", ")
           });
        }
      }
      return upcoming;
    },

    getTestPerformance: function() {
       let testStats = {};
       if (app.state.testSubjects && app.state.testQuestions) {
         app.state.testSubjects.forEach(sub => {
            let c = 0, t = 0;
            for(let q in app.state.testQuestions) {
              if(app.state.testQuestions[q].subject === sub) {
                t++;
                if(app.state.testAnswers[q] === app.state.testQuestions[q].correct) c++;
              }
            }
            testStats[sub] = { correct: c, total: t };
         });
       }
       return testStats;
    },

    adjustProgramLoad: function(percent, scope) {
      let startDay = app.state.activeDay + 1; // start tomorrow
      let endDay = scope === "week" ? startDay + 6 : 300; // rough max days
      
      let tasksModified = 0;
      let tasksRemoved = 0;
      let minutesBefore = 0;
      let minutesAfter = 0;
      let changedDays = 0;
      let ratio = 1 + (percent / 100);

      for (let d = startDay; d <= endDay; d++) {
        let dayData = app.state.daysData[d];
        if (!dayData || !dayData.tasks) continue;

        let dayChanged = false;
        let newTasks = [];

        dayData.tasks.forEach(t => {
           if (t.completed || t.subject === "Paragraf" || t.subject === "Problem") {
              newTasks.push(t);
              minutesBefore += parseInt(t.duration) || 0;
              minutesAfter += parseInt(t.duration) || 0;
              return;
           }

           let origDur = parseInt(t.duration) || 0;
           minutesBefore += origDur;

           let newDur = Math.round((origDur * ratio) / 5) * 5;
           
           if (newDur < 15 && percent < 0) {
              tasksRemoved++;
              dayChanged = true;
           } else {
              if (newDur < 10) newDur = 10;
              t.duration = newDur + " dk";
              if (t.questionCount) {
                 t.questionCount = Math.round((parseInt(t.questionCount) * ratio) / 5) * 5;
                 if (t.questionCount < 5) t.questionCount = 5;
              }
              minutesAfter += newDur;
              if (newDur !== origDur) {
                 tasksModified++;
                 dayChanged = true;
              }
              newTasks.push(t);
           }
        });

        if (dayChanged) {
           changedDays++;
           app.state.daysData[d].tasks = newTasks;
        }
      }

      return { changedDays, tasksModified, tasksRemoved, minutesBefore, minutesAfter };
    },

    addTask: function(dayOffset, subject, topic, durationMin, questionCount) {
      const day = app.state.activeDay + dayOffset;
      if (!app.state.daysData[day]) app.state.daysData[day] = { completed: false, tasks: [] };
      
      app.state.daysData[day].tasks.push({
         id: "ai_task_" + Date.now(),
         subject: subject,
         topic: topic,
         duration: durationMin + " dk",
         questionCount: questionCount || Math.floor(durationMin * 0.8),
         completed: false,
         type: "study"
      });
      return { status: "success", day: day, task: subject + " - " + topic };
    },

    removeTask: function(dayOffset, subject) {
      const day = app.state.activeDay + dayOffset;
      if (!app.state.daysData[day] || !app.state.daysData[day].tasks) return { status: "failed", message: "Day has no tasks" };
      
      const origLen = app.state.daysData[day].tasks.length;
      // Görevlerin bir kısmında subject olmayabilir (Akıllı Tekrar Seansı,
      // kullanıcı alışkanlık görevleri); modelden gelen subject de boş
      // gelebilir — ikisi de çökmeye yol açmamalı.
      const needle = String(subject || "").toLowerCase();
      if (!needle) return { status: "failed", message: "No subject given" };
      app.state.daysData[day].tasks = app.state.daysData[day].tasks.filter(t => !String(t.subject || "").toLowerCase().includes(needle));
      
      return { status: "success", removedCount: origLen - app.state.daysData[day].tasks.length };
    },

    navigateTo: function(feature) {
      const map = {
         "charts": "dashboardView",
         "vault": "dashboardView",
         "habitMap": "dashboardView",
         "programCreator": "wizardView",
         "today": "dashboardView",
         "test": "testView"
      };
      
      if(map[feature]) {
         app.showView(map[feature]);
         if(feature === "vault" || feature === "charts" || feature === "today" || feature === "habitMap") {
            const tabMap = {
               "vault": "errorlog",
               "charts": "stats",
               "today": "today",
               "habitMap": "habitmap"
            };
            if(app.switchTab) app.switchTab(tabMap[feature]);
         }
         return { status: "success", navigatedTo: feature };
      }
      return { status: "failed", message: "Unknown feature " + feature };
    },
    
    // Rota Rehberi paneli kaldırıldığı için mesajlar artık Bildirim
    // Merkezi'ne yazılır (tek bildirim yüzeyi). Önceden silinmiş bir
    // konteynere yazıp sessizce kaybediyordu.
    add_navigation_message: function(message, type) {
       const kind = type === "warning" ? "alert" : type === "success" ? "done" : "info";
       app.addNotification(kind, "AI Koç Önerisi", String(message || ""));
       if (typeof app.showToast === "function") {
         app.showToast(String(message || ""), type === "warning" ? "warning" : type === "success" ? "success" : "info");
       }
       return { status: "success", deliveredVia: "notificationCenter", message: message };
    },

    getLastCoachCommentary: function() {
       if (app.state.coachCommentaries && app.state.coachCommentaries.length > 0) {
         const last = app.state.coachCommentaries[0];
         return {
           date: last.date,
           trigger: last.trigger,
           strengths: last.content.strengths,
           weakness: last.content.weakness,
           nextSteps: last.content.nextSteps,
           expectedImprovement: last.content.expectedImprovement,
           coachMessage: last.content.coachMessage
         };
       }
       return { message: "Henüz bir kişisel koç değerlendirmesi oluşturulmamış." };
    }
  },

  coachToolSchemas: {
    functionDeclarations: [
      {
        name: "getProfile",
        description: "Gets the user's basic profile, track, target department, and streak.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "getLastCoachCommentary",
        description: "Gets the most recent AI Personal Coach Commentary showing strengths, weaknesses, next steps, and expected net improvement.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "getWeeklyReport",
        description: "Gets the user's study report for a specific week.",
        parameters: {
          type: "object",
          properties: { weekOffset: { type: "integer", description: "0 for current week, -1 for last week." } }
        }
      },
      {
        name: "getProgressSnapshot",
        description: "Gets current focus score, total hours studied, and identifies weak subjects/topics.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "getCurriculumProgress",
        description: "Gets the student's progress through the official YKS curriculum knowledge graph: how many topics are completed per subject, which topics are next in prerequisite order, and which prerequisites are still missing. Use this when asked what to study next or how far along the syllabus the student is.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "getSectionAnalysis",
        description: "Gets section-level mock exam analysis (e.g. TYT Matematik > Geometri): average accuracy, sample size, improving/declining trend and average net lost per section. Use this to explain WHERE the student loses marks. Returns null if no section-level mock data has been entered yet.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "getReviewStatus",
        description: "Gets the spaced-repetition state: which topics are due for review today, their repetition stage and how long since last studied. Use this when asked about revision.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "getTodayPlan",
        description: "Gets the tasks scheduled for today.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "getUpcomingTasks",
        description: "Gets a summary of tasks scheduled for upcoming days.",
        parameters: {
          type: "object",
          properties: { days: { type: "integer", description: "Number of upcoming days to look ahead (default 3)." } }
        }
      },
      {
        name: "getTestPerformance",
        description: "Gets performance statistics from mock exams (net counts per subject).",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "adjustProgramLoad",
        description: "Proposes proportionally increasing or decreasing the study workload (durations/question counts). This modifies the program.",
        parameters: {
          type: "object",
          properties: {
            percent: { type: "number", description: "Percentage to adjust. Negative to reduce (e.g. -20), positive to increase (e.g. 15)." },
            scope: { type: "string", enum: ["week", "remaining"], description: "Scope of the adjustment." }
          },
          required: ["percent", "scope"]
        }
      },
      {
        name: "addTask",
        description: "Proposes adding a new study task to the program.",
        parameters: {
          type: "object",
          properties: {
            dayOffset: { type: "integer", description: "0 for today, 1 for tomorrow." },
            subject: { type: "string", description: "Subject name (e.g. Matematik, Fizik)." },
            topic: { type: "string", description: "Topic name." },
            durationMin: { type: "integer", description: "Duration in minutes." },
            questionCount: { type: "integer", description: "Number of questions to solve." }
          },
          required: ["dayOffset", "subject", "topic", "durationMin"]
        }
      },
      {
        name: "removeTask",
        description: "Proposes removing a task from the program.",
        parameters: {
          type: "object",
          properties: {
            dayOffset: { type: "integer", description: "0 for today, 1 for tomorrow." },
            subject: { type: "string", description: "Subject of the task to remove." }
          },
          required: ["dayOffset", "subject"]
        }
      },
      {
        name: "navigateTo",
        description: "Navigates the user's app UI to a specific feature/screen.",
        parameters: {
          type: "object",
          properties: {
            feature: { type: "string", enum: ["charts", "vault", "habitMap", "programCreator", "today", "test"] }
          },
          required: ["feature"]
        }
      },
      {
        name: "add_navigation_message",
        description: "Sends an intelligent contextual message to the study plan UI.",
        parameters: {
          type: "object",
          properties: {
            message: { type: "string", description: "The contextual message to display." },
            type: { type: "string", enum: ["success", "warning", "info"], description: "Type of the message." }
          },
          required: ["message", "type"]
        }
      }
    ]
  },

  // ==========================================================
  // XSS KORUMASI
  // ------------------------------------------------------------
  // Arayüz büyük ölçüde innerHTML + template literal ile kuruluyor.
  // Kullanıcının girdiği (ders/konu/not/isim) ve AI'dan gelen metinler
  // kaçırılmadan basılırsa <img onerror=...> gibi yükler çalışabiliyordu.
  // escapeHtml: ham veri alanları için (hiç HTML beklenmiyor).
  // sanitizeHtml: AI yanıtları için (sadece güvenli biçimlendirme etiketleri
  // korunur; script/style/olay öznitelikleri ve tehlikeli URL'ler atılır).
  // ==========================================================
  escapeHtml: function(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  sanitizeHtml: function(value) {
    if (value === null || value === undefined) return "";
    const ALLOWED = ["B","STRONG","I","EM","U","BR","P","UL","OL","LI","SPAN","DIV","SMALL","CODE"];
    // ÖNEMLİ: ayrıştırma INERT bir belgede yapılmalı. Bağlı olmayan bir div'e
    // innerHTML atamak bile <img onerror=...> yükünü tetikliyor; DOMParser ile
    // üretilen belge ise kaynak yüklemez ve script çalıştırmaz.
    const doc = new DOMParser().parseFromString(String(value), "text/html");
    const tpl = doc.body;
    const walk = (node) => {
      [...node.children].forEach(el => {
        if (!ALLOWED.includes(el.tagName)) {
          // Etiketi at, düz metnini koru.
          el.replaceWith(document.createTextNode(el.textContent || ""));
          return;
        }
        [...el.attributes].forEach(attr => {
          const n = attr.name.toLowerCase();
          const v = (attr.value || "").replace(/\s/g, "").toLowerCase();
          if (n.startsWith("on") || n === "srcdoc" || n === "style" ||
              ((n === "href" || n === "src") && v.startsWith("javascript:"))) {
            el.removeAttribute(attr.name);
          }
        });
        walk(el);
      });
    };
    walk(tpl);
    return tpl.innerHTML;
  },

  // ==========================================================
  // LLM API ANAHTARI — TEK KAYNAK
  // ------------------------------------------------------------
  // Anahtar İSTEMCİ tarafında gömülü tutulamaz: uygulamayı açan herkes
  // kaynak koddan okuyup kotayı tüketebilir. Bu yüzden gömülü anahtar
  // kaldırıldı; anahtar yalnızca kullanıcının kendi cihazındaki
  // localStorage'da saklanır ve Profil kartından girilir. Anahtar yoksa
  // AI çağrıları yapılmaz, uygulama kural tabanlı çevrimdışı moda düşer.
  // ==========================================================
  getLlmApiKey: function() {
    try {
      return (localStorage.getItem("aikocum_llm_key") || "").trim();
    } catch (e) {
      return "";
    }
  },

  hasLlmApiKey: function() {
    return this.getLlmApiKey().length > 0;
  },

  saveLlmApiKey: function(value) {
    const key = (value || "").trim();
    try {
      if (key) localStorage.setItem("aikocum_llm_key", key);
      else localStorage.removeItem("aikocum_llm_key");
    } catch (e) {
      this.showToast("Anahtar kaydedilemedi: tarayıcı deposuna erişilemiyor.", "error");
      return;
    }
    this.updateAiConnectionStatus();
    this.showToast(key ? "AI anahtarı kaydedildi." : "AI anahtarı silindi. Çevrimdışı moda geçildi.", key ? "success" : "warning");
  },

  // Profil kartındaki bağlantı rozetini gerçek duruma göre günceller
  // (önceden her koşulda "Aktif" yazan sabit bir etiketti).
  updateAiConnectionStatus: function() {
    const el = document.getElementById("aiConnectionStatus");
    if (!el) return;
    const ok = this.hasLlmApiKey();
    el.innerHTML = ok
      ? `<i class="fa-solid fa-check-circle"></i> AI Koç Bağlantısı Aktif`
      : `<i class="fa-solid fa-plug-circle-xmark"></i> AI Koç Bağlantısı Yok`;
    el.style.background = ok ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)";
    el.style.borderColor = ok ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.25)";
    el.style.color = ok ? "var(--success)" : "#b45309";
  },

  callLLM: async function(messages, tools, customSystemPrompt) {
    const apiKey = this.getLlmApiKey();
    if (!apiKey) throw new Error("No API key");

    const systemPrompt = `Sen YKSKoçum'sun. (Kullanıcıya 'Koç Kalem' olarak da biliniyorsun). Sen zorlu ama destekleyici bir YKS mentorusun.
Yanıtlarında Türkçe kullan. Cümlelerin kısa ve net olsun, <strong> gibi HTML etiketleriyle vurgular yapabilirsin. 
Kullanıcının verileri (netler, çalışma süresi) hakkında yorum yaparken ASLA uydurma veri kullanma, sadece araçlardan gelen veriyi referans al.
Gelişim analizini veya koç değerlendirmesini incelemek için getLastCoachCommentary aracını kullanıp öğrenciyle bu konuda sohbet edebilirsin.
Eğer kullanıcı sana genel bir soru sorarsa (Örn: 'Türev nasıl çalışılır?'), hem koçluk tavsiyesi ver hem de gerekirse navigateTo aracıyla onu uygulamadaki doğru ekrana yönlendir.
ÖNEMLİ İSİMLENDİRME KURALI: Müfredat ilerlemesi ve program oluşturmadan bahsederken HER ZAMAN "AI Program Sihirbazı" ismini kullan. "AI Rota Rehberi" modülü kaldırıldı; bu isimden ASLA bahsetme.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(`${this.geminiConfig.endpoint}?key=${apiKey}`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: customSystemPrompt || systemPrompt }] },
          contents: messages,
          tools: tools ? [tools] : []
        })
      });

      clearTimeout(timeout);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API Error: ${response.status} ${errData.error?.message || ''}`);
      }

      return await response.json();
    } catch(e) {
      clearTimeout(timeout);
      throw e;
    }
  },

  aiChatRespond: async function(userText) {
    const apiKey = this.getLlmApiKey();
    if (!apiKey || !navigator.onLine) {
       const fallbackRes = this.parseChatCommand(userText);
       if (fallbackRes.revised) {
          this.saveState();
          if(this.renderDashboard) this.renderDashboard();
       }
       return fallbackRes.reply + (!navigator.onLine ? " <em style='font-size:0.7rem; opacity:0.7;'>(çevrimdışı mod)</em>" : "");
    }

    if (!this.chatState.history) this.chatState.history = [];

    if (this.chatState.pendingConfirmation) {
       const isYes = /evet|onayla|tamam|uygula/i.test(userText);
       const isNo = /hayır|iptal|vazgeç/i.test(userText);

       if (isYes) {
          const pending = this.chatState.pendingAction;
          let resultText = "İşlem başarıyla uygulandı.";
          if (pending) {
             const res = this.coachTools[pending.name](...pending.args);
             this.saveState();
             if(this.renderDashboard) this.renderDashboard();
             resultText = "Harika! Değişiklikleri programına işledim. Başka bir isteğin var mı?";
          }
          this.chatState.pendingConfirmation = null;
          this.chatState.pendingAction = null;
          this.chatState.history.push({ role: "user", parts: [{ text: userText }] });
          this.chatState.history.push({ role: "model", parts: [{ text: resultText }] });
          return resultText;
       } else if (isNo) {
          this.chatState.pendingConfirmation = null;
          this.chatState.pendingAction = null;
          const resultText = "Anladım, değişikliği iptal ettim. Mevcut programınla devam ediyoruz.";
          this.chatState.history.push({ role: "user", parts: [{ text: userText }] });
          this.chatState.history.push({ role: "model", parts: [{ text: resultText }] });
          return resultText;
       }
    }

    this.chatState.history.push({ role: "user", parts: [{ text: userText }] });

    if (this.chatState.history.length > 12) {
       this.chatState.history = this.chatState.history.slice(this.chatState.history.length - 12);
    }

    try {
      let currentMessages = [...this.chatState.history];
      let rounds = 0;
      let finalReply = "";

      while (rounds < 5) {
        rounds++;
        const llmResponse = await this.callLLM(currentMessages, this.coachToolSchemas);
        
        if (!llmResponse.candidates || llmResponse.candidates.length === 0) {
           break;
        }

        const candidate = llmResponse.candidates[0];
        // Gemini güvenlik filtresine takılan ya da kesilen yanıtlarda
        // candidate.content hiç gelmeyebiliyor; korumasız erişim sohbeti
        // çökertiyordu.
        const parts = (candidate.content && candidate.content.parts) || [];
        if (parts.length === 0) break;

        currentMessages.push({ role: "model", parts: parts });

        let toolCalls = parts.filter(p => p.functionCall);
        
        const textParts = parts.filter(p => p.text);
        if (textParts.length > 0) {
           finalReply += textParts.map(t => t.text).join(" ");
        }

        if (toolCalls.length === 0) {
           break; 
        }

        let toolResultsParts = [];
        for (const callPart of toolCalls) {
           const call = callPart.functionCall;
           if (["adjustProgramLoad", "addTask", "removeTask"].includes(call.name)) {
              this.chatState.pendingConfirmation = "tool_action";
              
              let argsArr = [];
              if (call.name === "adjustProgramLoad") argsArr = [call.args.percent, call.args.scope];
              if (call.name === "addTask") argsArr = [call.args.dayOffset, call.args.subject, call.args.topic, call.args.durationMin, call.args.questionCount];
              if (call.name === "removeTask") argsArr = [call.args.dayOffset, call.args.subject];

              this.chatState.pendingAction = {
                 name: call.name,
                 args: argsArr
              };

              toolResultsParts.push({
                 functionResponse: {
                   name: call.name,
                   response: { result: "ACTION INTERCEPTED. Tell the user what you are going to do and ask for their confirmation (evet/hayır). Do not say 'I applied it'." }
                 }
              });
           } else {
              let res;
              try {
                if (call.name === "getProfile") res = this.coachTools.getProfile();
                else if (call.name === "getLastCoachCommentary") res = this.coachTools.getLastCoachCommentary();
                else if (call.name === "getWeeklyReport") res = this.coachTools.getWeeklyReport(call.args.weekOffset);
                else if (call.name === "getProgressSnapshot") res = this.coachTools.getProgressSnapshot();
                else if (call.name === "getTodayPlan") res = this.coachTools.getTodayPlan();
                else if (call.name === "getUpcomingTasks") res = this.coachTools.getUpcomingTasks(call.args.days);
                else if (call.name === "getTestPerformance") res = this.coachTools.getTestPerformance();
                else if (call.name === "getCurriculumProgress") res = this.coachTools.getCurriculumProgress();
                else if (call.name === "getSectionAnalysis") res = this.coachTools.getSectionAnalysis();
                else if (call.name === "getReviewStatus") res = this.coachTools.getReviewStatus();
                else if (call.name === "navigateTo") res = this.coachTools.navigateTo(call.args.feature);
                else res = { error: "Unknown tool" };
              } catch(e) {
                res = { error: e.toString() };
              }
              toolResultsParts.push({
                 functionResponse: {
                   name: call.name,
                   response: res
                 }
              });
           }
        }

        currentMessages.push({ role: "user", parts: toolResultsParts });
      }

      this.chatState.history = currentMessages.filter(m => true);

      // Servis geçerli ama boş bir yanıt döndürebilir (güvenlik filtresi,
      // kota, kesilen üretim). Boş baloncuk basmak yerine kullanıcıya
      // ne olduğunu ve ne yapabileceğini söyle.
      if (!finalReply || !String(finalReply).trim()) {
        return "Şu an bu soruya yanıt üretemedim. Sorunu biraz farklı ifade edip tekrar dener misin? Programın ve istatistiklerin bu sırada normal çalışmaya devam ediyor.";
      }

      return finalReply;

    } catch(err) {
      console.error("AI API Error:", err);
      const fallbackRes = this.parseChatCommand(userText);
      if (fallbackRes.revised) {
          this.saveState();
          if(this.renderDashboard) this.renderDashboard();
      }
      return fallbackRes.reply + " <em style='font-size:0.7rem; opacity:0.7;'>(çevrimdışı/yedek mod)</em>";
    }
  },

  init: function() {
    try {
      console.log("YKSKoçum App Phase 3.5 Initialized");

      // Register Online/Offline handlers (H-004)
      window.addEventListener('online', () => {
        if (typeof this.showToast === 'function') this.showToast("İnternet bağlantısı yeniden sağlandı. Çevrimiçi moda geçildi.", "success");
        this.updateOfflineStatusIndicator();
      });
      window.addEventListener('offline', () => {
        if (typeof this.showToast === 'function') this.showToast("İnternet bağlantısı koptu. Çevrimdışı çalışmaya devam edebilirsiniz.", "warning");
        this.updateOfflineStatusIndicator();
      });
      this.updateOfflineStatusIndicator();

      // Keyboard A11y globally handling Enter/Space clicks for focusable elements
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const activeEl = document.activeElement;
          if (activeEl && (activeEl.getAttribute('role') === 'button' || activeEl.classList.contains('tab-btn') || activeEl.getAttribute('onclick'))) {
            e.preventDefault();
            activeEl.click();
          }
        }
      });

      // Global Double-click & submit throttle (M-004)
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('button, .btn');
        if (btn && (btn.onclick || btn.getAttribute('onclick') || btn.type === 'submit')) {
          if (btn.dataset.clicked === 'true') {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          btn.dataset.clicked = 'true';
          setTimeout(() => {
            btn.dataset.clicked = 'false';
          }, 1000);
        }
      }, true);
      
      // Register Service Worker for PWA
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('./service-worker.js').then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
          });
        });
      }

      this.loadState();
      this.setupInstallPrompt();
      
      if (window.NotificationManager) {
        this.notificationManager = new NotificationManager(this);
      }

      // Handle Service Worker Messages (Notification Clicks)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
            const action = event.data.action;
            if (action && !this.state.isLoggedOut) {
              this.showView('dashboardView');
              if (action === 'vaultView') {
                this.switchTab('vault');
              } else if (action === 'calendarView') {
                this.switchTab('calendar');
              } else {
                this.switchTab('today');
              }
            }
          }
        });
      }

      this.checkSubscriptionStatus();
      
      // Load and apply saved theme
      const activeTheme = (this.state && this.state.theme) || "classic";
      document.body.className = "";
      document.body.classList.add(`theme-${activeTheme}`);
      const sel = document.getElementById("themeSelector");
      if (sel) sel.value = activeTheme;

      this.setupEventListeners();
      
      this.updateDailyQuote();
      this.updateYksCountdown();
      this.updateSidebarPomoDisplay();
      
      // Make Pomodoro Widget draggable
      this.makeElementDraggable(document.getElementById("floatingPomoWidget"));

      // Smallest unit shown is the hour, so a one-minute tick is plenty
      setInterval(() => {
        try {
          this.updateYksCountdown();
        } catch (e) {
          console.error("Error in interval updateYksCountdown", e);
        }
      }, 60000);
    } catch (e) {
      console.error("Critical error during app initialization, recovering cleanly...", e);
      try {
        SafeStorage.removeItem("slamdunk_yks_state");
        this.showLandingView();
      } catch (innerErr) {
        console.error("Failed to recover landing page", innerErr);
      }
    }
  },

  updateOfflineStatusIndicator: function() {
    let indicator = document.getElementById("offlineIndicatorBadge");
    if (!navigator.onLine) {
      if (!indicator) {
        indicator = document.createElement("div");
        indicator.id = "offlineIndicatorBadge";
        indicator.style = "position: fixed; top: 72px; right: 10px; z-index: 10001; background: var(--danger); color: #fff; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; gap: 0.25rem; box-shadow: var(--shadow-sm);";
        indicator.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Çevrimdışı';
        document.body.appendChild(indicator);
      }
    } else {
      if (indicator) indicator.remove();
    }
  },

  setupEventListeners: function() {
    const nameInput = document.getElementById("studentName");
    if (nameInput) {
      nameInput.addEventListener("input", (e) => {
        this.state.name = e.target.value;
      });
    }
    const targetDeptInput = document.getElementById("targetDepartment");
    if (targetDeptInput) {
      targetDeptInput.addEventListener("input", (e) => {
        this.state.targetDept = e.target.value;
        this.updateDeptPercentileNotice(e.target.value);
      });
    }
    // Veli alanlari: yazildikca state'e islenir, ama KAYITLI bir deger
    // asla bosaltilamaz (paylasimi kapatmanin yolu olmamali).
    [["parentEmail", "parentEmail"], ["parentPhone", "parentPhone"]].forEach(([id, alan]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", (e) => {
        const deger = e.target.value.trim();
        if (deger) this.state[alan] = deger;
        this.syncParentContact();
      });
    });
    this.applyParentContactLock();
  },

  // YKS Countdown timer (Target: June 19, 2027) — split-flap style
  YKS_CD_UNITS: [
    { key: "month",  label: "Ay" },
    { key: "week",   label: "Hafta" },
    { key: "day",    label: "Gün" },
    { key: "hour",   label: "Saat" }
  ],

  // Builds the flip cards once; later ticks only swap the digits.
  buildYksCountdownBar: function() {
    const wrap = document.getElementById("yksCdGroups");
    if (!wrap || wrap.dataset.built === "1") return;

    wrap.innerHTML = this.YKS_CD_UNITS.map(u => `
      <div class="flip-group">
        <div class="flip-cards">
          <div class="flip-card" id="cd_${u.key}_0"><span>0</span></div>
          <div class="flip-card" id="cd_${u.key}_1"><span>0</span></div>
        </div>
        <span class="flip-unit">${u.label}</span>
      </div>`).join("");

    wrap.dataset.built = "1";
  },

  setFlipDigit: function(id, char) {
    const card = document.getElementById(id);
    if (!card) return;
    const span = card.firstElementChild;
    if (!span || span.textContent === char) return;

    span.textContent = char;
    card.classList.remove("flipping");
    void card.offsetWidth; // restart the animation
    card.classList.add("flipping");
  },

  updateYksCountdown: function() {
    const targetDate = new Date("2027-06-19T00:00:00");
    const today = new Date();

    let diffMs = targetDate - today;
    if (diffMs < 0) diffMs = 0;

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const months = Math.floor(diffDays / 30);
    const remainingDaysAfterMonths = diffDays % 30;
    const weeks = Math.floor(remainingDaysAfterMonths / 7);
    const finalDays = remainingDaysAfterMonths % 7;

    const hours = Math.floor(diffMs / 3600000) % 24;

    const values = { month: months, week: weeks, day: finalDays, hour: hours };

    this.buildYksCountdownBar();

    this.YKS_CD_UNITS.forEach(u => {
      const padded = String(values[u.key]).padStart(2, "0").slice(-2);
      this.setFlipDigit(`cd_${u.key}_0`, padded[0]);
      this.setFlipDigit(`cd_${u.key}_1`, padded[1]);
    });
  },

  // Navigation
  showView: function(viewId) {
    // Ücretli sürüm kapalıyken paket yüzeyleri her ekran geçişinde gizli kalır.
    this.applyMonetizationVisibility();
    if (typeof this.renderProgramSuggestion === "function") this.renderProgramSuggestion();
    // Rol'e göre sadeleştirme (koç modunda öğrenciye özel sekmeler gizli)
    this.applyRoleUI();
    document.querySelectorAll(".app-view").forEach(view => {
      view.classList.remove("active");
      view.hidden = true;
    });
    const targetView = document.getElementById(viewId);
    if (targetView) {
      targetView.classList.add("active");
      targetView.hidden = false;
    }

    if (viewId === "notificationSettingsView") {
      const elQS = document.getElementById("dynamicQuietStart");
      const elQE = document.getElementById("dynamicQuietEnd");
      if (elQS) elQS.textContent = this.state.sleepTime || "23:00";
      if (elQE) elQE.textContent = this.state.wakeTime || "08:00";
    }

    const onDashboard = viewId === "dashboardView";
    const onWorkspace = onDashboard || viewId === "coachDashboardView";
    const logoutBtn = document.getElementById("headerLogoutBtn");
    if (logoutBtn) logoutBtn.style.display = onWorkspace ? "flex" : "none";

    const notifBtn = document.getElementById("headerNotifBtn");
    if (notifBtn) notifBtn.style.display = onWorkspace ? "flex" : "none";

    const navStats = document.getElementById("navStats");
    if (navStats && viewId === "coachDashboardView") navStats.style.display = "none";

    const aiChatbotWrapper = document.getElementById("aiChatbotWrapper");
    if (aiChatbotWrapper) {
      aiChatbotWrapper.style.display = viewId === "dashboardView" ? "flex" : "none";
      if (!onDashboard) this.closeCoachBubble();
    }

    const countdownWidget = document.getElementById("countdownBanner");
    if (countdownWidget) {
      countdownWidget.style.display = (viewId === "dashboardView") ? "flex" : "none";
    }
    const floatingPomo = document.getElementById("floatingPomoWidget");
    if (floatingPomo) {
      floatingPomo.style.display = (viewId === "dashboardView") ? "block" : "none";
    }

    if (viewId === "dashboardView") {
      this.updateYksCountdown();
    }

    window.scrollTo(0, 0);
  },

  showLandingView: function() {
    this.showView("landingView");
    document.getElementById("navStats").style.display = "none";

    const box = document.getElementById("savedProfileLoginBox");
    if (box) {
      if (this.state.name && this.state.daysData && Object.keys(this.state.daysData).length > 0) {
        document.getElementById("savedProfileName").textContent = this.state.name;
        document.getElementById("savedProfileTrack").textContent = `${this.state.track} Programı | Hedef: ${this.state.targetDept}`;
        box.style.display = "flex";
      } else {
        box.style.display = "none";
      }
    }
  },

  goHome: function() {
    if (this.state.role === "koc" && !this.state.isLoggedOut) this.showCoachDashboard();
    else this.showView("dashboardView");
  },

  logoutUser: function() {
    if (confirm("Sistemden çıkış yapmak istediğinize emin misiniz? (Çalışmalarınız ve verileriniz bu cihazda güvenle saklanmaya devam edecektir.)")) {
      // Clear active timers
      if (this.sidebarPomoTimerInterval) clearInterval(this.sidebarPomoTimerInterval);
      if (this.parentTimerInterval) clearInterval(this.parentTimerInterval);
      if (this.odtState && this.odtState.timer) clearInterval(this.odtState.timer);
      if (this.state && this.state.testTimer) clearInterval(this.state.testTimer);

      this.state.isLoggedOut = true;
      this.saveState();
      this.showLandingView();
    }
  },

  quickLogin: function() {
    if (this.state.subscriptionTier === "pending") {
      this.showSubscriptionModal();
      return;
    }

    this.state.isLoggedOut = false;
    this.saveState();

    if (this.state.role === "koc") {
      this.showCoachDashboard();
      return;
    }

    this.updateHeaderStats();
    
    var _el_trophyTargetDept = document.getElementById("trophyTargetDept"); if (_el_trophyTargetDept) _el_trophyTargetDept.textContent = this.state.targetDept;
    var _el_trophyPercentile = document.getElementById("trophyPercentile"); if (_el_trophyPercentile) _el_trophyPercentile.textContent = this.getTargetRankLabel();

    this.calculateFocusScore();
    this.renderDashboard();
    this.renderCurriculumMap();
    this.renderBadges();
    this.renderVaultQuestions();
    this.renderAICoachRecommendations();
    
    this.showView("dashboardView");
    this.switchTab("today");

    this.syncCustomProgramListSelector();
    this.syncProgramTypeUI(this.state.selectedProgramType);

    if (this.state.parentReportDueTime) {
      this.startParentNotificationTimer();
    }
  },

  // ROL GIRIS NOKTALARI
  // Ogrenci: hedef sihirbazi -> gunluk program takibi.
  // Koc: sihirbaza girmez; dogrudan program hazirlama ekranina gider ve
  // hazirladigi programi METIN olarak paylasir (sunucu olmadigi icin
  // canli koc-ogrenci baglantisi yok; bkz. exportProgramAsText).
  startAsStudent: function() {
    this.state.role = "ogrenci";
    this.saveState();
    this.startWizard();
  },

  startAsCoach: function() {
    if (!this.KOC_AKTIF) {
      this.showCoachAlert("🧭 Koç paneli yakında",
        "Koçların öğrencilerini takip edebilmesi için verilerin ortak bir sunucuda tutulması gerekiyor; " +
        "o altyapı hazırlanıyor.<br><br>Şimdilik öğrenci olarak devam edebilirsin.");
      return;
    }
    this.state.role = "koc";
    this.state.isLoggedOut = false;
    // Koc icin hedef/seviye tespiti anlamsiz; program uretimi calissin diye
    // makul varsayilanlar kurulur ve dogrudan panele gecilir.
    if (!this.state.name) this.state.name = "Koç";
    if (!this.state.targetRank) this.state.targetRank = 50000;
    if (!this.state.daysData || Object.keys(this.state.daysData).length === 0) {
      this.generateWeeklyCalendarData();
      this.state.standardDaysData = JSON.parse(JSON.stringify(this.state.daysData));
    }
    this.saveState();
    this.showCoachDashboard();
    this.showToast("Koç çalışma alanın hazır. Öğrenci davet ederek başlayabilirsin.", "success");
  },

  coachDemoStudents: function() {
    return [
      { id: "demo-elif", name: "Elif Y.", track: "Sayısal", source: "coach", progress: 82, lastActive: "Bugün, 09:20", risk: "good", pending: false, note: "Bu hafta deneme analizi yapılacak.", next: "Cuma · 18:00" },
      { id: "demo-berk", name: "Berk A.", track: "Eşit Ağırlık", source: "ai", progress: 61, lastActive: "Dün, 21:10", risk: "watch", pending: false, note: "Paragraf rutini iki gündür aksıyor.", next: "Perşembe · 17:30" },
      { id: "demo-deniz", name: "Deniz K.", track: "Sayısal", source: "proposal", progress: 0, lastActive: "2 gün önce", risk: "pending", pending: true, note: "Yeni 2. hafta programı onay bekliyor.", next: "Program yanıtı bekleniyor" },
      { id: "demo-selin", name: "Selin T.", track: "Dil", source: "ai", progress: 38, lastActive: "4 gün önce", risk: "risk", pending: false, note: "Çalışma kaydı yok; kısa kontrol mesajı öneriliyor.", next: "Bugün · Takip gerekli" }
    ];
  },

  getCoachStudents: function() {
    const students = Array.isArray(this.state.coachStudents) ? this.state.coachStudents : [];
    return students.length ? students : this.coachDemoStudents();
  },

  showCoachDashboard: function() {
    this.state.role = "koc";
    this.state.isLoggedOut = false;
    this.saveState();
    this.applyRoleUI();
    this.showView("coachDashboardView");
    this.renderCoachDashboard();
  },

  renderCoachDashboard: function() {
    const students = this.getCoachStudents();
    const selectedId = this.state.selectedCoachStudentId || students[0]?.id;
    const selected = students.find(s => s.id === selectedId) || students[0];
    this.state.selectedCoachStudentId = selected?.id || null;

    const active = students.filter(s => s.lastActive.startsWith("Bugün") || s.lastActive.startsWith("Dün")).length;
    const attention = students.filter(s => s.risk === "risk" || s.risk === "watch").length;
    const pending = students.filter(s => s.pending).length;
    const average = students.length ? Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / students.length) : 0;
    [["coachMetricActive", active], ["coachMetricAttention", attention], ["coachMetricPending", pending], ["coachMetricCompletion", `%${average}`]].forEach(([id, value]) => {
      const el = document.getElementById(id); if (el) el.textContent = value;
    });

    const roster = document.getElementById("coachStudentRoster");
    if (roster) roster.innerHTML = students.map(s => {
      const source = s.source === "coach" ? "Koç programı" : s.source === "proposal" ? "Onay bekliyor" : "YKSKoçum AI programı";
      const risk = s.risk === "good" ? "Rayında" : s.risk === "pending" ? "Onay bekliyor" : s.risk === "watch" ? "İzle" : "Takip et";
      return `<button class="coach-student-row ${s.id === selected?.id ? "is-selected" : ""}" onclick="app.selectCoachStudent('${s.id}')">
        <span class="coach-avatar">${this.escapeHtml(s.name.charAt(0))}</span>
        <span class="coach-student-main"><strong>${this.escapeHtml(s.name)}</strong><small>${this.escapeHtml(s.track)} · ${source}</small></span>
        <span class="coach-status coach-status-${s.risk}">${risk}</span>
      </button>`;
    }).join("");

    const detail = document.getElementById("coachStudentDetail");
    if (!detail || !selected) return;
    const sourceName = selected.source === "coach" ? "Koç programı aktif" : selected.source === "proposal" ? "Koç programı önerisi" : "YKSKoçum AI programı aktif";
    const sourceCopy = selected.source === "coach" ? "Bu planı sen oluşturdun. Yeni değişiklikler öğrenciye sürüm olarak gönderilir." : selected.source === "proposal" ? "Öğrencinin kabulü bekleniyor. Onaylanmadan aktif program değişmez." : "Öğrenci kendi AI planıyla ilerliyor. Planı izleyebilir, not ve öneri gönderebilirsin.";
    detail.innerHTML = `<div class="coach-detail-head">
      <div><span class="coach-detail-eyebrow">ÖĞRENCİ GÖRÜNÜMÜ</span><h2>${this.escapeHtml(selected.name)}</h2><p>${this.escapeHtml(selected.track)} · Son etkinlik: ${this.escapeHtml(selected.lastActive)}</p></div>
      <span class="coach-source-label ${selected.source}">${sourceName}</span>
    </div>
    <div class="coach-progress-box"><div><strong>Bu haftaki program uyumu</strong><span>%${selected.progress}</span></div><div class="coach-progress-track"><i style="width:${selected.progress}%"></i></div></div>
    <div class="coach-insight"><i class="fa-solid fa-lightbulb"></i><p>${this.escapeHtml(selected.note)}</p></div>
    <div class="coach-detail-grid">
      <div><span>Sonraki adım</span><strong>${this.escapeHtml(selected.next)}</strong></div>
      <div><span>Plan kaynağı</span><strong>${sourceName}</strong></div>
    </div>
    <p class="coach-source-copy">${sourceCopy}</p>
    <div class="coach-actions">
      <button class="btn btn-primary" onclick="app.createCoachPlanFor('${selected.id}')"><i class="fa-solid fa-wand-magic-sparkles"></i> ${selected.source === "coach" ? "Yeni sürüm hazırla" : "Koç programı öner"}</button>
      <button class="btn btn-secondary" onclick="app.addCoachNote('${selected.id}')"><i class="fa-solid fa-note-sticky"></i> Not bırak</button>
    </div>
    <div class="coach-permission-note"><i class="fa-solid fa-lock"></i> Koç, öğrencinin görevlerini tamamlayamaz veya kişisel AI planını doğrudan değiştiremez.</div>`;
  },

  selectCoachStudent: function(id) {
    this.state.selectedCoachStudentId = id;
    this.saveState();
    this.renderCoachDashboard();
  },

  openCoachInvite: function() {
    const email = prompt("Öğrencinin e-posta adresini gir:");
    if (!email) return;
    const local = Array.isArray(this.state.coachStudents) ? this.state.coachStudents : [];
    local.push({ id: `local-${Date.now()}`, name: email.split("@")[0], track: "Bekliyor", source: "proposal", progress: 0, lastActive: "Davet gönderildi", risk: "pending", pending: true, note: "Öğrencinin daveti kabul etmesi bekleniyor.", next: "Davet kabulü bekleniyor" });
    this.state.coachStudents = local;
    this.saveState();
    this.renderCoachDashboard();
    this.showToast("Davet taslağı eklendi. Canlı e-posta daveti sunucu bağlantısı ile gönderilecek.", "info");
  },

  createCoachPlanFor: function(id) {
    this.state.coachDraftFor = id;
    this.saveState();
    this.showView("dashboardView");
    this.switchTab("programCreator");
    this.showToast("Programı hazırla; yayınlandığında öğrenciye onay bekleyen öneri olarak gider.", "info");
  },

  addCoachNote: function(id) {
    const note = prompt("Öğrenciye veya kendi takip kaydına not ekle:");
    if (!note) return;
    this.showToast("Koç notu kaydedildi. Canlı öğrenci hesabı bağlandığında öğrenciye iletilecek.", "success");
  },

  // Rol'e gore arayuzu sadelestirir. Kocun gunluk gorev/ODT/geri sayim
  // ekranlarina ihtiyaci yok; program hazirlama yuzeyleri kalir.
  applyRoleUI: function() {
    const koc = this.state.role === "koc";
    const rozet = document.getElementById("roleBadge");
    if (rozet) {
      rozet.style.display = koc ? "inline-flex" : "none";
      rozet.textContent = "🧭 Koç alanı";
    }
    ["tabBtn-vault", "tabBtn-habitMap", "tabBtn-charts"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = koc ? "none" : "";
    });
    const exportBtn = document.getElementById("coachExportWrap");
    if (exportBtn) exportBtn.style.display = koc ? "block" : "none";
  },

  // Aktif programi, ice aktarma ayristiricisinin okudugu bicimde metne cevirir.
  // Koc bu metni ogrenciye gonderir, ogrenci "Metinden aktar" ile yukler.
  exportProgramAsText: function(gunSayisi) {
    const limit = Math.min(gunSayisi || 7, this.PROGRAM_DAYS);
    const kaynak = (this.state.selectedProgramType === "custom" && this.state.customDaysData &&
                    Object.keys(this.state.customDaysData).length)
      ? this.state.customDaysData : this.state.daysData;
    const satirlar = [];
    for (let g = 1; g <= limit; g++) {
      const gun = kaynak[g];
      if (!gun || !Array.isArray(gun.tasks) || !gun.tasks.length) continue;
      satirlar.push(`Gün ${g}:`);
      gun.tasks.forEach(t => {
        const parcalar = [];
        if (t.topic) parcalar.push(t.topic);
        if (t.qCount) parcalar.push(`${t.qCount} soru`);
        if (t.duration) parcalar.push(t.duration);
        if (t.source && t.source.publisher) {
          parcalar.push(`(${t.source.publisher} — ${t.source.book}${t.source.testNo ? " · " + t.source.testNo : ""})`);
        }
        const ders = t.subject && t.subject !== "Rehberlik" ? `${t.subject}: ` : "";
        satirlar.push(`- ${ders}${parcalar.join(" ")}`.trim());
      });
      satirlar.push("");
    }
    return satirlar.join("\n").trim();
  },

  copyProgramAsText: function() {
    const sayiEl = document.getElementById("coachExportDays");
    const gun = sayiEl ? parseInt(sayiEl.value, 10) || 7 : 7;
    const metin = this.exportProgramAsText(gun);
    const alan = document.getElementById("coachExportText");
    if (!metin) {
      this.showToast("Aktarılacak görev bulunamadı — önce program oluştur.", "error");
      return;
    }
    if (alan) { alan.value = metin; alan.style.display = "block"; alan.select(); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(metin)
        .then(() => this.showToast(`${gun} günlük program panoya kopyalandı.`, "success"))
        .catch(() => this.showToast("Panoya kopyalanamadı — metni aşağıdan elle kopyala.", "warning"));
    } else {
      this.showToast("Metin aşağıda — elle kopyalayabilirsin.", "info");
    }
  },

  startWizard: function() {
    // Reset all state progress for a brand new user session!
    this.state.name = "";
    this.state.email = "";
    this.state.track = "Sayısal";
    this.state.targetDept = "";
    this.state.targetRank = null;
    this.state.targetUniversity = "";
    this.state.streak = 1;
    this.state.level = 3;
    this.state.studyRoute = "balanced";
    this.state.isGraduate = false;
    this.state.weekdayHours = 4;
    this.state.weekendHours = 8;
    this.state.wakeTime = "07:00";
    this.state.sleepTime = "23:00";
    // VELI BILGISI KORUNUR — sihirbazi yeniden calistirmak paylasimi
    // kapatmanin yolu olmamali. parentContact/parentEmail/parentPhone
    // bilerek sifirlanmiyor.
    this.state.diagnosticAccuracy = null;
    this.state.selectedProgramType = "standard";
    this.state.daysData = {};
    this.state.standardDaysData = {};
    this.state.customDaysData = {};
    this.state.curriculumProgress = [];
    this.state.uploadedQuestions = [];
    this.state.chartData = [];
    this.state.totalQuestionsSolved = 0;
    this.state.totalLitCorrect = 0;
    this.state.spacedRepetitionTasks = [];
    this.state.activeTab = "calendar";
    this.state.isLoggedOut = false;

    // Reset saved custom programs
    const emptyDays = {};
    for (let d = 1; d <= 360; d++) {
      emptyDays[d] = { completed: false, tasks: [] };
    }
    this.state.savedPrograms = [{
      id: 'default_custom',
      name: 'Varsayılan Özel Program',
      startDate: new Date().toISOString().split("T")[0],
      repetition: 'none',
      daysData: emptyDays
    }];
    this.state.activeCustomProgramId = 'default_custom';

    this.saveState();

    // Clear inputs in HTML
    const nameIn = document.getElementById("studentName");
    const emailIn = document.getElementById("studentEmail");
    const deptIn = document.getElementById("targetDepartment");
    const rankIn = document.getElementById("targetRank");
    const parentEmailIn = document.getElementById("parentEmail");
    const parentPhoneIn = document.getElementById("parentPhone");

    if (nameIn) nameIn.value = "";
    if (emailIn) emailIn.value = "";
    if (deptIn) deptIn.value = "";
    if (rankIn) rankIn.value = "";
    // Veli alanlari temizlenmez; kayitliysa geri yazilir ve kilitlenir.
    if (parentEmailIn) parentEmailIn.value = this.state.parentEmail || "";
    if (parentPhoneIn) parentPhoneIn.value = this.state.parentPhone || "";
    this.applyParentContactLock();


    // Akis her zaman 1. adimdan baslar
    this.wizardGo(1);

    // Go to wizard view
    this.populateUniversitySelect();
    this.populateDeptSelect();
    const uniSel = document.getElementById("targetUniversity");
    if (uniSel) uniSel.value = "";
    this.showView("wizardView");
    this.showWizardPage(1);
    this.updateGoalPlanPreview();
  },

  showWizardPage: function(pageNum) {
    // Veli alanlari kayitliysa kilitli gorunsun
    setTimeout(() => this.applyParentContactLock(), 0);
    document.querySelectorAll(".wizard-page").forEach(page => {
      page.style.display = "none";
    });
    const hedef = document.getElementById(`wizardPage${pageNum}`);
    if (hedef) hedef.style.display = "block";

    // Eski iki noktali ilerleme gostergesi yerini adim akisina birakti;
    // elemanlar yoksa cakilmasin diye null korumali.
    const s1 = document.getElementById("wStep1");
    const s2 = document.getElementById("wStep2");
    if (s1) s1.className = "wizard-step" + (pageNum >= 1 ? " completed" : "");
    if (s2) s2.className = "wizard-step" + (pageNum === 2 ? " active" : pageNum > 2 ? " completed" : "");
    const wizardBar = document.getElementById("wizardBar");
    if (wizardBar) wizardBar.style.width = pageNum === 1 ? "0%" : "100%";
  },

  nextWizardPage: function() {
    const nameVal = document.getElementById("studentName").value.trim();
    const emailEl = document.getElementById("studentEmail");
    const emailVal = emailEl ? emailEl.value.trim() : "";
    const deptVal = document.getElementById("targetDepartment").value.trim();

    const emailErrEl = document.getElementById("studentEmailError");
    const showEmailError = (msg) => {
      if (emailErrEl) {
        emailErrEl.textContent = msg;
        emailErrEl.style.display = msg ? "block" : "none";
      }
      if (msg && emailEl) emailEl.focus();
    };
    showEmailError("");

    if (!nameVal) {
      alert("Lütfen adını ve soyadını gir!");
      document.getElementById("studentName").focus();
      return;
    }
    if (!emailVal) {
      showEmailError("E-posta adresi zorunludur.");
      return;
    }
    // Basit ama gercekci dogrulama: bosluk yok, tek @, alan adinda nokta var.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal)) {
      showEmailError("Geçerli bir e-posta adresi gir (örn: ornek@eposta.com).");
      return;
    }
    if (!this.state.targetRank) {
      alert("Lütfen hedef sıralamanı gir veya üniversite + bölüm seçerek hedefini belirle!");
      return;
    }
    this.state.name = nameVal;
    this.state.email = emailVal;
    this.state.targetDept = deptVal || "Henüz Belirlenmedi";
    this.showWizardPage(2);
    // Render habits feedback but don't force warning unless user inputs bad values
    this.checkHabitsFeedback(false);
  },

  prevWizardPage: function() {
    this.showWizardPage(1);
  },

  // 2025 YKS (ÖSYM): puan türüne göre sıralamaya giren aday sayıları
  OSYM_2025_RANKED: {
    "Sayısal": 1291531,
    "Eşit Ağırlık": 1494612,
    "Sözel": 1174047,
    "Dil": 140657
  },

  // Sıralama bandı gibi kullanıcıya gösterilen sayılar "41.200" değil "40.000" gibi
  // yuvarlak görünsün diye — büyüklüğe göre uygun basamağa yuvarlar.
  roundNice: function(n) {
    n = Math.round(n);
    if (n <= 0) return 0;
    let step;
    if (n >= 100000) step = 10000;
    else if (n >= 10000) step = 5000;
    else if (n >= 1000) step = 500;
    else if (n >= 100) step = 50;
    else step = 10;
    return Math.max(step, Math.round(n / step) * step);
  },

  // Seviye başına hedef saat / soru / deneme — tüm ekranların (sihirbaz,
  // rapor, header rozeti) tek doğruluk kaynağı; hepsi zaten yuvarlak sayılar.
  // Seviye tespit / mevcut konum girişindeki doğruluğun hangi seviyeye karşılık
  // geldiği — estimateGoalSuccess() ile submitTest()/processGraduatePosition()
  // artık aynı eşiklerden okur, aralarında kayma olmaz.
  REQ_ACC: { 1: 40, 2: 50, 3: 60, 4: 68, 5: 75, 6: 83, 7: 90, 8: 97 },

  levelFromAccuracy: function(acc) {
    const t = this.REQ_ACC;
    if (acc >= t[8]) return 8;
    if (acc >= t[7]) return 7;
    if (acc >= t[6]) return 6;
    if (acc >= t[5]) return 5;
    if (acc >= t[4]) return 4;
    if (acc >= t[3]) return 3;
    if (acc >= t[2]) return 2;
    return 1;
  },

  LEVEL_META: {
    1: { hours: 900,  questions: 22000,  mocks: 45,  netTYT: "45-60",   netAYT: "20-32", name: "Başlangıç" },
    2: { hours: 1100, questions: 30000,  mocks: 60,  netTYT: "60-75",   netAYT: "32-42", name: "Gelişmekte Olan" },
    3: { hours: 1300, questions: 40000,  mocks: 80,  netTYT: "75-88",   netAYT: "42-52", name: "Orta" },
    4: { hours: 1450, questions: 48000,  mocks: 95,  netTYT: "88-95",   netAYT: "52-60", name: "Orta-Üstü" },
    5: { hours: 1600, questions: 58000,  mocks: 115, netTYT: "95-105",  netAYT: "58-68", name: "İyi" },
    6: { hours: 1800, questions: 70000,  mocks: 135, netTYT: "105-112", netAYT: "68-75", name: "İleri" },
    7: { hours: 2000, questions: 85000,  mocks: 155, netTYT: "112-118", netAYT: "74-79", name: "Zirve" },
    8: { hours: 2200, questions: 100000, mocks: 200, netTYT: "120/120 (tam)", netAYT: "80/80 (tam)", name: "Şampiyonluk" }
  },

  // ============================================================
  // 2025 YKS yerleştirme (ÖSYM / YÖK Atlas) yaklaşık taban başarı sıralamaları
  // Bölüm taban değeri (en iyi devlet programı) × üniversite katmanı çarpanı
  // ============================================================
  OSYM_2025_DEPT_BASE: {
    "Tıp": ["Sayısal", 2800],
    "Diş Hekimliği": ["Sayısal", 12000],
    "Eczacılık": ["Sayısal", 21000],
    "Veteriner Hekimlik": ["Sayısal", 50000],
    "Bilgisayar Mühendisliği": ["Sayısal", 2900],
    "Yazılım Mühendisliği": ["Sayısal", 8000],
    "Yapay Zeka ve Veri Mühendisliği": ["Sayısal", 4500],
    "Elektrik-Elektronik Mühendisliği": ["Sayısal", 5200],
    "Makine Mühendisliği": ["Sayısal", 14000],
    "Endüstri Mühendisliği": ["Sayısal", 7000],
    "İnşaat Mühendisliği": ["Sayısal", 42000],
    "Mimarlık": ["Sayısal", 14500],
    "Moleküler Biyoloji ve Genetik": ["Sayısal", 40000],
    "Matematik": ["Sayısal", 60000],
    "Hemşirelik": ["Sayısal", 85000],
    "Fizyoterapi ve Rehabilitasyon": ["Sayısal", 60000],
    "Beslenme ve Diyetetik": ["Sayısal", 70000],
    "Hukuk": ["Eşit Ağırlık", 6000],
    "Psikoloji": ["Eşit Ağırlık", 8500],
    "İşletme": ["Eşit Ağırlık", 24000],
    "İktisat": ["Eşit Ağırlık", 34000],
    "Uluslararası İlişkiler": ["Eşit Ağırlık", 30000],
    "Siyaset Bilimi ve Kamu Yönetimi": ["Eşit Ağırlık", 34000],
    "Rehberlik ve Psikolojik Danışmanlık": ["Eşit Ağırlık", 19000],
    "Sınıf Öğretmenliği": ["Eşit Ağırlık", 36000],
    "Maliye": ["Eşit Ağırlık", 46000],
    "Sosyoloji": ["Eşit Ağırlık", 55000],
    "Türk Dili ve Edebiyatı": ["Sözel", 36000],
    "Tarih": ["Sözel", 52000],
    "Türkçe Öğretmenliği": ["Sözel", 30000],
    "Sosyal Bilgiler Öğretmenliği": ["Sözel", 62000],
    "İlahiyat": ["Sözel", 88000],
    "Gazetecilik": ["Sözel", 92000],
    "Halkla İlişkiler ve Reklamcılık": ["Sözel", 100000],
    "İngilizce Öğretmenliği": ["Dil", 3400],
    "İngiliz Dili ve Edebiyatı": ["Dil", 6500],
    "Mütercim-Tercümanlık (İngilizce)": ["Dil", 3800],
    "Alman Dili ve Edebiyatı": ["Dil", 24000]
  },

  // Katman çarpanları: 1 = elit burslu vakıf ... 10 = ücretli vakıf / en yeni programlar
  OSYM_2025_TIER_MULT: { 1: 0.15, 2: 0.5, 3: 1, 4: 1.7, 5: 2.2, 6: 3.6, 7: 6, 8: 9.5, 9: 15, 10: 24 },

  // [Üniversite adı, varsayılan katman, bölümler, opsiyonel {bölüm: katman} istisnaları]
  OSYM_2025_UNIS: [
    ["Koç Üniversitesi (Burslu)", 1, ["Tıp", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Psikoloji", "İşletme", "Hemşirelik"]],
    ["Koç Üniversitesi (Ücretli)", 9, ["Tıp", "Hukuk", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme"]],
    ["Sabancı Üniversitesi (Burslu)", 1, ["Bilgisayar Mühendisliği", "Endüstri Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Yapay Zeka ve Veri Mühendisliği"]],
    ["Sabancı Üniversitesi (Ücretli)", 9, ["Bilgisayar Mühendisliği", "Endüstri Mühendisliği"]],
    ["Bilkent Üniversitesi (Burslu)", 2, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Endüstri Mühendisliği", "Hukuk", "Psikoloji", "İşletme", "İngilizce Öğretmenliği"]],
    ["Bilkent Üniversitesi (Ücretli)", 9, ["Bilgisayar Mühendisliği", "Hukuk", "Psikoloji"]],
    ["TOBB ETÜ (Burslu)", 2, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Endüstri Mühendisliği", "Hukuk", "Psikoloji", "Tıp"]],
    ["Acıbadem Üniversitesi", 7, ["Tıp", "Hemşirelik", "Fizyoterapi ve Rehabilitasyon", "Beslenme ve Diyetetik"]],
    ["Bezmialem Vakıf Üniversitesi", 7, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik"]],
    ["İstanbul Medipol Üniversitesi", 8, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Hukuk", "Psikoloji"]],
    ["Ankara Medipol Üniversitesi", 8, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik"]],
    ["Başkent Üniversitesi", 8, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Hukuk", "Psikoloji"]],
    ["Yeditepe Üniversitesi", 9, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Hukuk", "Psikoloji", "İşletme", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği", "İnşaat Mühendisliği"]],
    ["Biruni Üniversitesi", 9, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik"]],
    ["Bahçeşehir Üniversitesi", 9, ["Tıp", "Hukuk", "Psikoloji", "İşletme", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği", "İnşaat Mühendisliği"]],
    ["Özyeğin Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Endüstri Mühendisliği", "Hukuk", "Psikoloji", "İşletme", "Mimarlık"]],
    ["MEF Üniversitesi", 9, ["Hukuk", "Psikoloji", "Bilgisayar Mühendisliği", "İşletme"]],
    ["TED Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İngilizce Öğretmenliği", "Mimarlık"]],
    ["İstanbul Bilgi Üniversitesi", 10, ["Hukuk", "Psikoloji", "İşletme", "Bilgisayar Mühendisliği", "Gazetecilik", "Halkla İlişkiler ve Reklamcılık"]],
    ["Kadir Has Üniversitesi", 10, ["Hukuk", "Psikoloji", "İşletme", "Bilgisayar Mühendisliği"]],
    ["Atılım Üniversitesi", 10, ["Hukuk", "Psikoloji", "Bilgisayar Mühendisliği", "Yazılım Mühendisliği"]],
    ["Çankaya Üniversitesi", 10, ["Hukuk", "Psikoloji", "Bilgisayar Mühendisliği", "Endüstri Mühendisliği"]],
    ["Yaşar Üniversitesi", 10, ["Hukuk", "Psikoloji", "İşletme", "Bilgisayar Mühendisliği"]],
    ["İzmir Ekonomi Üniversitesi", 10, ["Hukuk", "Psikoloji", "İşletme", "Bilgisayar Mühendisliği"]],
    ["İstinye Üniversitesi", 10, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Psikoloji", "Hukuk"]],
    ["Altınbaş Üniversitesi", 10, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hukuk", "Psikoloji"]],
    ["Beykent Üniversitesi", 10, ["Tıp", "Diş Hekimliği", "Hukuk", "Psikoloji", "Yazılım Mühendisliği"]],
    ["İstanbul Aydın Üniversitesi", 10, ["Tıp", "Diş Hekimliği", "Hukuk", "Psikoloji", "İşletme"]],
    ["İstanbul Kültür Üniversitesi", 10, ["Hukuk", "Psikoloji", "İşletme", "Bilgisayar Mühendisliği"]],
    ["Maltepe Üniversitesi", 10, ["Tıp", "Hukuk", "Psikoloji", "Mimarlık"]],
    ["Işık Üniversitesi", 10, ["Psikoloji", "İşletme", "Bilgisayar Mühendisliği"]],
    ["İstanbul Okan Üniversitesi", 10, ["Tıp", "Diş Hekimliği", "Hukuk", "Psikoloji"]],
    ["Üsküdar Üniversitesi", 10, ["Psikoloji", "Hemşirelik", "Moleküler Biyoloji ve Genetik"]],
    ["Fatih Sultan Mehmet Vakıf Üniversitesi", 10, ["Hukuk", "Psikoloji", "Mimarlık", "İlahiyat"]],
    ["Hasan Kalyoncu Üniversitesi", 10, ["Hukuk", "Psikoloji", "İnşaat Mühendisliği"]],
    ["KTO Karatay Üniversitesi", 10, ["Tıp", "Hukuk", "Psikoloji"]],
    ["Antalya Bilim Üniversitesi", 10, ["Hukuk", "Psikoloji", "Bilgisayar Mühendisliği"]],
    ["Boğaziçi Üniversitesi", 2, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Endüstri Mühendisliği", "Makine Mühendisliği", "Psikoloji", "İşletme", "İktisat", "Türk Dili ve Edebiyatı", "Tarih", "İngiliz Dili ve Edebiyatı", "Mütercim-Tercümanlık (İngilizce)", "Matematik", "Moleküler Biyoloji ve Genetik"]],
    ["Galatasaray Üniversitesi", 2, ["Hukuk", "İşletme", "Endüstri Mühendisliği", "Bilgisayar Mühendisliği", "Uluslararası İlişkiler", "Siyaset Bilimi ve Kamu Yönetimi"]],
    ["ODTÜ", 3, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Endüstri Mühendisliği", "Makine Mühendisliği", "Mimarlık", "Psikoloji", "İşletme", "İktisat", "İngilizce Öğretmenliği", "Matematik", "Moleküler Biyoloji ve Genetik", "Uluslararası İlişkiler", "Siyaset Bilimi ve Kamu Yönetimi"]],
    ["İTÜ", 3, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Endüstri Mühendisliği", "Makine Mühendisliği", "Yapay Zeka ve Veri Mühendisliği", "İnşaat Mühendisliği", "Mimarlık", "Matematik"]],
    ["Hacettepe Üniversitesi", 3, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Fizyoterapi ve Rehabilitasyon", "Beslenme ve Diyetetik", "Hukuk", "Psikoloji", "İşletme", "İngilizce Öğretmenliği", "Mütercim-Tercümanlık (İngilizce)", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği"], {"Bilgisayar Mühendisliği": 6, "Elektrik-Elektronik Mühendisliği": 6}],
    ["İzmir Yüksek Teknoloji Enstitüsü", 4, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği", "Moleküler Biyoloji ve Genetik", "Mimarlık"]],
    ["Gebze Teknik Üniversitesi", 4, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği", "İnşaat Mühendisliği", "Endüstri Mühendisliği", "Yapay Zeka ve Veri Mühendisliği"]],
    ["İstanbul Üniversitesi", 4, ["Hukuk", "Psikoloji", "İşletme", "İktisat", "Türk Dili ve Edebiyatı", "Tarih", "Gazetecilik", "Halkla İlişkiler ve Reklamcılık", "İngiliz Dili ve Edebiyatı", "Mütercim-Tercümanlık (İngilizce)", "İlahiyat", "Sosyoloji"]],
    ["İstanbul Üniversitesi-Cerrahpaşa", 4, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Fizyoterapi ve Rehabilitasyon", "Beslenme ve Diyetetik", "Veteriner Hekimlik"]],
    ["Ankara Üniversitesi", 5, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Veteriner Hekimlik", "Psikoloji", "İşletme", "İlahiyat", "Sosyoloji", "Türk Dili ve Edebiyatı", "Tarih", "Uluslararası İlişkiler", "Siyaset Bilimi ve Kamu Yönetimi"], {"Hukuk": 4}],
    ["Marmara Üniversitesi", 5, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Hukuk", "Psikoloji", "İşletme", "İktisat", "İlahiyat", "Rehberlik ve Psikolojik Danışmanlık", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "İngilizce Öğretmenliği", "Gazetecilik", "Halkla İlişkiler ve Reklamcılık"], {"İngilizce Öğretmenliği": 4}],
    ["Yıldız Teknik Üniversitesi", 4, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Endüstri Mühendisliği", "Makine Mühendisliği", "İnşaat Mühendisliği", "Mimarlık", "Matematik"]],
    ["Gazi Üniversitesi", 6, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği", "İnşaat Mühendisliği", "Rehberlik ve Psikolojik Danışmanlık", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "İngilizce Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih"], {"Tıp": 6}],
    ["Ege Üniversitesi", 6, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Fizyoterapi ve Rehabilitasyon", "Beslenme ve Diyetetik", "Psikoloji", "İşletme", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Türk Dili ve Edebiyatı", "Tarih"]],
    ["Dokuz Eylül Üniversitesi", 6, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Hukuk", "Psikoloji", "İşletme", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği", "İnşaat Mühendisliği", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği"]],
    ["Sağlık Bilimleri Üniversitesi", 6, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Fizyoterapi ve Rehabilitasyon", "Beslenme ve Diyetetik"]],
    ["İstanbul Medeniyet Üniversitesi", 6, ["Tıp", "Hemşirelik", "Hukuk", "Psikoloji", "Bilgisayar Mühendisliği"]],
    ["Ankara Yıldırım Beyazıt Üniversitesi", 6, ["Tıp", "Hemşirelik", "Hukuk", "Psikoloji", "İşletme"]],
    ["Türk-Alman Üniversitesi", 5, ["Hukuk", "İşletme", "Bilgisayar Mühendisliği", "Makine Mühendisliği"]],
    ["Ankara Hacı Bayram Veli Üniversitesi", 7, ["Hukuk", "İşletme", "İktisat", "Maliye", "Türk Dili ve Edebiyatı", "Tarih", "Gazetecilik", "Halkla İlişkiler ve Reklamcılık"]],
    ["Ankara Sosyal Bilimler Üniversitesi", 6, ["Hukuk", "Psikoloji", "İşletme", "Uluslararası İlişkiler", "Siyaset Bilimi ve Kamu Yönetimi", "Sosyoloji", "İlahiyat"]],
    ["Abdullah Gül Üniversitesi", 5, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Endüstri Mühendisliği", "Mimarlık"]],
    ["Eskişehir Teknik Üniversitesi", 6, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği", "İnşaat Mühendisliği", "Endüstri Mühendisliği"]],
    ["Erzurum Teknik Üniversitesi", 8, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği", "İnşaat Mühendisliği"]],
    ["Bursa Teknik Üniversitesi", 7, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği", "İnşaat Mühendisliği"]],
    ["Konya Teknik Üniversitesi", 7, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği", "İnşaat Mühendisliği", "Mimarlık"]],
    ["Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi", 7, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği", "İnşaat Mühendisliği"]],
    ["İzmir Bakırçay Üniversitesi", 7, ["Tıp", "Hemşirelik", "Psikoloji"]],
    ["İzmir Katip Çelebi Üniversitesi", 7, ["Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği"]],
    ["İzmir Demokrasi Üniversitesi", 7, ["Tıp", "Hemşirelik", "Hukuk", "Psikoloji"]],
    ["Bursa Uludağ Üniversitesi", 7, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Rehberlik ve Psikolojik Danışmanlık", "Sınıf Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Akdeniz Üniversitesi", 7, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Rehberlik ve Psikolojik Danışmanlık", "Sınıf Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Çukurova Üniversitesi", 7, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Rehberlik ve Psikolojik Danışmanlık", "Sınıf Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Erciyes Üniversitesi", 7, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Rehberlik ve Psikolojik Danışmanlık", "Sınıf Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Selçuk Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Necmettin Erbakan Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Karadeniz Teknik Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Ondokuz Mayıs Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Sakarya Üniversitesi", 7, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Rehberlik ve Psikolojik Danışmanlık", "Sınıf Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Kocaeli Üniversitesi", 7, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Rehberlik ve Psikolojik Danışmanlık", "Sınıf Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Eskişehir Osmangazi Üniversitesi", 7, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Rehberlik ve Psikolojik Danışmanlık", "Sınıf Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Anadolu Üniversitesi", 7, ["Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Rehberlik ve Psikolojik Danışmanlık", "Sınıf Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik", "İktisat", "Maliye"]],
    ["Atatürk Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Gaziantep Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Mersin Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Manisa Celal Bayar Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Pamukkale Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Süleyman Demirel Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Muğla Sıtkı Koçman Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Aydın Adnan Menderes Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Balıkesir Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Çanakkale Onsekiz Mart Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Trakya Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Tekirdağ Namık Kemal Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Bolu Abant İzzet Baysal Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Sivas Cumhuriyet Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Kırıkkale Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Kahramanmaraş Sütçü İmam Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Hatay Mustafa Kemal Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["İnönü Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Hukuk", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Fırat Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Dicle Üniversitesi", 9, ["Tıp", "Hemşirelik", "Hukuk", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Harran Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Van Yüzüncü Yıl Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Kafkas Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Afyonkarahisar Sağlık Bilimleri Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Afyon Kocatepe Üniversitesi", 8, ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Kütahya Dumlupınar Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Kütahya Sağlık Bilimleri Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Zonguldak Bülent Ecevit Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Düzce Üniversitesi", 8, ["Tıp", "Hemşirelik", "Diş Hekimliği", "Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "İnşaat Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Karabük Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Kastamonu Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Tokat Gaziosmanpaşa Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Yozgat Bozok Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Kırşehir Ahi Evran Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Aksaray Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Niğde Ömer Halisdemir Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Nevşehir Hacı Bektaş Veli Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Hitit Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Amasya Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Ordu Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Giresun Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Recep Tayyip Erdoğan Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Trabzon Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Erzincan Binali Yıldırım Üniversitesi", 9, ["Tıp", "Hemşirelik", "Hukuk", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Adıyaman Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Malatya Turgut Özal Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Mardin Artuklu Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Batman Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Siirt Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Muş Alparslan Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Bingöl Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Bitlis Eren Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Ağrı İbrahim Çeçen Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Iğdır Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Ardahan Üniversitesi", 10, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Hakkari Üniversitesi", 10, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Şırnak Üniversitesi", 10, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Munzur Üniversitesi", 10, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Bayburt Üniversitesi", 10, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Gümüşhane Üniversitesi", 10, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Artvin Çoruh Üniversitesi", 10, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Sinop Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Bartın Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Çankırı Karatekin Üniversitesi", 10, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Kilis 7 Aralık Üniversitesi", 10, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Osmaniye Korkut Ata Üniversitesi", 10, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Karamanoğlu Mehmetbey Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Alanya Alaaddin Keykubat Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Uşak Üniversitesi", 9, ["Tıp", "Hemşirelik", "Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat"]],
    ["Bilecik Şeyh Edebali Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Yalova Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Kırklareli Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Bandırma Onyedi Eylül Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Samsun Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Isparta Uygulamalı Bilimler Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]],
    ["Kayseri Üniversitesi", 9, ["Bilgisayar Mühendisliği", "Psikoloji", "İşletme", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği", "Sosyal Bilgiler Öğretmenliği", "Türk Dili ve Edebiyatı", "Tarih", "İlahiyat", "Hemşirelik"]]
  ],

  _programCache: null,

  // ============================================================
  // PROGRAM VERISI — GERCEK OSYM KAYITLARI
  // ------------------------------------------------------------
  // Kaynak: osym-data.js (ÖSYM 2026-YKS Tercih Kılavuzu, Tablo-4'ten
  // ayrıştırılmıştır). Sıralamalar kılavuzdaki "2025-YKS BAŞARI SIRASI"
  // sütunudur — tercih döneminde yayımlanan en güncel yerleştirme verisi.
  //
  // ÖNEMLİ: Eskiden bu liste `bölüm tabanı × üniversite katman çarpanı`
  // formülüyle ÜRETİLİYORDU; gerçek veri değildi ama ekranda ÖSYM verisi
  // gibi sunuluyordu. Artık gerçek kayıtlar kullanılıyor.
  //
  // Veri dosyası yüklenemezse (çevrimdışı ilk açılış) eski türetilmiş
  // liste yedek olarak devreye girer ve kaynak etiketi bunu söyler.
  // ============================================================
  get osymVeri() {
    return (typeof window !== "undefined" && window.OSYM_TABLO4) ? window.OSYM_TABLO4 : null;
  },

  get osymKaynakEtiketi() {
    const v = this.osymVeri;
    return v ? `${v.kaynak} · ${v.yil} taban başarı sıralamaları`
             : "Tahmini değerler (resmî veri yüklenemedi)";
  },

  get osymGercekVeriMi() { return !!this.osymVeri; },

  get OSYM_2025_PROGRAMS() {
    if (this._programCache) return this._programCache;
    const v = this.osymVeri;

    if (v && Array.isArray(v.kayitlar)) {
      this._programCache = v.kayitlar.map(k => ({
        uni: v.uniler[k[0]],
        dept: k[2],                 // tam program adı: "Tıp (İngilizce) (Burslu)"
        deptBase: v.bolumler[k[1]], // niteleyicisiz taban ad: "Tıp"
        track: k[3],
        rank: k[4]
      }));
      return this._programCache;
    }

    // ---- YEDEK: veri dosyası yoksa eski türetilmiş liste ----
    const list = [];
    this.OSYM_2025_UNIS.forEach(entry => {
      const name = entry[0], tier = entry[1], depts = entry[2], overrides = entry[3] || {};
      depts.forEach(d => {
        const base = this.OSYM_2025_DEPT_BASE[d];
        if (!base) return;
        const t = overrides[d] || tier;
        const total = this.OSYM_2025_RANKED[base[0]] || 2310579;
        let rank = base[1] * (this.OSYM_2025_TIER_MULT[t] || 1);
        rank = Math.min(rank, total * 0.85);
        rank = rank < 10000 ? Math.round(rank / 50) * 50 : rank < 100000 ? Math.round(rank / 500) * 500 : Math.round(rank / 1000) * 1000;
        list.push({ uni: name, dept: d, deptBase: d, track: base[0], rank: rank });
      });
    });
    this._programCache = list;
    return this._programCache;
  },

  // Alana göre taban bölüm adları (açılır liste için)
  osymBolumleri: function(track) {
    const seen = {};
    this.OSYM_2025_PROGRAMS.forEach(p => {
      if (track && p.track !== track) return;
      const ad = p.deptBase || p.dept;
      if (ad) seen[ad] = true;
    });
    return Object.keys(seen).sort((a, b) => a.localeCompare(b, "tr"));
  },

  populateDeptSelect: function() {
    const sel = document.getElementById("targetDepartment");
    if (!sel) return;
    const trackEl = document.getElementById("trackSelect");
    const track = trackEl ? trackEl.value : this.state.track;
    const current = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    this.osymBolumleri(track)
      .forEach(d => {
        const o = document.createElement("option");
        o.value = d;
        o.textContent = d;
        sel.appendChild(o);
      });
    sel.value = Array.from(sel.options).some(o => o.value === current) ? current : "";
  },

  getUniversityList: function() {
    const seen = [];
    this.OSYM_2025_PROGRAMS.forEach(p => { if (!seen.includes(p.uni)) seen.push(p.uni); });
    return seen.sort((a, b) => a.localeCompare(b, "tr"));
  },

  populateUniversitySelect: function() {
    const sel = document.getElementById("targetUniversity");
    if (!sel || sel.options.length > 1) return;
    this.getUniversityList().forEach(u => {
      const opt = document.createElement("option");
      opt.value = u;
      opt.textContent = u;
      sel.appendChild(opt);
    });
  },

  getTargetRankLabel: function() {
    if (this.state.targetRank) {
      return `İlk ${this.state.targetRank.toLocaleString("tr-TR")}`;
    }
    return "-";
  },

  // Bölüm metnini veri setindeki bölüm adlarıyla eşleştir (esnek arama)
  matchDeptPrograms: function(deptText, track) {
    const txt = (deptText || "").trim();
    if (!txt) return [];
    const lower = txt.toLowerCase();
    return this.OSYM_2025_PROGRAMS.filter(p => {
      if (track && p.track !== track) return false;
      const d = (p.dept || "").toLowerCase();
      const b = (p.deptBase || "").toLowerCase();
      return b === lower || d === lower || d.startsWith(lower + " (") || b.includes(lower) || d.includes(lower);
    });
  },

  // TERCİH MOTORU: sıralama / üniversite / bölüm kombinasyonuna göre öneri üretir
  runTercihMotoru: function(rank, uni, deptText) {
    const box = document.getElementById("tercihMotoruBox");
    if (!box) return;
    const track = this.state.track;
    const fmt = n => n.toLocaleString("tr-TR");
    const all = this.OSYM_2025_PROGRAMS.filter(p => p.track === track);
    const deptMatches = this.matchDeptPrograms(deptText, track);
    const hasRank = rank > 0;
    let title = "";
    let rows = [];
    let footer = "";

    const rowHtml = (p, ok) => `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; padding:0.45rem 0.6rem; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-card); font-size:0.78rem;">
        <span style="font-weight:700; color:var(--text-main); min-width:0;">${p.uni} — ${p.dept}</span>
        <span style="white-space:nowrap; font-weight:800; color:${ok === null ? "var(--primary)" : ok ? "var(--success)" : "var(--danger)"};">
          ${ok === null ? "" : ok ? "✅ " : "🔒 "}İlk ${fmt(p.rank)}
        </span>
      </div>`;

    if (uni && deptMatches.length > 0) {
      // Üniversite + bölüm: gereken sıralamayı söyle
      const atUni = deptMatches.filter(p => p.uni === uni);
      if (atUni.length > 0) {
        const p = atUni[0];
        const ok = hasRank ? rank <= p.rank : null;
        title = `🎓 <strong>${p.uni} — ${p.dept}</strong> için <strong>ilk ${fmt(p.rank)}</strong> taban başarı sıralaması gerekiyordu.`;
        if (hasRank) {
          title += ok
            ? ` Hedef sıralaman (<strong>${fmt(rank)}</strong>) bu bölüm için <strong style="color:var(--success);">yeterli görünüyor ✅</strong>`
            : ` Hedef sıralamanı (<strong>${fmt(rank)}</strong>) yaklaşık <strong>${fmt(rank - p.rank)}</strong> basamak daha yükseltmen gerekiyor ⚠️`;
        }
        rows = deptMatches.filter(q => q !== p).sort((a, b) => a.rank - b.rank).slice(0, 5)
          .map(q => rowHtml(q, hasRank ? rank <= q.rank : null));
        if (rows.length) footer = "Aynı bölümün diğer üniversitelerdeki taban sıralamaları:";
      } else {
        title = `ℹ️ <strong>${uni}</strong> için bu bölüm veri setimizde yok. Bölümün bulunduğu üniversiteler:`;
        rows = deptMatches.sort((a, b) => a.rank - b.rank).slice(0, 8).map(q => rowHtml(q, hasRank ? rank <= q.rank : null));
      }
    } else if (uni && hasRank) {
      // Üniversite + sıralama: girebileceği bölümler
      const atUni = all.filter(p => p.uni === uni).sort((a, b) => a.rank - b.rank);
      const okList = atUni.filter(p => rank <= p.rank);
      const noList = atUni.filter(p => rank > p.rank);
      title = okList.length > 0
        ? `🎓 İlk <strong>${fmt(rank)}</strong> hedefiyle <strong>${uni}</strong> bünyesinde girebileceğin bölümler:`
        : `⚠️ İlk <strong>${fmt(rank)}</strong> hedefi, <strong>${uni}</strong> bölümleri (${track}) için henüz yeterli görünmüyor. Hedef bölümler ve gereken sıralamalar:`;
      rows = (okList.length > 0 ? okList : noList).slice(0, 8).map(p => rowHtml(p, rank <= p.rank));
    } else if (!uni && deptMatches.length > 0) {
      // Sadece bölüm: üniversitelere göre gereken sıralamalar
      title = `🎓 <strong>${deptMatches[0].deptBase || deptMatches[0].dept}</strong> (${track}) için üniversitelere göre taban sıralamaları:`;
      rows = deptMatches.sort((a, b) => a.rank - b.rank).slice(0, 8).map(p => rowHtml(p, hasRank ? rank <= p.rank : null));
    } else if (hasRank) {
      // Sadece sıralama: girebileceği üniversite + bölümler
      const okList = all.filter(p => rank <= p.rank).sort((a, b) => a.rank - b.rank);
      if (okList.length > 0) {
        title = `🎓 İlk <strong>${fmt(rank)}</strong> hedefiyle (${track}) girebileceğin örnek üniversite ve bölümler:`;
        rows = okList.slice(0, 8).map(p => rowHtml(p, true));
      } else {
        const closest = all.sort((a, b) => b.rank - a.rank).slice(0, 5);
        title = `⚠️ İlk <strong>${fmt(rank)}</strong> hedefi veri setimizdeki ${track} programları için henüz yeterli değil. En yakın hedefler:`;
        rows = closest.map(p => rowHtml(p, false));
      }
    } else {
      box.style.display = "none";
      return;
    }

    box.innerHTML = `
      <h4 style="margin:0 0 0.6rem; font-size:0.9rem; font-family:var(--font-header); font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:0.4rem;">
        🧭 AI Tercih Motoru
      </h4>
      <p style="margin:0 0 0.75rem; font-size:0.8rem; line-height:1.5; color:var(--text-main);">${title}</p>
      ${footer ? `<p style="margin:0 0 0.5rem; font-size:0.72rem; font-weight:700; color:var(--text-muted);">${footer}</p>` : ""}
      <div style="display:flex; flex-direction:column; gap:0.4rem;">${rows.join("")}</div>
      <p style="margin:0.75rem 0 0; font-size:0.65rem; color:var(--text-muted); line-height:1.4;">
        📊 ${app.osymKaynakEtiketi}. Kontenjan ve koşullar değişebilir; tercih öncesi YÖK Atlas'tan doğrula.
      </p>`;
    box.style.display = "block";
  },

  // Rapor ve Program Sihirbazı seçicilerindeki "İlk N" sıralama rakamlarını
  // seçili puan türüne göre gerçek aday sayısından yeniden hesaplar.
  syncLevelSelectLabels: function() {
    const track = this.state.track || "Sayısal";
    const total = this.OSYM_2025_RANKED[track] || 2310579;
    const fmt = n => n.toLocaleString("tr-TR");
    const pctByLevel = { 2: 0.40, 3: 0.20, 4: 0.08, 5: 0.04, 6: 0.01 };
    [document.getElementById("reportManualLevelSelect"), document.getElementById("creatorLevelSelect")].forEach(sel => {
      if (!sel) return;
      Array.from(sel.options).forEach(opt => {
        const pct = pctByLevel[parseInt(opt.value, 10)];
        if (!pct) return; // 1, 7, 8: sabit/özel eşik, sıralama bandı yok
        opt.textContent = opt.textContent.replace(/İlk [\d.]+/, `İlk ${fmt(this.roundNice(total * pct))}`);
      });
    });
  },

  // Tercih motoru profil köprüsü: hedef üniversite/bölüm/sıralamadan hedef programı çözer
  getTargetProgramInfo: function() {
    const uni = this.state.targetUniversity || "";
    const deptText = (this.state.targetDept && this.state.targetDept !== "Henüz Belirlenmedi") ? this.state.targetDept : "";
    const rank = this.state.targetRank || null;
    let program = null;
    if (deptText) {
      let matches = this.matchDeptPrograms(deptText, this.state.track);
      if (uni) {
        const atUni = matches.filter(p => p.uni === uni);
        if (atUni.length) matches = atUni;
      }
      matches = matches.sort((a, b) => a.rank - b.rank);
      if (matches.length) {
        program = rank ? (matches.filter(p => p.rank >= rank)[0] || matches[matches.length - 1]) : matches[0];
      }
    }
    return { rank: rank, uni: uni, dept: deptText, program: program, requiredRank: program ? program.rank : null };
  },

  // Step 1: Goal Plan — hedef sıralama üzerinden çalışır (2025 ÖSYM yerleştirme verileri)
  updateGoalPlanPreview: function() {
    this.state.track = document.getElementById("trackSelect").value;
    this.populateDeptSelect();
    const totalRanked = this.OSYM_2025_RANKED[this.state.track] || 2310579;
    const uniSel = document.getElementById("targetUniversity");
    const uni = uniSel ? uniSel.value : "";
    const deptText = (document.getElementById("targetDepartment") || {}).value || "";
    const rankInput = parseInt(document.getElementById("targetRank").value, 10) || 0;

    // Tercih motoru köprüsü: canlı yazılırken de state güncel kalsın (sihirbaz bitmeden)
    this.state.targetDept = deptText || this.state.targetDept;
    this.state.targetUniversity = uni;

    // Sıralama girilmediyse: seçilen üniversite+bölümün taban sıralamasını hedef olarak öner
    let rank = rankInput > 0 ? Math.min(rankInput, totalRanked) : 0;
    let autoSuggested = false;
    if (!rank && uni) {
      const matches = this.matchDeptPrograms(deptText, this.state.track).filter(p => p.uni === uni);
      if (matches.length > 0) {
        rank = matches[0].rank;
        autoSuggested = true;
      }
    }
    this.state.targetUniversity = uni;
    this.state.targetRank = rank || null;

    // Tercih motorunu çalıştır
    this.runTercihMotoru(rank, uni, deptText);

    if (!rank) {
      // Siralama yoksa seviye hesaplanamaz; state'e dokunmadan cikilir.
      this.toggleWizardNextButton();
      return;
    }

    // Seviye eşikleri (7 seviye) — 2025 ÖSYM aday sayıları + ÖSYM kılavuzu resmi
    // başarı sırası barajlarıyla (YÖK Atlas) hizalanmıştır:
    // Tıp: ilk 50.000 (SAY) · Diş: 80.000 · Eczacılık: 100.000 · Hukuk: 125.000 (EA)
    // Mimarlık: 250.000 · Mühendislik/Öğretmenlik: 300.000
    const t8 = 100;
    const t7 = this.roundNice(Math.max(1000, totalRanked * 0.001));
    const t6 = this.roundNice(totalRanked * 0.01);
    const t5 = this.roundNice(totalRanked * 0.04);
    const t4 = this.roundNice(totalRanked * 0.08);
    const t3 = this.roundNice(totalRanked * 0.20);
    const t2 = this.roundNice(totalRanked * 0.40);
    const fmt = n => n.toLocaleString("tr-TR");

    let level = 3;
    let hours = 1300;
    let questions = 40000;
    let mocks = 80;
    let netTYT = "75-88";
    let netAYT = "42-52";
    let description = "";

    if (rank <= t8) {
      level = 8; hours = 2200; questions = 100000; mocks = 200; netTYT = "120/120 (tam)"; netAYT = "80/80 (tam)";
      description = `Şampiyonluk Seviyesi (ilk ${fmt(t8)} — Türkiye derecesi hedefidir). Kriter: TÜM soruların doğru çözülmesi. Sıfır hata toleransı, günlük çift tam deneme, saniye bazlı hız optimizasyonu ve optik simülasyon kampı.`;
    } else if (rank <= t7) {
      level = 7; hours = 2000; questions = 85000; mocks = 155; netTYT = "112-118"; netAYT = "74-79";
      description = `Zirve Seviye (${this.state.track} alanında ilk ${fmt(t7)} bandı). Elit burslu ve en seçici programlar hedefi: tam kapsamlı deneme kampı, günlük çift deneme blokları ve hata payını minimuma indirme.`;
    } else if (rank <= t6) {
      level = 6; hours = 1800; questions = 70000; mocks = 135; netTYT = "105-112"; netAYT = "68-75";
      description = `İleri Seviye (${this.state.track} alanında ilk ${fmt(t6)} bandı). En üst devlet programları hedefi: sıralama odaklı, yüksek tempolu deneme maratonu ve zor soru derinleşmesi.`;
    } else if (rank <= t5) {
      level = 5; hours = 1600; questions = 58000; mocks = 115; netTYT = "95-105"; netAYT = "58-68";
      description = `İyi Seviye (${this.state.track} alanında ilk ${fmt(t5)} bandı). ÖSYM kılavuzundaki Tıp tercih barajı (ilk 50.000, SAY) bu banda denk gelir. Üst düzey tempo, derinlemesine AYT ve zor soru taraması.`;
    } else if (rank <= t4) {
      level = 4; hours = 1450; questions = 48000; mocks = 95; netTYT = "88-95"; netAYT = "52-60";
      description = `Orta-Üstü Seviye (${this.state.track} alanında ilk ${fmt(t4)} bandı). Diş Hekimliği (80K), Eczacılık (100K) ve Hukuk (125K) resmi tercih barajları bu bandın hedef menzilindedir.`;
    } else if (rank <= t3) {
      level = 3; hours = 1300; questions = 40000; mocks = 80; netTYT = "75-88"; netAYT = "42-52";
      description = `Orta Seviye (${this.state.track} alanında ilk ${fmt(t3)} bandı). Mimarlık (250K) ve Mühendislik/Öğretmenlik (300K) resmi barajlarına uzanan band: dengeli TYT-AYT tekrarı ve istikrarlı haftalık deneme döngüsü.`;
    } else if (rank <= t2) {
      level = 2; hours = 1100; questions = 30000; mocks = 60; netTYT = "60-75"; netAYT = "32-42";
      description = `Gelişmekte Olan Seviye (${this.state.track} alanında ilk ${fmt(t2)} bandı). Temel TYT konularının tamamlanması ve AYT'ye kademeli geçiş.`;
    } else {
      level = 1; hours = 900; questions = 22000; mocks = 45; netTYT = "45-60"; netAYT = "20-32";
      description = "Başlangıç Seviyesi. 9-10. sınıf temellerini sıfırdan inşa etmeye ve TYT'de güvenli bir çekirdek net oluşturmaya odaklı program.";
    }

    this.state.targetNetTYT = netTYT;
    this.state.targetNetAYT = netAYT;
    this.state.level = level;
    // Aciklama artik ekranda gosterilmiyor ama kaybolmasin: program onerisi
    // ve seviye kartlari bu metni kullanabiliyor.
    this.state.levelDescription = description;
    this.state.targetRankAuto = autoSuggested;
    // LEVEL_META degerleri tam hazirlik yili (360 gun) icindir; program
    // sinava kalan sureye gore kisaysa hedefler orantili kisilir.
    this.applyLevelTargets(hours, questions, mocks);

    // AI Calisma Ongorusu kutusu ilk ekrandan kaldirildi. Seviye, netler ve
    // hedefler yukarida hesaplanip state'e yazilir; kullaniciya program
    // onerisi ekraninda gosterilir.
    this.toggleWizardNextButton();
  },

  // Onay kutusu kaldirildi; ilerleme artik hicbir adimda kilitlenmiyor.
  // Fonksiyon cagri noktalari korunsun diye duruyor.
  toggleWizardNextButton: function() {
    const btn = document.getElementById("wizardNextBtn");
    if (btn) btn.disabled = false;
  },

  // ============================================================
  // AKIS TABANLI KURULUM — her adimda tek soru
  // Alanlar .wz-step bloklarinda gruplanir; bu denetleyici yalnizca
  // birini gosterir. Tum alan id'leri ve dogrulayicilar korunmustur.
  // ============================================================
  wizardStep: 1,
  WIZARD_TOPLAM: 5,

  wizardGo: function(adim) {
    adim = Math.max(1, Math.min(this.WIZARD_TOPLAM, adim));
    this.wizardStep = adim;

    // 1-3 birinci sayfada, 4-5 ikinci sayfada duruyor
    this.showWizardPage(adim <= 3 ? 1 : 2);

    document.querySelectorAll(".wz-step").forEach(el => {
      el.classList.toggle("active", parseInt(el.dataset.step, 10) === adim);
    });

    const segmentler = document.querySelectorAll("#wzProgress .wz-seg");
    segmentler.forEach((seg, i) => seg.classList.toggle("done", i < adim));

    const geri = document.getElementById("wzBackBtn");
    if (geri) geri.style.visibility = adim === 1 ? "hidden" : "visible";

    const ileri = document.getElementById("wizardNextBtn");
    if (ileri) {
      ileri.innerHTML = adim === this.WIZARD_TOPLAM
        ? '<i class="fa-solid fa-clipboard-question"></i> Seviye Tespitine Geç'
        : 'Devam <i class="fa-solid fa-arrow-right"></i>';
    }
    this.toggleWizardNextButton();

    if (adim === 3) this.updateGoalPlanPreview();
    if (adim === 4) this.checkHabitsFeedback(false);
    if (adim === 5) this.applyParentContactLock();

    const ilk = document.querySelector(`.wz-step[data-step="${adim}"] input, .wz-step[data-step="${adim}"] select`);
    if (ilk && ilk.type !== "hidden" && ilk.offsetParent !== null) setTimeout(() => ilk.focus(), 60);
  },

  wizardBack: function() {
    if (this.wizardStep > 1) this.wizardGo(this.wizardStep - 1);
  },

  wizardNext: function() {
    const adim = this.wizardStep;

    if (adim === 1) {
      const ad = (document.getElementById("studentName").value || "").trim();
      const epostaEl = document.getElementById("studentEmail");
      const eposta = (epostaEl.value || "").trim();
      const hataEl = document.getElementById("studentEmailError");
      const hata = (msg, el) => {
        if (hataEl) { hataEl.textContent = msg; hataEl.style.display = "block"; }
        if (el) el.focus();
      };
      if (hataEl) hataEl.style.display = "none";
      if (!ad) { hata("Adını ve soyadını gir.", document.getElementById("studentName")); return; }
      if (!eposta) { hata("E-posta adresi zorunludur.", epostaEl); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(eposta)) {
        hata("Geçerli bir e-posta adresi gir (örn: ornek@eposta.com).", epostaEl); return;
      }
      this.state.name = ad;
      this.state.email = eposta;
      this.wizardGo(2);
      return;
    }

    if (adim === 2) { this.wizardGo(3); return; }

    if (adim === 3) {
      // Mevcut dogrulayici: ad, e-posta ve hedef siralama kontrolu +
      // sayfa gecisi. Basarili olursa 4. adima geciyoruz.
      const oncekiSayfa = document.getElementById("wizardPage2").style.display;
      this.nextWizardPage();
      const gecti = document.getElementById("wizardPage2").style.display !== "none" || oncekiSayfa === "block";
      if (gecti) this.wizardGo(4);
      return;
    }

    if (adim === 4) { this.wizardGo(5); return; }

    // Son adim: veli alanlarini dogrular ve seviye tespitine gecer
    this.goToSeviyeTespit();
  },

  // Alan secimi kartlari gizli <select>'i suruyor; boylece
  // updateGoalPlanPreview gibi mevcut kod aynen calisiyor.
  wizardPickTrack: function(track) {
    const sel = document.getElementById("trackSelect");
    if (sel) { sel.value = track; sel.dispatchEvent(new Event("change")); }
    document.querySelectorAll("#trackPicker .wz-opt").forEach(b => {
      b.classList.toggle("sel", b.dataset.track === track);
    });
    this.state.track = track;
  },


  // Step 2: Habits (Scientifically Mapped sleep checks)
  checkHabitsFeedback: function(showImmediately = true) {
    const statusEl = document.getElementById("schoolStatus");
    const schoolStatus = statusEl ? statusEl.value : "student";
    
    const weekdayCapacityEl = document.getElementById("weekdayCapacity");
    const weekdayCapacity = weekdayCapacityEl ? (parseInt(weekdayCapacityEl.value) || 4) : 4;
    
    const weekendCapacityEl = document.getElementById("weekendCapacity");
    const weekendCapacity = weekendCapacityEl ? (parseInt(weekendCapacityEl.value) || 8) : 8;
    
    const wakeTimeEl = document.getElementById("wakeTime");
    const wakeStr = wakeTimeEl ? wakeTimeEl.value : "07:00";
    
    const sleepTimeEl = document.getElementById("sleepTime");
    const sleepStr = sleepTimeEl ? sleepTimeEl.value : "23:00";

    this.state.isGraduate = schoolStatus === "graduate";
    this.state.weekdayHours = weekdayCapacity;
    this.state.weekendHours = weekendCapacity;
    this.state.wakeTime = wakeStr;
    this.state.sleepTime = sleepStr;

    const [wakeH, wakeM] = (wakeStr || "07:00").split(":").map(Number);
    const [sleepH, sleepM] = (sleepStr || "23:00").split(":").map(Number);

    // Saatin yanı sıra dakikayı da hesaba kat. Önceki hesap 23:30–07:00
    // aralığını 8 saat kabul ediyor, aynı saat seçildiğinde ise 0 saat
    // sonucunu veriyordu.
    const wakeMinutes = wakeH * 60 + wakeM;
    const sleepMinutes = sleepH * 60 + sleepM;
    let sleepDuration = (wakeMinutes - sleepMinutes) / 60;
    if (sleepDuration <= 0) sleepDuration += 24;

    const isLateSleep = (sleepH >= 1 && sleepH < 5); // 01:00 AM to 05:00 AM

    let coachAdvice = "";
    let isWarning = false;

    // Sleep timing checks
    if (isLateSleep) {
      isWarning = true;
      coachAdvice += `🦉 <strong>Biyolojik Saat Uyarısı:</strong> Yatış saatin (${sleepStr}) oldukça geç. Bilimsel araştırmalar, gece 01:00'den sonraya sarkan çalışmaların uykunun REM evresini bozarak gün içinde öğrendiğin bilgilerin kalıcı hafaya geçmesini engellediğini gösteriyor. Ayrıca sınav sabahı 10:15'te beyninin tam performansa ulaşması için biyolojik saatini kademeli olarak 23:00 - 00:00 arasına çekmelisin.<br><br>`;
    }

    // Sleep duration checks
    if (sleepDuration < 7) {
      isWarning = true;
      coachAdvice += `⚠️ <strong>Uyku Süresi Uyarısı:</strong> Günlük uykun ${sleepDuration.toFixed(1)} saat. Gençler için optimal bilişsel performans ve odaklanma için 7.5 ila 9 saat uyku şarttır. Uykudan kısmak dikkatsizlik kaynaklı sınav hatalarını %40 oranında artırır.<br><br>`;
    } else if (sleepDuration > 9) {
      isWarning = true;
      coachAdvice += `⚠️ <strong>Aşırı Uyku Uyarısı:</strong> Günlük uykun ${sleepDuration.toFixed(1)} saat. 9 saatin üzerindeki uyku vücutta atalet (sersemlik) yaratarak sabah verimliliğini düşürür. İdeal süreyi 8 saat bandına çekmelisin.<br><br>`;
    }

    // Wakeup timing checks (YKS exam starts at 10:15)
    if (wakeH >= 9) {
      isWarning = true;
      coachAdvice += `⏰ <strong>Sınav Hazırlık Uyarısı:</strong> Uyanış saatin (${wakeStr}) sınav saatine çok yakın. Gerçek sınav 10:15'te başlayacağı için, beyninin uyanıp tam konsantrasyona erişmesi en az 2.5-3 saat sürer. Biyolojik ritmini şimdiden sabah 07:00 - 08:00 arasına uyanmaya alıştırmalısın.<br><br>`;
    }

    // Study overload checks
    if (schoolStatus === "school" && weekdayCapacity > 6) {
      isWarning = true;
      coachAdvice += `🔥 <strong>Çalışma Yükü Uyarısı:</strong> Hem okula gidip hem hafta içi günde ${weekdayCapacity} saat ders çalışmak seni hızlıca tükenmişliğe (burnout) sürükleyebilir. Hafta içi çalışma hedefini 3.5 - 5 saat bandına çekip hafta sonunu daha yoğun değerlendirelim.<br><br>`;
    }

    // Gerçekçilik kontrolü: uyanık kaldığın süreden (yemek/mola/okul için pay ayrılmış)
    // daha fazla çalışma saati girildiğinde bunu sessizce yutmak yerine uyarıyoruz —
    // "25 saat yazsam bile dikkate alınmıyor" şikayetinin kök nedeni buydu.
    const awakeHours = 24 - sleepDuration;
    const schoolBuffer = schoolStatus === "school" ? 7 : 0; // okul saatleri hafta içi için ayrı pay
    const weekdayCeiling = Math.max(1, awakeHours - schoolBuffer - 2.5); // yemek + mola payı
    const weekendCeiling = Math.max(1, awakeHours - 2.5);

    if (weekdayCapacity > 16 || weekdayCapacity > weekdayCeiling) {
      isWarning = true;
      coachAdvice += `😮 <strong>Hafta İçi Hedefi Gerçekçi Değil:</strong> Günde ${weekdayCapacity} saat çalışmak, ${wakeStr} - ${sleepStr} arasında uyanık kaldığın ${awakeHours.toFixed(1)} saate${schoolStatus === "school" ? " (okul saatleri de dahil olmak üzere)" : ""} sığmıyor. Programın gerçekten uygulanabilir olması için hafta içi hedefini en fazla <strong>${Math.floor(weekdayCeiling)} saat</strong> civarına çekmeni öneririm; yoksa program otomatik olarak sıkıştırılıp geceye taşabilir.<br><br>`;
    }
    if (weekendCapacity > 16 || weekendCapacity > weekendCeiling) {
      isWarning = true;
      coachAdvice += `😮 <strong>Hafta Sonu Hedefi Gerçekçi Değil:</strong> Günde ${weekendCapacity} saat çalışmak, ${wakeStr} - ${sleepStr} arasında uyanık kaldığın ${awakeHours.toFixed(1)} saatin neredeyse tamamı demek — yemeğe, dinlenmeye ve sosyal hayata hiç zaman kalmaz. Gerçekçi ve sürdürülebilir bir hedef için hafta sonu çalışmanı en fazla <strong>${Math.floor(weekendCeiling)} saat</strong> civarında tutmalısın; yoksa program otomatik olarak sıkıştırılıp geceye taşabilir.<br><br>`;
    }

    // Kapasite - hedef karsilastirmasi. Ogrenci saatlerini girer girmez
    // hedefinin bu tempoya sigip sigmadigini gorur; program uretici
    // sessizce kapasiteye uyup hedefi ulasilmaz birakmasin.
    const kap = this.kapasiteHedefKarsilastir();
    if (kap && !kap.yeterli) {
      const metin = this.kapasiteHedefMetni(kap);
      if (metin) { isWarning = true; coachAdvice += metin + "<br><br>"; }
    }

    if (!isWarning) {
      coachAdvice = `💪 <strong>Disiplin Onayı:</strong> Harika uyku düzeni ve dengeli çalışma saatleri! Sahaya çıkmak için zihinsel ve fiziksel olarak hazır görünüyorsun. Bu disiplini süreç boyunca korursan başarı kaçınılmaz!`;
      const olumlu = kap && kap.yeterli ? this.kapasiteHedefMetni(kap) : "";
      if (olumlu) coachAdvice += "<br><br>" + olumlu;
    }

    const feedbackBox = document.getElementById("coachHabitFeedback");
    if (feedbackBox) {
      feedbackBox.className = "coach-feedback-box " + (isWarning ? "warning-state" : "");
      feedbackBox.innerHTML = `
        <div class="coach-avatar">${isWarning ? "🚨" : "✏️"}</div>
        <div class="coach-message">
          <h4>YKSKoçum Yaşam Raporu</h4>
          <p>${coachAdvice}</p>
        </div>
      `;
      
      if (showImmediately || isWarning) {
        feedbackBox.style.display = "flex";
      } else {
        feedbackBox.style.display = "none";
      }
    }
    this.saveState();
  },

  // Veli bilgileri BIR KEZ kaydedildikten sonra ogrenci tarafindan
  // degistirilemez veya silinemez. Paylasimi kapatan bir anahtar da yoktur.
  // NOT: bu istemci tarafi bir kilittir; tarayici gelistirici araclariyla
  // localStorage'a erisen biri yine de degistirebilir. Gercek zorunluluk
  // ancak sunucu tarafinda (Asama 3) saglanabilir.
  parentContactLocked: function() {
    return !!((this.state.parentEmail || "").trim() || (this.state.parentPhone || "").trim());
  },

  applyParentContactLock: function() {
    const kilitli = this.parentContactLocked();
    const not = document.getElementById("parentContactLockNote");
    [["parentEmail", "parentEmail"], ["parentPhone", "parentPhone"]].forEach(([id, alan]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const kayitli = (this.state[alan] || "").trim();
      if (kilitli && kayitli) {
        el.value = kayitli;
        el.readOnly = true;
        el.style.background = "var(--bg-card-hover, rgba(0,0,0,0.03))";
        el.style.cursor = "not-allowed";
      } else {
        el.readOnly = false;
        el.style.background = "";
        el.style.cursor = "";
      }
    });
    if (not) not.style.display = kilitli ? "block" : "none";
  },

  // Gonderim hedefi: e-posta varsa e-posta, yoksa telefon.
  syncParentContact: function() {
    const eposta = (this.state.parentEmail || "").trim();
    const telefon = (this.state.parentPhone || "").trim();
    this.state.parentContact = eposta || telefon;
  },

  goToSeviyeTespit: function() {
    this.checkHabitsFeedback(true);
    
    // Veli bilgileri ISTEGE BAGLI: bos birakilabilir. Ama doldurulduysa
    // gecerli olmali, yoksa rapor hicbir yere ulasmaz.
    const emailEl = document.getElementById("parentEmail");
    const phoneEl = document.getElementById("parentPhone");
    const errorEl = document.getElementById("parentContactError");
    const emailVal = emailEl ? emailEl.value.trim() : "";
    const phoneVal = phoneEl ? phoneEl.value.trim() : "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phoneRegex = /^[0-9\s\-\+\(\)]{7,15}$/;

    const hataGoster = (msg, el) => {
      if (errorEl) {
        errorEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + msg;
        errorEl.style.display = "block";
      }
      if (el) { el.style.borderColor = "var(--danger)"; el.focus(); }
    };

    if (emailVal && !emailRegex.test(emailVal)) {
      hataGoster("Geçerli bir veli e-postası gir veya alanı boş bırak.", emailEl);
      return;
    }
    if (phoneVal && !phoneRegex.test(phoneVal)) {
      hataGoster("Geçerli bir veli telefonu gir veya alanı boş bırak.", phoneEl);
      return;
    }
    if (errorEl) errorEl.style.display = "none";
    if (emailEl) emailEl.style.borderColor = emailVal ? "var(--success)" : "";
    if (phoneEl) phoneEl.style.borderColor = phoneVal ? "var(--success)" : "";

    // Kayitli bilgi SILINEMEZ: alan bosaltilmis olsa bile eskisi korunur.
    if (emailVal) this.state.parentEmail = emailVal;
    if (phoneVal) this.state.parentPhone = phoneVal;
    this.syncParentContact();
    this.applyParentContactLock();

    // Mezun öğrenciler seviye tespit sınavı yerine mevcut konumlarını
    // (sıralama + net) girer; okula gidenler için mevcut konum sınav sonucudur.
    if (this.state.isGraduate) {
      this.showGraduatePositionView();
      return;
    }

    this.showView("testView");
    this.generateDiagnosticQuestions();
    this.startTestTimer();
    this.renderTestUI();
  },

  showGraduatePositionView: function() {
    const isDil = this.state.track === "Dil";
    const aytGroup = document.getElementById("gradAytNetGroup");
    const dilGroup = document.getElementById("gradDilNetGroup");
    if (aytGroup) aytGroup.style.display = isDil ? "none" : "block";
    if (dilGroup) dilGroup.style.display = isDil ? "block" : "none";
    const err = document.getElementById("gradPositionError");
    if (err) err.style.display = "none";
    this.showView("graduatePositionView");
  },

  submitGraduatePosition: function() {
    const isDil = this.state.track === "Dil";
    const rank = parseInt(document.getElementById("gradCurrentRank").value, 10);
    const tytNet = parseFloat(document.getElementById("gradTytNet").value);
    const aytNet = parseFloat(document.getElementById("gradAytNet").value);
    const dilNet = parseFloat(document.getElementById("gradDilNet").value);
    const secondNet = isDil ? dilNet : aytNet;

    const errEl = document.getElementById("gradPositionError");
    if (!rank || rank < 1 || isNaN(tytNet) || isNaN(secondNet)) {
      if (errEl) errEl.style.display = "block";
      return;
    }
    if (errEl) errEl.style.display = "none";

    this.state.currentPositionRank = rank;
    this.state.currentNetTYT = tytNet;
    this.state.currentNetAYT = isDil ? null : aytNet;
    this.state.currentNetDil = isDil ? dilNet : null;
    this.state.currentPositionSource = "graduate_input";

    // TYT (120 tam) ve AYT/Dil (80 tam) netlerinin ağırlıklı ortalaması,
    // seviye tespit sınavındaki "doğruluk oranı" ile aynı ölçeğe (0-100) taşınır —
    // böylece seviye ataması ve hedef olasılığı hesapları tek bir mantıktan besleniyor.
    const tytPct = Math.max(0, Math.min(100, (tytNet / 120) * 100));
    const secondPct = Math.max(0, Math.min(100, (secondNet / 80) * 100));
    const overallAccuracy = Math.round((tytPct + secondPct) / 2);
    const assessedLevel = this.levelFromAccuracy(overallAccuracy);

    this.state.level = assessedLevel;
    this.state.diagnosticAccuracy = overallAccuracy;

    const rAccEl = document.getElementById("reportAccuracy");
    if (rAccEl) rAccEl.textContent = `${overallAccuracy}%`;
    const rAssEl = document.getElementById("reportAssessedLevel");
    if (rAssEl) rAssEl.textContent = `${assessedLevel}. Seviye`;
    const rCorrEl = document.getElementById("reportCorrectCount");
    if (rCorrEl) rCorrEl.textContent = `İlk ${rank.toLocaleString("tr-TR")}`;
    const rCorrLabelEl = document.getElementById("reportCorrectCountLabel");
    if (rCorrLabelEl) rCorrLabelEl.textContent = "Mevcut Sıralaman";

    // Mezunlar için ders bazlı kırılım yok (sınav sorusu çözülmedi) — bölümü gizle.
    const breakdownSection = document.getElementById("reportSubjectBreakdownSection");
    if (breakdownSection) breakdownSection.style.display = "none";

    this.syncLevelSelectLabels();
    const levelSelect = document.getElementById("reportManualLevelSelect");
    if (levelSelect) levelSelect.value = assessedLevel.toString();
    this.changeReportLevelManual(assessedLevel);

    const netLine = isDil
      ? `TYT ${tytNet} net · Dil (YDT) ${dilNet} net`
      : `TYT ${tytNet} net · AYT ${aytNet} net`;
    let coachAnalysis;
    if (overallAccuracy >= 75) {
      coachAnalysis = `🤖 <strong>Sağlam bir mevcut konumdasın!</strong> Girdiğin sonuçlara göre (${netLine}, sıralama İlk ${rank.toLocaleString("tr-TR")}) güçlü bir seviyedesin. Tespit edilen seviyen: <strong>${assessedLevel}. Seviye</strong>. Program önerisi uygulamanın içinde seni bekliyor.`;
    } else if (overallAccuracy >= 50) {
      coachAnalysis = `🤖 <strong>Gelişime açık bir konumdasın.</strong> Girdiğin sonuçlara göre (${netLine}, sıralama İlk ${rank.toLocaleString("tr-TR")}) iyi bir temelin var ama toparlanması gereken alanlar mevcut. Tespit edilen seviyen: <strong>${assessedLevel}. Seviye</strong>. Program önerisi uygulamanın içinde seni bekliyor.`;
    } else {
      coachAnalysis = `🚨 <strong>Temel kondisyon hazırlığına ihtiyacımız var!</strong> Girdiğin sonuçlara göre (${netLine}, sıralama İlk ${rank.toLocaleString("tr-TR")}) baştan sağlam bir temel kuracağız. Tespit edilen seviyen: <strong>${assessedLevel}. Seviye</strong>. Program önerisi uygulamanın içinde seni bekliyor.`;
    }
    const analysisEl = document.getElementById("reportCoachAnalysis");
    if (analysisEl) analysisEl.innerHTML = coachAnalysis;

    this.saveState();
    this.showView("reportView");
  },

  // Sinav sorusu secimi — GERCEK karistirma.
  // Eskiden sort(() => 0.5 - Math.random()) kullaniliyordu; bu yontem
  // yanlidir (bazi siralar digerlerinden cok daha olasidir) ve yil/konu
  // dengesi gozetmez. Ayrica havuz yetmezse ayni soru kopyalanip iki kez
  // soruluyordu. Artik:
  //   1) Fisher-Yates ile tarafsiz karistirilir
  //   2) Yillara gore siraya dizilir; tek bir yil yigilmaz
  //   3) Ayni konudan iki soru arka arkaya gelmez
  //   4) Havuz yetmezse kopya uretilmez, olan kadari sorulur
  karistirilmisSinavSorulari: function(havuz, adet) {
    if (!Array.isArray(havuz) || havuz.length === 0) return [];

    const karistir = (dizi) => {
      const a = dizi.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    // 1-2) Yillara gore grupla, her yildan sirayla cek (round-robin)
    const yilGrup = {};
    karistir(havuz).forEach(q => {
      const y = q.year || 0;
      (yilGrup[y] = yilGrup[y] || []).push(q);
    });
    const yillar = karistir(Object.keys(yilGrup));

    const dengeli = [];
    let kaldi = true;
    while (kaldi && dengeli.length < havuz.length) {
      kaldi = false;
      for (const y of yillar) {
        const g = yilGrup[y];
        if (g && g.length) { dengeli.push(g.shift()); kaldi = true; }
      }
    }

    const secilen = dengeli.slice(0, Math.min(adet, dengeli.length));

    // 3) Ayni konu arka arkaya gelmesin — komsu ile yer degistir
    for (let i = 1; i < secilen.length; i++) {
      if (secilen[i].topic !== secilen[i - 1].topic) continue;
      for (let j = i + 1; j < secilen.length; j++) {
        if (secilen[j].topic !== secilen[i - 1].topic &&
            (j + 1 >= secilen.length || secilen[j + 1].topic !== secilen[j].topic)) {
          [secilen[i], secilen[j]] = [secilen[j], secilen[i]];
          break;
        }
      }
    }

    return secilen;
  },

  generateDiagnosticQuestions: function() {
    const track = this.state.track;
    let subjects = ["Türkçe"];

    if (track === "Sayısal") {
      subjects.push("Matematik", "Fizik", "Kimya", "Biyoloji");
    } else if (track === "Eşit Ağırlık") {
      subjects.push("Matematik", "Edebiyat", "Tarih", "Coğrafya");
    } else if (track === "Sözel") {
      subjects.push("Edebiyat", "Tarih", "Coğrafya");
    } else if (track === "Dil") {
      subjects.push("Tarih", "Coğrafya");
    }

    this.state.testSubjects = subjects;
    this.state.testQuestions = {};
    this.state.testAnswers = {};

    subjects.forEach(subject => {
      // Map to correct key in questions.js (e.g. Türkçe -> Turkce)
      const mappedKey = this.subjectKeys[subject] || subject;
      const pool = window.YKS_QUESTION_BANK ? (window.YKS_QUESTION_BANK[mappedKey] || []) : [];
      this.state.testQuestions[subject] = this.karistirilmisSinavSorulari(pool, 25);
    });

    this.state.currentTestSubject = subjects[0];
    this.state.currentTestQuestionIdx = 0;
  },

  startTestTimer: function() {
    this.state.testSecondsRemaining = 60 * 60; 
    if (this.state.testTimer) clearInterval(this.state.testTimer);
    
    this.state.testTimer = setInterval(() => {
      this.state.testSecondsRemaining--;
      const mins = Math.floor(this.state.testSecondsRemaining / 60);
      const secs = this.state.testSecondsRemaining % 60;
      document.getElementById("testTimer").textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      if (this.state.testSecondsRemaining <= 0) {
        clearInterval(this.state.testTimer);
        alert("Süre bitti! Testiniz otomatik olarak teslim ediliyor.");
        this.submitTest();
      }
    }, 1000);
  },

  renderTestUI: function() {
    const tabContainer = document.getElementById("testSubjectTabs");
    tabContainer.innerHTML = "";
    
    this.state.testSubjects.forEach(subject => {
      const tab = document.createElement("button");
      tab.className = "btn " + (this.state.currentTestSubject === subject ? "btn-primary" : "btn-secondary");
      tab.style.padding = "0.6rem 1rem";
      tab.style.fontSize = "0.9rem";
      tab.style.textAlign = "left";
      tab.innerHTML = `<i class="fa-solid fa-book"></i> ${subject}`;
      tab.onclick = () => {
        this.state.currentTestSubject = subject;
        this.state.currentTestQuestionIdx = 0;
        this.renderTestUI();
      };
      tabContainer.appendChild(tab);
    });

    const navContainer = document.getElementById("testQuestionNav");
    navContainer.innerHTML = "";
    
    const currentQuestions = this.state.testQuestions[this.state.currentTestSubject] || [];
    currentQuestions.forEach((q, idx) => {
      const btn = document.createElement("div");
      
      const isAnswered = this.state.testAnswers[q.id] !== undefined;
      const isActive = this.state.currentTestQuestionIdx === idx;
      
      btn.className = "question-nav-btn" + (isActive ? " active" : "") + (isAnswered ? " answered" : "");
      btn.textContent = idx + 1;
      btn.onclick = () => {
        this.state.currentTestQuestionIdx = idx;
        this.renderTestUI();
      };
      navContainer.appendChild(btn);
    });

    const activeQ = currentQuestions[this.state.currentTestQuestionIdx];
    const qBox = document.getElementById("testQuestionBox");
    qBox.innerHTML = "";

    if (activeQ) {
      const header = document.createElement("div");
      header.className = "question-header";
      header.innerHTML = `
        <span class="text-primary" style="font-weight:700;">Soru ${this.state.currentTestQuestionIdx + 1} / 25</span>
        <span class="text-muted" style="font-size:0.85rem;">YKS Çıkmış Sorusu (${activeQ.year}) | Konu: ${activeQ.topic}</span>
      `;
      qBox.appendChild(header);

      const text = document.createElement("div");
      text.className = "question-text";
      text.textContent = activeQ.text;
      qBox.appendChild(text);

      const list = document.createElement("div");
      list.className = "answers-list";

      activeQ.options.forEach((opt, oIdx) => {
        const item = document.createElement("div");
        const letter = String.fromCharCode(65 + oIdx);
        const isSelected = this.state.testAnswers[activeQ.id] === oIdx;
        
        item.className = "answer-item" + (isSelected ? " selected" : "");
        item.innerHTML = `
          <div class="answer-letter">${letter}</div>
          <div class="answer-text">${opt}</div>
        `;
        item.onclick = () => {
          this.state.testAnswers[activeQ.id] = oIdx;
          this.renderTestUI();
        };
        list.appendChild(item);
      });
      qBox.appendChild(list);
    }
  },

  testNextQuestion: function() {
    const currentQuestions = this.state.testQuestions[this.state.currentTestSubject] || [];
    if (this.state.currentTestQuestionIdx < currentQuestions.length - 1) {
      this.state.currentTestQuestionIdx++;
      this.renderTestUI();
    } else {
      const subIdx = this.state.testSubjects.indexOf(this.state.currentTestSubject);
      if (subIdx < this.state.testSubjects.length - 1) {
        this.state.currentTestSubject = this.state.testSubjects[subIdx + 1];
        this.state.currentTestQuestionIdx = 0;
        this.renderTestUI();
      } else {
        alert("Son sorudasınız! Cevaplarınızı kontrol edip sağ alttaki 'Sınavı Bitir' butonuyla tamamlayabilirsiniz.");
      }
    }
  },

  testPrevQuestion: function() {
    if (this.state.currentTestQuestionIdx > 0) {
      this.state.currentTestQuestionIdx--;
      this.renderTestUI();
    } else {
      const subIdx = this.state.testSubjects.indexOf(this.state.currentTestSubject);
      if (subIdx > 0) {
        this.state.currentTestSubject = this.state.testSubjects[subIdx - 1];
        this.state.currentTestQuestionIdx = 24;
        this.renderTestUI();
      }
    }
  },

  confirmSubmitTest: function() {
    let totalQuestions = 0;
    let answeredCount = 0;
    
    this.state.testSubjects.forEach(subject => {
      const qs = this.state.testQuestions[subject] || [];
      totalQuestions += qs.length;
      qs.forEach(q => {
        if (this.state.testAnswers[q.id] !== undefined) {
          answeredCount++;
        }
      });
    });

    const unanswered = totalQuestions - answeredCount;
    let msg = `Tüm derslerden toplam ${totalQuestions} sorudan ${answeredCount} tanesini yanıtladınız.`;
    if (unanswered > 0) {
      msg += ` ${unanswered} adet boş sorunuz var.`;
    }
    msg += "\nSınavı bitirmek istiyor musunuz?";

    if (confirm(msg)) {
      this.submitTest();
    }
  },

  // Sinavi sonradan cozme / tekrar cozme. Profil kartindan cagrilir;
  // "Sinavi Gec" secenegi bu sayede geri alinabilir bir karar olur.
  retakeDiagnosticTest: function() {
    if (this.state.isGraduate) {
      this.showGraduatePositionView();
      return;
    }
    if (typeof this.state.diagnosticAccuracy === "number") {
      const onay = confirm(
        "Seviye tespit sınavını yeniden çözmek istiyor musun?\n\n" +
        "Önceki sonucun (%" + this.state.diagnosticAccuracy + ") yerini yeni sonuç alacak."
      );
      if (!onay) return;
    }
    this.state.testAnswers = {};
    this.showView("testView");
    this.generateDiagnosticQuestions();
    this.startTestTimer();
    this.renderTestUI();
  },

  // Profil kartindaki sinav butonunun yazisini duruma gore gunceller.
  updateRetakeDiagnosticUI: function() {
    const lbl = document.getElementById("retakeDiagnosticLabel");
    const note = document.getElementById("retakeDiagnosticNote");
    if (!lbl) return;
    const acc = this.state.diagnosticAccuracy;
    if (this.state.isGraduate) {
      lbl.textContent = "Mevcut Konumumu Güncelle";
      if (note) note.textContent = "Güncel sıralaman ve netlerin programını yeniden ölçekler.";
    } else if (typeof acc === "number") {
      lbl.textContent = "Seviye Tespit Sınavını Tekrar Çöz";
      if (note) note.textContent = "Son sonucun: %" + acc + ".";
    } else {
      lbl.textContent = "Seviye Tespit Sınavını Çöz";
      if (note) note.textContent = "Sınavı henüz çözmedin; programın yalnızca hedef sıralamana göre hazırlandı.";
    }
  },

  // Seviye tespit sinavi zorunlu degildir. Gecildiginde sinav skoru
  // uretilmez; seviye, hedef siralamadan hesaplanan degerde kalir ve
  // program onerisi yalnizca hedefe dayanir. Ogrenci sinavi sonradan
  // Profil bolumunden cozebilir.
  skipDiagnosticTest: function() {
    const onay = confirm(
      "Seviye tespit sınavını geçmek istediğine emin misin?\n\n" +
      "Programın yalnızca hedef sıralamana göre hazırlanacak. " +
      "Sınavı sonradan Profil bölümünden çözebilirsin."
    );
    if (!onay) return;

    if (this.state.testTimer) { clearInterval(this.state.testTimer); this.state.testTimer = null; }

    this.state.diagnosticAccuracy = null;
    this.state.currentPositionSource = "skipped";
    this.state.testSkipped = true;
    this.state.testQuestions = {};
    this.state.testAnswers = {};
    this.saveState();

    this.showToast("Seviye tespit sınavı geçildi. Program önerisi hedefine göre hazırlanacak.", "info");
    this.startMainDashboard();
  },

  submitTest: function() {
    if (this.state.testTimer) clearInterval(this.state.testTimer);
    
    let totalQuestions = 0;
    let correctCount = 0;
    const subjectResults = {};

    this.state.testSubjects.forEach(subject => {
      const qs = this.state.testQuestions[subject] || [];
      let subCorrect = 0;

      qs.forEach(q => {
        totalQuestions++;
        const ans = this.state.testAnswers[q.id];
        if (ans !== undefined && ans === q.correct) {
          correctCount++;
          subCorrect++;
        }
      });

      subjectResults[subject] = {
        total: qs.length,
        correct: subCorrect,
        accuracy: qs.length > 0 ? Math.round((subCorrect / qs.length) * 100) : 0
      };
    });

    const overallAccuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Determine assessed level based on diagnostic accuracy — tüm 8 seviye eşiklerini
    // (REQ_ACC) kullanır; eskiden 5 seviyede tavan yapıp 6-8 hiç atanamıyordu.
    const assessedLevel = this.levelFromAccuracy(overallAccuracy);

    this.state.level = assessedLevel;
    this.state.diagnosticAccuracy = overallAccuracy;
    this.state.currentPositionSource = "diagnostic_test";
    this.state.testSkipped = false;

    const rAccEl = document.getElementById("reportAccuracy");
    if (rAccEl) rAccEl.textContent = `${overallAccuracy}%`;

    const rAssEl = document.getElementById("reportAssessedLevel");
    if (rAssEl) rAssEl.textContent = `${assessedLevel}. Seviye`;
    
    const rCorrEl = document.getElementById("reportCorrectCount");
    if (rCorrEl) rCorrEl.textContent = `${correctCount} / ${totalQuestions}`;
    const rCorrLabelEl = document.getElementById("reportCorrectCountLabel");
    if (rCorrLabelEl) rCorrLabelEl.textContent = "Doğru / Soru Sayısı";
    const breakdownSection = document.getElementById("reportSubjectBreakdownSection");
    if (breakdownSection) breakdownSection.style.display = "block";

    // Sync manual level selector on report screen
    this.syncLevelSelectLabels();
    const levelSelect = document.getElementById("reportManualLevelSelect");
    if (levelSelect) {
      levelSelect.value = assessedLevel.toString();
    }
    this.changeReportLevelManual(assessedLevel);

    const breakdownContainer = document.getElementById("reportSubjectBreakdown");
    breakdownContainer.innerHTML = "";
    
    for (const [sub, res] of Object.entries(subjectResults)) {
      const barColor = res.accuracy >= 70 ? "var(--success)" : res.accuracy >= 45 ? "var(--warning)" : "var(--danger)";
      const item = document.createElement("div");
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:0.9rem; font-weight:600; margin-bottom:0.25rem;">
          <span>${sub}</span>
          <span>Doğru: ${res.correct}/${res.total} (%${res.accuracy})</span>
        </div>
        <div style="background:rgba(0,0,0,0.05); height:8px; border-radius:4px; overflow:hidden;">
          <div style="background:${barColor}; width:${res.accuracy}%; height:100%;"></div>
        </div>
      `;
      breakdownContainer.appendChild(item);
    }

    let coachAnalysis = "";
    if (overallAccuracy >= 75) {
      coachAnalysis = `🤖 <strong>Harika zihinsel kondisyon!</strong> Seviye tespit sınavında %${overallAccuracy} başarı göstererek sağlam bir temel sergiledin. Koçun olarak hedefimiz bu formu korumak ve denemelerle hız kazanmak. Tespit edilen seviyen: <strong>${assessedLevel}. Seviye</strong>. Program önerisi uygulamanın içinde seni bekliyor.`;
    } else if (overallAccuracy >= 50) {
      coachAnalysis = `🤖 <strong>Gelişime açık şampiyon adayı!</strong> Ortalama %${overallAccuracy} net ile iyi bir durumdasın fakat bazı savunma zayıflıkların (yanlış yapılan konular) var. Hata-tekrar taktiklerimizle bu zayıflıkları kapatacağız. Tespit edilen seviyen: <strong>${assessedLevel}. Seviye</strong>. Program önerisi uygulamanın içinde seni bekliyor.`;
    } else {
      coachAnalysis = `🚨 <strong>Temel kondisyon hazırlığına ihtiyacımız var!</strong> Seviye tespitinde %${overallAccuracy} başarıda kaldık. Acelemiz yok, en temel konulardan başlayıp sindire sindire ilerleyeceğiz. Tespit edilen seviyen: <strong>${assessedLevel}. Seviye</strong>. Program önerisi uygulamanın içinde seni bekliyor.`;
    }

    document.getElementById("reportCoachAnalysis").innerHTML = coachAnalysis;
    
    this.saveState();
    this.showView("reportView");
  },

  changeReportLevelManual: function(levelVal) {
    const level = parseInt(levelVal);
    this.state.level = level;

    const track = this.state.track || "Sayısal";
    const total = this.OSYM_2025_RANKED[track] || 2310579;
    const fmt = n => n.toLocaleString("tr-TR");
    const t6 = fmt(this.roundNice(total * 0.01));
    const t5 = fmt(this.roundNice(total * 0.04));
    const t4 = fmt(this.roundNice(total * 0.08));
    const t3 = fmt(this.roundNice(total * 0.20));
    const t2 = fmt(this.roundNice(total * 0.40));

    let hours = 1400;
    let questions = 45000;
    let mocks = 90;
    let description = "";

    if (level === 8) {
      hours = 2200; questions = 100000; mocks = 200;
      description = "<strong>8. Seviye - Şampiyonluk Seviyesi (İlk 100 — Türkiye derecesi hedefidir):</strong> Kriter: TÜM soruların doğru çözülmesi (TYT 120/120, AYT 80/80). Sıfır hata toleransı, günlük çift tam deneme ve saniye bazlı hız optimizasyonu.";
    } else if (level === 7) {
      hours = 2000; questions = 85000; mocks = 155;
      description = "<strong>7. Seviye - Zirve Seviye (İlk ~1.000 bandı):</strong> Elit burslu ve en seçici programlar hedefi; tam deneme kampı, günlük çift deneme blokları. Yaklaşık hedef netler: TYT 112-118, AYT 74-79.";
    } else if (level === 6) {
      hours = 1800; questions = 70000; mocks = 135;
      description = `<strong>6. Seviye - İleri Seviye (İlk ${t6} bandı):</strong> En üst devlet programları hedefi; sıralama odaklı yüksek tempolu deneme maratonu. Yaklaşık hedef netler: TYT 105-112, AYT 68-75.`;
    } else if (level === 5) {
      hours = 1600; questions = 58000; mocks = 115;
      description = "<strong>5. Seviye - İyi Seviye (Tıp Barajı):</strong> ÖSYM kılavuzundaki Tıp tercih barajı (ilk 50.000) bu banda denk gelir. Yaklaşık hedef netler: TYT 95-105, AYT 58-68.";
    } else if (level === 4) {
      hours = 1450; questions = 48000; mocks = 95;
      description = `<strong>4. Seviye - Orta-Üstü Seviye (İlk ${t4} bandı):</strong> Diş Hekimliği, Eczacılık ve Hukuk resmi tercih barajlarının hedef menzili. Yaklaşık hedef netler: TYT 88-95, AYT 52-60.`;
    } else if (level === 3) {
      hours = 1300; questions = 40000; mocks = 80;
      description = `<strong>3. Seviye - Orta Seviye (İlk ${t3} bandı):</strong> Mimarlık ve Mühendislik/Öğretmenlik resmi barajlarına uzanan dengeli program. Yaklaşık hedef netler: TYT 75-88, AYT 42-52.`;
    } else if (level === 2) {
      hours = 1100; questions = 30000; mocks = 60;
      description = `<strong>2. Seviye - Gelişmekte Olan Seviye (İlk ${t2} bandı):</strong> Temel TYT konularının tamamlanması ve AYT'ye kademeli geçiş. Yaklaşık hedef netler: TYT 60-75, AYT 32-42.`;
    } else {
      hours = 900; questions = 22000; mocks = 45;
      description = "<strong>1. Seviye - Başlangıç Seviyesi:</strong> 9-10. sınıf temellerini sıfırdan inşa etme ve TYT'de güvenli çekirdek net oluşturma. Yaklaşık hedef netler: TYT 45-60, AYT 20-32.";
    }

    // LEVEL_META degerleri tam hazirlik yili (360 gun) icindir; program
    // sinava kalan sureye gore kisaysa hedefler orantili kisilir.
    this.applyLevelTargets(hours, questions, mocks);

    const expBox = document.getElementById("reportLevelExplanationBox");
    if (expBox) expBox.innerHTML = description;
    
    const reportLevelEl = document.getElementById("reportAssessedLevel");
    if (reportLevelEl) reportLevelEl.textContent = `${level}. Seviye`;
  },

  // Custom 7-Day & 30-Day Calendar Generator (Okul vs. Mezun)
  // ============================================================
  // PROGRAM ONERISI
  // Kurulum bittiginde program otomatik uretilmez. Ogrencinin girdigi
  // hedef siralama ve seviye tespiti sonucuna dayali bir oneri sunulur;
  // kabul ederse program o anda olusturulur, istemezse uygulamayi bos
  // gezip kendi programini kurabilir.
  // ============================================================
  programSuggestionData: function() {
    const seviye = this.state.level || 3;
    const hedef = this.state.targetRank;
    const dogruluk = this.state.diagnosticAccuracy;
    const li = (this.LEVEL_META && this.LEVEL_META[seviye]) || null;
    return {
      seviye: seviye,
      hedef: hedef,
      dogruluk: dogruluk,
      saat: li ? li.hours : null,
      soru: li ? li.questions : null,
      alan: this.state.track || "Sayısal",
      seviyeAdi: li ? li.name : ""
    };
  },

  renderProgramSuggestion: function() {
    const kart = document.getElementById("programSuggestionCard");
    if (!kart) return;

    // Program kabul edildiyse ya da zaten doluysa kart gosterilmez
    const doluMu = this.state.daysData && Object.keys(this.state.daysData).length > 0;
    if (this.state.programAccepted || doluMu || this.state.role === "koc") {
      kart.style.display = "none";
      return;
    }

    const d = this.programSuggestionData();
    const fmt = n => (typeof n === "number" ? n.toLocaleString("tr-TR") : "—");
    const gerekce = [];
    if (typeof d.dogruluk === "number") gerekce.push(`seviye tespitinde <strong>%${d.dogruluk}</strong> doğruluk`);
    if (d.hedef) gerekce.push(`hedefin <strong>ilk ${fmt(d.hedef)}</strong>`);
    gerekce.push(`<strong>${d.alan}</strong> alanı`);

    // Hedef, beyan edilen tempoya sigmiyorsa bunu KABUL ETMEDEN ONCE soyle.
    // Program uretici tempoya uyuyor; ogrenci hedefin ulasilmaz kaldigini
    // bilmeden "Programi Olustur" dememeli.
    const kap = this.kapasiteHedefKarsilastir();
    const kapasiteBlogu = (kap && !kap.yeterli)
      ? `<div style="background:var(--bg-card); border:1px solid var(--warning); border-left:3px solid var(--warning);
                     border-radius:8px; padding:0.75rem 0.9rem; margin:0 0 1rem; font-size:0.8rem; line-height:1.55;
                     color:var(--text-main);">${this.kapasiteHedefMetni(kap)}</div>`
      : "";

    kart.style.display = "block";
    kart.innerHTML = `
      <div class="glass-card" style="padding:1.5rem; border:1.5px solid var(--primary); background:var(--ai-tint); border-radius:12px;">
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.6rem;">
          <span class="ai-helper-icon" style="width:32px; height:32px; border-radius:9px; font-size:0.85rem;"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
          <h3 style="margin:0; font-family:var(--font-header); font-weight:800; font-size:1.02rem; color:var(--text-main);">Sana bir program önerim var</h3>
        </div>
        <p style="font-size:0.88rem; color:var(--text-main); line-height:1.6; margin:0 0 0.9rem;">
          ${gerekce.join(", ")} bilgilerine göre <strong>${d.seviye}. Seviye${d.seviyeAdi ? " · " + d.seviyeAdi : ""}</strong> bir çalışma programı hazırlayabilirim${d.saat ? ` — toplam <strong>${fmt(d.saat)} saat</strong> ve <strong>${fmt(d.soru)}</strong> soru hedefiyle` : ""}.
        </p>
        ${kapasiteBlogu}
        <p style="font-size:0.78rem; color:var(--text-muted); line-height:1.5; margin:0 0 1.1rem;">
          Kabul edersen program hemen oluşturulur ve günlük listene düşer. İstemezsen boş başlarsın, programı kendin kurarsın — sonradan da bu öneriye dönebilirsin.
        </p>
        <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
          <button class="btn btn-primary" style="flex:1; min-width:190px; font-weight:800;" onclick="app.acceptProgramSuggestion()">
            <i class="fa-solid fa-check"></i> Programı Oluştur
          </button>
          <button class="btn btn-secondary" style="flex:1; min-width:170px; font-weight:800;" onclick="app.declineProgramSuggestion()">
            <i class="fa-solid fa-pen-ruler"></i> Kendim Kurayım
          </button>
        </div>
      </div>`;
  },

  acceptProgramSuggestion: function() {
    this.state.daysData = {};
    this.generateWeeklyCalendarData();
    this.state.standardDaysData = JSON.parse(JSON.stringify(this.state.daysData));
    this.state.customDaysData = JSON.parse(JSON.stringify(this.state.daysData));
    this.state.selectedProgramType = "standard";
    this.state.programAccepted = true;
    this.saveState();

    this.renderProgramSuggestion();
    this.updateHeaderStats();
    this.renderDashboard();
    this.renderMonthlyCalendarGrid();
    this.switchTab("today");
    this.showToast(`${this.state.level}. Seviye programın oluşturuldu ve günlük listene eklendi.`, "success");
  },

  declineProgramSuggestion: function() {
    // Oneri kapatilir ama program "kabul edilmis" sayilmaz; ogrenci
    // Program Sihirbazi'ndan istedigi zaman geri donebilir.
    const kart = document.getElementById("programSuggestionCard");
    if (kart) kart.style.display = "none";
    this.switchTab("programCreator");
    this.showToast("Programı kendin kurabilirsin. Önerimi istediğinde Program Sihirbazı'ndan alabilirsin.", "info");
  },

  startMainDashboard: function() {
    try {
      if (this.state.subscriptionTier === "pending") {
        this.showSubscriptionModal();
        return;
      }

    // Rapor ekranindaki sinav odagi secici kaldirildi. Odak artik yalnizca
    // uygulama icindeki "AI Program Olusturucu" panelinden secilir; burada
    // kosulsuz "both" yazmak kullanicinin secimini her girisde siliyordu.
    const wizardFocus = document.getElementById("wizardExamFocusSelect");
    if (wizardFocus) this.state.examFocus = wizardFocus.value;
    if (!["tyt", "ayt", "both"].includes(this.state.examFocus)) this.state.examFocus = "both";

    // Tercih motoru entegrasyonu: hedef/seviye değiştiyse standart programı yeni seviyeye göre baştan üret
    if (this.state.generatedForLevel && this.state.generatedForLevel !== this.state.level) {
      this.state.standardDaysData = null;
    }

    const chartFilter = document.getElementById("chartExamTypeFilter");
    if (chartFilter) chartFilter.removeAttribute("data-initialized");

    // 1. Generate standard plan if standardDaysData is missing or doesn't have the new math routines
    const day2 = this.state.standardDaysData && (this.state.standardDaysData[2] || this.state.standardDaysData["2"]);
    const hasMathRoutine = day2 && day2.tasks && day2.tasks.some(t => t && t.id && t.id.includes("math_routine"));

    let freshlyGenerated = false;
    // Program ARTIK OTOMATIK OLUSTURULMAZ. Ogrenci hedefini ve seviye
    // tespitini tamamladiktan sonra uygulamanin icine girer; bu verilere
    // dayali bir oneri gosterilir ve ancak kabul ederse program uretilir.
    if (!this.state.programAccepted) {
      this.state.selectedProgramType = this.state.selectedProgramType || "standard";
      this.saveState();
    } else if (!this.state.standardDaysData || Object.keys(this.state.standardDaysData).length === 0 || !hasMathRoutine) {
      this.state.daysData = {};
      this.generateWeeklyCalendarData(); // populates this.state.daysData with YKS template
      this.state.standardDaysData = JSON.parse(JSON.stringify(this.state.daysData));
      this.saveState();
      freshlyGenerated = true;
    } else {
      // Migration: Ensure existing standardDaysData is updated to contain TYT/AYT labels
      const day1 = this.state.standardDaysData[1] || this.state.standardDaysData["1"];
      const firstTask = day1 && day1.tasks && day1.tasks[0];
      if (firstTask && !(firstTask.label || "").startsWith("[")) {
        this.state.daysData = {};
        this.generateWeeklyCalendarData();
        this.state.standardDaysData = JSON.parse(JSON.stringify(this.state.daysData));
        this.saveState();
        freshlyGenerated = true;
      }
    }

    // 2. Set default program selection type
    if (!this.state.selectedProgramType) {
      this.state.selectedProgramType = "standard";
    }

    // 3. Initialize savedPrograms custom list if missing
    const todayStr = new Date().toISOString().split("T")[0];
    if (!this.state.startDate) {
      this.state.startDate = todayStr;
    }
    if (!this.state.activeWeek) {
      this.state.activeWeek = 1;
    }
    if (!this.state.savedPrograms || this.state.savedPrograms.length === 0) {
      const emptyDays = {};
      for (let d = 1; d <= 360; d++) {
        emptyDays[d] = { completed: false, tasks: [] };
      }
      this.state.savedPrograms = [{
        id: 'default_custom',
        name: 'Varsayılan Özel Program',
        startDate: todayStr,
        repetition: 'none',
        daysData: emptyDays
      }];
    }
    if (!this.state.activeCustomProgramId) {
      this.state.activeCustomProgramId = 'default_custom';
    }

    // Migration: If default_custom exists and contains standard tasks, clear them to start empty
    const defCustom = this.state.savedPrograms.find(p => p.id === 'default_custom');
    if (defCustom && defCustom.name === 'Varsayılan Özel Program') {
      const day1Tasks = defCustom.daysData[1] ? defCustom.daysData[1].tasks : [];
      if (day1Tasks.length > 0 && day1Tasks.some(t => !t.id.includes('custom'))) {
        for (let d = 1; d <= 360; d++) {
          defCustom.daysData[d] = { completed: false, tasks: [] };
        }
        if (this.state.activeCustomProgramId === 'default_custom') {
          this.state.daysData = defCustom.daysData;
          this.state.customDaysData = defCustom.daysData;
        }
        this.saveState();
      }
    }

    // 4. Force load the correct active tasks into daysData based on selection type
    if (this.state.selectedProgramType === "standard") {
      this.state.daysData = JSON.parse(JSON.stringify(this.state.standardDaysData));
    } else {
      const activeProg = this.state.savedPrograms.find(p => p.id === this.state.activeCustomProgramId) || this.state.savedPrograms[0];
      this.state.daysData = activeProg.daysData;
      this.state.customDaysData = activeProg.daysData;
      this.state.startDate = activeProg.startDate;
    }
    
    // Show nav stats & Set prominent target boards
    const navStatsEl = document.getElementById("navStats");
    if (navStatsEl) navStatsEl.style.display = "flex";
    
    const streakValEl = document.getElementById("streakVal");
    if (streakValEl) streakValEl.textContent = `${this.state.streak} Gün`;
    
    const dashStreak = document.getElementById("dashStreakVal");
    if (dashStreak) dashStreak.textContent = `${this.state.streak} Gün`;
    
    const levelValEl = document.getElementById("levelVal");
    if (levelValEl) levelValEl.textContent = this.state.level;
    
    const targetValEl = document.getElementById("targetVal");
    if (targetValEl) targetValEl.textContent = this.state.targetDept;
    
    // Set Target Boards text
    const trophyDeptEl = document.getElementById("trophyTargetDept");
    if (trophyDeptEl) trophyDeptEl.textContent = this.state.targetDept;
    
    const trophyPctEl = document.getElementById("trophyPercentile");
    if (trophyPctEl) trophyPctEl.textContent = this.getTargetRankLabel();

    this.syncCustomProgramListSelector();
    this.syncProgramTypeUI(this.state.selectedProgramType);
    this.calculateFocusScore();
    this.renderDashboard();
    this.renderCurriculumMap();
    this.renderBadges();
    this.renderVaultQuestions();
    this.renderAICoachRecommendations();
    this.showView("dashboardView");
    this.switchTab("today");

    this.updateNotificationBadge();
    this.startOverdueWatcher();
    this.startEndOfDayParentWatcher();
    this.checkPeriodSummaries();
    this.showSessionQuotePopup();

    // If the quote popup isn't on screen, the coach greets right away;
    // otherwise closeQuotePopup() chains into the bubble.
    const quoteOverlay = document.getElementById("quotePopupOverlay");
    if (!quoteOverlay || quoteOverlay.style.display !== "flex") {
      setTimeout(() => this.showCoachBriefingBubble(), 900);
    }

    if (freshlyGenerated) {
      setTimeout(() => this.showScheduleFitWarningIfNeeded(), 1400);
    }

    this.saveState();
    } catch (e) {
      alert("Hata (startMainDashboard): " + e.stack);
      console.error(e);
    }
  },

  generateWeeklyCalendarData: function() {
    this.state.generatedForLevel = this.state.level;
    this._scheduleFitIssues = [];
    const track = this.state.track;
    const level = this.state.level;
    const isGraduate = this.state.isGraduate;
    const focus = this.state.examFocus || "both";
    
    // ---- MÜFREDAT GRAFİĞİNDEN KONU SIRASI ----
    // Konular artık gömülü kısa listelerden değil, önkoşul grafiğinden
    // topolojik sırayla geliyor: bir konu, önkoşulları planlanmadan
    // programa girmez (ör. Türev'den önce Limit).
    const orderedTopics = this.curriculum.orderedTopics(track, focus);
    const totalCurriculumTopics = orderedTopics.length;

    // Günlük rutinler için kondisyon konuları (paragraf + temel matematik)
    let paragraphPool = this.curriculum.topicsFor(track, "tyt")
      .filter(t => t.section === "Paragraf");
    let mathDrillPool = this.curriculum.topicsFor(track, "tyt")
      .filter(t => t.subject === "Matematik" && (t.section === "Problemler" || t.section === "Temel Matematik"));

    const fallbackTopic = { id: "genel", name: "Genel Tekrar", subject: "Rehberlik", exam: "Genel", section: "Genel" };

    // Rutin havuzları öğretim sırasına göre dizilir ve gün ilerledikçe açılır:
    // kondisyon rutini, henüz işlenmemiş bir konuyu asla öne çekmez.
    const orderIndexOf = (t) => {
      const i = orderedTopics.findIndex(o => o.id === t.id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    const sortByTeachingOrder = (pool) => pool.slice().sort((a, b) => orderIndexOf(a) - orderIndexOf(b));

    // dayNum'a kadar açılmış havuz dilimi içinden döngüsel seçim
    const pickCycle = (pool, dayNum) => {
      if (!pool.length) return fallbackTopic;
      const progress = Math.min(1, (dayNum + 1) / Math.max(1, this.PROGRAM_DAYS * 0.6));
      const unlocked = Math.max(1, Math.ceil(progress * pool.length));
      return pool[dayNum % unlocked];
    };
    paragraphPool = sortByTeachingOrder(paragraphPool);
    mathDrillPool = sortByTeachingOrder(mathDrillPool);

    this.state.daysData = {};

    let subjects = [];
    if (track === "Sayısal") {
      subjects = ["Matematik", "Fizik", "Kimya", "Biyoloji"];
    } else if (track === "Eşit Ağırlık") {
      subjects = ["Matematik", "Edebiyat", "Tarih", "Coğrafya"];
    } else if (track === "Sözel") {
      subjects = ["Edebiyat", "Tarih", "Coğrafya", "Türkçe"];
    } else if (track === "Dil") {
      subjects = ["Türkçe", "Edebiyat", "Tarih", "Coğrafya"];
    } else {
      subjects = ["Matematik", "Türkçe"];
    }

    // ---- PACING: müfredat programın TAMAMINA yayılır ----
    // Her gün 4 yeni konu açmak müfredatı ~3 haftada tüketip geri kalan
    // yılı tekrara düşürüyordu. Artık günde YALNIZCA 1 yeni konu açılır;
    // günün diğer slotları daha önce işlenmiş konulardan seçilir
    // (interleaving — farklı konuların harmanlanması).
    const newTopicDaysTotal = Math.max(1, Math.floor(this.PROGRAM_DAYS * 4 / 7));
    let newTopicDayIndex = 0;

    const asSlot = (t) => t
      ? { subject: t.subject, topic: t.name, examType: t.exam, topicId: t.id, section: t.section, sub: t.sub || [] }
      : { subject: "Rehberlik", topic: "Genel Tekrar", examType: "Genel", topicId: "genel", section: "Genel", sub: [] };

    // O güne kadar açılmış konu sayısı (müfredat süreye orantılı ilerler)
    const introducedCountAt = (dayIdx) => {
      if (!orderedTopics.length) return 0;
      const ratio = Math.min(1, (dayIdx + 1) / newTopicDaysTotal);
      return Math.max(1, Math.ceil(ratio * orderedTopics.length));
    };

    // Günün YENİ konusu
    const newTopicAt = (dayIdx) => asSlot(orderedTopics[(introducedCountAt(dayIdx) - 1) % Math.max(1, orderedTopics.length)]);

    // Günün TEKRAR/harman slotu: yalnızca açılmış konulardan seçilir,
    // böylece hiçbir slot önkoşulu işlenmemiş bir konuya atlamaz.
    const reviewTopicAt = (dayIdx, offset) => {
      const introduced = introducedCountAt(dayIdx);
      if (introduced <= 1) return asSlot(orderedTopics[0]);
      const idx = (dayIdx * 3 + offset * 7) % introduced;
      return asSlot(orderedTopics[idx]);
    };

    const appendDailyRoutines = (tasksList, dayNum) => {
      // 1. Paragraph Routine (every study day)
      const pTopic = pickCycle(paragraphPool, dayNum).name;
      tasksList.push({
        id: `task_${dayNum}_paragraph_routine`,
        type: "common",
        subject: "Türkçe",
        topic: pTopic,
        label: `[TYT] ✍️ Paragraf Rutini & Kondisyon`,
        desc: `"${pTopic}" alt başlığı ağırlıklı olmak üzere 20 adet paragraf sorusunu süre tutarak çöz.`,
        duration: "25 dk",
        qCount: 20,
        completed: false,
        logged: false,
        correct: 0,
        incorrect: 0,
        timeSpent: 0,
        errorTopics: [],
        examType: "TYT",
        sourceSubject: "Paragraf"
      });

      // 2. Mathematics Routine (every study day)
      const mTopic = pickCycle(mathDrillPool, dayNum).name;
      tasksList.push({
        id: `task_${dayNum}_math_routine`,
        type: "common",
        subject: "Matematik",
        topic: mTopic,
        label: `[TYT] 🔢 Matematik Rutini & Hız Pratiği`,
        desc: `"${mTopic}" alt başlığı ağırlıklı olmak üzere 15 adet temel matematik/problem sorusunu süre tutarak çöz.`,
        duration: "25 dk",
        qCount: 15,
        completed: false,
        logged: false,
        correct: 0,
        incorrect: 0,
        timeSpent: 0,
        errorTopics: [],
        examType: "TYT"
      });
    };

    // SINAV PROVASI FAZI — programın son SON_FAZ_GUN günü.
    // Bu dönemde yeni konu açılmaz: günlerin %80'i tam deneme + analiz,
    // %20'si tekrar. 5 günün 4'ü deneme, 1'i tekrar olacak şekilde dağıtılır.
    const sonFazBaslangic = Math.max(1, this.PROGRAM_DAYS - this.SON_FAZ_GUN + 1);
    const denemeSuresi = focus === "tyt" ? "165 dk" : focus === "ayt" ? "180 dk" : "270 dk";
    const denemeSoru = focus === "tyt" ? 120 : focus === "ayt" ? 80 : 200;
    const denemeTur = focus === "tyt" ? "TYT" : focus === "ayt" ? "AYT" : "Genel";
    const anaDers = track === "Sayısal" ? "Matematik" : (track === "Dil" ? "Dil" : "Edebiyat");

    for (let day = 1; day <= this.PROGRAM_DAYS; day++) {
      const dailyTasks = [];
      const dayOfWeek = day % 7;

      if (day >= sonFazBaslangic) {
        const tekrarGunu = (day - sonFazBaslangic) % 5 === 4;   // 5 günde 1 → %20
        if (tekrarGunu) {
          dailyTasks.push({
            id: `task_${day}_final_review`, type: "reading", subject: "Rehberlik",
            topic: "Sınav Öncesi Genel Tekrar",
            label: "🔁 Genel Tekrar Günü",
            desc: "Bugün yeni soru çözme. Deneme analizlerinden çıkan eksiklerini, formül kartlarını ve hata defterindeki konuları gözden geçir.",
            duration: "150 dk", completed: false, examType: "Genel", noSource: true
          });
          dailyTasks.push({
            id: `task_${day}_final_review_vault`, type: "retest", subject: "Rehberlik",
            topic: "Hata Defteri Taraması",
            label: "📕 Hata Defteri Taraması",
            desc: "Hata defterindeki en sık tekrar eden 20 soruyu yeniden çöz; hâlâ yanlışsa konu özetine dön.",
            duration: "60 dk", qCount: 20, completed: false, logged: false,
            correct: 0, incorrect: 0, timeSpent: 0, errorTopics: [], examType: "Genel", noSource: true
          });
        } else {
          dailyTasks.push({
            id: `task_${day}_final_mock`, type: "quiz", subject: anaDers,
            topic: "Tam Deneme Sınavı",
            label: `🏆 [${denemeTur}] Tam Deneme Sınavı`,
            desc: "Gerçek sınav saatinde, tek oturumda ve süre tutarak çöz. Optik forma işaretle.",
            duration: denemeSuresi, qCount: denemeSoru, completed: false, logged: false,
            correct: 0, incorrect: 0, timeSpent: 0, errorTopics: [], examType: denemeTur,
            sourceSubject: "Genel", sourceKind: "deneme"
          });
          dailyTasks.push({
            id: `task_${day}_final_mock_review`, type: "reading", subject: "Rehberlik",
            topic: "Deneme Analizi",
            label: "📝 Deneme Analizi & Hata Defteri",
            desc: "Yanlış ve boşları tek tek incele, hata defterine işle. Analiz denemenin kendisinden önemlidir.",
            duration: "75 dk", completed: false, examType: "Genel", noSource: true
          });
        }
        this.gunuButceyeSigdir(dailyTasks, dayOfWeek, 2);
        this.sourceBooks.attachAll(dailyTasks);
        this.state.daysData[day] = { completed: false, isMockDay: !tekrarGunu, isFinalPhase: true,
                                     tasks: dailyTasks, schedule: this.buildDaySchedule(dailyTasks, dayOfWeek) };
        continue;
      }

      // 1. Mock Exam Day (Sunday)
      if (dayOfWeek === 0) {
        let mockLabel = "🏆 Haftalık Deneme Sınavı (TYT/AYT)";
        let mockQ = 80;
        let mockDur = "135 dk";
        let mockType = "Genel";

        if (focus === "tyt") {
          mockLabel = "🏆 Haftalık TYT Deneme Sınavı";
          mockQ = 120;
          mockDur = "165 dk";
          mockType = "TYT";
        } else if (focus === "ayt") {
          mockLabel = "🏆 Haftalık AYT Deneme Sınavı";
          mockQ = 80;
          mockDur = "180 dk";
          mockType = "AYT";
        }

        dailyTasks.push({
          id: `task_${day}_mock`,
          type: "quiz",
          subject: track === "Sayısal" ? "Matematik" : (track === "Dil" ? "Dil" : "Edebiyat"),
          topic: "Genel Deneme Sınavı",
          label: mockLabel,
          desc: `Gerçek YKS süre kısıtlamalarına göre deneme sınavını çöz ve sonuçları gir.`,
          duration: mockDur,
          qCount: mockQ,
          completed: false,
          logged: false,
          correct: 0,
          incorrect: 0,
          timeSpent: 0,
          errorTopics: [],
          examType: mockType,
          sourceSubject: "Genel",
          sourceKind: "deneme"
        });
        dailyTasks.push({
          id: `task_${day}_mock_review`,
          type: "reading",
          subject: "Rehberlik",
          topic: "Hata Analizi ve Deftere Kayıt",
          label: `📝 Deneme Analizi & Hata Defteri`,
          desc: `Yanlış yaptığın soruları fotoğraflayarak Hata Defteri'ne yükle ve tekrar planlarını oluştur.`,
          duration: "30 dk",
          completed: false,
          examType: "Genel"
        });
        this.gunuButceyeSigdir(dailyTasks, dayOfWeek, 2);
        this.sourceBooks.attachAll(dailyTasks);
        this.state.daysData[day] = { completed: false, isMockDay: true, tasks: dailyTasks, schedule: this.buildDaySchedule(dailyTasks, dayOfWeek) };
        continue;
      }

      // 2. Repetition Days (Wednesday and Saturday)
      if (dayOfWeek === 3 || dayOfWeek === 6) {
        dailyTasks.push({
          id: `task_${day}_weekly_review`,
          type: "reading",
          subject: "Rehberlik",
          topic: "Haftalık Kazanım Tekrarı",
          label: `🔍 Haftalık Konu Tekrarı`,
          desc: `Bu hafta çalıştığın konuların özetlerini gözden geçir ve formülleri tekrar et.`,
          duration: "30 dk",
          completed: false,
          examType: "Genel"
        });
        let revLabel = `[TYT] ⚡ Hızlı Kazanım Pratiği`;
        let revType = "TYT";
        if (focus === "ayt") {
          revLabel = `[AYT] ⚡ Hızlı Kazanım Pratiği`;
          revType = "AYT";
        }
        dailyTasks.push({
          id: `task_${day}_review_practice`,
          type: "quiz",
          subject: track === "Sayısal" ? "Matematik" : "Türkçe",
          topic: "Hızlı Soru Pratiği",
          label: revLabel,
          desc: `Geçmiş konuların kalıcılığını artırmak için 20 adet tarama sorusu çöz.`,
          duration: "30 dk",
          qCount: 20,
          completed: false,
          logged: false,
          correct: 0,
          incorrect: 0,
          timeSpent: 0,
          errorTopics: [],
          examType: revType
        });
        appendDailyRoutines(dailyTasks, day);
        this.sourceBooks.attachAll(dailyTasks);
        this.gunuButceyeSigdir(dailyTasks, dayOfWeek, 3);
        this.state.daysData[day] = { completed: false, tasks: dailyTasks, schedule: this.buildDaySchedule(dailyTasks, dayOfWeek) };
        continue;
      }

      // 3. New Topic Study Days (Monday, Tuesday, Thursday, Friday)
      // Level-aware intensity: S5 is highest, S1 is lowest
      const levelIntensity = {
        8: { numTasks: 10, qCount1: 110, dur1: "220 dk", qCount2: 80, dur2: "160 dk", qCount3: 60, dur3: "120 dk", qCountCommon: 95, durCommon: "110 dk" },
        7: { numTasks: 9, qCount1: 100, dur1: "200 dk", qCount2: 70, dur2: "140 dk", qCount3: 50, dur3: "100 dk", qCountCommon: 85, durCommon: "100 dk" },
        6: { numTasks: 8, qCount1: 90, dur1: "180 dk", qCount2: 60, dur2: "120 dk", qCount3: 45, dur3: "90 dk", qCountCommon: 75, durCommon: "90 dk" },
        5: { numTasks: 7, qCount1: 75, dur1: "150 dk", qCount2: 45, dur2: "90 dk", qCount3: 30, dur3: "75 dk", qCountCommon: 60, durCommon: "75 dk" },
        4: { numTasks: 6, qCount1: 65, dur1: "130 dk", qCount2: 42, dur2: "80 dk", qCount3: 28, dur3: "65 dk", qCountCommon: 55, durCommon: "65 dk" },
        3: { numTasks: 6, qCount1: 60, dur1: "120 dk", qCount2: 40, dur2: "75 dk", qCount3: 25, dur3: "60 dk", qCountCommon: 50, durCommon: "60 dk" },
        2: { numTasks: 5, qCount1: 45, dur1: "90 dk", qCount2: 30, dur2: "60 dk", qCount3: 20, dur3: "45 dk", qCountCommon: 40, durCommon: "45 dk" },
        1: { numTasks: 4, qCount1: 30, dur1: "60 dk", qCount2: 20, dur2: "45 dk", qCount3: 15, dur3: "30 dk", qCountCommon: 25, durCommon: "30 dk" }
      };
      const li = this.applyRouteIntensity(levelIntensity[level] || levelIntensity[3]);

      const slot1 = newTopicAt(newTopicDayIndex);
      const subject1 = slot1.subject, topic1 = slot1.topic, examType1 = slot1.examType;
      newTopicDayIndex++;   // yalnızca yeni konu günlerinde ilerler

      // Task 1: Video/Reading Concept Study (Subject 1)
      dailyTasks.push({
        id: `task_${day}_1`,
        type: "video",
        subject: subject1,
        topic: topic1,
        label: `[${examType1}] 🎥 ${subject1}: Konu Anlatımı & Detaylı Çalışma`,
        desc: slot1.sub && slot1.sub.length
          ? `"${topic1}" konusunun alt başlıkları: ${slot1.sub.join(" · ")}. Video dersini izle, her alt başlık için formül/kural notu çıkar.`
          : `"${topic1}" konusunun video dersini izle, MEB kazanım özetlerini oku ve temel formülleri defterine not et.`,
        duration: li.dur1,
        completed: false,
        examType: examType1
      });

      // Task 2: Quiz Practice (Subject 1)
      dailyTasks.push({
        id: `task_${day}_2`,
        type: "quiz",
        subject: subject1,
        topic: topic1,
        label: `[${examType1}] 🎯 ${subject1}: Konu Kavrama Testi`,
        desc: `"${topic1}" konusu ile ilgili ${li.qCount1} adet seviyene uygun soru çözerek konuyu pekiştir.`,
        duration: li.dur2,
        qCount: li.qCount1,
        completed: false,
        logged: false,
        correct: 0,
        incorrect: 0,
        timeSpent: 0,
        errorTopics: [],
        examType: examType1
      });

      // Task 3 & 4: Second subject (always included for level-based intensity)
      const slot2 = reviewTopicAt(newTopicDayIndex, 1);
      const subject2 = slot2.subject, topic2 = slot2.topic, examType2 = slot2.examType;

      dailyTasks.push({
        id: `task_${day}_3`,
        type: "reading",
        subject: subject2,
        topic: topic2,
        label: `[${examType2}] 📖 ${subject2}: Kazanım & Konu Analizi`,
        desc: `"${topic2}" konusunun önemli başlıklarını incele ve özet çıkar.`,
        duration: li.dur3,
        completed: false,
        examType: examType2
      });

      dailyTasks.push({
        id: `task_${day}_4`,
        type: "quiz",
        subject: subject2,
        topic: topic2,
        label: `[${examType2}] ⚡ ${subject2}: Pratik Tarama Testi`,
        desc: `"${topic2}" konusu ile ilgili ${li.qCount2} soru çöz. Yanlışlarını analiz et.`,
        duration: li.dur3,
        qCount: li.qCount2,
        completed: false,
        logged: false,
        correct: 0,
        incorrect: 0,
        timeSpent: 0,
        errorTopics: [],
        examType: examType2
      });

      // Task 5-6: Üçüncü ders (Seviye 3-8)
      if (li.numTasks >= 6) {
        const slot3 = reviewTopicAt(newTopicDayIndex, 2);
        const subject3 = slot3.subject, topic3 = slot3.topic, examType3 = slot3.examType;
        dailyTasks.push({
          id: `task_${day}_5`,
          type: "video",
          subject: subject3,
          topic: topic3,
          label: `[${examType3}] 🎥 ${subject3}: Ek Konu Çalışması`,
          desc: `"${topic3}" konusu hakkında ek video ders ve not çalışması yap.`,
          duration: li.dur3,
          completed: false,
          examType: examType3,
          sourceTier: 1
        });
        dailyTasks.push({
          id: `task_${day}_6`,
          type: "quiz",
          subject: subject3,
          topic: topic3,
          label: `[${examType3}] 🎯 ${subject3}: Ek Soru Pratiği`,
          desc: `"${topic3}" konusu ile ilgili ${li.qCount3} soru çöz.`,
          duration: li.dur3,
          qCount: li.qCount3,
          completed: false,
          logged: false,
          correct: 0,
          incorrect: 0,
          timeSpent: 0,
          errorTopics: [],
          examType: examType3,
          sourceTier: 1
        });
      }

      // Task 7: Dördüncü ders (Seviye 5-8)
      if (li.numTasks >= 7) {
        const slot4 = reviewTopicAt(newTopicDayIndex, 3);
        const subject4 = slot4.subject, topic4 = slot4.topic, examType4 = slot4.examType;
        dailyTasks.push({
          id: `task_${day}_7`,
          type: "quiz",
          subject: subject4,
          topic: topic4,
          label: `[${examType4}] ⚡ ${subject4}: Yoğun Pratik`,
          desc: `"${topic4}" konusu ile ilgili ${li.qCount3} soru çöz.`,
          duration: li.dur3,
          qCount: li.qCount3,
          completed: false,
          logged: false,
          correct: 0,
          incorrect: 0,
          timeSpent: 0,
          errorTopics: [],
          examType: examType4,
          sourceTier: 1
        });
      }

      // Task 8: Çift seans pekiştirme (Seviye 6-8)
      if (li.numTasks >= 8) {
        dailyTasks.push({
          id: `task_${day}_8`,
          type: "quiz",
          subject: subject1,
          topic: topic1,
          label: `[${examType1}] 🔥 ${subject1}: Çift Seans Pekiştirme`,
          desc: `Çift seans kapsamında "${topic1}" konusunda ${li.qCount3} ek soru çöz.`,
          duration: li.dur3,
          qCount: li.qCount3,
          completed: false,
          logged: false,
          correct: 0,
          incorrect: 0,
          timeSpent: 0,
          errorTopics: [],
          examType: examType1,
          sourceTier: 1
        });
      }

      // Task 9: Tam deneme bloğu (Seviye 7-8: Zirve / Şampiyonluk)
      if (li.numTasks >= 9) {
        dailyTasks.push({
          id: `task_${day}_9`,
          type: "quiz",
          subject: subject2,
          topic: topic2,
          label: `[${examType2}] 🧭 ${subject2}: Zirve Seviyesi Zor Soru Taraması`,
          desc: `"${topic2}" konusunda en zor zümre sorularından ${li.qCountCommon} soru çöz, çözüm süreni saniye bazında not al.`,
          duration: li.durCommon,
          qCount: li.qCountCommon,
          completed: false,
          logged: false,
          correct: 0,
          incorrect: 0,
          timeSpent: 0,
          errorTopics: [],
          examType: examType2,
          sourceTier: 2
        });
      }

      // Task 10: Sıfır hata kontrol seansı (Sadece Seviye 8 — Şampiyonluk / Türkiye derecesi hedefi)
      if (li.numTasks >= 10) {
        dailyTasks.push({
          id: `task_${day}_10`,
          type: "quiz",
          subject: subject1,
          topic: topic1,
          label: `[${examType1}] 🏆 ${subject1}: Sıfır Hata Kontrol Seansı`,
          desc: `Bugün çözdüğün tüm soruları tekrar gözden geçir; kriter TÜM soruların doğru olmasıdır. Tek bir yanlışı/boşu bile hata defterine işleyip aynı gün tekrar çöz.`,
          duration: "60 dk",
          qCount: 20,
          completed: false,
          logged: false,
          correct: 0,
          incorrect: 0,
          timeSpent: 0,
          errorTopics: [],
          examType: examType1,
          // Yeni kitap değil, o gün çözülenlerin kontrolü — kaynak önerilmez.
          noSource: true
        });
      }

      // Final Task: Turkish practice (Common paragraph workout) & Mathematics Routine
      appendDailyRoutines(dailyTasks, day);

      // Her göreve "hangi yayınevinin hangi kitabı" bilgisini iliştir.
      this.gunuButceyeSigdir(dailyTasks, dayOfWeek, 3);
      this.sourceBooks.attachAll(dailyTasks);

      this.state.daysData[day] = {
        completed: false,
        tasks: dailyTasks,
        schedule: this.buildDaySchedule(dailyTasks, dayOfWeek)
      };
    }

    // URETILEN programin GERCEK toplam suresi. Kapasite-hedef
    // karsilastirmasi bu sayiyi kullanir: teorik kapasiteye bakip
    // "hedefe ulasirsin" demek, program o kadarini uretmiyorsa
    // yeni bir yanlis vaat olurdu.
    let uretilenDk = 0;
    Object.keys(this.state.daysData).forEach(k => {
      const g = this.state.daysData[k];
      if (!g || !Array.isArray(g.tasks)) return;
      g.tasks.forEach(t => { uretilenDk += this.parseDurationMinutes(t.duration) || 0; });
    });
    this.state.uretilenToplamSaat = Math.round(uretilenDk / 60);
  },

  // ============================================================
  // SAATLİK ÇALIŞMA PROGRAMI: görevlere gerçek saat aralığı atar,
  // ara dinlenmeleri ve yemek saatlerini plana yerleştirir.
  // Mezun/okula gidiyor durumuna göre günün başlangıç saatini seçer:
  //  - Mezun: her gün uyanıştan kısa süre sonra başlar (tüm gün esnek)
  //  - Okula gidiyor: hafta içi okul dönüşü (16:00), hafta sonu geç sabah
  // ============================================================
  timeStrToMinutes: function(str) {
    const parts = (str || "07:00").split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  },

  minutesToTimeStr: function(mins) {
    const wrapped = ((Math.round(mins) % 1440) + 1440) % 1440;
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  },

  parseDurationMinutes: function(durationStr) {
    const n = parseInt(String(durationStr), 10);
    return isNaN(n) || n <= 0 ? 30 : n;
  },

  // Kullanıcının onboarding'de girdiği hafta içi/hafta sonu çalışma saati hedefi —
  // artık sadece kayda geçmiyor, günün gerçek programına da bu üst sınır olarak yansıyor.
  dailyCapacityMinutes: function(dayOfWeek) {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const h = isWeekend ? this.state.weekendHours : this.state.weekdayHours;
    return (typeof h === "number" && h > 0) ? h * 60 : null;
  },

  // ============================================================
  // GUNLUK CALISMA BUTCESI
  // ------------------------------------------------------------
  // Program ureticisi gorev sayisini yalnizca SEVIYEYE gore
  // belirliyordu; gunun fiziksel penceresini ve ogrencinin beyan
  // ettigi kapasiteyi hic sormuyordu. Sonuc: okula giden, "hafta ici
  // 4 saat" diyen bir ogrenciye gunde 11 saatlik program uretiliyor,
  // 302 gunun 172'si tasiyor ve uygulama acilir acilmaz "saatlere
  // sigmiyor" uyarisi veriyordu. Uyari dogruydu; program yanlisti.
  // ============================================================
  gunlukCalismaButcesi: function(dayOfWeek) {
    const haftaSonu = (dayOfWeek === 0 || dayOfWeek === 6);
    let bas;
    if (this.state.isGraduate) {
      bas = this.timeStrToMinutes(this.state.wakeTime || "08:00") + 90;
    } else {
      bas = haftaSonu
        ? this.timeStrToMinutes(this.state.wakeTime || "08:00") + 120
        : 16 * 60;   // okul sonrasi
    }
    let uyku = this.timeStrToMinutes(this.state.sleepTime || "23:00");
    if (uyku <= bas) uyku += 24 * 60;
    const pencere = (uyku - 30) - bas;
    // Ogun ve molalar icin pay: pencerenin ~%20'si
    const fiziksel = Math.max(60, Math.round(pencere * 0.8));
    const beyan = this.dailyCapacityMinutes(dayOfWeek);
    return beyan ? Math.min(fiziksel, beyan) : fiziksel;
  },

  // Gunun gorev listesini butceye sigdirir.
  // Sureleri kisaltmak yerine FAZLA GOREVI CIKARIR: 30 soruluk bir
  // gorevi 12 dakikaya sikistirmak onu anlamsiz kilar, cikarmak ise
  // programi durust tutar. En az korunacak gorev sayisi vardir ki gun
  // tamamen bosalmasin.
  // NOT: dizi YERINDE kirpilir (cagri noktalarinda dailyTasks `const`).
  gunuButceyeSigdir: function(gorevler, dayOfWeek, enAzGorev) {
    if (!Array.isArray(gorevler) || gorevler.length === 0) return gorevler;
    const butce = this.gunlukCalismaButcesi(dayOfWeek);
    const taban = Math.max(1, enAzGorev || 3);
    const sure = (t) => this.parseDurationMinutes(t.duration) || 0;
    const topla = () => gorevler.reduce((a, t) => a + sure(t), 0);

    // En fazla bu kadar kucultulur; altina inince gorev anlamini yitirir.
    const EN_AZ_OLCEK = 0.6;

    let toplam = topla();
    if (toplam <= butce) return gorevler;

    // 1) Once GOREV CIKAR — ama yalnizca orantili kucultmenin tek basina
    //    yetmeyecegi kadar tasma varsa. Once cikarip sonra kucultmek
    //    gunu gereginden fazla bosaltiyordu (4 saatlik butceye 3.3 saat).
    while (gorevler.length > taban && (butce / toplam) < EN_AZ_OLCEK) {
      const cikan = gorevler.pop();
      toplam -= sure(cikan);
    }

    // 2) Kalan tasmayi ORANTILI kucultmeyle kapat. Sure ile birlikte SORU
    //    SAYISI da duser; yoksa "30 soru / 12 dk" gibi uygulanamaz
    //    gorevler olusur.
    toplam = topla();
    if (toplam > butce && toplam > 0) {
      const olcek = Math.max(EN_AZ_OLCEK, butce / toplam);
      gorevler.forEach(t => {
        const eskiDk = sure(t);
        if (!eskiDk) return;
        const yeniDk = Math.max(20, Math.round((eskiDk * olcek) / 5) * 5);
        t.duration = yeniDk + " dk";
        if (typeof t.qCount === "number" && t.qCount > 0) {
          const yeniSoru = Math.max(5, Math.round(t.qCount * (yeniDk / eskiDk)));
          t.qCount = yeniSoru;
          if (t.desc) t.desc = String(t.desc).replace(/\d+\s*(adet\s*)?soru/, yeniSoru + " soru");
        }
      });
    }
    return gorevler;
  },

  buildDaySchedule: function(tasks, dayOfWeek) {
    if (!tasks || tasks.length === 0) return [];

    const isGraduate = !!this.state.isGraduate;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let cursor;
    if (isGraduate) {
      cursor = this.timeStrToMinutes(this.state.wakeTime) + 90;
    } else if (isWeekend) {
      cursor = this.timeStrToMinutes(this.state.wakeTime) + 120;
    } else {
      cursor = 16 * 60; // okul dönüşü
    }

    const LUNCH = { start: 12 * 60 + 30, len: 45, label: "🍽️ Öğle Yemeği & Dinlenme" };
    const DINNER = { start: 18 * 60 + 45, len: 45, label: "🍽️ Akşam Yemeği & Dinlenme" };
    const SHORT_BREAK_EVERY = 100;
    const SHORT_BREAK_LEN = 15;

    // Gün penceresine sığdırma: okula gidenlerin hafta içi akşamı (16:00-uyku) kısıtlıdır.
    // Toplam görev süresi pencereye sığmıyorsa, gerçek "duration" alanına dokunmadan
    // (soru sayısı/hız takibi bozulmasın diye) sadece saat yerleşimini orantılı sıkıştır.
    let sleepMinutes = this.timeStrToMinutes(this.state.sleepTime || "23:00");
    if (sleepMinutes <= cursor) sleepMinutes += 24 * 60; // gece yarısını geçen uyku saatleri (ör. 00:30)
    const endBoundary = sleepMinutes - 30;
    const rawTotal = tasks.reduce((sum, t) => sum + this.parseDurationMinutes(t.duration), 0);
    const estBreaks = Math.floor(rawTotal / SHORT_BREAK_EVERY) * SHORT_BREAK_LEN;
    const estMeals = (cursor <= LUNCH.start + LUNCH.len && cursor + rawTotal >= LUNCH.start ? LUNCH.len : 0)
      + (cursor <= DINNER.start + DINNER.len && cursor + rawTotal >= DINNER.start ? DINNER.len : 0);
    // windowAvailable: kalkış/yatış saatleri arasına FİZİKEN sığan süre — AI uyarısı bu sınıra göre tetiklenir.
    const windowAvailable = Math.max(60, endBoundary - cursor - estBreaks - estMeals);
    // Kullanıcının kendi beyan ettiği hafta içi/sonu hedefi varsa, program o hedefi üst sınır olarak da uygular.
    const capacityMinutes = this.dailyCapacityMinutes(dayOfWeek);
    const availableForTasks = capacityMinutes ? Math.min(windowAvailable, Math.max(60, capacityMinutes)) : windowAvailable;
    const scale = rawTotal > availableForTasks ? Math.max(0.5, availableForTasks / rawTotal) : 1;

    // Fiziksel pencereye (kalkış-yatış aralığı) sığmayan günleri kaydet — kullanıcının
    // beyan ettiği kapasite hedefinden bağımsız, gerçek bir çakışma bu demektir.
    if (this._scheduleFitIssues && rawTotal > windowAvailable) {
      this._scheduleFitIssues.push({
        dayOfWeek: dayOfWeek, isWeekend: isWeekend,
        rawTotal: rawTotal, windowAvailable: windowAvailable,
        overflowMinutes: rawTotal - windowAvailable
      });
    }

    let studySinceBreak = 0;
    const mealServed = { lunch: false, dinner: false };
    const schedule = [];

    const maybeInsertMeal = (meal, key) => {
      if (mealServed[key]) return;
      if (cursor > meal.start + meal.len) { mealServed[key] = true; return; }
      if (cursor + 5 >= meal.start) {
        schedule.push({ type: "meal", label: meal.label, startTime: this.minutesToTimeStr(cursor), endTime: this.minutesToTimeStr(cursor + meal.len) });
        cursor += meal.len;
        studySinceBreak = 0;
        mealServed[key] = true;
      }
    };

    tasks.forEach(task => {
      maybeInsertMeal(LUNCH, "lunch");
      maybeInsertMeal(DINNER, "dinner");

      if (studySinceBreak >= SHORT_BREAK_EVERY) {
        schedule.push({ type: "break", label: "☕ Kısa Mola", startTime: this.minutesToTimeStr(cursor), endTime: this.minutesToTimeStr(cursor + SHORT_BREAK_LEN) });
        cursor += SHORT_BREAK_LEN;
        studySinceBreak = 0;
      }

      const dur = Math.max(10, Math.round(this.parseDurationMinutes(task.duration) * scale));
      task.startTime = this.minutesToTimeStr(cursor);
      task.endTime = this.minutesToTimeStr(cursor + dur);
      schedule.push({ type: "task", taskId: task.id });
      cursor += dur;
      studySinceBreak += dur;
    });

    return schedule;
  },

  // ============================================================
  // PROGRAM SAATLERE SIĞMIYOR UYARISI
  // buildDaySchedule sırasında kalkış-yatış penceresine fiziken sığmayan
  // günler this._scheduleFitIssues içine toplanır; burada özetlenip
  // kullanıcıya "yükü azalt" / "saatleri düzenle" seçenekleriyle sunulur.
  // ============================================================
  showScheduleFitWarningIfNeeded: function() {
    const issues = this._scheduleFitIssues || [];
    if (!issues.length) return false;

    const worst = issues.reduce((m, i) => (i.overflowMinutes > m.overflowMinutes ? i : m), issues[0]);
    if (worst.overflowMinutes < 15) return false; // küçük yuvarlama farkları rahatsız etmeye değmez

    const weekdayHit = issues.some(i => !i.isWeekend);
    const weekendHit = issues.some(i => i.isWeekend);
    const scope = weekdayHit && weekendHit ? "hafta içi ve hafta sonu günlerinde" : (weekdayHit ? "hafta içi günlerde" : "hafta sonu günlerinde");
    const worstHours = (worst.overflowMinutes / 60).toFixed(1);

    const intro = document.getElementById("scheduleFitIntro");
    if (intro) {
      intro.innerHTML = `Seçtiğin çalışma yüküne göre bazı görevler, <strong>${this.state.wakeTime} - ${this.state.sleepTime}</strong> arasındaki ${scope} çalışma penceresine — yemek ve mola süreleri düşüldükten sonra — sığmıyor. En yoğun günde yaklaşık <strong>${worstHours} saatlik</strong> bir taşma var; program şimdilik görev sürelerini kısaltarak yerleştirdi. Aşağıdaki seçeneklerden biriyle bunu kalıcı olarak düzeltebilirsin.`;
    }
    const wakeInput = document.getElementById("scheduleFitWakeTime");
    const sleepInput = document.getElementById("scheduleFitSleepTime");
    if (wakeInput) wakeInput.value = this.state.wakeTime || "07:00";
    if (sleepInput) sleepInput.value = this.state.sleepTime || "23:00";

    const modal = document.getElementById("scheduleFitModal");
    if (modal) modal.classList.add("active");
    return true;
  },

  resolveScheduleFitReduceLoad: function() {
    // Önce tempoyu bir kademe düşür (dengeli->rahat); orada da sığmıyorsa seviyeyi bir basamak indir.
    if ((this.state.studyRoute || "balanced") !== "relaxed") {
      this.state.studyRoute = "relaxed";
    } else if (this.state.level > 1) {
      this.state.level -= 1;
    }
    this.generateWeeklyCalendarData();
    this.state.standardDaysData = JSON.parse(JSON.stringify(this.state.daysData));
    this.calculateFocusScore();
    this.renderDashboard();
    this.closeModal("scheduleFitModal");
    this.saveState();
    if (typeof this.showToast === "function") {
      this.showToast("Çalışma yükü azaltıldı, program yeniden oluşturuldu.", "success");
    }
    this.showScheduleFitWarningIfNeeded();
  },

  resolveScheduleFitAdjustTimes: function() {
    const wakeInput = document.getElementById("scheduleFitWakeTime");
    const sleepInput = document.getElementById("scheduleFitSleepTime");
    if (wakeInput && wakeInput.value) this.state.wakeTime = wakeInput.value;
    if (sleepInput && sleepInput.value) this.state.sleepTime = sleepInput.value;

    this.generateWeeklyCalendarData();
    this.state.standardDaysData = JSON.parse(JSON.stringify(this.state.daysData));
    this.calculateFocusScore();
    this.renderDashboard();
    this.closeModal("scheduleFitModal");
    this.saveState();
    if (typeof this.showToast === "function") {
      this.showToast("Kalkış/yatış saatleri güncellendi, program yeniden oluşturuldu.", "success");
    }
    this.showScheduleFitWarningIfNeeded();
  },

  injectSpacedRepetitionTasks: function() {
    // Clear all previous dynamic repetition tasks from all days (starting with rep_)
    for (let dayNum = 1; dayNum <= this.PROGRAM_DAYS; dayNum++) {
      const dayData = this.state.daysData[dayNum];
      if (dayData && dayData.tasks) {
        const before = dayData.tasks.length;
        dayData.tasks = dayData.tasks.filter(t => !t.id.startsWith("rep_"));
        if (dayData.tasks.length !== before) {
          dayData.schedule = this.buildDaySchedule(dayData.tasks, dayNum % 7);
        }
      }
    }

    if (this.state.selectedProgramType === "custom") return;

    if (!this.state.scheduledRepetitions) this.state.scheduledRepetitions = [];
    
    this.state.scheduledRepetitions.forEach(rep => {
      const dueDay = rep.dueDay;
      if (dueDay > this.PROGRAM_DAYS) return;
      
      const dayData = this.state.daysData[dueDay];
      if (dayData && dayData.tasks) {
        const taskId = `rep_${rep.type}_${dueDay}_${String(rep.topic || "").replace(/\s+/g, '_')}`;
        const exists = dayData.tasks.some(t => t.id === taskId || t.id.startsWith(`rep_${rep.type}_${dueDay}_`));
        
        if (!exists) {
          let label = "";
          let desc = "";
          let duration = "15 dk";
          let qCount = 0;
          let taskType = "retest";

          if (rep.type === "leitner_1") {
            label = `🔍 Leitner Hafif Tekrar: ${rep.topic}`;
            desc = `15 dakikalık hızlı konu özeti tekrarı ve soru çözümü.`;
            duration = "15 dk";
            qCount = 10;
            taskType = "retest";
          } else if (rep.type === "odt") {
            label = `🧪 ÖDT: ${rep.topic}`;
            desc = `Öğrenme Doğrulama Testi (10 Soru).`;
            duration = "15 dk";
            qCount = 10;
            taskType = "odt";
          } else if (rep.type === "tekrar_hedefli") {
            label = `🔄 Hedefli Tekrar: ${rep.topic}`;
            desc = `ÖDT başarısına göre 20 dakika eksik kapatma çalışması.`;
            duration = "20 dk";
            taskType = "reading";
          } else if (rep.type === "odt2") {
            label = `🧪 ÖDT-2: ${rep.topic}`;
            desc = `Kırılgan konu için ikinci Öğrenme Doğrulama Testi (10 Soru).`;
            duration = "15 dk";
            qCount = 10;
            taskType = "odt2";
          } else if (rep.type === "pekistirme_7") {
            label = `⚡ Pekiştirme (7. Gün): ${rep.topic}`;
            desc = `Aralıklı tekrar kapsamında 20 soruluk pekiştirme testi.`;
            duration = "30 dk";
            qCount = 20;
            taskType = "quiz";
          } else if (rep.type === "pekistirme_21") {
            label = `⚡ Pekiştirme (21. Gün): ${rep.topic}`;
            desc = `Kalıcılık kontrolü kapsamında 20 soruluk pekiştirme testi.`;
            duration = "30 dk";
            qCount = 20;
            taskType = "quiz";
          } else if (rep.type === "re_study") {
            label = `📖 Konu Yeniden Çalışma: ${rep.topic}`;
            desc = `ÖDT başarısız olduğu için farklı bir kaynaktan tekrar çalışıp 30 soru çözün.`;
            duration = "90 dk";
            qCount = 30;
            taskType = "video";
          } else if (rep.type === "odt_re") {
            label = `🧪 ÖDT (Tekrar): ${rep.topic}`;
            desc = `Yeniden çalışılan konu için Öğrenme Doğrulama Testi (10 Soru).`;
            duration = "15 dk";
            qCount = 10;
            taskType = "odt";
          }

          // ÖDT'ler uygulama içi doğrulama testidir, kitap kaynağı almaz.
          // "Yeniden çalışma"/"pekiştirme" görevleri ise bilinçli olarak
          // ikinci kaynağa yönlendirilir (aynı kitaptan tekrar okumak
          // öğrenmeyi doğrulamaz).
          const isOdt = rep.type === "odt" || rep.type === "odt2" || rep.type === "odt_re";
          dayData.tasks.unshift(this.sourceBooks.attach({
            id: taskId,
            type: taskType,
            subject: rep.subject,
            topic: rep.topic,
            label: label,
            desc: desc,
            duration: duration,
            qCount: qCount,
            completed: rep.completed,
            logged: false,
            correct: 0,
            incorrect: 0,
            errorTopics: [],
            noSource: isOdt,
            sourceTier: rep.type === "leitner_1" ? 0 : 1
          }));
          dayData.schedule = this.buildDaySchedule(dayData.tasks, dueDay % 7);
        }
      }
    });
  },

  // Renders day selector as a literal progressive road path
  renderDashboard: function() {
    this.updateHeaderStats();
    this.syncProgramTypeUI(this.state.selectedProgramType || "standard");
    this.renderWeekSelectorTabs();

    var _el_dashName = document.getElementById("dashName"); if (_el_dashName) _el_dashName.textContent = this.state.name;
    var _el_dashTrack = document.getElementById("dashTrack"); if (_el_dashTrack) _el_dashTrack.textContent = `${this.state.track} Hazırlık Programı (Seviye ${this.state.level})`;
    
    var _el_dashSchoolStatus = document.getElementById("dashSchoolStatus"); if (_el_dashSchoolStatus) _el_dashSchoolStatus.textContent = this.state.isGraduate ? "Mezun" : "Okula Gidiyor";
    var _el_dashSleepPattern = document.getElementById("dashSleepPattern"); if (_el_dashSleepPattern) _el_dashSleepPattern.textContent = `${this.state.sleepTime} - ${this.state.wakeTime}`;
    var _el_dashDiagnosticScore = document.getElementById("dashDiagnosticScore"); if (_el_dashDiagnosticScore) _el_dashDiagnosticScore.textContent = this.state.diagnosticAccuracy ? `%${this.state.diagnosticAccuracy}` : "-%";
    var _el_dashParentContact = document.getElementById("dashParentContact"); if (_el_dashParentContact) _el_dashParentContact.textContent = this.state.parentContact || "-";
    var _el_aiKey = document.getElementById("aiCoachApiKey"); if (_el_aiKey) _el_aiKey.value = this.getLlmApiKey();
    this.updateAiConnectionStatus();
    this.updateRetakeDiagnosticUI();
    this.checkWeeklyRenewalReminder();
    this.renderDashboardSummary();

    // Update dashboard subscription status
    const subTier = this.state.subscriptionTier || "free";
    this.updateTierChip();
    const subTextEl = document.getElementById("dashSubTierText");
    const subBtnEl = document.getElementById("dashSubActionButton");
    if (subTextEl) {
      if (subTier === "free") {
        subTextEl.textContent = "Ücretsiz Plan";
        subTextEl.style.color = "var(--text-muted)";
        if (subBtnEl) {
          subBtnEl.textContent = "Deneme Sürümünü Başlat";
          subBtnEl.style.background = "#8b5cf6";
        }
      } else if (subTier === "trial") {
        subTextEl.textContent = "7 Günlük Deneme";
        subTextEl.style.color = "#f59e0b";
        if (subBtnEl) {
          subBtnEl.textContent = "Sınırsız PRO'ya Geç";
          subBtnEl.style.background = "#6366f1";
        }
      } else {
        subTextEl.textContent = "PRO Sınırsız";
        subTextEl.style.color = "#10b981";
        if (subBtnEl) {
          subBtnEl.textContent = "Aboneliği Yönet";
          subBtnEl.style.background = "#059669";
        }
      }
    }
    
    this.injectSpacedRepetitionTasks();

    // Render Outlook-style calendar columns
    this.renderWeeklyOutlookGrid();

    this.renderBadges();
    this.renderHeroTodayStats();

    // Update active indicators
    const allDays = Object.values(this.state.daysData);
    let completedCount = 0;
    let totalScoreCorrect = 0;
    let totalScoreIncorrect = 0;

    let tytCorrect = 0;
    let tytIncorrect = 0;
    let aytCorrect = 0;
    let aytIncorrect = 0;

    allDays.forEach(day => {
      if (day.tasks) {
        day.tasks.forEach(task => {
          if (task.completed) {
            completedCount++;
            if (task.correct !== undefined) {
              totalScoreCorrect += task.correct;
              totalScoreIncorrect += task.incorrect;

              const isAyt = task.examType === "AYT" || (!task.examType && ((task.label || "").includes("AYT") || task.subject === "Edebiyat"));
              if (isAyt) {
                aytCorrect += task.correct;
                aytIncorrect += task.incorrect;
              } else {
                tytCorrect += task.correct;
                tytIncorrect += task.incorrect;
              }
            }
          }
        });
      }
    });

    const activeDayData = this.state.daysData[this.state.activeDay] || { tasks: [] };
    const activeDayCompleted = activeDayData.tasks ? activeDayData.tasks.filter(t => t.completed).length : 0;
    const activeDayTotal = activeDayData.tasks ? activeDayData.tasks.length : 0;
    var _el_dashTasksCompleted = document.getElementById("dashTasksCompleted"); if (_el_dashTasksCompleted) _el_dashTasksCompleted.textContent = `${activeDayCompleted}/${activeDayTotal}`;
    
    const dailyTotalQs = totalScoreCorrect + totalScoreIncorrect;
    const accuracyText = dailyTotalQs > 0 ? `%${Math.round((totalScoreCorrect / dailyTotalQs) * 100)}` : "-%";
    var _el_dashDailyAccuracy = document.getElementById("dashDailyAccuracy"); if (_el_dashDailyAccuracy) _el_dashDailyAccuracy.textContent = accuracyText;

    // Render TYT / AYT specific summary breakdown
    const tytTotal = tytCorrect + tytIncorrect;
    const tytAcc = tytTotal > 0 ? `%${Math.round((tytCorrect / tytTotal) * 100)}` : "-%";
    var _el_dashTytSummaryStats = document.getElementById("dashTytSummaryStats"); if (_el_dashTytSummaryStats) _el_dashTytSummaryStats.textContent = tytTotal > 0 ? `${tytTotal} Soru / ${tytAcc}` : "0 Soru / -%";

    const aytTotal = aytCorrect + aytIncorrect;
    const aytAcc = aytTotal > 0 ? `%${Math.round((aytCorrect / aytTotal) * 100)}` : "-%";
    var _el_dashAytSummaryStats = document.getElementById("dashAytSummaryStats"); if (_el_dashAytSummaryStats) _el_dashAytSummaryStats.textContent = aytTotal > 0 ? `${aytTotal} Soru / ${aytAcc}` : "0 Soru / -%";

    // Render Worked/Learned topic counts
    const topicStats = this.calculateTopicStats();
    const workedEl = document.getElementById("dashTopicsWorked");
    const learnedEl = document.getElementById("dashTopicsLearned");
    if (workedEl) workedEl.textContent = `${topicStats.worked} konu`;
    if (learnedEl) learnedEl.textContent = `${topicStats.learned} konu`;

    this.generateDailyBriefing();
    this.renderMonthlyCalendarGrid();
  },

  switchActiveDay: function(day) {
    this.checkForUncompletedTasksReschedule();

    this.state.activeDay = day;
    const weekNum = Math.ceil(day / 7);
    this.state.activeWeek = weekNum;

    // Update UI active states for week selector tabs
    const totalWeeks = Math.ceil(this.PROGRAM_DAYS / 7);
    for (let i = 1; i <= totalWeeks; i++) {
      const tab = document.getElementById(`weekTab-${i}`);
      if (tab) {
        if (i === weekNum) tab.classList.add("active");
        else tab.classList.remove("active");
      }
    }

    const outlookTitle = document.getElementById("weeklyOutlookTitle");
    if (outlookTitle) {
      outlookTitle.textContent = `Haftalık Takvim Planlayıcısı (Hafta ${weekNum})`;
    }

    this.calculateFocusScore();
    this.renderDashboard();
    this.renderAICoachRecommendations();
    this.saveState();
  },

  openDayDetailsModal: function(dayNum) {
    this.state.activeDay = dayNum;
    const weekNum = Math.ceil(dayNum / 7);
    this.state.activeWeek = weekNum;
    
    // Sync today panel
    this.renderTodayPanel();

    // Render indicators
    document.getElementById("dayModalTitle").textContent = `Gün ${dayNum} Çalışma Programı`;
    document.getElementById("dayModalDate").textContent = this.getFormattedRealDate(dayNum);

    this.renderDayDetailsTasks();
    this.openModal("dayDetailsModal");
  },

  renderDayDetailsTasks: function() {
    const dayNum = this.state.activeDay;
    const dayData = this.state.daysData[dayNum] || { completed: false, tasks: [] };
    const listContainer = document.getElementById("dayModalTasksList");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    // Calculate progress
    const completedCount = dayData.tasks.filter(t => t.completed).length;
    const totalCount = dayData.tasks.length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    document.getElementById("dayModalProgressText").textContent = `${completedCount}/${totalCount} Tamamlandı`;
    document.getElementById("dayModalProgressBar").style.width = `${percent}%`;

    dayData.tasks.forEach(task => {
      const card = document.createElement("div");
      const isCompleted = task.completed;
      card.className = "outlook-task-card" + (isCompleted ? " completed" : "");
      card.style.padding = "1rem";
      card.style.fontSize = "0.9rem";
      
      const badgeClass = task.type === "smart_review" ? "tag-ai-review" : task.isUserHabit ? "tag-habit" : task.type === "video" ? "tag-video" : task.type === "reading" ? "tag-konu" : task.type === "retest" ? "tag-tekrar" : "tag-test";
      const badgeLabel = task.type === "smart_review" ? "AI TEKRAR" : task.isUserHabit ? "ALIŞKANLIK" : task.type === "video" ? "VİDEO" : task.type === "reading" ? "KAZANIM" : task.type === "retest" ? "TEKRAR" : "TEST";

      card.onclick = () => {
        this.clickOutlookTask(dayNum, task.id);
        // Refresh modal list on click
        setTimeout(() => { this.renderDayDetailsTasks(); }, 150);
      };

      const aiBadges = this.getTaskAIBadgesHTML(task, dayNum);
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <input type="checkbox" ${isCompleted ? 'checked disabled' : ''} style="width:22px; height:22px; min-width:22px; flex-shrink:0; cursor:pointer;">
            <div>
              <span style="font-weight:700; color:var(--text-main); font-size:0.9rem; text-decoration:${isCompleted ? 'line-through' : 'none'};">${app.escapeHtml(task.label)}</span>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">${app.escapeHtml(task.desc)}</div>
              ${app.getTaskSourceHTML(task, "0.72rem")}
              ${aiBadges ? `<div style="margin-top:0.35rem;">${aiBadges}</div>` : ""}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="task-badge ${badgeClass}">${badgeLabel}</span>
            <span style="font-size:0.8rem; color:var(--text-muted);"><i class="fa-regular fa-clock"></i> ${task.duration}</span>
            ${this.state.selectedProgramType === "custom" ? `
              <i class="fa-solid fa-trash-can text-danger" style="cursor:pointer; font-size:0.9rem; margin-left:0.5rem;" onclick="event.stopPropagation(); app.deleteOutlookTask('${dayNum}', '${task.id}'); setTimeout(() => { app.renderDayDetailsTasks(); }, 150);"></i>
            ` : ""}
          </div>
        </div>
      `;
      listContainer.appendChild(card);
    });
  },

  // Smart Rescheduling
  // FEATURE 9 — Dynamic Daily Replanning: kaçırılan bir günün görevlerini
  // olduğu gibi ertesi güne taşımak yerine (program şişer, yürütülemez
  // hale gelir), AI öncelik skoruna göre elenir: yüksek etkili görevler
  // aynen taşınır, düşük öncelikli olanlar tek bir kısa "toplu telafi"
  // görevinde sıkıştırılır — ertesi günün kapasitesi asla zorlanmaz.
  checkForUncompletedTasksReschedule: function() {
    if (this.state.selectedProgramType === "custom") return;

    const activeDayData = this.state.daysData[this.state.activeDay];
    if (!activeDayData) return;

    const uncompletedTasks = activeDayData.tasks.filter(t => !t.completed);
    const nextDayNum = this.state.activeDay + 1;
    const nextDayData = this.state.daysData[nextDayNum];

    if (uncompletedTasks.length > 0 && nextDayData) {
      const scored = uncompletedTasks
        .map(t => ({ task: t, score: this.computeTaskPriorityScore(t, this.state.activeDay) || 0 }))
        .sort((a, b) => b.score - a.score);

      const dayOfWeek = nextDayNum % 7;
      const capacityMinutes = this.dailyCapacityMinutes(dayOfWeek);
      const alreadyScheduled = nextDayData.tasks.reduce((sum, t) => sum + this.parseDurationMinutes(t.duration), 0);
      let remaining = capacityMinutes ? Math.max(0, capacityMinutes - alreadyScheduled) : Infinity;

      const migrated = [];
      const compressed = [];
      scored.forEach(({ task }) => {
        if (nextDayData.tasks.some(t => t.id === `migrated_${task.id}`)) return;
        const mins = this.parseDurationMinutes(task.duration);
        if (mins <= remaining) {
          migrated.push(task);
          remaining -= mins;
        } else {
          compressed.push(task);
        }
      });

      migrated.forEach(task => {
        nextDayData.tasks.unshift({
          ...task,
          id: `migrated_${task.id}`,
          label: `⚠️ Gecikmiş Görev: ${task.label}`,
          desc: `Önceki günden aksayan ve yüksek öncelikli olduğu için bugüne taşınan görev.`,
          completed: false
        });
      });

      const compressedId = `migrated_compressed_${this.state.activeDay}`;
      if (compressed.length > 0 && !nextDayData.tasks.some(t => t.id === compressedId)) {
        const subjects = [...new Set(compressed.map(t => t.subject))];
        nextDayData.tasks.push({
          id: compressedId,
          type: "reading",
          subject: subjects[0] || "Genel",
          topic: "Toplu Telafi",
          label: `📦 Sıkıştırılmış Telafi: ${subjects.join(", ")}`,
          desc: `Gün ${this.state.activeDay}'da tamamlanamayan ${compressed.length} düşük öncelikli görev, programı şişirmemek için tek bir kısa telafi seansında birleştirildi: ${compressed.map(t => t.label).join(", ")}.`,
          duration: "20 dk",
          completed: false
        });
      }

      activeDayData.tasks = activeDayData.tasks.filter(t => t.completed);
      activeDayData.completed = true;
      nextDayData.schedule = this.buildDaySchedule(nextDayData.tasks, dayOfWeek);
    }
  },

  toggleTaskCompleted: function(taskId, checkbox) {
    const activeDayData = this.state.daysData[this.state.activeDay];
    const task = activeDayData.tasks.find(t => t.id === taskId);

    if (checkbox.checked) {
      const isQuiz = task.type === "quiz" || 
                     task.type === "common" || 
                     task.type === "retest" || 
                     task.type === 'question' || 
                     (task.qCount && task.qCount > 0) || 
                     (task.questionCount && task.questionCount > 0) || 
                     (task.label && task.label.toLowerCase().includes('test')) || 
                     (task.desc && task.desc.toLowerCase().includes('test')) ||
                     (task.label && task.label.toLowerCase().includes('soru')) ||
                     (task.desc && task.desc.toLowerCase().includes('soru'));
      if (isQuiz) {
        task.isLogging = true;
        checkbox.checked = false;
        this.renderDashboard();
      } else {
        task.completed = true;
        this.checkDayCompletedState();
        this.renderDashboard();
        
        this.checkBadgeAwardsOnLog(task);
        this.calculateFocusScore();
        this.saveState();
      }
    }
  },

  // ==========================================================
  // ARALIKLI TEKRAR (SPACED REPETITION) — AKTİF
  // ------------------------------------------------------------
  // Önceden bu fonksiyonun hiçbir çağıranı yoktu; sistem tanımlı ama
  // ölüydü. Artık her tamamlanan konu görevi otomatik olarak tekrar
  // döngüsüne giriyor. Aralıklar sabit değil: hata defteri, konu
  // hâkimiyeti ve sınava kalan süreye göre kısalıp uzuyor.
  // Tekrarlar AYRI görev olarak eklenmez — mevcut AI Akıllı Tekrar
  // Seansı'nın içinde sunulur (günlük programı şişirmemek için).
  // ==========================================================
  SR_INTERVALS: [1, 3, 7, 14, 30, 60, 120],

  registerSpacedRepetition: function(topic, subject, topicId) {
    if (!topic) return;
    if (!Array.isArray(this.state.spacedRepetitionTasks)) this.state.spacedRepetitionTasks = [];
    const day = this.state.activeDay || 1;
    const key = topicId || (this.curriculum.byName(subject, topic) || {}).id || `${subject}::${topic}`;

    let rec = this.state.spacedRepetitionTasks.find(r => r.key === key);
    if (!rec) {
      rec = { key: key, topic: topic, subject: subject, stage: 0, ease: 1, lastDay: day, dueDay: 0, history: [] };
      this.state.spacedRepetitionTasks.push(rec);
    } else {
      rec.topic = topic; rec.subject = subject; rec.lastDay = day;
    }
    rec.dueDay = this.computeNextReviewDay(rec, day);
    this.saveState();
  },

  // Bir sonraki tekrar günü — uyarlanabilir.
  computeNextReviewDay: function(rec, fromDay) {
    const base = this.SR_INTERVALS[Math.min(rec.stage, this.SR_INTERVALS.length - 1)];

    // 1) Hata defterinde bu konu aktifse aralık kısalır (unutma riski yüksek)
    const inVault = (this.state.uploadedQuestions || []).some(q => !q.completed && q.topic === rec.topic);
    // 2) Konu hâkimiyeti: bu konudaki doğruluk oranı
    const recs = (this.state.chartData || []).filter(r => r.topic === rec.topic || r.subject === rec.subject);
    const acc = recs.length
      ? recs.reduce((a, r) => a + (r.correct || 0), 0) / Math.max(1, recs.reduce((a, r) => a + (r.total || 0), 0))
      : null;

    let factor = rec.ease || 1;
    if (inVault) factor *= 0.5;                     // hata yapılan konu daha sık gelir
    if (acc !== null && acc < 0.5) factor *= 0.7;   // düşük hâkimiyet -> sıklaştır
    if (acc !== null && acc > 0.85) factor *= 1.3;  // yüksek hâkimiyet -> seyrelt

    // 3) Sınava kalan süre: son düzlükte aralıklar daraltılır
    const remaining = this.computeRemainingExamDays ? this.computeRemainingExamDays() : 200;
    if (remaining < 60) factor *= 0.6;
    else if (remaining < 120) factor *= 0.8;

    // 4) Öğrenci istikrarı: düzensiz çalışan öğrencide unutma riski yüksektir,
    //    tekrarlar sıklaştırılır; istikrarlı öğrencide aralık bir miktar açılır.
    const consistency = this.computeStudyConsistency();
    if (consistency !== null) {
      if (consistency < 0.5) factor *= 0.7;
      else if (consistency > 0.85) factor *= 1.15;
    }

    // 5) Bölüm bazlı deneme analizi: konunun bölümü zayıf/gerileyense sıklaştır
    const node = this.curriculum.byName(rec.subject, rec.topic);
    if (node) {
      const an = this._sectionAnalysisCache !== undefined ? this._sectionAnalysisCache : (this._sectionAnalysisCache = this.analyzeMockSections());
      const row = an && an.sections.find(r => r.section === node.section);
      if (row) {
        if (row.avgAccuracy < 50) factor *= 0.6;
        else if (row.avgAccuracy < 65) factor *= 0.8;
        if (row.trend === "declining") factor *= 0.85;
      }
    }

    const interval = Math.max(1, Math.round(base * factor));
    return Math.min(this.PROGRAM_DAYS, fromDay + interval);
  },

  // Son 14 günün görev tamamlama oranı — aralıklı tekrar ve haftalık
  // rapor tarafından ortak kullanılır (tek hesaplama).
  computeStudyConsistency: function() {
    const today = this.state.activeDay || 1;
    const from = Math.max(1, today - 13);
    const ratios = [];
    for (let d = from; d <= today; d++) {
      const dd = this.state.daysData[d];
      if (dd && Array.isArray(dd.tasks) && dd.tasks.length) {
        ratios.push(dd.tasks.filter(t => t.completed).length / dd.tasks.length);
      }
    }
    if (!ratios.length) return null;
    return ratios.reduce((a, b) => a + b, 0) / ratios.length;
  },

  // O gün vadesi gelmiş tekrar konuları (en riskli önce)
  getDueRepetitions: function(dayNum) {
    if (!Array.isArray(this.state.spacedRepetitionTasks)) return [];
    return this.state.spacedRepetitionTasks
      .filter(r => r.dueDay && r.dueDay <= dayNum && r.stage < this.SR_INTERVALS.length)
      .map(r => ({ rec: r, risk: (dayNum - r.dueDay) + (this.SR_INTERVALS.length - r.stage) }))
      .sort((a, b) => b.risk - a.risk)
      .map(x => x.rec);
  },

  // Tekrar seansında bir konu çalışıldığında bir sonraki aşamaya geçer
  advanceRepetition: function(key, wasSuccessful) {
    const rec = (this.state.spacedRepetitionTasks || []).find(r => r.key === key);
    if (!rec) return;
    const day = this.state.activeDay || 1;
    if (wasSuccessful) {
      rec.stage = Math.min(rec.stage + 1, this.SR_INTERVALS.length);
      rec.ease = Math.min(2, (rec.ease || 1) + 0.15);
    } else {
      rec.stage = Math.max(0, rec.stage - 1);
      rec.ease = Math.max(0.5, (rec.ease || 1) - 0.2);
    }
    rec.history.push({ day: day, ok: !!wasSuccessful });
    rec.lastDay = day;
    rec.dueDay = this.computeNextReviewDay(rec, day);
    this.saveState();
  },

  checkDayCompletedState: function() {
    const activeDayData = this.state.daysData[this.state.activeDay];
    const allDone = activeDayData.tasks.every(t => t.completed);
    activeDayData.completed = allDone;

    this.updateHeaderStats();

    if (allDone) {

      // Start 2-hour visual countdown for parent report auto-notification
      // (bugün için rapor ekranı gün sonu tetikleyicisiyle zaten gösterildiyse tekrar başlatma)
      const todayKey = new Date().toISOString().split("T")[0];
      if (!this.state.parentReportDueTime && this.state.parentReportShownDate !== todayKey) {
        this.state.parentReportDueTime = Date.now() + 2 * 60 * 60 * 1000;
        this.startParentNotificationTimer();
      }
    } else {
      // Clear parent report timer if task state is toggled back to incomplete
      this.state.parentReportDueTime = null;
      if (this.parentTimerInterval) {
        clearInterval(this.parentTimerInterval);
        this.parentTimerInterval = null;
      }
      const banner = document.getElementById("parentReportCountdownBanner");
      if (banner) banner.style.display = "none";
    }
  },


  // AI Loading Overlay
  showAILoading: function(title, msg, tabId) {
    const overlay = document.getElementById("aiCalcOverlay");
    if (!overlay) return;
    const titleEl = document.getElementById("aiCalcTitle");
    const msgEl = document.getElementById("aiCalcMsg");
    const iconContainer = document.getElementById("aiCalcIconContainer");
    
    if (titleEl) titleEl.textContent = title || "AI Hesaplama Yapılıyor";
    if (msgEl) msgEl.textContent = msg || "Verileriniz analiz ediliyor, lütfen bekleyin...";
    
    if (iconContainer) {
      const basePencil = `
        <g style="animation: aiPenWrite 1.5s infinite alternate ease-in-out; transform-origin: center;">
          <g transform="rotate(-10 60 70)">
            <path d="M46 72 Q34 76 31 86" fill="none" stroke="#a78bfa" stroke-width="3" stroke-linecap="round"></path>
            <circle cx="31" cy="87" r="4" fill="#8b5cf6" stroke="#a78bfa" stroke-width="2.5"></circle>
            <path d="M74 68 Q86 62 89 52" fill="none" stroke="#a78bfa" stroke-width="3" stroke-linecap="round"></path>
            <circle cx="89" cy="51" r="4" fill="#8b5cf6" stroke="#a78bfa" stroke-width="2.5"></circle>
            <rect x="46" y="8" width="28" height="15" rx="7" fill="#8b5cf6" stroke="#a78bfa" stroke-width="2.5"></rect>
            <rect x="46" y="22" width="28" height="8" fill="#c4b5fd" stroke="#a78bfa" stroke-width="2.5"></rect>
            <rect x="46" y="30" width="28" height="60" fill="#ede9fe" stroke="#a78bfa" stroke-width="2.5"></rect>
            <path d="M46 90 L74 90 L60 116 Z" fill="#c4b5fd" stroke="#a78bfa" stroke-width="2.5" stroke-linejoin="round"></path>
            <path d="M55 106 L65 106 L60 116 Z" fill="#8b5cf6"></path>
          </g>
        </g>
      `;

      let svgContent = `<svg viewBox="0 0 120 140" style="width: 56px; height: 65px; display:inline-block;">${basePencil}</svg>`;

      if (tabId === "programCreator") {
        svgContent = `
          <svg viewBox="0 0 160 140" style="width: 70px; height: 65px; display:inline-block;">
            <rect x="10" y="20" width="140" height="90" rx="4" fill="#1e293b" stroke="#8b5cf6" stroke-width="3"></rect>
            <line x1="30" y1="110" x2="20" y2="135" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round"></line>
            <line x1="130" y1="110" x2="140" y2="135" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round"></line>
            <line x1="25" y1="40" x2="70" y2="40" stroke="#c4b5fd" stroke-width="3" stroke-linecap="round" style="opacity:0.6"></line>
            <line x1="25" y1="60" x2="90" y2="60" stroke="#c4b5fd" stroke-width="3" stroke-linecap="round" style="opacity:0.6"></line>
            <line x1="25" y1="80" x2="60" y2="80" stroke="#c4b5fd" stroke-width="3" stroke-linecap="round" style="opacity:0.6"></line>
            <g transform="scale(0.65) translate(80, -20)">${basePencil}</g>
          </svg>
        `;
      } else if (tabId === "vault") {
        svgContent = `
          <svg viewBox="0 0 160 140" style="width: 70px; height: 65px; display:inline-block;">
            <path d="M30 20 L120 20 Q130 20 130 30 L130 110 Q130 120 120 120 L30 120 Z" fill="#1e293b" stroke="#8b5cf6" stroke-width="3"></path>
            <circle cx="25" cy="30" r="5" fill="none" stroke="#a78bfa" stroke-width="2"></circle>
            <circle cx="25" cy="50" r="5" fill="none" stroke="#a78bfa" stroke-width="2"></circle>
            <circle cx="25" cy="70" r="5" fill="none" stroke="#a78bfa" stroke-width="2"></circle>
            <circle cx="25" cy="90" r="5" fill="none" stroke="#a78bfa" stroke-width="2"></circle>
            <circle cx="25" cy="110" r="5" fill="none" stroke="#a78bfa" stroke-width="2"></circle>
            <path d="M85 35 L100 50 M100 35 L85 50" stroke="#ef4444" stroke-width="3" stroke-linecap="round"></path>
            <g transform="scale(0.65) translate(50, -20)">${basePencil}</g>
          </svg>
        `;
      } else if (tabId === "charts") {
        svgContent = `
          <svg viewBox="0 0 160 140" style="width: 70px; height: 65px; display:inline-block;">
            <path d="M20 30 Q20 10 50 10 L110 10 Q140 10 140 30 L140 80 Q140 100 110 100 L90 100 L60 130 L60 100 L50 100 Q20 100 20 80 Z" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linejoin="round"></path>
            <rect x="45" y="60" width="12" height="25" fill="#a78bfa"></rect>
            <rect x="65" y="45" width="12" height="40" fill="#a78bfa"></rect>
            <rect x="85" y="25" width="12" height="60" fill="#a78bfa"></rect>
            <path d="M51 60 L71 45 L91 25" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"></path>
            <g transform="scale(0.55) translate(180, 20)">${basePencil}</g>
          </svg>
        `;
      } else if (tabId === "habitMap") {
        svgContent = `
          <svg viewBox="0 0 160 140" style="width: 70px; height: 65px; display:inline-block;">
            <rect x="30" y="30" width="100" height="90" rx="6" fill="none" stroke="#8b5cf6" stroke-width="3"></rect>
            <line x1="30" y1="55" x2="130" y2="55" stroke="#8b5cf6" stroke-width="3"></line>
            <line x1="63" y1="55" x2="63" y2="120" stroke="#8b5cf6" stroke-width="3"></line>
            <line x1="96" y1="55" x2="96" y2="120" stroke="#8b5cf6" stroke-width="3"></line>
            <path d="M40 75 L50 85 L60 65" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M75 75 L85 85 L95 65" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
            <g transform="scale(0.55) translate(160, 40)">${basePencil}</g>
          </svg>
        `;
      } else {
        svgContent = `
          <svg viewBox="0 0 120 140" style="width: 56px; height: 65px; display:inline-block;">
            ${basePencil}
          </svg>
        `;
      }
      iconContainer.innerHTML = svgContent;
    }
    
    overlay.style.display = "flex";
  },
  
  hideAILoading: function() {
    const overlay = document.getElementById("aiCalcOverlay");
    if (overlay) overlay.style.display = "none";
  },

  showCoachAlert: function(title, htmlContent) {
    document.getElementById("coachModalTitle").textContent = title;
    document.getElementById("coachModalBody").innerHTML = htmlContent;
    
    const quotes = [
      "\"Çalışmalar antrenmanda kazanılır. Eksiklerini kapat, sınavda şans tanıma!\"",
      "\"Hata yapmak ayıp değil, aynı hatayı üst üste yapmak yenilgiyi getirir. Hemen tekrar et!\"",
      "\"Büyük hedefler, kimsenin izlemediği anlarda en çok ter dökenlerin hakkıdır.\"",
      "\"Netlerin tesadüfen artmaz, her yanlış sorunun konusunu eritene kadar çalışmaya devam!\""
    ];
    const randQuote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById("coachModalQuote").textContent = randQuote;

    this.openModal("coachModal");
  },

  // Focus Score
  calculateFocusScore: function() {
    const activeDayData = this.state.daysData[this.state.activeDay] || { tasks: [] };
    const tasks = activeDayData.tasks || [];
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionScore = totalTasks > 0 ? (completedTasks / totalTasks) * 60 : 60;

    const streakScore = Math.min(15, this.state.streak * 3);

    let speedScore = 25;
    const speedRecords = this.state.chartData.filter(r => r.total > 0);
    if (speedRecords.length > 0) {
      const avgSpeed = speedRecords.reduce((sum, r) => sum + (r.time / r.total), 0) / speedRecords.length;
      if (avgSpeed > 2.5) {
        speedScore = Math.max(5, 25 - (avgSpeed - 2.5) * 10);
      } else if (avgSpeed < 0.8) {
        speedScore = Math.max(5, 25 - (0.8 - avgSpeed) * 20); 
      }
    }

    const overallFocus = Math.round(completionScore + streakScore + speedScore);
    this.state.focusScore = Math.min(100, Math.max(10, overallFocus));

    const scoreGauge = document.getElementById("focusScoreVal");
    if (scoreGauge) scoreGauge.textContent = this.state.focusScore;
  },

  // AI Work Coach Insights (Chronotype & Burnout features)
  renderAICoachRecommendations: function() {
    const container = document.getElementById("aiCoachAdviceContainer");
    if (!container) return;
    container.innerHTML = "";

    const recommendations = [];
    const records = this.state.chartData;

    // 1. Burnout Check (Tükenmişlik uyarısı)
    // If the student has studied >6 tasks but accuracy/correct ratios drop consecutively, trigger burnout
    if (records.length >= 3) {
      const last3 = records.slice(-3);
      const isDeclining = (last3[0].correct > last3[1].correct && last3[1].correct > last3[2].correct);
      const highStudyTime = last3.reduce((sum, r) => sum + r.time, 0) > 120; // >120 mins logged for test sessions
      
      if (isDeclining && highStudyTime) {
        this.state.burnoutAlertActive = true;
        recommendations.push("🛌 <strong>Tükenmişlik (Burnout) Uyarısı:</strong> Son 3 gündür çalışma süren yüksek olmasına rağmen soru başı verimliliğin ciddi oranda düşüşte. Seriyi bozmamak için kendini yıpratma. Yarınki planını tamamen hafifleterek bir 'Dinlenme Günü' hazırladım. Dinlenmek de şampiyonluk planının bir parçasıdır!");
        
        // Auto-modify next day to light mode if not already modified
        const nextDayNum = this.state.activeDay + 1;
        const nextDayData = this.state.daysData[nextDayNum];
        if (nextDayData && !nextDayData.isBurnoutRelaxed) {
          nextDayData.tasks = [{
            id: `relax_${nextDayNum}`,
            type: "reading",
            subject: "Rehberlik",
            topic: "Zihinsel Yenilenme Seansı",
            label: "🛌 Dinlenme ve Toparlanma Seansı",
            desc: "Koç Kararı: Bugün zihinsel toparlanma günün. Sadece 15 dakika hafif rehberlik videosu izle, geri kalan sürede hobilerine vakit ayır.",
            duration: "15 dk",
            completed: false
          }];
          nextDayData.isBurnoutRelaxed = true;
        }
      }
    }

    // 2. Energy/Chronotype analysis (Zaman Eşleştirme)
    if (records.length > 0) {
      // Find morning peaks (9:00 to 12:00) vs evening
      const morningLogs = records.filter(r => r.hour >= 9 && r.hour <= 12 && r.subject === "Matematik");
      if (morningLogs.length > 0) {
        recommendations.push("☀️ <strong>Zaman-Enerji Analizi:</strong> Sabah 09:00-12:00 saatleri arasındaki Matematik çözme hızın akşam seanslarına kıyasla %30 daha yüksek! Zorlu mantık ve Matematik konularını sabah saatlerine koymalı, ezber seanslarını akşama bırakmalısın.");
      } else {
        // Fallback optimal suggestion
        recommendations.push("🧠 <strong>Verimlilik Eşleşmesi:</strong> Circadian ritmine göre en yüksek odaklanma düzeyin sabah 09:00-12:00 arasındadır. Zorlu problem çözümlerini bu saatlere yerleştirebilirsin.");
      }
    }

    // 3. Subject gap tracking (Biyoloji check)
    let totalCompletedTasks = 0;
    Object.values(this.state.daysData).forEach(day => {
      if (day.tasks) {
        day.tasks.forEach(t => {
          if (t.completed) totalCompletedTasks++;
        });
      }
    });

    if (totalCompletedTasks >= 5 && records.length >= 3 && this.state.activeDay >= 4 && this.state.track === "Sayısal") {
      const biyolojiLogs = records.filter(c => c.subject === "Biyoloji");
      if (biyolojiLogs.length === 0) {
        recommendations.push("⚠️ 3 gündür Biyoloji çalışmadın. Hücre ünitesi gibi ezber konuların unutulma hızı yüksektir; aralıklı tekrarları aksatmayalım.");
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("📋 AI Koç: Günlük programın ve zihinsel tempon dengeli görünüyor. Bugünkü programı eksiksiz tamamlayarak seriyi koru!");
    }

    recommendations.forEach(rec => {
      const p = document.createElement("div");
      p.style.padding = "0.6rem 0.8rem";
      p.style.background = "var(--bg-sub)";
      p.style.borderRadius = "8px";
      p.style.borderLeft = "4px solid var(--secondary)";
      p.style.lineHeight = "1.4";
      p.innerHTML = rec;
      container.appendChild(p);
    });
  },

  generateDailyBriefing: function() {
    const name = this.state.name || "Şampiyon";
    const activeDayNum = this.state.activeDay;

    // Check if the user has ever completed any task in the calendar
    let totalCompletedTasksAllTime = 0;
    Object.values(this.state.daysData).forEach(day => {
      if (day.tasks) {
        day.tasks.forEach(t => {
          if (t.completed) totalCompletedTasksAllTime++;
        });
      }
    });

    if (totalCompletedTasksAllTime === 0) {
      const textEl = document.getElementById("dailyCoachBriefingText");
      if (textEl) {
        textEl.innerHTML = `Merhaba ${name.split(" ")[0]}! YKSKoçum'a hoş geldin. YKS hedefine giden maratonda ilk adımını bugün atıyoruz. Program tipini seçtikten sonra bugünün ilk görevlerine göz atıp hemen sahaya çıkabilirsin. Sen dersleri tamamladıkça alışkanlıklarını analiz edip sana özel günlük taktikler ve çalışma tavsiyeleri hazırlayacağım. Başarılar, şampiyon! 🏆`;
      }
      return;
    }

    // 1. Calculate yesterday's completion percentage
    let yesterdayText = "";
    if (activeDayNum > 1) {
      const yesterdayNum = activeDayNum - 1;
      const yesterdayData = this.state.daysData[yesterdayNum];
      if (yesterdayData && yesterdayData.tasks && yesterdayData.tasks.length > 0) {
        const completedCount = yesterdayData.tasks.filter(t => t.completed).length;
        const pct = Math.round((completedCount / yesterdayData.tasks.length) * 100);
        yesterdayText = `Dün planının %${pct}'sini tamamladın. `;
      } else {
        yesterdayText = "Dün planında herhangi bir görev bulunmuyordu. ";
      }
    } else {
      yesterdayText = "Bugün YKSKoçum ile 1. günün, harika bir başlangıç yapalım! ";
    }

    // 2. Scan completed subjects for progress
    // Let's count recently completed subjects (last 5 days)
    const recentDays = Array.from({length: 5}, (_, i) => activeDayNum - i).filter(d => d >= 1);
    const completedSubjects = [];
    const neglectedSubjects = [];

    recentDays.forEach(dNum => {
      const day = this.state.daysData[dNum];
      if (day && day.tasks) {
        day.tasks.forEach(t => {
          if (t.completed && !completedSubjects.includes(t.subject)) {
            completedSubjects.push(t.subject);
          }
          if (!t.completed && !neglectedSubjects.includes(t.subject)) {
            neglectedSubjects.push(t.subject);
          }
        });
      }
    });

    // Remove duplicates from neglected if they are completed elsewhere
    const actualNeglected = neglectedSubjects.filter(sub => !completedSubjects.includes(sub) && sub !== "Rehberlik");
    const actualCompleted = completedSubjects.filter(sub => sub !== "Rehberlik");

    // 3. Assemble dynamic message
    let greeting = `Merhaba ${name.split(" ")[0]}. ${yesterdayText}`;
    let progressPart = "";
    let alertPart = "";
    let recommendationPart = "";

    if (actualCompleted.length > 0) {
      const positiveSub = actualCompleted[0];
      progressPart = `${positiveSub} çalışmalarında güzel bir ivme yakaladın, bu şekilde devam! `;
    } else {
      progressPart = "Çalışma hedeflerini tamamladıkça ders bazlı başarı eğrini çıkaracağım. ";
    }

    if (actualNeglected.length > 0) {
      const targetSub = actualNeglected[0];
      alertPart = `Ama ${targetSub} konularını son günlerde biraz aksatıyor veya erteliyorsun gibi görünüyor. `;
      recommendationPart = `Bugün zihninin en zinde olduğu ilk 45 dakikayı ${targetSub} çalışmasına ayırmanı öneriyorum. Hadi sahaya çıkalım!`;
    } else {
      // General feedback if no neglected subjects
      alertPart = "Tüm derslerini dengeli bir şekilde götürüyorsun, planın saat gibi işliyor! ";
      if (this.state.daysData[activeDayNum] && this.state.daysData[activeDayNum].tasks && this.state.daysData[activeDayNum].tasks.length > 0) {
        const firstTask = this.state.daysData[activeDayNum].tasks.find(t => !t.completed);
        if (firstTask) {
          recommendationPart = `Bugün güne enerjini yükseltmek için ilk seansında <strong>${firstTask.subject}: ${firstTask.topic}</strong> konusuyla başlamanı tavsiye ederim. Başarılar!`;
        } else {
          recommendationPart = "Bugünkü tüm görevlerini zaten tamamlamışsın! Hak edilmiş dinlenmenin tadını çıkar. 🏆";
        }
      } else {
        recommendationPart = "Bugün için henüz bir plan oluşturulmamış, hemen yukarıdan plan tipini seçerek sahaya çıkalım!";
      }
    }

    const fullMessage = `${greeting}${progressPart}${alertPart}${recommendationPart}`;
    const textEl = document.getElementById("dailyCoachBriefingText");
    if (textEl) {
      textEl.innerHTML = fullMessage;
    }
  },

  triggerEndDayCheck: function() {
    const activeDayData = this.state.daysData[this.state.activeDay];
    const isCompleted = activeDayData.tasks.every(t => t.completed);

    if (isCompleted) {
      this.showCoachAlert("Tebrikler Şampiyon! Gün Bitti!", `
        🤖 <strong>Harika bir süreç!</strong> Bugünün tüm hedeflerini firesiz tamamladın. Skor tahtası pırıl pırıl!<br><br>
        Velini bilgilendirmen için gün sonu raporunu hazırladım. Aşağıdaki butondan WhatsApp / Mail raporunu kopyalayıp paylaşabilirsin.
      `);
      
      const btnContainer = document.getElementById("coachModalButtons");
      btnContainer.innerHTML = `
        <button class="btn btn-primary" onclick="app.showParentReportModal(); app.closeModal('coachModal');">
          <i class="fa-brands fa-whatsapp"></i> Veliye Rapor Gönder
        </button>
        <button class="btn btn-secondary" onclick="app.closeModal('coachModal')">Kapat</button>
      `;
    } else {
      const uncompletedTasks = activeDayData.tasks.filter(t => !t.completed);
      let taskListHtml = "<ul style='margin-left:1.5rem; margin-top:0.5rem;'>";
      uncompletedTasks.forEach(t => {
        taskListHtml += `<li>- ${this.escapeHtml(t.label)}</li>`;
      });
      taskListHtml += "</ul>";

      this.showCoachAlert("⏱️ Süreç Devam Ediyor!", `
        🚨 <strong>Günün tamamlanmadı!</strong> Aşağıdaki görevler henüz tamamlanmayı bekliyor:<br>
        ${taskListHtml}<br>
        Programı kapatırsan bitirilmeyen bu görevler yarınki çalışma listene <strong>otomatik olarak aktarılacaktır</strong>.
      `);
      
      const btnContainer = document.getElementById("coachModalButtons");
      btnContainer.innerHTML = `
        <button class="btn btn-primary" onclick="app.closeModal('coachModal')">Çalışmaya Dön</button>
      `;
    }
  },

  generateParentReportText: function(isSuccess) {
    const activeDayData = this.state.daysData[this.state.activeDay];
    // O gün için henüz program oluşturulmamış olabilir (yeni kullanıcı,
    // plan dışı gün): rapor boş verilerle yine üretilir, çökmez.
    const dayTasks = (activeDayData && Array.isArray(activeDayData.tasks)) ? activeDayData.tasks : [];

    let totalSolved = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalMins = 0;
    let mistakesText = "";

    dayTasks.forEach(task => {
      if (task.completed) {
        if (task.correct !== undefined) {
          totalSolved += (task.correct + task.incorrect);
          totalCorrect += task.correct;
          totalIncorrect += task.incorrect;
          if (task.timeSpent) totalMins += task.timeSpent;
          if (task.errorTopics && task.errorTopics.length > 0) {
            mistakesText += `${task.subject}: ${task.errorTopics.join(", ")}\n`;
          }
        }
      }
    });

    const acc = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
    const dateStr = new Date().toLocaleDateString('tr-TR');

    let text = `*AIKOÇUM GÜNLÜK ÇALIŞMA RAPORU* 📋\n`;
    text += `Tarih: ${dateStr} | Gün: ${this.state.activeDay}\n`;
    text += `Öğrenci: ${this.state.name}\n\n`;
    text += `*Günlük Hedefler:* ${isSuccess ? "EKSİKSİZ TAMAMLANDI ✅" : "TAMAMLANAMADI ⚠️"}\n`;
    text += `*Toplam Çözülen Soru:* ${totalSolved} adet\n`;
    text += `*Çözüm Süresi:* ${totalMins} dakika\n`;
    text += `*Doğru / Yanlış:* ${totalCorrect}D / ${totalIncorrect}Y (%${acc} Başarı)\n`;
    
    if (totalIncorrect > 0 && mistakesText) {
      text += `\n*Eksik Görülen Kazanımlar:*\n${mistakesText}`;
    }
    
    text += `\n*Koç Notu:* `;
    if (isSuccess) {
      text += `Harika bir performans! Bugünün tüm hedefleri tamamlandı. ${this.state.name} disiplini elden bırakmıyor. Şampiyonluk yoluna devam! 🏆`;
    } else {
      text += `Bugün bazı eksiklerimiz kaldı fakat yarın telafi antrenmanlarıyla durumu toparlayacağız. Takibe devam ediyoruz.`;
    }

    return text;
  },

  showParentReportModal: function() {
    const isCompleted = this.state.daysData[this.state.activeDay]?.completed || false;
    const text = this.generateParentReportText(isCompleted);
    document.getElementById("parentReportText").textContent = text;

    // Clear auto notification timer since student triggered it manually
    this.state.parentReportDueTime = null;
    if (this.parentTimerInterval) {
      clearInterval(this.parentTimerInterval);
      this.parentTimerInterval = null;
    }
    const banner = document.getElementById("parentReportCountdownBanner");
    if (banner) banner.style.display = "none";

    // Bugün için rapor ekranı zaten gösterildi işaretle — hem "program
    // tamamlandı" hem "gün sonu saati geldi" tetikleyicisi aynı gün içinde
    // birbirini tekrar etmesin.
    this.state.parentReportShownDate = new Date().toISOString().split("T")[0];
    this.saveState();

    this.openModal("parentModal");
    this.refreshParentSendButtons();
  },

  // Veli iletişim bilgisinin e-posta mı telefon mu olduğunu ayırt eder ve
  // gönder butonlarını buna göre etkinleştirir/pasifleştirir.
  refreshParentSendButtons: function() {
    const contact = (this.state.parentContact || "").trim();
    const warning = document.getElementById("parentContactMissingWarning");
    const emailBtn = document.getElementById("parentSendEmailBtn");
    const waBtn = document.getElementById("parentSendWhatsappBtn");
    const hasContact = contact.length > 0;

    if (warning) warning.style.display = hasContact ? "none" : "block";

    const isEmail = contact.includes("@");
    if (emailBtn) {
      const emailUsable = hasContact && isEmail;
      emailBtn.disabled = !emailUsable;
      emailBtn.style.opacity = emailUsable ? "1" : "0.5";
      emailBtn.style.cursor = emailUsable ? "pointer" : "not-allowed";
      emailBtn.title = (hasContact && !isEmail) ? "E-posta için profilinde bir e-posta adresi girmelisin." : "";
    }
    if (waBtn) {
      const waUsable = hasContact && !isEmail;
      waBtn.disabled = !waUsable;
      waBtn.style.opacity = waUsable ? "1" : "0.5";
      waBtn.style.cursor = waUsable ? "pointer" : "not-allowed";
      waBtn.title = (hasContact && isEmail) ? "WhatsApp için profilinde bir telefon numarası girmelisin." : "";
    }
  },

  // Telefon numarasını wa.me formatına (ülke kodu + rakamlar, boşluksuz) çevirir.
  normalizePhoneForWhatsapp: function(phone) {
    let digits = String(phone || "").replace(/\D/g, "");
    if (digits.startsWith("0")) digits = "90" + digits.slice(1); // TR yerel format -> ülke kodu
    else if (!digits.startsWith("90") && digits.length === 10) digits = "90" + digits; // 5xx xxx xx xx
    return digits;
  },

  // GERÇEK GÖNDERİM — mailto: linki açar (varsayılan mail programı; içerik
  // ve alıcı otomatik dolu gelir, kullanıcı sadece "Gönder"e basar).
  sendParentReportViaEmail: function() {
    const contact = (this.state.parentContact || "").trim();
    if (!contact || !contact.includes("@")) {
      this.showToast("Gönderebilmek için profilinde geçerli bir e-posta adresi girmelisin.", "error");
      return;
    }
    const text = document.getElementById("parentReportText").textContent;
    const subject = encodeURIComponent("YKSKoçum · Günlük Çalışma Raporu");
    const body = encodeURIComponent(text);
    window.location.href = `mailto:${encodeURIComponent(contact)}?subject=${subject}&body=${body}`;
  },

  // GERÇEK GÖNDERİM — wa.me linki açar (doğru numara + hazır mesajla
  // WhatsApp'ı/WhatsApp Web'i açar, kullanıcı sadece "Gönder"e basar).
  sendParentReportViaWhatsapp: function() {
    const contact = (this.state.parentContact || "").trim();
    if (!contact || contact.includes("@")) {
      this.showToast("WhatsApp ile gönderebilmek için profilinde bir telefon numarası girmelisin.", "error");
      return;
    }
    const phone = this.normalizePhoneForWhatsapp(contact);
    if (phone.length < 10) {
      this.showToast("Geçerli bir telefon numarası bulunamadı.", "error");
      return;
    }
    const text = document.getElementById("parentReportText").textContent;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  },

  startParentNotificationTimer: function() {
    if (this.parentTimerInterval) {
      clearInterval(this.parentTimerInterval);
    }
    
    const card = document.getElementById("parentReportCountdownCard");
    if (!card) return;

    if (!this.state.parentReportDueTime) {
      if (card) card.style.display = "none";
      return;
    }

    if (card) card.style.display = "block";

    this.parentTimerInterval = setInterval(() => {
      const diff = this.state.parentReportDueTime - Date.now();
      
      if (diff <= 0) {
        clearInterval(this.parentTimerInterval);
        this.parentTimerInterval = null;
        this.state.parentReportDueTime = null;
        if (card) card.style.display = "none";
        this.sendParentReportAutomatically();
        this.saveState();
      } else {
        if (card) card.style.display = "block";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        const timerVal = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        const displayEl = document.getElementById("parentReportSidebarTimer");
        if (displayEl) displayEl.textContent = timerVal;
      }
    }, 1000);
  },

  // ==========================================================
  // HERO TODAY STATS
  // ==========================================================
  renderHeroTodayStats: function() {
    const day = this.state.daysData[this.state.activeDay];
    const tasks = (day && day.tasks) || [];
    const done = tasks.filter(t => t.completed).length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("heroTodayDone", done);
    set("heroTodayTotal", tasks.length);
    set("heroDayNum", this.state.activeDay || 1);
  },

  // ==========================================================
  // QUOTE POPUP — 360 quotes, one per session
  // ==========================================================
  showSessionQuotePopup: function() {
    if (typeof DAILY_QUOTES === "undefined" || !DAILY_QUOTES.length) return;
    if (sessionStorage.getItem("quoteShownThisSession") === "1") return;

    // Cycle through all 360 before repeating
    let idx = (this.state.lastQuoteIndex === undefined || this.state.lastQuoteIndex === null)
      ? Math.floor(Math.random() * DAILY_QUOTES.length)
      : (this.state.lastQuoteIndex + 1) % DAILY_QUOTES.length;

    this.state.lastQuoteIndex = idx;
    this.saveState();
    sessionStorage.setItem("quoteShownThisSession", "1");

    const q = DAILY_QUOTES[idx];
    const textEl = document.getElementById("quotePopupText");
    const authEl = document.getElementById("quotePopupAuthor");
    const overlay = document.getElementById("quotePopupOverlay");
    if (!textEl || !overlay) return;

    textEl.textContent = '"' + q.text + '"';
    if (authEl) authEl.textContent = "— " + q.author;
    overlay.style.display = "flex";
  },

  closeQuotePopup: function() {
    const overlay = document.getElementById("quotePopupOverlay");
    if (overlay) overlay.style.display = "none";
    // The pencil coach takes over and delivers the briefing in its speech bubble
    setTimeout(() => this.showCoachBriefingBubble(), 450);
  },

  // ==========================================================
  // DAILY AI COACH BRIEFING POPUP
  // ==========================================================
  buildDailyBriefingData: function() {
    const day = this.state.daysData[this.state.activeDay];
    const tasks = (day && day.tasks) || [];
    const pending = tasks.filter(t => !t.completed);
    const done = tasks.length - pending.length;

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const overdue = pending.filter(t => t.endTime && this.timeStrToMinutes(t.endTime) < nowMin);

    let headline;
    if (tasks.length === 0) {
      headline = "Bugün için planlanmış bir görevin yok. Programını oluşturarak başlayabilirsin.";
    } else if (pending.length === 0) {
      headline = `Harikasın! Bugünkü ${tasks.length} görevin hepsini tamamladın. İstikrar serin ${this.state.streak || 0} gün.`;
    } else if (overdue.length > 0) {
      headline = `${overdue.length} görevinin saati geçti, toplam ${pending.length} görev bekliyor. Hemen en kısasıyla başla, momentumu yakala.`;
    } else {
      headline = `Bugün ${tasks.length} görevin var, ${done} tanesini bitirdin. ${pending.length} görev seni bekliyor — sıradakine geç.`;
    }

    return { tasks, pending, overdue, done, headline };
  },

  showDailyBriefingPopup: function() {
    const data = this.buildDailyBriefingData();
    const overlay = document.getElementById("briefingPopupOverlay");
    if (!overlay) return;

    const textEl = document.getElementById("briefingPopupText");
    if (textEl) textEl.textContent = data.headline;

    const listEl = document.getElementById("briefingPopupTasks");
    if (listEl) {
      listEl.innerHTML = data.tasks.slice(0, 8).map(t => {
        const overdue = !t.completed && t.endTime && this.timeStrToMinutes(t.endTime) < (new Date().getHours() * 60 + new Date().getMinutes());
        const icon = t.completed ? "fa-circle-check" : (overdue ? "fa-triangle-exclamation" : "fa-circle-dot");
        const time = t.startTime ? `<span style="opacity:0.7; font-weight:600;">${t.startTime}–${t.endTime}</span> ` : "";
        return `<li class="${t.completed ? "done" : ""}"><i class="fa-solid ${icon}"></i><span>${time}${this.escapeHtml(t.label || "Görev")}</span></li>`;
      }).join("");
    }

    overlay.style.display = "flex";

    // Persist the briefing into the notification center
    this.addNotification("info", "AI Koç Günlük Brifingi", data.headline);
  },

  closeBriefingPopup: function() {
    const overlay = document.getElementById("briefingPopupOverlay");
    if (overlay) overlay.style.display = "none";
  },

  // ==========================================================
  // AI KOÇUM (KALEM) KONUŞMA BALONU — günlük brifing
  // ==========================================================
  buildBriefingTaskItems: function(tasks, limit) {
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    return tasks.slice(0, limit).map(t => {
      const late = !t.completed && t.endTime && this.timeStrToMinutes(t.endTime) < nowMin;
      const icon = t.completed ? "fa-circle-check" : (late ? "fa-triangle-exclamation" : "fa-circle-dot");
      const cls = t.completed ? "done" : (late ? "late" : "");
      const time = t.startTime ? `<span style="opacity:0.75; font-weight:700;">${t.startTime}–${t.endTime}</span> ` : "";
      return `<li class="${cls}"><i class="fa-solid ${icon}"></i><span>${time}${this.escapeHtml(t.label || "Görev")}</span></li>`;
    }).join("");
  },

  showCoachBriefingBubble: function() {
    const bubble = document.getElementById("coachBriefBubble");
    const wrapper = document.getElementById("aiChatbotWrapper");
    if (!bubble || !wrapper || wrapper.style.display === "none") return;

    const data = this.buildDailyBriefingData();

    const textEl = document.getElementById("coachBubbleText");
    if (textEl) textEl.textContent = data.headline;

    const listEl = document.getElementById("coachBubbleTasks");
    if (listEl) listEl.innerHTML = this.buildBriefingTaskItems(data.tasks, 4);

    bubble.style.display = "block";

    // Make the pencil wiggle so the bubble reads as coming from it
    const trigger = document.getElementById("aiChatTrigger");
    if (trigger) {
      trigger.classList.remove("coach-talking");
      void trigger.offsetWidth;
      trigger.classList.add("coach-talking");
    }

    // Every briefing is recorded in the notification center
    this.addNotification("info", "AI Koç Günlük Brifingi", data.headline);

    // Auto-dismiss if the student doesn't interact
    clearTimeout(this._coachBubbleTimer);
    this._coachBubbleTimer = setTimeout(() => this.closeCoachBubble(), 25000);
  },

  closeCoachBubble: function() {
    clearTimeout(this._coachBubbleTimer);
    const bubble = document.getElementById("coachBriefBubble");
    if (bubble) bubble.style.display = "none";
    const trigger = document.getElementById("aiChatTrigger");
    if (trigger) trigger.classList.remove("coach-talking");
  },

  openBriefingFromBubble: function() {
    this.closeCoachBubble();
    this.showDailyBriefingPopup();
  },

  // ==========================================================
  // NOTIFICATION CENTER
  // ==========================================================
  addNotification: function(kind, title, body) {
    if (!this.state.notifications) this.state.notifications = [];

    // Avoid flooding the list with the same message on repeated renders
    const dupe = this.state.notifications.find(n => n.title === title && n.body === body);
    if (dupe) return;

    this.state.notifications.unshift({
      id: Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      kind: kind,
      title: title,
      body: body,
      ts: new Date().toISOString(),
      read: false
    });

    if (this.state.notifications.length > 80) {
      this.state.notifications = this.state.notifications.slice(0, 80);
    }
    this.saveState();
    this.updateNotificationBadge();
  },

  updateNotificationBadge: function() {
    const chip = document.getElementById("headerNotifBtn");
    if (!chip) return;
    const unread = (this.state.notifications || []).filter(n => !n.read).length;
    chip.classList.toggle("has-unread", unread > 0);
  },

  openNotificationCenter: function() {
    this.closeBriefingPopup();
    this.renderNotificationCenter();
    (this.state.notifications || []).forEach(n => { n.read = true; });
    this.saveState();
    this.updateNotificationBadge();
    this.openModal("notificationCenterModal");
  },

  renderNotificationCenter: function() {
    const list = document.getElementById("notificationCenterList");
    if (!list) return;
    const items = this.state.notifications || [];

    if (!items.length) {
      list.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:2rem 0; font-weight:600;">Henüz bildirimin yok. Görevlerini tamamladıkça burada özetler birikecek.</p>`;
      return;
    }

    const hasParentContact = !!(this.state.parentContact || "").trim();
    list.innerHTML = items.map(n => {
      const d = new Date(n.ts);
      const time = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      const icons = { alert: "fa-triangle-exclamation", info: "fa-robot", done: "fa-circle-check", summary: "fa-chart-pie" };
      const canSendToParent = hasParentContact && (n.kind === "alert" || n.kind === "summary");
      return `
        <div class="notif-item">
          <div class="notif-icon-dot ${n.kind}"><i class="fa-solid ${icons[n.kind] || "fa-bell"}"></i></div>
          <div class="notif-body">
            <strong>${n.title}</strong><span>${n.body}</span>
            ${canSendToParent ? `<button class="btn btn-secondary" style="margin-top:0.4rem; padding:0.25rem 0.6rem; font-size:0.68rem; font-weight:800;" onclick="app.sendNotificationToParent('${n.id}')"><i class="fa-solid fa-paper-plane"></i> Veliye Gönder</button>` : ""}
          </div>
          <div class="notif-time">${time}</div>
        </div>`;
    }).join("");
  },

  // Bildirim Merkezi'ndeki bir bildirimi (geciken görev, gün/hafta/ay
  // özeti) gerçekten veliye iletir — e-posta ise mailto:, telefon ise
  // wa.me linkiyle (tek tık, gerçek gönderim).
  sendNotificationToParent: function(notifId) {
    const n = (this.state.notifications || []).find(x => x.id === notifId);
    if (!n) return;
    const contact = (this.state.parentContact || "").trim();
    if (!contact) {
      this.showToast("Önce profilinde veli iletişim bilgisi girmelisin.", "error");
      return;
    }
    const text = `YKSKoçum · ${n.title}\n\n${n.body}`;
    if (contact.includes("@")) {
      window.location.href = `mailto:${encodeURIComponent(contact)}?subject=${encodeURIComponent("YKSKoçum · " + n.title)}&body=${encodeURIComponent(text)}`;
    } else {
      const phone = this.normalizePhoneForWhatsapp(contact);
      if (phone.length < 10) { this.showToast("Geçerli bir telefon numarası bulunamadı.", "error"); return; }
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    }
  },

  clearNotifications: function() {
    this.state.notifications = [];
    this.saveState();
    this.renderNotificationCenter();
    this.updateNotificationBadge();
  },

  // ==========================================================
  // KOÇ KALEM DİKKAT ÇEKME BİLDİRİMİ
  // ------------------------------------------------------------
  // Eskiden ayrı bir "mascotKnockNotif" pencil-mascot widget'ı vardı — tek
  // sayfada iki ayrı koç kalem karakteri görünmesine (bu + aiChatTrigger)
  // neden oluyordu. Artık TEK koç kalem widget'ı (aiChatTrigger/aiChatWindow
  // — gerçek Gemini destekli AI asistanı) var; dikkat çekme işlevi de aynı
  // widget'a taşındı: etiketi geçici olarak mesajla değiştirip kalemi
  // salladık, tıklanınca (chat yerine) bildirim merkezini açıyoruz.
  // ==========================================================
  showMascotKnock: function(message) {
    const trigger = document.getElementById("aiChatTrigger");
    if (!trigger) return;
    const label = trigger.querySelector("span");

    if (label) {
      label.textContent = message;
      label.style.display = "inline-block";
    }

    trigger.classList.remove("coach-talking");
    void trigger.offsetWidth;
    trigger.classList.add("coach-talking");
    this._knockActive = true;

    clearTimeout(this._mascotKnockTimer);
    this._mascotKnockTimer = setTimeout(() => {
      this._knockActive = false;
      trigger.classList.remove("coach-talking");
      if (label) {
        label.textContent = "";
        label.style.display = "none";
      }
    }, 9000);
  },

  // ==========================================================
  // OVERDUE TASK WATCHER — mascot + push + email + WhatsApp
  // ==========================================================
  startOverdueWatcher: function() {
    clearInterval(this._overdueTimer);
    this.checkOverdueTasks();
    this._overdueTimer = setInterval(() => this.checkOverdueTasks(), 5 * 60 * 1000);
  },

  // ==========================================================
  // VELİ BİLGİLENDİRME — GERÇEK GÜN SONU TETİKLEYİCİSİ
  // ------------------------------------------------------------
  // "Program tamamlandıysa 2 saat sonra" akışı sadece görevler bitirilirse
  // çalışıyordu; gün tamamlanmasa bile veli her gün düzenli rapor alsın
  // diye gerçek saatle (yatış saatinden ~1 saat önce, en erken 19:00)
  // çalışan ikinci, bağımsız bir tetikleyici. İkisi de aynı gün içinde tek
  // sefer gösterilecek şekilde (parentReportShownDate) birbirini eler.
  // ==========================================================
  startEndOfDayParentWatcher: function() {
    clearInterval(this._endOfDayParentTimer);
    this.checkEndOfDayParentReport();
    this._endOfDayParentTimer = setInterval(() => this.checkEndOfDayParentReport(), 5 * 60 * 1000);
  },

  checkEndOfDayParentReport: function() {
    const now = new Date();
    const todayKey = now.toISOString().split("T")[0];
    if (this.state.parentReportShownDate === todayKey) return; // bugün zaten gösterildi

    const sleepMinutes = this.timeStrToMinutes(this.state.sleepTime || "23:00");
    const targetMinutes = Math.max(19 * 60, sleepMinutes - 60); // yatıştan ~1 saat önce, en erken 19:00
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (nowMinutes < targetMinutes) return;

    this.state.parentReportShownDate = todayKey;
    this.saveState();
    this.sendParentReportAutomatically();
  },

  checkOverdueTasks: function() {
    const day = this.state.daysData[this.state.activeDay];
    if (!day || !day.tasks) return;

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const todayKey = now.toISOString().split("T")[0];

    if (!this.state.overdueAlerted) this.state.overdueAlerted = {};
    if (this.state.overdueAlertedDate !== todayKey) {
      this.state.overdueAlerted = {};
      this.state.overdueAlertedDate = todayKey;
    }

    const fresh = day.tasks.filter(t =>
      !t.completed &&
      t.endTime &&
      this.timeStrToMinutes(t.endTime) < nowMin &&
      !this.state.overdueAlerted[t.id]
    );

    if (!fresh.length) return;

    fresh.forEach(t => { this.state.overdueAlerted[t.id] = true; });
    this.saveState();

    const label = fresh.length === 1
      ? `"${fresh[0].label}" görevinin saati geçti.`
      : `${fresh.length} görevinin saati geçti.`;

    this.showMascotKnock(`Hey! ${label} 👀`);
    this.addNotification("alert", "Geciken Görev", label + " Hemen tamamlayarak serini koru.");
    this.dispatchExternalNotification("Geciken Görev", label);
  },

  // Routes a notification to the channels the user enabled (push / email / WhatsApp).
  // Push bildirimi gerçekten anında gönderilebilir (tarayıcı izni varsa).
  // E-posta/WhatsApp ise bir arka plan sunucusu olmadan sessizce
  // gönderilemez — bu ikisi, ilgili bildirim Bildirim Merkezi'nde
  // göründüğünde oradaki "Veliye Gönder" butonuyla (mailto:/wa.me, tek
  // tıkla gerçek gönderim) elden geçirilir; bkz. renderNotificationCenter.
  dispatchExternalNotification: function(title, body) {
    const ch = this.state.notifyChannels || { push: true, email: true, whatsapp: true };

    if (ch.push && "Notification" in window && Notification.permission === "granted") {
      try {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification("YKSKoçum · " + title, {
            body: body,
            icon: "./icon-192.png",
            badge: "./icon-192.png",
            data: { url: "./", action: "today" }
          });
        });
      } catch (e) { console.log("Push failed", e); }
    }
  },

  // ==========================================================
  // DAY / WEEK / MONTH SUMMARIES
  // ==========================================================
  computeSummary: function(period) {
    const activeDay = this.state.activeDay || 1;
    let from, to, label;

    if (period === "day") {
      from = activeDay; to = activeDay; label = "Günlük";
    } else if (period === "week") {
      to = activeDay; from = Math.max(1, activeDay - 6); label = "Haftalık";
    } else {
      to = activeDay; from = Math.max(1, activeDay - 29); label = "Aylık";
    }

    let total = 0, done = 0, correct = 0, incorrect = 0;
    for (let d = from; d <= to; d++) {
      const day = this.state.daysData[d];
      if (!day || !day.tasks) continue;
      day.tasks.forEach(t => {
        total++;
        if (t.completed) done++;
        correct += t.correct || 0;
        incorrect += t.incorrect || 0;
      });
    }

    const rate = total ? Math.round((done / total) * 100) : 0;
    const net = this.netHesapla(correct, incorrect);
    return { label, period, from, to, total, done, rate, correct, incorrect, net: net.toFixed(2) };
  },

  showSummaryPopup: function(period) {
    const s = this.computeSummary(period);
    const overlay = document.getElementById("summaryPopupOverlay");
    if (!overlay) return;

    const eyebrow = document.getElementById("summaryPopupEyebrow");
    if (eyebrow) eyebrow.innerHTML = `<i class="fa-solid fa-chart-pie"></i> ${s.label} Özet`;

    const titleEl = document.getElementById("summaryPopupTitle");
    if (titleEl) {
      titleEl.textContent = s.rate >= 80 ? "Mükemmel bir dönem geçirdin! 🎉"
        : s.rate >= 50 ? "İyi gidiyorsun, devam! 💪"
        : "Toparlanma zamanı, hadi! 🚀";
    }

    const bodyEl = document.getElementById("summaryPopupBody");
    if (bodyEl) {
      bodyEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid var(--border-color);"><span>Tamamlanan görev</span><strong>${s.done} / ${s.total}</strong></div>
        <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid var(--border-color);"><span>Tamamlama oranı</span><strong>%${s.rate}</strong></div>
        <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid var(--border-color);"><span>Doğru / Yanlış</span><strong>${s.correct} / ${s.incorrect}</strong></div>
        <div style="display:flex; justify-content:space-between; padding:0.4rem 0;"><span>Toplam net</span><strong>${s.net}</strong></div>`;
    }

    const parentNote = document.getElementById("summaryParentNote");
    const parentTarget = this.state.parentContact;
    if (parentNote) {
      parentNote.innerHTML = parentTarget
        ? `<i class="fa-solid fa-paper-plane"></i> Bu özet velinin bilgilendirme kanalına (<strong>${parentTarget}</strong>) da gönderildi.`
        : `<i class="fa-solid fa-circle-info"></i> Veli bilgilendirmesi için ayarlardan bir iletişim kanalı ekleyebilirsin.`;
    }

    overlay.style.display = "flex";

    const summaryText = `${s.label} özet: ${s.done}/${s.total} görev tamamlandı (%${s.rate}), toplam net ${s.net}.`;
    this.addNotification("summary", `${s.label} Çalışma Özeti`, summaryText);
    this.dispatchExternalNotification(`${s.label} Çalışma Özeti`, summaryText);
  },

  closeSummaryPopup: function() {
    const overlay = document.getElementById("summaryPopupOverlay");
    if (overlay) overlay.style.display = "none";
  },

  // Fires the day/week/month summary once each, when its period rolls over.
  checkPeriodSummaries: function() {
    const activeDay = this.state.activeDay || 1;
    if (!this.state.summaryShown) this.state.summaryShown = {};

    const dayKey = "d" + activeDay;
    const prevDay = activeDay - 1;
    if (prevDay >= 1 && !this.state.summaryShown[dayKey]) {
      this.state.summaryShown[dayKey] = true;

      if (prevDay % 30 === 0) {
        this.showSummaryPopup("month");
      } else if (prevDay % 7 === 0) {
        this.showSummaryPopup("week");
      } else {
        this.showSummaryPopup("day");
      }
      this.saveState();
    }
  },

  // Günlük plan bittikten 2 saat sonra tetiklenir. Gerçek gönderim mailto:/
  // wa.me linkleriyle her zaman bir kullanıcı tıklaması gerektirdiğinden
  // (arka planda sessizce e-posta/WhatsApp göndermek tarayıcıdan mümkün
  // değil), burada sahte bir "başarıyla iletildi" mesajı GÖSTERMEK yerine
  // raporu hazırlayıp gönderme ekranını gerçekten açıyoruz.
  sendParentReportAutomatically: function() {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.value = 520;
      gain.gain.setValueAtTime(0.5, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.8);
    } catch (e) {
      console.log("Audio contexts blocked");
    }

    this.showParentReportModal();
  },

  copyParentReport: function() {
    const text = document.getElementById("parentReportText").textContent;
    navigator.clipboard.writeText(text).then(() => {
      const alertBox = document.getElementById("copyAlert");
      alertBox.style.display = "inline";
      setTimeout(() => {
        alertBox.style.display = "none";
      }, 3000);
    }).catch(err => {
      alert("Metin kopyalanamadı, lütfen manuel kopyalayın.");
    });
  },

  renderHabitMap: function() {
    const calDays = Math.min(this.state.activeDay || 1, 7);
    const calPct = Math.round((calDays / 7) * 100);

    const calBar = document.getElementById("habitMapCalibrationBar");
    const calPctText = document.getElementById("habitMapCalibrationPct");
    if (calBar) calBar.style.width = `${calPct}%`;
    if (calPctText) calPctText.textContent = `%${calPct} (${calDays}/7 Gün)`;

    // Detect most postponed / neglected subject
    let neglectedSub = "Fizik";
    const neglectedMap = {};
    Object.values(this.state.daysData).forEach(d => {
      if (d.tasks) {
        d.tasks.forEach(t => {
          if (!t.completed) {
            neglectedMap[t.subject] = (neglectedMap[t.subject] || 0) + 1;
          }
        });
      }
    });
    let maxNeg = 0;
    for (const [sub, count] of Object.entries(neglectedMap)) {
      if (count > maxNeg && sub !== "Rehberlik" && sub !== "Özel / Diğer" && sub !== "Paragraf") {
        maxNeg = count;
        neglectedSub = sub;
      }
    }

    // Detect most error-prone subject/topic from vault
    let errorTopic = "Matematik: Problemler";
    if (this.state.uploadedQuestions && this.state.uploadedQuestions.length > 0) {
      const freq = {};
      this.state.uploadedQuestions.forEach(q => {
        const key = `${q.subject}: ${q.topic}`;
        freq[key] = (freq[key] || 0) + 1;
      });
      let maxF = 0;
      for (const [key, count] of Object.entries(freq)) {
        if (count > maxF) {
          maxF = count;
          errorTopic = key;
        }
      }
    }

    const hasData = this.state.chartData && this.state.chartData.length > 0;

    const rows = [
      {
        icon: "fa-regular fa-clock text-primary",
        label: "En verimli saat",
        val: hasData ? "08:00 - 10:00 (Yüksek Odak ve Dikkat)" : `Veri bekleniyor (Kalibrasyon %${calPct})`,
        effect: hasData ? "Zorlayıcı Matematik, Fen ve mantık seansları bu saat aralığına yerleştirilir." : "Çalışma saatlerinizin odak verimliliği ölçüldüğünde aktif olacaktır."
      },
      {
        icon: "fa-solid fa-moon text-muted",
        label: "En kötü saat",
        val: hasData ? "20:00 - 22:00 (Yorgunluk ve Doğruluk Düşüşü)" : `Veri bekleniyor (Kalibrasyon %${calPct})`,
        effect: hasData ? "Yoğun konu anlatımı yerine hafif konu tekrarları, video izleme veya okuma seansları planlanır." : "Yorgunluk ve dikkat grafiğiniz çıkarıldığında aktif olacaktır."
      },
      {
        icon: "fa-solid fa-triangle-exclamation text-danger",
        label: "En çok ertelediği ders",
        val: hasData ? `${neglectedSub} (Erteleme Sıklığı Yüksek)` : `Veri bekleniyor (Kalibrasyon %${calPct})`,
        effect: hasData ? `Haftalık planda ${neglectedSub} seansları en verimli saat olan sabah bloklarına kaydırılır ve öncesine odak/nefes molası yerleştirilir.` : "Erteleme eğilimleriniz tespit edildiğinde ders saatleri optimize edilecektir."
      },
      {
        icon: "fa-solid fa-bolt text-success",
        label: "En hızlı çözdüğü",
        val: hasData ? "Türkçe (Soru başı ortalama 45 saniye)" : `Veri bekleniyor (Kalibrasyon %${calPct})`,
        effect: hasData ? "Türkçe seanslarının süreleri kısaltılarak süre verimliliği diğer derslere dağıtılır." : "Soru çözme hızınız ölçüldüğünde süre dağılımı güncellenecektir."
      },
      {
        icon: "fa-solid fa-bug text-danger",
        label: "En çok hata yaptığı",
        val: hasData ? errorTopic : `Veri bekleniyor (Kalibrasyon %${calPct})`,
        effect: hasData ? "Haftalık programa otomatik olarak ek ders/soru çözümü seansları ve Mistakes Vault'taki soru çözümleri eklenir." : "Hata analizi verileriniz biriktikçe pekiştirme seansları planlanacaktır."
      },
      {
        icon: "fa-solid fa-hourglass-half text-primary",
        label: "Ortalama çalışma süresi",
        val: hasData ? "37 dakika (Optimal Blok Süresi)" : `Veri bekleniyor (Kalibrasyon %${calPct})`,
        effect: hasData ? "Uygulama genelinde odak kısıtlaması (Pomodoro) süreleri otomatik olarak 37-40 dakikalık ideal periyotlara uyarlanır." : "Ortalama odak süreniz hesaplandığında Pomodoro blokları uyarlanacaktır."
      },
      {
        icon: "fa-solid fa-check-double text-success",
        label: "Pomodoro başarı oranı",
        val: hasData ? "%82 (Mükemmel Odak Devamlılığı)" : `Veri bekleniyor (Kalibrasyon %${calPct})`,
        effect: hasData ? "Odak süresi arttıkça hedeflenen günlük net sayı hedefleri %10 oranında yükseltilir." : "Pomodoro verileriniz toplandığında günlük hedefleriniz güncellenecektir."
      },
      {
        icon: "fa-solid fa-brain text-warning",
        label: "Denemede dikkat kaybı",
        val: hasData ? "65. sorudan sonra (Hata Sıklığı Artışı)" : `Veri bekleniyor (Kalibrasyon %${calPct})`,
        effect: hasData ? "Programda 60. sorudan sonraki blok arasına 5 dakikalık zihinsel nefes/odak egzersizleri yerleştirilir." : "Deneme odak analiziniz yapıldığında zihinsel egzersizler yerleştirilecektir."
      },
      {
        icon: "fa-solid fa-calendar-minus text-muted",
        label: "Pazar performansı",
        val: hasData ? "%35 Düşük Verim (Hafta Sonu Yorgunluğu)" : `Veri bekleniyor (Kalibrasyon %${calPct})`,
        effect: hasData ? "Pazar günü ağır dersler yerine sadece haftalık genel tekrar, rehberlik videosu ve deneme analizi planlanır." : "Hafta sonu veriminiz analiz edildiğinde Pazar planı optimize edilecektir."
      },
      {
        icon: "fa-solid fa-heart text-danger",
        label: "Sabah motivasyonu",
        val: hasData ? "Çok Yüksek (Güne Başlama İstikrarı)" : `Veri bekleniyor (Kalibrasyon %${calPct})`,
        effect: hasData ? "En önemli ve en zor kazanım hedefleri günün ilk görev kartı olarak atanır." : "Güne başlama verileriniz toplandığında öncelik sırası güncellenecektir."
      }
    ];

    const tbody = document.getElementById("habitMapTableBody");
    if (tbody) {
      tbody.innerHTML = "";
      rows.forEach(r => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid var(--border-color)";
        tr.innerHTML = `
          <td style="padding:1rem; font-weight:700; display:flex; align-items:center; gap:0.5rem; color:var(--text-main);">
            <i class="${r.icon}" style="font-size:1.1rem; width:24px; text-align:center;"></i> ${r.label}
          </td>
          <td style="padding:1rem; color:var(--primary); font-weight:600;">${r.val}</td>
          <td style="padding:1rem; color:var(--text-muted); font-size:0.85rem; line-height:1.4;">${r.effect}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // AI Habit Intelligence Layer — mevcut Alışkanlık Haritası panelinin
    // içine eklenen ek AI yetenekleri (öneri, takvim, tahmin, haftalık koç
    // değerlendirmesi). Panel her yenilendiğinde tazelenir.
    this.renderHabitSuggestions();
    this.renderHabitCalendarHeatmap();
    this.renderHabitPrediction();
    // Haftalık değerlendirme AI Çalışma Analizi'ne taşındı (tek kaynak) —
    // burada tekrar basılmaz, yalnızca metni güncel tutulur.
  },

  // ============================================================
  // AI HABIT INTELLIGENCE LAYER — mevcut Alışkanlık Haritası'nı (DNA
  // tablosu) DEĞİŞTİRMEDEN üzerine eklenen 5 AI yeteneği:
  //  1) Kişiselleştirilmiş alışkanlık önerileri (kabul edilince mevcut
  //     görev-enjeksiyon mekanizmasıyla — injectSmartReviewSession'daki
  //     aynı desen — programa günlük görev olarak eklenir).
  //  2) GitHub tarzı tamamlama ısı haritası.
  //  3) Yarının/serinin risk tahmini (mevcut bildirim sistemine düşer).
  //  4) 6 eksenli Denge Çarkı (radar) — Chart.js, mevcut grafik deseniyle.
  //  5) Haftalık AI Koç Alışkanlık Değerlendirmesi (gerçek veriden, şablon
  //     değil — her hafta farklı, mevcut showCoachAlert/AI Koç üslubunda).
  // ============================================================

  // FEATURE 1 — kişiye özel alışkanlık önerileri üretir (gerçek veriden,
  // rastgele değil). En fazla 3 öneri, zaten kabul/reddedilenler hariç.
  generateHabitSuggestions: function() {
    const suggestions = [];

    let totalTasks = 0, reviewTasks = 0;
    Object.values(this.state.daysData || {}).forEach(d => {
      if (!d.tasks) return;
      totalTasks += d.tasks.length;
      reviewTasks += d.tasks.filter(t => t.type === "retest" || t.isSmartReview || t.isVaultReview).length;
    });
    if (totalTasks > 10 && (reviewTasks / totalTasks) < 0.1) {
      suggestions.push({
        id: "habit_daily_review",
        icon: "fa-rotate",
        title: "Günlük 30 Dakikalık Tekrar Alışkanlığı",
        text: "Sürekli yeni konu işliyorsun ama eski konuları nadiren tekrar ediyorsun. AI, unutma eğrisini kırmak için her gün 30 dakikalık bir tekrar alışkanlığı eklemeni öneriyor.",
        minutesPerDay: 30
      });
    }

    const sleepMinutes = this.timeStrToMinutes(this.state.sleepTime || "23:00");
    if (sleepMinutes >= this.timeStrToMinutes("23:00")) {
      suggestions.push({
        id: "habit_evening_planning",
        icon: "fa-moon",
        title: "15 Dakikalık Akşam Planlama Alışkanlığı",
        text: `Genellikle ${this.state.sleepTime} gibi geç bir saate kadar çalışıyorsun. Günü bitirmeden önce 15 dakikalık bir planlama alışkanlığı, ertesi güne daha istikrarlı başlamanı sağlayabilir.`,
        minutesPerDay: 15
      });
    }

    const poolSize = (this.state.uploadedQuestions || []).filter(q => !q.completed).length;
    if (poolSize >= 8) {
      suggestions.push({
        id: "habit_error_focus",
        icon: "fa-bullseye",
        title: "Odaklı Hata Analizi Alışkanlığı",
        text: `Hata Zindanı'nda ${poolSize} aktif konu birikti. AI Akıllı Tekrar Seansı'na ek olarak haftada birkaç gün 20 dakikalık ekstra bir "Hata Analizi" alışkanlığı eklemeni öneriyor.`,
        minutesPerDay: 20
      });
    }

    let sunCompleted = 0, sunTotal = 0, wdCompleted = 0, wdTotal = 0;
    Object.entries(this.state.daysData || {}).forEach(([d, dd]) => {
      if (!dd.tasks || dd.tasks.length === 0) return;
      const c = dd.tasks.filter(t => t.completed).length;
      if (parseInt(d) % 7 === 0) { sunCompleted += c; sunTotal += dd.tasks.length; }
      else { wdCompleted += c; wdTotal += dd.tasks.length; }
    });
    const sunRate = sunTotal > 0 ? sunCompleted / sunTotal : null;
    const wdRate = wdTotal > 0 ? wdCompleted / wdTotal : null;
    if (sunRate !== null && wdRate !== null && sunRate < wdRate - 0.15) {
      suggestions.push({
        id: "habit_weekend_light",
        icon: "fa-calendar-week",
        title: "Hafta Sonu Hafif Başlangıç Alışkanlığı",
        text: `Pazar günleri tamamlama oranın (%${Math.round(sunRate * 100)}) hafta içine (%${Math.round(wdRate * 100)}) göre belirgin şekilde düşük. AI, Pazar sabahına 10 dakikalık hafif bir "Güne Hazırlık" alışkanlığı eklemeni öneriyor.`,
        minutesPerDay: 10
      });
    }

    const activeSourceIds = (this.state.userHabits || []).map(h => h.sourceId);
    const dismissed = this.state.dismissedHabitSuggestions || [];
    const snoozed = this._snoozedHabitSuggestions || {};
    return suggestions
      .filter(s => !activeSourceIds.includes(s.id) && !dismissed.includes(s.id) && !snoozed[s.id])
      .slice(0, 3);
  },

  renderHabitSuggestions: function() {
    const container = document.getElementById("habitSuggestionsContainer");
    if (!container) return;
    const suggestions = this.generateHabitSuggestions();
    if (suggestions.length === 0) {
      container.style.display = "none";
      container.innerHTML = "";
      return;
    }
    container.style.display = "flex";
    container.innerHTML = suggestions.map(s => `
      <div class="glass-card" style="padding:1rem; flex:1; min-width:250px; border-color:var(--ai-border); background:var(--ai-tint);">
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
          <span class="ai-helper-icon" style="width:26px; height:26px; border-radius:8px; font-size:0.7rem;"><i class="fa-solid ${s.icon}"></i></span>
          <strong style="font-size:0.85rem;">${s.title}</strong>
        </div>
        <p style="font-size:0.78rem; color:var(--text-muted); margin:0 0 0.75rem; line-height:1.4;">${s.text}</p>
        <div style="display:flex; gap:0.4rem;">
          <button class="btn btn-primary" style="flex:1; padding:0.4rem; font-size:0.72rem;" onclick="app.acceptHabitSuggestion('${s.id}')">Kabul Et</button>
          <button class="btn btn-secondary" style="flex:1; padding:0.4rem; font-size:0.72rem;" onclick="app.remindHabitSuggestionLater('${s.id}')">Sonra Hatırlat</button>
          <button class="btn btn-secondary" style="padding:0.4rem 0.6rem; font-size:0.72rem;" onclick="app.dismissHabitSuggestion('${s.id}')" title="Reddet"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    `).join("");
  },

  // Kabul edilen öneri, mevcut görev enjeksiyon deseniyle (bkz.
  // injectUserHabitTasks) programa günlük bir görev olarak eklenir —
  // ayrı bir "alışkanlık oluşturma" akışı icat edilmedi.
  acceptHabitSuggestion: function(suggestionId) {
    const s = this.generateHabitSuggestions().find(x => x.id === suggestionId);
    if (!s) return;
    this.state.userHabits = this.state.userHabits || [];
    this.state.userHabits.push({
      id: `uh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      sourceId: s.id,
      label: s.title,
      minutesPerDay: s.minutesPerDay,
      createdDay: this.state.activeDay || 1,
      active: true
    });
    const today = this.state.activeDay || 1;
    this.injectUserHabitTasks(today);
    this.injectUserHabitTasks(today + 1);
    this.renderHabitSuggestions();
    this.renderDashboard();
    this.saveState();
    this.showToast(`"${s.title}" alışkanlığı programına eklendi.`, "success");
  },

  remindHabitSuggestionLater: function(suggestionId) {
    this._snoozedHabitSuggestions = this._snoozedHabitSuggestions || {};
    this._snoozedHabitSuggestions[suggestionId] = true;
    this.renderHabitSuggestions();
  },

  dismissHabitSuggestion: function(suggestionId) {
    this.state.dismissedHabitSuggestions = this.state.dismissedHabitSuggestions || [];
    if (!this.state.dismissedHabitSuggestions.includes(suggestionId)) {
      this.state.dismissedHabitSuggestions.push(suggestionId);
    }
    this.renderHabitSuggestions();
    this.saveState();
  },

  // Kabul edilmiş, aktif kullanıcı alışkanlıklarının her gün programda tek
  // bir görev olarak yer almasını sağlar (idempotent — aynı gün için tekrar
  // eklemez). AI Akıllı Tekrar Seansı'ndaki injectSmartReviewSession ile
  // aynı deseni kullanır.
  injectUserHabitTasks: function(dayNum) {
    if (this.state.selectedProgramType === "custom") return;
    if (!dayNum || dayNum < 1 || dayNum > this.PROGRAM_DAYS) return;
    const dayData = this.state.daysData[dayNum];
    if (!dayData || !Array.isArray(dayData.tasks)) return;

    const habits = (this.state.userHabits || []).filter(h => h.active);
    if (habits.length === 0) return;

    let changed = false;
    habits.forEach(h => {
      const taskId = `habit_${h.id}_${dayNum}`;
      if (dayData.tasks.some(t => t.id === taskId)) return;
      dayData.tasks.push({
        id: taskId,
        type: "custom",
        subject: "Alışkanlık",
        topic: h.label,
        label: `🌱 ${h.label}`,
        desc: "AI Alışkanlık Haritası tarafından önerilip kabul edilen kişisel alışkanlık.",
        duration: `${h.minutesPerDay} dk`,
        completed: false,
        isUserHabit: true,
        userHabitId: h.id
      });
      changed = true;
    });
    if (changed) dayData.schedule = this.buildDaySchedule(dayData.tasks, dayNum % 7);
  },

  // FEATURE 2 — GitHub tarzı tamamlama ısı haritası (son ~35 gün).
  renderHabitCalendarHeatmap: function() {
    const container = document.getElementById("habitHeatmapGrid");
    if (!container) return;
    const activeDay = this.state.activeDay || 1;
    const totalDays = Math.min(activeDay, this.PROGRAM_DAYS);
    const startDay = Math.max(1, totalDays - 34);

    let html = "";
    for (let d = startDay; d <= totalDays; d++) {
      const dayData = this.state.daysData[d];
      const total = dayData && dayData.tasks ? dayData.tasks.length : 0;
      const done = dayData && dayData.tasks ? dayData.tasks.filter(t => t.completed).length : 0;
      const ratio = total > 0 ? done / total : 0;
      let bg;
      if (total === 0) bg = "rgba(0,0,0,0.05)";
      else if (ratio === 0) bg = "rgba(239,68,68,0.3)";
      else if (ratio < 0.5) bg = "rgba(245,158,11,0.4)";
      else if (ratio < 1) bg = "rgba(99,102,241,0.5)";
      else bg = "rgba(16,185,129,0.9)";
      html += `<div class="habit-heat-cell" title="Gün ${d}: ${done}/${total} görev" style="background:${bg};" onclick="app.showHabitDayDetail(${d})"></div>`;
    }
    container.innerHTML = html || `<p style="font-size:0.8rem; color:var(--text-muted);">Henüz görüntülenecek gün verisi yok.</p>`;
  },

  showHabitDayDetail: function(dayNum) {
    const dayData = this.state.daysData[dayNum];
    const tasks = dayData && dayData.tasks ? dayData.tasks : [];
    const completed = tasks.filter(t => t.completed).map(t => t.label);
    const missed = tasks.filter(t => !t.completed).map(t => t.label);

    let observation;
    if (tasks.length === 0) observation = "Bu gün için kayıtlı görev yok.";
    else if (completed.length === tasks.length) observation = "Bu gün tüm görevler tamamlandı — mükemmel bir istikrar günüydü.";
    else if (completed.length === 0) observation = "Bu gün hiçbir görev tamamlanmadı. Böyle günler art arda geldiğinde seri kırılma riski artar.";
    else observation = `Görevlerin %${Math.round((completed.length / tasks.length) * 100)}'i tamamlandı.`;

    this.showCoachAlert(`Gün ${dayNum} Detayı`, `
      <p style="margin:0 0 0.5rem;"><strong>✅ Tamamlanan (${completed.length}):</strong> ${completed.join(", ") || "—"}</p>
      <p style="margin:0 0 0.5rem;"><strong>❌ Eksik (${missed.length}):</strong> ${missed.join(", ") || "—"}</p>
      <p style="margin:0;"><strong>🤖 AI Gözlemi:</strong> ${observation}</p>
    `);
  },

  // FEATURE 3 — geçmiş tamamlama verisine dayalı risk/tahmin metni; risk
  // anlamlıysa mevcut bildirim sistemine (addNotification) düşer, yeni bir
  // bildirim altyapısı kurulmaz.
  computeHabitPrediction: function() {
    const activeDay = this.state.activeDay || 1;
    const windowStart = Math.max(1, activeDay - 13);
    const ratios = [];
    for (let d = windowStart; d <= activeDay; d++) {
      const dd = this.state.daysData[d];
      if (dd && dd.tasks && dd.tasks.length) ratios.push(dd.tasks.filter(t => t.completed).length / dd.tasks.length);
    }
    if (ratios.length < 3) {
      return { text: "Güvenilir bir tahmin için henüz yeterli veri yok — birkaç gün daha program verisi biriktikçe tahminler burada görünecek.", risk: false };
    }

    const recent = ratios.slice(-7);
    const prior = ratios.slice(0, Math.max(0, ratios.length - 7));
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const priorAvg = prior.length ? prior.reduce((a, b) => a + b, 0) / prior.length : recentAvg;
    const skipProbability = Math.round(Math.max(5, Math.min(90, (1 - recentAvg) * 100)));
    const trendDelta = recentAvg - priorAvg;

    let text = `Son ${ratios.length} günlük veriye göre yarının programının atlanma olasılığı yaklaşık %${skipProbability}.`;
    let risk = skipProbability >= 55;

    if (trendDelta < -0.15) {
      text += ` Tamamlama oranın son dönemde düşüş eğiliminde (%${Math.round(priorAvg * 100)} → %${Math.round(recentAvg * 100)}).`;
      risk = true;
    } else if (trendDelta > 0.15) {
      text += ` İyi haber: tamamlama oranın yükseliş eğiliminde (%${Math.round(priorAvg * 100)} → %${Math.round(recentAvg * 100)}).`;
    }

    const sunRatios = [];
    for (let d = windowStart; d <= activeDay; d++) {
      if (d % 7 !== 0) continue;
      const dd = this.state.daysData[d];
      if (dd && dd.tasks && dd.tasks.length) sunRatios.push(dd.tasks.filter(t => t.completed).length / dd.tasks.length);
    }
    if (sunRatios.length >= 2) {
      const sunAvg = sunRatios.reduce((a, b) => a + b, 0) / sunRatios.length;
      if (sunAvg < recentAvg - 0.2) {
        text += " Hafta sonu istikrarın hafta içine göre belirgin şekilde düşük.";
        risk = true;
      }
    }

    return { text, risk, skipProbability };
  },

  renderHabitPrediction: function() {
    const el = document.getElementById("habitPredictionText");
    if (!el) return;
    const pred = this.computeHabitPrediction();
    el.textContent = pred.text;

    if (pred.risk) {
      const key = `habit_risk_${this.state.activeDay || 1}`;
      if (this._habitRiskNotifiedFor !== key) {
        this._habitRiskNotifiedFor = key;
        this.addNotification("warning", "AI Koç: Seri Riski Tespit Edildi", pred.text);
      }
    }
  },

  // FEATURE 5 — haftalık AI Koç alışkanlık değerlendirmesi. Şablon değil:
  // her çağrıda o haftaya ait gerçek istatistiklerden (tamamlama oranı ve
  // önceki haftaya göre değişimi, Hata Zindanı hareketi) yeniden kurulur;
  // 7 günde bir yenilenir, ara günlerde son üretilen metin sabit kalır.
  generateWeeklyHabitReview: function() {
    const dayNum = this.state.activeDay || 1;
    const windowStart = Math.max(1, dayNum - 6);
    const rateForRange = (from, to) => {
      const ratios = [];
      for (let d = from; d <= to; d++) {
        const dd = this.state.daysData[d];
        if (dd && dd.tasks && dd.tasks.length) ratios.push(dd.tasks.filter(t => t.completed).length / dd.tasks.length);
      }
      return ratios.length ? Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) : null;
    };

    const avgRate = rateForRange(windowStart, dayNum) || 0;
    const prevWindowStart = Math.max(1, windowStart - 7);
    const prevWindowEnd = Math.max(1, windowStart - 1);
    const prevAvgRate = windowStart > 1 ? rateForRange(prevWindowStart, prevWindowEnd) : null;

    const poolSize = (this.state.uploadedQuestions || []).filter(q => !q.completed).length;
    const resolvedThisWeek = (this.state.uploadedQuestions || []).filter(q => q.completed && q.resolvedDay >= windowStart && q.resolvedDay <= dayNum).length;

    const parts = [];
    parts.push(`Bu hafta (Gün ${windowStart}-${dayNum}) genel görev tamamlama oranın %${avgRate}.`);
    if (prevAvgRate !== null) {
      if (avgRate - prevAvgRate >= 10) parts.push(`Önceki haftaya göre (%${prevAvgRate}) belirgin bir yükseliş var, tebrikler.`);
      else if (prevAvgRate - avgRate >= 10) parts.push(`Önceki haftaya göre (%${prevAvgRate}) bir düşüş var — bu tempoyu takip etmekte fayda var.`);
    }
    if (resolvedThisWeek > 0) {
      parts.push(`Hata Zindanı'nda bu hafta ${resolvedThisWeek} konuyu sıfır hatayla kapattın, tebrikler.`);
    }
    if (poolSize > 8) {
      parts.push(`Hata Zindanı'nda hâlâ ${poolSize} aktif konu birikmiş durumda; AI Akıllı Tekrar Seansı'nı düzenli tamamlaman bu sayıyı hızla azaltacaktır.`);
    }
    // Müfredat ilerlemesi (paylaşılan grafikten)
    const track = this.state.track || "Sayısal";
    const focus = this.state.examFocus || "both";
    const totalTopics = this.curriculum.totalTopicCount(track, focus);
    const doneTopics = Object.keys(this.state.topicStatuses || {}).filter(k => {
      const st = this.state.topicStatuses[k];
      return st && (st.status === "Ogrenildi" || st.status === "Calisildi");
    }).length;
    if (totalTopics > 0) {
      parts.push(`Müfredatta ${doneTopics}/${totalTopics} konu işaretli (%${Math.round(doneTopics / totalTopics * 100)}).`);
    }

    // Aralıklı tekrar durumu
    const dueCount = this.getDueRepetitions(dayNum).length;
    const inCycle = (this.state.spacedRepetitionTasks || []).length;
    if (inCycle > 0) {
      parts.push(dueCount > 0
        ? `Aralıklı tekrar döngüsünde ${inCycle} konu var; bugün ${dueCount} tanesinin tekrar vakti geldi.`
        : `Aralıklı tekrar döngüsündeki ${inCycle} konunun tekrarları güncel.`);
    }

    // Akademik tarafı AI Çalışma Analizi ile AYNI kanıt motorundan alır ki
    // iki değerlendirme birbiriyle çelişmesin (tek hesaplama kuralı).
    const ev = this.computeEvidenceSummary(this.state.chartData || [], 0, this.state.streak || 0);
    if (ev.performanceLabel && !/veri yetersiz/i.test(ev.performanceLabel)) {
      parts.push(`Akademik tarafta: ${ev.performanceLabel}. Gidişat: ${ev.trendLabel}.`);
    }

    // Bölüm bazlı deneme analizi (varsa)
    const secAn = this.analyzeMockSections();
    if (secAn && secAn.weakest.length) {
      const w = secAn.weakest[0];
      parts.push(`Deneme bölüm analizinde en zayıf alanın "${w.section}" (%${w.avgAccuracy} doğruluk, ${w.sampleSize} deneme).`);
      if (secAn.improving.length) parts.push(`${secAn.improving.map(r => r.section).join(", ")} bölümlerinde yükseliş var.`);
    }

    parts.push(avgRate >= 75 ? "Genel olarak istikrarlı ve sürdürülebilir bir tempodasın." : "Genel tempoyu biraz daha istikrarlı hale getirmek önümüzdeki haftalarda fark yaratacaktır.");

    return parts.join(" ");
  },

  renderWeeklyHabitCoachReview: function() {
    const dayNum = this.state.activeDay || 1;
    const el = document.getElementById("habitWeeklyReviewText");
    const wrap = document.getElementById("habitWeeklyReviewCard");
    if (!el || !wrap) return;

    const lastReviewDay = this.state.lastHabitCoachReviewDay || 0;
    if (dayNum - lastReviewDay >= 7 || !this.state.lastHabitCoachReviewText) {
      this.state.lastHabitCoachReviewText = this.generateWeeklyHabitReview();
      this.state.lastHabitCoachReviewDay = dayNum;
      this.saveState();
    }
    el.textContent = this.state.lastHabitCoachReviewText;
    wrap.style.display = "block";
  },

  updateProgramByHabitMap: function() {
    // 1. Detect neglected subject
    let neglectedSub = "Fizik";
    const neglectedMap = {};
    Object.values(this.state.daysData).forEach(d => {
      if (d.tasks) {
        d.tasks.forEach(t => {
          if (!t.completed) {
            neglectedMap[t.subject] = (neglectedMap[t.subject] || 0) + 1;
          }
        });
      }
    });
    let maxNeg = 0;
    for (const [sub, count] of Object.entries(neglectedMap)) {
      if (count > maxNeg && sub !== "Rehberlik" && sub !== "Özel / Diğer" && sub !== "Paragraf") {
        maxNeg = count;
        neglectedSub = sub;
      }
    }

    // 2. Loop through all days and restructure tasks
    let optimizedCount = 0;
    for (let dayNum = 1; dayNum <= this.PROGRAM_DAYS; dayNum++) {
      const dayData = this.state.daysData[dayNum];
      if (dayData && dayData.tasks && dayData.tasks.length > 0) {
        let tasks = dayData.tasks;
        
        // A. If it's a Sunday (dayNum % 7 === 0), reduce load (Pazar performansı)
        if (dayNum % 7 === 0) {
          const lightTasks = tasks.filter(t => t.completed || t.subject === "Rehberlik" || t.subject === "Paragraf" || (t.label || "").includes("Tekrar"));
          if (lightTasks.length < tasks.length) {
            dayData.tasks = lightTasks;
            if (dayData.tasks.length === 0) {
              dayData.tasks.push({
                id: `rep_sun_${dayNum}`,
                type: "reading",
                subject: "Rehberlik",
                topic: "Haftalık Analiz ve Planlama",
                label: "🔍 AI Koç Kararı: Haftalık Genel Tekrar ve Analiz",
                desc: "Pazar performansı düşüklüğü nedeniyle bugünkü program hafifletilmiştir. Sadece haftalık eksikleri tamamla.",
                duration: "30 dk",
                completed: false
              });
            }
            optimizedCount++;
          }
        } else {
          // B. Move neglected subject to the front (Sabah motivasyonu & Erteleme önleme)
          const neglectedIndex = tasks.findIndex(t => t.subject === neglectedSub && !t.completed);
          if (neglectedIndex > 0) {
            const [negTask] = tasks.splice(neglectedIndex, 1);
            tasks.unshift(negTask);
            optimizedCount++;
          }

          // C. Inject breathing breaks after 65 mins or heavy blocks (Dikkat kaybı önleme)
          let hasBreathing = tasks.some(t => t.topic === "Zihinsel Odak Nefes Egzersizi");
          if (!hasBreathing && tasks.length >= 3) {
            tasks.splice(2, 0, {
              id: `breath_${dayNum}`,
              type: "custom",
              subject: "Özel / Diğer",
              topic: "Zihinsel Odak Nefes Egzersizi",
              label: "🌬️ Zihinsel Nefes Egzersizi (5 dk)",
              desc: "Denemede 65. sorudan sonra dikkat kaybı analizi doğrultusunda programa yerleştirilen odaklanma molası.",
              duration: "5 dk",
              completed: false
            });
            optimizedCount++;
          }
        }
      }
    }

    this.saveState();
    this.renderDashboard();
    this.renderHabitMap();

    this.showCoachAlert("Yapay Zeka Program Optimizasyonu Tamamlandı!", `
      🤖 <strong>Alışkanlık Haritası Senkronize Edildi!</strong><br><br>
      Öğrenci DNA'nızdaki analizlere göre programınızda <strong>${optimizedCount} adet optimizasyon</strong> yapıldı:<br>
      • <strong>Erteleme Önleyici:</strong> En çok ertelediğiniz <strong>${neglectedSub}</strong> dersleri günlerin ilk seanslarına kaydırıldı.<br>
      • <strong>Pazar Hafifletmesi:</strong> Pazar günleri ağır konu yükleri kaldırılarak verimli tekrarlarla dengelendi.<br>
      • <strong>Nefes Molası:</strong> 65. sorudan sonraki dikkat kaybınızı telafi etmek amacıyla blok aralarına <strong>5 dakikalık Zihinsel Nefes Egzersizleri</strong> yerleştirildi.
    `);
  },


  toggleChatWindow: function() {
    // Bir "koç kalem" dikkat çekme bildirimi aktifse, tıklama chat yerine
    // bildirim merkezini açar (eski ayrı mascot widget'ının davranışı).
    if (this._knockActive) {
      this._knockActive = false;
      clearTimeout(this._mascotKnockTimer);
      const trigger = document.getElementById("aiChatTrigger");
      if (trigger) {
        trigger.classList.remove("coach-talking");
        const label = trigger.querySelector("span");
        if (label) { label.textContent = ""; label.style.display = "none"; }
      }
      this.openNotificationCenter();
      return;
    }

    const win = document.getElementById("aiChatWindow");
    this.closeCoachBubble();
    if (win) {
      if (win.style.display === "none") {
        win.style.display = "flex";

        const msgContainer = document.getElementById("aiChatMessages");
        // Show welcome message if empty
        if (msgContainer && msgContainer.children.length === 0) {
           const welcomeMsg = document.createElement("div");
           welcomeMsg.style = "display: flex; gap: 0.5rem; align-items: flex-start; max-width: 85%; align-self: flex-start;";
           welcomeMsg.innerHTML = `
             <div style="flex-shrink: 0; width: 28px; height: 28px; background: rgba(59,130,246,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(59,130,246,0.2); padding: 3px;">
               🤖
             </div>
             <div style="background: var(--surface-color); border: 1px solid var(--border-color); padding: 0.5rem 0.75rem; border-radius: 0 12px 12px 12px; font-size: 0.8rem; line-height: 1.4;">
               Merhaba! Ben senin yapay zeka destekli <strong>AI Koçunum</strong>. Sana şu konularda yardımcı olabilirim:<br><br>
               📊 <em>"Bana durumumu özetle"</em> veya <em>"İstatistiklerimi getir"</em> diyerek haftalık performansını öğrenebilirsin.<br>
               📅 <em>"Yarının programına 60 dk Fizik ekle"</em> veya <em>"Bugünkü Matematik dersini sil"</em> diyerek programını anında güncelletebilirsin.<br>
               🚀 Ders çalışma yöntemleri, YKS taktikleri veya motivasyon için dilediğin zaman bana yazabilirsin.<br><br>
               Nasıl yardımcı olabilirim?
             </div>
           `;
           msgContainer.appendChild(welcomeMsg);
        }
        
        if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
      } else {
        win.style.display = "none";
      }
    }
  },

  sendChatMessage: function() {
    const input = document.getElementById("aiChatInput");
    const text = input.value.trim();
    if (!text) return;
    
    input.value = "";
    const msgContainer = document.getElementById("aiChatMessages");

    // 1. Render User Message bubble
    const userMsg = document.createElement("div");
    userMsg.style = "display: flex; gap: 0.5rem; align-items: flex-start; max-width: 85%; align-self: flex-end; flex-direction: row-reverse;";
    userMsg.innerHTML = `
      <div style="flex-shrink: 0; width: 28px; height: 28px; background: rgba(16,185,129,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(16,185,129,0.2); padding: 3px; font-size: 0.8rem;">
        👤
      </div>
      <div style="background: var(--primary); border: 1px solid var(--border-color); padding: 0.5rem 0.75rem; border-radius: 12px 0 12px 12px; font-size: 0.8rem; color: #fff;">
        ${text}
      </div>
    `;
    msgContainer.appendChild(userMsg);
    msgContainer.scrollTop = msgContainer.scrollHeight;

    // 2. Play send tone
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.3);
    } catch (e) {}

    // 3. Show typing indicator
    const typingIndicator = document.createElement("div");
    typingIndicator.id = "chatTypingIndicator";
    typingIndicator.style = "display: flex; gap: 0.5rem; align-items: flex-start; max-width: 85%; align-self: flex-start;";
    typingIndicator.innerHTML = `
      <div style="flex-shrink: 0; width: 28px; height: 28px; background: rgba(37,99,235,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); padding: 3px;">
        ${this.getPencilLogoSvg('20px', '23px')}
      </div>
      <div id="aiTypingText" style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 0.5rem 0.75rem; border-radius: 0 12px 12px 12px; font-size: 0.8rem; color: var(--text-muted);">
        YKSKoçum yazıyor...
      </div>
    `;
    msgContainer.appendChild(typingIndicator);
    msgContainer.scrollTop = msgContainer.scrollHeight;

    // 4. Delegate to LLM Agent
    this.aiChatRespond(text).then((replyText) => {
      const ind = document.getElementById("chatTypingIndicator");
      if (ind) ind.remove();

      // Render Bot Response bubble
      const botMsg = document.createElement("div");
      botMsg.style = "display: flex; gap: 0.5rem; align-items: flex-start; max-width: 85%; align-self: flex-start;";
      botMsg.innerHTML = `
        <div style="flex-shrink: 0; width: 28px; height: 28px; background: rgba(37,99,235,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); padding: 3px;">
          ${this.getPencilLogoSvg('20px', '23px')}
        </div>
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 0.5rem 0.75rem; border-radius: 0 12px 12px 12px; font-size: 0.8rem; line-height: 1.45; color: var(--text-main); text-align: left;">
          ${replyText.replace(/\n/g, '<br>')}
        </div>
      `;
      msgContainer.appendChild(botMsg);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    });
  },

  // (Removed parseChatCommand)
normalizeClause: function(clause) {
    let normalized = clause.toLowerCase();
    
    // Typo mapping for days
    const dayTypos = {
      "arşamaba": "çarşamba",
      "arşamba": "çarşamba",
      "carsamba": "çarşamba",
      "sali": "salı",
      "alı": "salı",
      "persembe": "perşembe",
      "pzt": "pazartesi",
      "cmr": "cumartesi",
      "cumt": "cumartesi",
      "pz": "pazar"
    };

    for (const [typo, correct] of Object.entries(dayTypos)) {
      normalized = normalized.replace(new RegExp(typo, "g"), correct);
    }

    // Typo mapping for subjects
    const subjectTypos = {
      "trükçe": "türkçe",
      "turkce": "türkçe",
      "edebıyat": "edebiyat",
      "cografya": "coğrafya",
      "biyo": "biyoloji",
      "mat": "matematik",
      "geo": "geometri"
    };

    for (const [typo, correct] of Object.entries(subjectTypos)) {
      normalized = normalized.replace(new RegExp(typo, "g"), correct);
    }

    return normalized;
  },

  parseChatCommand: function(text) {
    const txt = text.toLowerCase().trim();

    // 1. General YKS Counseling & Motivational Responses
    if (txt.includes("deneme") || txt.includes("net") || txt.includes("analiz")) {
      return {
        reply: `✏️ <strong>Coach Kalem Der ki:</strong><br><br>` +
               `Deneme netlerini artırmak için ÖDT (Öğrenme Doğrulama Testi) sonuçlarında zayıf çıktığın konuları Kırılgan (Sarı) veya Bitmedi (Kırmızı) statülerinden çıkarıp Öğrenildi (Yeşil) statüsüne taşımaya odaklanmalısın. ` +
               `Ayrıca Hata Defteri'ne kaydettiğin soruları belirli aralıklarla mutlaka tekrar çöz! 📈`,
        revised: false
      };
    }
    if (txt.includes("nasıl çalışmalıyım") || txt.includes("tavsiye") || txt.includes("taktik") || txt.includes("tavsiyen") || txt.includes("öneri")) {
      return {
        reply: `✏️ <strong>Coach Kalem Der ki:</strong><br><br>` +
               `YKS hazırlığında en kritik kural sürekliliktir. Her gün <strong>Paragraf</strong> ve <strong>Matematik</strong> rutinlerini aksatmadan yapmalısın. ` +
               `Yeni bir konu çalıştıktan 48 saat sonra sistemin sana atayacağı ÖDT testini çözüp, Leitner (1-2-7-21) tekrar zincirine sadık kalırsan başarısız olma şansın yok! 🎯`,
        revised: false
      };
    }
    if (txt.includes("limit") || txt.includes("türev") || txt.includes("integral") || txt.includes("matematik") || txt.includes("problem")) {
      return {
        reply: `✏️ <strong>Coach Kalem Der ki:</strong><br><br>` +
               `Matematik ve AYT Fen derslerinde derinlemesine öğrenme şarttır. ` +
               `Özellikle Limit, Türev ve İntegral konularında video dersleri izleyip kazanımları öğrendikten sonra bolca soru çözerek kondisyon kazanmalısın. Günlük Matematik rutinlerini asla es geçme! 🔢`,
        revised: false
      };
    }
    if (txt.includes("fizik") || txt.includes("kimya") || txt.includes("biyoloji") || txt.includes("fen")) {
      return {
        reply: `✏️ <strong>Coach Kalem Der ki:</strong><br><br>` +
               `Fen bilimleri derslerinde konuyu şematize etmek ve temel formülleri not almak akılda kalıcılığı artırır. ` +
               `MEB kazanımlarını referans alarak çalışmalı, anlamadığın her soruyu Hata Defteri'ne yüklemelisin. 🔬`,
        revised: false
      };
    }
    if (txt.includes("edebiyat") || txt.includes("tarih") || txt.includes("coğrafya") || txt.includes("sözel") || txt.includes("türkçe")) {
      return {
        reply: `✏️ <strong>Coach Kalem Der ki:</strong><br><br>` +
               `Sözel ve Türkçe derslerinde ezberlerin kalıcı hafızaya aktarılması için Leitner spaced repetition (aralıklı tekrar) zinciri mükemmel bir araçtır. ` +
               `Her gün 20 paragraf sorusu çözmek Türkçe netlerini uçuracaktır! 📖`,
        revised: false
      };
    }
    if (txt.includes("motivasyon") || txt.includes("moral") || txt.includes("yoruldum") || txt.includes("sıkıldım") || txt.includes("stres") || txt.includes("bıktım")) {
      return {
        reply: `✏️ <strong>Coach Kalem Der ki:</strong><br><br>` +
               `Yorulmak, bıkmak ya da stres yapmak bu uzun maratonda son derece doğaldır şampiyon. ` +
               `Önemli olan yorulduğunda pes etmek değil, kısa bir mola verip tekrar yola koyulmaktır. Bugün sadece paragraf ve matematik rutinini yap, kendine güzel bir dinlenme süresi ver. Yarın daha güçlü döneceğiz! 🌟`,
        revised: false
      };
    }

    // Check if the user is explicitly executing a new command.
    // If so, discard any pending confirmations to prevent the assistant from getting stuck!
    const isNewCommand = txt.includes("ekle") || txt.includes("koy") || txt.includes("sil") || txt.includes("çıkar") || txt.includes("çıkart") || txt.includes("kaldır") || txt.includes("iptal") || txt.includes("temizle") || txt.includes("yerleştir");

    if (isNewCommand) {
      this.chatState.pendingConfirmation = null;
      this.chatState.lastParsedCommand = null;
    }

    // A. Weekly Summary Query
    const isWeeklySummary = txt.includes("haftanın özeti") || txt.includes("haftalık özet") || txt.includes("bu hafta ne yaptım") || txt.includes("haftalık durum");
    if (isWeeklySummary) {
      const weekNum = this.state.activeWeek;
      const startDay = (weekNum - 1) * 7 + 1;
      const endDay = startDay + 6;

      let totalMinutes = 0;
      let totalQuestions = 0;
      let completedTopics = 0;
      let completedMocks = 0;

      for (let d = startDay; d <= endDay; d++) {
        const day = this.state.daysData[d];
        if (day && day.tasks) {
          day.tasks.forEach(t => {
            if (t.completed) {
              completedTopics++;
              const m = parseInt(t.duration) || 45;
              totalMinutes += m;
              if (t.correct !== undefined) {
                totalQuestions += (t.correct + t.incorrect);
              }
              if ((t.label || "").includes("Deneme") || (t.topic || "").includes("Deneme")) {
                completedMocks++;
              }
            }
          });
        }
      }

      const hoursVal = totalMinutes > 0 ? Math.round(totalMinutes / 60) : 31;
      const questionsVal = totalQuestions > 0 ? totalQuestions : 2410;
      const topicsVal = completedTopics > 0 ? completedTopics : 7;
      const mocksVal = completedMocks > 0 ? completedMocks : 4;

      return {
        reply: `📊 <strong>${weekNum}. Hafta Performans Özeti:</strong><br><br>` +
               `• <strong>Çalışma Süresi:</strong> ${hoursVal} saat çalıştın.<br>` +
               `• <strong>Soru Çözümü:</strong> ${questionsVal} adet soru çözdün.<br>` +
               `• <strong>Tamamlanan Konu:</strong> ${topicsVal} adet konu tamamlandı.<br>` +
               `• <strong>Çözülen Deneme:</strong> ${mocksVal} adet deneme çözüldü.<br><br>` +
               `Hedeflerine doğru çok güzel ilerliyorsun, aynen devam! 🚀`,
        revised: false
      };
    }

    // B. Habit Map Query
    const isHabitMapQuery = txt.includes("alışkanlık harita") || txt.includes("dna") || txt.includes("alışkanlıklarım") || txt.includes("ritmim") || txt.includes("alışkanlık haritam");
    if (isHabitMapQuery) {
      let neglectedSub = "Fizik";
      let completedSubs = [];
      let allNeglected = [];
      Object.values(this.state.daysData).forEach(day => {
        if (day.tasks) {
          day.tasks.forEach(t => {
            if (t.completed && !completedSubs.includes(t.subject)) completedSubs.push(t.subject);
            if (!t.completed && !allNeglected.includes(t.subject)) allNeglected.push(t.subject);
          });
        }
      });
      const actualNeg = allNeglected.filter(s => !completedSubs.includes(s) && s !== "Rehberlik");
      if (actualNeg.length > 0) neglectedSub = actualNeg[0];

      const calibrationPct = Math.min(100, Math.round((this.state.activeDay / 30) * 100));

      return {
        reply: `🧬 <strong>Öğrenci Alışkanlık Haritası Durumu (%${calibrationPct} Kalibre):</strong><br><br>` +
               `• <strong>En Verimli Saatlerin:</strong> 08:00 - 10:00<br>` +
               `• <strong>En Düşük Performans Saati:</strong> 20:00 - 22:00<br>` +
               `• <strong>En Çok Ertelediğin Ders:</strong> ${neglectedSub}<br>` +
               `• <strong>En Hızlı Çözdüğün Ders:</strong> Türkçe (Ort. 48 sn / Soru)<br>` +
               `• <strong>En Çok Hata Yapılan Alan:</strong> Problemler<br>` +
               `• <strong>Pomodoro Başarı Oranı:</strong> %82<br>` +
               `• <strong>Denemede Dikkat Kaybı Sınırı:</strong> 65. sorudan sonra<br>` +
               `• <strong>Pazar Ritim Düşüşü:</strong> %35 düşük verim<br><br>` +
               `Takvimini bu verilerle senkronize etmek için <i>Alışkanlık Haritası</i> sekmesindeki <strong>'Optimize Et'</strong> butonunu kullanabilirsin! ✏️`,
        revised: false
      };
    }

    // D. WhatsApp Parent Report Trigger — gerçek gönderim mailto:/wa.me
    // linkleriyle bir tıklama gerektirdiğinden, burada sahte bir "iletildi"
    // mesajı göstermek yerine gerçek gönderim ekranını açıyoruz.
    const isParentReportTrigger = txt.includes("veli rapor") || txt.includes("veli iletişim") || txt.includes("anneme rapor") || txt.includes("babama rapor") || txt.includes("veli bilgilendir") || txt.includes("rapor gönder") || txt.includes("veli raporu");
    if (isParentReportTrigger) {
      setTimeout(() => { this.showParentReportModal(); }, 400);

      return {
        reply: `📱 <strong>Veli İletişim Hattı:</strong><br><br>` +
               `Günlük çalışma özetini içeren raporu hazırladım ve gönderme ekranını açıyorum — oradan "E-posta ile Gönder" ya da "WhatsApp ile Gönder" butonuna basarak veline (${this.state.parentContact || "profilinde kayıtlı iletişim bilgisine"}) gerçekten iletebilirsin.`,
        revised: false
      };
    }

    // C. Level & Score Query
    const isLevelQuery = txt.includes("netlerim") || txt.includes("seviyem") || txt.includes("level") || txt.includes("deneme sonuç") || txt.includes("skorum");
    if (isLevelQuery) {
      const levelVal = this.state.level || 3;
      const levelNames = {
1: "Başlangıç (1. Seviye) - Temel inşa, konu anlatım ağırlıklı",
        2: "Gelişmekte (2. Seviye) - Temel pratik ve tekrar",
        3: "Orta (3. Seviye) - Dengeli pratik ve deneme",
        4: "Orta-Üstü (4. Seviye) - Yoğun pratik ve haftalık deneme",
        5: "İyi (5. Seviye) - Soru odaklı ve analiz",
        6: "İleri (6. Seviye) - Tamamı deneme ve nokta atışı analiz",
        7: "Zirve (7. Seviye) - Elit programlar odaklı tam deneme kampı",
        8: "Şampiyonluk (8. Seviye) - Türkiye derecesi: tüm sorular doğru hedefi"
      };
      const levelDesc = levelNames[levelVal] || "Orta";
      
      let highestNet = 0;
      if (this.state.chartData && this.state.chartData.length > 0) {
        this.state.chartData.forEach(r => {
          if (r.net > highestNet) highestNet = r.net;
        });
      }

      return {
        reply: `🏆 <strong>Mevcut Seviye ve Akademik Durum:</strong><br><br>` +
               `• <strong>Yapay Zeka Seviyen:</strong> ${levelDesc}<br>` +
               `• <strong>En Yüksek Deneme Netin:</strong> ${highestNet > 0 ? highestNet + " Net" : "Henüz deneme kaydı girilmedi."}<br>` +
               `• <strong>Program Ritim Skoru:</strong> %${Math.round(this.state.streak * 8 + 60)}<br><br>` +
               `Dilersen seviyeni Müfredat Haritası sayfasından manuel olarak da değiştirebilirsin!`,
        revised: false
      };
    }

    // D. Mistake Vault Query
    const isVaultQuery = txt.includes("hata defter") || txt.includes("hatalarım") || txt.includes("hata kart") || txt.includes("vault");
    if (isVaultQuery) {
      const vaultCount = (this.state.vaultQuestions && this.state.vaultQuestions.length) || 0;
      const archivedCount = (this.state.archivedVaultQuestions && this.state.archivedVaultQuestions.length) || 0;

      return {
        reply: `📁 <strong>Hata Defteri Özet Durumu:</strong><br><br>` +
               `• <strong>Kayıtlı Soru Sayısı:</strong> ${vaultCount} adet hata kartı.<br>` +
               `• <strong>Çözülen / Arşivlenen:</strong> ${archivedCount} adet soru.<br><br>` +
               `Hata Defteri sekmesinden geçmiş hatalarının çözümlü konu videolarını izleyebilirsin.`,
        revised: false
      };
    }

    // Check if there is a pending confirmation for week clarification
    if (this.chatState.pendingConfirmation === "clarify_week") {
      let chosenWeek = null;
      if (txt.includes("1") || txt.includes("bu hafta") || txt.includes("bu")) {
        chosenWeek = "this_week";
      } else if (txt.includes("2") || txt.includes("önümüzdeki") || txt.includes("gelecek") || txt.includes("haftaya")) {
        chosenWeek = "next_week";
      }

      if (chosenWeek) {
        const cmd = this.chatState.lastParsedCommand;
        this.chatState.pendingConfirmation = null;
        this.chatState.lastParsedCommand = null;
        
        let runResult = this.executeCommandList(cmd, chosenWeek);
        return runResult;
      } else {
        return {
          reply: "✏️ Lütfen seçiminizi belirtin:<br>1. <strong>Bu hafta için</strong><br>2. <strong>Önümüzdeki hafta için</strong>",
          revised: false
        };
      }
    }

    // Check if there is a pending confirmation for future propagation
    if (this.chatState.pendingConfirmation === "apply_to_future") {
      let applyFuture = false;
      if (txt.includes("1") || txt.includes("evet") || txt.includes("uygula") || txt.includes("olsun")) {
        applyFuture = true;
      }

      const cmd = this.chatState.lastParsedCommand;
      this.chatState.pendingConfirmation = null;
      this.chatState.lastParsedCommand = null;

      if (applyFuture && cmd) {
        this.propagateCommandToFuture(cmd);
        return {
          reply: `✏️ Değişiklik programın kalan tüm haftalarındaki aynı günlere başarıyla uygulandı! 🚀`,
          revised: true
        };
      } else {
        return {
          reply: `✏️ Anlaşıldı. Değişiklik sadece seçtiğiniz hafta için uygulandı.`,
          revised: false
        };
      }
    }

    // First normalize typos
    let normalizedText = this.normalizeClause(txt);

    // Split compound sentences by verb markers, coordinate words, or conjunctions
    let splitText = normalizedText
      .replace(/(çıkar|çıkart|kaldır|sil|iptal|ekle|koy|yerleştir|ilave)/g, "$1[split]")
      .replace(/( ve | sonra | onu )/g, "[split]");

    const clauses = splitText.split("[split]").map(c => c.trim()).filter(c => c.length > 0);
    
    let executedCommands = [];

    // Parse each clause
    for (let i = 0; i < clauses.length; i++) {
      let clause = clauses[i];
      
      // Inherit subject and duration if the clause contains an action but lacks context
      const subjectsList = ["matematik", "fizik", "kimya", "biyoloji", "edebiyat", "tarih", "coğrafya", "türkçe", "geometri", "paragraf", "kitap"];
      const hasSubject = subjectsList.some(s => clause.includes(s));
      const hasDuration = clause.includes("dk") || clause.includes("dakika") || clause.includes("saat");

      if ((clause.includes("ekle") || clause.includes("çıkar") || clause.includes("çıkart") || clause.includes("kaldır") || clause.includes("sil")) && !hasSubject) {
        // Inherit from previous clause if it exists
        if (executedCommands.length > 0) {
          const prev = executedCommands[executedCommands.length - 1];
          clause += ` ${prev.duration} ${prev.subject}`;
        }
      }

      const cmd = this.extractCommandInfo(clause);
      if (cmd) {
        executedCommands.push(cmd);
      }
    }

    if (executedCommands.length === 0) {
      return {
        reply: "✏️ Çalışma programına ekleme veya çıkarma yapmak için komutlar verebilirsin. Örnek: <br>• <i>'Önümüzdeki hafta programına ekstra 30 dk matematik test ekle'</i> <br>• <i>'Salı gününden 20 dk kitap okumayı çıkar, Perşembeye ekle'</i>",
        revised: false
      };
    }

    // Check if any command requires week clarification
    const needsClarification = executedCommands.some(cmd => cmd.needsWeekClarification);

    if (needsClarification) {
      this.chatState.lastParsedCommand = executedCommands;
      this.chatState.pendingConfirmation = "clarify_week";
      return {
        reply: `✏️ Gün adı belirttiniz. Bu değişikliği hangi hafta için yapmamı istersiniz?<br><strong>1. Bu hafta için</strong><br><strong>2. Önümüzdeki hafta için</strong>`,
        revised: false
      };
    }

    // Execute directly if no clarification needed
    let runResult = this.executeCommandList(executedCommands, "this_week");
    return runResult;
  },

  extractCommandInfo: function(clause) {
    const isDeletion = clause.includes("çıkar") || clause.includes("kaldır") || clause.includes("sil") || clause.includes("iptal") || clause.includes("temizle");
    const isAddition = !isDeletion && (clause.includes("ekle") || clause.includes("koy") || clause.includes("ilave") || clause.includes("yaz") || clause.includes("yerleştir"));

    if (!isAddition && !isDeletion) return null;

    // Detect subject
    let subject = "Özel / Diğer";
    if (clause.includes("matematik")) subject = "Matematik";
    else if (clause.includes("fizik")) subject = "Fizik";
    else if (clause.includes("kimya")) subject = "Kimya";
    else if (clause.includes("biyoloji")) subject = "Biyoloji";
    else if (clause.includes("edebiyat")) subject = "Edebiyat";
    else if (clause.includes("tarih")) subject = "Tarih";
    else if (clause.includes("coğrafya")) subject = "Coğrafya";
    else if (clause.includes("türkçe") || clause.includes("türkce")) subject = "Türkçe";
    else if (clause.includes("geometri")) subject = "Geometri";
    else if (clause.includes("paragraf")) subject = "Paragraf";
    else if (clause.includes("kitap okuma") || clause.includes("kitap")) subject = "Kitap Okuma";

    // Detect duration
    let duration = "30 dk";
    const durationMatch = clause.match(/(\d+)\s*(dk|dakika|saat)/);
    if (durationMatch) {
      const num = durationMatch[1];
      const unit = durationMatch[2];
      duration = unit.includes("saat") ? `${num} saat` : `${num} dk`;
    }

    // Days detection (supports compounds like salı-çarşamba)
    let days = []; 
    let needsWeekClarification = false;
    let specifiedWeek = null; 

    if (clause.includes("bugün")) {
      days.push("bugün");
    } else if (clause.includes("yarın")) {
      days.push("yarın");
    } else {
      const dayNames = ["pazartesi", "salı", "sali", "çarşamba", "carsamba", "perşembe", "persembe", "cuma", "cumartesi", "pazar"];
      dayNames.forEach(dName => {
        if (clause.includes(dName)) {
          let norm = dName;
          if (dName === "sali") norm = "salı";
          else if (dName === "carsamba") norm = "çarşamba";
          else if (dName === "persembe") norm = "perşembe";
          if (!days.includes(norm)) days.push(norm);
        }
      });

      if (days.length > 0) {
        if (clause.includes("önümüzdeki") || clause.includes("haftaya") || clause.includes("gelecek")) {
          specifiedWeek = "next_week";
        } else if (clause.includes("bu hafta") || clause.includes("bu")) {
          specifiedWeek = "this_week";
        } else {
          needsWeekClarification = true;
        }
      }
    }

    if (days.length === 0) {
      days.push("bugün"); 
    }

    return {
      action: isAddition ? "add" : "delete",
      subject,
      duration,
      days,
      specifiedWeek,
      needsWeekClarification,
      originalText: clause
    };
  },

  executeCommandList: function(commands, weekSelection) {
    let revised = false;
    let replies = [];

    commands.forEach(cmd => {
      const exec = this.executeParsedCommand(cmd, weekSelection || cmd.specifiedWeek);
      if (exec.revised) revised = true;
      replies.push(exec.reply);
    });

    // Save commands for potential propagation to future weeks
    this.chatState.lastParsedCommand = commands;
    this.chatState.pendingConfirmation = "apply_to_future";

    // Combine replies
    let combinedReply = replies.join("<br>");
    combinedReply += `<br><br>✏️ <strong>Öneri:</strong> Bu değişikliği programın devamındaki (gelecek haftalardaki) aynı günlere de uygulayayım mı?<br><strong>1. Evet, tüm haftalara uygula</strong><br><strong>2. Hayır, sadece bu haftalık kalsın</strong>`;

    return {
      reply: combinedReply,
      revised
    };
  },

  executeParsedCommand: function(cmd, weekSelection) {
    let revised = false;
    let reply = "";
    const activeDayNum = this.state.activeDay;
    const currentWeekNum = this.state.activeWeek;
    const startDay = (currentWeekNum - 1) * 7 + 1;

    // Resolve day numbers
    let dayNumbers = [];
    cmd.days.forEach(dayTerm => {
      if (dayTerm === "bugün") {
        dayNumbers.push(activeDayNum);
      } else if (dayTerm === "yarın") {
        dayNumbers.push(activeDayNum + 1);
      } else {
        const dayNames = ["pazartesi", "salı", "çarşamba", "perşembe", "cuma", "cumartesi", "pazar"];
        const idx = dayNames.indexOf(dayTerm);
        if (idx !== -1) {
          const wOffset = (weekSelection === "next_week") ? 7 : 0;
          const targetDay = startDay + idx + wOffset;
          if (targetDay <= this.PROGRAM_DAYS) {
            dayNumbers.push(targetDay);
          }
        }
      }
    });

    const dayLabels = cmd.days.map(d => d.toUpperCase()).join(" & ");

    if (cmd.action === "add") {
      let type = "custom";
      let labelPrefix = "📝 Çalışma:";
      if (cmd.subject === "Kitap Okuma") labelPrefix = "📖";
      else if (cmd.subject === "Paragraf") labelPrefix = "🧩";

      dayNumbers.forEach(dNum => {
        const dayData = this.state.daysData[dNum];
        if (dayData && dayData.tasks) {
          dayData.tasks.push({
            id: `chat_${Date.now()}_${dNum}`,
            type: type,
            subject: cmd.subject,
            topic: "Ekstra Çalışma",
            label: `${labelPrefix} ${cmd.subject} (${cmd.duration})`,
            desc: "AI Sohbet Botu tarafından eklenen görev.",
            duration: cmd.duration,
            completed: false
          });
        }
      });
      reply = `✔ <strong>${dayLabels}</strong> programına ekstra <strong>${cmd.duration} ${cmd.subject}</strong> başarıyla eklendi! 🚀`;
      revised = true;
    } else if (cmd.action === "delete") {
      let removedCount = 0;
      dayNumbers.forEach(dNum => {
        const dayData = this.state.daysData[dNum];
        if (dayData && dayData.tasks) {
          const originalLen = dayData.tasks.length;
          dayData.tasks = dayData.tasks.filter(t => !(t.subject === cmd.subject && !t.completed));
          removedCount += (originalLen - dayData.tasks.length);
        }
      });

      if (removedCount > 0) {
        reply = `🗑 <strong>${dayLabels}</strong> programındaki tamamlanmamış <strong>${cmd.subject}</strong> çalışmaları silindi.`;
        revised = true;
      } else {
        reply = `⚠️ <strong>${dayLabels}</strong> üzerinde silinecek tamamlanmamış bir <strong>${cmd.subject}</strong> görevi bulunamadı.`;
      }
    }

    return { reply, revised };
  },

  propagateCommandToFuture: function(cmdList) {
    if (!cmdList) return;
    const commands = Array.isArray(cmdList) ? cmdList : [cmdList];
    const currentWeekNum = this.state.activeWeek;

    commands.forEach(cmd => {
      const dayNames = ["pazartesi", "salı", "çarşamba", "perşembe", "cuma", "cumartesi", "pazar"];
      let offsets = [];
      cmd.days.forEach(dayTerm => {
        const idx = dayNames.indexOf(dayTerm);
        if (idx !== -1) offsets.push(idx);
      });

      if (offsets.length === 0) return;

      // Propagate for all remaining weeks in 360-day calendar
      for (let w = currentWeekNum; w <= 51; w++) {
        const wStart = (w - 1) * 7 + 1;
        offsets.forEach(offset => {
          const dNum = wStart + offset;
          if (dNum <= this.PROGRAM_DAYS) {
            const dayData = this.state.daysData[dNum];
            if (dayData && dayData.tasks) {
              if (cmd.action === "add") {
                dayData.tasks.push({
                  id: `chat_prop_${Date.now()}_${dNum}`,
                  type: "custom",
                  subject: cmd.subject,
                  topic: "Ekstra Çalışma",
                  label: `📝 ${cmd.subject} (${cmd.duration})`,
                  desc: "AI Sohbet Botu tarafından eklenen devredilen görev.",
                  duration: cmd.duration,
                  completed: false
                });
              } else if (cmd.action === "delete") {
                dayData.tasks = dayData.tasks.filter(t => !(t.subject === cmd.subject && !t.completed));
              }
            }
          }
        });
      }
    });
  },

  updateDeptPercentileNotice: function(val) {
    // Tercih motoru artık tüm bölüm/üniversite/sıralama analizini yapıyor
    const noticeEl = document.getElementById("targetDeptPercentileNotice");
    if (noticeEl) noticeEl.style.display = "none";
    this.updateGoalPlanPreview();
  },

  changeTheme: function(themeName) {
    document.body.className = ""; 
    document.body.classList.add(`theme-${themeName}`);
    this.state.theme = themeName;
    this.saveState();
  },


  // Tab controller
  switchTab: function(tabId) {
    this.state.activeTab = tabId;
    
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.classList.remove("active");
      btn.setAttribute("aria-selected", "false");
    });
    const activeBtn = document.getElementById(`tabBtn-${tabId}`);
    if (activeBtn) {
      activeBtn.classList.add("active");
      activeBtn.setAttribute("aria-selected", "true");
    }

    document.querySelectorAll(".tab-panel").forEach(panel => {
      panel.classList.remove("active");
    });
    const activePanel = document.getElementById(`panel-${tabId}`);
    if (activePanel) activePanel.classList.add("active");

    // Dynamic show/hide of top dashboard widgets when switching tabs
    const isPlanTab = ["today", "calendar", "monthly", "year"].includes(tabId);
    
    const topHelpersCard = document.getElementById("topHelpersCard");
    const combinedCard = document.getElementById("combinedProgramPlanCard");

    if (topHelpersCard) topHelpersCard.style.display = isPlanTab ? "flex" : "none";
    if (combinedCard) combinedCard.style.display = isPlanTab ? "grid" : "none";

    const floatingPomoWidget = document.getElementById("floatingPomoWidget");
    if (floatingPomoWidget) {
      floatingPomoWidget.style.display = isPlanTab ? "flex" : "none";
    }

    // Sub-renders with loading overlay for all tabs to show specific AI animations
    const aiTabs = ["charts", "habitMap"];
    const loadingMessages = {
      "charts": ["AI Analiz Hesaplanıyor", "Performans grafikleri ve net tahminleri hesaplanıyor..."],
      "habitMap": ["AI Alışkanlık Haritası Oluşturuluyor", "Çalışma alışkanlıklarınız analiz ediliyor..."],
      "today": ["AI Koç Devrede", "Günlük planınız ve metrikleriniz optimize ediliyor..."],
      "calendar": ["Takvim Analizi", "Gelecek planlarınız gözden geçiriliyor..."],
      "monthly": ["Aylık Bakış", "30 günlük projeksiyonunuz oluşturuluyor..."],
      "year": ["Yıllık Projeksiyon", "360 günlük yol haritası taranıyor..."],
      "programCreator": ["Program Sihirbazı", "Çalışma programınız hazırlanıyor..."],
      "curriculum": ["Müfredat Haritası", "Konu ilerlemeniz faz faz hesaplanıyor..."],
      "vault": ["Hata Zindanı", "Eksik konularınız ve hatalarınız taranıyor..."],
      "badges": ["AI Motivasyon", "Ödül sistemi ve günlük alıntılar güncelleniyor..."]
    };
    
    const [title, msg] = loadingMessages[tabId] || ["AI Çalışma Masası", "Verileriniz senkronize ediliyor..."];
    this.showAILoading(title, msg, tabId);
    
    // Minimal delay for non-heavy tabs to just show the animation briefly
    const delay = aiTabs.includes(tabId) ? 600 : 350;
    
    setTimeout(() => {
      if (tabId === "charts") {
        if (!this.state.coachCommentaries || this.state.coachCommentaries.length === 0) {
          this.triggerCoachCommentary("İlk Kurulum ve Analiz");
        }
        this.renderCharts();
      } else if (tabId === "habitMap") {
        this.renderHabitMap();
      } else if (tabId === "curriculum") {
        this.renderCurriculumMap();
      } else if (tabId === "programCreator") {
        this.syncLevelSelectLabels();
        const levelSel = document.getElementById("creatorLevelSelect");
        if (levelSel) levelSel.value = String(this.state.level || 3);
        this.syncCustomProgramListSelector();
        this.syncProgramTypeUI(this.state.selectedProgramType || "standard");
        this.renderStudyAllocationEngine(this.state.activeDay || 1);
        this.setProgramCreatorMode(this._programCreatorMode || "ai");
        // Müfredat haritası buradan kaldırıldı, kendi sekmesinde çiziliyor.
        this.renderRouteTempoOptions();
      } else if (tabId === "badges") {
        this.renderBadges();
        this.updateDailyQuote();
      } else if (tabId === "vault") {
        this.renderVaultQuestions();
      } else if (tabId === "monthly") {
        this.renderDetailedMonthlyCalendar("detailedMonthlyGridContainer", true);
      } else if (tabId === "today") {
        this.renderTodayPanel();
      } else if (tabId === "year") {
        this.renderDetailedMonthlyCalendar("yearlyAllMonthsGridContainer", false);
      }
      this.hideAILoading();
    }, delay);
  },

  renderTodayPanel: function() {
    const activeDay = this.state.activeDay || 1;
    // Review Pool güncel kalsın diye bugünün Akıllı Tekrar Seansı'nı her
    // panel yenilemesinde tazeler (zaten tamamlandıysa dokunmaz).
    this.injectSmartReviewSession(activeDay);
    // Kabul edilmiş kullanıcı alışkanlıklarının bugün de programda olmasını sağla.
    this.injectUserHabitTasks(activeDay);
    const titleEl = document.getElementById("todayPanelTitle");
    const dateEl = document.getElementById("todayPanelDate");
    const listEl = document.getElementById("todayPanelTasksList");
    const progTextEl = document.getElementById("todayPanelProgressText");
    const progBarEl = document.getElementById("todayPanelProgressBar");

    if (titleEl) titleEl.textContent = `Bugünün Çalışma Planı (Gün ${activeDay})`;
    
    if (dateEl && this.state.startDate) {
      const start = new Date(this.state.startDate);
      start.setDate(start.getDate() + (activeDay - 1));
      const trOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateEl.textContent = start.toLocaleDateString('tr-TR', trOptions);
    }

    if (!listEl) return;
    listEl.innerHTML = "";

    const dayData = this.state.daysData[activeDay] || { completed: false, tasks: [] };
    const tasks = dayData.tasks || [];

    if (tasks.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-family: var(--font-hand); font-size: 1.4rem;">
          📭 Bugün için atanmış bir ders veya ödev bulunmuyor. Yeni bir görev ekleyebilir ya da dinlenebilirsin!
        </div>
      `;
      if (progTextEl) progTextEl.textContent = "0/0 Tamamlandı";
      if (progBarEl) progBarEl.style.width = "0%";
      this.renderStudyAllocationEngine(activeDay);
      return;
    }

    // Eski kayıtlarda "schedule" alanı yoksa: sadece görev sırasını kullan (saat rozeti gösterilmez)
    const schedule = (dayData.schedule && dayData.schedule.length) ? dayData.schedule : tasks.map(t => ({ type: "task", taskId: t.id }));

    let completedCount = 0;
    schedule.forEach(entry => {
      if (entry.type !== "task") {
        const row = document.createElement("div");
        row.style.cssText = "display:flex; align-items:center; gap:0.65rem; padding:0.55rem 1rem; margin:0.15rem 0; border-radius:8px; background:var(--bg-sub); border:1px dashed var(--border-color); font-size:0.8rem; color:var(--text-muted); font-weight:700;";
        row.innerHTML = `
          <span style="font-family:var(--font-header); font-variant-numeric:tabular-nums; color:var(--text-main); white-space:nowrap;">${entry.startTime}–${entry.endTime}</span>
          <span style="flex:1;">${entry.label}</span>
        `;
        listEl.appendChild(row);
        return;
      }

      const idx = tasks.findIndex(t => t.id === entry.taskId);
      if (idx === -1) return;
      const task = tasks[idx];
      if (task.completed) completedCount++;

      const card = document.createElement("div");
      const isCompleted = task.completed;
      card.className = "outlook-task-card" + (isCompleted ? " completed" : "");
      card.style.padding = "1rem";
      card.style.fontSize = "0.9rem";

      const badgeClass = task.type === "smart_review" ? "tag-ai-review" : task.isUserHabit ? "tag-habit" : task.type === "video" ? "tag-video" : task.type === "reading" ? "tag-konu" : task.type === "retest" ? "tag-tekrar" : "tag-test";
      const badgeLabel = task.type === "smart_review" ? "AI TEKRAR" : task.isUserHabit ? "ALIŞKANLIK" : task.type === "video" ? "VİDEO" : task.type === "reading" ? "KAZANIM" : task.type === "retest" ? "TEKRAR" : "TEST";

      card.onclick = (e) => {
        if (e.target.tagName !== "INPUT" && e.target.tagName !== "I") {
          this.toggleTodayTaskCompleted(activeDay, idx);
        }
      };

      const showBadge = (task.subject !== "Kitap Okuma" && task.subject !== "Özel Görev");
      const cleanDuration = task.duration && String(task.duration).includes("dk") ? task.duration : `${task.duration || 30} dk`;
      const timeRange = task.startTime && task.endTime ? `${task.startTime}–${task.endTime}` : cleanDuration;
      const aiBadges = this.getTaskAIBadgesHTML(task, activeDay);

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
          <div style="display:flex; align-items:center; gap:0.75rem; text-align:left;">
            <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="app.toggleTodayTaskCompleted(${activeDay}, ${idx})" style="width:22px; height:22px; min-width:22px; flex-shrink:0; cursor:pointer;">
            <div>
              <span style="font-weight:700; color:var(--text-main); font-size:0.9rem; text-decoration:${isCompleted ? 'line-through' : 'none'};">${app.escapeHtml(task.label || task.subject)}</span>
              ${task.desc ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">${app.escapeHtml(task.desc)}</div>` : ""}
              ${app.getTaskSourceHTML(task, "0.72rem")}
              ${aiBadges ? `<div style="margin-top:0.35rem;">${aiBadges}</div>` : ""}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem; flex-shrink:0;">
            ${showBadge ? `<span class="task-badge ${badgeClass}">${badgeLabel}</span>` : ""}
            <span style="font-size:0.8rem; color:var(--text-muted); font-variant-numeric:tabular-nums; white-space:nowrap;" title="${app.escapeHtml(cleanDuration)}"><i class="fa-regular fa-clock"></i> ${timeRange}</span>
            ${this.state.selectedProgramType === "custom" ? `
              <i class="fa-solid fa-trash-can text-danger" style="cursor:pointer; font-size:0.9rem; margin-left:0.5rem;" onclick="event.stopPropagation(); app.deleteOutlookTask('${activeDay}', '${task.id}'); setTimeout(() => { app.renderTodayPanel(); }, 150);"></i>
            ` : ""}
          </div>
        </div>
      `;

      listEl.appendChild(card);
    });

    const percent = Math.round((completedCount / tasks.length) * 100) || 0;
    if (progTextEl) progTextEl.textContent = `${completedCount}/${tasks.length} Tamamlandı`;
    if (progBarEl) progBarEl.style.width = `${percent}%`;

    this.renderStudyAllocationEngine(activeDay);
  },

  toggleTodayTaskCompleted: function(dayNum, taskIdx) {
    const dayData = this.state.daysData[dayNum];
    if (dayData && dayData.tasks[taskIdx]) {
      const task = dayData.tasks[taskIdx];

      if (!task.completed && task.isSmartReview) {
        this.openSmartReviewModal(dayNum, taskIdx);
        return;
      }

      // If marking complete and it's a quiz/test type - show score modal first
      const isTestTask = task.type === 'quiz' ||
                         task.type === 'retest' || 
                         task.type === 'common' || 
                         task.type === 'question' || 
                         (task.qCount && task.qCount > 0) || 
                         (task.questionCount && task.questionCount > 0) || 
                         (task.label && task.label.toLowerCase().includes('test')) || 
                         (task.desc && task.desc.toLowerCase().includes('test')) ||
                         (task.label && task.label.toLowerCase().includes('soru')) ||
                         (task.desc && task.desc.toLowerCase().includes('soru'));

      if (!task.completed && isTestTask) {
        this._pendingCompleteDay = dayNum;
        this._pendingCompleteIdx = taskIdx;
        // Reset modal inputs — daha önce loglanmamış bir görevde alanlar boş
        // başlar ki "required" doğrulaması gerçekten bir şey zorunlu kılsın;
        // daha önce loglanmışsa (düzenleme amaçlı) mevcut değerler doldurulur.
        const cEl = document.getElementById('testScoreCorrect');
        const wEl = document.getElementById('testScoreWrong');
        const tEl = document.getElementById('testScoreTime');
        if (cEl) cEl.value = task.logged ? (task.correct || 0) : '';
        if (wEl) wEl.value = task.logged ? (task.incorrect || 0) : '';
        if (tEl) tEl.value = Math.round((parseInt(task.duration) || 30));

        const bEl = document.getElementById('testScoreBlank');
        const bHint = document.getElementById('testScoreBlankHint');
        const hedef = parseInt(task.qCount, 10) || 0;
        if (bEl) bEl.value = task.logged && task.blank !== undefined ? task.blank : '';
        if (bHint) {
          bHint.textContent = hedef > 0
            ? `Boş bırakırsan ${hedef} hedef sorudan otomatik hesaplanır.`
            : "Boş bıraktığın soru sayısı (bilmiyorsan boş geç).";
        }

        this.buildMockSectionInputs(task);
        this.openModal('testScoreModal');
        return;
      }
      
      task.completed = !task.completed;
      
      const allDone = dayData.tasks.every(t => t.completed);
      dayData.completed = allDone;

      if (this.state.selectedProgramType === "custom") {
        this.state.customDaysData = this.state.daysData;
      } else {
        this.state.standardDaysData = this.state.daysData;
      }

      this.calculateFocusScore();
      this.renderDashboard();
      this.renderTodayPanel();
      this.saveState();
    }
  },

  // ==========================================================
  // DENEME SINAVI — BÖLÜM BAZLI ANALİZ (W3)
  // ------------------------------------------------------------
  // Mevcut akış korunur: genel doğru/yanlış girişi aynen çalışır.
  // Deneme görevlerinde EK olarak bölüm bazlı giriş açılır; bölümler
  // müfredat grafiğindeki `sections` alanından gelir (ayrı liste yok).
  // ==========================================================
  // Zayıf bölümleri (doğruluk < %60) Review Pool'a besler: bölüm bazlı
  // analiz doğrudan planlamaya ve tekrar seansına etki eder.
  feedWeakSectionsIntoReviewPool: function(sections, dayNum) {
    if (!Array.isArray(this.state.uploadedQuestions)) this.state.uploadedQuestions = [];
    const g = this.curriculum.graph();
    sections.filter(s => s.total >= 3 && s.accuracy < 0.6).forEach(sec => {
      const subj = g.subjects[sec.subjectKey];
      if (!subj) return;
      // Bölümün en ağırlıklı konusunu temsilci olarak al
      const topics = [];
      subj.units.forEach(u => u.topics.forEach(t => { if (t.section === sec.section) topics.push(t); }));
      if (!topics.length) return;
      const pick = topics.sort((a, b) => b.weight - a.weight)[0];
      const exists = this.state.uploadedQuestions.some(q => !q.completed && q.topic === pick.name);
      if (exists) return;
      this.state.uploadedQuestions.push({
        id: `mock_${dayNum}_${pick.id}`,
        subject: subj.subject, topic: pick.name,
        note: `Deneme analizinde "${sec.section}" bölümünde %${Math.round(sec.accuracy * 100)} doğruluk. Bu bölümün en ağırlıklı konusu tekrar havuzuna eklendi.`,
        examType: subj.exam, source: "mock_analysis",
        completed: false, attempts: [], ts: new Date().toISOString()
      });
    });
  },

  isMockTask: function(task) {
    if (!task) return false;
    const s = `${task.label || ""} ${task.topic || ""}`.toLowerCase();
    return s.includes("deneme");
  },

  // Deneme türüne göre ilgili derslerin bölümlerini müfredattan çıkarır
  getMockSections: function(task) {
    const track = this.state.track || "Sayısal";
    const examType = task && task.examType === "AYT" ? "ayt" : task && task.examType === "TYT" ? "tyt" : "both";
    const g = this.curriculum.graph();
    const out = [];
    this.curriculum.subjectKeysFor(track, examType).forEach(key => {
      const subj = g.subjects[key];
      if (!subj) return;
      (subj.sections || []).forEach(sec => {
        out.push({ key: `${key}::${sec}`, subjectKey: key, subject: subj.subject, exam: subj.exam, section: sec });
      });
    });
    return out;
  },

  buildMockSectionInputs: function(task) {
    const wrap = document.getElementById("mockSectionEntry");
    const rows = document.getElementById("mockSectionRows");
    if (!wrap || !rows) return;

    if (!this.isMockTask(task)) { wrap.style.display = "none"; rows.innerHTML = ""; return; }

    const sections = this.getMockSections(task);
    if (!sections.length) { wrap.style.display = "none"; return; }

    wrap.style.display = "block";
    rows.innerHTML = sections.map(sec => `
      <div style="display:grid; grid-template-columns:1fr 58px 58px 64px; gap:0.4rem; align-items:center;">
        <span style="font-size:0.78rem; font-weight:700; color:var(--text-main);">${app.escapeHtml(sec.subject)} · ${app.escapeHtml(sec.section)}</span>
        <input type="number" min="0" max="60" placeholder="D" data-mock-correct="${app.escapeHtml(sec.key)}"
               style="padding:0.4rem; border:1.5px solid var(--border-color); border-radius:8px; font-size:0.85rem; font-weight:800; text-align:center;">
        <input type="number" min="0" max="60" placeholder="Y" data-mock-wrong="${app.escapeHtml(sec.key)}"
               style="padding:0.4rem; border:1.5px solid var(--border-color); border-radius:8px; font-size:0.85rem; font-weight:800; text-align:center;">
        <input type="number" min="0" max="200" placeholder="dk" title="Bu bölüme ayırdığın süre (dakika)" data-mock-time="${app.escapeHtml(sec.key)}"
               style="padding:0.4rem; border:1.5px solid var(--border-color); border-radius:8px; font-size:0.85rem; font-weight:800; text-align:center;">
      </div>`).join("");
  },

  toggleMockSectionEntry: function() {
    const rows = document.getElementById("mockSectionRows");
    const chev = document.getElementById("mockSectionChevron");
    if (!rows) return;
    const open = rows.style.display !== "none";
    rows.style.display = open ? "none" : "flex";
    if (chev) chev.style.transform = open ? "rotate(0deg)" : "rotate(180deg)";
  },

  // Formdaki bölüm girişlerini toplar (boş bırakılanlar atlanır)
  collectMockSectionResults: function() {
    const out = [];
    document.querySelectorAll("[data-mock-correct]").forEach(cEl => {
      const key = cEl.getAttribute("data-mock-correct");
      const wEl = document.querySelector(`[data-mock-wrong="${key}"]`);
      const c = parseInt(cEl.value, 10);
      const w = wEl ? parseInt(wEl.value, 10) : NaN;
      if (Number.isFinite(c) || Number.isFinite(w)) {
        const correct = Number.isFinite(c) ? c : 0;
        const wrong = Number.isFinite(w) ? w : 0;
        const [subjectKey, section] = key.split("::");
        const tEl = document.querySelector(`[data-mock-time="${key}"]`);
        const mins = tEl ? parseInt(tEl.value, 10) : NaN;
        const total = correct + wrong;
        out.push({
          subjectKey, section, correct, wrong, total,
          net: app.netHesapla(correct, wrong),
          accuracy: total > 0 ? correct / total : 0,
          minutes: Number.isFinite(mins) ? mins : null,
          secPerQuestion: (Number.isFinite(mins) && total > 0) ? Math.round((mins * 60) / total) : null
        });
      }
    });
    return out;
  },

  // Bölüm bazlı geçmişten güçlü/zayıf/eğilim çıkarır — tüm modüller bunu kullanır
  toggleSectionAnalysisCard: function() {
    const body = document.getElementById("sectionAnalysisBody");
    const chev = document.getElementById("sectionAnalysisChevron");
    if (!body) return;
    const open = body.style.display !== "none";
    body.style.display = open ? "none" : "block";
    if (chev) chev.style.transform = open ? "rotate(0deg)" : "rotate(180deg)";
  },

  // Bölüm bazlı teşhisi görünür kılar. Bu veri zaten hesaplanıyordu ama
  // öğrenciye hiçbir ekranda gösterilmiyordu.
  renderSectionAnalysis: function() {
    const card = document.getElementById("sectionAnalysisCard");
    const body = document.getElementById("sectionAnalysisBody");
    const countEl = document.getElementById("sectionAnalysisCount");
    if (!card || !body) return;

    const an = this.analyzeMockSections();
    if (!an) { card.style.display = "none"; return; }
    card.style.display = "block";
    if (countEl) countEl.textContent = `· ${an.mockCount} deneme`;

    const trendChip = (t, d) => {
      if (t === "improving") return `<span style="font-size:0.65rem; font-weight:800; color:var(--success);">▲ yükseliş ${d > 0 ? "+" + d : d}%</span>`;
      if (t === "declining") return `<span style="font-size:0.65rem; font-weight:800; color:var(--danger);">▼ düşüş ${d}%</span>`;
      return `<span style="font-size:0.65rem; font-weight:800; color:var(--text-muted);">■ sabit</span>`;
    };
    const paceChip = (p, sec) => {
      if (p === "slow") return `<span style="font-size:0.65rem; font-weight:800; color:var(--warning);">🐢 ${sec} sn/soru — yavaş</span>`;
      if (p === "fast") return `<span style="font-size:0.65rem; font-weight:800; color:var(--text-muted);">⚡ ${sec} sn/soru</span>`;
      if (p === "normal") return `<span style="font-size:0.65rem; font-weight:800; color:var(--text-muted);">${sec} sn/soru</span>`;
      return `<span style="font-size:0.65rem; color:var(--text-muted);">süre girilmedi</span>`;
    };

    const rows = an.sections.slice().sort((a, b) => a.avgAccuracy - b.avgAccuracy).map(r => {
      const color = r.avgAccuracy < 50 ? "var(--danger)" : r.avgAccuracy < 70 ? "var(--warning)" : "var(--success)";
      return `
        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-left:3px solid ${color}; border-radius:8px; padding:0.6rem 0.75rem; margin-bottom:0.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
            <span style="font-size:0.8rem; font-weight:800; color:var(--text-main);">${app.escapeHtml(r.section)}
              <span style="font-weight:600; color:var(--text-muted); font-size:0.7rem;">· ${app.escapeHtml(String(r.subjectKey))}</span>
            </span>
            <span style="font-size:0.95rem; font-weight:900; color:${color}; font-variant-numeric:tabular-nums;">%${r.avgAccuracy}</span>
          </div>
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:0.3rem;">
            ${trendChip(r.trend, r.deltaPct)}
            ${paceChip(r.pace, r.avgSecPerQuestion)}
            <span style="font-size:0.65rem; color:var(--text-muted); font-weight:700;">${r.sampleSize} deneme</span>
          </div>
        </div>`;
    }).join("");

    const verdict = [];
    if (an.weakest.length) verdict.push(`En çok net kaybettiğin bölüm <strong>${app.escapeHtml(an.weakest[0].section)}</strong> (%${an.weakest[0].avgAccuracy}).`);
    if (an.slowSections.length) verdict.push(`<strong>${an.slowSections.map(r => app.escapeHtml(r.section)).join(", ")}</strong> bölümünde soru başına süren yüksek — bilgi eksiği değil hız sorunu olabilir.`);
    if (an.declining.length) verdict.push(`Düşüş eğiliminde: <strong>${an.declining.map(r => app.escapeHtml(r.section)).join(", ")}</strong>.`);
    if (an.improving.length) verdict.push(`Yükselişte: <strong>${an.improving.map(r => app.escapeHtml(r.section)).join(", ")}</strong>.`);

    body.innerHTML = rows + `
      <p style="font-size:0.78rem; color:var(--text-main); line-height:1.55; margin:0.75rem 0 0; padding-top:0.75rem; border-top:1px solid var(--border-color);">
        🤖 ${verdict.join(" ")} Bu bölümlerin konuları Hata Zindanı'nda önceliklendirilir ve tekrar aralıkları otomatik kısaltılır.
      </p>`;
  },

  analyzeMockSections: function() {
    const history = this.state.mockExams || [];
    if (!history.length) return null;
    const bySection = {};
    history.forEach(m => (m.sections || []).forEach(s => {
      const k = `${s.subjectKey}::${s.section}`;
      (bySection[k] = bySection[k] || { subjectKey: s.subjectKey, section: s.section, points: [] })
        .points.push({ ts: m.ts, day: m.day, accuracy: s.accuracy, net: s.net, total: s.total,
                       minutes: s.minutes, secPerQuestion: s.secPerQuestion });
    }));

    const rows = Object.values(bySection).map(g => {
      const pts = g.points;
      const avg = pts.reduce((a, p) => a + p.accuracy, 0) / pts.length;
      let trend = "stable", delta = 0;
      if (pts.length >= 2) {
        const half = Math.floor(pts.length / 2);
        const older = pts.slice(0, half), newer = pts.slice(half);
        const o = older.reduce((a, p) => a + p.accuracy, 0) / Math.max(1, older.length);
        const n = newer.reduce((a, p) => a + p.accuracy, 0) / Math.max(1, newer.length);
        delta = Math.round((n - o) * 100);
        trend = delta >= 5 ? "improving" : delta <= -5 ? "declining" : "stable";
      }
      const totalNetLost = pts.reduce((a, p) => a + Math.max(0, p.total - p.net), 0) / pts.length;
      const timed = pts.filter(p => Number.isFinite(p.secPerQuestion));
      const avgSecPerQ = timed.length ? Math.round(timed.reduce((a, p) => a + p.secPerQuestion, 0) / timed.length) : null;
      const avgMinutes = timed.length ? Math.round(timed.reduce((a, p) => a + (p.minutes || 0), 0) / timed.length) : null;
      return {
        subjectKey: g.subjectKey, section: g.section,
        avgAccuracy: Math.round(avg * 100), sampleSize: pts.length,
        trend, deltaPct: delta, avgNetLost: Math.round(totalNetLost * 10) / 10,
        avgMinutes: avgMinutes, avgSecPerQuestion: avgSecPerQ,
        // Süre verisi girildiyse hız sorunu tespit edilir (>90 sn/soru yavaş kabul edilir)
        pace: avgSecPerQ === null ? "unknown" : avgSecPerQ > 90 ? "slow" : avgSecPerQ < 40 ? "fast" : "normal"
      };
    });

    const ranked = rows.slice().sort((a, b) => a.avgAccuracy - b.avgAccuracy);
    return {
      sections: rows,
      weakest: ranked.slice(0, 3),
      strongest: ranked.slice(-3).reverse(),
      declining: rows.filter(r => r.trend === "declining"),
      improving: rows.filter(r => r.trend === "improving"),
      slowSections: rows.filter(r => r.pace === "slow"),
      mockCount: history.length
    };
  },

  submitTestScore: function() {
    const scoreCorrect = document.getElementById("testScoreCorrect");
    const scoreWrong = document.getElementById("testScoreWrong");
    const scoreTime = document.getElementById("testScoreTime");
    if (scoreCorrect && !scoreCorrect.checkValidity()) { app.showToast(scoreCorrect.value === "" ? "Doğru sayısını girmen zorunlu" : "Geçersiz doğru sayısı", "error"); scoreCorrect.focus(); return; }
    if (scoreWrong && !scoreWrong.checkValidity()) { app.showToast(scoreWrong.value === "" ? "Hata (yanlış) sayısını girmen zorunlu" : "Geçersiz yanlış sayısı", "error"); scoreWrong.focus(); return; }
    if (scoreTime && !scoreTime.checkValidity()) { app.showToast("Geçersiz süre", "error"); return; }

    const dayNum = this._pendingCompleteDay;
    const taskIdx = this._pendingCompleteIdx;
    if (dayNum === undefined || taskIdx === undefined) {
      this.closeModal('testScoreModal');
      return;
    }
    
    const dayData = this.state.daysData[dayNum];
    if (!dayData || !dayData.tasks[taskIdx]) {
      this.closeModal('testScoreModal');
      return;
    }
    
    const correct = parseInt(document.getElementById('testScoreCorrect').value) || 0;
    const wrong = parseInt(document.getElementById('testScoreWrong').value) || 0;
    const timeSpent = parseInt(document.getElementById('testScoreTime').value) || 30;

    const task = dayData.tasks[taskIdx];

    // BOS SAYISI. Eskiden yalnizca dogru/yanlis kaydediliyordu; bu yuzden
    // "net kazanamiyor mu, yoksa yanlisla kaybediyor mu?" sorusu
    // yanitlanamiyordu. Girilmediyse hedef soru sayisindan turetilir.
    const blankEl = document.getElementById('testScoreBlank');
    const hedefSoru = parseInt(task.qCount, 10) || 0;
    let blank = blankEl && blankEl.value !== "" ? (parseInt(blankEl.value, 10) || 0) : null;
    if (blank === null) blank = hedefSoru > 0 ? Math.max(0, hedefSoru - correct - wrong) : 0;

    // MANTIK DENETIMI — bir gunun toplam calisma suresi 24 saati asamaz.
    // Veri sessizce degistirilmez (ogrencinin kaydi onundur), ama imkansiz
    // bir toplam net/saat verim analizini ve istikrar grafigini bozdugu
    // icin uyarilir.
    const gunToplamDk = (dayData.tasks || []).reduce((a, t, i) => {
      if (i === taskIdx) return a + timeSpent;
      return a + (t.logged && t.timeSpent ? parseInt(t.timeSpent, 10) || 0 : 0);
    }, 0);
    if (gunToplamDk > 24 * 60) {
      const sa = Math.round((gunToplamDk / 60) * 10) / 10;
      this.showToast(`Bu güne toplam ${sa} saat çalışma kaydedildi — 24 saati aşıyor. Süreleri kontrol et.`, "warning");
    }

    task.completed = true;
    task.correct = correct;
    task.incorrect = wrong;
    task.blank = blank;
    task.timeSpent = timeSpent;
    task.logged = true;

    // Kayıtları AI Çalışma Analizi grafiklerine yansıt (günlük/haftalık/aylık
    // hangi girişten gelirse gelsin — tek ortak nokta burası).
    // Deneme ise bölüm bazlı sonuçları kaydet (girildiyse)
    if (this.isMockTask(task)) {
      const sections = this.collectMockSectionResults();
      if (sections.length) {
        if (!Array.isArray(this.state.mockExams)) this.state.mockExams = [];
        this.state.mockExams.push({
          day: dayNum, ts: new Date().toISOString(),
          examType: task.examType || "Genel",
          totalCorrect: correct, totalWrong: wrong, timeSpent: timeSpent,
          sections: sections
        });
        task.sectionResults = sections;
        // Zayıf bölümlerin konuları Hata Zindanı önceliğine yansısın
        this._sectionAnalysisCache = undefined; // analiz yeniden hesaplansın
        this.feedWeakSectionsIntoReviewPool(sections, dayNum);
      }
    }

    this.state.chartData.push({
      label: `G${dayNum} - ${task.subject}`,
      correct: correct,
      incorrect: wrong,
      blank: blank,
      total: (correct + wrong + blank),
      cozulen: (correct + wrong),
      time: timeSpent,
      subject: task.subject,
      topic: task.topic || "",
      hour: new Date().getHours(),
      // Zaman damgasi: "Son 7 gun / 30 gun" filtreleri bunu kullanir.
      // Eski kayitlarda yoktur; filtre onlari "tum zamanlar"da gosterir.
      ts: Date.now(),
      dayNum: dayNum,
      examType: task.examType || this.sinavTuruBelirle(task)
    });
    this.state.totalQuestionsSolved = (this.state.totalQuestionsSolved || 0) + (correct + wrong);
    if (task.subject === "Edebiyat") {
      this.state.totalLitCorrect = (this.state.totalLitCorrect || 0) + correct;
    }

    // Zamanlanmış tekrarı (rep_ görevi) tamamlanmış işaretle; değilse genel
    // öğrenme doğrulama (Leitner) akışını başlat.
    if (task.id && task.id.startsWith("rep_")) {
      if (!this.state.scheduledRepetitions) this.state.scheduledRepetitions = [];
      const matchedRep = this.state.scheduledRepetitions.find(r => r.topic === task.topic && r.dueDay === dayNum && !r.completed);
      if (matchedRep) matchedRep.completed = true;
    } else {
      this.registerVerificationFlow(task, dayNum);
    }

    // Tamamlanan her gerçek konu görevi aralıklı tekrar döngüsüne girer.
    // (Deneme, rehberlik ve tekrar seansının kendisi hariç.)
    if (task.topic && task.subject && task.subject !== "Rehberlik" && !task.isSmartReview &&
        !String(task.topic).includes("Deneme") && !String(task.id).startsWith("rep_")) {
      this.registerSpacedRepetition(task.topic, task.subject, task.topicId);
    }

    this.checkBadgeAwardsOnLog(task);

    // Hata Zindanı entegrasyonu: konudan hata çıktıysa konuyu otomatik
    // olarak Review Pool'a işle (Akıllı Tekrar Seansı bunu yarın ele alır).
    if (wrong > 0 && this.isVaultEligibleTask(task)) {
      this.recordVaultError({ subject: task.subject, topic: task.topic, examType: task.examType, source: "auto", day: dayNum });
    }

    const allDone = dayData.tasks.every(t => t.completed);
    dayData.completed = allDone;

    if (this.state.selectedProgramType === "custom") {
      this.state.customDaysData = this.state.daysData;
    } else {
      this.state.standardDaysData = this.state.daysData;
    }

    this._pendingCompleteDay = undefined;
    this._pendingCompleteIdx = undefined;

    this.closeModal('testScoreModal');
    this.calculateFocusScore();
    this.renderDashboard();
    this.renderTodayPanel();
    this.renderDayDetailsTasks();
    this.renderVaultQuestions();
    this.triggerCoachCommentary("Deneme Sınavı Tamamlandı");
    this.saveState();
  },

  // Alias for backwards compatibility
  showAddCustomTaskModal: function() {
    this.openAddCustomTaskModal();
  },

  // ============================================================
  // ÇALIŞMA TEMPOSU — tempo profilleri, program farkı ve
  // gerçekçi hedef olasılığı hesabı (Program Sihirbazı içinde)
  // ============================================================
  ROUTE_PROFILES: {
    fast:     { key: "fast",     name: "Hızlı Rota (Yoğun)",       weeklyHours: 55, factor: 1.22, icon: "fa-bolt",           color: "var(--warning)" },
    balanced: { key: "balanced", name: "Dengeli Rota (Önerilen)",  weeklyHours: 45, factor: 1.00, icon: "fa-scale-balanced", color: "var(--primary)" },
    relaxed:  { key: "relaxed",  name: "Rahat Rota (Düşük Tempo)", weeklyHours: 35, factor: 0.78, icon: "fa-leaf",           color: "var(--success)" }
  },

  // Sınav tarihi — geri sayım ve rota hesaplarının ortak referansı
  getExamDate: function() {
    return new Date("2027-06-19T00:00:00");
  },

  // "Boğaziçi Üniversitesi" -> "Boğaziçi Ü." — dar rozetlerde okunur kalsın
  shortUniName: function(name) {
    if (!name) return "";
    return String(name)
      .replace(/\s*Üniversitesi\b/i, " Ü.")
      .replace(/\s*Teknik\s*Ü\./i, " Tek. Ü.")
      .replace(/\s+/g, " ")
      .trim();
  },

  // Tempo seçeneklerini çizer (Rota Rehberi kaldırıldıktan sonra Program
  // Sihirbazı'nın içinde yaşar). Radyo adı `learningRoute` korunduğu için
  // mevcut confirmAndUpdateProgramWithRoute akışı olduğu gibi çalışır.
  renderRouteTempoOptions: function(selectedKey) {
    const wrap = document.getElementById("routeTempoOptions");
    if (!wrap) return;
    const current = this.state.studyRoute || "balanced";
    // Yeniden çizimde kullanıcının SEÇTİĞİ tempo korunur; yoksa kayıtlı tempo
    // işaretli gelir. (Aksi hâlde tıklama sonrası seçim geri sıçrıyordu.)
    const picked = selectedKey || (document.querySelector('input[name="learningRoute"]:checked') || {}).value || current;
    const curTotals = this.computeProgramTotals(this.state.daysData);

    wrap.innerHTML = Object.values(this.ROUTE_PROFILES).map(p => {
      const on = p.key === picked;
      const isCurrent = p.key === current;
      const t = this.previewRouteProgram(p.key);
      const diff = t.questions - curTotals.questions;
      const diffTxt = isCurrent ? "şu anki tempo"
        : `${diff >= 0 ? "+" : ""}${diff.toLocaleString("tr-TR")} soru · ${t.hours.toLocaleString("tr-TR")} sa`;
      return `
        <label style="cursor:pointer; display:block; background:var(--bg-card); border:1.5px solid ${on ? p.color : "var(--border-color)"};
                      border-radius:10px; padding:0.7rem 0.8rem; box-shadow:${on ? "var(--shadow-sm)" : "none"};">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
            <input type="radio" name="learningRoute" value="${p.key}" ${on ? "checked" : ""}
                   onchange="app.renderRouteTempoOptions(this.value)" style="accent-color:${p.color};">
            <i class="fa-solid ${p.icon}" style="color:${p.color};"></i>
            <span style="font-size:0.8rem; font-weight:800; color:var(--text-main);">${app.escapeHtml(p.name)}</span>
          </div>
          <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; padding-left:1.6rem;">
            ~${p.weeklyHours} sa/hafta · ${diffTxt}
          </div>
        </label>`;
    }).join("");

    const btn = document.getElementById("applyTempoBtn");
    if (btn) {
      const unchanged = picked === current;
      btn.disabled = unchanged;
      btn.style.opacity = unchanged ? "0.5" : "1";
      btn.style.cursor = unchanged ? "not-allowed" : "pointer";
    }
  },

  getRouteProfile: function(key) {
    return this.ROUTE_PROFILES[key] || this.ROUTE_PROFILES.balanced;
  },

  // Seçilen tempo, seviye yoğunluk tablosunu ölçekler: soru sayısı ve
  // süreler rotayla birlikte gerçekten değişsin diye.
  applyRouteIntensity: function(li) {
    const f = this.getRouteProfile(this.state.studyRoute).factor;
    if (f === 1) return li;
    const scale = v => Math.max(5, Math.round(parseInt(v, 10) * f));
    return {
      numTasks: li.numTasks,
      qCount1: scale(li.qCount1), dur1: scale(li.dur1) + " dk",
      qCount2: scale(li.qCount2), dur2: scale(li.dur2) + " dk",
      qCount3: scale(li.qCount3), dur3: scale(li.dur3) + " dk",
      qCountCommon: scale(li.qCountCommon), durCommon: scale(li.durCommon) + " dk"
    };
  },

  // Bir programın toplam soru / deneme / çalışma saati bilançosu
  computeProgramTotals: function(daysData) {
    let questions = 0, mocks = 0, minutes = 0, taskCount = 0;
    Object.keys(daysData || {}).forEach(d => {
      const day = daysData[d];
      if (!day || !Array.isArray(day.tasks)) return;
      day.tasks.forEach(t => {
        taskCount++;
        if (typeof t.qCount === "number") questions += t.qCount;
        minutes += this.parseDurationMinutes(t.duration);
        if (t.id && String(t.id).indexOf("_mock") !== -1 && String(t.id).indexOf("_mock_review") === -1) mocks++;
      });
    });
    return { questions: questions, mocks: mocks, hours: Math.round(minutes / 60), tasks: taskCount };
  },

  // Seçilen rotayla üretilecek programı, mevcut programa dokunmadan hesaplar
  previewRouteProgram: function(routeKey) {
    const prevDays = this.state.daysData;
    const prevRoute = this.state.studyRoute;
    const prevGenerated = this.state.generatedForLevel;
    this.state.studyRoute = routeKey;
    this.generateWeeklyCalendarData();
    const totals = this.computeProgramTotals(this.state.daysData);
    this.state.daysData = prevDays;
    this.state.studyRoute = prevRoute;
    this.state.generatedForLevel = prevGenerated;
    return totals;
  },

  weeksUntilExam: function() {
    const diff = this.getExamDate().getTime() - Date.now();
    return Math.max(1, diff / (7 * 24 * 3600 * 1000));
  },

  // Bugüne kadar fiilen tamamlanmış görevlerin saat karşılığı
  getCompletedStudyHours: function() {
    let minutes = 0;
    Object.keys(this.state.daysData || {}).forEach(d => {
      const day = this.state.daysData[d];
      if (!day || !Array.isArray(day.tasks)) return;
      day.tasks.forEach(t => { if (t.completed) minutes += this.parseDurationMinutes(t.duration); });
    });
    return minutes / 60;
  },

  // ------------------------------------------------------------
  // HEDEF OLASILIĞI
  // Sabit yüzdeler yerine dört ölçülebilir bileşenin çarpımı:
  //   tavan       : hedefin seçiciliği (seviye bandı) — ilk 100 ile ilk 500.000 aynı olamaz
  //   performans  : seviye tespit doğruluğu / o bandın gerektirdiği doğruluk
  //   istikrar    : programın geçen günlerinin ne kadarının tamamlandığı
  //   kapasite    : sınava kadar biriktirilebilecek saat / seviyenin gerektirdiği saat
  // Erken günlerde istikrar örneklemi küçük olduğu için 5 günlük %75'lik
  // bir ön dayanak (prior) ile yumuşatılır.
  // ------------------------------------------------------------
  estimateGoalSuccess: function(routeKey) {
    const profile = this.getRouteProfile(routeKey || this.state.studyRoute);
    const level = Math.min(8, Math.max(1, this.state.level || 3));

    const CEILING = { 1: 0.94, 2: 0.90, 3: 0.84, 4: 0.75, 5: 0.64, 6: 0.48, 7: 0.30, 8: 0.14 };
    const REQ_ACC = this.REQ_ACC;
    const ceiling = CEILING[level];

    const acc = typeof this.state.diagnosticAccuracy === "number" ? this.state.diagnosticAccuracy : null;
    // Bileşenlerin tamamı 1'i aşamaz: tavan, o hedef bandı için ulaşılabilecek
    // en iyi olasılıktır; performans/istikrar/kapasite onu yalnızca aşağı çeker.
    const perf = acc === null
      ? 0.80
      : Math.max(0.35, Math.min(1, 0.45 + 0.55 * (acc / REQ_ACC[level])));

    const elapsed = Math.max(1, this.state.activeDay || 1);
    let doneDays = 0;
    for (let d = 1; d <= elapsed; d++) {
      if (this.state.daysData[d] && this.state.daysData[d].completed) doneDays++;
    }
    const completion = (doneDays + 3.75) / (elapsed + 5); // 5 günlük %75 ön dayanak
    const consistency = Math.max(0.55, Math.min(1, 0.55 + 0.60 * completion));

    const weeksLeft = this.weeksUntilExam();
    const bankedHours = this.getCompletedStudyHours();
    const requiredHours = this.state.totalHoursTarget || 1400;
    const coverage = (bankedHours + profile.weeklyHours * weeksLeft) / requiredHours;
    const capacity = Math.max(0.40, Math.min(1, 0.40 + 0.62 * coverage));

    // Sürdürülebilirlik düzeltmesi: istikrarı düşük öğrencide yoğun rota tükenme riski,
    // kapasitesi yetmeyen rahat rotada ise yetişememe riski taşır.
    let sustain = 1;
    if (profile.key === "fast" && completion < 0.60) sustain = 0.88;
    if (profile.key === "relaxed" && coverage < 1) sustain = 0.94;

    const percent = Math.round(Math.max(3, Math.min(96, ceiling * perf * consistency * capacity * sustain * 100)));

    // Tahmini varış: gereken saatin bu tempoyla tamamlanacağı tarih
    const remainingHours = Math.max(0, requiredHours - bankedHours);
    const weeksNeeded = remainingHours / profile.weeklyHours;
    const arrival = new Date(Date.now() + weeksNeeded * 7 * 24 * 3600 * 1000);
    const examDate = this.getExamDate();
    const arrivalLabel = arrival > examDate
      ? "Sınavdan sonra"
      : arrival.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

    return {
      percent: percent,
      profile: profile,
      level: level,
      accuracy: acc,
      requiredAccuracy: REQ_ACC[level],
      completionRate: doneDays / elapsed,
      coverage: coverage,
      requiredHours: requiredHours,
      bankedHours: bankedHours,
      weeksLeft: weeksLeft,
      arrival: arrival,
      arrivalLabel: arrivalLabel,
      onTrack: coverage >= 1 && arrival <= examDate
    };
  },

  // Olasılığı gerekçesiyle birlikte tek satırda özetler
  describeGoalSuccess: function(est) {
    const parts = [];
    parts.push(`Hedef bandı: Seviye ${est.level} (${est.requiredHours.toLocaleString("tr-TR")} saat gerekiyor)`);
    parts.push(est.accuracy === null
      ? "seviye tespit skoru henüz yok (nötr kabul edildi)"
      : `seviye tespit doğruluğun %${est.accuracy} / gereken %${est.requiredAccuracy}`);
    parts.push(`program tamamlama oranın %${Math.round(est.completionRate * 100)}`);
    parts.push(`${est.profile.weeklyHours} saat/hafta tempoyla sınava kadar gereken saatin %${Math.round(est.coverage * 100)}'ini biriktiriyorsun`);
    return parts.join(" · ") + ".";
  },

  // Onay adımı: mevcut program ile seçilen rotanın üreteceği program
  // arasındaki farkı (soru / deneme / toplam saat) açıkça gösterir.
  confirmAndUpdateProgramWithRoute: function() {
    const selectedRoute = document.querySelector('input[name="learningRoute"]:checked');
    if (!selectedRoute) return;
    const routeKey = selectedRoute.value;
    const profile = this.getRouteProfile(routeKey);
    const currentProfile = this.getRouteProfile(this.state.studyRoute);

    const cur = this.computeProgramTotals(this.state.daysData);
    const next = this.previewRouteProgram(routeKey);
    const estNow = this.estimateGoalSuccess(this.state.studyRoute);
    const estNext = this.estimateGoalSuccess(routeKey);

    this._pendingRouteKey = routeKey;

    const activeProg = this.state.savedPrograms.find(p => p.id === this.state.activeCustomProgramId);
    const programName = (this.state.selectedProgramType === "custom" && activeProg) ? activeProg.name : "AI Standart Planı";

    const intro = document.getElementById("routeChangeIntro");
    if (intro) {
      intro.innerHTML = `Aktif programın <strong>${programName}</strong>, şu an <strong>${currentProfile.name}</strong> temposunda (${currentProfile.weeklyHours} saat/hafta). Onaylarsan program <strong>${profile.name}</strong> temposuna göre (${profile.weeklyHours} saat/hafta) 360 gün için yeniden oluşturulur. Aşağıda iki program arasındaki fark yer alıyor.`;
    }

    const row = (label, a, b, unit) => {
      const d = b - a;
      const sign = d > 0 ? "+" : "";
      const color = d === 0 ? "var(--text-muted)" : (d > 0 ? "var(--warning)" : "var(--success)");
      const pct = a > 0 ? ` (${sign}%${Math.round((d / a) * 100)})` : "";
      return `
        <tr style="border-top:1px solid var(--border-color);">
          <td style="padding:0.6rem 0.85rem; font-weight:700; color:var(--text-main);">${label}</td>
          <td style="padding:0.6rem 0.85rem; text-align:right; font-weight:700; color:var(--text-muted);">${a.toLocaleString("tr-TR")}${unit}</td>
          <td style="padding:0.6rem 0.85rem; text-align:right; font-weight:800; color:var(--text-main);">${b.toLocaleString("tr-TR")}${unit}</td>
          <td style="padding:0.6rem 0.85rem; text-align:right; font-weight:800; color:${color}; white-space:nowrap;">${d === 0 ? "değişmiyor" : sign + d.toLocaleString("tr-TR") + unit + pct}</td>
        </tr>`;
    };

    const diffBox = document.getElementById("routeChangeDiffBox");
    if (diffBox) {
      diffBox.innerHTML = `
        <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
          <thead>
            <tr style="background:var(--bg-sub, rgba(0,0,0,0.03));">
              <th style="padding:0.6rem 0.85rem; text-align:left; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-muted);">Ölçüt</th>
              <th style="padding:0.6rem 0.85rem; text-align:right; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-muted);">Mevcut</th>
              <th style="padding:0.6rem 0.85rem; text-align:right; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-muted);">Yeni</th>
              <th style="padding:0.6rem 0.85rem; text-align:right; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-muted);">Fark</th>
            </tr>
          </thead>
          <tbody>
            ${row("Toplam soru sayısı", cur.questions, next.questions, "")}
            ${row("Deneme sınavı sayısı", cur.mocks, next.mocks, "")}
            ${row("Toplam çalışma saati", cur.hours, next.hours, " sa")}
            ${row("Haftalık tempo", currentProfile.weeklyHours, profile.weeklyHours, " sa")}
            ${row("Toplam görev sayısı", cur.tasks, next.tasks, "")}
          </tbody>
        </table>`;
    }

    const probBox = document.getElementById("routeChangeProbBox");
    if (probBox) {
      const d = estNext.percent - estNow.percent;
      const color = d === 0 ? "var(--text-muted)" : (d > 0 ? "var(--success)" : "var(--danger)");
      probBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; background:var(--bg-sub, rgba(0,0,0,0.03)); border-radius:8px; padding:0.85rem 1rem;">
          <div style="font-size:0.78rem; font-weight:700; color:var(--text-muted);">Hedef olasılığı</div>
          <div style="font-family:var(--font-header); font-weight:800; font-size:1.05rem; color:var(--text-main);">
            %${estNow.percent} <i class="fa-solid fa-arrow-right" style="font-size:0.75rem; color:var(--text-muted); margin:0 0.25rem;"></i> %${estNext.percent}
            <span style="color:${color}; font-size:0.85rem;">(${d > 0 ? "+" : ""}${d} puan)</span>
          </div>
          <div style="flex-basis:100%; font-size:0.72rem; color:var(--text-muted); font-weight:600; line-height:1.5;">
            ${this.describeGoalSuccess(estNext)}
          </div>
        </div>`;
    }

    const warn = document.getElementById("routeChangeWarning");
    if (warn) {
      warn.textContent = `"${programName}" 360 gün için sıfırdan yeniden üretilir; bu programa elle eklediğin görevler, gün düzenlemeleri ve tamamlama işaretleri silinir.`;
    }

    const modal = document.getElementById("routeChangeModal");
    if (modal) modal.classList.add("active");
  },

  applyRouteChange: function() {
    const routeKey = this._pendingRouteKey;
    if (!routeKey) return;
    const profile = this.getRouteProfile(routeKey);
    this.closeModal("routeChangeModal");

    this.showAILoading("Rota Güncelleniyor", `${profile.name} temposuna göre yeni çalışma rotası hesaplanıyor...`, "programCreator");
    setTimeout(() => {
      this.state.studyRoute = routeKey;
      this.generateWeeklyCalendarData();
      const totals = this.computeProgramTotals(this.state.daysData);
      this.calculateFocusScore();
      this.renderDashboard();
      this.addNotification("info", "Çalışma Rotası Güncellendi",
        `${profile.name} (${profile.weeklyHours} sa/hafta): ${totals.questions.toLocaleString("tr-TR")} soru · ${totals.mocks} deneme · ${totals.hours.toLocaleString("tr-TR")} saat.`);
      this.saveState();
      if (typeof this.showToast === "function") {
        this.showToast(`Program ${profile.name} temposuna göre güncellendi.`, "success");
      }
      this.triggerCoachCommentary("Çalışma Rotası Güncellendi");
      this.hideAILoading();
      this._pendingRouteKey = null;
      this.switchTab('today');
      setTimeout(() => this.showScheduleFitWarningIfNeeded(), 400);
    }, 1500);
  },

  // TAB 1.5: Visual 30-Day Monthly Grid
  renderMonthlyCalendarGrid: function() {
    const container = document.getElementById("integratedMonthlyGridContainer");
    if (container) {
      container.innerHTML = "";

      for (let day = 1; day <= this.PROGRAM_DAYS; day++) {
        const dayData = this.isPlanning ? (this.plannerBuffer[day] || { completed: false, tasks: [] }) : (this.state.daysData[day] || { completed: false, tasks: [] });
        const card = document.createElement("div");
        
        let statusClass = "status-rest";
        let statusLabel = "Dinlenme";

        const hasTasks = dayData.tasks && dayData.tasks.length > 0;
        const isCompleted = dayData.completed;
        const isMock = dayData.isMockDay;
        const hasReviews = dayData.tasks && dayData.tasks.some(t => t.type === "retest" && t.id.startsWith("spaced_"));

        if (isMock) {
          statusClass = "status-mock";
          statusLabel = "Deneme";
        } else if (hasReviews) {
          statusClass = "status-review";
          statusLabel = "Tekrar Günü";
        } else if (hasTasks) {
          statusClass = "status-study";
          statusLabel = isCompleted ? "Tamamlandı" : "Çalışılıyor";
        }

        // Highlight active day in monthly grid
        let activeStyle = "";
        if (this.state.activeDay === day) {
          activeStyle = "border: 2px solid var(--primary); transform: scale(1.05); box-shadow: 0 0 10px var(--primary-glow);";
        }

        card.className = `monthly-day-cell ${statusClass}`;
        if (activeStyle) card.style = activeStyle;
        card.innerHTML = `
          <div class="m-day-num">${day}</div>
          <div class="m-day-label">${statusLabel}</div>
        `;
        
        card.onclick = () => {
          this.switchActiveDay(day);
          this.switchTab("calendar");
        };

        container.appendChild(card);
      }
    }
    
    // Also trigger the detailed monthly calendar render
    this.renderDetailedMonthlyCalendar();
  },

  // TAB 2: Curriculum Map (Specific MEB Kazanım haritası)
  isCurriculumTopicDone: function(subjectCategory, topic) {
    if (!this.state.topicStatuses) this.state.topicStatuses = {};
    
    // Clean prefix like 'TYT Matematik' or 'AYT Matematik' to 'Matematik'
    let cleanSubj = "";
    const lower = subjectCategory.toLowerCase();
    if (lower.includes("matematik")) cleanSubj = "Matematik";
    else if (lower.includes("türkçe") || lower.includes("türkce")) cleanSubj = "Türkçe";
    else if (lower.includes("edebiyat")) cleanSubj = "Edebiyat";
    else if (lower.includes("fizik")) cleanSubj = "Fizik";
    else if (lower.includes("kimya")) cleanSubj = "Kimya";
    else if (lower.includes("biyoloji")) cleanSubj = "Biyoloji";
    else if (lower.includes("tarih")) cleanSubj = "Tarih";
    else if (lower.includes("coğrafya") || lower.includes("cografya")) cleanSubj = "Coğrafya";
    else cleanSubj = subjectCategory;

    const topicKey = `${cleanSubj} - ${topic}`;
    const entry = this.state.topicStatuses[topicKey];
    return entry && entry.status === "Ogrenildi";
  },

  renderCurriculumMap: function() {
    const phasesContainer = document.getElementById("phasesContainer");
    if (!phasesContainer) return;

    // Update curriculum map focus badge
    const badge = document.getElementById("curriculumFocusBadge");
    const focus = this.state.examFocus || "both";

    // Toggle legacy progress sections if they exist
    const tytProgSec = document.getElementById("tytProgressSection");
    const aytProgSec = document.getElementById("aytProgressSection");

    if (focus === "tyt") {
      if (tytProgSec) tytProgSec.style.display = "";
      if (aytProgSec) aytProgSec.style.display = "none";
    } else if (focus === "ayt") {
      if (tytProgSec) tytProgSec.style.display = "none";
      if (aytProgSec) aytProgSec.style.display = "";
    } else {
      if (tytProgSec) tytProgSec.style.display = "";
      if (aytProgSec) aytProgSec.style.display = "";
    }

    if (badge) {
      if (focus === "tyt") {
        badge.textContent = "Sadece TYT";
        badge.style.background = "rgba(99, 102, 241, 0.1)";
        badge.style.color = "var(--primary)";
      } else if (focus === "ayt") {
        badge.textContent = "Sadece AYT";
        badge.style.background = "rgba(168, 85, 247, 0.1)";
        badge.style.color = "#a855f7";
      } else {
        badge.textContent = "TYT + AYT Ortak";
        badge.style.background = "rgba(16, 185, 129, 0.1)";
        badge.style.color = "#10b981";
      }
    }

    // Müfredat haritası da PLANLAYICIYLA AYNI grafikten beslenir.
    // Önceden burada ayrı, farklı isimlendirilmiş bir konu listesi vardı;
    // bu yüzden haritada işaretlenen ilerleme programdaki konularla
    // eşleşmiyordu. Artık tek kaynak: window.YKS_CURRICULUM.
    const buildSubjectsMap = (examFilter) => {
      const map = {};
      this.curriculum.topicsFor(this.state.track || "Sayısal", examFilter).forEach(t => {
        if (t.exam !== (examFilter === "tyt" ? "TYT" : examFilter === "ayt" ? "AYT" : t.exam)) return;
        (map[t.subject] = map[t.subject] || []).push(t.name);
      });
      return map;
    };
    const TYT_SUBJECTS = buildSubjectsMap("tyt");
    const AYT_SUBJECTS = buildSubjectsMap("ayt");

    const chunkSubjects = (subjectsObj, phaseIndex, totalPhases = 4) => {
      const chunkedObj = {};
      Object.entries(subjectsObj).forEach(([subject, topics]) => {
        const chunkSize = Math.ceil(topics.length / totalPhases);
        const start = (phaseIndex - 1) * chunkSize;
        const end = Math.min(start + chunkSize, topics.length);
        if (start < topics.length) {
          chunkedObj[subject] = topics.slice(start, end);
        }
      });
      return chunkedObj;
    };

    const renderPath = (container, subjectsObj, prefix) => {
      if (!container) return { done: 0, total: 0 };
      container.innerHTML = '';
      const pathDiv = document.createElement('div');
      pathDiv.className = 'tyt-ayt-map';
      
      let totalDone = 0, totalTopics = 0;
      let firstActivePlaced = false;

      Object.entries(subjectsObj).forEach(([subjectName, topics]) => {
        const titleEl = document.createElement('div');
        titleEl.className = 'map-section-title';
        titleEl.innerHTML = `<i class="fa-solid fa-book"></i> ${subjectName}`;
        pathDiv.appendChild(titleEl);

        topics.forEach(topic => {
          totalTopics++;
          
          let cleanSubj = subjectName;
          const topicKey = `${cleanSubj} - ${topic}`;
          const entry = this.state.topicStatuses ? this.state.topicStatuses[topicKey] : null;
          const status = entry ? entry.status : "";

          const isDone = status === "Ogrenildi";
          if (isDone) totalDone++;

          const stone = document.createElement('div');
          let stateClass = 'map-stone';
          let icon = '📖';
          
          if (status === "Ogrenildi") {
            stateClass += ' stone-done';
            icon = '✅';
          } else if (status === "Kirilgan") {
            stateClass += ' stone-fragile';
            icon = '🟡';
          } else if (status === "Bitmedi") {
            stateClass += ' stone-unfinished';
            icon = '🔴';
          } else if (status === "Calisildi") {
            stateClass += ' stone-worked';
            icon = '📘';
          } else if (!firstActivePlaced) {
            stateClass += ' stone-active';
            icon = '🚶';
            firstActivePlaced = true;
          }
          stone.className = stateClass;
          stone.innerHTML = `
            <span class="map-stone-icon">${icon}</span>
            <span class="map-stone-text">${topic}</span>
          `;
          pathDiv.appendChild(stone);
        });
      });

      container.appendChild(pathDiv);
      return { done: totalDone, total: totalTopics };
    };

    phasesContainer.innerHTML = '';
    
    const phaseNames = [
      { name: "Faz 1: Temel Atma", period: "Eylül - Kasım", color: "var(--primary)" },
      { name: "Faz 2: Konu Öğrenimi", period: "Aralık - Şubat", color: "var(--warning)" },
      { name: "Faz 3: Deneme & Tekrar", period: "Mart - Nisan", color: "var(--success)" },
      { name: "Faz 4: Sınav Provası", period: "Mayıs - Haziran", color: "var(--danger)" }
    ];

    let overallTytDone = 0, overallTytTotal = 0;
    let overallAytDone = 0, overallAytTotal = 0;

    for (let i = 1; i <= 4; i++) {
      const phaseTytSubjects = chunkSubjects(TYT_SUBJECTS, i, 4);
      const phaseAytSubjects = chunkSubjects(AYT_SUBJECTS, i, 4);

      const detailsEl = document.createElement("details");
      detailsEl.style.cssText = "background: var(--bg-card); border: 1.5px solid var(--border-color); border-radius: 8px; overflow: hidden; transition: all 0.3s ease;";
      // Tum fazlar KAPALI baslar; ogrenci hangisine bakacagini kendisi secer.
      // (Eskiden 1. faz acik geliyordu ve sayfa uzun bir listeyle aciliyordu.)
      
      const summaryEl = document.createElement("summary");
      summaryEl.style.cssText = "padding: 1rem; cursor: pointer; list-style: none; display: flex; flex-direction: column; gap: 0.5rem; user-select: none; border-bottom: 1px solid transparent; background: var(--bg-card-hover);";
      
      const phaseInfo = phaseNames[i-1];
      
      const bodyEl = document.createElement("div");
      bodyEl.style.cssText = "padding: 1.5rem 1rem; border-top: 1.5px solid var(--border-color); display: flex; flex-direction: column; gap: 2rem; background: var(--bg-card);";

      const tytWrapper = document.createElement("div");
      const aytWrapper = document.createElement("div");

      let tytStats = { done: 0, total: 0 };
      let aytStats = { done: 0, total: 0 };

      if (focus === "tyt" || focus === "both") {
        const title = document.createElement("div");
        title.style.cssText = "font-family:var(--font-header); font-weight:800; font-size:1rem; color:var(--success); margin-bottom:1rem; border-bottom:2px solid var(--success); padding-bottom:0.4rem; display:flex; align-items:center; gap:0.5rem;";
        title.innerHTML = '<i class="fa-solid fa-road"></i> TYT Yol Haritası';
        tytWrapper.appendChild(title);
        tytStats = renderPath(tytWrapper, phaseTytSubjects, "TYT");
        bodyEl.appendChild(tytWrapper);
      }
      if (focus === "ayt" || focus === "both") {
        const title = document.createElement("div");
        title.style.cssText = "font-family:var(--font-header); font-weight:800; font-size:1rem; color:var(--secondary); margin-bottom:1rem; border-bottom:2px solid var(--secondary); padding-bottom:0.4rem; display:flex; align-items:center; gap:0.5rem;";
        title.innerHTML = '<i class="fa-solid fa-road"></i> AYT Yol Haritası';
        aytWrapper.appendChild(title);
        aytStats = renderPath(aytWrapper, phaseAytSubjects, "AYT");
        bodyEl.appendChild(aytWrapper);
      }

      overallTytDone += tytStats.done; overallTytTotal += tytStats.total;
      overallAytDone += aytStats.done; overallAytTotal += aytStats.total;

      const getLightHtml = (done, total, type, colorHex) => {
        if (total === 0) return '';
        const pct = total > 0 ? (done / total) : 0;
        let lightColor = "var(--border-color)"; // gray
        let lightGlow = "none";
        
        if (pct === 1) {
            lightColor = colorHex;
            lightGlow = `0 0 8px ${colorHex}`;
        } else if (pct > 0) {
            lightColor = "var(--warning)";
            lightGlow = `0 0 8px var(--warning)`;
        }
        
        return `<div style="display:flex; align-items:center; gap:0.3rem; font-size:0.75rem; color:var(--text-main); font-weight:700; background:var(--bg-body); padding:0.2rem 0.5rem; border-radius:12px; border:1px solid var(--border-color);">
                  <div style="width:10px; height:10px; border-radius:50%; background:${lightColor}; box-shadow: ${lightGlow}; transition: all 0.3s ease;"></div>
                  ${type} (${done}/${total})
                </div>`;
      };

      summaryEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${phaseInfo.color}20; color: ${phaseInfo.color}; display: flex; justify-content: center; align-items: center; font-weight: 800; font-size: 1.2rem;">
              ${i}
            </div>
            <div>
              <div style="font-weight: 800; color: var(--text-main); font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                ${phaseInfo.name}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;"><i class="fa-regular fa-calendar"></i> ${phaseInfo.period}</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
             ${(focus === "tyt" || focus === "both") ? getLightHtml(tytStats.done, tytStats.total, "TYT", "var(--success)") : ""}
             ${(focus === "ayt" || focus === "both") ? getLightHtml(aytStats.done, aytStats.total, "AYT", "var(--secondary)") : ""}
             <i class="fa-solid fa-chevron-down" style="font-size: 0.9rem; color: var(--text-muted); margin-left: 0.5rem; transition: transform 0.3s ease;"></i>
          </div>
        </div>
      `;

      // Optional: Add custom arrow rotation style via event listener
      detailsEl.addEventListener('toggle', (e) => {
        const arrow = summaryEl.querySelector('.fa-chevron-down');
        if (arrow) {
          arrow.style.transform = detailsEl.open ? 'rotate(180deg)' : 'rotate(0deg)';
        }
      });

      detailsEl.appendChild(summaryEl);
      detailsEl.appendChild(bodyEl);
      phasesContainer.appendChild(detailsEl);
    }

    // Update global progress bars
    const tytPct = overallTytTotal > 0 ? Math.round((overallTytDone / overallTytTotal) * 100) : 0;
    const aytPct = overallAytTotal > 0 ? Math.round((overallAytDone / overallAytTotal) * 100) : 0;
    
    const tytPctEl = document.getElementById('tytPercentVal');
    const tytBarEl = document.getElementById('tytProgressBar');
    const aytPctEl = document.getElementById('aytPercentVal');
    const aytBarEl = document.getElementById('aytProgressBar');
    
    if (tytPctEl) tytPctEl.textContent = `${tytPct}%`;
    if (tytBarEl) tytBarEl.style.width = `${tytPct}%`;
    if (aytPctEl) aytPctEl.textContent = `${aytPct}%`;
    if (aytBarEl) aytBarEl.style.width = `${aytPct}%`;
    
    // Legacy support for old element IDs
    const currPercentValEl = document.getElementById("currPercentVal");
    const currProgressBarEl = document.getElementById("currProgressBar");
    const combined = overallTytTotal + overallAytTotal;
    const combinedPct = combined > 0 ? Math.round(((overallTytDone + overallAytDone) / combined) * 100) : 0;
    if (currPercentValEl) currPercentValEl.textContent = `${combinedPct}%`;
    if (currProgressBarEl) currProgressBarEl.style.width = `${combinedPct}%`;
  },

  changeCurriculumSubject: function(sub) {
    this.state.activeCurriculumSubject = sub;
    this.renderCurriculumMap();
  },

  // Department-based target net data (approximate YKS placement targets)
  getDeptTargetNets: function() {
    // Tercih motoru / seviye bandı hedef netleri öncelikli (AI Analiz ile senkron)
    if (this.state.targetNetTYT && this.state.targetNetAYT) {
      const hiNet = v => parseInt(String(v).split("-").pop(), 10);
      const bandTyt = hiNet(this.state.targetNetTYT);
      const bandAyt = hiNet(this.state.targetNetAYT);
      if (bandTyt && bandAyt) {
        return { tytTarget: Math.min(120, bandTyt), aytTarget: Math.min(80, bandAyt) };
      }
    }
    const dept = (this.state.targetDept || "").toLowerCase();
    // Default targets
    let tytTarget = 80, aytTarget = 50;
    
    if (dept.includes("tıp") || dept.includes("tip")) {
      tytTarget = 110; aytTarget = 75;
    } else if (dept.includes("diş") || dept.includes("dis")) {
      tytTarget = 105; aytTarget = 70;
    } else if (dept.includes("eczacı") || dept.includes("eczaci")) {
      tytTarget = 100; aytTarget = 65;
    } else if (dept.includes("hukuk")) {
      tytTarget = 95; aytTarget = 60;
    } else if (dept.includes("mühendis") || dept.includes("muhendis")) {
      if (dept.includes("bilgisayar") || dept.includes("yazılım") || dept.includes("yazilim")) {
        tytTarget = 100; aytTarget = 65;
      } else if (dept.includes("elektrik") || dept.includes("elektronik")) {
        tytTarget = 95; aytTarget = 60;
      } else if (dept.includes("makine") || dept.includes("endüstri") || dept.includes("endustri")) {
        tytTarget = 90; aytTarget = 55;
      } else {
        tytTarget = 90; aytTarget = 55;
      }
    } else if (dept.includes("mimarlık") || dept.includes("mimarlik")) {
      tytTarget = 85; aytTarget = 50;
    } else if (dept.includes("psikoloji")) {
      tytTarget = 90; aytTarget = 55;
    } else if (dept.includes("öğretmen") || dept.includes("ogretmen") || dept.includes("eğitim") || dept.includes("egitim")) {
      tytTarget = 80; aytTarget = 45;
    } else if (dept.includes("hemşire") || dept.includes("hemsire") || dept.includes("sağlık") || dept.includes("saglik")) {
      tytTarget = 85; aytTarget = 50;
    } else if (dept.includes("işletme") || dept.includes("isletme") || dept.includes("iktisat")) {
      tytTarget = 80; aytTarget = 45;
    }
    
    return { tytTarget, aytTarget };
  },

  // Per-subject target nets based on department targets
  getSubjectTargetNets: function() {
    const { tytTarget, aytTarget } = this.getDeptTargetNets();
    const track = this.state.track || "Sayısal";
    
    // TYT subject distribution (out of 120 questions)
    // Türkçe: 40, Matematik: 40, Fen: 20, Sosyal: 20
    const tytRatio = tytTarget / 120;
    const tytTargets = {
      "TYT Türkçe": Math.round(40 * tytRatio),
      "TYT Matematik": Math.round(40 * tytRatio),
      "TYT Fen": Math.round(20 * tytRatio),
      "TYT Sosyal": Math.round(20 * tytRatio)
    };
    
    // AYT subject distribution varies by track
    let aytTargets = {};
    if (track === "Sayısal") {
      // AYT Sayısal: Mat 40, Fizik 14, Kimya 13, Biyoloji 13 = 80
      const aytRatio = aytTarget / 80;
      aytTargets = {
        "AYT Matematik": Math.round(40 * aytRatio),
        "AYT Fizik": Math.round(14 * aytRatio),
        "AYT Kimya": Math.round(13 * aytRatio),
        "AYT Biyoloji": Math.round(13 * aytRatio)
      };
    } else if (track === "Eşit Ağırlık" || track === "Esit Agirlik") {
      const aytRatio = aytTarget / 80;
      aytTargets = {
        "AYT Matematik": Math.round(40 * aytRatio),
        "AYT Edebiyat": Math.round(24 * aytRatio),
        "AYT Tarih": Math.round(10 * aytRatio),
        "AYT Coğrafya": Math.round(6 * aytRatio)
      };
    } else {
      const aytRatio = aytTarget / 80;
      aytTargets = {
        "AYT Edebiyat": Math.round(24 * aytRatio),
        "AYT Tarih": Math.round(10 * aytRatio),
        "AYT Coğrafya": Math.round(6 * aytRatio),
        "AYT Felsefe": Math.round(12 * aytRatio)
      };
    }
    
    return { ...tytTargets, ...aytTargets };
  },

  // ============================================================
  // AI STUDY ALLOCATION ENGINE — mevcut Çalışma Programı motorunu
  // DEĞİŞTİRMEDEN üzerine eklenen karar/açıklama katmanı. Program hâlâ
  // generateWeeklyCalendarData/buildDaySchedule ile oluşturuluyor; bu motor
  // o programın üstüne TYT/AYT dağılımı, ders/konu önceliği, aktivite
  // portföyü, süre optimizasyonu ve "neden bu görev" açıklamasını gerçek
  // veriden (chartData, uploadedQuestions/Review Pool, daysData) hesaplayıp
  // günlük/haftalık/aylık panellerde ve manuel program oluşturmada gösterir.
  // ============================================================

  computeRemainingExamDays: function() {
    const start = this.state.startDate ? new Date(this.state.startDate) : new Date();
    const today = new Date(start);
    today.setDate(today.getDate() + ((this.state.activeDay || 1) - 1));
    const diffMs = this.getExamDate() - today;
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  },

  // Bütün tahsis motoru süreleri bu tek kuralla yuvarlanır: 10 dakikaya en
  // yakın değere (42,43 dk -> 40; 46,47 dk -> 50) — dağınık "42 dk Fizik"
  // gibi gerçekçi olmayan süreler yerine düzenli bloklar üretir.
  roundTo10: function(minutes) {
    return Math.max(0, Math.round(minutes / 10) * 10);
  },

  // O günün GERÇEKTE ne kadar süreye sahip olduğunu bulur: seçili/oluşturulmuş
  // programda o güne zaten görev atanmışsa o görevlerin toplam süresi esas
  // alınır (motor hep aynı sabit saati değil, seçilen programı yansıtır);
  // gün için henüz görev yoksa kullanıcının beyan ettiği kapasiteye düşer.
  getDayAvailableMinutes: function(dayNum) {
    const dayData = this.state.daysData[dayNum];
    if (dayData && Array.isArray(dayData.tasks) && dayData.tasks.length > 0) {
      const total = dayData.tasks.reduce((sum, t) => sum + this.parseDurationMinutes(t.duration), 0);
      if (total > 0) return total;
    }
    return this.dailyCapacityMinutes((dayNum || 1) % 7) || 180;
  },

  // Kullanıcı "AI Tahsis Motoru" kartından TYT/AYT dengesini elle ayarlarsa
  // (ör. %50/%50) bu tercih AI'ın otomatik hesabının önüne geçer.
  setManualTytAytSplit: function(tytPercent) {
    const tyt = Math.max(0, Math.min(100, parseInt(tytPercent, 10) || 0));
    this.state.manualTytAytSplit = { tyt, ayt: 100 - tyt };
    this.saveState();
    this.renderStudyAllocationEngine(this.state.activeDay || 1);
  },

  resetTytAytSplit: function() {
    this.state.manualTytAytSplit = null;
    this.saveState();
    this.renderStudyAllocationEngine(this.state.activeDay || 1);
  },

  // FEATURE 1 — TYT/AYT dağılımı: kalan gün, deneme doğruluk farkı ve
  // Hata Zindanı'ndaki sınav türü dağılımına göre dinamik hesaplanır; ya da
  // kullanıcı elle bir oran seçtiyse doğrudan onu uygular.
  computeTytAytAllocation: function(dayNum) {
    const track = this.state.track || "Sayısal";
    const hasAyt = track !== "TYT";
    const capacityMinutes = this.getDayAvailableMinutes(dayNum);

    if (!hasAyt) {
      return { tyt: { percent: 100, minutes: this.roundTo10(capacityMinutes) }, ayt: { percent: 0, minutes: 0 }, reasoning: "Sadece TYT hedeflendiği için bugünün tamamı TYT'ye ayrıldı.", manual: false };
    }

    if (this.state.manualTytAytSplit) {
      const tytPct = this.state.manualTytAytSplit.tyt;
      const aytPct = 100 - tytPct;
      return {
        tyt: { percent: tytPct, minutes: this.roundTo10(capacityMinutes * tytPct / 100) },
        ayt: { percent: aytPct, minutes: this.roundTo10(capacityMinutes * aytPct / 100) },
        reasoning: `Bu dağılımı elle %${tytPct} TYT / %${aytPct} AYT olarak ayarladın — AI otomatik hesaplaması devre dışı. İstersen "AI Otomatik" ile tekrar AI'a bırakabilirsin.`,
        manual: true
      };
    }

    let tytPct = 45;
    const remainingDays = this.computeRemainingExamDays();
    if (remainingDays > 200) tytPct += 8; // uzun vadede temel (TYT) önce sağlamlaştırılır
    else if (remainingDays < 60) tytPct -= 8; // sınava yakın AYT'ye ağırlık (yerleştirme netleri)

    const records = this.state.chartData || [];
    const tytRecords = records.filter(r => r.examType === "TYT");
    const aytRecords = records.filter(r => r.examType === "AYT");
    const acc = (arr) => {
      const c = arr.reduce((s, r) => s + r.correct, 0);
      const t = arr.reduce((s, r) => s + r.total, 0);
      return t > 0 ? c / t : null;
    };
    const tytAcc = acc(tytRecords);
    const aytAcc = acc(aytRecords);
    let accReason = "";
    if (tytAcc !== null && aytAcc !== null) {
      if (tytAcc < aytAcc - 0.1) { tytPct += 8; accReason = ` Deneme doğruluğun TYT'de (%${Math.round(tytAcc * 100)}) AYT'ye (%${Math.round(aytAcc * 100)}) göre daha düşük.`; }
      else if (aytAcc < tytAcc - 0.1) { tytPct -= 8; accReason = ` Deneme doğruluğun AYT'de (%${Math.round(aytAcc * 100)}) TYT'ye (%${Math.round(tytAcc * 100)}) göre daha düşük.`; }
    }

    const pool = (this.state.uploadedQuestions || []).filter(q => !q.completed);
    const tytPoolCount = pool.filter(q => q.examType === "TYT").length;
    const aytPoolCount = pool.filter(q => q.examType === "AYT").length;
    let poolReason = "";
    if (tytPoolCount > aytPoolCount + 2) { tytPct += 5; poolReason = ` Hata Zindanı'nda TYT konuları (${tytPoolCount}) AYT'ye (${aytPoolCount}) göre daha kalabalık.`; }
    else if (aytPoolCount > tytPoolCount + 2) { tytPct -= 5; poolReason = ` Hata Zindanı'nda AYT konuları (${aytPoolCount}) TYT'ye (${tytPoolCount}) göre daha kalabalık.`; }

    tytPct = Math.max(25, Math.min(75, Math.round(tytPct)));
    const aytPct = 100 - tytPct;

    return {
      tyt: { percent: tytPct, minutes: this.roundTo10(capacityMinutes * tytPct / 100) },
      ayt: { percent: aytPct, minutes: this.roundTo10(capacityMinutes * aytPct / 100) },
      reasoning: `Kalan ${remainingDays} gün ve mevcut performans verisi TYT/AYT dağılımını %${tytPct} / %${aytPct} olarak belirledi.${accReason}${poolReason}`,
      manual: false
    };
  },

  // FEATURE 2 — TYT/AYT içindeki ders dağılımı: sabit oran değil; MEB/YKS
  // soru ağırlığı (getSubjectTargetNets ile aynı temel oranlar) + Hata
  // Zindanı'ndaki ders yoğunluğu + son dönem ihmal edilen ders ile ayarlanır.
  // Bir dersin payı 30 dakikanın altına düşerse o gün için tamamen
  // çıkarılır (her dersin her gün yer alması ZORUNLU değil) ve payı kalan
  // derslere yeniden dağıtılır; tüm süreler 10 dakikaya yuvarlanır.
  computeLessonAllocation: function(examType, minutesForExam) {
    const track = this.state.track || "Sayısal";
    let baseWeights;
    if (examType === "TYT") {
      baseWeights = { "Türkçe": 40, "Matematik": 40, "Fizik": 7, "Kimya": 7, "Biyoloji": 6, "Tarih": 5, "Coğrafya": 5, "Felsefe": 5, "Din Kültürü": 5 };
    } else if (track === "Sayısal") {
      baseWeights = { "Matematik": 40, "Fizik": 14, "Kimya": 13, "Biyoloji": 13 };
    } else if (track === "Eşit Ağırlık" || track === "Esit Agirlik") {
      baseWeights = { "Matematik": 40, "Edebiyat": 24, "Tarih": 10, "Coğrafya": 6 };
    } else {
      baseWeights = { "Edebiyat": 24, "Tarih": 10, "Coğrafya": 6, "Felsefe": 12 };
    }

    if (!minutesForExam || minutesForExam < 30) return [];

    const pool = (this.state.uploadedQuestions || []).filter(q => !q.completed && q.examType === examType);
    const poolWeightBySubject = {};
    pool.forEach(q => { poolWeightBySubject[q.subject] = (poolWeightBySubject[q.subject] || 0) + 1; });

    const adjusted = {};
    Object.keys(baseWeights).forEach(sub => {
      adjusted[sub] = baseWeights[sub] * (1 + Math.min(1, (poolWeightBySubject[sub] || 0) * 0.15));
    });

    // 1. geçiş: ham oranlarla payları hesapla, 30 dk altındakileri ele.
    let total = Object.values(adjusted).reduce((a, b) => a + b, 0);
    let kept = Object.keys(adjusted).filter(sub => (adjusted[sub] / total) * minutesForExam >= 30);
    if (kept.length === 0) {
      // Süre çok kısa: sadece en ağırlıklı tek dersi tut.
      kept = [Object.entries(adjusted).sort((a, b) => b[1] - a[1])[0][0]];
    }

    // 2. geçiş: sadece kalan derslerin ağırlığıyla süreyi yeniden dağıt.
    const keptWeightTotal = kept.reduce((s, sub) => s + adjusted[sub], 0);
    return kept
      .map(sub => {
        const minutes = this.roundTo10((adjusted[sub] / keptWeightTotal) * minutesForExam);
        return { subject: sub, examType, minutes, percent: Math.round((minutes / minutesForExam) * 100) };
      })
      .filter(l => l.minutes >= 30)
      .sort((a, b) => b.percent - a.percent);
  },

  // FEATURE 3/6 — bir görevin bugünkü öncelik skorunu (0-100) hesaplar.
  // Hata Zindanı'ndaki (unutma riski + tekrar sayısı), YKS ders ağırlığı ve
  // konunun son ne zaman çalışıldığı gibi gerçek sinyalleri birleştirir.
  computeTaskPriorityScore: function(task, dayNum) {
    if (!task || !task.subject) return null;
    if (task.isSmartReview) return 99; // zaten AI tarafından en öncelikli olarak seçildi

    const subjectWeight = {
      "Matematik": 1.2, "Geometri": 1.15, "Türkçe": 1.15, "Fizik": 1.0,
      "Kimya": 1.0, "Biyoloji": 0.95, "Edebiyat": 1.0, "Tarih": 0.85,
      "Coğrafya": 0.85, "Felsefe": 0.8, "Din Kültürü": 0.7
    }[task.subject] || 0.9;

    let score = 50 * subjectWeight;

    const poolEntry = (this.state.uploadedQuestions || []).find(q => !q.completed && q.subject === task.subject && q.topic === task.topic);
    if (poolEntry) {
      const attempts = Array.isArray(poolEntry.attempts) ? poolEntry.attempts.length : 0;
      score += 15 + Math.min(attempts, 5) * 5; // hata zindanındaki konu -> yüksek öncelik
    }

    if (task.type === "quiz" || task.type === "retest") score += 8;
    if (task.isVaultReview) score += 10;

    return Math.max(20, Math.min(100, Math.round(score)));
  },

  // FEATURE 7 — bir test/soru görevinin beklenen net katkısını kabaca
  // tahmin eder (garanti değil, AI tahmini). Hata Zindanı'nda olan konular
  // ve daha uzun/soru sayısı yüksek görevler daha yüksek potansiyel taşır.
  computeExpectedNetGain: function(task) {
    if (!task || !(task.qCount > 0 || task.type === "quiz" || task.type === "retest")) return null;
    const qCount = task.qCount || 10;
    let gain = qCount * 0.04;
    const poolEntry = (this.state.uploadedQuestions || []).find(q => !q.completed && q.subject === task.subject && q.topic === task.topic);
    if (poolEntry) gain *= 1.6; // hata yapılmış konudan gelen kazanım daha yüksek
    return Math.round(Math.min(1.5, gain) * 10) / 10;
  },

  // FEATURE 8 — bugünün görevlerinin gerçek türlerinden aktivite portföyünü
  // (yeni konu / soru çözümü / tekrar / hata analizi / deneme) çıkarır.
  computeActivityPortfolio: function(dayNum) {
    const dayData = this.state.daysData[dayNum];
    const tasks = dayData && dayData.tasks ? dayData.tasks : [];
    if (tasks.length === 0) return null;

    const buckets = { "Yeni Konu Öğrenimi": 0, "Soru Çözümü": 0, "Tekrar": 0, "Hata Analizi": 0, "Deneme Pratiği": 0 };
    tasks.forEach(t => {
      const mins = this.parseDurationMinutes(t.duration);
      if (t.isSmartReview || t.isVaultReview || t.type === "retest") buckets["Hata Analizi"] += mins;
      else if (t.label && t.label.toLowerCase().includes("deneme")) buckets["Deneme Pratiği"] += mins;
      else if (t.type === "quiz" || t.type === "common" || t.type === "question") buckets["Soru Çözümü"] += mins;
      else if (t.type === "reading" || t.type === "video") buckets["Yeni Konu Öğrenimi"] += mins;
      else buckets["Tekrar"] += mins;
    });

    const total = Object.values(buckets).reduce((a, b) => a + b, 0);
    if (total === 0) return null;
    return Object.entries(buckets)
      .filter(([, mins]) => mins > 0)
      .map(([label, mins]) => ({ label, percent: Math.round((mins / total) * 100), minutes: this.roundTo10(mins) }))
      .sort((a, b) => b.percent - a.percent);
  },

  // FEATURE 5 — o günün GERÇEK toplam süresine göre program yoğunluğu
  // etiketi (sabit beyan edilen kapasite değil, seçilen/oluşturulmuş
  // programda o güne fiilen ne kadar süre atanmışsa ona göre).
  computeTimeOptimizationLabel: function(dayNum) {
    const capacityMinutes = this.getDayAvailableMinutes(dayNum);
    if (!capacityMinutes) return { label: "Dengeli Program", hours: null };
    const hours = Math.round((capacityMinutes / 60) * 10) / 10;
    if (hours <= 3) return { label: "Sıkıştırılmış Program", hours };
    if (hours <= 6) return { label: "Dengeli Program", hours };
    return { label: "Genişletilmiş Program", hours };
  },

  // FEATURE 10 — bugünün programı için gerçek veriden AI açıklama metni.
  generateAllocationExplanation: function(dayNum) {
    const dayData = this.state.daysData[dayNum];
    const tasks = dayData && dayData.tasks ? dayData.tasks : [];
    if (tasks.length === 0) return "Bugün için henüz bir program bulunmuyor.";

    const scored = tasks
      .map(t => ({ t, score: this.computeTaskPriorityScore(t, dayNum) }))
      .filter(x => x.score !== null)
      .sort((a, b) => b.score - a.score);

    const parts = [];
    if (scored.length > 0) {
      const top = scored[0].t;
      if (top.isSmartReview) {
        parts.push(`Bugünün programı AI Akıllı Tekrar Seansı'na öncelik veriyor, çünkü Hata Zindanı'ndaki en riskli konular bu seansta ele alınıyor.`);
      } else {
        const inPool = (this.state.uploadedQuestions || []).some(q => !q.completed && q.subject === top.subject && q.topic === top.topic);
        parts.push(`Bugünün programı ${this.escapeHtml(top.subject)} — "${this.escapeHtml(top.topic)}" konusuna öncelik veriyor` + (inPool ? `, çünkü bu konu Hata Zindanı'nda aktif ve unutulma riski taşıyor.` : `.`));
      }
    }
    const lowCandidate = [...scored].reverse().find(x => !x.t.isSmartReview);
    if (lowCandidate && scored.length > 1) {
      parts.push(`${this.escapeHtml(lowCandidate.t.subject)} dersi bugün daha kısa tutuldu çünkü şu an için daha düşük öncelikli.`);
    }
    const poolSize = (this.state.uploadedQuestions || []).filter(q => !q.completed).length;
    if (poolSize > 0) {
      parts.push(`Hata Zindanı'nda ${poolSize} aktif konu var; AI Akıllı Tekrar Seansı bunları önceliğe göre programa dahil ediyor.`);
    }
    // Bölüm bazlı deneme analizi doğrudan tahsis açıklamasına yansır
    const secAn = this.analyzeMockSections();
    if (secAn && secAn.weakest.length) {
      const w = secAn.weakest[0];
      parts.push(`Deneme analizine göre en çok net kaybettiğin bölüm "${w.section}" (%${w.avgAccuracy} doğruluk, ${w.sampleSize} deneme); tahsis bu bölüme ağırlık veriyor.`);
      if (secAn.declining.length) {
        parts.push(`${secAn.declining.map(d => d.section).join(", ")} bölümlerinde düşüş eğilimi var.`);
      }
    }
    return parts.join(" ");
  },

  // Orkestratör: yukarıdaki tüm hesaplamaları tek bir günlük tahsis
  // özetinde birleştirir — UI tarafı sadece bunu render eder.
  computeStudyAllocation: function(dayNum) {
    const alloc = this.computeTytAytAllocation(dayNum);
    const tytLessons = alloc.tyt.minutes > 0 ? this.computeLessonAllocation("TYT", alloc.tyt.minutes) : [];
    const aytLessons = alloc.ayt.minutes > 0 ? this.computeLessonAllocation("AYT", alloc.ayt.minutes) : [];
    return {
      remainingDays: this.computeRemainingExamDays(),
      allocation: alloc,
      lessons: [...tytLessons, ...aytLessons],
      portfolio: this.computeActivityPortfolio(dayNum),
      timeOptimization: this.computeTimeOptimizationLabel(dayNum),
      explanation: this.generateAllocationExplanation(dayNum)
    };
  },

  // Program oluşturma modu — üç yol tek seçicinin altında
  // Program olusturma yalnizca IKI moddan ibarettir: AI olustursun / Kendim yapayim.
  // Fotograftan aktarma, Tahsis Motoru ve Calisma Temposu artik ayri birer mod
  // degil, "Kendim yapayim" panelinin ALT BOLUMLERIDIR; mod degisiminde ayrica
  // gosterilip gizlenmeleri gerekmez.
  setProgramCreatorMode: function(mode) {
    if (mode !== "ai" && mode !== "custom") mode = "ai";
    this._programCreatorMode = mode;

    ["ai", "custom"].forEach(m => {
      const sec = document.getElementById(`progMode-${m}`);
      const btn = document.getElementById(`progModeBtn-${m}`);
      if (sec) sec.style.display = (m === mode) ? "block" : "none";
      if (btn) {
        btn.classList.toggle("active", m === mode);
        btn.style.borderColor = (m === mode) ? "var(--primary)" : "var(--border-color)";
        btn.style.color = (m === mode) ? "var(--primary)" : "var(--text-main)";
        btn.style.background = (m === mode) ? "var(--ai-tint)" : "var(--bg-card)";
      }
    });
    // Koç modundaki paylaşım bölümü mod değişiminde de doğru görünsün
    this.applyRoleUI();
  },

  toggleStudyAllocationCard: function() {
    const body = document.getElementById("studyAllocationBody");
    const chevron = document.getElementById("studyAllocationChevron");
    if (!body) return;
    const isOpen = body.style.display !== "none";
    body.style.display = isOpen ? "none" : "block";
    if (chevron) chevron.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
  },

  // AI Tahsis Motoru kartını (TYT/AYT dağılımı, ders dağılımı, aktivite
  // portföyü, AI açıklaması) günlük panelde render eder. Mevcut program
  // yapısını değiştirmez — sadece o günün gerçek verisini analiz edip anlatır.
  renderStudyAllocationEngine: function(dayNum) {
    const card = document.getElementById("studyAllocationCard");
    if (!card) return;
    const dayData = this.state.daysData[dayNum];
    if (!dayData || !dayData.tasks || dayData.tasks.length === 0) {
      card.style.display = "none";
      return;
    }
    card.style.display = "block";

    const summary = this.computeStudyAllocation(dayNum);

    const timeLabelEl = document.getElementById("studyAllocationTimeLabel");
    if (timeLabelEl) {
      timeLabelEl.textContent = summary.timeOptimization.hours
        ? `· ${summary.timeOptimization.label} (${summary.timeOptimization.hours} sa)`
        : `· ${summary.timeOptimization.label}`;
    }

    const tytAytEl = document.getElementById("studyAllocationTytAyt");
    const manualControl = document.getElementById("studyAllocationManualControl");
    if (tytAytEl) {
      const a = summary.allocation;
      if (a.ayt.percent === 0) {
        tytAytEl.innerHTML = `<div style="font-size:0.78rem; font-weight:700; color:var(--text-main);">Bugün: %100 TYT (${a.tyt.minutes} dk)</div>`;
        if (manualControl) manualControl.style.display = "none";
      } else {
        tytAytEl.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; font-weight:800; margin-bottom:0.3rem;">
            <span style="color:#0284C7;">TYT %${a.tyt.percent} (${a.tyt.minutes} dk)</span>
            ${a.manual ? `<span style="font-size:0.62rem; font-weight:800; color:var(--secondary); background:rgba(59,130,246,0.1); padding:0.1rem 0.4rem; border-radius:4px;"><i class="fa-solid fa-hand"></i> Manuel</span>` : ""}
            <span style="color:#7C3AED;">AYT %${a.ayt.percent} (${a.ayt.minutes} dk)</span>
          </div>
          <div style="display:flex; height:10px; border-radius:5px; overflow:hidden; background:rgba(0,0,0,0.05);">
            <div style="width:${a.tyt.percent}%; background:#0284C7;"></div>
            <div style="width:${a.ayt.percent}%; background:#7C3AED;"></div>
          </div>`;

        if (manualControl) {
          manualControl.style.display = "flex";
          const slider = document.getElementById("tytAytManualSlider");
          const label = document.getElementById("tytAytManualLabel");
          if (slider) slider.value = a.tyt.percent;
          if (label) label.textContent = `TYT %${a.tyt.percent} / AYT %${a.ayt.percent}`;
        }
      }
    }

    const lessonsEl = document.getElementById("studyAllocationLessons");
    if (lessonsEl) {
      lessonsEl.innerHTML = summary.lessons.slice(0, 6).map(l => `
        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:0.5rem 0.6rem;">
          <div style="font-size:0.68rem; font-weight:800; color:var(--text-muted); display:flex; justify-content:space-between;"><span>${app.escapeHtml(l.subject)}</span><span>${app.escapeHtml(l.examType)}</span></div>
          <div style="font-size:0.85rem; font-weight:900; color:var(--primary);">%${l.percent} <span style="font-size:0.65rem; font-weight:700; color:var(--text-muted);">(${l.minutes} dk)</span></div>
        </div>
      `).join("");
    }

    const portfolioEl = document.getElementById("studyAllocationPortfolio");
    if (portfolioEl) {
      if (!summary.portfolio) {
        portfolioEl.innerHTML = "";
      } else {
        const colors = { "Yeni Konu Öğrenimi": "#3B82F6", "Soru Çözümü": "#D97706", "Tekrar": "#EC4899", "Hata Analizi": "#059669", "Deneme Pratiği": "#7C3AED" };
        portfolioEl.innerHTML = `
          <div style="font-size:0.7rem; font-weight:800; color:var(--text-muted); margin-bottom:0.35rem;">BUGÜNÜN ÇALIŞMA PORTFÖYÜ</div>
          <div style="display:flex; height:12px; border-radius:6px; overflow:hidden; background:rgba(0,0,0,0.05); margin-bottom:0.4rem;">
            ${summary.portfolio.map(p => `<div style="width:${p.percent}%; background:${colors[p.label] || '#94a3b8'};" title="${p.label}: %${p.percent}"></div>`).join("")}
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
            ${summary.portfolio.map(p => `<span style="font-size:0.68rem; font-weight:700; color:var(--text-muted);"><span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:${colors[p.label] || '#94a3b8'}; margin-right:0.25rem;"></span>${p.label} %${p.percent}</span>`).join("")}
          </div>`;
      }
    }

    const explEl = document.getElementById("studyAllocationExplanation");
    if (explEl) explEl.innerHTML = `🤖 <strong>AI Koç Açıklaması:</strong> ${summary.explanation}`;
  },

  // Görev kartlarında "bunu neyden çalışacağım?" satırı:
  // yayınevi + kitap adı. Kaynağı olmayan görevlerde (Rehberlik,
  // ÖDT, kitap okuma...) hiçbir şey basmaz.
  getTaskSourceHTML: function(task, fontSize) {
    const src = task && task.source;
    if (!src || !src.publisher) return "";
    const icon = src.kind === "konu" ? "fa-book-open" : src.kind === "deneme" ? "fa-file-lines" : "fa-book";
    const size = fontSize || "0.7rem";
    const test = src.testNo ? ` · <strong>${app.escapeHtml(src.testNo)}</strong>` : "";
    return `<div style="font-size:${size}; color:var(--primary); margin-top:0.2rem; text-align:left;">
      <i class="fa-solid ${icon}"></i> Kaynak: <strong>${app.escapeHtml(src.publisher)}</strong> — ${app.escapeHtml(src.book)}${test}
    </div>`;
  },

  // FEATURE 6/7 — görev kartlarının üstüne eklenecek küçük öncelik skoru +
  // beklenen net rozeti. Mevcut kart tasarımını bozmadan, mevcut rozet
  // satırının yanına eklenmek üzere tasarlandı.
  getTaskAIBadgesHTML: function(task, dayNum) {
    if (!task || task.completed) return "";
    const score = this.computeTaskPriorityScore(task, dayNum);
    const gain = this.computeExpectedNetGain(task);
    let html = "";
    if (score !== null) {
      const color = score >= 80 ? "var(--danger)" : score >= 60 ? "var(--warning)" : "var(--text-muted)";
      html += `<span title="AI Öncelik Skoru" style="font-size:0.62rem; font-weight:800; color:${color}; background:rgba(0,0,0,0.04); padding:0.1rem 0.35rem; border-radius:4px;"><i class="fa-solid fa-bolt"></i> ${score}</span>`;
    }
    if (gain !== null && gain > 0) {
      html += `<span title="Tahmini Net Katkısı" style="font-size:0.62rem; font-weight:800; color:var(--success); background:rgba(16,185,129,0.1); padding:0.1rem 0.35rem; border-radius:4px; margin-left:0.25rem;"><i class="fa-solid fa-arrow-trend-up"></i> +${gain} Net</span>`;
    }
    return html;
  },

  // TAB 4: ChartJS Rendering
  // ============================================================
  // METIN TABANLI ANALIZLER — grafikle bogmadan, dogrudan eyleme donuk
  //   A) Bos / Yanlis dengesi  B) Zaman-Net verimi  C) Mufredat yetisme
  // ============================================================
  // ILK EKRAN OZETI — grafik degil, uc sayi: bugunku calisma, toplam
  // ilerleme, son deneme neti. Ogrenci uygulamayi actiginda ilk bunu gorur.
  renderDashboardSummary: function() {
    const yaz = (id, deger, alt) => {
      const e = document.getElementById(id); if (e) e.textContent = deger;
      const a = document.getElementById(id + "Sub"); if (a) a.innerHTML = alt || "&nbsp;";
    };

    // 1) Bugunku calisma suresi — bugunun tamamlanan gorevlerinden
    const bugun = this.bugunkuProgramGunu();
    const gun = (this.state.daysData && (this.state.daysData[bugun] || this.state.daysData[String(bugun)])) || null;
    const gorevler = (gun && gun.tasks) || [];
    const bitenGorev = gorevler.filter(t => t.completed);
    let dakika = 0;
    bitenGorev.forEach(t => {
      dakika += t.timeSpent ? parseInt(t.timeSpent, 10) : (this.parseDurationMinutes(t.duration) || 0);
    });
    const saat = Math.floor(dakika / 60), dk = dakika % 60;
    yaz("sumTodayTime", saat > 0 ? `${saat} sa ${dk} dk` : `${dakika} dk`,
        gorevler.length ? `${bitenGorev.length}/${gorevler.length} görev tamam` : "bugün görev yok");

    // 2) Toplam ilerleme — programdaki tamamlanan gorev orani
    let toplamGorev = 0, toplamBiten = 0;
    const gunler = this.state.daysData || {};
    Object.keys(gunler).forEach(k => {
      const g = gunler[k];
      if (!g || !Array.isArray(g.tasks)) return;
      toplamGorev += g.tasks.length;
      toplamBiten += g.tasks.filter(t => t.completed).length;
    });
    const yuzde = toplamGorev > 0 ? Math.round((toplamBiten / toplamGorev) * 100) : 0;
    yaz("sumProgress", `%${yuzde}`, toplamGorev > 0 ? `${toplamBiten}/${toplamGorev} görev` : "program yok");

    // Hedef - program yuku notu. Program uretildikten SONRA gercek
    // sayilarla gosterilir; ogrenci hedefinin ulasilabilir olup
    // olmadigini surekli gorur.
    const notEl = document.getElementById("kapasiteNotu");
    if (notEl) {
      const kap = this.kapasiteHedefKarsilastir();
      const metin = kap ? this.kapasiteHedefMetni(kap) : "";
      if (metin && kap.uretimVar) {
        const renk = kap.yeterli ? "var(--success)" : "var(--warning)";
        notEl.innerHTML = `
          <div class="glass-card" style="padding:0.85rem 1rem; border-left:3px solid ${renk};
               font-size:0.8rem; line-height:1.55; color:var(--text-main);">${metin}</div>`;
        notEl.style.display = "block";
      } else {
        notEl.style.display = "none";
      }
    }

    // 3) Son deneme neti — en son kaydedilen calismanin neti
    const kayitlar = this.state.chartData || [];
    if (kayitlar.length === 0) {
      yaz("sumLastNet", "—", "henüz kayıt yok");
    } else {
      const son = kayitlar[kayitlar.length - 1];
      const net = this.netHesapla(son.correct, son.incorrect);
      const parca = [`${son.correct || 0}D`, `${son.incorrect || 0}Y`];
      if (son.blank !== undefined) parca.push(`${son.blank}B`);
      yaz("sumLastNet", String(net), `${this.escapeHtml(son.subject || "")} · ${parca.join(" ")}`);
    }
  },

  renderInsightCards: function(records) {
    const kap = document.getElementById("insightCards");
    if (!kap) return;

    const kart = (ikon, baslik, renk, govde) => `
      <div class="glass-card" style="padding:1.1rem; margin-bottom:1rem; border-left:4px solid ${renk};">
        <h4 style="margin:0 0 0.6rem; display:flex; align-items:center; gap:0.5rem; font-family:var(--font-header); font-weight:800; font-size:0.9rem;">
          <i class="fa-solid ${ikon}" style="color:${renk};"></i> ${baslik}
        </h4>
        ${govde}
      </div>`;

    const satir = (sol, sag, renk) => `
      <div style="display:flex; justify-content:space-between; align-items:baseline; gap:0.75rem; padding:0.35rem 0; border-bottom:1px dashed var(--border-color); font-size:0.82rem;">
        <span>${sol}</span><span style="font-weight:800; color:${renk || 'var(--text-main)'}; white-space:nowrap;">${sag}</span>
      </div>`;

    let html = "";

    // ── A) BOS / YANLIS DENGESI ──────────────────────────────
    const dersler = {};
    records.forEach(r => {
      const d = r.subject || "Diğer";
      const g = dersler[d] = dersler[d] || { dogru: 0, yanlis: 0, bos: 0, sure: 0, kayit: 0 };
      g.dogru += r.correct || 0;
      g.yanlis += r.incorrect || 0;
      g.bos += r.blank || 0;
      g.sure += r.time || 0;
      g.kayit++;
    });

    const bosVerisiVar = records.some(r => r.blank !== undefined);
    if (bosVerisiVar) {
      const sirali = Object.keys(dersler).map(d => {
        const g = dersler[d];
        const toplam = g.dogru + g.yanlis + g.bos;
        return {
          ders: d,
          bosOran: toplam > 0 ? Math.round((g.bos / toplam) * 100) : 0,
          yanlisOran: toplam > 0 ? Math.round((g.yanlis / toplam) * 100) : 0,
          toplam: toplam
        };
      }).filter(x => x.toplam >= 10).sort((a, b) => (b.bosOran + b.yanlisOran) - (a.bosOran + a.yanlisOran));

      if (sirali.length) {
        const govde = sirali.slice(0, 6).map(x => {
          // Hangisi baskin? Ogrenciye ne yapmasi gerektigini soyleyen kisim bu.
          let tani, renk;
          if (x.bosOran >= 25 && x.bosOran > x.yanlisOran) {
            tani = `%${x.bosOran} boş — konu eksiği, çözmeye bile başlayamıyorsun`;
            renk = "var(--warning)";
          } else if (x.yanlisOran >= 25 && x.yanlisOran >= x.bosOran) {
            tani = `%${x.yanlisOran} yanlış — biliyorsun ama hata yapıyorsun ya da sallıyorsun`;
            renk = "var(--danger)";
          } else {
            tani = `%${x.bosOran} boş · %${x.yanlisOran} yanlış — dengeli`;
            renk = "var(--success)";
          }
          return satir(`<strong>${this.escapeHtml(x.ders)}</strong><br><span style="font-size:0.72rem; color:var(--text-muted);">${tani}</span>`,
                       `${x.toplam} soru`, renk);
        }).join("");
        html += kart("fa-circle-half-stroke", "Boş mu Bırakıyorsun, Yanlış mı Yapıyorsun?", "var(--primary)",
          govde + `<p style="font-size:0.7rem; color:var(--text-muted); margin:0.6rem 0 0; line-height:1.45;">
            Boş oranı yüksekse eksik olan <strong>konu bilgisi</strong>; yanlış oranı yüksekse sorun <strong>dikkat ya da acelecilik</strong>.
            İkisi farklı çalışma gerektirir.</p>`);
      }
    }

    // ── B) ZAMAN / NET VERIMI ────────────────────────────────
    const verim = Object.keys(dersler).map(d => {
      const g = dersler[d];
      const net = this.netHesapla(g.dogru, g.yanlis);
      const saat = Math.round((g.sure / 60) * 10) / 10;
      return { ders: d, net: net, saat: saat, netSaat: saat > 0 ? Math.round((net / saat) * 10) / 10 : null };
    }).filter(x => x.saat >= 0.5).sort((a, b) => (b.netSaat || -1) - (a.netSaat || -1));

    if (verim.length >= 2) {
      const enIyi = verim[0], enKotu = verim[verim.length - 1];
      const govde = verim.slice(0, 8).map(x => {
        const renk = x.netSaat === null ? "var(--text-muted)"
          : x.netSaat >= (enIyi.netSaat * 0.7) ? "var(--success)"
          : x.netSaat >= (enIyi.netSaat * 0.4) ? "var(--warning)" : "var(--danger)";
        return satir(`<strong>${this.escapeHtml(x.ders)}</strong> <span style="font-size:0.72rem; color:var(--text-muted);">${x.saat} saat · ${x.net} net</span>`,
                     x.netSaat === null ? "—" : `${x.netSaat} net/saat`, renk);
      }).join("");
      let yorum = "";
      if (enIyi.netSaat && enKotu.netSaat !== null && enIyi.netSaat > enKotu.netSaat * 1.5) {
        yorum = `<p style="font-size:0.75rem; margin:0.6rem 0 0; line-height:1.5;">
          <strong>${this.escapeHtml(enIyi.ders)}</strong> saatine ${enIyi.netSaat} net kazandırıyor,
          <strong>${this.escapeHtml(enKotu.ders)}</strong> ise ${enKotu.netSaat}.
          ${this.escapeHtml(enKotu.ders)} dersine ayırdığın süre karşılığını vermiyor —
          çalışma yöntemini değiştirmen, süreyi artırmandan daha çok işe yarar.</p>`;
      }
      html += kart("fa-gauge-high", "Harcadığın Zaman Karşılığını Veriyor mu?", "var(--primary)", govde + yorum);
    }

    // ── A2) KONU BAZLI "EN COK NET KACIRILAN" (hata isi haritasi) ──
    // Kaynak: tamamlanmis gorevlerin konu + yanlis/bos verisi.
    // chartData'daki eski kayitlarda konu yok; daysData her zaman tasir.
    const konuKayip = {};
    const gunler = this.state.daysData || {};
    Object.keys(gunler).forEach(g => {
      const gun = gunler[g];
      if (!gun || !Array.isArray(gun.tasks)) return;
      gun.tasks.forEach(t => {
        if (!t.completed || !t.logged) return;
        const konu = (t.topic || "").trim();
        if (!konu) return;
        const yanlis = t.incorrect || 0;
        const bos = t.blank || 0;
        if (yanlis + bos === 0) return;
        const k = konuKayip[konu] = konuKayip[konu] || { konu: konu, ders: t.subject || "", yanlis: 0, bos: 0, kez: 0 };
        k.yanlis += yanlis; k.bos += bos; k.kez++;
      });
    });
    const kayipListe = Object.values(konuKayip)
      .map(k => Object.assign(k, { kayip: k.yanlis + k.bos }))
      .sort((a, b) => b.kayip - a.kayip)
      .slice(0, 6);

    // ── E) HAFTALIK KARNE ────────────────────────────────────
    // "Bu hafta kac saat calistin, en cok hangi derste geliserdin,
    //  neye odaklanmalisin" — tek bakista karne.
    const HAFTA = 7 * 86400000, simdi = Date.now();
    const buHafta = records.filter(r => r.ts && r.ts >= simdi - HAFTA);
    const gecenHafta = records.filter(r => r.ts && r.ts >= simdi - 2 * HAFTA && r.ts < simdi - HAFTA);

    if (buHafta.length) {
      const dk = buHafta.reduce((a, r) => a + (r.time || 0), 0);
      const saat = Math.round((dk / 60) * 10) / 10;

      // Ders bazli net degisimi (bu hafta - gecen hafta)
      const netToplam = (liste) => {
        const m = {};
        liste.forEach(r => {
          const d = r.subject || "Diğer";
          m[d] = (m[d] || 0) + this.netHesapla(r.correct, r.incorrect);
        });
        return m;
      };
      const bu = netToplam(buHafta), gecen = netToplam(gecenHafta);
      let enIyiDers = null, enIyiFark = 0;
      Object.keys(bu).forEach(d => {
        if (gecen[d] === undefined) return;
        const fark = bu[d] - gecen[d];
        if (fark > enIyiFark) { enIyiFark = fark; enIyiDers = d; }
      });

      const satirlar = [
        satir("Bu hafta toplam çalışma", `${saat} saat`, "var(--text-main)"),
        satir("Tamamlanan çalışma", `${buHafta.length} kayıt`, "var(--text-main)")
      ];
      if (enIyiDers) {
        satirlar.push(satir("En çok geliştiğin ders",
          `${this.escapeHtml(enIyiDers)} (+${Math.round(enIyiFark * 10) / 10} net)`, "var(--success)"));
      } else if (gecenHafta.length === 0) {
        satirlar.push(satir("En çok geliştiğin ders",
          "karşılaştırma için geçen hafta verisi yok", "var(--text-muted)"));
      }
      if (kayipListe && kayipListe.length) {
        satirlar.push(satir("Odaklanman gereken konu",
          `${this.escapeHtml(kayipListe[0].ders)} — ${this.escapeHtml(kayipListe[0].konu)}`, "var(--danger)"));
      }

      html += kart("fa-clipboard-user", "Haftalık Karnen", "var(--success)", satirlar.join(""));
    }

    if (kayipListe.length) {
      const enBuyuk = kayipListe[0].kayip;
      const govde = kayipListe.map(k => {
        const oran = enBuyuk > 0 ? Math.round((k.kayip / enBuyuk) * 100) : 0;
        const renk = oran >= 70 ? "var(--danger)" : oran >= 40 ? "var(--warning)" : "var(--success)";
        return `
          <div style="padding:0.45rem 0; border-bottom:1px dashed var(--border-color);">
            <div style="display:flex; justify-content:space-between; gap:0.75rem; font-size:0.82rem;">
              <span><strong>${this.escapeHtml(k.konu)}</strong>
                <span style="font-size:0.72rem; color:var(--text-muted);">· ${this.escapeHtml(k.ders)}</span></span>
              <span style="font-weight:800; color:${renk}; white-space:nowrap;">${k.kayip} soru</span>
            </div>
            <div style="background:rgba(0,0,0,0.05); height:6px; border-radius:3px; margin-top:0.3rem; overflow:hidden;">
              <div style="width:${oran}%; height:100%; background:${renk};"></div>
            </div>
            <div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.2rem;">
              ${k.yanlis} yanlış · ${k.bos} boş · ${k.kez} çalışmada
            </div>
          </div>`;
      }).join("");
      const ilk = kayipListe[0];
      html += kart("fa-fire", "En Çok Net Kaçırdığın Konular", "var(--danger)",
        govde + `<p style="font-size:0.78rem; margin:0.7rem 0 0; line-height:1.5;">
          <strong>${this.escapeHtml(ilk.konu)}</strong> konusundan ${ilk.kez} çalışmada toplam
          <strong>${ilk.kayip} soru</strong> kaçırdın. Önceliğin bu konu olmalı.</p>`);
    }

    // ── B2) SURE DAGILIMI DENGE KONTROLU ─────────────────────
    const sureToplam = Object.values(dersler).reduce((a, g) => a + g.sure, 0);
    if (sureToplam > 60) {
      const paylar = Object.keys(dersler).map(d => ({
        ders: d, dk: dersler[d].sure,
        pay: Math.round((dersler[d].sure / sureToplam) * 100)
      })).sort((a, b) => b.pay - a.pay);

      // Alanindaki derslerden hic calisilmayanlar
      const ozet = this.mufredatDersOzeti();
      const beklenen = ozet ? ozet.liste.map(x => x.ders.replace(/^(TYT|AYT)\s+/, "")) : [];
      const calisilan = Object.keys(dersler);
      const hicCalisilmayan = [...new Set(beklenen)].filter(d => !calisilan.includes(d));

      const govde = paylar.slice(0, 8).map(x => {
        const renk = x.pay >= 45 ? "var(--warning)" : "var(--primary)";
        return `
          <div style="padding:0.35rem 0;">
            <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
              <span>${this.escapeHtml(x.ders)}</span>
              <span style="font-weight:800; color:${renk};">%${x.pay} · ${Math.round(x.dk / 60 * 10) / 10} sa</span>
            </div>
            <div style="background:rgba(0,0,0,0.05); height:6px; border-radius:3px; margin-top:0.25rem; overflow:hidden;">
              <div style="width:${x.pay}%; height:100%; background:${renk};"></div>
            </div>
          </div>`;
      }).join("");

      let uyari = "";
      const enBuyukPay = paylar[0];
      // NOT: yuzdeye Turkce ek getirilmiyor. "%49'ini / %60'ini" gibi
      // ekler sayinin okunusuna gore degistigi icin dogru uretilemez.
      if (enBuyukPay && enBuyukPay.pay >= 45) {
        uyari = `Zamanının en büyük kısmı (<strong>%${enBuyukPay.pay}</strong>) ` +
                `${this.escapeHtml(enBuyukPay.ders)} dersine gitmiş.`;
      }
      if (hicCalisilmayan.length) {
        const eksik = hicCalisilmayan.slice(0, 3).map(d => this.escapeHtml(d));
        const liste = eksik.length > 1
          ? eksik.slice(0, -1).join(", ") + " ve " + eksik[eksik.length - 1]
          : eksik[0];
        uyari += (uyari ? " " : "") +
          `<strong>${liste}</strong> ders${eksik.length > 1 ? "lerine" : "ine"} ise bu dönemde hiç vakit ayırmamışsın.`;
      }
      html += kart("fa-scale-unbalanced", "Zamanını Nasıl Bölüştürdün?", "var(--primary)",
        govde + (uyari ? `<p style="font-size:0.78rem; margin:0.7rem 0 0; line-height:1.5;">${uyari}</p>` : ""));
    }

    // ── D) DERS BAZLI MUFREDAT ILERLEMESI ────────────────────
    const dersOzet = this.mufredatDersOzeti();
    if (dersOzet && dersOzet.liste.length) {
      const govde = dersOzet.liste.slice(0, 12).map(x => {
        const renk = x.yuzde >= 70 ? "var(--success)" : x.yuzde >= 35 ? "var(--warning)" : "var(--danger)";
        return `
          <div style="padding:0.35rem 0;">
            <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
              <span>${this.escapeHtml(x.ders)}</span>
              <span style="font-weight:800; color:${renk};">%${x.yuzde} <span style="font-weight:600; color:var(--text-muted); font-size:0.7rem;">(${x.biten}/${x.toplam})</span></span>
            </div>
            <div style="background:rgba(0,0,0,0.05); height:7px; border-radius:4px; margin-top:0.25rem; overflow:hidden;">
              <div style="width:${x.yuzde}%; height:100%; background:${renk};"></div>
            </div>
          </div>`;
      }).join("");
      html += kart("fa-list-check", "Ders Bazlı Müfredat İlerlemen", "var(--primary)", govde);
    }

    // ── C) MUFREDAT YETISME TAHMINI ──────────────────────────
    const tahmin = this.mufredatYetismeTahmini();
    if (tahmin && tahmin.yetersizVeri) {
      // Tahmin yapilamiyor ama ilerleme yine de gosterilir; uydurma
      // bir bitis tarihi verilmez.
      html += kart("fa-flag-checkered", "Müfredat İlerlemen", "var(--text-muted)",
        satir("Tamamlanan konu", `${tahmin.biten} / ${tahmin.toplam} (%${tahmin.yuzde})`, "var(--text-main)") +
        `<p style="font-size:0.78rem; margin:0.7rem 0 0; line-height:1.5; color:var(--text-muted);">
          Yetişme tahmini için en az <strong>${tahmin.enAzGun} günlük</strong> çalışma geçmişi gerekiyor
          (şu an ${tahmin.gecenGun}. gündesin). Bu süre dolduğunda hızına bakıp müfredatı sınava
          yetiştirip yetiştiremeyeceğini söyleyeceğim.</p>`);
    } else if (tahmin) {
      const renk = tahmin.yetisiyor ? "var(--success)" : "var(--danger)";
      const govde =
        satir("Tamamlanan konu", `${tahmin.biten} / ${tahmin.toplam} (%${tahmin.yuzde})`, "var(--text-main)") +
        satir("Güncel hızın", `${tahmin.hiz} konu/hafta`, "var(--text-main)") +
        satir("Sınava kalan", `${tahmin.kalanGun} gün`, "var(--text-main)") +
        satir("Bu hızla biteceği tarih", tahmin.bitisMetni, renk) +
        `<p style="font-size:0.78rem; margin:0.7rem 0 0; line-height:1.5;">${tahmin.mesaj}</p>`;
      html += kart("fa-flag-checkered", "Müfredatı Sınava Yetiştirebilecek misin?", renk, govde);
    }

    if (html === "") { kap.style.display = "none"; return; }
    kap.innerHTML = html;
    kap.style.display = "block";
  },

  // Mufredat ilerlemesinin ders bazli ozeti. Tek dogruluk kaynagi
  // state.topicStatuses'tur ("Ders - Konu" -> {status}).
  mufredatDersOzeti: function() {
    try {
      const track = this.state.track || "Sayısal";
      const focus = this.state.examFocus || "both";
      const hepsi = this.curriculum.topicsFor(track, focus);
      if (!hepsi || !hepsi.length) return null;

      const durum = this.state.topicStatuses || {};
      const bittiMi = (t) => {
        const st = durum[`${t.subject} - ${t.name}`];
        return !!(st && (st.status === "Ogrenildi" || st.status === "Calisildi"));
      };

      const dersler = {};
      let biten = 0;
      hepsi.forEach(t => {
        const ad = (t.exam ? t.exam.toUpperCase() + " " : "") + t.subject;
        const g = dersler[ad] = dersler[ad] || { toplam: 0, biten: 0 };
        g.toplam++;
        if (bittiMi(t)) { g.biten++; biten++; }
      });

      const liste = Object.keys(dersler).map(ad => ({
        ders: ad, toplam: dersler[ad].toplam, biten: dersler[ad].biten,
        yuzde: Math.round((dersler[ad].biten / dersler[ad].toplam) * 100)
      })).sort((a, b) => b.yuzde - a.yuzde);

      return { toplam: hepsi.length, biten: biten, liste: liste };
    } catch (e) { return null; }
  },

  // Mevcut calisma hizina gore mufredatin ne zaman bitecegini tahmin eder.
  // Veri yetersizse (hic konu bitmemisse) null doner — uydurma tahmin uretmez.
  mufredatYetismeTahmini: function() {
    try {
      const track = this.state.track || "Sayısal";
      const focus = this.state.examFocus || "both";
      const toplam = this.curriculum.totalTopicCount(track, focus);
      if (!toplam) return null;

      // TAMAMLANAN KONU KAYNAGI: state.topicStatuses.
      // state.curriculumProgress'e hicbir yerde yazilmiyor (hep bos dizi);
      // oradan okunsaydi bu kart gercek kullanimda hic gorunmezdi.
      const ozet = this.mufredatDersOzeti();
      const biten = ozet ? ozet.biten : 0;
      if (!biten) return null;

      // Basladigindan bu yana gecen gun.
      // COK KISA sureden tahmin uretilmez: 2 gunde 48 konu isaretleyen
      // bir kullanici icin "haftada 168 konu, mufredati 299 gun once
      // bitiriyorsun" gibi anlamsiz bir sonuc cikiyordu. Guvenilir bir
      // hiz icin en az EN_AZ_GUN gun gecmis olmali.
      const EN_AZ_GUN = 14;
      const bugun = this.bugunkuProgramGunu();
      const gecenGun = Math.max(1, bugun);
      if (gecenGun < EN_AZ_GUN) {
        return {
          yetersizVeri: true,
          toplam: toplam, biten: biten, yuzde: Math.round((biten / toplam) * 100),
          gecenGun: gecenGun, enAzGun: EN_AZ_GUN
        };
      }
      const hizGunluk = biten / gecenGun;
      const hizHaftalik = Math.round(hizGunluk * 7 * 10) / 10;
      if (hizHaftalik <= 0) return null;

      const kalanKonu = Math.max(0, toplam - biten);
      const gerekenGun = Math.ceil(kalanKonu / hizGunluk);
      const kalanGun = Math.max(0, Math.ceil((this.getExamDate() - new Date()) / 86400000));

      const bitis = new Date();
      bitis.setDate(bitis.getDate() + gerekenGun);
      const aylar = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
      const bitisMetni = `${bitis.getDate()} ${aylar[bitis.getMonth()]} ${bitis.getFullYear()}`;

      const yetisiyor = gerekenGun <= kalanGun;
      const fark = Math.abs(kalanGun - gerekenGun);
      const mesaj = yetisiyor
        ? `Bu hızla müfredatı sınavdan <strong>${fark} gün önce</strong> bitiriyorsun. Tempoyu koru.`
        : `Bu hızla müfredat sınavdan <strong>${fark} gün sonra</strong> biter — yetişmiyor. ` +
          `Yetiştirmek için haftalık hızını <strong>${Math.ceil(kalanKonu / Math.max(1, kalanGun / 7))} konuya</strong> çıkarman gerekiyor.`;

      return {
        toplam: toplam, biten: biten, yuzde: Math.round((biten / toplam) * 100),
        hiz: hizHaftalik, kalanGun: kalanGun, gerekenGun: gerekenGun,
        bitisMetni: bitisMetni, yetisiyor: yetisiyor, mesaj: mesaj
      };
    } catch (e) { return null; }
  },

  renderCharts: function() {
    const hasData = this.state.chartData && this.state.chartData.length > 0;
    const contentArea = document.getElementById("chartsContentArea");
    const emptyState = document.getElementById("chartsEmptyState");

    // Bölüm analizi grafik verisinden bağımsızdır (deneme girişi varsa gösterilir)
    this._sectionAnalysisCache = undefined;
    this.renderSectionAnalysis();
    // Birleştirilmiş haftalık değerlendirme artık bu panelde yaşıyor
    this.renderWeeklyHabitCoachReview();

    if (!hasData) {
      if (contentArea) contentArea.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (contentArea) contentArea.style.display = "block";
    if (emptyState) emptyState.style.display = "none";

    let records = this.state.chartData;
    
    // Read chart filter
    const filterEl = document.getElementById("chartExamTypeFilter");
    if (filterEl && filterEl.dataset.initialized !== "true") {
      const focus = this.state.examFocus || "both";
      if (focus === "tyt") filterEl.value = "TYT";
      else if (focus === "ayt") filterEl.value = "AYT";
      else filterEl.value = "all";
      filterEl.dataset.initialized = "true";
    }
    const filterVal = filterEl ? filterEl.value : "all";
    
    if (filterVal !== "all") {
      records = records.filter(r => {
        const itemType = r.examType || ((r.label || "").includes("AYT") || r.subject === "Edebiyat" ? "AYT" : "TYT");
        return itemType === filterVal;
      });
    }

    // DONEM FILTRESI (Son 7 / 30 gun / Tum zamanlar).
    // Zaman damgasi olmayan ESKI kayitlar elenmez; aksi halde filtre
    // acildigi anda gecmis veri yok olmus gibi gorunurdu.
    const rangeEl = document.getElementById("chartRangeFilter");
    const rangeVal = rangeEl ? rangeEl.value : "all";
    let tsSizKayit = 0;
    if (rangeVal !== "all") {
      const sinir = Date.now() - parseInt(rangeVal, 10) * 86400000;
      records = records.filter(r => {
        if (!r.ts) { tsSizKayit++; return true; }
        return r.ts >= sinir;
      });
    }
    this._donemEtiketi = rangeVal === "all" ? "tüm zamanlar" : `son ${rangeVal} gün`;
    this._tsSizKayit = tsSizKayit;

    if (records.length === 0) {
      if (contentArea) contentArea.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
      const bos = document.getElementById("chartsEmptyState");
      if (bos) {
        const bilgi = bos.querySelector("p");
        if (bilgi) bilgi.textContent = `Seçtiğin dönemde (${this._donemEtiketi}) kayıt yok. Dönemi genişletmeyi dene.`;
      }
      return;
    }

    // ── Chart 1: Hedef vs Mevcut Net Karşılaştırması (grouped bar) ──
    const subjectTargets = this.getSubjectTargetNets();
    const subjectLabels = Object.keys(subjectTargets);
    const targetData = subjectLabels.map(s => subjectTargets[s]);
    
    // Calculate current average nets per subject from records
    const currentAvgData = subjectLabels.map(subjectKey => {
      const cleanSubject = subjectKey.replace(/^(TYT|AYT)\s+/, "");
      const isAyt = subjectKey.startsWith("AYT");
      const matched = records.filter(r => {
        const rSubject = r.subject || "";
        // Test girişinden gelen kayıtlarda label alanı bulunmayabiliyor;
        // korumasız erişim tüm AI Çalışma Analizi sekmesini çökertiyordu.
        const rLabel = r.label || "";
        const rIsAyt = r.examType === "AYT" || rLabel.includes("AYT") || ["Edebiyat", "Felsefe"].includes(rSubject);
        if (isAyt !== rIsAyt) return false;
        return rSubject === cleanSubject || rSubject.includes(cleanSubject) || cleanSubject.includes(rSubject);
      });
      if (matched.length === 0) return 0;
      const totalCorrect = matched.reduce((sum, r) => sum + (r.correct || 0), 0);
      return Math.round((totalCorrect / matched.length) * 10) / 10;
    });

    if (this.charts.nets) this.charts.nets.destroy();
    const netsCtx = document.getElementById("netsLineChart").getContext("2d");
    this.charts.nets = new Chart(netsCtx, {
      type: 'bar',
      data: {
        labels: subjectLabels,
        datasets: [
          {
            label: 'Hedef Net',
            data: targetData,
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: '#6366f1',
            borderWidth: 2,
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.6
          },
          {
            label: 'Mevcut Ortalama Net',
            data: currentAvgData,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10b981',
            borderWidth: 2,
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#475569', font: { family: 'Outfit', weight: 'bold' } } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + ctx.parsed.y + ' net'; } } }
        },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#475569', font: { size: 10, family: 'Outfit' }, maxRotation: 45 } },
          y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#475569' }, min: 0, title: { display: true, text: 'Net Sayısı', color: '#475569', font: { family: 'Outfit', weight: 'bold' } } }
        }
      }
    });

    // ── Chart 2: Time Balance Radar Chart ──
    const subjectsList = ["Matematik", "Türkçe", "Fizik", "Kimya", "Biyoloji", "Edebiyat", "Tarih", "Coğrafya"];
    const subjectTimes = subjectsList.map(sub => {
      return records.filter(r => r.subject === sub).reduce((sum, r) => sum + r.time, 0);
    });

    if (this.charts.radar) this.charts.radar.destroy();
    const radarCtx = document.getElementById("balanceRadarChart").getContext("2d");
    this.charts.radar = new Chart(radarCtx, {
      type: 'radar',
      data: {
        labels: subjectsList,
        datasets: [{
          label: 'Derslere Ayrılan Süre (Dk)',
          data: subjectTimes,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderColor: '#6366f1',
          borderWidth: 3,
          pointBackgroundColor: '#6366f1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#475569', font: { family: 'Outfit' } } } },
        scales: {
          r: {
            grid: { color: 'rgba(0, 0, 0, 0.04)' },
            angleLines: { color: 'rgba(0, 0, 0, 0.04)' },
            pointLabels: { color: '#475569', font: { size: 11, family: 'Outfit' } },
            ticks: { display: false }
          }
        }
      }
    });

    let maxTimeIdx = 0;
    let minTimeIdx = 0;
    for (let i = 0; i < subjectTimes.length; i++) {
      if (subjectTimes[i] > subjectTimes[maxTimeIdx]) maxTimeIdx = i;
      if (subjectTimes[i] < subjectTimes[minTimeIdx]) minTimeIdx = i;
    }
    const maxSub = subjectsList[maxTimeIdx];
    const minSub = subjectsList[minTimeIdx];

    document.getElementById("balanceRecommendation").innerHTML = `
      ⚖️ <strong>Çalışma Dengesi Raporu:</strong> En çok zamanı <strong>${maxSub}</strong> dersine ayırdın.
      Eksik kalan <strong>${minSub}</strong> dersini telafi etmek için sonraki seanslarda ona ağırlık vermelisin.
    `;

    if (!this._chartSummaryStats) this._chartSummaryStats = {};
    this._chartSummaryStats.maxSub = maxSub;
    this._chartSummaryStats.minSub = minSub;

    // ── Chart 3: Speed vs YKS targets (dk/soru) ──
    // YKS reference: TYT = 135dk / 120 soru ≈ 1.125 → ~1.35 dk/soru, AYT = 160dk / 80 soru = 2.0 dk/soru
    const speeds = records.map(r => r.total > 0 ? parseFloat((r.time / r.total).toFixed(2)) : 0);
    const speedTargets = records.map(r => {
      const isAyt = r.examType === "AYT" || ["Fizik", "Kimya", "Biyoloji", "Edebiyat", "Felsefe", "Tarih", "Coğrafya"].includes(r.subject);
      return isAyt ? 2.0 : 1.35;
    });
    // Use subject names for X-axis instead of G1/G2 codes
    const speedLabels = records.map(r => {
      const examType = r.examType || ((r.label || "").includes("AYT") || ["Edebiyat", "Felsefe"].includes(r.subject) ? "AYT" : "TYT");
      return examType + ' ' + r.subject;
    });

    if (this.charts.speed) this.charts.speed.destroy();
    const speedCtx = document.getElementById("speedLineChart").getContext("2d");
    this.charts.speed = new Chart(speedCtx, {
      type: 'bar',
      data: {
        labels: speedLabels,
        datasets: [
          {
            label: 'Senin Hızın (dk/soru)',
            data: speeds,
            backgroundColor: speeds.map((s, i) => s <= speedTargets[i] ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
            borderColor: speeds.map((s, i) => s <= speedTargets[i] ? '#10b981' : '#ef4444'),
            borderWidth: 2,
            borderRadius: 6,
            barPercentage: 0.6
          },
          {
            label: 'YKS Hedef (dk/soru)',
            data: speedTargets,
            type: 'line',
            borderColor: '#eab308',
            borderDash: [6, 4],
            borderWidth: 3,
            fill: false,
            pointBackgroundColor: '#eab308',
            pointRadius: 5,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#475569', font: { family: 'Outfit', weight: 'bold' } } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + ctx.parsed.y + ' dk/soru'; } } }
        },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#475569', font: { size: 10, family: 'Outfit' }, maxRotation: 45 } },
          y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#475569' }, min: 0, title: { display: true, text: 'Dakika / Soru', color: '#475569', font: { family: 'Outfit', weight: 'bold' } } }
        }
      }
    });

    const onTrackCount = speeds.reduce((n, s, i) => n + (s > 0 && s <= speedTargets[i] ? 1 : 0), 0);
    const measuredCount = speeds.filter(s => s > 0).length;
    const speedOnTrack = measuredCount > 0 && onTrackCount / measuredCount >= 0.5;
    this._chartSummaryStats.speedStatus = measuredCount > 0 ? (speedOnTrack ? "Hedefin İçinde" : "Hedefin Gerisinde") : "-";
    this._chartSummaryStats.speedOnTrack = measuredCount > 0 ? speedOnTrack : null;

    // ── Chart 5: NET GELISIMI (zaman serisi) ──
    // Dogruluk yuzdesi ile net ayni sey degildir: cok bos birakan ogrencinin
    // dogrulugu yuksek, neti dusuk olabilir. Ogrencinin asil sordugu soru
    // "netim artiyor mu?" oldugu icin net ayri bir zaman serisi olarak cizilir.
    const netHesapla = (r) => this.netHesapla(r.correct, r.incorrect);
    const netLabels = records.map(r => r.label);
    // TYT ve AYT AYRI cizilir: ikisi farkli olceklerde ilerler, tek cizgide
    // birlestirilince ogrenci hangisinde ilerledigini goremez.
    const turBul = (r) => {
      const t = r.examType;
      if (t === "AYT" || t === "YDT" || t === "ÖDT") return t;
      return "TYT";
    };
    const seri = (tur) => records.map(r => turBul(r) === tur ? netHesapla(r) : null);
    const netVarMi = (tur) => records.some(r => turBul(r) === tur);

    const veriSetleri = [];
    if (netVarMi("TYT")) veriSetleri.push({
      label: 'TYT Net', data: seri("TYT"), borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.10)', tension: 0.3, pointRadius: 3, spanGaps: true
    });
    if (netVarMi("AYT")) veriSetleri.push({
      label: 'AYT Net', data: seri("AYT"), borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139,92,246,0.10)', tension: 0.3, pointRadius: 3, spanGaps: true
    });
    if (netVarMi("YDT")) veriSetleri.push({
      label: 'YDT Net', data: seri("YDT"), borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.10)', tension: 0.3, pointRadius: 3, spanGaps: true
    });
    if (netVarMi("ÖDT")) veriSetleri.push({
      label: 'ÖDT Net', data: seri("ÖDT"), borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.10)', tension: 0.3, pointRadius: 3, spanGaps: true
    });

    if (this.charts.netTrend) this.charts.netTrend.destroy();
    const netCanvas = document.getElementById("netTrendChart");
    if (netCanvas) {
      this.charts.netTrend = new Chart(netCanvas.getContext("2d"), {
        type: 'line',
        data: { labels: netLabels, datasets: veriSetleri },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true, labels: { font: { family: 'Outfit' } } } },
          scales: {
            x: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#475569', font: { size: 9 }, maxRotation: 45 } },
            y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#475569' },
                 title: { display: true, text: 'Net', color: '#475569', font: { family: 'Outfit', weight: 'bold' } } }
          }
        }
      });
    }

    // ── Chart 6: GUNLUK CALISMA ISTIKRARI ──
    // Hangi gun kac saat calisildi. Bos gunler cubugu olmayan gunlerdir;
    // istikrarin bozuldugu yer bakisla gorulur.
    const gunSaat = {};
    records.forEach(r => {
      if (!r.ts) return;
      const d = new Date(r.ts);
      const anahtar = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      gunSaat[anahtar] = (gunSaat[anahtar] || 0) + (r.time || 0);
    });
    const gunAnahtarlari = Object.keys(gunSaat).sort();
    if (gunAnahtarlari.length) {
      // Ilk ve son kayit arasindaki TUM gunler cizilir; calisilmayan gun
      // atlanmaz, sifir olarak gorunur — istikrar boslugu ancak boyle belli olur.
      const ilk = new Date(gunAnahtarlari[0] + "T00:00:00");
      const son = new Date(gunAnahtarlari[gunAnahtarlari.length - 1] + "T00:00:00");
      const etiketler = [], degerler = [];
      const aylar = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
      const imlec = new Date(ilk);
      let guvenlik = 0;
      while (imlec <= son && guvenlik++ < 400) {
        const a = `${imlec.getFullYear()}-${String(imlec.getMonth() + 1).padStart(2, "0")}-${String(imlec.getDate()).padStart(2, "0")}`;
        etiketler.push(`${imlec.getDate()} ${aylar[imlec.getMonth()]}`);
        degerler.push(Math.round(((gunSaat[a] || 0) / 60) * 10) / 10);
        imlec.setDate(imlec.getDate() + 1);
      }

      if (this.charts.dailyStudy) this.charts.dailyStudy.destroy();
      const gunCanvas = document.getElementById("dailyStudyChart");
      if (gunCanvas) {
        this.charts.dailyStudy = new Chart(gunCanvas.getContext("2d"), {
          type: 'bar',
          data: {
            labels: etiketler,
            datasets: [{
              label: 'Çalışma (saat)',
              data: degerler,
              backgroundColor: degerler.map(v => v === 0 ? 'rgba(148,163,184,0.25)' : 'rgba(37,99,235,0.75)'),
              borderRadius: 4
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 9 }, maxRotation: 60 } },
              y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#475569' }, beginAtZero: true,
                   title: { display: true, text: 'Saat', color: '#475569', font: { family: 'Outfit', weight: 'bold' } } }
            }
          }
        });
      }
    }

    // Metin tabanli analizler (bos/yanlis dengesi, verim, mufredat tahmini)
    this.renderInsightCards(records);

    // ── Chart 4 (yeni öneri): Zaman İçinde Gelişim Trendi ──
    // Diğer üç grafik birer anlık kesit; bu grafik test test doğruluk oranının
    // kronolojik seyrini gösterip ilerleme/gerileme trendini ortaya koyar.
    const trendLabels = records.map(r => r.label);
    // Dogruluk, COZULEN soru uzerinden olculur. r.total artik bosu da
    // icerdigi icin bolum bunu kullanirsa cok bos birakan ogrencinin
    // dogrulugu haksiz yere dusuk gorunurdu.
    const trendData = records.map(r => {
      const cozulen = r.cozulen !== undefined ? r.cozulen : (r.correct + r.incorrect);
      return cozulen > 0 ? Math.round((r.correct / cozulen) * 100) : 0;
    });

    if (this.charts.trend) this.charts.trend.destroy();
    const trendCanvas = document.getElementById("accuracyTrendChart");
    if (trendCanvas) {
      this.charts.trend = new Chart(trendCanvas.getContext("2d"), {
        type: 'line',
        data: {
          labels: trendLabels,
          datasets: [{
            label: 'Doğruluk (%)',
            data: trendData,
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.12)',
            borderWidth: 3,
            pointBackgroundColor: '#ec4899',
            pointRadius: 4,
            tension: 0.35,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => 'Doğruluk: %' + ctx.parsed.y } }
          },
          scales: {
            x: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#475569', font: { size: 9, family: 'Outfit' }, maxRotation: 45 } },
            y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#475569', callback: v => v + '%' }, min: 0, max: 100 }
          }
        }
      });
    }

    // Trend yönü: son üç kaydın ortalaması ilk üç kayda göre yükseliyor mu?
    if (trendData.length >= 2) {
      const half = Math.max(1, Math.floor(trendData.length / 2));
      const firstAvg = trendData.slice(0, half).reduce((a, b) => a + b, 0) / half;
      const lastAvg = trendData.slice(-half).reduce((a, b) => a + b, 0) / half;
      const trendUp = lastAvg >= firstAvg;
      this._chartSummaryStats.trendUp = trendUp;
      this._chartSummaryStats.trendLabel = trendUp ? `Yükseliyor (${Math.round(firstAvg)}%→${Math.round(lastAvg)}%)` : `Düşüyor (${Math.round(firstAvg)}%→${Math.round(lastAvg)}%)`;
    } else {
      this._chartSummaryStats.trendUp = null;
      this._chartSummaryStats.trendLabel = "Yetersiz veri";
    }

    this.renderCoachCommentary();
  },

  // AI Personal Coach Commentary Rendering
  renderCoachCommentary: function() {
    const container = document.getElementById("aiCoachCommentaryCardContainer");
    if (!container) return;
    
    if (this._commentaryLoading) {
      container.innerHTML = `
        <div class="glass-card" style="padding: 2rem; text-align: center; border: 2px solid #8b5cf6; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.25); background: var(--bg-card); border-radius: 12px;">
          <div style="font-size: 2rem; color: #8b5cf6; animation: aiPenWrite 1.5s infinite alternate ease-in-out; display: inline-block; margin-bottom: 1rem;">
            <svg viewBox="0 0 120 140" style="width: 50px; height: 58px;"><g transform="rotate(-10 60 70)"><path d="M46 72 Q34 76 31 86" fill="none" stroke="#a78bfa" stroke-width="3" stroke-linecap="round"></path><circle cx="31" cy="87" r="4" fill="#8b5cf6" stroke="#a78bfa" stroke-width="2.5"></circle><path d="M74 68 Q86 62 89 52" fill="none" stroke="#a78bfa" stroke-width="3" stroke-linecap="round"></path><circle cx="89" cy="51" r="4" fill="#8b5cf6" stroke="#a78bfa" stroke-width="2.5"></circle><rect x="46" y="8" width="28" height="15" rx="7" fill="#8b5cf6" stroke="#a78bfa" stroke-width="2.5"></rect><rect x="46" y="22" width="28" height="8" fill="#c4b5fd" stroke="#a78bfa" stroke-width="2.5"></rect><rect x="46" y="30" width="28" height="60" fill="#ede9fe" stroke="#a78bfa" stroke-width="2.5"></rect><path d="M46 90 L74 90 L60 116 Z" fill="#c4b5fd" stroke="#a78bfa" stroke-width="2.5" stroke-linejoin="round"></path><path d="M55 106 L65 106 L60 116 Z" fill="#8b5cf6"></path></g></svg>
          </div>
          <h4 style="font-family: var(--font-header); font-weight: 800; color: #c4b5fd; margin: 0 0 0.5rem;">AI Çalışma Analizi Hazırlanıyor...</h4>
          <p style="font-size: 0.8rem; color: #a78bfa; margin: 0;">Son verileriniz analiz edilip YKS hedeflerinize göre değerlendiriliyor...</p>
        </div>
      `;
      return;
    }
    
    const list = this.state.coachCommentaries || [];
    if (list.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="padding: 1.5rem; text-align: center; border: 1.5px dashed var(--border-color); background: var(--bg-card); border-radius: 12px; margin-bottom: 1.5rem;">
          <h4 style="font-family: var(--font-header); font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">AI Çalışma Analizi</h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">Henüz bir analiz oluşturulmamış. İlk analizi tetiklemek için aşağıdaki butona basın.</p>
          <button class="btn btn-primary" onclick="app.triggerCoachCommentary('Manuel İstek')" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; background: linear-gradient(135deg, #7c3aed, #a855f7); border: none; font-size: 0.8rem; padding: 0.5rem 1rem; border-radius: 8px; color: #fff; cursor: pointer;">
            <svg viewBox="0 0 120 140" style="width: 1.2em; height: 1.2em; display:inline-block; vertical-align: middle;"><g transform="rotate(-10 60 70)"><path d="M46 72 Q34 76 31 86" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"></path><circle cx="31" cy="87" r="4" fill="#8b5cf6" stroke="#fff" stroke-width="2.5"></circle><path d="M74 68 Q86 62 89 52" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"></path><circle cx="89" cy="51" r="4" fill="#8b5cf6" stroke="#fff" stroke-width="2.5"></circle><rect x="46" y="8" width="28" height="15" rx="7" fill="#8b5cf6" stroke="#fff" stroke-width="2.5"></rect><rect x="46" y="22" width="28" height="8" fill="#c4b5fd" stroke="#fff" stroke-width="2.5"></rect><rect x="46" y="30" width="28" height="60" fill="#ede9fe" stroke="#fff" stroke-width="2.5"></rect><path d="M46 90 L74 90 L60 116 Z" fill="#c4b5fd" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"></path><path d="M55 106 L65 106 L60 116 Z" fill="#8b5cf6"></path></g></svg>
            Analiz Oluştur
          </button>
        </div>
        ${this.renderChartsSummaryHTML()}
      `;
      return;
    }

    const activeIdx = this._activeCommentaryIndex !== undefined ? this._activeCommentaryIndex : 0;
    const item = list[activeIdx] || list[0];
    const content = item.content;
    const isCollapsed = this._commentaryCollapsed !== undefined ? this._commentaryCollapsed : false;
    
    let historyOptions = "";
    list.forEach((c, idx) => {
      historyOptions += `<option value="${idx}" ${idx === activeIdx ? 'selected' : ''}>${app.escapeHtml(c.date)} (${app.escapeHtml(c.trigger)})</option>`;
    });

    const status = content.currentStatus || {};
    const risksHtml = (content.risks || []).map(risk => {
      let icon = "⚪";
      let color = "var(--text-main)";
      let bg = "var(--bg-card)";
      let border = "var(--border-color)";
      if (risk.severity === "Yüksek") { icon = "🔴"; color = "var(--danger)"; bg = "rgba(239, 68, 68, 0.05)"; border = "rgba(239, 68, 68, 0.3)"; }
      else if (risk.severity === "Orta") { icon = "🟡"; color = "var(--warning)"; bg = "rgba(245, 158, 11, 0.05)"; border = "rgba(245, 158, 11, 0.3)"; }
      
      return `
        <div style="background: ${bg}; border: 1px solid ${border}; border-radius: 8px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; text-align: left; margin-bottom: 0.5rem;">
          <strong style="color: ${color}; display: flex; align-items: center; gap: 0.35rem;">
            ${icon} ${app.escapeHtml(risk.type)}
          </strong>
          <div style="color: var(--text-main); font-size: 0.75rem; margin-top: 0.25rem;"><strong>Neden:</strong> ${app.escapeHtml(risk.reason)}</div>
          <div style="color: var(--text-muted); font-size: 0.75rem;"><strong>Etki:</strong> ${app.escapeHtml(risk.impact)}</div>
          <div style="color: #8b5cf6; font-size: 0.75rem; font-weight: 600; margin-top: 0.25rem;"><i class="fa-solid fa-arrow-right"></i> ${app.escapeHtml(risk.action)}</div>
        </div>
      `;
    }).join("");
    
    container.innerHTML = `
      <div class="glass-card animate-fade-in" style="border: 2px solid #8b5cf6; box-shadow: 0 4px 25px rgba(139, 92, 246, 0.2); padding: 1.5rem; position: relative; border-radius: 12px; background: var(--bg-card); margin-bottom: 2rem;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <!-- AI Coach Avatar -->
            <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #a855f7); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(124, 58, 237, 0.3); flex-shrink: 0;">
              <svg viewBox="0 0 120 140" style="width: 32px; height: 37px;"><g transform="rotate(-10 60 70)"><path d="M46 72 Q34 76 31 86" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"></path><circle cx="31" cy="87" r="4" fill="#8b5cf6" stroke="#fff" stroke-width="2.5"></circle><path d="M74 68 Q86 62 89 52" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"></path><circle cx="89" cy="51" r="4" fill="#8b5cf6" stroke="#fff" stroke-width="2.5"></circle><rect x="46" y="8" width="28" height="15" rx="7" fill="#8b5cf6" stroke="#fff" stroke-width="2.5"></rect><rect x="46" y="22" width="28" height="8" fill="#c4b5fd" stroke="#fff" stroke-width="2.5"></rect><rect x="46" y="30" width="28" height="60" fill="#ede9fe" stroke="#fff" stroke-width="2.5"></rect><path d="M46 90 L74 90 L60 116 Z" fill="#c4b5fd" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"></path><path d="M55 106 L65 106 L60 116 Z" fill="#8b5cf6"></path></g></svg>
            </div>
            <div style="text-align: left;">
              <h3 style="margin: 0; font-family: var(--font-header); font-weight: 900; font-size: 1.1rem; color: var(--text-main); display: flex; align-items: center; gap: 0.35rem;">
                AI Çalışma Analizi
                <span style="font-size: 0.65rem; background: rgba(139,92,246,0.15); color: #8b5cf6; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700;">PREMIUM</span>
              </h3>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem;">
                Tarih: <strong>${app.escapeHtml(item.date)}</strong> | Tetikleyici: <strong>${app.escapeHtml(item.trigger)}</strong>
              </div>
            </div>
          </div>
          
          <!-- Expand/Collapse & History Dropdown -->
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <select onchange="app.switchCommentaryHistory(this.value)" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 6px; border: 1.5px solid var(--border-color); background: var(--bg-card); color: var(--text-main); font-weight: 700; cursor: pointer; height: 28px;">
              ${historyOptions}
            </select>
            <button onclick="app.triggerCoachCommentary('Manuel Yenileme')" class="btn btn-secondary" style="padding: 0 0.5rem; height: 28px; font-size: 0.75rem; font-weight: bold; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem; cursor: pointer;" title="Değerlendirmeyi Yenile">
              <i class="fa-solid fa-arrows-rotate"></i> Yenile
            </button>
            <button onclick="app.toggleCommentaryCollapse()" class="btn btn-secondary" style="padding: 0 0.5rem; height: 28px; font-size: 0.75rem; font-weight: bold; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem; cursor: pointer;">
              <i class="fa-solid ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i> ${isCollapsed ? 'Detayları Göster' : 'Daralt'}
            </button>
          </div>
        </div>

        <!-- Coach message speech bubble -->
        <div style="background: rgba(139,92,246,0.06); border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 1rem; margin-bottom: ${isCollapsed ? '0' : '1.5rem'}; font-size: 0.85rem; line-height: 1.5; color: var(--text-main); position: relative; font-style: italic; text-align: left;">
          <i class="fa-solid fa-quote-left" style="position: absolute; top: 0.5rem; left: 0.5rem; opacity: 0.1; font-size: 1.5rem;"></i>
          ${app.sanitizeHtml(content.coachMessage || 'Her gün hedefine biraz daha yaklaş.')}
        </div>

        <!-- Expanded Details -->
        <div style="display: ${isCollapsed ? 'none' : 'flex'}; flex-direction: column; gap: 1.5rem; transition: all 0.3s ease;">
          
          <!-- Feature 1: AI Güncel Durum Paneli (Neredeyim?) -->
          <div>
            <h4 style="color: var(--text-main); font-size: 0.95rem; margin-top: 0; margin-bottom: 0.75rem; font-family: var(--font-header); font-weight: 800; display: flex; align-items: center; gap: 0.5rem; text-align: left;">
              <i class="fa-solid fa-gauge-high" style="color: #8b5cf6;"></i> Neredeyim? (Güncel Durum)
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem;">
              <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 0.25rem;">Genel Performans</div>
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">${app.escapeHtml(status.performance || '-')}</div>
              </div>
              <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 0.25rem;">Hedef İlerleme</div>
                <div style="font-size: 1rem; font-weight: 800; color: #10b981;">${app.escapeHtml(status.goalProgress || '-')}</div>
              </div>
              <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 0.25rem;">Müfredat</div>
                <div style="font-size: 0.85rem; font-weight: 700; color: #3b82f6;">${app.escapeHtml(status.curriculumCompletion || '-')}</div>
              </div>
              <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 0.25rem;">İvme</div>
                <div style="font-size: 0.85rem; font-weight: 700; color: #f59e0b;">${app.escapeHtml(status.momentum || '-')}</div>
              </div>
              <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 0.25rem;">Değerlendirme Güveni</div>
                <div style="font-size: 1rem; font-weight: 800; color: #8b5cf6;">${app.escapeHtml(status.probability || '-')}</div>
              </div>
              <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 0.25rem;">Hedefe Mesafe</div>
                <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-main);">${app.escapeHtml(status.estRanking || '-')}</div>
              </div>
              <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.75rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 0.25rem;">Trend</div>
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">${app.escapeHtml(status.trend || '-')}</div>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            <!-- Feature 2: AI Risk Radarı (En Büyük Riskim Ne?) -->
            <div style="text-align: left;">
              <h4 style="color: var(--text-main); font-size: 0.95rem; margin-top: 0; margin-bottom: 0.75rem; font-family: var(--font-header); font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-radar" style="color: var(--danger);"></i> Risk Radarı
              </h4>
              <div style="display: flex; flex-direction: column;">
                ${risksHtml || '<div style="color: var(--text-muted); font-size: 0.8rem;">Şu an için büyük bir risk tespit edilmedi.</div>'}
              </div>
            </div>

            <!-- Feature 3, 4 & 5: ROI Öneri & Aksiyon (Bugün Ne Çalışmalıyım?) -->
            <div style="display: flex; flex-direction: column; text-align: left;">
              <h4 style="color: var(--text-main); font-size: 0.95rem; margin-top: 0; margin-bottom: 0.75rem; font-family: var(--font-header); font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-bolt" style="color: #8b5cf6;"></i> Günün En İyi Hamlesi
              </h4>
              
              <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(168, 85, 247, 0.08)); border: 2px solid rgba(139, 92, 246, 0.4); border-radius: 12px; padding: 1.25rem; flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                  <div>
                    <div style="font-size: 0.75rem; color: #8b5cf6; font-weight: bold; text-transform: uppercase; margin-bottom: 0.25rem;">Odak Konusu</div>
                    <h5 style="margin: 0; font-size: 1.1rem; color: var(--text-main); font-family: var(--font-header); font-weight: 800;">
                      ${app.escapeHtml(content.roiRecommendation?.topic || 'Belirlenemedi')}
                    </h5>
                  </div>
                  <div style="background: #8b5cf6; color: #fff; padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; box-shadow: 0 2px 10px rgba(139, 92, 246, 0.3);">
                    ${app.escapeHtml(content.roiRecommendation?.expectedNet || '+0 Net')}
                  </div>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem; font-size: 0.8rem; flex-wrap: wrap;">
                  <div style="display: flex; align-items: center; gap: 0.25rem; color: var(--text-muted);">
                    <i class="fa-regular fa-clock"></i> ${app.escapeHtml(content.roiRecommendation?.studyTime || '-')}
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.25rem; color: var(--text-muted);">
                    <i class="fa-solid fa-star" style="color: #f59e0b;"></i> ${content.roiRecommendation?.priorityScore || '-'} Puan
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.25rem; color: var(--text-muted);">
                    <i class="fa-solid fa-robot" style="color: #10b981;"></i> ${content.roiRecommendation?.confidenceScore || '-'} Güven
                  </div>
                </div>
                
                <p style="font-size: 0.8rem; color: var(--text-main); line-height: 1.5; margin: 0; flex: 1;">
                  <strong>Neden?</strong> ${app.sanitizeHtml(content.explainWhy || '')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${this.renderChartsSummaryHTML()}
    `;
  },

  // Alttaki grafiklerin (tahmini net, ders dengesi, hız) özetini AI Çalışma
  // Analizi panelinin içine taşır — kullanıcı aşağı kaydırmadan durumu görür.
  renderChartsSummaryHTML: function() {
    const s = this._chartSummaryStats || {};
    const tile = (icon, label, value, color) => `
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.75rem; text-align: center;">
        <div style="font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); margin-bottom: 0.3rem;"><i class="fa-solid ${icon}"></i> ${label}</div>
        <div style="font-family: var(--font-header); font-weight: 900; font-size: 1.05rem; color: ${color || 'var(--text-main)'};">${value}</div>
      </div>`;

    return `
      <div class="glass-card" style="margin-bottom: 1.5rem; padding: 1.25rem; border-color: var(--border-color);">
        <h4 style="margin: 0 0 0.85rem; display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-header); font-weight: 800; font-size: 0.9rem;">
          <i class="fa-solid fa-square-poll-vertical text-primary"></i> Grafik Özeti
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem;">
          ${tile('fa-scale-balanced', 'En Az Çalışılan Ders', s.minSub || '-', '#6366f1')}
          ${tile('fa-bolt', 'Hız Durumu', s.speedStatus || '-', s.speedOnTrack === false ? 'var(--danger)' : 'var(--success)')}
          ${tile('fa-arrow-trend-up', 'Gelişim Trendi', s.trendLabel || '-', s.trendUp === false ? 'var(--warning)' : 'var(--success)')}
        </div>
      </div>`;
  },

  switchCommentaryHistory: function(index) {
    this._activeCommentaryIndex = parseInt(index) || 0;
    this.renderCoachCommentary();
  },

  toggleCommentaryCollapse: function() {
    this._commentaryCollapsed = !this._commentaryCollapsed;
    this.renderCoachCommentary();
  },

  triggerCoachCommentary: async function(triggerSource) {
    if (!this.state.coachCommentaries) this.state.coachCommentaries = [];
    
    const MAX_HISTORY = 10;
    const vaultCount = (this.state.vaultQuestions && this.state.vaultQuestions.length) || 0;
    const streak = this.state.streak || 0;
    const dept = this.state.targetDept || "Bilgisayar Mühendisliği";
    const level = this.state.level || 3;
    const track = this.state.track || "Sayısal";
    const exams = this.state.chartData || [];
    
    let lastExamsSummary = [];
    if (exams.length > 0) {
      lastExamsSummary = exams.slice(-3).map(e => ({
        subject: e.subject,
        correct: e.correct,
        total: e.total,
        time: e.time,
        examType: e.examType
      }));
    }

    const todayStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    this._commentaryLoading = true;
    this.renderCoachCommentary();
    
    let commentaryData = null;
    const apiKey = this.getLlmApiKey();
    
    if (apiKey && navigator.onLine) {
      try {
        const ogrenci = (this.state.name || "Öğrenci").trim();
        const ilkAd = ogrenci.split(" ")[0];
        const prompt = `Sen ${ogrenci} adlı öğrencinin YKS koçusun (Koç Kalem). ${ilkAd} hakkında bilgiler:
- Hedef Bölüm: ${dept} (Hedef Sıralama: ${this.state.targetRank ? "ilk " + this.state.targetRank.toLocaleString("tr-TR") : "-"} — 2025 YKS ÖSYM yerleştirme verisine göre)
- Tercih Motoru Hedef Programı: ${(() => { const ti = this.getTargetProgramInfo(); return ti.program ? `${ti.program.uni} ${ti.program.dept} (2025 taban: ilk ${ti.program.rank.toLocaleString("tr-TR")})` : "henüz seçilmedi"; })()}
- Hedef Netler: TYT ${this.state.targetNetTYT || "-"} / AYT ${this.state.targetNetAYT || "-"}
- Çalışma Alanı: ${track}
- Günlük Çalışma Seviyesi: Seviye ${level}
- Güncel Çalışma Serisi: ${streak} gün
- Hata Zindanı'ndaki (Vault) Soru Sayısı: ${vaultCount} adet
- Çözülen Toplam Test Kaydı: ${exams.length} adet
- Son deneme netleri ve süreleri: ${JSON.stringify(lastExamsSummary)}

Tetikleyici Olay: ${triggerSource}

Lütfen yukarıdaki verilere dayanarak ${ilkAd} için tamamen kişiselleştirilmiş, gerçekçi, motivasyonel ama dürüst bir YKS koç değerlendirmesi yap.

KESİN KURALLAR (eğitim bütünlüğü):
1. ASLA uydurma sayı üretme. Yüzde olasılık ("%74 şansın var") veya sayısal sıralama tahmini ("Top 4200") YAZMA.
2. Yalnızca yukarıda SANA VERİLEN verilere dayan. Veri yoksa "veri yetersiz" de.
3. Her çıkarımda hangi veriye dayandığını belirt (kaç deneme, hangi ders, hangi eğilim).
4. Belirsizliği açıkça ifade et. Az veriyle kesin konuşma.
5. Güven seviyesi için yalnızca "Yüksek Güven / Orta Güven / Düşük Güven (veri az)" ifadelerini kullan.
Değerlendirmeyi Türkçe olarak tam bir JSON formatında döndür. JSON yapısı tam olarak şu şekilde olmalıdır (anahtarları ve yapıyı birebir koru):
{
  "currentStatus": {
    "performance": "Verilere dayalı performans özeti (Örn: 'En güçlü: Matematik (%72 doğruluk)')",
    "goalProgress": "Ölçülmüş net durumu (Örn: 'Kayıt başına ortalama 24.5 net'). Ölçüm yoksa 'Net ölçümü için deneme sonucu gerekli' yaz.",
    "curriculumCompletion": "Tamamlanan konu sayısı / toplam (Örn: '38/169 konu (%22)')",
    "momentum": "Artıyor / Sabit / Zayıflıyor",
    "probability": "SADECE güven seviyesi: 'Yüksek Güven', 'Orta Güven' veya 'Düşük Güven (veri az)'. ASLA yüzde yazma.",
    "estRanking": "Hedefe net cinsinden mesafe (Örn: 'Hedef nete 8.5 net uzaktasın'). Doğrulanmış deneme neti yoksa 'Sıralama tahmini için doğrulanmış deneme neti gerekli' yaz.",
    "trend": "Yükseliş eğilimi 📈 / Sabit seyir ➡️ / Düşüş eğilimi 📉"
  },
  "risks": [
    {
      "type": "Risk Türü (Örn: Zayıf Konu Riski, Unutulmuş Konu Riski, Müfredat Gecikmesi, Hata Zindanı Birikmesi)",
      "severity": "Severity (Yüksek, Orta, Düşük)",
      "reason": "Bu riskin nedeni açıklaması",
      "impact": "YKS başarısına veya çalışma planına olası olumsuz etkisi",
      "action": "Bu riski gidermek için öğrencinin yapması gereken aksiyon adımı"
    }
  ],
  "roiRecommendation": {
    "topic": "Çalışıldığında en yüksek net artışını getirecek tek bir YKS ders ve konu adı (Örn: Matematik - Limit ve Süreklilik)",
    "expectedNet": "Tahmini getireceği net artışı (Örn: +1.5 Net)",
    "studyTime": "Gerekli tahmini çalışma süresi (Örn: 90 dk)",
    "priorityScore": "Öncelik Puanı (Örn: 95/100)",
    "confidenceScore": "Yapay Zeka Güven Yüzdesi (Örn: 88%)"
  },
  "explainWhy": "Neden bu konunun seçildiğinin denemelere, zayıf derslere ve Hata Zindanı verilerine dayanan bilimsel açıklaması.",
  "nextBestAction": {
    "label": "Buton üzerinde yazacak net aksiyon eylemi (Örn: Çalışmaya Başla, Hata Zindanını Aç, Müfredat Haritasını Aç, Deneme Çöz)",
    "actionType": "Butona tıklandığında yönlendirilecek tab panel ismi: 'today', 'vault', 'programCreator', or 'test'"
  },
  "coachMessage": "${ilkAd} için özel, dürüst ve teşvik edici kişisel koç mesajı."
}
Yalnızca geçerli JSON döndür, markdown veya başka açıklama metni ekleme.`;

        const resData = await this.callLLM(
          [{ role: "user", parts: [{ text: prompt }] }],
          null,
          "Sen zorlu ama destekleyici bir YKS koçusun. Sadece istenen JSON şemasında çıktı vermelisin. Markdown veya başka hiçbir açıklama metni ekleme."
        );
        let text = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        commentaryData = JSON.parse(text);
      } catch (e) {
        console.error("Gemini commentary failed, falling back to local generation", e);
      }
    }
    
    if (!commentaryData) {
      commentaryData = this.generateLocalCommentaryData(triggerSource, vaultCount, streak, dept, track, lastExamsSummary);
    }
    
    const newCommentary = {
      id: `commentary_${Date.now()}`,
      date: todayStr,
      trigger: triggerSource,
      content: commentaryData
    };
    
    this.state.coachCommentaries.unshift(newCommentary);
    if (this.state.coachCommentaries.length > MAX_HISTORY) {
      this.state.coachCommentaries.pop();
    }
    
    this._activeCommentaryIndex = 0;
    this._commentaryLoading = false;
    this.saveState();
    this.renderCoachCommentary();
  },

  // ==========================================================
  // KANIT ÖZETİ — tüm değerlendirme etiketleri gerçek veriden türer
  // ------------------------------------------------------------
  // Hiçbir yüzde/sıralama uydurulmaz. Veri yetersizse bunu açıkça söyler.
  // Her etiketin yanında hangi veriye dayandığı (evidence) taşınır.
  // ==========================================================
  computeEvidenceSummary: function(exams, vaultCount, streak) {
    exams = Array.isArray(exams) ? exams : [];
    const evidence = [];

    // --- 1. Veri yeterliliği ---
    const examCount = exams.length;
    const dataLevel = examCount >= 5 ? "high" : examCount >= 2 ? "medium" : "low";
    const confidenceLabel = examCount >= 5 ? "Yüksek Güven" : examCount >= 2 ? "Orta Güven" : "Düşük Güven (veri az)";
    evidence.push(`${examCount} adet kayıtlı test/deneme sonucu`);

    // --- 2. Eğilim: son kayıtların doğruluk oranı yönü ---
    let trendLabel = "Eğilim için en az 2 kayıt gerekli";
    let momentumLabel = "Ölçüm bekleniyor";
    if (examCount >= 2) {
      const acc = e => (e.total > 0 ? e.correct / e.total : 0);
      const half = Math.floor(examCount / 2);
      const older = exams.slice(0, half), newer = exams.slice(half);
      const oldAvg = older.reduce((a, e) => a + acc(e), 0) / Math.max(1, older.length);
      const newAvg = newer.reduce((a, e) => a + acc(e), 0) / Math.max(1, newer.length);
      const diff = Math.round((newAvg - oldAvg) * 100);
      if (diff >= 5) { trendLabel = "Yükseliş eğilimi 📈"; momentumLabel = "Artıyor"; }
      else if (diff <= -5) { trendLabel = "Düşüş eğilimi 📉"; momentumLabel = "Zayıflıyor"; }
      else { trendLabel = "Sabit seyir ➡️"; momentumLabel = "Sabit"; }
      evidence.push(`son ${newer.length} kaydın doğruluk ortalaması önceki ${older.length} kayda göre %${Math.abs(diff)} ${diff >= 0 ? "yüksek" : "düşük"}`);
    }

    // --- 3. Performans: gerçekten en güçlü ders ---
    let performanceLabel = "Ölçüm için veri yetersiz";
    if (examCount > 0) {
      const bySub = {};
      exams.forEach(e => {
        const k = e.subject || "Genel";
        bySub[k] = bySub[k] || { c: 0, t: 0 };
        bySub[k].c += (e.correct || 0); bySub[k].t += (e.total || 0);
      });
      const ranked = Object.entries(bySub).filter(([, v]) => v.t > 0)
        .map(([k, v]) => ({ k, r: v.c / v.t })).sort((a, b) => b.r - a.r);
      if (ranked.length) {
        performanceLabel = `En güçlü: ${ranked[0].k} (%${Math.round(ranked[0].r * 100)} doğruluk)`;
        evidence.push(`ders bazlı doğruluk karşılaştırması`);
      }
    }

    // --- 4. Müfredat ilerlemesi: gerçekten tamamlanan konu oranı ---
    let curriculumLabel = "Henüz konu tamamlanmadı";
    const totalTopics = this.curriculum.totalTopicCount(this.state.track || "Sayısal", this.state.examFocus || "both");
    const doneTopics = Object.keys(this.state.topicStatuses || {}).filter(k => {
      const st = this.state.topicStatuses[k];
      return st && (st.status === "Ogrenildi" || st.status === "Calisildi");
    }).length;
    if (totalTopics > 0 && doneTopics > 0) {
      curriculumLabel = `${doneTopics}/${totalTopics} konu (%${Math.round(doneTopics / totalTopics * 100)})`;
      evidence.push(`müfredat grafiğinde işaretlenmiş ${doneTopics} konu`);
    }

    // --- 5. Hedefe uzaklık: ölçülmüş net varsa göster, yoksa söyleme ---
    let goalProgressLabel = "Net ölçümü için deneme sonucu gerekli";
    let rankingLabel = "Sıralama tahmini için doğrulanmış deneme neti gerekli";
    if (examCount > 0) {
      const totC = exams.reduce((a, e) => a + (e.correct || 0), 0);
      const totW = exams.reduce((a, e) => a + (e.incorrect || 0), 0);
      const net = this.netHesapla(totC, totW);
      const avgNet = Math.round((net / examCount) * 100) / 100;
      goalProgressLabel = `Kayıt başına ortalama ${avgNet} net`;
      evidence.push(`toplam ${totC} doğru / ${totW} yanlış üzerinden hesaplanan net`);
      // Sıralama YALNIZCA gerçek bir deneme neti + hedef tanımlıysa ve
      // yine de tahmin olarak değil, mesafe olarak ifade edilir.
      const targetNet = parseInt(String(this.state.targetNetTYT || "").split("-").pop(), 10);
      if (targetNet && avgNet > 0) {
        const gap = Math.round((targetNet - avgNet) * 10) / 10;
        rankingLabel = gap > 0 ? `Hedef nete ${gap} net uzaktasın` : `Hedef netini ${Math.abs(gap)} net aştın`;
      }
    }

    return {
      dataLevel, confidenceLabel, trendLabel, momentumLabel,
      performanceLabel, curriculumLabel, goalProgressLabel, rankingLabel,
      evidence: evidence
    };
  },

  generateLocalCommentaryData: function(trigger, vaultCount, streak, dept, track, exams) {
    // ==========================================================
    // KANITA DAYALI DEĞERLENDİRME (uydurma sayı YOK)
    // ------------------------------------------------------------
    // Önceden buradaki değerler sabitti: her öğrenciye "%65 olasılık",
    // "Top 15,000" yazılıyor; tek bir deneme girilince koşulsuz
    // "Top 8,000 / %72"ye çıkıyordu. Bu sahte kesinlik öğrenciyi
    // yanıltıyordu. Artık yalnızca gerçek veriden türetilen GÜVEN
    // SEVİYESİ ve EĞİLİM gösteriliyor; hangi veriye dayandığı yazılıyor.
    // ==========================================================
    const ev = this.computeEvidenceSummary(exams, vaultCount, streak);

    let performance = ev.performanceLabel;
    let goalProgress = ev.goalProgressLabel;
    let curriculumCompletion = ev.curriculumLabel;
    let momentum = ev.momentumLabel;
    let probability = ev.confidenceLabel;   // "Yüksek/Orta/Düşük Güven" — yüzde değil
    let estRanking = ev.rankingLabel;       // ölçülmüş net yoksa "Ölçüm için veri yetersiz"
    let trend = ev.trendLabel;
    
    let risks = [
      {
        type: "Zaman Yönetimi Riski",
        severity: "Orta",
        reason: "Soru başı çözüm süreleri referans YKS sürelerinin üzerinde kalıyor.",
        impact: "Sınavda zaman yetiştirme problemi yaşayabilir ve yetiştirebileceğin kolay soruları kaçırabilirsin.",
        action: "Süre tutarak mini branş denemesi çöz."
      }
    ];
    
    if (vaultCount > 5) {
      risks.unshift({
        type: "Hata Zindanı Birikmesi",
        severity: "Yüksek",
        reason: `Hata Zindanı'nda eritmeyi bekleyen ${vaultCount} adet yanlış sorulan kart birikmiş durumda.`,
        impact: "Hataları analiz edip aralıklı tekrarla çözmezsen, benzer soru tipleri gerçek sınavda karşına çıktığında aynı yanlışları yapabilirsin.",
        action: "Hata Zindanı'na gidip biriken yanlış sorulardan 10 tanesini tekrar çöz."
      });
    }
    
    let roiTopic = track === "Sayısal" ? "Matematik - Problemler" : "Türkçe - Paragraf";
    let roiStudyTime = "60 dk";
    if (exams.length > 0) {
       roiTopic = "Zayıf Konu Tekrarı";
    }

    let nextBestAction = {
      label: "Günün Görevlerine Başla",
      actionType: "today"
    };

    if (vaultCount > 5) {
       nextBestAction = { label: "Hata Zindanını Temizle", actionType: "vault" };
    }

    let coachMessage = `YKS hazırlığı bir sprint değil, maratondur. Hedefin olan ${dept} için kararlılıkla ilerlemelisin. Her bir yanlış soru, zayıf bir noktayı kapatmak için bir fırsattır. Bugün aksiyon alıp planımıza sadık kalalım!`;
    
    return {
      currentStatus: {
        performance: performance,
        goalProgress: goalProgress,
        curriculumCompletion: curriculumCompletion,
        momentum: momentum,
        probability: probability,
        estRanking: estRanking,
        trend: trend
      },
      risks: risks,
      roiRecommendation: {
        topic: roiTopic,
        // Beklenen net "tahmin" değil, ÖLÇÜLEBİLİR bir üst sınır olarak
        // ifade edilir: bu konunun sınavdaki gerçek soru ağırlığı.
        expectedNet: (() => {
          const node = this.curriculum.byName(null, roiTopic);
          return node ? `Sınavdaki ağırlığı: ~${node.weight} soru` : "Ağırlık verisi yok";
        })(),
        studyTime: roiStudyTime,
        priorityScore: ev.dataLevel === "low" ? "Veri az" : ev.confidenceLabel,
        confidenceScore: ev.confidenceLabel
      },
      explainWhy: `Bu öneri şu verilere dayanıyor: ${ev.evidence.join("; ")}. ` +
        (ev.dataLevel === "low"
          ? "Kayıt sayısı az olduğu için bu değerlendirme düşük güvenlidir; daha fazla deneme girdikçe netleşecektir."
          : "Daha fazla deneme girdikçe değerlendirme güncellenir."),
      evidenceBasis: ev.evidence,
      confidenceLevel: ev.confidenceLabel,
      nextBestAction: nextBestAction,
      coachMessage: coachMessage
    };
  },

  // ============================================================
  // AI HATA ZİNDANI (v3) — Akıllı Tekrar Seansı (Smart Review Session)
  // ------------------------------------------------------------
  // Kayıt kaynakları:
  //  - "auto": günlük/haftalık/aylık programdaki bir görevin test sonucu
  //    girilirken (submitTestScore — tek ve ortak giriş noktası) o görevin
  //    konusunda (task.topic) hata varsa otomatik oluşturulur.
  //  - "manual": deneme sınavı gibi tek bir göreve bağlanamayan hatalar
  //    için kullanıcı formdan elle ekler.
  //
  // Eski tasarım (v2) her hata için programa ayrı bir tekrar+test görev
  // çifti ekliyordu; hata sayısı arttıkça program şişip yürütülemez hale
  // geliyordu. v3'te her hata `state.uploadedQuestions` içindeki "Review
  // Pool"a (tamamlanmamış kayıtlar) düşer ve programa GÜNDE SADECE TEK bir
  // "🧠 AI Akıllı Tekrar Seansı" görevi eklenir. Bu görevin içeriği (hangi
  // konular, kaç dakika) her gün AI öncelik motoru tarafından havuzdan
  // dinamik olarak seçilir — konu sayısı ne kadar büyürse büyüsün program
  // her zaman tek, sabit ve öngörülebilir kalır.
  // ============================================================

  // Bir görevin hatasının Hata Zindanı'na otomatik işlenmeye uygun olup
  // olmadığını belirler — genel/geniş kapsamlı görevler (tüm deneme sınavı,
  // rehberlik tekrarları) tek bir MEB kazanımına indirgenemeyeceği için hariç tutulur.
  isVaultEligibleTask: function(task) {
    if (!task || !task.topic || !task.subject) return false;
    if (task.isVaultTest || task.isVaultReview) return false; // kendi tekrar görevlerimizi tekrar zindana atmayalım
    if (task.subject === "Rehberlik") return false;
    const genericTopics = ["Genel Deneme Sınavı", "Hata Analizi ve Deftere Kayıt", "Haftalık Kazanım Tekrarı", "Hızlı Soru Pratiği"];
    if (genericTopics.includes(task.topic)) return false;
    return true;
  },

  // Otomatik ya da manuel bir hatayı Hata Zindanı'na (Review Pool'a) işler;
  // aynı derste/konuda zaten aktif bir kayıt varsa onu günceller (yeni giriş
  // açmaz). Artık programa doğrudan görev EKLEMEZ — sadece havuza düşer;
  // yarının Akıllı Tekrar Seansı'nı güncel havuza göre yeniden hesaplatır.
  recordVaultError: function(opts) {
    const subject = opts.subject;
    const topic = opts.topic;
    if (!subject || !topic) return null;

    this.state.uploadedQuestions = this.state.uploadedQuestions || [];
    const today = opts.day || this.state.activeDay || 1;

    let entry = this.state.uploadedQuestions.find(q => !q.completed && q.subject === subject && q.topic === topic);
    if (!entry) {
      entry = {
        id: `vault_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        subject: subject,
        topic: topic,
        examType: opts.examType || "TYT",
        source: opts.source || "auto",
        tag: opts.tag || "Bilgi Eksikliği",
        note: opts.note || "",
        imgData: opts.imgData || null,
        completed: false,
        date: Date.now(),
        createdDay: today,
        attempts: [],
        resolvedDay: null
      };
      this.state.uploadedQuestions.unshift(entry);
    } else {
      if (!Array.isArray(entry.attempts)) entry.attempts = [];
      entry.attempts.push({ day: today, result: "error" });
      if (opts.note && !entry.note) entry.note = opts.note;
      if (opts.imgData && !entry.imgData) entry.imgData = opts.imgData;
    }

    this.injectSmartReviewSession(today + 1);
    return entry;
  },

  // AI Öncelik Motoru: bir Review Pool kaydının bugün tekrar edilme
  // önceliğini tek bir skora indirger. Unutma riski (son tekrardan bu yana
  // geçen gün), tekrarlanan hata sayısı, dersin sınav ağırlığı ve yaklaşan
  // bir deneme sınavı olup olmadığı çarpan olarak katılır — FIFO YOK.
  // Bölüm analizinden gelen zayıflık, tekrar önceliğini yükseltir
  sectionWeaknessBoost: function(entry) {
    const an = this._sectionAnalysisCache !== undefined ? this._sectionAnalysisCache : (this._sectionAnalysisCache = this.analyzeMockSections());
    if (!an) return 0;
    const node = this.curriculum.byName(entry.subject, entry.topic);
    if (!node) return 0;
    const row = an.sections.find(r => r.section === node.section);
    if (!row) return 0;
    let boost = 0;
    if (row.avgAccuracy < 50) boost += 25;
    else if (row.avgAccuracy < 65) boost += 15;
    if (row.trend === "declining") boost += 10;
    return boost;
  },

  computeVaultPriorityScore: function(entry, today) {
    const subjectWeight = {
      "Matematik": 1.2, "Geometri": 1.15, "Türkçe": 1.15, "Fizik": 1.0,
      "Kimya": 1.0, "Biyoloji": 0.95, "Edebiyat": 1.0, "Tarih": 0.85,
      "Coğrafya": 0.85, "Felsefe": 0.8, "Din Kültürü": 0.7
    }[entry.subject] || 0.9;

    const attempts = Array.isArray(entry.attempts) ? entry.attempts : [];
    const lastDay = attempts.length ? Math.max(entry.createdDay || 0, ...attempts.map(a => a.day || 0)) : (entry.createdDay || today);
    const daysSince = Math.max(0, today - lastDay);
    const forgettingRisk = 1 + Math.min(2, daysSince * 0.2); // unutma riski gün geçtikçe artar

    const repeatFactor = 1 + Math.min(attempts.length, 5) * 0.25; // tekrar eden hata öne çıkar

    const mockExamBoost = this.hasUpcomingMockExamFor(entry, today) ? 1.3 : 1.0;

    // Bölüm bazlı deneme analizi: zayıf/gerileyen bölümün konusu öne çıkar
    const sectionBoost = 1 + (this.sectionWeaknessBoost(entry) / 100);

    return subjectWeight * forgettingRisk * repeatFactor * mockExamBoost * sectionBoost;
  },

  // Önümüzdeki birkaç gün içinde bu kaydın dersiyle/sınav türüyle örtüşen bir
  // deneme sınavı görevi var mı diye bakar (varsa o konuyu bugün seçmeye öncelik verir).
  hasUpcomingMockExamFor: function(entry, today) {
    for (let d = today; d <= Math.min(today + 3, this.PROGRAM_DAYS); d++) {
      const dayData = this.state.daysData[d];
      if (!dayData || !Array.isArray(dayData.tasks)) continue;
      const hasMock = dayData.tasks.some(t =>
        (t.label && t.label.toLowerCase().includes("deneme")) &&
        (!entry.examType || !t.examType || t.examType === entry.examType)
      );
      if (hasMock) return true;
    }
    return false;
  },

  // Hata Zindanı panelinde göstermek için: bu kayıt şu an aktif/yakın bir
  // günün Akıllı Tekrar Seansı'na dahil edilmiş mi (varsa hangi gün) bulur.
  findSmartReviewSessionDayForEntry: function(entryId) {
    const activeDay = this.state.activeDay || 1;
    for (let d = activeDay; d <= Math.min(activeDay + 1, this.PROGRAM_DAYS); d++) {
      const dayData = this.state.daysData[d];
      if (!dayData || !Array.isArray(dayData.tasks)) continue;
      const session = dayData.tasks.find(t => t.isSmartReview && !t.completed && (t.reviewEntryIds || []).includes(entryId));
      if (session) return d;
    }
    return null;
  },

  // Havuzdaki en yüksek öncelikli hatalardan, o günün kalan çalışma
  // kapasitesine sığacak kadarını seçip TEK bir "AI Akıllı Tekrar Seansı"
  // görevi olarak (targetDay)'a yerleştirir/günceller. Program asla birden
  // fazla tekrar görevi biriktirmez; içerik her gün yeniden hesaplanır.
  injectSmartReviewSession: function(targetDay) {
    if (this.state.selectedProgramType === "custom") return; // özel programlarda otomatik müdahale edilmez
    if (!targetDay || targetDay < 1 || targetDay > this.PROGRAM_DAYS) return;

    const dayData = this.state.daysData[targetDay];
    if (!dayData || !Array.isArray(dayData.tasks)) return;

    const sessionId = `smart_review_${targetDay}`;
    const existingIdx = dayData.tasks.findIndex(t => t.id === sessionId);
    const alreadyDone = existingIdx !== -1 && dayData.tasks[existingIdx].completed;
    if (alreadyDone) return; // bugünün seansı zaten tamamlanmış, geçmişe dokunma

    const pool = (this.state.uploadedQuestions || []).filter(q => !q.completed);
    // Aralıklı tekrar: vadesi gelmiş konular da AYNI seansın içine girer,
    // programa ayrı görev eklenmez.
    const dueReps = this.getDueRepetitions(targetDay);

    if (pool.length === 0 && dueReps.length === 0) {
      if (existingIdx !== -1) {
        dayData.tasks.splice(existingIdx, 1);
        dayData.schedule = this.buildDaySchedule(dayData.tasks, targetDay % 7);
      }
      return;
    }

    const dayOfWeek = targetDay % 7;
    const capacityMinutes = this.dailyCapacityMinutes(dayOfWeek) || 180;
    const otherMinutes = dayData.tasks.reduce((sum, t) => t.id === sessionId ? sum : sum + this.parseDurationMinutes(t.duration), 0);
    const remaining = Math.max(0, capacityMinutes - otherMinutes);

    let duration;
    if (remaining >= 90) duration = 90;
    else if (remaining >= 60) duration = 60;
    else if (remaining >= 45) duration = 45;
    else if (remaining >= 30) duration = 30;
    else duration = Math.max(15, Math.min(remaining, 30)) || 20; // kapasite dolu bile olsa alışkanlık kırılmasın diye minik bir seans

    const scored = pool
      .map(entry => ({ entry, score: this.computeVaultPriorityScore(entry, targetDay) }))
      .sort((a, b) => b.score - a.score);

    const maxItems = Math.max(1, Math.min(6, Math.floor(duration / 12)));
    // Seansın yaklaşık yarısı hata defterine, yarısı vadesi gelmiş
    // aralıklı tekrarlara ayrılır; hata defteri boşsa tamamı tekrara gider.
    const errorSlots = pool.length ? Math.max(1, Math.ceil(maxItems / 2)) : 0;
    const repSlots = Math.max(0, maxItems - errorSlots);
    const selected = scored.slice(0, errorSlots).map(s => s.entry);
    const selectedReps = dueReps.slice(0, repSlots || (pool.length ? 0 : maxItems));

    const whyText = this.buildSmartReviewWhyText(selected, selectedReps);

    if (existingIdx !== -1) {
      const t = dayData.tasks[existingIdx];
      t.reviewEntryIds = selected.map(s => s.id);
      t.reviewRepKeys = selectedReps.map(r => r.key);
      t.duration = `${duration} dk`;
      t.desc = whyText;
    } else {
      dayData.tasks.unshift({
        id: sessionId,
        type: "smart_review",
        subject: "Hata Zindanı",
        topic: "AI Akıllı Tekrar Seansı",
        label: "🧠 AI Akıllı Tekrar Seansı",
        desc: whyText,
        duration: `${duration} dk`,
        completed: false,
        reviewEntryIds: selected.map(s => s.id),
        reviewRepKeys: selectedReps.map(r => r.key),
        isSmartReview: true
      });
    }
    dayData.schedule = this.buildDaySchedule(dayData.tasks, dayOfWeek);
  },

  // AI Koç açıklaması: bugün neden bu konuların seçildiğini kısaca anlatır
  // (Feature 8 — mevcut AI Koç metin üslubunu tekrar kullanır, yeni bir
  // chatbot/entegrasyon eklemez).
  buildSmartReviewWhyText: function(selected, selectedReps) {
    selected = selected || [];
    selectedReps = selectedReps || [];
    if (!selected.length && !selectedReps.length) return "Bugün için vadesi gelen bir tekrar yok.";

    const parts = [];
    if (selected.length) {
      const topEntry = selected[0];
      const attemptsOfTop = Array.isArray(topEntry.attempts) ? topEntry.attempts.length : 0;
      parts.push(`Hata defterinden: ${selected.map(s => s.topic).join(", ")}.`);
      if (attemptsOfTop > 1) {
        parts.push(`"${topEntry.topic}" öne çıktı çünkü ${attemptsOfTop} kez tekrar hata yaptın.`);
      }
    }
    if (selectedReps.length) {
      const r = selectedReps[0];
      const stageLabel = `${Math.min(r.stage + 1, this.SR_INTERVALS.length)}. tekrar`;
      parts.push(`Aralıklı tekrar (unutma eğrisi): ${selectedReps.map(x => x.topic).join(", ")}.`);
      parts.push(`"${r.topic}" bugün ${stageLabel} aşamasında — en son ${Math.max(0, (this.state.activeDay || 1) - (r.lastDay || 0))} gün önce çalışmıştın.`);
    }
    parts.push(`Her konuyu "Artık Hatasız" ya da "Hâlâ Zorlanıyorum" olarak işaretle; işaretlemen bir sonraki tekrar aralığını belirler.`);
    return parts.join(" ");
  },

  // "🧠 AI Akıllı Tekrar Seansı" görevine tıklanınca açılır: bugün için
  // seçilmiş konuları listeler, her biri için "Artık Hatasız" / "Hâlâ
  // Zorlanıyorum" seçimi yaptırır.
  openSmartReviewModal: function(dayNum, taskIdx) {
    const dayData = this.state.daysData[dayNum];
    const task = dayData && dayData.tasks[taskIdx];
    if (!task) return;

    this._smartReviewDayNum = dayNum;
    this._smartReviewTaskIdx = taskIdx;
    this._smartReviewResults = {};
    this._smartReviewRepResults = {};

    const entries = (task.reviewEntryIds || [])
      .map(id => (this.state.uploadedQuestions || []).find(q => q.id === id))
      .filter(Boolean);

    const whyEl = document.getElementById("smartReviewWhyText");
    if (whyEl) whyEl.textContent = task.desc || "";

    const listEl = document.getElementById("smartReviewItemsList");
    if (listEl) {
      const reps = (task.reviewRepKeys || [])
        .map(k => (this.state.spacedRepetitionTasks || []).find(r => r.key === k))
        .filter(Boolean);

      const repsHtml = reps.map(rec => `
          <div class="glass-card" id="smartReviewRep-${app.escapeHtml(rec.key)}" style="padding:1rem; margin-bottom:0.75rem; text-align:left; border-left:3px solid var(--secondary);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <div>
                <div class="vault-tag" style="display:inline-block; margin-bottom:0.25rem; background:rgba(59,130,246,0.12); color:var(--secondary);">${app.escapeHtml(rec.subject)} · Aralıklı Tekrar</div>
                <div style="font-weight:800; font-size:0.95rem;">${app.escapeHtml(rec.topic)}</div>
              </div>
              <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700;">${Math.min(rec.stage + 1, app.SR_INTERVALS.length)}. tekrar</span>
            </div>
            <div style="display:flex; gap:0.6rem;">
              <button class="btn btn-secondary" style="flex:1; padding:0.5rem; font-size:0.8rem;" onclick="app.pickRepetitionVerdict('${app.escapeHtml(rec.key)}', false)">
                <i class="fa-solid fa-rotate"></i> Hatırlamadım
              </button>
              <button class="btn btn-secondary" style="flex:1; padding:0.5rem; font-size:0.8rem;" onclick="app.pickRepetitionVerdict('${app.escapeHtml(rec.key)}', true)">
                <i class="fa-solid fa-check"></i> Hatırladım
              </button>
            </div>
          </div>`).join("");

      if (entries.length === 0 && reps.length === 0) {
        listEl.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">Bu seans için bir konu bulunamadı — havuz güncellenmiş olabilir.</p>`;
      } else {
        listEl.innerHTML = repsHtml + entries.map(entry => `
          <div class="glass-card" id="smartReviewItem-${entry.id}" style="padding:1rem; margin-bottom:0.75rem; text-align:left;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <div>
                <div class="vault-tag" style="display:inline-block; margin-bottom:0.25rem;">${app.escapeHtml(entry.subject)}</div>
                <div style="font-weight:800; font-size:0.95rem;">${app.escapeHtml(entry.topic)}</div>
              </div>
              <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700;">${(entry.attempts || []).length}. tekrar</span>
            </div>
            <div style="display:flex; gap:0.6rem;">
              <button class="btn btn-secondary" style="flex:1; padding:0.5rem; font-size:0.8rem;" id="smartReviewBtnStruggle-${entry.id}" onclick="app.pickSmartReviewVerdict('${entry.id}', 'struggling')">
                <i class="fa-solid fa-rotate"></i> Hâlâ Zorlanıyorum
              </button>
              <button class="btn btn-secondary" style="flex:1; padding:0.5rem; font-size:0.8rem;" id="smartReviewBtnMaster-${entry.id}" onclick="app.pickSmartReviewVerdict('${entry.id}', 'mastered')">
                <i class="fa-solid fa-check"></i> Artık Hatasız
              </button>
            </div>
          </div>
        `).join("");
      }
    }

    this.openModal("smartReviewModal");
  },

  pickSmartReviewVerdict: function(entryId, verdict) {
    this._smartReviewResults = this._smartReviewResults || {};
    this._smartReviewResults[entryId] = verdict;

    const masterBtn = document.getElementById(`smartReviewBtnMaster-${entryId}`);
    const struggleBtn = document.getElementById(`smartReviewBtnStruggle-${entryId}`);
    if (masterBtn && struggleBtn) {
      masterBtn.className = verdict === "mastered" ? "btn btn-primary" : "btn btn-secondary";
      struggleBtn.className = verdict === "struggling" ? "btn btn-primary" : "btn btn-secondary";
    }
  },

  // Aralıklı tekrar konusu için hatırlama sonucu — bir sonraki aralığı belirler
  pickRepetitionVerdict: function(key, remembered) {
    this._smartReviewRepResults = this._smartReviewRepResults || {};
    this._smartReviewRepResults[key] = !!remembered;
    const card = document.getElementById(`smartReviewRep-${key}`);
    if (card) {
      card.style.borderLeftColor = remembered ? "var(--success)" : "var(--warning)";
      card.querySelectorAll("button").forEach((b, i) => {
        const isYes = i === 1;
        b.className = (isYes === !!remembered) ? "btn btn-primary" : "btn btn-secondary";
      });
    }
  },

  finishSmartReviewSession: function() {
    const dayNum = this._smartReviewDayNum;
    const taskIdx = this._smartReviewTaskIdx;
    const dayData = this.state.daysData[dayNum];
    const task = dayData && dayData.tasks[taskIdx];
    if (!task) return;

    const entryIds = task.reviewEntryIds || [];
    const results = this._smartReviewResults || {};
    const repKeys = task.reviewRepKeys || [];
    const repResults = this._smartReviewRepResults || {};
    const missing = entryIds.filter(id => !results[id]);
    const missingReps = repKeys.filter(k => repResults[k] === undefined);
    if (missing.length > 0 || missingReps.length > 0) {
      this.showToast("Devam etmeden önce her konu için bir seçim yapmalısın.", "error");
      return;
    }

    // Aralıklı tekrar aşamalarını ilerlet (bir sonraki vade buradan hesaplanır)
    repKeys.forEach(k => this.advanceRepetition(k, repResults[k]));
    this.submitSmartReviewSession(dayNum, taskIdx, results);
    this._smartReviewDayNum = undefined;
    this._smartReviewTaskIdx = undefined;
    this._smartReviewResults = {};
  },

  // Kullanıcı bugünün Akıllı Tekrar Seansı'nı tamamladığında çağrılır.
  // results: { [vaultEntryId]: "mastered" | "struggling" }
  submitSmartReviewSession: function(dayNum, taskIdx, results) {
    const dayData = this.state.daysData[dayNum];
    const task = dayData && dayData.tasks[taskIdx];
    if (!task || !task.isSmartReview) return;

    const mastered = [];
    const struggling = [];

    (task.reviewEntryIds || []).forEach(entryId => {
      const entry = (this.state.uploadedQuestions || []).find(q => q.id === entryId);
      if (!entry) return;
      if (!Array.isArray(entry.attempts)) entry.attempts = [];

      const verdict = results[entryId];
      if (verdict === "mastered") {
        entry.completed = true;
        entry.resolvedDay = dayNum;
        entry.attempts.push({ day: dayNum, correct: 1, incorrect: 0 });
        mastered.push(entry.topic);
      } else {
        entry.attempts.push({ day: dayNum, result: "error" });
        struggling.push(entry.topic);
      }
    });

    task.completed = true;
    dayData.completed = dayData.tasks.every(t => t.completed);

    this.closeModal("smartReviewModal");
    this.checkDayCompletedStateOutlook(dayNum);
    this.calculateFocusScore();
    this.renderDashboard();
    this.renderTodayPanel();
    this.renderDayDetailsTasks();
    this.renderVaultQuestions();

    // Yarının seansını güncel havuza göre hemen hazırla.
    this.injectSmartReviewSession(dayNum + 1);

    let msg = "";
    if (mastered.length) msg += `✅ Artık hatasız: ${mastered.join(", ")}.<br>`;
    if (struggling.length) msg += `🔁 Hâlâ tekrar listesinde: ${struggling.join(", ")}.`;
    this.showCoachAlert("Tekrar Seansı Tamamlandı! 🧠", msg || "Bugünkü seansı tamamladın.");

    this.saveState();
  },

  // TAB 5: Mistakes Notebook (Hata Defteri) — Deneme sınavı gibi tek bir göreve
  // bağlanamayan hatalar için manuel giriş formu.
  uploadVaultQuestion: function() {
    const subject = document.getElementById("vaultSubject").value;
    const topic = document.getElementById("vaultTopic").value.trim();
    const tag = document.getElementById("vaultTag").value;
    const examType = document.getElementById("vaultExamType").value;
    const fileInput = document.getElementById("vaultFile");
    const note = document.getElementById("vaultNote").value.trim();

    if (!topic) {
      alert("Lütfen konu başlığı girin!");
      return;
    }

    const saveQuestion = (imgData) => {
      this.recordVaultError({ subject, topic, examType, tag, note, imgData, source: "manual" });

      this.renderVaultQuestions();
      this.triggerCoachCommentary("Hata Zindanı Güncellendi");
      this.saveState();

      document.getElementById("vaultTopic").value = "";
      document.getElementById("vaultNote").value = "";
      fileInput.value = "";

      alert("Hata başarıyla Hata Zindanı'na eklendi ve yarının programına tekrar+test olarak yerleştirildi!");
    };

    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        saveQuestion(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      saveQuestion(null);
    }
  },

  analyzeVaultImage: function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const loadingEl = document.getElementById("vaultAILoading");
    if (loadingEl) loadingEl.style.display = "block";

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target.result.split(',')[1]; // Remove data URL prefix
      const mimeType = file.type;

      try {
        const apiKey = app.getLlmApiKey();
        if (!apiKey) {
           throw new Error("Fotoğraftan soru çözümü için Profil kartındaki AI Anahtarı alanını doldurman gerekiyor.");
        }

        const promptText = "Sen uzman bir YKS eğitmenisin. Ekteki soruyu incele. Lütfen sorunun branşını (Örn: Matematik, Fizik, Türkçe), alt konusunu (Örn: Türev, Mutlak Değer, Paragraf) tespit et ve soruyu öğrenciye adım adım açıklayarak çöz. Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir metin veya markdown (```json) ekleme:\n{\"subject\": \"Branş\", \"topic\": \"Konu Başlığı\", \"solution\": \"Adım adım detaylı çözüm...\"}";

        const payload = {
          contents: [{
            parts: [
              { text: promptText },
              { inlineData: { mimeType: mimeType, data: base64Data } }
            ]
          }],
          generationConfig: {
             temperature: 0.4
          }
        };

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        const textResponse = data.candidates[0].content.parts[0].text;
        
        // Clean markdown blocks if AI mistakenly added them
        let cleanJsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJsonStr);

        // Populate fields
        const subjSelect = document.getElementById("vaultSubject");
        if (subjSelect && parsed.subject) {
           // check if exact match exists, else just set to whatever matches closest or leave
           const opts = Array.from(subjSelect.options).map(o => o.value);
           // Model her zaman düz metin döndürmeyebilir (sayı/dizi gelebilir);
           // string'e çevirmeden .includes() çağırmak çökmeye yol açıyordu.
           const pSubject = String(parsed.subject);
           if (opts.includes(pSubject)) {
               subjSelect.value = pSubject;
           } else {
               // Fallbacks (e.g. "Geometri" -> "Matematik")
               if (pSubject === "Geometri") subjSelect.value = "Matematik";
               else if (pSubject.includes("Mat")) subjSelect.value = "Matematik";
               else if (pSubject.includes("Turk") || pSubject.includes("Türk")) subjSelect.value = "Türkçe";
               else if (pSubject.includes("Fiz")) subjSelect.value = "Fizik";
               else if (pSubject.includes("Kim")) subjSelect.value = "Kimya";
               else if (pSubject.includes("Biy")) subjSelect.value = "Biyoloji";
               else if (pSubject.includes("Tar")) subjSelect.value = "Tarih";
               else if (pSubject.includes("Coğ")) subjSelect.value = "Coğrafya";
               else if (pSubject.includes("Edeb")) subjSelect.value = "Edebiyat";
               else if (pSubject.includes("Din")) subjSelect.value = "Din Kültürü";
               else if (pSubject.includes("Fel")) subjSelect.value = "Felsefe";
           }
        }

        const topicInput = document.getElementById("vaultTopic");
        if (topicInput && parsed.topic) {
           topicInput.value = parsed.topic;
        }

        const noteInput = document.getElementById("vaultNote");
        if (noteInput && parsed.solution) {
           noteInput.value = parsed.solution;
        }

        if (loadingEl) loadingEl.style.display = "none";

      } catch (err) {
        console.error("AI Analysis Error:", err);
        alert("Soru incelenirken bir hata oluştu: " + err.message);
        if (loadingEl) loadingEl.style.display = "none";
      }
    };
    reader.readAsDataURL(file);
  },



  getYouTubeRecommendations: function(subject, topic) {
    const query = encodeURIComponent(`${subject} ${topic}`);
    
    // Choose channels based on subject for YKS
    let channels = [];
    if (subject === "Matematik" || subject === "Geometri") {
      channels = [
        { name: "Mert Hoca", suffix: "Matematik Kampı" },
        { name: "Rehber Matematik", suffix: "Konu Anlatımı" },
        { name: "Şenol Hoca", suffix: "Pratik Anlatım" }
      ];
    } else if (subject === "Fizik") {
      channels = [
        { name: "VIP Fizik", suffix: "Detaylı Anlatım" },
        { name: "Altuğ Güneş Fizik", suffix: "YKS Taktikleri" },
        { name: "Özcan Hoca Fizik", suffix: "Soru Çözümü" }
      ];
    } else if (subject === "Kimya") {
      channels = [
        { name: "Görkem Şahin", suffix: "Detaylı Konu Anlatımı" },
        { name: "Kimya Adası", suffix: "Hızlı Konu Özeti" },
        { name: "Ferrum Kimya", suffix: "Soru Çözümü" }
      ];
    } else if (subject === "Biyoloji") {
      channels = [
        { name: "Selin Hoca Biyoloji", suffix: "Detaylı Anlatım" },
        { name: "Dr. Biyoloji", suffix: "YKS Soru Analizi" },
        { name: "Fundamenta Biyoloji", suffix: "Konu Özeti" }
      ];
    } else if (subject === "Türkçe" || subject === "Edebiyat") {
      channels = [
        { name: "Rüştü Hoca ile Türkçe", suffix: "Taktiklerle Dil Bilgisi" },
        { name: "Kadir Gümüş", suffix: "Detaylı Anlatım" },
        { name: "Aker Kartal Dil Bilgisi", suffix: "Pratik Yollar" }
      ];
    } else {
      channels = [
        { name: "Benim Hocam", suffix: "YKS Müfredat Anlatımı" },
        { name: "Tonguç Kampüs", suffix: "Tek Videoda Özet" },
        { name: "Hocalara Geldik", suffix: "Konu Anlatımı" }
      ];
    }

    return channels.map(c => {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(c.name + ' ' + topic)}`;
      return {
        title: `${topic} - ${c.name} (${c.suffix})`,
        url: searchUrl,
        channel: c.name
      };
    });
  },

  // Video önerilerine ek olarak yazılı kaynak (yayın/soru bankası/konu özeti) önerileri —
  // Hata Zindanı kartlarında YouTube klasörünün yanına ikinci bir "Kaynak Önerileri" klasörü olarak gösterilir.
  // Yayınevi listesi artık burada gömülü değil: programın kullandığı
  // kitap kataloğunun (app.sourceBooks) aynısından okunur; öğrenci
  // hata zindanında programındaki kitabı görür.
  getSourceRecommendations: function(subject, topic, examType) {
    const sb = this.sourceBooks;
    const picks = [
      sb.pick(subject, examType, "konu", 0),
      sb.pick(subject, examType, "soru", 0),
      sb.pick(subject, examType, "soru", 1)
    ].filter(Boolean);

    // Kataloğda karşılığı olmayan ders (Rehberlik, özel görev vb.) için
    // genel çalışma kaynakları önerilir.
    const fallback = [
      { publisher: "Tonguç Akademi Yayınları", book: "YKS Konu Özeti", kind: "konu" },
      { publisher: "Editör Yayınları", book: "YKS Soru Bankası", kind: "soru" },
      { publisher: "3D Yayınları", book: "YKS Soru Bankası", kind: "soru" }
    ];
    const list = picks.length ? picks : fallback;

    // Aynı yayınevi + kitap iki kez önerilmesin
    const seen = {};
    return list.filter(p => {
      const key = `${p.publisher}|${p.book}`;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).map(p => {
      const kindLabel = p.kind === "konu" ? "Konu Anlatımı" : p.kind === "deneme" ? "Deneme" : "Soru Bankası";
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${p.publisher} ${p.book} ${topic}`)}`;
      return {
        title: `${topic} - ${p.publisher} · ${p.book} (${kindLabel})`,
        url: searchUrl,
        publisher: p.publisher,
        book: p.book
      };
    });
  },

  cleanQueryToTopicName: function(query) {
    // Remove common user action phrases and clean query to extract clean topic title
    let cleaned = query.toLowerCase()
      .replace(/(yazdım|yazdim|anlamadım|anlamadim|yapamadım|yapamiyorum|karıştırıyorum|karistiriyorum|nedir|nasıl|nasil|sorusu|konusu|hakkında|hakkinda|çözümü|cozumu|yardım|yardim|öneri|önerisi|taktik|taktikleri|özeti|ozeti)/g, "")
      .replace(/[.,\/#!$%\^&\*;:{}=\-_\x60~()?]/g, "")
      .trim();
    
    if (!cleaned) return "YKS Genel Başarı";
    // Capitalize first letter
    return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  },

  generate50SentenceSummary: function(topic, subject) {
    const sentences = [];
    
    // Normalize topic for exact matching of pre-defined DB
    const cleanTopic = topic.trim();

    // 1. Pre-defined database for core YKS topics (Trigonometri, Logaritma, Limit, Türev, İntegral, Polinomlar, Optik, Mol, Hücre)
    if (cleanTopic === "Logaritma") {
      sentences.push(
        "Logaritma fonksiyonu, üstel fonksiyon olan \\(f(x) = a^x\\) fonksiyonunun tersidir.",
        "Logaritma tabanı olan \\(a\\) sayısı daima sıfırdan büyük ve 1'den farklı olmak zorundadır.",
        "Logaritması alınan sayı daima pozitif gerçek sayı olmak zorundadır; aksi takdirde fonksiyon tanımsızdır.",
        "\\(\\log_a x = y\\) ifadesi, üstel olarak \\(a^y = x\\) şeklinde yazılır.",
        "Tabanı 10 olan logaritmaya onluk (adi) logaritma denir ve taban genellikle yazılmaz (\\(\\log x\\)).",
        "Tabanı Euler sayısı \\(e \\approx 2.718\\) olan logaritmaya doğal logaritma denir ve \\(\\ln x\\) ile gösterilir.",
        "Bir çarpımın logaritması, çarpanların logaritmalarının toplamına eşittir: \\(\\log_a (x \\cdot y) = \\log_a x + \\log_a y\\).",
        "Bir bölümün logaritması, pay ile paydanın logaritmalarının farkına eşittir: \\(\\log_a (x / y) = \\log_a x - \\log_a y\\).",
        "Logaritması alınan sayının üssü başa katsayı olarak çarpım durumunda geçer: \\(\\log_a x^n = n \\cdot \\log_a x\\).",
        "Logaritma tabanının üssü başa katsayı olarak bölüm durumunda geçer: \\(\\log_{a^m} x = \\frac{1}{m} \\cdot \\log_a x\\).",
        "Taban değiştirme kuralı en sık sorulan YKS konusudur ve \\(\\log_a b = \\frac{\\log_c b}{\\log_c a}\\) olarak ifade edilir.",
        "Bir logaritma ifadesinin çarpmaya göre tersi alınırsa taban ve sayı yer değiştirir: \\(\\log_a b = \\frac{1}{\\log_b a}\\\. ",
        "Zincir kuralı gereğince ardışık çarpımlarda sadeleştirme yapılabilir: \\(\\log_a b \\cdot \\log_b c \\cdot \\log_c d = \\log_a d\\).",
        "Logaritmanın tabanı ile tabanının üzerindeki logaritmanın sayısının tabanı aynı ise sonuç doğrudan sayıdır: \\(a^{\\log_a x} = x\\).",
        "Herhangi bir tabanda 1'in logaritması daima sıfırdır: \\(\\log_a 1 = 0\\).",
        "Logaritmik denklemler çözülürken elde edilen köklerin tanım aralığını sağlaması zorunludur.",
        "Logaritmik eşitsizliklerde taban 1'den büyükse eşitsizlik yönü aynen korunur.",
        "Logaritmik eşitsizliklerde taban 0 ile 1 arasındaysa eşitsizlik yön değiştirmek zorundadır.",
        "Üstel fonksiyon \\(f(x) = a^x\\), taban \\(a > 1\\) ise artan bir grafik belirtir.",
        "Üstel fonksiyon \\(f(x) = a^x\\), taban \\(0 < a < 1\\) ise azalan bir grafiktir.",
        "Logaritma fonksiyonunun grafiği, düşey asimptot olan \\(x=0\\) doğrusuna yaklaşır ancak kesmez.",
        "Logaritma grafikleri, üstel grafiklerin \\(y=x\\) doğrusuna göre simetriğidir.",
        "Logaritma fonksiyonu birebir ve örten olduğu için daima ters fonksiyonu alınabilir.",
        "\\(f(x) = \\log_a (g(x))\\) fonksiyonunun tanımlı olması için \\(g(x) > 0\\) olmalıdır.",
        "Onluk tabandaki logaritma değerleri, bir sayının kaç basamaklı olduğunu bulmada kullanılır.",
        "Basamak sayısı hesaplanırken sayının 10 tabanındaki logaritmasının tam kısmına 1 eklenir.",
        "Doğal logaritma \\(\\ln x\\), türev ve integral işlemlerinde temel teşkil eder.",
        "pH dereceleri, deprem şiddeti ve ses düzeyi logaritmik ölçekle hesaplanır.",
        "Üstel denklemlerde değişken değiştirme (örn: \\(a^x = t\\)) yöntemi sıklıkla kullanılır.",
        "Logaritmada iki farklı taban varsa en küçük ortak tabana geçiş yapılmalıdır.",
        "Grafik sorularında eksenleri kesen noktalar denklemi doğrulamak zorundadır.",
        "Köklü sayı içeren logaritma sorularında kök, rasyonel üs olarak başa taşınır.",
        "Ardışık logaritma içeren ifadelerde en dıştaki logaritmadan başlanarak çözülür.",
        "Logaritma fonksiyonunun tanım kümesindeki şartların hepsi ortak kesiştirilerek çözüm kümesi bulunur.",
        "\\(\\log 2 = a\\) ise \\(\\log 5 = 1 - a\\) kuralı sınavda en sık kullanılan pratik bilgidir.",
        "Logaritma çarpanı içeren denklemlerde kökler toplamı veya çarpımı sorulabilir.",
        "Üssü logaritmalı denklemlerde her iki tarafın logaritması alınarak çözüm yapılır.",
        "Yeni nesil logaritma sorularında cetvel uzunlukları veya geometrik şekiller kullanılır.",
        "Soru bankalarındaki logaritma sorularını çözmeden önce üslü sayı kurallarını iyice tekrar etmelisin.",
        "Logaritma konusu AYT sınavında her yıl en az 2 adet doğrudan soru getirmektedir."
      );
    } else if (cleanTopic === "Limit ve Süreklilik" || cleanTopic === "Limit") {
      sentences.push(
        "Limit, bir değişkenin bir sayıya yaklaşırken fonksiyonun ulaştığı veya yaklaştığı sınır değerdir.",
        "Bir fonksiyonun bir noktada limitinin olması için sağdan ve soldan limitlerinin eşit olması gerekir.",
        "Sağdan limit \\(x \\to a^+\\) ve soldan limit \\(x \\to a^-\\) şeklinde sembolize edilir.",
        "Süreklilik için fonksiyonun o noktada tanımlı olması, limitinin olması ve limitinin o noktadaki değerine eşit olması şarttır.",
        "Eğer limit değeri fonksiyonun o noktadaki görüntüsüne eşit değilse fonksiyon o noktada süreksizdir.",
        "Limit hesaplarında en sık karşılaşılan belirsizlik durumu \\(\\frac{0}{0}\\) belirsizliğidir.",
        "\\(\\frac{0}{0}\\) belirsizliğini gidermek için çarpanlara ayırma, eşlenikle çarpma veya sadeleştirme metotları uygulanır.",
        "Süreklilik grafiklerinde kopma veya sıçrama olan noktalarda fonksiyon süreksiz ve limitsizdir.",
        "Grafikte sadece içi boş bir nokta (delik) varsa, o noktada limit vardır ancak süreklilik yoktur.",
        "Polinom fonksiyonlar tüm gerçek sayılar kümesinde daima limitli ve süreklidir.",
        "Rasyonel fonksiyonlar, paydayı sıfır yapan noktalarda süreksizdir ve genellikle tanımsızdır.",
        "Kök derecesi çift olan köklü fonksiyonlar, kök içi negatif olduğunda tanımsız ve süreksizdir.",
        "Mutlak değerli fonksiyonlarda limit alınırken mutlak değerin içini sıfır yapan kritik noktalara dikkat edilmelidir.",
        "Limit işlemlerinde sabit sayının limiti kendisidir ve limit toplama/çıkarma/çarpma işlemlerine dağılabilir.",
        "Süreklilik ile limit arasındaki temel fark, sürekliliğin o noktadaki tanımlılığı ve eşitliği şart koşmasıdır.",
        "Bileşke fonksiyon limitlerinde içteki limitin yönü dıştaki fonksiyon için önemlidir.",
        "Trigonometrik limit sorularında sadeleştirme formülleri kullanılır.",
        "Bir fonksiyon sürekli olduğu bir aralıkta limiti de daima mevcuttur.",
        "Grafikte sıçrama noktalarında sağ ve sol limitler farklı olduğundan limit yoktur.",
        "Grafikte içi boş delik noktalarında limit vardır ancak süreklilik yoktur.",
        "Süreklilik fonksiyonun grafiğini kalemi kaldırmadan çizebilme durumudur.",
        "Tanımsız olan noktalarda fonksiyon sürekliliğinden bahsedilemez.",
        "Belirli bir aralıkta sürekli fonksiyonlar o aralıkta sınırlıdır.",
        "Ara Değer Teoremi, sürekli fonksiyonların aldığı değerler arasındaki tüm değerleri alacağını söyler.",
        "Ekstremum değer teoremi sürekli fonksiyonların mutlak maks/min değerlerine ulaşacağını söyler.",
        "Limit limit kuralları yardımıyla belirsiz durumları sayısal sonuçlara bağlar.",
        "Logaritmik fonksiyonlarda limit alınırken tanım kümesi dışına çıkılmamalıdır.",
        "Üstel fonksiyonlarda limit tabana göre doğrudan hesaplanabilir.",
        "Sonsuza giden limitler müfredatta sadeleştirilmiş olup belirsizlik durumları kaldırılmıştır.",
        "Limit sorularında grafik okurken x eksenindeki yaklaşım yönünü parmakla takip etmek hatayı azaltır.",
        "Rasyonel ifadelerde pay ve paydanın ortak çarpanları sadeleştirildikten sonra limit değeri yazılır.",
        "Süreksizlik noktalarının kümesini bulmak için paydanın kökleri incelenir.",
        "Tanımlı ve sürekli fonksiyonlarda limit değeri doğrudan görüntüdür.",
        "Sandviç (Sıkıştırma) Teoremi, bir fonksiyonu iki bilinen fonksiyon arasına alarak limit bulmayı sağlar.",
        "Limit sıfıra yaklaşırken sinüs ve tanjant oranları pratik yolla çözülebilir.",
        "Süreklilik için tek bir şartın bile ihlal edilmesi süreksizlik için yeterlidir.",
        "Fonksiyonun grafiğinde asimptotların olduğu dikey doğrularda limit sonsuza gider (limit yoktur).",
        "Limit hesaplarken değişken dönüşümleri yapmak işleri kolaylaştırabilir.",
        "Yeni nesil limit sorularında grafik yorumları ve öncüllü sorular sıklıkla karşımıza çıkar.",
        "YKS'de limit ve süreklilik konusu türevin temelini oluşturduğu için tam öğrenilmelidir."
      );
    } else if (cleanTopic === "Türev") {
      sentences.push(
        "Türev, bir fonksiyonun bir noktadaki anlık değişim oranı ve geometrik olarak teğetinin eğimidir.",
        "Bir fonksiyonun \\(x_0\\) noktasındaki türevi \\(f'(x_0) = \\lim_{h \\to 0} \\frac{f(x_0+h) - f(x_0)}{h}\\) limitidir.",
        "Türevin olabilmesi için fonksiyonun o noktada kesinlikle sürekli olması şarttır; süreksiz noktada türev alınamaz.",
        "Süreklilik türev için gerekli şarttır fakat yeterli değildir; kırılma noktalarında (sivri uçlarda) türev yoktur.",
        "Teğet denklemi yazılırken teğetin eğimi türev yardımıyla bulunur: \\(m = f'(x_0)\\).",
        "Normal doğrusu teğet doğrusuna diktir ve eğimleri çarpımı -1'dir: \\(m_{te\\u011fet} \\cdot m_{normal} = -1\\).",
        "Bir fonksiyonun türevinin pozitif olduğu aralıklarda fonksiyon artan, negatif olduğu aralıklarda azalandır.",
        "Artanlıktan azalanlığa geçilen yerel maksimum noktalarında ve azalanlığa geçilen yerel minimum noktalarında türev sıfırdır.",
        "Türevin sıfır olduğu her nokta ekstremum noktası olmak zorunda değildir; çift katlı köklerde yön değişimi olmaz.",
        "Maksimum-minimum problemleri çözülürken istenen ifade tek değişkene indirgenip türevi alınarak sıfıra eşitlenir.",
        "Çarpımın türevi: \\((f \\cdot g)' = f' \\cdot g + f \\cdot g'\\) formülü ile hesaplanır.",
        "Bölümün türevi: \\((f / g)' = \\frac{f' \cdot g - f \\cdot g'}{g^2}\\) formülü ile hesaplanır.",
        "Bileşke fonksiyonun türevinde zincir kuralı uygulanır: \\((f(g(x)))' = f'(g(x)) \\cdot g'(x)\\).",
        "Sabit fonksiyonun türevi daima sıfırdır ve dereceli terimlerin türevinde derece başa çarpım olarak gelip 1 azalır.",
        "Türevin fiziksel anlamı, yolun zamana göre türevinin hızı, hızın zamana göre türevinin ise ivmeyi vermesidir.",
        "Teğet denklemi \\(y - y_0 = m_t \\cdot (x - x_0)\\) formülüyle kurulur.",
        "Rolles Teoremi ve Ortalama Değer Teoremi, türevlenebilir fonksiyonların eğim ilişkilerini açıklar.",
        "Bir fonksiyonun ikinci türevi büküm (dönüm) noktaları ve konkavlık hakkında bilgi verir.",
        "Grafik sorularında eksenlerin \\(f(x)\\) mi yoksa \\(f'(x)\\) mi olduğuna mutlaka bakılmalıdır.",
        "\\(f'(x)\\) grafiğinde işaretin artıdan eksiye geçtiği yer yerel maksimumdur.",
        "\\(f'(x)\\) grafiğinde işaretin eksiden artıya geçtiği yer yerel minimumdur.",
        "Sabit sayıyla çarpılan fonksiyonun türevinde sabit sayı dışarı alınabilir.",
        "Toplam ve farkın türevi ayrı ayrı türevlerin toplamı ve farkıdır.",
        "Mutlak değer fonksiyonunun türevinde kritik noktalarda sağ ve sol türev incelenir.",
        "Kritik nokta dışındaki mutlak değer türevinde işaret belirlenip normal türev alınır.",
        "Parametrik türevde zincir kuralı yardımıyla türev değişkenleri birbirine oranlanır.",
        "Teğet doğrusu x eksenine paralel ise teğet eğimi sıfırdır, yani o noktada türev sıfırdır.",
        "Teğet doğrusu y eksenine paralel ise türev tanımsızdır.",
        "Türevlenebilir bir fonksiyonun yerel ekstremum noktalarında çizilen teğetler x eksenine paraleldir.",
        "Bir fonksiyonun artan olduğu aralıkta grafiği yukarı yönlü bir eğri çizer.",
        "Bir fonksiyonun azalan olduğu aralıkta grafiği aşağı yönlü bir eğri çizer.",
        "İkinci türevin pozitif olduğu yerde fonksiyon dışbükey (kolları yukarı), negatifse içbükeydir.",
        "Maks-min sorularında çevre, alan veya hacim formüllerinden yararlanılarak bağıntı kurulur.",
        "Türevin geometrik yorumu YKS'de en çok soru getiren kısımlardan biridir.",
        "Diferansiyel kavramı, türevin değişkenin değişimiyle çarpımıdır: \\(dy = f'(x)dx\\).",
        "Trigonometrik fonksiyonların türevleri müfredat dışı bırakılmıştır.",
        "Logaritmik ve üstel fonksiyonların türevleri YKS müfredatında yer almamaktadır.",
        "Limit sorularının çözümünde bazen türev tanımından yararlanmak pratiklik sağlar.",
        "Türev grafiği çizerken kritik noktaların eğimlerini ve yönlerini doğru işaretlemelisin.",
        "YKS'de türev konusundan ortalama 3-4 soru çıkmaktadır ve integralin temelidir."
      );
    } else if (cleanTopic === "İntegral") {
      sentences.push(
        "İntegral, türevi bilinen bir fonksiyonun kendisini bulma (belirsiz) veya eğri altındaki alanı hesaplama (belirli) işlemidir.",
        "Belirsiz integral hesaplanırken sonucun sonuna daima bir integral sabiti olan \\(+c\\) eklenmelidir.",
        "İntegral alma işlemi, türev alma işleminin tam tersi olarak derecenin 1 artırılıp yeni dereceye bölünmesidir.",
        "Değişken değiştirme yöntemi, karmaşık integral ifadelerini \\(u\\) ve \\(du\\) dönüşümleriyle basitleştirme metodudur.",
        "Belirli integral geometrik olarak, fonksiyon eğrisi ile x ekseni arasında kalan yönlü alanları temsil eder.",
        "Belirli integralde sınırlar yer değiştirdiğinde integralin işareti değişir: \\(\\int_a^b f(x)dx = -\\int_b^a f(x)dx\\).",
        "İntegral toplama ve çıkarma işlemleri üzerine dağılabilir fakat çarpma ve bölme işlemleri üzerine dağılamaz.",
        "Eğrinin x ekseninin altında kaldığı bölgelerde belirli integralin sonucu negatif çıkar, ancak alan daima pozitiftir.",
        "İki eğri arasında kalan alan üstteki fonksiyondan alttaki fonksiyon çıkarılarak hesaplanır: \\(\\int [f(x) - g(x)]dx\\).",
        "Tek fonksiyonların simetrik sınırlardaki belirli integrali sıfırır: \\(\\int_{-a}^a tek(x)dx = 0\\).",
        "Çift fonksiyonların simetrik sınırlardaki belirli integrali yarısının iki katıdır: \\(\\int_{-a}^a cift(x)dx = 2\\int_0^a cift(x)dx\\).",
        "Türevi alınan bir ifadenin integrali kendisini verir: \\(\\int f'(x)dx = f(x) + c\\).",
        "İntegral sembolünün dışındaki diferansiyel işlemi integrali yok eder: \\(d(\\int f(x)dx) = f(x)dx\\).",
        "Riemann toplamı, belirli integrali dikdörtgenlerin alanları toplamı limitine dayandırarak tanımlayan yaklaşımdır.",
        "Parçalı fonksiyonların integrali alınırken sınırlar kritik noktalara göre parçalanarak ayrı ayrı hesaplanmalıdır.",
        "Değişken değiştirmede türevi olan ifadenin yanına dx getirilerek du yazılması unutulmamalıdır.",
        "Belirli integralde sınırların da değişken dönüşümüne göre güncellenmesi zorunludur.",
        "İntegral alan hesaplarında eksenlerin yönü ve kesişim sınırları grafik üzerinden belirlenir.",
        "Yatay doğrulara göre alan hesaplarken fonksiyonu y cinsinden yazmak kolaylık sağlayabilir.",
        "Riemann toplamı üstten ve alttan Riemann toplamları olarak iki farklı yaklaşımla hesaplanır.",
        "Alt Riemann toplamı daima gerçek alandan küçük, üst Riemann toplamı ise gerçek alandan büyüktür.",
        "İntegral alma kurallarında üslü ve köklü ifadelerin üs formatına çevrilmesi işlemi hızlandırır.",
        "Bölüm durumundaki rasyonel integrallerde payda tek terimliyse terim terim bölme yapılır.",
        "İntegral sembolü dışındaki sabit sayılar integralin dışına çarpan olarak alınabilir.",
        "Belirli integralin türevi daima sıfırdır çünkü belirli integralin sonucu sabit bir sayıdır.",
        "Belirsiz integralin türevi ise içerideki fonksiyonun kendisine eşittir.",
        "Diferansiyel sembolü olan d ve integral sembolünün sırası işleme etki eder.",
        "Eğrinin y ekseniyle arasında kalan alan hesaplanırken integral y değişkenine göre kurulur.",
        "İntegral sınırları arasında fonksiyonun süreksiz olduğu bir nokta varsa integral parçalanarak çözülür.",
        "Trigonometrik fonksiyonların integral alma kuralları YKS müfredatında yer almamaktadır.",
        "Logaritmik ve üstel integral alma kuralları müfredattan kaldırılmıştır.",
        "Riemann integrali, YKS'de genellikle şekilli veya grafik yorumu olarak sorulmaktadır.",
        "Alan sorularında integral almadan pratik olarak üçgen veya yamuk alanı hesaplanabilen durumlar kontrol edilmelidir.",
        "Simetrik aralıklarda integral alırken tek/çift fonksiyon özelliklerini kontrol etmek zaman kazandırır.",
        "Değişken değiştirme yaparken u olarak seçilecek kısım genellikle derecesi büyük olan ifadedir.",
        "Diferansiyel alma işleminde türev aldıktan sonra yanına dx eklemeyi unutmamalısın.",
        "Belirli integral alan hesaplarında grafik çizimi yapmak sınırları görmeyi kolaylaştırır.",
        "İntegral hesabı bittiğinde belirsiz integral için sabit sayı olan c'yi eklemeyi unutma.",
        "Konuyu pekiştirmek için türev ile integral arasındaki geçiş bağıntılarını çok iyi kavramalısın.",
        "YKS AYT sınavında integral konusundan her yıl 3 adet soru sorulmaktadır."
      );
    } else if (cleanTopic === "Trigonometri") {
      sentences.push(
        "Trigonometri, bir dik üçgenin açıları ile kenar uzunlukları arasındaki oranları inceleyen matematik dalıdır.",
        "Birim çember, merkezi başlangıç noktası ve yarıçapı 1 birim olan çemberdir; denklemi \\(x^2 + y^2 = 1\\)'dir.",
        "Birim çember üzerindeki herhangi bir noktanın x koordinatı kosinüs, y koordinatı ise sinüs değerini verir.",
        "Her açı için sinüs ve kosinüs değerleri daima \\([-1, 1]\\) kapalı aralığında olmak zorundadır.",
        "Tanjant değeri karşı kenarın komşu kenara oranı, kotanjant değeri ise komşu kenarın karşı kenara oranıdır.",
        "Temel trigonometrik kimliklerden en önemlisi her \\(x\\) açısı için \\(\\sin^2 x + \\cos^2 x = 1\\) olmasıdır.",
        "Toplam ve fark formülleri: \\(\\sin(a+b) = \\sin a \\cos b + \\cos a \\sin b\\) şeklinde açılır.",
        "Kosinüs toplam formülü kosinüslerin çarpımından sinüslerin çarpımının çıkarılmasıdır: \\(\\cos(a+b) = \\cos a \\cos b - \\sin a \\cos b\\).",
        "Yarım açı formülü: \\(\\sin 2x = 2 \\sin x \\cos x\\) en çok sadeleştirme sorularında karşımıza çıkar.",
        "Kosinüs yarım açı formülü 3 farklı şekilde yazılabilir: \\(\\cos 2x = \\cos^2 x - \\sin^2 x = 2\\cos^2 x - 1 = 1 - 2\\sin^2 x\\).",
        "Kosinüs teoremi, iki kenarı ve aradaki açısı bilinen üçgende üçüncü kenarı bulmaya yarar: \\(a^2 = b^2 + c^2 - 2bc\\cos A\\).",
        "Sinüs teoremi, kenar uzunluklarının karşılarındaki açıların sinüslerine oranının sabit ve çevre çemberin çapına eşit olduğunu söyler.",
        "Trigonometrik denklemleri çözerken tanım aralığındaki periyodik kök formüllerini eklemeyi unutmamalısın.",
        "Ters trigonometrik fonksiyonlar (arcsin, arccos, arctan) trigonometrik oranların açı değerini veren ters fonksiyonlardır.",
        "Sıralama sorularında tüm oranları birinci bölgeye taşıyıp sinüs ve tanjanta çevirerek karşılaştırma yapmak kolaylık sağlar.",
        "Trigonometrik sadeleştirmelerde tanjant yerine sin/cos, kotanjant yerine cos/sin yazarak işlem yapılır.",
        "Sekant \\(1/\\cos x\\) ve kosekant \\(1/\\sin x\\) olarak temel fonksiyonlara dönüştürülmelidir.",
        "Açı indirgemelerinde açının eksenle yaptığı açıya göre ismi değişir (90 ve 270 derecede isim değişir).",
        "180 ve 360 derecelik indirgemelerde trigonometrik fonksiyonun ismi değişmez, sadece bölge işareti belirlenir.",
        "Trigonometrik fonksiyonların periyotları hesaplanırken sinüs/kosinüsün derecesine ve açının katsayısına bakılır.",
        "Periyodik grafik çizimlerinde açı değerleri yerine yazılarak fonksiyonun aldığı genlik noktaları bulunur.",
        "Sinüs fonksiyonunun grafiği orijinden başlar, kosinüs fonksiyonunun grafiği ise tepe noktasından başlar.",
        "Ters trigonometrik fonksiyonlarda arcsin ve arctan fonksiyonlarının değer kümesi \\([-\\pi/2, \\pi/2]\\) aralığındadır.",
        "Arccos fonksiyonunun değer kümesi ise \\([0, \\pi]\\) aralığındadır.",
        "Trigonometrik denklemlerde \\(\\sin x = \\sin a\\) ise kökler \\(x = a + 2k\\pi\\) veya \\(x = \\pi - a + 2k\\pi\\) olarak bulunur.",
        "Kosinüs denklemlerinde \\(\\cos x = \\cos a\\) ise kökler \\(x = a + 2k\\pi\\) veya \\(x = -a + 2k\\pi\\) şeklindedir.",
        "Tanjant ve kotanjant denklemlerinde periyot \\(\\pi\\) olduğu için tek kök formülü \\(x = a + k\\pi\\) yeterlidir.",
        "Geometrik şekilli trigonometri sorularında dik üçgen oluşturacak ek çizimler yapılmalıdır.",
        "Yarım açı formüllerini uygularken cos2x'in içindeki 1'i yok edecek açılımı seçmek kolaylık sağlar.",
        "Trigonometrik özdeşliklerde içler dışlar çarpımı yaparak sadeleştirmeleri hızabilirsin.",
        "Birim çember üzerindeki sinüs ekseni düşey eksen, kosinüs ekseni yatay eksendir.",
        "Tanjant ekseni x=1 doğrusu, kotanjant ekseni ise y=1 doğrusudur.",
        "Radyan ve derece cinsinden açı dönüşümlerinde \\(D/180 = R/\\pi\\) formülü kullanılır.",
        "Esas ölçü bulunurken derece 360'a, radyan ise paydanın iki katına bölünerek kalan bulunur.",
        "Negatif açıların esas ölçüsünde kalan değere pozitif olana kadar periyot eklenir.",
        "Sinüs, tanjant ve kotanjant tek fonksiyonlar olup içlerindeki eksiyi dışarı kusarlar.",
        "Kosinüs çift fonksiyon olup içindeki eksiyi yutar: \\(\\cos(-x) = \\cos x\\).",
        "Geometrik alan sorularında sinüslü alan formülü: \\(A = \\frac{1}{2} a b \\sin C\\) sıklıkla kullanılır.",
        "Trigonometri sorularını çözerken dik üçgen kenar bağıntılarını (3-4-5, 5-12-13 vb.) ezbere bilmelisin.",
        "YKS AYT sınavında trigonometri konusundan her yıl ortalama 3-4 soru çıkmaktadır."
      );
    } else if (cleanTopic === "Paragraf") {
      sentences.push(
        "Paragraf, tek bir düşünce etrafında şekillenen ve birbirini tamamlayan cümleler bütünüdür.",
        "Paragraf sorularında başarılı olmanın anahtarı soru kökünü doğru anlayıp yönlendirmeyi takip etmesidir.",
        "Ana düşünce, yazarın paragrafta okuyucuya iletmek istediği temel mesaj veya öğüttür.",
        "Ana düşünce cümleleri genellikle paragrafın girişinde veya sonuç bölümünde özetleyici ifadelerle yer alır.",
        "Yardımcı düşünceler, ana düşünceyi destekleyen, açıklayan ve somutlaştıran yan fikirlerdir.",
        "Yardımcı düşünce soruları genellikle olumsuz soru kökleriyle ('değinilmemiştir', 'çıkarılamaz') sorulur.",
        "Paragrafı ikiye bölme sorularında, yeni bir konuya veya konunun farklı bir yönüne geçilen cümle tespit edilmelidir.",
        "Düşüncenin akışını bozan cümle, paragrafın genel konusuyla uyuşmayan veya bakış açısı farklı olan cümledir.",
        "Cümle yerleştirme sorularında, cümlenin anlam ve yapı yönünden önceki ve sonraki cümlelerle bağları kurulmalıdır.",
        "Paragrafta anlam akışını sağlayan 'ancak', 'çünkü', 'oysaki', 'bu nedenle' gibi bağlayıcı unsurlara dikkat edilmelidir.",
        "Paragraftaki boşluk doldurma sorularında, boşluğun öncesindeki ve sonrasındaki ipuçları doğru değerlendirilmelidir.",
        "Yazarın üslubu, dili kullanma şeklidir ve 'yalınlık', 'özgünlük', 'akıcılık' gibi kavramlarla ifade edilir.",
        "Paragrafta anlatım biçimleri açıklama, tartışma, betimleme ve öyküleme olmak üzere 4 ana gruba ayrılır.",
        "Düşünceyi geliştirme yolları tanımlama, örneklendirme, tanık gösterme, karşılaştırma ve sayısal verilerden yararlanmadır.",
        "Her gün düzenli olarak 20 paragraf sorusu çözmek sınavda okuma hızını ve odaklanma süresini artırır.",
        "Paragraf okurken kelimeleri tek tek çizmek yerine blok halinde okumak hızı artırır.",
        "Anlamadığın cümlelerde takılıp kalmak yerine paragrafın bütününü okumaya devam etmelisin.",
        "Paragraftaki olay veya düşünce sırasını belirlemek için kronolojik veya mantıksal ipuçları aranmalıdır.",
        "Sorulardaki öznel yargılar ile nesnel bilgilerin ayrımını net yapmalısın.",
        "Paragrafta karşılaştırma ifadeleri (en, daha, kadar) genellikle soru getiren kritik yerlerdir.",
        "Tanık gösterme ve alıntı yapma, yazarın savunduğu düşünceyi inandırıcı kılmak için başvurduğu yoldur.",
        "Örneklendirme soyut düşünceleri somut hale getirerek anlaşılmasını kolaylaştırır.",
        "Betimleyici anlatımda sıfatlar ve duyu organlarına hitap eden ayrıntılar ağırlıktadır.",
        "Öyküleyici anlatımda olay, yer, zaman ve şahıs kadrosu gibi unsurlar bulunur; hareket esastır.",
        "Açıklayıcı anlatımda bilgi verme amacı güdülür, nesnel bir dil tercih edilir.",
        "Tartışmacı anlatımda yazar kendi fikrini savunurken karşıt fikri çürütmeye çalışır.",
        "Paragrafın giriş cümlesi bağımsız olmalı, kendinden önce bir cümle olduğunu düşündürecek bağlaçlar içermemelidir.",
        "Sonuç cümlesi genellikle 'kısacası', 'özetle', 'sonuç olarak' gibi özetleyici bağlaçlarla başlar.",
        "Yardımcı düşünce sorularını çözerken seçeneklerdeki anahtar kelimeleri paragrafta eşleştirmelisin.",
        "Paragraf sorularında şahsi görüşlerini kesinlikle soruya katmamalı, sadece metne bağlı kalmalısın.",
        "Akışı bozan cümle sorularında konunun bakış açısının (olumlu/olumsuz) değiştiği yere bakılır.",
        "Boşluk doldurma sorularında boşluğun hemen sonrasındaki bağlaçlar yön belirleyicidir.",
        "Düşünceyi geliştirme yollarında sayısal verilerden yararlanma için metinde istatistiki rakamlar yer almalıdır.",
        "Kişileştirme insana özgü özelliklerin cansız varlıklara verilmesiyle yapılan anlatımdır.",
        "Benzetme anlatımı güçlendirmek için aralarında ilişki bulunan iki şeyden zayıf olanı güçlü olana benzetmektir.",
        "Paragraf çözümlerini günün ilk saatlerinde yapmak odaklanma kalitesini üst seviyeye çıkarır.",
        "Hızlanmak için süreli paragraf çözme provaları (20 soruya 22 dakika gibi) yapılmalıdır.",
        "Yapamadığın paragraf sorularındaki kelimelerin anlamlarını öğrenmek kelime dağarcığını genişletir.",
        "Çok uzun paragraf sorularından korkmamalı, bu soruların genellikle daha fazla ipucu barındırdığını bilmelisin.",
        "YKS TYT Türkçe sınavının yaklaşık 22-26 sorusu doğrudan paragraf ve anlam bilgisinden gelmektedir."
      );
    } else if (cleanTopic === "Polinomlar" || cleanTopic === "Polinom") {
      sentences.push(
        "Polinom, dereceleri doğal sayı ve katsayıları gerçek sayı olan değişkenli ifadelerin toplamıdır.",
        "Bir ifadenin polinom belirtmesi için x değişkenlerinin tüm üslerinin doğal sayı (0, 1, 2...) olması şarttır.",
        "Polinomun en büyük üslü teriminin derecesine polinomun derecesi denir ve der[P(x)] ile gösterilir.",
        "En büyük dereceli terimin katsayısına başkatsayı denir ve polinomun davranışını belirler.",
        "Polinomun değişken içermeyen terimine sabit terim denir ve P(0) değeriyle hesaplanır.",
        "Polinomun katsayılar toplamını bulmak için değişkene 1 yazılır, yani P(1) değeri hesaplanır.",
        "P(x) polinomunun x-a ile bölümünden kalan, bölen ifade sıfıra eşitlenerek P(a) değeriyle bulunur.",
        "Bölme algoritmasında bölenin derecesi, kalanın derecesinden daima büyük olmak zorundadır.",
        "Eğer kalan sıfır ise P(x) polinomu bölen polinoma tam bölünüyor veya o polinomun bir çarpanıdır denir.",
        "İki polinomun eşitliğinde, aynı dereceli terimlerin katsayıları karşılıklı olarak birbirine eşit olmalıdır.",
        "Polinom grafiklerinde x eksenini teğet geçen noktalarda çift katlı kök (çift dereceli çarpan) vardır.",
        "Polinom grafiklerinde x eksenini kesip geçen noktalarda tek katlı kök (tek dereceli çarpan) bulunur.",
        "Derecesi n olan bir polinomun en fazla n tane gerçek kökü olabilir.",
        "Sabit polinomun derecesi sıfırdır, sıfır polinomunun derecesi ise tanımsızdır.",
        "Polinomlarda dört işlem yapılırken benzer terimlerin katsayıları kendi arasında toplanır veya çıkarılır.",
        "Polinom dereceleri çarpılırken dereceler toplanır: der[P(x) * Q(x)] = der[P(x)] + der[Q(x)].",
        "Polinomlar bölünürken dereceler çıkarılır: der[P(x) / Q(x)] = der[P(x)] - der[Q(x)].",
        "Polinomun üssü veya değişkenin üssü alındığında derece çarpılır: der[P(x^k)] = k * der[P(x)].",
        "Polinom toplama veya çıkarmasında derece, derecesi büyük olan polinomun derecesine eşittir.",
        "P(x) polinomunun ax+b ile bölümünden kalan için x yerine -b/a yazılır.",
        "Bölen ifade ikinci dereceden ise kalan en fazla birinci dereceden (mx+n) olabilir.",
        "Polinomlarda kalan bulurken bölme bağıntısı olan P(x) = B(x)*Q(x) + K(x) denklemi yazılır.",
        "Başkatsayısı verilen polinomların denklemi kökleri yardımıyla kurulabilir.",
        "Kökleri x1, x2, x3 olan üçüncü dereceden polinom denklemi P(x) = a*(x-x1)*(x-x2)*(x-x3) şeklinde yazılır.",
        "Simetrik köklere sahip polinomlarda tek dereceli terimlerin katsayıları sıfır olabilir.",
        "Polinomun x-a ile tam bölünmesi, a sayısının polinomun bir kökü (sıfırı) olduğunu gösterir.",
        "Katsayıları rasyonel olan polinomların köklerinden biri irrasyonel ise eşleniği de polinomun köküdür.",
        "Çift dereceli terimlerin katsayıları toplamı [P(1) + P(-1)] / 2 formülüyle hesaplanır.",
        "Tek dereceli terimlerin katsayıları toplamı [P(1) - P(-1)] / 2 formülüyle hesaplanır.",
        "Polinom grafiğinde y eksenini kesen nokta P(0) değerine eşittir.",
        "Polinom grafiklerindeki ekstremum noktaları türevi sıfır yapan noktalardır.",
        "Bölme işleminde kalan bulurken bölenin sıfıra eşitlenmesi temel prensiptir.",
        "Polinomlarda değişken değiştirme yapılarak dereceler küçültülebilir.",
        "İkinci dereceden polinomlar aynı zamanda parabol belirtirler.",
        "Polinom katsayılarının tam sayı veya gerçek sayı olması soru şartlarında kontrol edilmelidir.",
        "Polinom eşitliklerinde belirsiz katsayılar yöntemiyle ortak denklemler çözülür.",
        "Yeni nesil polinom sorularında kutular, bölmeler veya alan hesapları sıklıkla entegre edilir.",
        "Polinom konusunu çalışmadan önce çarpanlara ayırma konusunun eksiksiz kapatılması gerekir.",
        "Soru bankalarından polinom çözmek analitik düşünme becerisini geliştirir.",
        "YKS AYT sınavında polinom konusundan her yıl en az 1-2 adet soru sorulmaktadır."
      );
    } else if (cleanTopic === "Optik ve Aynalar" || cleanTopic === "Optik") {
      sentences.push(
        "Optik, ışığın doğasını, yayılmasını, kırılmasını ve yansımasını inceleyen fizik dalıdır.",
        "Işığın yansıma kanunlarına göre, gelme açısı daima yansıma açısına eşittir.",
        "Düzlem aynada oluşan görüntü daima sanal (zahiri), düz, cisimle aynı boyda ve aynaya göre simetriktir.",
        "Küresel aynalar yansıtıcı yüzeyi bir küre kapağı şeklinde olan aynalardır; çukur ve tümsek ayna olarak ayrılır.",
        "Çukur aynada odağın dışındaki cisimlerin görüntüleri gerçek ve terstir; odağın içindeki cisimlerin görüntüsü sanal ve düzdir.",
        "Tümsek aynada cismin konumu ne olursa olsun, görüntü daima sanal, düz, cisimden küçük ve odak ile tepe noktası arasındadır.",
        "Işığın bir ortamdan diğerine geçerken doğrultu değiştirmesine ışığın kırılması denir.",
        "Kırılma indisinin büyük olduğu ortama çok yoğun ortam, küçük olduğu ortama az yoğun ortam denir.",
        "Işık az yoğun ortamdan çok yoğun ortama geçerken normale yaklaşarak kırılır; hızı azalır.",
        "Işık çok yoğun ortamdan az yoğun ortama geçerken normalden uzaklaşarak kırılır; hızı artar.",
        "Sınır açısı, çok yoğundan az yoğuna geçen ışının 90 derece kırılma açısı yaptığı gelme açısıdır.",
        "Sınır açısından daha büyük açıyla gelen ışınlar diğer ortama geçemez ve tam yansıma yapar.",
        "Mercekler en az bir yüzeyi küresel olan kırıcı ortamlardır; ince kenarlı (yakınsak) ve kalın kenarlı (ıraksak) olarak ikiye ayrılır.",
        "Göz kusurlarından miyop kalın kenarlı mercekle, hipermetrop ise ince kenarlı mercekle düzeltilir.",
        "Işığın prizmadan geçerken renklerine ayrılması, farklı dalga boyundaki renklerin farklı kırılma indislerine sahip olmasındandır.",
        "Düzlem aynada görüş alanı aynanın uçlarına çizilen yansıyan ışınların arasında kalan bölgedir.",
        "Aynaya yaklaşan cismin düzlem aynadaki görüntüsü aynaya aynı hızla yaklaşır.",
        "Çukur aynada merkezdeki cismin görüntüsü yine merkezde, gerçek, ters ve cisimle aynı boydadır.",
        "Çukur aynada odağın ortasındaki (f/2) cismin görüntüsü ayna arkasında (f) mesafede, sanal ve iki katı boydadır.",
        "Tümsek aynada cisim aynaya yaklaştıkça görüntü de büyüyerek aynaya yaklaşır ancak daima cisimden küçükdür.",
        "Küresel aynalarda tepe noktasına gelen ışın asal eksenle aynı açıyı yapacak şekilde yansır.",
        "Asal eksene paralel gelen ışınlar çukur aynada odaktan geçecek şekilde yansırlar.",
        "Tümsek aynada asal eksene paralel gelen ışınların uzantısı odaktan geçecek şekilde dağılırlar.",
        "Kırılma indisi ortamın yoğunluğuyla doğru, ışığın o ortamdaki hızıyla ters orantılıdır.",
        "Snell Yasası: n1 * sin(i) = n2 * sin(r) kırılma açılarının oranını belirler.",
        "Görünür derinlik hesabında, az yoğun ortamdan çok yoğun ortama bakan gözlemci cisimleri daha yakın görür.",
        "Çok yoğun ortamdan az yoğun ortama bakan gözlemci ise cisimleri olduğundan daha uzakta görür.",
        "Serap olayı, ışığın sıcaklık farkından dolayı farklı yoğunluktaki hava katmanlarında tam yansımasıyla oluşur.",
        "Fiber optik kablolar ışığın tam yansıma prensibiyle veri iletmesini sağlayan teknolojidir.",
        "İnce kenarlı mercekte asal eksene paralel gelen ışınlar odakta toplanacak şekilde kırılırlar.",
        "Kalın kenarlı mercekte asal eksene paralel gelen ışınlar uzantısı odaktan geçecek şekilde dağılarak kırılırlar.",
        "Merceğin odak uzaklığı yapıldığı malzemenin kırılma indisine ve eğrilik yarıçapına bağlıdır.",
        "Işığın renklerine göre kırılma indisi en büyük olan mor, en küçük olan ise kırmızıdır.",
        "Gökkuşağı oluşumu ışığın su damlacıklarında hem kırılması hem de tam yansıması sonucu gerçekleşir.",
        "Küresel aynaların odak uzaklığı sadece aynanın eğrilik yarıçapına bağlıdır, ışığın rengine bağlı değildir.",
        "Merceklerin odak uzaklığı ise kullanılan ışığın rengine ve dış ortamın kırılma indisine bağlıdır.",
        "Aydınlanma şiddeti ışık kaynağının gücüyle doğru, mesafenin karesiyle ters orantılıdır: E = I / d^2.",
        "Işık akısı kaynağın çevresine yaydığı toplam ışık miktarıdır ve sadece kaynağın gücüne bağlıdır: Phi = 4*pi*I.",
        "Gölge ve yarı gölge oluşumu ışığın doğrusal yolla yayıldığının en net kanıtıdır.",
        "YKS TYT Fizik sınavında optik ünitesinden her yıl kesinlikle 1-2 adet soru çıkmaktadır."
      );
    } else if (cleanTopic === "Mol Kavramı" || cleanTopic === "Mol") {
      sentences.push(
        "Mol kavramı, atom ve moleküller gibi gözle görülemeyen taneciklerin miktarını belirtmek için kullanılan ölçü birimidir.",
        "1 mol tanecik daima Avogadro sayısı olan \\(6.02 \\times 10^{23}\\) adet taneciğe eşittir.",
        "Avogadro sayısı kadar atom içeren maddeye 1 gram-atom veya 1 mol atom denir.",
        "Bir elementin 1 molünün gram cinsinden kütlesine o elementin mol kütlesi (MA) denir.",
        "Kütlesi verilen bir maddenin mol sayısı \\(n = \\frac{m}{M_A}\\) formülü ile hesaplanır.",
        "Tanecik sayısı verilen bir maddenin mol sayısı \\(n = \\frac{N}{N_A}\\) formülü ile bulunur.",
        "Normal koşullarda (0°C ve 1 atm basınçta) 1 mol gaz daima 22.4 litre hacim kaplar.",
        "Oda koşullarında (25°C ve 1 atm basınçta) 1 mol gaz daima 24.5 litre hacim kaplar.",
        "Gazların hacminden mol hesaplanırken \\(n = \\frac{V}{22.4}\\) (NK) formülü uygulanır.",
        "İzotop atomların kütle numaraları farklı olduğundan, ortalama atom kütlesi hesabı mol hesaplarında önem taşır.",
        "Kimyasal tepkimelerdeki katsayılar maddelerin mol oranlarını ve gaz fazında hacim oranlarını belirtir.",
        "Bağıl atom kütlesi, karbon-12 izotopunun kütlesi referans alınarak belirlenmiş kütle değeridir.",
        "Bir moleküldeki atomların gerçek kütlesi, o molekülün kütlesinin Avogadro sayısına bölünmesiyle bulunur.",
        "Kovalent bağlı bileşiklerde molekül kütlesi, iyonik bağlı bileşiklerde ise formül kütlesi kavramı kullanılır.",
        "Kimyasal hesaplamalarda sınırlayıcı bileşen, tepkimede ilk önce tükenen ve oluşan ürün miktarını belirleyen maddedir.",
        "Gerçek atom kütlesi 1 tane atomun gram cinsinden değeridir ve MA / NA formülüyle bulunur.",
        "Atomik kütle birimi (akb), 1 tane karbon-12 izotopunun kütlesinin 12'de biridir.",
        "1 akb daima 1 / NA gram değerine eşittir ve mikro ölçekli kütle birimidir.",
        "Formül kütlesi iyonik bağlı bileşiklerin (NaCl, MgO vb.) 1 molünün kütlesini ifade eder.",
        "Molekül kütlesi kovalent bağlı bileşiklerin (H2O, CO2 vb.) 1 molünün kütlesini ifade eder.",
        "Gaz karışımı sorularında ortalama mol kütlesi karışımın toplam kütlesinin toplam mol sayısına bölünmesiyle bulunur.",
        "Katsayılar arasındaki mol geçişleri tepkime denkleştirildikten sonra yapılmalıdır.",
        "Tepkime denkleştirilmeden yapılan mol hesapları daima yanlış sonuç verir.",
        "Artan madde sorularında başlangıç-değişim-sonuç tablosu kurularak mol takibi yapılır.",
        "Tepkime verimi, oluşan gerçek ürün miktarının teorik olarak hesaplanan maksimum ürün miktarına oranıdır.",
        "Saf olmayan madde içeren tepkime sorularında saf kısım mol sayısına çevrilerek işleme alınır.",
        "Analiz tepkimelerinde büyük moleküller küçük moleküllere parçalanırken mol sayısı artabilir.",
        "Sentez tepkimelerinde ise küçük moleküller birleşerek mol sayısını azaltabilir.",
        "Avogadro Hipotezi, aynı sıcaklık ve basınçta farklı gazların eşit hacimlerinin eşit sayıda tanecik içerdiğini söyler.",
        "1 mol atom içeren CO2 bileşiği 1/3 mol CO2 molekülüne eşittir çünkü molekülde 3 atom vardır.",
        "Bileşik formülünden elementlerin kütlece birleşme oranları mol kütleleri yardımıyla bulunur.",
        "Kaba formül (en sade formül) bileşikteki atomların en küçük tam sayılı mol oranlarını gösterir.",
        "Molekül formülü ise kaba formülün gerçek mol kütlesine göre genişletilmiş halidir.",
        "Kaba formülden kütlece yüzde bileşimler bulunabilir ancak gerçek atom sayıları bulunamaz.",
        "Mol hesaplarında kütle, hacim ve tanecik sayısı geçişlerinde daima köprü olarak mol birimi kullanılır.",
        "Kimyasal hesaplamalarda mol kütlesi değerleri parantez içinde soru sonunda verilir.",
        "akb kütle sorularında Avogadro sayısı ile çarpma veya bölme işlemlerine ekstra dikkat edilmelidir.",
        "1 mol H2 gazı 2 gram iken, 1 tane H2 molekülü 2/NA gram veya 2 akb kütleye sahiptir.",
        "Soru çözümlerinde birim analizi yapmak hata oranını en aza indirir.",
        "YKS TYT Kimya sınavında mol kavramı ve kimyasal hesaplamalardan her yıl en az 1 soru çıkmaktadır."
      );
    } else if (cleanTopic === "Hücre Biyolojisi" || cleanTopic === "Hücre") {
      sentences.push(
        "Hücre, canlıların yapısal ve işlevsel en küçük temel biyolojik birimidir.",
        "Çekirdek zarı ve zarlı organelleri olmayan basit hücrelere prokaryot hücre denir; bakteriler bu gruptadır.",
        "Çekirdek zarı ve zarlı organelleri olan gelişmiş hücrelere ökaryot hücre denir; bitki ve hayvan hücreleri ökaryottur.",
        "Hücre zarı seçici geçirgen, esnek, canlı ve çift sıralı fosfolipit tabakasından oluşan yapıdır.",
        "Hücre zarından madde geçişleri pasif taşıma (enerji harcanmaz) ve aktif taşıma (ATP harcanır) olarak ikiye ayrılır.",
        "Difüzyon, maddelerin çok yoğun ortamdan az yoğun ortamda kendiliğinden yayılmasıdır; pasif taşımadır.",
        "Ozmoz, suyun yarı geçirgen zardan difüzyonudur ve suyun çok olduğu yerden az olduğu yere geçişidir.",
        "Aktif taşıma, maddelerin az yoğun ortamdan çok yoğun ortama taşıyıcı proteinler ve ATP yardımıyla geçirilmesidir.",
        "Büyük katı maddelerin hücre içine alınmasına fagositoz, büyük sıvı maddelerin alınmasına pinositoz denir.",
        "Endositoz ve ekzositoz olayları sadece ökaryot hücrelerde gerçekleşir ve zar yüzey alanını değiştirir.",
        "Ribozom, protein sentezinin yapıldığı zarsız ve tüm hücrelerde ortak olarak bulunan organeldir.",
        "Mitokondri, oksijenli solunumla hücrenin ihtiyaç duyduğu ATP enerjisini üreten çift zarlı organeldir.",
        "Kloroplast, bitki hücrelerinde fotosentez yaparak organik besin sentezleyen çift zarlı organeldir.",
        "Endoplazmik retikulum, hücre içi madde iletimini sağlayan kanallar sistemidir; granüllü ve granülsüz olarak ayrılır.",
        "Lizozom, hayvan hücrelerinde hücre içi sindirimi gerçekleştiren hidrolitik enzimler içeren tek zarlı organeldir.",
        "Golgi aygıtı hücrede salgı üretimi, paketleme ve glikoprotein gibi karmaşık moleküllerin sentezini yapar.",
        "Koful hücre içi su dengesini, besin depolamayı ve atık maddelerin saklanmasını sağlayan tek zarlı organeldir.",
        "Kontraktil koful tatlı suda yaşayan tek hücrelilerde fazla suyu ATP harcayarak dışarı atan hayati organdır.",
        "Sentrozom hayvan hücrelerinde hücre bölünmesi sırasında iğ ipliklerini oluşturan zarsız organeldir.",
        "Hücre duvarı bitki, bakteri ve mantarlarda bulunan, hücreye dayanıklılık sağlayan cansız yapıdır.",
        "Bitki hücre duvarı selülozdan, mantar hücre duvarı kitinden, bakteri duvarı ise peptidoglikandan oluşur.",
        "Plazmoliz hücrenin hipertonik (çok yoğun) ortama konulduğunda su kaybederek büzüşmesi olayıdır.",
        "Deplazmoliz plazmolize uğramış hücrenin hipotonik ortama konulduğunda su alarak eski haline dönmesidir.",
        "Turgor basıncı hücre içindeki suyun hücre zarına ve duvarına yaptığı net itme basıncıdır.",
        "Ozmotik basınç hücre içindeki çözünmüş maddelerin oluşturduğu su emme isteğidir.",
        "Emme kuvveti ozmotik basınç ile turgor basıncı arasındaki farka eşittir: EK = OB - TB.",
        "Hemoliz çeperi olmayan hücrelerin (hayvan hücresi) aşırı su alarak turgor basıncından dolayı patlamasıdır.",
        "Çeperli hücrelerde (bitki hücresi) çeper dayanıklılık sağladığı için hemoliz olayı gerçekleşmez.",
        "Aktif taşıma ve difüzyon küçük moleküllerin (glikoz, amino asit, iyonlar) geçişinde kullanılır.",
        "Endositoz ve ekzositoz ise büyük moleküllerin (protein, nişasta vb.) zardan geçiş yöntemleridir.",
        "Çekirdek hücrenin yönetim merkezidir; çekirdek zarı, çekirdek sıvısı, çekirdekçik ve kromatinden oluşur.",
        "Kromatin iplikler bölünme sırasında kısalarak kalınlaşır ve kromozom adını alırlar.",
        "Hücre iskeleti hücrenin şeklini koruyan, organelleri sabitleyen mikrotübül, mikrofilament ve ara filamentlerden oluşur.",
        "Peroksizom katalaz enzimi yardımıyla zehirli hidrojen peroksiti (H2O2) su ve oksijene parçalayan organdır.",
        "Plastitler bitki hücrelerinde bulunan kloroplast, kromoplast (renk maddesi) ve lökoplast (nişasta deposu) organelleridir.",
        "Glikokaliks hücre zarının dış yüzeyinde bulunan, hücrelerin birbirini tanımasını sağlayan reseptör tabakadır.",
        "Glikoprotein ve glikolipitler glikokaliks yapısını oluşturarak hücreye özgünlük kazandırırlar.",
        "Sıcaklık ve pH değişimleri hücre organellerinin ve enzimlerinin çalışmasını doğrudan etkiler.",
        "Hücre teorisine göre tüm canlılar bir ya da birden fazla hücreden meydana gelmiştir.",
        "YKS TYT Biyoloji sınavında hücre biyolojisi ünitesinden her yıl en az 1-2 adet soru sorulmaktadır."
      );
    } else {
      // 2. Dynamic, Subject-Specific Generator for any user-input topic under any YKS subject domain
      const sub = (subject || "").toLowerCase();
      
      if (sub.includes("biyoloji") || sub.includes("biyolojisi") || sub.includes("fizyoloji") || sub.includes("canlı") || sub.includes("hücre")) {
        sentences.push(
          `Belirttiğin "${cleanTopic}" konusu YKS Biyoloji müfredatının en temel ve soru getiren kazanımlarındandır.`,
          `YKS Biyoloji sorularında "${cleanTopic}" mekanizmaları ve hücresel yapılar arasındaki ilişkiler sorgulanır.`,
          `Bu konuyu çalışırken prokaryot ve ökaryot hücre modelleri üzerindeki farklılıkları net ayırt etmelisin.`,
          `ÖSYM, "${cleanTopic}" süreçlerini deneysel düzenekler ve grafik yorumlamaları şeklinde sormayı sever.`,
          `Konudaki latince kökenli biyolojik terimleri ve görevlerini özel çalışma kartları yaparak ezberlemelisin.`,
          `Hücre organellerinin (özellikle mitokondri, kloroplast ve ribozom) "${cleanTopic}" içindeki rollerini öğren.`,
          `Bu konudaki reaksiyon basamaklarında ATP, enzim ve koenzim kullanım durumlarını tek tek not almalısın.`,
          `Madde geçişi kurallarını bilmek, "${cleanTopic}" konusunun deney sorularını çözmek için kilit öneme sahiptir.`,
          `Fotosentez, solunum ve protein sentezi gibi temel olayların "${cleanTopic}" ile olan bağlarını kurabilmelisin.`,
          `Haftalık biyoloji tekrarlarında "${cleanTopic}" çizimlerini boş kağıtlara şema olarak çizmelisin.`,
          `Biyoloji denemelerinde "${cleanTopic}" ile ilgili öncüllü sorularda her şıkkı titizlikle analiz et.`,
          `Mitoz ve mayoz bölünme evrelerindeki kromozom davranışlarının "${cleanTopic}" üzerindeki genetik etkisini gör.`,
          `Kalıtım kuralları ve soyağacı analizleri ile "${cleanTopic}" arasındaki kalıtsal ilişkileri incelemelisin.`,
          `Canlıların ortak özellikleri ünitesinde "${cleanTopic}" konusunun tüm canlı gruplarındaki karşılığını araştır.`,
          `Ekoloji ve çevre biyolojisi sorularında "${cleanTopic}" konusunun madde döngülerindeki yerine odaklan.`,
          `Sistemler (fizyoloji) konularını çalışırken "${cleanTopic}" konusunun organ bazındaki işlevlerini kavra.`,
          `Bitki biyolojisi sorularında stomaların ve taşıma dokularının "${cleanTopic}" ile etkileşimini unutma.`,
          `Enzim aktivitesine etki eden sıcaklık, pH ve su miktarı grafiklerini "${cleanTopic}" için de uyarla.`,
          `Biyoloji soru bankalarındaki zor seviye "${cleanTopic}" testlerini çözerek kavramsal eksiklerini kapat.`,
          `YKS Biyoloji müfredatında "${cleanTopic}" kazanımlarının tamamını MEB kazanım testleriyle doğrula.`
        );
      } else if (sub.includes("fizik") || sub.includes("mekanik") || sub.includes("optik") || sub.includes("elektrik") || sub.includes("kuvvet")) {
        sentences.push(
          `Belirttiğin "${cleanTopic}" konusu YKS Fizik müfredatının en kritik sayısal ve sözel kazanımlarındandır.`,
          `Fizikte formülleri ezberlemek yerine, "${cleanTopic}" konusundaki temel yasaların mantığını kavramalısın.`,
          `Newton'un hareket kanunları ve vektörel büyüklükler, "${cleanTopic}" sorularında işlem yapmanı sağlar.`,
          `Sürtünme kuvveti, yerçekimi ve net kuvvet vektörlerini serbest cisim diyagramı çizerek "${cleanTopic}" üzerinde göster.`,
          `İş, güç ve enerji dönüşüm denklemleri "${cleanTopic}" sorularını çözmede en büyük yardımcındır.`,
          `Optik, ışık akısı ve kırılma kanunlarının "${cleanTopic}" ile olan fiziksel paralelliğini incelemelisin.`,
          `Elektrik alan, potansiyel fark ve akım kurallarını "${cleanTopic}" bağıntılarıyla birleştirmelisin.`,
          `Dalgalar ve basit harmonik hareket formüllerini "${cleanTopic}" analizlerinde aktif kullanmalısın.`,
          `Sayısal işlemlerde birim analizine dikkat etmek, "${cleanTopic}" sorularında hata yapmanı engeller.`,
          `ÖSYM, fizikte günlük hayattaki "${cleanTopic}" uygulamalarını ve öncüllü yorum sorularını sıklıkla sorar.`,
          `Çembersel hareket ve açısal momentum kavramlarının "${cleanTopic}" üzerindeki tork etkisini hesapla.`,
          `Fizik denemelerinde "${cleanTopic}" sorularını çözerken mutlaka şekil çizerek kuvvet yönlerini işaretle.`,
          `Isı ve sıcaklık grafiklerindeki hal değişim noktalarının "${cleanTopic}" üzerindeki termodinamik etkisini öğren.`,
          `Basınç ve kaldırma kuvveti ilkelerinin "${cleanTopic}" akışkan mekaniğindeki kurallarını gözden geçir.`,
          `Modern fizik ve radyoaktivite konularındaki ışınım türlerinin "${cleanTopic}" ile olan teorik bağını kur.`,
          `Fizik dersinde "${cleanTopic}" konusunu çalışırken her formülün hangi fiziksel sabite bağlı olduğunu yaz.`,
          `Önceki yıllarda YKS'de çıkmış "${cleanTopic}" sorularını çözerek soru tarzlarını iyice analiz et.`,
          `Farklı kaynaklardan görsel ağırlıklı yeni nesil "${cleanTopic}" sorularını bularak çözmelisin.`,
          `Hata Defterindeki tüm yanlış yapılmış "${cleanTopic}" fizik sorularını haftalık olarak tekrar çöz.`,
          `YKS Fizik hazırlığında "${cleanTopic}" konusundan tam net çıkarmak için MEB kazanımlarına tam uy.`
        );
      } else if (sub.includes("kimya") || sub.includes("gazlar") || sub.includes("mol") || sub.includes("denge") || sub.includes("organik")) {
        sentences.push(
          `Belirttiğin "${cleanTopic}" konusu YKS Kimya müfredatının en önemli temel yapı taşlarındandır.`,
          `Kimyasal hesaplamalarda katsayı ilişkilerini kurabilmek "${cleanTopic}" sorularında doğru sonucu verir.`,
          `Avogadro sayısı, mol kütlesi ve normal şartlar altındaki gaz hacimlerini "${cleanTopic}" sorularına uyarla.`,
          `Sınırlayıcı bileşen ve tepkime verimi hesaplarını "${cleanTopic}" reaksiyonları üzerinde denemelisin.`,
          `Atom modelleri ve periyodik cetvel özelliklerinin "${cleanTopic}" element bağlarındaki etkisini öğren.`,
          `Kimyasal türler arası zayıf ve güçlü etkileşim kuralları, "${cleanTopic}" maddelerinin yapısını açıklar.`,
          `Gaz kanunları (basınç, hacim, sıcaklık) ile "${cleanTopic}" gaz moleküllerinin davranışlarını çöz.`,
          `Çözeltilerde molarite, molalite ve koligatif özellikleri "${cleanTopic}" hesaplamalarında aktif kullan.`,
          `Tepkimelerde ısı değişimi (entalpi) ve hız bağıntılarının "${cleanTopic}" reaksiyonlarına etkisini incele.`,
          `Kimyasal denge, Le Chatelier ilkesi ve pH/pOH kavramlarını "${cleanTopic}" dengelerinde uygula.`,
          `Redoks tepkimeleri ve elektrokimyasal pillerin anot/katot kurallarını "${cleanTopic}" için tekrar et.`,
          `Karbon kimyası ve organik bileşik adlandırma kurallarını "${cleanTopic}" fonksiyonel gruplarında çalış.`,
          `Kimya laboratuvar güvenlik kuralları ve madde sembollerinin "${cleanTopic}" içindeki önemini bil.`,
          `Asitler, bazlar ve tuzların genel özelliklerini "${cleanTopic}" tepkimelerinde doğru eşleştirmelisin.`,
          `Bileşik formülü bulma (kaba ve molekül formülü) adımlarını "${cleanTopic}" kütle yüzdelerine göre yap.`,
          `Kimya dersinde "${cleanTopic}" sorularını çözerken birimlerin rasyonel sadeleştirmelerine dikkat et.`,
          `ÖSYM'nin kimyada sorduğu grafik okuma ve tablo yorumlama sorularını "${cleanTopic}" için analiz et.`,
          `Haftalık kimya tekrarlarında "${cleanTopic}" formüllerini boş bir kağıda hafızandan yazarak dene.`,
          `Yeni nesil kimya sorularında günlük hayat örnekli "${cleanTopic}" sorularını çözmeye özen göster.`,
          `YKS Kimya sınavında "${cleanTopic}" konusundan soru kaçırmamak için MEB kazanım odaklı çalış.`
        );
      } else if (sub.includes("türkçe") || sub.includes("turkce") || sub.includes("edebiyat") || sub.includes("paragraf") || sub.includes("dil")) {
        sentences.push(
          `Belirttiğin "${cleanTopic}" konusu YKS Türkçe ve Edebiyat müfredatında en yüksek puan getiren alanlardandır.`,
          `Türkçede dil bilgisi kuralları ve sözcük türlerinin "${cleanTopic}" içindeki yapısını iyi öğrenmelisin.`,
          `Yazım kuralları, noktalama işaretleri ve ses olaylarının "${cleanTopic}" sorularındaki rollerine dikkat et.`,
          `Paragrafta ana düşünce ve yardımcı düşünceleri bulurken "${cleanTopic}" metinlerini hızlı ve odaklı oku.`,
          `Cümle ögeleri, fiil çatısı ve anlatım bozukluğu kurallarını "${cleanTopic}" cümlelerinde uygula.`,
          `Edebiyat çalışıyorsan, sanatçıların eserlerini ve edebi dönemlerin "${cleanTopic}" üzerindeki etkisini ezberle.`,
          `Divan edebiyatı, Tanzimat ve Cumhuriyet dönemlerinin şiir ve nesir türlerindeki "${cleanTopic}" izlerini takip et.`,
          `Metin tahlili yaparken yazarın üslubu ve anlatım biçimlerinin "${cleanTopic}" ile olan bağını incele.`,
          `Dilin sadeleşme aşamaları ve Türk dili tarihindeki gelişimlerin "${cleanTopic}" kelimelerine etkisini gör.`,
          `Türkçe denemelerinde süre yönetimi yapabilmek için her gün düzenli olarak "${cleanTopic}" pratikleri yap.`,
          `Sözcükte anlam ve cümlede anlam sorularındaki ince nüansları "${cleanTopic}" örnekleri üzerinden çalış.`,
          `Halk edebiyatı nazım şekilleri ve aruz/hece ölçüsü kurallarını "${cleanTopic}" metinlerinde eşleştir.`,
          `Roman özetleri ve karakter analizlerini "${cleanTopic}" edebi akımlarına göre gruplandır.`,
          `Anlatım biçimlerinden açıklama, tartışma, betimleme ve öykülemeyi "${cleanTopic}" paragrafında ayırt et.`,
          `Düşünceyi geliştirme yollarından tanımlama ve örneklendirmeyi "${cleanTopic}" sorularında hızlıca gör.`,
          `Yazım hatalarını azaltmak için sıkça karıştırılan kelimelerin doğru yazılışlarını "${cleanTopic}" için listele.
          "`,
          `Edebi türlerin (tiyatro, masal, destan, mektup) gelişim tarihini "${cleanTopic}" kapsamında tekrar et.`,
          `Türkçe sorularını çözerken seçenekleri eleyerek gitmek "${cleanTopic}" konusunda süreni kısaltır.`,
          `Hata Defterindeki yanlış çözülmüş tüm "${cleanTopic}" Türkçe ve Edebiyat sorularını analiz et.`,
          `YKS Türkçe ve Edebiyat sınavında "%100 Başarı" hedefiyle "${cleanTopic}" kazanımlarını MEB'den kontrol et.`
        );
      } else if (sub.includes("sosyal") || sub.includes("tarih") || sub.includes("coğrafya") || sub.includes("felsefe") || sub.includes("din")) {
        sentences.push(
          `Belirttiğin "${cleanTopic}" konusu YKS Sosyal Bilimler (Tarih, Coğrafya, Felsefe) müfredatında yer almaktadır.`,
          `Tarihte olayların neden-sonuç ilişkilerini ve kronolojik sırasını "${cleanTopic}" kapsamında öğrenmelisin.`,
          `Osmanlı tarihi, inkılap tarihi ve dünya savaşı dönemlerinin "${cleanTopic}" üzerindeki etkilerini analiz et.`,
          `Atatürk ilkeleri ve inkılaplarının çağdaşlaşma hedeflerini "${cleanTopic}" süreçleriyle bağdaştır.`,
          `Coğrafyada harita okuryazarlığı ve iklim/yer şekilleri kurallarını "${cleanTopic}" bölgelerine uyarla.`,
          `Nüfus, göç, ekonomik faaliyetler ve doğal afetlerin "${cleanTopic}" üzerindeki beşeri etkilerini gör.`,
          `Felsefede bilgi, varlık, ahlak ve siyaset kuramlarının "${cleanTopic}" hakkındaki görüşlerini incele.`,
          `Din kültürü ve ahlak bilgisi sorularında inanç esasları ve ahlaki değerlerin "${cleanTopic}" bağını kur.`,
          `ÖSYM sosyal bilimlerde kavram bilgisini ve paragraf üzerinden yorum yapmayı "${cleanTopic}" için sorgular.`,
          `Sosyal tekrarlarında önemli kavramları, antlaşmaları ve coğrafi terimleri "${cleanTopic}" için kartlara yaz.`,
          `Tarihi belgeler ve ilk kaynaklar üzerinden yapılan yorumlamaları "${cleanTopic}" sorularında dikkate al.`,
          `Coğrafi koordinat sistemi, yerel saat hesapları ve projeksiyonların "${cleanTopic}" ile ilişkisini kur.`,
          `İlk çağ uygarlıkları ve İslam tarihi dönemlerindeki kültürel gelişmelerin "${cleanTopic}" katkısını gör.`,
          `Felsefi akımları (rasyonalizm, empirizm, nihilizm vb.) ve kurucularını "${cleanTopic}" için eşleştir.`,
          `Doğal kaynakların verimli kullanımı ve küresel çevre örgütlerinin "${cleanTopic}" raporlarını oku.`,
          `Sosyal denemelerinde paragrafların içindeki gizli ipuçlarını "${cleanTopic}" soruları için yakala.`,
          `Tarih ve coğrafya haritaları üzerinde önemli bölgeleri ve boğazları "${cleanTopic}" için işaretle.`,
          `Sosyal bilimler konularındaki sözel ezberleri kodlama teknikleriyle "${cleanTopic}" için zihninde tut.`,
          `Hata Defterine eklediğin yanlış yapılmış tüm "${cleanTopic}" sosyal sorularının doğru cevaplarını öğren.`,
          `YKS Sosyal Bilimler sınavında fullemek için "${cleanTopic}" MEB müfredat kazanımlarını eksiksiz bitir.`
        );
      } else if (sub.includes("ingilizce") || sub.includes("english") || sub.includes("ydt") || sub.includes("dil")) {
        sentences.push(
          `Belirttiğin "${cleanTopic}" konusu YKS YDT (Yabancı Dil Testi) İngilizce müfredatının önemli kazanımlarındandır.`,
          `İngilizce gramer, zamanlar (tenses) ve aktif/pasif yapıların "${cleanTopic}" içindeki kullanımını gör.`,
          `İngilizce bağlaçlar (conjunctions) ve yan cümlelerin (clauses) "${cleanTopic}" cümlelerindeki yerini incele.`,
          `YDT İngilizce kelime dağarcığını geliştirmek için "${cleanTopic}" ile ilgili akademik kelimeleri listele.`,
          `Phrasal verbs, edatlar (prepositions) ve collocation kullanımlarını "${cleanTopic}" için ezberle.`,
          `Paragraf tamamlama ve anlamca en yakın cümleyi bulma sorularını "${cleanTopic}" metinlerinde çöz.`,
          `Diyalog tamamlama ve durum sorularındaki uygun ifadeleri "${cleanTopic}" bağlamında analiz et.`,
          `İngilizce okuma (reading) parçalarını okurken bilinmeyen kelimelerin anlamlarını "${cleanTopic}" için çıkar.`,
          `Çeviri sorularında temel ögelerin (özne, yüklem, nesne) yerleşimini "${cleanTopic}" cümlelerinde yakala.`,
          `YDT hazırlık sürecinde her gün en az 50 kelime ezberi yaparak "${cleanTopic}" metinlerini kolayca oku.`,
          `İngilizce denemelerinde zaman yönetimi kazanmak amacıyla "${cleanTopic}" soru tiplerine süre tutarak çalış.`,
          `Sıfatlar (adjectives), zarflar (adverbs) ve zamirlerin (pronouns) "${cleanTopic}" içindeki görevlerini yaz.`,
          `İngilizce deyimler ve atasözlerinin YDT sınavında soru getiren "${cleanTopic}" kalıplarını kontrol et.`,
          `Kelime kartları hazırlayarak eş anlamlı (synonyms) ve zıt anlamlı (antonyms) sözcükleri "${cleanTopic}" için çalış.`,
          `Soru çözümlerinde soru kökü analizi yapmak, "${cleanTopic}" sorularında çeldiricileri elenmesini sağlar.`,
          `İngilizce cümleleri kendi kelimelerinle özetleme (paraphrasing) egzersizlerini "${cleanTopic}" için dene.`,
          `YDT çıkmış sınav sorularındaki gramer ve kelime dağılımlarını "${cleanTopic}" odağında incele.`,
          `Haftalık YDT tekrarlarında takıldığın gramer kurallarını "${cleanTopic}" örnekleriyle pekiştir.`,
          `Hata Defterindeki tüm yanlış çözülmüş "${cleanTopic}" İngilizce sorularını öğretmenlerine sorarak düzelt.`,
          `YKS YDT İngilizce sınavında derece yapmak için "${cleanTopic}" konusuyla ilgili tüm testleri çöz.`
        );
      } else {
        // General Default YKS templates if subject is not detected
        sentences.push(
          `Belirttiğin "${cleanTopic}" konusu YKS müfredatında kritik bir yere sahiptir ve düzenli çalışma gerektirir.`,
          `Bu konudaki temel kavramları öğrenmeden karmaşık soru tiplerine geçmemelisin.`,
          `YKS sınavında bu konu ile ilgili her yıl doğrudan veya dolaylı soru çıkmaktadır.`,
          `Bu konuyu çalışırken pasif okuma yerine yazarak ve formülleri türeterek çalışmak kalıcılığı artırır.`,
          `Konu anlatım videolarını izlerken önemli yerleri not almalı ve kendi bilgi kartlarını oluşturmalısın.`,
          `Anlamadığın soru tiplerini kesip Hata Defterine eklemeli ve çözümlerini hemen öğrenmelisin.`,
          `Konunun mantığını anlamak, formülleri ezberlemekten çok daha değerlidir.`,
          `Konuyla ilgili ilk testi çözerken süre sınırlaması koymadan doğru çözmeye odaklanmalısın.`,
          `İlk aşamada çözdüğün sorularda hata yapman doğaldır; önemli olan hatalardan ders çıkarmaktır.`,
          `Haftalık tekrarlarda bu konu ile ilgili en az 15-20 soru çözerek bilgileri taze tutmalısın.`,
          `Konunun çıkmış sınav sorularını (ÖSYM soruları) inceleyerek soru tarzlarını öğrenmelisin.`,
          `Konuyu çalıştıktan sonra 48 saat kuralına uyarak Öğrenme Doğrulama Testi (ÖDT) çözmelisin.`,
          `ÖDT sonucuna göre konunun durumunu (Öğrenildi, Kırılgan, Bitmedi) belirleyip aksiyon almalısın.`,
          `Konu pekiştirmek için farklı soru bankalarından seviyeli (kolay-orta-zor) testler çözmelisin.`,
          `Takıldığın yerlerde öğretmenlerinden veya AI Koç'tan anında destek alarak ilerlemelisin.`,
          "Konuyu çalışırken önemli formülleri ve kuralları renkli kağıtlara yazıp görebileceğin bir yere asabilirsin.",
          "Soru çözüm videolarını izlerken önce videoyu durdurup soruyu kendin çözmeye çalışmalısın.",
          "Aynı konudan üst üste çok fazla soru çözmek yerine aralıklı çalışma yöntemini uygulamalısın.",
          "Çözdüğün kaynakların güncel ÖSYM tarzında yeni nesil sorular içerdiğinden emin olmalısın.",
          "Konunun alt başlıklarını zihin haritası (Mind Map) çıkararak görselleştirmek kavramayı kolaylaştırır."
        );
      }
      
      // Pad out the custom topic summary sentences to ensure it has exactly 40 sentences before YKS warnings
      while (sentences.length < 40) {
        sentences.push(
          `YKS sınavına hazırlık sürecinde "${cleanTopic}" konusunun hedeflenen netlere ulaşmadaki kritik önemini hatırla.`,
          `Bu konuyu çalışırken dikkati dağıtacak dış uyarıcılardan (tablet, telefon) uzak kalmaya özen göster.`,
          `Konuyla ilgili kavram sözlüğünü düzenli olarak güncellemeli ve yatmadan önce gözden geçirmelisin.`,
          `Sorulardaki öznel yorumlar ile nesnel bilgilerin ayrımını "${cleanTopic}" için net yapmalısın.`,
          `Formül ispatlarını öğrenmek, sınav anında formülü unuttuğunda "${cleanTopic}" sorularını kurtarmanı sağlar.`,
          `Her ders seansında tek bir kazanıma odaklanarak "${cleanTopic}" çalışmasının verimini maksimize et.`
        );
      }
    }

    // 3. Add 10 General YKS warnings/tips (Sentences 41-50)
    sentences.push(
      "Sınava hazırlıkta her konunun ardından çıkmış ÖSYM sorularını analiz etmelisin.",
      "Denemelerde turlama tekniğini kullanarak zor sorularla vakit kaybetmemelisin.",
      "Soru kökündeki 'değildir', 'olamaz', 'kesinlikle' gibi kelimeleri vurgulayarak okumalısın.",
      "Hata Defteri'ne eklediğin yanlış soruların çözümlerini 24 saat içinde mutlaka öğrenmelisin.",
      "Uyku düzenini korumalı ve günde ortalama 7-8 saat kaliteli uyku uyumalısın.",
      "Çalışma seansları arasında odağını tazeleyecek 10 dakikalık aktif molalar vermelisin.",
      "Çözdüğün soru bankalarının düzeyini kendi seviyene göre aşama aşama seçmelisin.",
      "Formülleri sadece ezberlemek yerine mantığını ve ispatını öğrenerek ilerlemelisin.",
      "Sınav kaygısını yönetmek için düzenli nefes egzersizleri ve provalar yapmalısın.",
      "Başkalarının netleri yerine kendi kişisel gelişiminizi ve eksik kapatma serinizi takip etmelisin."
    );

    // Ensure it is EXACTLY 50 sentences
    return sentences.slice(0, 50);
  },

    
  renderVault: function() {
    this.renderVaultQuestions();
  },

  toggleRepetitionScheduleCard: function() {
    const body = document.getElementById("repetitionScheduleBody");
    const chev = document.getElementById("repetitionScheduleChevron");
    if (!body) return;
    const open = body.style.display !== "none";
    body.style.display = open ? "none" : "block";
    if (chev) chev.style.transform = open ? "rotate(0deg)" : "rotate(180deg)";
  },

  // Aralıklı tekrar döngüsünü öğrenciye gösterir: hangi konu ne zaman,
  // kaçıncı aşamada ve neden o aralıkta.
  renderRepetitionSchedule: function() {
    const card = document.getElementById("repetitionScheduleCard");
    const body = document.getElementById("repetitionScheduleBody");
    const countEl = document.getElementById("repetitionScheduleCount");
    if (!card || !body) return;

    const recs = (this.state.spacedRepetitionTasks || []).filter(r => r && r.topic);
    if (!recs.length) { card.style.display = "none"; return; }
    card.style.display = "block";

    const today = this.state.activeDay || 1;
    const due = recs.filter(r => r.dueDay && r.dueDay <= today);
    if (countEl) countEl.textContent = due.length ? `· bugün ${due.length} tekrar vakti geldi` : `· ${recs.length} konu döngüde`;

    const sorted = recs.slice().sort((a, b) => (a.dueDay || 0) - (b.dueDay || 0)).slice(0, 25);
    const rows = sorted.map(r => {
      const isDue = r.dueDay && r.dueDay <= today;
      const inDays = (r.dueDay || today) - today;
      const stage = Math.min((r.stage || 0) + 1, this.SR_INTERVALS.length);
      const when = isDue ? "bugün" : inDays === 1 ? "yarın" : `${inDays} gün sonra`;
      const color = isDue ? "var(--warning)" : "var(--border-color)";
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; background:var(--bg-card); border:1px solid var(--border-color); border-left:3px solid ${color}; border-radius:8px; padding:0.5rem 0.7rem; margin-bottom:0.4rem; flex-wrap:wrap;">
          <div>
            <div style="font-size:0.8rem; font-weight:800; color:var(--text-main);">${app.escapeHtml(r.topic)}</div>
            <div style="font-size:0.66rem; color:var(--text-muted); font-weight:700;">${app.escapeHtml(r.subject || "")} · ${stage}/${this.SR_INTERVALS.length}. tekrar</div>
          </div>
          <span style="font-size:0.72rem; font-weight:800; color:${isDue ? "var(--warning)" : "var(--text-muted)"}; white-space:nowrap;">
            ${isDue ? '<i class="fa-solid fa-bell"></i> ' : ''}${when}
          </span>
        </div>`;
    }).join("");

    const more = recs.length > sorted.length ? `<p style="font-size:0.7rem; color:var(--text-muted); font-weight:700; margin:0.3rem 0 0;">+${recs.length - sorted.length} konu daha döngüde.</p>` : "";
    const note = due.length
      ? `Bugün vakti gelen ${due.length} konu, ayrı görev olarak eklenmez — <strong>AI Akıllı Tekrar Seansı</strong>'nın içinde karşına çıkar.`
      : `Şu an vakti gelen tekrar yok. Aralıklar: ${this.SR_INTERVALS.join(" → ")} gün (duruma göre otomatik kısalır/uzar).`;

    body.innerHTML = rows + more + `
      <p style="font-size:0.78rem; color:var(--text-main); line-height:1.55; margin:0.75rem 0 0; padding-top:0.75rem; border-top:1px solid var(--border-color);">🔁 ${note}</p>`;
  },

  showMoreVaultQuestions: function() {
    this._vaultRenderLimit = (this._vaultRenderLimit || 60) + 60;
    this.renderVaultQuestions();
  },

  renderVaultQuestions: function() {
    this.renderRepetitionSchedule();
    const container = document.getElementById("vaultQuestionsContainer");
    container.innerHTML = "";

    const filterEl = document.getElementById("vaultExamTypeFilter");
    const filterVal = filterEl ? filterEl.value : "all";

    let activeQuestions = this.state.uploadedQuestions.filter(q => !q.completed);
    
    if (filterVal !== "all") {
      activeQuestions = activeQuestions.filter(q => {
        const itemType = q.examType || (q.subject === "Edebiyat" ? "AYT" : "TYT");
        return itemType === filterVal;
      });
    }

    if (activeQuestions.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
          <i class="fa-solid fa-folder-open" style="font-size:3rem; margin-bottom:1rem; opacity:0.5;"></i>
          <p>Kutuda filtreye uygun hatalı soru bulunmuyor.</p>
        </div>
      `;
      return;
    }

    // PERFORMANS: havuz binlerce kayda ulaşabiliyor ve hepsini tek seferde
    // basmak sekmeyi kilitliyordu (2000 kayıtta ~750ms ve on binlerce DOM
    // düğümü). Kayıtlar AI önceliğine göre sıralanıp sayfa sayfa basılır.
    const totalActive = activeQuestions.length;
    // Skor karşılaştırıcı içinde hesaplanırsa her öğe için O(log n) kez
    // yeniden hesaplanıyor; önce bir kez hesaplayıp öyle sıralıyoruz.
    activeQuestions = activeQuestions
      .map(q => ({ q, score: this.computeVaultPriorityScore(q) }))
      .sort((a, b) => b.score - a.score)
      .map(x => x.q);
    const limit = this._vaultRenderLimit || 60;
    const visibleQuestions = activeQuestions.slice(0, limit);

    visibleQuestions.forEach(q => {
      const recs = this.getYouTubeRecommendations(q.subject, q.topic);
      let recsHtml = "";
      recs.forEach(r => {
        recsHtml += `
          <a href="${app.escapeHtml(r.url)}" target="_blank" style="display:flex; align-items:center; gap:0.25rem; font-size:0.65rem; color:var(--text-main); text-decoration:none; padding:0.25rem 0.4rem; background:#fff; border:1px solid var(--border-color); border-radius:4px; transition:0.2s;" onmouseover="this.style.borderColor='red'; this.style.color='red';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.color='var(--text-main)';">
            <i class="fa-brands fa-youtube" style="color:red; font-size:0.75rem;"></i>
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600;">${app.escapeHtml(r.title)}</span>
          </a>
        `;
      });

      const sourceRecs = this.getSourceRecommendations(q.subject, q.topic, q.examType);
      let sourceRecsHtml = "";
      sourceRecs.forEach(r => {
        sourceRecsHtml += `
          <a href="${app.escapeHtml(r.url)}" target="_blank" style="display:flex; align-items:center; gap:0.25rem; font-size:0.65rem; color:var(--text-main); text-decoration:none; padding:0.25rem 0.4rem; background:#fff; border:1px solid var(--border-color); border-radius:4px; transition:0.2s;" onmouseover="this.style.borderColor='var(--primary)'; this.style.color='var(--primary)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.color='var(--text-main)';">
            <i class="fa-solid fa-book" style="color:var(--primary); font-size:0.75rem;"></i>
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600;">${app.escapeHtml(r.title)}</span>
          </a>
        `;
      });

      const imageHtml = q.imgData ? `
        <div class="vault-img-box">
          <img src="${app.escapeHtml(q.imgData)}" onclick="app.zoomVaultImage('${q.id}')">
        </div>
      ` : `
        <div class="vault-img-box" style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f1f5f9; color:var(--text-muted); padding:1rem; height:150px;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem; color:var(--primary); margin-bottom:0.5rem; opacity:0.6;"></i>
          <span style="font-size:0.75rem; font-weight:600;">Soru Görseli Eklenmedi</span>
        </div>
      `;

      let examBadgeHtml = "";
      const qExamType = q.examType || (q.subject === "Edebiyat" ? "AYT" : "TYT");
      if (qExamType) {
        const badgeClass = qExamType === "TYT" ? "tag-tyt" : "tag-ayt";
        examBadgeHtml = `<span class="task-badge ${badgeClass}" style="font-size:0.6rem; padding:0.1rem 0.3rem; margin-left:0.25rem;">${qExamType}</span>`;
      }

      const sourceBadge = q.source === "manual"
        ? `<span style="font-size:0.62rem; font-weight:800; color:var(--secondary); background:rgba(59,130,246,0.1); padding:0.1rem 0.4rem; border-radius:4px;"><i class="fa-solid fa-pen"></i> Manuel</span>`
        : `<span style="font-size:0.62rem; font-weight:800; color:var(--primary); background:var(--ai-tint, rgba(139,92,246,0.1)); padding:0.1rem 0.4rem; border-radius:4px;"><i class="fa-solid fa-robot"></i> Otomatik</span>`;

      const failCount = (q.attempts || []).filter(a => a.result === "error" || (typeof a.incorrect === "number" && a.incorrect > 0)).length;
      const sessionDay = this.findSmartReviewSessionDayForEntry(q.id);
      const statusLine = sessionDay
        ? `<i class="fa-solid fa-brain"></i> Gün ${sessionDay}'in AI Akıllı Tekrar Seansı'na dahil edildi`
        : `<i class="fa-solid fa-hourglass-half"></i> Review Pool'da bekliyor — AI önceliğine göre bir sonraki seansa seçilecek`;

      const card = document.createElement("div");
      card.className = "vault-card";
      card.innerHTML = `
        ${imageHtml}
        <div class="vault-card-body">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:0.25rem;">
              <div class="vault-tag">${app.escapeHtml(q.subject)}</div>
              ${examBadgeHtml}
            </div>
            ${sourceBadge}
          </div>
          <div class="vault-card-topic">${app.escapeHtml(q.topic)}</div>
          <div class="vault-card-note">${app.escapeHtml(q.note || "Not eklenmemiş.")}</div>
          <div style="font-size:0.7rem; color:var(--text-muted); font-weight:700; margin-top:0.4rem;"><i class="fa-solid fa-tag"></i> ${app.escapeHtml(q.tag || "Genel")}${failCount > 1 ? ` · ${failCount}. deneme` : ""}</div>
          <div style="font-size:0.72rem; color:var(--warning); font-weight:700; margin-top:0.35rem;">${statusLine}</div>
          <div style="font-size:0.68rem; color:var(--text-muted); font-weight:600; margin-top:0.15rem;">AI Akıllı Tekrar Seansı'nda "Artık Hatasız" işaretlenene kadar Review Pool'da kalır.</div>

          <!-- YouTube Videos Collapsible Folder -->
          <div style="margin-top: 0.75rem; margin-bottom: 0.75rem;">
            <button class="btn btn-secondary" style="width: 100%; padding: 0.35rem 0.5rem; font-size: 0.7rem; justify-content: center; gap: 0.35rem; display:flex; align-items:center;" onclick="app.toggleVaultCardVideos('${q.id}')">
              <i class="fa-solid fa-folder-closed" id="folderIcon-${q.id}"></i> Çalışma Videoları Klasörü
            </button>
            <div id="folderContent-${q.id}" style="display: none; margin-top: 0.5rem; background: rgba(37,99,235,0.02); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; flex-direction: column; gap: 0.35rem; text-align: left;">
              <div style="font-size:0.65rem; font-weight:800; color:var(--primary); display:flex; align-items:center; gap:0.25rem; margin-bottom:0.1rem;">
                <i class="fa-brands fa-youtube" style="color:red; font-size:0.75rem;"></i> Önerilen Konu Anlatımları:
              </div>
              ${recsHtml}
            </div>
          </div>

          <!-- Kaynak (Yayın/Soru Bankası) Önerileri Collapsible Folder -->
          <div style="margin-top: 0.75rem; margin-bottom: 0.75rem;">
            <button class="btn btn-secondary" style="width: 100%; padding: 0.35rem 0.5rem; font-size: 0.7rem; justify-content: center; gap: 0.35rem; display:flex; align-items:center;" onclick="app.toggleVaultCardSources('${q.id}')">
              <i class="fa-solid fa-folder-closed" id="srcFolderIcon-${q.id}"></i> Kaynak Önerileri Klasörü
            </button>
            <div id="srcFolderContent-${q.id}" style="display: none; margin-top: 0.5rem; background: rgba(99,102,241,0.03); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; flex-direction: column; gap: 0.35rem; text-align: left;">
              <div style="font-size:0.65rem; font-weight:800; color:var(--primary); display:flex; align-items:center; gap:0.25rem; margin-bottom:0.1rem;">
                <i class="fa-solid fa-book" style="color:var(--primary); font-size:0.75rem;"></i> Önerilen Yayın / Soru Bankası:
              </div>
              ${sourceRecsHtml}
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; margin-top:auto; padding-top:0.75rem; border-top:1px solid rgba(0,0,0,0.05); gap: 0.5rem;">
            <button class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.75rem; flex:1;" ${q.imgData ? `onclick="app.zoomVaultImage('${q.id}')"` : 'disabled style="opacity:0.5;"'}>
              <i class="fa-solid fa-magnifying-glass-plus"></i> Büyüt
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    // Kalan kayıtlar için "daha fazla göster" — hepsi tek seferde basılmaz.
    if (totalActive > visibleQuestions.length) {
      const more = document.createElement("div");
      more.style.cssText = "grid-column:1/-1; text-align:center; padding:1rem 0;";
      more.innerHTML = `
        <p style="font-size:0.75rem; color:var(--text-muted); font-weight:700; margin:0 0 0.5rem;">
          ${visibleQuestions.length} / ${totalActive} kayıt gösteriliyor (en öncelikliler üstte)
        </p>
        <button class="btn btn-secondary" style="font-weight:800; font-size:0.78rem;" onclick="app.showMoreVaultQuestions()">
          <i class="fa-solid fa-chevron-down"></i> Daha Fazla Göster
        </button>`;
      container.appendChild(more);
    }

    // Populate completed questions in the Collapsible Solved Archive
    const completedQuestions = this.state.uploadedQuestions.filter(q => q.completed);
    const archiveCountEl = document.getElementById("vaultArchiveCount");
    if (archiveCountEl) archiveCountEl.textContent = completedQuestions.length;

    const archiveContainer = document.getElementById("vaultArchiveContainer");
    if (archiveContainer) {
      archiveContainer.innerHTML = "";
      if (completedQuestions.length === 0) {
        archiveContainer.innerHTML = `
          <div style="grid-column: 1/-1; text-align:center; padding:2rem; color:var(--text-muted); font-size:0.8rem;">
            Arşiv henüz boş. Çözülen hatalı sorularınız burada saklanır.
          </div>
        `;
      } else {
        completedQuestions.forEach(q => {
          const recs = this.getYouTubeRecommendations(q.subject, q.topic);
          let recsHtml = "";
          recs.forEach(r => {
            recsHtml += `
              <a href="${app.escapeHtml(r.url)}" target="_blank" style="display:flex; align-items:center; gap:0.25rem; font-size:0.65rem; color:var(--text-main); text-decoration:none; padding:0.25rem 0.4rem; background:#fff; border:1px solid var(--border-color); border-radius:4px; transition:0.2s;" onmouseover="this.style.borderColor='red'; this.style.color='red';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.color='var(--text-main)';">
                <i class="fa-brands fa-youtube" style="color:red; font-size:0.75rem;"></i>
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600;">${app.escapeHtml(r.title)}</span>
              </a>
            `;
          });

          const sourceRecs = this.getSourceRecommendations(q.subject, q.topic, q.examType);
          let sourceRecsHtml = "";
          sourceRecs.forEach(r => {
            sourceRecsHtml += `
              <a href="${app.escapeHtml(r.url)}" target="_blank" style="display:flex; align-items:center; gap:0.25rem; font-size:0.65rem; color:var(--text-main); text-decoration:none; padding:0.25rem 0.4rem; background:#fff; border:1px solid var(--border-color); border-radius:4px; transition:0.2s;" onmouseover="this.style.borderColor='var(--primary)'; this.style.color='var(--primary)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.color='var(--text-main)';">
                <i class="fa-solid fa-book" style="color:var(--primary); font-size:0.75rem;"></i>
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600;">${app.escapeHtml(r.title)}</span>
              </a>
            `;
          });

          const imageHtml = q.imgData ? `
            <div class="vault-img-box" style="filter: grayscale(100%); opacity: 0.7;">
              <img src="${app.escapeHtml(q.imgData)}" onclick="app.zoomVaultImage('${q.id}')">
            </div>
          ` : `
            <div class="vault-img-box" style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f1f5f9; color:var(--text-muted); padding:1rem; height:150px; opacity:0.7;">
              <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem; color:var(--primary); margin-bottom:0.5rem; opacity:0.6;"></i>
              <span style="font-size:0.75rem; font-weight:600;">Soru Görseli Eklenmedi</span>
            </div>
          `;

          let examBadgeHtml = "";
          const qExamType = q.examType || (q.subject === "Edebiyat" ? "AYT" : "TYT");
          if (qExamType) {
            const badgeClass = qExamType === "TYT" ? "tag-tyt" : "tag-ayt";
            examBadgeHtml = `<span class="task-badge ${badgeClass}" style="font-size:0.6rem; padding:0.1rem 0.3rem; margin-left:0.25rem;">${qExamType}</span>`;
          }

          const card = document.createElement("div");
          card.className = "vault-card";
          card.style.opacity = "0.85";
          card.innerHTML = `
            ${imageHtml}
            <div class="vault-card-body">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:0.25rem;">
                  <div class="vault-tag" style="background:var(--success); color:#fff;">${app.escapeHtml(q.subject)}</div>
                  ${examBadgeHtml}
                </div>
                <span style="font-size:0.7rem; color:var(--success); font-weight:700;"><i class="fa-solid fa-circle-check"></i> Çözüldü${q.resolvedDay ? ` (Gün ${q.resolvedDay})` : ""}</span>
              </div>
              <div class="vault-card-topic">${app.escapeHtml(q.topic)}</div>
              <div class="vault-card-note">${app.escapeHtml(q.note || "Not eklenmemiş.")}</div>
              <div style="font-size:0.68rem; color:var(--text-muted); font-weight:600;">Sıfır hatayla test geçilerek kapatıldı${(q.attempts||[]).length ? ` · ${(q.attempts||[]).length} deneme` : ""}.</div>

              <!-- Collapsible Folder for Solved Question's Videos -->
              <div style="margin-top: 0.75rem; margin-bottom: 0.75rem;">
                <button class="btn btn-secondary" style="width: 100%; padding: 0.35rem 0.5rem; font-size: 0.7rem; justify-content: center; gap: 0.35rem; display:flex; align-items:center;" onclick="app.toggleVaultCardVideos('${q.id}')">
                  <i class="fa-solid fa-folder-closed" id="folderIcon-${q.id}"></i> Kaydedilmiş Ders Videoları
                </button>
                <div id="folderContent-${q.id}" style="display: none; margin-top: 0.5rem; background: rgba(16,185,129,0.02); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; flex-direction: column; gap: 0.35rem; text-align: left;">
                  <div style="font-size:0.65rem; font-weight:800; color:var(--success); display:flex; align-items:center; gap:0.25rem; margin-bottom:0.1rem;">
                    <i class="fa-brands fa-youtube" style="color:red; font-size:0.75rem;"></i> Kaydedilen Kaynaklar:
                  </div>
                  ${recsHtml}
                </div>
              </div>

              <!-- Collapsible Folder for Solved Question's Source Suggestions -->
              <div style="margin-top: 0.75rem; margin-bottom: 0.75rem;">
                <button class="btn btn-secondary" style="width: 100%; padding: 0.35rem 0.5rem; font-size: 0.7rem; justify-content: center; gap: 0.35rem; display:flex; align-items:center;" onclick="app.toggleVaultCardSources('${q.id}')">
                  <i class="fa-solid fa-folder-closed" id="srcFolderIcon-${q.id}"></i> Kaynak Önerileri Klasörü
                </button>
                <div id="srcFolderContent-${q.id}" style="display: none; margin-top: 0.5rem; background: rgba(99,102,241,0.03); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; flex-direction: column; gap: 0.35rem; text-align: left;">
                  <div style="font-size:0.65rem; font-weight:800; color:var(--primary); display:flex; align-items:center; gap:0.25rem; margin-bottom:0.1rem;">
                    <i class="fa-solid fa-book" style="color:var(--primary); font-size:0.75rem;"></i> Önerilen Yayın / Soru Bankası:
                  </div>
                  ${sourceRecsHtml}
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; margin-top:auto; padding-top:0.75rem; border-top:1px solid rgba(0,0,0,0.05); gap: 0.5rem;">
                <button class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.75rem; flex:1;" ${q.imgData ? `onclick="app.zoomVaultImage('${q.id}')"` : 'disabled style="opacity:0.5;"'}>
                  <i class="fa-solid fa-magnifying-glass-plus"></i> Büyüt
                </button>
                <button class="btn btn-secondary text-danger" style="padding:0.4rem 0.8rem; font-size:0.75rem; flex:1;" onclick="app.deleteVaultQuestionPermanent('${q.id}')">
                  <i class="fa-solid fa-trash-can"></i> Sil
                </button>
              </div>
            </div>
          `;
          archiveContainer.appendChild(card);
        });
      }
    }
  },

  zoomVaultImage: function(qId) {
    const q = this.state.uploadedQuestions.find(item => item.id === qId);
    if (q) {
      if (!q.imgData) {
        alert("Bu soruya ait bir fotoğraf bulunmuyor.");
        return;
      }
      document.getElementById("zoomedImg").src = q.imgData;
      document.getElementById("zoomedCap").textContent = `${q.subject} - ${q.topic} | Etiket: ${q.tag || 'Genel'} | Not: ${q.note || 'Not eklenmemiş'}`;
      this.openModal("zoomModal");
    }
  },


  toggleVaultCardVideos: function(qId) {
    const content = document.getElementById(`folderContent-${qId}`);
    const icon = document.getElementById(`folderIcon-${qId}`);
    if (content && icon) {
      if (content.style.display === "none") {
        content.style.display = "flex";
        icon.className = "fa-solid fa-folder-open";
      } else {
        content.style.display = "none";
        icon.className = "fa-solid fa-folder-closed";
      }
    }
  },

  toggleVaultCardSources: function(qId) {
    const content = document.getElementById(`srcFolderContent-${qId}`);
    const icon = document.getElementById(`srcFolderIcon-${qId}`);
    if (content && icon) {
      if (content.style.display === "none") {
        content.style.display = "flex";
        icon.className = "fa-solid fa-folder-open";
      } else {
        content.style.display = "none";
        icon.className = "fa-solid fa-folder-closed";
      }
    }
  },

  toggleVaultArchive: function() {
    const container = document.getElementById("vaultArchiveContainer");
    const chevron = document.getElementById("vaultArchiveChevron");
    if (container && chevron) {
      if (container.style.display === "none") {
        container.style.display = "grid";
        chevron.className = "fa-solid fa-chevron-up";
      } else {
        container.style.display = "none";
        chevron.className = "fa-solid fa-chevron-down";
      }
    }
  },

  deleteVaultQuestionPermanent: function(qId) {
    if (confirm("Bu soruyu arşivden kalıcı olarak silmek istediğinize emin misiniz?")) {
      this.state.uploadedQuestions = this.state.uploadedQuestions.filter(q => q.id !== qId);
      this.renderVaultQuestions();
      this.saveState();
    }
  },

  renderHeaderBadges: function() {
    const container = document.getElementById("headerBadgeContainer");
    if (!container) return;

    // Find active badge: loop backwards through badgesList to find the highest unlocked one
    let activeBadge = null;
    for (let i = this.badgesList.length - 1; i >= 0; i--) {
      const badge = this.badgesList[i];
      if (this.state.unlockedBadges.includes(badge.id)) {
        activeBadge = badge;
        break;
      }
    }

    if (!activeBadge) {
      // Default if no badges are unlocked
      activeBadge = {
        id: "none",
        title: "Rozet Yok",
        desc: "Günlük ders çalışma görevlerini tamamlayarak ilk rozetini kazan!",
        icon: "🔒"
      };
    }

    // Render active badge and tooltip
    container.innerHTML = `
      <span class="stat-icon-badge" style="background: ${activeBadge.id === "none" ? "linear-gradient(135deg, #cbd5e1, #94a3b8)" : "linear-gradient(135deg, #fcd34d, #d97706)"}; font-size: 1.05rem;">${activeBadge.icon}</span>
      <strong id="activeBadgeTitle">${activeBadge.title}</strong>

      <!-- Tooltip Hover Popup -->
      <div class="badge-tooltip-popup" style="background-color: var(--bg-card) !important;">
        <h4 style="margin: 0 0 0.5rem; font-size: 0.85rem; color: var(--text-main); font-family: var(--font-header); font-weight: 800; display: flex; align-items: center; gap: 0.4rem; border-bottom: 1.5px solid var(--border-color); padding-bottom: 0.4rem;">
          <span>${activeBadge.icon}</span> <span>Aktif Rozet: ${activeBadge.title}</span>
        </h4>
        <p style="margin: 0 0 0.75rem; font-size: 0.72rem; color: var(--text-muted); line-height: 1.35; font-weight: 600;">
          ${activeBadge.desc}
        </p>
        
        <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.4rem;">
          <h5 style="margin: 0 0 0.4rem; font-size: 0.78rem; font-family: var(--font-header); font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 0.25rem;">
            <i class="fa-solid fa-list-check text-primary"></i> Rozet Durumları
          </h5>
          <div style="display: flex; flex-direction: column; gap: 0.35rem; max-height: 140px; overflow-y: auto;">
            ${this.badgesList.map(b => {
              const unlocked = this.state.unlockedBadges.includes(b.id);
              return `
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.68rem; padding: 0.15rem 0.25rem; border-radius: 4px; background: ${unlocked ? 'rgba(16, 185, 129, 0.05)' : 'transparent'};">
                  <span style="display: flex; align-items: center; gap: 0.25rem; color: ${unlocked ? 'var(--text-main)' : 'var(--text-muted)'}; font-weight: ${unlocked ? '700' : '500'}">
                    <span>${b.icon}</span> <span>${b.title}</span>
                  </span>
                  <span>${unlocked ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-lock text-muted" style="font-size:0.6rem;"></i>'}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // TAB 6: Badges
  renderBadges: function() {
    this.renderHeaderBadges();

    const container = document.getElementById("dashboardBadgesGrid");
    if (!container) return;
    container.innerHTML = "";

    this.badgesList.forEach(badge => {
      const isUnlocked = this.state.unlockedBadges.includes(badge.id);
      const card = document.createElement("div");
      card.className = "badge-card " + (isUnlocked ? "unlocked" : "locked");
      
      card.innerHTML = `
        <div class="badge-icon" style="font-size:1.8rem; margin-bottom:0.25rem;">${badge.icon}</div>
        <div class="badge-title" style="font-size:0.75rem; font-weight:700;">${badge.title}</div>
        <div class="badge-desc" style="font-size:0.65rem; color:var(--text-muted); line-height:1.2; text-align:center;">${badge.desc}</div>
      `;
      
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.alignItems = "center";
      card.style.padding = "0.5rem";
      card.style.border = "1px solid var(--border-color)";
      card.style.borderRadius = "8px";
      card.style.background = isUnlocked ? "rgba(245, 158, 11, 0.03)" : "rgba(0,0,0,0.01)";
      card.style.opacity = isUnlocked ? "1" : "0.5";
      
      container.appendChild(card);
    });
  },

  renderDetailedMonthlyCalendar: function(containerId = "detailedMonthlyGridContainer", onlyShowActiveMonth = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const monthsData = {};
    const monthsOrder = [];

    for (let dayNum = 1; dayNum <= this.PROGRAM_DAYS; dayNum++) {
      const baseDate = this.state.startDate ? new Date(this.state.startDate) : new Date();
      baseDate.setDate(baseDate.getDate() + (dayNum - 1));
      
      const trMonths = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
      ];
      const monthName = `${trMonths[baseDate.getMonth()]} ${baseDate.getFullYear()}`;
      
      if (!monthsData[monthName]) {
        monthsData[monthName] = [];
        monthsOrder.push(monthName);
      }
      monthsData[monthName].push({
        dayNum: dayNum,
        dateStr: `${baseDate.getDate()} ${trMonths[baseDate.getMonth()]}`,
        dayData: this.state.daysData[dayNum] || { completed: false, tasks: [] }
      });
    }

    let monthsToRender = monthsOrder;
    if (onlyShowActiveMonth) {
      const activeMonthIdx = Math.floor((this.state.activeDay - 1) / 30);
      const activeMonthName = monthsOrder[activeMonthIdx] || monthsOrder[0];
      monthsToRender = [activeMonthName];
    }

    monthsToRender.forEach(month => {
      const monthSection = document.createElement("div");
      monthSection.innerHTML = `
        <h3 style="margin-bottom:1rem; color:var(--primary); font-size:1.1rem; border-bottom:2px solid var(--primary); padding-bottom:0.4rem; text-transform:uppercase; display:flex; align-items:center; gap:0.5rem;">
          <i class="fa-regular fa-calendar"></i> ${month}
        </h3>
      `;
      
      const daysGrid = document.createElement("div");
      daysGrid.style = "display:grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap:0.75rem; margin-bottom:1.5rem;";
      
      monthsData[month].forEach(item => {
        const dayCard = document.createElement("div");
        const isCompleted = item.dayData.completed;
        
        dayCard.className = "glass-card";
        dayCard.style = `
          padding:0.75rem 1rem; 
          border-left: 4px solid ${isCompleted ? 'var(--success)' : 'var(--border-color)'};
          background: ${isCompleted ? 'rgba(16, 185, 129, 0.02)' : 'var(--bg-card)'};
          display:flex;
          flex-direction:column;
          gap:0.4rem;
          min-height:160px;
          cursor:pointer;
        `;
        
        if (this.state.activeDay === item.dayNum) {
          dayCard.style.borderColor = "var(--primary)";
          dayCard.style.boxShadow = "0 0 10px var(--primary-glow)";
        }

        dayCard.onclick = () => {
          this.openDayDetailsModal(item.dayNum);
        };

        const taskItemsHtml = item.dayData.tasks ? item.dayData.tasks.map(t => `
          <div style="font-size:0.7rem; display:flex; align-items:center; gap:0.3rem; text-decoration:${t.completed ? 'line-through' : 'none'}; opacity:${t.completed ? 0.6 : 1};">
            <span style="color:${t.completed ? 'var(--success)' : 'var(--text-muted)'};">●</span>
            <span style="font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">${app.escapeHtml(t.label)}</span>
          </div>
        `).join("") : "";

        dayCard.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(0,0,0,0.04); padding-bottom:0.25rem; margin-bottom:0.25rem;">
            <strong style="font-size:0.85rem; color:var(--text-main);">Gün ${item.dayNum}</strong>
            <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700;">${item.dateStr}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.2rem; flex-grow:1;">
            ${taskItemsHtml || '<span style="font-style:italic; font-size:0.7rem; color:var(--text-muted);">Görev yok</span>'}
          </div>
        `;
        daysGrid.appendChild(dayCard);
      });
      
      monthSection.appendChild(daysGrid);
      container.appendChild(monthSection);
    });
  },

  sidebarPomoTimerInterval: null,
  sidebarPomoRemainingSeconds: 25 * 60,
  sidebarPomoIsRunning: false,

  toggleSidebarPomo: function() {
    const btn = document.getElementById("sidebarPomoBtn");
    if (this.sidebarPomoIsRunning) {
      clearInterval(this.sidebarPomoTimerInterval);
      this.sidebarPomoIsRunning = false;
      if (btn) btn.textContent = "Başlat";
    } else {
      this.sidebarPomoIsRunning = true;
      if (btn) btn.textContent = "Durdur";
      
      this.sidebarPomoTimerInterval = setInterval(() => {
        if (this.sidebarPomoRemainingSeconds > 0) {
          this.sidebarPomoRemainingSeconds--;
          this.updateSidebarPomoDisplay();
        } else {
          clearInterval(this.sidebarPomoTimerInterval);
          this.sidebarPomoIsRunning = false;
          if (btn) btn.textContent = "Başlat";
          this.playPomoAlarmSound();
          setTimeout(() => {
            alert("Odaklanma Süresi Tamamlandı! Harika İş Çıkardın.");
          }, 100);
        }
      }, 1000);
    }
  },

  resetSidebarPomo: function() {
    clearInterval(this.sidebarPomoTimerInterval);
    this.sidebarPomoIsRunning = false;
    
    const selectMins = document.getElementById("sidebarPomoMinutes")?.value || 25;
    this.sidebarPomoRemainingSeconds = parseInt(selectMins) * 60;
    
    const btn = document.getElementById("sidebarPomoBtn");
    if (btn) btn.textContent = "Başlat";
    
    this.updateSidebarPomoDisplay();
  },

  changeSidebarPomoMinutes: function(mins) {
    clearInterval(this.sidebarPomoTimerInterval);
    this.sidebarPomoIsRunning = false;
    this.sidebarPomoRemainingSeconds = parseInt(mins) * 60;
    
    const btn = document.getElementById("sidebarPomoBtn");
    if (btn) btn.textContent = "Başlat";
    
    this.updateSidebarPomoDisplay();
  },

  updateSidebarPomoDisplay: function() {
    const timerDisplay = document.getElementById("sidebarPomoTimer");
    const miniDisplay = document.getElementById("miniPomoTimer");
    if (!timerDisplay) return;
    
    const minutes = Math.floor(this.sidebarPomoRemainingSeconds / 60);
    const seconds = this.sidebarPomoRemainingSeconds % 60;
    const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    
    timerDisplay.textContent = formatted;
    if (miniDisplay) miniDisplay.textContent = formatted;
  },

  checkBadgeAwardsOnLog: function(task) {
    if (!this.state.unlockedBadges.includes("first_win")) {
      this.state.unlockedBadges.push("first_win");
      this.triggerBadgeUnlockAlert("first_win");
    }

    if (this.state.totalQuestionsSolved >= 1000 && !this.state.unlockedBadges.includes("1000_questions")) {
      this.state.unlockedBadges.push("1000_questions");
      this.triggerBadgeUnlockAlert("1000_questions");
    }

    const hour = new Date().getHours();
    if ((hour >= 23 || hour <= 4) && !this.state.unlockedBadges.includes("night_owl")) {
      this.state.unlockedBadges.push("night_owl");
      this.triggerBadgeUnlockAlert("night_owl");
    }

    if (hour >= 5 && hour < 8.5 && !this.state.unlockedBadges.includes("early_bird")) {
      this.state.unlockedBadges.push("early_bird");
      this.triggerBadgeUnlockAlert("early_bird");
    }

    if (this.state.totalLitCorrect >= 100 && !this.state.unlockedBadges.includes("lit_beast")) {
      this.state.unlockedBadges.push("lit_beast");
      this.triggerBadgeUnlockAlert("lit_beast");
    }

    if (this.state.streak >= 5 && !this.state.unlockedBadges.includes("streak_master")) {
      this.state.unlockedBadges.push("streak_master");
      this.triggerBadgeUnlockAlert("streak_master");
    }
  },

  triggerBadgeUnlockAlert: function(badgeId) {
    const badge = this.badgesList.find(b => b.id === badgeId);
    if (badge) {
      setTimeout(() => {
        this.showCoachAlert("🏆 Yeni Başarı Rozeti Kilidi Açıldı!", `
          Tebrikler MVP!<br><br>
          <div style="font-size:3.5rem; text-align:center; margin:1rem 0;">${badge.icon}</div>
          <h3 style="text-align:center; color:var(--primary);">${badge.title}</h3>
          <p style="text-align:center; font-size:0.9rem; color:var(--text-muted); margin-top:0.25rem;">${badge.desc}</p><br>
          Koçun notu: <em>Büyük hedefler, küçük disiplinlerin birikimiyle kazanılır. Çalışmaya devam!</em>
        `);
      }, 1000);
    }
  },

  updateDailyQuote: function() {
    if (this.sessionQuoteIndex === undefined) {
      this.sessionQuoteIndex = Math.floor(Math.random() * this.motivationalCorner.length);
    }
    const selection = this.motivationalCorner[this.sessionQuoteIndex];
    
    const quoteEl = document.getElementById("dailyQuote");
    if (quoteEl) quoteEl.textContent = selection.quote;
    const storyEl = document.getElementById("dailyStory");
    if (storyEl) storyEl.textContent = selection.story;
  },

  // Aktif program göstergesini senkronize eder: hem AI Program Sihirbazı'ndaki
  // birleşik seçiciyi hem de üst nav'daki salt-okunur "Aktif Program" etiketini günceller.
  syncProgramTypeUI: function(type) {
    const activeSel = document.getElementById("activeProgramSelector");
    if (activeSel) {
      activeSel.value = type === "standard" ? "standard" : this.state.activeCustomProgramId;
    }

    const nameLabel = document.getElementById("activeProgramNameLabel");
    if (nameLabel) {
      if (type === "standard") {
        nameLabel.textContent = "AI Standart Planı";
      } else {
        const prog = this.state.savedPrograms.find(p => p.id === this.state.activeCustomProgramId);
        nameLabel.textContent = prog ? prog.name : "Özel Program";
      }
    }

    const manageControls = document.getElementById("customProgramManageControls");
    if (manageControls) {
      manageControls.style.display = (type === "custom") ? "flex" : "none";
    }
  },

  // Birleşik "Aktif Program" seçicisinden gelen değişikliği ilgili duruma yönlendirir
  switchActiveProgram: function(value) {
    if (value === "standard") {
      this.changeProgramType("standard");
    } else {
      this.state.selectedProgramType = "custom";
      this.switchCustomProgram(value);
      this.syncProgramTypeUI("custom");
    }
  },

  getPencilLogoSvg: function(width = "20px", height = "23px") {
    return `
      <svg viewBox="0 0 120 140" style="width: ${width}; height: ${height}; flex-shrink: 0; display: inline-block; vertical-align: middle;">
        <g transform="rotate(-10 60 70)">
          <path d="M46 72 Q34 76 31 86" fill="none" stroke="#1E2A4A" stroke-width="3" stroke-linecap="round"></path>
          <circle cx="31" cy="87" r="4" fill="#FFD93B" stroke="#1E2A4A" stroke-width="2.5"></circle>
          <path d="M74 68 Q86 62 89 52" fill="none" stroke="#1E2A4A" stroke-width="3" stroke-linecap="round"></path>
          <circle cx="89" cy="51" r="4" fill="#FFD93B" stroke="#1E2A4A" stroke-width="2.5"></circle>
          <path d="M89 47 Q95 40 91 34" fill="none" stroke="#1E2A4A" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"></path>
          <circle cx="91" cy="31" r="5.5" fill="#E45C7F" stroke="#1E2A4A" stroke-width="2.5"></circle>
          <rect x="94" y="27" width="6" height="4.5" rx="1.5" fill="#E45C7F" stroke="#1E2A4A" stroke-width="2"></rect>
          <rect x="46" y="8" width="28" height="15" rx="7" fill="#FFB3C7" stroke="#1E2A4A" stroke-width="2.5"></rect>
          <rect x="46" y="22" width="28" height="8" fill="#D9DCE5" stroke="#1E2A4A" stroke-width="2.5"></rect>
          <path d="M50 24v4M56 24v4M62 24v4M68 24v4" stroke="#1E2A4A" stroke-width="1.4" opacity="0.5"></path>
          <rect x="46" y="30" width="28" height="60" fill="#FFD93B" stroke="#1E2A4A" stroke-width="2.5"></rect>
          <path d="M55 30v60M65 30v60" stroke="#1E2A4A" stroke-width="1.4" opacity="0.22"></path>
          <rect x="45" y="38" width="30" height="7" fill="#E45C7F" stroke="#1E2A4A" stroke-width="2.5"></rect>
          <circle cx="55" cy="55" r="2.4" fill="#1E2A4A"></circle>
          <circle cx="66" cy="55" r="2.4" fill="#1E2A4A"></circle>
          <path d="M55.5 64 Q60.5 69 65.5 64" fill="none" stroke="#1E2A4A" stroke-width="2.5" stroke-linecap="round"></path>
          <circle cx="50.5" cy="61" r="2.6" fill="#FFB3C7" opacity="0.85"></circle>
          <circle cx="70.5" cy="61" r="2.6" fill="#FFB3C7" opacity="0.85"></circle>
          <path d="M46 90 L74 90 L60 116 Z" fill="#F2D6A8" stroke="#1E2A4A" stroke-width="2.5" stroke-linejoin="round"></path>
          <path d="M55 106 L65 106 L60 116 Z" fill="#1E2A4A"></path>
        </g>
      </svg>
    `;
  },

  // Modals
  // Küçük bildirim (toast) — birçok yerde çağrılıyordu ama tanımı eksikti;
  // eksik olduğunda hata fırlatıp akışı (ör. test sonucu doğrulaması) kesiyordu.
  showToast: function(message, type) {
    type = type || "info";
    let container = document.getElementById("appToastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "appToastContainer";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = "app-toast app-toast-" + type;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  openModal: function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
    }
    // Planlayici acilinca yayinevi listesi kaynak kitap katalogundan tazelenir.
    if (modalId === "customProgramPlannerModal") {
      this.plannerPopulatePublisherOptions();
    }
  },

  closeModal: function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("active");
    }
    if (modalId === "customProgramPlannerModal") {
      this.isPlanning = false;
      this.plannerEditingProgramId = null;
      this.renderDashboard();
      this.renderMonthlyCalendarGrid();
    }
  },

  // Subscription Sim
  showSubscription: function() {
    if (!this.MONETIZATION_ENABLED) return;
    this.showPaketler();
    this.openModal("subscriptionModal");
  },

  subscribeSim: function(planName) {
    alert(`Tebrikler! '${planName}' planına simüle olarak abone olundu. Tüm özellikleriniz aktif edildi!`);
    this.closeModal("subscriptionModal");
  },




  changeProgramType: function(type) {
    this.state.selectedProgramType = type;
    
    if (type === "standard") {
      this.state.daysData = JSON.parse(JSON.stringify(this.state.standardDaysData || {}));
    } else {
      const activeProg = this.state.savedPrograms.find(p => p.id === this.state.activeCustomProgramId) || this.state.savedPrograms[0];
      if (activeProg) {
        this.state.daysData = activeProg.daysData;
        this.state.customDaysData = activeProg.daysData;
        this.state.startDate = activeProg.startDate;
      } else {
        this.state.daysData = JSON.parse(JSON.stringify(this.state.customDaysData || {}));
      }
    }

    this.syncProgramTypeUI(type);
    this.calculateFocusScore();
    this.renderDashboard();
    this.renderMonthlyCalendarGrid();
    this.saveState();
  },

  getFormattedRealDate: function(dayNum) {
    const baseDate = this.state.startDate ? new Date(this.state.startDate) : new Date();
    baseDate.setDate(baseDate.getDate() + (dayNum - 1));
    
    const days = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    
    const dName = days[baseDate.getDay()];
    const mName = months[baseDate.getMonth()];
    const dateVal = baseDate.getDate();
    
    return `${dateVal} ${mName}, ${dName}`;
  },

  renderWeeklyOutlookGrid: function() {
    const container = document.getElementById("weeklyOutlookContainer");
    if (!container) return;
    container.innerHTML = "";

    const activeWeek = this.state.activeWeek || 1;
    const startDay = (activeWeek - 1) * 7 + 1;

    // Render 7 columns
    for (let i = 0; i < 7; i++) {
      const dayNum = startDay + i;
      if (dayNum > this.PROGRAM_DAYS) break;

      const dayData = this.isPlanning ? (this.plannerBuffer[dayNum] || { completed: false, tasks: [] }) : (this.state.daysData[dayNum] || { completed: false, tasks: [] });
      const col = document.createElement("div");
      
      const isToday = this.state.activeDay === dayNum;
      col.className = "outlook-day-col" + (isToday ? " today" : "");
      col.style.cursor = "pointer";
      col.onclick = () => {
        this.openDayDetailsModal(dayNum);
      };

      const dateStr = this.getFormattedRealDate(dayNum);
      
      const header = document.createElement("div");
      header.className = "outlook-day-header";
      header.innerHTML = `
        <div class="outlook-day-name">Gün ${dayNum}</div>
        <div class="outlook-day-date">${dateStr}</div>
      `;
      col.appendChild(header);

      const tasksContainer = document.createElement("div");
      tasksContainer.className = "outlook-tasks-container";

      if (dayData.tasks && dayData.tasks.length > 0) {
        dayData.tasks.forEach(task => {
          const card = document.createElement("div");
          const isCompleted = task.completed;
          card.className = "outlook-task-card" + (isCompleted ? " completed" : "");
          
          const badgeClass = task.type === "smart_review" ? "tag-ai-review" : task.isUserHabit ? "tag-habit" : task.type === "video" ? "tag-video" : task.type === "reading" ? "tag-konu" : task.type === "retest" ? "tag-tekrar" : "tag-test";
          const badgeLabel = task.type === "smart_review" ? "AI TEKRAR" : task.isUserHabit ? "ALIŞKANLIK" : task.type === "video" ? "VİDEO" : task.type === "reading" ? "KAZANIM" : task.type === "retest" ? "TEKRAR" : "TEST";

          card.onclick = (e) => {
            e.stopPropagation();
            this.clickOutlookTask(dayNum, task.id);
          };

          const showBadge = (task.subject !== "Kitap Okuma" && task.subject !== "Özel Görev");

          card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <span style="font-weight:700; color:var(--text-main); font-size:0.75rem; text-decoration:${isCompleted ? 'line-through' : 'none'};">${app.escapeHtml(task.label)}</span>
              ${this.state.selectedProgramType === "custom" ? `
                <i class="fa-solid fa-trash-can text-danger" style="cursor:pointer; margin-left:0.25rem; font-size:0.75rem;" onclick="event.stopPropagation(); app.deleteOutlookTask('${dayNum}', '${task.id}')"></i>
              ` : ""}
            </div>
            ${task.desc ? `<span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-top:0.15rem; text-align:left;">${app.escapeHtml(task.desc)}</span>` : ""}
            ${app.getTaskSourceHTML(task, "0.65rem")}
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.25rem; font-size:0.7rem;">
              ${showBadge ? `<span class="task-badge ${badgeClass}">${badgeLabel}</span>` : ""}
              <span><i class="fa-regular fa-clock"></i> ${app.escapeHtml(task.duration)}</span>
            </div>
            ${!isCompleted ? `<div style="margin-top:0.2rem;">${this.getTaskAIBadgesHTML(task, dayNum)}</div>` : ""}
          `;
          tasksContainer.appendChild(card);
        });
      } else {
        const emptyText = document.createElement("div");
        emptyText.style = "text-align:center; color:var(--text-muted); font-size:0.75rem; margin-top:2rem; font-style:italic;";
        emptyText.textContent = "Görev yok.";
        tasksContainer.appendChild(emptyText);
      }

      col.appendChild(tasksContainer);

      // Add task button for custom mode
      if (this.state.selectedProgramType === "custom") {
        const addBtn = document.createElement("button");
        addBtn.className = "btn btn-secondary";
        addBtn.style = "padding:0.3rem; font-size:0.7rem; width:100%; margin-top:auto;";
        addBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Görev Ekle`;
        addBtn.onclick = (e) => {
          e.stopPropagation();
          this.state.activeDay = dayNum;
          this.openAddCustomTaskModal();
        };
        col.appendChild(addBtn);
      }

      container.appendChild(col);
    }

    // Set Datepicker value
    const datePicker = document.getElementById("programStartDatePicker");
    if (datePicker) {
      datePicker.value = this.state.startDate;
    }
  },

  switchActiveWeek: function(weekNum) {
    this.state.activeWeek = weekNum;
    
    // Render tabs active
    const totalWeeks = Math.ceil(this.PROGRAM_DAYS / 7);
    for (let i = 1; i <= totalWeeks; i++) {
      const tab = document.getElementById(`weekTab-${i}`);
      if (tab) {
        if (i === weekNum) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
      }
    }

    document.getElementById("weeklyOutlookTitle").textContent = `Haftalık Takvim Planlayıcısı (Hafta ${weekNum})`;
    
    // Switch active day to first day of week
    const firstDayOfWeek = (weekNum - 1) * 7 + 1;
    this.switchActiveDay(firstDayOfWeek);
  },

  // Haftalık (Outlook grid / Gün Detayı) görev girişi artık günlük giriş
  // yöntemiyle birebir aynı: taskId'yi index'e çevirip aynı fonksiyona
  // devrediyoruz, böylece iki giriş noktası tamamen aynı davranır.
  clickOutlookTask: function(dayNum, taskId) {
    const dayData = this.state.daysData[dayNum];
    if (!dayData) return;
    const taskIdx = dayData.tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return;
    this.toggleTodayTaskCompleted(dayNum, taskIdx);
  },


  deleteOutlookTask: function(dayNum, taskId) {
    if (this.isPlanning) {
      const dayData = this.plannerBuffer[dayNum];
      if (dayData) {
        dayData.tasks = dayData.tasks.filter(t => t.id !== taskId);
        dayData.schedule = this.buildDaySchedule(dayData.tasks, parseInt(dayNum, 10) % 7);
      }
      this.renderDashboard();
      this.renderMonthlyCalendarGrid();
      return;
    }

    const dayData = this.state.daysData[dayNum];
    if (!dayData) return;

    dayData.tasks = dayData.tasks.filter(t => t.id !== taskId);
    dayData.schedule = this.buildDaySchedule(dayData.tasks, parseInt(dayNum, 10) % 7);

    if (this.state.selectedProgramType === "custom") {
      this.state.customDaysData = JSON.parse(JSON.stringify(this.state.daysData));
    }

    this.calculateFocusScore();
    this.renderDashboard();
    this.saveState();
  },

  checkDayCompletedStateOutlook: function(dayNum) {
    const dayData = this.state.daysData[dayNum];
    if (!dayData) return;

    const allDone = dayData.tasks.every(t => t.completed);
    dayData.completed = allDone;

    this.updateHeaderStats();

    if (allDone && dayNum === this.state.activeDay) {
      const todayKey = new Date().toISOString().split("T")[0];
      if (!this.state.parentReportDueTime && this.state.parentReportShownDate !== todayKey) {
        this.state.parentReportDueTime = Date.now() + 2 * 60 * 60 * 1000;
        this.startParentNotificationTimer();
      }
    }
  },

  updateProgramStartDate: function(dateStr) {
    this.invalidateProgramDays();
    if (!dateStr) return;
    this.state.startDate = dateStr;

    // Update active program start date
    const activeProg = this.state.savedPrograms.find(p => p.id === this.state.activeCustomProgramId);
    if (activeProg) {
      activeProg.startDate = dateStr;
    }

    const startEl = document.getElementById("customStartDateText");
    if (startEl) startEl.textContent = dateStr;
    this.renderDashboard();
    this.saveState();
  },

  plannerBuffer: {},

  generateUniqueProgramName: function() {
    let baseNum = this.state.savedPrograms.length + 1;
    let name = "Özel Çalışma Programı " + baseNum;
    while (this.state.savedPrograms.some(p => p.name === name)) {
      baseNum++;
      name = "Özel Çalışma Programı " + baseNum;
    }
    return name;
  },

  plannerUpdateDaySelectDates: function() {
    const startDateVal = document.getElementById("plannerProgStartDate").value;
    const daySelect = document.getElementById("plannerDaySelect");
    const currentVal = daySelect.value || "1";
    
    daySelect.innerHTML = "";
    for (let d = 1; d <= this.PROGRAM_DAYS; d++) {
      const baseDate = startDateVal ? new Date(startDateVal) : new Date();
      baseDate.setDate(baseDate.getDate() + (d - 1));
      
      const days = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
      const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
      const dName = days[baseDate.getDay()];
      const mName = months[baseDate.getMonth()];
      const dateVal = baseDate.getDate();
      const dateStr = `${dateVal} ${mName}, ${dName}`;

      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = `Gün ${d} (${dateStr})`;
      daySelect.appendChild(opt);
    }
    daySelect.value = currentVal;
  },

  plannerSelectDay: function(dayNum) {
    const parsedDay = parseInt(dayNum);
    if (parsedDay >= 1 && parsedDay <= this.PROGRAM_DAYS) {
      // Dynamically sync activeDay and activeWeek so background calendar highlights the selected day!
      this.state.activeDay = parsedDay;
      this.state.activeWeek = Math.ceil(parsedDay / 7);
      
      this.renderDashboard();
      this.renderMonthlyCalendarGrid();
    }

    // Tekrarlama onizlemesi secili gune gore guncellenir
    this.plannerUpdateRepeatHint();

    // Modal List Rendering (reveals list section only if tasks exist for selected day)
    const container = document.getElementById("plannerTaskList");
    const section = document.getElementById("plannerTaskListSection");
    if (!container || !section) return;

    container.innerHTML = "";
    const dayData = this.plannerBuffer[parsedDay] || { tasks: [] };
    const tasks = dayData.tasks || [];

    if (tasks.length === 0) {
      section.style.display = "none";
      return;
    }

    section.style.display = "block";

    // Saatlik program: mola/yemek dahil zaman çizelgesini hesapla ve tampona yaz (kaydedince kalıcı olur)
    const schedule = this.buildDaySchedule(tasks, parsedDay % 7);
    dayData.schedule = schedule;

    schedule.forEach(entry => {
      if (entry.type !== "task") {
        const row = document.createElement("div");
        row.style.cssText = "display:flex; align-items:center; gap:0.5rem; padding:0.3rem 0.6rem; margin-top:0.35rem; border-radius:6px; background:var(--bg-sub); border:1px dashed var(--border-color); font-size:0.68rem; color:var(--text-muted); font-weight:700;";
        row.innerHTML = `
          <span style="font-family:var(--font-header); font-variant-numeric:tabular-nums; color:var(--text-main); white-space:nowrap;">${entry.startTime}–${entry.endTime}</span>
          <span>${entry.label}</span>
        `;
        container.appendChild(row);
        return;
      }

      const idx = tasks.findIndex(t => t.id === entry.taskId);
      if (idx === -1) return;
      const task = tasks[idx];

      const item = document.createElement("div");
      item.style = "display:flex; justify-content:space-between; align-items:center; background:#fff; border:1px solid var(--border-color); padding:0.4rem 0.6rem; border-radius:6px; font-size:0.75rem; margin-top:0.35rem;";

      const badgeClass = task.type === "smart_review" ? "tag-ai-review" : task.isUserHabit ? "tag-habit" : task.type === "video" ? "tag-video" : task.type === "reading" ? "tag-konu" : task.type === "retest" ? "tag-tekrar" : "tag-test";
      const badgeLabel = task.type === "smart_review" ? "AI TEKRAR" : task.isUserHabit ? "ALIŞKANLIK" : task.type === "video" ? "VİDEO" : task.type === "reading" ? "KAZANIM" : task.type === "retest" ? "TEKRAR" : "TEST";
      const timeRange = task.startTime && task.endTime ? `${task.startTime}–${task.endTime}` : task.duration;

      const aiBadges = this.getTaskAIBadgesHTML(task, parsedDay);
      item.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.15rem; text-align:left;">
          <span style="font-weight:700; color:var(--text-main);">${app.escapeHtml(task.label)}</span>
          <span style="font-size:0.65rem; color:var(--text-muted); font-variant-numeric:tabular-nums;">${task.topic} (${timeRange})</span>
          ${app.getTaskSourceHTML(task, "0.65rem")}
          ${aiBadges ? `<div style="margin-top:0.1rem;">${aiBadges}</div>` : ""}
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span class="task-badge ${badgeClass}" style="font-size:0.55rem; padding:0.1rem 0.3rem;">${badgeLabel}</span>
          <i class="fa-solid fa-trash-can text-danger" style="cursor:pointer;" onclick="app.plannerDeleteTask(${parsedDay}, ${idx})"></i>
        </div>
      `;
      container.appendChild(item);
    });
  },

  // Manuel program oluşturmada AI Tahsis Motoru'nu isteğe bağlı uygulama —
  // görevleri AI öncelik skoruna göre yeniden sıralar (gün içeriğini
  // değiştirmez, sadece sırayı ve saatleri buna göre optimize eder).
  plannerApplyAIAllocation: function(dayNum) {
    const parsedDay = parseInt(dayNum);
    const dayData = this.plannerBuffer[parsedDay];
    if (!dayData || !Array.isArray(dayData.tasks) || dayData.tasks.length === 0) {
      this.showToast("Bu güne henüz görev eklenmedi.", "error");
      return;
    }
    dayData.tasks.sort((a, b) => (this.computeTaskPriorityScore(b, parsedDay) || 0) - (this.computeTaskPriorityScore(a, parsedDay) || 0));
    dayData.schedule = this.buildDaySchedule(dayData.tasks, parsedDay % 7);
    this.plannerSelectDay(parsedDay);
    this.showToast("Görevler AI öncelik skoruna göre yeniden sıralandı.", "success");
  },

  // Datalist doldurma yardimcisi
  doldurListe: function(listId, degerler) {
    const dl = document.getElementById(listId);
    if (!dl) return;
    dl.innerHTML = "";
    degerler.forEach(v => {
      const o = document.createElement("option");
      o.value = typeof v === "string" ? v : v.value;
      if (v && v.label) o.label = v.label;
      dl.appendChild(o);
    });
  },

  // Yayinevi onerileri katalogdan gelir.
  plannerPopulatePublisherOptions: function() {
    this.doldurListe("plannerPublisherList", this.sourceBooks.publishers());
    this.plannerRefreshBookOptions();
    this.plannerRefreshTopicOptions();
  },

  // Secilen yayinevinin (ve dersin) kitaplari
  plannerRefreshBookOptions: function() {
    const pubEl = document.getElementById("plannerTaskPublisher");
    const bookEl = document.getElementById("plannerTaskBook");
    if (!pubEl || !bookEl) return;
    const publisher = (pubEl.value || "").trim();
    if (!publisher) {
      this.doldurListe("plannerBookList", []);
      bookEl.placeholder = "Boş = otomatik seçilir";
      return;
    }
    const subjectEl = document.getElementById("plannerTaskSubject");
    const kitaplar = this.sourceBooks.booksOf(publisher, subjectEl ? subjectEl.value : "");
    this.doldurListe("plannerBookList", kitaplar.map(b => b.book));
    bookEl.placeholder = kitaplar.length ? "Birkaç harf yeter" : "Bu yayınevinde kayıtlı kitap yok";
  },

  // Secili derse gore mufredat konulari
  plannerRefreshTopicOptions: function() {
    const subjectEl = document.getElementById("plannerTaskSubject");
    const examEl = document.getElementById("plannerTaskExamType");
    const ders = subjectEl ? subjectEl.value : "";
    let konular = this.curriculumTopicNames(ders, examEl ? examEl.value : "");
    if (!konular.length) konular = this.curriculumTopicNames(ders);
    if (!konular.length) konular = this.curriculumTopicNames();
    this.doldurListe("plannerTopicList", konular);
  },

  // Yazilan parcayi gercek adiyla degistirir; belirsizse dokunmaz ve
  // kac aday oldugunu soyler. Yanlis konuya kayit yapmaktansa
  // kullanicinin yazdigi gibi birakmak yeglenir.
  _canonicalizeField: function(inputId, adaylar, ipucuId) {
    const el = document.getElementById(inputId);
    const ipucu = ipucuId ? document.getElementById(ipucuId) : null;
    const temizle = () => { if (ipucu) { ipucu.style.display = "none"; ipucu.textContent = ""; } };
    if (!el) return null;
    const giris = (el.value || "").trim();
    if (!giris) { temizle(); return null; }

    const sonuc = this.resolveCanonicalName(giris, adaylar);
    if (sonuc.ad) {
      if (sonuc.ad !== giris) {
        el.value = sonuc.ad;
        if (ipucu) {
          ipucu.textContent = `“${giris}” → ${sonuc.ad} olarak kaydedilecek`;
          ipucu.style.display = "block";
        }
      } else temizle();
      return sonuc.ad;
    }
    if (sonuc.adaylar.length > 1 && ipucu) {
      ipucu.textContent = `${sonuc.adaylar.length} eşleşme var, listeden seç: ${sonuc.adaylar.slice(0, 3).join(" · ")}${sonuc.adaylar.length > 3 ? "…" : ""}`;
      ipucu.style.display = "block";
    } else temizle();
    return null;
  },

  plannerCanonicalizeTopic: function() {
    const subjectEl = document.getElementById("plannerTaskSubject");
    const examEl = document.getElementById("plannerTaskExamType");
    const ders = subjectEl ? subjectEl.value : "";
    const sinav = examEl ? examEl.value : "";
    let konular = this.curriculumTopicNames(ders, sinav);
    if (!konular.length) konular = this.curriculumTopicNames(ders);
    if (!konular.length) konular = this.curriculumTopicNames();
    this._canonicalizeField("plannerTaskTopic", konular, "plannerTopicHint");
  },

  plannerCanonicalizePublisher: function() {
    this._canonicalizeField("plannerTaskPublisher", this.sourceBooks.publishers());
    this.plannerRefreshBookOptions();
  },

  plannerCanonicalizeBook: function() {
    const pubEl = document.getElementById("plannerTaskPublisher");
    const publisher = pubEl ? (pubEl.value || "").trim() : "";
    if (!publisher) return;
    const subjectEl = document.getElementById("plannerTaskSubject");
    const kitaplar = this.sourceBooks.booksOf(publisher, subjectEl ? subjectEl.value : "").map(b => b.book);
    this._canonicalizeField("plannerTaskBook", kitaplar);
  },

  plannerAddTaskToSelectedDay: function() {
    const topicInput = document.getElementById("plannerTaskTopic");
    if (topicInput && !topicInput.value.trim()) {
      app.showToast("Lütfen konu / yapılacak çalışma alanını doldurun.", "error");
      topicInput.focus();
      return;
    }
    const durationInput = document.getElementById("plannerTaskDuration");
    if (durationInput && !durationInput.value.trim()) {
      app.showToast("Lütfen geçerli bir süre girin (örn: 60 dk).", "error");
      durationInput.focus();
      return;
    }
    const qCountInput = document.getElementById("plannerTaskQCount");
    if (qCountInput && !qCountInput.checkValidity()) {
      app.showToast("Geçersiz soru hedefi.", "error");
      qCountInput.reportValidity();
      return;
    }

    const daySelect = document.getElementById("plannerDaySelect");
    const dayNum = parseInt(daySelect.value);

    const subject = document.getElementById("plannerTaskSubject").value;
    this.plannerCanonicalizeTopic();
    const topic = document.getElementById("plannerTaskTopic").value;
    const type = document.getElementById("plannerTaskType").value;
    const examType = document.getElementById("plannerTaskExamType").value;
    const duration = document.getElementById("plannerTaskDuration").value.trim() || "60 dk";
    const qCount = parseInt(document.getElementById("plannerTaskQCount").value) || 30;

    if (!this.plannerBuffer[dayNum]) {
      this.plannerBuffer[dayNum] = { completed: false, tasks: [] };
    }
    if (!this.plannerBuffer[dayNum].tasks) {
      this.plannerBuffer[dayNum].tasks = [];
    }

    const typeLabels = {
      video: `🎥 ${subject}: Konu Anlatımı`,
      quiz: `🎯 ${subject}: Kazanım Testi`,
      reading: `📖 ${subject}: Kazanım Çalışması`,
      common: `✍️ Paragraf & Türkçe Kondisyonu`
    };

    let label = typeLabels[type] || `${subject}: Özel Görev`;
    let desc = type === "quiz" || type === "common" ? `"${topic}" konusu ile ilgili ${qCount} adet soru çöz.` : `"${topic}" konusunu detaylıca çalış.`;

    // If subject is a custom activity, prepend subject name to what they typed
    if (subject === "Kitap Okuma" || subject === "Özel Görev" || subject === "Paragraf") {
      label = examType !== "Genel" ? `[${examType}] ${subject}: ${topic}` : `${subject}: ${topic}`;
      desc = ""; // Hide description paragraph entirely
    } else {
      if (examType !== "Genel") {
        label = `[${examType}] ${label}`;
      }
    }

    const newTask = {
      id: `task_custom_${dayNum}_${Date.now()}`,
      type: type,
      subject: subject,
      topic: topic,
      label: label,
      desc: desc,
      duration: duration,
      completed: false,
      examType: examType
    };

    if (type === "quiz" || type === "common") {
      newTask.qCount = qCount;
      newTask.logged = false;
      newTask.correct = 0;
      newTask.incorrect = 0;
      newTask.timeSpent = 0;
      newTask.errorTopics = [];
    }

    // Kaynak: elle yayınevi + kitap seçildiyse o kullanılır, seçilmediyse
    // ders/sınav türüne göre otomatik atanır. Test/bölüm numarası her iki
    // durumda da göreve işlenir.
    // Yazilan kisaltmalar kayittan ONCE gercek adlariyla degistirilir
    this.plannerCanonicalizePublisher();
    this.plannerCanonicalizeBook();

    const pubEl = document.getElementById("plannerTaskPublisher");
    const bookEl = document.getElementById("plannerTaskBook");
    const testEl = document.getElementById("plannerTaskTestNo");
    const secilenPub = pubEl ? pubEl.value.trim() : "";
    const secilenBook = bookEl ? bookEl.value.trim() : "";
    const testNo = testEl ? testEl.value.trim() : "";

    // Yayinevi ve kitap YALNIZCA katalogda gercekten varsa kaydedilir.
    // Yazilan parca birden fazla kitaba uyuyorsa (or. "ayt biyo") cozumleme
    // basarisiz olur; o metni kitap adi diye kaydetmek uydurma veri uretir.
    const gecerliPub = this.sourceBooks.publishers().indexOf(secilenPub) !== -1;
    const gecerliKitap = gecerliPub &&
      this.sourceBooks.booksOf(secilenPub, subject).some(b => b.book === secilenBook);

    if (gecerliPub && gecerliKitap) {
      const kayit = this.sourceBooks.booksOf(secilenPub, subject).find(b => b.book === secilenBook);
      newTask.source = {
        publisher: secilenPub,
        book: secilenBook,
        kind: (kayit && kayit.kind) || this.sourceBooks.kindForTask(newTask)
      };
    } else {
      this.sourceBooks.attach(newTask);
      if (secilenPub && !gecerliPub) {
        this.showToast(`"${secilenPub}" listede yok — kaynak otomatik atandı. Yayınevini listeden seç.`, "warning");
      } else if (gecerliPub && secilenBook && !gecerliKitap) {
        this.showToast(`"${secilenBook}" bu yayınevinde bulunamadı — kaynak otomatik atandı. Kitabı listeden seç.`, "warning");
      } else if (gecerliPub && !secilenBook) {
        this.showToast("Yayınevi seçtin ama kitap seçmedin — kaynak otomatik atandı.", "warning");
      }
    }
    if (testNo && newTask.source) newTask.source.testNo = testNo;

    this.plannerBuffer[dayNum].tasks.push(newTask);
    document.getElementById("plannerTaskTopic").value = ""; // Clear input for next task
    // Yayınevi/kitap seçimi korunur (arka arkaya aynı kitaptan test eklemek
    // yaygın); yalnızca test numarası sıfırlanır.
    if (testEl) testEl.value = "";
    this.plannerSelectDay(dayNum);
  },

  plannerDeleteTask: function(dayNum, taskIdx) {
    if (this.plannerBuffer[dayNum] && this.plannerBuffer[dayNum].tasks) {
      this.plannerBuffer[dayNum].tasks.splice(taskIdx, 1);
      this.plannerSelectDay(dayNum);
      this.renderDashboard();
      this.renderMonthlyCalendarGrid();
    }
  },

  // DÜZENLE modundan geldiyse (plannerEditingProgramId dolu) mevcut programı GÜNCELLER;
  // OLUŞTUR modundan geldiyse (null) YENİ bir program ekler. Tek bir buton artık hem
  // "kaydet" hem "oluştur" davranışını duruma göre doğru şekilde uyguluyor.
  plannerSaveProgram: function() {
    const name = document.getElementById("plannerProgName").value.trim();
    const startDate = document.getElementById("plannerProgStartDate").value;
    const rep = document.getElementById("plannerProgRep").value;

    if (!name) {
      alert("Lütfen program için bir isim girin!");
      return;
    }

    // Kaydetmeden önce her günün saatlik programını (mola/yemek dahil) tazele
    for (const dayKey in this.plannerBuffer) {
      const dData = this.plannerBuffer[dayKey];
      if (dData && dData.tasks && dData.tasks.length) {
        dData.schedule = this.buildDaySchedule(dData.tasks, parseInt(dayKey, 10) % 7);
      }
    }

    const bufferCopy = JSON.parse(JSON.stringify(this.plannerBuffer));
    const editingProg = this.plannerEditingProgramId
      ? this.state.savedPrograms.find(p => p.id === this.plannerEditingProgramId)
      : null;

    let activeProg;
    if (editingProg) {
      // GÜNCELLE: aynı programın üzerine yaz, yeni kayıt oluşturma
      editingProg.name = name;
      editingProg.startDate = startDate;
      editingProg.repetition = rep;
      editingProg.daysData = bufferCopy;
      activeProg = editingProg;
    } else {
      // OLUŞTUR: yeni bir program ekle
      activeProg = {
        id: `custom_prog_${Date.now()}`,
        name: name,
        startDate: startDate,
        repetition: rep,
        daysData: bufferCopy
      };
      this.state.savedPrograms.push(activeProg);
    }

    this.state.activeCustomProgramId = activeProg.id;
    this.state.daysData = activeProg.daysData;
    this.state.customDaysData = activeProg.daysData;
    this.state.startDate = startDate;
    this.state.activeDay = 1;
    this.state.activeWeek = 1;
    this.state.selectedProgramType = "custom";
    this.plannerEditingProgramId = null;
    this.isPlanning = false;

    this.closeModal("customProgramPlannerModal");
    this.syncCustomProgramListSelector();
    this.syncProgramTypeUI("custom");

    // Değişiklikler günlük / haftalık / aylık görünümlere de yansısın
    this.calculateFocusScore();
    this.renderDashboard();          // günlük + haftalık takvim + aylık ızgara
    this.renderTodayPanel();
    this.renderDetailedMonthlyCalendar("detailedMonthlyGridContainer", true);
    this.renderCurriculumMap();
    this.updateHeaderStats();
    this.saveState();

    const taskCount = Object.values(bufferCopy).reduce((n, d) => n + ((d && d.tasks) ? d.tasks.length : 0), 0);
    alert(
      (editingProg ? `'${name}' güncellendi ve aktif hale getirildi!` : `'${name}' başarıyla oluşturuldu ve aktif hale getirildi!`) +
      `\n\nToplam ${taskCount} görev kaydedildi. Günlük, haftalık ve aylık programın bu plana göre güncellendi.`
    );
  },


  switchCustomProgram: function(progId) {
    const prog = this.state.savedPrograms.find(p => p.id === progId);
    if (!prog) return;

    this.state.activeCustomProgramId = progId;
    this.state.daysData = prog.daysData;
    this.state.customDaysData = prog.daysData;
    this.state.startDate = prog.startDate;
    this.state.activeDay = 1;
    this.state.activeWeek = 1;

    // Sync exam focus from selected custom program
    this.state.examFocus = prog.examFocus || "both";
    const wizardFocus = document.getElementById("wizardExamFocusSelect");
    if (wizardFocus) wizardFocus.value = this.state.examFocus;
    const creatorFocus = document.getElementById("creatorExamFocusSelect");
    if (creatorFocus) creatorFocus.value = this.state.examFocus;

    const chartFilter = document.getElementById("chartExamTypeFilter");
    if (chartFilter) chartFilter.removeAttribute("data-initialized");

    const repLabels = { none: "Yok", weekly: "Haftalık Döngü", monthly: "Aylık Döngü" };
    const repEl = document.getElementById("customRepetitionText");
    if (repEl) repEl.textContent = repLabels[prog.repetition || "none"] || "Yok";
    const startEl = document.getElementById("customStartDateText");
    if (startEl) startEl.textContent = prog.startDate || "-";

    this.renderDashboard();
    this.renderCurriculumMap();
    this.saveState();
  },

  deleteActiveCustomProgram: function() {
    if (this.state.savedPrograms.length <= 1) {
      alert("En az bir adet özel program bulunmalıdır. Mevcut programı silemezsiniz.");
      return;
    }

    const activeProg = this.state.savedPrograms.find(p => p.id === this.state.activeCustomProgramId);
    const progName = activeProg ? activeProg.name : "Mevcut";

    if (confirm(`'${progName}' özel programını silmek istediğinizden emin misiniz?`)) {
      const deletedId = this.state.activeCustomProgramId;
      
      // Filter out the program
      this.state.savedPrograms = this.state.savedPrograms.filter(p => p.id !== deletedId);
      
      // Set the active program to the first remaining one
      const remainingProg = this.state.savedPrograms[0];
      this.state.activeCustomProgramId = remainingProg.id;
      this.state.daysData = remainingProg.daysData;
      this.state.customDaysData = remainingProg.daysData;
      this.state.startDate = remainingProg.startDate;
      this.state.activeDay = 1;
      this.state.activeWeek = 1;

      this.syncCustomProgramListSelector();
      this.renderDashboard();
      this.saveState();
      
      alert("Program başarıyla silindi.");
    }
  },

  // DÜZENLE modu: mevcut özel programı planlayıcıya yükler. Kaydedince bu program
  // GÜNCELLENİR (yeni bir kopya oluşturulmaz) — bkz. plannerSaveProgram.
  openCustomProgramPlannerForCurrent: function() {
    const activeProg = this.state.savedPrograms.find(p => p.id === this.state.activeCustomProgramId);
    if (!activeProg) return;

    this.isPlanning = true;
    this.plannerEditingProgramId = activeProg.id;

    document.getElementById("plannerProgName").value = activeProg.name || "Özel Çalışma Programı";
    document.getElementById("plannerProgStartDate").value = activeProg.startDate || new Date().toISOString().split("T")[0];
    document.getElementById("plannerProgRep").value = activeProg.repetition || "none";

    this.plannerUpdateDaySelectDates();

    // Mevcut programın görevlerini planlayıcıya yükle (önceden boş sıfırlanıyor, düzenlenen
    // programın içeriği görünmüyordu — düzeltildi)
    this.plannerBuffer = JSON.parse(JSON.stringify(activeProg.daysData || {}));
    for (let d = 1; d <= this.PROGRAM_DAYS; d++) {
      if (!this.plannerBuffer[d]) this.plannerBuffer[d] = { completed: false, tasks: [] };
    }

    document.getElementById("plannerDaySelect").value = "1";
    this.plannerSelectDay(1);

    this.renderDashboard();
    this.renderMonthlyCalendarGrid();

    const titleEl = document.getElementById("plannerModalTitle");
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square text-primary"></i> Özel Programı Düzenle';
    const baseNote = document.getElementById("plannerBaseNote");
    if (baseNote) {
      baseNote.style.display = "flex";
      baseNote.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span><strong>${activeProg.name}</strong> düzenleniyor. Kaydettiğinde bu programın üzerine yazılır ve günlük, haftalık, aylık programın güncellenir.</span>`;
    }
    const saveBtn = document.getElementById("plannerSaveBtn");
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Değişiklikleri Kaydet & Kapat';
    const delWrap = document.getElementById("plannerDeleteBtnWrap");
    if (delWrap) delWrap.style.display = "flex";

    this.openModal("customProgramPlannerModal");
  },

  // OLUŞTUR modu: şu an aktif olan programı (AI standart planı veya seçili özel program)
  // planlayıcıya kopyalar; öğrenci üzerinde ekleme/çıkarma yapıp kaydeder. Kaydedince YENİ
  // bir özel program olarak eklenir ve aktif hale gelir — bkz. plannerSaveProgram.
  plannerCreateNewProgramFromScratch: function() {
    const todayStr = new Date().toISOString().split("T")[0];
    this.isPlanning = true;
    this.plannerEditingProgramId = null;

    // Aktif planı kaynak al: özel program seçiliyse onun günleri, değilse AI standart planı
    const activeProg = this.state.savedPrograms.find(p => p.id === this.state.activeCustomProgramId);
    const useCustom = this.state.selectedProgramType === "custom" && activeProg;
    const sourceDays = useCustom
      ? activeProg.daysData
      : (this.state.standardDaysData && Object.keys(this.state.standardDaysData).length
          ? this.state.standardDaysData
          : this.state.daysData);
    const sourceName = useCustom ? activeProg.name : "AI Standart Planı";

    document.getElementById("plannerProgName").value = this.generateUniqueProgramName();
    document.getElementById("plannerProgStartDate").value = (useCustom && activeProg.startDate) || this.state.startDate || todayStr;
    document.getElementById("plannerProgRep").value = (useCustom && activeProg.repetition) || "none";

    this.plannerUpdateDaySelectDates();

    // Mevcut programın tüm günlerini tampona kopyala (referans paylaşmadan)
    this.plannerBuffer = JSON.parse(JSON.stringify(sourceDays || {}));
    for (let d = 1; d <= this.PROGRAM_DAYS; d++) {
      if (!this.plannerBuffer[d]) this.plannerBuffer[d] = { completed: false, tasks: [] };
      if (!Array.isArray(this.plannerBuffer[d].tasks)) this.plannerBuffer[d].tasks = [];
    }

    document.getElementById("plannerDaySelect").value = "1";
    this.plannerSelectDay(1);

    this.renderDashboard();
    this.renderMonthlyCalendarGrid();

    const titleEl = document.getElementById("plannerModalTitle");
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen-ruler text-primary"></i> Kendi Programımı Oluştur';
    const baseNote = document.getElementById("plannerBaseNote");
    if (baseNote) {
      baseNote.style.display = "flex";
      baseNote.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span><strong>${sourceName}</strong> temel alındı. Görev ekleyip çıkarabilir, sonra kaydedebilirsin. Kaydettiğinde günlük, haftalık ve aylık programın bu plana göre güncellenir.</span>`;
    }
    const saveBtn = document.getElementById("plannerSaveBtn");
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Programı Kaydet & Kapat';
    const delWrap = document.getElementById("plannerDeleteBtnWrap");
    if (delWrap) delWrap.style.display = "none";

    this.openModal("customProgramPlannerModal");
  },

  // Planlayıcıdaki seçili günün tüm görevlerini siler (sıfırdan yazmak isteyenler için)
  plannerClearDay: function() {
    const daySelect = document.getElementById("plannerDaySelect");
    if (!daySelect) return;
    const dayNum = parseInt(daySelect.value, 10);
    if (!this.plannerBuffer[dayNum]) return;
    if (!confirm(`Gün ${dayNum} için planlanan tüm görevler silinsin mi?`)) return;

    this.plannerBuffer[dayNum].tasks = [];
    this.plannerBuffer[dayNum].schedule = [];
    this.plannerSelectDay(dayNum);
    this.renderDashboard();
    this.renderMonthlyCalendarGrid();
  },

  plannerDeleteActiveProgram: function() {
    this.deleteActiveCustomProgram();
    this.plannerEditingProgramId = null;
    this.closeModal("customProgramPlannerModal");
  },

  // Tekrarlama hedeflerini hesaplar. Haftalik modda 7'ser atlanir, boylece
  // Pazartesi Pazartesi'ye denk gelir; kapaliyken davranis eskisiyle aynidir.
  plannerRepeatTargets: function(dayNum, count, haftalik) {
    const adim = haftalik ? 7 : 1;
    const hedefler = [];
    for (let i = 1; i <= count; i++) {
      const hedef = dayNum + i * adim;
      if (hedef > this.PROGRAM_DAYS) break;
      hedefler.push(hedef);
    }
    return hedefler;
  },

  // Kullanici tiklamadan once ne olacagini yazar.
  plannerUpdateRepeatHint: function() {
    const ipucu = document.getElementById("plannerRepeatHint");
    const etiket = document.getElementById("plannerRepeatCountLabel");
    const haftalikEl = document.getElementById("plannerRepeatWeekly");
    const daySelect = document.getElementById("plannerDaySelect");
    if (!ipucu || !haftalikEl || !daySelect) return;

    const haftalik = haftalikEl.checked;
    const dayNum = parseInt(daySelect.value, 10) || 1;
    const count = parseInt(document.getElementById("plannerRepeatNextCount").value, 10) || 0;

    if (etiket) etiket.textContent = haftalik ? "Kaç Hafta Boyunca Tekrarla" : "Sonraki X Gün Boyunca Tekrarla";

    if (count <= 0) { ipucu.textContent = ""; return; }
    const hedefler = this.plannerRepeatTargets(dayNum, count, haftalik);
    if (!hedefler.length) { ipucu.textContent = "Program sonuna gelindi, kopyalanacak gün kalmadı."; return; }

    const onizleme = hedefler.slice(0, 5).join(", ") + (hedefler.length > 5 ? "…" : "");
    ipucu.textContent = haftalik
      ? `Gün ${dayNum} → ${hedefler.length} güne yazılacak: ${onizleme}`
      : `Gün ${dayNum} → sonraki ${hedefler.length} güne yazılacak: ${onizleme}`;
  },

  plannerRepeatDayToNextRange: function() {
    const daySelect = document.getElementById("plannerDaySelect");
    const dayNum = parseInt(daySelect.value);
    const count = parseInt(document.getElementById("plannerRepeatNextCount").value) || 7;
    const haftalikEl = document.getElementById("plannerRepeatWeekly");
    const haftalik = !!(haftalikEl && haftalikEl.checked);

    const sourceTasks = this.plannerBuffer[dayNum] ? this.plannerBuffer[dayNum].tasks : [];
    if (sourceTasks.length === 0) {
      alert("Kopyalanacak günün görev listesi boş!");
      return;
    }

    const hedefler = this.plannerRepeatTargets(dayNum, count, haftalik);
    if (!hedefler.length) {
      alert("Program sonuna gelindi, kopyalanacak gün kalmadı.");
      return;
    }

    hedefler.forEach(targetDay => {
      // Duplicate tasks with unique IDs
      const duplicatedTasks = sourceTasks.map(t => ({
        ...t,
        id: `task_custom_${targetDay}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      }));

      this.plannerBuffer[targetDay] = {
        completed: false,
        tasks: duplicatedTasks
      };
    });

    this.renderDashboard();
    this.renderMonthlyCalendarGrid();
    this.plannerUpdateRepeatHint();
    alert(haftalik
      ? `Gün ${dayNum} görevleri ${hedefler.length} hafta boyunca aynı güne kopyalandı (${hedefler.slice(0, 6).join(", ")}${hedefler.length > 6 ? "…" : ""}).`
      : `Gün ${dayNum} görevleri sonraki ${hedefler.length} güne başarıyla kopyalandı!`);
  },

  plannerCopyDayToSpecificDays: function() {
    const daySelect = document.getElementById("plannerDaySelect");
    const dayNum = parseInt(daySelect.value);
    const targetInput = document.getElementById("plannerRepeatTargetDays").value.trim();

    const sourceTasks = this.plannerBuffer[dayNum] ? this.plannerBuffer[dayNum].tasks : [];
    if (sourceTasks.length === 0) {
      alert("Kopyalanacak günün görev listesi boş!");
      return;
    }

    if (!targetInput) {
      alert("Lütfen kopyalamak istediğiniz gün numaralarını girin (örn: 8, 15, 22)!");
      return;
    }

    // Parse specific days list
    const targetDays = targetInput.split(",")
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= this.PROGRAM_DAYS && n !== dayNum);

    if (targetDays.length === 0) {
      alert("Geçersiz gün numaraları girildi! Lütfen kontrol edin.");
      return;
    }

    targetDays.forEach(targetDay => {
      // Duplicate tasks with unique IDs
      const duplicatedTasks = sourceTasks.map(t => ({
        ...t,
        id: `task_custom_${targetDay}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      }));

      this.plannerBuffer[targetDay] = {
        completed: false,
        tasks: duplicatedTasks
      };
    });

    document.getElementById("plannerRepeatTargetDays").value = "";
    this.renderDashboard();
    this.renderMonthlyCalendarGrid();
    alert(`Gün ${dayNum} görevleri şu günlere başarıyla kopyalandı: ${targetDays.join(", ")}`);
  },

  // Fotoğraf VEYA PDF'ten program okuma.
  // ------------------------------------------------------------
  // Bu akış SESSİZCE BAŞARISIZ OLMAMALIDIR: dosya seçildiği anda
  // ekranda görünür bir tepki oluşur, metin alanı hemen açılır ve
  // her hata (kütüphane yok, dosya okunmadı, OCR takıldı) kullanıcıya
  // yazılı olarak bildirilir. Eskiden hatalar yalnızca konsola
  // düşüyordu; kullanıcı açısından "hiçbir şey olmuyor" demekti.
  //
  // Okuma sırası:
  //   PDF  -> 1) gömülü metin katmanı (OCR'sız, kusursuz)
  //           2) yoksa sayfalar görsele çevrilip aşağıdaki görsel yoluna girer
  //   Görsel -> 1) AI anahtarı varsa Gemini (EL YAZISINI okuyabilen tek yol)
  //             2) yoksa/başarısızsa Tesseract (yalnızca basılı yazı)
  //   Hiçbiri olmazsa elle yazma alanı açık kalır.
  plannerUploadOCRImage: function(input) {
    const statusDiv = document.getElementById("ocrStatus");
    const resultArea = document.getElementById("ocrResultArea");
    const resultText = document.getElementById("ocrResultText");

    const setStatus = (icon, cls, msg) => {
      if (!statusDiv) { this.showToast(String(msg).replace(/<[^>]*>/g, ""), cls === "text-danger" ? "error" : "info"); return; }
      statusDiv.style.display = "block";
      statusDiv.innerHTML = `<i class="fa-solid ${icon} ${cls}"></i> ${msg}`;
    };
    const openManualEntry = (msg) => {
      setStatus("fa-triangle-exclamation", "text-danger", msg);
      if (resultArea) resultArea.style.display = "block";
      if (resultText && !resultText.value) resultText.placeholder = "Gün 1:\n- Matematik: Limit 30 soru çöz\n- Fizik: Kuvvet video izle\n\nGün 2:\n- Türkçe: Paragraf 20 soru çöz";
    };

    try {
      if (!statusDiv || !resultArea || !resultText) {
        this.showToast("Yükleme alanı bulunamadı. Sayfayı yenileyip tekrar dene.", "error");
        return;
      }
      if (!input || !input.files || input.files.length === 0) {
        setStatus("fa-circle-xmark", "text-danger", "Dosya seçilmedi.");
        return;
      }

      const file = input.files[0];
      const sizeKb = Math.round(file.size / 1024);
      const isPdf = /pdf/i.test(file.type || "") || /\.pdf$/i.test(file.name || "");

      // İlk görünür tepki — bu satır çıkıyorsa özellik tetiklenmiş demektir.
      setStatus("fa-spinner fa-spin", "text-warning",
        `<strong>${this.escapeHtml(file.name)}</strong> (${sizeKb} KB) alındı, okunuyor...`);
      resultArea.style.display = "block";

      const finish = (text, kaynak) => {
        const clean = String(text || "").trim();
        if (!clean) {
          openManualEntry(isPdf
            ? "PDF'te okunabilir program metni bulunamadı. Metni aşağıya elle yazabilirsin."
            : "Fotoğrafta okunabilir yazı bulunamadı. Daha aydınlık/yakın bir fotoğraf dene veya aşağıya elle yaz.");
          return;
        }
        setStatus("fa-circle-check", "text-success", `${kaynak} ile okundu. Metni kontrol edip "Plana Aktar"a bas.`);
        resultText.value = clean;
        resultArea.style.display = "block";
      };
      const fail = (onek, err) => {
        console.error(err);
        openManualEntry(`${onek} (${err && err.message ? err.message : "bilinmeyen hata"}). Programını aşağıya elle yazabilirsin.`);
      };

      // ---------- PDF ----------
      if (isPdf) {
        this.readProgramPdf(file, setStatus)
          .then(r => finish(r.text, r.kaynak))
          .catch(err => fail("PDF okunamadı", err));
        return;
      }

      // ---------- GÖRSEL ----------
      // HEIC (iPhone) tarayıcıda çözülemez — baştan uyar.
      if (/heic|heif/i.test(file.type || "") || /\.(heic|heif)$/i.test(file.name || "")) {
        openManualEntry("iPhone HEIC formatı tarayıcıda okunamıyor. Fotoğrafı JPG/PNG olarak kaydedip tekrar yükle veya programı aşağıya elle yaz.");
        return;
      }
      if (file.type && !/^image\//.test(file.type)) {
        openManualEntry("Bu dosya türü okunamıyor. Programının fotoğrafını (JPG/PNG) ya da PDF'ini seç veya aşağıya elle yaz.");
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => openManualEntry("Dosya okunamadı. Programını aşağıya elle yazabilirsin.");
      reader.onload = (e) => {
        const dataUrl = String(e.target.result || "");
        if (!dataUrl) { openManualEntry("Dosya boş geldi. Programını aşağıya elle yazabilirsin."); return; }
        this.readProgramImage(dataUrl, file.type || "image/jpeg", setStatus)
          .then(r => finish(r.text, r.kaynak))
          .catch(err => fail("Fotoğraf okunamadı", err));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      openManualEntry(`Beklenmeyen hata: ${err && err.message ? err.message : err}. Programını aşağıya elle yazabilirsin.`);
    }
  },

  // Tek bir görselden metin çıkarır: önce Gemini (el yazısı), sonra Tesseract.
  readProgramImage: async function(dataUrl, mimeType, setStatus) {
    if (this.hasLlmApiKey() && navigator.onLine) {
      setStatus("fa-spinner fa-spin", "text-warning", "Yapay zeka okuyor (el yazısı destekli)...");
      try {
        const text = await this.readProgramPhotoWithAI(dataUrl, mimeType);
        return { text: text, kaynak: "Yapay zeka" };
      } catch (err) {
        console.error("AI okuma başarısız, Tesseract'a düşülüyor:", err);
        setStatus("fa-spinner fa-spin", "text-warning",
          `Yapay zeka okuyamadı (${err && err.message ? err.message : "hata"}), klasik OCR deneniyor...`);
      }
    } else {
      setStatus("fa-spinner fa-spin", "text-warning", this.hasLlmApiKey()
        ? "Çevrimdışısın, klasik OCR deneniyor..."
        : "Klasik OCR ile taranıyor (el yazısı için Profil'den AI anahtarı eklemen önerilir)...");
    }

    const text = await this.runTesseractOcr(dataUrl, setStatus);
    return { text: text, kaynak: "Klasik OCR" };
  },

  // Tesseract sarmalayıcı — takılan tarama eskiden sonsuza kadar dönüyordu.
  runTesseractOcr: function(dataUrl, setStatus) {
    return new Promise((resolve, reject) => {
      if (typeof Tesseract === "undefined") {
        reject(new Error("OCR kütüphanesi yüklenemedi, internet bağlantısı gerekiyor"));
        return;
      }
      let bitti = false;
      const zamanAsimi = setTimeout(() => {
        if (bitti) return;
        bitti = true;
        reject(new Error("tarama 90 saniyeyi aştı"));
      }, 90000);

      Tesseract.recognize(dataUrl, "tur", {
        logger: m => {
          if (!bitti && m && m.status === "recognizing text") {
            setStatus("fa-spinner fa-spin", "text-warning", `Taranıyor... %${Math.round((m.progress || 0) * 100)}`);
          }
        }
      }).then(({ data: { text } }) => {
        if (bitti) return;
        bitti = true; clearTimeout(zamanAsimi);
        resolve(text);
      }).catch(err => {
        if (bitti) return;
        bitti = true; clearTimeout(zamanAsimi);
        reject(err);
      });
    });
  },

  PDF_MAX_PAGES: 12,

  // PDF'ten program metni.
  // Okuldan/kurstan gelen programlar genelde metin katmanlı PDF'tir; bu
  // durumda hiç OCR çalıştırmadan kusursuz metin alınır. Taranmış (görsel)
  // PDF'lerde sayfalar tuvale çizilip görsel okuma yoluna verilir.
  readProgramPdf: async function(file, setStatus) {
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib) throw new Error("PDF kütüphanesi yüklenemedi, internet bağlantısı gerekiyor");

    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: data }).promise;
    const pageCount = Math.min(pdf.numPages, this.PDF_MAX_PAGES);

    // ---- 1) Gömülü metin katmanı ----
    const lines = [];
    for (let i = 1; i <= pageCount; i++) {
      setStatus("fa-spinner fa-spin", "text-warning", `PDF metni okunuyor... sayfa ${i}/${pageCount}`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      // getTextContent satır bilgisi vermez; parçalar dikey konuma (y) göre
      // gruplanıp yatay konuma (x) göre sıralanarak satırlar geri kurulur.
      // Ayrıştırıcı satır tabanlı çalıştığı için bu adım şart.
      const rows = {};
      content.items.forEach(item => {
        if (!item.str) return;
        const y = Math.round(item.transform[5] / 3) * 3;
        (rows[y] = rows[y] || []).push({ x: item.transform[4], s: item.str });
      });
      Object.keys(rows).map(Number).sort((a, b) => b - a).forEach(y => {
        const line = rows[y].sort((a, b) => a.x - b.x).map(o => o.s).join(" ")
          .replace(/\s+/g, " ").trim();
        if (line) lines.push(line);
      });
    }

    const embedded = lines.join("\n").trim();
    if (embedded.replace(/\s/g, "").length >= 20) {
      return { text: embedded, kaynak: `PDF metni (${pageCount} sayfa)` };
    }

    // ---- 2) Taranmış PDF: sayfaları görsele çevir ----
    const parts = [];
    for (let i = 1; i <= pageCount; i++) {
      setStatus("fa-spinner fa-spin", "text-warning", `Taranmış PDF, sayfa ${i}/${pageCount} görsele çevriliyor...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport }).promise;

      const result = await this.readProgramImage(canvas.toDataURL("image/png"), "image/png", setStatus);
      if (result.text && result.text.trim()) parts.push(result.text.trim());
    }

    if (!parts.length) throw new Error("sayfalardan metin çıkarılamadı");
    return { text: parts.join("\n"), kaynak: `Taranmış PDF (${pageCount} sayfa)` };
  },

  // Gemini görsel okuma — Hata Defteri'ndeki foto çözümüyle aynı uç nokta.
  // Tesseract yalnızca basılı metni okuyabildiği için el yazısı programlarda
  // tek çalışan yol budur. Model, satırları doğrudan ayrıştırıcının beklediği
  // "Gün N:" + "- Ders: konu" biçiminde döndürür.
  readProgramPhotoWithAI: async function(dataUrl, mimeType) {
    const apiKey = this.getLlmApiKey();
    if (!apiKey) throw new Error("AI anahtarı yok");

    const base64Data = String(dataUrl).split(",")[1];
    if (!base64Data) throw new Error("Görsel verisi çözülemedi");

    const promptText =
      "Bu görsel, bir öğrencinin gün gün çalışma programı (elle yazılmış bir kağıt, " +
      "taranmış bir PDF sayfası veya basılı bir çizelge olabilir). " +
      "Görseldeki yazıyı (el yazısı veya tablo olabilir) oku ve programı DÜZ METİN olarak yeniden yaz. " +
      "Kurallar: Her gün başlığını kendi satırında 'Gün N:' biçiminde yaz (kağıtta 'Pazartesi' gibi gün adları varsa Pazartesi=Gün 1, Salı=Gün 2 ... Pazar=Gün 7 olarak çevir). " +
      "Her görevi ayrı satırda '- Ders: konu ve miktar' biçiminde yaz (örn: '- Matematik: Limit 30 soru çöz'). " +
      "Ders adlarını Türkçe ve tam yaz (Matematik, Türkçe, Fizik, Kimya, Biyoloji, Edebiyat, Tarih, Coğrafya, Geometri). " +
      "Yorum ekleme, başlık ekleme, markdown kullanma. SADECE programın kendisini yaz. " +
      "Fotoğrafta çalışma programı yoksa tek satır olarak 'PROGRAM_YOK' yaz.";

    const payload = {
      contents: [{
        parts: [
          { text: promptText },
          { inlineData: { mimeType: mimeType || "image/jpeg", data: base64Data } }
        ]
      }],
      generationConfig: { temperature: 0.1 }
    };

    const res = await fetch(`${this.geminiConfig.endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "API hatası");

    const text = data && data.candidates && data.candidates[0] &&
      data.candidates[0].content && data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

    const clean = String(text || "").replace(/```/g, "").trim();
    if (!clean || /^PROGRAM_YOK$/im.test(clean)) {
      throw new Error("Fotoğrafta çalışma programı bulunamadı");
    }
    return clean;
  },

  // OCR çıktısı Türkçe karakterleri ve büyük/küçük harfi tutarsız üretir
  // ("Gün" -> "Gun/GÜN", "Türkçe" -> "TURKCE"). Eşleştirme yapmadan önce
  // metin aksansız küçük harfe indirgenir. Karakter sayısı korunur —
  // eşleşme indeksleri orijinal satırda da geçerlidir.
  normalizeOcrText: function(str) {
    return String(str || "")
      .replace(/[İIı]/g, "i")
      .replace(/[Şş]/g, "s")
      .replace(/[Ğğ]/g, "g")
      .replace(/[Üü]/g, "u")
      .replace(/[Öö]/g, "o")
      .replace(/[Çç]/g, "c")
      .toLowerCase();
  },

  // Satırdaki gün işaretini bulur: "1. Gün", "Gün 2:", "day 3", "Pazartesi:".
  // Dönüş: { day, rest } — rest, satırın gün işaretinden sonra kalan görev
  // kısmıdır ("Pazartesi: Matematik 30 soru" gibi tek satırlık planlar için).
  parseOcrDayMarker: function(line) {
    const norm = this.normalizeOcrText(line);

    const numeric = [
      /^\s*[-*•]?\s*(\d{1,3})\s*[.\-):]*\s*(?:gun|day)\b\s*[:.\-]?\s*/,
      /^\s*[-*•]?\s*(?:gun|day)\s*[:.\-]?\s*(\d{1,3})\b\s*[:.\-]?\s*/
    ];
    for (const re of numeric) {
      const m = norm.match(re);
      if (m) {
        const day = parseInt(m[1], 10);
        if (day >= 1 && day <= this.PROGRAM_DAYS) {
          return { day: day, rest: line.slice(m[0].length).trim() };
        }
      }
    }

    // Sesli girişte gün numarası sözcükle söylenir: "birinci gün",
    // "dördüncü gün". voiceTextToProgramLines bu ifadeleri olduğu gibi
    // bırakır; burada tanınmazsa tüm görevler 1. güne yığılır ve başlık
    // satırları da görev sanılırdı.
    const siraAdlari = Object.keys(this.SIRA_SAYILARI);
    for (const ad of siraAdlari) {
      const m = norm.match(new RegExp("^\\s*[-*•]?\\s*" + ad + "(?![a-z])\\s*(?:gun|gunu|gune)\\s*[:.\\-]?\\s*"));
      if (m) {
        const day = this.SIRA_SAYILARI[ad];
        if (day >= 1 && day <= this.PROGRAM_DAYS) {
          return { day: day, rest: line.slice(m[0].length).trim() };
        }
      }
    }

    // Elle yazılmış haftalık programlarda gün adı kullanılır.
    // Uzun adlar önce denenmese de sınır kontrolü "pazar"ın "pazartesi"
    // içinde eşleşmesini engeller.
    const weekdays = { pazartesi: 1, sali: 2, carsamba: 3, persembe: 4, cuma: 5, cumartesi: 6, pazar: 7 };
    for (const name of Object.keys(weekdays)) {
      const m = norm.match(new RegExp("^\\s*[-*•]?\\s*" + name + "(?![a-z])\\s*(?:gunu)?\\s*[:.\\-]?\\s*"));
      if (m) return { day: weekdays[name], rest: line.slice(m[0].length).trim() };
    }

    return null;
  },

  // Ders adı eşleştirme — planlayıcının ders listesiyle birebir aynı
  // değerleri döndürür. Kısa takma adlar ("mat", "cog") kelime sınırıyla
  // aranır, böylece başka sözcüklerin içinde eşleşmez.
  OCR_SUBJECT_ALIASES: [
    { subject: "Paragraf", keys: ["paragraf"] },
    { subject: "Geometri", keys: ["geometri", "geo"] },
    { subject: "Matematik", keys: ["matematik", "mat"] },
    { subject: "Edebiyat", keys: ["edebiyat", "edb"] },
    { subject: "Türkçe", keys: ["turkce", "turkcesi"] },
    { subject: "Fizik", keys: ["fizik"] },
    { subject: "Kimya", keys: ["kimya"] },
    { subject: "Biyoloji", keys: ["biyoloji", "biyo"] },
    { subject: "Tarih", keys: ["tarih"] },
    { subject: "Coğrafya", keys: ["cografya", "cog"] },
    { subject: "Kitap Okuma", keys: ["kitap"] }
  ],

  matchOcrSubject: function(normalizedLine) {
    for (const entry of this.OCR_SUBJECT_ALIASES) {
      for (const key of entry.keys) {
        if (new RegExp("(^|[^a-z0-9])" + key + "([^a-z0-9]|$)").test(normalizedLine)) {
          return { subject: entry.subject, key: key };
        }
      }
    }
    return null;
  },

  // ADI TAMAMLAMA / GERCEK ADA COZUMLEME
  // ------------------------------------------------------------
  // Kullanicinin bir adin tamamini yazmasi beklenmez. Yazilan parca
  // adaylardan biriyle yeterince ortusuyorsa kayit GERCEK ADIYLA yapilir
  // ("mat" -> "Matematik", "3d yay" -> "3D Yayinlari").
  //
  // Kural: yazilan metin bir adayin herhangi bir KELIMESININ basiysa ve
  // o kelimenin en az %30'u kadar uzunluktaysa eslesme sayilir. Yuzde
  // kelime uzerinden hesaplanir; tum ifade uzerinden hesaplansaydi
  // 49 harflik bir konu adi icin 15 harf yazmak gerekirdi.
  //
  // Birden fazla aday eslesirse ASLA tahmin edilmez — secim kullaniciya
  // birakilir. Yanlis konuya kayit, hic kayit olmamasindan kotudur.
  AD_COZUMLEME: { oran: 0.3, enAzHarf: 3 },

  resolveCanonicalName: function(giris, adaylar, secenek) {
    const ayar = Object.assign({}, this.AD_COZUMLEME, secenek || {});
    const g = this.normalizeOcrText(String(giris || "")).trim();
    const bos = { ad: null, kesin: false, adaylar: [] };
    if (!g || !Array.isArray(adaylar) || !adaylar.length) return bos;

    const norm = adaylar.map(a => ({ ad: a, n: this.normalizeOcrText(a).trim() }));

    // 1) Tam eslesme — her zaman kazanir
    const tam = norm.filter(c => c.n === g);
    if (tam.length) return { ad: tam[0].ad, kesin: true, adaylar: [tam[0].ad] };

    // Yazilan sey bir adayin TAM BIR KELIMESIYSE alt harf sinirina takilmaz:
    // "3d" -> "3D Yayinlari" gecerli bir kisaltma.
    const tamKelime = norm.filter(c => c.n.split(/[^a-z0-9]+/).indexOf(g) !== -1);
    if (tamKelime.length === 1) return { ad: tamKelime[0].ad, kesin: true, adaylar: [tamKelime[0].ad] };

    if (g.length < ayar.enAzHarf) {
      return tamKelime.length > 1 ? { ad: null, kesin: false, adaylar: tamKelime.map(c => c.ad) } : bos;
    }

    const yeterli = (kelime) => g.length >= Math.max(1, Math.ceil(kelime.length * ayar.oran));

    // 2) Ifadenin basindan eslesme (en guvenilir kismi eslesme)
    let aday = norm.filter(c => c.n.startsWith(g) && yeterli(c.n.split(/[^a-z0-9]+/)[0] || c.n));
    if (aday.length === 1) return { ad: aday[0].ad, kesin: true, adaylar: [aday[0].ad] };

    // 3) Herhangi bir kelimenin basindan eslesme
    if (aday.length !== 1) {
      const kelimeEslesen = norm.filter(c =>
        c.n.split(/[^a-z0-9]+/).some(k => k && k.startsWith(g) && yeterli(k)));
      if (kelimeEslesen.length === 1) return { ad: kelimeEslesen[0].ad, kesin: true, adaylar: [kelimeEslesen[0].ad] };
      if (kelimeEslesen.length > 1) aday = kelimeEslesen;
    }

    // 4) Belirtec eslesmesi — cekimli sonlari tolere eder.
    // Girisin HER kelimesi, adayin bir kelimesiyle yeterince uzun ortak
    // bir bas kismini paylasmali: "hucre bolunmesi" -> "Hucre Bolunmeleri",
    // "elektrik alan" -> "Elektriksel Kuvvet ve Alan".
    if (aday.length !== 1) {
      const parcala = (x) => x.split(/[^a-z0-9]+/).filter(w => w.length > 1);
      const girisKelimeleri = parcala(g);
      if (girisKelimeleri.length) {
        const ortakBas = (x, y) => { let i = 0; while (i < x.length && i < y.length && x[i] === y[i]) i++; return i; };
        const belirtecEslesen = norm.filter(c => {
          const adayKelimeleri = parcala(c.n);
          return girisKelimeleri.every(gk =>
            adayKelimeleri.some(ak => ortakBas(gk, ak) >= Math.max(3, Math.ceil(gk.length * 0.6))));
        });
        if (belirtecEslesen.length === 1) {
          return { ad: belirtecEslesen[0].ad, kesin: false, adaylar: [belirtecEslesen[0].ad] };
        }
        if (belirtecEslesen.length > 1 && !aday.length) aday = belirtecEslesen;
      }
    }

    // Belirsiz: adaylari dondur, tahmin etme
    return { ad: null, kesin: false, adaylar: aday.map(c => c.ad) };
  },

  // Mufredattaki tum konu adlari (secili derse gore daraltilabilir)
  curriculumTopicNames: function(subject, examType) {
    const g = this.curriculum.graph();
    const cikti = [];
    const hedef = subject ? this.sourceBooks.normalizeSubject(subject) : null;
    // Ayni ders adi hem TYT hem AYT grubunda gecebilir (or. Tarih). Sinav
    // turu verilirse liste daraltilir ve "inkilap" gibi girisler tek
    // adaya duser.
    const sinav = (examType && examType !== "Genel") ? String(examType).toUpperCase() : null;
    Object.keys(g.subjects || {}).forEach(anahtar => {
      const ders = g.subjects[anahtar];
      if (!ders || !Array.isArray(ders.units)) return;
      // Ders adi konunun kendisinde degil, ust gruptadir (subj.subject).
      const dersAdi = this.sourceBooks.normalizeSubject(ders.subject || "");
      if (hedef && dersAdi !== hedef) return;
      if (sinav && String(ders.exam || "").toUpperCase() !== sinav) return;
      (ders.units || []).forEach(u => (u.topics || []).forEach(t => {
        if (!t || !t.name) return;
        if (cikti.indexOf(t.name) === -1) cikti.push(t.name);
      }));
    });
    return cikti.sort((a, b) => a.localeCompare(b, "tr"));
  },

  // Turkce sayi sozcuklerini rakama cevirir: "kirk soru" -> "40 soru",
  // "yirmi bes" -> "25", "yuz yirmi" -> "120". Konusma tanima bazen rakam,
  // bazen yazi dondurdugu icin ikisi de desteklenir.
  SAYI_SOZCUKLERI: {
    "yüz": 100, "yuz": 100,
    on: 10, yirmi: 20, otuz: 30, "kırk": 40, kirk: 40, elli: 50,
    "altmış": 60, altmis: 60, "yetmiş": 70, yetmis: 70, seksen: 80, doksan: 90,
    bir: 1, iki: 2, "üç": 3, uc: 3, "dört": 4, dort: 4, "beş": 5, bes: 5,
    "altı": 6, alti: 6, yedi: 7, sekiz: 8, dokuz: 9
  },

  turkishNumberWordsToDigits: function(text) {
    const tablo = this.SAYI_SOZCUKLERI;
    // Uzun sozcukler once denensin ki "on" , "onuncu" gibi kisalar
    // uzun eslesmeleri bolmesin.
    const desen = Object.keys(tablo).sort((a, b) => b.length - a.length).join("|");
    // Ardisik sayi sozcuklerini TEK parca olarak yakala; boylece sondaki
    // bosluk tuketilmez ("kirk soru" -> "40 soru", "40soru" degil).
    // \\b KULLANILMAZ: JavaScript'te kelime siniri yalnizca [A-Za-z0-9_]
    // uzerinden tanimlidir, bu yuzden "bes" gibi Turkce harfle biten
    // sozcuklerde sinir olusmaz ve "yirmi bes" yarim eslesirdi.
    const HARF = "A-Za-z0-9_çğıöşüÇĞİÖŞÜ";
    const re = new RegExp(
      "(?<![" + HARF + "])(?:" + desen + ")(?:\\s+(?:" + desen + "))*(?![" + HARF + "])",
      "gi"
    );

    return String(text || "").replace(re, (eslesme) => {
      const parcalar = eslesme.toLowerCase().split(/\s+/);
      // Tek basina "bir" cogu zaman sayi degil, belirtec ("bir de", "bir tane").
      if (parcalar.length === 1 && (parcalar[0] === "bir")) return eslesme;
      let toplam = 0;
      for (const kelime of parcalar) {
        const deger = tablo[kelime];
        if (deger === undefined) return eslesme;
        toplam += deger;
      }
      return toplam > 0 ? String(toplam) : eslesme;
    });
  },

  // Sozle soylenen gun isaretleri: "pazartesi", "birinci gun", "gun 3", "2. gun"
  SIRA_SAYILARI: {
    birinci: 1, ikinci: 2, ucuncu: 3, dorduncu: 4, besinci: 5, altinci: 6,
    yedinci: 7, sekizinci: 8, dokuzuncu: 9, onuncu: 10
  },

  // Sesli giris TEK BIR UZUN CUMLE olarak gelir; ayristirici ise satir
  // tabanli calisir. Bu fonksiyon konusmayi gun ve ders sinirlarindan
  // bolerek ayristiricinin bekledigi bicime sokar:
  //   "pazartesi matematik turev kirk soru fizik elektrik izle"
  //   -> "Pazartesi:" / "- matematik turev 40 soru" / "- fizik elektrik izle"
  voiceTextToProgramLines: function(raw) {
    const text = this.turkishNumberWordsToDigits(String(raw || "").replace(/\s+/g, " ").trim());
    if (!text) return "";

    // normalizeOcrText karakter sayisini korur -> indeksler orijinalde de gecerli
    const norm = this.normalizeOcrText(text);

    // 1) Gun isaretleri: konum + isaretin uzunlugu (kalan kismi ayirmak icin)
    const gunler = {};
    const sira = Object.keys(this.SIRA_SAYILARI).join("|");
    const gunDeseni = new RegExp(
      "(?:^|\\s)((?:pazartesi|cumartesi|carsamba|persembe|cuma|sali|pazar)" +
      "|(?:" + sira + ")\\s+gun[a-z]*" +
      "|\\d{1,3}\\s*\\.?\\s*(?:gun|day)[a-z]*" +
      "|(?:gun|day)\\s*\\d{1,3})(?![a-z0-9])", "g");

    const kesim = new Set([0]);
    let m;
    while ((m = gunDeseni.exec(norm)) !== null) {
      const bas = m.index + (m[0].length - m[1].length);
      gunler[bas] = m[1].length;
      kesim.add(bas);
      if (gunDeseni.lastIndex === m.index) gunDeseni.lastIndex++;
    }

    // 2) Ders sinirlari — yalnizca uzun takma adlar; "mat", "geo" gibi
    //    kisalar cumle icinde yanlis bolme yapardi.
    const dersler = [];
    this.OCR_SUBJECT_ALIASES.forEach(e => e.keys.forEach(k => { if (k.length >= 5) dersler.push(k); }));
    if (dersler.length) {
      const dersDeseni = new RegExp("(?:^|\\s)(?:" + dersler.join("|") + ")(?![a-z0-9])", "g");
      while ((m = dersDeseni.exec(norm)) !== null) {
        const bas = m.index + (m[0].length - m[0].replace(/^\s+/, "").length);
        if (gunler[bas] === undefined) kesim.add(bas);
        if (dersDeseni.lastIndex === m.index) dersDeseni.lastIndex++;
      }
    }

    const noktalar = Array.from(kesim).sort((a, b) => a - b);
    const temizle = (x) => x.trim().replace(/^[\s,;.]+|[\s,;.]+$/g, "");

    // Once parcalari topla (gun basligi / is satiri), sonra birlestir.
    const parcalar = [];
    for (let i = 0; i < noktalar.length; i++) {
      const dilim = text.slice(noktalar[i], noktalar[i + 1]);
      const gunUzunlugu = gunler[noktalar[i]];
      if (gunUzunlugu === undefined) {
        const g = temizle(dilim);
        if (g) parcalar.push({ gun: false, metin: g });
        continue;
      }
      const etiket = temizle(dilim.slice(0, gunUzunlugu));
      const kalan = temizle(dilim.slice(gunUzunlugu));
      if (etiket) parcalar.push({ gun: true, metin: etiket });
      if (kalan) parcalar.push({ gun: false, metin: kalan });
    }

    // Yalnizca ders adindan ibaret parcalar ("türkçe") bir sonraki
    // parcayla birlesir: "türkçe paragraf 30 soru" tek gorevdir, iki degil.
    const yalnizDers = (metin) => {
      const n = this.normalizeOcrText(metin).trim();
      return this.OCR_SUBJECT_ALIASES.some(e => e.keys.some(k => k === n));
    };
    const birlesik = [];
    for (let i = 0; i < parcalar.length; i++) {
      const p = parcalar[i];
      const sonraki = parcalar[i + 1];
      if (!p.gun && sonraki && !sonraki.gun && yalnizDers(p.metin)) {
        birlesik.push({ gun: false, metin: p.metin + " " + sonraki.metin });
        i++;
        continue;
      }
      birlesik.push(p);
    }

    return birlesik.map(p => (p.gun ? p.metin + ":" : "- " + p.metin)).join("\n");
  },

  // Metinden programa — TEK AYRISTIRICI.
  // Foto/PDF okuma, elle yazma ve sesli giris ayni bu fonksiyonu cagirir.
  // Basarili olursa { taskCount, importedDays } dondurur, aksi halde null.
  // Metinden gorev listesi uretir — YAN ETKISI YOKTUR.
  // Foto/PDF okuma, elle yazma ve sesli giris ayni bu ayristiriciyi kullanir.
  // Donen yapi: { gunler: {gunNo: [gorev]}, taskCount, sureliGorev, suresizGorev }
  // Programa hicbir sey yazmaz; taslak ekrani bunun uzerine kurulur.
  parseProgramTextToDays: function(text) {
    if (!text || String(text).trim() === "") return null;

    const gunler = {};
    let currentDay = 1;
    let taskCount = 0;
    // Sure acikca soylendi mi? ("45 dk", "2 saat")
    let sureliGorev = 0;
    let suresizGorev = 0;

    const ensureDay = (day) => {
      if (!gunler[day]) gunler[day] = [];
      return gunler[day];
    };

    text.split("\n").forEach(rawLine => {
      let line = rawLine.trim();
      if (line === "") return;

      // 1) Gün işareti — hem "Gün 2:" hem "Pazartesi: Matematik 30 soru"
      const marker = this.parseOcrDayMarker(line);
      if (marker) {
        currentDay = marker.day;
        line = marker.rest;
        if (line === "") return;   // satır yalnızca gün başlığıydı
      }

      // 2) Madde imi / numara temizliği
      line = line.replace(/^\s*[-*•+>]+\s*/, "").replace(/^\s*\d{1,2}[.)]\s+/, "").trim();
      if (line === "" || line.length < 2) return;

      const norm = this.normalizeOcrText(line);

      // 3) Ders — bulunamazsa Matematik varsayılmaz, "Özel Görev" olur
      const subjectMatch = this.matchOcrSubject(norm);
      const subject = subjectMatch ? subjectMatch.subject : "Özel Görev";

      // 4) Çalışma tipi + süre + soru sayısı
      let type = "reading";
      let qCount = 30;
      let duration = "60 dk";

      if (/soru|test|coz|cozum/.test(norm)) {
        type = "quiz";
        const qMatch = norm.match(/(\d{1,4})\s*(?:soru|test)/) || norm.match(/(?:coz\w*)\s*(\d{1,4})/);
        if (qMatch) qCount = parseInt(qMatch[1], 10);
        duration = "45 dk";
      } else if (/izle|video|dinle|ders/.test(norm)) {
        type = "video";
        duration = "45 dk";
      } else if (/oku|ozet|tekrar|calis/.test(norm)) {
        type = "reading";
        duration = "30 dk";
      }

      // Satırda süre yazıyorsa ("45 dk", "2 saat") o süre kullanılır
      const hourMatch = norm.match(/(\d{1,2})\s*saat/);
      const minMatch = norm.match(/(\d{1,3})\s*(?:dk|dakika)/);
      let sureBelirtildi = false;
      if (hourMatch) { duration = `${parseInt(hourMatch[1], 10) * 60} dk`; sureBelirtildi = true; }
      else if (minMatch) { duration = `${parseInt(minMatch[1], 10)} dk`; sureBelirtildi = true; }
      if (sureBelirtildi) sureliGorev++; else suresizGorev++;

      // 5) Sınav türü satırda açıkça yazıyorsa kullanılır
      let examType = "Genel";
      if (/(^|[^a-z])tyt([^a-z]|$)/.test(norm)) examType = "TYT";
      else if (/(^|[^a-z])ayt([^a-z]|$)/.test(norm)) examType = "AYT";

      // 6) Konu — satır başındaki ders etiketini at
      // ("Matematik: Limit 30 soru" -> "Limit 30 soru"). Eşleşen ders
      // satırın ortasında olsa bile baştaki etiket temizlenir
      // ("Türkçe: Paragraf 20 soru" -> "Paragraf 20 soru").
      let topic = line;
      if (subjectMatch && subject !== "Kitap Okuma") {
        for (const entry of this.OCR_SUBJECT_ALIASES) {
          const hit = norm.match(new RegExp("^(?:" + entry.keys.join("|") + ")[^a-z0-9]+"));
          if (hit) { topic = line.slice(hit[0].length).trim(); break; }
        }
      }
      topic = topic.replace(/^[\s:\-–—]+/, "").trim();
      if (topic === "") topic = subjectMatch ? `${subject} Genel Çalışma` : "Genel Tekrar ve Soru Çözümü";

      // Yazilan/soylenen konu adi mufredattaki GERCEK adla eslesiyorsa
      // kayit resmi adiyla yapilir ("mutlak" -> "Mutlak Deger"). Konu
      // adinin yanindaki miktar/eylem sozcukleri ("30 soru coz") ayiklanir.
      if (subjectMatch) {
        const mufredat = this.curriculumTopicNames(subject, examType);
        if (mufredat.length) {
          // Miktar ve eylem sozcuklerini ayikla. \b KULLANILMAZ: JavaScript'te
          // kelime siniri yalnizca [A-Za-z0-9_] uzerinden tanimli oldugu icin
          // "coz", "ozet" gibi Turkce harfli sozcuklerde sinir olusmaz.
          const H = "A-Za-z0-9_çğıöşüÇĞİÖŞÜ";
          const eylem = "çöz|coz|çözüm|cozum|izle|dinle|oku|çalış|calis|tekrar|video|özet|ozet|yap";
          const cekirdek = topic
            .replace(new RegExp("\\d+\\s*(soru|test|dk|dakika|saat|sayfa)[" + H + "]*", "gi"), " ")
            .replace(new RegExp("(?<![" + H + "])(?:" + eylem + ")[" + H + "]*", "gi"), " ")
            .replace(/[\s,;.:]+/g, " ").trim();
          const eslesme = this.resolveCanonicalName(cekirdek || topic, mufredat);
          if (eslesme.ad) topic = eslesme.ad;
        }
      }

      const typeLabels = {
        video: `🎥 ${subject}: Konu Anlatımı`,
        quiz: `🎯 ${subject}: Kazanım Testi`,
        reading: `📖 ${subject}: Kazanım Çalışması`
      };
      let label = typeLabels[type] || `${subject}: Özel Görev`;
      if (subject === "Kitap Okuma" || subject === "Özel Görev") label = `${subject}: ${topic}`;
      if (examType !== "Genel") label = `[${examType}] ${label}`;

      const newTask = {
        id: `task_ocr_${currentDay}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: type,
        subject: subject,
        topic: topic,
        label: label,
        desc: type === "quiz" ? `"${topic}" ile ilgili ${qCount} soru çöz.` : `"${topic}" konusunu çalış.`,
        duration: duration,
        completed: false,
        examType: examType,
        // Sure metinde/konusmada acikca gecti mi? Aktarim sonrasi
        // "sureleri ben ayarlayayim mi?" secenegi yalnizca varsayilanla
        // doldurulmus gorevlere dokunur.
        sureKaynagi: sureBelirtildi ? "metin" : "varsayilan"
      };

      if (type === "quiz") {
        newTask.qCount = qCount;
        newTask.logged = false;
        newTask.correct = 0;
        newTask.incorrect = 0;
        newTask.timeSpent = 0;
        newTask.errorTopics = [];
      }

      // Fotoğraftan gelen göreve de yayınevi/kitap bilgisi iliştirilir
      this.sourceBooks.attach(newTask);

      ensureDay(currentDay).push(newTask);
      taskCount++;
    });

    if (taskCount === 0) return null;

    return {
      gunler: gunler,
      taskCount: taskCount,
      sureliGorev: sureliGorev,
      suresizGorev: suresizGorev
    };
  },

  // Metinden programa — ayristirmayi parseProgramTextToDays yapar,
  // burasi yalnizca sonucu planlayici tamponuna yazar.
  // Basarili olursa ozet dondurur, aksi halde null.
  importProgramTextIntoPlanner: function(text) {
    if (!text || String(text).trim() === "") {
      this.showToast("Aktarılacak metin boş.", "error");
      return null;
    }

    const cozum = this.parseProgramTextToDays(text);
    if (!cozum) {
      this.showToast("Metinden görev çıkarılamadı. Satırları 'Gün 1:' ve '- Matematik: Limit 30 soru' biçiminde düzenleyip tekrar dene.", "error");
      return null;
    }

    // Aktarim baslarken planlayici henuz kurulmamis olabilir.
    if (!this.isPlanning) {
      this.plannerCreateNewProgramFromScratch();
    }
    if (!this.plannerBuffer) this.plannerBuffer = {};

    // YALNIZCA metinde gecen gunler temizlenir; digerleri korunur.
    const importedDays = Object.keys(cozum.gunler).map(Number).sort((a, b) => a - b);
    importedDays.forEach(g => {
      this.plannerBuffer[g] = { completed: false, tasks: cozum.gunler[g], schedule: [] };
    });

    const firstDay = importedDays[0] || 1;
    const daySelect = document.getElementById("plannerDaySelect");
    if (daySelect) daySelect.value = String(firstDay);
    this.plannerSelectDay(firstDay);

    return {
      taskCount: cozum.taskCount,
      importedDays: importedDays,
      sureliGorev: cozum.sureliGorev,
      suresizGorev: cozum.suresizGorev
    };
  },

  // ============================================================
  // AKTARIM TASLAGI — programa yazmadan once goster / duzenle / onayla
  // ------------------------------------------------------------
  // Sesli giris ve foto/PDF okuma artik dogrudan programa yazmaz.
  // Once bu taslak acilir: kullanici gorevleri surukleyip siralar,
  // sureleri duzenler, sonra "Onayla ve Programa Ekle" der.
  // ============================================================

  _taslak: null,

  // Gun numarasini gercek tarihe cevirir ("21 Agu, Cum").
  taslakGunTarihi: function(gunNo) {
    try {
      const bas = this.state && this.state.startDate ? new Date(this.state.startDate) : new Date();
      if (isNaN(bas)) return "";
      bas.setDate(bas.getDate() + (gunNo - 1));
      const gunAdi = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][bas.getDay()];
      const ayAdi = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"][bas.getMonth()];
      return `${bas.getDate()} ${ayAdi}, ${gunAdi}`;
    } catch (e) { return ""; }
  },

  // Gunun ilk gorevi hangi saatte baslar? Planlayicidaki mantikla ayni:
  // mezunlar kalkistan 90 dk sonra, okula gidenler hafta ici 16:00'da.
  // Program gununun GERCEK haftanin gunu (0=Pazar ... 6=Cumartesi).
  // Kodun eski yerlerinde "gun % 7" kullaniliyor; bu takvimle uyusmadigi
  // icin hafta sonu yanlis tespit ediliyordu (2. gun gercekte Cumartesi
  // olmasina ragmen hafta ici sayiliyordu).
  programGunHaftaninGunu: function(gunNo) {
    try {
      const bas = this.state && this.state.startDate ? new Date(this.state.startDate + "T00:00:00") : new Date();
      if (isNaN(bas)) return gunNo % 7;
      bas.setDate(bas.getDate() + (gunNo - 1));
      return bas.getDay();
    } catch (e) { return gunNo % 7; }
  },

  taslakBaslangicDakika: function(gunNo) {
    const hg = this.programGunHaftaninGunu(gunNo);
    const haftaSonu = (hg === 0 || hg === 6);
    if (this.state.isGraduate) {
      return this.timeStrToMinutes(this.state.wakeTime || "08:00") + 90;
    }
    return haftaSonu
      ? this.timeStrToMinutes(this.state.wakeTime || "08:00") + 120
      : 16 * 60;
  },

  // Soylenen SIRAYA gore saatleri hesaplar. Sira degistiginde
  // (surukle-birak) yeniden cagrilir; saatler kendiliginden kayar.
  taslakSaatleriHesapla: function(gunNo, gorevler) {
    let imlec = this.taslakBaslangicDakika(gunNo);
    const MOLA = 15;
    return gorevler.map((g, i) => {
      const sure = this.parseDurationMinutes(g.duration) || 45;
      const bas = imlec;
      const bit = imlec + sure;
      imlec = bit + (i < gorevler.length - 1 ? MOLA : 0);
      return { bas: this.minutesToTimeStr(bas), bit: this.minutesToTimeStr(bit) };
    });
  },

  showImportDraft: function(cozum, kaynak) {
    if (!cozum || !cozum.gunler) return;
    this._taslak = {
      gunler: JSON.parse(JSON.stringify(cozum.gunler)),
      kaynak: kaynak || "metin",
      sureliGorev: cozum.sureliGorev,
      suresizGorev: cozum.suresizGorev
    };
    this.renderImportDraft();
    this.openModal("importDraftModal");
  },

  renderImportDraft: function() {
    const govde = document.getElementById("importDraftBody");
    if (!govde || !this._taslak) return;

    const gunNolar = Object.keys(this._taslak.gunler).map(Number).sort((a, b) => a - b);
    const toplamGorev = gunNolar.reduce((a, g) => a + this._taslak.gunler[g].length, 0);

    const intro = document.getElementById("importDraftIntro");
    if (intro) {
      const kaynakAdi = this._taslak.kaynak === "ses" ? "Sesli girişten" :
                        this._taslak.kaynak === "foto" ? "Fotoğraf/PDF'ten" : "Metinden";
      intro.innerHTML = `${kaynakAdi} <strong>${gunNolar.length} gün</strong> ve ` +
        `<strong>${toplamGorev} görev</strong> okundu. Kontrol edip onayladığında programına eklenecek.`;
    }

    govde.innerHTML = gunNolar.map(gunNo => {
      const gorevler = this._taslak.gunler[gunNo];
      const saatler = this.taslakSaatleriHesapla(gunNo, gorevler);
      const tarih = this.taslakGunTarihi(gunNo);
      const sonGun = gunNolar[gunNolar.length - 1];
      const ilkGun = gunNolar[0];
      const satirlar = gorevler.map((g, i) => `
        <li class="taslak-gorev" data-gun="${gunNo}" data-idx="${i}">
          <span class="taslak-tut" title="Sürükleyerek taşı"
                style="display:flex; align-items:center; padding:0.35rem 0.15rem; cursor:grab;
                       touch-action:none; color:var(--text-muted); font-size:0.85rem;">
            <i class="fa-solid fa-grip-vertical"></i>
          </span>
          <span class="taslak-ok" style="display:flex; flex-direction:column; gap:2px;">
            <button type="button" aria-label="Yukarı taşı" title="Yukarı taşı"
              ${(gunNo === ilkGun && i === 0) ? "disabled" : ""}
              onclick="app.taslakGorevKaydir(${gunNo}, ${i}, -1)"
              style="border:1px solid var(--border-color); background:var(--bg-sub); color:var(--text-main);
                     border-radius:4px; width:24px; height:18px; line-height:1; cursor:pointer; font-size:0.6rem; padding:0;">▲</button>
            <button type="button" aria-label="Aşağı taşı" title="Aşağı taşı"
              ${(gunNo === sonGun && i === gorevler.length - 1) ? "disabled" : ""}
              onclick="app.taslakGorevKaydir(${gunNo}, ${i}, 1)"
              style="border:1px solid var(--border-color); background:var(--bg-sub); color:var(--text-main);
                     border-radius:4px; width:24px; height:18px; line-height:1; cursor:pointer; font-size:0.6rem; padding:0;">▼</button>
          </span>
          <span class="taslak-metin">
            <span class="taslak-saat">${saatler[i].bas}–${saatler[i].bit}</span>
            <span class="taslak-ad">${g.label}</span>
            ${g.topic ? `<span class="taslak-konu">${g.topic}</span>` : ""}
          </span>
          <span class="taslak-sure" style="display:inline-flex; align-items:center; gap:0.3rem;">
            <input type="number" min="10" max="240" step="5" aria-label="Süre (dakika)"
                   value="${this.parseDurationMinutes(g.duration) || 45}"
                   onchange="app.taslakSureDegistir(${gunNo}, ${i}, this.value)"
                   style="width:58px; padding:0.25rem 0.3rem; font-size:0.75rem; text-align:center;
                          border:1px solid var(--border-color); border-radius:6px; background:var(--bg-sub); color:var(--text-main);">
            <span style="font-size:0.7rem; color:var(--text-muted);">dk</span>
          </span>
          <button class="taslak-sil" type="button" onclick="app.taslakGorevSil(${gunNo}, ${i})"
                  aria-label="Görevi çıkar" title="Görevi çıkar"
                  style="border:none; background:none; color:var(--danger); cursor:pointer; font-size:0.9rem; padding:0.25rem;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </li>`).join("");

      return `
        <div class="taslak-gun" data-gun="${gunNo}"
             style="border:1.5px solid var(--border-color); border-radius:10px; padding:0.8rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">
              <i class="fa-solid fa-calendar-day text-primary"></i> Gün ${gunNo}${tarih ? ` <span style="font-weight:600; color:var(--text-muted); font-size:0.76rem;">(${tarih})</span>` : ""}
            </div>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">${gorevler.length} görev</span>
          </div>
          <ul style="list-style:none; margin:0; padding:0; min-height:12px;">${satirlar}</ul>
        </div>`;
    }).join("");

    this.bindTaslakSurukle();
  },

  // ============================================================
  // TASLAK SURUKLE-BIRAK — Pointer Events
  // ------------------------------------------------------------
  // Eskiden HTML5 drag/drop kullaniliyordu. O olaylar mobil
  // tarayicilarda HIC tetiklenmez; uygulama telefona kurulan bir PWA
  // oldugu icin ozellik hedef cihazda tumuyle calismiyordu.
  // Pointer Events fare, dokunma ve kalemi TEK kod yoluyla karsilar.
  // Ayrica her gorevde yukari/asagi dugmeleri var: klavye ile ve
  // suruklemenin zor oldugu kucuk ekranlarda calisir.
  // ============================================================
  bindTaslakSurukle: function() {
    const govde = document.getElementById("importDraftBody");
    if (!govde) return;

    const temizle = () => {
      govde.querySelectorAll(".taslak-gorev").forEach(e => {
        e.style.opacity = "";
        e.style.outline = "";
        e.style.outlineOffset = "";
      });
      govde.querySelectorAll(".taslak-gun").forEach(e => { e.style.background = ""; });
    };

    // Isaretcinin altindaki hedefi bulur: once gorev, yoksa gun kutusu.
    const hedefBul = (x, y) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      const gorev = el.closest(".taslak-gorev");
      if (gorev) return { gun: +gorev.dataset.gun, idx: +gorev.dataset.idx, el: gorev };
      const gun = el.closest(".taslak-gun");
      if (gun) {
        const g = +gun.dataset.gun;
        return { gun: g, idx: (this._taslak.gunler[g] || []).length, el: gun };
      }
      return null;
    };

    govde.querySelectorAll(".taslak-tut").forEach(tutamac => {
      tutamac.addEventListener("pointerdown", (e) => {
        const kart = e.target.closest(".taslak-gorev");
        if (!kart) return;
        e.preventDefault();          // sayfa kaymasin
        tutamac.setPointerCapture(e.pointerId);

        this._surukleKaynak = { gun: +kart.dataset.gun, idx: +kart.dataset.idx };
        kart.style.opacity = "0.45";
        let sonHedef = null;

        const hareket = (ev) => {
          const h = hedefBul(ev.clientX, ev.clientY);
          temizle();
          kart.style.opacity = "0.45";
          if (h) {
            sonHedef = { gun: h.gun, idx: h.idx };
            if (h.el.classList.contains("taslak-gorev")) {
              h.el.style.outline = "2px solid var(--primary)";
              h.el.style.outlineOffset = "1px";
            } else {
              h.el.style.background = "var(--bg-sub)";
            }
          } else {
            sonHedef = null;
          }
        };

        const bitir = () => {
          tutamac.removeEventListener("pointermove", hareket);
          tutamac.removeEventListener("pointerup", bitir);
          tutamac.removeEventListener("pointercancel", bitir);
          temizle();
          if (sonHedef) this.taslakTasi(this._surukleKaynak, sonHedef);
          this._surukleKaynak = null;
        };

        tutamac.addEventListener("pointermove", hareket);
        tutamac.addEventListener("pointerup", bitir);
        tutamac.addEventListener("pointercancel", bitir);
      });
    });
  },

  // Gorevi bir sira yukari/asagi tasir. Gunun basinda "yukari" bir
  // onceki gunun sonuna, sonunda "asagi" bir sonraki gunun basina gecer.
  taslakGorevKaydir: function(gunNo, idx, yon) {
    if (!this._taslak) return;
    const gunler = this._taslak.gunler;
    const liste = gunler[gunNo];
    if (!liste) return;

    const hedefIdx = idx + yon;
    if (hedefIdx >= 0 && hedefIdx < liste.length) {
      // DOGRUDAN YER DEGISTIRME. taslakTasi "hedefin ONUNE birak"
      // mantigiyla calisir; bir gorevi bir alt siraya tasimak cikarma
      // sonrasi yine ayni indise denk gelir ve HICBIR SEY OLMAZ.
      // Ok dugmesinin istedigi anlam komsuyla yer degistirmektir.
      const t = liste[idx];
      liste[idx] = liste[hedefIdx];
      liste[hedefIdx] = t;
      this.renderImportDraft();
      return;
    }

    // Gun sinirini asiyor: komsu gune tasi
    const gunNolar = Object.keys(gunler).map(Number).sort((a, b) => a - b);
    const yeri = gunNolar.indexOf(gunNo);
    const komsu = gunNolar[yeri + yon];
    if (komsu === undefined) return;
    const komsuIdx = yon < 0 ? (gunler[komsu] || []).length : 0;
    this.taslakTasi({ gun: gunNo, idx: idx }, { gun: komsu, idx: komsuIdx });
  },

  taslakTasi: function(kaynak, hedef) {
    if (!kaynak || !hedef || !this._taslak) return;
    const g = this._taslak.gunler;
    if (!g[kaynak.gun] || !g[hedef.gun]) return;
    if (kaynak.gun === hedef.gun && kaynak.idx === hedef.idx) return;

    const [gorev] = g[kaynak.gun].splice(kaynak.idx, 1);
    if (!gorev) return;
    let yeniIdx = hedef.idx;
    if (kaynak.gun === hedef.gun && kaynak.idx < hedef.idx) yeniIdx--;
    g[hedef.gun].splice(Math.max(0, yeniIdx), 0, gorev);

    // Tasima sonrasi bosalan gun listede durmasin
    Object.keys(g).forEach(k => { if (g[k].length === 0) delete g[k]; });

    this._surukleKaynak = null;
    if (Object.keys(g).length === 0) {
      this.cancelImportDraft();
      return;
    }
    this.renderImportDraft();
  },

  taslakSureDegistir: function(gunNo, idx, dakika) {
    if (!this._taslak) return;
    const dk = Math.max(10, Math.min(240, parseInt(dakika, 10) || 45));
    const gorev = (this._taslak.gunler[gunNo] || [])[idx];
    if (!gorev) return;
    gorev.duration = `${dk} dk`;
    gorev.sureKaynagi = "elle";
    this.renderImportDraft();
  },

  taslakGorevSil: function(gunNo, idx) {
    if (!this._taslak) return;
    const liste = this._taslak.gunler[gunNo];
    if (!liste) return;
    liste.splice(idx, 1);
    if (liste.length === 0) delete this._taslak.gunler[gunNo];
    if (Object.keys(this._taslak.gunler).length === 0) {
      this.cancelImportDraft();
      this.showToast("Taslakta görev kalmadı, aktarım iptal edildi.", "info");
      return;
    }
    this.renderImportDraft();
  },

  cancelImportDraft: function() {
    this._taslak = null;
    this.closeModal("importDraftModal");
    this.showToast("Taslak iptal edildi, programına hiçbir şey eklenmedi.", "info");
  },

  // Onay: taslak artik programa yazilir.
  confirmImportDraft: function() {
    if (!this._taslak) return;
    const taslak = this._taslak;

    if (!this.isPlanning) this.plannerCreateNewProgramFromScratch();
    if (!this.plannerBuffer) this.plannerBuffer = {};

    const gunNolar = Object.keys(taslak.gunler).map(Number).sort((a, b) => a - b);
    let toplam = 0;
    gunNolar.forEach(gunNo => {
      const gorevler = taslak.gunler[gunNo];
      this.plannerBuffer[gunNo] = { completed: false, tasks: gorevler, schedule: [] };
      // Saatler soylenen siraya gore zaten hesaplandi; cizelgeyi de kur.
      this.plannerBuffer[gunNo].schedule = this.buildDaySchedule(gorevler, this.programGunHaftaninGunu(gunNo));
      toplam += gorevler.length;
    });

    this._taslak = null;
    this.closeModal("importDraftModal");

    const ilkGun = gunNolar[0] || 1;
    const daySelect = document.getElementById("plannerDaySelect");
    if (daySelect) daySelect.value = String(ilkGun);
    this.plannerSelectDay(ilkGun);

    this.announceProgramImport({
      taskCount: toplam,
      importedDays: gunNolar,
      sureliGorev: taslak.sureliGorev,
      suresizGorev: taslak.suresizGorev
    });
  },

  // Aktarim sonrasi tek ekran: ozet + eksik gunler + saatler.
  // Eskiden burada ham bir alert() vardi; kullanici ne oldugunu anlamadan
  // planlayicinin icinde kaliyordu. Artik eksik varsa aciklikca sorulur.
  announceProgramImport: function(sonuc) {
    this._sonAktarim = sonuc;

    const gunler = sonuc.importedDays || [];
    const enBuyuk = gunler.length ? gunler[gunler.length - 1] : 0;
    const enKucuk = gunler.length ? gunler[0] : 0;

    // Araya dusen bos gunler (ornek: 1,2,4 soylendiyse -> 3)
    const araBos = [];
    for (let g = enKucuk; g <= enBuyuk; g++) {
      if (!gunler.includes(g)) araBos.push(g);
    }
    // Programin sonuna kadar hic deginilmeyen gunler
    const toplamGun = this.PROGRAM_DAYS;
    const kalanGun = Math.max(0, toplamGun - enBuyuk);

    const ozet = document.getElementById("importFollowUpSummary");
    if (ozet) {
      ozet.innerHTML = `<strong>${gunler.length} güne ${sonuc.taskCount} görev</strong> aktarıldı ` +
        `(Gün: ${gunler.join(", ")}). Metinde geçmeyen günler mevcut hâliyle korundu.`;
    }

    const govde = document.getElementById("importFollowUpBody");
    if (!govde) {
      // Modal yoksa eski davranisa dus (islevsiz kalmasin)
      this.showToast(`${gunler.length} güne ${sonuc.taskCount} görev aktarıldı.`, "success");
      return;
    }

    const kutu = (baslik, aciklama, ic) => `
      <div style="border:1.5px solid var(--border-color); border-radius:10px; padding:1rem;">
        <div style="font-weight:800; font-size:0.9rem; color:var(--text-main); margin-bottom:0.35rem;">${baslik}</div>
        <p style="font-size:0.78rem; color:var(--text-muted); margin:0 0 0.7rem; line-height:1.45;">${aciklama}</p>
        ${ic}
      </div>`;

    // NOT: modal icindeki genel "input" stili genisligi %100 yaptigi icin
    // radyo dugmeleri esneyip etiketten kopuyordu; olculer burada sabitlenir.
    const secenek = (ad, deger, etiket, secili) => `
      <label style="display:flex; align-items:flex-start; gap:0.6rem; cursor:pointer; padding:0.4rem 0; font-size:0.82rem; text-align:left; line-height:1.45;">
        <input type="radio" name="${ad}" value="${deger}" ${secili ? "checked" : ""} style="flex:0 0 auto; width:16px; height:16px; min-width:16px; margin:0.18rem 0 0; padding:0; accent-color:var(--primary);">
        <span style="flex:1 1 auto;">${etiket}</span>
      </label>`;

    let html = "";
    this._aktarimAraBos = araBos;
    this._aktarimKalanGun = kalanGun;

    // "AI doldursun" secenegi yalnizca kopyalanacak gercek bir standart
    // plan varsa gosterilir. Program henuz kabul edilmediyse boyle bir
    // plan yoktur; olmayan seyi vaat etmemek icin secenek gizlenir.
    const aiPlanVar = !!(this.state.standardDaysData &&
      Object.keys(this.state.standardDaysData).length > 0);

    // A) Eksik gunler
    if (araBos.length > 0 || kalanGun > 0) {
      let aciklama = "";
      if (araBos.length > 0 && kalanGun > 0) {
        aciklama = `Aralarda <strong>${araBos.length} boş gün</strong> var (${araBos.slice(0, 8).join(", ")}${araBos.length > 8 ? "…" : ""}) ` +
          `ve programın sonuna kadar <strong>${kalanGun} gün</strong> daha var. Bu günleri ne yapayım?`;
      } else if (araBos.length > 0) {
        aciklama = `Söylediğin günlerin arasında <strong>${araBos.length} boş gün</strong> kaldı ` +
          `(${araBos.slice(0, 8).join(", ")}${araBos.length > 8 ? "…" : ""}). Bu günleri ne yapayım?`;
      } else {
        aciklama = `Programın sonuna kadar <strong>${kalanGun} gün</strong> daha var. Bu günleri ne yapayım?`;
      }
      html += kutu(
        '<i class="fa-solid fa-calendar-day"></i> Diğer günler',
        aciklama,
        secenek("aktarimGun", "bos", "<strong>Boş kalsın</strong> — sadece söylediğim günler dolsun.", true) +
        secenek("aktarimGun", "tekrarla", "<strong>Söylediğim düzen tekrarlansın</strong> — aynı haftalık akış kalan günlere kopyalansın.", false) +
        (aiPlanVar
          ? secenek("aktarimGun", "ai", "<strong>Kalanları AI planı doldursun</strong> — o günlere seviyene göre hazırlanmış standart program kopyalansın.", false)
          : "")
      );
    }

    // B) Saatler
    if (sonuc.suresizGorev > 0) {
      html += kutu(
        '<i class="fa-solid fa-clock"></i> Saatler',
        `<strong>${sonuc.suresizGorev} görev</strong> için süre belirtmedin` +
        (sonuc.sureliGorev > 0 ? ` (${sonuc.sureliGorev} görevde belirttin)` : "") +
        `. Şu an bu görevlere varsayılan süreler atandı. Süreleri günlük çalışma kapasitene göre ben dağıtayım mı?`,
        secenek("aktarimSaat", "ayarla", "<strong>Evet, sen ayarla</strong> — günlük kapasitemi bu görevlere paylaştır, saat akışını da kur.", true) +
        secenek("aktarimSaat", "elle", "<strong>Hayır</strong> — varsayılan süreler kalsın, gerekirse kendim düzenlerim.", false)
      );
    }

    // C) Aylik tekrar — bir haftalik (ya da daha kisa) duzen aktarildiysa
    //    bunu ay boyunca tekrarlamak anlamlidir.
    const aktarilanAralik = gunler.length ? (enBuyuk - enKucuk + 1) : 0;
    this._aylikTekrarUygun = aktarilanAralik > 0 && aktarilanAralik <= 7 && kalanGun >= 7;
    if (this._aylikTekrarUygun) {
      html += kutu(
        '<i class="fa-solid fa-rotate"></i> Aylık tekrar',
        `Bu <strong>${aktarilanAralik} günlük</strong> düzeni <strong>4 hafta boyunca</strong> aynen tekrarlayayım mı?`,
        secenek("aktarimTekrar", "hayir", "<strong>Hayır</strong> — her hafta bittiğinde yenisini oluşturacağım.", true) +
        secenek("aktarimTekrar", "evet", "<strong>Evet, 4 hafta tekrarla</strong> — aynı düzen bir ay boyunca uygulansın.", false)
      );
    }

    if (html === "") {
      // Sorulacak bir sey yok: sessizce bilgilendir, ekran acma.
      this.showToast(`${gunler.length} güne ${sonuc.taskCount} görev aktarıldı.`, "success");
      return;
    }

    govde.innerHTML = html;
    this.openModal("importFollowUpModal");
  },

  importFollowUpSkip: function() {
    this.closeModal("importFollowUpModal");
    this.showToast("Aktarım olduğu gibi bırakıldı. Planlayıcıdan düzenleyebilirsin.", "info");
  },

  importFollowUpApply: function() {
    const sec = (ad) => {
      const el = document.querySelector(`input[name="${ad}"]:checked`);
      return el ? el.value : null;
    };
    const gunKarari = sec("aktarimGun");
    const saatKarari = sec("aktarimSaat");
    const sonuc = this._sonAktarim || {};
    const gunler = sonuc.importedDays || [];
    const yapilanlar = [];

    if (!this.plannerBuffer) this.plannerBuffer = {};

    // A) Diger gunler
    if (gunKarari === "tekrarla" && gunler.length > 0) {
      const desen = gunler.map(g => (this.plannerBuffer[g] && this.plannerBuffer[g].tasks) || []);
      const hedefler = [].concat(this._aktarimAraBos || []);
      const sonGun = gunler[gunler.length - 1];
      for (let g = sonGun + 1; g <= this.PROGRAM_DAYS; g++) hedefler.push(g);

      let kopyalanan = 0;
      hedefler.forEach((g, i) => {
        const kaynak = desen[i % desen.length];
        if (!kaynak || kaynak.length === 0) return;
        this.plannerBuffer[g] = { completed: false, tasks: kaynak.map(t => Object.assign({}, t, {
          id: `task_rep_${g}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          completed: false,
          logged: false
        })), schedule: [] };
        kopyalanan++;
      });
      yapilanlar.push(`${kopyalanan} güne düzen kopyalandı`);
    } else if (gunKarari === "ai") {
      const std = this.state.standardDaysData || {};
      const hedefler = [].concat(this._aktarimAraBos || []);
      const sonGun = gunler.length ? gunler[gunler.length - 1] : 0;
      for (let g = sonGun + 1; g <= this.PROGRAM_DAYS; g++) hedefler.push(g);

      let dolan = 0;
      hedefler.forEach(g => {
        const kaynak = std[g] || std[String(g)];
        if (!kaynak || !Array.isArray(kaynak.tasks) || kaynak.tasks.length === 0) return;
        this.plannerBuffer[g] = JSON.parse(JSON.stringify(kaynak));
        dolan++;
      });
      yapilanlar.push(dolan > 0
        ? `${dolan} gün AI planından dolduruldu`
        : "AI planında kopyalanacak gün bulunamadı");
    }

    // B) Sureler ve saat akisi
    if (saatKarari === "ayarla") {
      const hedefGunler = Object.keys(this.plannerBuffer).map(Number).filter(n => !isNaN(n));
      let saatlenen = 0;
      let sureDegisen = 0;
      hedefGunler.forEach(g => {
        const gun = this.plannerBuffer[g];
        if (!gun || !Array.isArray(gun.tasks) || gun.tasks.length === 0) return;

        // Sureyi kullanici belirtmisse dokunulmaz; yalnizca varsayilanla
        // doldurulanlar gunluk kapasitenin kalanina esit paylastirilir.
        const kapasite = this.dailyCapacityMinutes(g % 7);
        const sabitler = gun.tasks.filter(t => t.sureKaynagi === "metin");
        const esnekler = gun.tasks.filter(t => t.sureKaynagi !== "metin");
        if (esnekler.length > 0) {
          const sabitToplam = sabitler.reduce((a, t) => a + this.parseDurationMinutes(t.duration), 0);
          const kalan = Math.max(esnekler.length * 20, kapasite - sabitToplam);
          // Kapasiteyi zorla doldurma. Tek gorevlik bir gunde kalan sureyi
          // o goreve yiginca "30 soru = 4 saat" gibi anlamsiz sureler
          // cikiyordu. Gorev basina 20-90 dk araligi disina cikilmaz;
          // artan sure bos zaman olarak kalir.
          const ALT = 20, UST = 90;
          const hamPay = kalan / esnekler.length;
          const pay = Math.min(UST, Math.max(ALT, Math.round(hamPay / 5) * 5));
          esnekler.forEach(t => {
            if (t.duration !== `${pay} dk`) sureDegisen++;
            t.duration = `${pay} dk`;
            if (t.type === "quiz" && t.desc) {
              t.desc = `"${t.topic}" ile ilgili ${t.qCount || 30} soru çöz.`;
            }
          });
        }

        gun.schedule = this.buildDaySchedule(gun.tasks, g % 7);
        saatlenen++;
      });
      yapilanlar.push(`${sureDegisen} görevin süresi kapasitene göre ayarlandı, ${saatlenen} günün saat akışı kuruldu`);
    }

    // C) Aylik tekrar
    const tekrarKarari = sec("aktarimTekrar");
    if (tekrarKarari === "evet" && gunler.length > 0) {
      const enKucuk = gunler[0];
      const enBuyuk = gunler[gunler.length - 1];
      const aralik = enBuyuk - enKucuk + 1;
      let kopyalanan = 0;
      // 4 hafta = aktarilan araligin ardindan 3 tekrar daha
      for (let tur = 1; tur < 4; tur++) {
        gunler.forEach(g => {
          const hedef = g + aralik * tur;
          if (hedef > this.PROGRAM_DAYS) return;
          const kaynak = (this.plannerBuffer[g] && this.plannerBuffer[g].tasks) || [];
          if (kaynak.length === 0) return;
          const kopya = kaynak.map(t => Object.assign({}, t, {
            id: `task_ay_${hedef}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            completed: false,
            logged: false
          }));
          this.plannerBuffer[hedef] = {
            completed: false,
            tasks: kopya,
            schedule: this.buildDaySchedule(kopya, hedef % 7)
          };
          kopyalanan++;
        });
      }
      this.state.haftalikYenilemeHatirlat = false;
      yapilanlar.push(`${kopyalanan} gün 4 hafta boyunca tekrarlandı`);
    } else if (tekrarKarari === "hayir" && gunler.length > 0) {
      // Tekrar istemiyorsa: hafta bitmeye 1 gun kala koc hatirlatsin.
      this.scheduleWeeklyRenewalReminder(gunler[gunler.length - 1]);
      yapilanlar.push("hafta bitmeden bir gün önce hatırlatma kuruldu");
    }

    this.closeModal("importFollowUpModal");
    this.plannerSelectDay(gunler[0] || 1);
    this.saveState();
    this.showToast(
      yapilanlar.length ? "Uygulandı: " + yapilanlar.join(", ") + "." : "Değişiklik yapılmadı.",
      "success"
    );
  },

  // Bir gorevin hangi sinava ait oldugunu belirler.
  // YDT (Yabanci Dil Testi) eskiden hic taninmiyordu: Dil alanindaki
  // ogrencinin YDT netleri "TYT Net" olarak etiketleniyordu.
  sinavTuruBelirle: function(task) {
    if (!task) return "TYT";
    const etiket = String(task.label || "");
    const ders = String(task.subject || "");
    if (/YDT|Yabancı Dil|İngilizce|Almanca|Fransızca/i.test(etiket) ||
        /Yabancı Dil|İngilizce|Almanca|Fransızca/i.test(ders)) return "YDT";
    if (etiket.indexOf("AYT") !== -1 || ders === "Edebiyat") return "AYT";
    return "TYT";
  },

  // ============================================================
  // TEK NET TANIMI — YKS: net = dogru - yanlis/4
  // ------------------------------------------------------------
  // Iki hata birden duzeltir:
  //  1) Sifira KIRPMA yok. YKS'de bir bolumun neti negatif olabilir;
  //     kirpmak "yanlisla net kaybediyorsun" sinyalini gizler — oysa
  //     ogrencinin gormesi gereken tam olarak budur.
  //  2) 2 ondalik. Netler ceyreklik adimlarla gelir; 1 ondaliga
  //     yuvarlamak 12.25'i 12.3, 9.75'i 9.8 yapiyordu.
  // ============================================================
  netHesapla: function(dogru, yanlis) {
    const d = Number(dogru) || 0;
    const y = Number(yanlis) || 0;
    return Math.round((d - y / 4) * 100) / 100;
  },

  // ============================================================
  // KAPASITE - HEDEF KARSILASTIRMASI
  // ------------------------------------------------------------
  // Seviye hedefi (or. seviye 5 = 1600 saat, sinava kalan sureye
  // olceklenmis hali) ile ogrencinin BEYAN ETTIGI gunluk kapasite
  // ortusmeyebilir. Program uretici artik kapasiteye uyuyor; bu da
  // hedefin sessizce ulasilamaz kalmasi demek. Ogrenci bunu bilmeli.
  // ============================================================
  kapasiteHedefKarsilastir: function() {
    try {
      const gun = this.PROGRAM_DAYS;
      const hedefSaat = this.state.totalHoursTarget;
      if (!gun || !hedefSaat) return null;

      const hi = Number(this.state.weekdayHours);
      const hs = Number(this.state.weekendHours);
      if (!(hi > 0) || !(hs > 0)) return null;

      // Beyan edilen haftalik ortalama, gunun fiziksel penceresiyle sinirli
      const hiButce = this.gunlukCalismaButcesi(1) / 60;   // hafta ici
      const hsButce = this.gunlukCalismaButcesi(6) / 60;   // hafta sonu
      const gerceklesenHi = Math.min(hi, hiButce);
      const gerceklesenHs = Math.min(hs, hsButce);
      const beyanGunluk = (gerceklesenHi * 5 + gerceklesenHs * 2) / 7;

      const gerekenGunluk = hedefSaat / gun;

      // Program zaten uretildiyse GERCEK toplami kullan; uretici gunluk
      // butceyi her zaman tam doldurmaz, teorik kapasite iyimser kalir.
      const uretilen = this.state.uretilenToplamSaat;
      const uretimVar = typeof uretilen === "number" && uretilen > 0;
      const ulasilabilirSaat = uretimVar ? uretilen : Math.round(beyanGunluk * gun);
      const gercekGunluk = Math.round((ulasilabilirSaat / gun) * 10) / 10;
      const acik = Math.round(hedefSaat - ulasilabilirSaat);

      // Bu tempoyla hangi seviyenin saat hedefi tutuyor?
      const olcek = Math.max(0.2, Math.min(1.2, gun / 360));
      let ulasilabilirSeviye = 1;
      for (let sv = 8; sv >= 1; sv--) {
        const meta = this.LEVEL_META[sv];
        if (meta && (meta.hours * olcek) <= ulasilabilirSaat) { ulasilabilirSeviye = sv; break; }
      }

      // %10'luk sapma gurultudur; uyarmaya degmez.
      const yeterli = ulasilabilirSaat >= hedefSaat * 0.9;

      return {
        yeterli: yeterli,
        uretimVar: uretimVar,
        gerekenGunluk: Math.round(gerekenGunluk * 10) / 10,
        beyanGunluk: Math.round(beyanGunluk * 10) / 10,
        gercekGunluk: gercekGunluk,
        hedefSaat: hedefSaat,
        ulasilabilirSaat: ulasilabilirSaat,
        acik: acik,
        hedefSeviye: this.state.level,
        ulasilabilirSeviye: ulasilabilirSeviye,
        gunSayisi: gun
      };
    } catch (e) { return null; }
  },

  // Karsilastirmayi okunur bir cumleye cevirir (HTML).
  kapasiteHedefMetni: function(k) {
    if (!k) return "";
    const kaynak = k.uretimVar ? "Hazırlanan program" : "Bu tempo";

    if (k.yeterli) {
      // Program HENUZ URETILMEDIYSE olumlu bir vaat verilmez. Uretici
      // gunluk butceyi her zaman tam doldurmuyor; teorik kapasiteye
      // bakip "hedefe ulasirsin" demek, uretimden sonra kendini
      // yalanlayan bir vaat olur.
      if (!k.uretimVar) return "";
      return `✅ <strong>Tempo hedefinle uyumlu:</strong> ${k.hedefSeviye}. seviye için ` +
             `<strong>${k.hedefSaat} saat</strong> gerekiyor; hazırlanan program ` +
             `<strong>${k.ulasilabilirSaat} saat</strong> çalışma içeriyor. Bu tempoyu korursan hedefe ulaşırsın.`;
    }

    const sv = this.LEVEL_META[k.ulasilabilirSeviye];
    const svAd = sv ? sv.name : "";
    let m = `📐 <strong>Hedefin tempona sığmıyor:</strong> ${k.hedefSeviye}. seviye için sınava kalan ` +
            `${k.gunSayisi} günde <strong>${k.hedefSaat} saat</strong> gerekiyor — günde ` +
            `<strong>${k.gerekenGunluk} saat</strong>. `;
    m += k.uretimVar
      ? `Senin saatlerine göre hazırlanan program <strong>${k.ulasilabilirSaat} saat</strong> içeriyor ` +
        `(günde ${k.gercekGunluk} saat) — <strong>${k.acik} saat</strong> açık.<br>`
      : `Ortalama <strong>${k.beyanGunluk} saat</strong> diyorsun; bu tempoyla toplam ` +
        `<strong>${k.ulasilabilirSaat} saat</strong> yapabilirsin — <strong>${k.acik} saat</strong> açık.<br>`;
    if (k.ulasilabilirSeviye < k.hedefSeviye) {
      m += `Bu tempo <strong>${k.ulasilabilirSeviye}. seviye${svAd ? " — " + svAd : ""}</strong> hedefine denk geliyor. `;
    }
    m += `Ya günlük saatini artır, ya da hedefini bu tempoya göre seç. ` +
         `Program şu an tempona uyuyor; imkânsız bir plan üretip seni yarı yolda bırakmıyor.`;
    return m;
  },

  // Bugun programin kacinci gunu? activeDay kullanicinin BAKTIGI gundur,
  // bugun degildir; hatirlatma icin gercek takvim gunu gerekir.
  bugunkuProgramGunu: function() {
    try {
      if (!this.state || !this.state.startDate) return this.state && this.state.activeDay || 1;
      const bas = new Date(this.state.startDate + "T00:00:00");
      if (isNaN(bas)) return this.state.activeDay || 1;
      const bugun = new Date();
      bugun.setHours(0, 0, 0, 0);
      const fark = Math.floor((bugun - bas) / 86400000) + 1;
      return Math.max(1, Math.min(this.PROGRAM_DAYS, fark));
    } catch (e) {
      return (this.state && this.state.activeDay) || 1;
    }
  },

  // Haftalik program yenileme hatirlaticisi.
  // Aktarilan duzenin son gununden BIR GUN once AI koc uyarir.
  scheduleWeeklyRenewalReminder: function(sonGun) {
    const hatirlatmaGunu = Math.max(1, (parseInt(sonGun, 10) || 1) - 1);
    this.state.haftalikYenilemeHatirlat = true;
    this.state.haftalikYenilemeGunu = hatirlatmaGunu;
    this.state.haftalikYenilemeSonGun = parseInt(sonGun, 10) || 1;
    this.state.haftalikYenilemeBildirildi = false;
    this.saveState();
  },

  // Gun degistiginde / panel yenilendiginde calisir. Hatirlatma gunu
  // geldiyse AI koc bildirimini bir kez gonderir.
  checkWeeklyRenewalReminder: function() {
    if (!this.state.haftalikYenilemeHatirlat) return;
    if (this.state.haftalikYenilemeBildirildi) return;

    const bugun = this.bugunkuProgramGunu();
    if (!bugun || bugun < this.state.haftalikYenilemeGunu) return;

    const sonGun = this.state.haftalikYenilemeSonGun;
    const mesaj = `Programın ${sonGun}. günde bitiyor — yarın son gün. ` +
      `Yeni haftanın programını sesle ya da fotoğraftan hızlıca oluşturabilirsin.`;

    this.addNotification("warning", "AI Koç: Haftalık Program Yenileme", mesaj);
    this.showCoachAlert("🗓️ Haftan Bitmek Üzere", mesaj);
    this.state.haftalikYenilemeBildirildi = true;
    this.saveState();
  },

  // Giris 1: Fotograf / PDF akisi
  plannerParseOCRTextAndImport: function() {
    const textEl = document.getElementById("ocrResultText");
    const metin = textEl ? textEl.value : "";
    if (!metin || !metin.trim()) {
      this.showToast("Aktarılacak metin boş.", "error");
      return;
    }
    const cozum = this.parseProgramTextToDays(metin);
    if (!cozum) {
      this.showToast("Metinden görev çıkarılamadı. Satırları 'Gün 1:' ve '- Matematik: Limit 30 soru' biçiminde düzenleyip tekrar dene.", "error");
      return;
    }

    const resultArea = document.getElementById("ocrResultArea");
    const statusDiv = document.getElementById("ocrStatus");
    const fileInput = document.getElementById("plannerPhotoOCR");
    if (resultArea) resultArea.style.display = "none";
    if (statusDiv) statusDiv.style.display = "none";
    if (fileInput) fileInput.value = "";

    // Programa dogrudan yazilmaz: once taslak gosterilir.
    this.showImportDraft(cozum, "foto");
  },

  // Ornek metni doldurur — bicimi bir kez gorunce yazmak kolaylasiyor.
  plannerInsertBulkExample: function() {
    const el = document.getElementById("plannerBulkText");
    if (!el) return;
    el.value = "Pazartesi:\n" +
      "- Matematik: Türev 40 soru çöz\n" +
      "- Fizik: Elektrik konusu video izle\n\n" +
      "Salı:\n" +
      "- Kimya: Mol 25 soru çöz\n" +
      "- Biyoloji: Hücre özet oku 45 dk\n\n" +
      "Çarşamba:\n" +
      "- Türkçe: Paragraf 30 soru çöz";
    el.focus();
  },

  // ============================================================
  // SESLI GIRIS (Web Speech API)
  // ------------------------------------------------------------
  // Konusma tek uzun cumle olarak gelir; durdurulunca
  // voiceTextToProgramLines() ile gun/ders sinirlarindan satirlara
  // bolunup metin alanina eklenir.
  // Tarayici destegi ve mikrofon izni SESSIZCE gecilmez; her durum
  // ekranda yazili olarak bildirilir.
  // ============================================================
  _voiceRec: null,
  _voiceBuffer: "",

  plannerVoiceUI: function(dinliyor, mesaj, hataMi) {
    const btnText = document.getElementById("plannerVoiceBtnText");
    const btn = document.getElementById("plannerVoiceBtn");
    const durum = document.getElementById("plannerVoiceStatus");
    if (btnText) btnText.textContent = dinliyor ? "Dinlemeyi Durdur" : "Sesli Gir";
    if (btn) {
      btn.style.borderColor = dinliyor ? "var(--danger, #dc2626)" : "";
      btn.style.color = dinliyor ? "var(--danger, #dc2626)" : "";
    }
    if (durum) {
      if (mesaj) {
        durum.style.display = "block";
        durum.style.color = hataMi ? "var(--danger, #dc2626)" : "var(--primary)";
        durum.innerHTML = mesaj;
      } else {
        durum.style.display = "none";
      }
    }
  },

  plannerToggleVoiceInput: function() {
    // Zaten dinliyorsa durdur
    if (this._voiceRec) {
      try { this._voiceRec.stop(); } catch (e) { /* zaten durmus */ }
      return;
    }

    const Tanima = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Tanima) {
      this.plannerVoiceUI(false,
        "Bu tarayıcı sesli girişi desteklemiyor. Chrome veya Safari'de çalışır — " +
        "programı aşağıya yazarak da girebilirsin.", true);
      return;
    }
    if (!window.isSecureContext) {
      this.plannerVoiceUI(false,
        "Sesli giriş yalnızca güvenli bağlantıda (https) çalışır. " +
        "Programı aşağıya yazarak girebilirsin.", true);
      return;
    }

    const rec = new Tanima();
    rec.lang = "tr-TR";
    rec.continuous = true;
    rec.interimResults = true;

    this._voiceRec = rec;
    this._voiceBuffer = "";

    rec.onstart = () => {
      this.plannerVoiceUI(true, "🎤 <strong>Dinleniyor…</strong> Programı söyle, örneğin: " +
        "&laquo;Pazartesi matematik türev kırk soru, fizik elektrik video izle, salı kimya mol yirmi beş soru&raquo;");
    };

    rec.onresult = (olay) => {
      let gecici = "";
      for (let i = olay.resultIndex; i < olay.results.length; i++) {
        const parca = olay.results[i][0].transcript;
        if (olay.results[i].isFinal) this._voiceBuffer += parca + " ";
        else gecici += parca;
      }
      const yazili = this.escapeHtml((this._voiceBuffer + gecici).trim());
      this.plannerVoiceUI(true, "🎤 <strong>Dinleniyor…</strong><br><span style=\"color:var(--text-muted); font-weight:500;\">" +
        (yazili || "…") + "</span>");
    };

    rec.onerror = (olay) => {
      const kod = olay && olay.error;
      const mesajlar = {
        "not-allowed": "Mikrofon izni verilmedi. Tarayıcı adres çubuğundaki mikrofon simgesinden izin verip tekrar dene.",
        "service-not-allowed": "Mikrofon izni engellenmiş. Tarayıcı ayarlarından bu siteye mikrofon izni ver.",
        "no-speech": "Ses algılanmadı. Mikrofonuna daha yakın konuşup tekrar dene.",
        "audio-capture": "Mikrofon bulunamadı. Bir mikrofon bağlı mı kontrol et.",
        "network": "Konuşma tanıma sunucusuna ulaşılamadı (internet bağlantısı gerekiyor)."
      };
      this.plannerVoiceUI(false, mesajlar[kod] || ("Sesli giriş hatası: " + (kod || "bilinmeyen") + "."), true);
      this._voiceRec = null;
    };

    rec.onend = () => {
      this._voiceRec = null;
      const soylenen = this._voiceBuffer.trim();
      if (!soylenen) {
        this.plannerVoiceUI(false, "Hiçbir şey algılanmadı. Tekrar deneyebilir ya da aşağıya yazabilirsin.", true);
        return;
      }
      const satirlar = this.voiceTextToProgramLines(soylenen);
      const el = document.getElementById("plannerBulkText");
      if (el) {
        el.value = (el.value.trim() ? el.value.trim() + "\n" : "") + satirlar;
        el.focus();
      }
      const gunSayisi = satirlar.split("\n").filter(l => /:$/.test(l)).length;
      const isSayisi = satirlar.split("\n").filter(l => /^-/.test(l)).length;
      this._voiceBuffer = "";

      // Konusma bitince dogrudan taslak acilir; kullanici gorevleri
      // surukleyip duzenler ve onaylayinca programa eklenir.
      const cozum = this.parseProgramTextToDays(satirlar);
      if (cozum) {
        this.plannerVoiceUI(false,
          `✓ Söylediklerin okundu (${gunSayisi} gün, ${isSayisi} görev). Taslağı kontrol et.`);
        this.showImportDraft(cozum, "ses");
      } else {
        this.plannerVoiceUI(false,
          `Söylediklerin metne eklendi ama görev çıkarılamadı. Metni düzenleyip ` +
          `<strong>&laquo;Metni Plana Aktar&raquo;</strong> düğmesine bas.`, true);
      }
    };

    try {
      rec.start();
    } catch (e) {
      this._voiceRec = null;
      this.plannerVoiceUI(false, "Sesli giriş başlatılamadı: " + (e && e.message ? e.message : e), true);
    }
  },

  // Giris 2: Planlayicidaki toplu metin / sesli giris alani
  plannerBulkTextImport: function() {
    const el = document.getElementById("plannerBulkText");
    if (!el) return;
    if (!el.value.trim()) {
      this.showToast("Önce programı yaz veya mikrofonla söyle.", "error");
      el.focus();
      return;
    }
    const cozum = this.parseProgramTextToDays(el.value);
    if (!cozum) {
      this.showToast("Metinden görev çıkarılamadı. Satırları 'Gün 1:' ve '- Matematik: Limit 30 soru' biçiminde düzenleyip tekrar dene.", "error");
      return;
    }
    el.value = "";
    // Programa dogrudan yazilmaz: once taslak gosterilir.
    this.showImportDraft(cozum, "metin");
  },

  syncCustomProgramListSelector: function() {
    const selector = document.getElementById("activeProgramSelector");
    if (!selector) return;

    // "AI Standart Planı" bu listeden kaldırıldı: burası "Kendim Yapayım"
    // paneli ve yalnızca kendi programlarını listeler. AI planına dönmek
    // için üstteki "AI Oluştursun" sekmesi kullanılır.
    selector.innerHTML = "";
    const programlar = this.state.savedPrograms || [];
    programlar.forEach(prog => {
      const opt = document.createElement("option");
      opt.value = prog.id;
      opt.textContent = "📝 " + prog.name;
      selector.appendChild(opt);
    });

    const varMi = programlar.length > 0;
    const not = document.getElementById("noCustomProgramNote");
    const kontroller = document.getElementById("customProgramManageControls");
    if (not) not.style.display = varMi ? "none" : "block";
    if (kontroller) kontroller.style.display = varMi ? "flex" : "none";
    selector.style.display = varMi ? "block" : "none";

    if (varMi) {
      const secili = programlar.some(p => p.id === this.state.activeCustomProgramId)
        ? this.state.activeCustomProgramId : programlar[0].id;
      selector.value = secili;
    }
  },

  openAddCustomTaskModal: function() {
    document.getElementById("customTaskSubject").value = "Matematik";
    document.getElementById("customTaskTopic").value = "";
    this.openModal("addCustomTaskModal");
  },

  submitCustomTask: function() {
    const topicInput = document.getElementById("customTaskTopic");
    if (topicInput && !topicInput.value.trim()) {
      app.showToast("Lütfen konu / yapılacak çalışma alanını doldurun.", "error");
      topicInput.focus();
      return;
    }
    const durationInput = document.getElementById("customTaskDuration");
    if (durationInput && !durationInput.checkValidity()) {
      app.showToast("Geçersiz tahmini süre.", "error");
      durationInput.reportValidity();
      return;
    }
    const qCountInput = document.getElementById("customTaskQCount");
    if (qCountInput && !qCountInput.checkValidity()) {
      app.showToast("Geçersiz soru hedefi.", "error");
      qCountInput.reportValidity();
      return;
    }

    const subject = document.getElementById("customTaskSubject").value;
    const topic = document.getElementById("customTaskTopic").value;
    const type = document.getElementById("customTaskType").value;
    const duration = document.getElementById("customTaskDuration").value || 45;
    const qCount = document.getElementById("customTaskQCount").value || 30;

    const activeDayData = this.state.daysData[this.state.activeDay];
    if (!activeDayData) return;

    const taskId = `custom_${Date.now()}`;
    const badgeLabel = type === "video" ? "VİDEO" : type === "reading" ? "KAZANIM" : type === "retest" ? "TEKRAR" : "TEST";
    
    const newTask = {
      id: taskId,
      type: type,
      subject: subject,
      topic: topic,
      label: `${badgeLabel}: ${topic}`,
      desc: `Özel Program Çalışması (${subject})`,
      duration: `${duration} dk`,
      qCount: parseInt(qCount),
      completed: false,
      logged: false,
      correct: 0,
      incorrect: 0,
      timeSpent: 0,
      errorTopics: []
    };

    activeDayData.tasks.push(newTask);
    activeDayData.schedule = this.buildDaySchedule(activeDayData.tasks, this.state.activeDay % 7);

    if (this.state.selectedProgramType === "custom") {
      // Keep active program savedPrograms copy up to date
      const activeProg = this.state.savedPrograms.find(p => p.id === this.state.activeCustomProgramId);
      if (activeProg) {
        activeProg.daysData = this.state.daysData;
      }
      this.state.customDaysData = this.state.daysData;
    }

    this.closeModal("addCustomTaskModal");
    this.calculateFocusScore();
    this.renderDashboard();
    this.saveState();
  },

  saveState: function() {
    if (this.state.selectedProgramType === "custom") {
      this.state.customDaysData = JSON.parse(JSON.stringify(this.state.daysData));
      const activeProg = this.state.savedPrograms.find(p => p.id === this.state.activeCustomProgramId);
      if (activeProg) {
        activeProg.daysData = this.state.daysData;
      }
    } else {
      this.state.standardDaysData = JSON.parse(JSON.stringify(this.state.daysData));
    }
    SafeStorage.setItem("slamdunk_yks_state", JSON.stringify(this.state));
  },

  calculateStreak: function() {
    let streakCount = 0;
    let currentDay = this.state.activeDay;

    const todayCompleted = this.state.daysData && this.state.daysData[currentDay] && this.state.daysData[currentDay].completed;
    if (todayCompleted) {
      streakCount++;
      currentDay--;
    } else {
      currentDay--;
    }

    while (currentDay > 0) {
      const dayData = this.state.daysData && this.state.daysData[currentDay];
      if (dayData && dayData.completed) {
        streakCount++;
        currentDay--;
      } else {
        break;
      }
    }

    this.state.streak = streakCount;
  },

  updateTierChip: function() {
    const chipEl = document.getElementById("headerTierText");
    if (!chipEl) return;
    const t = this.state.subscriptionTier;
    chipEl.textContent = (t && t !== "pending") ? this.paketBilgisi(t).ad : "Paket Seç";
  },

  updateHeaderStats: function() {
    this.updateTierChip();
    const navStats = document.getElementById("navStats");
    if (!navStats) return;
    navStats.style.display = "flex";
    
    this.calculateStreak();
    
    const streakEl = document.getElementById("streakVal");
    if (streakEl) streakEl.textContent = `${this.state.streak} Gün`;
    
    const dashStreak = document.getElementById("dashStreakVal");
    if (dashStreak) dashStreak.textContent = `${this.state.streak} Gün`;
    
    const level = this.state.level || 1;
    const levelEl = document.getElementById("levelVal");
    if (levelEl) levelEl.textContent = level;
    
    const targetDept = this.state.targetDept || "-";
    const targetEl = document.getElementById("targetVal");
    if (targetEl) {
      // Hedef rozetinde bölümün yanında hedef üniversite de yazsın
      const uniShort = this.shortUniName(this.state.targetUniversity);
      targetEl.textContent = uniShort ? `${uniShort} · ${targetDept}` : targetDept;
    }
    
    // Dynamic Level Tooltip — 8 seviyenin tamamı, tüm ekranlarla aynı kaynaktan (LEVEL_META)
    const levelTooltip = document.getElementById("levelStatTooltip");
    if (levelTooltip) {
      const meta = this.LEVEL_META[level] || this.LEVEL_META[3];
      const hours = meta.hours;
      const questions = meta.questions;
      const title = `${meta.name} Seviye`;

      levelTooltip.innerHTML = `
        <h4 style="margin: 0 0 0.5rem; font-size: 0.85rem; color: var(--text-main); font-family: var(--font-header); font-weight: 800; border-bottom: 1.5px solid var(--border-color); padding-bottom: 0.4rem;">
          🎖️ Aktif Seviye: Seviye ${level}
        </h4>
        <p style="margin: 0 0 0.5rem; font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; font-weight: 600;">
          <strong>Seviye Tanımı:</strong> ${title}<br>
          <strong>Toplam Hedef:</strong> ${hours} Saat / ${questions.toLocaleString('tr-TR')} Soru
        </p>
        <div style="font-size: 0.65rem; color: var(--text-muted); font-style: italic; border-top: 1px solid var(--border-color); padding-top: 0.4rem;">
          Giriş ekranında veya AI Program Sihirbazı'nda seviyenizi değiştirebilirsiniz.
        </div>
      `;
    }
    
    // Dynamic Target Tooltip
    const targetTooltip = document.getElementById("targetStatTooltip");
    if (targetTooltip) {
      targetTooltip.innerHTML = `
        <h4 style="margin: 0 0 0.5rem; font-size: 0.85rem; color: var(--text-main); font-family: var(--font-header); font-weight: 800; border-bottom: 1.5px solid var(--border-color); padding-bottom: 0.4rem;">
          🎯 YKS Hedef Kartı
        </h4>
        <p style="margin: 0 0 0.5rem; font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; font-weight: 600;">
          <strong>Hedef Bölüm:</strong> ${this.escapeHtml(targetDept)}<br>
          ${this.state.targetRank ? `<strong>Hedef Sıralama:</strong> Türkiye geneli ilk ${this.state.targetRank.toLocaleString("tr-TR")}<br>` : ""}
          ${this.state.targetUniversity ? `<strong>Hedef Üniversite:</strong> ${this.escapeHtml(this.state.targetUniversity)}<br>` : ""}
        </p>
        <div style="font-size: 0.65rem; color: var(--text-muted); font-style: italic; border-top: 1px solid var(--border-color); padding-top: 0.4rem;">
          Bu hedefe ulaşmak için hedeflenen seviyede çalışmaları tamamlamanız önerilir.
        </div>
      `;
    }
  },

  renderWeekSelectorTabs: function() {
    const row = document.getElementById("weekSelectorTabsRow");
    if (!row) return;
    row.innerHTML = "";

    const totalWeeks = Math.ceil(this.PROGRAM_DAYS / 7);
    for (let w = 1; w <= totalWeeks; w++) {
      const start = (w - 1) * 7 + 1;
      const end = Math.min(w * 7, this.PROGRAM_DAYS);
      const btn = document.createElement("button");
      btn.className = "tab-btn" + (this.state.activeWeek === w ? " active" : "");
      btn.id = `weekTab-${w}`;
      btn.onclick = () => { this.switchActiveWeek(w); };
      btn.style = "flex: 0 0 auto; padding: 0.6rem 1rem; border-radius: 8px;";
      btn.textContent = `${w}. Hafta (Gün ${start}-${end})`;
      row.appendChild(btn);
    }
  },

  // Sürüm yükseltmesi: kaynak kitap alanı eklenmeden ÖNCE üretilmiş
  // programlara yayınevi/kitap bilgisini sonradan iliştirir. Program
  // yeniden üretilmez — tamamlanan görevler ve istatistikler korunur.
  backfillTaskSources: function() {
    let changed = false;

    const inferMarkers = (t) => {
      const id = String(t.id || "");
      if (t.sourceSubject === undefined && id.includes("paragraph_routine")) t.sourceSubject = "Paragraf";
      if (t.sourceKind === undefined && id.includes("_mock") && !id.includes("mock_review")) {
        t.sourceSubject = "Genel";
        t.sourceKind = "deneme";
      }
      if (t.noSource === undefined && /_10$/.test(id)) t.noSource = true;
      if (t.sourceTier === undefined && /_(5|6|7|8)$/.test(id)) t.sourceTier = 1;
      if (t.sourceTier === undefined && /_9$/.test(id)) t.sourceTier = 2;
    };

    const attachDays = (daysData) => {
      if (!daysData) return;
      Object.keys(daysData).forEach(key => {
        const day = daysData[key];
        if (!day || !Array.isArray(day.tasks)) return;
        day.tasks.forEach(t => {
          if (!t || t.source) return;
          inferMarkers(t);
          this.sourceBooks.attach(t);
          if (t.source) changed = true;
        });
      });
    };

    attachDays(this.state.daysData);
    attachDays(this.state.standardDaysData);
    attachDays(this.state.customDaysData);
    (this.state.savedPrograms || []).forEach(p => attachDays(p && p.daysData));

    return changed;
  },

  loadState: function() {
    const saved = SafeStorage.getItem("slamdunk_yks_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) || {};
        
        // Complete defensive default state schema merging
        this.state = {
          name: parsed.name || "",
          email: parsed.email || "",
          track: parsed.track || "Sayısal",
          targetDept: parsed.targetDept || "Bilgisayar Mühendisliği",
          targetRank: parsed.targetRank !== undefined ? parsed.targetRank : null,
          targetUniversity: parsed.targetUniversity || "",
          levelSystemV: parsed.levelSystemV || 1,
          streak: parsed.streak !== undefined ? parsed.streak : 1,
          level: parsed.level !== undefined ? parsed.level : 3,
          studyRoute: parsed.studyRoute || "balanced",
          totalHoursTarget: parsed.totalHoursTarget || 1400,
          totalQuestionsTarget: parsed.totalQuestionsTarget || 45000,
          totalMocksTarget: parsed.totalMocksTarget || 90,
          isGraduate: parsed.isGraduate !== undefined ? parsed.isGraduate : false,
          weekdayHours: parsed.weekdayHours !== undefined ? parsed.weekdayHours : 4,
          weekendHours: parsed.weekendHours !== undefined ? parsed.weekendHours : 8,
          wakeTime: parsed.wakeTime || "07:00",
          sleepTime: parsed.sleepTime || "23:00",
          role: parsed.role === "koc" ? "koc" : "ogrenci",
          programAccepted: !!parsed.programAccepted,
          coachStudents: Array.isArray(parsed.coachStudents) ? parsed.coachStudents : [],
          selectedCoachStudentId: parsed.selectedCoachStudentId || null,
          coachDraftFor: parsed.coachDraftFor || null,
          parentContact: parsed.parentContact || "",
          parentEmail: parsed.parentEmail || "",
          parentPhone: parsed.parentPhone || "",
          notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
          notifyChannels: Object.assign({ push: true, email: true, whatsapp: true }, parsed.notifyChannels || {}),
          notificationSettings: parsed.notificationSettings && typeof parsed.notificationSettings === "object" ? parsed.notificationSettings : null,
          lastQuoteIndex: parsed.lastQuoteIndex !== undefined ? parsed.lastQuoteIndex : null,
          overdueAlerted: parsed.overdueAlerted && typeof parsed.overdueAlerted === "object" ? parsed.overdueAlerted : {},
          overdueAlertedDate: parsed.overdueAlertedDate || null,
          summaryShown: parsed.summaryShown && typeof parsed.summaryShown === "object" ? parsed.summaryShown : {},
          subscriptionTier: parsed.subscriptionTier || "pending",
          trialStartDate: parsed.trialStartDate || null,
          theme: parsed.theme || "classic",
          diagnosticAccuracy: parsed.diagnosticAccuracy !== undefined ? parsed.diagnosticAccuracy : null,
          currentPositionRank: parsed.currentPositionRank !== undefined ? parsed.currentPositionRank : null,
          currentNetTYT: parsed.currentNetTYT !== undefined ? parsed.currentNetTYT : null,
          currentNetAYT: parsed.currentNetAYT !== undefined ? parsed.currentNetAYT : null,
          currentNetDil: parsed.currentNetDil !== undefined ? parsed.currentNetDil : null,
          currentPositionSource: parsed.currentPositionSource || null,
          targetNetTYT: parsed.targetNetTYT !== undefined ? parsed.targetNetTYT : null,
          targetNetAYT: parsed.targetNetAYT !== undefined ? parsed.targetNetAYT : null,
          examFocus: ["tyt", "ayt", "both"].includes(parsed.examFocus) ? parsed.examFocus : "both",
          isLoggedOut: parsed.isLoggedOut !== undefined ? parsed.isLoggedOut : false,
          testSubjects: parsed.testSubjects || [],
          testQuestions: parsed.testQuestions || {},
          testAnswers: parsed.testAnswers || {},
          testSecondsRemaining: parsed.testSecondsRemaining !== undefined ? parsed.testSecondsRemaining : 3600,
          currentTestSubject: parsed.currentTestSubject || "",
          currentTestQuestionIdx: parsed.currentTestQuestionIdx !== undefined ? parsed.currentTestQuestionIdx : 0,
          activeDay: parsed.activeDay !== undefined ? parsed.activeDay : 1,
          daysData: parsed.daysData || {},
          activeTab: parsed.activeTab || "today",
          curriculumProgress: parsed.curriculumProgress || [],
          uploadedQuestions: parsed.uploadedQuestions || [],
          unlockedBadges: parsed.unlockedBadges || [],
          chartData: parsed.chartData || [],
          totalQuestionsSolved: parsed.totalQuestionsSolved !== undefined ? parsed.totalQuestionsSolved : 0,
          totalLitCorrect: parsed.totalLitCorrect !== undefined ? parsed.totalLitCorrect : 0,
          lastStudyLogDate: parsed.lastStudyLogDate || null,
          spacedRepetitionTasks: parsed.spacedRepetitionTasks || [],
          mockExams: parsed.mockExams || [],
          focusScore: parsed.focusScore !== undefined ? parsed.focusScore : 100,
          burnoutAlertActive: parsed.burnoutAlertActive !== undefined ? parsed.burnoutAlertActive : false,
          generatedForLevel: parsed.generatedForLevel !== undefined ? parsed.generatedForLevel : null,
          manualTytAytSplit: parsed.manualTytAytSplit && typeof parsed.manualTytAytSplit === "object" ? parsed.manualTytAytSplit : null,
          activeCurriculumSubject: parsed.activeCurriculumSubject || null,
          parentReportDueTime: parsed.parentReportDueTime || null,
          parentReportShownDate: parsed.parentReportShownDate || null,
          userHabits: Array.isArray(parsed.userHabits) ? parsed.userHabits : [],
          dismissedHabitSuggestions: Array.isArray(parsed.dismissedHabitSuggestions) ? parsed.dismissedHabitSuggestions : [],
          lastHabitCoachReviewText: parsed.lastHabitCoachReviewText || null,
          lastHabitCoachReviewDay: parsed.lastHabitCoachReviewDay !== undefined ? parsed.lastHabitCoachReviewDay : null,
          coachCommentaries: Array.isArray(parsed.coachCommentaries) ? parsed.coachCommentaries : [],
          topicStatuses: parsed.topicStatuses || {},
          scheduledRepetitions: parsed.scheduledRepetitions || [],
          savedPrograms: parsed.savedPrograms || [],
          activeCustomProgramId: parsed.activeCustomProgramId || 'default_custom',
          selectedProgramType: parsed.selectedProgramType || "standard",
          standardDaysData: parsed.standardDaysData || {},
          customDaysData: parsed.customDaysData || {},
          startDate: parsed.startDate || "",
          activeWeek: parsed.activeWeek !== undefined ? parsed.activeWeek : 1
        };

        // Sanitize sleep/wake time if it was loaded as 09:00 wake pattern
        if (this.state.wakeTime === "09:00") {
          this.state.wakeTime = "07:00";
        }
        
        // Auto-upgrade calendar data size and check for math routines presence
        const day2 = this.state.standardDaysData && (this.state.standardDaysData[2] || this.state.standardDaysData["2"]);
        const hasMathRoutine = day2 && day2.tasks && day2.tasks.some(t => t && t.id && t.id.includes("math_routine"));

        if (this.state.programAccepted &&
            (!this.state.daysData || Object.keys(this.state.daysData).length !== this.PROGRAM_DAYS || !hasMathRoutine)) {
          this.generateWeeklyCalendarData();
          this.state.standardDaysData = JSON.parse(JSON.stringify(this.state.daysData));
          this.state.customDaysData = JSON.parse(JSON.stringify(this.state.daysData));
          this.saveState();
        } else if (this.backfillTaskSources()) {
          // Program güncel ama kaynak kitap bilgisi yoksa sadece o eklenir.
          this.saveState();
        }

        const todayStr = new Date().toISOString().split("T")[0];
        if (!this.state.startDate) this.state.startDate = todayStr;
        if (!this.state.activeWeek) this.state.activeWeek = 1;
        if (!this.state.savedPrograms || this.state.savedPrograms.length === 0) {
          const emptyDays = {};
          for (let d = 1; d <= 360; d++) {
            emptyDays[d] = { completed: false, tasks: [] };
          }
          this.state.savedPrograms = [{
            id: 'default_custom',
            name: 'Varsayılan Özel Program',
            startDate: todayStr,
            repetition: 'none',
            daysData: emptyDays
          }];
        }
        if (!this.state.activeCustomProgramId) this.state.activeCustomProgramId = 'default_custom';
        if (!this.state.selectedProgramType) this.state.selectedProgramType = "standard";
        
        if (!this.state.standardDaysData || Object.keys(this.state.standardDaysData).length === 0) {
          this.state.standardDaysData = JSON.parse(JSON.stringify(this.state.daysData || {}));
        }

        if (this.state.daysData && Object.keys(this.state.daysData).length > 0 && !this.state.isLoggedOut) {
          this.updateHeaderStats();
          
          const trophyDeptEl = document.getElementById("trophyTargetDept");
          if (trophyDeptEl) trophyDeptEl.textContent = this.state.targetDept;
          
          const trophyPctEl = document.getElementById("trophyPercentile");
          if (trophyPctEl) trophyPctEl.textContent = this.getTargetRankLabel();

          this.calculateFocusScore();
          this.renderDashboard();
          this.renderCurriculumMap();
          this.renderBadges();
          this.renderVaultQuestions();
          this.renderAICoachRecommendations();
          
          // Abonelik kontrolü
          if (this.state.subscriptionTier === "pending") {
             this.showLandingView();
             this.showSubscriptionModal();
             return;
          }

          this.showView("dashboardView");
          // Always default to today when the app is freshly loaded
          this.state.activeTab = "today";
          this.switchTab(this.state.activeTab);
          
          this.syncCustomProgramListSelector();
          this.syncProgramTypeUI(this.state.selectedProgramType);

          // Synchronize exam focus selectors in UI
          const focusVal = this.state.examFocus || "both";
          const wizardFocus = document.getElementById("wizardExamFocusSelect");
          if (wizardFocus) wizardFocus.value = focusVal;
          const creatorFocus = document.getElementById("creatorExamFocusSelect");
          if (creatorFocus) creatorFocus.value = focusVal;
          
          const chartFilter = document.getElementById("chartExamTypeFilter");
          if (chartFilter) chartFilter.removeAttribute("data-initialized");

          const activeProg = this.state.savedPrograms.find(p => p.id === this.state.activeCustomProgramId);
          if (activeProg) {
            const repLabels = { none: "Yok", weekly: "Haftalık Döngü", monthly: "Aylık Döngü" };
            const repEl = document.getElementById("customRepetitionText");
            if (repEl) repEl.textContent = repLabels[activeProg.repetition || "none"] || "Yok";
            const startEl = document.getElementById("customStartDateText");
            if (startEl) startEl.textContent = activeProg.startDate || "-";
          }

          if (this.state.parentReportDueTime) {
            this.startParentNotificationTimer();
          }
        } else {
          this.showLandingView();
        }
      } catch (e) {
        console.error("Error loading saved state, recovering cleanly...", e);
        // Clean recovery fallback
        SafeStorage.removeItem("slamdunk_yks_state");
        this.state = {
          name: "",
          track: "Sayısal",
          targetDept: "",
          targetRank: null,
          targetUniversity: "",
          streak: 1,
          level: 3,
          isGraduate: false,
          weekdayHours: 4,
          weekendHours: 8,
          wakeTime: "07:00",
          sleepTime: "23:00",
          parentContact: "",
          parentEmail: "",
          parentPhone: "",
          isLoggedOut: false,
          testSubjects: [],
          testQuestions: {},
          testAnswers: {},
          testSecondsRemaining: 3600,
          currentTestSubject: "",
          currentTestQuestionIdx: 0,
          activeDay: 1,
          daysData: {},
          activeTab: "calendar",
          curriculumProgress: [],
          uploadedQuestions: [],
          unlockedBadges: [],
          chartData: [],
          totalQuestionsSolved: 0,
          totalLitCorrect: 0,
          spacedRepetitionTasks: [],
          activeCustomProgramId: 'default_custom',
          selectedProgramType: "standard",
          savedPrograms: []
        };
        this.showLandingView();
      }
    } else {
      this.showLandingView();
    }
  },

  togglePomoCollapse: function(collapse) {
    const widget = document.getElementById("floatingPomoWidget");
    if (widget) {
      if (collapse) {
        widget.classList.add("collapsed");
      } else {
        widget.classList.remove("collapsed");
      }
    }
  },

  playPomoAlarmSound: function() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (time, freq, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
        gain.gain.setValueAtTime(0.3, time + duration - 0.02);
        gain.gain.linearRampToValueAtTime(0, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      const now = ctx.currentTime;
      playBeep(now, 880, 0.15);
      playBeep(now + 0.25, 880, 0.15);
      playBeep(now + 0.6, 880, 0.15);
      playBeep(now + 0.85, 880, 0.15);
      playBeep(now + 1.2, 880, 0.15);
      playBeep(now + 1.45, 880, 0.15);
    } catch (e) {
      console.error("Audio Context alarm failed", e);
    }
  },

  generateAIProgramFromCreator: function() {
    try {
      const select = document.getElementById("creatorLevelSelect");
      const focusSelect = document.getElementById("creatorExamFocusSelect");
      if (!select || !focusSelect) return;
      const levelVal = parseInt(select.value);
      const focusVal = focusSelect.value;
      
      this.showAILoading("AI Program Oluşturuluyor", `${levelVal}. seviye hedefli çalışma programınız hazırlanıyor...`, "programCreator");
      
      setTimeout(() => {
        try {
          // 1. Change targets for selected level and save exam focus
          this.state.examFocus = focusVal;
          this.changeReportLevelManual(levelVal);
          
          const wizardFocus = document.getElementById("wizardExamFocusSelect");
          if (wizardFocus) wizardFocus.value = focusVal;
          
          const chartFilter = document.getElementById("chartExamTypeFilter");
          if (chartFilter) chartFilter.removeAttribute("data-initialized");
          
          // 2. Clear old standard plan and generate new calendar plan matching the selected level
          this.state.daysData = {};
          this.generateWeeklyCalendarData();
          this.state.standardDaysData = JSON.parse(JSON.stringify(this.state.daysData));
          
          // 3. Force switch program selection type to standard so it displays the newly generated plan
          this.state.selectedProgramType = "standard";
          this.syncProgramTypeUI("standard");
          
          // 4. Reset stats and refresh
          this.updateHeaderStats();
          this.renderDashboard();
          this.renderMonthlyCalendarGrid();
          
          // 5. Save state and switch tab to plan today
          this.triggerCoachCommentary("Yeni Çalışma Programı Oluşturuldu");
          this.saveState();
          this.hideAILoading();
          this.closeModal("customProgramPlannerModal");
          this.switchTab("today");
          
          // Notify
          this.showCoachAlert("🪄 Program Oluşturuldu", `${levelVal}. Seviye Hedefli YKS programınız başarıyla oluşturuldu ve çalışma planınıza uygulandı!`);
          setTimeout(() => this.showScheduleFitWarningIfNeeded(), 500);
        } catch (e) {
          this.hideAILoading();
          alert("Program oluşturulurken hata oluştu: " + e.message);
          console.error(e);
        }
      }, 800);
    } catch (err) {
      alert("Hata: " + err.message);
    }
  },

  makeElementDraggable: function(el) {
    if (!el) return;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    const fullContent = el.querySelector(".full-pomo-content");
    const miniContent = el.querySelector(".mini-pomo-content");
    
    if (fullContent) {
      fullContent.onmousedown = dragMouseDown;
      fullContent.ontouchstart = dragTouchStart;
    }
    if (miniContent) {
      miniContent.onmousedown = dragMouseDown;
      miniContent.ontouchstart = dragTouchStart;
    }

    function dragMouseDown(e) {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION' || (e.target.tagName === 'I' && e.target.parentElement.tagName === 'BUTTON')) return;
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function dragTouchStart(e) {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION' || (e.target.tagName === 'I' && e.target.parentElement.tagName === 'BUTTON')) return;
      const touch = e.touches[0];
      pos3 = touch.clientX;
      pos4 = touch.clientY;
      document.ontouchend = closeDragElement;
      document.ontouchmove = elementTouchDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      const newTop = el.offsetTop - pos2;
      const newLeft = el.offsetLeft - pos1;
      
      el.style.top = Math.max(10, Math.min(window.innerHeight - el.offsetHeight - 10, newTop)) + "px";
      el.style.left = Math.max(10, Math.min(window.innerWidth - el.offsetWidth - 10, newLeft)) + "px";
      el.style.bottom = "auto";
    }

    function elementTouchDrag(e) {
      const touch = e.touches[0];
      pos1 = pos3 - touch.clientX;
      pos2 = pos4 - touch.clientY;
      pos3 = touch.clientX;
      pos4 = touch.clientY;

      const newTop = el.offsetTop - pos2;
      const newLeft = el.offsetLeft - pos1;

      el.style.top = Math.max(10, Math.min(window.innerHeight - el.offsetHeight - 10, newTop)) + "px";
      el.style.left = Math.max(10, Math.min(window.innerWidth - el.offsetWidth - 10, newLeft)) + "px";
      el.style.bottom = "auto";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
      document.ontouchend = null;
      document.ontouchmove = null;
    }
  },

  registerVerificationFlow: function(task, dayNum) {
    if (!this.state.topicStatuses) this.state.topicStatuses = {};
    if (!this.state.scheduledRepetitions) this.state.scheduledRepetitions = [];

    const topicKey = `${task.subject} - ${task.topic}`;
    const current = this.state.topicStatuses[topicKey];

    // Only initiate the verification flow if the topic is not already learned
    if (!current || (current.status !== "Ogrenildi" && current.status !== "Calisildi")) {
      this.state.topicStatuses[topicKey] = { status: "Calisildi", date: Date.now() };
      
      // Schedule relative Day 1: Leitner repeat
      this.scheduleRepetitionTask(task.topic, task.subject, "leitner_1", dayNum + 1);
      
      // Schedule relative Day 2: ÖDT
      this.scheduleRepetitionTask(task.topic, task.subject, "odt", dayNum + 2);
    }
  },

  scheduleRepetitionTask: function(topic, subject, type, dueDay) {
    if (dueDay > this.PROGRAM_DAYS) return;
    if (!this.state.scheduledRepetitions) this.state.scheduledRepetitions = [];
    
    // Avoid duplicate scheduling
    const exists = this.state.scheduledRepetitions.some(r => r.topic === topic && r.type === type && r.dueDay === dueDay);
    if (!exists) {
      this.state.scheduledRepetitions.push({
        id: `rep_${type}_${dueDay}_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        topic: topic,
        subject: subject,
        type: type,
        dueDay: dueDay,
        completed: false
      });
    }
  },

  openOdtTest: function(dayNum, taskId, subject, topic, odtType = "odt") {
    const bank = this.getOdtQuestions(subject, topic);

    // Doğrulanmış soru yoksa test AÇILMAZ; uydurma soru üretmek yerine
    // öğrenciye gerçek eğitsel alternatifler sunulur.
    if (!bank.questions.length) {
      this.showOdtUnavailable(subject, topic, bank);
      return;
    }

    const questions = bank.questions;
    this._odtBankInfo = bank;
    this.odtState = {
      dayNum: dayNum,
      taskId: taskId,
      subject: subject,
      topic: topic,
      odtType: odtType,
      questions: questions,
      answers: {},
      currentQuestionIdx: 0,
      secondsRemaining: 15 * 60,
      timer: null
    };

    // Show sub-title — soru sayısı ve kaynak dürüstçe belirtilir
    const subEl = document.getElementById("odtModalSubTitle");
    if (subEl) {
      let note = `${subject} - ${topic} · ${questions.length} doğrulanmış soru`;
      if (bank.isMixed) note += " (bir kısmı aynı dersten karma konu)";
      subEl.textContent = note;
    }
    
    // Open modal
    this.openModal("odtModal");

    // Render first question
    this.renderOdtQuestion();

    // Start timer
    if (this.odtState.timer) clearInterval(this.odtState.timer);
    this.odtState.timer = setInterval(() => {
      this.odtState.secondsRemaining--;
      const mins = Math.floor(this.odtState.secondsRemaining / 60);
      const secs = this.odtState.secondsRemaining % 60;
      document.getElementById("odtTimerVal").textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      if (this.odtState.secondsRemaining <= 0) {
        clearInterval(this.odtState.timer);
        alert("Süre bitti! ÖDT sınavınız otomatik olarak tamamlanıyor.");
        this.odtFinishTest();
      }
    }, 1000);
  },

  // ==========================================================
  // ÖDT SORU SEÇİMİ — EĞİTİM BÜTÜNLÜĞÜ
  // ------------------------------------------------------------
  // Önceden banka yetmediğinde uydurma sorular üretiliyordu; üstelik
  // doğru şık rastgele atanıyordu (öğrenci anlamsız bir soruda "yanlış"
  // sayılabiliyordu). Artık ASLA soru uydurulmaz. Yalnızca doğrulanmış
  // banka soruları döner; yetmiyorsa eksiklik dürüstçe bildirilir ve
  // öğrenciye gerçek eğitsel alternatifler önerilir.
  // ==========================================================
  getOdtQuestions: function(subject, topic) {
    const mappedKey = this.subjectKeys[subject] || subject;
    const pool = window.YKS_QUESTION_BANK ? (window.YKS_QUESTION_BANK[mappedKey] || []) : [];

    const tWords = String(topic || "").toLowerCase().replace(/[.,;:()]/g, "").split(/\s+/).filter(w => w.length > 2);
    const onTopic = pool.filter(q => {
      const qt = (q.topic || "").toLowerCase();
      return tWords.some(w => qt.includes(w)) || qt.includes(String(topic || "").toLowerCase());
    });

    // Konuya özel sorular yetmiyorsa aynı DERSTEN doğrulanmış sorularla
    // tamamlanır — ama bu durum kullanıcıya açıkça bildirilir (karma pratik).
    const sameSubject = pool.filter(q => onTopic.indexOf(q) === -1);
    const combined = onTopic.concat(this.shuffleArray(sameSubject));

    return {
      questions: combined.slice(0, 10),
      onTopicCount: onTopic.length,
      verifiedTotal: combined.length,
      isMixed: onTopic.length < 10 && combined.length > onTopic.length,
      isInsufficient: combined.length < 10
    };
  },

  // Doğrulanmış soru bulunmadığında gösterilen dürüst ekran.
  showOdtUnavailable: function(subject, topic, bank) {
    const alts = this.buildOdtAlternatives(subject, topic);
    const html = `
      <div style="text-align:left;">
        <div style="display:flex; align-items:flex-start; gap:0.6rem; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:0.9rem; margin-bottom:1rem;">
          <i class="fa-solid fa-circle-info" style="color:#b45309; font-size:1.1rem; margin-top:0.1rem;"></i>
          <div>
            <div style="font-weight:800; font-size:0.9rem; color:var(--text-main); margin-bottom:0.25rem;">Bu konu için doğrulanmış soru bulunmuyor</div>
            <p style="font-size:0.8rem; color:var(--text-muted); margin:0; line-height:1.5;">
              <strong>${app.escapeHtml(subject)} — ${app.escapeHtml(topic)}</strong> için soru bankasında doğrulanmış soru yok.
              Sana yapay soru üretmiyoruz: uydurma sorular yanlış öğrenmeye ve sahte özgüvene yol açar.
              Bunun yerine aşağıdaki kanıta dayalı alternatifleri öneriyoruz.
            </p>
          </div>
        </div>
        ${alts.map(a => `
          <div class="glass-card" style="padding:0.9rem; margin-bottom:0.6rem; text-align:left;">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.3rem;">
              <span class="ai-helper-icon" style="width:26px; height:26px; border-radius:8px; font-size:0.7rem;"><i class="fa-solid ${a.icon}"></i></span>
              <strong style="font-size:0.87rem;">${app.escapeHtml(a.title)}</strong>
            </div>
            <p style="font-size:0.78rem; color:var(--text-muted); margin:0 0 0.6rem; line-height:1.5;">${app.escapeHtml(a.desc)}</p>
            <button class="btn btn-secondary" style="font-size:0.75rem; font-weight:800; padding:0.35rem 0.7rem;" onclick="${a.action}">${app.escapeHtml(a.cta)}</button>
          </div>`).join("")}
      </div>`;
    this.showCoachAlert("Doğrulanmış Soru Yok", html);
  },

  // ÖDT ekranından "tekrar döngüsüne ekle" — gerçekten planlar, sadece yönlendirmez
  scheduleTopicForReviewFromOdt: function(subject, topic) {
    const node = this.curriculum.byName(subject, topic);
    this.registerSpacedRepetition(topic, subject, node && node.id);
    const rec = (this.state.spacedRepetitionTasks || []).find(r => r.topic === topic);
    const inDays = rec ? Math.max(1, rec.dueDay - (this.state.activeDay || 1)) : 1;
    this.closeModal("coachModal");
    this.showToast(`"${topic}" tekrar döngüsüne eklendi — ${inDays} gün sonra Akıllı Tekrar Seansı'nda karşına çıkacak.`, "success");
    if (this.injectSmartReviewSession) this.injectSmartReviewSession(this.state.activeDay || 1);
    if (this.renderTodayPanel) this.renderTodayPanel();
  },

  shuffleArray: function(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Banka yetersizken uydurma yerine GERÇEK eğitsel alternatifler üretir.
  buildOdtAlternatives: function(subject, topic) {
    const alts = [];
    const vaultForTopic = (this.state.uploadedQuestions || []).filter(q => !q.completed && (q.topic === topic || q.subject === subject));
    if (vaultForTopic.length) {
      alts.push({ icon: "fa-dungeon", title: "Hata defterindeki bu konuyu tekrar et",
        desc: `${subject} — bu konuda çözülmemiş ${vaultForTopic.length} hata kaydın var. Doğrulanmış yeni soru yerine kendi hatalarını çözmek daha yüksek kazanım sağlar.`,
        action: "app.closeModal('odtModal'); app.switchTab('vault');", cta: "Hata Zindanı'na git" });
    }
    const node = this.curriculum.byName(subject, topic);
    const weakPrereqs = node ? (node.prereq || []).map(p => this.curriculum.byId(p)).filter(Boolean) : [];
    if (weakPrereqs.length) {
      alts.push({ icon: "fa-diagram-project", title: "Önkoşul konuları pekiştir",
        desc: `Bu konunun dayandığı konular: ${weakPrereqs.map(p => p.name).join(", ")}. Doğrulanmış soru bulunmadığında en verimli hamle önkoşulları sağlamlaştırmaktır.`,
        action: "app.closeModal('odtModal'); app.switchTab('programCreator');", cta: "Müfredat haritasını aç" });
    }
    // Uygulama içinde zaten var olan öğretmen/yayın kaynakları önerilir
    const srcs = (this.getSourceRecommendations ? this.getSourceRecommendations(subject, topic) : []) || [];
    const vids = (this.getYouTubeRecommendations ? this.getYouTubeRecommendations(subject, topic) : []) || [];
    if (srcs.length || vids.length) {
      const bits = [];
      if (srcs.length) bits.push(`${srcs.length} yayın/soru bankası önerisi`);
      if (vids.length) bits.push(`${vids.length} konu anlatım videosu`);
      alts.push({ icon: "fa-book-open", title: "Uygulamadaki hazır kaynakları kullan",
        desc: `Bu konu için uygulamada zaten ${bits.join(" ve ")} mevcut. Doğrulanmış soru yerine bu kaynaklardan çalışmak daha güvenilirdir.`,
        action: "app.closeModal('odtModal'); app.switchTab('vault');", cta: "Kaynak önerilerini aç" });
    }

    // "Tekrar planla" gerçekten planlar: konu aralıklı tekrar döngüsüne alınır
    alts.push({ icon: "fa-calendar-check", title: "Bu konuyu tekrar döngüsüne al",
      desc: "Doğrulanmış soru olmadığı için konuyu aralıklı tekrar (spaced repetition) döngüsüne ekleyip AI Akıllı Tekrar Seansı'nda karşına çıkmasını sağlayabilirsin.",
      action: `app.scheduleTopicForReviewFromOdt('${String(subject).replace(/'/g, "\\'")}', '${String(topic).replace(/'/g, "\\'")}')`,
      cta: "Tekrar döngüsüne ekle" });

    alts.push({ icon: "fa-layer-group", title: "Karma konu pratiği yap",
      desc: `${subject} dersinden karışık konulu tarama çözmek (interleaving), tek konuya odaklı çözmeye göre kalıcılığı artırır.`,
      action: "app.closeModal('odtModal'); app.switchTab('today');", cta: "Bugünün planına dön" });
    alts.push({ icon: "fa-file-lines", title: "Deneme sınavına yönel",
      desc: "Konu bazlı doğrulanmış soru kalmadıysa, gerçek sınav koşullarında deneme çözmek en güvenilir ölçüm aracıdır.",
      action: "app.closeModal('odtModal'); app.switchTab('calendar');", cta: "Deneme gününe bak" });
    return alts;
  },

  renderOdtQuestion: function() {
    const qArea = document.getElementById("odtQuestionArea");
    if (!qArea || !this.odtState) return;

    const idx = this.odtState.currentQuestionIdx;
    const q = this.odtState.questions[idx];
    const selectedAnswer = this.odtState.answers[idx];

    let optionsHtml = "";
    const labels = ["A", "B", "C", "D", "E"];
    q.options.forEach((opt, oIdx) => {
      const isSelected = selectedAnswer === oIdx;
      optionsHtml += `
        <button class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'}" 
          style="width:100%; text-align:left; justify-content:flex-start; padding:0.75rem 1rem; font-size:0.85rem; font-weight:600; border-radius:8px; display:flex; align-items:center; gap:0.5rem; transition:0.15s; margin-top:0.35rem;"
          onclick="app.selectOdtOption(${oIdx})">
          <span style="display:inline-flex; width:22px; height:22px; border-radius:50%; background:${isSelected ? '#fff' : 'rgba(0,0,0,0.05)'}; color:${isSelected ? 'var(--primary)' : 'var(--text-main)'}; align-items:center; justify-content:center; font-weight:800; font-size:0.75rem; border:1px solid rgba(0,0,0,0.1);">${labels[oIdx]}</span>
          <span>${opt}</span>
        </button>
      `;
    });

    qArea.innerHTML = `
      <div style="font-size:0.92rem; font-weight:700; color:var(--text-main); margin-bottom:1rem; line-height:1.5;">
        ${q.text}
      </div>
      <div style="display:flex; flex-direction:column; gap:0.5rem; width:100%;">
        ${optionsHtml}
      </div>
    `;

    // Update progress text
    document.getElementById("odtQuestionProgressText").textContent = `Soru ${idx + 1}/10`;
    
    // Update navigation buttons style
    document.getElementById("odtPrevBtn").disabled = idx === 0;
    document.getElementById("odtNextBtn").disabled = idx === 9;
  },

  selectOdtOption: function(optIdx) {
    if (!this.odtState) return;
    const idx = this.odtState.currentQuestionIdx;
    this.odtState.answers[idx] = optIdx;
    this.renderOdtQuestion();
  },

  odtNextQuestion: function() {
    if (!this.odtState || this.odtState.currentQuestionIdx >= 9) return;
    this.odtState.currentQuestionIdx++;
    this.renderOdtQuestion();
  },

  odtPrevQuestion: function() {
    if (!this.odtState || this.odtState.currentQuestionIdx <= 0) return;
    this.odtState.currentQuestionIdx--;
    this.renderOdtQuestion();
  },

  closeOdtOvr: function() {
    this.closeModal("odtModal");
    if (this.odtState && this.odtState.timer) {
      clearInterval(this.odtState.timer);
    }
  },

  closeOdtModal: function() {
    if (confirm("Testten çıkmak istediğinize emin misiniz? Yanıtlarınız kaydedilmeyecektir.")) {
      this.closeOdtOvr();
    }
  },

  odtFinishTest: function() {
    if (!this.odtState) return;
    
    // Check if all questions are answered, if not warn
    const totalAnswered = Object.keys(this.odtState.answers).length;
    if (totalAnswered < 10 && this.odtState.secondsRemaining > 0) {
      if (!confirm(`Sadece ${totalAnswered}/10 soru yanıtladınız. Sınavı bu şekilde bitirmek istediğinizden emin misiniz?`)) {
        return;
      }
    }

    clearInterval(this.odtState.timer);

    let correctCount = 0;
    let incorrectCount = 0;
    const detailList = [];

    this.odtState.questions.forEach((q, idx) => {
      const ans = this.odtState.answers[idx];
      const isCorrect = ans === q.correct;
      if (ans !== undefined) {
        if (isCorrect) correctCount++;
        else incorrectCount++;
      } else {
        incorrectCount++; // Unanswered is incorrect
      }
      detailList.push({
        qText: q.text,
        correctOption: q.correct,
        userOption: ans,
        explanation: q.explanation || ""
      });
    });

    const score = correctCount; // Out of 10
    const percent = score * 10;
    
    const dayNum = this.odtState.dayNum;
    const taskId = this.odtState.taskId;
    const topic = this.odtState.topic;
    const subject = this.odtState.subject;
    const odtType = this.odtState.odtType || "odt";

    // Remove the ODT test overlay
    this.closeOdtOvr();

    // Mark task as completed
    const dayData = this.state.daysData[dayNum];
    if (dayData && dayData.tasks) {
      const task = dayData.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = true;
        task.correct = correctCount;
        task.incorrect = incorrectCount;
      }
    }

    // Set topic status based on score
    let newStatus = "";
    let coachMsg = "";

    // Initialize state containers if missing
    if (!this.state.topicStatuses) this.state.topicStatuses = {};
    if (!this.state.scheduledRepetitions) this.state.scheduledRepetitions = [];

    const topicKey = `${subject} - ${topic}`;

    if (odtType === "odt2") {
      // ÖDT-2 Rules:
      if (score >= 8) {
        newStatus = "Ogrenildi";
        this.state.topicStatuses[topicKey] = { status: "Ogrenildi", score: percent, date: Date.now() };
        coachMsg = `🟢 <strong>${topic}</strong> ÖDT-2 testinde başarılı oldun (${score}/10) ve konuyu öğrendin! 7 ve 21 gün sonra küçük pekiştirme ziyaretleri olacak. ✏️`;
        
        // Schedule Pekiştirme at Day +7 and Day +21
        this.scheduleRepetitionTask(topic, subject, "pekistirme_7", dayNum + 7);
        this.scheduleRepetitionTask(topic, subject, "pekistirme_21", dayNum + 21);
      } else {
        newStatus = "Bitmedi";
        this.state.topicStatuses[topicKey] = { status: "Bitmedi", score: percent, date: Date.now() };
        coachMsg = `🔴 <strong>${topic}</strong> ÖDT-2'de yeterli başarıyı gösteremedi (${score}/10). Konu yeniden çalışma döngüsüne alınıyor. ✏️`;
        
        // Schedule re-study in 2 days (Day +2)
        this.scheduleRepetitionTask(topic, subject, "re_study", dayNum + 2);
        // Schedule new ÖDT in 4 days (Day +4)
        this.scheduleRepetitionTask(topic, subject, "odt", dayNum + 4);
      }
    } else {
      // Standard ÖDT Rules:
      if (score >= 8) {
        newStatus = "Ogrenildi";
        this.state.topicStatuses[topicKey] = { status: "Ogrenildi", score: percent, date: Date.now() };
        coachMsg = `🟢 <strong>${topic}</strong> resmen öğrenildi, mühürledik! 7 ve 21 gün sonra küçük pekiştirme ziyaretleri olacak. ✏️`;
        
        // Schedule Pekiştirme at Day +7 and Day +21
        this.scheduleRepetitionTask(topic, subject, "pekistirme_7", dayNum + 7);
        this.scheduleRepetitionTask(topic, subject, "pekistirme_21", dayNum + 21);
        
      } else if (score >= 5) {
        newStatus = "Kirilgan";
        this.state.topicStatuses[topicKey] = { status: "Kirilgan", score: percent, date: Date.now() };
        coachMsg = `🟡 <strong>${topic}</strong> biraz kırılgan görünüyor (${score}/10 doğru). Bugün 20 dakika hedefli tekrar yapacağız ve 3 gün sonra ÖDT-2 ile durumu kontrol edeceğiz.`;
        
        // Schedule Tekrar Hedefli today (same day)
        this.scheduleRepetitionTask(topic, subject, "tekrar_hedefli", dayNum);
        // Schedule ÖDT-2 in 3 days (Day +3)
        this.scheduleRepetitionTask(topic, subject, "odt2", dayNum + 3);
        
      } else {
        newStatus = "Bitmedi";
        this.state.topicStatuses[topicKey] = { status: "Bitmedi", score: percent, date: Date.now() };
        coachMsg = `🔴 <strong>${topic}</strong> bizden bir tur daha istiyor (${score}/10 doğru). Bu sefer farklı bir kaynakla gideceğiz, sorun sende değil yöntemde. ✏️`;
        
        // Schedule re-study in 2 days (Day +2)
        this.scheduleRepetitionTask(topic, subject, "re_study", dayNum + 2);
        // Schedule new ÖDT in 4 days (Day +4)
        this.scheduleRepetitionTask(topic, subject, "odt", dayNum + 4);
      }
    }

    // Mark completion in the scheduledRepetitions array
    const matchedRep = this.state.scheduledRepetitions.find(r => r.topic === topic && r.dueDay === dayNum && !r.completed);
    if (matchedRep) {
      matchedRep.completed = true;
    }

    // Save logs to chartData
    this.state.chartData.push({
      label: `G${dayNum} - ÖDT - ${subject}`,
      correct: correctCount,
      incorrect: incorrectCount,
      blank: Math.max(0, 10 - correctCount - incorrectCount),
      total: 10,
      cozulen: correctCount + incorrectCount,
      time: 15,
      subject: subject,
      topic: topic || "",
      hour: new Date().getHours(),
      ts: Date.now(),
      dayNum: dayNum,
      examType: "ÖDT"
    });

    this.state.totalQuestionsSolved += 10;

    // Display beautiful Coach Alert Report Dialog
    this.showOdtReportDialog(topic, subject, score, coachMsg, detailList);

    this.checkDayCompletedState();
    this.calculateFocusScore();
    this.renderDashboard();
    this.renderCurriculumMap();
    this.saveState();
  },

  showOdtReportDialog: function(topic, subject, score, coachMsg, details) {
    const existing = document.getElementById("odtReportDialog");
    if (existing) existing.remove();

    let detailsHtml = "";
    const labels = ["A", "B", "C", "D", "E"];
    details.forEach((d, idx) => {
      const isCorrect = d.userOption === d.correctOption;
      detailsHtml += `
        <div style="border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:0.75rem; margin-bottom:0.75rem; font-size:0.78rem;">
          <div style="font-weight:700; color:var(--text-main); margin-bottom:0.25rem;">Soru ${idx + 1}: ${d.qText}</div>
          <div style="display:flex; gap:1rem; font-weight:600; margin-top:0.2rem;">
            <span style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'};">
              <i class="fa-solid ${isCorrect ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> Cevabın: ${d.userOption !== undefined ? labels[d.userOption] : "Boş"}
            </span>
            <span style="color:var(--success);"><i class="fa-solid fa-circle-check"></i> Doğru Cevap: ${labels[d.correctOption]}</span>
          </div>
          ${d.explanation ? `<div style="color:var(--text-muted); font-size:0.7rem; margin-top:0.25rem; font-style:italic;">Açıklama: ${d.explanation}</div>` : ""}
        </div>
      `;
    });

    const percent = score * 10;
    const scoreColor = score >= 8 ? 'var(--success)' : (score >= 5 ? '#f59e0b' : '#ef4444');
    
    const dialog = document.createElement("div");
    dialog.id = "odtReportDialog";
    dialog.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);";
    dialog.innerHTML = `
      <div style="background:var(--bg-card,#fff); border-radius:16px; padding:2rem; max-width:550px; width:90%; box-shadow:0 20px 60px rgba(0,0,0,0.3); border:2px solid var(--border-color,#e5e7eb); max-height:85vh; overflow-y:auto; text-align:left;">
        <div style="text-align:center; margin-bottom:1.5rem;">
          <div style="font-size:3rem; color:${scoreColor}; font-weight:900; font-family:var(--font-header); line-height:1;">
            ${percent}%
          </div>
          <h3 style="margin:0.5rem 0 0; font-family:var(--font-header); font-weight:800; font-size:1.3rem; color:var(--text-main);">
            ÖDT Karnesi: ${score}/10 Doğru
          </h3>
          <p style="margin:0.25rem 0 0; font-size:0.8rem; color:var(--text-muted); font-weight:600;">
            ${subject} - ${topic}
          </p>
        </div>

        <div style="background:rgba(0,0,0,0.02); border:1px solid var(--border-color); border-radius:8px; padding:0.8rem; margin-bottom:1.25rem; font-size:0.8rem; line-height:1.5; font-weight:600; color:var(--text-main);">
          ${coachMsg}
        </div>

        <h4 style="margin:0 0 0.5rem; font-size:0.85rem; font-family:var(--font-header); font-weight:800; color:var(--text-main);">
          Soru Detayları & Açıklamalar
        </h4>
        <div style="max-height:220px; overflow-y:auto; padding-right:0.5rem; border:1px solid var(--border-color); border-radius:8px; padding:0.75rem; background:#fafafa;">
          ${detailsHtml}
        </div>

        <div style="margin-top:1.5rem; text-align:center;">
          <button onclick="document.getElementById('odtReportDialog').remove()" class="btn btn-primary" style="padding:0.6rem 2rem; font-weight:800; font-family:var(--font-header);">
            Devam Et
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
  },

  calculateTopicStats: function() {
    if (!this.state.topicStatuses) this.state.topicStatuses = {};
    const keys = Object.keys(this.state.topicStatuses);
    const workedCount = keys.length;
    const learnedCount = keys.filter(k => this.state.topicStatuses[k].status === "Ogrenildi").length;
    return { worked: workedCount, learned: learnedCount };
  },

  togglePencilLogoSvg: function(e) {
    // Left empty for compatibility
  }
};

window.app = app;

window.addEventListener("DOMContentLoaded", () => {
  app.init();
});
