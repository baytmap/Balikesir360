require([
  "esri/views/MapView",
  "esri/WebMap",
  "esri/core/watchUtils",
  "esri/config",
  "esri/widgets/BasemapToggle",
  "esri/widgets/Search",
  "esri/Graphic",
], (
  MapView,
  WebMap,
  watchUtils,
  esriConfig,
  BasemapToggle,
  Search,
  Graphic,
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

  const searchWidget = new Search({
    view: view,
  });

  var basemapToggle = new BasemapToggle({
    view: view,
    nextBasemap: "satellite",
  });

  view.ui.add(searchWidget, {
    position: "top-right",
    index: 2,
  });

  view.ui.add(basemapToggle, {
    position: "bottom-left",
  });

  watchUtils.on(view, "map.layers", "change", () => {
    const featureLayer = view.map.layers.getItemAt(0);

    registerClickHandler(featureLayer);
  });
  function layerQuery(objectId) {
    const featureLayer = view.map.layers.getItemAt(0);
    const queryParams = featureLayer.createQuery();

    queryParams.where = "objectid=" + objectId;
    queryParams.outFields = ["x", "y", "z"];

    featureLayer.queryFeatures(queryParams).then(function (results) {
      const coords = results.features[0].attributes;
      getPointGraphic(coords);
    });
  }

  function registerClickHandler(featureLayer) {
    view.on("click", async (event) => {
      const point = view.toMap(event);
      const hitTestResult = await view.hitTest(event);
      const objectId = getObjectId(hitTestResult);
      const nextObjectID = objectId + 1;
      const backObjectID = objectId - 1;
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
      viewer.destroy();
    }
    viewer = pannellum.viewer("sidePanel", {
      type: "equirectangular",
      yaw: yaw,
      pitch: pitch,
      hfov: hfov,
      scenes: [],
    });

    viewer.addScene(att_id, {
      panorama: panorama,
      hotSpots: [],
    });

    viewer.loadScene(att_id);

    // viewer.on("mousedown", function (event) {
    //   yaw = viewer.getYaw();
    //   pitch = viewer.getPitch();
    //   hfov = viewer.getHfov();
        
     
    // });

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

  function getPointGraphic(coords) {
    view.graphics.removeAll();

    viewer.on("mouseup", function (event) {
      yawPointGraphic = viewer.getYaw();

      let link =
        "look1.png";

      var markerPoint = {
        type: "point",
        longitude: coords.x,
        latitude: coords.y,
      };

      var markerSymbol = {
        type: "picture-marker",
        url: link,
        width: "60px",
        height: "90px",
        angle: yawPointGraphic ,
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
      const newSceneNext = newScene + 1;
      const newSceneBack = newScene - 1;

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
