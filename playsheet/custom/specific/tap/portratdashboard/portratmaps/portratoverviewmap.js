(function () {
    'use strict';

    angular.module("app.tap.portratoverviewmap", [])
        .directive("portratoverviewMap", portratoverviewMap);

    portratoverviewMap.$inject = ["$timeout", "$filter", "esriMapService"];

    function portratoverviewMap($timeout, $filter, esriMapService) {

        return {
            restrict: 'A',
            require: ['^portratchart', 'portRatEsriMap'],
            priority: 400,
            link: PortRatOverviewMapLink,
            controller: PortRatOverviewMapCtrl
        };

        PortRatOverviewMapLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        function PortRatOverviewMapLink(scope, ele, attrs, controllers) {
            scope.chartController = controllers[0];
            scope.mapController = controllers[1];

            var dataArray = [],
                margin = {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                },
                map,
                draw,
                linesLayer,
                DEFAULT_RADIUS = 8,
                MIN_RADIUS = 0,
                MAX_RADIUS = 1,
                radius = [],
                radiusLabel = [],
                normalizedRadiusValues = [],
                maxDataRadius = 0, 
                minDataRadius = 0,
                absoluteMax = 0,
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
                        "style": "esriSMSCircle"/*,
                        "outline": {
                            "color": [0, 0, 0, 255],
                            "width": 1,
                            "type": "esriSLS",
                            "style": "esriSLSSolid"
                        }*/
                    }
                },
                highlightSymbol = {},
                lineSymbol = {},
                esriIsLoaded = false;         

            scope.chartController.dataProcessor = function () {
                if (!esriIsLoaded) {
                    esriMapService.bootstrap({
                        url: '//js.arcgis.com/3.16'
                    }).then(function () {
                        esriMapService.requireModule(['esri/map',
                                                      'esri/toolbars/draw',
                                                      'esri/tasks/geometry',
                                                      'esri/dijit/Scalebar',
                                                       'esri/dijit/Search'], function () {
                                processData();
                                esriIsLoaded = true;
                            });
                        }, function (error) {
                            //esri is loaded...
                            processData();
                        });
                } else {
                    processData();
                }

                function processData() {
                    //Radius normalization
                    scope.mapController.radiusEnabled = false;

                    if ((scope.chartController.data.dataTableAlign.size != '') && !isNaN(scope.chartController.data.data[0][scope.chartController.data.dataTableAlign.size]))
                        scope.mapController.radiusEnabled = true;

                    //get the max & min radius from the data set
                    if (scope.mapController.radiusEnabled) {
                        //create an array of radii based on the data
                        for (var i = 0; i < scope.chartController.data.data.length; i++) {
                            var radii = scope.chartController.data.data[i][scope.chartController.data.dataTableAlign.size];
                            if (Math.abs(radii) > 10000) {
                                radii = Math.round(radii/1000)*1000;
                            } else {
                                radii = Math.round(radii/100)*100;
                            }
                            radius.push(Math.abs(radii));
                            radiusLabel.push(radii);
                        }
                        //set the min and max based on the radius array
                        maxDataRadius = _.max(radius);
                        minDataRadius = _.min(radius);
                        absoluteMax = Math.max.apply(null, radius.map(Math.abs));
                        var radiusRange = maxDataRadius - minDataRadius;
                        var mapRadiusRange = MAX_RADIUS - MIN_RADIUS;

                        for (var j = 0; j < radius.length; j++) {
                            normalizedRadiusValues[j] = (((radius[j] - minDataRadius) / radiusRange) * mapRadiusRange) + MIN_RADIUS;
                        }
                    }
                    //end radius normalization

                    scope.chartController.tableData = JSON.parse(JSON.stringify(scope.chartController.data));
                    localChartData = JSON.parse(JSON.stringify(scope.chartController.data));
                    localChartData.keys = _.values(scope.chartController.data.dataTableAlign);

                    scope.update(normalizedRadiusValues);
                }
            };

            scope.update = function (normalizedRadiusValues) {
                if (!window.hasOwnProperty('esri')) {
                    return;
                }
                highlightSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                    new esri.Color([255, 0, 0]), 3), new esri.Color([125, 125, 125, 0.35]));
                lineSymbol = new esri.symbol.CartographicLineSymbol(esri.symbol.CartographicLineSymbol.STYLE_SOLID,
                    new esri.Color([255, 0, 0, 0.5]), 5, 
                    esri.symbol.CartographicLineSymbol.CAP_ROUND,
                    esri.symbol.CartographicLineSymbol.JOIN_MITER, 5
                );
                //split up the dataString appropriately and create an Array to send to the addGraphics method
                var dataStream = localChartData.data;
                var dataTableAlign = localChartData.dataTableAlign;
                var dataArray = [];

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
                    var content = "<b>Latitude: </b>${YCoord}<br/><b>Longitude: </b>${XCoord}<br/>";

                    //radius sizing
                    if (scope.mapController.radiusEnabled) {
                        pointObject.symbol.size = Math.abs(normalizedRadiusValues[i])*40;
                        if (pointObject.symbol.size < 5)
                            pointObject.symbol.size = 4;
                        pointObject.attributes.Size = $filter('currency')(radiusLabel[i], "$", 0);
                        content = content + "<b>" +$filter('replaceUnderscores')(dataTableAlign.size) + "</b>" + ": ${Size}<br/>";

                        pointObject.attributes.Sustained = dataStream[i][localChartData.headers[4].title];
                        content = content + "<b>" + $filter('replaceUnderscores')(localChartData.headers[4].title) + "</b>" + ": ${Sustained}<br/>";

                        pointObject.attributes.Consolidated = dataStream[i][localChartData.headers[5].title];
                        content = content + "<b>" + $filter('replaceUnderscores')(localChartData.headers[5].title) + "</b>" + ": ${Consolidated}<br/>";

                        var rgb = {};// = d3.rgb("#" + heatScale.colourAt(dataStream[i][dataTableAlign.heat]));
                        
                        if (dataStream[i][dataTableAlign.size] > 0) {
                            rgb = d3.rgb("#009900");
                        } else {
                            rgb = d3.rgb("#DB0000");
                        }
                        var rgba = {r: rgb.r, g: rgb.g, b: rgb.b, a: 0.75};
                        pointObject.symbol.color = rgba;
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

                scope.mapController.createMap();
                scope.mapController.addGraphics(dataArray);
                $timeout(function () {
                    scope.chartController.resizeViz();
                }, 350);
            }

            scope.mapController.createSizeLegend = function () {
                d3.select('.esrimap-legend').remove();

                var esriMapLegend = d3.select('#' + scope.chartController.chart).append('div')
                    .attr('class', 'esrimap-legend prd-overview');
                var title = esriMapLegend.append('div')
                    .attr('class', 'esrimap-legend-title prd-overview').text($filter('shortenValueFilter')($filter('replaceUnderscores')(scope.chartController.data.dataTableAlign.size)));
                var bar = esriMapLegend.append('hr')
                    .attr('class', 'esrimap-legend-bar');
                var content = esriMapLegend.append('div')
                    .attr('class', 'esrimap-legend-content prd-overview');

                var legendContainer = content.append('svg')
                    .attr('width', 615)
                    .attr('height', 80);

                var legendMessage = content.append('div')
                    .attr('width', 615)
                    .text("*Central maintenance savings are not reflected in this visualization");

                var sizeLegendGroup = legendContainer.append('g')
                    .attr('id', 'sizelegend')
                    .attr('transform', 'translate(' + 185 + ',' + 5 + ')');

                var sizes = sizeLegendGroup
                    .append('g')
                    .selectAll('.size-legend')
                    .data([-26, -17, -5, 5, 17, 26])
                    .enter()
                    .append('circle')
                    .attr('fill', function (d, i) {
                        if (i < 3) {
                            return '#DB0000'; //red
                        } else return '#009900'; //green
                    })
                    .attr('r', function (d, i) {
                        if (i < 3) {
                            return -d; //red
                        } else return d; //green
                    })
                    .attr('cx', function (d, i) {
                        if (i==1)
                            return -60;
                        if (i==2)
                            return 20;
                        if (i==3)
                            return 90;
                        if (i==4)
                            return 150;
                        if (i==5)
                            return 220;
                        else return -145;
                    })
                    .attr('cy', 25);

                sizeLegendGroup.append('text')
                    .text($filter('currency')(-absoluteMax, "$", 0))
                    .attr('text-anchor', 'middle')
                    .attr('y', 65)
                    .attr('x', -145);

                sizeLegendGroup.append('text')
                    .text($filter('currency')(0.75 * -absoluteMax, "$", 0))
                    .attr('text-anchor', 'middle')
                    .attr('y', 65)
                    .attr('x', -60);

                sizeLegendGroup.append('text')
                    .text($filter('currency')(0.25 * -absoluteMax, "$", 0))
                    .attr('text-anchor', 'middle')
                    .attr('y', 65)
                    .attr('x', 20);

                sizeLegendGroup.append('text')
                    .text($filter('currency')(Math.round(0.25 * (absoluteMax)), "$", 0))
                    .attr('text-anchor', 'middle')
                    .attr('y', 65)
                    .attr('x', 90);

                sizeLegendGroup.append('text')
                    .text($filter('currency')(Math.round(0.75 * (absoluteMax)), "$", 0))
                    .attr('text-anchor', 'middle')
                    .attr('y', 65)
                    .attr('x', 150);

                sizeLegendGroup.append('text')
                    .text($filter('currency')(absoluteMax, "$", 0))
                    .attr('text-anchor', 'middle')
                    .attr('y', 65)
                    .attr('x', 220);
            }
        }

        function PortRatOverviewMapCtrl() {}

    }
})();