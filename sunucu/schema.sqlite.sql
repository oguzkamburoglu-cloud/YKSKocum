-- AI Koçum — veritabani semasi (SQLite; yerel gelistirme/test)
-- schema.mysql.sql ile ayni tablolar. Zamanlar UNIX epoch (INTEGER).

CREATE TABLE IF NOT EXISTS kullanicilar (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  eposta           TEXT    NOT NULL UNIQUE,
  parola_hash      TEXT    NOT NULL,
  ad               TEXT    NOT NULL DEFAULT '',
  rol              TEXT    NOT NULL DEFAULT 'ogrenci',
  paket            TEXT    NOT NULL DEFAULT 'deneme',
  paket_bitis      INTEGER NULL,
  deneme_baslangic INTEGER NOT NULL,
  olusturma        INTEGER NOT NULL,
  son_giris        INTEGER NULL
);

CREATE TABLE IF NOT EXISTS oturumlar (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  kullanici_id INTEGER NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  token_hash   TEXT    NOT NULL UNIQUE,
  olusturma    INTEGER NOT NULL,
  bitis        INTEGER NOT NULL,
  cihaz        TEXT    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS oran_sinir (
  anahtar           TEXT    PRIMARY KEY,
  sayac             INTEGER NOT NULL DEFAULT 0,
  pencere_baslangic INTEGER NOT NULL
);
