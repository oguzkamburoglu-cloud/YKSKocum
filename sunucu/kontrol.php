<?php
/**
 * DEFNE — Sunucu Uygunluk Kontrolü
 * ---------------------------------------------------------------
 * Bu dosyayı hosting'ine yükleyip tarayıcıdan aç:
 *     https://ALANADIN/sunucu/kontrol.php
 *
 * Hiçbir şey kurmaz, hiçbir şey değiştirmez. Yalnızca sunucunun
 * koç–öğrenci senkronizasyonu ve bildirim gönderimi için gerekli
 * özelliklere sahip olup olmadığını söyler.
 *
 * Sonucu bana ilet; arka ucu ona göre yazacağım.
 */
declare(strict_types=1);
header('Content-Type: text/html; charset=utf-8');

$sonuc = [];
function ekle(string $ad, bool $ok, string $detay, bool $zorunlu = true): void {
    global $sonuc;
    $sonuc[] = ['ad' => $ad, 'ok' => $ok, 'detay' => $detay, 'zorunlu' => $zorunlu];
}

// 1) PHP sürümü
$php = PHP_VERSION;
ekle('PHP sürümü', version_compare($php, '7.4', '>='), $php . (version_compare($php, '7.4', '>=') ? '' : ' — en az 7.4 gerekiyor'));

// 2) Gerekli eklentiler
foreach (['openssl' => true, 'curl' => true, 'json' => true, 'mbstring' => false, 'pdo_mysql' => true] as $ext => $zorunlu) {
    ekle("Eklenti: $ext", extension_loaded($ext), extension_loaded($ext) ? 'yüklü' : 'YOK', $zorunlu);
}

// 3) Web Push imzalama (VAPID / ES256) — bildirimlerin kalbi
$ecOk = false; $ecDetay = 'openssl yok';
if (extension_loaded('openssl')) {
    $k = @openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
    if ($k) {
        $sig = '';
        if (@openssl_sign('deneme', $sig, $k, 'sha256')) {
            $ecOk = true; $ecDetay = 'EC (prime256v1) + ES256 imzalama çalışıyor';
        } else { $ecDetay = 'EC anahtar üretildi ama imzalama başarısız'; }
    } else { $ecDetay = 'EC anahtar üretilemedi — hosting OpenSSL EC desteği kapatmış olabilir'; }
}
ekle('Bildirim imzalama (ES256)', $ecOk, $ecDetay);

// 4) Dışarıya HTTPS isteği — bildirim push servisine gidebiliyor mu
$disOk = false; $disDetay = 'curl yok';
if (function_exists('curl_init')) {
    $ch = curl_init('https://fcm.googleapis.com/');
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_NOBODY => true]);
    curl_exec($ch);
    $kod = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $hata = curl_error($ch);
    curl_close($ch);
    $disOk = $kod > 0;
    $disDetay = $disOk ? "bağlanabiliyor (HTTP $kod)" : ('engelli görünüyor' . ($hata ? " — $hata" : ''));
}
ekle('Dışarıya bağlantı (push servisi)', $disOk, $disDetay);

// 5) HTTPS — tarayıcı bildirimleri için zorunlu
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
      || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
      || (($_SERVER['SERVER_PORT'] ?? '') === '443');
ekle('HTTPS', $https, $https ? 'güvenli bağlantı' : 'sayfa HTTP üzerinden açıldı — bildirimler ve çevrimdışı mod çalışmaz');

// 6) Yazma izni
$dizin = __DIR__ . '/veri';
$yazilir = is_dir($dizin) ? is_writable($dizin) : @mkdir($dizin, 0755) && is_writable($dizin);
ekle('Yazma izni', (bool)$yazilir, $yazilir ? 'sunucu/veri klasörü yazılabilir' : 'klasör oluşturulamadı — cPanel dosya izinlerini kontrol et', false);

// 7) Veritabanı sürücüsü
$pdoSurucu = class_exists('PDO') ? implode(', ', PDO::getAvailableDrivers()) : '—';
ekle('PDO sürücüleri', class_exists('PDO') && in_array('mysql', PDO::getAvailableDrivers(), true), $pdoSurucu);

$zorunluHata = count(array_filter($sonuc, fn($s) => $s['zorunlu'] && !$s['ok']));
?>
<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>DEFNE — Sunucu Kontrolü</title>
<style>
body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#f6f7fb;color:#16192b;margin:0;padding:2rem 1rem;line-height:1.6}
.k{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e4e1ec;border-radius:14px;padding:1.75rem}
h1{font-size:1.35rem;margin:0 0 .3rem}
.alt{color:#5b5f7a;font-size:.9rem;margin:0 0 1.5rem}
.s{display:flex;gap:.75rem;align-items:flex-start;padding:.7rem 0;border-bottom:1px solid #efedf4}
.s:last-child{border-bottom:none}
.i{font-weight:800;width:1.5rem;flex-shrink:0}
.ok{color:#0f766e}.hata{color:#b91c1c}.uyari{color:#b45309}
.ad{font-weight:700;font-size:.94rem}
.d{color:#5b5f7a;font-size:.84rem;word-break:break-word}
.ozet{margin-top:1.5rem;padding:1rem 1.1rem;border-radius:10px;font-weight:700;font-size:.94rem}
.iyi{background:#e6f4f1;color:#0f766e;border:1px solid #0f766e}
.kotu{background:#fdecec;color:#b91c1c;border:1px solid #b91c1c}
code{background:#f1f0f6;padding:.1em .4em;border-radius:4px;font-size:.85em}
</style></head><body><div class="k">
<h1>DEFNE — Sunucu Uygunluk Kontrolü</h1>
<p class="alt">Bu sayfa sunucunda hiçbir değişiklik yapmaz. Sonucu ekran görüntüsüyle ilet.</p>
<?php foreach ($sonuc as $s): ?>
  <div class="s">
    <div class="i <?= $s['ok'] ? 'ok' : ($s['zorunlu'] ? 'hata' : 'uyari') ?>"><?= $s['ok'] ? '✓' : ($s['zorunlu'] ? '✗' : '!') ?></div>
    <div><div class="ad"><?= htmlspecialchars($s['ad']) ?><?= $s['zorunlu'] ? '' : ' <span style="font-weight:600;color:#5b5f7a">(isteğe bağlı)</span>' ?></div>
    <div class="d"><?= htmlspecialchars($s['detay']) ?></div></div>
  </div>
<?php endforeach; ?>
<div class="ozet <?= $zorunluHata ? 'kotu' : 'iyi' ?>">
<?= $zorunluHata
   ? "$zorunluHata zorunlu koşul sağlanmıyor. Bu hâliyle bildirim ve senkronizasyon kurulamaz."
   : "Sunucun uygun. Koç–öğrenci senkronizasyonu ve bildirim gönderimi kurulabilir." ?>
</div>
<p class="alt" style="margin-top:1.25rem">Not: Zamanlanmış bildirimler için cPanel'de <code>Cron Jobs</code> bölümünün açık olması da gerekiyor; bunu bu sayfa ölçemez, panelinden bakman gerek.</p>
</div></body></html>
