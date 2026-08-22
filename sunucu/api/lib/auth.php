<?php
/**
 * AI Koçum API — hesap ve oturum.
 *
 * Tasarim:
 *  - Parola: password_hash (bcrypt/argon, PHP varsayilani). Duz metin asla saklanmaz.
 *  - Oturum: 32 bayt rastgele token istemciye verilir; veritabaninda yalnizca
 *    sha256 ozeti durur (DB sizsa bile token kullanilamaz). 30 gun gecerli.
 *  - Deneme suresi ve paket SUNUCU saatiyle hesaplanir. Istemci ne derse desin
 *    yetki burada belirlenir (red-team B-1/B-3 bulgulari bununla kapanir).
 */
declare(strict_types=1);

const DENEME_GUN    = 7;
const OTURUM_GUN    = 30;
const PAKETLER_GECERLI = ['deneme', 'free', 'baslangic', 'standart', 'pro'];

function token_uret(): string {
    return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
}
function token_ozeti(string $token): string {
    return hash('sha256', $token);
}

/** Kullanici icin yeni oturum acar, ham token'i dondurur. */
function oturum_ac(int $kullaniciId, string $cihaz = ''): string {
    $token = token_uret();
    $simdi = time();
    db()->prepare('INSERT INTO oturumlar (kullanici_id, token_hash, olusturma, bitis, cihaz) VALUES (?,?,?,?,?)')
        ->execute([$kullaniciId, token_ozeti($token), $simdi, $simdi + OTURUM_GUN * 86400, mb_substr($cihaz, 0, 120)]);
    return $token;
}

