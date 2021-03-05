const map = L.map("map", {
  zoomSnap: 0,
  tap: false,
  maxZoom: 22,
  zoomControl: false,
  renderer: L.canvas({
    padding: 0.5,
    tolerance: 10
  })
}).fitWorld();
map.attributionControl.setPrefix("<a href='#' onclick='showInfo(); return false;'>About</a>");

map.once("locationfound", function(e) {
  hideLoader();
  map.fitBounds(e.bounds, {maxZoom: 18});
});

map.on("click", function(e) {
  layers.select.clearLayers();
});

map.on("baselayerchange", function(e) {
  localStorage.setItem("basemap", e.name);
});

const layers = {
  basemaps: {
    "Streets": L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.@2xpng", {
      maxNativeZoom: 18,
      maxZoom: map.getMaxZoom(),
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/attribution">CARTO</a>',
    }).addTo(map),

    "Aerial": L.tileLayer("https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}", {
      maxNativeZoom: 16,
      maxZoom: map.getMaxZoom(),
      attribution: "USGS",
    }),
    
    "Topo": L.tileLayer("https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}", {
      maxNativeZoom: 16,
      maxZoom: map.getMaxZoom(),
      attribution: "USGS",
    }),

    "Charts": L.tileLayer("https://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png", {
      maxNativeZoom: 18,
      maxZoom: map.getMaxZoom(),
      attribution: "NOAA",
    }),

    "None": L.tileLayer("", {
      maxZoom: map.getMaxZoom()
    })
  },

  select: L.featureGroup(null).addTo(map),
  overlays: {}
};

/*** Begin custom input control for adding local file ***/
L.Control.AddFile = L.Control.extend({
  onAdd: function(map) {
    fileInput = L.DomUtil.create("input", "hidden");
    fileInput.type = "file";
    fileInput.accept = ".mbtiles, .geojson, .kml, .gpx, .csv";
    fileInput.style.display = "none";
    
    fileInput.addEventListener("change", function () {
      const file = fileInput.files[0];
      handleFile(file);
      this.value = "";
    }, false);
    
    const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    div.innerHTML = `
      <a class='leaflet-bar-part leaflet-bar-part-single file-control-btn' title='Load File' onclick='fileInput.click();'>
        <i class='icon-add'></i>
      </a>
    `;
    L.DomEvent.on(div, "click", function (e) {
      L.DomEvent.stopPropagation(e);
    });
    return div
  }
});

L.control.addfile = function(opts) {
  return new L.Control.AddFile(opts);
}
/*** End custom control ***/

const controls = {
  layerCtrl: L.control.layers(layers.basemaps, null, {
    collapsed: true,
    position: "topright"
  }).addTo(map),

  fileCtrl: L.control.addfile({
    position: "bottomright"
  }).addTo(map),

  locateCtrl: L.control.locate({
    icon: "icon-gps_fixed",
    iconLoading: "icon-gps_not_fixed",
    setView: "untilPan",
    cacheLocation: true,
    position: "bottomright",
    flyTo: false,
    keepCurrentZoomLevel: true,
    circleStyle: {
      interactive: false
    },
    markerStyle: {
      interactive: true
    },
    metric: false,
    strings: {
      title: "My location",
      popup: function(options) {
        const loc = controls.locateCtrl._marker.getLatLng();
        return `<div style="text-align: center;">You are within ${Number(options.distance).toLocaleString()} ${options.unit}<br>from <strong>${loc.lat.toFixed(6)}</strong>, <strong>${loc.lng.toFixed(6)}</strong></div>`;
      }
    },
    locateOptions: {
      enableHighAccuracy: true,
      maxZoom: 18
    },
    onLocationError: function(e) {
      hideLoader();
      document.querySelector(".leaflet-control-locate").getElementsByTagName("span")[0].className = "icon-gps_off";
      alert(e.message);
    }
  }).addTo(map),

  scaleCtrl: L.control.scale({
    position: "bottomleft"
  }).addTo(map)
};

