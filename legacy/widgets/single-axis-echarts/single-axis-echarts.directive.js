'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import './single-axis-echarts.service.js';

export default angular
    .module('app.single-axis-echarts.directive', ['app.single-axis.service'])
    .directive('singleAxisEcharts', singleAxisEcharts);

singleAxisEcharts.$inject = [
    'VIZ_COLORS',
    'semossCoreService',
    'singleAxisService',
];

function singleAxisEcharts(VIZ_COLORS, semossCoreService, singleAxisService) {
    singleAxisChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: singleAxisChartLink,
    };

    function singleAxisChartLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];

        /** ************* Main Event Listeners ************************/
        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            removeBrushListener,
            /** *************** ECharts ****************************/
            eChartsConfig,
            singleAxisChart,
            currentCallbacks,
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
            removeBrushListener = scope.widgetCtrl.on('remove-brush', paint);

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
                // layerIndex = 0,
                uiOptions,
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                tasks = scope.widgetCtrl.getWidget('view.visualization.tasks');

            uiOptions = angular.extend(sharedTools, individualTools);
            uiOptions.colorByValue = colorBy;

            // TODO add comments
            // comments: scope.widgetCtrl.getWidget('view.visualization.commentData'),
            currentCallbacks = scope.widgetCtrl.getEventCallbacks();

            eChartsConfig = singleAxisService.getConfig(
                'singleAxis',
                tasks,
                uiOptions,
                keys,
                getDataTableAlign(keys)
            );
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            eChartsConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            eChartsConfig.echartsMode = EchartsHelper.getEchartsMode(
                scope.widgetCtrl.getMode('selected')
            );

            paint();
        }

        /**
         * @name getDataTableAlign
         * @param {array} currentKeys - array of objects to describe how to build the visual
         * @desc format the keys array into a dataTableAlignObject
         * @return {object} dataTableAlign - key:value mapping of current alignment
         */
        function getDataTableAlign(currentKeys) {
            var dataTableAlign = {},
                i,
                len,
                keyMapping = {};

            if (!currentKeys) {
                return dataTableAlign;
            }

            // iterate over current keys to create new object with key:value mapping instead of key:array mapping
            for (i = 0, len = currentKeys.length; i < len; i++) {
                if (!keyMapping.hasOwnProperty(currentKeys[i].model)) {
                    keyMapping[currentKeys[i].model] = 0;
                    dataTableAlign[currentKeys[i].model] = currentKeys[i].alias;
                } else {
                    keyMapping[currentKeys[i].model] += 1;
                    dataTableAlign[
                        currentKeys[i].model +
                            ' ' +
                            keyMapping[currentKeys[i].model]
                    ] = currentKeys[i].alias;
                }
            }

            return dataTableAlign;
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (singleAxisChart) {
                singleAxisChart.clear();
                singleAxisChart.dispose();
            }
            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            singleAxisChart = echarts.init(ele[0].firstElementChild);

            var option = eChartsConfig.option;
            option.toolbox = {
                show: false,
                left: '2',
                bottom: '5',
                orient: 'vertical',
                feature: {
                    brush: {
                        type: ['rect'],
                        title: {
                            rect: 'Brush',
                            polygon: 'Polygon Brush',
                            lineX: 'Horizontal Brush',
                        },
                    },
                },
                iconStyle: {
                    emphasis: {
                        textPosition: 'right',
                        textAlign: 'left',
                    },
                },
            };
            option.color = eChartsConfig.options.color;

            option.brush = {
                xAxisIndex: 0,
                brushStyle: {
                    borderWidth: 1,
                    color: 'rgba(120,140,180,0.15)',
                    borderColor: 'rgba(120,140,180,0.35)',
                },
            };

            if (eChartsConfig.backgroundColorStyle) {
                option.backgroundColor = eChartsConfig.backgroundColorStyle;
            }

            option.textStyle = {
                fontFamily: 'Inter',
            };

            option.grid = {
                top: 60,
                right: 45,
                bottom: 100,
                left: 40,
            };

            // use configuration item and data specified to show chart
            EchartsHelper.setOption(singleAxisChart, option);

            // Add event listeners
            // TODO figure out comment / brush / eventing paradigm
            initializeEvents();
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

            // Context Menu
            singleAxisChart.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [eChartsConfig.keys.label],
                });
            });
            singleAxisChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            if (eChartsConfig.echartsMode) {
                singleAxisChart.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'brush',
                    brushOption: {
                        brushType: eChartsConfig.echartsMode,
                    },
                });
            }

            if (
                eChartsConfig.currentMode === 'defaultMode' ||
                eChartsConfig.currentMode === 'polygonBrushMode'
            ) {
                EchartsHelper.initializeBrush(singleAxisChart, {
                    series: eChartsConfig.option.series,
                    legendLabels: eChartsConfig.keys.label,
                    brushCb: currentCallbacks.defaultMode.onBrush,
                    type: 'singleaxis',
                    repaint: paint,
                    openContextMenu: scope.visualizationCtrl.openContextMenu,
                    setContextMenuDataFromBrush:
                        scope.visualizationCtrl.setContextMenuDataFromBrush,
                });

                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    singleAxisChart,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: eChartsConfig.keys.label,
                        getCurrentEvent: function () {
                            return scope.widgetCtrl.getEvent('currentEvent');
                        },
                        vizType: 'singleaxis',
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
            eChartsConfig.echartsMode = EchartsHelper.getEchartsMode(
                scope.widgetCtrl.getMode('selected')
            );
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
            singleAxisChart.resize();
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
            removeBrushListener();
        }

        // Start Visualization Creation
        initialize();
    }
}
