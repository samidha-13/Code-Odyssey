#!/usr/bin/env bash
# Converts the scroll videos in design/source-assets/video into image
# sequences for scroll scrubbing (every 2nd frame; the site cross-fades
# neighbouring frames, so 15 fps of source reads as smooth motion).
#   d/ : desktop, 1278x720 (native)       m/ : portrait, centre 405x720 crop
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=design/source-assets/video
OUT=public/assets/frames
for name in hero:hero-sand-helmet-to-ocean bottle:bottle-message-to-surface; do
  key=${name%%:*}; file=${name#*:}
  rm -rf "$OUT/$key"; mkdir -p "$OUT/$key/d" "$OUT/$key/m"
  ffmpeg -v error -y -i "$SRC/$file.mp4" -vf "select='not(mod(n\,2))'" -vsync 0 \
    -c:v libwebp -quality 72 -compression_level 6 "$OUT/$key/d/%04d.webp"
  ffmpeg -v error -y -i "$SRC/$file.mp4" -vf "select='not(mod(n\,2))',crop=405:720:(iw-405)/2:0" -vsync 0 \
    -c:v libwebp -quality 70 -compression_level 6 "$OUT/$key/m/%04d.webp"
  echo "$key: $(ls "$OUT/$key/d" | wc -l) frames, $(du -sh "$OUT/$key/d" | cut -f1) desktop, $(du -sh "$OUT/$key/m" | cut -f1) mobile"
done
