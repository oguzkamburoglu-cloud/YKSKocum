# AI Koçum — Sunucu tarafı (API)

## Durum (2026-08-22)

Site canlıda: https://aikocum.com.tr. Ana nginx (yönetici) → 127.0.0.1:8090 →
kullanıcının rootless Docker yığını. **Dilim 1** hazır: hesap + oturum API'si,
MariaDB, sunucu-saatli deneme süresi. Sonraki dilimler: istemci bağlama,
push + AI proxy, koç senk + ödeme.

## Yığın (docker/)

| Servis | İmaj | Görev |
|---|---|---|
| web | nginx:alpine | statik site + `/api/*` → php |
| php | php:8.3-fpm (php.Dockerfile) | `sunucu/api` |
| db  | mariadb:11 | kalıcı hacim `aikocum_db` |

Tek giriş noktası `sunucu/api/index.php`; `sunucu/` dizini dışarıya kapalı,
API'ye yalnızca `/api/` yolundan ulaşılır (docker/nginx.conf).

## Uç noktalar (v1)

```
GET  /api/saglik                      sunucu + db ayakta mı
POST /api/kayit  {eposta,parola,ad?}  201 {token, kullanici}
POST /api/giris  {eposta,parola}      200 {token, kullanici}
POST /api/cikis  (Bearer)             200
GET  /api/ben    (Bearer)             200 {kullanici}
```
`kullanici`: id, eposta, ad, rol, **paket** (deneme|free|baslangic|standart|pro —
sunucu saatiyle hesaplanır), deneme_bitti, deneme_kalan_gun, sunucu_zamani.
Token: 32 bayt rastgele, DB'de yalnızca sha256 özeti, 30 gün. Hız sınırı:
kayıt/giriş 10 istek / 15 dk / IP. Yalnızca JSON gövde kabul edilir.

## Sunucuda kurulum (sudo GEREKMEZ — rootless Docker)

```bash
cd ~/aikocum/site/sunucu
cp .env.example .env && nano .env        # gizli degerleri SEN yaz: openssl rand -hex 32
cd docker
docker rm -f aikocum 2>/dev/null         # eski tek-container'i kaldir (ayni port)
docker compose up -d --build
curl -s http://127.0.0.1:8090/api/saglik # {"ok":true,"db":true,...}
```
Güncelleme: site dosyalarını `~/aikocum/site`'a çıkart (tar), sonra
`docker compose up -d --build` (yalnızca PHP imajı değiştiyse build gerekir;
statik/PHP kaynak dosyaları canlı bağlıdır).

Günlükler: `docker compose logs -f php` · Veritabanı kabuğu:
`docker compose exec db mariadb -u aikocum -p aikocum`

## Yerel test (Mac, sunucu gerekmez)

```bash
bash sunucu/test/api-test.sh   # 28 uçtan uca test, SQLite + PHP yerleşik sunucu
php  sunucu/test/paket-test.php # deneme/paket zaman mantığı
```

## Eski not — paylaşımlı hosting yolu (kullanılmıyor)

1. Alan adını al ve hosting'e yönlendir.
2. cPanel'den ücretsiz SSL'i (AutoSSL / Let's Encrypt) etkinleştir.
3. Bu klasörü hosting'e yükle.
4. Tarayıcıdan aç: `https://ALANADIN/sunucu/kontrol.php`
5. Çıkan sonucu ilet.

`kontrol.php` sunucuda **hiçbir değişiklik yapmaz**; yalnızca gerekli
özelliklerin (OpenSSL EC/ES256, cURL, PDO MySQL, HTTPS) var olup
olmadığını raporlar.

## Neden önce kontrol

Paylaşımlı hosting'lerde bazı sağlayıcılar OpenSSL'in eliptik eğri
desteğini veya dışarıya giden HTTP isteklerini kapatır. İkisi de Web Push
için zorunlu. Arka ucu yazmadan önce bunu bilmek gerekiyor; yoksa
çalışmayacak bir şey için yüzlerce satır kod yazmış oluruz.