function handleFile(file) {
  showLoader();
  const name = file.name.split(".").slice(0, -1).join(".");

  if (file.name.endsWith(".mbtiles")) {
    loadRaster(file, name);
  } else if (file.name.endsWith(".geojson") || file.name.endsWith(".kml") || file.name.endsWith(".gpx") || file.name.endsWith(".csv")) {
    const format = file.name.split(".").pop();
    loadVector(file, name, format);
  } else {
    alert("MBTiles, GeoJSON, KML, GPX, and CSV files supported.");
    hideLoader();
  }
}

function loadVector(file, name, format) {
  const reader = new FileReader();
  let geojson = null;

  reader.onload = function(e) {
    if (format == "geojson") {
      geojson = JSON.parse(reader.result);
    } else if (format == "kml") {
      const kml = (new DOMParser()).parseFromString(reader.result, "text/xml");
      geojson = toGeoJSON.kml(kml, {styles: true});
    } else if (format == "gpx") {
      const gpx = (new DOMParser()).parseFromString(reader.result, "text/xml");
      geojson = toGeoJSON.gpx(gpx);
    } else if (format == "csv") {
      csv2geojson.csv2geojson(reader.result, function(err, data) {
        geojson = data;
      });
    }

    createVectorLayer(name, geojson);
  }

  reader.readAsText(file);
}

function createVectorLayer(name, data) {
  let radius = 4;
  const layer = L.geoJSON(data, {
    bubblingMouseEvents: false,
    style: function (feature) {
      return {	
        color: feature.properties["stroke"] ? feature.properties["stroke"] : feature.properties["marker-color"] ? feature.properties["marker-color"] : "#ff0000",
        opacity: feature.properties["stroke-opacity"] ? feature.properties["stroke-opacity"] : 1.0,
        weight: feature.properties["stroke-width"] ? feature.properties["stroke-width"] : 3,
        fillColor: feature.properties["fill"] ? feature.properties["fill"] : feature.properties["marker-color"] ? feature.properties["marker-color"] : "#ff0000",
        fillOpacity: feature.properties["fill-opacity"] ? feature.properties["fill-opacity"] : feature.geometry.type != "Point" ? 0.2 : feature.geometry.type == "Point" ? 1 : "",
      };	
    },
    pointToLayer: function (feature, latlng) {	
      const size = feature.properties["marker-size"] ? feature.properties["marker-size"] : "small";
      const sizes = {
        small: 4,
        medium: 6,
        large: 8
      };
      radius = sizes[size];
      return L.circleMarker(latlng, {
        radius: radius
      });
    },
    onEachFeature: function (feature, layer) {
      let table = "<div style='overflow:auto;'><table>";
      const hiddenProps = ["styleUrl", "styleHash", "styleMapHash", "stroke", "stroke-opacity", "stroke-width", "opacity", "fill", "fill-opacity", "icon", "scale", "coordTimes", "marker-size", "marker-color", "marker-symbol"];
      for (const key in feature.properties) {
        if (feature.properties.hasOwnProperty(key) && hiddenProps.indexOf(key) == -1) {
          table += "<tr><th>" + key.toUpperCase() + "</th><td>" + formatProperty(feature.properties[key]) + "</td></tr>";
        }
      }
      table += "</table></div>";
      layer.bindPopup(table, {
        // closeButton: false,
        maxHeight: 300,
        maxWidth: 250
      });
      layer.on({
        popupclose: function (e) {
          layers.select.clearLayers();
        },
        click: function (e) {
          layers.select.clearLayers();
          layers.select.addLayer(L.geoJSON(layer.toGeoJSON(), {
            style: {
              color: "#00FFFF",
              weight: 5
            },
            pointToLayer: function (feature, latlng) {
              return L.circleMarker(latlng, {
                radius: radius,
                color: "#00FFFF",
                fillColor: "#00FFFF",
                fillOpacity: 1
              }); 
            }
          }))
        }
      });
    }
    
  });

  addOverlayLayer(layer, name);
  layers.overlays[L.Util.stamp(layer)] = layer;
  layer.addTo(map);
  zoomToLayer(L.Util.stamp(layer));
}

