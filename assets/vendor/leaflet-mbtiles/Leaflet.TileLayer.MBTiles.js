// import SQL from 'sql.js';

/*
🍂class TileLayer.MBTiles
Loads tiles from a [`.mbtiles` file](https://github.com/mapbox/mbtiles-spec).
If they exist in the given file, it will handle the following metadata rows:
*/

L.TileLayer.MBTiles = L.TileLayer.extend({
	
	initialize: function (url, options) {
		this._options = options;
		this._databaseIsLoaded = false;

		if (typeof url === 'string') {
			fetch(url).then(response => {
				return response.arrayBuffer();
			}).then(buffer => {
				const layer = this;
				initSqlJs().then(function(SQL){
					layer._openDB(buffer, SQL);
				});
			}).catch(err => {
				this.fire('databaseerror', {
					error: err
				});
			})
		} else if (url instanceof ArrayBuffer) {
			const layer = this;
			initSqlJs().then(function(SQL){
				layer._openDB(url, SQL);
			});
		} else {
			this.fire('databaseerror');
		}

		return L.TileLayer.prototype.initialize.call(this, url, options);
	},

	_openDB: function (buffer, SQL) {
		try {
			this._db = new SQL.Database(new Uint8Array(buffer));
			this._stmt = this._db.prepare('SELECT tile_data FROM tiles WHERE zoom_level = :z AND tile_column = :x AND tile_row = :y');
			const metaStmt = this._db.prepare('SELECT value FROM metadata WHERE name = :key');
			let row = null;

			row = metaStmt.getAsObject({
				':key': 'name'
			});
			if (row.value && !this._options.name) {
				this.options.name = row.value;
			}

			row = metaStmt.getAsObject({
				':key': 'attribution'
			});
			if (row.value && !this._options.attribution) {
				this.options.attribution = row.value;
				this._map.attributionControl.addAttribution(this.options.attribution);
			}

			row = metaStmt.getAsObject({
				':key': 'minzoom'
			});
			if (row.value && !this._options.minZoom) {
				this.options.minZoom = Number(row.value);
			}

			row = metaStmt.getAsObject({
				':key': 'maxzoom'
			});
			if (row.value && !this._options.maxZoom) {
				if (this.options.autoScale) {
					this.options.maxNativeZoom = Number(row.value);	
					this.options.maxZoom = this._map.getMaxZoom();
				} else {
					this.options.maxZoom = Number(row.value);	
				}
			}

			row = metaStmt.getAsObject({
				':key': 'bounds'
			});
			if (row.value && !this.options.bounds) {
				var bbox = row.value.split(",");
				var bounds = [
					[parseFloat(bbox[1]), parseFloat(bbox[0])],
					[parseFloat(bbox[3]), parseFloat(bbox[2])]
				];
				this.options.bounds = bounds;
				if (this.options.fitBounds) {
					this._map.fitBounds(bounds);	
				}
			}

			row = metaStmt.getAsObject({
				':key': 'format'
			});
			if (row.value && row.value === 'png') {
				this._format = 'image/png'
			} else if (row.value && row.value === 'jpg') {
				this._format = 'image/jpg'
			} else {
				// Fall back to PNG, hope it works.
				this._format = 'image/png'
			}

			// 🍂event databaseloaded
			// Fired when the database has been loaded, parsed, and ready for queries
			this.fire('databaseloaded');
			this._databaseIsLoaded = true;
		} catch (ex) {
			// 🍂event databaseloaded
			// Fired when the database could not load for any reason. Might contain
			// an `error` property describing the error.
			this.fire('databaseerror', {
				error: ex
			});
		}
	},

	createTile: function (coords, done) {
		const tile = document.createElement('img');

		if (this.options.crossOrigin) {
			tile.crossOrigin = '';
		}

		/*
		 * Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
		 * http://www.w3.org/TR/WCAG20-TECHS/H67
		 */
		tile.alt = '';

		/*
		 * Set role="presentation" to force screen readers to ignore this
		 * https://www.w3.org/TR/wai-aria/roles#textalternativecomputation
		 */
		tile.setAttribute('role', 'presentation');

		// In TileLayer.MBTiles, the getTileUrl() method can only be called when
		// the database has already been loaded.
		if (this._databaseIsLoaded) {
			L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
			L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));

			tile.src = this.getTileUrl(coords);
		} else {
			this.on('databaseloaded', function () {
				L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
				L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));

				tile.src = this.getTileUrl(coords);
			}.bind(this));
		}

		return tile;
	},

	getTileUrl: function (coords) {

		// Luckily, SQL execution is synchronous. If not, this code would get much more complicated.
		const row = this._stmt.getAsObject({
			':x': coords.x,
			':y': this._globalTileRange.max.y - coords.y,
			':z': coords.z
		});

		if ('tile_data' in row) {
			return window.URL.createObjectURL(new Blob([row.tile_data], {
				type: 'image/png'
			}));
		} else {
			return L.Util.emptyImageUrl;
		}
	}
});

/*
🍂factory tileLayer.mbTiles(url: String, options: TileLayer options)
Returns a new `L.TileLayer.MBTiles`, fetching and using the database given in `url`.
🍂alternative
🍂factory tileLayer.mbTiles(databaseBuffer: Uint8Array, options: TileLayer options)
Returns a new `L.TileLayer.MBTiles`, given a MBTiles database as a javascript binary array.
*/
L.tileLayer.mbTiles = function (url, options) {
	return new L.TileLayer.MBTiles(url, options);
}