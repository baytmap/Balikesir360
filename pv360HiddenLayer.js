// --- global değişkenler panorama navigator için ---
let geojsonData = [];
let panoramas = [];
let currentIndex = -1;
let viewer;
let geojsonLayer;
const groupLoadStatus = {};
const dynamicLayers = [];


// İlçe bazlı config’ler (boylam=x, enlem=y)
const districtConfigs = [
  {
    name: "Merkez-1",
    group: "Balıkesir(Merkez)",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-bal%C4%B1kesir-1.geojson.gz",
    extent: {
      xmin: 27.77,
      ymin: 39.58,
      xmax: 27.90,
      ymax: 39.68
    }
  },
  {
    name: "Merkez-2",
    group: "Balıkesir(Merkez)",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-bal%C4%B1kesir-2.geojson.gz",
    extent: {
      xmin: 27.80,
      ymin: 39.58,
      xmax: 27.90,
      ymax: 39.68
    }
  },
  {
    name: "Merkez-3",
    group: "Balıkesir(Merkez)",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-bal%C4%B1kesir-3.geojson.gz",
    extent: {
      xmin: 27.83,
      ymin: 39.58,
      xmax: 27.90,
      ymax: 39.68
    }
  },
  {
    name: "Merkez-4",
    group: "Balıkesir(Merkez)",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-bal%C4%B1kesir-4.geojson.gz",
    extent: {
      xmin: 27.86,
      ymin: 39.58,
      xmax: 27.90,
      ymax: 39.68
    }
  },
  {
    name: "Manyas",
    group: "Manyas",
    url: "https://d2fqadmv75s1ip.cloudfront.net/manyas360_1.geojson.gz",
    extent: {
      xmin: 27.91,
      ymin: 39.48,
      xmax: 28.05,
      ymax: 40.32
    }
  },
  {
    name: "Şamlı_Kocaavşar",
    group: "Şamlı_Kocaavşar",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-şamlı-kocaavşar.geojson.gz",
    extent: {
      xmin: 27.50,
      ymin: 39.45,
      xmax: 27.85,
      ymax: 39.80
    }
  },
  {
    name: "Erdek",
    group: "Erdek",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-Erdek.geojson.gz",
    extent: {
      xmin: 27.73,
      ymin: 40.33,
      xmax: 27.87,
      ymax: 40.47
    }
  },
  {
    name: "Gönen",
    group: "Gönen",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-Gönen.geojson.gz",
    extent: {
      xmin: 27.58,
      ymin: 40.03,
      xmax: 27.72,
      ymax: 40.17
    }
  },
  {
    name: "Erdek_Ocaklar_Narlı",
    group: "Erdek_Narlı",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-points-erdek-narli.geojson.gz",
    extent: {
      xmin: 27.71,
      ymin: 40.305,
      xmax: 27.85,
      ymax: 40.445
    }
  },
  {
    name: "Edremit-1",
    group: "Edremit",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-edremit-1.geojson.gz",
    extent: {
      xmin: 26.96,
      ymin: 39.52,
      xmax: 27.0267,
      ymax: 39.66
    }
  },
  {
    name: "Edremit-2",
    group: "Edremit",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-edremit-2.geojson.gz",
    extent: {
      xmin: 27.0067,
      ymin: 39.52,
      xmax: 27.0534,
      ymax: 39.66
    }
  },
  {
    name: "Edremit-3",
    group: "Edremit",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-edremit-3.geojson.gz",
    extent: {
      xmin: 27.01,
      ymin: 39.52,
      xmax: 27.07,
      ymax: 39.66
    }
  },

  {
    name: "Bandirma-1",
    group: "Bandırma",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-band%C4%B1rma-1.geojson.gz",
    extent: {
      xmin: 27.90,
      ymin: 40.2,
      xmax: 27.9767,
      ymax: 40.8
    }
  },
  {
    name: "Bandirma-2",
    group: "Bandırma",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-band%C4%B1rma-2.geojson.gz",
    extent: {
      xmin: 27.9167,
      ymin: 40.2,
      xmax: 27.9834,
      ymax: 40.8
    }
  },
  {
    name: "Bandirma-3",
    group: "Bandırma",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-band%C4%B1rma-3.geojson.gz",
    extent: {
      xmin: 27.9234,
      ymin: 40.2,
      xmax: 27.99,
      ymax: 40.8
    }
  }
  ,
  {
    name: "Burhaniye-1",
    group: "Burhaniye",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-burhaniye-1.geojson.gz",
    extent: {
      xmin: 26.95,
      ymin: 39.43,
      xmax: 27.015,
      ymax: 39.57
    }
  },
  {
    name: "Burhaniye-2",
    group: "Burhaniye",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-burhaniye-2.geojson.gz",
    extent: {
      xmin: 26.95,
      ymin: 39.43,
      xmax: 27.03,
      ymax: 39.57
    }
  },
  {
    name: "Burhaniye-3",
    group: "Burhaniye",
    url: "https://d2fqadmv75s1ip.cloudfront.net/clear-burhaniye-3.geojson.gz",
    extent: {
      xmin: 26.96,
      ymin: 39.43,
      xmax: 27.05,
      ymax: 39.57
    }
  }

];


