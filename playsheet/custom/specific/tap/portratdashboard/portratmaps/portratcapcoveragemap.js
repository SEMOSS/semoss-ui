(function () {
    'use strict';

    angular.module("app.tap.portratcapcoveragemap", [])
        .directive("portratcapcoverageMap", portratcapcoverageMap);

    portratcapcoverageMap.$inject = ["$timeout", "$filter"];

    function portratcapcoverageMap($timeout, $filter) {

        return {
            restrict: 'A',
            require: ['portratchart', 'portRatEsriMap'],
            priority: 400,
            link: PortRatCapCoverageMapLink,
            controller: PortRatCapCoverageMapCtrl
        };

        PortRatCapCoverageMapLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        function PortRatCapCoverageMapLink(scope, ele, attrs, controllers) {
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
                minHeatValue = 0,
                maxHeatValue = 0,
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
                        "style": "esriSMSCircle"
                    }
                },
                siteColor = "#191919",
                highlightSymbol = {},
                lineSymbol = {};

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

                if ((scope.chartController.data.dataTableAlign.size != '') && !isNaN(scope.chartController.data.data[0][scope.chartController.data.dataTableAlign.size]))
                    scope.mapController.radiusEnabled = true;

                //get the max & min radius from the data set
                if (scope.mapController.radiusEnabled) {
                    //create an array of radii based on the data
                    for (var i = 0; i < scope.chartController.data.data.length; i++) {
                       radius.push(scope.chartController.data.data[i][scope.chartController.data.dataTableAlign.size]);
                    }
                    //set the min and max based on the radius array
                    maxDataRadius = 100;
                    minDataRadius = 0;
                    var radiusRange = maxDataRadius - minDataRadius;
                    var mapRadiusRange = MAX_RADIUS - MIN_RADIUS;

                    for (var j = 0; j < radius.length; j++) {
                        if (maxDataRadius === minDataRadius)
                            normalizedRadiusValues[j] = DEFAULT_RADIUS;
                        else normalizedRadiusValues[j] = (((radius[j] - minDataRadius) / radiusRange) * mapRadiusRange) + MIN_RADIUS;
                    }
                }                    
                //end radius normalization

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
                        pointObject.symbol.size = normalizedRadiusValues[i];
                        pointObject.attributes.Percent = dataStream[i][dataTableAlign.size] + "%";
                        content = content + "<b>" +$filter('replaceUnderscores')(dataTableAlign.size) + "</b>" + ": ${Percent}<br/>";

                        pointObject.attributes.Systems = dataStream[i][localChartData.headers[4].title];
                        content = content + "<b>" + $filter('replaceUnderscores')(localChartData.headers[4].title) + "</b>" + ": ${Systems}<br/>";

                        var rgb = d3.rgb(siteColor);
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
                d3.select('.esrimap-legend prd-overview capcoverage').remove();

                var esriMapLegend = d3.select('#' + scope.chartController.chart).append('div')
                    .attr('class', 'esrimap-legend prd-overview capcoverage');
                var title = esriMapLegend.append('div')
                    .attr('class', 'esrimap-legend-title prd-overview capcoverage').text($filter('shortenValueFilter')($filter('replaceUnderscores')(scope.chartController.data.dataTableAlign.size)));
                var bar = esriMapLegend.append('hr')
                    .attr('class', 'esrimap-legend-bar');
                var content = esriMapLegend.append('div')
                    .attr('class', 'esrimap-legend-content prd-overview capcoverage');

                var legendContainer = content.append('svg')
                    .attr('width', 500)
                    .attr('height', 100);

                var sizeLegendGroup = legendContainer.append('g')
                    .attr('id', 'sizelegend')
                    .attr('transform', 'translate(' + 185 + ',' + 30 + ')');

                var sizes = sizeLegendGroup
                    .append('g')
                    .selectAll('.size-legend')
                    .data([5, 10, 17, 26])
                    .enter()
                    .append('circle')
                    .attr('fill', function (d, i) {
                        return siteColor;
                    })
                    .attr('r', function (d, i) {
                        return d;
                    })
                    .attr('cx', function (d, i) {
                        if (i==1)
                            return -75;
                        if (i==2)
                            return 0;
                        if (i==3)
                            return 90;
                        else return -145;
                    })
                    .attr('cy', 25);

                sizeLegendGroup.append('text')
                    .text("0%")
                    .attr('text-anchor', 'middle')
                    .attr('y', 65)
                    .attr('x', -145);

                sizeLegendGroup.append('text')
                    .text("100%")
                    .attr('text-anchor', 'middle')
                    .attr('y', 65)
                    .attr('x', 90);
            };

        }

        function PortRatCapCoverageMapCtrl() {}

    }
})();