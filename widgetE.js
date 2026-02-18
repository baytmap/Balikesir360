require([
    "esri/views/MapView",
    "esri/WebMap",
    "esri/core/watchUtils",
    "esri/config",
    "esri/widgets/BasemapToggle",
    "esri/widgets/Search",
    "esri/Graphic",
    "esri/widgets/Editor",
    "esri/widgets/support/SnappingControls",
    "esri/widgets/Expand",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Locate",
    "esri/widgets/Bookmarks",
    "esri/widgets/TimeSlider",
    "esri/widgets/Legend",
    // "esri/widgets/Editor"
    "esri/widgets/Measurement",
    "esri/widgets/LayerList",
    "esri/widgets/DistanceMeasurement2D",
    "esri/widgets/AreaMeasurement2D",
    "esri/layers/FeatureLayer",
    "esri/Map",
    'esri/core/reactiveUtils'
], (
    MapView,
    WebMap,
    watchUtils,
    esriConfig,
    BasemapToggle,
    Search,
    Graphic,
    Editor,
    SnappingControls,
    Expand,
    BasemapGallery,
    Locate,
    Bookmarks,
    TimeSlider,
    Legend,
    // Editor
    Measurement,
    LayerList,
    DistanceMeasurement2D,
    AreaMeasurement2D,
    FeatureLayer,
    Map,
    reactiveUtils,
) => {
    
      
    const editor = new Editor({
        view: view,
        allowedWorkflows: ["create-features", "update"],
        deleteEnabled: false,
        // snappingOptions: {
        //     enabled: false // Snap özelliği kapatıldı
        //   }
    });
    const editorE = new Expand({
        view: viewE,
        content: editor,
        expanded: false,
    });
    view.ui.add(editor, "bottom-left");
    var editDiv = document.getElementById("editDiv");
        editDiv.appendChild(editor.container);

        var searchWidget = new Search({
            view: view,
            searchAllEnabled: true,
            sources: [{
                url: "https://geolabmapps.com/server/rest/services/Erzurumyapi_locv1/GeocodeServer",
                outFields: ["Addr_type"],
                singleLineFieldName: "Address",
                name: "Erzurum Yapı Coğrafi Kodlama Servisi",
                placeholder: "Bina kimlik no girin",
                countryCode: "TR",
                outFields: ["*"],
                maxResults: 6,
                maxSuggestions: 6,
                suggestionsEnabled: true,
                minSuggestCharacters: 0
    
            }]
        });
    view.ui.add(searchWidget, {
        position: "top-right",
        index: 2,
    });
    const basemapGallery = new BasemapGallery({
        view: view,
    });

    const bgExpand = new Expand({
        view: view,
        content: basemapGallery
    });


    view.ui.add(bgExpand, "bottom-right");
    const locateBtn = new Locate({
        view: view
    });

    view.ui.add(locateBtn, "bottom-right");

    // const bookmarks = new Bookmarks({
    //     view: view,
    //     // allows bookmarks to be added, edited, or deleted
    //     editingEnabled: true,
    //     visibleElements: {
    //         time: false // don't show the time (h:m:s) next to the date
    //     }
    // });

    // const bkExpand = new Expand({
    //     view: view,
    //     content: bookmarks,
    //     expanded: false
    // })


    const mDistance = new DistanceMeasurement2D({
        view: view
    });
    const mDistanceE = new Expand({
        view: view,
        content: mDistance,
        expanded: false,
    });
    view.ui.add(mDistanceE, "top-left");

    const mArea = new AreaMeasurement2D({
        view: view
    });


    const mAreaE = new Expand({
        view: view,
        content: mArea,
        expanded: false,
    });

    view.ui.add(mAreaE, "top-left");

    // view.ui.add(bkExpand, "top-left");
    // Add the widget to the top-right corner of the view


    const legend = new Legend({
        view: view,
        style: "card"
    });
    view.ui.add(new Expand({ view, content: legend }), "top-left");

    editor.on("activeWorkbenchChanged", function (event) {
        if (event.activeWorkbench === "editing") {
            featureLayer.editable = false;
        }
    });

    const layerList = new LayerList({
        view: view
    });

    const layerListE = new Expand({
        view: view,
        content: layerList,
        expanded: false,
    });

    view.ui.add(layerListE, "top-right");
});