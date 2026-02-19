const app = {
  version: "2026.02.19.3"
}

const mapStore = localforage.createInstance({
  name: "maps",
  storeName: "saved_maps"
});

let layers = {};
let wakeLock = null;

const map = L.map("map", {
  zoomSnap: L.Browser.mobile ? 0 : 1,
  maxZoom: 22,
  zoomControl: false,
  attributionControl: false
});

map.on("load", (e) => {
  loadSavedMaps();
});

map.on("baselayerchange", (e) => {
  localStorage.setItem("map", e.layer.options.key);
  map.eachLayer(layer => {
    if (layer instanceof L.GridLayer && layer != e.layer) {
      map.removeLayer(layer);
    }
  });
  if (e.layer.options.bounds) {
    let bounds = e.layer.options.bounds;
    map.setMaxBounds(null);
    map.once("moveend", () => {
      map.setMaxBounds(L.latLngBounds(bounds).pad(0.25));
    });
    map.fitBounds(bounds, {animate: false});
    map.bounds = bounds;
    controls.locateCtrl._isOutsideMapBounds = function() {
      let llbounds = L.latLngBounds([bounds[0]], [bounds[1]]);
      if (this._event === undefined) {
        return false;
      }
      return !llbounds.contains(this._event.latlng);
    }
  }
});

map.fitWorld();

// Add file control
L.Control.AddFile = L.Control.extend({
  onAdd: (map) => {
    const iOS = ["iPad Simulator","iPhone Simulator","iPod Simulator","iPad","iPhone","iPod"].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    fileInput = L.DomUtil.create("input", "hidden");
    fileInput.type = "file";
    fileInput.accept = iOS ? "*" : ".pmtiles, .geojson";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", function () {
      const file = fileInput.files[0];
      handleFile(file);
      this.value = "";
    }, false);

    const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    div.innerHTML = `
      <a class="leaflet-bar-part leaflet-bar-part-single file-control-btn" title="App Info" onclick="showInfo();">
        <i class="icon-info_outline"></i>
      </a>
    `;
    L.DomEvent.on(div, "click", (e) => {
      L.DomEvent.stopPropagation(e);
    });
    return div
  }
});

L.control.addfile = (opts) => {
  return new L.Control.AddFile(opts);
}

// Fit bounds control
L.Control.Fitbounds = L.Control.extend({
  onAdd: (map) => {
    const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    div.innerHTML = `
      <a class="leaflet-bar-part leaflet-bar-part-single fit-bounds-btn" title="Zoom To Map" onclick="if (map.bounds) {map.fitBounds(map.bounds, {animate: false})};">
        <i class="icon-zoom_out_map"></i>
      </a>
    `;
    L.DomEvent.on(div, "click", (e) => {
      L.DomEvent.stopPropagation(e);
    });
    return div
  }
});

L.control.fitbounds = (opts) => {
  return new L.Control.Fitbounds(opts);
}

// Save map control
L.Control.Savemap = L.Control.extend({
  onAdd: (map) => {
    const div = L.DomUtil.create("div");
    div.innerHTML = "<button id='save-map-button'>Save Map</button>";
    L.DomEvent.on(div, "click", (e) => {
      L.DomEvent.stopPropagation(e);
    });
    return div
  }
});

L.control.savemap = (opts) => {
  return new L.Control.Savemap(opts);
}