const loadedDistricts = new Set();

// tıklama handler’ında da referans edeceğimiz array
const districtLayers = [];

// --- coğrafi komşu mantığı için eklenecekler ---
const maxDistance = 100; // metre cinsinden eşik
/**
 * Haversine formülü ile iki koordinat arasındaki mesafeyi metre cinsinden hesaplar
 * @param {[number, number]} coord1 [lon, lat]
 * @param {[number, number]} coord2 [lon, lat]
 * @returns {number} Mesafe (metre)
 */
function getDistance(coord1, coord2) {
  const toRad = deg => deg * Math.PI / 180;
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const R = 6371000; // Dünya yarıçapı
  return R * c;
}
const forceReversedIds = new Set();

function getAngleDifference(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

// function isReversedSmart(base, yaw) {
//   const angleDiff = getAngleDifference(yaw, base);
//   if (angleDiff < 150 || angleDiff > 210) return false;

//   // const finalAngle = normalizeAngle(base + yaw + 180);
//   const finalAngle = normalizeAngle(base + yaw);
//   base = normalizeAngle(base);

//   if (base >= 0 && base < 90) {
//     return finalAngle > 180 && finalAngle < 330;
//   }
//   if (base >= 90 && base < 180) {
//     return finalAngle > 270 || finalAngle < 60;
//   }
//   if (base >= 180 && base < 270) {
//     return finalAngle > 0 && finalAngle < 120;
//   }
//   if (base >= 270 && base < 360) {
//     return finalAngle > 90 && finalAngle < 240;
//   }

//   return false;
// }

function isReversedSmart(base, yaw) {
  const angleDiff = getAngleDifference(yaw, base);
  if (angleDiff < 150 || angleDiff > 210) return false;

  const realAngle = normalizeAngle(base + yaw);
  const expectedReverse = normalizeAngle(base + 180);
  const tolerance = 45;

  const lower = normalizeAngle(expectedReverse - tolerance);
  const upper = normalizeAngle(expectedReverse + tolerance);

  if (lower < upper) {
    return realAngle >= lower && realAngle <= upper;
  } else {
    return realAngle >= lower || realAngle <= upper;
  }
}


// gerekli modülleri yükle
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/widgets/Editor",
  "esri/Graphic",
  "esri/layers/FeatureLayer",


  "esri/renderers/SimpleRenderer",

  "esri/layers/GraphicsLayer",
  "esri/symbols/SimpleMarkerSymbol",

  "esri/layers/VectorTileLayer",
  "esri/layers/GeoJSONLayer",
  "esri/layers/GroupLayer",
  "esri/widgets/Search",
  "esri/widgets/Locate",
  "esri/widgets/LayerList",
  "esri/widgets/BasemapGallery",
  "esri/widgets/DistanceMeasurement2D",
  "esri/widgets/AreaMeasurement2D",
  "esri/widgets/Expand",
  "esri/widgets/Legend",
  "esri/geometry/Extent"
], (
  Map,
  MapView,
  Editor,
  Graphic,
  FeatureLayer,

  SimpleRenderer,
  GraphicsLayer,
  SimpleMarkerSymbol,

  VectorTileLayer,
  GeoJSONLayer,
  GroupLayer,
  Search,
  Locate,
  LayerList,
  BasemapGallery,
  DistanceMeasurement2D,
  AreaMeasurement2D,
  Expand,
  Legend,
  Extent,
) => {


  // --- 1) URL’den lat/lon/zoom al ---

  const params = new URLSearchParams(window.location.search);
  const lat = parseFloat(params.get("lat"));
  const lon = parseFloat(params.get("lon"));
  const zoomParam = parseFloat(params.get("zoom"));
  const defaultCenter = [27.8900609117342, 39.648691275617296];
  const defaultZoom = 12;
  const center = (!isNaN(lon) && !isNaN(lat)) ? [lon, lat] : defaultCenter;
  const zoom = !isNaN(zoomParam) ? zoomParam : defaultZoom;

  // --- 2) Map ve View oluştur ---

  const map = new Map({ basemap: "hybrid" });
  const view = new MapView({
    container: "viewDiv",
    map,
    center,
    zoom,
    constraints: { snapToZoom: false }
  });
  view.popup.autoOpenEnabled = false;
  window.view = view;

  // // 1. Sadece legend için, harita ve listeleri etkilemeyecek gizli layer
  // const legendOnlyLayer = new GraphicsLayer({
  //   title: "Kontrol Noktası",
  //   listMode: "hide",     // LayerList ve Editor'de gözükmesin
  //   visible: false,       // Haritada görünmesin
  //   legendEnabled: true   // Legend widget’ında yer alsın
  // });

  // // Üzerine bir dummy grafik ekliyoruz (haritaya çizmez)
  // const symbol = new SimpleMarkerSymbol({
  //   style: "circle",
  //   size: 12,
  //   color: "yellow",
  //   outline: { color: "black", width: 1 }
  // });
  // legendOnlyLayer.add(new Graphic({ symbol }));

  // // Map’e ekle
  // map.add(legendOnlyLayer);

  // 1. Sadece legend için gizli FeatureLayer
  const legendOnlyLayer = new FeatureLayer({
    source: [
      {
        geometry: {
          type: "point",
          longitude: 0,
          latitude: 0
        },
        attributes: {
          objectId: 1
        }
      }
    ],
    objectIdField: "objectId",
    geometryType: "point",
    spatialReference: view.spatialReference,  // view oluşturulduktan sonra
    title: "PV360",
    renderer: new SimpleRenderer({
      symbol: new SimpleMarkerSymbol({
        style: "circle",
        size: 8,
        color: "red",
        outline: { color: "white", width: 1 }
      })
    }),
    listMode: "hide",       // LayerList ve Editor’de gözükmesin
    visible: false,         // Haritada görünmesin
    legendEnabled: true     // Legend widget’ında yer alsın
  });
  map.add(legendOnlyLayer);



  const pv360GroupLayer = new GroupLayer({
    title: "PV360",
    visibilityMode: "independent",
    listMode: "show",
  });
  map.add(pv360GroupLayer);


  // —————— 3) İlçe yükleme(lazy load) fonksiyonu ——————

  // --- 3) İlçe Yükleme Fonksiyonu ---

  function tryLoadDistrict(cfg) {
    if (loadedDistricts.has(cfg.name)) return;

    const lon = view.center.longitude;
    const lat = view.center.latitude;

    if (
      lon < cfg.extent.xmin ||
      lon > cfg.extent.xmax ||
      lat < cfg.extent.ymin ||
      lat > cfg.extent.ymax
    ) return;

    const startTime = Date.now();
    // console.log(`⏳ Yükleniyor: ${cfg.name}`);

    const groupName = cfg.group || cfg.name;
    if (!groupLoadStatus[groupName]) {
      groupLoadStatus[groupName] = new Set();
      // İlk yüklemeye BAŞLANDIĞINDA göster
      loadingMsg.innerText = `${groupName} bölgesi yükleniyor. Lütfen bekleyiniz...`;
      loadingMsg.style.display = "block";
    }

    const layer = new GeoJSONLayer({
      url: cfg.url,
      title: cfg.name,
      objectIdField: "objectId",
      outFields: ["*"],
      listMode: "hide",
      legendEnabled: false,
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-marker",
          style: "circle",
          size: "10px",
          color: [255, 0, 0, 0.8],
          outline: { color: [255, 255, 255], width: 1 }
        }
      }
    });

    pv360GroupLayer.add(layer);
    districtLayers.push(layer);
    loadedDistricts.add(cfg.name);

    layer.load()
      .then(() => layer.queryFeatures({
        where: "1=1",
        outFields: ["*"],
        returnGeometry: true
      }))
      .then(fs => {
        geojsonData.push(...fs.features);
        panoramas = geojsonData.map(f => ({
          id: f.attributes.objectId,
          coords: [f.geometry.longitude, f.geometry.latitude],
          url: f.attributes.path,
          filename: f.attributes.filename,
          plate: f.attributes.plate
        }));

        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
       // console.log(`✅ ${cfg.name} tamamlandı, pano: ${fs.features.length}, süre: ${elapsedSec} s`);

        // --- Grup bazlı yükleniyor mesajı ---
        const groupName = cfg.group || cfg.name;
        if (!groupLoadStatus[groupName]) {
          groupLoadStatus[groupName] = new Set();

          // Tek parçalı grupsa da ilk yüklemede mesajı göster
          loadingMsg.innerText = `${groupName} bölgesi yükleniyor. Lütfen bekleyiniz...`;
          loadingMsg.style.display = "block";

        }
        groupLoadStatus[groupName].add(cfg.name);

        const totalInGroup = districtConfigs.filter(d => d.group === groupName).length;
        const loadedInGroup = groupLoadStatus[groupName].size;

        if (loadedInGroup >= totalInGroup) {
          loadingMsg.style.display = "none";
         // console.log(`🎉 ${groupName} bölgesi tamamlandı.`);
        }
      })
      .catch(err => {
        console.error(`❌ ${cfg.name} yüklenirken hata:`, err);
      });
  }


  // --- 4) Başlangıçta Merkez, Sonra Pan/Zoom ile Diğerleri ---

  const loadingMsg = document.getElementById("loadingMsg");
  loadingMsg.style.display = "block";

  view.when(() => {
    // Lejant için temsili bir layer oluştur
    // const legendDummyLayer = new FeatureLayer({
    //   source: [
    //     {
    //       geometry: {
    //         type: "point",
    //         longitude: 27.89,
    //         latitude: 39.648
    //       },
    //       attributes: {
    //         objectId: 1
    //       }
    //     }
    //   ],
    //   objectIdField: "objectId",
    //   geometryType: "point",
    //   spatialReference: { wkid: 4326 },
    //   title: "PV360",
    //   renderer: {
    //     type: "simple",
    //     symbol: {
    //       type: "simple-marker",
    //       style: "circle",
    //       size: "10px",
    //       color: [255, 0, 0, 0.8],
    //       outline: { color: [255, 255, 255], width: 1 }
    //     }
    //   },
    //   legendEnabled: true,
    //   listMode: "hide" // sadece lejantta görünür
    // });
    // map.add(legendDummyLayer);
    // 4.1) İlk açılışta sadece Merkez’i yükle
    districtConfigs
      .filter(cfg => cfg.name.startsWith("Merkez"))
      .forEach(cfg => tryLoadDistrict(cfg));

    // 4.2) Harita durgunlaştığında (pan/zoom bittiğinde) diğer ilçeleri denetle
    const watcher = view.watch("stationary", isIdle => {
      if (!isIdle) return;

      // Tüm ilçeler üzerinden geç, uygun olanları yükle
      districtConfigs.forEach(cfg => tryLoadDistrict(cfg));

      // Eğer tüm ilçeler yüklendiyse izlemeyi durdur
      if (loadedDistricts.size === districtConfigs.length) {
        watcher.remove();
        //console.log("Tüm ilçeler yüklendi, watcher kapatıldı.");
      }
    });
  });


  // Split.js ayarları
  Split(["#viewDiv", "#sidePanel"], {
    sizes: [50, 50],
    minSize: [200, 200],
    gutterSize: 8,
    cursor: "col-resize"
  });

  // --- 3) WIDGET’LARI EKLE ---

  // 3.1 Uzunluk Ölçme Widget'ı
  const distWidget = new DistanceMeasurement2D({
    view
  });
  const distExpand = new Expand({
    view,
    content: distWidget,
    expandIconClass: "esri-icon-measure-line",
    expanded: false,
    expandTooltip: "Uzunluk Ölç",
    collapseTooltip: "Gizle"
  });
  // view.ui.add(distExpand, {
  //   position: "top-left",
  //   index: 1
  // });

  // 3.2 Alan Ölçme Widget'ı
  const areaWidget = new AreaMeasurement2D({
    view
  });
  const areaExpand = new Expand({
    view,
    content: areaWidget,
    expandIconClass: "esri-icon-measure-area",
    expanded: false,
    expandTooltip: "Alan Ölç",
    collapseTooltip: "Gizle"
  });
  // view.ui.add(areaExpand, {
  //   position: "top-left",
  //   index: 2
  // });

  // 3.3 Lejantları Görüntüleme Widget'ı
  // const legendWidget = new Legend({
  //   view
  // });
  // const legendExpand = new Expand({
  //   view,
  //   content: legendWidget,
  //   expanded: false,
  //   expandTooltip: "Lejantları Göster",
  //   collapseTooltip: "Gizle"
  // });
  // view.ui.add(legendExpand, {
  //   position: "top-left",
  //   index: 3
  // });

  // const legend = new Legend({
  //   view,
  //   // layerInfos: [{
  //   //   layer: legendOnlyLayer,
  //   //   title: "PV360"
  //   // }],
  //   respectLayerVisibility: false  // visible=false olsa bile legend’ta hep göster
  // });

  // const legendExpand = new Expand({
  //   view,
  //   content: legend,
  //   expandIconClass: "esri-icon-legend",
  //   expanded: false
  // });

  // // UI’a ekleyin
  // view.ui.add(legendExpand, { position: "top-left", index: 3 });


  // 3.4 Arama Widget'ı
  const searchWidget = new Search({
    view,
    includeDefaultSources: false,
    allPlaceholder: "Adres veya yer bul",
    sources: [
      {
        url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
        name: "ArcGIS World Geocoding Service",
        singleLineFieldName: "SingleLine",
        placeholder: "Adres veya yer bul"
      },
      {
        url: "https://datumglb.com/arcgis/rest/services/yapi_gecoding/GeocodeServer",
        name: "Balıkesir Yapı Coğrafi Kodlama Servisi",
        singleLineFieldName: "Address",
        outFields: ["*"],
        placeholder: "Bina kimlik no girin",
        countryCode: "TR",
        maxResults: 6,
        suggestionsEnabled: true,
        minSuggestCharacters: 0
      }
    ]
  });
  view.ui.add(searchWidget, {
    position: "top-right",
    index: 0
  });

  // 3.5 Katman Listesi Widget'ı
  const layerList = new LayerList({
    view
  });
  const listExpand = new Expand({
    view,
    content: layerList,
    expandIconClass: "esri-icon-layers",
    expanded: false,
    expandTooltip: "Katmanları Görüntüle",
    collapseTooltip: "Katmanları Gizle"
  });
  view.ui.add(listExpand, {
    position: "top-right",
    index: 1
  });

  // 3.6 Harita Temaları Galerisi Widget'ı
  const bmGallery = new BasemapGallery({ view });
  const galleryExpand = new Expand({
    view,
    content: bmGallery,
    expandIconClass: "esri-icon-basemap",
    expanded: false,
    expandTooltip: "Haritaları Görüntüle",
    collapseTooltip: "Haritaları Gizle"
  });
  // view.ui.add(galleryExpand, {
  //   position: "bottom-right",
  //   index: 0
  // });

  // 3.7 Konum Bulma Widget'ı
  const locateBtn = new Locate({ view });
  // view.ui.add(locateBtn, {
  //   position: "bottom-right",
  //   index: 1
  // });

  // Harita alt-sol “konum” butonuna tıklanınca highlightlı noktayı ortala
  const locationBtn = document.getElementById("location");
  locationBtn.addEventListener("click", () => {
    if (currentIndex < 0) return;
    const { coords } = panoramas[currentIndex];
    view.goTo({ center: coords })
      .catch(err => console.error("GoTo error:", err));
  });

  // EditDiv e editörü render et
  const editContainer = document.getElementById("editDiv");
  const editorWidget = new Editor({
    view: view,
    container: editContainer
  });

  // 3.8 Editör Widget'ı
  const editExpand = new Expand({
    view: view,
    expandIconClass: "esri-icon-edit",
    expanded: false,
    expandTooltip: "Editörü Aç",
    collapseTooltip: "Editörü Kapat"
  });
  // view.ui.add(editExpand, {
  //   position: "top-left",
  //   index: 4
  // });

  // butonun expanded durumuna göre #editDiv’i göster/gizle
  editExpand.watch("expanded", (isExpanded) => {
    editContainer.style.display = isExpanded ? "block" : "none";
  });

