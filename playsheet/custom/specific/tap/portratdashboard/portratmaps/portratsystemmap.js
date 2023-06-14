(function () {
    'use strict';

    angular.module("app.tap.portratsystemmap", [])
        .directive("portratsystemMap", portratsystemMap);

    portratsystemMap.$inject = ["$timeout", "$filter"];

    function portratsystemMap($timeout, $filter) {

        return {
            restrict: 'A',
            require: ['portratchart', 'portRatEsriMap'],
            priority: 400,
            link: PortRatSystemMapLink,
            controller: PortRatSystemMapCtrl
        };

        PortRatSystemMapLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        function PortRatSystemMapLink(scope, ele, attrs, controllers) {
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
                MIN_RADIUS = 5,
                MAX_RADIUS = 40,
                radius = [],
                normalizedRadiusValues = [],
                maxDataRadius = 0, 
                minDataRadius = 0,
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
                        "style": "esriSMSCircle",/*
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
                sustainedColor = "#1f77b4",
                deployedColor = "#9467bd",
                consolidatedColor = "#ff7f0e",
                starPath = "M14.615,4.928c0.487-0.986,1.284-0.986,1.771,0l2.249,4.554c0.486,0.986,1.775,1.923,2.864,2.081l5.024,0.73c1.089,0.158,1.335,0.916,0.547,1.684l-3.636,3.544c-0.788,0.769-1.28,2.283-1.095,3.368l0.859,5.004c0.186,1.085-0.459,1.553-1.433,1.041l-4.495-2.363c-0.974-0.512-2.567-0.512-3.541,0l-4.495,2.363c-0.974,0.512-1.618,0.044-1.432-1.041l0.858-5.004c0.186-1.085-0.307-2.6-1.094-3.368L3.93,13.977c-0.788-0.768-0.542-1.525,0.547-1.684l5.026-0.73c1.088-0.158,2.377-1.095,2.864-2.081L14.615,4.928z";

            scope.chartController.dataProcessor = function () {
                highlightSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                    new esri.Color([255, 0, 0]), 3), new esri.Color([125, 125, 125, 0.35]));
                lineSymbol = new esri.symbol.CartographicLineSymbol(esri.symbol.CartographicLineSymbol.STYLE_SOLID,
                    new esri.Color([255, 0, 0, 0.5]), 5, 
                    esri.symbol.CartographicLineSymbol.CAP_ROUND,
                    esri.symbol.CartographicLineSymbol.JOIN_MITER, 5
                );

                //Radius normalization
                scope.mapController.radiusEnabled = false;

                if ((scope.chartController.data.dataTableAlign.size != '') && (scope.chartController.data.dataTableAlign.size === 'Recommendation'))
                    scope.mapController.radiusEnabled = true;

                if(scope.chartController.data.dataTableAlign.label === 'lat') {
                    var temp = scope.chartController.data.dataTableAlign.lat;
                    scope.chartController.data.dataTableAlign.lat = scope.chartController.data.dataTableAlign.label;
                    scope.chartController.data.dataTableAlign.label = temp;
                }

                if(scope.chartController.data.dataTableAlign.label === 'lon') {
                    var temp = scope.chartController.data.dataTableAlign.lon;
                    scope.chartController.data.dataTableAlign.lon = scope.chartController.data.dataTableAlign.label;
                    scope.chartController.data.dataTableAlign.label = temp;
                }

                scope.chartController.tableData = JSON.parse(JSON.stringify(scope.chartController.data));
                localChartData = JSON.parse(JSON.stringify(scope.chartController.data));
                localChartData.keys = _.values(scope.chartController.data.dataTableAlign);

                scope.update(normalizedRadiusValues);
            };

            scope.update = function (normalizedRadiusValues) {
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
                        pointObject.attributes.Recommendation = dataStream[i][dataTableAlign.size];
                        //set the colors of the circles based on the status
                        if (pointObject.attributes.Recommendation === "Sustained Accessible Site") {
                            var rgb = d3.rgb(sustainedColor);
                            var rgba = {r: rgb.r, g: rgb.g, b: rgb.b, a: 0.75};
                            pointObject.symbol.color = rgba;
                        } else if (pointObject.attributes.Recommendation === "Deployed Accessible Site") {
                            var rgb = d3.rgb(deployedColor);
                            var rgba = {r: rgb.r, g: rgb.g, b: rgb.b, a: 0.75};
                            pointObject.symbol.color = rgba;
                        } else if (pointObject.attributes.Recommendation === "Previously Accessible Site") {
                            var rgb = d3.rgb(consolidatedColor);
                            var rgba = {r: rgb.r, g: rgb.g, b: rgb.b, a: 0.75};
                            pointObject.symbol.color = rgba;
                        }
                        content = content + "<b>" + $filter('replaceUnderscores')(dataTableAlign.size) + ":</b> ${Recommendation}<br/>"
                    }

                    //pointObject.attributes.PROP = dataStream[i][dataTableAlign.heat];
                    //content = content + $filter('replaceUnderscores')(dataTableAlign.heat) + ": ${PROP}<br/>"

                    //set title and content of infoTemplate (tooltip)
                    infoTemplate.setTitle($filter('replaceUnderscores')($filter('shortenAndReplaceUnderscores')(dataStream[i][dataTableAlign.label])));
                    infoTemplate.setContent(content);

                    //create a new esri graphic for the point object
                    mapPoint = new esri.Graphic(pointObject);
                    mapPoint.setInfoTemplate(infoTemplate);

                    //creating the star
                    var starSymbol = new esri.symbol.SimpleMarkerSymbol();
                    starSymbol.setPath(starPath);
                    if (pointObject.attributes.Recommendation === "Sustained Host Site") {
                        starSymbol.setColor(new dojo.Color(sustainedColor));
                        starSymbol.setOutline(mapPoint.symbol.outline);
                        mapPoint.setSymbol(starSymbol);
                    } else if (pointObject.attributes.Recommendation === "Deployed Host Site") {
                        starSymbol.setColor(new dojo.Color(deployedColor));
                        starSymbol.setOutline(mapPoint.symbol.outline);
                        mapPoint.setSymbol(starSymbol);
                    } else if (pointObject.attributes.Recommendation === "Previously Hosted Site") {
                        starSymbol.setColor(new dojo.Color(consolidatedColor));
                        starSymbol.setOutline(mapPoint.symbol.outline);
                        mapPoint.setSymbol(starSymbol);
                    }

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
                var systemTypeToggle = false;
                if (scope.chartController.chart === "sysdecom") {
                    systemTypeToggle = true;
                }
                d3.select('.esrimap-legend prd-system').remove();

                var esriMapLegend = d3.select('#' + scope.chartController.chart).append('div')
                    .attr('class', 'esrimap-legend prd-system');
                if (systemTypeToggle)
                    esriMapLegend.attr('class', 'esrimap-legend prd-system decom');
                var title = esriMapLegend.append('div')
                    .attr('class', 'esrimap-legend-title prd-system').text($filter('shortenValueFilter')($filter('replaceUnderscores')(scope.chartController.data.dataTableAlign.size)));
                var bar = esriMapLegend.append('hr')
                    .attr('class', 'esrimap-legend-bar');
                var content = esriMapLegend.append('div')
                    .attr('class', 'esrimap-legend-content prd-system');

                var legendContainer = content.append('svg')
                    .attr('width', 500)
                    .attr('height', 100);

                var translateY = 30;
                if (systemTypeToggle === true)
                    translateY = 75;

                var sizeLegendGroup = legendContainer.append('g')
                    .attr('id', 'sizelegend')
                    .attr('transform', 'translate(' + 340 + ',' + translateY + ')');

                var mockLegendData = [6, 6, 6];

                var sizes = sizeLegendGroup
                    .append('g')
                    .selectAll('.size-legend')
                    .data(function () {
                        if (systemTypeToggle)
                            return [6];
                        else return [6, 6, 6];
                    })
                    .enter()
                    .append('circle')
                    .attr('fill', function (d, i) {
                        if (systemTypeToggle)
                            return consolidatedColor;
                        else {
                            if (i==1)
                                return deployedColor;
                            if (i==2)
                                return consolidatedColor;
                            else return sustainedColor;
                        }
                    })
                    .attr('r', function (d) {
                        return d;
                    })
                    .attr('cx', function (d) {
                        return -175;
                    })
                    .attr('cy', function (d, i) {
                        return i*20 + 10;
                    });

                var star = sizeLegendGroup
                    .append('g')
                    .attr('transform', 'translate(' + -360 + ',' + 0 + ')')
                    .append('g')
                    .attr('transform', 'scale(0.55)')
                    .selectAll('.size-legend')
                    .data(function () {
                        if (systemTypeToggle)
                            return [3];
                        else return [3, 3, 3];
                    })
                    .enter()
                    .append('svg:path')
                    .attr('fill', function (d, i) {
                        if (systemTypeToggle)
                            return consolidatedColor;
                        else {
                            if (i==1)
                                return deployedColor;
                            if (i==2)
                                return consolidatedColor;
                            else return sustainedColor;
                        }
                    })
                    .attr('d', starPath)
                    .attr('transform', function (d, i) {
                        return 'translate(' + 50 + ',' + (2 + i*36) + ')';
                    });

                var starLabels = sizeLegendGroup
                    .append('g')
                    .selectAll('.size-legend')
                    .data(function () {
                        if (systemTypeToggle)
                            return [6];
                        else return [6, 6, 6];
                    })
                    .enter()
                    .append('text')
                    .text(function (d, i) {
                        if (systemTypeToggle)
                            return "Previously Hosted Site";
                        else {
                            if (i==0)
                                return "Sustained Host Site";
                            if (i==1)
                                return "Deployed Host Site";
                            if (i==2)
                                return "Previously Hosted Site";
                        }
                    })
                    .attr('y', function (d, i) {
                        return i*20 + 14;
                    })
                    .attr('x', -310);

                var labels = sizeLegendGroup
                    .append('g')
                    .selectAll('.size-legend')
                    .data(function () {
                        if (systemTypeToggle)
                            return [6];
                        else return [6, 6, 6];
                    })
                    .enter()
                    .append('text')
                    .text(function (d, i) {
                        if (systemTypeToggle)
                            return "Previously Accessible Site";
                        else {
                            if (i==0)
                                return "Sustained Accessible Site";
                            if (i==1)
                                return "Deployed Accessible Site";
                            if (i==2)
                                return "Previously Accessible Site";
                        }
                    })
                    .attr('y', function (d, i) {
                        return i*20 + 14;
                    })
                    .attr('x', -160);
            }
        }

        function PortRatSystemMapCtrl() {}

    }
})();