class NotificationManager {
  constructor(appRef) {
    this.app = appRef;
    this.settings = this.app.state.notificationSettings || {
      enabled: false,
      quietHoursStart: "23:00",
      quietHoursEnd: "08:00",
      categories: {
        critical: true,
        high: true,
        normal: true,
        low: true
      },
      lastEvaluated: 0
    };
    
    // Sync state if missing
    if (!this.app.state.notificationSettings) {
      this.app.state.notificationSettings = this.settings;
    }

    this.checkInterval = null;
    this.startDaemon();
  }

  async requestPermission() {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notification");
      return false;
    }

    if (Notification.permission === "granted") {
      this.settings.enabled = true;
      this.saveSettings();
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        this.settings.enabled = true;
        this.saveSettings();
        return true;
      }
    }
    
    this.settings.enabled = false;
    this.saveSettings();
    return false;
  }

  saveSettings() {
    this.app.state.notificationSettings = this.settings;
    if (window.SafeStorage) {
      SafeStorage.setItem("slamdunk_yks_state", JSON.stringify(this.app.state));
    }
  }

  startDaemon() {
    // Check every 5 minutes while the app is active
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => {
      this.evaluateNotificationConditions();
    }, 5 * 60 * 1000);
    
    // Check immediately on start
    setTimeout(() => this.evaluateNotificationConditions(), 10000);
  }

  isInQuietHours() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentAbsolute = currentHour + currentMinute / 60.0;

    const startStr = this.app.state.sleepTime || "23:00";
    const [startH, startM] = startStr.split(':').map(Number);
    const startAbsolute = startH + startM / 60.0;

    const endStr = this.app.state.wakeTime || "08:00";
    const [endH, endM] = endStr.split(':').map(Number);
    const endAbsolute = endH + endM / 60.0;

    if (startAbsolute < endAbsolute) {
      return currentAbsolute >= startAbsolute && currentAbsolute < endAbsolute;
    } else {
      // Crosses midnight
      return currentAbsolute >= startAbsolute || currentAbsolute < endAbsolute;
    }
  }

  async evaluateNotificationConditions() {
    if (!this.settings.enabled || Notification.permission !== "granted") return;
    if (this.isInQuietHours()) return;

    const now = Date.now();
    // Don't evaluate more than once per hour to prevent spam
    if (now - this.settings.lastEvaluated < 60 * 60 * 1000) return;
    
    this.settings.lastEvaluated = now;
    this.saveSettings();

    // Condition 1: Repeated mistakes in Error Notebook (Critical)
    if (this.settings.categories.critical) {
      const mistakesCount = Object.values(this.app.state.testQuestions || {}).length;
      if (mistakesCount > 5) {
        return this.triggerAINotification("error_notebook", { count: mistakesCount });
      }
    }

    // Condition 2: High priority daily study / Review session (High)
    if (this.settings.categories.high) {
      const todayTasks = this.app.state.spacedRepetitionTasks.filter(t => t.dueDays.includes(this.app.state.activeDay) && !t.completedDays.includes(this.app.state.activeDay));
      if (todayTasks.length > 0) {
        return this.triggerAINotification("daily_review", { count: todayTasks.length });
      }
    }

    // Condition 3: Motivation (Low)
    if (this.settings.categories.low) {
      const streak = this.app.state.streak || 0;
      if (streak > 3) {
        return this.triggerAINotification("motivation", { streak });
      }
    }
  }

  async triggerAINotification(type, context) {
    if (!navigator.serviceWorker || !navigator.serviceWorker.ready) return;

    let prompt = "";
    let defaultTitle = "AI Koçum";
    let defaultBody = "";
    let targetView = "dashboardView";

    switch(type) {
      case "error_notebook":
        prompt = `Öğrencinin hata defterinde birikmiş ${context.count} hatası var. Onu bu hataları gözden geçirmesi için motive eden, koç gibi konuşan, en fazla 2 cümlelik bir bildirim mesajı yaz.`;
        defaultTitle = "❗ Hata Defteri Hatırlatması";
        defaultBody = `${context.count} hatan seni bekliyor. Bunları bugün eritelim!`;
        targetView = "vaultView";
        break;
      case "daily_review":
        prompt = `Öğrencinin bugün tekrar etmesi gereken ${context.count} konusu var. Tekrarların kalıcılık için ne kadar önemli olduğunu vurgulayan, motive edici 2 cümlelik bir bildirim yaz.`;
        defaultTitle = "🧠 Tekrar Vakti";
        defaultBody = `Bugün yapman gereken ${context.count} tekrar var. Unutmamak için göz at!`;
        targetView = "calendarView";
        break;
      case "motivation":
        prompt = `Öğrenci tam ${context.streak} gündür aralıksız çalışıyor. Onu tebrik eden ve seriyi bozmaması için gaza getiren 2 cümlelik bir bildirim mesajı yaz.`;
        defaultTitle = "🔥 Seriyi Bozma";
        defaultBody = `${context.streak} günlük serin var! Harika gidiyorsun.`;
        targetView = "dashboardView";
        break;
      case "test":
        defaultTitle = "✅ Bildirim Testi";
        defaultBody = "AI Koçum bildirimleri başarıyla çalışıyor. Senin için buradayım!";
        targetView = "dashboardView";
        break;
    }

    let aiMessage = defaultBody;

    // Call Gemini API if available and it's not a test
    const apiKey = typeof this.app.getLlmApiKey === "function" ? this.app.getLlmApiKey() : "";
    if (type !== "test" && apiKey) {
      try {
        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 100, temperature: 0.7 }
        };
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data && data.candidates && data.candidates[0]) {
          aiMessage = data.candidates[0].content.parts[0].text.trim();
        }
      } catch (e) {
        console.error("AI Notification generation failed, using fallback.", e);
      }
    }

    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(defaultTitle, {
      body: aiMessage,
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      vibrate: [200, 100, 200],
      data: {
        url: "./",
        action: targetView
      }
    });
  }

  async sendTestNotification() {
    const granted = await this.requestPermission();
    if (granted) {
      this.triggerAINotification("test", {});
    } else {
      alert("Bildirim izni verilmedi. Lütfen tarayıcı ayarlarınızdan izin verin.");
    }
  }
}

window.NotificationManager = NotificationManager;
