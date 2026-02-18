// --- global değişkenler panorama navigator için ---
let panoramas = [];
let currentIndex = -1;
let viewer;
let geojsonLayer;
const groupLoadStatus = {};
const dynamicLayers = [];
const yapiLayers = [];
let yawAnimationHandle = null;
let lookMarkerGraphic = null;     // yön oku (look1.png) → updateMarkerWithYaw üretir

// async function fetchAllFeatures(layer) {
//     const startTime = Date.now(); // Başlangıç zamanını al

//     const pageSize = 50000;
//     const allFeatures = [];
//     const seenIds = new Set();
//     let lastObjectId = 0;
//     let keepFetching = true;

//     while (keepFetching) {
//         // console.log(`📦 [${layer.url}] Veri çekiliyor: objectid_1 > ${lastObjectId}`);

//         const { features } = await layer.queryFeatures({
//             where: `objectid_1 = ${oid}`,
//             outFields: ["*"],
//             returnGeometry: true,
//             orderByFields: ["objectid_1"],
//             resultRecordCount: pageSize,
//             cacheBust: true
//         });

//         if (!features || features.length === 0) {
//             console.warn("⛔ Daha fazla feature yok. Döngü sonlandı.");
//             break;
//         }

//         let newCount = 0;

//         for (const f of features) {
//             const oid = f.attributes?.objectid_1;
//             if (oid != null && !seenIds.has(oid)) {
//                 seenIds.add(oid);
//                 allFeatures.push(f);
//                 lastObjectId = Math.max(lastObjectId, oid);
//                 newCount++;
//             }
//         }

//         if (newCount < pageSize) {
//             // console.log("✅ Son sayfa alındı.");
//             keepFetching = false;
//         }
//     }

//     const endTime = Date.now(); // Bitiş zamanını al
//     const elapsedTime = (endTime - startTime) / 1000; // Geçen süreyi saniye olarak hesapla

//     // console.log(`✅ Toplam çekilen benzersiz feature: ${allFeatures.length}`);
//     //console.log(`⏱️ İşlem süresi: ${elapsedTime.toFixed(2)} sn`);

//     return allFeatures;
// }




