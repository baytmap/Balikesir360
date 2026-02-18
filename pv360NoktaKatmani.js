// --- global değişkenler panorama navigator için ---
let geojsonData = [];
let panoramas = [];
let currentIndex = -1;
let viewer;
let geojsonLayer;
const groupLoadStatus = {};
const dynamicLayers = [];

let panoMap = new Map(); // objectId → pano objesi
// async function fetchAllFeatures(layer) {
//     const pageSize = 75000;
//     const allFeatures = [];
//     const seenIds = new Set();
//     let offset = 0;
//     let keepFetching = true;

//     let lastOidSnapshot = new Set();

//     while (keepFetching) {
//         console.log(`📦 [${layer.url}] Veri çekiliyor: ${offset} → ${offset + pageSize}`);

//         const { features } = await layer.queryFeatures({
//             where: "1=1",
//             outFields: ["*"],
//             returnGeometry: true,
//             resultOffset: offset,
//             resultRecordCount: pageSize
//         });

//         if (!features || features.length === 0) {
//             console.warn("⛔ Daha fazla feature yok. Döngü sonlandı.");
//             break;
//         }

//         // 🔄 Duplicate kontrolü
//         let newCount = 0;
//         for (const f of features) {
//             const oid = f.attributes?.objectid_1;
//             if (oid != null && !seenIds.has(oid)) {
//                 seenIds.add(oid);
//                 allFeatures.push(f);
//                 newCount++;
//             }
//         }

//         // 🚨 Eğer gelen tüm oid'ler zaten vardıysa → döngüden çık
//         const snapshotKey = [...seenIds].slice(-pageSize).join(",");
//         const lastSnapshotKey = [...lastOidSnapshot].join(",");

//         if (newCount === 0 || snapshotKey === lastSnapshotKey) {
//             console.warn("🛑 Tekrarlı sonuç geldi veya yeni kayıt yok. Döngü durduruldu.");
//             break;
//         }

//         lastOidSnapshot = new Set(seenIds);

//         if (features.length < pageSize) {
//             console.log("✅ Tüm veriler başarıyla çekildi.");
//             break;
//         }

//         offset += pageSize;
//     }

//     console.log(`✅ Toplam çekilen benzersiz feature: ${allFeatures.length}`);
//     return allFeatures;
// }


