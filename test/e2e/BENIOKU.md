# E2E Testleri (Playwright)

Gerçek tarayıcıda (headless Chromium) uçtan uca akışları doğrular.

```bash
npm i -D @playwright/test
npx playwright install chromium
npx playwright test --config=test/e2e/playwright.config.js
```

Ayrıca sunucu başlatmaya gerek yok — yapılandırma `python3 -m http.server 8791`
başlatır ve test bitince kapatır.

## Kapsam

| # | Akış |
|---|---|
| 4.1 | Kayıt → paket ekranı → deneme → program kabul → görev tamamla → **analizde 15.25 net** |
| 4.2 | Sayfa yenilendiğinde program, kayıtlar ve paket durumu korunuyor |
| 4.3 | Başlangıç kullanıcısı kilitli modüle giremiyor · deneme bitince uygulamaya girilemiyor, veri silinmiyor |
| 4.4 | Aktarılan içerikteki `<script>` ve `onerror` çalışmıyor (gerçek tarayıcıda `dialog`/`pageerror` dinlenerek) |
| 4.5 | İlk açılışta görünür modal yok, her şey sıfır, konsola hata düşmüyor |

## Neden bazı adımlar `page.evaluate` ile

Kayıt sihirbazı ve paket akışı çok adımlı; her adımı tıklama ile sürmek testi
kırılgan yapar (buton metni değişince test kalır). Kritik **doğrulamalar**
gerçek DOM'dan okunur (`getComputedStyle`, `innerHTML`, `textContent`);
yalnızca **kurulum** adımları `app` API'si üzerinden yapılır.

XSS testi bunun istisnasıdır: orada gerçek tarayıcı davranışı ölçülür —
`dialog` ve `pageerror` olayları dinlenir, script çalışsaydı test kalırdı.
