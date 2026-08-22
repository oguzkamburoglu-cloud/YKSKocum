<?php
/**
 * Yerel gelistirme yonlendiricisi — PHP'nin yerlesik sunucusu icin.
 * Uretimde KULLANILMAZ (orada nginx yonlendirir).
 *
 *   DB_DSN="sqlite:/tmp/aikocum-dev.sqlite" php -S 127.0.0.1:8793 -t . sunucu/api/router.php
 *
 * /api/* -> index.php ; digerleri statik dosya olarak sunulur.
 */
declare(strict_types=1);
$yol = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (str_starts_with($yol, '/api/') || $yol === '/api') {
    require __DIR__ . '/index.php';
    return true;
}
return false; // statik dosya
