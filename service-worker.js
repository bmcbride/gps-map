/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the 'License');
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an 'AS IS' BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
const PRECACHE = 'precache-05.15.20.1';
const RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  'index.html',
  './', // Alias for index.html
  'manifest.json',
  'assets/img/apple-touch-icon.png',
  'assets/img/favicon-32x32.png',
  'assets/img/favicon-16x16.png',
  'assets/img/favicon-512x512.png',
  'assets/img/favicon-192x192.png',
  'assets/vendor/leaflet-1.6.0/images/layers.png',
  'assets/vendor/leaflet-1.6.0/images/layers-2x.png',
  'assets/vendor/leaflet-1.6.0/images/marker-icon.png',
  'assets/vendor/leaflet-1.6.0/images/marker-icon-2x.png',
  'assets/vendor/leaflet-1.6.0/images/marker-shadow.png',
  'assets/vendor/leaflet-1.6.0/leaflet.css',
  'assets/vendor/leaflet-1.6.0/leaflet.js',
  'assets/vendor/leaflet-locatecontrol-0.70.0/L.Control.Locate.min.css',
  'assets/vendor/leaflet-locatecontrol-0.70.0/L.Control.Locate.min.js',
  'assets/vendor/leaflet-mbtiles/Leaflet.TileLayer.MBTiles.js',
  'assets/vendor/togeojson-0.16.0/togeojson.js',
  'assets/vendor/turf-5.1.6/turf-area-length.min.js',
  'assets/vendor/jquery-3.5.1.slim.min.js',
  'assets/vendor/popper-1.16.0/popper.min.js',
  'assets/vendor/bootstrap-4.5.0/css/bootstrap.min.css',
  'assets/vendor/bootstrap-4.5.0/js/bootstrap.min.js',
  'assets/vendor/bootstrap-table-1.16.0/bootstrap-table.min.css',
  'assets/vendor/bootstrap-table-1.16.0/bootstrap-table.min.js',
  'assets/vendor/fontawesome-free-5.12.1-web/css/all.min.css',
  'assets/vendor/fontawesome-free-5.12.1-web/webfonts/fa-solid-900.ttf',
  'assets/vendor/fontawesome-free-5.12.1-web/webfonts/fa-solid-900.woff2',
  'assets/vendor/sqljs-1.2.2/sql-wasm.js',
  'assets/vendor/sqljs-1.2.2/sql-wasm.wasm',
  'assets/css/app.css',
  'assets/js/app.js'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE, 'map-cache')
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
  // Skip cross-origin requests, like those for Google Analytics.
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        /* Disable runtime caching
        return caches.open(RUNTIME).then(cache => {
          return fetch(event.request).then(response => {
            // Put a copy of the response in the runtime cache.
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
        */

        return fetch(event.request).then(response => {
          return response;
        });
      })
    );
  }
});