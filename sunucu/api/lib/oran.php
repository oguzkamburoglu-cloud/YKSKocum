<?php
/**
 * AI Koçum API — hiz siniri (kaba kuvvet korumasi).
 * Sabit pencere: ayni anahtar (uc nokta + IP) icin pencere basina N istek.
 * Veritabaninda tutulur; birden fazla php-fpm sureci arasinda tutarlidir.
 */
declare(strict_types=1);

function oran_sinirla(string $ucNokta, int $limit = 10, int $pencereSn = 900): void {
    $anahtar = substr($ucNokta . '|' . istemci_ip(), 0, 160);
    $simdi = time();
    $pdo = db();

    $st = $pdo->prepare('SELECT sayac, pencere_baslangic FROM oran_sinir WHERE anahtar = ?');
    $st->execute([$anahtar]);
    $satir = $st->fetch();

    if (!$satir || ($simdi - (int)$satir['pencere_baslangic']) >= $pencereSn) {
        // yeni pencere
        $pdo->prepare('DELETE FROM oran_sinir WHERE anahtar = ?')->execute([$anahtar]);
        $pdo->prepare('INSERT INTO oran_sinir (anahtar, sayac, pencere_baslangic) VALUES (?, 1, ?)')
            ->execute([$anahtar, $simdi]);
        return;
    }

    if ((int)$satir['sayac'] >= $limit) {
        $kalan = $pencereSn - ($simdi - (int)$satir['pencere_baslangic']);
        header('Retry-After: ' . max(1, $kalan));
        hata(429, 'Çok fazla deneme. Lütfen biraz sonra tekrar dene.', ['bekle_sn' => max(1, $kalan)]);
    }
    $pdo->prepare('UPDATE oran_sinir SET sayac = sayac + 1 WHERE anahtar = ?')->execute([$anahtar]);
}
