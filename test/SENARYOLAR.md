# Test Senaryoları — Analiz, Raporlama ve Akıllı Öneri Motoru

Her senaryo **çalışan bir teste** bağlıdır. Koşum:

```bash
./test/calistir.sh
```

Durum: **144 test (jsc) + 23 test (Jest)** — hepsi geçiyor, çıkış kodu `0`.

| Grup | Dosya | Test |
|---|---|---|
| 1 · Veri hesaplama & matematiksel doğruluk | `01-hesaplama.js` | 31 |
| 2 · Görselleştirme verisi & edge case | `02-gorsellestirme-edge.js` | 42 |
| 3 · Mock data ile render doğrulaması | `03-render-mock.js` | 44 |
| 4 · Program üreticisi bütçe uyumu | `04-program-butcesi.js` | 27 |
| — · Jest portu (isteğe bağlı) | `jest/analiz.test.js` | 23 |

---

## GRUP 1 — Veri Hesaplama ve Matematiksel Doğruluk

### 1.1 Net hesabı — küsuratlı durumlar

**Önkoşul:** `app.netHesapla` erişilebilir; DOM özet kartları kurulu.
**Kural:** YKS neti = `doğru − yanlış/4`. Netler **çeyreklik** adımlarla gelir.

| ID | Girdi | Beklenen | Not |
|---|---|---|---|
| N-01 | 13D 3Y | **12.25** | Müşteri örneği |
| N-02 | 10D 1Y | 9.75 | |
| N-03 | 20D 2Y | 19.5 | |
| N-04 | 40D 4Y | 39 | Tam sayı |
| N-05 | 0D 4Y | −1 | Negatif |
| N-06 | 1D 7Y | −0.75 | Negatif + çeyrek |

**Kabul kriteri:** Değer hem hesapta hem **özet kartında** birebir görünmeli.
1 ondalığa yuvarlama yasak (`12.25` → `12.3` kabul edilemez).

### 1.2 Net tanımı tutarlılığı

**Risk:** Aynı veri farklı ekranlarda farklı net gösterirse rapor güvenilmez olur.

| ID | Senaryo | Beklenen |
|---|---|---|
| N-07 | 2D 20Y için özet kartı ve verim kartı | İkisi de **−3** |
| N-08 | `netHesapla(2, 20)` | −3 (sıfıra **kırpılmaz**) |
| N-09 | `netHesapla(undefined, undefined)` | 0 |
| N-10 | `netHesapla("13", "3")` metin girdi | 12.25 |
| N-11 | `netHesapla(NaN, 4)` | −1 |
| N-12 | Kaynak taraması: `Math.max(0, D − Y/4)` kalıbı | **0 eşleşme** (regresyon) |

**Gerekçe:** Negatifi kırpmak, "yanlışla net kaybediyorsun" sinyalini gizler —
müşterinin istediği *"sallama eğilimi uyarısı"* tam da bu sinyale dayanır.

### 1.3 Zaman / Net verimlilik oranı

**Önkoşul:** En az 2 ders (kart karşılaştırma yapar).

| ID | Girdi | Beklenen |
|---|---|---|
| V-01 | Fizik 8D 4Y / 600 dk | **0.7 net/saat** |
| V-02 | Kimya 22D 8Y / 300 dk | **4 net/saat** |
| V-03 | İki ders arasında ≥1.5× fark | Verimsiz ders adıyla uyarı |
| V-04 | Süre = 0 | Çökmez, sıfıra bölme yok |

### 1.4 Konu bitirme yüzdesi — sıfıra bölme ve boş veri

| ID | Senaryo | Beklenen |
|---|---|---|
| M-01 | Hiç konu bitmemiş | Özet döner, `biten = 0`, tüm dersler %0 |
| M-02 | Aynı durumda yüzde alanları | Hiçbiri `NaN` değil |
| M-03 | Geçersiz alan adı (`"OlmayanAlan"`) | Çökmez, **Sayısal'a düşer** (kodda bilinçli fallback) |
| M-04 | Bir dersin 1/3'ü bitmiş | `yuzde === round(biten/toplam*100)` |

**Not:** Tek doğruluk kaynağı `state.topicStatuses`. `state.curriculumProgress`
dizisine hiçbir yerde yazılmaz; oradan okuyan kod ölü koddur.
