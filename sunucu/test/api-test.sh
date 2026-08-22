#!/usr/bin/env bash
# AI Koçum API — uctan uca test (yerel, SQLite, PHP yerlesik sunucu)
# Kosum:  bash sunucu/test/api-test.sh
# Uretim mantigiyla birebir ayni kod calisir; yalnizca veritabani SQLite'tir.
set -u
KOK="$(cd "$(dirname "$0")/../.." && pwd)"
PORT=8793
DB="/tmp/aikocum-api-test-$$.sqlite"
URL="http://127.0.0.1:$PORT/api"
GECEN=0; KALAN=0

cd "$KOK"
DB_DSN="sqlite:$DB" php -S 127.0.0.1:$PORT -t . sunucu/api/router.php >/tmp/aikocum-api-test.log 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null; rm -f "$DB" "$DB-journal"' EXIT
for i in $(seq 1 30); do curl -s -o /dev/null "$URL/saglik" && break; sleep 0.2; done

# ---- yardimcilar ---------------------------------------------------------
# istek YONTEM YOL [JSON] [TOKEN]  -> stdout: govde ; GLOBAL KOD: http kodu
istek() {
  local y="$1" yol="$2" govde="${3:-}" token="${4:-}"
  local args=(-s -o /tmp/aikocum-api-body -w '%{http_code}' -X "$y" "$URL$yol")
  [ -n "$govde" ] && args+=(-H 'Content-Type: application/json' --data "$govde")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  KOD=$(curl "${args[@]}"); GOVDE=$(cat /tmp/aikocum-api-body)
}
# json YOL  -> GOVDE icinden nokta-yollu alan ("kullanici.ad"); yoksa None
json() {
  python3 -c '
import json,sys
try: d=json.load(sys.stdin)
except Exception: print(""); sys.exit()
for k in sys.argv[1].split("."):
    d = d.get(k) if isinstance(d, dict) else None
print(d)' "$1" <<<"$GOVDE"
}
bekle() { # bekle ACIKLAMA BEKLENEN GERCEK
  if [ "$2" = "$3" ]; then echo "  ✓ $1"; GECEN=$((GECEN+1));
  else echo "  ✗ $1"; echo "      beklenen: $2"; echo "      bulunan : $3"; KALAN=$((KALAN+1)); fi
}
EP="ogrenci$$@ornek.com"

echo "── Saglik ──"
istek GET /saglik;                          bekle "saglik 200" 200 "$KOD"
bekle "db baglantisi ok" True "$(json "db")"

echo "── Kayit ──"
istek POST /kayit '{"eposta":"kotu","parola":"12345678"}';         bekle "gecersiz eposta 422" 422 "$KOD"
istek POST /kayit "{\"eposta\":\"$EP\",\"parola\":\"kisa\"}";      bekle "kisa parola 422" 422 "$KOD"
istek POST /kayit "{\"eposta\":\"$EP\",\"parola\":\"Guclu-Parola-1\",\"ad\":\"<b>Deneme</b> Ogrenci\"}"
bekle "kayit 201" 201 "$KOD"
TOKEN=$(json "token"); bekle "token dondu (>=40 kr)" True "$(python3 -c "print(len('$TOKEN')>=40)")"
bekle "ad HTML'den arindirildi" "Deneme Ogrenci" "$(json "kullanici.ad")"
bekle "yeni hesap paketi: deneme" deneme "$(json "kullanici.paket")"
bekle "deneme bitmedi" False "$(json "kullanici.deneme_bitti")"
bekle "deneme kalan 7 gun" 7 "$(json "kullanici.deneme_kalan_gun")"
bekle "rol ogrenci" ogrenci "$(json "kullanici.rol")"
bekle "parola hash YANITTA YOK" None "$(json "kullanici.parola_hash")"
istek POST /kayit "{\"eposta\":\"$EP\",\"parola\":\"Guclu-Parola-1\"}"; bekle "ayni eposta 409" 409 "$KOD"

echo "── Oturum ──"
istek GET /ben;                                   bekle "token'siz ben 401" 401 "$KOD"
istek GET /ben "" "$TOKEN";                       bekle "token'li ben 200" 200 "$KOD"
bekle "ben eposta dogru" "$EP" "$(json "kullanici.eposta")"
istek GET /ben "" "sahte-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"; bekle "sahte token 401" 401 "$KOD"
istek POST /cikis "" "$TOKEN";                    bekle "cikis 200" 200 "$KOD"
istek GET /ben "" "$TOKEN";                       bekle "cikis sonrasi ayni token 401" 401 "$KOD"

echo "── Giris ──"
istek POST /giris "{\"eposta\":\"$EP\",\"parola\":\"yanlis-parola\"}"; bekle "yanlis parola 401" 401 "$KOD"
istek POST /giris '{"eposta":"olmayan@ornek.com","parola":"yanlis-parola"}'; bekle "olmayan hesap da 401 (ayni mesaj)" 401 "$KOD"
istek POST /giris "{\"eposta\":\"$EP\",\"parola\":\"Guclu-Parola-1\"}"; bekle "dogru giris 200" 200 "$KOD"
TOKEN2=$(json "token"); bekle "yeni token eskisinden farkli" True "$(python3 -c "print('$TOKEN'!='$TOKEN2')")"
istek GET /ben "" "$TOKEN2";                      bekle "yeni token calisiyor" 200 "$KOD"

echo "── Guvenlik ──"
istek POST /giris 'eposta=a&parola=b';            # JSON degil (Content-Type form) -> 415
bekle "form-post reddedilir (CSRF)" 415 "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/x-www-form-urlencoded' --data 'a=b' $URL/giris)"
bekle "bilinmeyen yol 404" 404 "$(curl -s -o /dev/null -w '%{http_code}' $URL/yok)"
# hiz siniri: 10 deneme/15 dk -> 11. deneme 429
for i in $(seq 1 12); do istek POST /giris "{\"eposta\":\"$EP\",\"parola\":\"kaba-kuvvet-$i\"}"; done
bekle "kaba kuvvet 429" 429 "$KOD"

echo "── Sunucu saati ──"
istek GET /ben "" "$TOKEN2"
SZ=$(json "kullanici.sunucu_zamani"); bekle "sunucu_zamani makul" True "$(python3 -c "import time; print(abs(time.time()-$SZ)<5)")"

echo
echo "TOPLAM: $((GECEN+KALAN))   GEÇEN: $GECEN   KALAN: $KALAN"
[ "$KALAN" -eq 0 ]
