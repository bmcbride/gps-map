# gpsmap.app
A Progressive Web App (PWA) that leverages modern browser technology for viewing custom maps, even when offline.

![Screenshot](https://gpsmap.app/app-images/montage.jpg)

## Features
- **Simple** - 100% client-side, distributed via the web, hosted free on GitHub Pages
- **Cross Platform** - PWA support across all modern browsers, including iOS Safari and Android Chrome
- **Works Offline** - Service workers used to pre-cache all application assets, maps saved to IndexedDB

## Functionality
- View your GPS position on a custom map without having to pre-build a custom app or website
- Leverage commonly used, freely available basemap services (OpenStreetMap, USGS Topo & Imagery, NOAA Navigation Charts)
- Load and save custom raster maps (MBTiles) and vector features (GeoJSON, KML, GPX, CSV) directly from the device, common cloud storage providers (iCloud, Dropbox, GDrive), or files hosted on the web (MBTiles only).

## How It's Built
With simplicity in mind, I wanted to include as few dependencies as possible. Everything is written in vanilla JavaScript, HTML, and CSS, referencing the minified vendor files separately without any build tooling. These are the open source libraries used:

- [Leaflet](https://leafletjs.com/) - open-source JavaScript library for mobile-friendly interactive maps
- [Leaflet.Locate](https://github.com/domoritz/leaflet-locatecontrol) - leaflet control to geolocate the user (plugin)
- [Leaflet.TileLayer.MBTiles](https://gitlab.com/IvanSanchez/Leaflet.TileLayer.MBTiles) - leaflet plugin for loading raster tilesets in MBTiles format
- [toGeoJSON](https://github.com/mapbox/togeojson) - helper script for converting KML & GPX to GeoJSON
- [csv2geojson](https://github.com/mapbox/csv2geojson) - helper script for converting CSV to GeoJSON
- [SQL.js](https://sql.js.org/) - a port of SQLite to WebAssembly for use in JavaScript (required for reading MBTiles)
- [localForage](https://github.com/localForage/localForage) - IndexedDB wrapper for storing the geodata
- [Workbox](https://github.com/GoogleChrome/workbox) - service worker utilities for Progressive Web Apps

The service worker script is hand crafted for simplicity and to make it easier to update dependencies without forcing the user to download a complete app bundle. All the assets to be precached are explicitly listed and include a revision date, which is modified to initiate an update.

The web app manifest file includes all the required elements for how the app should behave when 'installed' (name, display, colors, app icon). This is the file used by Chrome to display the 'Add to Home Screen' prompt.

## How It Works
When you point your browser to https://gpsmap.app for the first time, the service worker file is registered and the *install* listener downloads all the application assets to your browser's cache storage, making future offline access possible.

The 'Add to Home Screen' banner is displayed in Chrome, which allows you to give the app first class access to you home screen and app drawer on Android. Unfortunately iOS/Safari doesn't automatically prompt users, but it can still be accomplished by tapping the share button and swiping over to the 'Add to Home Screen' button.

Tapping on the app icon will launch the app in standalone mode, running in its own window, separate from the browser, and hiding standard browser UI elements like the URL bar, etc.

### Loading Custom Maps & Vector Files
To load custom offline maps & vector files, tap the **+** button in the lower right-hand corner of the screen and use the browser's file picker to select a supported file type (.mbtiles, .geojson, .kml, .gpx, .csv).

- **Raster MBTiles** - a robust [specification](https://github.com/mapbox/mbtiles-spec) for storing rendered map image tiles and metadata in a SQLite database. There is plenty of open source tooling for generating raster MBTiles ([GDAL](https://gdal.org/drivers/raster/mbtiles.html), [QGIS](https://qgis.org/en/site/forusers/visualchangelog38/index.html#feature-generate-raster-xyz-tiles), [TileMill](https://tilemill-project.github.io/tilemill/)) plus an excellent standalone freemium tool - [MapTiler Desktop](https://www.maptiler.com/desktop/).

- **Vector Files (GeoJSON, KML, GPX, CSV)** - while raster maps typically help to convey a fuller picture (terrain, imagery, labels, legends, additional context, etc.), vector files are much easier to edit and make excellent overlays to highlight trails and other assets. Many other mobile apps can also generate KML & GPX files for things like GPS logs, which can be easily viewed in this app.

The app uses a standard HTML file input and the *FileReader* API to read the contents of files on the filesystem. The files are passed to new Leaflet layers, which are then added to the overlay control, with some additional buttons for zooming, removing, and changing raster opacity.

You can also append the `map` parameter to load an MBTiles file hosted on the web. This is a great way to quickly and easily share a map with others:

- https://gpsmap.app?map=https://gpsmap.app/sample-maps/PeeblesIslandStatePark.mbtiles

### Custom Basemaps
There is no UI for customizing the list of online basemaps, but you can upload a [configuration file](https://github.com/bmcbride/gps-map/blob/gh-pages/basemap-config.json) by long pressing (or right-clicking) in the basemap area of the layer control. Supported formats include `wms` and `xyz`. This configuration is saved to localStorage and will be loaded when the app is launched.

## Leaflet Configurations & Other Niceties
Below are a few of the Leaflet configurations I found useful on this project.

- **Disabling Map Zoom Snapping** - Setting the map `zoomSnap` value to `0` makes pinch zooming on mobile much more fluid.

- **Auto-scaling Tile Layers** - Most web services covering large areas serve tiles up to a maximum zoom level of 18. The USGS base maps are only cached up to zoom level 16. Specifying a `maxZoom` for the map at `22` and setting the `maxNativeZoom` for the tile layers allows for auto-scaling or overzooming when you have an MBTiles overlay with zoom levels greater than your basemap. Basically, this allows you to zoom in nice and deep, regardless of the layers added to the map.

- **Disabling *updateWhenIdle* Setting for MBTiles** - By default on mobile, tile layers are only loaded once a map pan has ended. This is set to prevent too many web requests impacting navigation. Setting `updateWhenIdle` to `false` on MBTiles layers makes them load quicker for more seamless navigation.

- **Vector Feature Selection** - Leaflet makes it easy to open a popup window when a feature is clicked/tapped, but for line features especially, there's no visual way to detect the actual line segment selected. The app includes a 'select' layer to highlight the feature you've selected.

- **Vector Styles** - GeoJSON features don't generally contain style information- this is left for the client to handle. However, KML files do generally contain embedded style information and the app will attempt to style KML layers appropriately. There is also basic support for the GeoJSON [simplestyle-spec](https://github.com/mapbox/simplestyle-spec), which allows you to style features using special properties at the feature level.

- **Vector Properties & Hyperlinks** - Feature key/value properties (attributes) are displayed in popups with clickable hyperlinks.

- **Drag and Drop Support** - While this is primarily meant to be a mobile app, it also works great as an impromptu map viewer on a desktop or laptop. I added support for dragging and dropping files directly onto the page to make it even more useful in these scenarios.

- **Single Map Loading** - When the app loads, it checks for saved maps. If ony one MBTiles map has been saved, it will immediately be loaded. If more than one map has been saved, none will be loaded and it will zoom to your GPS location.

## Notes & Limitations
Building a functional and useful mapping application on modern web technology is indeed possible! It may not necessarily be the best platform and certainly isn't as robust or powerful as the many native mapping applications available today, but it does showcase how far browser technology has advanced.

Pre-rendered image tiles are still one of the absolute best mapping formats available. MBTiles package everything up in a nice portable format, which is now accessible within the browser thanks to WebAssembly and the SQL.js project.

One major limitation of this approach is that the *entire database needs to be loaded into memory*, so there are limitations on practical file sizes. This hasn't been much of an issue for me since the maps I typically work with are relatively small in geographic area and corresponding file size. For reference, I haven't had any issues loading an 82MB NOAA chart on my Pixel phone.