const controls = {
  layerCtrl: L.control.layers(null, null, {
    collapsed: L.Browser.mobile ? true : false,
    sortLayers: true,
    position: "topright"
  }),

  zoomCtrl: L.control.fitbounds({
    position: "bottomright"
  }).addTo(map),

  locateCtrl: L.control.locate({
    icon: "icon-gps_fixed",
    iconLoading: "spinner icon-gps_fixed",
    setView: "untilPan",
    cacheLocation: true,
    position: "bottomright",
    flyTo: false,
    // initialZoomLevel: 18,
    keepCurrentZoomLevel: true,
    circleStyle: {
      interactive: false
    },
    markerStyle: {
      interactive: true
    },
    compassStyle: {
      width: 13,
      depth: 13
    },
    metric: (navigator.language && navigator.language.includes('-US')) ? false : true,
    strings: {
      title: "My location",
      outsideMapBoundsMsg: "Your location is outside the boundaries of the map",
      popup: (options) => {
        const loc = controls.locateCtrl._marker.getLatLng();
        return `<div style="text-align: center;">You are within ${Number(options.distance).toLocaleString()} ${options.unit} of<br><strong>${loc.lat.toFixed(6)}</strong>, <strong>${loc.lng.toFixed(6)}</strong></div>`;
      }
    },
    locateOptions: {
      enableHighAccuracy: true,
      maxZoom: 18
    },
    onLocationOutsideMapBounds(control) {
      control.stop();
      Swal.fire({
        icon: "warning",
        text: control.options.strings.outsideMapBoundsMsg,
        toast: true,
        timer: 2500,
        position: "center",
        showCloseButton: true,
        showConfirmButton: false
      });
    },
    onLocationError: (e) => {
      hideLoader();
      document.querySelector(".leaflet-control-locate").getElementsByTagName("span")[0].className = "icon-gps_off";
      Swal.fire({
        icon: "warning",
        text: e.message,
        toast: true,
        timer: 2500,
        position: "center",
        showCloseButton: true,
        showConfirmButton: false
      });
    }
  }).addTo(map),

  attributionCtrl: L.control.attribution({
    // prefix: `<span id="status-indicator" style="color:${navigator.onLine ? "green" : "red"}">&#9673;</span>&nbsp;<span id="status-msg">${navigator.onLine ? "online" : "offline"}</span>`,
    prefix: null,
    position: "bottomleft"
  }).addTo(map),

  scaleCtrl: L.control.scale({
    position: "bottomleft"
  }).addTo(map),

  fileCtrl: L.control.addfile({
    position: "bottomright"
  }).addTo(map),

  savemapCtrl: L.control.savemap({
    position: "topleft"
  })
};

function switchBaseLayer(name) {
  let basemaps = Object.keys(layers);
  for (const layer of basemaps) {
    if (layer == name) {
      map.addLayer(layers[layer]);
    } else {
      map.removeLayer(layers[layer]);
    }
  }
}

function loadSavedMaps() {
  let keys = [];
  mapStore.iterate((value, key) => {
    keys.push(key);
    createRasterLayer(key, value);
  }).then(() => {
    handleURLparams(keys);
  }).catch((err) => {
    console.log(err);
  });
}

function handleURLparams(keys) {
  let urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("map")) {
    let key = urlParams.get("map");
    key = key.includes("www.dropbox.com") ? key.replace("www.dropbox.com", "dl.dropboxusercontent.com") : key;
    if (keys.includes(key)) {
      let layer = layers[key];
      map.addLayer(layer);
      map.fitBounds(layer.options.bounds, {animate: false});
      // begin check for updated version
      if (navigator.onLine) {
        let p = new pmtiles.PMTiles(key);
        p.getMetadata().then(metadata => {
          if (layer.options.version !== metadata.version) {
            p.getHeader().then(header => {
              Swal.fire({
                icon: "question",
                text: "There is a new version of this map. Would you like to download the update?",
                confirmButtonText: "Update",
                confirmButtonColor: "#3085d6",
                showCancelButton: true,
                showCloseButton: true,
                reverseButtons: true
              }).then((result) => {
                if (result.isConfirmed) {
                  fetchFile(key, metadata, header);
                }
              });
            })
          }
        }).catch((err) => {
          console.log("Error checking for updates");
        });
      }
      // end check for updated version
    } else {
      if (navigator.onLine) {
        let p = new pmtiles.PMTiles(key);
        p.getMetadata().then(metadata => {
          if (metadata.format == "pbf" || metadata.vector_layers) {
            Swal.fire({
              icon: "error",
              text: "Only raster tilesets are supported!",
              showCloseButton: true,
              showConfirmButton: false
            });
          } else {
            p.getHeader().then(header => {
              if (metadata && header) {
                layers.tempLayer = pmtiles.leafletRasterLayer(p, {
                  updateWhenIdle: false,
                  maxZoom: map.getMaxZoom(),
                  maxNativeZoom: Number(header.maxZoom),
                  attribution: metadata.attribution
                });
                map.addLayer(layers.tempLayer);
                map.fitBounds([[header.minLat, header.minLon], [header.maxLat, header.maxLon]], {animate: false});
                map.addControl(controls.savemapCtrl);
                document.getElementById("save-map-button").onclick = () => fetchFile(key, metadata, header);
              }
            });
          }
        }).catch((err) => {
          Swal.fire({
            icon: "error",
            text: "There was an error loading the map referenced in the URL. Please check that it is a valid file.",
            showCloseButton: true,
            showConfirmButton: false
          });
        });
      } else {
        Swal.fire({
          icon: "error",
          text: "Cannot load new maps when offline!",
          showCloseButton: true,
          showConfirmButton: false
        });
      }
    }
  } else {
    // controls.locateCtrl.start();
    if (localStorage.getItem("map")) {
      switchBaseLayer(localStorage.getItem("map"));
    } else {
      showInfo();
    }
  }
}

