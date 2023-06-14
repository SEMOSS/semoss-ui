(function () {
    'use strict';
    angular.module('app.tap.dhmsm-deployment-map.directive', [])
        .directive('dhmsmDeploymentMap', dhmsmDeploymentMap);

    dhmsmDeploymentMap.$inject = ['$rootScope', '$compile', '$filter', '$timeout', 'esriMapService'];


    function dhmsmDeploymentMap($rootScope, $compile, $filter, $timeout, esriMapService) {

        DHMSMDeploymentMapCtrl.$inject = ['$scope'];
        return {
            restrict: 'A',
            require: ['chart', 'dhmsm-deployment'],
            bindToController: true,
            controllerAs: 'dhmsmMapCtrl',
            controller: DHMSMDeploymentMapCtrl,
            link: DHMSMDeploymentMapLink
        };

        function DHMSMDeploymentMapLink(scope, ele, attrs, ctrls) {
            scope.chartCtrl = ctrls[0];
            scope.dhmsmController = ctrls[1];
            scope.chartCtrl.showMapToggle = true;

            //set default variables used
            var visualizationData = {},
                pointTemplate = {
                    "geometry": {
                        "spatialReference": {"wkid": 4326}
                    },
                    "attributes": {},
                    "symbol": {
                        "color": [0, 0, 0, 0],
                        "size": 8,
                        "angle": 0,
                        "xoffset": 0,
                        "yoffset": 0,
                        "type": "esriSMS",
                        "style": "esriSMSCircle",
                        "outline": {
                            "color": [0, 0, 0, 0],
                            "width": 1,
                            "type": "esriSLS",
                            "style": "esriSLSSolid"
                        }
                    }
                },
                highlightSymbol = {},
                notStartedColor = [217, 83, 79, 255], //r, g, b, a
                inProgressColor = [240, 173, 78, 255],
                decomissionedColor = [92, 184, 92, 255],
                esriIsLoaded = false;

            var html = '<div ng-show=\"chartCtrl.showMapToggle\" id="resizerRight" class="sidebarContentRight dhmsm-resizer">' + 
                           '<div class="timeline-sidebar-title text-center">' + 
                               'DHMSM Deployment Map' + 
                            '</div>' + 
                            '<div id="resizerRightMap-' + '" style="position:absolute;top:31px;bottom:0px;left:0px;right:0px"></div>' + 
                        '</div>';

            ele.append($compile(html)(scope));

            d3.select("#resizerRightMap-").append("div")
                .attr("id", "mapId-")
                .style("height", "100%")
                .style("width", "100%");

            scope.$watch('dhmsmController.visualizationData', function () {
                if (!_.isEmpty(scope.dhmsmController.visualizationData)) {
                    //set the map data via update, set system and site analysis data via the response....this is a cumbersome payload and needs to be revisited
                    visualizationData = scope.dhmsmController.visualizationData;
                    if (!esriIsLoaded)
                        esriMapService.bootstrap({
                            url: '//js.arcgis.com/3.16'
                        }).then(function () {
                            esriMapService.requireModule(['esri/map',
                                                      'esri/toolbars/draw',
                                                      'esri/tasks/geometry',
                                                      'esri/dijit/Scalebar',
                                                       'esri/dijit/Search'], function () {
                                update(scope.dhmsmController.visualizationData, true);                                       
                                esriIsLoaded = true;
                            });
                        });
                    else {
                        update(scope.dhmsmController.visualizationData, true);
                    }
                }
            });

            //format the dataString for the geo map
            var geoDataRefresh = function (year, dataString) {
                var dataGeo = [];
                for (var site in dataString[year].site) {
                    dataGeo.push({
                        'site': site,
                        'lat': dataString[year].site[site].Lat,
                        'lon': dataString[year].site[site].Long,
                        'Status': dataString[year].site[site].Status,
                        'Total Site Cost': dataString[year].site[site]['TCostSite'],
                        "Systems": dataString[year].site[site]['SystemForSite']
                    });
                }
                return dataGeo;
            };

            function update(mapData, initializeTable) {
                highlightSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                        new esri.Color([255, 0, 0]), 3), new esri.Color([125, 125, 125, 0.35]));
                //format the appropriate data for the geo map
                var dataGeo = geoDataRefresh(scope.dhmsmController.selectedYear, mapData.data);
                //create map instance
                scope.createMap();
                //populate the map with data
                renderGeoMap(dataGeo);
            }

            function renderGeoMap(dataGeo) {
                var newMapData = [];
                //parse Geo Data....use the template and colors to create the layer
                for (var i = 0; i < dataGeo.length; i++) {
                    var mapPoint = {};
                    var pointObject = JSON.parse(JSON.stringify(pointTemplate));
                    pointObject.geometry.x = dataGeo[i]['lon'];
                    pointObject.geometry.y = dataGeo[i]['lat'];
                    pointObject.attributes.XCoord = dataGeo[i]['lon'];
                    pointObject.attributes.YCoord = dataGeo[i]['lat'];
                    pointObject.attributes.siteName = dataGeo[i]['site'];
                    pointObject.attributes.totalSavings = numberWithCommas(dataGeo[i]['Total Site Cost']);

                    //testing adding system list to tooltip.  Need to find a faster way to do this other than string manipulation...
                    /*var sysList = _.keys(dataGeo[i]['Systems']);
                     var displayList = "";
                     for (var i = 0; i < sysList.length; i++) {
                     if (i == sysList.length - 1) {
                     displayList = displayList + sysList[i] + ".";
                     } else {
                     displayList = displayList + sysList[i] + ", ";
                     }
                     }
                     pointObject.attributes.systemList = displayList;*/

                    //change the color based on the status of each data point
                    if (dataGeo[i]['Status'] === "Not Started") {
                        pointObject.symbol.color = notStartedColor;
                    }
                    else if (dataGeo[i]['Status'] === "In Progress") {
                        pointObject.symbol.color = inProgressColor;
                    }
                    else if (dataGeo[i]['Status'] === "Decommissioned") {
                        pointObject.symbol.color = decomissionedColor;
                    }

                    var infoTemplate = new esri.InfoTemplate();
                    var content = "Total Savings: $${totalSavings}<br/>";//Systems: ${systemList}";

                    infoTemplate.setTitle($filter('replaceUnderscores')(dataGeo[i]['site']));
                    infoTemplate.setContent(content);

                    mapPoint = new esri.Graphic(pointObject);
                    mapPoint.setInfoTemplate(infoTemplate);

                    newMapData.push(mapPoint);
                }
                scope.addGraphics(newMapData);
            };

            //Creates the map instance
            scope.createMap = function () {
                //clear out old map instance if it exists
                if (scope.map)
                    scope.map.destroy();

                var options = {
                    center: attrs.center ? JSON.parse(attrs.center) : [-97.741, 38.050],
                    zoom: attrs.zoom ? parseInt(attrs.zoom) : 3,
                    basemap: attrs.basemap ? attrs.basemap : 'streets'
                };

                scope.map = new esri.Map('mapId-', options);
            };

            //Adds graphics layer to the base map
            scope.addGraphics = function (mapData) {
                if (scope.map.graphicsLayerIds.length === 0) {
                    scope.graphicsLayer = new esri.layers.GraphicsLayer();
                }
                scope.graphicsLayer.clear();

                for (var i = 0; i < mapData.length; i++) {
                    scope.graphicsLayer.add(mapData[i]);
                }

                //scope.graphicsLayer.on("dbl-click", uriSend);
                scope.graphicsLayer.on("mouse-over", function (event) {
                    var graphic = event.graphic;
                    scope.map.infoWindow.setContent(graphic.getContent());
                    scope.map.infoWindow.setTitle(graphic.getTitle());
                    var highlightGraphic = new esri.Graphic(graphic.geometry, highlightSymbol);
                    scope.map.graphics.add(highlightGraphic);
                    scope.map.infoWindow.show(event.screenPoint,
                        scope.map.getInfoWindowAnchor(event.screenPoint));
                });

                scope.map.on('load', function () {
                    scope.map.disableDoubleClickZoom();
                    scope.map.addLayer(scope.graphicsLayer);
                    scope.map.graphics.enableMouseEvents();
                });

                scope.graphicsLayer.on("mouse-out", function () {
                    scope.map.graphics.clear();
                    scope.map.infoWindow.hide();
                });
            };            

            d3.select(window).on("resize.map", resize);

            //resizing
            var resizeCleanUpFunc = $rootScope.$on('resize-viz', function () {
                if ($("." + scope.chartCtrl.containerClass).length > 0) {
                    $timeout(function () {
                        resize();
                    }, 350);
                }
            });

            function resize() {
                scope.map.resize();
            }

            //formats numbers for the grid
            function numberWithCommas(x) {
                var parts = x.toString().split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                return parts.join(".");
            }

            //called when the slider value changes
            scope.dhmsmController.updateYear = function (year) {
                var dataGeo = geoDataRefresh(year, scope.dhmsmCtrl.visualizationData.data);
                //update geo map with new data.....
                renderGeoMap(dataGeo);
            };

            //Sets the base layer of the map from selection
            scope.dhmsmController.setBaseMapLayer = function (baseMap) {
                if (baseMap !== "") {
                    scope.map.setBasemap(baseMap);
                }
            };

            scope.$on('$destroy', function deploymentMapDestroyer() {
                d3.select(window).on("resize.map", null);
                resizeCleanUpFunc();
            });
        }

        function DHMSMDeploymentMapCtrl($scope) {

        }

    }

})(); //end of controller IIFE