async function fetchAllFeatures(layer) {
    const startTime = Date.now(); // Başlangıç zamanını al

    const pageSize = 50000;
    const allFeatures = [];
    const seenIds = new Set();
    let lastObjectId = 0;
    let keepFetching = true;

    while (keepFetching) {
       // console.log(`📦 [${layer.url}] Veri çekiliyor: objectid_1 > ${lastObjectId}`);

        const { features } = await layer.queryFeatures({
            where: `objectid_1 > ${lastObjectId}`,
            outFields: ["*"],
            returnGeometry: true,
            orderByFields: ["objectid_1"],
            resultRecordCount: pageSize
        });

        if (!features || features.length === 0) {
            console.warn("⛔ Daha fazla feature yok. Döngü sonlandı.");
            break;
        }

        let newCount = 0;

        for (const f of features) {
            const oid = f.attributes?.objectid_1;
            if (oid != null && !seenIds.has(oid)) {
                seenIds.add(oid);
                allFeatures.push(f);
                lastObjectId = Math.max(lastObjectId, oid);
                newCount++;
            }
        }

        if (newCount < pageSize) {
           // console.log("✅ Son sayfa alındı.");
            keepFetching = false;
        }
    }

    const endTime = Date.now(); // Bitiş zamanını al
    const elapsedTime = (endTime - startTime) / 1000; // Geçen süreyi saniye olarak hesapla

    // console.log(`✅ Toplam çekilen benzersiz feature: ${allFeatures.length}`);
    // console.log(`⏱️ İşlem süresi: ${elapsedTime.toFixed(2)} sn`);

    return allFeatures;
}




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

        async function fetchYapiKatmanlari() {
            try {
                const response = await fetch("urlsyapi.txt");
                if (!response.ok) throw new Error("urlsyapi.txt yüklenemedi.");

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
                    legendEnabled: true,
                    title: "Yapı Katmanı"
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
                    listMode: "show"
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
            Promise.all(dynamicLayers.map(layer => layer.load()))
                .then(() => {
                    return Promise.all(dynamicLayers.map(fetchAllFeatures));
                })
                .then(resultsArray => {
                    // const allFeatures = resultsArray.flatMap(r => r.features);
                    const allFeatures = resultsArray.flat();
                    geojsonData = allFeatures;

                    // // ✅ 1. İlk birkaç feature'ı detaylı logla
                    // geojsonData.slice(0, 2).forEach((f, i) => {
                    //     console.log(`🧩 Feature[${i}] - ATTRIBUTES:`, f.attributes);
                    //     console.log(`📌 Feature[${i}] - GEOMETRY:`, f.geometry);
                    //     console.log("📂 Alanlar (keys):", Object.keys(f.attributes || {}));
                    // });

                    // ✅ 2. Eksik filename veya objectid_1 olanları bul
                    const invalidFeatures = geojsonData.filter(f =>
                        !f?.attributes?.objectid_1 && !f?.attributes?.filename
                    );
                    //console.warn("⚠️ Eksik ID veya filename içeren feature sayısı:", invalidFeatures.length);
                    if (invalidFeatures.length > 0) {
                        //console.warn("🔍 İlk eksik örnek:", invalidFeatures[0]);
                    }

                    // ✅ 3. panoramas dizisini oluştur
                    const baseUrl = "https://datumglb.com/pv360/images/";
                    panoramas = geojsonData
                        .filter(f => f?.attributes?.filename && f?.geometry?.x != null && f?.geometry?.y != null)
                        .map(f => {
                            const attr = f.attributes || {};
                            const geom = f.geometry || {};
                            const file = attr.filename || "";
                            const fullUrl = file ? `${baseUrl}${encodeURIComponent(file)}` : "";

                            return {
                                id: attr.objectid_1,
                                coords: [geom.x, geom.y],
                                url: fullUrl,
                                filename: file,
                                plate: attr.plate || ""
                            };
                        });

                    panoMap = new Map(panoramas.map(p => [p.id, p]));

                    const panoIds = panoramas.map(p => p.id);
                    // console.log("📋 İlk 10 pano ID:", panoIds.slice(0, 10));

                    // console.log("✅ Toplam panoramas sayısı:", panoramas.length);
                    loadingMsg.style.display = "none";


                    // .then(resultsArray => {
                    //     const allFeatures = resultsArray.flatMap((r, i) => {
                    //         console.log("✔️ Katman:", dynamicLayers[i].url, "→", r.features.length, "feature geldi");
                    //         return r.features;
                    //     });
                    //     geojsonData = allFeatures;

                    // 👇 Buraya log koy
                    // const f = geojsonData[0];
                    // console.log("🧪 Feature örneği:", f);
                    // console.log("🔎 attributes:", f.attributes);
                    // console.log("🔎 attribute key'leri:", Object.keys(f.attributes || {}));
                    // console.log("🔎 geometry:", f.geometry);

                    // 📌 LOG EKLE
                    // console.log("📦 Dynamic Layers:", dynamicLayers.map(l => l.url));
                    // console.log("📈 GeoJSON count:", geojsonData.length);
                    // console.log("🔎 First feature attributes:", geojsonData[0]?.attributes);
                    // console.log("🔑 Attribute keys:", Object.keys(geojsonData[0]?.attributes || {}));

                    // const baseUrl = "https://datumglb.com/pv360/images/";

                    // panoramas = geojsonData.map(f => {
                    //     const attr = f.attributes || {};
                    //     const geom = f.geometry || {};
                    //     const file = attr.filename || "";
                    //     const fullUrl = file ? `${baseUrl}${encodeURIComponent(file)}` : "";

                    //     // const coords = (
                    //     //     geom.type === "point" && typeof geom.x === "number" && typeof geom.y === "number"
                    //     // )
                    //     //     ? [geom.x, geom.y]
                    //     //     : [0, 0]; // fallback coords

                    //     return {
                    //         id: attr.objectid_1 || f.attributes.OBJECTID || f.attributes.objecid_1,
                    //         coords: [f.geometry.longitude, f.geometry.latitude],
                    //         url: fullUrl,
                    //         filename: file,
                    //         plate: attr.plate || ""
                    //     };
                    // });
                    loadingMsg.style.display = "none";
                    // console.log("📸 Panoramas:", panoramas.length, panoramas.slice(0, 3));

                })
                .catch(err => {
                    console.error("GeoJSON verisi alınırken hata:", err);
                    loadingMsg.innerText = "Panorama verisi yüklenemedi!";
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
            if (!panoramas.length) {
                console.warn("⛔ Panoramik veri yüklenmemiş.");
                return;
            }

            const hitResults = await view.hitTest(evt);

            const hitGraphic = hitResults.results.find(r =>
                r.graphic?.layer && dynamicLayers.includes(r.graphic.layer)
            )?.graphic;

            if (!hitGraphic || !hitGraphic.attributes) {
                console.warn("🚫 Nokta tıklanmadı veya attribute eksik.");
                return;
            }

            const oid = Number(hitGraphic.attributes.objectid_1);
            if (isNaN(oid)) {
                console.warn("🚫 Geçersiz objectId:", hitGraphic.attributes);
                return;
            }

            // console.log("🎯 Tıklanan OID:", oid);

            const idx = panoramas.findIndex(p => Number(p.id) === oid);
            if (idx === -1) {
                console.warn("🚫 Bu OID panoramas içinde bulunamadı:", oid);
                return;
            }

            const pano = panoramas[idx];
            if (!pano || typeof pano.filename !== "string") {
                console.warn("🚫 Pano geçersiz veya filename eksik:", pano);
                return;
            }

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

