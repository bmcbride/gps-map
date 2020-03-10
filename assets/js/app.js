const map = L.map("map", {
  zoomSnap: 0,
  maxZoom: 22,
  zoomControl: false,
  renderer: L.canvas({
    padding: 0.5,
    tolerance: 10
  })
}).fitWorld();
map.attributionControl.setPrefix(`<a href="#" data-toggle="modal" data-target="#helpModal">Help</a> | <a href="#" id="lock-btn" onclick="toggleScreenLock(); return false;">Lock</a>`);

map.once("locationfound", function(e) {
  map.fitBounds(e.bounds, {maxZoom: 18});
});

map.on("click", function(e) {
  layers.select.clearLayers();
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
    fileInput.accept = ".mbtiles, .geojson, .kml, .gpx";
    fileInput.style.display = "none";
    
    fileInput.addEventListener("change", function () {
      const file = fileInput.files[0];
      handleFile(file);
      this.value = "";
    }, false);
    
    const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    div.innerHTML = `
      <a class='leaflet-bar-part leaflet-bar-part-single file-control-btn' title='Load File' onclick='fileInput.click();'>
        <i id='loading-icon' class='fas fa-map-marked-alt'></i>
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

  locateCtrl: L.control.locate({
    icon: "fas fa-crosshairs",
    setView: "untilPan",
    cacheLocation: true,
    position: "topleft",
    flyTo: false,
    keepCurrentZoomLevel: false,
    circleStyle: {
      interactive: false
    },
    markerStyle: {
      interactive: false
    },
    locateOptions: {
      enableHighAccuracy: true,
      maxZoom: 18
    },
    onLocationError: function(e) {
      alert(e.message);
    }
  }).addTo(map),

  fileCtrl: L.control.addfile({
    position: "topleft"
  }).addTo(map)
};

function handleFile(file) {
  showLoader();

  const name = file.name.split(".").slice(0, -1).join(".");

  if (file.name.endsWith(".mbtiles")) {
    loadRaster(file, name);
  } else if (file.name.endsWith(".geojson") || file.name.endsWith(".kml") || file.name.endsWith(".gpx")) {
    const format = file.name.split(".").pop();
    loadVector(file, name, format);
  } else {
    alert("MBTiles, GeoJSON, KML, and GPX files supported.");
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
    }

    const layer = L.geoJSON(geojson, {
      bubblingMouseEvents: false,
      style: function (feature) {
        return {
          color: feature.properties["stroke"] ? feature.properties["stroke"] : "red",
          opacity: feature.properties["stroke-opacity"] ? feature.properties["stroke-opacity"] : 1.0,
          weight: feature.properties["stroke-width"] ? feature.properties["stroke-width"] : 3,
          fillColor: feature.properties["fill"] ? feature.properties["fill"] : "red",
          fillOpacity: feature.properties["fill-opacity"] ? feature.properties["fill-opacity"] : 0.2,
        };
      },
      pointToLayer: function (feature, latlng) {
        if (format == "kml") {
          return L.circleMarker(latlng, {
            radius: 6
          }); 
        } else {
          return L.marker(latlng);
        }
      },
      onEachFeature: function (feature, layer) {
        let table = "<table class='table table-striped table-bordered table-sm' style='margin-bottom: 0px;'>";
        
        if (feature && feature.geometry) {
          if (feature.geometry.type.includes("LineString")) {
            const length = turf.length(layer.toGeoJSON(), {units: "miles"});
            table += `<tr><th>LENGTH</th><td>${length.toFixed(1)} Miles</td></tr>`;
          } else if (feature.geometry.type === "Polygon") {
            const sqMeters = turf.area(layer.toGeoJSON());
            const acres = (sqMeters / 4046.86);
            const area = (acres < 640) ? (acres.toFixed(1) + " Acres") : ((sqMeters / 2589990).toFixed(1) + " Sq. Miles");
            table += `<tr><th>AREA</th><td>${area}</td></tr>`;
          } else if (feature.geometry.type === "Point") {
            const latitude = feature.geometry.coordinates[1].toFixed(6);
            const longitude = feature.geometry.coordinates[0].toFixed(6);
            table += `<tr><th>LATITUDE</th><td>${latitude}</td></tr>`;
            table += `<tr><th>LONGITUDE</th><td>${longitude}</td></tr>`;
          }
        }

        feature.properties["_id_"] = L.Util.stamp(layer);

        const hiddenProps = ["styleUrl", "styleHash", "styleMapHash", "stroke", "stroke-opacity", "stroke-width", "opacity", "fill", "fill-opacity", "icon", "scale", "coordTimes", "_id_"];
        for (const key in feature.properties) {
          if (feature.properties.hasOwnProperty(key) && hiddenProps.indexOf(key) == -1) {
            table += "<tr><th>" + key.toUpperCase() + "</th><td>" + formatProperty(feature.properties[key]) + "</td></tr>";
          }
        }
        table += "</table>";
        layer.on({
          click: function (e) {
            layers.select.clearLayers();
            layers.select.addLayer(L.geoJSON(layer.toGeoJSON(), {
              style: {
                color: "#00FFFF",
                weight: 5
              },
              pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                  radius: 6,
                  color: "#00FFFF"
                }); 
              }
            }));

            $("#feature-info").html(table);
            $("#featureModal").modal("show");
          }
        });
      }
      
    }).addTo(map);

    addLayer(layer, name);
    layers.overlays[L.Util.stamp(layer)] = layer;
    zoomToLayer(L.Util.stamp(layer));
  }

  reader.readAsText(file);
}

function loadRaster(file, name) {
  const reader = new FileReader();

  reader.onload = function(e) {
    const layer = L.tileLayer.mbTiles(reader.result, {
      autoScale: true,
      fitBounds: true,
      updateWhenIdle: false
    }).on("databaseloaded", function(e) {
      name = (layer.options.name ? layer.options.name : name);
      addLayer(layer, name);
    }).addTo(map);
    layers.overlays[L.Util.stamp(layer)] = layer;
  }

  reader.readAsArrayBuffer(file);
}

function addLayer(layer, name) {
  hideLoader();
  controls.layerCtrl.addOverlay(layer, `
    <span class="layer-name" id="${L.Util.stamp(layer)}">
      ${name}
    </span>
    <span class="layer-buttons">
      <span style="display: ${layer instanceof L.GeoJSON ? 'none' : 'unset'}">
        <a class="layer-btn" href="#" title="Change opacity" onclick="changeOpacity(${L.Util.stamp(layer)}); return false;"><i class="fas fa-adjust"></i></a>
      </span>
      <span style="display: ${layer instanceof L.TileLayer.MBTiles ? 'none' : 'unset'}">
        <a class="layer-btn" href="#" title="Feature table" onclick="showTable(${L.Util.stamp(layer)}, '${name}'); return false;"><i class="fas fa-table"></i></a>
      </span>
      <a class="layer-btn" href="#" title="Zoom to layer" onclick="zoomToLayer(${L.Util.stamp(layer)}); return false;"><i class="fas fa-expand-arrows-alt"></i></a>
      <a class="layer-btn" href="#" title="Remove layer" onclick="removeLayer(${L.Util.stamp(layer)}, '${name}'); return false;"><i class="fas fa-trash" style="color: red"></i></a>
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
  const cfm = confirm(`Remove ${name}?`);
  if (cfm == true) {
    const layer = layers.overlays[id];
    if (!map.hasLayer(layer)) {
      map.addLayer(layers.overlays[id]);
    }
    map.removeLayer(layer);
    controls.layerCtrl.removeLayer(layer);
  }
}

function changeOpacity(id) {
  const layer = layers.overlays[id];
  if (!map.hasLayer(layer)) {
    map.addLayer(layers.overlays[id]);
  }
  let value = layer.options.opacity;
  if (value > 0.2) {
    layer.setOpacity((value-0.2).toFixed(1));  
  } else {
    layer.setOpacity(1);
  }
}

let tableLayer = null;
function showTable(id, name) {
  $("#layer-name").html(name);
  if (tableLayer && tableLayer == id) {
    $("#featureTable").modal("show");
  } else {
    tableLayer = id;
    let columns = [];
    let data = [];
    
    const layer = layers.overlays[id];
    const features = layer.toGeoJSON().features;
  
    $.each(features, function(index, feature) {
      data.push(feature.properties);
      $.each(feature.properties, function(index, prop) {
        if (columns.indexOf(index) === -1) {
          columns.push(index);
        }
      });
    });
  
    columns = columns.map(function(column) {
      return ({
        field: column,
        title: column.toUpperCase().replace(/_/g, " "),
        sortable: true,
        align: "left",
        valign: "middle",
        visible: (column == "_id_") ? false : true,
        formatter: formatProperty
      });
    });
  
    $("#features-table").bootstrapTable("destroy");
    $("#features-table").bootstrapTable({
      cache: false,
      classes: "table table-bordered table-sm table-striped",
      buttonsClass: "light",
      height: $("#map").height() - 150,
      undefinedText: "",
      striped: true,
      pagination: false,
      minimumCountColumns: 1,
      search: true,
      trimOnSearch: false,
      searchAlign: "left",
      showColumns: true,
      showToggle: false,
      buttonsAlign: "right",
      columns: columns,
      data: data,
      onClickRow: function(row, $element) {
        const feature = layer._layers[row["_id_"]];
        layers.select.clearLayers();
        layers.select.addLayer(L.geoJSON(feature.toGeoJSON(), {
          style: {
            color: "#00FFFF",
            weight: 5
          },
          pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
              radius: 6,
              color: "#00FFFF"
            }); 
          }
        }));
        map.fitBounds(layers.select.getBounds(), {
          maxZoom: 18,
          padding: [20, 20]
        });
        $("#featureTable").modal("hide");
      },
      onDblClickRow: function(row) {
      },
      onSearch: function(text) {
      }
    });
  
    $("#featureTable").modal("show"); 
  }
}

