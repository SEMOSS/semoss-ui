(function () {
    'use strict';

    /**
     * @name widget-config.service.js
     * @desc widget config service is set up to configure the all of the widgets/handles/visualizations in SEMOSS
     */
    angular.module('app.widget-config.service', [])
        .factory('widgetConfigService', widgetConfigService);

    widgetConfigService.$inject = ['$window', '$timeout', 'alertService', '$rootScope'];

    function widgetConfigService($window, $timeout, alertService, $rootScope) {

        /********************************************** WIDGET CONFIG TEMPLATE **************************************************/
        var exampleConfig = {
            "name": {
                layout: 'has to be same as name',
                type: '"viz" or "other" - viz is what you want to show up in the visualizations list in viz panel',
                image: 'path to any image to display in the viz panel',
                handle: { //the button and interaction that happens with a widget
                    name: "has to be same as name",
                    title: 'Display Title',
                    groups: 'The group that this handle belongs (headings displayed in the handle selection window)',
                    content: 'html that is used to display inside the handle button (comment bubble / save floppy drive / etc)',
                    contentSrc: 'not currently used, but will be an alternated to content above pointing to an img src',
                    cssClass: "css that will be assigned to the handle button",
                    click: 'function that is executed on the click of the handle',
                    pinned: 'boolean, if the handle is shown on the right side, saved to local cache'

                },
                display: { //display only - can come from a handle interaction or just by loading a visualization
                    title: 'has to be same as name',
                    jsonView: 'a JSON object to be displayed in the default widget directive (either popup / inline / new panel)',
                    template: { //directives instead of the json view
                        directiveName: 'name of directive to lazy load',
                        directiveFiles: 'name of directive files to lazy load',
                        directiveTools: 'tools to lazy load > all of these use oc lazy load'
                    },
                    displayPosition: 'inline - the current panel / popup - over top of the current panel / or panel - new panel',
                    options: {
                        showOnVisualPanel: 'boolean to determine to show this visual on visual panel',
                        saveEnabled: 'boolean, self explanatory',
                        pkqlEnabled: 'if false, all tools will go back to the directive instead of backend',
                        vizHandles: 'other widgets that will be displayed as handles for this current display',
                        removeDuplicates: 'specific visual option that lets the backend know whether to remove dups from the data',
                        defaultVisualOptions: 'used in visual panel that lets us know how to display the default options (label, value, etc)',
                        defaultToolOptions: 'default tool settings for a visual',
                        getAdditionalVisualOption: 'used in visual panel for adding a new visual option to select'
                    }
                }
            }
        };
        /***************************************************** End OF TEMPLATE *****************************************************/


        var widgetConfig = {

            /********************************** Visualizations **********************/
            "Grid": {
                "layout": "Grid",
                "type": "viz",
                "image": "resources/img/svg/grid-svg-icon.svg",
                "handle": false,
                "display": {
                    "title": "Grid",
                    "jsonView": false,
                    "template": {
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
                        directiveTools: 'spreadjs-tools'
                    },
                    "options": {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        "pkqlEnabled": true,
                        "vizHandles": [
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
                        "removeDuplicates": true,
                        "defaultVisualOptions": [],
                        "defaultToolOptions": {},
                        "getAdditionalVisualOption": function () {
                            return false;
                        }
                    }
                }
            },
            "Graph": {
                "layout": "Graph",
                "type": "viz",
                "image": "resources/img/svg/force-svg-icon.svg",
                "handle": false,
                "display": {
                    "title": "Force",
                    "jsonView": false,
                    "template": {
                        "directiveName": "force-graph",
                        "directiveOptions": {
                            'class': 'viz', 'viz-input': 'visual.vizInput'
                        },
                        "directiveTools": 'force-graph-tools',
                        "directiveFiles": [
                            {
                                "serie": true,
                                "files": [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
                                ]
                            },
                            {
                                "files": [
                                    'resources/css/d3-charts.css'
                                ]
                            },
                            {
                                "files": [
                                    'standard/chart/chart.css',
                                    'custom/force-graph/force.css'
                                ]
                            },
                            {
                                "files": [
                                    //'resources/js/jvCharts/jvCharts.js',
                                    'resources/js/jvCharts/jvComment.js',
                                    'resources/js/jvCharts/jvEdit.js',
                                    //'resources/js/jvCharts/jvBrush.js',
                                    'resources/js/jvCharts/jvToolbar.js'
                                ]
                            },
                            {
                                "files": [
                                    'standard/chart/chart.directive.js',
                                    'standard/resizer/resizer.directive.js',
                                    'custom/force-graph/force-graph.directive.js',
                                    'custom/force-graph/force-graph-tools.directive.js',
                                    'custom/force-graph/force-graph.service.js'
                                ]
                            }
                        ]
                    },
                    "options": {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        "pkqlEnabled": true,
                        "vizHandles": [
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
                            'graphLockToggle',
                            'defaultHandle'
                        ],
                        "removeDuplicates": false,
                        "defaultVisualOptions": [],
                        "defaultToolOptions": {
                            'propertiesTableToggle': false,
                            'graphLockToggle': false,
                            'highlightOption': null,
                            'selectedNode': null,
                            'traverseList': {}
                        },
                        "getAdditionalVisualOption": function () {

                        }
                    }
                }
            },
            "VivaGraph": {
                "layout": "VivaGraph",
                "type": "viz",
                "image": "resources/img/svg/force-svg-icon.svg",
                "handle": false,
                "display": {
                    "title": "VivaGraph",
                    "jsonView": false,
                    "template": {
                        directiveName: "viva-graph",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                  'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: "viva-graph-tools"
                    },
                    "options": {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        "pkqlEnabled": true,
                        "vizHandles": [
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
                            'graphLockToggle',
                            'defaultHandle'
                        ],
                        "removeDuplicates": false,
                        "defaultVisualOptions": [],
                        "defaultToolOptions": {},
                        "getAdditionalVisualOption": function () {

                        }
                    }
                }

            },
            "Column": {
                layout: "Column",
                "type": "viz",
                image: 'resources/img/svg/bar-svg-icon.svg',
                handle: false,
                display: {
                    title: "Bar",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: 'jv-viz jv-bar',
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js',
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
                        directiveTools: 'jv-bar-tools' //refers to another handle technically
                    },
                    displayPosition: 'inline',
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                            'seriesFlipped',
                            'stackToggle',
                            'rotateAxis',
                            'defaultHandle'
                        ],
                        "removeDuplicates": true,
                        "defaultVisualOptions": [ // for visual panel
                            {
                                "model": "label",
                                "name": "Label",
                                "optionGroup": "Label",
                                "selected": "",
                                "delete": false,
                                "type": "STRING",
                                "grouping": false,
                                "multiField": false
                            }, {
                                "model": "value 1",
                                "name": "Value",
                                "optionGroup": "Value",
                                "selected": "",
                                "delete": false,
                                "type": "STRING",
                                "grouping": false,
                                "multiField": true
                            }
                        ],
                        "defaultToolOptions": { // if no tools are defined
                            'rotateAxis': false,
                            'seriesFlipped': false,
                            'displayValues': false,
                            'sortLabel': 'none',
                            'sortType': 'none',
                            'color': 'none',
                            'stackToggle': 'group-data',
                            'colorName': 'Semoss',
                            'backgroundColor': '#FFFFFF'
                        }
                        ,
                        colorElements: function (dataTableAlign, data) {
                            var colorElements = [];
                            for (var key in dataTableAlign) {
                                if (dataTableAlign.hasOwnProperty(key) && key !== 'label') {
                                    colorElements.push(dataTableAlign[key]);
                                }
                            }

                            return colorElements;
                        }
                        ,
                        getAdditionalVisualOption: function (count) {
                            return {
                                "model": 'value ' + count,
                                "name": 'Value' + count,
                                "optionGroup": "Value",
                                "selected": '',
                                "delete": true,
                                "type": "STRING",
                                "grouping": false,
                                "multiField": true
                            };
                        }
                    }
                }
            },
            "WorldMap": {
                layout: "WorldMap",
                "type": "viz",
                image: 'resources/img/svg/geo-svg-icon.svg',
                handle: false,
                display: {
                    title: "World Map",
                    jsonView: false, //default widget object
                    template: {
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
                        directiveTools: 'esri-map-tools'
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                                multiField: false
                            }, {
                                model: "lat",
                                name: "Latitude",
                                optionGroup: 'Latitude',
                                selected: "",
                                delete: false,
                                type: "STRING",
                                grouping: false,
                                multiField: false
                            }, {
                                model: "lon",
                                name: "Longitude",
                                optionGroup: "Longitude",
                                selected: "",
                                delete: false,
                                type: "STRING",
                                grouping: false,
                                multiField: false
                            }, {
                                model: "size",
                                name: "Size",
                                optional: true,
                                optionGroup: "Size",
                                selected: "",
                                delete: false,
                                type: "STRING",
                                multiField: false
                            },
                            {
                                model: "color",
                                name: "Color",
                                optional: true,
                                optionGroup: "Color",
                                selected: "",
                                delete: false,
                                type: "STRING",
                                multiField: false
                            }
                        ],
                        defaultToolOptions: {
                            'baseLayer': 'streets',
                            drawLineToggle: false
                        },
                        getAdditionalVisualOption: function () {
                        }
                    }
                }
            },
            "HeatMap": {
                layout: "HeatMap",
                "type": "viz",
                image: 'resources/img/svg/heatmap-svg-icon.svg',
                handle: false,
                display: {
                    title: "Heat Map",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "heatmap",
                        directiveOptions: {
                            class: 'heatmap'
                        },
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'heatmap-tools'
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                                model: "x",
                                name: "X-Axis",
                                optionGroup: 'X-Axis',
                                selected: "",
                                delete: false,
                                type: "STRING",
                                grouping: false,
                                multiField: false
                            },
                            {
                                model: "y",
                                name: "Y-Axis",
                                optionGroup: 'Y-Axis',
                                selected: "",
                                delete: false,
                                type: "STRING",
                                grouping: false,
                                multiField: false
                            },
                            {
                                model: "heat",
                                name: "Heat",
                                optionGroup: 'Heat',
                                selected: "",
                                delete: false,
                                type: "STRING",
                                grouping: false,
                                multiField: false
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
                        }
                    }
                }
            },
            "Line": {
                layout: "Line",
                "type": "viz",
                image: 'resources/img/svg/line-svg-icon.svg',
                handle: false,
                display: {
                    title: "Line",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: 'jv-viz jv-line',
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'jv-line-tools'
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                            'rotateAxis',
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
                        }
                    }
                }
            },
            "Pie": {
                layout: "Pie",
                "type": "viz",
                image: 'resources/img/svg/pie-svg-icon.svg',
                handle: false,
                display: {
                    title: "Pie",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "jv-viz jv-pie",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'jv-pie-tools'
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                        }
                    }
                }
            },
            "Scatter": {
                layout: "Scatter",
                "type": "viz",
                image: 'resources/img/svg/scatter-svg-icon.svg',
                handle: false,
                display: {
                    title: "Scatter",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "jv-viz jv-scatter",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'jv-scatter-tools'
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                            'toggleZ',
                            'lineGuide',
                            'xReversed',
                            'yReversed',
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
                        }
                    }
                }
            },
            "Gantt": {
                layout: "Gantt",
                "type": "viz",
                image: 'resources/img/svg/chart-gantt.svg',
                handle: false,
                display: {
                    title: "Gantt",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "jv-viz Gantt",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js',
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
                        directiveOptions: ""
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                        }
                    }
                }
            },
            "ParallelCoordinates": {
                layout: "ParallelCoordinates",
                "type": "viz",
                image: 'resources/img/svg/parallelcoordinates-svg-icon.svg',
                handle: false,
                display: {
                    title: "Parallel Coordinates",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "d3-parcoords",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js',
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
                        directiveTools: 'parcoords-tools'
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                        }
                    }
                }
            },
            "SingleAxisCluster": {
                layout: "SingleAxisCluster",
                "type": "viz",
                image: 'resources/img/svg/single-axis-cluster-svg-icon.svg',
                handle: false,
                display: {
                    title: "Single Axis Cluster",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: 'single-axis-cluster',
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'single-axis-cluster-tools'
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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

                        }
                    }
                }


            },
            "Cluster": {
                layout: "Cluster",
                "type": "viz",
                image: 'resources/img/svg/cluster-svg-icon.svg',
                handle: false,
                display: {
                    title: "Cluster",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "cluster",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: ''
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                    }
                }
            },
            "Dendrogram": {
                layout: "Dendrogram",
                "type": "viz",
                image: 'resources/img/svg/dendrogram-svg-icon.svg',
                handle: false,
                display: {
                    title: "Dendrogram",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "dendrogram",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: ''
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                    }
                }
            },
            "ScatterplotMatrix": {
                layout: "ScatterplotMatrix",
                "type": "viz",
                image: 'resources/img/svg/scattermatrix-svg-icon.svg',
                handle: false,
                display: {
                    title: "Scatter Matrix",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "scatter-matrix",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: ''
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                    }
                }


            },
            "Sankey": {
                layout: "Sankey",
                "type": "viz",
                image: 'resources/img/svg/sankey-svg-icon.svg',
                handle: false,
                display: {
                    title: "Sankey",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: 'jv-viz sankey',
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js',
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
                        directiveOptions: ''
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                        }
                    }
                }
            },
            "prerna.ui.components.playsheets.SankeyPlaySheet": {
                layout: "prerna.ui.components.playsheets.SankeyPlaySheet",
                "type": "viz",
                image: 'resources/img/svg/sankey-svg-icon.svg',
                handle: false,
                display: {
                    title: "Sankey",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: 'sankey',
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js',
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
                        directiveOptions: ''
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: false,
                        vizHandles: [
                        ],
                        defaultVisualOptions: [],
                        getAdditionalVisualOption: function () {
                        },
                        defaultToolOptions: {}
                    }
                }

            },
            "Sunburst": {
                layout: "Sunburst",
                "type": "viz",
                image: 'resources/img/svg/sunburst-svg-icon.svg',
                handle: false,
                display: {
                    title: "Sunburst",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "sunburst",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveOptions: ""
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                        }
                    }
                }
            },
            "Radial": {
                layout: "Radial",
                "type": "viz",
                image: 'resources/img/svg/radial-svg-icon.svg',
                handle: false,
                display: {
                    title: "Radial",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "jv-viz radial",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'radial-tools'
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                        }
                    }
                }
            },
            "Pack": {
                layout: "Pack",
                "type": "viz",
                image: 'resources/img/svg/dashboard-svg-icon.svg',
                handle: false,
                display: {
                    title: "Pack",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "jv-viz jv-pack",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'jv-pack-tools'
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
                        vizHandles: ['color'],
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
                            for (var ele in dataTableAlign) {
                                colorElements.push(dataTableAlign[ele]);
                            }
                            return colorElements;
                        },
                        getAdditionalVisualOption: function () {
                        }
                    }
                }
            },
            "TreeMap": {
                layout: "TreeMap",
                "type": "viz",
                image: 'resources/img/svg/treemap-svg-icon.svg',
                handle: false,
                display: {
                    title: "TreeMap",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "jv-viz tree-map",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'tree-map-tools'
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                        }
                    }
                }
            },

            "Dashboard": {
                layout: "Dashboard",
                "type": "viz",
                image: 'resources/img/svg/dashboard-svg-icon.svg',
                handle: false,
                display: {
                    title: "Dashboard",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "jv-viz dashboard",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'dashboard-tools'
                    },
                    options: {
                        "showOnVisualPanel": true,
                        "saveEnabled": true,
                        pkqlEnabled: true,
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
                        }
                    }
                }
            },
            "prerna.ui.components.playsheets.MashupPlaySheet": {
                layout: "Mashup",
                "type": "viz",
                image: "resources/img/svg/dashboard-svg-icon.svg",
                handle: false,
                display: {
                    title: "Mashup",
                    jsonView: false,
                    template: {
                        directiveName: "",
                        directiveFiles: [],
                        directiveTools: {}
                    },
                    displayPosition: 'inline',
                    options: {
                        "showOnVisualPanel": false,
                        saveEnabled: true,
                        pkqlEnabled: true,
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
                            'graphLockToggle',
                            'defaultHandle'
                        ],
                        removeDuplicates: false,
                        defaultVisualOptions: [],
                        defaultToolOptions: {},
                        getAdditionalVisualOption: function () {
                        }
                    }
                }
            },
            "prerna.ui.components.specific.tap.MHSDashboardDrillPlaysheet": {
                layout: "statusDashboard",
                "type": "viz",
                image: 'resources/img/svg/green-logo.svg',
                handle: false,
                display: {
                    title: "Status Dashboard",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "status-dashboard",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                                    'custom/status-dashboard/status-dashboard-tools.directive.js'
                                ]
                            }
                        ],
                        directiveOptions: "",
                        directiveTools: 'status-dashboard-tools'
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": true,
                        pkqlEnabled: false,
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
                            'graphLockToggle',
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
                                multiField: false
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
                        }
                    }
                }
            },
            /** TAP Specific Visualizations **/
            "SystemSimilarity": {
                layout: "SystemSimilarity",
                "type": "viz",
                image: 'resources/img/svg/-svg-icon.svg',
                handle: false,
                display: {
                    title: "System Similarity Heat Map",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "heatmap",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'heatmap-tools'
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: false,
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
                            'graphLockToggle',
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
                    }
                }
            },
            "prerna.ui.components.specific.ousd.OUSDSysSim": {
                layout: "prerna.ui.components.specific.ousd.OUSDSysSim",
                "type": "viz",
                image: 'resources/img/svg/-svg-icon.svg',
                handle: false,
                display: {
                    title: "System Similarity Heat Map",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "heatmap",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'heatmap-tools'
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: false,
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
                            'graphLockToggle',
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
                    }
                }
            }, 
            "prerna.ui.components.specific.tap.InterfaceGraphPlaySheet": {
                layout: "prerna.ui.components.specific.tap.InterfaceGraphPlaySheet",
                "type": "viz",
                image: 'resources/img/svg/force-svg-icon.svg',
                handle: false,
                display: {
                    title: "Data Network Graph",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "force-graph",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'force-graph-tools'
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: true,
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
                            'graphLockToggle',
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
                    }
                }
            },
            "prerna.ui.components.specific.tap.SysSiteOptPlaySheet": {
                layout: "prerna.ui.components.specific.tap.SysSiteOptPlaySheet",
                "type": "viz",
                image: 'resources/img/svg/-svg-icon.svg',
                handle: false,
                display: {
                    title: "Portfolio Rationalization Dashboard",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "portrat",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveOptions: ""
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: false,
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
                            'graphLockToggle',
                            'defaultHandle'
                        ],
                        defaultToolOptions: {},
                        defaultVisualOptions: [],
                        getAdditionalOption: function () {
                        }
                    }
                }
            },
            "prerna.ui.components.specific.tap.SysCoverageSheetPortRat": {
                layout: "prerna.ui.components.specific.tap.SysCoverageSheetPortRat",
                "type": "viz",
                image: 'resources/img/svg/-svg-icon.svg',
                handle: false,
                display: {
                    title: "System Coverage",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "system-coverage",
                        directiveOptions: "",
                        directiveTools: 'clustertools'
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: false,
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
                            'graphLockToggle',
                            'defaultHandle'
                        ],
                        defaultToolOptions: {},
                        defaultVisualOptions: [],
                        getAdditionalOption: function () {
                        }
                    }
                }
            },
            "prerna.ui.components.specific.tap.HealthGridSheetPortRat": {
                layout: "prerna.ui.components.specific.tap.HealthGridSheet",
                "type": "viz",
                image: 'resources/img/svg/scatter-svg-icon.svg',
                handle: false,
                display: {
                    title: "Health Grid",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "portratscatterplot",
                        directiveOptions: "",
                        directiveTools: 'scattertools'
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: false,
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
                            'graphLockToggle',
                            'defaultHandle'
                        ],
                        defaultToolOptions: {
                            'toggleZ': true,
                            'lineGuide': true,
                            'customAxisNeeded': false
                        },
                        defaultVisualOptions: [],
                        getAdditionalOption: function () {
                        }
                    }
                }
            },
            "prerna.ui.components.specific.tap.genesisdeployment.MHSGenesisDeploymentStrategyPlaySheet": {
                layout: "prerna.ui.components.specific.tap.genesisdeployment.MHSGenesisDeploymentStrategyPlaySheet",
                "type": "viz",
                image: 'resources/img/svg/-svg-icon.svg',
                handle: false,
                display: {
                    title: "Health Grid",
                    jsonView: false, //default widget object
                    template: {
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
                                    'bower_components/handsontable/dist/handsontable.full.css',
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
                        directiveTools: 'dhmsm-deployment-tools'
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: false,
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
                            'graphLockToggle',
                            'defaultHandle'
                        ],
                        defaultToolOptions: {},
                        defaultVisualOptions: [],
                        getAdditionalOption: function () {
                        }
                    }
                }
            },
            "prerna.ui.components.specific.tap.HealthGridSheet": {
                layout: "prerna.ui.components.specific.tap.HealthGridSheet",
                "type": "viz",
                image: 'resources/img/svg/-svg-icon.svg',
                handle: false,
                display: {
                    title: "Health Grid",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "health-grid",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveTools: 'health-grid-tools'
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: false,
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
                            'graphLockToggle',
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
                        }
                    }
                }
            },
            "prerna.ui.components.specific.tap.GraphTimePlaySheet": {
                layout: "prerna.ui.components.specific.tap.GraphTimePlaySheet",
                "type": "viz",
                image: 'resources/img/svg/networktime-svg-icon.svg',
                handle: false,
                display: {
                    title: "Network Timeline",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "network-timeline timeline-forcegraph",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                    'bower_components/ng-table/dist/ng-table.min.js',
                                    'bower_components/taffy/taffy-min.js',
                                   'bower_components/d3-tip-playsheet/index.js'
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
                        directiveOptions: ""
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: false,
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
                            'graphLockToggle',
                            'defaultHandle'
                        ],
                        defaultVisualOptions: [],
                        defaultToolOptions: {},
                        getAdditionalVisualOption: function (count) {
                        }
                    }
                }
            },
            "prerna.ui.components.specific.ousd.RoadmapTimelineStatsPlaySheet": {
                layout: "prerna.ui.components.specific.ousd.RoadmapTimelineStatsPlaySheet",
                "type": "viz",
                image: 'resources/img/svg/chart-gantt.svg',
                handle: false,
                display: {
                    title: "Gantt",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "ousdmaster",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                    'bower_components/c3/c3.min.js'
                                ]
                            },
                            {
                                serie: true,
                                files: [
                                    'bower_components/c3/c3.min.css'
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
                                    'custom/specific/ousd/ousd.css'
                                ]
                            },
                            {
                                files: [
                                    'standard/chart/chart.directive.js',
                                    'custom/specific/ousd/ousdmaster.js',
                                    'custom/specific/ousd/timeline/timeline.js',
                                    'custom/specific/ousd/ousdcombo/ousdcombo.js'
                                ]
                            }
                        ],
                        directiveOptions: "",
                        directiveTools: ""
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: false,
                        vizHandles: [],
                        defaultToolOptions: {},
                        defaultVisualOptions: [],
                        getAdditionalOption: function () {
                        }
                    }
                }
            },
            "prerna.ui.components.specific.iatdd.AOAQueuingDashboard": {
                layout: "prerna.ui.components.specific.iatdd.AOAQueuingDashboard",
                "type": "viz",
                image: 'resources/img/svg/chart-gantt.svg',
                handle: false,
                display: {
                    title: "AoA Queuing Dashboard",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "iatddqueuing",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js',
                                    'bower_components/c3/c3.min.js',
                                    'bower_components/angular-bootstrap-slider/slider.js',
                                    'bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.min.js',
                                    'bower_components/seiyria-bootstrap-slider/dist/css/bootstrap-slider.min.css'
                                ]
                            },
                            {
                                serie: true,
                                files: [
                                    'bower_components/c3/c3.min.css'
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
                        directiveOptions: "",
                        directiveTools: ""
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: false,
                        vizHandles: [],
                        defaultToolOptions: {},
                        defaultVisualOptions: [],
                        getAdditionalOption: function () {
                        }
                    }
                }
            },


            /*************************************** Navy PEO Scorecard ***************************************************/

            "prerna.ui.components.specific.navypeo.NavyScoreboardPlaysheet": {
                layout: "prerna.ui.components.specific.navypeo.NavyScoreboardPlaysheet",
                "type": "viz",
                image: 'core/resources/img/svg/-svg-icon.svg',
                handle: false,
                display: {
                    title: "Scorecard",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "scorecard",
                        directiveFiles: [
                            {
                                serie: true,
                                files: [
                                    'bower_components/d3-playsheet/d3.min.js',
                                   'bower_components/d3-tip-playsheet/index.js',
                                    'custom/specific/navy/html2canvas.js'
                                ]
                            },
                            {
                                files: [
                                    'standard/chart/chart.css',
                                    'custom/specific/navy/scorecard.css'
                                ]
                            },
                            {
                                files: [
                                    'standard/chart/chart.directive.js',
                                    'custom/specific/navy/scorecard.directive.js'
                                ]
                            }
                        ],
                        directiveOptions: "",
                        directiveTools: ""
                    },
                    options: {
                        "showOnVisualPanel": false,
                        "saveEnabled": false,
                        pkqlEnabled: false,
                        vizHandles: [],
                        defaultToolOptions: {},
                        defaultVisualOptions: [],
                        getAdditionalOption: function () {
                        }
                    }
                }
            },


            /********************************************Handles*************************************************************/

            // "default": {
            //     "layout": "default",
            //     "type": "other",
            //     "handle": {
            //         "name": "default",
            //         "title": 'Default Visualization Mode',
            //         "description": 'Allows you to see tooltips',
            //         "groups": ['tools'],
            //         "content": '<i class="fa widget-button-icon-size fa-mouse-pointer" style="margin-left: 2px;"></i>',
            //         "cssClass": "{'toggled-outline': widget.widgetData.mode === 'default', 'disabled': widget.widgetData.selectedHandle === 'create'}", //bad
            //         "click": function () {
            //             $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'default');
            //         },
            //         "pinned": true
            //     },
            //     "display": false
            // },
            // 'comment': {
            //     "layout": "comment",
            //     "type": "other",
            //     "handle": {
            //         "name": "comment",
            //         "title": 'Comment Visualization Mode',
            //         "description": 'Allows you to comment on your visualization',
            //         "groups": ['tools'],
            //         "content": '<i class="fa widget-button-icon-size fa-comment-o" style="margin-left: -2px;"></i>',
            //         "cssClass": "{'toggled-outline': widget.widgetData.mode === 'comment', 'disabled': widget.widgetData.selectedHandle === 'create'}", //bad
            //         "click": function () {
            //             $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'comment');
            //         },
            //         "pinned": false
            //     },
            //     "display": false
            // },
            // 'edit': {
            //     "layout": "edit",
            //     "type": "other",
            //     "handle": {
            //         "name": "edit",
            //         "title": 'Edit Visualization Mode',
            //         "description": 'Allows you to comment on your visualization',
            //         "groups": ['tools'],
            //         "content": '<i class="fa widget-button-icon-size fa-pencil" style="margin-left: -2px;"></i>',
            //         "cssClass": "{'toggled-outline': widget.widgetData.mode === 'edit', 'disabled': widget.widgetData.selectedHandle === 'create'}", //bad
            //         "click": function () {
            //             $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'edit');
            //         },
            //         "pinned": false
            //     },
            //     "display": false
            // },
            // "brush": {
            //     "layout": "brush",
            //     "type": "other",
            //     "handle": {
            //         "name": "brush",
            //         "title": 'Brush Visualization Mode',
            //         "description": 'Allows you to dynamically filter on a subsection of your visualization',
            //         "groups": ['tools'],
            //         "content": '<i class="fa widget-button-icon-size fa-paint-brush" style="margin-left: -2px;"></i>',
            //         "cssClass": "{'toggled-outline': widget.widgetData.mode === 'brush', 'disabled': widget.widgetData.selectedHandle === 'create'}", //bad
            //         "click": function () {
            //             $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'brush');
            //         },
            //         "pinned": false
            //     },
            //     "display": false
            // },
            // 'defaultHandle': {
            //     layout: "defaultHandle",
            //     "type": "other",
            //     handle: {
            //         name: "defaultHandle",
            //         title: 'Custom PKQL',
            //         description: 'Quickly create a custom PKQL routine',
            //         groups: ['tools'],
            //         content: '<i class="fa widget-button-icon-size fa-file-code-o"></i>',
            //         contentSrc: false,
            //         cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'defaultHandle'}",
            //         "click": function () {
            //             $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'defaultHandle');
            //         },
            //         pinned: false
            //     },
            //     display: {
            //         title: "Custom PKQL",
            //         jsonView: false, //default widget object
            //         template: {
            //             directiveName: "default-handle",
            //             directiveFiles: [
            //                 {
            //                     files: [
            //                         'bower_components/checklist-model/checklist-model.js'
            //                     ]
            //                 },
            //                 {
            //                     files: [
            //                         'custom/default-handle/default-handle.css'
            //                     ]
            //                 },
            //                 {
            //                     files: [
            //                         'custom/default-handle/default-handle.directive.js'
            //                     ]
            //                 }
            //             ],
            //             directiveOptions: "",
            //             directiveTools: ''
            //         },
            //         displayPosition: 'popup'
            //     }
            // },
            'visual': {
                layout: "visual",
                "type": "other",
                handle: {
                    name: "visual",
                    title: 'Change Visualization Type',
                    description: 'Change the visual type and select values/labels for the insight',
                    groups: ['visual'],
                    content: '<i class="fa widget-button-icon-size fa-pie-chart" style="margin-top:4px"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'visual', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'visual');
                    },
                    pinned: true
                },
                display: {
                    title: "Change Visualization Type",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "visual-panel",
                        directiveFiles: [
                            //{
                            //    files: [
                            //        //'bower_components/ng-sortable/dist/ng-sortable.min.css',
                            //        //'bower_components/ng-sortable/dist/ng-sortable.style.min.css'
                            //        //'..bower_components/angular-ui-sortable/sortable.min.css'
                            //    ]
                            //},
                            {
                                serie: true,
                                files: [
                                    //'bower_components/jquery/dist/jquery.min.js',
                                    'bower_components/angular-ui-sortable/sortable.min.js',
                                    //'bower_components/ng-sortable/dist/ng-sortable.min.js',
                                    'bower_components/angular-bootstrap/ui-bootstrap.min.js',
                                    'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js'
                                ]
                            },
                            {
                                files: [
                                    'custom/visual-panel/visual-panel.css'
                                ]
                            },
                            {
                                files: [
                                    'custom/visual-panel/visual-panel.directive.js'
                                ]
                            }
                        ],
                        directiveOptions: "",
                        directiveTools: ''
                    },
                    displayPosition: 'popup'
                }
            },
            // 'analytics': {
            //     layout: "analytics",
            //     "type": "other",
            //     handle: {
            //         name: "analytics",
            //         title: 'Run Analytical Routine',
            //         description: 'Select an analytical routine to run on-the-fly',
            //         groups: ['analytics'],
            //         content: '<i class="fa widget-button-icon-size fa-cogs" style="margin-left: -2px;"></i>',
            //         contentSrc: false,
            //         cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'analytics', 'disabled': widget.widgetData.selectedHandle === 'create'}",
            //         "click": function () {
            //             $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'analytics');
            //         },
            //         pinned: true
            //     },
            //     display: {
            //         title: "Run Analytical Routine",
            //         jsonView: false, //default widget object
            //         template: {
            //             directiveName: "analytics-panel",
            //             directiveFiles: [
            //                 {
            //                     files: [
            //                         'custom/analytics-panel/analytics-panel.css'
            //                     ]
            //                 },
            //                 {
            //                     files: [
            //                         'standard/services/analytics.service.js',
            //                         'custom/analytics-panel/analytics-panel.directive.js'
            //                     ]
            //                 }
            //             ],
            //             directiveOptions: "",
            //             directiveTools: ''
            //         },
            //         displayPosition: 'popup'
            //     }
            // },
            //Admin
            'save': {
                layout: "save",
                "type": "other",
                handle: {
                    name: "save",
                    title: 'Save Visualization',
                    description: 'Save your visualization as an insight in your database',
                    groups: ['widgetAdmin'],
                    content: '<i class="fa widget-button-icon-size fa-floppy-o"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'save','disabled': !widget.widgetData.controlsConfig.saveEnabled || widget.widgetData.selectedHandle === 'create'}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'save');
                    },
                    pinned: true
                },
                display: {
                    title: "Save Visualization",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "save-panel",
                        directiveFiles: [
                            {
                                files: [
                                    'custom/save-panel/save-panel.css'
                                ]
                            },
                            {
                                files: [
                                    'custom/save-panel/save-panel.directive.js'
                                ]
                            }
                        ],
                        directiveOptions: "",
                        directiveTools: ''
                    },
                    displayPosition: 'popup'
                }
            },
            // 'related': {
            //     layout: "related",
            //     "type": "other",
            //     handle: {
            //         name: "related",
            //         title: 'View Related Insights',
            //         description: 'View insights related to a data piece you double clicked on',
            //         groups: ['widgetAdmin'],
            //         content: '<i class="fa widget-button-icon-size fa-share-alt"><span class="related-badge" ng-hide="!widget.widgetData.enableRelatedInsights" ng-class="{\'relatedpulse\': widget.widgetData.relatedGlow, \'gray\': widget.widgetData.relatedInsightsCount < 1}"></span></i>',
            //         contentSrc: false,
            //         cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'related', 'disabled': !widget.widgetData.enableRelatedInsights || widget.widgetData.selectedHandle === 'create'}",
            //         "click": function () {
            //             $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'related');
            //         },
            //         pinned: true
            //     },
            //     display: {
            //         title: "View Related Insights",
            //         jsonView: false, //default widget object
            //         template: {
            //             directiveName: "related-panel",
            //             directiveFiles: [
            //                 {
            //                     serie: true,
            //                     files: [
            //                         'bower_components/angular-bootstrap/ui-bootstrap.min.js',
            //                         'bower_components/ng-infinite-scroll/ng-infinite-scroll.min.js'
            //                     ]
            //                 },
            //                 {
            //                     files: [
            //                         'custom/related-panel/related-panel.css',
            //                         '../core/standard/search/search.css'
            //                     ]
            //                 },
            //                 {
            //                     files: [
            //                         'custom/related-panel/related-panel.directive.js'
            //                     ]
            //                 }
            //             ],
            //             directiveOptions: "",
            //             directiveTools: ''
            //         },
            //         displayPosition: 'popup'
            //     }
            // },
            // 'clone': {
            //     layout: "clone",
            //     "type": "other",
            //     handle: {
            //         name: "clone",
            //         title: 'Clone Visual',
            //         description: 'Create another visualization that is linked to this visualization\'s data set',
            //         groups: ['widgetAdmin'],
            //         content: '<i class="fa widget-button-icon-size fa-clone"></i>',
            //         contentSrc: false,
            //         cssClass: "{'disabled': widget.widgetData.panelId != 0, 'disabled': widget.widgetData.selectedHandle === 'create'}",
            //         "click": function () {
            //             $rootScope.$emit('widget-receive', 'generate-clone-query', 'clone');
            //         },
            //         pinned: true
            //     },
            //     display: false
            // },
            // 'create': {
            //     "layout": "create",
            //     "type": "other",
            //     "handle": {
            //         "name": "create",
            //         "title": 'Edit Data',
            //         "description": 'Edit your data set for this visualization by adding more nodes from databases',
            //         "groups": ['data'],
            //         "content": '<i class="fa widget-button-icon-size fa-edit" style="margin-top:4px"></i>',
            //         "contentSrc": false,
            //         "cssClass": "{'toggled-background': widget.widgetData.selectedHandle === 'create'}",
            //         "click": function () {
            //             $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'create');
            //             //todo fix this
            //             $rootScope.$emit('create-panel-receive', 'join-queued-nodes');
            //         },
            //         "pinned": true
            //     },
            //     "display": {
            //         "title": "Edit Data",
            //         "jsonView": false, //default widget object
            //         "template": {
            //             directiveName: "create-panel",
            //             directiveFiles: [
            //                 {
            //                     serie: true,
            //                     files: [
            //                         'bower_components/d3-playsheet/d3.min.js',
            //                        'bower_components/d3-tip-playsheet/index.js',
            //                         'bower_components/dagre-d3/dagre-d3.js'
            //                     ]
            //                 },
            //                 {
            //                     serie: true,
            //                     files: [
            //                         'bower_components/angular-bootstrap/ui-bootstrap.min.js',
            //                         'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
            //                         'bower_components/moment/moment.js',
            //                         'bower_components/pikaday/pikaday.js',
            //                         'bower_components/zeroclipboard/dist/ZeroClipboard.min.js',
            //                         'bower_components/handsontable/dist/handsontable.min.js',
            //                         'bower_components/ngHandsontable/dist/ngHandsontable.min.js'
            //                     ]
            //                 },
            //                 {
            //                     files: [
            //                         'bower_components/ng-infinite-scroll/ng-infinite-scroll.min.js',
            //                         'bower_components/checklist-model/checklist-model.js'
            //                     ]
            //                 },
            //                 {
            //                     files: [
            //                         'bower_components/handsontable/dist/handsontable.full.css',
            //                         'resources/css/dropzone.css',
            //                         'custom/create-panel/create-panel.css',
            //                         'custom/create-free-text/create-free-text.css',
            //                         'standard/chart/chart.css',
            //                         'standard/smss-grid/smss-grid.css'
            //                     ]
            //                 },
            //                 {
            //                     files: [
            //                         'custom/create-panel/create-panel.directive.js',
            //                         'custom/create-panel/create-panel.service.js',
            //                         'custom/create-metamodel/create-metamodel.directive.js',
            //                         'custom/create-free-text/create-free-text.directive.js',
            //                         'custom/create-raw-data/create-raw-data.directive.js',
            //                         'standard/chart/chart.directive.js',
            //                         'standard/smss-grid/smss-grid.directive.js'
            //                     ]
            //                 }
            //             ],
            //             directiveOptions: "",
            //             directiveTools: ''
            //         },
            //         "displayPosition": 'popup',
            //         "options": {
            //             "vizHandles": ['console', 'create', 'defaultHandle'],
            //             "pkqlEnabled": true
            //         }
            //     }
            // },
            // 'console': {
            //     layout: "console",
            //     "type": "other",
            //     handle: {
            //         name: "console",
            //         title: 'Toggle Console',
            //         description: 'Toggle your console to write PKQL, R, or Java React queries',
            //         groups: ['widgetAdmin'],
            //         content: '<div class="full-width center"><i class="fa widget-button-icon-size fa-terminal xs-right-padding"></i></div>',
            //         contentSrc: false,
            //         cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'console'}",
            //         "click": function () {
            //             $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'console');
            //         },
            //         pinned: true
            //     },
            //     display: {
            //         title: "Toggle Console",
            //         jsonView: false, //default widget object
            //         template: {
            //             directiveName: "terminal-panel",
            //             directiveFiles: [
            //                 {
            //                     serie: true,
            //                     files: [
            //                         'bower_components/codemirror/lib/codemirror.js',
            //                         'bower_components/codemirror/addon/hint/show-hint.js',
            //                         'bower_components/angular-scroll-glue/src/scrollglue.js'
            //                     ]
            //                 },
            //                 {
            //                     files: [
            //                         'bower_components/codemirror/lib/codemirror.css',
            //                         'bower_components/codemirror/addon/hint/show-hint.css'
            //                     ]
            //                 },
            //                 {
            //                     files: [
            //                         'custom/terminal-panel/terminal-panel.css'
            //                     ]
            //                 },
            //                 {
            //                     files: [
            //                         'standard/resizer/resizer.directive.js',
            //                         'custom/terminal-panel/terminal-panel.directive.js'
            //                     ]
            //                 }
            //             ],
            //             directiveOptions: "",
            //             directiveTools: ''
            //         },
            //         displayPosition: 'popup'
            //     }
            // },
            //Sharing
            'csv': {
                layout: "csv",
                "type": "other",
                handle: {
                    name: "csv",
                    title: 'Export To CSV',
                    description: 'Export your data set for this visualization as a CSV file',
                    groups: ['share'],
                    content: '<div class="full-width center"><i style="margin-top:4px" class="fa widget-button-icon-size fa-table xs-right-padding"></i></div>',
                    contentSrc: false,
                    cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'csv', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'export-to-csv');
                    },
                    pinned: false
                },
                display: false
            },
            'svg': {
                layout: "svg",
                "type": "other",
                handle: {
                    name: "svg",
                    title: 'Save As SVG',
                    description: 'Export your visualization as an SVG',
                    groups: ['share'],
                    content: '<div class="full-width center"><i style="margin-top:4px" class="fa widget-button-icon-size fa-file-image-o xs-right-padding"></i></div>',
                    contentSrc: false,
                    cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'svg', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                    "click": function () {
                        saveAsSVG();
                    },
                    pinned: false
                },
                display: false
            },
            // 'embed': {
            //     layout: "embed",
            //     "type": "other",
            //     handle: {
            //         name: "embed",
            //         title: 'Embed',
            //         description: 'Embed your insight into any HTML document',
            //         groups: ['share'],
            //         content: '<i class="fa widget-button-icon-size fa-code"></i>',
            //         contentSrc: false,
            //         cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'embed', 'disabled': widget.widgetData.selectedHandle === 'create'}",
            //         "click": function () {
            //             $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'embed');
            //         },
            //         pinned: false
            //     },
            //     display: {
            //         title: "Embed",
            //         jsonView: false, //default widget object
            //         template: {
            //             directiveName: "embed-panel",
            //             directiveFiles: [
            //                 {
            //                     files: [
            //                         'custom/embed/embed.directive.js'
            //                     ]
            //                 }
            //             ],
            //             directiveOptions: "",
            //             directiveTools: ''
            //         },
            //         displayPosition: 'popup'
            //     }
            // },
            //Data
            'param': {
                layout: "param",
                "type": "other",
                handle: {
                    name: "param",
                    title: 'Show Parameters',
                    description: 'Change your parameter for your insight and reload the visual',
                    groups: ['data'],
                    content: '<i class="fa widget-button-icon-size fa-list" style="margin-top:2px; margin-left:-1px"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'param', 'disabled': !widget.widgetData.hasParams || widget.widgetData.selectedHandle === 'create'}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'param');
                    },
                    pinned: false
                },
                display: {
                    title: "Show Parameters",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "param-overlay",
                        directiveFiles: [
                            {
                                files: [
                                    'custom/param-overlay/param-overlay.css'
                                ]
                            },
                            {
                                files: [
                                    'custom/param-overlay/param-overlay.directive.js'
                                ]
                            }
                        ],
                        directiveOptions: "",
                        directiveTools: ''
                    },
                    displayPosition: 'popup'
                }
            },
            'filter': {
                layout: "filter",
                "type": "other",
                handle: {
                    name: "filter",
                    title: 'Filter Visualization',
                    description: 'Filter your data set',
                    groups: ['data', 'tools'],
                    content: '<i class="fa widget-button-icon-size fa-filter"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'filter', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'filter');
                    },
                    pinned: false
                },
                display: {
                    title: "Filter Visualization",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "filter-panel",
                        directiveFiles: [
                            {
                                files: [
                                    'custom/filter-panel/filter-panel.css'
                                ]
                            },
                            {
                                files: [
                                    'custom/filter-panel/filter-panel.directive.js'
                                ]
                            }
                        ],
                        directiveOptions: "",
                        directiveTools: ''
                    },
                    displayPosition: 'popup'
                }
            },
            //additional tools
            'additionalTools': {
                layout: "additionalTools",
                "type": "other",
                handle: {
                    name: "additionalTools",
                    title: 'View Additional Tools',
                    description: 'View additional tools to customize your visualization',
                    groups: ['tools'],
                    content: '<i class="fa widget-button-icon-size fa-ellipsis-h"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'additionalTools', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'additionalTools');
                    },
                    pinned: false
                },
                display: {
                    title: "View Additional Tools",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "tool-panel",
                        directiveFiles: [
                            {
                                files: [
                                    'bower_components/angular-bootstrap-slider/slider.js',
                                    'bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.min.js',
                                    'bower_components/seiyria-bootstrap-slider/dist/css/bootstrap-slider.min.css'

                                ]
                            },
                            {
                                files: [
                                    'standard/tool-panel/tool-panel.css'
                                ]
                            },
                            {
                                files: [
                                    'standard/tool-panel/tool-panel.directive.js'
                                ]
                            }
                        ],
                        directiveOptions: "",
                        directiveTools: ''
                    },
                    displayPosition: 'popup'
                }
            },
            //Viz Specific Handles
            'traverse': {
                layout: "traverse",
                "type": "other",
                handle: {
                    name: "traverse",
                    title: 'Traverse',
                    description: 'Traverse your data set from a selected node or category of nodes',
                    groups: ['tools', 'data'],
                    content: '<i class="fa widget-button-icon-size fa-link"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'additionalTools', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'traverse');
                    },
                    pinned: false
                },
                display: {
                    title: "Traverse",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "traverse-panel",
                        directiveFiles: [
                            {
                                files: [
                                    'custom/traverse-panel/traverse-panel.css'
                                ]
                            },
                            {
                                files: [
                                    'custom/traverse-panel/traverse-panel.directive.js'
                                ]
                            }
                        ],
                        directiveOptions: "",
                        directiveTools: ''
                    },
                    displayPosition: 'popup'
                }
            },
            'graphLockToggle': {
                layout: "graphLockToggle",
                "type": "other",
                handle: {
                    name: "graphLockToggle",
                    title: 'Toggle Graph Lock',
                    description: 'Lock/unlock your force graph from moving',
                    groups: ['tools', 'data'],
                    content: "<i ng-class=\"{'fa-lock': !widget.widgetData.chartData.uiOptions.graphLockToggle, 'fa-unlock-alt': widget.widgetData.chartData.uiOptions.graphLockToggle}\" class='fa widget-button-icon-size'></i>",
                    contentSrc: false,
                    cssClass: "{'toggled-outline': widget.widgetData.selectedHandle === 'graphLockToggle', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                    "click": function () {
                        //TODO need a MUCH better way than doing this - maybe just sending a message to the directive itself. eitherway its against flux and we need a pkql for this, problem is repainting.. going to need an echo pkql
                        $rootScope.$emit('widget-receive', 'default-widget-click', {
                            uiOptionsUpdate: true,
                            label: 'graphLockToggle',
                            value: null
                        });
                    },
                    pinned: false
                },
                display: false
            },
            'color': {
                layout: "color",
                "type": "other",
                handle: {
                    name: "color",
                    title: 'Color Visualization',
                    description: 'Customize the colors of your visualization',
                    groups: ['tools'],
                    content: '<div class="widget-handle-custom-img"><img ng-if="widget.widgetData.selectedHandle === \'color\'" class="full-width full-height" alt="Color Tools image" src="resources/img/painter-palette-white.png"><img ng-if="widget.widgetData.selectedHandle !== \'color\'" class="full-width full-height" alt="Color Tools image" src="resources/img/painter-palette-black.png"></div>',
                    contentSrc: false,
                    cssClass: "{'toggled-background': widget.widgetData.selectedHandle === 'color', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'color');
                    },
                    pinned: false
                },
                display: {
                    title: "Color Visualization",
                    jsonView: false, //default widget object
                    template: {
                        directiveName: "color-panel",
                        directiveFiles: [
                            {
                                files: [
                                    'custom/color-panel/color-panel.css',
                                    'bower_components/angular-bootstrap-colorpicker/colorpicker.min.css'
                                ]
                            },
                            {
                                files: [
                                    'bower_components/angular-bootstrap-colorpicker/bootstrap-colorpicker-module.min.js',
                                    'custom/color-panel/color-panel.directive.js'
                                ]
                            }
                        ],
                        directiveOptions: "",
                        directiveTools: ''
                    },
                    displayPosition: 'popup'
                }
            },
            'displayValues': {
                layout: "displayValues",
                "type": "other",
                handle: {
                    name: "displayValues",
                    title: 'Display Values',
                    description: 'Display values in your visualization',
                    groups: ['tools'],
                    content: '<i class="fa widget-button-icon-size fa-font"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.displayValues}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'default-widget-click', {
                            uiOptionsUpdate: true,
                            label: 'displayValues',
                            value: null
                        });
                    },
                    pinned: false
                },
                display: {
                    title: "Display Values",
                    jsonView: [
                        {
                            "title": "Display Values",
                            "Description": "Displays the values on a visualization",
                            "pkqlCommand": "",
                            "input": {}
                        }
                    ]
                    , //default widget object
                    template: false,
                    displayPosition: 'popup'
                }
            },

            //TODO cheap fix for sortValues would be to send a specific message to widget and do the functions in the click function
            //TODO better solution is to get the headers from the backend through a pkql and populate them into the view
            // 'sortValues':{
            //     layout: "sortValues",
            //     "type": "other",
            //     handle: {
            //         name: "sortValues",
            //         title: 'Sort Values',
            //         groups: ['tools'],
            //         content: '<i class="fa widget-button-icon-size fa-sort-amount-asc"></i>',
            //         contentSrc: false,
            //         cssClass: "{'toggled-outline': false}",
            //         "click": function () {
            //             // var currentWidget = dataService.getWidgetData();
            //             //
            //             // if (!currentWidget.data.chartData.uiOptions) {
            //             //     currentWidget.data.chartData.uiOptions = {};
            //             // }
            //             // //through pkql
            //             // var pkqlVars = {sortLabel: 'sortLabel', sortType: 'sortType'};
            //             // // var defaultHandlePKQL = pkqlService.generatePKQLwithVars(currentWidget.panelId, currentWidget.data.chartData.uiOptions, pkqlVars);
            //             //
            //             // //Get visual options and set them in defaultHandleJSON
            //             // var headers = currentWidget.data.chartData.headers.map(function(a){return a.title});
            //             //
            //             // widgetHandles.sortValues.defaultHandleJSON[0].input.sortLabel.options = headers;
            //             // widgetHandles.sortValues.defaultHandleJSON[0].pkqlCommand = defaultHandlePKQL;
            //             // $rootScope.$emit('widget-receive', 'toggle-widget-handle', 'sortValues');
            //             //
            //             // $rootScope.$emit('widget-receive', 'default-widget-click', {
            //             //     uiOptionsUpdate: true,
            //             //     label: 'sortValues',
            //             //     value: -1
            //             //
            //             // });
            //         },
            //         pinned: false
            //     },
            //     display: {
            //         title: "Sort Values",
            //         jsonView: [
            //             {
            //                 "Title": "Sort Values",
            //                 "Description": "Sorts the values of a visualization in either ascending or descending order",
            //                 "pkqlCommand": "",
            //                 "input": {
            //                     "sortLabel": {
            //                         "name": "sortLabel",
            //                         "type": "dropdown",
            //                         "required": true,
            //                         "label": "Choose an option to sort on: ",
            //                         "optionsGetter": {},
            //                         "options": [],
            //                         "value": "",
            //                         "attribute": {}
            //                     },
            //                     "sortType": {
            //                         "name": "sortType",
            //                         "type": "buttonGroup",
            //                         "required": true,
            //                         "label": "Choose a sort type:",
            //                         "optionsGetter": {},
            //                         "options": ["sortAscending", "sortDescending"],
            //                         "value": "",
            //                         "attribute": {"buttonGroupAttr": "style='display: block'", "buttonAttr": "ng-class=\"{'fa fa-sort-amount-asc': button === 'sortAscending', 'fa fa-sort-amount-desc': button === 'sortDescending'}\" class='btn-light btn-half'"}
            //                     }
            //                 }
            //             }
            //         ], //default widget object
            //         template: false,
            //         displayPosition: 'popup'
            //     }
            // },
            'seriesFlipped': {
                layout: "seriesFlipped",
                "type": "other",
                handle: {
                    name: "seriesFlipped",
                    title: 'Flip Series',
                    description: 'Reverse the order of the series on the bar chart',
                    groups: ['tools'],
                    content: '<i class="fa widget-button-icon-size fa-random"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.seriesFlipped}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'default-widget-click', {
                            uiOptionsUpdate: true,
                            label: 'seriesFlipped',
                            value: null
                        });
                    },
                    pinned: false
                },
                display: {
                    title: "Display Values",
                    jsonView: [
                        {
                            "title": "Flip Series",
                            "Description": "Flips the series on the visualization",
                            "pkqlCommand": "",
                            "input": {}
                        }
                    ]
                    , //default widget object
                    template: false,
                    displayPosition: 'popup'
                }
            },
            'rotateAxis': {
                layout: "rotateAxis",
                "type": "other",
                handle: {
                    name: "rotateAxis",
                    title: 'Flip Axis',
                    description: 'Switch X and Y axes',
                    groups: ['tools'],
                    content: '<i class="fa widget-button-icon-size fa-random"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.rotateAxis}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'default-widget-click', {
                            uiOptionsUpdate: true,
                            label: 'rotateAxis',
                            value: null
                        });
                    },
                    pinned: false
                },
                display: {
                    title: "Flip Axis",
                    jsonView: [
                        {
                            "title": "Flip Axis",
                            "Description": "Flips the axis on the visualization",
                            "pkqlCommand": "",
                            "input": {},
                            "requredData": [
                                "chartData",
                                "uiOptions"
                            ]
                        }
                    ]
                    , //default widget object
                    template: false,
                    displayPosition: 'popup'
                }
            },

            'toggleZ': {
                layout: "toggleZ",
                "type": "other",
                handle: {
                    name: "toggleZ",
                    title: 'Toggle Z-Index',
                    description: 'Toggle on/off the sizing of circles on the scatter plot based on Z-value',
                    groups: ['tools'],
                    content: '<i class="fa widget-button-icon-size fa-check"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.toggleZ}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'default-widget-click', {
                            uiOptionsUpdate: true,
                            label: 'toggleZ',
                            value: null
                        });
                    },
                    pinned: false
                },
                display: {
                    title: "Toggle Z-Index",
                    jsonView: [
                        {
                            "title": "Toggle Z-Index",
                            "Description": "Toggles off/on the z-axis",
                            "pkqlCommand": "",
                            "input": {}
                        }
                    ]
                    , //default widget object
                    template: false,
                    displayPosition: 'popup'
                }
            },
            'lineGuide': {
                layout: "lineGuide",
                "type": "other",
                handle: {
                    name: "lineGuide",
                    title: 'Toggle Quadrants',
                    description: 'Toggle on/off lines on the scatter plot that visualize the median of the data set',
                    groups: ['tools'],
                    content: '<i class="fa widget-button-icon-size fa-eraser"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.lineGuide}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'default-widget-click', {
                            uiOptionsUpdate: true,
                            label: 'lineGuide',
                            value: null
                        });
                    },
                    pinned: false
                },
                display: {
                    title: "Toggle Quadrants",
                    jsonView: [
                        {
                            "title": "Toggle Quadrants",
                            "Description": "Toggles the line guide on and off",
                            "pkqlCommand": "",
                            "input": {}
                        }
                    ]
                    , //default widget object
                    template: false,
                    displayPosition: 'popup'
                }
            },


            'xReversed': {
                layout: "xReversed",
                "type": "other",
                handle: {
                    name: "xReversed",
                    title: 'Reverse X Axis',
                    description: 'Display X-axis values in reversed order',
                    groups: ['tools'],
                    content: '<i class="fa fa-arrows-h" aria-hidden="true"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.xReversed}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'default-widget-click', {
                            uiOptionsUpdate: true,
                            label: 'xReversed',
                            value: null
                        });
                    },
                    pinned: false
                },
                display: {
                    title: "Reverse X Axis",
                    jsonView: [
                        {
                            "title": "X Axis Reverse",
                            "Description": "Displays the X Axis values in reverse order",
                            "pkqlCommand": "",
                            "input": {}
                        }
                    ]
                    , //default widget object
                    template: false,
                    displayPosition: 'popup'
                }
            },
            'yReversed': {
                layout: "yReversed",
                "type": "other",
                handle: {
                    name: "yReversed",
                    title: 'Reverse Y Axis',
                    description: 'Display Y-axis values in reversed order',
                    groups: ['tools'],
                    content: '<i class="fa fa-arrows-v" aria-hidden="true"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.yReversed}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'default-widget-click', {
                            uiOptionsUpdate: true,
                            label: 'yReversed',
                            value: null
                        });
                    },
                    pinned: false
                },
                display: {
                    title: "Reverse Y Axis",
                    jsonView: [
                        {
                            "title": "Y Axis Reverse",
                            "Description": "Displays the Y Axis values in reverse order",
                            "pkqlCommand": "",
                            "input": {}
                        }
                    ]
                    , //default widget object
                    template: false,
                    displayPosition: 'popup'
                }
            },
            'stackToggle': {
                layout: "stackToggle",
                "type": "other",
                handle: {
                    name: "stackToggle",
                    title: 'Stack Data',
                    description: 'Toggle on/off the bar groups as stacked',
                    groups: ['tools'],
                    content: '<i class="fa widget-button-icon-size fa-stack-overflow"></i>',
                    contentSrc: false,
                    cssClass: "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.stackToggle}",
                    "click": function () {
                        $rootScope.$emit('widget-receive', 'default-widget-click', {
                            uiOptionsUpdate: true,
                            label: 'stackToggle',
                            value: null
                        });
                    },
                    pinned: false
                },
                display: {
                    title: "Stack Data",
                    jsonView: [
                        {
                            "title": "Stack Data",
                            "Description": "Stacks data series on the visualization",
                            "pkqlCommand": "",
                            "input": {}

                        }
                    ]
                    , //default widget object
                    template: false,
                    displayPosition: 'popup'
                }
            }
            // 'numberOfBuckets': {
            //     layout: "stackToggle",
            //     "type": "other",
            //     handle: {
            //         name: "stackToggle",
            //         title: 'Stack Data',
            //         groups: ['tools'],
            //         content: '<i class="fa widget-button-icon-size fa-stack-overflow"></i>',
            //         contentSrc: false,
            //         cssClass: "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.stackToggle}",
            //         "click": function () {
            //             $rootScope.$emit('widget-receive', 'default-widget-click', {
            //                 uiOptionsUpdate: true,
            //                 label: 'stackToggle',
            //                 value: null
            //             });
            //         },
            //         pinned: false
            //     },
            //     display: {
            //         title: "Stack Data",
            //         jsonView: [
            //             {
            //                 "title": "Stack Data",
            //                 "Description": "Stacks data series on the visualization",
            //                 "pkqlCommand": "",
            //                 "input": {}
            //
            //             }
            //         ]
            //         , //default widget object
            //         template: false,
            //         displayPosition: 'popup'
            //     }
            //
            //     'name': 'numberOfBuckets',
            //     'groups': ['tools'],
            //     'buttonContent': '<i class="fa widget-button-icon-size fa-hashtag"></i>',
            //     'buttonTitle': 'Number of Buckets',
            //     'buttonClass': "{'toggled-outline': false}",
            //     'buttonActions': {
            //         'click': function () {
            //             var currentWidget = dataService.getWidgetData();
            //
            //             if (!currentWidget.data.chartData.uiOptions) {
            //                 currentWidget.data.chartData.uiOptions = {};
            //             }
            //             currentWidget.data.chartData.uiOptions.rotateAxis = !currentWidget.data.chartData.uiOptions.rotateAxis;
            //
            //             //through pkql
            //             var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, currentWidget.data.chartData.uiOptions);
            //             widgetHandles.flipAxis.defaultHandleJSON[0].pkqlCommand = toolQuery;
            //             dataService.toggleWidgetHandle('numberOfBuckets');
            //         }
            //     },
            //     'pinned': false,
            //     'widgetHandleContent': '',
            //     'widgetHandleContentFiles': [
            //         {
            //             files: [
            //                 'bower_components/angular-bootstrap-slider/slider.js',
            //                 'bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.min.js',
            //                 'bower_components/seiyria-bootstrap-slider/dist/css/bootstrap-slider.min.css'
            //             ]
            //         }],
            //     'defaultHandleJSON':[
            //         {
            //             "title": "Number of Buckets",
            //             "Description": "Buckets the values into groups",
            //             "pkqlCommand": "",
            //             "input": {
            //                 "sortType": {
            //                     "name": "buckets",
            //                     "type": "slider",
            //                     "required": true,
            //                     "label": "Select the number of buckets:",
            //                     "optionsGetter": {},
            //                     "options": [0, 10],
            //                     "value": "",
            //                     "attribute": {"buttonGroupAttr": "style='display: block'", "buttonAttr": "ng-class=\"{'fa fa-sort-amount-asc': button === 'sortAscending', 'fa fa-sort-amount-desc': button === 'sortDescending'}\" class='btn-light btn-half'"}
            //                 }
            //             }
            //         }
            //     ]
            // }


            /*************************************** Upload / Other **************************************************/

        };


        /*********************************************WidgetHandleGroups *************************************/

        var widgetHandleGroups = {
            'widgetAdmin': {
                'showInEmbed': true,
                'buttonIcon': '<i class="fa widget-button-icon-size fa-cog xs-right-padding"></i>',
                'buttonText': 'Admin',
                'buttonTitle': 'Insight Administrative Controls',
                'buttonActions': {}
            },
            'data': {
                'showInEmbed': true,
                'buttonIcon': '<i class="fa widget-button-icon-size fa-database xs-right-padding"></i>',
                'buttonText': 'Data',
                'buttonActions': {}
            },
            'visual': {
                'showInEmbed': true,
                'buttonIcon': '<i class="fa widget-button-icon-size fa-pie-chart xs-right-padding"></i>',
                'buttonText': 'Visual',
                'buttonTitle': 'Insight Visual Options',
                'buttonActions': {}
            },
            'analytics': {
                'showInEmbed': true,
                'buttonIcon': '<i class="fa widget-button-icon-size fa-cogs xs-right-padding"></i>',
                'buttonText': 'Analytics',
                'buttonTitle': 'Manage Insight Analytics',
                'buttonActions': {}
            },
            'tools': {
                'showInEmbed': true,
                'buttonIcon': '<i class="fa widget-button-icon-size fa-wrench xs-right-padding"></i>',
                'buttonText': 'Tools',
                'buttonTitle': 'Visualization Tools',
                'buttonActions': {}
            },
            'share': {
                'showInEmbed': true,
                'buttonIcon': '<i class="fa widget-button-icon-size fa-share-square-o xs-right-padding"></i>',
                'buttonText': 'Share',
                'buttonTitle': 'Share Insight',
                'buttonActions': {}
            }
        };


        /*** Handle Functions **/

        function getWidgetConfig() {
            return widgetConfig;
        }

        /**
         * @name getVizSvg
         * @desc function returns returns the visualization svg icon
         * @params layout {string} layout of selected viz
         * @returns {string} path to svg icon
         */
        function getVizSvg(layout) {
            if (widgetConfig[layout] && widgetConfig[layout].hasOwnProperty('image')) {
                return widgetConfig[layout].image;
            }
            return "resources/img/svg/-svg-icon.svg";
        }

        /**
         * @name getVizDisabledStatus
         * @desc returns if the viz is disabled
         * @params layout {string} layout of selected viz
         * @returns {Boolean}
         */
        function getVizDisabledStatus(vizID) {
            //we want to return if a viz does NOT exist >> reason the ! is there
            return !widgetConfig[vizID];
        }

        /**
         * @name checkDuplicateProcessing
         * @desc function that checks if the visualization can handle duplicates
         * @params layout {string} layout of selected viz
         * @returns {boolean} T/F  depending on viz's duplication handling
         */
        function checkDuplicateProcessing(layout) {
            if (widgetConfig[layout]) {
                return widgetConfig[layout].removeDuplicates;
            }
            alertService(layout + ' does not exist', 'Layout Error', 'toast-error', 5000);
            return true;
        }

        /**
         * @name getDefaultToolOptions
         * @desc gets the default tool options for the given visualization
         * @params layout {string} layout of selected viz
         * @returns {object} default tool options
         */
        function getDefaultToolOptions(layout) {
            if (widgetConfig[layout]) {
                return JSON.parse(JSON.stringify(widgetConfig[layout].display.options.defaultToolOptions));
            }
            return [];
        }

        /**
         * @name generateVisualOptions
         * @desc function returns the dataTableAlign of a visualization based on an array of selected parameters
         * @params layout {String} layout of selected viz
         * @param dataTableKeys {Array} array of selected visual options
         * @returns {object} dataTableAlign
         */
        function generateVisualOptions(layout, dataTableKeys) {
            var keys = JSON.parse(JSON.stringify(dataTableKeys));
            if (widgetConfig[layout]) {
                var dataTableAlign = {};
                for (var i = 0; i < widgetConfig[layout].display.options.defaultVisualOptions.length; i++) {
                    if (keys[0]) {
                        dataTableAlign[widgetConfig[layout].display.options.defaultVisualOptions[i].model] = keys[0]['uri'];
                    }
                    else {
                        dataTableAlign[widgetConfig[layout].display.options.defaultVisualOptions[i].model] = '';
                    }
                    keys.shift();
                }

                var i = _.keys(dataTableAlign).length;
                while (keys.length > 0) {
                    var additionalOption = widgetConfig[layout].display.options.getAdditionalVisualOption(i);
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
        }

        /**
         * @name getToolDirectiveElement
         * @desc returns the un-compiled html string of the selected viz's tool
         * @params layout {string} layout of selected viz
         * @returns {string} html of string
         */
        function getToolDirectiveElement(layout) {
            var html = '';
            //viz counter is used to force a redraw of the directive whenever the same one is called twice
            //it ensures that viz specific data is updated (example : customColors)
            if (widgetConfig[layout] && widgetConfig[layout].display.template) {
                html = "<div " + widgetConfig[layout].display.template.directiveTools + "></div>";
            } else {
                alertService(layout + ' does not have a tools template', 'Layout Error', 'toast-error', 5000);
            }
            return html;
        }

        /**
         * @name getVizDirectiveElement
         * @desc returns the un-compiled html string of the current viz
         * @params layout {string} layout of selected viz
         * @returns {string} html of string
         */
        function getVizDirectiveElement(layout) {
            if (layout === 'create' || layout === 'upload' || layout === 'params') {
                return '';
            }

            if (widgetConfig[layout] && widgetConfig[layout].display.template) {
                var template = widgetConfig[layout].display.template,
                    directiveFiles = template.directiveFiles,
                    directiveName = template.directiveName;

                if (directiveName === 'portrat') {
                    return "<div oc-lazy-load="
                        + JSON.stringify(directiveFiles)
                        + ">" +
                        "<portratmaster " + directiveName + " data=\"widget.widgetData.data.chartData\"" +
                        " chart-name=\"'chart-viz'\">" + "</portratmaster>"
                        + "</div>";
                }
                else if (directiveName === 'ousdmaster') {
                    return "<div oc-lazy-load="
                        + JSON.stringify(directiveFiles)
                        + ">" +
                        "<ousdmaster chart-name=\"'chart-viz'\">" + "</ousdmaster>"
                        + "</div>";
                }
                else if (directiveName === 'iatddqueuing') {
                    return "<div oc-lazy-load="
                        + JSON.stringify(directiveFiles)
                        + ">" +
                        "<iatddqueuing chart-name=\"'chart-viz'\">" + "</iatddqueuing>"
                        + "</div>";
                }

                return "<div oc-lazy-load="
                    + JSON.stringify(directiveFiles)
                    + ">"
                    + "<chart "
                    + directiveName
                    + " data=\"widget.widgetData.data.chartData\""
                    + " chart-name=\"'chart-viz'\">"
                    + "</chart>" +
                    "</div>";
            } else {
                alertService(layout + ' does not exist', 'Layout Error', 'toast-error', 5000);
            }
            return '';
        }

        /**
         * @name getColorElements
         * @desc returns elements in the data table align that have colors for a specific visual
         * @param layout
         * @param dataTableAlign
         * @param data
         * @returns [] array of color elements
         */
        function getColorElements(layout, dataTableAlign, data) {
            if (widgetConfig[layout] && typeof widgetConfig[layout].display.options.colorElements === 'function') {
                return widgetConfig[layout].display.options.colorElements(dataTableAlign, data);
            }
        }

        /**
         * @name getWidgetHandleContent
         * @param {String} handle selectedHandle
         * @desc returns the uncompiled template of the widgetHandleContent
         * @returns {String} html of widget widgetHandleContent
         */
        function getWidgetHandleContent(layout) {
            if (widgetConfig[layout]) {
                var html = "";

                //if default handle json exists, then we will load the default handle directive
                if (widgetConfig[layout].display.jsonView) {
                    html += "<div oc-lazy-load="
                        + JSON.stringify(widgetConfig['defaultHandle'].display.template.directiveFiles)
                        + ">"
                        + "<default-handle handle=\"" + layout + "\"";
                    //+ " json=" + angular.toJson(widgetConfig[layout].display.jsonView) +"";
                } else {
                    html += "<div oc-lazy-load="
                        + JSON.stringify(widgetConfig[layout].display.template.directiveFiles)
                        + ">"
                        + "<"
                        + widgetConfig[layout].display.template.directiveName;
                }
                html += ">"
                    + "</>" +
                    "</div>";

                return html;
            }

            return ''
        }

        /**
         * @name getWidgetHandleGroups
         * @desc getter for the widgetHandleGroups object
         * @returns {Object} map of the widgetGroups
         */
        function getWidgetHandleGroups() {
            return widgetHandleGroups;
        }

        /**
         * @name pinHandle
         * @param {String} layout
         * @returns {Object} widget handles for the specific layout
         */
        function pinHandle(layout) {
            if (widgetConfig[layout]) {
                widgetConfig[layout].handle.pinned = !widgetConfig[layout].handle.pinned;
            }

            //format for storage
            if (window.localStorage && window.localStorage.setItem) {
                var widgetHandleStorageSetter = {};
                for (var i in widgetConfig) {
                    widgetHandleStorageSetter[i] = widgetConfig[i].handle.pinned;
                }

                window.localStorage.setItem('widgetHandles', JSON.stringify(widgetHandleStorageSetter));
            }
        }

        /**
         * @name getJsonViewForHandle
         * @param {String} handle
         * @returns {Object} json view for the specific layout
         */
        function getJsonViewForHandle(handle) {
            if (widgetConfig[handle] && widgetConfig[handle].display) {
                return widgetConfig[handle].display.jsonView;
            }
            return false;
        }

        /**
         * @name getDefaultVizOptions
         * @desc function returns defaultVisualOptions for the selected Visualization
         * @params layout {string} layout of selected viz
         * @returns {object | Array} default Options
         */
        function getDefaultVisualOptions(layout) {
            if (widgetConfig[layout]) {
                if (widgetConfig[layout].display.options.defaultVisualOptions) {
                    return widgetConfig[layout].display.options.defaultVisualOptions;
                }
            }
            return [];
        }

        /**
         * @name addVisualOptionDimension
         * @desc function returns returns an additional visual option for the selected layout
         * @params layout {string} layout of selected viz
         * @returns {object} default Options
         */
        function addVisualOptionDimension(layout, optionLength) {
            if (widgetConfig[layout]) {
                return widgetConfig[layout].display.options.getAdditionalVisualOption(optionLength);
            }
            alertService(layout + ' does not exist', 'Layout Error', 'toast-error', 5000);
        }

        /**
         * @name getVisualizationsObj
         * @desc function returns returns all of the configs with the type 'viz'
         * @params layout {string} layout of selected viz
         * @returns {object} default Options
         */
        function getVisualizationsObj() {
            var vizObject = {};
            for (var layout in widgetConfig) {
                if (widgetConfig.hasOwnProperty(layout) && widgetConfig[layout].type === 'viz') {
                    vizObject[layout] = widgetConfig[layout];
                }
            }
            return vizObject;
        }

        function updateDefaultWidgetPkql(layout, pkql) {
            if (widgetConfig[layout] && widgetConfig[layout].display) {
                widgetConfig[layout].display.jsonView[0].pkqlCommand = pkql
            }
        }

        function getWidgetsForLayout(layout) {
            var widgetHandles = [];
            if (widgetConfig[layout]) {
                var vizHandles = widgetConfig[layout].display.options.vizHandles;
                if (vizHandles) {
                    for (var i = 0; i < vizHandles.length; i++) {
                        if (widgetConfig.hasOwnProperty(vizHandles[i])) {
                            widgetHandles.push(widgetConfig[vizHandles[i]].handle);
                        }
                    }
                }
            }

            if (window.localStorage && window.localStorage.getItem && layout !== 'create') {
                //grab all from storage
                var widgetHandleStorage = JSON.parse(window.localStorage.getItem('widgetHandles')),
                    setToStorage = false;

                if (!widgetHandleStorage) {
                    widgetHandleStorage = {};
                }

                for (var i = 0; i < widgetHandles.length; i++) {
                    if (widgetHandleStorage.hasOwnProperty(widgetHandles[i].name)) {
                        widgetHandles[i].pinned = widgetHandleStorage[widgetHandles[i].name];
                    } else {
                        //we have widget handles that are not in storage
                        //keep their default pinning from the config and add it to storage
                        setToStorage = true;
                        widgetHandleStorage[widgetHandles[i].name] = widgetHandles[i].pinned
                    }
                }

                if (setToStorage) {
                    //set to storage
                    window.localStorage.setItem('widgetHandles', JSON.stringify(widgetHandleStorage));
                }
            }

            if (layout === 'create') {
                for (var i = 0; i < vizHandles.length; i++) {
                    widgetHandles[i].pinned = true;
                }
            }


            return widgetHandles;
        }

        function getVizConfig(layout) {
            if (widgetConfig[layout]) {
                var options = widgetConfig[layout].display.options;
                //TODO determine if config should have a broader scope than only booleans
                //Only passing back booleans because the configs used are saveEnabled / pkqlEnabled currently
                var configOptions = {};
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        //broaden scope if more advanced options are used
                        if (typeof options[key] === 'boolean') {
                            configOptions[key] = options[key];
                        }
                    }
                }
                return configOptions;
            }
            alertService(layout + ' does not exist', 'Layout Error', 'toast-error', 5000);
            return false;
        }

        /**
         * @name saveAsSVG
         * @desc exports the visualization image to svg
         */
        function saveAsSVG() {
            //Original Save SVG code
            var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

            $window.URL = ($window.URL || $window.webkitURL);

            var body = document.body,
                emptySvg;

            var prefix = {
                xmlns: "http://www.w3.org/2000/xmlns/",
                xlink: "http://www.w3.org/1999/xlink",
                svg: "http://www.w3.org/2000/svg"
            };

            startSave();

            function startSave() {
                var documents = [$window.document],
                    SVGSources = [],
                    iframes = document.querySelectorAll("iframe"),
                    objects = document.querySelectorAll("object");

                // add empty svg element
                emptySvg = $window.document.createElementNS(prefix.svg, "svg");
                $window.document.body.appendChild(emptySvg);
                var emptySvgDeclarationComputed = getComputedStyle(emptySvg);

                [].forEach.call(iframes, function (el) {
                    try {
                        if (el.contentDocument) {
                            documents.push(el.contentDocument);
                        }
                    } catch (err) {
                        console.log(err);
                    }
                });

                [].forEach.call(objects, function (el) {
                    try {
                        if (el.contentDocument) {
                            documents.push(el.contentDocument);
                        }
                    } catch (err) {
                        console.log(err);
                    }
                });

                documents.forEach(function (doc) {
                    var newSources = getSources(doc, emptySvgDeclarationComputed);
                    // because of prototype on NYT pages
                    for (var i = 0; i < newSources.length; i++) {
                        SVGSources.push(newSources[i]);
                    }
                });
                if (SVGSources.length > 0) {
                    download(SVGSources[0]);
                } else {
                    alert("The Crowbar couldn't find any SVG nodes.");
                }
            }

            function getSources(doc, emptySvgDeclarationComputed) {
                var svgInfo = [],
                    svgs = d3.select("#chart-viz").select("svg")[0];
                if (!svgs[0]) {
                    alertService('No SVG Exists', 'Cannot Download SVG', 'toast-warning', 3000);
                    return;
                }
                [].forEach.call(svgs, function (svg) {

                    svg.setAttribute("version", "1.1");

                    // removing attributes so they aren't doubled up
                    svg.removeAttribute("xmlns");
                    svg.removeAttribute("xlink");

                    // These are needed for the svg
                    if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
                        svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
                    }

                    if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
                        svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
                    }

                    var source = (new XMLSerializer()).serializeToString(svg);
                    var rect = svg.getBoundingClientRect();
                    svgInfo.push({
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                        class: svg.getAttribute("class"),
                        id: svg.getAttribute("id"),
                        childElementCount: svg.childElementCount,
                        source: [doctype + source]
                    });
                });
                return svgInfo;
            }

            function download(source) {
                var url = $window.URL.createObjectURL(new Blob(source.source, {"type": "text\/xml"}));

                var a = document.createElement("a");
                body.appendChild(a);
                a.setAttribute("download", "semoss" + ".svg");
                a.setAttribute("href", url);
                a.style["display"] = "none";
                a.click();

                $timeout(function () {
                    $window.URL.revokeObjectURL(url);
                }, 10);
            }
        }

        return {
            getWidgetConfig: getWidgetConfig,
            getVizSvg: getVizSvg,
            getVizDisabledStatus: getVizDisabledStatus,
            checkDuplicateProcessing: checkDuplicateProcessing,
            getDefaultToolOptions: getDefaultToolOptions,
            generateVisualOptions: generateVisualOptions,
            getVizConfig: getVizConfig,
            getToolDirectiveElement: getToolDirectiveElement,
            getVizDirectiveElement: getVizDirectiveElement,
            getWidgetsForLayout: getWidgetsForLayout,
            getColorElements: getColorElements,
            getWidgetHandleContent: getWidgetHandleContent,
            getWidgetHandleGroups: getWidgetHandleGroups,
            pinHandle: pinHandle,
            getJsonViewForHandle: getJsonViewForHandle,
            getDefaultVisualOptions: getDefaultVisualOptions,
            addVisualOptionDimension: addVisualOptionDimension,
            getVisualizationsObj: getVisualizationsObj,
            updateDefaultWidgetPkql: updateDefaultWidgetPkql
        };

    }
})();


