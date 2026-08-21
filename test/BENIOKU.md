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
| `01-hesaplama.js` | Grup 1 — veri hesaplama ve matematiksel doğruluk |

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
