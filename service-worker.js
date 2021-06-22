importScripts('assets/vendor/workbox-6.1.5/workbox-sw.js');

workbox.setConfig({
  debug: false,
  modulePathPrefix: 'assets/vendor/workbox-6.1.5/'
});

workbox.precaching.precacheAndRoute([
  {url: 'index.html', revision: '06.18.21.1'},
  {url: 'manifest.json', revision: '09.09.20.1'},
  {url: 'assets/js/app.js', revision: '06.22.21.2'},
  {url: 'assets/css/app.css', revision: '06.21.21.1'},
  {url: 'assets/img/apple-touch-icon.png', revision: '09.09.20.1'},
  {url: 'assets/img/favicon-32x32.png', revision: '09.09.20.1'},
  {url: 'assets/img/favicon-16x16.png', revision: '09.09.20.1'},
  {url: 'assets/vendor/icomoon/style.css', revision: '03.04.21.1'},
  {url: 'assets/vendor/icomoon/fonts/icomoon.ttf', revision: '03.04.21.1'},
  {url: 'assets/vendor/icomoon/fonts/icomoon.woff', revision: '03.04.21.1'},
  {url: 'assets/vendor/sqljs-1.5.0/sql-wasm.js', revision: '06.18.21.1'},
  {url: 'assets/vendor/sqljs-1.5.0/sql-wasm.wasm', revision: '06.18.21.1'},
  {url: 'assets/vendor/localForage-1.9.0/localforage.min.js', revision: '03.09.21.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/layers.png', revision: '03.04.21.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/layers-2x.png', revision: '03.04.21.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/marker-icon.png', revision: '03.04.21.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/marker-icon-2x.png', revision: '03.04.21.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/marker-shadow.png', revision: '03.04.21.1'},
  {url: 'assets/vendor/leaflet-1.7.1/leaflet.css', revision: '03.04.21.1'},
  {url: 'assets/vendor/leaflet-1.7.1/leaflet.js', revision: '03.04.21.1'},
  {url: 'assets/vendor/leaflet-locatecontrol-0.72.1/L.Control.Locate.min.js', revision: '09.09.20.1'},
  {url: 'assets/vendor/leaflet-mbtiles/Leaflet.TileLayer.MBTiles.js', revision: '09.09.20.1'},
  {url: 'assets/vendor/csv2geojson-5.1.1/csv2geojson.min.js', revision: '03.05.21.1'},
  {url: 'assets/vendor/togeojson-0.16.0/togeojson.min.js', revision: '03.05.21.1'}
], {
  // Ignore all URL parameters.
  ignoreURLParametersMatching: [/.*/]
});