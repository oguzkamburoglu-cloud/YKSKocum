# DEFNE — YKS Çalışma Takip Uygulaması

Tarayıcıda çalışan, sunucu gerektirmeyen bir YKS hazırlık asistanı.
Tüm veriler kullanıcının kendi tarayıcısında (localStorage) saklanır.

## Özellikler

- 360 günlük kişiselleştirilmiş çalışma programı (8 hedef seviyesi, 4 alan)
- Her göreve **kaynak kitap** ataması: hangi yayınevinin hangi kitabı
- **Fotoğraftan / PDF'ten program oluşturma** (el yazısı için AI, basılı metin için OCR)
- Manuel planlayıcı: yayınevi / kitap / test no seçimi
- Hata defteri, aralıklı tekrar, müfredat haritası, performans grafikleri
- Çevrimdışı çalışma (PWA)

## Çalıştırma

Statik dosyalardan ibarettir, derleme adımı yoktur.

```bash
python3 -m http.server 8000
```

Sonra `http://localhost:8000` adresini aç.

> `file://` ile açmak yerine mutlaka bir sunucu üzerinden aç:
> servis çalışanı ve bazı tarayıcı özellikleri `file://` altında çalışmaz.

## Yayınlama

Herhangi bir statik hosting'e olduğu gibi yüklenebilir (GitHub Pages, Netlify,
Vercel, Cloudflare Pages). **HTTPS gereklidir** — servis çalışanı ve dosya
okuma özellikleri güvenli bağlam ister.

## Ayarlar

| Ayar | Yer | Açıklama |
|---|---|---|
| `MONETIZATION_ENABLED` | `app.js` | `false` iken tüm paket/abonelik yüzeyleri gizlidir. Ücretli sürüme geçmek için `true` yap. |
| `APP_CONFIG.LOGGING_ENDPOINT` | `app.js` | Uzak hata telemetrisi. Boş = kapalı (varsayılan). Kendi toplama ucun varsa adresini yaz. |
| AI anahtarı | Uygulama içi Profil kartı | Google Gemini API anahtarı. Koda gömülü değildir, kullanıcının tarayıcısında saklanır. |

## Dış bağımlılıklar

CDN'den yüklenir, internet bağlantısı gerektirir:

- Chart.js — grafikler
- Tesseract.js — basılı metin OCR
- pdf.js — PDF okuma
- FontAwesome — ikonlar

Bağlantı yoksa uygulama çalışmaya devam eder; yalnızca ilgili özellikler
devre dışı kalır ve kullanıcıya bunu bildiren bir mesaj gösterilir.
