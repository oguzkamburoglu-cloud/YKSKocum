<?php
/**
 * AI Koçum API — sema kurucu testi (saf PHP + SQLite bellek-ici).
 * Kosum: php sunucu/test/sema-test.php
 *
 * REGRESYON: schema.mysql.sql icindeki satir-ici bir yorumda ";" vardi
 * ("-- sha256(token); ham token saklanmaz"). Eski bolucu yalnizca tam-satir
 * yorumlari atiyordu; ifade ortadan kesildi, MariaDB 1064 verdi, sonraki
 * tablolar hic olusmadi ve kurucu ilk tabloyu gorup "sema var" sandi.
 * Bu test iki semayi da ayni boluculerden gecirir ve yarim kalmis kurulumun
 * kendini tamamladigini dogrular.
 */
declare(strict_types=1);
require __DIR__ . '/../api/lib/db.php';

$gecen = 0; $kalan = 0;
function bekle(string $ad, mixed $beklenen, mixed $bulunan): void {
    global $gecen, $kalan;
    if ($beklenen === $bulunan) { echo "  ✓ $ad\n"; $gecen++; }
    else { echo "  ✗ $ad\n      beklenen: " . var_export($beklenen, true) . "\n      bulunan : " . var_export($bulunan, true) . "\n"; $kalan++; }
}

foreach (['schema.mysql.sql', 'schema.sqlite.sql'] as $dosya) {
    echo "── $dosya ──\n";
    $sql = file_get_contents(__DIR__ . '/../' . $dosya);
    $ifadeler = sema_ifadeleri($sql);
    bekle("3 ifade uretildi", 3, count($ifadeler));
    bekle("hicbir ifadede yorum kalintisi yok", 0, count(array_filter($ifadeler, fn($i) => str_contains($i, '--'))));
    bekle("hepsi CREATE TABLE ile basliyor", true, array_reduce($ifadeler, fn($c, $i) => $c && str_starts_with($i, 'CREATE TABLE'), true));
    // Her ifade "kendi" tablosunu kapsamali: kesik ifade bu listede eksik tablo birakir
    $tablolar = array_map(fn($i) => preg_match('/CREATE TABLE IF NOT EXISTS (\w+)/', $i, $m) ? $m[1] : '?', $ifadeler);
    bekle("tablolar sirayla", ['kullanicilar', 'oturumlar', 'oran_sinir'], $tablolar);
    // Satir-ici yorumdaki ";" artik ifadeyi bolmuyor: oturumlar ifadesi 'bitis' ve 'cihaz' alanlarini iceriyor
    bekle("oturumlar ifadesi yorumdan sonra da devam ediyor (kesik degil)", true,
          str_contains($ifadeler[1], 'bitis') && str_contains($ifadeler[1], 'cihaz'));
}

echo "── SQLite'ta gercek kurulum ──\n";
$pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
sema_kur($pdo);
$var = fn(string $t) => (bool)$pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='$t'")->fetchColumn();
bekle("kullanicilar olustu", true, $var('kullanicilar'));
bekle("oturumlar olustu", true, $var('oturumlar'));
bekle("oran_sinir olustu", true, $var('oran_sinir'));

echo "── Yarim kalmis kurulum kendini tamamliyor ──\n";
$pdo2 = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo2->exec('CREATE TABLE kullanicilar (id INTEGER PRIMARY KEY)');   // yalnizca ilk tablo var
sema_kur($pdo2);
$var2 = fn(string $t) => (bool)$pdo2->query("SELECT name FROM sqlite_master WHERE type='table' AND name='$t'")->fetchColumn();
bekle("eksik oturumlar tamamlandi", true, $var2('oturumlar'));
bekle("eksik oran_sinir tamamlandi", true, $var2('oran_sinir'));
sema_kur($pdo2); // ikinci cagri: idempotent, hata vermemeli
bekle("tekrar cagri hatasiz (idempotent)", true, true);

echo "\nTOPLAM: " . ($gecen + $kalan) . "   GEÇEN: $gecen   KALAN: $kalan\n";
exit($kalan === 0 ? 0 : 1);
