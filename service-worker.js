importScripts('assets/vendor/workbox-7.0.0/workbox-sw.js');

workbox.setConfig({
  debug: false,
  modulePathPrefix: 'assets/vendor/workbox-7.0.0/'
});

workbox.precaching.precacheAndRoute([
  {url: 'index.html', revision: '11.15.23.1'},
  {url: 'manifest.json', revision: '11.15.23.1'},
  {url: 'assets/js/app.js', revision: '11.17.23.1'},
  {url: 'assets/css/app.css', revision: '11.15.23.1'},
  {url: 'assets/img/32.png', revision: '11.15.23.1'},
  {url: 'assets/img/87.png', revision: '11.15.23.1'},
  {url: 'assets/img/180.png', revision: '11.15.23.1'},
  {url: 'assets/img/1024.png', revision: '11.15.23.1'},
  {url: 'assets/img/maskable-icon.png', revision: '11.15.23.1'},
  {url: 'assets/vendor/icomoon-v1.0/style.css', revision: '11.15.23.1'},
  {url: 'assets/vendor/icomoon-v1.0/fonts/icomoon.ttf', revision: '11.15.23.1'},
  {url: 'assets/vendor/icomoon-v1.0/fonts/icomoon.woff', revision: '11.15.23.1'},
  {url: 'assets/vendor/localForage-1.10.0/localforage.min.js', revision: '11.15.23.1'},
  {url: 'assets/vendor/leaflet-1.9.4/images/layers.png', revision: '11.15.23.1'},
  {url: 'assets/vendor/leaflet-1.9.4/images/layers-2x.png', revision: '11.15.23.1'},
  {url: 'assets/vendor/leaflet-1.9.4/images/marker-icon.png', revision: '11.15.23.1'},
  {url: 'assets/vendor/leaflet-1.9.4/images/marker-icon-2x.png', revision: '11.15.23.1'},
  {url: 'assets/vendor/leaflet-1.9.4/images/marker-shadow.png', revision: '11.15.23.1'},
  {url: 'assets/vendor/leaflet-1.9.4/leaflet.css', revision: '11.15.23.1'},
  {url: 'assets/vendor/leaflet-1.9.4/leaflet.js', revision: '11.15.23.1'},
  {url: 'assets/vendor/leaflet-locatecontrol-0.79.0/L.Control.Locate.min.css', revision: '11.15.23.1'},
  {url: 'assets/vendor/leaflet-locatecontrol-0.79.0/L.Control.Locate.min.js', revision: '11.15.23.1'},
  {url: 'assets/vendor/pmtiles-2.11.0/index.js', revision: '11.15.23.1'},
  {url: 'assets/vendor/sweetalert2-11.10.0/sweetalert2.all.min.js', revision: '11.15.23.1'}
], {
  ignoreURLParametersMatching: [/.*/]
});