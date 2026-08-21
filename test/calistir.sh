#!/bin/sh
# YKSKocum test kosumu — harici bagimlilik yok, JavaScriptCore kullanir.
JSC=$(command -v jsc || echo /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc)
if [ ! -x "$JSC" ]; then echo "jsc bulunamadi (Xcode Command Line Tools gerekli)"; exit 1; fi
cd "$(dirname "$0")/.." || exit 1
KALAN=0
for f in test/[0-9]*.js; do
  echo ""
  echo "════════ $f ════════"
  "$JSC" "$f" || KALAN=1
done
exit $KALAN
