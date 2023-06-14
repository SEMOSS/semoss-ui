(function () {
    'use strict';

    /**
     * @name visualizations.service.js
     * @desc visualization service is the configuration service around all the visualizations SEMOSS supports. each visualization is defined through
     an object which outlines the config variables around that visualization.
     */
    angular.module('app.visualizations.service', [])
        .factory('visualizationService', visualizationService);

    visualizationService.$inject = ['monolithService', 'alertService', '$filter'];

    function visualizationService(monolithService, alertService, $filter) {
        //counter is used to force a redraw of tool data
        var vizCounter = 0;
        var visualizations = {
            "prerna.ui.components.playsheets.MashupPlaySheet": {
                title: "Mashup",
                svgSrc: "resources/img/svg/dashboard-svg-icon.svg",
                directiveName: "",
                directiveFiles: [],
                directiveOptions: "",
                layout: "Mashup",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: false,
                    saveAsSVG: false,
                    embedEnabled: false,
                    visualPanelOption: false,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                removeDuplicates: false,
                defaultVisualOptions: [],
                defaultToolOptions: {},
                getAdditionalVisualOption: function () {
                }
            },
            "Grid": {
                title: "Grid",
                svgSrc: "resources/img/svg/grid-svg-icon.svg",
                directiveName: "spreadjs",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/jquery/dist/jquery.min.js',
                            'SpreadJS/scripts/gcspread.sheets.all.9.40.20153.0.min.js',
                            'SpreadJS/scripts/interop/angular.gcspread.sheets.9.40.20153.0.min.js'
                        ]
                    },
                    {
                        files: [
                            'SpreadJS/css/gcspread.sheets.excel2016colorful.9.40.20153.0.css',
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/spreadjs/spreadjs.directive.js',
                            'custom/spreadjs/spreadjs-tools.directive.js'
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'spreadjs-tools',
                layout: "Grid",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'defaultHandle'
                ],
                hideWidgetHandles: [
                    'svg'
                ],
                removeDuplicates: true,
                defaultVisualOptions: [],
                defaultToolOptions: {},
                getAdditionalVisualOption: function () {
                    return false
                }
            },
            "Graph": {
                title: "Force",
                svgSrc: "resources/img/svg/force-svg-icon.svg",
                directiveName: "force-graph",
                directiveOptions: {
                    'class': 'viz', 'viz-input': 'visual.vizInput'
                },
                directiveTools: 'force-graph-tools',
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'custom/force-graph/force.css'
                        ]
                    },
                    {
                        files: [
                            //'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            //'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'standard/resizer/resizer.directive.js',
                            'custom/force-graph/force-graph.directive.js',
                            'custom/force-graph/force-graph-tools.directive.js',
                            'custom/force-graph/force-graph.service.js'
                        ]
                    }
                ],
                layout: "Graph",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                hideWidgetHandles: [
                    'filter',
                    'brush'
                ],
                removeDuplicates: false,
                defaultVisualOptions: [],
                defaultToolOptions: {
                    'propertiesTableToggle': false,
                    'graphLockToggle': false,
                    'highlightOption': null,
                    'selectedNode': null,
                    'traverseList': {}
                },
                getAdditionalVisualOption: function () {

                }
            },
            "VivaGraph": {
                title: "VivaGraph",
                svgSrc: "resources/img/svg/force-svg-icon.svg",
                directiveName: "viva-graph",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'bower_components/vivagraphjs/dist/vivagraph.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'custom/viva-graph/viva-graph.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/viva-graph/viva-graph.directive.js',
                            'custom/viva-graph/viva-graph-tools.directive.js',
                            'custom/viva-graph/viva-graph.service.js'
                        ]
                    }
                ],
                directiveOptions: {},
                directiveTools: "viva-graph-tools",
                layout: "VivaGraph",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                hideWidgetHandles: [
                    'brush' //still in development
                ],
                removeDuplicates: false,
                defaultVisualOptions: [],
                defaultToolOptions: {},
                getAdditionalVisualOption: function () {

                }
            },
            "Column": {
                title: "Bar",
                svgSrc: "resources/img/svg/bar-svg-icon.svg",
                directiveName: 'jv-viz jv-bar',
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js',
                            'bower_components/angular-ui-select/dist/select.min.css',
                            'bower_components/angular-ui-select/dist/select.min.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvTip.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/jv-viz/jv-viz.directive.js',
                            'custom/jv-bar/jv-bar.directive.js',
                            'custom/jv-bar/jv-bar-tools.directive.js'
                        ]
                    }
                ],
                directiveOptions: '',
                directiveTools: 'jv-bar-tools',
                layout: "Column",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'displayValues',
                    'sortValues',
                    'flipSeries',
                    'stackData',
                    'flipAxis',
                    'defaultHandle'
                ],
                removeDuplicates: true,
                defaultVisualOptions: [
                    {
                        model: "label",
                        name: "Label",
                        optionGroup: "Label",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "value 1",
                        name: "Value",
                        optionGroup: "Value",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: true
                    }
                ],
                defaultToolOptions: {
                    'rotateAxis': false,
                    'seriesFlipped': false,
                    'displayValues': false,
                    'sortLabel': 'none',
                    'sortType': 'none',
                    'color': 'none',
                    'stackToggle': false,
                    'colorName': 'Semoss',
                    'backgroundColor': '#FFFFFF'
                },
                colorElements: function (dataTableAlign, data) {
                    var colorElements = [];
                    for (var key in dataTableAlign) {
                        if (dataTableAlign.hasOwnProperty(key) && key !== 'label') {
                            colorElements.push(dataTableAlign[key]);
                        }
                    }

                    return colorElements;
                },
                getAdditionalVisualOption: function (count) {
                    return {
                        model: 'value ' + count,
                        name: 'Value' + count,
                        optionGroup: "Value",
                        selected: '',
                        delete: true,
                        type: "STRING",
                        grouping: false,
                        multiField: true
                    };
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return getGenericDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "WorldMap": {
                title: "World Map",
                svgSrc: "resources/img/svg/geo-svg-icon.svg",
                directiveName: "esri-map",
                directiveFiles: [
                    {
                        files: [
                            'bower_components/d3-playsheet/d3.min.js'
                        ]
                    },
                    {
                        files: [
                            'https://js.arcgis.com/3.16/esri/css/esri.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'custom/esri-map/esri-map.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/esri-map/esri-map.service.js',
                            'custom/esri-map/esri-map.directive.js',
                            'custom/esri-map/esri-map-tools.directive.js'
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'esri-map-tools',
                layout: "WorldMap",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'defaultHandle'
                ],
                removeDuplicates: false,
                defaultVisualOptions: [
                    {
                        model: "label",
                        name: "Label",
                        optionGroup: 'Label',
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField:false
                    }, {
                        model: "lat",
                        name: "Latitude",
                        optionGroup: 'Latitude',
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField:false
                    }, {
                        model: "lon",
                        name: "Longitude",
                        optionGroup: "Longitude",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField:false
                    }, {
                        model: "size",
                        name: "Size",
                        optional: true,
                        optionGroup: "Size",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        multiField:false
                    },
                    {
                        model: "color",
                        name: "Color",
                        optional: true,
                        optionGroup: "Color",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        multiField:false
                    }
                ],
                defaultToolOptions: {
                    'baseLayer': 'streets',
                    drawLineToggle: false
                },
                getAdditionalVisualOption: function () {
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return getGenericDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "HeatMap": {
                title: "Heat Map",
                svgSrc: "resources/img/svg/heatmap-svg-icon.svg",
                directiveName: "heatmap",
                directiveOptions: {
                    class: 'heatmap'
                },
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'custom/heatmap/heatmap.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/heatmap/heatmap.directive.js',
                            'custom/heatmap/heatmap-tools.directive.js',
                            'custom/specific/tap/tap.service.js'
                        ]
                    }
                ],
                directiveTools: 'heatmap-tools',
                layout: "HeatMap",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'edit',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'numberOfBuckets',
                    'defaultHandle'
                ],
                removeDuplicates: true,
                defaultVisualOptions: [
                    {
                        model: "x",
                        name: "X-Axis",
                        optionGroup: 'X-Axis',
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField:false
                    },
                    {
                        model: "y",
                        name: "Y-Axis",
                        optionGroup: 'Y-Axis',
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField:false
                    },
                    {
                        model: "heat",
                        name: "Heat",
                        optionGroup: 'Heat',
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField:false
                    }
                ],
                defaultToolOptions: {
                    'color': 'Red',
                    'buckets': '10',
                    'colorLabel': 'none',
                    'min': '0',
                    'max': '10',
                    'domainArray': "",
                    'colors': ["#fbf2d2", "#fdedb5", "#fee7a0", "#ffda84", "#ffc665", "#feb44e", "#fea743", "#fd9b3f", "#fd8c3c", "#fd7735", "#fd602f", "#fb4b29", "#f43723", "#ea241e", "#e0161c", "#d60b20", "#c80324", "#b10026", "#870025", "#620023"],
                    'step': '1',
                    'quantiles': true
                },
                getAdditionalVisualOption: function () {
                    return false;
                },
                getDataModel: function (vizData, localVisualOptions) {

                    var newCalculatedCol = {},
                        heatMapData = {
                            layout: this.layout,
                            headers: vizData.headers,
                            data: createTableData('HeatMap', localVisualOptions, vizData),
                            dataTableAlign: {
                                x: localVisualOptions.list[0].selected,
                                y: localVisualOptions.list[1].selected,
                                heat: localVisualOptions.list[2].selected
                            }
                        };


                    //set the heat value to the correct grouping
                    if (localVisualOptions.list[2].grouping) {
                        var keyName = localVisualOptions.list[2].selected;
                        var colCalculated = _.find(heatMapData.headers, {title: localVisualOptions.list[2].selected}).calculated;
                        //if you don't have a calculated column, add the new column and set its new name
                        //or if you do have a column calculated, check if its grouped on a different values
                        if (!colCalculated || (colCalculated && colCalculated.groupedOn !== localVisualOptions.list[0].selected)) {
                            keyName += "_" + localVisualOptions.list[2].grouping + "_on_" + localVisualOptions.list[0].selected;

                            if (!_.find(heatMapData.headers, {title: keyName})) {
                                newCalculatedCol[keyName] = {
                                    title: localVisualOptions.list[2].selected,
                                    grouping: localVisualOptions.list[2].grouping,
                                    groupedOn: localVisualOptions.list[0].selected
                                };
                            }
                            //we know its a calculated column so we need to update the selection
                            localVisualOptions.list[2].selected = keyName;
                        }
                        heatMapData.dataTableAlign.heat = keyName;
                    }

                    heatMapData.headers = _.isEmpty(newCalculatedCol) ? heatMapData.headers : formatNewHeaders(heatMapData.headers, newCalculatedCol);

                    angular.extend(vizData, heatMapData);
                    return vizData;
                }
            },
            "Line": {
                title: "Line",
                svgSrc: "resources/img/svg/line-svg-icon.svg",
                directiveName: 'jv-viz jv-line',
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvTip.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/jv-viz/jv-viz.directive.js',
                            'custom/jv-line/jv-line.directive.js',
                            'custom/jv-line/jv-line-tools.directive.js'
                        ]
                    }
                ],
                directiveOptions: '',
                directiveTools: 'jv-line-tools',
                layout: "Line",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'sortValues',
                    'flipAxis',
                    'defaultHandle'
                ],
                removeDuplicates: true,
                defaultVisualOptions: [
                    {
                        model: "label",
                        name: "Label",
                        selected: "",
                        optionGroup: "Label",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "value 1",
                        name: "Value",
                        optionGroup: "Value",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: true
                    }
                ],
                colorElements: function (dataTableAlign) {
                    var colorElements = [];
                    for (var key in dataTableAlign) {
                        if (dataTableAlign.hasOwnProperty(key) && key !== 'label') {
                            colorElements.push(dataTableAlign[key]);
                        }
                    }
                    return colorElements;
                },
                defaultToolOptions: {
                    'sortLabel': 'none',
                    'sortType': 'none',
                    'rotateAxis': false,
                    'color': 'none',
                    'displayValues': false,
                    'colorName': 'Semoss',
                    'backgroundColor': '#FFFFFF'
                },
                getAdditionalVisualOption: function (count) {
                    return {
                        model: 'value ' + count,
                        name: 'Extra Value',
                        optionGroup: "Value",
                        selected: '',
                        delete: true,
                        type: "STRING",
                        grouping: false,
                        multiField: true
                    };
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return getGenericDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "Pie": {
                title: "Pie",
                svgSrc: "resources/img/svg/pie-svg-icon.svg",
                directiveName: "jv-viz jv-pie",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvTip.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/jv-viz/jv-viz.directive.js',
                            'custom/jv-pie/jv-pie.directive.js',
                            'custom/jv-pie/jv-pie-tools.directive.js'
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'jv-pie-tools',
                layout: "Pie",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'defaultHandle'
                ],
                removeDuplicates: true,
                defaultVisualOptions: [
                    {
                        model: "label",
                        name: "Label",
                        selected: "",
                        optionGroup: "Label",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "value",
                        name: "Group",
                        optionGroup: "Group",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }
                ],
                defaultToolOptions: {
                    'color': 'none',
                    'colorName': 'Semoss',
                    'backgroundColor': '#FFFFFF'
                },
                colorElements: function (dataTableAlign, data) {
                    var colorElements = [];
                    for (var i = 0; i < data.length; i++) {
                        if (colorElements.indexOf(data[i][dataTableAlign.label]) === -1) {
                            colorElements.push(data[i][dataTableAlign.label]);
                        }

                    }
                    return colorElements;
                },
                getAdditionalVisualOption: function () {
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return getGenericDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "Scatter": {
                title: "Scatter",
                svgSrc: "resources/img/svg/scatter-svg-icon.svg",
                directiveName: "jv-viz jv-scatter",
                directiveFiles: [
                    {
                        series: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvTip.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/jv-viz/jv-viz.directive.js',
                            'custom/jv-scatter/jv-scatter.directive.js',
                            'custom/jv-scatter/jv-scatter-tools.directive.js'
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'jv-scatter-tools',
                layout: "Scatter",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'zToggle',
                    'lineToggle',
                    'xReversed',
                    'yReversed',
                    'defaultHandle',
                ],
                removeDuplicates: true,
                defaultVisualOptions: [
                    {
                        model: "label",
                        name: "Label",
                        optionGroup: "Label",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false
                    }, {
                        model: "x",
                        name: "X-Axis",
                        optionGroup: "X-Axis",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false
                    }, {
                        model: "y",
                        name: "Y-Axis",
                        optionGroup: "Y-Axis",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false
                    }, {
                        model: "z",
                        name: "Z-Axis",
                        optional: true,
                        optionGroup: "Z-Axis",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false
                    }, {
                        model: "series",
                        name: "Series",
                        optionGroup: "Series",
                        optional: true,
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false
                    }
                ],
                defaultToolOptions: {
                    'color': 'none',
                    'toggleZ': true,
                    'lineGuide': true,
                    'customAxisNeeded': false,
                    'colorName': "none",
                    'xReversed': false,
                    'yReversed': false
                },
                colorElements: function (dataTableAlign, data) {
                    var colorElements = [];
                    if (dataTableAlign.series) {
                        for (var i = 0; i < data.length; i++) {
                            if (colorElements.indexOf(data[i][dataTableAlign.series]) === -1) {
                                colorElements.push(data[i][dataTableAlign.series]);
                            }
                        }
                    } else {
                        colorElements.push(dataTableAlign.label);
                    }

                    return colorElements;
                },
                getAdditionalVisualOption: function () {
                    return false
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return scatterDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "ParallelCoordinates": {
                title: "Parallel Coordinates",
                svgSrc: "resources/img/svg/parallelcoordinates-svg-icon.svg",
                directiveName: "d3-parcoords",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js',
                            'bower_components/d3-parcoords/d3.parcoords.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'custom/parcoords/parcoords.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/parcoords/parcoords.directive.js',
                            'custom/parcoords/parcoords-tools.directive.js'
                        ]
                    }
                ],
                directiveOptions: {
                    class: 'parcoords'
                },
                directiveTools: 'parcoords-tools',
                layout: "ParallelCoordinates",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'edit',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'defaultHandle'
                ],
                removeDuplicates: false,
                defaultVisualOptions: [
                    {
                        model: "value 1",
                        name: "Value",
                        optionGroup: "Value",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        multiField: true
                    }
                    //{
                    //    model: "dim 1",
                    //    name: "Dimension 2",
                    //    isCollapsed: true,
                    //    selected: "",
                    //    delete: false,
                    //    type: "STRING"
                    //}
                ],
                defaultToolOptions: {
                    widthFitToScreen: false,
                    heightFitToScreen: false

                },
                getAdditionalVisualOption: function (count) {
                    count += 1;
                    return {
                        model: 'value ' + (count),
                        name: 'Value ' + count,
                        optionGroup: 'Value',
                        selected: '',
                        delete: true,
                        type: "STRING",
                        multiField: true
                    };
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return parrallelVizDataModel(vizData, localVisualOptions, this.layout);
                },
                getDropDownValues: function (vizData) {
                    var values = [];
                    for (var i in vizData.dataTableAlign) {
                        values.push(vizData.dataTableAlign[i]);
                    }
                    return values;
                }
            },
            "SingleAxisCluster": {
                title: "Single Axis Cluster",
                svgSrc: "resources/img/svg/single-axis-cluster-svg-icon.svg",
                directiveName: 'single-axis-cluster',
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/single-axis-cluster/single-axis-cluster.directive.js',
                            'custom/single-axis-cluster/single-axis-cluster-tools.directive.js'
                        ]
                    }
                ],
                directiveOptions: '',
                directiveTools: 'single-axis-cluster-tools',
                layout: "SingleAxisCluster",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'defaultHandle'
                ],
                removeDuplicates: false,
                defaultVisualOptions: [
                    {
                        model: "x-axis",
                        name: "X-Axis",
                        optionGroup: "X-Axis",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "size",
                        name: "Size",
                        optionGroup: "Size",
                        optional: true,
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "label",
                        name: "Label",
                        optionGroup: "Tooltip",
                        optional: true,
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: true
                    }],
                defaultToolOptions: {'splitData': '', 'colorDataCategory': '', colorDataInstance: ''},
                getAdditionalVisualOption: function (count) {
                    count += 1;
                    return {
                        model: 'label' + (count),
                        name: 'Label ' + (count),
                        optionGroup: "Tooltip",
                        optional: true,
                        selected: '',
                        delete: true,
                        type: "STRING"
                    };

                },
                getDataModel: function (vizData, localVisualOptions) {
                    return getGenericDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "Cluster": {
                title: "Cluster",
                svgSrc: "resources/img/svg/cluster-svg-icon.svg",
                directiveName: "cluster",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/cluster/cluster.directive.js'
                        ]
                    }
                ],
                directiveOptions: '',
                directiveTools: '',
                layout: "Cluster",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'defaultHandle'
                ],
                removeDuplicates: false,
                defaultVisualOptions: [
                    {
                        model: "label",
                        name: "Label",
                        optionGroup: "Label",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        multiField: false
                    },
                    {
                        model: "clusterID",
                        name: "Cluster",
                        optionGroup: "Cluster",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        multiField: false
                    }, {
                        model: 'tooltip',
                        name: 'Tooltip',
                        optionGroup: 'Tooltip',
                        selected: '',
                        optional: true,
                        delete: true,
                        type: "STRING",
                        multiField: true
                    }
                ],
                defaultToolOptions: {},
                getAdditionalVisualOption: function (count) {
                    count += 1;
                    return {
                        model: 'tooltip' + (count),
                        name: 'Tooltip ' + (count),
                        optionGroup: "Tooltip",
                        optional: true,
                        selected: '',
                        delete: true,
                        type: "STRING",
                        multiField: true
                    };
                }
            },
            "Dendrogram": {
                title: "Dendrogram",
                svgSrc: "resources/img/svg/dendrogram-svg-icon.svg",
                directiveName: "dendrogram",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/dendrogram/dendrogram.directive.js'
                        ]
                    }
                ],
                directiveOptions: '',
                directiveTools: '',
                layout: "Dendrogram",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'defaultHandle'
                ],
                removeDuplicates: false,
                defaultVisualOptions: [
                    {
                        model: "dim 0",
                        name: "Dimension 1",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        multiField: true
                    },
                    {
                        model: "dim 1",
                        name: "Dimension 2",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        multiField: true
                    }
                ],
                defaultToolOptions: {},
                getAdditionalVisualOption: function (count) {
                    count += 1;
                    return {
                        model: 'dim ' + (count - 1),
                        name: 'Dimension ' + count,
                        selected: '',
                        delete: true,
                        type: "STRING",
                        multiField: true
                    };
                }
            },
            "ScatterplotMatrix": {
                title: "Scatter Matrix",
                svgSrc: "resources/img/svg/scattermatrix-svg-icon.svg",
                directiveName: "scatter-matrix",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/scatter-matrix/scatter-matrix.directive.js'
                        ]
                    }
                ],
                directiveOptions: '',
                directiveTools: '',
                layout: "ScatterplotMatrix",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'defaultHandle'
                ],
                removeDuplicates: true,
                defaultVisualOptions: [
                    {
                        model: "dim 1",
                        name: "Dimension 1",
                        optionGroup: "Dimension",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        multiField: true
                    }
                ],
                defaultToolOptions: {},
                getAdditionalVisualOption: function (count) {
                    count += 1;
                    return {
                        model: 'dim ' + (count),
                        name: 'Dimension ' + count,
                        optionGroup: 'Dimension',
                        selected: '',
                        delete: true,
                        type: "STRING",
                        multiField: true
                    };
                }
            },
            "Sankey": {
                title: "Sankey",
                svgSrc: "resources/img/svg/sankey-svg-icon.svg",
                directiveName: 'jv-viz sankey',
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js',
                            'bower_components/d3-sankey/sankey/sankey.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvTip.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/jv-viz/jv-viz.directive.js',
                            'custom/sankey/sankey.directive.js'
                        ]
                    }
                ],
                directiveOptions: '',
                layout: "Sankey",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                defaultVisualOptions: [
                    {
                        model: "source",
                        name: "Source",
                        optionGroup: "Source",
                        selected: "",
                        delete: false,
                        grouping: false,
                        type: "STRING",
                        multiField: false
                    },
                    {
                        model: "target",
                        name: "Target",
                        optionGroup: "Target",
                        selected: "",
                        delete: false,
                        grouping: false,
                        type: "STRING",
                        multiField: false
                    },
                    {
                        model: "value",
                        name: "Value",
                        optionGroup: "Value",
                        selected: "",
                        delete: false,
                        grouping: false,
                        type: "NUMBER",
                        multiField: false
                    }
                ],
                defaultToolOptions: {
                    'color': 'none',
                    'colorName': 'Semoss',
                    'backgroundColor': '#FFFFFF'
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'color',
                    'defaultHandle'
                ],
                editPanel: false,
                mashupEnabled: true,
                defaultOptions: [],
                getAdditionalVisualOption: function (count) {
                    count += 1;
                    return {
                        model: 'value ' + (count - 1),
                        name: 'Value ' + (count - 1),
                        optionGroup: 'Value',
                        selected: '',
                        delete: true,
                        type: "STRING",
                        multiField: true
                    };
                },
                getDefaultToolOptions: function () {

                },
            },
            "prerna.ui.components.playsheets.SankeyPlaySheet": {
                title: "Sankey",
                type: "Sankey",
                svgSrc: "resources/img/svg/sankey-svg-icon.svg",
                directiveName: 'sankey',
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js',
                            'bower_components/d3-sankey/sankey/sankey.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/sankey/sankey.directive.js'
                        ]
                    }
                ],
                directiveOptions: '',
                imgSrc: "",
                layout: "prerna.ui.components.playsheets.SankeyPlaySheet",
                defaultVisualOptions: [],
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                editPanel: false,
                mashupEnabled: true,
                getAdditionalVisualOption: function () {
                },
                defaultToolOptions: {
                }
            },
            "Sunburst": {
                title: "Sunburst",
                svgSrc: "resources/img/svg/sunburst-svg-icon.svg",
                directiveName: "sunburst",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/sunburst/sunburst.directive.js',
                            'custom/sunburst/sunburst-tools.directive.js'
                        ]
                    }
                ],
                directiveTools: 'sunburst-tools',
                directiveOptions: "",
                layout: "Sunburst",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'displayValues',
                    'defaultHandle'
                ],
                defaultVisualOptions: [
                    {
                        model: "size",
                        name: "Size",
                        optionGroup: "Size",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        multiField: false
                    },
                    {
                        model: "dim 0",
                        name: "Dimension",
                        optionGroup: "Dimension",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        multiField: true
                    }
                ],
                defaultToolOptions: {
                    labelOnButton: true,
                    'displayValues': false,
                    color: 'Semoss'
                },
                getAdditionalVisualOption: function (count) {
                    count += 1;
                    return {
                        model: 'dim ' + (count),
                        name: 'Dimension ' + (count),
                        optionGroup: 'Dimension',
                        selected: '',
                        delete: true,
                        type: "STRING",
                        multiField: true
                    };
                },
                getDataModel: function (vizData, localVisualOptions) {
                }
            },
            "Radial": {
                title: "Radial",
                svgSrc: "resources/img/svg/radial-svg-icon.svg",
                directiveName: "jv-viz radial",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvTip.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/jv-viz/jv-viz.directive.js',
                            'custom/radial/radial.directive.js',
                            'custom/radial/radial-tools.directive.js'
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'radial-tools',
                layout: "Radial",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'defaultHandle'
                ],
                removeDuplicates: true,
                defaultVisualOptions: [
                    {
                        model: "label",
                        name: "Label",
                        selected: "",
                        optionGroup: "Label",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "value",
                        name: "Value",
                        optionGroup: "Value",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }
                ],
                defaultToolOptions: {
                    'color': 'none',
                    'colorName': 'Semoss',
                    'backgroundColor': '#FFFFFF'
                },
                colorElements: function (dataTableAlign, data) {
                    var colorElements = [];
                    for (var i = 0; i < data.length; i++) {
                        if (colorElements.indexOf(data[i][dataTableAlign.label]) === -1) {
                            colorElements.push(data[i][dataTableAlign.label]);
                        }

                    }
                    return colorElements;
                },
                getAdditionalVisualOption: function () {
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return getGenericDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "TreeMap": {
                title: "TreeMap",
                svgSrc: "resources/img/svg/treemap-svg-icon.svg",
                directiveName: "jv-viz tree-map",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvTip.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/jv-viz/jv-viz.directive.js',
                            'custom/treemap/treemap.directive.js',
                            'custom/treemap/treemap-tools.directive.js'
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'tree-map-tools',
                layout: "TreeMap",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: ['color'],
                removeDuplicates: true,
                defaultVisualOptions: [
                    {
                        model: "label",
                        name: "Label",
                        isCollapsed: false,
                        selected: "",
                        optionGroup: "Label",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "size",
                        name: "Size",
                        isCollapsed: true,
                        optionGroup: "Size",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "series",
                        name: "Series",
                        isCollapsed: true,
                        optionGroup: "Series",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }
                ],
                defaultToolOptions: {
                    'color': 'none',
                    'colorName': 'Semoss',
                    'backgroundColor': '#FFFFFF'
                },
                colorElements: function (dataTableAlign, data) {
                    var colorElements = [];
                    for (var i = 0; i < data.length; i++) {
                        if (colorElements.indexOf(data[i][dataTableAlign.label]) === -1) {
                            colorElements.push(data[i][dataTableAlign.label]);
                        }

                    }
                    return colorElements;
                },
                getAdditionalVisualOption: function () {
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return getGenericDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "Dashboard": {
                title: "Dashboard",
                svgSrc: "resources/img/svg/dashboard-svg-icon.svg",
                directiveName: "jv-viz dashboard",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/jv-viz/jv-viz.directive.js',
                            'custom/dashboard/dashboard.directive.js',
                            'custom/dashboard/dashboard.css',
                            'custom/dashboard/dashboard.directive.html',
                            'custom/dashboard/dashboard-tools.directive.js',
                            'custom/dashboard/dashboard-tools.directive.html'
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'dashboard-tools',
                layout: "Dashboard",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'defaultHandle'
                ],
                removeDuplicates: true,
                defaultVisualOptions: [
                    {
                        model: "group1",
                        name: "Group 1",
                        selected: "",
                        optionGroup: "Group 1",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "group2",
                        name: "Group 2",
                        selected: "",
                        optionGroup: "Group 2",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "group3",
                        name: "Group 3",
                        selected: "",
                        optionGroup: "Group 3",
                        optional: true,
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "value",
                        name: "Value",
                        selected: "",
                        optionGroup: "Value",
                        optional: true,
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }
                ],
                defaultToolOptions: {
                    'color': 'none',
                    'colorName': 'Semoss',
                    'backgroundColor': '#FFFFFF'
                },
                colorElements: function (dataTableAlign, data) {
                    var colorElements = [];
                    for (var i = 0; i < data.length; i++) {
                        if (colorElements.indexOf(data[i][dataTableAlign.label]) === -1) {
                            colorElements.push(data[i][dataTableAlign.label]);
                        }

                    }
                    return colorElements;
                },
                getAdditionalVisualOption: function () {
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return getGenericDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "Pack": {
                title: "Pack",
                svgSrc: "resources/img/svg/pack-svg-icon.svg",
                directiveName: "jv-viz jv-pack",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvTip.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/jv-viz/jv-viz.directive.js',
                            'custom/jv-pack/jv-pack.directive.js',
                            'custom/jv-pack/jv-pack-tools.directive.js',
                            'custom/jv-pack/jv-pack-tools.directive.html'
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'jv-pack-tools',
                layout: "Pack",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: true,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'defaultHandle'
                ],
                removeDuplicates: true,
                defaultVisualOptions: [
                    {
                        model: "group1",
                        name: "Group 1",
                        isCollapsed: false,
                        selected: "",
                        optionGroup: "Group 1",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "group2",
                        name: "Group 2",
                        isCollapsed: false,
                        selected: "",
                        optionGroup: "Group 2",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "group3",
                        name: "Group 3",
                        isCollapsed: false,
                        selected: "",
                        optionGroup: "Group 3",
                        optional: true,
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "value",
                        name: "Value",
                        isCollapsed: false,
                        selected: "",
                        optionGroup: "Value",
                        optional: false,
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }
                ],
                defaultToolOptions: {
                    'color': 'none',
                    'colorName': 'Semoss',
                    'backgroundColor': '#FFFFFF'
                },
                colorElements: function (dataTableAlign, data) {
                    var colorElements = [];
                    for(var ele in dataTableAlign){
                        colorElements.push(dataTableAlign[ele]);
                    }
                    return colorElements;
                },
                getAdditionalVisualOption: function () {
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return getGenericDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "Gantt": {
                title: "Gantt",
                svgSrc: "resources/img/svg/chart-gantt.svg",
                directiveName: "jv-viz Gantt",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js',
                            //'bower_components/angular-sanitize/angular-sanitize.min.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'resources/js/jvCharts/jv.css',
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvTip.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/jv-viz/jv-viz.directive.js',
                            'custom/gantt/gantt.directive.js',
                            'custom/gantt/gantt-tools.directive.js'
                        ]
                    }
                ],
                directiveTools: "gantt-tools",
                directiveOptions: "",
                layout: "Gantt",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: false,
                    analyticsPanel: false,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: true,
                    exportToCSV: false,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: true,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'defaultHandle'
                ],
                defaultVisualOptions: [
                    {
                        model: "Group",
                        name: "Group",
                        optionGroup: "Group",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "startDate1",
                        name: "Start Date 1",
                        optionGroup: "Start Date 1",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "endDate1",
                        name: "End Date 1",
                        optionGroup: "End Date 1",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    },
                    {
                        model: "startDate2",
                        name: "Start Date 2",
                        optionGroup: "Start Date 2",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false,
                        optional: true
                    }, {
                        model: "endDate2",
                        name: "End Date 2",
                        optionGroup: "End Date 2",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false,
                        optional: true
                    }
                ],
                defaultToolOptions: {
                    readOnly: false,
                    'rotateAxis': true,
                    'seriesFlipped': false,
                    'displayValues': false,
                    'color': 'none',
                    'colorName': 'Semoss',
                    'backgroundColor': '#FFFFFF'
                },
                getAdditionalVisualOption: function (count) {
                    //return [{
                    //    model: 'startDate ' + count,
                    //    name: 'Start Date' + count,
                    //    optionGroup: "Start Date",
                    //    isCollapsed: true,
                    //    selected: '',
                    //    delete: true,
                    //    type: "STRING",
                    //    grouping: false,
                    //    multiField: true
                    //},{
                    //    model: 'endDate ' + count,
                    //    name: 'End Date' + count,
                    //    optionGroup: "End Date",
                    //    isCollapsed: true,
                    //    selected: '',
                    //    delete: true,
                    //    type: "STRING",
                    //    grouping: false,
                    //    multiField: true
                    //}];
                },
                getDataModel: function (vizData, localVisualOptions) {
                }
            },
            create: {
                title: "Create",
                svgSrc: "resources/img/svg/-svg-icon.svg",
                directiveName: "",
                directiveFiles: [],
                directiveOptions: "",
                directiveTools: '',
                layout: "create",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: true,
                    analyticsPanel: true,
                    dashboardEnabled: true,
                    recipePanel: true,
                    smssGrid: false,
                    exportToCSV: true,
                    saveAsSVG: false,
                    embedEnabled: false,
                    visualPanelOption: false,
                    saveEnabled: true,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'visual',
                    'create',
                    'console',
                    'defaultHandle'
                ],
                defaultToolOptions: {},
                defaultVisualOptions: [],
                hideWidgetHandles: [],
                getAdditionalOption: function () {
                },
                getDataModel: function (vizData, localVisualOptions) {
                }
            },
            "prerna.ui.components.specific.tap.MHSDashboardDrillPlaysheet": {
                title: "statusDashboard",
                svgSrc: "resources/img/green-logo.svg",
                directiveName: "status-dashboard",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/status-dashboard/status-dashboard.css',
                            'custom/status-dashboard/status-dashboard.directive.js',
                            'custom/status-dashboard/status-dashboard-tools.directive.js',
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'status-dashboard-tools',
                layout: "statusDashboard",
                config: {
                    toolPanel: true,
                    visualPanel: false,
                    filterPanel: false,
                    analyticsPanel: false,
                    dashboardEnabled: true,
                    recipePanel: false,
                    smssGrid: true,
                    exportToCSV: false,
                    visualPanelOption: false,
                    saveEnabled: true,
                    pkqlEnabled: false
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                removeDuplicates: true,
                defaultVisualOptions: [
                    {
                        model: "label",
                        name: "Label",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField: false
                    }, {
                        model: "x",
                        name: "X-Axis",
                        selected: "",
                        delete: false,
                        type: "STRING",
                        grouping: false,
                        multiField:false
                    }
                ],
                defaultToolOptions: {
                    'color': 'none',
                    'toggleZ': false,
                    'lineGuide': true,
                    'customAxisNeeded': false,
                    'colorName': "none"
                },
                hideWidgetHandles: [
                    'visual',
                    'brush'
                ],
                getAdditionalToolData: function (vizData) {
                    var data = vizData;
                    var filteredKeys = [];
                    var filteredData = [];
                    var colorName = data.uiOptions.colorName;
                    var color = data.uiOptions.color;

                    if (_.isEmpty(data.dataTableAlign.series)) {
                        filteredKeys.push(data.dataTableAlign['label']);
                        return {colorName: colorName, colorLabels: filteredKeys, color: color};
                    }
                    else {
                        var conceptName = data.dataTableAlign['series'];
                        for (var object in data.data) {
                            filteredData.push($filter("shortenAndReplaceUnderscores")(data.data[object][conceptName]));
                        }
                    }
                    return {colorName: colorName, colorLabels: _.uniq(filteredData), color: color};
                },

                getAdditionalVisualOption: function () {
                    return false
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return scatterDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            /*             title: "Upload",
             svgSrc: "resources/img/svg/-svg-icon.svg",
             directiveName: "",
             directiveOptions: "",
             directiveTools: '',
             layout: "upload",
             config: {
             toolPanel: true,
             visualPanel: true,
             filterPanel: true,
             analyticsPanel: true,
             dashboardEnabled: true,
             recipePanel: true,
             smssGrid: false,
             exportToCSV: true,
             saveAsSVG: false,
             embedEnabled: false,
             visualPanelOption: false,
             saveEnabled: true,
             pkqlEnabled: true
             },
             defaultToolOptions: {},
             defaultVisualOptions: [],
             getAdditionalOption: function () {
             },
             getDataModel: function (vizData, localVisualOptions) {
             }
             },
             params: {
             title: "Params",
             svgSrc: "resources/img/svg/-svg-icon.svg",
             directiveName: "",
             directiveOptions: "",
             directiveTools: '',
             layout: "params",
             config: {
             toolPanel: true,
             visualPanel: true,
             filterPanel: true,
             analyticsPanel: true,
             dashboardEnabled: true,
             recipePanel: true,
             smssGrid: false,
             exportToCSV: true,
             saveAsSVG: false,
             embedEnabled: false,
             visualPanelOption: false,
             saveEnabled: true,
             pkqlEnabled: true
             },
             defaultToolOptions: {},
             defaultVisualOptions: [],
             getAdditionalOption: function () {
             },
             getDataModel: function (vizData, localVisualOptions) {
             }
             },
             /!*** SPECIFIC **!/
             "prerna.ui.components.specific.tap.MHSDashboardDrillPlaysheet": {
             title: "statusDashboard",
             svgSrc: "resources/img/green-logo.svg",
             directiveName: "status-dashboard",
             directiveOptions: "",
             directiveTools: 'status-dashboard-tools',
             layout: "statusDashboard",
             config: {
             toolPanel: true,
             visualPanel: false,
             filterPanel: false,
             analyticsPanel: false,
             dashboardEnabled: true,
             recipePanel: false,
             smssGrid: true,
             exportToCSV: false,
             visualPanelOption: false,
             saveEnabled: true,
             pkqlEnabled: false
             },
             vizHandles: [],
             removeDuplicates: true,
             defaultVisualOptions: [
             {
             model: "label",
             name: "Label",
             isCollapsed: true,
             selected: "",
             delete: false,
             type: "STRING",
             grouping: false
             }, {
             model: "x",
             name: "X-Axis",
             isCollapsed: true,
             selected: "",
             delete: false,
             type: "STRING",
             grouping: false
             }
             ],
             defaultToolOptions: {
             'color': 'none',
             'toggleZ': false,
             'lineGuide': true,
             'customAxisNeeded': false,
             'colorName': "none"
             },
             hideWidgetHandles: [
             'Visual',
             'brush'
             ],
             getAdditionalToolData: function (vizData) {
             var data = vizData;
             var filteredKeys = [];
             var filteredData = [];
             var colorName = data.uiOptions.colorName;
             var color = data.uiOptions.color;

             if (_.isEmpty(data.dataTableAlign.series)) {
             filteredKeys.push(data.dataTableAlign['label']);
             return {colorName: colorName, colorLabels: filteredKeys, color: color};
             }
             else {
             var conceptName = data.dataTableAlign['series'];
             for (var object in data.data) {
             filteredData.push($filter("shortenAndReplaceUnderscores")(data.data[object][conceptName]));
             }
             }
             return {colorName: colorName, colorLabels: _.uniq(filteredData), color: color};
             },

             getAdditionalVisualOption: function () {
             return false
             },
             getDataModel: function (vizData, localVisualOptions) {
             return scatterDataModel(vizData, localVisualOptions, this.layout);
             }
             },

             "prerna.ui.components.specific.anthem.AnthemPainpointsPlaysheet": {
             title: "statusDashboard",
             svgSrc: "resources/img/green-logo.svg",
             directiveName: "status-dashboard",
             directiveOptions: "",
             directiveTools: 'status-dashboard-tools',
             layout: "statusDashboard",
             config: {
             toolPanel: false,
             visualPanel: false,
             filterPanel: false,
             analyticsPanel: false,
             dashboardEnabled: true,
             recipePanel: false,
             smssGrid: true,
             exportToCSV: false,
             visualPanelOption: false,
             saveEnabled: true,
             pkqlEnabled: false
             },
             vizHandles: [],
             removeDuplicates: true,
             defaultVisualOptions: [
             {
             model: "label",
             name: "Label",
             isCollapsed: true,
             selected: "",
             delete: false,
             type: "STRING",
             grouping: false
             }, {
             model: "x",
             name: "X-Axis",
             isCollapsed: true,
             selected: "",
             delete: false,
             type: "STRING",
             grouping: false
             }
             ],
             defaultToolOptions: {
             'color': 'none',
             'toggleZ': false,
             'lineGuide': true,
             'customAxisNeeded': false,
             'colorName': "none"
             },
             getAdditionalToolData: function (vizData) {
             var data = vizData;
             var filteredKeys = [];
             var filteredData = [];
             var colorName = data.uiOptions.colorName;
             var color = data.uiOptions.color;

             if (_.isEmpty(data.dataTableAlign.series)) {
             filteredKeys.push(data.dataTableAlign['label']);
             return {colorName: colorName, colorLabels: filteredKeys, color: color};
             }
             else {
             var conceptName = data.dataTableAlign['series'];
             for (var object in data.data) {
             filteredData.push($filter("shortenAndReplaceUnderscores")(data.data[object][conceptName]));
             }
             }
             return {colorName: colorName, colorLabels: _.uniq(filteredData), color: color};
             },

             getAdditionalVisualOption: function () {
             return false
             },
             getDataModel: function (vizData, localVisualOptions) {
             return scatterDataModel(vizData, localVisualOptions, this.layout);
             }
             },
             "prerna.ui.components.specific.anthem.AnthemInitiativePlaysheet": {
             title: "statusDashboard",
             svgSrc: "resources/img/green-logo.svg",
             directiveName: "status-dashboard",
             directiveOptions: "",
             directiveTools: 'status-dashboard-tools',
             layout: "statusDashboard",
             config: {
             toolPanel: false,
             visualPanel: false,
             filterPanel: false,
             analyticsPanel: false,
             dashboardEnabled: true,
             recipePanel: false,
             smssGrid: true,
             exportToCSV: false,
             visualPanelOption: false,
             saveEnabled: true,
             pkqlEnabled: false
             },
             vizHandles: [],
             removeDuplicates: true,
             defaultVisualOptions: [
             {
             model: "label",
             name: "Label",
             isCollapsed: true,
             selected: "",
             delete: false,
             type: "STRING",
             grouping: false
             }, {
             model: "x",
             name: "X-Axis",
             isCollapsed: true,
             selected: "",
             delete: false,
             type: "STRING",
             grouping: false
             }
             ],
             defaultToolOptions: {
             'color': 'none',
             'toggleZ': false,
             'lineGuide': true,
             'customAxisNeeded': false,
             'colorName': "none"
             },
             getAdditionalToolData: function (vizData) {
             var data = vizData;
             var filteredKeys = [];
             var filteredData = [];
             var colorName = data.uiOptions.colorName;
             var color = data.uiOptions.color;

             if (_.isEmpty(data.dataTableAlign.series)) {
             filteredKeys.push(data.dataTableAlign['label']);
             return {colorName: colorName, colorLabels: filteredKeys, color: color};
             }
             else {
             var conceptName = data.dataTableAlign['series'];
             for (var object in data.data) {
             filteredData.push($filter("shortenAndReplaceUnderscores")(data.data[object][conceptName]));
             }
             }
             return {colorName: colorName, colorLabels: _.uniq(filteredData), color: color};
             },

             getAdditionalVisualOption: function () {
             return false
             },
             getDataModel: function (vizData, localVisualOptions) {
             return scatterDataModel(vizData, localVisualOptions, this.layout);
             }
             },

             ** TAP Specific Visualizations **/
            "SystemSimilarity": {
                title: "System Similarity Heat Map",
                svgSrc: "resources/img/svg/-svg-icon.svg",
                directiveName: "heatmap",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css',
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'custom/specific/tap/sysduptools/sysduptools.css',
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'custom/heatmap/heatmap.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/heatmap/heatmap.directive.js',
                            'custom/heatmap/heatmap-tools.directive.js',
                            'custom/specific/tap/tap.service.js',
                            'custom/specific/tap/sysduptools/sysduptools.directive.js'
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'heatmap-tools',
                layout: "SystemSimilarity",
                config: {
                    toolPanel: true,
                    visualPanel: false,
                    filterPanel: false,
                    analyticsPanel: false,
                    dashboardEnabled: true,
                    recipePanel: false,
                    smssGrid: false,
                    exportToCSV: false,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: false,
                    saveEnabled: false,
                    pkqlEnabled: false
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                defaultVisualOptions: [],
                defaultToolOptions: {
                    'color': 'none',
                    'buckets': '10',
                    'colorLabel': 'none',
                    'min': '0',
                    'max': '10',
                    'step': '1',
                    'quantiles': true
                },
                getAdditionalVisualOption: function () {
                    return false;
                },
                getAdditionalToolData: function (vizData) {
                    var data = vizData;
                    var valueCategory = data.dataTableAlign.heat; //object that contains values for heatmap
                    var minMaxStep = {
                        min: data.data[0][valueCategory],
                        max: data.data[0][valueCategory]
                    };
                    //Gets the min and max value for the filter by value slider for heatmap tools
                    for (var i = 0; i < data.data.length; i++) {
                        if (data.data[i][valueCategory] < minMaxStep.min) {
                            minMaxStep.min = data.data[i][valueCategory];
                        }
                        if (data.data[i][valueCategory] > minMaxStep.max) {
                            minMaxStep.max = data.data[i][valueCategory];
                        }
                    }

                    return minMaxStep;
                }
            },
            "prerna.ui.components.specific.ousd.OUSDSysSim": {
                title: "System Similarity Heat Map",
                svgSrc: "resources/img/svg/-svg-icon.svg",
                directiveName: "heatmap",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            '../bower_components/d3-playsheet/d3.min.js',
                            '../bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css',
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'custom/heatmap/heatmap.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/heatmap/heatmap.directive.js',
                            'custom/heatmap/heatmap-tools.directive.js',
                            'custom/specific/tap/tap.service.js',
                            'custom/specific/tap/sysduptools/sysduptools.directive.js'
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'heatmap-tools',
                layout: "prerna.ui.components.specific.ousd.OUSDSysSim",
                config: {
                    toolPanel: true,
                    visualPanel: false,
                    filterPanel: false,
                    analyticsPanel: false,
                    dashboardEnabled: true,
                    recipePanel: false,
                    smssGrid: false,
                    exportToCSV: false,
                    saveAsSVG: true,
                    embedEnabled: true,
                    visualPanelOption: false,
                    saveEnabled: false,
                    pkqlEnabled: false
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                defaultVisualOptions: [],
                defaultToolOptions: {
                    'color': 'none',
                    'buckets': '10',
                    'colorLabel': 'none',
                    'min': '0',
                    'max': '10',
                    'step': '1',
                    'quantiles': true
                },
                getAdditionalVisualOption: function () {
                    return false;
                },
                getAdditionalToolData: function (vizData) {
                    var data = vizData;
                    var valueCategory = data.dataTableAlign.heat; //object that contains values for heatmap
                    var minMaxStep = {
                        min: data.data[0][valueCategory],
                        max: data.data[0][valueCategory]
                    };
                    //Gets the min and max value for the filter by value slider for heatmap tools
                    for (var i = 0; i < data.data.length; i++) {
                        if (data.data[i][valueCategory] < minMaxStep.min) {
                            minMaxStep.min = data.data[i][valueCategory];
                        }
                        if (data.data[i][valueCategory] > minMaxStep.max) {
                            minMaxStep.max = data.data[i][valueCategory];
                        }
                    }

                    return minMaxStep;
                }
            }, 
            "prerna.ui.components.specific.tap.InterfaceGraphPlaySheet": {
                title: "Data Network Graph",
                svgSrc: "resources/img/svg/force-svg-icon.svg",
                directiveName: "force-graph",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'custom/force-graph/force.css',
                            'custom/specific/tap/data-network-tools/data-network-tools.css',
                        ]
                    },
                    {
                        files: [
                            //'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            //'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/force-graph/force-graph.directive.js',
                            'custom/force-graph/force-graph-tools.directive.js',
                            'custom/force-graph/force-graph.service.js',
                            'custom/specific/tap/data-network-tools/data-network-tools.directive.js',
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'force-graph-tools',
                layout: "prerna.ui.components.specific.tap.InterfaceGraphPlaySheet",
                config: {
                    toolPanel: true,
                    visualPanel: false,
                    filterPanel: false,
                    analyticsPanel: false,
                    dashboardEnabled: true,
                    recipePanel: false,
                    smssGrid: false,
                    exportToCSV: false,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: false,
                    saveEnabled: false,
                    pkqlEnabled: true
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                hideWidgetHandles: [
                    'filter',
                    'brush'
                ],
                removeDuplicates: false,
                defaultVisualOptions: [],
                defaultToolOptions: {
                    'propertiesTableToggle': false,
                    'graphLockToggle': false,
                    'highlightOption': null
                },
                getAdditionalVisualOption: function () {

                }
            },
            "prerna.ui.components.specific.tap.SysSiteOptPlaySheet": {
                title: "Portfolio Rationalization Dashboard",
                svgSrc: "resources/img/svg/-svg-icon.svg",
                directiveName: "portrat",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        serie: true,
                        files: [
                            'standard/chart/chart.css',
                            'https://js.arcgis.com/3.16/esri/css/esri.css',
                            'custom/esri-map/esri-map.css',
                            'custom/specific/tap/portratdashboard/portrat.css'
                        ]
                    },
                    {
                        files: [
                            'custom/esri-map/esri-map.service.js',
                            'custom/specific/tap/portratdashboard/portratnotificationservice.js',
                            'custom/specific/tap/portratdashboard/portratmaster.js',
                            'custom/specific/tap/portratdashboard/portrat.js',
                            'custom/specific/tap/portratdashboard/portratchart.js',
                            'custom/specific/tap/portratdashboard/portratdashboard/portratdashboard.js',
                            'custom/specific/tap/portratdashboard/portratdashboard/portratdashboard.service.js',
                            'custom/specific/tap/portratdashboard/portratinfobox.js',
                            'custom/specific/tap/portratdashboard/portratcontainer.js',
                            'custom/specific/tap/portratdashboard/portratoverview/portratoverview.js',
                            'custom/specific/tap/portratdashboard/portratsysmod/portratsysmod.js',
                            'custom/specific/tap/portratdashboard/portratsysdecom/portratsysdecom.js',
                            'custom/specific/tap/portratdashboard/portratcap/portratcap.js',
                            'custom/specific/tap/portratdashboard/systemcoverage/systemcoverage.js',
                            'custom/specific/tap/portratdashboard/portratmaps/portratesrimap.js',
                            'custom/specific/tap/portratdashboard/portratmaps/portratoverviewmap.js',
                            'custom/specific/tap/portratdashboard/portratmaps/portratsystemmap.js',
                            'custom/specific/tap/portratdashboard/portratmaps/portratcapcoveragemap.js',
                            'custom/specific/tap/portratdashboard/portratscatterplot/portratscatterplot.js',
                            'custom/specific/tap/portratdashboard/leftpanel/portratparampanel/portratparampanel.js',
                            'custom/specific/tap/portratdashboard/leftpanel/portratselectpanel/portratselectpanel.js'
                        ]
                    }
                ],
                directiveOptions: "",
                layout: "prerna.ui.components.specific.tap.SysSiteOptPlaySheet",
                config: {
                    toolPanel: false,
                    visualPanel: false,
                    filterPanel: false,
                    analyticsPanel: false,
                    dashboardEnabled: false,
                    recipePanel: false,
                    smssGrid: false,
                    exportToCSV: false,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: false,
                    saveEnabled: false,
                    pkqlEnabled: false
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                defaultToolOptions: {},
                defaultVisualOptions: [],
                getAdditionalOption: function () {
                }
            },
            "prerna.ui.components.specific.tap.SysCoverageSheetPortRat": {
                title: "System Coverage",
                svgSrc: "resources/img/svg/-svg-icon.svg",
                directiveName: "system-coverage",
                directiveOptions: "",
                directiveTools: 'clustertools',
                layout: "prerna.ui.components.specific.tap.SysCoverageSheetPortRat",
                config: {
                    toolPanel: true,
                    visualPanel: false,
                    filterPanel: false,
                    analyticsPanel: false,
                    dashboardEnabled: true,
                    recipePanel: false,
                    smssGrid: false,
                    exportToCSV: false,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: false,
                    saveEnabled: false,
                    pkqlEnabled: false
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                defaultToolOptions: {},
                defaultVisualOptions: [],
                getAdditionalOption: function () {
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return scatterDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "prerna.ui.components.specific.tap.HealthGridSheetPortRat": {
                title: "Health Grid",
                svg: "resources/img/svg/scatter-svg-icon.svg",
                directiveName: "portratscatterplot",
                directiveOptions: "",
                directiveTools: 'scattertools',
                layout: "prerna.ui.components.specific.tap.HealthGridSheet",
                config: {
                    toolPanel: true,
                    visualPanel: true,
                    filterPanel: false,
                    analyticsPanel: false,
                    dashboardEnabled: true,
                    recipePanel: false,
                    smssGrid: false,
                    exportToCSV: false,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: false,
                    saveEnabled: false,
                    pkqlEnabled: false
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                defaultToolOptions: {
                    'toggleZ': true,
                    'lineGuide': true,
                    'customAxisNeeded': false
                },
                defaultVisualOptions: [],
                getAdditionalOption: function () {
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return scatterDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "prerna.ui.components.specific.tap.genesisdeployment.MHSGenesisDeploymentStrategyPlaySheet": {
                title: "MHS Genesis Deployment Map",
                svgSrc: "resources/img/svg/-svg-icon.svg",
                directiveName: "dhmsm-deployment dhmsm-deployment-map",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/ng-table/dist/ng-table.min.js'
                        ]
                    },
                    {
                        serie: true,
                        files: [
                            'bower_components/angular-bootstrap/ui-bootstrap.min.js',
                            'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
                            'bower_components/moment/moment.js',
                            'bower_components/pikaday/pikaday.js',
                            'bower_components/zeroclipboard/dist/ZeroClipboard.min.js',
                            'bower_components/handsontable/dist/handsontable.min.js',
                            'bower_components/ngHandsontable/dist/ngHandsontable.min.js',
                            'bower_components/angular-bootstrap-slider/slider.js',
                            'bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.min.js',
                            'bower_components/seiyria-bootstrap-slider/dist/css/bootstrap-slider.min.css'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css',
                            'bower_components/ng-table/dist/ng-table.min.css',
                            'https://js.arcgis.com/3.16/esri/css/esri.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'standard/smss-grid/smss-grid.css',
                            'custom/specific/tap/network-timeline/network-timeline.css',
                            'custom/specific/tap/dhmsm-deployment/dhmsm-deployment.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'standard/resizer/resizer.directive.js',
                            'custom/esri-map/esri-map.service.js',
                            'custom/specific/tap/dhmsm-deployment/dhmsm-grid.directive.js',
                            'custom/specific/tap/dhmsm-deployment/dhmsm-deployment-map.directive.js',
                            'custom/specific/tap/dhmsm-deployment/dhmsm-deployment.directive.js',
                            'custom/specific/tap/dhmsm-deployment/dhmsm-deployment-tools.directive.js'
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'dhmsm-deployment-tools',
                layout: "prerna.ui.components.specific.tap.genesisdeployment.MHSGenesisDeploymentStrategyPlaySheet",
                config: {
                    toolPanel: true,
                    visualPanel: false,
                    filterPanel: false,
                    analyticsPanel: false,
                    dashboardEnabled: true,
                    recipePanel: false,
                    smssGrid: false,
                    exportToCSV: false,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: false,
                    saveEnabled: false,
                    pkqlEnabled: false
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                defaultToolOptions: {},
                defaultVisualOptions: [],
                getAdditionalOption: function () {
                },
                getDataModel: function (vizData, localVisualOptions) {
                }
            },
            "prerna.ui.components.specific.tap.HealthGridSheet": {
                title: "Health Grid",
                svgSrc: "resources/img/svg/scatter-svg-icon.svg",
                directiveName: "health-grid",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'resources/css/d3-charts.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jv.css'
                        ]
                    },
                    {
                        files: [
                            'resources/js/jvCharts/jvCharts.js',
                            'resources/js/jvCharts/jvComment.js',
                            'resources/js/jvCharts/jvEdit.js',
                            'resources/js/jvCharts/jvBrush.js',
                            'resources/js/jvCharts/jvToolbar.js'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'custom/jv-viz/jv-viz.directive.js',
                            'custom/jv-scatter/jv-scatter.directive.js',
                            'custom/jv-scatter/jv-scatter-tools.directive.js',
                            'custom/specific/tap/health-grid/health-grid.directive.js',
                            'custom/specific/tap/health-grid/health-grid-tools.directive.js'
                        ]
                    }
                ],
                directiveOptions: "",
                directiveTools: 'health-grid-tools',
                layout: "prerna.ui.components.specific.tap.HealthGridSheet",
                config: {
                    toolPanel: true,
                    visualPanel: false,
                    filterPanel: false,
                    analyticsPanel: false,
                    dashboardEnabled: true,
                    recipePanel: false,
                    smssGrid: false,
                    exportToCSV: false,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: false,
                    saveEnabled: false,
                    pkqlEnabled: false
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                removeDuplicates: true,
                defaultVisualOptions: [],
                defaultToolOptions: {
                    'color': 'none',
                    'toggleZ': false,
                    'lineGuide': true,
                    'customAxisNeeded': false,
                    'colorName': "none"
                },
                getAdditionalToolData: function (vizData) {
                    var data = vizData;
                    var filteredKeys = [];
                    var filteredData = [];
                    var colorName = data.uiOptions.colorName;
                    var color = data.uiOptions.color;

                    if (_.isEmpty(data.dataTableAlign.series)) {
                        filteredKeys.push(data.dataTableAlign['label']);
                        return {colorName: colorName, colorLabels: filteredKeys, color: color};
                    }
                    else {
                        var conceptName = data.dataTableAlign['series'];
                        for (var object in data.data) {
                            filteredData.push($filter("shortenAndReplaceUnderscores")(data.data[object][conceptName]));
                        }
                    }
                    return {colorName: colorName, colorLabels: _.uniq(filteredData), color: color};
                },

                getAdditionalVisualOption: function () {
                    return false;
                },
                getDataModel: function (vizData, localVisualOptions) {
                    return scatterDataModel(vizData, localVisualOptions, this.layout);
                }
            },
            "prerna.ui.components.specific.tap.GraphTimePlaySheet": {
                title: "Network Timeline",
                svgSrc: "resources/img/svg/networktime-svg-icon.svg",
                directiveName: "network-timeline timeline-forcegraph",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/ng-table/dist/ng-table.min.js',
                            'bower_components/taffy/taffy-min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'bower_components/ng-table/dist/ng-table.min.css',
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'custom/specific/tap/network-timeline/network-timeline.css',
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'standard/resizer/resizer.directive.js',
                            'custom/specific/tap/network-timeline/network-timeline.service.js',
                            'custom/specific/tap/network-timeline/network-timeline-forcegraph.js',
                            'custom/specific/tap/network-timeline/network-timeline.directive.js',
                            'custom/specific/tap/network-timeline/network-timeline-tools.js'
                        ]
                    }
                ],
                directiveTools: 'network-timeline-tools',
                directiveOptions: "",
                layout: "prerna.ui.components.specific.tap.GraphTimePlaySheet",
                config: {
                    toolPanel: true,
                    visualPanel: false,
                    filterPanel: false,
                    analyticsPanel: false,
                    dashboardEnabled: true,
                    recipePanel: false,
                    smssGrid: false,
                    exportToCSV: false,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: false,
                    saveEnabled: false,
                    pkqlEnabled: false
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                defaultVisualOptions: [],
                defaultToolOptions: {},
                getAdditionalVisualOption: function (count) {
                },
                getDataModel: function (vizData, localVisualOptions) {
                }
            },

            /** End TAP Specific Visualizations **/

            "prerna.ui.components.specific.iatdd.AOAQueuingDashboard": {
                title: "AoA Queuing Dashboard",
                svgSrc: "resources/img/svg/dashboard-svg-icon.svg",
                directiveName: "iatddqueuing",
                directiveFiles: [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3-playsheet/d3.min.js',
                            'bower_components/ng-table/dist/ng-table.min.js',
                            'bower_components/taffy/taffy-min.js',
                            'bower_components/d3-tip/index.js'
                        ]
                    },
                    {
                        files: [
                            'bower_components/ng-table/dist/ng-table.min.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.css',
                            'custom/specific/iatdd/iatdd.css'
                        ]
                    },
                    {
                        files: [
                            'standard/chart/chart.directive.js',
                            'standard/resizer/resizer.directive.js',
                            'custom/specific/iatdd/iatddqueuing.js',
                            'custom/specific/iatdd/iatddheatmap.js'
                        ]
                    }
                ],
                directiveTools: '',
                directiveOptions: "",
                layout: "prerna.ui.components.specific.iatdd.AOAQueuingDashboard",
                config: {
                    toolPanel: true,
                    visualPanel: false,
                    filterPanel: false,
                    analyticsPanel: false,
                    dashboardEnabled: true,
                    recipePanel: false,
                    smssGrid: false,
                    exportToCSV: false,
                    saveAsSVG: false,
                    embedEnabled: true,
                    visualPanelOption: false,
                    saveEnabled: false,
                    pkqlEnabled: false
                },
                vizHandles: [
                    'default',
                    'comment',
                    'edit',
                    'brush',
                    'visual',
                    'analytics',
                    'save',
                    'related',
                    'clone',
                    'create',
                    'console',
                    'csv',
                    'svg',
                    'embed',
                    'param',
                    'filter',
                    'additionalTools',
                    'color',
                    'traverse',
                    'forceLock',
                    'defaultHandle'
                ],
                defaultVisualOptions: [],
                defaultToolOptions: {},
                getAdditionalVisualOption: function (count) {
                },
                getDataModel: function (vizData, localVisualOptions) {
                }
            }

            /*/!** OUSD **!/
             /!** TODO BAD**!/
             "prerna.ui.components.specific.ousd.SequencingDecommissioningPlaySheet": {
             title: "Grid",
             svgSrc: "resources/img/svg/grid-svg-icon.svg",
             directiveName: "",
             directiveOptions: "",
             directiveTools: '',
             layout: "prerna.ui.components.specific.ousd.SequencingDecommissioningPlaySheet",
             config: {
             toolPanel: false,
             visualPanel: false,
             filterPanel: false,
             analyticsPanel: false,
             dashboardEnabled: false,
             recipePanel: false,
             smssGrid: false,
             exportToCSV: false,
             saveAsSVG: false,
             embedEnabled: true,
             visualPanelOption: false,
             saveEnabled: false,
             pkqlEnabled: false
             },
             vizHandles: [],
             removeDuplicates: true,
             defaultVisualOptions: [],
             defaultToolOptions: {},
             getAdditionalVisualOption: function () {
             return false
             }
             },
             "prerna.ui.components.specific.ousd.RoadmapCleanTablePlaySheet": {
             title: "Grid",
             svgSrc: "resources/img/svg/grid-svg-icon.svg",
             directiveName: "",
             directiveOptions: "",
             directiveTools: '',
             layout: "prerna.ui.components.specific.ousd.SequencingDecommissioningPlaySheet",
             config: {
             toolPanel: false,
             visualPanel: false,
             filterPanel: false,
             analyticsPanel: false,
             dashboardEnabled: false,
             recipePanel: false,
             smssGrid: false,
             exportToCSV: false,
             saveAsSVG: false,
             embedEnabled: true,
             visualPanelOption: false,
             saveEnabled: false,
             pkqlEnabled: false
             },
             vizHandles: [],
             removeDuplicates: true,
             defaultVisualOptions: [],
             defaultToolOptions: {},
             getAdditionalVisualOption: function () {
             return false
             }
             }*/
        };

        return {
            //sheet functions
            /**
             * @name getVizDirectiveElement
             * @desc returns the un-compiled html string of the current viz
             * @params layout {string} layout of selected viz
             * @returns {string} html of string
             */
            getVizDirectiveElement: function (layout) {
                if (layout === 'create' || layout === 'upload' || layout === 'params') {
                    return '';
                }

                if (visualizations[layout].directiveName === 'portrat') {
                    return "<div oc-lazy-load="
                        + JSON.stringify(visualizations[layout].directiveFiles)
                        + ">" +
                        "<portratmaster " + visualizations[layout].directiveName + " data=\"widget.widgetData.data.chartData\"" +
                        " chart-name=\"'chart-viz'\">" + "</portratmaster>"
                        + "</div>";
                }

                if (visualizations[layout]) {
                    return "<div oc-lazy-load="
                        + JSON.stringify(visualizations[layout].directiveFiles)
                        + ">"
                        + "<chart "
                        + visualizations[layout].directiveName
                        + " data=\"widget.widgetData.data.chartData\""
                        + " chart-name=\"'chart-viz'\">"
                        + "</chart>" +
                        "</div>";
                } else {
                    alertService(layout + ' does not exist', 'Layout Error', 'toast-error', 5000);
                }
                return '';
            },

            /**
             * @name getVizDisabledStatus
             * @desc returns if the viz is disabled
             * @params layout {string} layout of selected viz
             * @returns {Boolean}
             */
            getVizDisabledStatus: function (vizID) {
                if (visualizations[vizID]) {
                    return false;
                }
                return true;
            },

            /**
             * @name getVizConfig
             * @desc returns the viz's sheet config
             * @params layout {string} layout of selected viz
             * @returns {object} sheet config
             */
            getVizConfig: function (layout) {
                if (visualizations[layout]) {
                    return visualizations[layout].config;
                }
                alertService(layout + ' does not exist', 'Layout Error', 'toast-error', 5000);
                return {};
            },

            //tool panel functions
            /**
             * @name getToolDirectiveElement
             * @desc returns the un-compiled html string of the selected viz's tool
             * @params layout {string} layout of selected viz
             * @returns {string} html of string
             */
            getToolDirectiveElement: function (layout) {
                var html = '';
                //viz counter is used to force a redraw of the directive whenever the same one is called twice
                //it ensures that viz specific data is updated (example : customColors)
                if (visualizations[layout]) {
                    html = "<div " + visualizations[layout].directiveTools + " " + vizCounter + ">" + "</div>";
                } else {
                    alertService(layout + ' does not exist', 'Layout Error', 'toast-error', 5000);
                }
                vizCounter++;
                return html;
            },

            /**
             * @name getDefaultToolOptions
             * @desc gets the default tool options for the given visualization
             * @params layout {string} layout of selected viz
             * @returns {object} default tool options
             */
            getDefaultToolOptions: function (layout) {
                if (visualizations[layout]) {
                    return JSON.parse(JSON.stringify(visualizations[layout].defaultToolOptions));
                }
                return [];
            },

            //visual panel functions
            /**
             * @name getVisualizationObj
             * @desc function returns the full visualization object
             * @returns {object} visualization object
             */
            getVisualizationsObj: function () {
                return visualizations;
            },
            /**
             * @name generateVisualOptions
             * @desc function returns the dataTableAlign of a visualization based on an array of selected parameters
             * @params layout {String} layout of selected viz
             * @param keys {Array} array of selected visual options
             * @returns {object} dataTableAlign
             */
            generateVisualOptions: function (layout, dataTableKeys) {
                var keys = JSON.parse(JSON.stringify(dataTableKeys));
                if (visualizations[layout]) {
                    var dataTableAlign = {};
                    for (var i = 0; i < visualizations[layout].defaultVisualOptions.length; i++) {
                        if (keys[0]) {
                            dataTableAlign[visualizations[layout].defaultVisualOptions[i].model] = keys[0]['uri'];
                        }
                        else {
                            dataTableAlign[visualizations[layout].defaultVisualOptions[i].model] = '';
                        }
                        keys.shift();
                    }

                    var i = _.keys(dataTableAlign).length;
                    while (keys.length > 0) {
                        var additionalOption = visualizations[layout].getAdditionalVisualOption(i);
                        if (additionalOption) {
                            dataTableAlign[additionalOption.model] = keys[0]['uri'];
                        }
                        keys.shift();
                        i++
                    }

                    return dataTableAlign
                }
                alertService(layout + ' does not exist', 'Layout Error', 'toast-error', 5000);
                return [];
            },
            /**
             * @name getDefaultVizOptions
             * @desc function returns defaultVisualOptions for the selected Visualization
             * @params layout {string} layout of selected viz
             * @returns {object | Array} default Options
             */
            getDefaultVisualOptions: function (layout) {
                if (visualizations[layout]) {
                    return visualizations[layout].defaultVisualOptions;
                }
                alertService(layout + ' does not exist', 'Layout Error', 'toast-error', 5000);
                return [];
            },

            /**
             * @name addVisualOptionDimension
             * @desc function returns returns an additional visual option for the selected layout
             * @params layout {string} layout of selected viz
             * @returns {object} default Options
             */
            addVisualOptionDimension: function (layout, optionLength) {
                if (visualizations[layout]) {
                    return visualizations[layout].getAdditionalVisualOption(optionLength);
                }
                alertService(layout + ' does not exist', 'Layout Error', 'toast-error', 5000);
            },

            /**
             * @name checkDuplicates
             * @param concepts {array} - selected concepts to check for duplicates
             * @param insightID {object} - the id of the selected insight
             * @desc calls monolithService to return bool if values are duplicated
             * @returns {boolean} T/F depending on duplication
             */
            checkDuplicates: function (data, insightID) {
                return monolithService.checkDuplicates(data, insightID).then(function (data) {
                    return data
                }, function (error) {
                    var errMsg;
                    if (error.data && error.data.Message) {
                        errMsg = error.data.Message;
                    } else {
                        errMsg = "Error retrieving data";
                    }

                    alertService(errMsg, "Error", "toast-error", 3000);
                    return false;
                });
            },

            /**
             * @name checkDuplicateProcessing
             * @desc function that checks if the visualization can handle duplicates
             * @params layout {string} layout of selected viz
             * @returns {boolean} T/F  depending on viz's duplication handling
             */
            checkDuplicateProcessing: function (layout) {
                if (visualizations[layout]) {
                    return visualizations[layout].removeDuplicates;
                }
                alertService(layout + ' does not exist', 'Layout Error', 'toast-error', 5000);
                return true;
            },

            /**
             * @name applyColumnStats
             * @param mathMap {object} - mapping of selected Options
             * @param insightID {object} - the id of the selected insight
             * @desc calls monolithService to return new data with correct grouping
             */
            applyColumnStats: function (mathMap, insightID) {
                return monolithService.applyColumnStats(mathMap, insightID).then(function (data) {
                    return data
                }, function (error) {
                    var errMsg;
                    if (error.data && error.data.Message) {
                        errMsg = error.data.Message;
                    } else {
                        errMsg = "Error retrieving data";
                    }

                    alertService(errMsg, "Error", "toast-error", 3000);
                    return false;
                });
            },

            //other functions
            /**
             * @name getVizSvg
             * @desc function returns returns the visualization svg icon
             * @params layout {string} layout of selected viz
             * @returns {string} path to svg icon
             */
            getVizSvg: function (layout) {
                if (visualizations[layout]) {
                    return visualizations[layout].svgSrc;
                }
                return "resources/img/svg/-svg-icon.svg";
            },

            /**
             * @name getToolData
             * @desc gets additional tool data for a visualization
             * @params layout {string} layout of selected viz
             * @params vizData {Object} data for the selected viz
             * @returns {Object} additional tool data
             */
            getToolData: function (layout, vizData) {
                console.log('function should not be used, use the selectedData on the scope instead');
                if (visualizations[layout]) {
                    return visualizations[layout].getAdditionalToolData(vizData);
                }
                return true;
            },

            /**
             * @name getDropDown
             * @desc gets the dropdown values for a given visualization    TODO: desc
             * @params layout {string} layout of selected viz
             * @params vizData {Object} data for the selected viz
             * @returns {Object} dropdown values
             */
            getDropDown: function (layout, vizData) {
                if (visualizations[layout]) {
                    return visualizations[layout].getDropDownValues(vizData);
                }
                alertService(layout + ' does not exist', 'Layout Error', 'toast-error', 5000);
                return true;
            },

            /**
             * @name getVizHandles
             * @desc returns config objects for handles specific to a layout
             * @param layout {string} layout of selected visualization
             * @returns {Array}
             */
            getVizHandles: function (layout) {
                if (visualizations[layout] && visualizations[layout].vizHandles) {
                    return visualizations[layout].vizHandles;
                }
                return [];
            },

            /**
             * @name showWidgetsForLayout
             * @desc retrieves list of which widgets to show for given layout
             * @param {String} layout viz layout
             * @returns {Object} widgetHandles Obj
             */
            showWidgetsForLayout: function (widgetHandles, layout) {
                if (visualizations[layout]) {
                    var returnedWidgets = [];
                    var widgetsToShow = visualizations[layout].vizHandles;
                    if (widgetsToShow && widgetsToShow.length > 0) {
                        for (var i = 0; i < widgetsToShow.length; i++) {
                            for (var j = 0; j < widgetHandles.length; j++) {
                                if (widgetHandles[j].name === widgetsToShow[i]) {
                                    returnedWidgets.push(widgetHandles[j]);
                                }
                            }
                        }
                    }
                }

                return returnedWidgets;
            },

            /**
             * @name getColorElements
             * @desc returns elements in the data table align that have colors for a specific visual
             * @param layout
             * @param dataTableAlign
             * @returns [] array of color elements
             */
            getColorElements: function (layout, dataTableAlign, data) {
                if (visualizations[layout] && typeof visualizations[layout].colorElements === 'function') {
                    return visualizations[layout].colorElements(dataTableAlign, data);
                }
            }

        };
    }
})();