-- AI Koçum — veritabani semasi (MariaDB)
-- Zaman alanlari UNIX epoch (INT) tutulur: SQLite/MariaDB arasinda tasinabilir
-- ve deneme/oturum suresi SUNUCU saatiyle hesaplanir (istemci saatine guvenilmez).

CREATE TABLE IF NOT EXISTS kullanicilar (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  eposta           VARCHAR(190) NOT NULL UNIQUE,
  parola_hash      VARCHAR(255) NOT NULL,
  ad               VARCHAR(80)  NOT NULL DEFAULT '',
  rol              VARCHAR(10)  NOT NULL DEFAULT 'ogrenci',   -- ogrenci | koc
  paket            VARCHAR(20)  NOT NULL DEFAULT 'deneme',    -- deneme | free | baslangic | standart | pro
  paket_bitis      INT UNSIGNED NULL,                          -- ucretli paketin bitis ani (epoch)
  deneme_baslangic INT UNSIGNED NOT NULL,                      -- sunucu saatiyle
  olusturma        INT UNSIGNED NOT NULL,
  son_giris        INT UNSIGNED NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS oturumlar (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kullanici_id INT UNSIGNED NOT NULL,
  token_hash   CHAR(64)     NOT NULL UNIQUE,                   -- sha256(token); ham token saklanmaz
  olusturma    INT UNSIGNED NOT NULL,
  bitis        INT UNSIGNED NOT NULL,
  cihaz        VARCHAR(120) NOT NULL DEFAULT '',
  CONSTRAINT fk_oturum_kullanici FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS oran_sinir (
  anahtar           VARCHAR(160) PRIMARY KEY,
  sayac             INT UNSIGNED NOT NULL DEFAULT 0,
  pencere_baslangic INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
