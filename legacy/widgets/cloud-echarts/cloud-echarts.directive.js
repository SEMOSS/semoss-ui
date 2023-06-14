'use strict';

import * as echarts from 'echarts';
import '@/widget-resources/js/echarts/wordcloud/echarts-wordcloud.min.js';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';

import './cloud-echarts.service.js';

export default angular
    .module('app.cloud-echarts.directive', ['app.cloud.service'])
    .directive('cloudEcharts', cloudEcharts);

cloudEcharts.$inject = ['VIZ_COLORS', 'cloudService'];

function cloudEcharts(VIZ_COLORS, cloudService) {
    cloudChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: cloudChartLink,
    };

    function cloudChartLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];

        /** ************* Main Event Listeners ************************/
        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            /** *************** ECharts ****************************/
            eChartsConfig,
            cloudChart,
            destroyListeners;

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
            modeListener = scope.widgetCtrl.on('update-mode', toggleMode);

            // cleanup
            scope.$on('$destroy', destroy);

            setData();
        }

        /**
         * @name setData
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var layerIndex = 0,
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                ),
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                uiOptions;

            uiOptions = angular.extend(sharedTools, individualTools);
            uiOptions.colorByValue = colorBy;

            eChartsConfig = cloudService.getConfig(
                'wordCloud',
                data,
                uiOptions,
                keys
            );
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            eChartsConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            paint();
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (cloudChart) {
                cloudChart.clear();
                cloudChart.dispose();
            }

            cloudChart = echarts.init(ele[0].firstElementChild);

            var option = {
                tooltip: {
                    show: eChartsConfig.options.showTooltips,
                    formatter: function (info) {
                        var returnArray = [],
                            k,
                            i,
                            formatType,
                            formatDimension,
                            tooltipType,
                            j;

                        // get primary db format type
                        for (k = 0; k < eChartsConfig.keys.length; k++) {
                            if (
                                eChartsConfig.keys[k].alias === info.seriesName
                            ) {
                                formatType =
                                    visualizationUniversal.mapFormatOpts(
                                        eChartsConfig.keys[k]
                                    );
                            }
                        }

                        // if user has updated formatting rules in widget, override db format types
                        if (eChartsConfig.options.formatDataValues) {
                            for (
                                i = 0;
                                i <
                                eChartsConfig.options.formatDataValues.formats
                                    .length;
                                i++
                            ) {
                                formatDimension =
                                    eChartsConfig.options.formatDataValues
                                        .formats[i].dimension;
                                if (formatDimension === info.seriesName) {
                                    formatType =
                                        eChartsConfig.options.formatDataValues
                                            .formats[i];
                                }
                            }
                        }

                        if (info.marker) {
                            returnArray.push(info.marker);
                        }

                        if (info.name) {
                            returnArray.push(
                                '<b>' + cleanValue(info.name) + '</b>' + '<br>'
                            );
                        }

                        if (info.seriesName) {
                            returnArray.push(
                                '' +
                                    cleanValue(info.seriesName) +
                                    ': ' +
                                    visualizationUniversal.formatValue(
                                        info.value,
                                        formatType
                                    ) +
                                    '<br>'
                            );
                        }

                        if (info.data.tooltip) {
                            for (j = 0; j < info.data.tooltip.length; j++) {
                                // get primary db format type
                                for (
                                    k = 0;
                                    k < eChartsConfig.keys.length;
                                    k++
                                ) {
                                    if (
                                        eChartsConfig.keys[k].alias ===
                                        info.data.tooltip[j].header
                                    ) {
                                        tooltipType =
                                            visualizationUniversal.mapFormatOpts(
                                                eChartsConfig.keys[k]
                                            );
                                    }
                                }
                                // if user has updated formatting rules in widget, override db format types
                                if (eChartsConfig.options.formatDataValues) {
                                    for (
                                        i = 0;
                                        i <
                                        eChartsConfig.options.formatDataValues
                                            .formats.length;
                                        i++
                                    ) {
                                        formatDimension =
                                            eChartsConfig.options
                                                .formatDataValues.formats[i]
                                                .dimension;
                                        if (
                                            formatDimension ===
                                            info.data.tooltip[j].header
                                        ) {
                                            tooltipType =
                                                eChartsConfig.options
                                                    .formatDataValues.formats[
                                                    i
                                                ];
                                        }
                                    }
                                }
                                if (
                                    eChartsConfig.legendHeaders.indexOf(
                                        info.data.tooltip[j].header
                                    ) === -1
                                ) {
                                    returnArray.push(
                                        '' +
                                            cleanValue(
                                                info.data.tooltip[j].header
                                            ) +
                                            ': ' +
                                            visualizationUniversal.formatValue(
                                                info.data.tooltip[j].value || 0,
                                                tooltipType
                                            ) +
                                            '<br>'
                                    );
                                }
                            }
                        }
                        return returnArray.join('');
                    },
                    confine: true,
                    backgroundColor:
                        eChartsConfig.options.tooltip.backgroundColor ||
                        '#FFFFFF',
                    borderWidth:
                        parseFloat(eChartsConfig.options.tooltip.borderWidth) ||
                        0,
                    borderColor:
                        eChartsConfig.options.tooltip.borderColor || '',
                    textStyle: {
                        color:
                            eChartsConfig.options.tooltip.fontColor ||
                            '#000000',
                        fontFamily:
                            eChartsConfig.options.tooltip.fontFamily || 'Inter',
                        fontSize:
                            parseFloat(
                                eChartsConfig.options.tooltip.fontSize
                            ) || 12,
                    },
                },
                series: eChartsConfig.data,
            };

            if (eChartsConfig.backgroundColorStyle) {
                option.backgroundColor = eChartsConfig.backgroundColorStyle;
            }
            option.textStyle = {
                fontFamily: 'Inter',
            };
            // use configuration item and data specified to show chart
            EchartsHelper.setOption(cloudChart, option);

            // Add event listeners
            initializeEvents();
        }

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
         * @returns {void}
         */
        function initializeEvents() {
            if (typeof destroyListeners === 'function') {
                destroyListeners();
            }

            if (eChartsConfig.echartsMode) {
                cloudChart._componentsMap[
                    Object.keys(cloudChart._componentsMap)[0]
                ]._features.brush.model.iconPaths[
                    eChartsConfig.echartsMode
                ].trigger('click');
            }

            // Context Menu
            cloudChart.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [eChartsConfig.legendLabels],
                });
            });
            cloudChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            if (eChartsConfig.currentMode === 'defaultMode') {
                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    cloudChart,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: eChartsConfig.legendLabels,
                        getCurrentEvent: function () {
                            return scope.widgetCtrl.getEvent('currentEvent');
                        },
                    }
                );
            }

            // it is necessary to initialize comment mode so the nodes are painted
            EchartsHelper.initializeCommentMode({
                comments: eChartsConfig.comments,
                currentMode: eChartsConfig.currentMode,
                saveCb: eChartsConfig.callbacks.commentMode.onSave,
            });
        }

        /**
         * @name toggleMode
         * @desc switches the jv mode to the new specified mode
         * @returns {void}
         */
        function toggleMode() {
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            initializeEvents();
        }

        /**
         * @name resizeViz
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz() {
            cloudChart.resize();
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
            modeListener();
        }

        // Start Visualization Creation
        initialize();
    }
}
