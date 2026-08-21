# Jest portu

**Bu klasör isteğe bağlıdır.** Projenin kendi test paketi
(`./test/calistir.sh`) hiçbir bağımlılık gerektirmez ve aynı davranışları
kapsar. Bu port, node tabanlı bir CI kullanmak isteyenler içindir.

```bash
npm init -y
npm i -D jest jest-environment-jsdom
npx jest test/jest
```

`package.json` içine:

```json
{
  "scripts": { "test": "jest test/jest" },
  "jest": { "testEnvironment": "jsdom" }
}
```

## Neden ikisi birden?

`app.js` derleme adımı olmayan, `<script>` ile yüklenen tek bir dosya.
Sırf test için npm bağımlılığı eklemek projeye bugün olmayan bir kurulum
yükü getirir. `jsc` macOS'ta hazır gelir, `calistir.sh` her makinede
çalışır. Jest'e geçmek isterseniz bu dosya kalıbı gösterir.