function fetchFile(url, metadata, header) {
  if (navigator.onLine) {
    Swal.fire({
      icon: "question",
      html: `Download the <strong>${metadata.name} (${formatSize(header.tileDataLength)})</strong> map and save to your device for offline use?`,
      showConfirmButton: true,
      confirmButtonText: "Save",
      confirmButtonColor: "#3085d6",
      showCancelButton: true,
      showCloseButton: true,
      reverseButtons: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(response.statusText)
            }
            return response.blob()
          })
          .catch(error => {
            Swal.showValidationMessage(
              `Request failed: ${error}`
            )
          })
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        let name = url.split("/").slice(-1)[0];
        let file = new File([result.value], name, {type: result.value.type});
        saveMap(file, name, url);
      }
    });
  } else {
    Swal.fire({
      icon: "warning",
      text: "Must be online to download maps!",
      toast: true,
      timer: 2500,
      position: "center",
      showCloseButton: true,
      showConfirmButton: false
    });
  }
}

function saveMap(file, name, url) {
  let p = new pmtiles.PMTiles(new pmtiles.FileSource(file));
  p.getMetadata().then(metadata => {
    if (metadata.format == "pbf" || metadata.vector_layers) {
      Swal.fire({
        icon: "error",
        text: "Only raster tilesets are supported!",
        showCloseButton: true,
        showConfirmButton: false
      });
    } else {
      p.getHeader().then(header => {
        const key = url ? url : Date.now().toString();
        const value = {
          name: metadata.name ? metadata.name : name,
          description: metadata.description ? metadata.description : "",
          attribution: metadata.attribution ? metadata.attribution : "",
          version: metadata.version ? metadata.version : "1",
          bounds: [[header.minLat, header.minLon], [header.maxLat, header.maxLon]],
          maxZoom: header.maxZoom,
          minZoom: header.minZoom,
          timestamp: Date.now(),
          pmtiles: file
        };

        mapStore.setItem(key, value).then((value) => {
          createRasterLayer(key, value, true);
          if (url) {
            map.removeControl(controls.savemapCtrl);
            if (layers.tempLayer) {
              map.removeLayer(layers.tempLayer);
            }
          }
          Swal.fire({
            icon: "success",
            text: "The map has been successfully saved to your device and can now be used offline!",
            toast: true,
            timer: 3000,
            position: "center",
            showCloseButton: false,
            showConfirmButton: false
          });
          hideLoader();
        }).catch((err) => {
          Swal.fire({
            icon: "error",
            text: "Error saving map!",
            toast: true,
            timer: 2500,
            position: "center",
            showCloseButton: true,
            showConfirmButton: false
          });
        });
      });
    }
  });
}

function createRasterLayer(key, value, addToMap) {
  let p = new pmtiles.PMTiles(new pmtiles.FileSource(value.pmtiles));
  let layer = pmtiles.leafletRasterLayer(p, {
    key: key,
    bounds: value.bounds,
    updateWhenIdle: false,
    maxZoom: map.getMaxZoom(),
    maxNativeZoom: Number(value.maxZoom),
    detectRetina: true,
    attribution: value.attribution,
    version: value.version
  });
  layers[key] = layer;
  addRasterLayer(layer, value);
  if (addToMap) {
    map.addLayer(layer);
    map.fitBounds(value.bounds);
  }
}

