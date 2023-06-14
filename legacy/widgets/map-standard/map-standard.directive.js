'use strict';

import '@/widget-resources/js/leaflet/leaflet.css';
import L from '@/widget-resources/js/leaflet/leaflet.js';

/**
 *
 * @name map-standard
 * @desc map-standard chart directive for creating and visualizing a column chart
 */

export default angular
    .module('app.map-standard.directive', [])
    .directive('mapStandard', mapStandard);

mapStandard.$inject = ['semossCoreService'];

function mapStandard(semossCoreService) {
    mapChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: mapChartLink,
    };

    function mapChartLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];

        /** **************Get Chart Div *************************/
        /** ************* Main Event Listeners ************************/
        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            /** *************** Leaflet ****************************/
            mapConfig,
            mapChart,
            clickTimer,
            leafletMap;

        /**
         * @name initialize
         * @desc creates the visualization on the chart div
         * @returns {void}
         */
        function initialize() {
            // bind listeners
            resizeListener = scope.widgetCtrl.on('resize-widget', resizeViz);
            updateTaskListener = scope.widgetCtrl.on('update-task', setData);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                setData
            );
            addDataListener = scope.widgetCtrl.on('added-data', setData);
            // modeListener = scope.widgetCtrl.on('update-mode', toggleMode);

            scope.$on('$destroy', destroy);

            setData();
        }

        /**
         * @name setData
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                tasks = scope.widgetCtrl.getWidget('view.visualization.tasks'),
                taskIdx,
                data,
                keys,
                uiOptions = angular.extend(sharedTools, individiualTools),
                hasColor = false,
                combinedLegend = [],
                combinedLabels = [],
                combinedColorMapping = {},
                labelData;

            uiOptions.colorByValue = colorBy;
            mapConfig = {
                uiOptions: uiOptions,
                chartData: [],
                dataTableAlign: [],
                callbacks: scope.widgetCtrl.getEventCallbacks(),
                currentMode:
                    scope.widgetCtrl.getMode('selected') || 'default-mode',
                extremes: [],
                formats: [],
            };

            for (taskIdx = 0; taskIdx < tasks.length; taskIdx++) {
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + taskIdx + '.data'
                );
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' +
                        taskIdx +
                        '.keys.' +
                        selectedLayout
                );

                mapConfig.chartData.push(
                    semossCoreService.visualization.getTableData(
                        data.headers,
                        data.values,
                        data.rawHeaders
                    )
                );
                mapConfig.dataTableAlign.push(
                    semossCoreService.visualization.getDataTableAlign(keys)
                );

                labelData = mapConfig.chartData[taskIdx].labelData;

                combinedLegend.push(
                    labelData[mapConfig.dataTableAlign[taskIdx].color]
                );
                combinedLabels.push(mapConfig.dataTableAlign[taskIdx].label);
                if (mapConfig.dataTableAlign[taskIdx].hasOwnProperty('color')) {
                    Object.assign(
                        combinedColorMapping,
                        getColorMapping(
                            mapConfig.uiOptions,
                            mapConfig.dataTableAlign[taskIdx],
                            getLegendData(
                                labelData[
                                    mapConfig.dataTableAlign[taskIdx].color
                                ]
                            )
                        )
                    );
                    hasColor = true;
                }
                mapConfig.extremes.push(
                    getExtremes(
                        labelData[mapConfig.dataTableAlign[taskIdx].latitude],
                        labelData[mapConfig.dataTableAlign[taskIdx].longitude],
                        labelData[mapConfig.dataTableAlign[taskIdx].size]
                    )
                );

                mapConfig.formats.push(
                    semossCoreService.visualization.getFormat(keys, uiOptions)
                );
            }

            // mapConfig.extremes = getExtremes(labelData[mapConfig.dataTableAlign[taskIdx].latitude, combinedExtremes.longitude, combinedExtremes.size);

            if (hasColor) {
                mapConfig.legendData = getLegendData(combinedLegend);
                mapConfig.colorMapping = combinedColorMapping;
            } else {
                mapConfig.legendData = combinedLabels;
                mapConfig.colorMapping = {};
            }

            // TODO add in comment mode
            // eChartsConfig.comments = scope.widgetCtrl.getWidget('view.visualization.commentData');

            configureMap();
        }

        /**
         * @name configureMap
         * @desc configures leaflet map
         * @returns {void}
         */
        function configureMap() {
            // Specify div element for map
            mapChart = ele[0].firstElementChild;
            mapConfig.clientWidth = mapChart.clientWidth;

            var options = getLeafletOptions();

            if (leafletMap) {
                leafletMap.remove();
            }

            // Create map and assign it to the correct div element
            leafletMap = L.map(mapChart, options);

            // Add attribution in specific position
            L.control
                .attribution({
                    position: 'bottomleft',
                })
                .addTo(leafletMap);

            leafletMap.on('click', function () {
                var actionData = {},
                    alignIdx;

                for (
                    alignIdx = 0;
                    alignIdx < mapConfig.dataTableAlign.length;
                    alignIdx++
                ) {
                    actionData[mapConfig.dataTableAlign[alignIdx].label] = [];
                }

                mapConfig.callbacks.defaultMode.onClick(actionData);
            });

            // Create legend
            if (mapConfig.uiOptions.toggleLegend) {
                setLegend(mapConfig.uiOptions.legend);
            }

            setInitialMapPosition();
        }

        /**
         * @name getLeafletOptions
         * @desc defines the map options (control, interaction, panning inertia, keyboard navigation, mousewheel, touch iteraction, state, animation) for leaflet
         * @returns {void}
         */
        function getLeafletOptions() {
            var optionsObj = {
                    center: L.latLng(0, 0),
                    zoom: 2,
                    minZoom: 1,
                    maxBounds: [
                        [-90, -180],
                        [90, 180],
                    ],
                    // layers: [selectedMapLayer, dataLayer],
                    zoomControl: false, // Remove zoom controler (+ and - buttons)
                    doubleClickZoom: false,
                    trackResize: false,
                    attributionControl: false,
                },
                selectedMapLayer = getSelectedMapLayer(),
                dataLayer,
                layerIdx;

            optionsObj.layers = [];
            if (selectedMapLayer) {
                // setup the map layer
                optionsObj.layers.push(selectedMapLayer);
            }

            // add in all of the data point layers
            for (
                layerIdx = 0;
                layerIdx < mapConfig.chartData.length;
                layerIdx++
            ) {
                dataLayer = getDataLayer(
                    mapConfig.chartData[layerIdx].viewData,
                    mapConfig.dataTableAlign[layerIdx],
                    layerIdx
                );

                optionsObj.layers.push(dataLayer);
            }

            return optionsObj;
        }

        /**
         * @name getSelectedMapLayer
         * @desc defines and selects the map layer depending on user selection
         * @returns {void}
         */
        function getSelectedMapLayer() {
            var selectedMapLayer,
                mapboxAccessToken =
                    'pk.eyJ1IjoiY3N0cmVldCIsImEiOiJjaXkxc3JlYTcwMGRtMnFwaWNpMGFpeG9jIn0.E6AfqMcvQBO_-G9eDRHZdw',
                mapboxAttribution =
                    'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>';

            switch (mapConfig.uiOptions.mapLayer) {
                case 'Dark':
                    selectedMapLayer = L.tileLayer(
                        'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' +
                            mapboxAccessToken,
                        {
                            id: 'mapbox/dark-v10',
                            attribution: mapboxAttribution,
                        }
                    );
                    break;
                case 'Light':
                    selectedMapLayer = L.tileLayer(
                        'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' +
                            mapboxAccessToken,
                        {
                            id: 'mapbox/light-v10',
                            attribution: mapboxAttribution,
                        }
                    );
                    break;
                case 'Streets':
                    selectedMapLayer = L.tileLayer(
                        'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' +
                            mapboxAccessToken,
                        {
                            id: 'mapbox/streets-v11',
                            attribution: mapboxAttribution,
                        }
                    );
                    break;
                case 'Satellite':
                    selectedMapLayer = L.tileLayer(
                        'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' +
                            mapboxAccessToken,
                        {
                            id: 'mapbox/satellite-v9',
                            attribution: mapboxAttribution,
                        }
                    );
                    break;
                case 'Satellite (Esri)':
                    selectedMapLayer = L.tileLayer(
                        'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                        {
                            attribution:
                                '&copy; <a href="http://www.esri.com/">Esri</a>',
                        }
                    );
                    break;
                case 'Streets (Esri)':
                    selectedMapLayer = L.tileLayer(
                        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
                        {
                            attribution:
                                '&copy; <a href="http://www.esri.com/">Esri</a>',
                        }
                    );
                    break;
                case 'City Lights':
                    selectedMapLayer = L.tileLayer(
                        'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
                        {
                            attribution:
                                'Imagery by GIBS, <a href="https://earthdata.nasa.gov">ESDIS</a>',
                            format: 'jpg',
                            time: '',
                            maxZoom: 8,
                            tilematrixset: 'GoogleMapsCompatible_Level',
                        }
                    );
                    break;
                case 'Topographic':
                    selectedMapLayer = L.tileLayer(
                        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                        {
                            maxZoom: 17,
                            attribution:
                                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
                        }
                    );
                    break;
                case 'No Label':
                    selectedMapLayer = L.tileLayer(
                        'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
                        {
                            attribution:
                                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                            subdomains: 'abcd',
                            maxZoom: 19,
                        }
                    );
                    break;
                case 'None':
                    selectedMapLayer = false;
                    break;
                default:
                    selectedMapLayer = L.tileLayer(
                        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        {
                            attribution:
                                '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                        }
                    );
                    break;
            }
            return selectedMapLayer;
        }

        /**
         * @name getDataLayer
         * @param {array} viewData the view data to structure
         * @param {object} dataTableAlign the header info
         * @param {number} layerIdx the layer index
         * @desc defines the data layer including the scatter points
         * @returns {void}
         */
        function getDataLayer(viewData, dataTableAlign, layerIdx) {
            var dataLayer,
                i,
                markerAttributes,
                marker,
                dataPoints = [];

            for (i = 0; i < viewData.length; i++) {
                if (
                    dataIsInvalid(
                        viewData[i][dataTableAlign.latitude],
                        viewData[i][dataTableAlign.longitude]
                    )
                ) {
                    continue;
                }
                markerAttributes = getMarkerAttributes(
                    viewData[i],
                    dataTableAlign,
                    layerIdx
                );
                marker = L.circleMarker(
                    markerAttributes.location,
                    markerAttributes.style
                );
                marker.bindTooltip(
                    getTooltipContent(
                        marker.options,
                        viewData[i],
                        dataTableAlign,
                        layerIdx
                    ),
                    {
                        sticky: true,
                        direction: 'top',
                    }
                );
                marker.on('click', function (d) {
                    initializeEvents(
                        'click',
                        d.target.options.labelDimension,
                        d.target.options.labelName
                    );
                });
                marker.on('contextmenu', function (d) {
                    scope.visualizationCtrl.setContextMenuDataFromClick(
                        typeof d.target.options.labelName === 'string'
                            ? d.target.options.labelName.replace(/ /g, '_')
                            : d.target.options.labelName,
                        {
                            name: [d.target.options.labelDimension],
                        }
                    );
                    scope.visualizationCtrl.openContextMenu(d.originalEvent);
                });
                dataPoints.push(marker);
            }

            dataLayer = L.layerGroup(dataPoints);

            return dataLayer;
        }

        /**
         * @name dataIsInvalid
         * @desc check if lat and lon are valid
         * @param {number} lat data point values for latitude
         * @param {number} lon data point values for longitude
         * @returns {bool} true or false
         */
        function dataIsInvalid(lat, lon) {
            if (lat === null || lon === null) {
                return true;
            }
            if (isNaN(Number(lat)) || isNaN(Number(lon))) {
                return true;
            }
            return false;
        }

        /**
         * @name getMarkerAttributes
         * @desc define the location of an individual data point (latitude and longitude)
         * @param {object} dataPoint data point values to determine style and location
         * @param {object} dataTableAlign dimension info
         * @param {number} layerIdx the layer index
         * @returns {object} object of data point styling
         */
        function getMarkerAttributes(dataPoint, dataTableAlign, layerIdx) {
            var fillColor = getMarkerColor(dataPoint, dataTableAlign, layerIdx),
                outlineColor = fillColor,
                prop,
                size = getMarkerSize(dataPoint, dataTableAlign, layerIdx);

            // Handle highlighting
            if (mapConfig.uiOptions.highlight) {
                for (prop in mapConfig.uiOptions.highlight.data) {
                    if (
                        mapConfig.uiOptions.highlight.data.hasOwnProperty(prop)
                    ) {
                        if (dataPoint.hasOwnProperty(prop)) {
                            if (
                                mapConfig.uiOptions.highlight.data[
                                    prop
                                ].indexOf(dataPoint[prop]) > -1
                            ) {
                                outlineColor = '#000';
                            }
                        }
                    }
                }
            }

            return {
                location: [
                    dataPoint[dataTableAlign.latitude],
                    dataPoint[dataTableAlign.longitude],
                ],
                style: {
                    fillColor: fillColor,
                    color: outlineColor,
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8,
                    radius: size,
                    labelDimension: dataTableAlign.label,
                    labelName: dataPoint[dataTableAlign.label],
                },
            };
        }

        /**
         * @name getTooltipContent
         * @desc define the tooltip content for a data point
         * @param {object} marker data point values to determine style and location
         * @param {object} dataPoint data point values
         * @param {object} dataTableAlign dimension info
         * @param {number} layerIdx which layer to work off of
         * @returns {string} string of tooltip content
         */
        function getTooltipContent(
            marker,
            dataPoint,
            dataTableAlign,
            layerIdx
        ) {
            var tooltipContent = '',
                key;

            const format = mapConfig.formats[layerIdx];

            tooltipContent +=
                '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
                marker.fillColor +
                ';"></span>' +
                semossCoreService.visualization.formatValue(
                    dataPoint[dataTableAlign.label],
                    format[dataTableAlign.label]
                );
            tooltipContent +=
                '<br>' +
                'Coordinates: ' +
                semossCoreService.visualization.formatValue(
                    dataPoint[dataTableAlign.latitude],
                    format[dataTableAlign.latitude]
                ) +
                ', ' +
                semossCoreService.visualization.formatValue(
                    dataPoint[dataTableAlign.longitude],
                    format[dataTableAlign.longitude]
                );

            // TODO if tooltip is a duplicate key... ignore it
            for (key in dataTableAlign) {
                if (
                    dataTableAlign.hasOwnProperty(key) &&
                    key !== 'label' &&
                    key !== 'latitude' &&
                    key !== 'longitude' &&
                    key !== 'groupBy'
                ) {
                    tooltipContent +=
                        '<br>' +
                        String(dataTableAlign[key]).replace(/_/g, ' ') +
                        ': ' +
                        semossCoreService.visualization.formatValue(
                            dataPoint[dataTableAlign[key]],
                            format[dataTableAlign[key]]
                        );
                }
            }
            return tooltipContent;
        }

        /**
         * @name getMarkerSize
         * @desc define the size of the data point depending on min and max of size data for all data points
         * @param {object} dataPoint data point values
         * @param {object} dataTableAlign dimension info
         * @param {number} layerIdx which layer to work off of
         * @returns {number} data point radius
         */
        function getMarkerSize(dataPoint, dataTableAlign, layerIdx) {
            if (!dataTableAlign.hasOwnProperty('size')) {
                return semossCoreService.utility.isEmpty(
                    mapConfig.uiOptions.mapMarkerSize
                )
                    ? 5
                    : mapConfig.uiOptions.mapMarkerSize;
            }

            var sizeMin = 5,
                sizeMax = 20,
                val = dataPoint[dataTableAlign.size],
                min = mapConfig.extremes[layerIdx].size.min,
                max = mapConfig.extremes[layerIdx].size.max,
                nodeSize;

            // Uncomment to use relative size (2% of width)
            // sizeMax = 2 * mapConfig.clientWidth / 100;

            // Calculate relative size of data point with min and max defined
            nodeSize =
                ((val - min) / (max - min)) * (sizeMax - sizeMin) + sizeMin;

            if (isNaN(Number(nodeSize))) {
                return sizeMin;
            }
            if (nodeSize < sizeMin) {
                return sizeMin;
            }
            if (nodeSize > sizeMax) {
                return sizeMax;
            }

            return nodeSize;
        }

        /**
         * @name getMarkerColor
         * @desc define the color of the data point
         * @param {object} dataPoint data point values
         * @param {object} dataTableAlign dimension info
         * @param {number} layerIdx the layer index
         * @returns {string} data point color
         */
        function getMarkerColor(dataPoint, dataTableAlign, layerIdx) {
            var i, tempVal;

            // 1. Check Color by Value
            if (mapConfig.uiOptions.colorByValue) {
                for (i = 0; i < mapConfig.uiOptions.colorByValue.length; i++) {
                    tempVal =
                        dataPoint[
                            mapConfig.uiOptions.colorByValue[i].colorOn.replace(
                                /_/g,
                                ' '
                            )
                        ];
                    if (typeof tempVal === 'string') {
                        tempVal = tempVal.replace(/ /g, '_');
                    }
                    if (
                        mapConfig.uiOptions.colorByValue[
                            i
                        ].valuesToColor.indexOf(tempVal) > -1
                    ) {
                        return mapConfig.uiOptions.colorByValue[i].color;
                    }
                }
            }

            // 2. If color chart option does not exists, return first color of selected color palette
            if (!dataTableAlign.hasOwnProperty('color')) {
                return mapConfig.uiOptions.color[layerIdx];
            }

            // 3. If color chart option exists, determine and return aligned legend color
            if (
                mapConfig.colorMapping.hasOwnProperty(
                    dataPoint[dataTableAlign.color]
                )
            ) {
                return mapConfig.colorMapping[dataPoint[dataTableAlign.color]];
            }

            // If all else fails
            return '#40A0FF';
        }

        /**
         * @name setInitialMapPosition
         * @desc defines the bounding coordinates based on the min/max of lat and long data
         * @returns {void}
         */
        function setInitialMapPosition() {
            var southWest, northEast, layerIdx;

            if (
                !mapConfig.extremes[0].latitude ||
                !mapConfig.extremes[0].longitude
            ) {
                return;
            }

            if (
                mapConfig.extremes[0].latitude.max -
                    mapConfig.extremes[0].latitude.min >
                    140 &&
                mapConfig.extremes[0].longitude.max -
                    mapConfig.extremes[0].longitude.min >
                    280
            ) {
                return;
            }

            southWest = [
                mapConfig.extremes[0].latitude.min,
                mapConfig.extremes[0].longitude.min,
            ];
            northEast = [
                mapConfig.extremes[0].latitude.max,
                mapConfig.extremes[0].longitude.max,
            ];

            // go through the layers to set the bounds
            for (
                layerIdx = 1;
                layerIdx < mapConfig.extremes.length;
                layerIdx++
            ) {
                southWest[0] =
                    mapConfig.extremes[layerIdx].latitude.min < southWest[0]
                        ? mapConfig.extremes[layerIdx].latitude.min
                        : southWest[0];
                southWest[1] =
                    mapConfig.extremes[layerIdx].longitude.min < southWest[1]
                        ? mapConfig.extremes[layerIdx].longitude.min
                        : southWest[1];

                northEast[0] =
                    mapConfig.extremes[layerIdx].latitude.max > northEast[0]
                        ? mapConfig.extremes[layerIdx].latitude.max
                        : northEast[0];
                northEast[1] =
                    mapConfig.extremes[layerIdx].longitude.max > northEast[1]
                        ? mapConfig.extremes[layerIdx].longitude.max
                        : northEast[1];
            }

            leafletMap.fitBounds([southWest, northEast]);
        }

        /**
         * @name setLegend
         * @desc create a legend for the map
         * @param {object} labelStyle uiOptions.legend - label styles for legend
         * @returns {void}
         */
        function setLegend(labelStyle) {
            var legend = L.control({
                    position: 'topleft',
                }),
                styleOptions = `
                    color: ${labelStyle.fontColor || '#000000'};
                    font-size: ${labelStyle.fontSize || '12px'};
                    font-family: ${labelStyle.fontFamily || 'Inter'};
                    font-weight: ${labelStyle.fontWeight || 400};
                `;

            legend.onAdd = function () {
                var div = L.DomUtil.create('div', 'legend'),
                    legendElements = [],
                    label,
                    legendIdx,
                    colorIdx;

                legendElements.push(
                    `<div style="max-width: ${
                        mapChart.clientWidth - 20
                    }px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;background:rgba(255,255,255,0.8);box-shadow: 0 0 15px rgba(0,0,0,0.2);padding-right:5px;">`
                );

                if (
                    !semossCoreService.utility.isEmpty(mapConfig.colorMapping)
                ) {
                    for (label in mapConfig.colorMapping) {
                        if (mapConfig.colorMapping.hasOwnProperty(label)) {
                            legendElements.push(
                                `<span style="display:inline-block;margin-right:5px;border-radius:10px;margin-left:5px;width:10px;height:10px;background-color:${
                                    mapConfig.colorMapping[label]
                                };"></span>
                                    <span style="${styleOptions}">${cleanValue(
                                    label
                                )}</span>
                                `
                            );
                        }
                    }
                } else {
                    colorIdx = 0;
                    for (
                        legendIdx = 0;
                        legendIdx < mapConfig.legendData.length;
                        legendIdx++
                    ) {
                        // colorIdx = legendIdx % mapConfig.uiOptions.color.length;
                        // if (mapConfig.uiOptions.color.length === legendIdx) {
                        //     colorIdx += mapConfig.uiOptions.color.length;
                        // } else if (mapConfig.uiOptions.color.length < legendIdx) {
                        //     colorIdx -= 1;
                        // }
                        if (colorIdx > mapConfig.uiOptions.color.length - 1) {
                            colorIdx = 0;
                        }

                        legendElements.push(
                            `<span style="display:inline-block;margin-right:5px;border-radius:10px;margin-left:5px;width:10px;height:10px;background-color: ${
                                mapConfig.uiOptions.color[colorIdx]
                            };"></span>
                                <span style="${styleOptions}">${cleanValue(
                                mapConfig.legendData[legendIdx]
                            )}</span>
                            `
                        );
                        colorIdx++;
                    }
                }

                if (legendElements.length < 2) {
                    legendElements.push(
                        `<span style="display:inline-block;margin-right:5px;border-radius:10px;margin-left:5px;width:10px;height:10px;background-color: ${
                            mapConfig.uiOptions.color[0]
                        };"></span>
                            <span style="${styleOptions}">${cleanValue(
                            mapConfig.legendData[0]
                        )}</span>
                        `
                    );
                }

                legendElements.push('</div>');

                div.innerHTML = legendElements.join('');
                return div;
            };

            legend.addTo(leafletMap);
        }

        /**
         * @name getLegendData
         * @desc return unique values from color data
         * @param {array} colorArray values from color dimension
         * @returns {array} unique values from color dimension
         */
        function getLegendData(colorArray) {
            var legendData = [];
            if (colorArray) {
                legendData = colorArray.filter(function (elem, index, self) {
                    return index === self.indexOf(elem);
                });
            }
            return legendData.sort();
        }

        /**
         * @name getColorMapping
         * @param {object} uiOptions the ui options
         * @param {object} dataTableAlign the header info
         * @param {object} legendData the legend info
         * @desc assign color values to legend data
         * @returns {object} colorMapping object
         */
        function getColorMapping(uiOptions, dataTableAlign, legendData) {
            var i,
                j,
                n,
                newColor,
                colorIdx = 0,
                colorMapping = {};

            for (i = 0; i < legendData.length; i++) {
                if (colorIdx > uiOptions.color.length - 1) {
                    colorIdx = 0;
                }
                newColor = uiOptions.color[colorIdx];

                if (uiOptions.colorByValue) {
                    for (j = 0; j < uiOptions.colorByValue.length; j++) {
                        if (
                            uiOptions.colorByValue[j].hasOwnProperty('filters')
                        ) {
                            for (
                                n = 0;
                                n < uiOptions.colorByValue[j].filters.length;
                                n++
                            ) {
                                if (
                                    uiOptions.colorByValue[j].filters[
                                        n
                                    ].hasOwnProperty('filterObj')
                                ) {
                                    if (
                                        uiOptions.colorByValue[j].filters[n]
                                            .filterObj.comparator === '=='
                                    ) {
                                        if (
                                            typeof uiOptions.colorByValue[j]
                                                .filters[n].filterObj.left
                                                .value === 'string'
                                        ) {
                                            if (
                                                uiOptions.colorByValue[
                                                    j
                                                ].filters[
                                                    n
                                                ].filterObj.left.value.replace(
                                                    /_/g,
                                                    ' '
                                                ) ===
                                                dataTableAlign.color.replace(
                                                    /_/g,
                                                    ' '
                                                )
                                            ) {
                                                if (
                                                    uiOptions.colorByValue[
                                                        j
                                                    ].filters[
                                                        n
                                                    ].filterObj.right.value.replace(
                                                        /_/g,
                                                        ' '
                                                    ) ===
                                                    legendData[i].replace(
                                                        /_/g,
                                                        ' '
                                                    )
                                                ) {
                                                    newColor =
                                                        uiOptions.colorByValue[
                                                            j
                                                        ].color;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                colorMapping[legendData[i]] = newColor;
                colorIdx++;
            }

            return colorMapping;
        }

        /**
         * @name getExtremes
         * @desc determine minimum and maximum data points of size, lat, and long data
         * @param {array} latArray data point values for lattiude
         * @param {array} lonArray data point values for longitude
         * @param {array} sizeArray data point values for size
         * @returns {object} object of minimum and maximum values
         */
        function getExtremes(latArray, lonArray, sizeArray) {
            var lat = false,
                lon = false,
                size = false;

            if (latArray && latArray.length > 0) {
                lat = {
                    min: Math.min.apply(null, latArray),
                    max: Math.max.apply(null, latArray),
                };
            }

            if (lonArray && lonArray.length > 0) {
                lon = {
                    min: Math.min.apply(null, lonArray),
                    max: Math.max.apply(null, lonArray),
                };
            }

            if (sizeArray && sizeArray.length > 0) {
                size = {
                    min: Math.min.apply(null, sizeArray),
                    max: Math.max.apply(null, sizeArray),
                };
            }

            return {
                latitude: lat,
                longitude: lon,
                size: size,
            };
        }

        /**
         * @name cleanValue
         * @param {string | number} item the value to replace
         * @desc if number just returns value, otherwise removes spaces from string
         * @return {string | number} altered value
         */
        function cleanValue(item) {
            if (typeof item === 'string') {
                return item.replace(/_/g, ' ');
            } else if (typeof item === 'number') {
                return item.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                });
            }
            return item;
        }

        /**
         * @name initializeEvents
         * @desc creates the event layer
         * @param {string} actionType mouseover, mouseout, click, etc.
         * @param {string} labelDimension label dimension
         * @param {string} labelName selected data
         * @returns {void}
         */
        function initializeEvents(actionType, labelDimension, labelName) {
            var actionData;

            if (mapConfig.currentMode === 'default-mode') {
                switch (actionType) {
                    case 'click':
                        actionData = getDataForEvents(
                            labelDimension,
                            labelName
                        );
                        if (clickTimer) {
                            clearTimeout(clickTimer);
                            mapConfig.callbacks.defaultMode.onDoubleClick(
                                actionData
                            );
                            clickTimer = null;
                        } else {
                            clickTimer = setTimeout(function () {
                                mapConfig.callbacks.defaultMode.onClick(
                                    actionData
                                );
                                clickTimer = null;
                            }, 250);

                            // clickTimer = setTimeout(mapConfig.callbacks.defaultMode.onClick(actionData), 250);
                        }
                        break;
                    default:
                        return;
                }
            }
        }

        /**
         * @name getDataForEvents
         * @desc format data for event service
         * @param {string} labelDimension label dimension
         * @param {string} labelName selected data
         * @returns {obj} selected data formatted for event service
         */
        function getDataForEvents(labelDimension, labelName) {
            var actionData = {};

            actionData.data = {};
            actionData.data[labelDimension] = [labelName];
            actionData.eventType = '';
            actionData.mouse = [];

            return actionData;
        }

        /**
         * @name resizeViz
         * @desc resize the map
         * @returns {void}
         */
        function resizeViz() {
            // TODO is this the right approach (seems inefficient to reconfigure)?
            configureMap();
        }

        /**
         * @name destroy
         * @desc destroys listeners and dom elements outside of the scope
         * @returns {void}
         */
        function destroy() {
            resizeListener();
            updateTaskListener();
            updateOrnamentsListener();
            addDataListener();
            // modeListener();
        }

        // Start Visualization Creation
        initialize();
    }
}
