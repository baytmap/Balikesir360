require([
  "esri/views/MapView",
  "esri/WebMap",
  "esri/core/watchUtils",
  "esri/config",
  "esri/widgets/BasemapToggle",
  "esri/widgets/Search",
  "esri/Graphic",
  "esri/layers/FeatureLayer",
  "esri/widgets/Editor",
  "esri/widgets/support/SnappingControls",
  "esri/widgets/Expand",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Locate",
  "esri/widgets/Bookmarks",
  "esri/widgets/Legend",
  "esri/widgets/Track",


], (
  MapView,
  WebMap,
  watchUtils,
  esriConfig,
  BasemapToggle,
  Search,
  Graphic,
  FeatureLayer,
  Editor,
  SnappingControls,
  Expand,
  BasemapGallery,
  Locate,
  Bookmarks,
  Legend,
  Track
) => {
  esriConfig.portalUrl = "https://geolabgis.xyz/portal";
  const webmap = new WebMap({
    portalItem: {
      id: "00c8dd6c675d4275a68cdd0e11b8edf6",
    },
  });

  const view = new MapView({
    map: webmap,
    container: "viewDiv",
    // highlightOptions: {
    //   color: [255, 241, 58],
    //   fillOpacity: 0.4
    // },
    popup: {
      autoOpenEnabled: false,
    },
  });
  let attachments = null;
  let attachmentsNext = null;
  let attachmentsBack = null;
  let viewer = "";
  let yaw = 0;
  let pitch = 0;
  let hfov = 100;
  let panorama = "";
  let highlight;
  let yawPointGraphic = 0;
  let pointLayer;
  let lineLayer;

  const searchWidget = new Search({
    view: view,
  });
  const basemapGallery = new BasemapGallery({
    view: view,
    // container: document.querySelector("#appBody")
  });

  const bgExpand = new Expand({
    view: view,
    content: basemapGallery,
  });

  view.ui.add(searchWidget, {
    position: "top-right",
    index: 2,
  });
  view.ui.add(bgExpand, "top-left");
  
  const locateBtn = new Locate({
    view: view,
  });

  // Add the locate widget to the top left corner of the view
  view.ui.add(locateBtn, {
    position: "top-left",
  });
  const bookmarks = new Bookmarks({
    view: view,
    // allows bookmarks to be added, edited, or deleted
    editingEnabled: true,
    visibleElements: {
      time: false, // don't show the time (h:m:s) next to the date
    },
  });

  const bkExpand = new Expand({
    view: view,
    content: bookmarks,
    expanded: false,
  });


  // Add the widget to the top-right corner of the view
  view.ui.add(bkExpand, "top-left");

  const legend = new Legend({
    view: view,
    style: "card"
  });
  view.ui.add(new Expand({ view, content: legend }), "top-left");


  // const editExpand = new Expand({
  //   expandIconClass: "esri-icon-edit",
  //   expandTooltip: "Expand Edit",
  //   expanded: true,
  //   view: view,
  // });
  // view.ui.add(editExpand, "bottom-left");

  view.map.allLayers.forEach((layer) => {
    if (layer.type === "feature") {
      switch (layer.geometryType) {
        case "polyline":
          lineLayer = layer;
          break;
        case "point":
          pointLayer = layer;
          break;
      }
    }
  });
  // Create layerInfos for layers in Editor

  // Set the point layer's LayerInfo
  const pointInfos = {
    layer: pointLayer,
    // formTemplate: { // autocasts to FormTemplate
    //   // elements: [{ // autocasts to Field Elements
    //   //   type: "field",
    //   //   fieldName: "HazardType",
    //   //   label: "Hazard type"
    //   // }]
    // }
  };
  const lineInfos = {
    layer: lineLayer,
    formTemplate: {
      // autocasts to FormTemplate
      elements: [
        {
          // autocasts to FieldElement
          type: "field",
          fieldName: "Severity",
          label: "Severity",
        },
        {
          type: "field",
          fieldName: "blocktype",
          label: "Type of blockage",
        },
        {
          type: "field",
          fieldName: "fullclose",
          label: "Full closure",
        },
        {
          type: "field",
          fieldName: "active",
          label: "Active",
        },
        {
          type: "field",
          fieldName: "locdesc",
          label: "Location Description",
        },
      ],
    },
  };

  // Begin Editor constructor
  const editor = new Editor({
    view: view,
    layerInfos: [pointInfos, lineInfos],
  }); // End Editor constructor
  const editorTb = new Expand({
    view: view,
    content: editor,
    expanded: false,
  });
  
  // Add the widget to the view
  view.ui.add(editorTb, "top-left");

  watchUtils.on(view, "map.layers", "change", () => {
    const featureLayer = view.map.layers.getItemAt(0);

    registerClickHandler(featureLayer);
  });
  function layerQuery(objectId) {
    const featureLayer = view.map.layers.getItemAt(0);
    const queryParams = featureLayer.createQuery();

    queryParams.where = "objectid=" + objectId;
    queryParams.outFields = ["x", "y", "z"];

    featureLayer.queryFeatures(queryParams).then((results) => {
      const feature1Coords = results.features[0].attributes;

      const objectIdNext = objectId + 1;
      const queryParamsTb = featureLayer.createQuery();
      queryParamsTb.where = "objectid=" + objectIdNext;
      queryParamsTb.outFields = ["x", "y", "z"];
      featureLayer.queryFeatures(queryParamsTb).then((secondResults) => {
        const feature2Coords = secondResults.features[0].attributes;
        direction_lookup(
          feature2Coords.x,
          feature1Coords.x,
          feature2Coords.y,
          feature1Coords.y
        );
      });
    });
  }
  function direction_lookup(destination_x, origin_x, destination_y, origin_y) {
    var compass_brackets,
      compass_lookup,
      degrees_final,
      degrees_temp,
      deltaX,
      deltaY;
    deltaX = destination_x - origin_x;
    deltaY = destination_y - origin_y;
    degrees_temp = (Math.atan2(deltaX, deltaY) / Math.PI) * 180;

    if (degrees_temp < 0) {
      degrees_final = 360 + degrees_temp;
    } else {
      degrees_final = degrees_temp;
    }

    compass_brackets = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
    compass_lookup = Math.round(degrees_final / 45);
    getPointGraphic(degrees_final, origin_x, origin_y);
    // return [compass_brackets[compass_lookup], degrees_final];
    //layerQuery2(degrees_final);
  }
  // function layerQuery2(degrees_final,objectId) {
  //   const featureLayer = view.map.layers.getItemAt(0);
  //   const queryParams2 = featureLayer.createQuery();

  //   queryParams2.where = "objectid=" + objectId;
  //   queryParams2.outFields = ["x", "y", "z"];

  //   featureLayer.queryFeatures(queryParams2).then(function (results) {
  //     const coords = results.features[0].attributes;
  //     // console.log(coords.x);

  //     getPointGraphic(degrees_final,coords);
  //   });
  // }

  // console.log(direction_lookup(destination_x, origin_x, destination_y, origin_y));

  function registerClickHandler(featureLayer) {
    view.on("click", async (event) => {
      const point = view.toMap(event);
      const hitTestResult = await view.hitTest(event);
      const objectId = getObjectId(hitTestResult);
      const nextObjectID = objectId + 1;
      const backObjectID = objectId - 1;
      //console.log(hitTestResult.results[0]);
      if (isNaN(objectId)) {
        return;
      }
      view.whenLayerView(featureLayer).then(function (layerView) {
        if (highlight) {
          highlight.remove();
        }
        highlight = layerView.highlight(objectId);
      });

      await getAttachments(featureLayer, objectId, nextObjectID, backObjectID);
      handleAttachmentNodes();
    });
  }

  function getObjectId(hitTestResult) {
    return hitTestResult.results
      .map((result) => result.graphic)
      .map((graphic) => {
        return graphic.attributes?.[graphic.layer.objectIdField];
      })
      .filter((objectId) => !isNaN(objectId))[0];
  }

  async function getAttachments(
    featureLayer,
    objectIds,
    nextObjectID,
    backObjectID
  ) {
    const attachmentRes = await featureLayer.queryAttachments({
      objectIds,
    });

    const attachmentResN = await featureLayer.queryAttachments({
      objectIds: nextObjectID,
    });
    const attachmentResB = await featureLayer.queryAttachments({
      objectIds: backObjectID,
    });
    attachments = attachmentRes[objectIds];
    attachmentsNext = attachmentResN[nextObjectID];
    attachmentsBack = attachmentResB[backObjectID];
  }

  function handleAttachmentNodes() {
    clearAttachmentNodes();
    generateAttachmentNodes();
  }

  function clearAttachmentNodes() {
    const sidePanel = document.getElementById("sidePanel");
    while (sidePanel.firstChild) {
      sidePanel.removeChild(sidePanel.lastChild);
    }
  }
  let att_id = "";
  let next_att_id = "";
  let back_att_id = "";
  function generateAttachmentNodes() {
    attachments.forEach((attachment) => {
      panorama = attachment.url;
      att_id = attachment.parentObjectId;
    });
    attachmentsNext.forEach((attachment) => {
      panoramaNext = attachment.url;
      next_att_id = attachment.parentObjectId;
    });
    attachmentsBack.forEach((attachment) => {
      panoramaBack = attachment.url;
      back_att_id = attachment.parentObjectId;
    });

    const pv = PanViewer(panorama, att_id);
    panCreateScene(panoramaNext, next_att_id, panoramaBack, back_att_id);
  }

  function PanViewer(panorama, att_id) {
    if (viewer) {
      console.log("sahne silindi");
      viewer.destroy();
    }
    viewer = pannellum.viewer("sidePanel", {
      type: "equirectangular",
      yaw: yaw,
      pitch: pitch,
      hfov: hfov,
      scenes: [],
    });
    //console.log(viewer)

    viewer.addScene(att_id, {
      panorama: panorama,
      hotSpots: [],
    });

    viewer.loadScene(att_id);
    layerQuery(att_id);
  }
  function panCreateScene(
    panoramaNext,
    next_att_id,
    panoramaBack,
    back_att_id
  ) {
    viewer.addScene(next_att_id, {
      panorama: panoramaNext,
    });
    viewer.addScene(back_att_id, {
      panorama: panoramaBack,
    });

    viewer.on("mousedown", function (event) {
      yaw = viewer.getYaw();
      pitch = viewer.getPitch();
      hfov = viewer.getHfov();
      createHotSpotNext.targetYaw = yaw;
      createHotSpotNext.targetPitch = pitch;
      createHotSpotNext.targetHfov = hfov;

      createHotSpotBack.targetYaw = yaw;
      createHotSpotBack.targetPitch = pitch;
      createHotSpotBack.targetHfov = hfov;

      var yaw_hotspot = -yaw;
      $("body").click(function (event) {
        $(".custom-hotspot-front,.custom-hotspot-back").css(
          "-moz-transform",
          "rotate(" + yaw_hotspot + "deg)"
        );
        $(".custom-hotspot-front,.custom-hotspot-back").css(
          "-webkit-transform",
          "rotate(" + yaw_hotspot + "deg)"
        );
        $(".custom-hotspot-front,.custom-hotspot-back").css(
          "-o-transform",
          "rotate(" + yaw_hotspot + "deg)"
        );
        $(".custom-hotspot-front,.custom-hotspot-back").css(
          "-ms-transform",
          "rotate(" + yaw_hotspot + "deg)"
        );
      });
      $(".custom-hotspot-front,.custom-hotspot-back").click(function () {
        $(".custom-hotspot-front,.custom-hotspot-back").css(
          "visibility",
          "hidden"
        );
      });
    });

    // tb = document.querySelector("#sidePanel");
    // tb.addEventListener("mousedown", ilkOkuma);
    // function ilkOkuma(e) {
    //   var okumaBirinci = screenX + " " + screenY
    //   //console.log(okumaBirinci);
    //   //sonuclar(koordinatlar_ilk)
    // }

    // tb2 = document.querySelector("#sidePanel");
    // tb2.addEventListener("mouseup", ikinciOkuma);
    // function ikinciOkuma(event) {
    //   var okumaIkinci = screenX
    //   console.log(okumaIkinci);
    //   //sonuclar(koordinatlar_iki)
    // }

    // function sonuclar (koordinatlar_ilk){
    //   console.log(koordinatlar_ilk)
    // }

    var createHotSpotNext = {
      type: "scene",
      sceneId: next_att_id,
      cssClass: "custom-hotspot-front",
    };

    var createHotSpotBack = {
      type: "scene",
      sceneId: back_att_id,
      cssClass: "custom-hotspot-back",
    };
    viewer.addHotSpot(createHotSpotNext);
    viewer.addHotSpot(createHotSpotBack);
    sceneChange();
  }
  // degerler();
  // function degerler(okumaBirinci,okumaIkinci) {
  //   tb = document.querySelector("#sidePanel");
  //   tb.addEventListener("mousedown", ilkOkuma);
  //   function ilkOkuma(e) {
  //     var okumaBirinci = ` x1 degeri: ${e.clientX}  `

  //     console.log(okumaBirinci);
  //     //degerler(okumaBirinci)

  //   }

  //   tb.addEventListener("mouseup", ikinciOkuma);
  //   function ikinciOkuma(event) {
  //     var okumaIkinci = ` x2 degeri: ${event.clientX}   `
  //     console.log(okumaIkinci);
  //     //degerler(okumaIkinci)
  //   }

  // }

  function getPointGraphic(degrees_final, origin_x, origin_y) {
    view.graphics.removeAll();
    viewer.on("mouseup", function (event) {
      yawPointGraphic = viewer.getYaw();
      var angle = yawPointGraphic + degrees_final;
      let link = "look1.png";
      //link.style.transform = "rotate(" + yaw + "deg)";

      // function rotateImage() {
      //   yaw = viewer.getYaw();
      //   var img = document.getElementById('bakisAcisi');
      //   img.style.transform = "rotate(" + yaw + "deg)";
      // }
      // rotateImage();

      var markerPoint = {
        type: "point",
        longitude: origin_x,
        latitude: origin_y,
      };

      var markerSymbol = {
        type: "picture-marker",
        url: link,
        width: "60px",
        height: "90px",
        angle: angle,
      };

      var pointGraphic = new Graphic({
        geometry: markerPoint,
        symbol: markerSymbol,
      });

      view.graphics.removeAll();

      view.graphics.add(pointGraphic);
    });
  }

  function sceneChange() {
    function sceneChangeListener() {
      const newScene = viewer.getScene();
      layerQuery(newScene);
      //layerQuery2(newScene);
      const newSceneNext = newScene + 1;
      const newSceneBack = newScene - 1;
      let sa = layerQuery(newSceneNext);
      // console.log(sa)

      const featureLayer = view.map.layers.getItemAt(0);
      view.whenLayerView(featureLayer).then(function (layerView) {
        if (highlight) {
          highlight.remove();
        }
        highlight = layerView.highlight(newScene);
      });

      getAttachmentsHs(featureLayer, newScene, newSceneNext, newSceneBack);
    }
    viewer.on("scenechange", sceneChangeListener);
  }

  async function getAttachmentsHs(
    featureLayer,
    newScene,
    newSceneNext,
    newSceneBack
  ) {
    const attachmentRes = await featureLayer.queryAttachments({
      objectIds: newScene,
    });
    const attachmentResN = await featureLayer.queryAttachments({
      objectIds: newSceneNext,
    });
    const attachmentResB = await featureLayer.queryAttachments({
      objectIds: newSceneBack,
    });

    attachments = attachmentRes[newScene];

    attachmentsNext = attachmentResN[newSceneNext];

    attachmentsBack = attachmentResB[newSceneBack];
    viewer.on("mousedown", function (event) {
      yaw = viewer.getYaw();
      pitch = viewer.getPitch();
      hfov = viewer.getHfov();
    });
    generateHs();
  }

  function generateHs(params) {
    attachments.forEach((attachment) => {
      panorama = attachment.url;
      att_id = attachment.parentObjectId;
    });
    attachmentsNext.forEach((attachment) => {
      panoramaNext = attachment.url;
      next_att_id = attachment.parentObjectId;
    });
    attachmentsBack.forEach((attachment) => {
      panoramaBack = attachment.url;
      back_att_id = attachment.parentObjectId;
    });

    viewer.addScene(next_att_id, {
      panorama: panoramaNext,
    });
    viewer.addScene(back_att_id, {
      panorama: panoramaBack,
    });

    var createHotSpotNextHs = {
      type: "scene",
      sceneId: next_att_id,
      cssClass: "custom-hotspot-front",
      targetYaw: yaw,
      targetPitch: pitch,
      targetHfov: hfov,
    };

    var createHotSpotBackHs = {
      type: "scene",
      sceneId: back_att_id,
      cssClass: "custom-hotspot-back",
      targetYaw: yaw,
      targetPitch: pitch,
      targetHfov: hfov,
    };
    viewer.on("mousedown", function (event) {
      yaw = viewer.getYaw();
      pitch = viewer.getPitch();
      hfov = viewer.getHfov();
      createHotSpotNextHs.targetYaw = yaw;
      createHotSpotNextHs.targetPitch = pitch;
      createHotSpotNextHs.targetHfov = hfov;
      createHotSpotBackHs.targetYaw = yaw;
      createHotSpotBackHs.targetPitch = pitch;
      createHotSpotBackHs.targetHfov = hfov;
    });
    viewer.addHotSpot(createHotSpotNextHs);
    viewer.addHotSpot(createHotSpotBackHs);
  }

  Split(["#viewDiv", "#sidePanel"], {
    gutterSize: 8,
    minSize: 300,
  });
});