function loadRaster(file, name) {
  const reader = new FileReader();

  reader.onload = function(e) {
    createRasterLayer(name, reader.result);
  }

  reader.readAsArrayBuffer(file);
}

function createRasterLayer(name, data) {
  const layer = L.tileLayer.mbTiles(data, {
    autoScale: true,
    fitBounds: true,
    updateWhenIdle: false
  }).on("databaseloaded", function(e) {
    name = (layer.options.name ? layer.options.name : name);
    addOverlayLayer(layer, name);
  }).addTo(map);
  layers.overlays[L.Util.stamp(layer)] = layer;
}

function addOverlayLayer(layer, name) {
  hideLoader();
  controls.layerCtrl.addOverlay(layer, `
    ${name.replace("_", " ")}<br>
    <span class="layer-buttons">
      <input type="range" value="1" step="0.1" min="0" max="1" data-layer="${L.Util.stamp(layer)}" style="width: 100%;" oninput="changeOpacity(${L.Util.stamp(layer)});">
      <a class="layer-btn" href="#" title="Zoom to layer" onclick="zoomToLayer(${L.Util.stamp(layer)}); return false;"><i class="icon-zoom_out_map" style="color: darkslategray; font-size: 22px;"></i></a>
      <a class="layer-btn" href="#" title="Remove layer" onclick="removeLayer(${L.Util.stamp(layer)}, '${name}'); return false;"><i class="icon-delete" style="color: red; font-size: 22px;"></i></a>
    </span>
    <div style="clear: both;"></div>
  `);
}

function zoomToLayer(id) {
  const layer = layers.overlays[id];
  if (!map.hasLayer(layer)) {
    map.addLayer(layers.overlays[id]);
  }
  if (layer.options.bounds) {
    map.fitBounds(layer.options.bounds);
  }
  else {
    map.fitBounds(layer.getBounds(), {padding: [20, 20]});
  }
}

function removeLayer(id, name) {
  if (confirm(`Remove ${name}?`)) {
    const layer = layers.overlays[id];
    if (!map.hasLayer(layer)) {
      map.addLayer(layers.overlays[id]);
    }
    if (layer instanceof L.TileLayer.MBTiles) {
      layer._db.close(); 
    }
    map.removeLayer(layer);
    controls.layerCtrl.removeLayer(layer);
  }
}

function changeOpacity(id) {
  const value = document.querySelector(`[data-layer='${id}']`).value;
  const layer = layers.overlays[id];
  if (!map.hasLayer(layer)) {
    map.addLayer(layers.overlays[id]);
  }
  if (layer instanceof L.TileLayer.MBTiles || layer instanceof L.ImageOverlay) {
    layer.setOpacity(value);
  } else if (layer instanceof L.GeoJSON) {
    layer.setStyle({
      opacity: value,
      fillOpacity: value
    });
  }
}

function formatProperty(value) {
  if (typeof value == "string" && value.startsWith("http")) {
    return `<a href="${value}" target="_blank">${value}</a>`;
  } else {
    return value;
  }
}

function showLoader() {
  document.getElementById("progress-bar").style.display = "block";
}

function hideLoader() {
  document.getElementById("progress-bar").style.display = "none";
}

function switchBaseLayer(name) {
  const basemaps = Object.keys(layers.basemaps);
  for (const layer of basemaps) {
    if (layer == name) {
      map.addLayer(layers.basemaps[layer]);
    } else {
      map.removeLayer(layers.basemaps[layer]);
    }
  }
}

