# gpsmap.app
A Progressive Web App (PWA) that leverages modern browser technology for viewing custom maps, even when offline.

![Screenshot 1](https://gpsmap.app/app-images/montage1.png)

![Screenshot 2](https://gpsmap.app/app-images/montage2.png)

## Features
- **Simple** - 100% client-side, distributed via the web, hosted free on GitHub Pages
- **Cross Platform** - PWA support across all modern browsers, including iOS Safari and Android Chrome
- **Works Offline** - Service workers used to pre-cache all application assets

## Functionality
- View your GPS position on a custom map without having to pre-build a custom app or website
- Leverage commonly used, freely available basemap services (OpenStreetMap, USGS Topo & Imagery, NOAA Navigation Charts)
- Load custom raster maps (MBTiles) and vector features (GeoJSON, KML, GPX) directly from the device or common cloud storage providers (iCloud, Dropbox, GDrive)

## How It's Built
With simplicity in mind, I wanted to include as few dependencies as possible. Everything is written in vanilla JavaScript, HTML, and CSS, referencing the minified vendor files separately without any build tooling. These are the open source vendor libraries used:

- [Leaflet](https://leafletjs.com/) - open-source JavaScript library for mobile-friendly interactive maps
- [Leaflet.Locate](https://github.com/domoritz/leaflet-locatecontrol) - leaflet control to geolocate the user (plugin)
- [Leaflet.TileLayer.MBTiles](https://gitlab.com/IvanSanchez/Leaflet.TileLayer.MBTiles) - leaflet plugin for loading raster tilesets in MBTiles format
- [SQL.js](https://github.com/kripken/sql.js/) - a port of SQLite to WebAssembly for use in JavaScript (required for reading MBTiles)
- [toGeoJSON](https://github.com/mapbox/togeojson) - helper script for converting KML & GPX to GeoJSON
- [Turf.js](http://turfjs.org/) - modular geospatial engine written in JavaScript (custom build limited to area & length modules)
- [Font Awesome](https://fontawesome.com/) - web font icon set, used for control button icons

The service worker script is hand crafted from an example provided by Google. All the assets to be pre-cached are explicitly listed and the cache name includes a date stamp which is modified to initiate an update.

The web app manifest file includes all the required elements for how the app should behave when 'installed' (name, display, colors, app icon). This is the file used by Chrome to display the 'Add to Home Screen' prompt.

## How It Works
When you point your browser to https://gpsmap.app for the first time, the service worker file is registered and the *install* listener downloads all the application assets to your browser's cache storage, making future offline access possible.

The 'Add to Home Screen' banner is displayed in Chrome, which allows you to give the app first class access to you home screen and app drawer on Android. Unfortunately iOS/Safari doesn't automatically prompt users, but it can still be accomplished by tapping the share button and swiping over to the 'Add to Home Screen' button.

Tapping on the app icon will launch the app in standalone mode, running in its own window, separate from the browser, and hiding standard browser UI elements like the URL bar, etc.

### Loading Custom Maps
To load custom offline maps, tap the map/marker button in the upper left corner of the screen and use the browser's file picker to select a supported file type (.mbtiles, .geojson, .kml, .gpx).

- **Raster MBTiles** - a robust [specification](https://github.com/mapbox/mbtiles-spec) for storing rendered map image tiles and metadata in a SQLite database. There is plenty of open source tooling for generating raster MBTiles ([GDAL](https://gdal.org/drivers/raster/mbtiles.html), [QGIS](https://qgis.org/en/site/forusers/visualchangelog38/index.html#feature-generate-raster-xyz-tiles), [TileMill](https://tilemill-project.github.io/tilemill/)) plus an excellent standalone freemium tool - [MapTiler Desktop](https://www.maptiler.com/desktop/).

- **Vector Files (GeoJSON, KML, GPX)** - while raster maps typically help to convey a fuller picture (terrain, imagery, labels, legends, additional context, etc.), vector files are much easier to edit and make excellent overlays to highlight trails and other assets. Many other mobile apps can also generate KML & GPX files for things like GPS logs, which can be easily viewed in this app.

The app uses a standard HTML file input and the *FileReader* API to read the contents of files on the filesystem. The files are passed to new Leaflet layers, which are then added to the overlay control, with some additional buttons for zooming, removing, and changing raster opacity.

## Leaflet Configurations & Other Niceties
Below are a few of the Leaflet configurations I found useful on this project.

- **Disabling Map Zoom Snapping** - Setting the map `zoomSnap` value to `0` makes pinch zooming on mobile much more fluid.

- **Auto-scaling Tile Layers** - Most web services covering large areas serve tiles up to a maximum zoom level of 18. The USGS base maps are only cached up to zoom level 16. Specifying a `maxZoom` for the map at `22` and setting the `maxNativeZoom` for the tile layers allows for auto-scaling or overzooming when you have an MBTiles overlay with zoom levels greater than your basemap. Basically, this allows you to zoom in nice and deep, regardless of the layers added to the map.

- **Disabling *updateWhenIdle* Setting for MBTiles** - By default on mobile, tile layers are only loaded once a map pan has ended. This is set to prevent too many web requests impacting navigation. Setting `updateWhenIdle` to `false` on MBTiles layers makes them load quicker for more seamless navigation.

- **Vector Feature Selection** - Leaflet makes it easy to open a popup window when a feature is clicked/tapped, but for line features especially, there's no visual way to detect the actual line segment selected. The app includes a 'select' layer to highlight the feature you've selected.

- **Vector Styles** - GeoJSON features don't generally contain style information- this is left for the client to handle. However, KML files do generally contain embedded style information and the app will attempt to style KML layers appropriately.

- **Vector Properties & Hyperlinks** - Feature key/value properties (attributes) are displayed in popups with clickable hyperlinks.

- **Drag and Drop Support** - While this is primarily meant to be a mobile app, it also works great as an impromptu map viewer on a desktop or laptop. I added support for dragging and dropping files directly onto the page to make it even more useful in these scenarios.

## Notes & Limitations
Building a functional and useful mapping application on modern web technology is indeed possible! It may not necessarily be the best platform and certainly isn't as robust or powerful as the many native mapping applications available today, but it does showcase how far browser technology has advanced.

Pre-rendered image tiles are still one of the absolute best mapping formats available. MBTiles package everything up in a nice portable format, which is now accessible within the browser thanks to WebAssembly and the SQL.js project.

One major limitation of this approach is that the *entire database needs to be loaded into memory*, so there are limitations on practical file sizes. This hasn't been much of an issue for me since the maps I typically work with are relatively small in geographic area and corresponding file size. For reference, I haven't had any issues loading an 82 MB NOAA chart on my Pixel phone.

Another potential limitation is that the map is never saved, so you start fresh every time the app is closed and relaunched. Again, this isn't an issue for me as my use is very ephemeral; I open the app and load some map layers when I'm out hiking, keeping the app open or in the background until I need to verify my position again. I did experiment a bit with actually saving loaded maps to IndexedDB storage, but it seemed like overkill and slowed things down noticeably.