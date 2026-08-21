# YKSKoçum — Test Paketi

Harici bağımlılık yoktur (npm/node gerekmez). Testler macOS'ta hazır gelen
**JavaScriptCore** (`jsc`) ile koşar; `app.js` gerçek hâliyle yüklenir.

## Koşum

```bash
./test/calistir.sh
```

Çıkış kodu: tüm testler geçerse `0`, en az bir test kalırsa `1` (CI'ye uygun).

## Dosyalar

| Dosya | İçerik |
|---|---|
| `harness.js` | DOM/localStorage/Chart.js taklidi + `app.js` yükleyici + test çerçevesi (`T.esit`, `T.dogru`, `T.yakinEsit`) |
| `01-hesaplama.js` | Grup 1 — veri hesaplama ve matematiksel doğruluk (31 test) |
| `02-gorsellestirme-edge.js` | Grup 2 — sıfır veri, uç değerler, dönem filtreleri (42 test) |
| `mock-veri.js` | Paylaşılan, **belirlenimci** mock öğrenci senaryosu |
| `03-render-mock.js` | Grup 3 — mock data ile kart ve grafik render doğrulaması (44 test) |
| `04-program-butcesi.js` | Grup 4 — program üreticisi günlük bütçeye uyuyor mu (27 test) |
| `jest/` | Aynı testlerin Jest portu (isteğe bağlı, npm gerekir) |

## Harness neden gerekli

`app.js` tarayıcı için yazılmıştır: `document`, `window`, `localStorage`,
`Chart` global'lerine dokunur. Harness bunları taklit eder, ayrıca
`curriculum.js` / `questions.js` / `osym-data.js` dosyalarını `window`'a
yükler. **Bu adım atlanırsa** `curriculum.topicsFor()` boş döner ve müfredat
testleri yanlışlıkla "uygulama hatası" gibi görünür.

## Test yazarken

- `kurulum(state)` her testte temiz `app.state` ve sahte DOM kurar.
- `kayit({...})` gerçek `chartData` kaydı şeklinde nesne üretir.
- Beklentiyi **gerçek davranışa** göre yazın; kodu okumadan varsayım yapmayın.
  Bu pakette 4 test, uygulama değil testin kendisi yanlış olduğu için kaldı
  (`exam` alanı `"TYT"` büyük harf, geçersiz alan bilinçli olarak Sayısal'a
  düşer). Bunlar düzeltildi ve gerekçeleri koda yorum olarak yazıldı.

## Bulunan hatalar (kayıt)

| # | Hata | Nerede |
|---|---|---|
| 1 | Netler 1 ondalığa yuvarlanıyordu (13D 3Y → 12.3, doğrusu 12.25) | 7 hesap noktası |
| 2 | İki farklı net tanımı; 3 yer negatifi 0'a kırpıyordu | `netHesapla` ile birleştirildi |
| 3 | YDT hiç tanınmıyordu; Dil öğrencisinin netleri "TYT" sayılıyordu | `sinavTuruBelirle` |
| 4 | Günde 24 saati aşan toplam sessizce kabul ediliyordu | `submitTestScore` uyarısı |
| 5 | **Program üreticisi günlük bütçeyi hiç sormuyordu**: okula giden, "4 saat" diyen öğrenciye günde 11.1 saat üretiliyor, 302 günün 172'si taşıyor, uygulama açılır açılmaz "saatlere sığmıyor" uyarısı veriyordu | `gunlukCalismaButcesi` + `gunuButceyeSigdir` |

Toplam **117 test** (jsc) + **23 test** (Jest portu). Hepsi geçiyor.

## Kırılganlık notu (hata değil)

`renderCharts` içinde **4 korumasız** `getElementById(...).X` erişimi var
(`netsLineChart`, `balanceRadarChart`, `balanceRecommendation`, `speedLineChart`).
Elemanlar bugün `index.html`'de mevcut, ama biri kaldırılırsa **tüm analiz
sekmesi** tek satırda ölür. Diğer erişimler null korumalıdır.