/** Token'dan kullaniciyi bulur; yoksa/suresi dolduysa null. */
function oturum_kullanicisi(?string $token): ?array {
    if ($token === null) return null;
    $st = db()->prepare(
        'SELECT k.* FROM oturumlar o JOIN kullanicilar k ON k.id = o.kullanici_id
         WHERE o.token_hash = ? AND o.bitis > ? LIMIT 1');
    $st->execute([token_ozeti($token), time()]);
    $k = $st->fetch();
    return $k ?: null;
}

/** Oturum zorunlu uc noktalar icin: kullaniciyi dondurur ya da 401 ile cikar. */
function oturum_zorunlu(): array {
    $k = oturum_kullanicisi(istek_tokeni());
    if (!$k) hata(401, 'Oturum gerekli');
    return $k;
}

/**
 * Kullanicinin ETKIN paketini sunucu saatiyle hesaplar.
 *  - deneme: baslangictan DENEME_GUN gecmediyse 'deneme', gectiyse 'free'
 *  - ucretli paket: paket_bitis gecmisse 'free'
 */
function etkin_paket(array $k, ?int $simdi = null): array {
    $simdi = $simdi ?? time();
    $paket = $k['paket'];
    $denemeBitis = (int)$k['deneme_baslangic'] + DENEME_GUN * 86400;
    $kalanSn = $denemeBitis - $simdi;

    if ($paket === 'deneme') {
        $etkin = $kalanSn > 0 ? 'deneme' : 'free';
    } elseif (in_array($paket, ['baslangic', 'standart', 'pro'], true)) {
        $bitis = $k['paket_bitis'] !== null ? (int)$k['paket_bitis'] : null;
        $etkin = ($bitis === null || $bitis > $simdi) ? $paket : 'free';
    } else {
        $etkin = 'free';
    }
    return [
        'paket'             => $etkin,
        'deneme_bitti'      => $etkin === 'free' && $paket === 'deneme',
        'deneme_kalan_gun'  => max(0, (int)ceil($kalanSn / 86400)),
        'paket_bitis'       => $k['paket_bitis'] !== null ? (int)$k['paket_bitis'] : null,
    ];
}

/** /api/ben ve giris/kayit yanitlarinda donen kullanici gorunumu (hash vb. ASLA donmez). */
function kullanici_gorunumu(array $k): array {
    return [
        'id'     => (int)$k['id'],
        'eposta' => $k['eposta'],
        'ad'     => $k['ad'],
        'rol'    => $k['rol'],
    ] + etkin_paket($k) + ['sunucu_zamani' => time()];
}

// ---------------------------------------------------------------------
// Uc noktalar
// ---------------------------------------------------------------------

function eposta_dogrula(string $e): string {
    $e = mb_strtolower(trim($e));
    if ($e === '' || mb_strlen($e) > 190 || !filter_var($e, FILTER_VALIDATE_EMAIL)) hata(422, 'Geçerli bir e-posta gir');
    return $e;
}
function parola_dogrula(string $p): string {
    if (mb_strlen($p) < 8) hata(422, 'Parola en az 8 karakter olmalı');
    if (mb_strlen($p) > 200) hata(422, 'Parola çok uzun');
    return $p;
}

function uc_kayit(): never {
    oran_sinirla('kayit', 10, 900);
    $v = istek_govdesi();
    $eposta = eposta_dogrula((string)($v['eposta'] ?? ''));
    $parola = parola_dogrula((string)($v['parola'] ?? ''));
    $ad = mb_substr(trim(strip_tags((string)($v['ad'] ?? ''))), 0, 80);

    $pdo = db();
    $st = $pdo->prepare('SELECT id FROM kullanicilar WHERE eposta = ?');
    $st->execute([$eposta]);
    if ($st->fetch()) hata(409, 'Bu e-posta zaten kayıtlı');

    $simdi = time();
    $pdo->prepare('INSERT INTO kullanicilar (eposta, parola_hash, ad, rol, paket, deneme_baslangic, olusturma, son_giris)
                   VALUES (?,?,?,?,?,?,?,?)')
        ->execute([$eposta, password_hash($parola, PASSWORD_DEFAULT), $ad, 'ogrenci', 'deneme', $simdi, $simdi, $simdi]);
    $id = (int)$pdo->lastInsertId();

    $token = oturum_ac($id, (string)($v['cihaz'] ?? ''));
    $st = $pdo->prepare('SELECT * FROM kullanicilar WHERE id = ?'); $st->execute([$id]);
    json_yanit(201, ['ok' => true, 'token' => $token, 'kullanici' => kullanici_gorunumu($st->fetch())]);
}

function uc_giris(): never {
    oran_sinirla('giris', 10, 900);
    $v = istek_govdesi();
    $eposta = mb_strtolower(trim((string)($v['eposta'] ?? '')));
    $parola = (string)($v['parola'] ?? '');

    $st = db()->prepare('SELECT * FROM kullanicilar WHERE eposta = ?');
    $st->execute([$eposta]);
    $k = $st->fetch();

    // Kullanici yoksa da dogrulama maliyeti odenir: zamanlama farkiyla
    // "bu e-posta kayitli mi" sorusu cevaplanamasin.
    $hash = $k ? $k['parola_hash'] : '$2y$10$' . str_repeat('a', 53);
    $dogru = password_verify($parola, $hash) && $k;
    if (!$dogru) hata(401, 'E-posta veya parola hatalı');

    db()->prepare('UPDATE kullanicilar SET son_giris = ? WHERE id = ?')->execute([time(), (int)$k['id']]);
    $token = oturum_ac((int)$k['id'], (string)($v['cihaz'] ?? ''));
    json_yanit(200, ['ok' => true, 'token' => $token, 'kullanici' => kullanici_gorunumu($k)]);
}

function uc_cikis(): never {
    $token = istek_tokeni();
    if ($token !== null) {
        db()->prepare('DELETE FROM oturumlar WHERE token_hash = ?')->execute([token_ozeti($token)]);
    }
    json_yanit(200, ['ok' => true]);
}

function uc_ben(): never {
    $k = oturum_zorunlu();
    json_yanit(200, ['ok' => true, 'kullanici' => kullanici_gorunumu($k)]);
}
