(function () {
    'use strict';

    /**
     * @name widget-handle.service.js
     * @desc widget handle service is set up to configure the different handles in place for a widget.
     */
    angular.module('app.widget-handle.service', [])
        .factory('widgetHandleService', widgetHandleService);

    widgetHandleService.$inject = ['$window', '$timeout', 'dataService', 'pkqlService', 'alertService', 'monolithService', '$rootScope'];

    function widgetHandleService($window, $timeout, dataService, pkqlService, alertService, monolithService, $rootScope) {

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
            'visual': { //todo break this out as a handle
                'showInEmbed': true,
                'buttonIcon': '<i class="fa widget-button-icon-size fa-pie-chart xs-right-padding"></i>',
                'buttonText': 'Visual',
                'buttonTitle': 'Insight Visual Options',
                'buttonActions': {}
            },
            'analytics': { //todo break this out as a handle
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

        var widgetHandles = {
            // Modes ('Tools')
            'default': {
                'name': 'default',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-mouse-pointer" style="margin-left: 2px;"></i>',
                'buttonTitle': 'Default Visualization Mode',
                'buttonClass': "{'toggled-outline': widget.widgetData.mode === 'default', 'disabled': widget.widgetData.selectedHandle === 'create'}", //bad
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('default');
                    }
                },
                'pinned': true
            },
            'comment': {
                'name': 'comment',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-comment-o" style="margin-left: -2px;"></i>',
                'buttonTitle': 'Comment Visualization Mode',
                'buttonClass': "{'toggled-outline': widget.widgetData.mode === 'comment', 'disabled': widget.widgetData.selectedHandle === 'create'}", //bad
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('comment');
                    }
                },
                'pinned': false
            },
            'edit': {
                'name': 'edit',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-pencil" style="margin-left: -2px;"></i>',
                'buttonTitle': 'Edit Visualization Mode',
                'buttonClass': "{'toggled-outline': widget.widgetData.mode === 'edit', 'disabled': widget.widgetData.selectedHandle === 'create'}", //bad
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('edit');
                    }
                },
                'pinned': false
            },
            'brush': {
                'name': 'brush',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-paint-brush" style="margin-left: -2px;"></i>',
                'buttonTitle': 'Brush Visualization Mode',
                'buttonClass': "{'toggled-outline': widget.widgetData.mode === 'brush', 'disabled': widget.widgetData.selectedHandle === 'create'}", //bad
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('brush');
                    }
                },
                'pinned': false
            },
            //Tools
            'defaultHandle': {
                'name': 'defaultHandle',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-file-code-o"></i>',
                'buttonTitle': 'Custom PKQL',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'defaultHandle'}",
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('defaultHandle');
                    }
                },
                'pinned': true,
                'widgetHandleContent': 'default-handle',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            'bower_components/checklist-model/checklist-model.js'
                        ]
                    },
                    {
                        files: [
                            'custom/default-handle/default-handle.css'
                        ]
                    },
                    {
                        files: [
                            'custom/default-handle/default-handle.directive.js'
                        ]
                    }]
            },
            'visual': {
                'name': 'visual',
                'groups': ['visual'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-pie-chart" style="margin-top:4px"></i>',
                'buttonTitle': 'Change Visualization Type',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'visual', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('visual');
                    }
                },
                'pinned': true,
                'widgetHandleContent': 'visual-panel',
                'widgetHandleContentFiles': [
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
                    }]
            },
            'analytics': {
                'name': 'analytics',
                'groups': ['analytics'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-cogs" style="margin-left: -2px;"></i>',
                'buttonTitle': 'Run Analytical Routine',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'analytics', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('analytics');
                    }
                },
                'pinned': true,
                'widgetHandleContent': 'analytics-panel',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            'custom/analytics-panel/analytics-panel.css'
                        ]
                    },
                    {
                        files: [
                            'standard/services/analytics.service.js',
                            'custom/analytics-panel/analytics-panel.directive.js'
                        ]
                    }]
            },
            //Admin
            'save': {
                'name': 'save',
                'groups': ['widgetAdmin'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-floppy-o"></i>',
                'buttonTitle': 'Save Visualization',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'save','disabled': !widget.widgetData.controlsConfig.saveEnabled || widget.widgetData.selectedHandle === 'create'}", //bad
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('save');
                    }
                },
                'pinned': true,
                'widgetHandleContent': 'save-panel',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            'custom/save-panel/save-panel.css'
                        ]
                    },
                    {
                        files: [
                            'custom/save-panel/save-panel.directive.js'
                        ]
                    }]
            },
            'related': {
                'name': 'related',
                'groups': ['widgetAdmin'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-share-alt"><span class="related-badge" ng-hide="!widget.widgetData.enableRelatedInsights" ng-class="{\'relatedpulse\': widget.widgetData.relatedGlow, \'gray\': widget.widgetData.relatedInsightsCount < 1}"></span></i>',
                'buttonTitle': 'View Related Insights',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'related', 'disabled': !widget.widgetData.enableRelatedInsights || widget.widgetData.selectedHandle === 'create'}",
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('related');
                    }
                },
                'pinned': true,
                'widgetHandleContent': 'related-panel',
                'widgetHandleContentFiles': [
                    {
                        serie: true,
                        files: [
                            'bower_components/angular-bootstrap/ui-bootstrap.min.js',
                            'bower_components/ng-infinite-scroll/ng-infinite-scroll.min.js'
                        ]
                    },
                    {
                        files: [
                            'custom/related-panel/related-panel.css',
                            '../core/standard/search/search.css'
                        ]
                    },
                    {
                        files: [
                            'custom/related-panel/related-panel.directive.js'
                        ]
                    }]
            },
            'clone': {
                'name': 'clone',
                'groups': ['widgetAdmin'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-clone"></i>',
                'buttonTitle': 'Clone Visual',
                'buttonClass': "{'disabled': widget.widgetData.panelId != 0, 'disabled': widget.widgetData.selectedHandle === 'create'}", //bad
                'buttonActions': {
                    'click': function () {
                        var currentWidget = dataService.getWidgetData();
                        if (currentWidget.panelId == '0') {
                            pkqlService.generateQueryInParent('clone');
                        }
                    },
                    'mouseover': function () {
                    },
                    'mouseleave': function () {
                    }
                },
                'pinned': true
            },
            'create': {
                'name': 'create',
                'groups': ['data'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-edit" style="margin-top:4px"></i>',
                'buttonTitle': 'Edit Data',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'create'}", //bad
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('create');
                        $rootScope.$emit('create-panel-receive', 'join-queued-nodes');
                    }
                },
                'pinned': true,
                'widgetHandleContent': 'create-panel',
                'widgetHandleContentFiles': [
                    {
                        serie: true,
                        files: [
                            'bower_components/d3/d3.min.js',
                            'bower_components/d3-tip/index.js',
                            'bower_components/dagre-d3/dagre-d3.js'
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
                            'bower_components/ngHandsontable/dist/ngHandsontable.min.js'
                        ]
                    },
                    {
                        files: [
                            'bower_components/ng-infinite-scroll/ng-infinite-scroll.min.js',
                            'bower_components/checklist-model/checklist-model.js'
                        ]
                    },
                    {
                        files: [
                            'bower_components/handsontable/dist/handsontable.full.css',
                            'resources/css/dropzone.css',
                            'custom/create-panel/create-panel.css',
                            'custom/create-free-text/create-free-text.css',
                            'standard/chart/chart.css',
                            'standard/smss-grid/smss-grid.css'
                        ]
                    },
                    {
                        files: [
                            'custom/create-panel/create-panel.directive.js',
                            'custom/create-panel/create-panel.service.js',
                            'custom/create-metamodel/create-metamodel.directive.js',
                            'custom/create-free-text/create-free-text.directive.js',
                            'custom/create-raw-data/create-raw-data.directive.js',
                            'standard/chart/chart.directive.js',
                            'standard/smss-grid/smss-grid.directive.js'
                        ]
                    }]
            },
            'console': {
                'name': 'console',
                'groups': ['widgetAdmin'],
                'buttonContentLong': '<div class="full-width center"><i class="fa widget-button-icon-size fa-terminal xs-right-padding"></i></div>',
                'buttonContent': '<div class="full-width center"><i class="fa widget-button-icon-size fa-terminal xs-right-padding"></i></div>',
                'buttonTitle': 'Toggle Console',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'console'}",
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('console');
                    }
                },
                'pinned': true,
                'widgetHandleContent': 'terminal-panel',
                'widgetHandleContentFiles': [
                    {
                        serie: true,
                        files: [
                            'bower_components/codemirror/lib/codemirror.js',
                            'bower_components/codemirror/addon/hint/show-hint.js',
                            'bower_components/angular-scroll-glue/src/scrollglue.js'
                        ]
                    },
                    {
                        files: [
                            'bower_components/codemirror/lib/codemirror.css',
                            'bower_components/codemirror/addon/hint/show-hint.css'
                        ]
                    },
                    {
                        files: [
                            'custom/terminal-panel/terminal-panel.css'
                        ]
                    },
                    {
                        files: [
                            'standard/resizer/resizer.directive.js',
                            'custom/terminal-panel/terminal-panel.directive.js'
                        ]
                    }]
            },
            //Sharing
            'csv': {
                'name': 'csv',
                'groups': ['share'],
                'buttonContentLong': '<div class="full-width center"><i style="margin-top:4px" class="fa widget-button-icon-size fa-table xs-right-padding"></i></div>',
                'buttonContent': '<div class="full-width center"><i style="margin-top:4px" class="fa widget-button-icon-size fa-table xs-right-padding"></i></div>',
                'buttonTitle': 'Export To CSV',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'csv', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                'buttonActions': {
                    'click': function () {
                        exportToCSV();
                    }
                },
                'pinned': false
            },
            'svg': {
                'name': 'svg',
                'groups': ['tools'],
                'buttonContentLong': '<div class="full-width center"><i style="margin-top:4px" class="fa widget-button-icon-size fa-file-image-o xs-right-padding"></i></div>',
                'buttonContent': '<div class="full-width center"><i style="margin-top:4px" class="fa widget-button-icon-size fa-file-image-o xs-right-padding"></i></div>',
                'buttonTitle': 'Save As SVG',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'svg', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                'buttonActions': {
                    'click': function () {
                        saveAsSVG();
                    }
                },
                'pinned': false
            },
            'embed': {
                'name': 'embed',
                'groups': ['share'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-code"></i>',
                'buttonTitle': 'Embed',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'embed', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('embed');
                    }
                },
                'pinned': false,
                'widgetHandleContent': 'embed-panel',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            'custom/embed/embed.directive.js'
                        ]
                    }]
            },
            //Data
            'param': {
                'name': 'param',
                'groups': ['data'],
                //button
                'buttonContent': '<i class="fa widget-button-icon-size fa-list" style="margin-top:2px; margin-left:-1px"></i>',
                'buttonTitle': 'Show Parameters',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'param', 'disabled': !widget.widgetData.hasParams || widget.widgetData.selectedHandle === 'create'}",
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('param');
                    }
                },
                'pinned': false,
                'widgetHandleContent': 'param-overlay',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            'custom/param-overlay/param-overlay.css'
                        ]
                    },
                    {
                        files: [
                            'custom/param-overlay/param-overlay.directive.js'
                        ]
                    }]
            },
            'filter': {
                'name': 'filter',
                'groups': ['data', 'tools'],
                'buttonTitle': 'Filter Visualization',
                'buttonContent': '<i class="fa widget-button-icon-size fa-filter"></i>',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'filter', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('filter');
                    }
                },
                'pinned': false,
                'widgetHandleContent': 'filter-panel',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            'custom/filter-panel/filter-panel.css'
                        ]
                    },
                    {
                        files: [
                            'custom/filter-panel/filter-panel.directive.js'
                        ]
                    }]
            },
            //additional tools
            'additionalTools': {
                'name': 'additionalTools',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-ellipsis-h"></i>',
                'buttonTitle': 'View Additional Tools',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'additionalTools', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('additionalTools');
                    }
                },
                'pinned': false,
                'widgetHandleContent': 'tool-panel',
                'widgetHandleContentFiles': [
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
                    }]
            },
            //Viz Specific Handles
            'traverse': {
                'name': 'traverse',
                'groups': ['tools', 'data'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-link"></i>',
                'buttonTitle': 'Traverse',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'traverse', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('traverse');
                    }
                }
                ,
                'pinned': false,
                'widgetHandleContent': 'traverse-panel',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            'custom/traverse-panel/traverse-panel.css'
                        ]
                    },
                    {
                        files: [
                            'custom/traverse-panel/traverse-panel.directive.js'
                        ]
                    }]
            },
            'forceLock': {
                'name': 'forceLock',
                'groups': ['tools'],
                'buttonContent': "<i ng-class=\"{'fa-lock': !widget.widgetData.chartData.uiOptions.graphLockToggle, 'fa-unlock-alt': widget.widgetData.chartData.uiOptions.graphLockToggle}\" class='fa widget-button-icon-size'></i>",
                'buttonTitle': 'Toggle Graph Lock',
                'buttonClass': "{'toggled-outline': widget.widgetData.selectedHandle === 'forceLock', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('forceLock');

                        var currentWidget = dataService.getWidgetData();

                        if (!currentWidget.data.chartData.uiOptions) {
                            currentWidget.data.chartData.uiOptions = {};
                        }
                        currentWidget.data.chartData.uiOptions.graphLockToggle = !currentWidget.data.chartData.uiOptions.graphLockToggle;

                        //through pkql
                        // var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, currentWidget.data.chartData.uiOptions);
                        // pkqlService.executePKQL( widgetId, toolQuery);

                        //not through pkql
                        var fn = '';
                        if (currentWidget.data.chartData.uiOptions.graphLockToggle) {
                            fn = 'freezeAllNodes'
                        } else {
                            fn = 'unFreezeAllNodes'
                        }

                        var toolObjectConfig = {
                            'fn': fn,
                            'args': [],
                            'uiOptions': currentWidget.data.chartData.uiOptions
                        };
                        dataService.setUiOptions(currentWidget.data.chartData.uiOptions);
                        if (currentWidget.data.chartData.layout === 'VivaGraph') {
                            toolObjectConfig.fn = "toggleLayout";
                            toolObjectConfig.args = currentWidget.data.chartData.uiOptions.graphLockToggle;
                        }
                        dataService.runToolFunction(toolObjectConfig);
                    }
                }
                ,
                'pinned': true
            },
            'color': {
                'name': 'color',
                'groups': ['tools'],
                'buttonContent': '<div class="widget-handle-custom-img"><img ng-if="widget.widgetData.selectedHandle === \'color\'" class="full-width full-height" alt="Color Tools image" src="resources/img/painter-palette-white.png"><img ng-if="widget.widgetData.selectedHandle !== \'color\'" class="full-width full-height" alt="Color Tools image" src="resources/img/painter-palette-black.png"></div>',
                'buttonTitle': 'Color Visualization',
                'buttonClass': "{'toggled-background': widget.widgetData.selectedHandle === 'color', 'disabled': widget.widgetData.selectedHandle === 'create'}",
                'buttonActions': {
                    'click': function () {
                        dataService.toggleWidgetHandle('color');
                    }
                }
                ,
                'pinned': true,
                'widgetHandleContent': 'color-panel',
                'widgetHandleContentFiles': [
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
                    }]
            },
            'displayValues': {
                'name': 'displayValues',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-font"></i>',
                'buttonTitle': 'Display Values',
                'buttonClass': "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.displayValues}",
                'buttonActions': {
                    'click': function () {
                        var currentWidget = dataService.getWidgetData();

                        if (!currentWidget.data.chartData.uiOptions) {
                            currentWidget.data.chartData.uiOptions = {};
                        }
                        currentWidget.data.chartData.uiOptions.displayValues = !currentWidget.data.chartData.uiOptions.displayValues;

                        //through pkql
                        var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, currentWidget.data.chartData.uiOptions);
                        widgetHandles.displayValues.defaultHandleJSON[0].pkqlCommand = toolQuery;
                        dataService.toggleWidgetHandle('displayValues');
                    }
                },
                'pinned': false,
                'widgetHandleContent': '',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            //'custom/tools/display-values/display-values.directive.js'
                        ]
                    }],
                'defaultHandleJSON':[
                    {
                        "title": "Display Values",
                        "Description": "Displays the values on a visualization",
                        "pkqlCommand": "",
                        "input": {}
                    }
                ]
            },
            'zToggle': {
                'name': 'zToggle',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-check"></i>',
                'buttonTitle': 'Toggle Z-Index',
                'buttonClass': "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.toggleZ}",
                'buttonActions': {
                    'click': function () {
                        var currentWidget = dataService.getWidgetData();

                        if (!currentWidget.data.chartData.uiOptions) {
                            currentWidget.data.chartData.uiOptions = {};
                        }
                        currentWidget.data.chartData.uiOptions.toggleZ = !currentWidget.data.chartData.uiOptions.toggleZ;

                        //through pkql
                        var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, currentWidget.data.chartData.uiOptions);
                        widgetHandles.zToggle.defaultHandleJSON[0].pkqlCommand = toolQuery;
                        dataService.toggleWidgetHandle('zToggle');
                    }
                },
                'pinned': false,
                'widgetHandleContent': '',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            //'custom/tools/display-values/display-values.directive.js'
                        ]
                    }],
                'defaultHandleJSON':[
                    {
                        "title": "Toggle Z-Index",
                        "Description": "Toggles off/on the z-axis",
                        "pkqlCommand": "",
                        "input": {}
                    }
                ]
            },
            'lineToggle': {
                'name': 'lineToggle',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-eraser"></i>',
                'buttonTitle': 'Toggle Quadrants',
                'buttonClass': "{'toggled-outline': !widget.widgetData.data.chartData.uiOptions.lineGuide}",
                'buttonActions': {
                    'click': function () {
                        var currentWidget = dataService.getWidgetData();

                        if (!currentWidget.data.chartData.uiOptions) {
                            currentWidget.data.chartData.uiOptions = {};
                        }
                        currentWidget.data.chartData.uiOptions.lineGuide = !currentWidget.data.chartData.uiOptions.lineGuide;

                        //through pkql
                        var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, currentWidget.data.chartData.uiOptions);
                        widgetHandles.lineToggle.defaultHandleJSON[0].pkqlCommand = toolQuery;
                        dataService.toggleWidgetHandle('lineToggle');
                    }
                },
                'pinned': false,
                'widgetHandleContent': '',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            //'custom/tools/display-values/display-values.directive.js'
                        ]
                    }],
                'defaultHandleJSON':[
                    {
                        "title": "Toggle Quadrants",
                        "Description": "Toggles the line guide on and off",
                        "pkqlCommand": "",
                        "input": {}
                    }
                ]
            },
            'xReversed': {
                'name': 'xReversed',
                'groups': ['tools'],
                'buttonContent': '<i class="fa fa-arrows-h" aria-hidden="true"></i>', //add awesome font here
                'buttonTitle': 'Reverse X Axis',
                'buttonClass': "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.xReversed}",
                'buttonActions': {
                    'click': function () {
                        var currentWidget = dataService.getWidgetData();

                        if (!currentWidget.data.chartData.uiOptions) {
                            currentWidget.data.chartData.uiOptions = {};
                        }
                        currentWidget.data.chartData.uiOptions.xReversed = !currentWidget.data.chartData.uiOptions.xReversed;

                        //through pkql
                        var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, currentWidget.data.chartData.uiOptions);
                        widgetHandles.xReversed.defaultHandleJSON[0].pkqlCommand = toolQuery;
                        dataService.toggleWidgetHandle('xReversed');
                    }
                },
                'pinned': false,
                'widgetHandleContent': '',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            //files go here
                        ]
                    }],
                'defaultHandleJSON':[
                    {
                        "title": "X Axis Reverse",
                        "Description": "Displays the X Axis values in reverse order",
                        "pkqlCommand": "",
                        "input": {}
                    }
                ]
            },
            'yReversed': {
                'name': 'yReversed',
                'groups': ['tools'],
                'buttonContent': '<i class="fa fa-arrows-v" aria-hidden="true"></i>', //add awesome font here
                'buttonTitle': 'Reverse Y Axis',
                'buttonClass': "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.yReversed}",
                'buttonActions': {
                    'click': function () {
                        var currentWidget = dataService.getWidgetData();

                        if (!currentWidget.data.chartData.uiOptions) {
                            currentWidget.data.chartData.uiOptions = {};
                        }
                        currentWidget.data.chartData.uiOptions.yReversed = !currentWidget.data.chartData.uiOptions.yReversed;

                        //through pkql
                        var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, currentWidget.data.chartData.uiOptions);
                        widgetHandles.yReversed.defaultHandleJSON[0].pkqlCommand = toolQuery;
                        dataService.toggleWidgetHandle('yReversed');
                    }
                },
                'pinned': false,
                'widgetHandleContent': '',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            //files go here
                        ]
                    }],
                'defaultHandleJSON':[
                    {
                        "title": "Y Axis Reverse",
                        "Description": "Displays the Y Axis values in reverse order",
                        "pkqlCommand": "",
                        "input": {}
                    }
                ]
            },
            'stackData': {
                'name': 'stackData',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-stack-overflow"></i>',
                'buttonTitle': 'Stack Data',
                'buttonClass': "{'toggled-outline': !widget.widgetData.data.chartData.uiOptions.stackToggle}",
                'buttonActions': {
                    'click': function () {
                        var currentWidget = dataService.getWidgetData();

                        if (!currentWidget.data.chartData.uiOptions) {
                            currentWidget.data.chartData.uiOptions = {};
                        }

                        currentWidget.data.chartData.uiOptions.stackToggle = !currentWidget.data.chartData.uiOptions.stackToggle;

                        //through pkql
                        var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, currentWidget.data.chartData.uiOptions);
                        widgetHandles.stackData.defaultHandleJSON[0].pkqlCommand = toolQuery;
                        dataService.toggleWidgetHandle('stackData');
                    }
                },
                'pinned': false,
                'widgetHandleContent': '',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            //'custom/tools/display-values/display-values.directive.js'
                        ]
                    }],
                'defaultHandleJSON': [
                    {
                        "title": "Stack Data",
                        "Description": "Stacks data series on the visualization",
                        "pkqlCommand": "",
                        "input": {}

                    }
                ]
            },
            'sortValues':{
                'name': 'sortValues',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-sort-amount-asc"></i>',
                'buttonTitle': 'Sort Values',
                'buttonClass': "{'toggled-outline': false}",
                'buttonActions': {
                    'click': function () {
                        var currentWidget = dataService.getWidgetData();

                        if (!currentWidget.data.chartData.uiOptions) {
                            currentWidget.data.chartData.uiOptions = {};
                        }
                        //through pkql
                        var pkqlVars = {sortLabel: 'sortLabel', sortType: 'sortType'};
                        var defaultHandlePKQL = pkqlService.generatePKQLwithVars(currentWidget.panelId, currentWidget.data.chartData.uiOptions, pkqlVars);

                       //Get visual options and set them in defaultHandleJSON
                        var headers = currentWidget.data.chartData.headers.map(function(a){return a.title});

                        widgetHandles.sortValues.defaultHandleJSON[0].input.sortLabel.options = headers;
                        widgetHandles.sortValues.defaultHandleJSON[0].pkqlCommand = defaultHandlePKQL;
                        dataService.toggleWidgetHandle('sortValues');
                    }
                },
                'pinned': false,
                'widgetHandleContent': '',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            //Add files here
                        ]
                    }],
                'defaultHandleJSON':[
                    {
                        "Title": "Sort Values",
                        "Description": "Sorts the values of a visualization in either ascending or descending order",
                        "pkqlCommand": "",
                        "input": {
                            "sortLabel": {
                                "name": "sortLabel",
                                "type": "dropdown",
                                "required": true,
                                "label": "Choose an option to sort on: ",
                                "optionsGetter": {},
                                "options": [],
                                "value": "",
                                "attribute": {}
                            },
                            "sortType": {
                                "name": "sortType",
                                "type": "buttonGroup",
                                "required": true,
                                "label": "Choose a sort type:",
                                "optionsGetter": {},
                                "options": ["sortAscending", "sortDescending"],
                                "value": "",
                                "attribute": {"buttonGroupAttr": "style='display: block'", "buttonAttr": "ng-class=\"{'fa fa-sort-amount-asc': button === 'sortAscending', 'fa fa-sort-amount-desc': button === 'sortDescending'}\" class='btn-light btn-half'"}
                            }
                        }
                    }
                ]
            },
            'flipSeries': {
                'name': 'flipSeries',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-random"></i>',
                'buttonTitle': 'Flip Series',
                'buttonClass': "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.seriesFlipped}",
                'buttonActions': {
                    'click': function () {
                        var currentWidget = dataService.getWidgetData();

                        if (!currentWidget.data.chartData.uiOptions) {
                            currentWidget.data.chartData.uiOptions = {};
                        }
                        currentWidget.data.chartData.uiOptions.seriesFlipped = !currentWidget.data.chartData.uiOptions.seriesFlipped;

                        //through pkql
                        var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, currentWidget.data.chartData.uiOptions);
                        widgetHandles.flipSeries.defaultHandleJSON[0].pkqlCommand = toolQuery;
                        dataService.toggleWidgetHandle('flipSeries');
                    }
                },
                'pinned': false,
                'widgetHandleContent': '',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            //'custom/tools/display-values/display-values.directive.js'
                        ]
                    }],
                'defaultHandleJSON':[
                    {
                        "title": "Flip Series",
                        "Description": "Flips the series on the visualization",
                        "pkqlCommand": "",
                        "input": {}
                    }
                ]
            },
            'flipAxis': {
                'name': 'flipAxis',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-random"></i>',
                'buttonTitle': 'Flip Axis',
                'buttonClass': "{'toggled-outline': widget.widgetData.data.chartData.uiOptions.rotateAxis}",
                'buttonActions': {
                    'click': function () {
                        var currentWidget = dataService.getWidgetData();

                        if (!currentWidget.data.chartData.uiOptions) {
                            currentWidget.data.chartData.uiOptions = {};
                        }
                        currentWidget.data.chartData.uiOptions.rotateAxis = !currentWidget.data.chartData.uiOptions.rotateAxis;

                        //through pkql
                        var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, currentWidget.data.chartData.uiOptions);
                        widgetHandles.flipAxis.defaultHandleJSON[0].pkqlCommand = toolQuery;
                        dataService.toggleWidgetHandle('flipAxis');
                    }
                },
                'pinned': false,
                'widgetHandleContent': '',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            //'custom/tools/display-values/display-values.directive.js'
                        ]
                    }],
                'defaultHandleJSON':[
                    {
                        "title": "Flip Axis",
                        "Description": "Flips the axis on the visualization",
                        "pkqlCommand": "",
                        "input": {}
                    }
                ]
            },
            'numberOfBuckets': {
                'name': 'numberOfBuckets',
                'groups': ['tools'],
                'buttonContent': '<i class="fa widget-button-icon-size fa-hashtag"></i>',
                'buttonTitle': 'Number of Buckets',
                'buttonClass': "{'toggled-outline': false}",
                'buttonActions': {
                    'click': function () {
                        var currentWidget = dataService.getWidgetData();

                        if (!currentWidget.data.chartData.uiOptions) {
                            currentWidget.data.chartData.uiOptions = {};
                        }
                        currentWidget.data.chartData.uiOptions.rotateAxis = !currentWidget.data.chartData.uiOptions.rotateAxis;

                        //through pkql
                        var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, currentWidget.data.chartData.uiOptions);
                        widgetHandles.flipAxis.defaultHandleJSON[0].pkqlCommand = toolQuery;
                        dataService.toggleWidgetHandle('numberOfBuckets');
                    }
                },
                'pinned': false,
                'widgetHandleContent': '',
                'widgetHandleContentFiles': [
                    {
                        files: [
                            'bower_components/angular-bootstrap-slider/slider.js',
                            'bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.min.js',
                            'bower_components/seiyria-bootstrap-slider/dist/css/bootstrap-slider.min.css'
                        ]
                    }],
                'defaultHandleJSON':[
                    {
                        "title": "Number of Buckets",
                        "Description": "Buckets the values into groups",
                        "pkqlCommand": "",
                        "input": {
                            "sortType": {
                                "name": "buckets",
                                "type": "slider",
                                "required": true,
                                "label": "Select the number of buckets:",
                                "optionsGetter": {},
                                "options": [0, 10],
                                "value": "",
                                "attribute": {"buttonGroupAttr": "style='display: block'", "buttonAttr": "ng-class=\"{'fa fa-sort-amount-asc': button === 'sortAscending', 'fa fa-sort-amount-desc': button === 'sortDescending'}\" class='btn-light btn-half'"}
                            }
                        }
                    }
                ]
            },

        };

        /**
         * @name getWidgetHandles
         * @desc returns a map of the widgetHandles
         * @returns {Object} map of the widgetHandles
         * @todo remove dependence on copy..doing this in case we want to show/hide for given insight
         */
        function getWidgetHandles() {
            var widgetHandleStorageGetter = {};
            if (window.localStorage && window.localStorage.getItem) {
                widgetHandleStorageGetter = JSON.parse(window.localStorage.getItem('widgetHandles'));
            }

            //deep clone because json parse and stringify did not work (functions)
            var widgetHandleArray = [];
            for (var i in widgetHandles) {
                var copiedHandle = {};
                for (var item in widgetHandles[i]) {
                    copiedHandle[item] = widgetHandles[i][item]
                }

                if (widgetHandleStorageGetter && widgetHandleStorageGetter.hasOwnProperty(i)) {
                    copiedHandle.pinned = widgetHandleStorageGetter[i]
                    widgetHandles[i].pinned = widgetHandleStorageGetter[i]
                }

                widgetHandleArray.push(copiedHandle);
            }

            //formate for storage  var widgetHandleStorageGetter = {};
            if (window.localStorage && window.localStorage.setItem) {
                var widgetHandleStorageSetter = {};
                for (var i = 0; i < widgetHandleArray.length; i++) {
                    widgetHandleStorageSetter[widgetHandleArray[i].name] = widgetHandleArray[i].pinned
                }

                window.localStorage.setItem('widgetHandles', JSON.stringify(widgetHandleStorageSetter));

            }


            return widgetHandleArray;
        }

        /**
         * @name getWidgetHandleGroups
         * @desc getter for the widgetHandleGroups object
         * @returns {Object} map of the widgetGroups
         */
        function getWidgetHandleGroups() {
            return JSON.parse(JSON.stringify(widgetHandleGroups));
        }


        /**
         * @name getWidgetHandleContent
         * @param {String} handle selectedHandle
         * @desc returns the uncompiled template of the widgetHandleContent
         * @returns {String} html of widget widgetHandleContent
         */
        function getWidgetHandleContent(handle) {
            if (widgetHandles[handle]) {
                var html = "";

                //if default handle json exists, then we will load the default handle directive
                if(widgetHandles[handle].defaultHandleJSON) {
                    html += "<div oc-lazy-load="
                    + JSON.stringify(widgetHandles['defaultHandle'].widgetHandleContentFiles)
                    + ">"
                    + "<default-handle handle=\"" + handle + "\"";
                    //+ " json=" + angular.toJson(widgetHandles[handle].defaultHandleJSON) +"";
                } else {
                    html += "<div oc-lazy-load="
                    + JSON.stringify(widgetHandles[handle].widgetHandleContentFiles)
                    + ">"
                    + "<"
                    + widgetHandles[handle].widgetHandleContent;
                }
                    html += ">"
                    + "</>" +
                    "</div>";

                return html;
            }
            
            return ''
        }

        /**
         * @name pinHandle
         * @param {String} handleName
         * @returns {Object} widget handles for the specific layout
         */
        function pinHandle(handleName) {
            if (widgetHandles[handleName]) {
                widgetHandles[handleName].pinned = !widgetHandles[handleName].pinned;
            }

            //format for storage
            if (window.localStorage && window.localStorage.setItem) {
                var widgetHandleStorageSetter = {};
                for (var i in widgetHandles) {
                    widgetHandleStorageSetter[i] = widgetHandles[i].pinned
                }

                window.localStorage.setItem('widgetHandles', JSON.stringify(widgetHandleStorageSetter));
            }
        }

        /*** Handle Functions **/
        /**
         * @name exportToCSV
         * @desc exports the data backing a visualization to a csv file
         */
        function exportToCSV() {
            var tableData = dataService.getWidgetData();
            if (!_.isEmpty(tableData) && !_.isEmpty(tableData.insightId)) {
                monolithService.getTable(tableData.insightId).then(function (tableData) {
                    if (tableData.filteredData) {
                        console.log(tableData.filteredData);

                        var unparsedData = '', csvData;
                        //add in headers
                        for (var i = 0; i < tableData.headers.length; i++) {
                            var header = tableData.headers[i].filteredTitle;
                            if (typeof header === 'string' && header.indexOf(',')) {
                                header = '"' + header + '"'
                            }

                            unparsedData += (header + ',')
                        }
                        unparsedData += '\r\n';


                        //add in rows
                        for (var i = 0; i < tableData.filteredData.length; i++) {
                            for (var j = 0; j < tableData.headers.length; j++) {
                                var data = tableData.filteredData[i][tableData.headers[j].filteredTitle];
                                if (typeof data === 'string' && data.indexOf(',')) {
                                    data = '"' + data + '"'
                                }
                                unparsedData += (data + ',')
                            }
                            unparsedData += '\r\n';
                        }

                        //create blob
                        csvData = new Blob([unparsedData], {type: 'text/csv;charset=utf-8;'});

                        //export for download
                        //IE11 & Edge
                        if (navigator.msSaveBlob) {
                            navigator.msSaveBlob(csvData, 'tableData.csv');
                        } else {
                            //In FF link must be added to DOM to be clicked
                            var link = document.createElement('a');
                            link.href = window.URL.createObjectURL(csvData);
                            link.setAttribute('download', 'tableData.csv');
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    } else {
                        alertService('No Filtered Data', 'Warning', 'toast-warning', 3000);
                    }
                }, function (error) {
                    alertService('Unable to get table data for old graph', 'Warning', 'toast-warning', 3000);
                });
            }
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
            getWidgetHandles: getWidgetHandles,
            getWidgetHandleGroups: getWidgetHandleGroups,
            getWidgetHandleContent: getWidgetHandleContent,
            pinHandle: pinHandle
        };
    }
})();
