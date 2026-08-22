# AI Koçum — Sunucu tarafı

Bu klasör, koç–öğrenci senkronizasyonu ve çoklu cihaz bildirimi için
gereken arka uç dosyalarını içerecek. Şu an yalnızca uygunluk kontrolü var.

## Durum (2026-08-22)

Site canlıda: https://aikocum.com.tr (rootless Docker `aikocum` → 127.0.0.1:8090,
ana nginx proxy + Let's Encrypt). Backend henüz yok; sıradaki adım aynı
Docker'a php-fpm eklemek.

## Şimdi ne yapmalı (paylaşımlı hosting için; VPS'te Docker yolu izlenir)

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
