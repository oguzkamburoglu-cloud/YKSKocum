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

/** Tablolar yoksa surucuye uygun semayi calistirir. */
function sema_kur(PDO $pdo): void {
    try {
        $pdo->query('SELECT 1 FROM kullanicilar LIMIT 1');
        return;
    } catch (PDOException $e) {
        // tablo yok -> kur
    }
    $surucu = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    $dosya = __DIR__ . '/../../' . ($surucu === 'sqlite' ? 'schema.sqlite.sql' : 'schema.mysql.sql');
    $sql = file_get_contents($dosya);
    if ($sql === false) throw new RuntimeException('Şema dosyası okunamadı');
    // Yorum satirlarini at, ifadeleri tek tek calistir (bazi suruculer coklu ifadeyi sevmez)
    $temiz = preg_replace('/^\s*--.*$/m', '', $sql);
    foreach (array_filter(array_map('trim', explode(';', $temiz))) as $ifade) {
        $pdo->exec($ifade);
    }
}
