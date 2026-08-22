<?php
/**
 * AI Koçum API — veritabani baglantisi.
 * Uretimde MariaDB (.env'deki MARIADB_*), yerel testte SQLite (DB_DSN=sqlite:...).
 * Ilk istekte tablolar yoksa semayi kendisi kurar (auto-migrate); boylece
 * sunucuda ayrica "sql calistir" adimi gerekmez.
 */
declare(strict_types=1);

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $dsn = getenv('DB_DSN') ?: '';
    $kullanici = null; $parola = null;
    if ($dsn === '') {
        $host = getenv('DB_HOST') ?: 'db';
        $ad   = getenv('MARIADB_DATABASE') ?: 'aikocum';
        $dsn  = "mysql:host={$host};dbname={$ad};charset=utf8mb4";
        $kullanici = getenv('MARIADB_USER') ?: 'aikocum';
        $parola    = getenv('MARIADB_PASSWORD') ?: '';
    }

    $pdo = new PDO($dsn, $kullanici, $parola, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
        $pdo->exec('PRAGMA foreign_keys = ON');
    }
    sema_kur($pdo);
    return $pdo;
}

/**
 * Sema SQL'ini calistirilabilir ifadelere boler.
 * Once TUM "--" yorumlari (satir-ici dahil) atilir, SONRA ";" ile bolunur.
 * Eskiden yalnizca tam-satir yorumlar atiliyordu; "-- sha256(token); ..."
 * gibi icinde ";" gecen bir satir-ici yorum ifadeyi ortadan kesiyor,
 * MariaDB 1064 veriyor ve sonraki tablolar hic olusmuyordu.
 */
function sema_ifadeleri(string $sql): array {
    $temiz = preg_replace('/--[^\n]*/', '', $sql);
    return array_values(array_filter(array_map('trim', explode(';', $temiz))));
}

/** Sema eksikse surucuye uygun semayi calistirir (CREATE IF NOT EXISTS: idempotent). */
function sema_kur(PDO $pdo): void {
    // Kontrol SON tabloya gore yapilir: yarim kalmis bir kurulum (ilk tablo
    // var, sonrakiler yok) bir sonraki baglantida kendini tamamlar.
    try {
        $pdo->query('SELECT 1 FROM oran_sinir LIMIT 1');
        return;
    } catch (PDOException $e) {
        // eksik -> kur
    }
    $surucu = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    $dosya = __DIR__ . '/../../' . ($surucu === 'sqlite' ? 'schema.sqlite.sql' : 'schema.mysql.sql');
    $sql = file_get_contents($dosya);
    if ($sql === false) throw new RuntimeException('Şema dosyası okunamadı');
    foreach (sema_ifadeleri($sql) as $ifade) {
        $pdo->exec($ifade);
    }
}
