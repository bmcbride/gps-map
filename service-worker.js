importScripts('assets/vendor/workbox-v5.1.2/workbox-sw.js');

workbox.setConfig({
  debug: false,
  modulePathPrefix: 'assets/vendor/workbox-v5.1.2/'
});

workbox.precaching.precacheAndRoute([
  {url: 'index.html', revision: '09.09.20.1'},
  {url: './', revision: '09.09.20.1'}, // Alias for index.html
  {url: 'manifest.json', revision: '09.09.20.1'},
  {url: 'assets/img/apple-touch-icon.png', revision: '09.09.20.1'},
  {url: 'assets/img/favicon-32x32.png', revision: '09.09.20.1'},
  {url: 'assets/img/favicon-16x16.png', revision: '09.09.20.1'},
  {url: 'assets/vendor/fontawesome-free-5.14.0-web/css/all.min.css', revision: '09.09.20.1'},
  {url: 'assets/vendor/fontawesome-free-5.14.0-web/webfonts/fa-solid-900.ttf', revision: '09.09.20.1'},
  {url: 'assets/vendor/fontawesome-free-5.14.0-web/webfonts/fa-solid-900.woff2', revision: '09.09.20.1'},
  {url: 'assets/vendor/sqljs-1.3.0/sql-wasm.js', revision: '09.09.20.1'},
  {url: 'assets/vendor/sqljs-1.3.0/sql-wasm.wasm', revision: '09.09.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/layers.png', revision: '09.09.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/layers-2x.png', revision: '09.09.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/marker-icon.png', revision: '09.09.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/marker-icon-2x.png', revision: '09.09.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/marker-shadow.png', revision: '09.09.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/leaflet.css', revision: '09.09.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/leaflet.js', revision: '09.09.20.1'},
  {url: 'assets/vendor/leaflet-locatecontrol-0.72.1/L.Control.Locate.min.js', revision: '09.09.20.1'},
  {url: 'assets/vendor/leaflet-mbtiles/Leaflet.TileLayer.MBTiles.js', revision: '09.09.20.1'},
  {url: 'assets/vendor/togeojson-0.16.0/togeojson.js', revision: '09.09.20.1'},
  {url: 'assets/js/app.js', revision: '09.08.20.2'},
  {url: 'assets/css/app.css', revision: '09.09.20.1'}
]);