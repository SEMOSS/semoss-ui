(function () {
    'use strict';

    /**
     * @name chart
     * @desc serves as API for all visualizations within SEMOSS
     */
    angular.module('app.chart.directive', [])
        .directive('chart', chart);

    chart.$inject = ['$rootScope', 'widgetConfigService', 'utilityService', 'dataService', 'pkqlService', '$filter'];

    function chart($rootScope, widgetConfigService, utilityService, dataService, pkqlService, $filter) {

        chartCtrl.$inject = ['$scope'];
        chartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

        return {
            restrict: 'E',
            controller: chartCtrl,
            link: chartLink,
            bindToController: {
                data: "=",
                chartName: "="
            },
            scope: {},
            controllerAs: 'chart',
            priority: 500
        };

        function chartCtrl($scope) {
            var chart = this;

            chart.container = {width: 0, height: 0};
            chart.margin = {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            };
            chart.container = {
                width: 0,
                height: 0
            };

            //Functions
            chart.dataProcessor = dataProcessor;
            chart.toolUpdateProcessor = toolUpdateProcessor;
            //Resizing
            chart.containerSize = containerSize;
            chart.resizeViz = resizeViz;
            //Modes
            chart.switchMode = switchMode;
            chart.toggleDefaultMode = toggleDefaultMode;
            chart.toggleEditMode = toggleEditMode;
            chart.toggleBrushMode = toggleBrushMode;
            chart.toggleCommentMode = toggleCommentMode;
            chart.initializeCommentMode = initializeCommentMode;
            chart.initializeEditMode = initializeEditMode;
            chart.initializeBrushMode = initializeBrushMode;
            chart.initializeModes = initializeModes;
            chart.updateOptions = updateOptions;
            chart.disableMode = disableMode;
            chart.filterOnBrushMode = filterOnBrushMode;

            /**
             * @name dataProcessor
             * @desc Processes data into correct format, allowing it to be rendered on a visualization
             */
            function dataProcessor() {
            }

            /**
             * @name toolUpdateProcessor
             * @desc Processes changes from the tool panel
             */
            function toolUpdateProcessor() {
            }

            /**
             * @name containerSize
             * @param {object} containerObj - this object holds the height and width information for the given container
             * @param {object} marginObj - this object holds all information regarding margins for the directive
             * @desc Calculates the container size that the chart directive is located inside
             */
            function containerSize(containerObj, marginObj) {
                containerObj.width = parseInt(d3.select("#" + chart.chartName + "-append-viz").style("width"));
                containerObj.height = parseInt(d3.select("#" + chart.chartName + "-append-viz").style("height"));

                containerObj.width = containerObj.width - marginObj.left - marginObj.right;
                containerObj.height = containerObj.height - marginObj.top - marginObj.bottom;
            }

            /**
             * @name resizeViz
             * @desc triggered whenever chart resizes
             */
            function resizeViz() {
            }

            /**
             * @name switchMode
             * @desc switches the mode for a given chart
             * @todo refactor out the chart toolbar object
             */
            function switchMode(mode) {
                if (chart.toolbar) {
                    chart.toolbar.highlightSelectedMode(mode);
                } else {
                    switch (mode) {
                        case "default":
                            chart.toggleBrushMode(false);
                            chart.toggleCommentMode(false);
                            chart.toggleEditMode(false);
                            chart.toggleDefaultMode(true);
                            break;
                        case "edit":
                            chart.toggleDefaultMode(false);
                            chart.toggleBrushMode(false);
                            chart.toggleCommentMode(false);
                            chart.toggleEditMode(true);
                            break;
                        case "comment":
                            chart.toggleDefaultMode(false);
                            chart.toggleBrushMode(false);
                            chart.toggleEditMode(false);
                            chart.toggleCommentMode(true);
                            break;
                        case "brush":
                            chart.toggleDefaultMode(false);
                            chart.toggleCommentMode(false);
                            chart.toggleEditMode(false);
                            chart.toggleBrushMode(true);
                            break;
                    }
                }
            }

            /**
             * @name toggleDefaultMode
             * @param {Boolean} [toggle] [toggles default mode on or off]
             * @desc toggles default viz mode
             */
            function toggleDefaultMode(toggle) {
            }

            /**
             * @name toggleEditMode
             * @param {Boolean} [toggle] [toggles edit mode on or off]
             * @desc toggles edit mode
             */
            function toggleEditMode(toggle) {
            }

            /**
             * @name toggleBrushMode
             * @param {Boolean} [toggle] [toggles brush mode on or off]
             * @desc toggles brush mode
             */
            function toggleBrushMode(toggle) {
            }

            /**
             * @name toggleCommentMode
             * @param {Boolean} [toggle] [toggles comment mode on or off]
             * @desc toggles comment mode
             */
            function toggleCommentMode(toggle) {
            }

            /**
             * @name initializeDataCommentMode
             * @desc function for adding comments on specific data points in the visualization
             * @todo think through this...
             */
            function initializeDataCommentMode() {
            }

            /**
             * @name initializeBrushMode
             * @desc function that initializes brush mode
             */
            function initializeBrushMode() {
            }

            /**
             * @name initializeCommentMode
             * @param {Object} comments contains all the comments for a viz
             * @desc function that initializes comment mode
             */
            function initializeCommentMode(comments) {
            }

            /**
             * @name initializeEditMode
             * @param {Object} lookandfeel describes the look and feel of the viz
             * @desc function that initializes comment mode
             */
            function initializeEditMode(lookandfeel) {
            }

            /**
             * @name initializeModes
             * @desc function that initializes and creates the chart toolbar
             * @todo refactor this out
             */
            function initializeModes(comments, lookandfeel) {
            }

            /**
             * @name updateOptions
             * @param {Object} chartOptions options for the chart
             * @desc Processes changes from the tool panel
             */
            function updateOptions(chartOptions) {
                var currentWidget = dataService.getWidgetData();
                var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, chartOptions);
                pkqlService.executePKQL(currentWidget.insightId, toolQuery);
            }

            /**
             * @name updateOptions
             * @param {Array} arrayToDisable list of strings - the modes to disable
             * @desc disables modes on a chart
             */
            function disableMode(arrayToDisable) {
                for (var i = 0; i < arrayToDisable.length; i++) {
                    if (arrayToDisable[i] === 'comment' && chart.commentMode) {
                        chart.commentMode.disabled = true;
                    }
                    if (arrayToDisable[i] === 'edit' && chart.editMode) {
                        chart.editMode.disabled = true;
                    }
                    if (arrayToDisable[i] === 'brush' && chart.brushMode) {
                        chart.brushMode.disabled = true;
                    }
                }
            }

            /**
             * @name filterOnBrushMode
             * @param {Object} data [data for filtering]
             * @param resetBool - if true viz should be reset to no params
             * @desc calls dataService to filter on brush
             */
            function filterOnBrushMode(data, resetBool) {
                var keys = Object.keys(data);
                var filterPKQL = "";

                if (keys.length === 0) {
                    //unfilter all columns
                    for (var i = 0; i < chart.data.headers.length; i++) {
                        var filterOptions = {};
                        var label = $filter('replaceSpaces')(chart.data.headers[i].title);
                        filterOptions[label] = {
                            "selectAll": resetBool,
                            "inputSearch": "",
                            "isFiltered": false,
                            "isCollapsed": true,
                            "isDisabled": false,
                            "list": []
                        };
                        filterPKQL += pkqlService.generateFilterQuery(filterOptions, label);
                    }
                } else {
                    for (var i = 0; i < keys.length; i++) {
                        var filterOptions = {};
                        var label = $filter('replaceSpaces')(keys[i]);
                        filterOptions[label] = {
                            "selectAll": resetBool,
                            "inputSearch": "",
                            "isFiltered": false,
                            "isCollapsed": true,
                            "isDisabled": false,
                            "list": []
                        };

                        var fData = data[keys[i]];
                        for (var j = 0; j < fData.length; j++) {
                            filterOptions[label].list.push({
                                value: $filter('replaceSpaces')(fData[j]),
                                selected: true
                            });
                        }
                        filterPKQL += pkqlService.generateFilterQuery(filterOptions, label);
                    }
                }

                var currentWidget = dataService.getWidgetData();
                pkqlService.executePKQL(currentWidget.insightId, filterPKQL);
            }

        }

        function chartLink(scope, ele, attrs, ctrl) {
            var fromPainter;

            //listeners
            var chartUpdateListener = $rootScope.$on('update-visualization', function (event, data) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'update-visualization', data);
                dataChange();
            });

            var chartSelectedNodeListner = $rootScope.$on('data-selected', function (event, data) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'data-selected', data);
                fromPainter(data.selectedItem);
            });

            var chartListener = $rootScope.$on('chart-receive', function (event, message, data) {
                if (message === 'run-tool-function') {
                    console.log('%cPUBSUB:', "color:blue", message, data);
                    toolUpdate(data);
                } else if (message === 'sheet-resize-viz') {
                    console.log('%cPUBSUB:', "color:blue", message);
                    console.log('Remove Sheet resize / widget is already reloaded');
                    scope.chart.resizeViz();
                } else if (message === 'sheet-graph-traverse') {
                    console.log('%cPUBSUB:', "color:blue", message, data);
                    if (scope.chart.vizInput) {
                        scope.chart.vizInput.updateType = data.updateType;
                    }
                    scope.chart.initializeModes();
                    scope.chart.dataProcessor(data.newData, data.oldData);
                } else if (message === 'change-chart-mode') {
                    scope.chart.switchMode(data.mode);
                }
            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying chart....');
                chartUpdateListener();
                chartSelectedNodeListner();
                chartListener();
            });

            /**
             * @name dataChange
             * @desc Function triggered when the visualization data has changed and we need to update
             */
            function dataChange() {
                var widgetData = dataService.getWidgetData();
                var chartData = widgetData.data;

                //TODO REMOVE - oNLY FOR GANTT
                if (chartData && chartData.panelConfig && chartData.panelConfig.size) {
                    chartData.chartData.panelSize = chartData.panelConfig.size;
                }

                scope.chart.initializeModes(chartData.comments, chartData.lookandfeel);

                if (widgetConfigService.checkDuplicateProcessing(chartData.chartData.layout)) {
                    //cleaning the data to check for duplicates
                    var cleanedNewData = JSON.parse(JSON.stringify(chartData.chartData)); //TODO: when newData.data is large (newData.data.length > 1000), significant performance hit
                    cleanedNewData.data = utilityService.removeDuplicateData(cleanedNewData);
                    if (cleanedNewData.filteredData && cleanedNewData.data.length !== cleanedNewData.filteredData.length) {
                        cleanedNewData.filteredData = utilityService.filterTableUriData(cleanedNewData.data);
                    }
                    sendToDataProcessor(cleanedNewData);
                } else {
                    sendToDataProcessor(chartData.chartData);
                }
            }

            /**
             * @name sendToDataProcessor
             * @desc Function triggered when the visualization data is ready to be sent to the data processor
             */
            function sendToDataProcessor(data) {
                if (_.isEmpty(data.uiOptions)) {
                    data.uiOptions = widgetConfigService.getDefaultToolOptions(data.layout);
                    dataService.setUiOptions(data.uiOptions);
                }
                scope.chart.dataProcessor(data);
            }

            /**
             * @name toolUpdate
             * @param {object} data - config object for the tool function
             * @desc Function triggered when the visualization tools have changed, and the viz needs to be updated
             */
            function toolUpdate(data) {
                scope.chart.toolUpdateProcessor(data);
            }

            fromPainter = scope.chart.highlightSelectedItem;

            /**
             * @name highlightSelectedItem
             * @param {object} selectedItem
             * @desc Controls functionality for when a data point on a graph is double clicked. triggers highlighting of item & related insights call
             * @TODO rename this function - onDataPointClicked
             */
            scope.chart.highlightSelectedItem = function (selectedItem) {
                if (selectedItem) {
                    dataService.dataPointSelected(selectedItem);
                }
            };

            //on initialization
            dataChange();
        }
    }
})();