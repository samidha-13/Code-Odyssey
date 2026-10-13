#!/usr/bin/env bash
# Converts the scroll videos in design/source-assets/video into image
# sequences for scroll scrubbing. The hero keeps every frame (its zoom into the
# helmet moves too far between every 2nd frame and smears when cross-faded);
# the bottle keeps every 2nd. Frame counts must match FILMS in director.ts.
#   d/ : desktop, 1278x720 (native)       m/ : portrait, centre 404x720 crop
# Note: hero/d/0001.webp is a hand-made sharper still, aligned to the film;
# re-running this overwrites it with the video's own first frame.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=design/source-assets/video
OUT=public/assets/frames
for name in hero:hero-sand-helmet-to-ocean:1 bottle:bottle-message-to-surface:2; do
  key=${name%%:*}; rest=${name#*:}; file=${rest%%:*}; step=${rest#*:}
  rm -rf "$OUT/$key"; mkdir -p "$OUT/$key/d" "$OUT/$key/m"
  ffmpeg -v error -y -i "$SRC/$file.mp4" -vf "select='not(mod(n\,$step))'" -vsync 0 \
    -c:v libwebp -quality 72 -compression_level 6 "$OUT/$key/d/%04d.webp"
  ffmpeg -v error -y -i "$SRC/$file.mp4" -vf "select='not(mod(n\,$step))',crop=404:720:436:0" -vsync 0 \
    -c:v libwebp -quality 70 -compression_level 6 "$OUT/$key/m/%04d.webp"
  echo "$key: $(ls "$OUT/$key/d" | wc -l) frames, $(du -sh "$OUT/$key/d" | cut -f1) desktop, $(du -sh "$OUT/$key/m" | cut -f1) mobile"
done