$("#featureTable").on("shown.bs.modal", function () {
  $("#features-table").bootstrapTable("resetView");
})

function formatProperty(value) {
  if (typeof value == "string" && value.startsWith("http")) {
    return `<a href="${value}" target="_blank">${value}</a>`;
  } else {
    return value;
  }
}

function showLoader() {
  const loadingIcon = document.getElementById("loading-icon");
  loadingIcon.classList.remove("fa-map-marked-alt");
  loadingIcon.classList.add("fa-spinner", "fa-spin");
}

function hideLoader() {
  const loadingIcon = document.getElementById("loading-icon");
  loadingIcon.classList.remove("fa-spin", "fa-spinner");
  loadingIcon.classList.add("fa-map-marked-alt");
}

function goOffline() {
  const basemaps = Object.keys(layers.basemaps);
  for (const layer of basemaps) {
    if (layer == "None") {
      map.addLayer(layers.basemaps[layer]);
    } else {
      map.removeLayer(layers.basemaps[layer]);
    }
  }
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

// Experimental screen locking
let wakeLock = null;

const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      console.log("Wake Lock was released");
      document.getElementById("lock-btn").style.color = "";
    });
    console.log("Wake Lock is active");
    document.getElementById("lock-btn").style.color = "red";
  } catch (e) {
    console.error(`${e.name}, ${e.message}`);
  }
};

function toggleScreenLock() {
  if (confirm("Keep screen awake?")) {
    requestWakeLock();
  } else {
    if (wakeLock) {
      wakeLock.release();
    }
  }
}

window.addEventListener("offline",  function(e) {
  goOffline();
});

initSqlJs({
  locateFile: function() {
    return "assets/vendor/sqljs-1.1.0/sql-wasm.wasm";
  }
}).then(function(SQL){
  navigator.onLine ? null : goOffline();
});

controls.locateCtrl.start();