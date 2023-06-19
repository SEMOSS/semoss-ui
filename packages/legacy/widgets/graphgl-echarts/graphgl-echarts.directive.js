import * as echarts from 'echarts';
import '@/widget-resources/js/echarts/GL/echarts-gl.min.js';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import './graphgl-echarts.service.js';

('use strict');
/**
 *
 * @name graphgl-echarts
 * @desc graphgl-echarts chart directive for creating and visualizing a column chart
 */

export default angular
    .module('app.graphgl-echarts.directive', ['app.graphgl-echarts.service'])
    .directive('graphglEcharts', graphglEcharts);

graphglEcharts.$inject = ['VIZ_COLORS', 'graphglEchartsService'];

function graphglEcharts(VIZ_COLORS, graphglEchartsService) {
    graphglEchartsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: graphglEchartsLink,
    };

    function graphglEchartsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /** ************* Main Event Listeners ************************/
        var // resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            /** *************** ECharts ****************************/
            eChartsConfig,
            graphChart,
            mouseUp,
            destroyListeners;

        /**
         * @name initialize
         * @desc creates the visualization on the chart div
         * @returns {void}
         */
        function initialize() {
            // bind listeners
            // resizeListener = scope.widgetCtrl.on('resize-widget', resizeViz);
            updateTaskListener = scope.widgetCtrl.on('update-task', setData);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                setData
            );
            addDataListener = scope.widgetCtrl.on('added-data', setData);
            modeListener = scope.widgetCtrl.on('update-mode', toggleMode);

            // clean up
            scope.$on('$destroy', function () {
                // resizeListener();
                updateTaskListener();
                updateOrnamentsListener();
                addDataListener();
                modeListener();
            });

            setData();
        }

        /** Data */
        /**
         * @name setData
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var active = scope.widgetCtrl.getWidget('active'),
                individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.' + active + '.tools.individual.Graph'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tasks.' + layerIndex + '.data'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                uiOptions;

            uiOptions = angular.extend(sharedTools, individiualTools);
            uiOptions.colorByValue = colorBy;

            // set the config
            eChartsConfig = graphglEchartsService.getConfig(data, uiOptions);
            eChartsConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.echartsMode = EchartsHelper.getEchartsMode(
                scope.widgetCtrl.getMode('selected')
            );

            paint();
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (graphChart) {
                graphChart.clear();
                graphChart.dispose();
            }

            // initialize visualization
            graphChart = echarts.init(ele[0].firstElementChild);
            eChartsConfig.textStyle = {
                fontFamily: 'Inter',
            };

            // use configuration item and data specified to show chart
            EchartsHelper.setOption(graphChart, eChartsConfig);

            // initialize events
            initializeEvents();
        }

        /** Events */
        /**
         * @name eChartBrushed
         * @desc brush selected event from echarts
         * @param {object} e - charts event
         * @returns {void}
         */
        function eChartBrushed(e) {
            // batch = e.batch;
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

            EchartsHelper.initializeCommentMode(graphChart._dom, {
                comments: EchartsHelper.getVizComments(
                    scope.widgetCtrl.getWidget('view.visualization.layout'),
                    eChartsConfig.comments
                ),
                saveCb: eChartsConfig.callbacks.commentMode.onSave,
                getMode: function () {
                    return eChartsConfig.currentMode;
                },
            });

            if (eChartsConfig.echartsMode) {
                graphChart.dispatchAction({
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
                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    graphChart,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: eChartsConfig.legendLabels,
                        getCurrentEvent: function () {
                            return scope.widgetCtrl.getEvent('currentEvent');
                        },
                        vizType: 'GraphGL',
                    }
                );
            }
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

        // /**
        // * @name resizeViz
        // * @desc reruns the jv paint function
        // * @returns {void}
        // */
        // function resizeViz() {
        //     graphChart.resize();
        //     // We repaint so that we can re-center the graph viz
        //     paint();
        // }

        // Start Visualization Creation
        initialize();
    }
}
