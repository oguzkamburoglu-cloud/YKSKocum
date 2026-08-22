<?php
/**
 * AI Koçum API — tek giris noktasi.
 * nginx /api/* isteklerini buraya yollar (bkz. docker/nginx.conf).
 *
 *   GET  /api/saglik     sunucu + veritabani ayakta mi
 *   POST /api/kayit      {eposta, parola, ad?}        -> 201 {token, kullanici}
 *   POST /api/giris      {eposta, parola}             -> 200 {token, kullanici}
 *   POST /api/cikis      (Bearer)                     -> 200
 *   GET  /api/ben        (Bearer)                     -> 200 {kullanici}
 *
 * Yetki karari (paket, deneme, rol) HER ZAMAN sunucuda, sunucu saatiyle verilir.
 */
declare(strict_types=1);

require __DIR__ . '/lib/yanit.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/oran.php';
require __DIR__ . '/lib/auth.php';

const API_SURUM = '1.0.0';

// Beklenmeyen hatalar: istemciye ayrinti sizdirma, kayda yaz.
set_exception_handler(function (Throwable $e): void {
    error_log('[aikocum-api] ' . get_class($e) . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    json_yanit(500, ['ok' => false, 'hata' => 'Sunucu hatası']);
});
set_error_handler(function (int $no, string $str, string $dosya, int $satir): bool {
    throw new ErrorException($str, 0, $no, $dosya, $satir);
});

$yontem = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$yol = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$yol = preg_replace('#^/api#', '', $yol) ?: '/';
$yol = rtrim($yol, '/') ?: '/';

// Yalnizca JSON govde kabul edilir (CSRF: form-post ile tetiklenemez)
if ($yontem === 'POST') {
    $tip = $_SERVER['CONTENT_TYPE'] ?? '';
    if ($tip !== '' && stripos($tip, 'application/json') !== 0) hata(415, 'Content-Type application/json olmalı');
}

match ([$yontem, $yol]) {
    ['GET',  '/saglik'] => (function (): never {
        $dbOk = false;
        try { db()->query('SELECT 1'); $dbOk = true; } catch (Throwable $e) { error_log('[aikocum-api] db: ' . $e->getMessage()); }
        json_yanit($dbOk ? 200 : 503, ['ok' => $dbOk, 'surum' => API_SURUM, 'db' => $dbOk, 'zaman' => time()]);
    })(),
    ['POST', '/kayit'] => uc_kayit(),
    ['POST', '/giris'] => uc_giris(),
    ['POST', '/cikis'] => uc_cikis(),
    ['GET',  '/ben']   => uc_ben(),
    default => hata(404, 'Bulunamadı'),
};
