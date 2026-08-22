# AI Koçum — YKS Çalışma Takip Uygulaması

Tarayıcıda çalışan, sunucu gerektirmeyen bir YKS hazırlık asistanı.
Tüm veriler kullanıcının kendi tarayıcısında (localStorage) saklanır.

**Canlı:** https://oguzkamburoglu-cloud.github.io/YKSKocum/

## Özellikler

- **Sınava kalan güne göre** kişiselleştirilmiş program (sabit gün sayısı değil;
  hedef, saat, soru ve deneme sayıları bu süreye göre ölçeklenir)
- **Son 1 ay sınav provası fazı:** %80 deneme çözümü, %20 tekrar
- Program otomatik oluşmaz — girilen hedef ve seviye tespit sonucuna göre bir
  **öneri** sunulur, yalnızca kabul edilirse kurulur
- Her göreve **kaynak kitap** ataması: hangi yayınevinin hangi kitabı
- **Fotoğraftan / PDF'ten program aktarma** (el yazısı için AI, basılı metin için OCR)
- **Sesle program oluşturma** (Türkçe sayı sözcükleri dahil: "yirmi beş" → 25)
- **Metinden toplu giriş** ve %30 yazımda tanıyan isim tamamlama
- Manuel planlayıcı: yayınevi / kitap / test no seçimi
- **Tercih motoru:** gerçek ÖSYM 2025-YKS taban başarı sıralamaları
  (Tablo-4'ten 9.377 program, 215 üniversite)
- Hata defteri, aralıklı tekrar, müfredat haritası, performans grafikleri
- Veli özet raporu
- Çevrimdışı çalışma ve cihaza kurulum (PWA)

## Çalıştırma

Statik dosyalardan ibarettir, derleme adımı yoktur.

```bash
python3 -m http.server 8000
```

Sonra `http://localhost:8000` adresini aç. (`YKSKocum-Baslat.command`
dosyası bunu macOS'ta çift tıklamayla yapar.)

> `file://` ile açmak yerine mutlaka bir sunucu üzerinden aç:
> servis çalışanı ve bazı tarayıcı özellikleri `file://` altında çalışmaz.

## Yayınlama

Herhangi bir statik hosting'e olduğu gibi yüklenebilir (GitHub Pages, Netlify,
Vercel, Cloudflare Pages). **HTTPS gereklidir** — servis çalışanı ve dosya
okuma özellikleri güvenli bağlam ister.

## Ayarlar

| Ayar | Yer | Varsayılan | Açıklama |
|---|---|---|---|
| `MONETIZATION_ENABLED` | `app.js` | `true` | `false` iken tüm paket/abonelik yüzeyleri gizlenir. |
| `KOC_AKTIF` | `app.js` | `false` | Koç bölümü. Sunucu hazır olmadığı için "yakında" olarak görünür. |
| `APP_CONFIG.LOGGING_ENDPOINT` | `app.js` | `''` (kapalı) | Uzak hata telemetrisi. Kendi toplama ucun varsa adresini yaz. |
| AI anahtarı | Uygulama içi Profil kartı | — | Google Gemini API anahtarı. Koda gömülü değildir, kullanıcının tarayıcısında saklanır. |

## Paketler

7 gün ücretsiz deneme. Ödeme altyapısı henüz bağlı değildir; ücretli planlar
seçildiğinde kullanıcıya bu durum açıkça bildirilir ve paket yükseltilmez.

| Paket | Fiyat | Kapsam |
|---|---|---|
| Başlangıç | 299 ₺/ay | Sadece program oluşturma |
| Standart | 499 ₺/ay | Takip, hata defteri, deneme analizi, veli raporu |
| Pro | 799 ₺/ay | Fotoğraf/PDF/ses aktarma, AI koç yorumları, tercih motoru |

## `sunucu/` klasörü

Paylaşımlı hosting (cPanel/PHP) için hazırlanmış, **henüz devrede olmayan**
sunucu tarafı. Alan adı ve HTTPS hazır olduğunda kullanılacak:

- `kontrol.php` — sunucunun gereksinimleri karşılayıp karşılamadığını raporlar
- `push.php` — saf PHP ile Web Push (VAPID / ES256 imzalama); imza doğrulandı
- `BENIOKU.md` — kurulum adımları

## Dış bağımlılıklar

CDN'den yüklenir, internet bağlantısı gerektirir:

- Chart.js — grafikler
- Tesseract.js — basılı metin OCR
- pdf.js — PDF okuma
- FontAwesome — ikonlar

Bağlantı yoksa uygulama çalışmaya devam eder; yalnızca ilgili özellikler
devre dışı kalır ve kullanıcıya bunu bildiren bir mesaj gösterilir.