// --- 📄 INFO WIDGET EKLE ---
  // const infoButton = document.createElement("div");
  // infoButton.className = "esri-widget esri-widget--button esri-interactive";
  // infoButton.title = "Bilgi PDF’ini Aç";
  // infoButton.style.padding = "8px";
  // infoButton.innerHTML = '<i class="fas fa-info-circle"></i>'; // Font Awesome ikonu (zaten dahil)

  // infoButton.addEventListener("click", () => {
  //   window.open("info.pdf", "_blank");
  // });

  // view.ui.add(infoButton, "top-left");  // Konumu: sol üst (diğer widget’larla aynı)


  view.when(() => {
    view.ui.add(distExpand, { position: "top-left", index: 1 });
    view.ui.add(areaExpand, { position: "top-left", index: 2 });
    // view.ui.add(legendExpand, { position: "top-left", index: 3 });
    view.ui.add(galleryExpand, { position: "bottom-right", index: 0 });
    view.ui.add(locateBtn, { position: "bottom-right", index: 1 });
  });



  // --- 4) URL parametrelerini adres çubuğuna yaz ---

  view.watch(["center", "zoom"], () => {
    const c = view.center; const z = view.zoom.toFixed(2);
    history.replaceState(null, "",
      `${location.origin + location.pathname}?lat=${c.latitude.toFixed(6)}&lon=${c.longitude.toFixed(6)}&zoom=${z}`
    );
  });

  // --- 5) VectorTileLayer'ı ekle ---
  const vtLayer = new VectorTileLayer({
    url: "https://d2fqadmv75s1ip.cloudfront.net/resource0.json",
    title: "PV360",
    listMode: "hide"
  });
  map.add(vtLayer);

  // // --- 6) GeoJSON’u oku, panoramas oluştur ve FeatureLayer ekle ---

  // // yükleme mesajını göster
  // const loadingMsg = document.getElementById("loadingMsg");
  // loadingMsg.style.display = "block";

  // // 6.1) Yüklemek istediğiniz ilçelere ait JSON URL’leri
  // const districtUrls = [
  //   "https://d2fqadmv75s1ip.cloudfront.net/pointsv21.geojson.gz",
  //   "https://d2fqadmv75s1ip.cloudfront.net/pointsv3.geojson.gz",
  //   "https://d2fqadmv75s1ip.cloudfront.net/pointsv4.geojson.gz"
  // ];

  // // 6.2) Her bir URL’den GeoJSONLayer oluştur
  // const districtLayers = districtUrls.map((url, i) => {
  //   return new GeoJSONLayer({
  //     url,
  //     title: `PV360 – İlçe ${i + 1}`,
  //     objectIdField: "objectId",
  //     outFields: ["*"],
  //     renderer: {
  //       type: "simple",
  //       symbol: {
  //         type: "simple-marker",
  //         style: "circle",
  //         size: "10px",
  //         color: [255, 0, 0, 0.8],
  //         outline: { color: [255, 255, 255], width: 1 }
  //       }
  //     }
  //   });
  // });

  // // 6.3) Haritaya ekle ve yükleme promise’lerini topla
  // districtLayers.forEach(layer => map.add(layer));
  // const loadPromises = districtLayers.map(layer => layer.load());

  // // 6.4) Tüm layer’lar yüklendiğinde queryFeatures ile tüm özellikleri al
  // Promise.all(loadPromises)
  //   .then(() => {
  //     return Promise.all(
  //       districtLayers.map(layer =>
  //         layer.queryFeatures({ where: "1=1", outFields: ["*"], returnGeometry: true })
  //       )
  //     );
  //   })
  //   .then(resultsArray => {
  //     // resultsArray: [ FeatureSet1, FeatureSet2, FeatureSet3 ]
  //     const allFeatures = resultsArray.flatMap(r => r.features);
  //     geojsonData = allFeatures;
  //     panoramas = geojsonData.map(f => ({
  //       id: f.attributes.objectId,
  //       coords: [f.geometry.longitude, f.geometry.latitude],
  //       url: f.attributes.path,
  //       filename: f.attributes.filename,
  //       plate: f.attributes.plate
  //     }));
  //     loadingMsg.style.display = "none";
  //   })
  //   .catch(err => {
  //     console.error("GeoJSON yüklenirken hata:", err);
  //     loadingMsg.innerText = "JSON yükleme hatası!";
  //   });

  // 🔍 Her bir feature için attribute key'lerini logla
  // geojsonData.forEach((f, i) => {
  //   if (i < 5) { // çok uzun olmasın diye ilk 5'e sınırla
  //     console.log(`Feature[${i}] attribute keys:`, Object.keys(f.attributes));
  //   }
  // });

  // urls360.txt'den FeatureLayer'ları yükle ve ekle
  fetch("urls360.txt")
    .then(r => {
      if (!r.ok) throw new Error("urls360.txt bulunamadı");
      return r.text();
    })
    .then(text => {
      const urls = text
        .split("\n")
        .map(u => u.trim())
        .filter(Boolean);

      if (urls.length === 0) {
        const editDiv = document.getElementById("editDiv");
        editDiv.innerHTML = `<p style="padding: 20px; color: red; font-weight: bold;">Üzerinde çalışılabilecek bir servis bulunamadı.</p>`;
        return;
      }
      // Dinamik katmanları yükle ve diziye at
      urls.forEach(url => {
        const layer = new FeatureLayer({
          url,
          outFields: ["*"],
          legendEnabled: true,
          listMode: "show"
        });
        map.add(layer);
        dynamicLayers.push(layer);
      });

      // 2) LEGEND OLUŞTURMA
      const legendInfos = [
        // önce tüm dynamic layers
        ...dynamicLayers.map(l => ({ layer: l, title: l.title })),
        // sonra gizli kontrol katmanı
        { layer: legendOnlyLayer, title: legendOnlyLayer.title }
      ];

      const legend = new Legend({
        view,
        layerInfos: legendInfos,
        respectLayerVisibility: false
      });

      const legendExpand = new Expand({
        view,
        content: legend,
        expandIconClass: "esri-icon-legend",
        expanded: false
      });

      view.ui.add(legendExpand, { position: "top-left", index: 3 });
      view.ui.add(editExpand, { position: "top-left", index: 4 });
    })
    .catch(err => {
      console.error("urls360.txt yüklenirken hata oluştu:", err);
      const editDiv = document.getElementById("editDiv");
      editDiv.innerHTML = `<p style="padding: 20px; color: red; font-weight: bold;">FeatureLayer servisleri yüklenemedi.</p>`;
      // map.add(new FeatureLayer({ url: defaultFeatureLayerUrl, outFields: ["*"] }));
    });



  // // --- 7) Harita tıklama => panorama ---

  let highlight;
  view.on("click", async evt => {
    try {
      if (!districtLayers.length || !geojsonData.length) {
        console.warn("⛔ Henüz layer ya da veri yok.");
        return;
      }
      const hitResults = await view.hitTest(evt);
      //console.log("🔎 HitTest:", hitResults);

      const hit = hitResults.results.find(r =>
        r.graphic?.layer && districtLayers.includes(r.graphic.layer)
      );
      if (!hit) {
        console.warn("🚫 Nokta tıklanmadı.");
        return;
      }

      const oid = hit.graphic.attributes.objectId;
      // console.log("🎯 objectId:", oid);

      const idx = panoramas.findIndex(p => p.id === oid);
      if (idx < 0) {
        console.warn("🚫 Bu objectId bulunamadı:", oid);
        return;
      }

      //console.log("📸 Panorama açılıyor. Index:", idx);
      showPanoramaByIndex(idx);
    } catch (err) {
      console.error("❌ Tıklama işlenirken hata:", err);
    }
  });



  // --- 8) Panorama görüntüleme, yön okları ve marker işlemleri ---
  let markerGraphic = null;
  let yawWatcherHandle = null;
  let hasLookMarker = false;

  async function showPanoramaByIndex(idx) {
    if (idx < 0 || idx >= panoramas.length) return;
    currentIndex = idx;

    // a) Önceki viewer ve sadece yön marker temizliği
    viewer?.destroy();
    if (yawWatcherHandle) {
      clearInterval(yawWatcherHandle);
      yawWatcherHandle = null;
    }

    if (markerGraphic) {
      view.graphics.remove(markerGraphic);
      markerGraphic = null;
    }

    // b) Yeni panoramayı yükle
    const pano = panoramas[idx];
    viewer = pannellum.viewer("sidePanel", {
      type: "equirectangular",
      panorama: pano.url,
      autoLoad: true
    });

    // c) Viewer yüklendikten sonra yönü bul
    viewer.on("load", () => {
      const current = panoramas[idx];
      const previous = panoramas[idx - 1];
      const next = panoramas[idx + 1];

      if (previous && next) {
        const baseAngle = direction_lookup(
          next.coords[0], current.coords[0],
          next.coords[1], current.coords[1],
          previous.coords[0], previous.coords[1]
        );

        startYawWatcher(baseAngle, current.coords[0], current.coords[1]);
      }
    });

    // pano döndükçe marker açısını güncelle
    // if (!viewer.hasYawListener) {
    //   viewer.on("mousedown", () => {
    //     const yaw = viewer.getYaw();
    //     updateMarkerWithYaw(current.coords[0], current.coords[1], baseAngle, yaw);
    //   });
    //   viewer.hasYawListener = true;
    // }

    // function startYawWatcher(baseAngle, lon, lat) {
    //   let lastYaw = null;

    //   function checkYaw() {
    //     if (!viewer) return;
    //     const yaw = viewer.getYaw();
    //     if (lastYaw === null || Math.abs(yaw - lastYaw) > 1) {
    //       lastYaw = yaw;
    //       updateMarkerWithYaw(lon, lat, baseAngle, yaw);
    //     }
    //     requestAnimationFrame(checkYaw);
    //   }


    //   requestAnimationFrame(checkYaw);
    // }

    function startYawWatcher(baseAngle, lon, lat) {
      let lastYaw = null;

      function checkYaw() {
        if (!viewer) return;

        const yawOffset = normalizeAngle(viewer.getYaw());
        if (lastYaw === null || Math.abs(yawOffset - lastYaw) > 1) {
          lastYaw = yawOffset;

          const pano = panoramas[currentIndex];
          const panoId = pano.id;

          const base = normalizeAngle(baseAngle);
          const yaw = normalizeAngle(yawOffset);
          const angleDiff = getAngleDifference(yaw, base);

          const finalAngleCandidate1 = normalizeAngle(base + yaw);
          const finalAngleCandidate2 = normalizeAngle(base + yaw + 180);

          let isReversed = false;

          if (forceReversedIds.has(panoId)) {
            isReversed = true;
          } else {
            // Smart kontrol
            const smartReverse = isReversedSmart(base, yaw);
            if (smartReverse) {
              isReversed = true;
              forceReversedIds.add(panoId);
            }

          }

          // const finalAngle = isReversed ? finalAngleCandidate2 : finalAngleCandidate1;
          const finalAngle = finalAngleCandidate1; // her zaman düz varsayılıyor


          updateMarkerWithYaw(lon, lat, base, yaw, isReversed);

          // console.log("📸 pano:", pano.filename);
          // console.log("    yaw:", yaw.toFixed(2));
          // console.log("    base:", base.toFixed(2));
          // console.log("    angleDiff:", angleDiff.toFixed(2));
          // console.log("    finalAngle:", finalAngle.toFixed(2));
          // console.log("    smartReverse?:", isReversedSmart(base, yaw, finalAngleCandidate2));
          // console.log("    isReversed:", isReversed);

        }

        requestAnimationFrame(checkYaw);
      }

      requestAnimationFrame(checkYaw);
    }


    function updateMarkerWithYaw(lon, lat, baseAngle, yaw, isReversed) {
      // const finalAngle = isReversed
      //   ? normalizeAngle(baseAngle + yaw + 180)
      //   : normalizeAngle(baseAngle + yaw);

      const finalAngle = normalizeAngle(baseAngle + yaw);

      const markerPoint = {
        type: "point",
        longitude: lon,
        latitude: lat
      };

      const markerSymbol = {
        type: "picture-marker",
        url: "look1.png",
        width: "60px",
        height: "90px",
        angle: finalAngle
      };

      if (!markerGraphic) {
        markerGraphic = new Graphic({
          geometry: markerPoint,
          symbol: markerSymbol
        });
        view.graphics.add(markerGraphic);
      } else {
        markerGraphic.geometry = markerPoint;
        markerGraphic.symbol = markerSymbol;
      }
    }




    //Highlight (VectorTileLayer’da doğrudan highlight yok, bu yüzden point grafikle gösteriyoruz)
    const { coords } = panoramas[currentIndex];

    if (!markerGraphic) {
      markerGraphic = new Graphic({
        geometry: {
          type: "point",
          longitude: coords[0],
          latitude: coords[1]
        },
        symbol: {
          type: "simple-marker",
          color: [255, 0, 0, 0.8],
          size: "10px",
          outline: {
            color: [0, 255, 255, 1],
            width: 1
          }
        }
      });
      view.graphics.add(markerGraphic);
    } else {
      markerGraphic.geometry = {
        type: "point",
        longitude: coords[0],
        latitude: coords[1]
      };
      markerGraphic.symbol.color = [255, 255, 0, 0.8];  // opsiyonel
      markerGraphic.symbol.size = "12px";              // opsiyonel
      view.graphics.refresh();
    }


    // d) Haritayı işaretli noktaya kaydır
    view.goTo({ center: pano.coords });

    // e) Nav oklarını ekle
    addNavArrows();

    // f) SidePanel'e tıklanınca marker ve yaw takibini başlat
    // const panel = document.getElementById("sidePanel");
    // function onFirstPanelClick() {
    //   const initialYaw = viewer.getYaw();
    //   //updateOrientedMarker(pano.id, initialYaw);
    //   yawWatcherHandle = setInterval(() => {
    //     //updateOrientedMarker(pano.id, viewer.getYaw());
    //   }, 1000);
    //   panel.removeEventListener("click", onFirstPanelClick);
    // }
    // panel.addEventListener("click", onFirstPanelClick);

    // g) Marker başlat 
    const id = pano.id;
    let markerStarted = false;
    let initialYaw = 0;

    // h) Normalize fonksiyonu
    function normalizeAngle(angle) {
      return ((angle % 360) + 360) % 360;
    }

    function direction_lookup(destX, origX, destY, origY, x3, y3) {
      const deltaX = destX - origX;
      const deltaY = destY - origY;

      const degrees_temp = (Math.atan2(deltaX, deltaY) * 180) / Math.PI;
      const degrees_final = degrees_temp < 0 ? 360 + degrees_temp : degrees_temp;

      //console.log("Marker açısı (baseAngle):", degrees_final);
      return degrees_final; // dikkat! artık sadece açı döndürüyor
    }
  }

  // Navigasyon oklarını ekler: mevcut noktaya en yakın komşuyu bulup yönlendirir.
  // Eğer 100 m eşiği aşılıyorsa “Görüntü sonu” uyarısı gösterir.
  function addNavArrows() {
    const panel = document.getElementById("sidePanel");
    panel.querySelectorAll(".nav-arrow").forEach(el => el.remove());

    const current = panoramas[currentIndex];
    const visibleDirections = new Set(); // ← sadece gerçekten yön sunulanları tutar

    // ← Geri (önceki pano)
    if (currentIndex > 0) {
      const back = panoramas[currentIndex - 1];
      const backDist = getDistance(current.coords, back.coords);
      //console.log(`← Geri mesafe: ${backDist.toFixed(2)} m`);
      if (backDist <= maxDistance) {
        const left = document.createElement("div");
        left.className = "nav-arrow arrow-left";
        left.addEventListener("click", e => {
          e.stopPropagation();
          showPanoramaByIndex(currentIndex - 1);
        });
        panel.appendChild(left);
        visibleDirections.add("left");
      }
    }

    // → İleri (sonraki pano)
    if (currentIndex < panoramas.length - 1) {
      const next = panoramas[currentIndex + 1];
      const nextDist = getDistance(current.coords, next.coords);
      // console.log(`→ İleri mesafe: ${nextDist.toFixed(2)} m`);
      if (nextDist <= maxDistance) {
        const right = document.createElement("div");
        right.className = "nav-arrow arrow-right";
        right.addEventListener("click", e => {
          e.stopPropagation();
          showPanoramaByIndex(currentIndex + 1);
        });
        panel.appendChild(right);
        visibleDirections.add("right");
      }
    }

    // ↠ Coğrafi (diğer yönlerle aynı hedefse eklenmesin)
    const neighbors = panoramas
      .filter((p, idx) => idx !== currentIndex)
      .map((p, idx) => ({
        idx,
        dist: getDistance(current.coords, p.coords)
      }))
      .filter(n => n.dist > 0 && n.dist <= maxDistance)
      .sort((a, b) => a.dist - b.dist);

    if (neighbors.length > 0) {
      const nearest = neighbors[0];
      const targetIdx = nearest.idx;

      if (
        targetIdx !== currentIndex &&
        targetIdx !== currentIndex - 1 &&
        targetIdx !== currentIndex + 1
      ) {
        const geoArrow = document.createElement("div");
        geoArrow.className = "nav-arrow arrow-next";
        geoArrow.title = `En yakın komşu: ${nearest.dist.toFixed(1)} m`;
        geoArrow.addEventListener("click", e => {
          e.stopPropagation();
          showPanoramaByIndex(targetIdx);
        });
        panel.appendChild(geoArrow);
        visibleDirections.add("geo");
      }
    }

    // --- ALERT MANTIĞINI YÖNE GÖRE GÜNCELLE ---
    const hasLeft = visibleDirections.has("left");
    const hasRight = visibleDirections.has("right");
    const hasGeo = visibleDirections.has("geo");

    const navCount = (hasLeft ? 1 : 0) + (hasRight ? 1 : 0);
    //console.log("📍 Aktif pano indexi (currentIndex):", currentIndex);
    // console.log("🔍 Yönler:", {
    //   hasLeft,
    //   hasRight,
    //   hasGeo,
    //   navCount
    // });

    if (hasGeo) {
      const current = panoramas[currentIndex];

      const geoNeighbor = panoramas
        .filter((p, idx) => idx !== currentIndex)
        .map((p, idx) => ({
          idx,
          dist: getDistance(current.coords, p.coords)
        }))
        .filter(n => n.dist > 0)
        .sort((a, b) => a.dist - b.dist)[0];

      if (geoNeighbor) {
        // console.log(`📏 Coğrafi komşu mesafesi: ${geoNeighbor.dist.toFixed(2)} m (idx: ${geoNeighbor.idx})`);

        if (geoNeighbor.dist > maxDistance) {
          console.warn("⚠️ Geo yönü çok uzak (> 100 m), oklar gösterilmeyecek.");
          alert("Görüntü sonu! Harita üzerinden başka bir görüntü noktası seçiniz.");
          return;
        }
      }
    }

    if (navCount === 1) {
      console.warn("⚠️ Tek yönlü pano algılandı.");
      alert("Yol sonu! Bu noktadan yalnızca tek yönde ilerleyebilirsiniz");
    } else if (navCount === 0 && !hasGeo) {
      console.warn("❌ Hiçbir yön algılanmadı.");
      alert("Görüntü sonu! Harita üzerinden başka bir görüntü noktası seçiniz.");
    } else {
      // console.info("✅ Yeterli yön bulundu, alert gösterilmeyecek.");
    }

  }
});

