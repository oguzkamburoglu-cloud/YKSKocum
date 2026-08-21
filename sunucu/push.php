<?php
/**
 * DEFNE — Web Push (VAPID) imzalama
 * ---------------------------------------------------------------
 * Paylaşımlı hosting'de Composer çoğu zaman kullanılamadığı için
 * dışarıdan kütüphane kullanılmaz; yalnızca PHP'nin openssl ve curl
 * eklentileri gerekir.
 *
 * TASARIM KARARI — yüksüz (payload'suz) push:
 * Web Push'ta bildirim metnini şifreli göndermek AES-GCM + ECDH + HKDF
 * gerektirir ve saf PHP'de kırılgandır. Bunun yerine BOŞ push gönderilir;
 * servis çalışanı push'u alınca sunucudan mesajı çeker (bkz. service-worker.js).
 * Sonuç kullanıcı için aynı, kod çok daha az riskli.
 */
declare(strict_types=1);

function b64url(string $bin): string {
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}
function b64url_decode(string $s): string {
    return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4));
}

/**
 * VAPID anahtar cifti uretir. Bir kez calistirilip sonuc config'e yazilir.
 *  - public : tarayiciya verilecek ham anahtar (base64url, 65 bayt)
 *  - pem    : sunucuda imzalama icin kullanilacak ozel anahtar
 * Ozel anahtari elle DER kurmak yerine OpenSSL'in kendi PEM ciktisi
 * saklanir; elle kurulan yapi gecersiz oluyordu.
 */
function vapid_anahtar_uret(): array {
    $k = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
    if (!$k) throw new RuntimeException('EC anahtar üretilemedi (hosting OpenSSL EC desteklemiyor olabilir)');
    $d = openssl_pkey_get_details($k);
    $pub = "\x04" . str_pad($d['ec']['x'], 32, "\0", STR_PAD_LEFT)
                  . str_pad($d['ec']['y'], 32, "\0", STR_PAD_LEFT);
    $pem = '';
    if (!openssl_pkey_export($k, $pem)) throw new RuntimeException('Özel anahtar dışa aktarılamadı');
    return ['public' => b64url($pub), 'pem' => $pem];
}

/** DER imzayi JOSE (R||S, 64 bayt) bicimine cevirir. */
function der_to_jose(string $der): string {
    $o = 0;
    if (ord($der[$o++]) !== 0x30) throw new RuntimeException('Geçersiz DER imza');
    if (ord($der[$o]) & 0x80) { $o += 1 + (ord($der[$o]) & 0x7f); } else { $o++; }
    $al = function () use ($der, &$o): string {
        if (ord($der[$o++]) !== 0x02) throw new RuntimeException('Geçersiz DER tamsayı');
        $len = ord($der[$o++]);
        $v = substr($der, $o, $len); $o += $len;
        $v = ltrim($v, "\0");
        return str_pad($v, 32, "\0", STR_PAD_LEFT);
    };
    return $al() . $al();
}

/** VAPID JWT uretir (ES256). Ozel anahtar PEM olarak verilir. */
function vapid_jwt(string $audience, string $subject, string $pem): string {
    $header  = b64url(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
    $payload = b64url(json_encode([
        'aud' => $audience,
        'exp' => time() + 12 * 3600,
        'sub' => $subject,
    ]));
    $veri = $header . '.' . $payload;

    $key = openssl_pkey_get_private($pem);
    if (!$key) throw new RuntimeException('VAPID özel anahtarı okunamadı');

    $der = '';
    if (!openssl_sign($veri, $der, $key, OPENSSL_ALGO_SHA256)) throw new RuntimeException('JWT imzalanamadı');
    return $veri . '.' . b64url(der_to_jose($der));
}

/** Tek bir aboneye bos push gonderir. Basarili ise true. */
function push_gonder(string $endpoint, string $vapidPub, string $vapidPem, string $subject): array {
    $u = parse_url($endpoint);
    $aud = $u['scheme'] . '://' . $u['host'];
    $jwt = vapid_jwt($aud, $subject, $vapidPem);

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => [
            'TTL: 86400',
            'Content-Length: 0',
            'Authorization: vapid t=' . $jwt . ', k=' . $vapidPub,
        ],
    ]);
    $cevap = curl_exec($ch);
    $kod = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $hata = curl_error($ch);
    // curl_close() PHP 8.0'dan beri etkisiz, 8.5'te uyarı veriyor

    return ['ok' => $kod >= 200 && $kod < 300, 'kod' => $kod, 'hata' => $hata, 'cevap' => $cevap];
}
