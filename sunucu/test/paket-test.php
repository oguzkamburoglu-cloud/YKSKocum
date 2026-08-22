<?php
/**
 * AI Koçum API — etkin_paket() zaman mantigi testi (saf PHP, sunucu gerekmez).
 * Kosum: php sunucu/test/paket-test.php
 * Deneme suresi ve ucretli paket bitisi SUNUCU saatiyle hesaplanmali;
 * istemcinin gonderdigi hicbir tarih bu karari etkilemez.
 */
declare(strict_types=1);
require __DIR__ . '/../api/lib/yanit.php';
require __DIR__ . '/../api/lib/auth.php';

$gecen = 0; $kalan = 0;
function bekle(string $ad, mixed $beklenen, mixed $bulunan): void {
    global $gecen, $kalan;
    if ($beklenen === $bulunan) { echo "  ✓ $ad\n"; $gecen++; }
    else { echo "  ✗ $ad\n      beklenen: " . var_export($beklenen, true) . "\n      bulunan : " . var_export($bulunan, true) . "\n"; $kalan++; }
}
$simdi = 1_800_000_000;
// DIKKAT: PHP'de "+" birlesiminde SOL taraf kazanir; ustte yazilan degerler
// once gelmeli, varsayilanlar sonra.
$k = fn(array $ek) => $ek + ['paket' => 'deneme', 'deneme_baslangic' => $simdi, 'paket_bitis' => null];

echo "── Deneme suresi (sunucu saati) ──\n";
$p = etkin_paket($k([]), $simdi);
bekle('yeni hesap: deneme', 'deneme', $p['paket']);
bekle('7 gun kaldi', 7, $p['deneme_kalan_gun']);

$p = etkin_paket($k(['deneme_baslangic' => $simdi - 6 * 86400 - 3600]), $simdi);
bekle('6 gun 1 saat sonra hala deneme', 'deneme', $p['paket']);
bekle('kalan 1 gun (yukari yuvarlanir)', 1, $p['deneme_kalan_gun']);

$p = etkin_paket($k(['deneme_baslangic' => $simdi - 7 * 86400]), $simdi);
bekle('tam 7 gun sonra: free', 'free', $p['paket']);
bekle('deneme_bitti bayragi', true, $p['deneme_bitti']);
bekle('kalan 0', 0, $p['deneme_kalan_gun']);

// SALDIRI: istemci deneme_baslangic'i gelecege alamaz — bu alan sunucuda yazilir.
// Burada yalnizca fonksiyonun gelecek tarihe de sagduyulu davrandigini dogruluyoruz.
$p = etkin_paket($k(['deneme_baslangic' => $simdi + 365 * 86400]), $simdi);
bekle('gelecek tarihli baslangic deneme sayilir ama', 'deneme', $p['paket']);
bekle('kalan gun 7 ile SINIRLI degil (kaynak: sunucu yazar, bu yol istemciye kapali)', true, $p['deneme_kalan_gun'] > 7);

echo "── Ucretli paket bitisi ──\n";
$p = etkin_paket(['paket' => 'pro', 'deneme_baslangic' => $simdi - 100 * 86400, 'paket_bitis' => $simdi + 86400], $simdi);
bekle('suresi dolmamis pro: pro', 'pro', $p['paket']);
bekle('pro icin deneme_bitti false', false, $p['deneme_bitti']);
$p = etkin_paket(['paket' => 'pro', 'deneme_baslangic' => $simdi - 100 * 86400, 'paket_bitis' => $simdi - 1], $simdi);
bekle('suresi dolmus pro: free', 'free', $p['paket']);
$p = etkin_paket(['paket' => 'standart', 'deneme_baslangic' => $simdi, 'paket_bitis' => null], $simdi);
bekle('bitis tarihi olmayan ucretli paket: sinirsiz', 'standart', $p['paket']);
$p = etkin_paket(['paket' => 'uydurma', 'deneme_baslangic' => $simdi, 'paket_bitis' => null], $simdi);
bekle('bilinmeyen paket degeri: free (guvenli varsayilan)', 'free', $p['paket']);

echo "\nTOPLAM: " . ($gecen + $kalan) . "   GEÇEN: $gecen   KALAN: $kalan\n";
exit($kalan === 0 ? 0 : 1);
