#!/bin/bash
# YKSKocum — yerel baslatici
# Bu dosyaya cift tiklayinca uygulama tarayicida acilir.
# Kapatmak icin bu Terminal penceresini kapat.

cd "$(dirname "$0")" || exit 1

PORT=8123
# Port doluysa bos bir port bul
while lsof -i ":$PORT" >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

echo ""
echo "  YKSKocum baslatiliyor..."
echo "  Adres: http://localhost:$PORT"
echo ""
echo "  Kapatmak icin: bu pencereyi kapat veya Control-C"
echo ""

# Sunucu hazir olunca tarayiciyi ac
( sleep 1; open "http://localhost:$PORT" ) &

python3 -m http.server "$PORT"