// --- coğrafi komşu mantığı için eklenecekler ---
const maxDistance = 75; // metre cinsinden eşik
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
fetch("reversed_ids.json")
  .then(res => res.json())
  .then(data => {
    data.forEach(id => forceReversedIds.add(Number(id)));
    // console.log("🔄 Ters pano ID’leri yüklendi:", forceReversedIds);
  })
  .catch(err => console.error("Ters pano JSON yüklenemedi:", err));


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

  async function queryPanoById(id) {
    try {
      const layer = dynamicLayers[0]; // veya tıklanan layer varsa onu geçebilirsin
      const { features } = await layer.queryFeatures({
        where: `objectid_1 = ${id}`,
        outFields: ["*"],
        returnGeometry: true,
        cacheBust: true
      });

      const f = features?.[0];
      if (!f || !f.attributes?.filename || !f.geometry) return null;

      return {
        id: f.attributes.objectid_1,
        coords: [f.geometry.x, f.geometry.y],
        url: `https://datumglb.com/pv360/images/${encodeURIComponent(f.attributes.filename)}`,
        filename: f.attributes.filename,
        plate: f.attributes.plate || ""
      };
    } catch (err) {
      console.warn("queryPanoById error:", err);
      return null;
    }
  }

  // require callback'inin İÇİNDE:
  let highlightHandle = null;
  let activeHaloGraphic = null;   // mavi halka
  let selectionGraphic = null;   // mavi iç nokta

  function clearSelection() {
    if (highlightHandle) { try { highlightHandle.remove(); } catch (e) { }; highlightHandle = null; }
    if (activeHaloGraphic) { view.graphics.remove(activeHaloGraphic); activeHaloGraphic = null; }
    if (selectionGraphic) { view.graphics.remove(selectionGraphic); selectionGraphic = null; }
  }

  async function highlightCurrentPano(pano) {
    clearSelection();

    // ❌ Parıltı/halo istemiyoruz
    // (view.highlightOptions ayarı ve layerView.highlight çağrısı kaldırıldı)

    const pt = { type: "point", longitude: pano.coords[0], latitude: pano.coords[1] };

    // 🔵 Sadece mavi nokta (outline yok)
    selectionGraphic = new Graphic({
      geometry: pt,
      symbol: {
        type: "simple-marker",
        style: "circle",
        // color: [0, 170, 255, 1],  // mavi dolgu
        color: [255,0,0],
        size: "10px",
        outline: null             // halka olmasın
        // alternatif: outline: { color: [0,0,0,0], width: 0 }
      }
    });

    view.graphics.add(selectionGraphic);
  }

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

  // // 1. Sadece legend için gizli FeatureLayer
  // const legendOnlyLayer = new FeatureLayer({
  //     source: [
  //         {
  //             geometry: {
  //                 type: "point",
  //                 longitude: 0,
  //                 latitude: 0
  //             },
  //             attributes: {
  //                 objectId: 1
  //             }
  //         }
  //     ],
  //     objectIdField: "objectId",
  //     geometryType: "point",
  //     spatialReference: view.spatialReference,  // view oluşturulduktan sonra
  //     title: "PV360",
  //     renderer: new SimpleRenderer({
  //         symbol: new SimpleMarkerSymbol({
  //             style: "circle",
  //             size: 8,
  //             color: "red",
  //             outline: { color: "white", width: 1 }
  //         })
  //     }),
  //     listMode: "hide",       // LayerList ve Editor’de gözükmesin
  //     visible: false,         // Haritada görünmesin
  //     legendEnabled: false     // Legend widget’ında yer alsın
  // });
  // map.add(legendOnlyLayer);



  // const pv360GroupLayer = new GroupLayer({
  //     title: "PV360",
  //     visibilityMode: "independent",
  //     listMode: "show",
  // });
  // map.add(pv360GroupLayer);


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
      },
      {
        url: "https://datumglb.com/arcgis/rest/services/calisma_alani/GeocodeServer",
        name: "Balıkesir Çalışma Alanı Coğrafi Kodlama Servisi",
        singleLineFieldName: "Address",
        outFields: ["*"],
        placeholder: "Çalışma Alanı no girin",
        countryCode: "TR",
        maxResults: 6,
        suggestionsEnabled: true,
        minSuggestCharacters: 0
      },
      {
        url: "https://datumglb.com/arcgis/rest/services/parsel/GeocodeServer",
        name: "Balıkesir Ada/Parsel Coğrafi Kodlama Servisi",
        singleLineFieldName: "Address",
        outFields: ["*"],
        placeholder: "Ada/Parsel no girin",
        countryCode: "TR",
        maxResults: 6,
        suggestionsEnabled: true,
        minSuggestCharacters: 0
      },
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
  const infoButton = document.createElement("div");
  infoButton.className = "esri-widget esri-widget--button esri-interactive";
  infoButton.title = "Bilgi PDF’sini Aç";
  infoButton.style.padding = "8px";
  infoButton.innerHTML = '<i class="fas fa-info-circle"></i>'; // Font Awesome ikonu (zaten dahil)

  infoButton.addEventListener("click", () => {
    window.open("bilgilendirme.pdf", "_blank");
  });




  view.when(() => {
    view.ui.add(distExpand, { position: "top-left", index: 1 });
    view.ui.add(areaExpand, { position: "top-left", index: 2 });
    // view.ui.add(legendExpand, { position: "top-left", index: 3 });
    view.ui.add(galleryExpand, { position: "bottom-right", index: 0 });
    view.ui.add(locateBtn, { position: "bottom-right", index: 1 });
    view.ui.add(infoButton, { position: "top-left", index: 3 });



    // Zoom kontrolü uyarısı
    const zoomWarning = document.getElementById("zoomWarning");

    view.watch("zoom", (newZoom) => {
      const threshold = 15;
      if (newZoom < threshold) {
        zoomWarning.style.display = "block";
      } else {
        zoomWarning.style.display = "none";
      }
    });

    // --- 5) Dinamik FeatureLayer’ları yükle ---
    async function fetchYapiKatmanlari() {
      try {
        const response = await fetch("urlsyapi2.txt");
        if (!response.ok) throw new Error("urlsyapi2.txt yüklenemedi.");

        const urls = (await response.text())
          .split("\n")
          .map(u => u.trim())
          .filter(Boolean);

        if (urls.length === 0) {
          console.warn("⚠️ Yapı katmanı URL'si bulunamadı.");
          return;
        }

        const yapiLayers = urls.map(url => new FeatureLayer({
          url,
          outFields: ["*"],
          listMode: "show",
          legendEnabled: true
        }));

        yapiLayers.forEach(layer => map.add(layer));
        // console.log(`🏗️ ${yapiLayers.length} yapı katmanı yüklendi.`);
      } catch (err) {
        console.error("❌ Yapı katmanları alınamadı:", err);
      }
    }
    fetchYapiKatmanlari();
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
          listMode: "show",
          title: "PV360",
        });
        map.add(layer);
        dynamicLayers.push(layer);
      });
      // // ✅ BURADA katman başına feature sayısını logla
      // Promise.all(dynamicLayers.map(async (layer) => {
      //     const { features } = await layer.queryFeatures({ where: "1=1" });
      //     // console.log("✅", layer.url, "→", features.length, "adet nokta");
      // }));


      // Dinamik katmanları yükleyip panoramaları oluştur
      // Promise.all(dynamicLayers.map(layer => layer.load()))
      //     .then(() => {
      //         return Promise.all(dynamicLayers.map(fetchAllFeatures));
      //     })
      //     .then(resultsArray => {
      //         // const allFeatures = resultsArray.flatMap(r => r.features);
      //         const allFeatures = resultsArray.flat();
      //         geojsonData = allFeatures;

      //         // // ✅ 1. İlk birkaç feature'ı detaylı logla
      //         // geojsonData.slice(0, 2).forEach((f, i) => {
      //         //     console.log(`🧩 Feature[${i}] - ATTRIBUTES:`, f.attributes);
      //         //     console.log(`📌 Feature[${i}] - GEOMETRY:`, f.geometry);
      //         //     console.log("📂 Alanlar (keys):", Object.keys(f.attributes || {}));
      //         // });

      //         // ✅ 2. Eksik filename veya objectid_1 olanları bul
      //         const invalidFeatures = geojsonData.filter(f =>
      //             !f?.attributes?.objectid_1 && !f?.attributes?.filename
      //         );
      //         //console.warn("⚠️ Eksik ID veya filename içeren feature sayısı:", invalidFeatures.length);
      //         if (invalidFeatures.length > 0) {
      //             //console.warn("🔍 İlk eksik örnek:", invalidFeatures[0]);
      //         }

      //         // ✅ 3. panoramas dizisini oluştur
      //         const baseUrl = "https://datumglb.com/pv360/images/";
      //         panoramas = geojsonData
      //             .filter(f => f?.attributes?.filename && f?.geometry?.x != null && f?.geometry?.y != null)
      //             .map(f => {
      //                 const attr = f.attributes || {};
      //                 const geom = f.geometry || {};
      //                 const file = attr.filename || "";
      //                 const fullUrl = file ? `${baseUrl}${encodeURIComponent(file)}` : "";

      //                 return {
      //                     id: attr.objectid_1,
      //                     coords: [geom.x, geom.y],
      //                     url: fullUrl,
      //                     filename: file,
      //                     plate: attr.plate || ""
      //                 };
      //             });


      //         const panoIds = panoramas.map(p => p.id);
      //         // console.log("📋 İlk 10 pano ID:", panoIds.slice(0, 10));

      //         // console.log("✅ Toplam panoramas sayısı:", panoramas.length);

      //         loadingMsg.style.display = "none";
      //         // console.log("📸 Panoramas:", panoramas.length, panoramas.slice(0, 3));

      //     })
      //     .catch(err => {
      //         console.error("GeoJSON verisi alınırken hata:", err);
      //         loadingMsg.innerText = "Panorama verisi yüklenemedi!";
      //     });
      Promise.all(dynamicLayers.map(layer => layer.load()))
        .then(() => {
          loadingMsg.style.display = "none"; // ✅ servis yüklenince gizle
        });

      // 2) LEGEND OLUŞTURMA
      const legendInfos = [
        // önce tüm dynamic layers
        ...dynamicLayers.map(l => ({ layer: l, title: l.title })),
        // sonra yapı katmanları
        ...yapiLayers.map(l => ({ layer: l, title: l.title })),
        // sonra gizli kontrol katmanı
        // { layer: legendOnlyLayer, title: legendOnlyLayer.title }
      ];

      const legend = new Legend({
        view,
        respectLayerVisibility: false
      });

      const legendExpand = new Expand({
        view,
        content: legend,
        expandIconClass: "esri-icon-legend",
        expanded: false,
        expandTooltip: "Lejantı Görüntüle"
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

  view.on("click", async (evt) => {
    try {
      const hit = await view.hitTest(evt);

      // 🔹 Her tıklamada önce eski highlight/selection'ı temizle
      if (highlightHandle) { highlightHandle.remove(); highlightHandle = null; }
      if (selectionGraphic) { view.graphics.remove(selectionGraphic); selectionGraphic = null; }

      // 🔹 PV360 katmanlarından bir grafik yakala
      const hitGraphic = hit.results.find(r =>
        r.graphic?.layer && dynamicLayers.includes(r.graphic.layer)
      )?.graphic;

      // ⛔ Boşluğa tıklandıysa: temizledik ve çıkıyoruz
      if (!hitGraphic || !hitGraphic.attributes) return;

      // 🆔 Tıklanan OID
      const oid = Number(hitGraphic.attributes.objectId_1);
      if (isNaN(oid)) return;

      // 🧭 Log
      // console.log("🖱️ Tıklanan grafik:", {
      //   oid,
      //   filename: hitGraphic.attributes.filename,
      //   coords: hitGraphic.geometry ? [hitGraphic.geometry.x, hitGraphic.geometry.y] : null,
      //   forcedReverse: forceReversedIds.has(oid)
      // });

      // ✨ Yeni highlight
      try {
        const layerView = await view.whenLayerView(hitGraphic.layer);
        highlightHandle = layerView.highlight(hitGraphic);
      } catch (e) {
        console.warn("⚠️ highlight yapılamadı:", e);
      }

      // 🔴 Seçim noktası (yön okundan ayrı!)
      selectionGraphic = new Graphic({
        geometry: hitGraphic.geometry,
        symbol: {
          type: "simple-marker",
          color: [255, 0, 0, 0.9],
          size: "10px",
          outline: { color: [255, 255, 255, 1], width: 1 }
        }
      });
      view.graphics.add(selectionGraphic);

      // 📦 Yakın komşuları çek → panoramas dizisi
      const { features } = await hitGraphic.layer.queryFeatures({
        where: `objectId_1 BETWEEN ${oid - 5} AND ${oid + 5}`,
        outFields: ["*"],
        returnGeometry: true,
        orderByFields: ["objectId_1"],
        cacheBust: true
      });
      if (!features.length) {
        console.warn("⛔ Yakın pano verisi yok.");
        return;
      }

      panoramas = features
        .filter(f => f?.attributes?.filename && f.geometry)
        .map(f => ({
          id: f.attributes.objectId_1,
          coords: [f.geometry.x, f.geometry.y],
          url: `https://datumglb.com/pv360/imagesKalan/${encodeURIComponent(f.attributes.filename)}`,
          filename: f.attributes.filename,
          plate: f.attributes.plate || ""
        }))
        .sort((a, b) => a.id - b.id);

      // console.log("📦 Yüklenen panoramas ID'leri:", panoramas.map(p => p.id));

      currentIndex = panoramas.findIndex(p => p.id === oid);
      if (currentIndex === -1) {
        console.warn("⚠️ Tıklanan pano fetched listesinde bulunamadı, 0'a düşüldü.");
        currentIndex = 0;
      }

      // console.log("🎯 Aktif pano:", {
      //   index: currentIndex,
      //   id: panoramas[currentIndex]?.id,
      //   filename: panoramas[currentIndex]?.filename,
      //   forcedReverse: forceReversedIds.has(panoramas[currentIndex]?.id)
      // });

      // ▶️ Panoramayı aç (showPanoramaByIndex içinde pannellum'u yaw ile başlatmayı unutma)
      showPanoramaByIndex(currentIndex);

    } catch (err) {
      console.error("❌ Tıklama işlenirken hata:", err);
    }
  });




  // --- 8) Panorama görüntüleme, yön okları ve marker işlemleri ---
  let markerGraphic = null;
  let yawWatcherHandle = null;
  let hasLookMarker = false;

  async function ensurePanoramasAround(idx) {
    const pano = panoramas[idx];
    if (!pano) return;

    const layer = dynamicLayers[0]; // Eğer birden fazla layer varsa daha sonra geliştirilebilir
    const minOid = pano.id - 2;
    const maxOid = pano.id + 2;

    const loadedOids = new Set(panoramas.map(p => p.id));

    const { features } = await layer.queryFeatures({
      where: `objectId_1 BETWEEN ${minOid} AND ${maxOid}`,
      outFields: ["*"],
      returnGeometry: true,
      orderByFields: ["objectId_1"]
    });

    const newPanos = features
      .filter(f => f?.attributes?.filename && f.geometry)
      .map(f => ({
        id: f.attributes.objectId_1,
        coords: [f.geometry.x, f.geometry.y],
        url: `https://datumglb.com/pv360/imagesKalan/${encodeURIComponent(f.attributes.filename)}`,
        filename: f.attributes.filename,
        plate: f.attributes.plate || ""
      }))
      .filter(p => !loadedOids.has(p.id));

    if (newPanos.length > 0) {
      panoramas = panoramas.concat(newPanos);
      panoramas.sort((a, b) => a.id - b.id);
    }
  }

  async function refreshPanoramasAround(centerId) {
    const layer = dynamicLayers[0]; // gerekirse aktif layer’ı al

    const minId = centerId - 5;
    const maxId = centerId + 5;

    const { features } = await layer.queryFeatures({
      where: `objectId_1 BETWEEN ${minId} AND ${maxId}`,
      outFields: ["*"],
      returnGeometry: true,
      orderByFields: ["objectId_1"],
      cacheBust: true
    });

    panoramas = features
      .filter(f => f?.attributes?.filename && f.geometry)
      .map(f => ({
        id: f.attributes.objectId_1,
        coords: [f.geometry.x, f.geometry.y],
        url: `https://datumglb.com/pv360/imagesKalan/${encodeURIComponent(f.attributes.filename)}`,
        filename: f.attributes.filename,
        plate: f.attributes.plate || ""
      }))
      .sort((a, b) => a.id - b.id);

    currentIndex = panoramas.findIndex(p => p.id === centerId);
    if (currentIndex === -1) {
      console.warn("⚠️ refreshPanoramasAround → aktif pano dizide bulunamadı!");
      return false;
    }

    // console.log("🔁 panoramas güncellendi:", panoramas.map(p => p.id));
    //console.log("🔁 panoramas güncellendi");

    return true;
  }


  async function showPanoramaByIndex(idx) {

    // sahne değişirken önceki highlight ve seçim noktasını temizle
    clearSelection();

    // console.log("🖱️ showPanoramaByIndex çağrısı → idx:", idx,
    //   " | panoramas[idx]?.id:", panoramas[idx]?.id);
    // await ensurePanoramasAround(idx);

    // console.log("📦 panoramas ID'leri:", panoramas.map(p => p.id));
    //console.log("🎯 Aktif pano ID:", panoramas[idx]?.id, "| index:", idx);

    // if (idx < 0 || idx >= panoramas.length) return;
    // currentIndex = idx;

    // 🔁 İlk olarak mevcut pano nesnesini al
    const previousPano = panoramas[idx];
    if (!previousPano) return;

    // 🆕 Yeni ID merkezli panoramaları yükle
    const refreshed = await refreshPanoramasAround(previousPano.id);
    if (!refreshed) return;

    // ✔️ Güncellenmiş dizide aktif index’i tekrar bul
    currentIndex = panoramas.findIndex(p => p.id === previousPano.id);
    if (currentIndex === -1) {
      console.warn("❌ Aktif pano güncel panoramas dizisinde bulunamadı!");
      return;
    }

    // 🔍 Güncel pano objesi
    const pano = panoramas[currentIndex];

    // console.log("📌 Aktif pano (refreshten sonra):", {
    //   index: currentIndex,
    //   id: pano.id,
    //   filename: pano.filename,
    //   coords: pano.coords,
    //   forcedReverse: forceReversedIds.has(Number(pano.id))
    // });


    // console.log("📦 panoramas ID'leri:", panoramas.map(p => p.id));
    // console.log("🎯 Aktif pano ID:", pano.id, "| index:", currentIndex);

    if (yawAnimationHandle) {
      cancelAnimationFrame(yawAnimationHandle);
      yawAnimationHandle = null;
    }

    // a) Önceki viewer ve sadece yön marker temizliği
    viewer?.destroy();
    if (yawWatcherHandle) {
      clearInterval(yawWatcherHandle);
      yawWatcherHandle = null;
    }
    if (lookMarkerGraphic) {
      view.graphics.remove(lookMarkerGraphic);
      lookMarkerGraphic = null;
    }

    // b) Yeni panoramayı yükle
    const shouldFlipAtLoad = forceReversedIds.has(Number(pano.id)); // Excel listesi
    const startYaw = shouldFlipAtLoad ? 180 : 0;
    // const pano = panoramas[idx];
    viewer = pannellum.viewer("sidePanel", {
      type: "equirectangular",
      panorama: pano.url,
      autoLoad: true,
      yaw: startYaw
    });

    // c) Viewer yüklendikten sonra yönü bul
    viewer.on("load", () => {
      const current = panoramas[currentIndex];   // <— değiştir
      const previous = panoramas[currentIndex - 1];
      const next = panoramas[currentIndex + 1];

      const forcedReverse = forceReversedIds.has(Number(current.id));
      const nowYaw = normalizeAngle(viewer.getYaw());
      // console.log("🎥 viewer load:", {
      //   id: current.id,
      //   filename: current.filename,
      //   nowYaw,
      //   forcedReverse
      // });

      // const shouldFlip = forcedReverse; // || smartReverse;
      // if (shouldFlip) {
      //   viewer.setYaw(normalizeAngle(nowYaw + 180));
      //   console.log("↩️ Yaw 180° çevrildi →", normalizeAngle(nowYaw + 180));
      // }

      // ardından mevcut kodun (oklar, startYawWatcher vs.) devam etsin
      const shouldShowMarker = addNavArrows();
      if (!shouldShowMarker) return;

      if (previous && next) {
        const baseAngle = direction_lookup(
          next.coords[0], current.coords[0],
          next.coords[1], current.coords[1],
          previous.coords[0], previous.coords[1]
        );
        // panoId’yi de iletelim ki harita oku aynı mantıkla dönsün
        startYawWatcher(baseAngle, current.coords[0], current.coords[1], current.id);
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

    function startYawWatcher(baseAngle, lon, lat, panoId) {
      let lastYaw = null;

      function checkYaw() {
        if (!viewer) return;

        const yawOffset = normalizeAngle(viewer.getYaw());
        if (lastYaw === null || Math.abs(yawOffset - lastYaw) > 1) {
          lastYaw = yawOffset;

          const base = normalizeAngle(baseAngle);
          const yaw = normalizeAngle(yawOffset);

          updateMarkerWithYaw(lon, lat, base, yaw, panoId);
        }

        yawAnimationHandle = requestAnimationFrame(checkYaw);
      }

      yawAnimationHandle = requestAnimationFrame(checkYaw);
    }



    function updateMarkerWithYaw(lon, lat, baseAngle, yaw, panoId) {
      // 1) Normal açı
      const finalAngle = normalizeAngle(baseAngle + yaw);

      // 2) “Akıllı” terslik + manuel liste kontrolü
      const smartReverse = isReversedSmart(baseAngle, yaw);   // mevcut fonksiyon
      const forcedReverse = forceReversedIds.has(Number(panoId));

      // 3) Gerekirse 180° çevir
      const angleToUse = normalizeAngle(finalAngle + (forceReversedIds.has(Number(panoId)) ? 180 : 0));
      // console.log("📍 Marker yaw update:", {
      //   panoId,
      //   baseAngle,
      //   yaw,
      //   finalAngle,
      //   forcedReverse,
      //   angleToUse
      // });


      const markerPoint = { type: "point", longitude: lon, latitude: lat };
      const markerSymbol = {
        type: "picture-marker",
        url: "look1.png",
        width: "60px",
        height: "90px",
        angle: angleToUse
      };

      if (!lookMarkerGraphic) {
        lookMarkerGraphic = new Graphic({ geometry: markerPoint, symbol: markerSymbol });
        view.graphics.add(lookMarkerGraphic);
      } else {
        lookMarkerGraphic.geometry = markerPoint;
        lookMarkerGraphic.symbol = markerSymbol;
      }
    }

    // d) Haritayı işaretli noktaya kaydır
    view.goTo({ center: pano.coords });

    //  Sadece AKTİF pano highlight kalsın
    await highlightCurrentPano(pano);

    // e) Nav oklarını ekle
    // const shouldShowMarker = addNavArrows();
    // if (!shouldShowMarker) return;


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
  async function addNavArrows() {
    const panel = document.getElementById("sidePanel");
    panel.querySelectorAll(".nav-arrow").forEach(el => el.remove());

    const current = panoramas[currentIndex];
    const visibleDirections = new Set();

    // 🔁 Mesafeye göre uygun komşuları bul
    const nearby = panoramas
      .filter(p => p.id !== current.id)
      .map(p => ({
        ...p,
        dist: getDistance(current.coords, p.coords)
      }))
      .filter(p => p.dist <= maxDistance);

    // 🔙 Geriye doğru en yakın id (ama id < current)
    const back = nearby
      .filter(p => p.id < current.id)
      .sort((a, b) => b.id - a.id)[0]; // en büyük ID'li önceki

    if (back) {
      const left = document.createElement("div");
      left.className = "nav-arrow arrow-left";
      left.addEventListener("click", async e => {
        e.stopPropagation();
        const idx = panoramas.findIndex(p => p.id === back.id);
        await showPanoramaByIndex(idx);
      });
      panel.appendChild(left);
      visibleDirections.add("left");
    }

    // 🔜 İleriye doğru en yakın id (ama id > current)
    const next = nearby
      .filter(p => p.id > current.id)
      .sort((a, b) => a.id - b.id)[0]; // en küçük ID'li sonraki

    if (next) {
      const right = document.createElement("div");
      right.className = "nav-arrow arrow-right";
      right.addEventListener("click", async e => {
        e.stopPropagation();
        const idx = panoramas.findIndex(p => p.id === next.id);
        await showPanoramaByIndex(idx);
      });
      panel.appendChild(right);
      visibleDirections.add("right");
    }

    // ↠ En yakın komşu (coğrafi)
    const geo = nearby
      .filter(p => p.id !== back?.id && p.id !== next?.id)
      .sort((a, b) => a.dist - b.dist)[0];

    if (geo) {
      const geoArrow = document.createElement("div");
      geoArrow.className = "nav-arrow arrow-next";
      geoArrow.title = `En yakın komşu: ${geo.dist.toFixed(1)} m`;
      geoArrow.addEventListener("click", async e => {
        e.stopPropagation();
        const idx = panoramas.findIndex(p => p.id === geo.id);
        await showPanoramaByIndex(idx);
      });
      panel.appendChild(geoArrow);
      visibleDirections.add("geo");
    }

    // --- Uyarılar ---
    const hasLeft = visibleDirections.has("left");
    const hasRight = visibleDirections.has("right");
    const hasGeo = visibleDirections.has("geo");
    const navCount = (hasLeft ? 1 : 0) + (hasRight ? 1 : 0);

    //console.log("↩️", hasLeft, "↪️", hasRight, "🧭", hasGeo);

    if (!hasLeft && !hasRight && !hasGeo) {
      alert("Görüntü sonu! Harita üzerinden başka bir görüntü noktası seçiniz.");
      return false;
    }

    if (navCount === 1) {
      alert("Yol sonu! Bu noktadan yalnızca tek yönde ilerleyebilirsiniz");
      return false;
    }

    return true;
  }

});