function handleFile(file) {
  showLoader();
  const name = file.name.split(".").slice(0, -1).join(".");

  if (file.name.includes(".pmtiles")) {
    saveMap(file, name);
  } else if (file.name.includes(".geojson")) {
    addVectorLayer(file, name);
  } else {
    Swal.fire({
      icon: "warning",
      html: "Only <i>.pmtiles</i> and <i>.geojson</i> files are currently supported!",
      toast: true,
      timer: 2500,
      position: "center",
      showCloseButton: true,
      showConfirmButton: false
    });
    hideLoader();
  }
}

function addRasterLayer(layer, value) {
  controls.layerCtrl.addBaseLayer(layer, `
    <span name="${value.name}" oncontextmenu="removeLayer('${layer.options.key}', '${value.name}', '${value.pmtiles.size}'); L.DomEvent.disableClickPropagation(this); return false;" style="user-select: none;"> ${value.name.replace(/_/g, " ")}</span>
  `);
  controls.layerCtrl.addTo(map);
}

function removeLayer(key, name, size) {
  Swal.fire({
    icon: "question",
    html: `Permanantly delete the <strong>${name}</strong> map from your device? This will free up ${formatSize(size)} of storage.`,
    showConfirmButton: true,
    confirmButtonText: "Delete",
    confirmButtonColor: "#d33",
    showCancelButton: true,
    showCloseButton: true,
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      let layer = layers[key];
      mapStore.removeItem(key).then(function () {
        controls.layerCtrl.removeLayer(layer);
        delete layers[key];
        localStorage.removeItem("map");
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
          controls.layerCtrl.expand();
        }
      });
    }
  });
}

function addVectorLayer(file, name) {
  const reader = new FileReader();
  reader.onload = (e) => {
    let geojson = JSON.parse(reader.result);
    name = geojson.name ? geojson.name : name;
    let radius = 4;

    const layer = L.geoJSON(geojson, {
      bubblingMouseEvents: false,
      renderer: L.canvas({
        padding: 0.5,
        tolerance: 10
      }),
      style: (feature) => {
        return {
          color: feature.properties.hasOwnProperty("stroke") ? feature.properties["stroke"] : feature.properties["marker-color"] ? feature.properties["marker-color"] : feature.geometry.type == "Point" ? "#ffffff" : "#ff0000",
          opacity: feature.properties.hasOwnProperty("stroke-opacity") ? feature.properties["stroke-opacity"] : 1.0,
          weight: feature.properties.hasOwnProperty("stroke-width") ? feature.properties["stroke-width"] : feature.geometry.type == "Point" ? 1.5 : 3,
          fillColor: feature.properties.hasOwnProperty("fill") ? feature.properties["fill"] : feature.properties["marker-color"] ? feature.properties["marker-color"] : "#ff0000",
          fillOpacity: feature.properties.hasOwnProperty("fill-opacity") ? feature.properties["fill-opacity"] : feature.geometry.type != "Point" ? 0.2 : feature.geometry.type == "Point" ? 1 : "",
        };
      },
      pointToLayer: (feature, latlng) => {
        const size = feature.properties.hasOwnProperty("marker-size") ? feature.properties["marker-size"] : "medium";
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
      onEachFeature: (feature, layer) => {
        let table = "<div style='overflow:auto;'><table>";
        const hiddenProps = ["styleUrl", "styleHash", "styleMapHash", "stroke", "stroke-opacity", "stroke-width", "opacity", "fill", "fill-opacity", "icon", "scale", "coordTimes", "marker-size", "marker-color", "marker-symbol"];
        for (const key in feature.properties) {
          if (feature.properties.hasOwnProperty(key) && hiddenProps.indexOf(key) == -1) {
            table += `<tr><th>${key.toUpperCase()}</th><td>${formatProperty(feature.properties[key])}</td></tr>`;
          }
        }
        table += "</table></div>";
        layer.bindPopup(table, {
          autoPanPadding: [15, 15],
          maxHeight: 300,
          maxWidth: 250
        });
      }
    });

    controls.layerCtrl.addOverlay(layer, name);
    map.addLayer(layer);
    map.fitBounds(layer.getBounds());
    hideLoader();
  }

  function formatProperty(value) {
    if (typeof value == "string" && value.startsWith("http")) {
      return `<a href="${value}" target="_blank">${value}</a>`;
    } else {
      return value;
    }
  }

  reader.readAsText(file);
}

function showLoader() {
  document.getElementById("progress-bar").style.display = "block";
}

function hideLoader() {
  document.getElementById("progress-bar").style.display = "none";
}

function showInfo() {
  Swal.fire({
    customClass: {
      icon: "info-icon",
      title: "info-title"
    },
    iconHtml: "<img src='assets/img/87.png'>",
    title: "gpsmap.app",
    html: `
      A simple, offline capable map viewer with GPS integration. <a href='javascript: showCredits();'>Open Source Credits</a>
      <p>Version: <b>${app.version}</b></p>
      <p>
        <form>
          <input type="checkbox" id="wakelockCheckbox" ${wakeLock ? "checked" : ""}>
          <label for="wakelockCheckbox"> Keep Screen Awake</label><br>
        </form>
      </p>
    `,
    didOpen: () => {
      const checkbox = document.getElementById("wakelockCheckbox");
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          acquireLock();
        } else {
          releaseLock();
        }
      });
    },
    // preConfirm: () => {
    //   const checkbox = document.getElementById("wakelockCheckbox");
    //   checkboxState = checkbox.checked;
    // },
    showCloseButton: true,
    showConfirmButton: true,
    confirmButtonText: "Import Map",
    confirmButtonColor: "#3085d6",
    cancelButtonText: "Learn More",
    showCancelButton: true,
    reverseButtons: true,
    footer: `<span style='font-size:smaller;'><i>Maps made available through this app are provided for informational and planning purposes only. Not responsible for the misuse or misrepresentation of any maps or this app.</i></span>`
  }).then((result) => {
    if (result.isConfirmed) {
      fileInput.click();
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      window.open("https://github.com/bmcbride/gps-map", "_blank");
    }
  });
}

