# gpsmap.app
A Progressive Web App (PWA) that leverages modern browser technology for viewing custom maps, even when offline.

![Screenshot](https://gpsmap.app/app-images/montage.jpg)

## Features
- **Simple** - 100% client-side, distributed via the web, hosted free on GitHub Pages
- **Cross Platform** - PWA support across all modern browsers, including iOS Safari and Android Chrome
- **Works Offline** - Service workers used to pre-cache all application assets, maps saved to IndexedDB

## Functionality
- View your GPS position on a custom map without having to pre-build a custom app or website
- Load and save custom raster maps ([PMTiles](https://docs.protomaps.com/pmtiles/)) and view GeoJSON overlays directly from the device, common cloud storage providers (iCloud, Dropbox, GDrive), or files hosted on the web (PMTiles only).

## How It's Built
With simplicity in mind, I wanted to include as few dependencies as possible. Everything is written in vanilla JavaScript, HTML, and CSS, referencing the minified vendor files separately without any build tooling. These are the open source libraries used:

- [Leaflet](https://leafletjs.com/) - open-source JavaScript library for mobile-friendly interactive maps
- [Leaflet.Locate](https://github.com/domoritz/leaflet-locatecontrol/) - leaflet control to geolocate the user (plugin)
- [Protomps PMTiles](https://docs.protomaps.com/pmtiles/) - cloud-optimized + compressed single-file tile archives for vector and raster maps
- [localForage](https://github.com/localForage/localForage/) - IndexedDB wrapper for storing tile archive files
- [Workbox](https://github.com/GoogleChrome/workbox/) - service worker utilities for Progressive Web Apps
- [sweetalert2](https://sweetalert2.github.io/) - customizable modals for easily extending the UI

The [service worker script](https://github.com/bmcbride/gps-map/blob/gh-pages/service-worker.js) is hand crafted for simplicity and to make it easier to update dependencies without forcing the user to download a complete app bundle. All the assets to be precached are explicitly listed and include a revision date, which is modified to initiate an update.

The web app [manifest file](https://github.com/bmcbride/gps-map/blob/gh-pages/manifest.json) includes all the required elements for how the app should behave when 'installed' (name, display, colors, app icon). This is the file used by Chrome to display the 'Add to Home Screen' prompt.

## How It Works
When you point your browser to https://gpsmap.app for the first time, the service worker file is registered and the *install* listener downloads all the application assets to your browser's cache storage, making future offline access possible.

The 'Add to Home Screen' banner is displayed in Chrome, which allows you to give the app first class access to you home screen and app drawer on Android. Unfortunately iOS/Safari doesn't automatically prompt users, but it can still be accomplished by tapping the share button and swiping over to the 'Add to Home Screen' button.

Tapping on the app icon will launch the app in standalone mode, running in its own window, separate from the browser, and hiding standard browser UI elements like the URL bar, etc.

### Loading Custom Maps & Vector Files
To load custom offline maps & vector files, tap the **i** button in the lower left-hand corner of the screen and then tap the **Import Map** button to use the browser's file picker to select a supported file type (.pmtiles or .geojson). PMTiles maps are saved to the device while GeoJSON overlays are loaded in memory.

- [**PMTiles**](https://docs.protomaps.com/pmtiles/) - a modern single-file archive format for pyramids of tiled data. A pmtiles archive can be hosted on a storage platform like S3, and enables low-cost, zero-maintenance map applications. PMTiles readers use HTTP Range Requests to fetch only the relevant tile or metadata inside a PMTiles archive on-demand. When saved to localStorage the FileAPISource slice method is used to efficiently load only the relevant data needed without having to load the entire file into memory. The [PMTiles CLI](https://github.com/protomaps/go-pmtiles) can be used to convert [MBTiles](https://github.com/mapbox/mbtiles-spec) into PMTiles archives. There is plenty of open source tooling for generating raster MBTiles ([GDAL](https://gdal.org/drivers/raster/mbtiles.html), [QGIS](https://qgis.org/en/site/forusers/visualchangelog38/index.html#feature-generate-raster-xyz-tiles), [TileMill](https://tilemill-project.github.io/tilemill/)) plus an excellent standalone freemium tool - [MapTiler Desktop](https://www.maptiler.com/desktop/).

- **Vector Files (GeoJSON)** - while raster maps typically help to convey a fuller picture (terrain, imagery, labels, legends, additional context, etc.), vector files are much easier to edit and make excellent overlays to highlight trails and other assets. There are lots of [Awesome GeoJSON Utilities](https://github.com/tmcw/awesome-geojson) for working with this incredibly popular data format.

The app uses a standard HTML file input and the *FileReader* API to read the contents of files on the filesystem. The files are passed to new Leaflet layers, which are then added to the overlay control.

You can also append the `map` parameter to load a PMTiles file hosted on the web. This is a great way to quickly and easily share a map with others:

- https://gpsmap.app/?map=https://protomaps.github.io/PMTiles/usgs-mt-whitney-8-15-webp-512.pmtiles

## Leaflet Configurations & Other Niceties
Below are a few of the Leaflet configurations I found useful on this project.

- **Disabling Map Zoom Snapping** - Setting the map `zoomSnap` value to `0` makes pinch zooming on mobile much more fluid.

- **Auto-scaling Tile Layers** - Specifying a `maxZoom` for the map at `22` and setting the `maxNativeZoom` for the tile layers allows for auto-scaling or overzooming. Basically, this allows you to zoom in nice and close, regardless of the tile archive maximum zoom level.

- **Disabling *updateWhenIdle*** - By default on mobile, tile layers are only loaded once a map pan has ended. This is set to prevent too many web requests impacting navigation. Setting `updateWhenIdle` to `false` on tile layers makes them load quicker for more seamless navigation.

- **GeoJSON Renderer** - Specifying the canvas renderer and bumping up the `tolerance` setting value extends the clickable area around objects, making it easier to tap and select features, particularly lines/paths.

- **Vector Styles** - Basic support for the GeoJSON [simplestyle-spec](https://github.com/mapbox/simplestyle-spec), which allows you to style features using special properties at the feature level.

- **Vector Properties & Hyperlinks** - Feature key/value properties (attributes) are displayed in popups with clickable hyperlinks.

- **Drag and Drop Support** - While this is primarily meant to be a mobile app, it also works great as an impromptu map viewer on a desktop or laptop. Simply drag and drop your files directly onto the page.

## Notes & Limitations
Building a functional and useful mapping application on modern web technology is indeed possible! It may not necessarily be the best platform and certainly isn't as robust or powerful as the many native mapping applications available today, but it does showcase how far browser technology has advanced.

Pre-rendered image tiles are still one of the absolute best mapping formats available. PMTiles package everything up in a nice portable format designed specifically for the web & browser.