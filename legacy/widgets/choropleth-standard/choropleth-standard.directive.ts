'use strict';

import '@/widget-resources/js/leaflet/leaflet.css';
import './choropleth-standard.scss';
import L from '@/widget-resources/js/leaflet/leaflet.js';
import '@/widget-resources/js/leaflet/L.Popup.Angular.js';
import '@/widget-resources/js/leaflet/Leaflet.VectorGrid.bundled.js';
import angular from 'angular';

export default angular
    .module('app.choropleth-standard.directive', [])
    .directive('choroplethStandard', choroplethStandard);

choroplethStandard.$inject = ['$compile', '$q', 'semossCoreService'];

function choroplethStandard(
    $compile: any,
    $q: ng.IQService,
    semossCoreService: SemossCoreService
) {
    mapChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./choropleth-standard.directive.html'),
        require: ['^widget', '^visualization'],
        priority: 300,
        link: mapChartLink,
    };

    function mapChartLink(scope, ele, attrs, ctrl) {
        let currentZoom: any, currentPosition: any, currentMapType: any;
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];

        interface uiOptions {
            colorName: string;
            color: string[];
            heatRange?: {
                min: {
                    show: boolean;
                    value: number;
                };
                max: {
                    show: boolean;
                    value: number;
                };
            };
            layerStyle: {
                borderColor: string;
                opacity: number;
            };
            choroplethMapType?: string;
            heatmapColor: string[];
            toggleLegend?: boolean;
            logOfHeat?: boolean;
            showTooltips: boolean;
            mapLayer?: string;
            highlight: {
                data: {
                    string?: number;
                };
            };
            formatDataValues: any;
            chartTitle?: any;
            customTooltip: any;
        }

        interface choropleth {
            type: string;
            data: choroplethData[];
            label: string;
            gradient: [string, number][];
            extremes: { min: number; max: number };
            zoom: { min: number; max: number };
            format: any;
        }

        interface choroplethData {
            id: string;
            name: string;
            heat: number;
            selected: {
                string?: any[];
            };
            tooltip: {
                label: string;
                value: string | number;
            }[];
        }

        const GEO: {
            string?: {
                features: {
                    type: string;
                    geometry: any[];
                    properties: any;
                }[];
            };
        } = {};

        let uiOptions: uiOptions,
            choroplethIdx = -1, // layer that is rendered
            choroplethArray: choropleth[] = [],
            choroplethLegendArray: any[] = [], // legend that is rendered
            choroplethTitleArray: any[] = [], // title that is rendered
            clickTimer,
            leafletMap;

        /** Visualization */
        /**
         * @name resetVisualization
         * @desc resetVisualization for the visualization and paints
         */
        function resetVisualization(): void {
            let selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                tasks = scope.widgetCtrl.getWidget('view.visualization.tasks'),
                newGeo = false;

            // save the options
            uiOptions = angular.extend(sharedTools, individiualTools);

            // if the map changes, we will reset any zoom/position
            if (
                currentMapType &&
                currentMapType !== uiOptions.choroplethMapType
            ) {
                currentZoom = undefined;
                currentPosition = undefined;
                newGeo = true;
            }

            currentMapType = uiOptions.choroplethMapType;

            // if there is a customTooltip, see if we need to load anything from asset
            if (
                uiOptions.customTooltip.asset &&
                uiOptions.customTooltip.asset.path &&
                uiOptions.customTooltip.asset.space
            ) {
                scope.widgetCtrl.meta(
                    [
                        {
                            meta: true,
                            type: 'getAsset',
                            components: [
                                uiOptions.customTooltip.asset.space,
                                uiOptions.customTooltip.asset.path,
                            ],
                            terminal: true,
                        },
                    ],
                    function (response) {
                        const output = response.pixelReturn[0].output;
                        uiOptions.customTooltip.html = output;
                    }
                );
            }

            // format the data (based on the tasks)
            choroplethArray = [];
            for (
                let taskIdx = 0, taskLen = tasks.length;
                taskIdx < taskLen;
                taskIdx++
            ) {
                if (tasks[taskIdx].layout === 'Choropleth') {
                    formatChoropleth(tasks[taskIdx]);
                }
            }

            // remove the map if it exists
            if (leafletMap) {
                // if its a a choropleth map type, then we will reset the zoom.
                if (!newGeo) {
                    // get the current zoom and position so when we repaint, we remember and set it back.
                    currentZoom = leafletMap.getZoom();
                    currentPosition = leafletMap.getCenter();
                }

                leafletMap.remove();
            }

            // create the map
            leafletMap = L.map(
                ele[0].querySelector('.choropleth-standard'),
                getLeafletConfig()
            );

            // Add attribution in a specific position
            L.control
                .attribution({
                    position: 'bottomleft',
                })
                .addTo(leafletMap);

            // add the leaflet events
            leafletMap.on('zoomend', () => {
                renderLeaflet(false);
            });

            // actually render the map
            renderLeaflet(true);
        }

        /**
         * @name resizeVisualization
         * @desc resize the map
         */
        function resizeVisualization(): void {
            if (leafletMap) {
                leafletMap.invalidateSize();
            }
        }

        /** Leaflet */
        /**
         * @name renderLeaflet
         * @desc render leaflet map
         * @param reset - reset the zoom?
         */
        function renderLeaflet(reset: boolean): void {
            const promises: ng.IPromise<any>[] = [];

            // start loading
            scope.widgetCtrl.emit('start-loading', {
                id: scope.widgetCtrl.widgetId,
                message: 'Loading Map',
            });

            promises.push(paintChoropleth(reset));

            $q.all(promises).then(() => {
                // zoom after it is done
                if (reset && !currentZoom) {
                    zoomMap();
                }

                // stop loading
                scope.widgetCtrl.emit('stop-loading', {
                    id: scope.widgetCtrl.widgetId,
                });
            });
        }

        /**
         * @name zoomMap
         * @desc set the initial zoom for the map
         */
        function zoomMap(): any {
            let zoomed = false;
            // right now we zoom on the base choro
            const first = choroplethArray[0];

            if (first) {
                if (GEO[first.type]) {
                    const formatted: any = {
                            type: 'FeatureCollection',
                            features: [],
                        },
                        geo = GEO[first.type].data;

                    for (const id in geo) {
                        formatted.features.push({
                            type: 'Feature',
                            geometry: geo[id].geometry,
                        });
                    }

                    const layer = L.geoJson(formatted);
                    if (layer.getBounds) {
                        const bounds = layer.getBounds();
                        if (bounds.isValid()) {
                            leafletMap.fitBounds(bounds);
                            zoomed = true;
                        }
                    }
                }
            }

            if (!zoomed) {
                leafletMap.setView(
                    {
                        lat: 0,
                        lng: 0,
                    },
                    0
                );
            }
        }

        /**
         * @name getLeafletConfig
         * @param uiOptions the options for the map
         * @desc defines the map options (control, interaction, panning inertia, keyboard navigation, mousewheel, touch iteraction, state, animation) for leaflet
         */
        function getLeafletConfig(): any {
            const optionsObj: any = {
                minZoom: 1,
                maxBounds: [
                    [-90, -180],
                    [90, 180],
                ],
                zoomControl: false, // Remove zoom controler (+ and - buttons)
                doubleClickZoom: false,
                trackResize: false,
                attributionControl: false,
                renderer: L.canvas(),
            };

            const selectedMapLayer = getLeafletLayer();
            if (selectedMapLayer) {
                optionsObj.layers = [selectedMapLayer];
            }

            if (currentZoom) {
                optionsObj.zoom = currentZoom;
            }

            if (currentPosition) {
                optionsObj.center = currentPosition;
            }

            return optionsObj;
        }

        /**
         * @name getLeafletLayer
         * @desc defines and selects the map layer depending on user selection
         */
        function getLeafletLayer(): any {
            let selectedMapLayer,
                mapboxAccessToken =
                    'pk.eyJ1IjoiY3N0cmVldCIsImEiOiJjaXkxc3JlYTcwMGRtMnFwaWNpMGFpeG9jIn0.E6AfqMcvQBO_-G9eDRHZdw',
                mapboxAttribution =
                    '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a>, © <a href="http://mapbox.com">Mapbox</a>';

            switch (uiOptions.mapLayer) {
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

        /** Markers */

        /** Choropleth */
        /**
         * @name formatChoropleth
         * @desc format the Choropleth data
         * @param task - which task are we looking at?
         */
        function formatChoropleth(task: any) {
            let data = task.data,
                tooltip: string[] = [],
                heat = '',
                type = '',
                label = '',
                format = {};

            // generate the tooltip, label, value
            const keys = task.keys.Choropleth;
            for (
                let keyIdx = 0, keyLen = keys.length;
                keyIdx < keyLen;
                keyIdx++
            ) {
                if (keys[keyIdx].model === 'tooltip') {
                    tooltip.push(keys[keyIdx].alias);
                } else if (keys[keyIdx].model === 'value') {
                    heat = keys[keyIdx].alias;
                } else if (keys[keyIdx].model === 'label') {
                    label = keys[keyIdx].alias;
                }
            }

            if (!heat || !label) {
                console.error('ERROR: Keys are not properly defined');
                return;
            }

            // get the format
            format = semossCoreService.visualization.getFormat(keys, uiOptions);

            // we use the area to find the type of the
            if (task.layer && task.layer.type) {
                type = task.layer.type;
            } else if (typeof uiOptions.choroplethMapType === 'object') {
                const firstKey = Object.keys(uiOptions.choroplethMapType)[0];
                type = uiOptions.choroplethMapType[firstKey];
            } else if (uiOptions.choroplethMapType) {
                type = uiOptions.choroplethMapType;
            }

            // map the old to the new
            if (type === 'usStates') {
                type = 'states';
            } else if (type === 'usRegions') {
                type = 'regions';
            } else if (type === 'usCounties') {
                type = 'counties';
            } else if (type.indexOf('states/') === 0) {
                type = 'counties/' + type.substring(7);
            } else if (type.indexOf('state-zipCodes/') === 0) {
                type = 'zipcodes/' + type.substring(15);
            }

            // map the header to index for easy access
            const headers = {};
            for (
                let headerIdx = 0, headerLen = data.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                headers[data.headers[headerIdx]] = headerIdx;
            }

            const formatted: choroplethData[] = [];
            for (
                let valueIdx = 0, valueLen = data.values.length;
                valueIdx < valueLen;
                valueIdx++
            ) {
                const selected = {};

                selected[data.headers[headers[label]]] = [
                    data.values[valueIdx][headers[label]],
                ];

                // push the newly formatted data
                formatted.push({
                    id: data.values[valueIdx][headers[label]],
                    name: data.values[valueIdx][headers[label]],
                    heat: data.values[valueIdx][headers[heat]],
                    selected: selected,
                    tooltip: tooltip.map((t) => {
                        return {
                            label: t,
                            value: data.values[valueIdx][headers[t]],
                        };
                    }),
                });
            }

            const extremes = getChoroplethExtremes(formatted);

            choroplethArray.push({
                type: type, // what is the type of chart?
                data: formatted,
                label: heat,
                gradient: getChoroplethGradient(extremes),
                extremes: extremes,
                zoom: getChoroplethZoom(task.layer ? task.layer : {}),
                format: format,
            });
        }

        /**
         * @name paintChoropleth
         * @desc paint the choropleth based on the active view
         * @param reset - reset the viz?
         */
        function paintChoropleth(reset: boolean): ng.IPromise<any> {
            const deferred = $q.defer(),
                promises: ng.IPromise<any>[] = [];

            // reset the rendered
            if (reset) {
                choroplethIdx = -1;
                choroplethLegendArray = [];
                choroplethTitleArray = [];
            }

            const zoomLevel = leafletMap.getZoom();

            // backwards on purpose, so the 'top' one is called if conditions are met
            let activeIdx = choroplethArray.length - 1;
            for (
                let configIdx = choroplethArray.length - 1;
                configIdx >= 0;
                configIdx--
            ) {
                if (
                    choroplethArray[configIdx].zoom.min <= zoomLevel &&
                    zoomLevel <= choroplethArray[configIdx].zoom.max
                ) {
                    activeIdx = configIdx;
                    break;
                }
            }

            // is it already rendered?
            if (choroplethIdx === activeIdx) {
                deferred.resolve();
                return deferred.promise;
            }

            // load the geo
            for (
                let configIdx = choroplethArray.length - 1;
                configIdx >= 0;
                configIdx--
            ) {
                promises.push(loadChoropleth(choroplethArray[configIdx].type));
            }

            // load all of the map data
            $q.all(promises).then(() => {
                // paint the layers (only need to if it was reset)
                if (reset) {
                    for (
                        let configIdx = choroplethArray.length - 1;
                        configIdx >= 0;
                        configIdx--
                    ) {
                        // add the layer
                        const layer = generateChoroplethLayer(
                            choroplethArray[configIdx]
                        );
                        layer.addTo(leafletMap);
                    }
                }

                // legent logic
                // remove the previous legend if it exists
                if (choroplethLegendArray[choroplethIdx]) {
                    leafletMap.removeControl(
                        choroplethLegendArray[choroplethIdx]
                    );
                }

                // remove the previous title if it exists
                if (choroplethTitleArray[choroplethIdx]) {
                    leafletMap.removeControl(
                        choroplethTitleArray[choroplethIdx]
                    );
                }

                if (!uiOptions.toggleLegend) {
                    // generate the legend if it doesn't exist
                    if (!choroplethLegendArray[activeIdx]) {
                        choroplethLegendArray[activeIdx] =
                            generateChoroplethLegend(
                                choroplethArray[activeIdx],
                                uiOptions.legend
                            );
                    }

                    choroplethLegendArray[activeIdx].addTo(leafletMap);
                }

                if (uiOptions.chartTitle && uiOptions.chartTitle.text) {
                    let chartTitleEl: any = undefined;
                    // generate the title if it doesn't exist
                    if (!choroplethTitleArray[activeIdx]) {
                        choroplethTitleArray[activeIdx] =
                            generateChoroplethTitle(uiOptions.chartTitle);
                    }

                    choroplethTitleArray[activeIdx].addTo(leafletMap);
                    // add class to center the title
                    // L.DomUtil.addClass(L.Control.getContainer(),'test')
                    chartTitleEl = leafletMap
                        .getContainer()
                        .getElementsByClassName(
                            'choropleth-standard__chart-title'
                        )[0];

                    if (chartTitleEl) {
                        chartTitleEl.parentElement.classList.add(
                            'choropleth-standard__center-title'
                        );
                    }
                }

                // save the newly rendered
                choroplethIdx = activeIdx;

                deferred.resolve();
            });

            return deferred.promise;
        }

        /**
         * @name loadChoropleth
         * @param type - type of geo json to get
         * @desc gets the proper geojson to add as a layer to leaflet map
         */
        function loadChoropleth(type: string): ng.IPromise<any> {
            const deferred = $q.defer();

            if (GEO.hasOwnProperty(type)) {
                deferred.resolve();
            } else {
                import(
                    /* webpackChunkName: "data/[request]" */ `../../widget-resources/js/leaflet/json/${type}.json`
                )
                    .then((module) => {
                        GEO[type] = module.default;

                        deferred.resolve();
                    })
                    .catch((err) => {
                        console.log('Error loading map data.', err);
                        deferred.resolve();
                    });
            }

            return deferred.promise;
        }

        /**
         * @name generateChoroplethLayer
         * @desc render the geojson layer on leaflet map
         * @param geoJson geoJSON data
         * @param choropleth - choropleth that you are generating
         * @returns layer - layer for the config
         */
        function generateChoroplethLayer(choropleth: choropleth): any {
            const formatted: {
                type: string;
                features: {
                    type: string;
                    geometry: any[];
                    properties: {
                        name: string;
                        color: string;
                        borderColor: string;
                        value?: number;
                        tooltip: {
                            label: string;
                            value: string | number;
                        }[];
                        selected: {};
                    };
                }[];
            } = {
                type: 'FeatureCollection',
                features: [],
            };

            // shift for log
            let shift = 0;
            if (uiOptions.logOfHeat) {
                shift = Math.abs(choropleth.extremes.min) + 1;
            }

            if (GEO[choropleth.type]) {
                // look through the data values
                const geo = JSON.parse(
                    JSON.stringify(GEO[choropleth.type].data || {})
                ); //copy the data, we update it as we go
                const lookup = GEO[choropleth.type].lookup || {};

                // last one is the valid one
                for (
                    let dataIdx = 0, dataLen = choropleth.data.length - 1;
                    dataIdx <= dataLen;
                    dataIdx++
                ) {
                    let id = '';

                    const value = ignorePunctuation(
                        choropleth.data[dataIdx].id
                    );

                    // check the geo directly
                    if (geo.hasOwnProperty(value)) {
                        id = value;
                    }

                    // loop through the lookup to find it
                    if (!id) {
                        for (const l in lookup) {
                            if (
                                lookup.hasOwnProperty(l) &&
                                lookup[l].hasOwnProperty(value)
                            ) {
                                id = lookup[l][value];
                                break;
                            }
                        }
                    }

                    // it is not there or it has already been added
                    if (!id) {
                        continue;
                    }

                    // add the actual feature
                    let color = 'transparent',
                        borderColor =
                            uiOptions.layerStyle.borderColor || '#e0dede',
                        tempHeat = choropleth.data[dataIdx].heat;

                    // get the gradient color
                    for (
                        let gradientIdx = 0,
                            gradientLen = choropleth.gradient.length;
                        gradientIdx < gradientLen;
                        gradientIdx++
                    ) {
                        if (uiOptions.logOfHeat) {
                            tempHeat = Math.log(tempHeat + shift);
                        }

                        if (tempHeat >= choropleth.gradient[gradientIdx][1]) {
                            color = choropleth.gradient[gradientIdx][0];
                            break;
                        }
                    }

                    // get the border color
                    if (typeof uiOptions.highlight !== 'undefined') {
                        if (uiOptions.highlight.hasOwnProperty('data')) {
                            // match all of the area keys
                            selectedLoop: for (const key in choropleth.data[
                                dataIdx
                            ].selected) {
                                if (
                                    choropleth.data[
                                        dataIdx
                                    ].selected.hasOwnProperty(key)
                                ) {
                                    // look through the instances
                                    for (
                                        let selectedIdx = 0,
                                            selectedLen =
                                                choropleth.data[dataIdx]
                                                    .selected[key].length;
                                        selectedIdx < selectedLen;
                                        selectedIdx++
                                    ) {
                                        if (
                                            uiOptions.highlight.data[
                                                key
                                            ].indexOf(
                                                choropleth.data[dataIdx]
                                                    .selected[key][selectedIdx]
                                            ) > -1
                                        ) {
                                            borderColor = '#000000';
                                            break selectedLoop;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // update the properties
                    geo[id].properties = {
                        id: id,
                        name: geo[id].name,
                        color: color,
                        borderColor: borderColor,
                        value: choropleth.data[dataIdx].heat,
                        tooltip: choropleth.data[dataIdx].tooltip,
                        selected: choropleth.data[dataIdx].selected,
                    };
                }

                // add in the missing ones and format it
                for (const id in geo) {
                    const properties = {
                        id: id,
                        name: geo[id].name,
                        color: 'transparent',
                        borderColor:
                            uiOptions.layerStyle.borderColor || '#e0dede',
                        tooltip: [],
                        selected: {},
                    };

                    // format it properly
                    formatted.features.push({
                        type: 'Feature',
                        geometry: geo[id].geometry,
                        properties: geo[id].properties || properties,
                    });
                }
            }

            let highlight;
            const vectorGrid = L.vectorGrid
                .slicer(formatted, {
                    rendererFactory: L.canvas.tile,
                    vectorTileLayerStyles: {
                        sliced: function (properties, zoomLevel) {
                            return {
                                fill: true,
                                fillColor: properties.color,
                                fillOpacity: uiOptions.layerStyle.opacity,
                                // stroke: true,
                                color: properties.borderColor,
                                weight: 1,
                                opacity: 0.65,
                            };
                        },
                    },
                    minZoom: choropleth.zoom.min,
                    maxZoom: choropleth.zoom.max,
                    // indexMaxZoom: 5,       // max zoom in the initial tile index
                    interactive: true,
                    getFeatureId: function (feature) {
                        return feature.properties.id;
                    },
                })
                .on('mouseover', function (e) {
                    const properties = e.layer.properties;

                    // reset the highlight if it exists
                    if (highlight) {
                        vectorGrid.resetFeatureStyle(highlight);
                    }
                    highlight = properties.id;

                    vectorGrid.setFeatureStyle(properties.id, {
                        fill: true,
                        fillColor: properties.color,
                        fillOpacity:
                            uiOptions.layerStyle.opacity + 0.15 > 1
                                ? 0.95
                                : uiOptions.layerStyle.opacity + 0.15,
                        // stroke: true,
                        color: '#666',
                        weight: 1,
                        opacity: 0.65,
                    });

                    L.popup
                        .angular(
                            getChoroplethTooltip(
                                properties,
                                choropleth,
                                uiOptions.customTooltip
                            )
                        )
                        .setLatLng(e.latlng)
                        .openOn(vectorGrid._map);

                    // L.popup()
                    //     .setContent(getChoroplethTooltip(properties, choropleth, uiOptions.customTooltip))
                    //     .setLatLng(e.latlng)
                    //     .openOn(vectorGrid._map);
                })
                .on('mouseout', function (e) {
                    // reset the highlight if it exists
                    if (highlight) {
                        vectorGrid.resetFeatureStyle(highlight);
                    }
                    highlight = false;

                    vectorGrid._map.closePopup();
                })
                .on('click', function (e) {
                    const properties = e.layer.properties;
                    triggerEvent('click', properties.selected);
                });

            return vectorGrid;
            // return L.geoJson(formatted, {
            //     style: function (feature: any) {
            //         return {
            //             // Line
            //             weight: 1,
            //             opacity: 0.65,
            //             color: feature.properties.borderColor,
            //             // Area
            //             fillColor: feature.properties.color,
            //             fillOpacity: uiOptions.layerStyle.opacity
            //         };
            //     },
            //     onEachFeature: function (feature: any, layer: any) {
            //         if (uiOptions.showTooltips) {
            //             layer.bindTooltip(getChoroplethTooltip(feature.properties, choropleth), {
            //                 sticky: true
            //             });
            //         }

            //         layer.on({
            //             mouseover: function (e) {
            //                 const target = e.target;

            //                 target.setStyle({
            //                     weight: 2,
            //                     color: '#666',
            //                     fillOpacity: uiOptions.layerStyle.opacity + 0.15 > 1 ? 0.95 : uiOptions.layerStyle.opacity + 0.15
            //                 });

            //                 if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            //                     target.bringToFront();
            //                 }
            //             },
            //             mouseout: function (e) {
            //                 const target = e.target;

            //                 target.setStyle({
            //                     weight: 1,
            //                     color: feature.properties.borderColor,
            //                     fillOpacity: uiOptions.layerStyle.opacity
            //                 });
            //             },
            //             click: function (e) {
            //                 const selected = e.target.feature.properties.selected;
            //                 triggerEvent('click', selected);
            //             },
            //             contextmenu: function (e) {
            //                 //TODO
            //             }
            //         });
            //     }
            // });
        }

        /**
         * @name generateChoroplethLegend
         * @param choropleth - choropleth that you are creating a legend for
         * @param labelStyle - uiOptions.legend (font options for labels)
         * @desc add the legend to the map
         */
        function generateChoroplethLegend(
            choropleth: choropleth,
            labelStyle: any
        ): any {
            const legend = L.control({
                    position: 'topleft',
                }),
                styleOptions = `
                color: ${labelStyle.fontColor || '#000000'};
                font-size: ${labelStyle.fontSize || '12px'};
                font-family: ${labelStyle.fontFamily || 'Inter'};
                font-weight: ${labelStyle.fontWeight || 400};
            `;

            legend.onAdd = function () {
                const div = L.DomUtil.create('div', 'info legend');

                let html = '';
                html += `<div class="legend-text" style="${styleOptions}">Low</div>`;
                for (
                    let gradientIdx = choropleth.gradient.length - 1;
                    gradientIdx >= 0;
                    gradientIdx--
                ) {
                    html += `<i title="${
                        choropleth.format && choropleth.format[choropleth.label]
                            ? semossCoreService.visualization.formatValue(
                                  choropleth.gradient[gradientIdx][1],
                                  choropleth.format[choropleth.label]
                              )
                            : choropleth.gradient[gradientIdx][1]
                    }" style="background:${
                        choropleth.gradient[gradientIdx][0]
                    }"></i> `;
                }
                html += `<div class="legend-text" style="${styleOptions}">High</div>`;

                div.innerHTML = html;

                return div;
            };

            return legend;
        }

        /**
         * @name generateChoroplethTitle
         * @param chartTitle - uiOptions chartTitle object
         * @desc add the title to the map
         */
        function generateChoroplethTitle(chartTitle: any): any {
            const title = L.control({
                position: 'topright',
            });

            title.onAdd = function () {
                const div = L.DomUtil.create(
                    'div',
                    'choropleth-standard__chart-title'
                );

                let html = '';
                html += '<div>';
                html += chartTitle.text.replace(/_/g, ' ');
                html += '</div>';
                div.innerHTML = html;
                div.style.fontWeight = chartTitle.fontWeight || 'bold';
                div.style.fontSize = '' + chartTitle.fontSize + 'px' || '1em';
                div.style.fontFamily = chartTitle.fontFamily || 'sans-serif';
                div.style.color = chartTitle.fontColor || '#000000';

                return div;
            };

            return title;
        }

        /**
         * @name getChoroplethTooltip
         * @desc define the tooltip content for a data point
         * @param properties - properties values to show in tooltip
         * @param choropleth - choropleth that you are creating a tooltip for
         * @returns string of tooltip content
         */
        function getChoroplethTooltip(
            properties: {
                name: string;
                color: string;
                borderColor: string;
                value: number;
                tooltip: {
                    label: string;
                    value: string | number;
                }[];
                selected: {};
            },
            choropleth: choropleth,
            customTooltip: any
        ): any {
            let templateController: any = ['$content'],
                templateData = {
                    maxWidth: 'auto',
                    template: '',
                    controllerAs: 'tooltip',
                    controller: templateController,
                },
                tooltipHTML = '',
                tooltipContent: any,
                modelData: any = [];

            if (customTooltip.html) {
                // find the label and add it to the model
                for (const dim in choropleth.format) {
                    if (
                        choropleth.format.hasOwnProperty(dim) &&
                        choropleth.format[dim].model === 'label'
                    ) {
                        modelData.push({
                            name: dim,
                            value: properties.name,
                        });
                        break;
                    }
                }

                // add the heat value to the model
                modelData.push({
                    name: choropleth.label,
                    value: properties.value,
                });

                // add tooltips to the model
                for (
                    let tooltipIdx = 0;
                    tooltipIdx < properties.tooltip.length;
                    tooltipIdx++
                ) {
                    modelData.push({
                        name: properties.tooltip[tooltipIdx].label,
                        value: properties.tooltip[tooltipIdx].value,
                    });
                }

                // sets the model to scope.tooltip
                semossCoreService.visualization.setTooltipModel(
                    scope,
                    'tooltip',
                    modelData
                );
                templateData.template = customTooltip.html;
            } else {
                // the else will build a normal tooltip
                // add the name
                tooltipHTML += `<b>${properties.name}</b>`;
                if (
                    properties.hasOwnProperty('value') &&
                    properties.hasOwnProperty('color')
                ) {
                    tooltipHTML += `<br><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${
                        properties.color
                    };"></span>${String(choropleth.label).replace(
                        /_/g,
                        ' '
                    )}: ${
                        choropleth.format && choropleth.format[choropleth.label]
                            ? semossCoreService.visualization.formatValue(
                                  properties.value,
                                  choropleth.format[choropleth.label]
                              )
                            : properties.value
                    }`;
                }

                if (properties.tooltip) {
                    for (
                        let tooltipIdx = 0,
                            tooltipLen = properties.tooltip.length;
                        tooltipIdx < tooltipLen;
                        tooltipIdx++
                    ) {
                        tooltipHTML += `<br>${String(
                            properties.tooltip[tooltipIdx].label
                        ).replace(/_/g, ' ')}: ${
                            choropleth.format &&
                            choropleth.format[
                                properties.tooltip[tooltipIdx].label
                            ]
                                ? semossCoreService.visualization.formatValue(
                                      properties.tooltip[tooltipIdx].value,
                                      choropleth.format[
                                          properties.tooltip[tooltipIdx].label
                                      ]
                                  )
                                : properties.tooltip[tooltipIdx].value
                        }`;
                    }
                }

                templateData.template = tooltipHTML;
            }

            // set the controller for the tooltip
            templateController.push(function ($content) {
                if (scope.tooltip) {
                    for (const model in scope.tooltip) {
                        if (scope.tooltip.hasOwnProperty(model)) {
                            // merge into the scope
                            // @ts-ignore
                            this[model] = scope.tooltip[model];
                        }
                    }
                }
            });

            tooltipContent = templateData;

            return tooltipContent;
        }

        /**
         * @name getChoroplethExtremes
         * @desc determine minimum and maximum data points of size, lat, and long data
         * @param {array} data - data point values for heat
         */
        function getChoroplethExtremes(data: choroplethData[]): {
            min: number;
            max: number;
        } {
            let min: any, max: any;

            if (uiOptions.heatRange) {
                if (
                    uiOptions.heatRange.min.show &&
                    typeof uiOptions.heatRange.min.value !== 'undefined'
                ) {
                    min = uiOptions.heatRange.min.value;
                }

                if (
                    uiOptions.heatRange.max.show &&
                    typeof uiOptions.heatRange.max.value !== 'undefined'
                ) {
                    max = uiOptions.heatRange.max.value;
                }
            }

            if (min === undefined) {
                min = data.reduce(
                    (m: number, val: { heat: number }) =>
                        val.heat < m ? val.heat : m,
                    data[0] ? data[0].heat : 0
                );
            }

            if (max === undefined) {
                max = data.reduce(
                    (m: number, val: { heat: number }) =>
                        val.heat > m ? val.heat : m,
                    data[0] ? data[0].heat : 0
                );
            }

            return {
                min: min,
                max: max,
            };
        }

        /**
         * @name getChoroplethGradient
         * @desc define the heat gradient
         * @param extremes extremes of heat data
         * @returns object of colors and value
         */
        function getChoroplethGradient(extremes: {
            min: number;
            max: number;
        }): [string, number][] {
            let colorArray = uiOptions.heatmapColor || [],
                colorLen = colorArray.length,
                max = extremes.max,
                min = extremes.min,
                gradient: [string, number][] = [];

            // shift for log
            if (uiOptions.logOfHeat) {
                min = Math.log(extremes.min + Math.abs(extremes.min) + 1);
                max = Math.log(extremes.max + Math.abs(extremes.min) + 1);
            }

            const bin = (max - min) / colorLen;
            for (let colorIdx = 0; colorIdx < colorLen; colorIdx++) {
                gradient.unshift([colorArray[colorIdx], min + bin * colorIdx]);
            }

            return gradient;
        }

        /**
         * @name getChoroplethZoom
         * @desc determine the zoom range for the data
         * @param layer - layer data
         */
        function getChoroplethZoom(layer: any): { min: number; max: number } {
            let min = 0,
                max = 20;

            if (layer && layer.zoomRange) {
                if (min <= layer.zoomRange[0]) {
                    min = layer.zoomRange[0];
                }

                if (layer.zoomRange[1] <= max) {
                    max = layer.zoomRange[1];
                }
            }

            return {
                min: min,
                max: max,
            };
        }

        /** Events */
        /**
         * @name triggerEvent
         * @desc creates the event layer
         * @param type - type of event (mouseover, mouseout, click, etc.)
         * @param selected - selected data
         */
        function triggerEvent(
            type: string,
            selected: { string?: number }
        ): void {
            const mode = scope.widgetCtrl.getMode('selected') || 'default-mode',
                callbacks = scope.widgetCtrl.getEventCallbacks();

            if (mode === 'default-mode') {
                if (type === 'click') {
                    const actionData = {
                        data: selected,
                        eventType: '',
                        mouse: [],
                    };

                    if (clickTimer) {
                        clearTimeout(clickTimer);
                        clickTimer = null;

                        callbacks.defaultMode.onDoubleClick(actionData);
                    } else {
                        clickTimer = setTimeout(() => {
                            callbacks.defaultMode.onClick(actionData);
                            clickTimer = null;
                        }, 250);
                    }
                }
            }
        }

        /** Utility */
        /**
         * @name ignorePunctuation
         * @param item - original value
         * @desc remove all punctuation from string
         */
        function ignorePunctuation(item: string): string {
            if (typeof item === 'string') {
                return item
                    .replace(/[.\/#!$%\^&\*;:{}=\-_`~()]/g, '')
                    .replace(/ /g, '')
                    .toUpperCase();
            }

            return String(item);
        }

        /**
         * @name initialize
         * @desc creates the visualization on the chart div
         */
        function initialize(): void {
            let resizeListener: () => {},
                updateTaskListener: () => {},
                updateOrnamentsListener: () => {},
                addDataListener: () => {};

            // bind listeners
            resizeListener = scope.widgetCtrl.on(
                'resize-widget',
                resizeVisualization
            );
            updateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetVisualization
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetVisualization
            );
            addDataListener = scope.widgetCtrl.on(
                'added-data',
                resetVisualization
            );

            scope.$on('$destroy', function () {
                resizeListener();
                updateTaskListener();
                updateOrnamentsListener();
                addDataListener();

                // remove the map
                if (leafletMap) {
                    leafletMap.remove();
                }
            });

            resetVisualization();
        }

        initialize();
    }
}