function loadBasemapConfig(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const config = JSON.parse(reader.result);
    if (confirm("Are you sure you want to overwrite the default basemaps?")) {
      loadCustomBasemaps(config);
      localStorage.setItem("basemapConfig", JSON.stringify(config));
    }
  }
  reader.readAsText(file);
}

function loadCustomBasemaps(config) {
  const basemaps = Object.keys(layers.basemaps);
  for (const layer of basemaps) {
    map.removeLayer(layers.basemaps[layer]);
    controls.layerCtrl.removeLayer(layers.basemaps[layer]);
  }
  layers.basemaps = {};
  config.forEach((element, index) => {
    let layer = null;
    if (element.type == "wms") {
      layer = L.tileLayer.wms(element.url, {
        maxNativeZoom: element.maxZoom ? element.maxZoom : 18,
        maxZoom: map.getMaxZoom(),
        layers: element.layers,
        format: element.format ? element.format : "image/png",
        attribution: element.attribution ? element.attribution : ""
      });
    } else if (element.type == "xyz") {
      layer = L.tileLayer(element.url, {
        maxNativeZoom: element.maxZoom ? element.maxZoom : 18,
        maxZoom: map.getMaxZoom(),
        attribution: element.attribution ? element.attribution : ""
      }); 
    }
    if (index == 0) {
      layer.addTo(map);
    }
    layers.basemaps[element.name] = layer;
    controls.layerCtrl.addBaseLayer(layer, element.name);
  });
  controls.layerCtrl.addBaseLayer(L.tileLayer("", {maxZoom: map.getMaxZoom()}), "None");
}

function showInfo() {
  alert("Welcome to GPSMap.app, an offline capable map viewer with GPS integration!\n\n- Tap the + button to load a raster MBTiles, GeoJSON, KML, GPX, or CSV file directly from your device or cloud storage.\n- Tap the layers button to view online basemaps and manage offline layers.\n\nDeveloped by Bryan McBride - mcbride.bryan@gmail.com");
}

// Drag and drop files
const dropArea = document.getElementById("map");

["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  dropArea.addEventListener(eventName, function(e) {
    e.preventDefault();
    e.stopPropagation();
  }, false);
});

["dragenter", "dragover"].forEach(eventName => {
  dropArea.addEventListener(eventName, showLoader, false);
});

["dragleave", "drop"].forEach(eventName => {
  dropArea.addEventListener(eventName, hideLoader, false);
});

dropArea.addEventListener("drop", function(e) {
  const file = e.dataTransfer.files[0];
  handleFile(file);
}, false);

window.addEventListener("offline",  function(e) {
  switchBaseLayer("None");
});

document.querySelector(".leaflet-control-layers-base").addEventListener("contextmenu", e => {
  e.preventDefault();
  let fileInput = L.DomUtil.create("input", "hidden");
  fileInput.type = "file";
  fileInput.accept = ".json";
  fileInput.addEventListener("change", function () {
    const file = fileInput.files[0];
    loadBasemapConfig(file);
    this.value = "";
  }, false);
  fileInput.click();
});

document.addEventListener("DOMContentLoaded", function(){
  showLoader();
  controls.locateCtrl.start();
  if (localStorage.getItem("basemapConfig")) {
    loadCustomBasemaps(JSON.parse(localStorage.getItem("basemapConfig")))
  }
});

initSqlJs({
  locateFile: function() {
    return "assets/vendor/sqljs-1.4.0/sql-wasm.wasm";
  }
}).then(function(SQL){
  if (!navigator.onLine) {
    switchBaseLayer("None");
  } else if (localStorage.getItem("basemap")) {
    switchBaseLayer(localStorage.getItem("basemap"));
  }
  document.getElementsByClassName("leaflet-control-layers")[0].style.maxHeight = `${(document.getElementById("map").offsetHeight * .75)}px`;
  document.getElementsByClassName("leaflet-control-layers")[0].style.maxWidth = `${(document.getElementById("map").offsetWidth * .75)}px`;
});