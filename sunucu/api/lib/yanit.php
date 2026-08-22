<?php
/**
 * AI Koçum API — JSON yanit/istek yardimcilari.
 * Her yanit JSON'dur; hata ayrintilari istemciye sizdirilmaz (error_log'a gider).
 */
declare(strict_types=1);

function yanit_basliklari(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
}

/** JSON govde yazar ve cikar. */
function json_yanit(int $kod, array $govde): never {
    http_response_code($kod);
    yanit_basliklari();
    echo json_encode($govde, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hata(int $kod, string $mesaj, array $ek = []): never {
    json_yanit($kod, ['ok' => false, 'hata' => $mesaj] + $ek);
}

/** Istek govdesini JSON olarak okur; 64 KB ustu ve bozuk JSON reddedilir. */
function istek_govdesi(): array {
    $ham = file_get_contents('php://input', false, null, 0, 65536 + 1);
    if ($ham === false || $ham === '') return [];
    if (strlen($ham) > 65536) hata(413, 'İstek gövdesi çok büyük');
    $veri = json_decode($ham, true);
    if (!is_array($veri)) hata(400, 'Geçersiz JSON');
    return $veri;
}

/** Istemci IP'si: ana nginx proxy arkasinda X-Forwarded-For'un ILK degeri. */
function istemci_ip(): string {
    $xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($xff !== '') {
        $ilk = trim(explode(',', $xff)[0]);
        if (filter_var($ilk, FILTER_VALIDATE_IP)) return $ilk;
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/** Bearer token'i okur (Authorization: Bearer ... ya da X-Oturum basligi). */
function istek_tokeni(): ?string {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+([A-Za-z0-9_\-]{20,200})$/', $auth, $m)) return $m[1];
    $x = $_SERVER['HTTP_X_OTURUM'] ?? '';
    if (preg_match('/^[A-Za-z0-9_\-]{20,200}$/', $x)) return $x;
    return null;
}