function showCredits() {
  Swal.fire({
    showCloseButton: true,
    showConfirmButton: false,
    title: "Open Source Credits",
    html: `<a href='https://leafletjs.com/' target='_blank'>Leaflet JS</a><br>
          <a href='https://github.com/domoritz/leaflet-locatecontrol' target='_blank'>Leaflet Locate</a><br>
          <a href='https://docs.protomaps.com/pmtiles/' target='_blank'>Protomaps PMTiles</a><br>
          <a href='https://localforage.github.io/localForage/' target='_blank'>localForage</a><br>
          <a href='https://github.com/GoogleChrome/workbox/' target='_blank'>Workbox</a><br>
          <a href='https://sweetalert2.github.io/' target='_blank'>sweetalert2</a><br>
          <a href='https://icomoon.io/' target='_blank'>IcoMoon Icons</a><br>
          <a href='https://www.flaticon.com/free-icons/route' title="route icons">Route icons created by redempticon - Flaticon</a>`
  });
}

function formatSize(bytes) {
  let size = bytes / 1000;
  if (size > 1000) {
    size = `${(size/1000).toFixed(1)} MB`;
  } else {
    size = `${size.toFixed(1)} KB`;
  }
  return size;
}

const dropArea = document.getElementById("map");

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, false);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, showLoader, false);
});

["dragleave", "drop"].forEach(eventName => {
  dropArea.addEventListener(eventName, hideLoader, false);
});

dropArea.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  handleFile(file);
}, false);

function acquireLock() {
  navigator.wakeLock.request("screen").then((wakeLockSentinel) => {
    // Store the resolved WakeLockSentinel object
    wakeLock = wakeLockSentinel;
    // alert("Screen Wake Lock acquired");
  }).catch((err) => {
    console.error(`${err.name}: ${err.message}`);
    // alert("error");
  });
}

// To release the lock later
function releaseLock() {
  if (wakeLock !== null) {
    wakeLock.release().then(() => {
      wakeLock = null;
      // alert("Screen Wake Lock released");
    });
  }
}

// if (navigator.maxTouchPoints > 1) {
//   acquireLock();
//   document.addEventListener("visibilitychange", () => {
//     if (wakeLock !== null && document.visibilityState === "visible") {
//       acquireLock();
//     }
//   });
// }