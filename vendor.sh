#!/bin/sh
# Laedt die Bibliotheken beim Build herunter, damit sie von der eigenen Domain ausgeliefert werden (Datenschutz, Stabilitaet).
set -e
mkdir -p public/vendor
curl -fsSL https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js -o public/vendor/three.min.js
curl -fsSL https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js -o public/vendor/OrbitControls.js
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js -o public/vendor/jspdf.umd.min.js
curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js -o public/vendor/jszip.min.js
echo "vendor ok"
