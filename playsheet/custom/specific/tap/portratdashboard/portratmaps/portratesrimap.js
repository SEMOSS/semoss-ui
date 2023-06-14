(function () {
    'use strict';

    angular.module("app.tap.portratesrimap", [])
        .directive("portRatEsriMap", portRatEsriMap);

    portRatEsriMap.$inject = ["$rootScope", "$timeout", "$filter", "utilityService", "$compile", "esriMapService"];

    function portRatEsriMap($rootScope, $timeout, $filter, utilityService, $compile, esriMapService) {

        EsriMapLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        EsriMapCtrl.$inject = ["$rootScope", "$scope", "$attrs"];

        return {
            restrict: 'A',
            require: ['^portratchart'],
            link: EsriMapLink,
            bindToController: true,
            controller: EsriMapCtrl,
            controllerAs: 'esrimapCtrl',
            priority: 300
        };

        function EsriMapLink(scope, ele, attrs, ctrls) {
            var resizeTimer, timer;
            scope.chartController = ctrls[0];
            scope.esrimapCtrl.selectedNode = {};

            /* var mapHeight = scope.chartController.container.height + 27 + 'px';
             ele.append('<div id="esrimap"><div id="mapId-' + scope.chartController.uniqueId + '" style="height: ' + mapHeight + ';"></div></div>');*/

            //inserting div to allow to bind
            var html = '<div class="append-viz" style="overflow:hidden!important" id=' + scope.chartController.chart + "-append-viz" + ' ng-class=\"{\'viz-hide\': chartController.isTableShown, \'viz-show\': !chartController.isTableShown}\"><div id=' + scope.chartController.chart + '></div></div>';
            ele.append($compile(html)(scope));

            scope.esrimapCtrl.radiusEnabled = false;

            var dataArray = [],
                map,
                draw,
                scaleBar,
                geometryService,
                linesLayer,
                DEFAULT_RADIUS = 8,
                MIN_RADIUS = 5,
                MAX_RADIUS = 40,
                radius = [],
                normalizedRadiusValues = [],
                maxDataRadius = 0,
                minDataRadius = 0,
                minHeatValue = 0,
                maxHeatValue = 0,
                heatEnabled = false,
                heatEnabled = false,
                heatScale,
                localChartData = {},
                dataString = {
                    data: [],
                    dataTableAlign: {}
                },
                mapContainer = {
                    width: 0,
                    height: 0
                },
                pointTemplate = {
                    "geometry": {
                        "spatialReference": {"wkid": 4326}
                    },
                    "attributes": {},
                    "symbol": {
                        "color": [255, 0, 0, 128],
                        "size": DEFAULT_RADIUS,
                        "angle": 0,
                        "xoffset": 0,
                        "yoffset": 0,
                        "type": "esriSMS",
                        "style": "esriSMSCircle",
                        "outline": {
                            "color": [255, 0, 0, 255],
                            "width": 1,
                            "type": "esriSLS",
                            "style": "esriSLSSolid"
                        }
                    }
                },
                lineSymbol = {},
                esriIsLoaded = false;

            scope.viz = {};
            scope.selectedLayer = {
                selected: ""
            };

            //widget functions
            scope.chartController.dataProcessor = function (newData) {
                if (!esriIsLoaded) {
                    esriMapService.bootstrap({
                        url: '//js.arcgis.com/3.16'
                    }).then(function () {
                        esriMapService.requireModule(['esri/map',
                                                      'esri/toolbars/draw',
                                                      'esri/tasks/geometry',
                                                      'esri/dijit/Scalebar',
                                                       'esri/dijit/Search'], function () {
                                processData(newData);
                                esriIsLoaded = true;
                            });
                        });
                } else {
                    processData(newData);
                }

                function processData(newData) {
                    lineSymbol = new esri.symbol.CartographicLineSymbol(esri.symbol.CartographicLineSymbol.STYLE_SOLID,
                        new esri.Color([255, 0, 0, 0.5]), 5,
                        esri.symbol.CartographicLineSymbol.CAP_ROUND,
                        esri.symbol.CartographicLineSymbol.JOIN_MITER, 5
                    );
                    radius = [];
                    normalizedRadiusValues = [];
                    //set the tableData properly, this is sent to the smss-table directive
                    //scope.chartController.tableData = utilityService.formatTableData(scope.chartController.data.headers, scope.chartController.data.data, true);

                    //make a copy so anytime we change the data, it doesn't update table directive

                    //Radius normalization
                    scope.esrimapCtrl.radiusEnabled = false;

                    if ((newData.dataTableAlign.size != '') && !isNaN(newData.data[0][newData.dataTableAlign.size])) {
                        scope.esrimapCtrl.radiusEnabled = true;
                    }

                    //get the max & min radius from the data set
                    if (scope.esrimapCtrl.radiusEnabled) {
                        //create an array of radii based on the data
                        for (var i = 0; i < newData.data.length; i++) {
                            radius.push(newData.data[i][newData.dataTableAlign.size]);
                        }
                        //set the min and max based on the radius array
                        maxDataRadius = _.max(radius);
                        minDataRadius = _.min(radius);
                        var radiusRange = maxDataRadius - minDataRadius;
                        var mapRadiusRange = MAX_RADIUS - MIN_RADIUS;

                        for (var j = 0; j < radius.length; j++) {
                            normalizedRadiusValues[j] = (((radius[j] - minDataRadius) / radiusRange) * mapRadiusRange) + MIN_RADIUS;
                        }
                    }

                    for (var i = 0; i < newData.data.length; i++) {
                        if (scope.esrimapCtrl.radiusEnabled) {
                            radius[i] = (radius[i] / maxDataRadius) * DEFAULT_RADIUS;
                        }
                        else radius[i] = DEFAULT_RADIUS;
                    }
                    //end radius normalization

                    if ((newData.dataTableAlign.heat != '') && !isNaN(newData.data[0][newData.dataTableAlign.heat]))
                        heatEnabled = true;

                    if (heatEnabled) {
                        var heatValues = [];
                        //create an array of radii based on the data
                        for (var i = 0; i < newData.data.length; i++) {
                            heatValues.push(newData.data[i][newData.dataTableAlign.heat]);
                        }
                        //set the min and max based on the radius array
                        maxHeatValue = _.max(heatValues);
                        minHeatValue = _.min(heatValues);
                    }

                    scope.chartController.tableData = JSON.parse(JSON.stringify(newData));
                    localChartData = JSON.parse(JSON.stringify(newData));
                    localChartData.keys = _.values(newData.dataTableAlign);

                    update(normalizedRadiusValues);
                }
            };

            scope.chartController.highlightSelectedItem = function (item) {
                scope.esrimapCtrl.paintSelectedItem(item);
            };

            scope.esrimapCtrl.paintSelectedItem = function (item) {
                //get all the points from the first graphics layer
                var points = scope.map.getLayer(scope.map.graphicsLayerIds[0]).graphics;
                for (var index in points) {
                    if (item[0].uri === points[index].attributes.URI) { //URI matches the item
                        points[index].symbol.outline.color = [0, 0, 0, 255];
                        points[index].symbol.outline.width = 2.5;                        
                        //manipulate dom to move the svg to front of screen
                        points[index].getNode().parentElement.appendChild(points[index].getNode());
                    } else { //paint the circle red
                        points[index].symbol.outline.color = [255, 0, 0, 255];
                        points[index].symbol.outline.width = 1.3333333333333333;
                    }
                };
                //refresh the layer so the change will display
                scope.map.getLayer(scope.map.graphicsLayerIds[0]).refresh();
            };

            scope.chartController.filterAction = function () {
                //console.log('Need to Add Filtering Viz Feature')
            };

            scope.chartController.resizeViz = function () {
                scope.chartController.containerSize(scope.chartController.containerClass, scope.chartController.container, scope.chartController.margin);
                var newMapHeight = scope.chartController.container.height + 'px';
                d3.select("#" + scope.chartController.chart)
                    .style('height', newMapHeight);
                scope.map.resize();
                scope.map.reposition();
            };

            function update(normalizedRadiusValues) {
                //split up the dataString appropriately and create an Array to send to the addGraphics method
                var dataStream = localChartData.data;
                var dataTableAlign = localChartData.dataTableAlign;
                var dataArray = [];

                if (heatEnabled) {
                    heatScale = new Rainbow();
                    if (minHeatValue === maxHeatValue)
                        maxHeatValue = maxHeatValue + 1;
                    heatScale.setNumberRange(minHeatValue, maxHeatValue);
                    //colorsTraffic = ["#ae0e06", "#ae0e06", "#ae0e06", "#e92e10", "#e92e10", "#fb741e", "#fb741e", "#fdc63f", "#fdc63f", "#ffff57", "#ffff57", "#ffff57", "#5cba24", "#5cba24", "#1e8b1f", "#1e8b1f", "#1e8b1f", "#1e8b1f", "#1e8b1f", "#005715", "#005715", "#005715"],
                    //heatDBbase = ['#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'];
                    //heatScale.setSpectrum("#ae0e06", "#ae0e06", "#ae0e06", "#e92e10", "#e92e10", "#fb741e", "#fb741e", "#fdc63f", "#fdc63f", "#ffff57", "#ffff57", "#ffff57", "#5cba24", "#5cba24", "#1e8b1f", "#1e8b1f", "#1e8b1f", "#1e8b1f", "#1e8b1f", "#005715", "#005715", "#005715");
                    heatScale.setSpectrum("#d84b2a", "#ee9586", "#e4b7b2", "#beccae", "#9caf84", "#7aa25c");
                }

                //loop through the data and create a mapPoint Object for each map point
                for (var i = 0; i < dataStream.length; i++) {
                    var pointObject = {},
                        mapPoint = {};
                    //copy the template and assign unique values
                    pointObject = JSON.parse(JSON.stringify(pointTemplate));
                    pointObject.geometry.x = dataStream[i][dataTableAlign.lon];
                    pointObject.geometry.y = dataStream[i][dataTableAlign.lat];
                    pointObject.attributes.XCoord = dataStream[i][dataTableAlign.lon];
                    pointObject.attributes.YCoord = dataStream[i][dataTableAlign.lat];
                    pointObject.attributes.URI = dataStream[i][dataTableAlign.label];

                    //set the infoTemplate and the content for displaying on the ESRI tooltip
                    var infoTemplate = new esri.InfoTemplate();
                    var content = "Latitude: ${YCoord}<br/>Longitude: ${XCoord}<br/>";

                    //radius sizing
                    if (scope.esrimapCtrl.radiusEnabled) {
                        pointObject.symbol.size = normalizedRadiusValues[i];
                        pointObject.attributes.Size = dataStream[i][dataTableAlign.size];
                        content = content + $filter('replaceUnderscores')(dataTableAlign.size) + ": ${Size}<br/>"
                    }

                    if (heatEnabled) {
                        var rgb = d3.rgb("#" + heatScale.colourAt(dataStream[i][dataTableAlign.heat]));
                        var rgba = {r: rgb.r, g: rgb.g, b: rgb.b, a: 0.75};
                        pointObject.symbol.color = rgba;

                        pointObject.attributes.Heat = dataStream[i][dataTableAlign.heat];
                        content = content + $filter('replaceUnderscores')(dataTableAlign.heat) + ": ${Heat}<br/>"
                    }

                    //set title and content of infoTemplate (tooltip)
                    infoTemplate.setTitle($filter('replaceUnderscores')($filter('shortenAndReplaceUnderscores')(dataStream[i][dataTableAlign.label])));
                    infoTemplate.setContent(content);

                    //create a new esri graphic for the point object
                    mapPoint = new esri.Graphic(pointObject);
                    mapPoint.setInfoTemplate(infoTemplate);

                    //send the point to the graphics data Array
                    dataArray.push(mapPoint);
                }

                scope.createMap();
                scope.addGraphics(dataArray);
                timer = $timeout(function () {
                    scope.chartController.resizeViz();
                }, 350);
            }

            //Creates the map instance
            scope.createMap = function () {
                //clear out old map instance if it exists (for reloading)
                if (scope.map) {
                    scope.map.destroy();
                    scaleBar.destroy();
                }

                /*var latArray = _.pluck(localChartData.data, localChartData.dataTableAlign.lat);
                var sum = 0;
                for (var i = 0; i < latArray.length; i++) {
                    sum += latArray[i];
                }
                var latAverage = sum / latArray.length;

                var lonArray = _.pluck(localChartData.data, localChartData.dataTableAlign.lon);
                var sum = 0;
                for (var i = 0; i < lonArray.length; i++) {
                    sum += lonArray[i];
                }
                var lonAverage = sum / lonArray.length;
*/
                //the config object for the map - set the properties accordingly here
                var options = {
                    center: attrs.center ? JSON.parse(attrs.center) : [-56.049, 38.485], //[lonAverage, latAverage],
                    zoom: attrs.zoom ? parseInt(attrs.zoom) : 10,
                    basemap: attrs.basemap ? attrs.basemap : 'streets',
                    minZoom: 3,
                    fadeOnZoom: true
                };

                scope.map = new esri.Map(scope.chartController.chart, options);

                scaleBar = new esri.dijit.Scalebar({
                    map: scope.map,
                    scalebarUnit: "dual",
                    attachTo: "bottom-left"
                });

                //|| _.isEmpty(d3.select('.arcgis-search')[0][0])
                //!_.isEmpty(d3.select('#esriMapSearch-' + scope.uniqueId)[0][0])
                //need to find a way to check and see if the search is registered to the id before it is created on the map
                if (scope.s) {
                    scope.s = new esri.dijit.Search({
                        map: scope.map
                    }, "esriMapSearch-" + scope.chartController.chart);
                    scope.s.startup();
                }
            };

            //Adds graphics layer to the base map
            scope.addGraphics = function (mapData) {
                var graphicsLayer = new esri.layers.GraphicsLayer();

                for (var i = 0; i < mapData.length; i++) {
                    graphicsLayer.add(mapData[i]);
                }
                //set mouse events for points on the graphics layer
                graphicsLayer.on("dbl-click", function (event) {                    
                    //manipulate dom to move the svg to front of screen
                    event.toElement.parentElement.appendChild(event.toElement);

                    var item = [{
                        uri: event.graphic.attributes.URI,
                        name: localChartData.dataTableAlign.label
                    }];

                    scope.esrimapCtrl.selectedNode = item;
                    scope.chartController.highlightSelectedItem(item);
                });
                graphicsLayer.on("mouse-over", function (event) {
                    event.toElement.parentElement.appendChild(event.toElement);
                    //tooltip and highlighting for mouse-overing a point
                    var graphic = event.graphic;
                    scope.map.infoWindow.setContent(graphic.getContent());
                    scope.map.infoWindow.setTitle(graphic.getTitle());
                    scope.map.infoWindow.show(event.screenPoint,
                        scope.map.getInfoWindowAnchor(event.screenPoint));
                })

                //disable double click zoom for related insights, add the new graphics layer with all the points to the base map
                scope.map.on('load', function () {
                    scope.map.disableDoubleClickZoom();
                    scope.map.addLayer(graphicsLayer);
                    scope.map.graphics.enableMouseEvents();
                    scope.initDrawing();

                    /*Scalebar*/
                    d3.select('.esrimap-scalebar').remove();

                    var esriMapLegend = d3.select('#' + scope.chartController.chart).append('div')
                        .attr('class', 'esrimap-scalebar');

                    var title = esriMapLegend.append('div')
                        .attr('class', 'esrimap-scalebar-title').text("Distance: " + 0 + "mi");
                    var bar = esriMapLegend.append('hr')
                        .attr('class', 'esrimap-legend-bar');
                    var content = esriMapLegend.append('div')
                        .attr('class', 'esrimap-legend-content');

                    var legendContainer = content.append('svg')
                        .attr('width', 235)
                        .attr('height', 100);
                    /*/Scalebar*/

                    if (scope.esrimapCtrl.radiusEnabled)
                        scope.esrimapCtrl.createSizeLegend();
                    if (heatEnabled)
                        createHeatLegend();
                });

                //clear tooltip and highlight on mouse out
                graphicsLayer.on("mouse-out", function () {
                    scope.map.graphics.clear();
                    scope.map.infoWindow.hide();
                });
            };

            scope.createSizeLegend = function () {
                d3.select('.esrimap-legend').remove();

                var esriMapLegend = d3.select('#' + scope.chartController.chart).append('div')
                    .attr('class', 'esrimap-legend');

                if (heatEnabled) {
                    esriMapLegend.style('bottom', '14.5em');
                }
                var title = esriMapLegend.append('div')
                    .attr('class', 'esrimap-legend-title').text($filter('shortenValueFilter')($filter('replaceUnderscores')(localChartData.dataTableAlign.size)));
                var bar = esriMapLegend.append('hr')
                    .attr('class', 'esrimap-legend-bar');
                var content = esriMapLegend.append('div')
                    .attr('class', 'esrimap-legend-content');

                var legendContainer = content.append('svg')
                    .attr('width', 235)
                    .attr('height', 100);

                var sizeLegendGroup = legendContainer.append('g')
                    .attr('id', 'sizelegend')
                    .attr('transform', 'translate(' + 185 + ',' + 30 + ')');

                var sizes = sizeLegendGroup
                    .append('g')
                    .selectAll('.size-legend')
                    .data([3.2, 17, 26])
                    .enter()
                    .append('circle')
                    .attr('fill', 'transparent')
                    .attr('stroke-width', 1)
                    .attr('stroke', '#555')
                    .attr('r', function (d) {
                        return d;
                    })
                    .attr('cx', function (d, i) {
                        if (i == 1)
                            return -85;
                        if (i == 2)
                            return 0;
                        else return -155;
                    })
                    .attr('cy', 25);

                sizeLegendGroup.append('text')
                    .text(minDataRadius)
                    .attr('text-anchor', 'middle')
                    .attr('y', 65)
                    .attr('x', -155);

                sizeLegendGroup.append('text')
                    .text(Math.round(0.60 * (maxDataRadius + minDataRadius)))
                    .attr('text-anchor', 'middle')
                    .attr('y', 65)
                    .attr('x', -85);

                sizeLegendGroup.append('text')
                    .text(maxDataRadius)
                    .attr('text-anchor', 'middle')
                    .attr('y', 65)
                    .attr('x', 0);
            }

            function createHeatLegend() {
                d3.select('.esrimap-heatlegend').remove();

                var esriMapHeatLegend = d3.select('#' + scope.chartController.chart).append('div')
                    .attr('class', 'esrimap-heatlegend');
                var title = esriMapHeatLegend.append('div')
                    .attr('class', 'esrimap-legend-title').text($filter('shortenValueFilter')($filter('replaceUnderscores')(localChartData.dataTableAlign.heat)));
                var bar = esriMapHeatLegend.append('hr')
                    .attr('class', 'esrimap-legend-bar');
                var content = esriMapHeatLegend.append('div')
                    .attr('class', 'esrimap-legend-content');

                var legendContainer = content.append('svg')
                    .attr('width', 235)
                    .attr('height', 100);

                var container = {
                    'width': 650,
                    'height': -60
                };

                var heatlegendcolor = new Rainbow();
                heatlegendcolor.setNumberRange(0, 99);
                //traffic light
                //heatlegendcolor.setSpectrum("#ae0e06", "#ae0e06", "#ae0e06", "#e92e10", "#e92e10", "#fb741e", "#fb741e", "#fdc63f", "#fdc63f", "#ffff57", "#ffff57", "#ffff57", "#5cba24", "#5cba24", "#1e8b1f", "#1e8b1f", "#1e8b1f", "#1e8b1f", "#1e8b1f", "#005715", "#005715", "#005715");
                //percentage change
                heatlegendcolor.setSpectrum("#d84b2a", "#ee9586", "#e4b7b2", "#beccae", "#9caf84", "#7aa25c");

                var heatlegendcolorarray = [];
                for (var i = 0; i <= 99; i++) {
                    heatlegendcolorarray.push('#' + heatlegendcolor.colourAt(i));
                }

                var heatLegendGroup = legendContainer.append('g')
                    .attr('id', 'heatlegend')
                    .attr('transform', 'translate(' + 0 + ',' + (container.height + 30) + ')');

                heatLegendGroup.append('text')
                    .text(Math.round(minHeatValue))
                    .attr('text-anchor', 'middle')
                    .attr('y', 70)
                    .attr('x', 0 * 0.30 * container.width + 20);

                heatLegendGroup.append('text')
                    .text(Math.round(maxHeatValue) - Math.round((maxHeatValue - minHeatValue) * 0.80))
                    .attr('text-anchor', 'middle')
                    .attr('y', 70)
                    .attr('x', 0.20 * 0.30 * container.width + 20);

                heatLegendGroup.append('text')
                    .text(Math.round(maxHeatValue) - Math.round((maxHeatValue - minHeatValue) * 0.60))
                    .attr('text-anchor', 'middle')
                    .attr('y', 70)
                    .attr('x', 0.40 * 0.30 * container.width + 20);

                heatLegendGroup.append('text')
                    .text(Math.round(maxHeatValue) - Math.round((maxHeatValue - minHeatValue) * 0.40))
                    .attr('text-anchor', 'middle')
                    .attr('y', 70)
                    .attr('x', 0.60 * 0.30 * container.width + 20);

                heatLegendGroup.append('text')
                    .text(Math.round(maxHeatValue) - Math.round((maxHeatValue - minHeatValue) * 0.20))
                    .attr('text-anchor', 'middle')
                    .attr('y', 70)
                    .attr('x', 0.80 * 0.30 * container.width + 20);

                heatLegendGroup.append('text')
                    .text(Math.round(maxHeatValue))
                    .attr('text-anchor', 'start')
                    .attr('y', 70)
                    .attr('x', 0.30 * container.width + 10);

                var heatlegendcolorwidth = 0.30 * container.width / heatlegendcolorarray.length;

                var heatLegendcolor = heatLegendGroup
                    .append('g')
                    .selectAll('.heat-legend-color')
                    .data(heatlegendcolorarray)
                    .enter()
                    .append('g');

                var heatLegendcolors = heatLegendcolor.append('rect')
                    .attr('width', heatlegendcolorwidth)
                    .attr('height', 10)
                    .attr('fill', function (d, i) {
                        return heatlegendcolorarray[i];
                    })
                    .attr('x', function (d, i) {
                        return i * heatlegendcolorwidth + 20;
                    })
                    .attr('y', 40);
            }

            //Sets the base layer of the map from selection
            scope.setBaseMap = function (baseMap) {
                if (baseMap != "") {
                    scope.map.setBasemap(baseMap);
                }
            };

            scope.setBaseLayer = function () {
                //scope.selectedLayer.selected = toolService.getMapBaseLayer();
                scope.setBaseMap(scope.selectedLayer.selected);
            };

            //Initializes the drawing functionality
            scope.initDrawing = function () {
                linesLayer = new esri.layers.GraphicsLayer();
                scope.map.addLayer(linesLayer);
                draw = new esri.toolbars.Draw(scope.map);
                geometryService = new esri.tasks.GeometryService("https://sampleserver6.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
                //geometryService.on("onLengthsComplete", outputDistance);
                dojo.connect(geometryService, "onLengthsComplete", outputDistance);
                draw.on("draw-end", addLine);
            };

            //called from the esri map tools, activates the draw functionality on the map
            scope.toggleDrawLine = function (drawMode) {
                if (drawMode) {
                    scope.map.disableMapNavigation();
                    draw.activate("line");
                } else {
                    //turn on navigation mode
                    scope.map.enableMapNavigation();
                    scope.map.disableDoubleClickZoom();
                    //deactivate drawing mode
                    draw.deactivate();
                }
            };

            //adds the line graphic to the map
            function addLine (evt) {
                //set up and configure the length params for measurement
                var lengthParams = new esri.tasks.LengthsParameters();
                lengthParams.polylines = [evt.geometry];
                lengthParams.lengthUnit = esri.tasks.GeometryService.UNIT_STATUTE_MILE;
                lengthParams.geodesic = true;
                geometryService.lengths(lengthParams);
                //add the line              
                linesLayer.add(new esri.Graphic(evt.geometry, lineSymbol));
            };

            function outputDistance(result) {
                d3.select('.esrimap-scalebar-title').text("Distance: " + Math.round(result.lengths[0] * 100) / 100 + "mi");
            };

            scope.clearDrawings = function () {
                //clear lines layer
                linesLayer.clear();
                //reset distance label
                d3.select('.esrimap-scalebar-title').text("Distance: " + 0 + "mi");
            };

            //when directive ends, make sure to clean out all $on watchers
            scope.$on("$destroy", function esriMapDestroyer() {
                $timeout.cancel(timer);
            });
        }

        function EsriMapCtrl($rootScope, $scope, $attrs) {
            this.radiusEnabled = false;

            this.layers = {
                "Street Layer": "streets",
                "Topographic Layer": "topo",
                "Satellite Layer": "satellite",
                "Hybrid Layer": "hybrid",
                "Gray Layer": "gray",
                "National Geographic": "national-geographic",
                "Terrain Layer": "terrain",
                //"Open Street Map Layer": "osm",
                "Ocean Layer": "oceans"
            };

            this.selectedLayer = {
                selected: "streets"
            };
            this.drawLineToggle = false;

            this.createMap = function () {
                $scope.createMap();
            };

            this.addGraphics = function (dataArray) {
                $scope.addGraphics(dataArray);
            };

            this.createSizeLegend = function () {
                $scope.createSizeLegend();
            };

            this.updateBaseLayer = function (selectedLayer) {
                //toolService.setMapBaseLayer(selectedLayer);
                $scope.setBaseLayer();
            };

            this.toggleDrawLine = function () {
                this.drawLineToggle = !this.drawLineToggle;
                $scope.toggleDrawLine(this.drawLineToggle);
            };

            this.clearDrawings = function () {
                $scope.clearDrawings();
            };

        }

    }
})();