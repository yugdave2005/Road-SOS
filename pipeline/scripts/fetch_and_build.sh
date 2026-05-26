#!/usr/bin/env bash
set -euo pipefail
BBOX="${1:-"-180,-90,180,90"}"  # Default: global
./build/roadsos_pipeline --bbox "$BBOX" --output /tmp/pois.geojson
mkdir -p ./apps/mobile/assets
tippecanoe -o ./apps/mobile/assets/pois.mbtiles -z14 -Z8 --drop-densest-as-needed /tmp/pois.geojson
echo "Pipeline complete. $(wc -l < /tmp/pois.geojson) POI records."
