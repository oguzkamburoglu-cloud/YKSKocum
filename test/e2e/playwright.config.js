// Playwright yapilandirmasi — kendi statik sunucusunu baslatir.
const { defineConfig } = require("@playwright/test");
const path = require("path");

module.exports = defineConfig({
  testDir: __dirname,
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:8791",
    headless: true,
    viewport: { width: 1280, height: 900 }
  },
  webServer: {
    command: "python3 -m http.server 8791",
    cwd: path.resolve(__dirname, "..", ".."),
    port: 8791,
    reuseExistingServer: true,
    // Python sunucusu her istegi stderr'e yazar; test ciktisini boguyor.
    stdout: "ignore",
    stderr: "ignore"
  }
});
