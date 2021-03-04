importScripts('assets/vendor/workbox-6.0.2/workbox-sw.js');

workbox.setConfig({
  debug: false,
  modulePathPrefix: 'assets/vendor/workbox-6.0.2/'
});

workbox.precaching.precacheAndRoute([
  {url: 'index.html', revision: '03.04.20.1'},
  {url: 'manifest.json', revision: '09.09.20.1'},
  {url: 'assets/js/app.js', revision: '03.04.20.2'},
  {url: 'assets/css/app.css', revision: '03.04.20.1'},
  {url: 'assets/img/apple-touch-icon.png', revision: '09.09.20.1'},
  {url: 'assets/img/favicon-32x32.png', revision: '09.09.20.1'},
  {url: 'assets/img/favicon-16x16.png', revision: '09.09.20.1'},
  {url: 'assets/vendor/icomoon/style.css', revision: '10.29.20.1'},
  {url: 'assets/vendor/icomoon/fonts/icomoon.ttf', revision: '10.29.20.1'},
  {url: 'assets/vendor/icomoon/fonts/icomoon.woff', revision: '10.29.20.1'},
  {url: 'assets/vendor/vex-4.1.0/css/vex.css', revision: '09.09.11.1'},
  {url: 'assets/vendor/vex-4.1.0/css/vex-theme-top.css', revision: '09.09.11.1'},
  {url: 'assets/vendor/sqljs-1.4.0/sql-wasm.js', revision: '11.03.20.1'},
  {url: 'assets/vendor/sqljs-1.4.0/sql-wasm.wasm', revision: '11.03.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/layers.png', revision: '09.17.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/layers-2x.png', revision: '09.17.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/marker-icon.png', revision: '09.17.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/marker-icon-2x.png', revision: '09.17.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/images/marker-shadow.png', revision: '09.17.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/leaflet.css', revision: '09.17.20.1'},
  {url: 'assets/vendor/leaflet-1.7.1/leaflet.js', revision: '09.17.20.1'},
  {url: 'assets/vendor/leaflet-locatecontrol-0.72.1/L.Control.Locate.min.js', revision: '09.09.20.1'},
  {url: 'assets/vendor/leaflet-mbtiles/Leaflet.TileLayer.MBTiles.js', revision: '09.09.20.1'},
  {url: 'assets/vendor/togeojson-0.16.0/togeojson.js', revision: '09.09.20.1'},
  {url: 'assets/vendor/vex-4.1.0/js/vex.combined.min.js', revision: '09.09.20.1'},
  {url: 'assets/vendor/localForage-1.9.0/localforage.min.js', revision: '10.26.20.1'}
], {
  // Ignore all URL parameters.
  ignoreURLParametersMatching: [/.*/]
});