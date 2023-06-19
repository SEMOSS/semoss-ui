'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import './dendrogram-echarts.service.js';

import './dendrogram-echarts.scss';

export default angular
    .module('app.dendrogram-echarts.directive', [
        'app.dendrogram-echarts.service',
    ])
    .directive('dendrogramEcharts', dendrogramEcharts);

dendrogramEcharts.$inject = [
    'VIZ_COLORS',
    'semossCoreService',
    'dendrogramEchartsService',
];

function dendrogramEcharts(
    VIZ_COLORS,
    semossCoreService,
    dendrogramEchartsService
) {
    dendrogramChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: dendrogramChartLink,
    };

    function dendrogramChartLink(scope, ele, attrs, ctrl) {
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
            dendrogramChart,
            destroyListeners,
            clickTimer,
            hoverTimer;

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
                chartData = data.values
                    ? semossCoreService.visualization.getTableData(
                          data.headers,
                          data.values,
                          data.rawHeaders
                      )
                    : data,
                dataTableAlign =
                    semossCoreService.visualization.getDataTableAlign(keys),
                height,
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                ),
                uiOptions;

            uiOptions = angular.extend(sharedTools, individualTools);
            uiOptions.colorByValue = colorBy;

            if (groupByInfo && groupByInfo.viewType === 'Individual Instance') {
                data = formatDataForGroupByIndividual(data, groupByInfo);
            }

            height = data.values ? data.values.length * 18.5 : 185;
            determineResize(height, uiOptions);

            eChartsConfig = dendrogramEchartsService.getConfig(
                'tree',
                chartData,
                uiOptions,
                data.headers,
                dataTableAlign,
                height
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
         * @name determineResize
         * @param {number} height calculated container height
         * @param {object} uiOptions Semoss uiOptions
         * @desc if a user wants to expand width, set the width to number of dimensions * 100
         * if a user wants to expand height, take the number of values, multiplied by font size and 1.5 for some extra padding
         * @return {void}
         */
        function determineResize(height, uiOptions) {
            var chartContainer = ele[0].childNodes[0],
                parent = ele[0];

            // TODO adjust too allow for more room for labels

            // chartWidth = (parent.clientWidth * 1.1);
            // chartHeight = (parent.clientHeight * 1.1);
            // OR
            // chartWidth = (chartContainer.offsetWidth * 1.1);
            // chartHeight = (chartContainer.offsetHeight * 1.1);

            if (uiOptions.fitToView && !uiOptions.toggleRadial) {
                parent.style.position = 'absolute';
                parent.style.top = '0';
                parent.style.right = '0';
                parent.style.bottom = '0';
                parent.style.left = '0';
                parent.style.overflowY = 'auto';

                if (uiOptions.rotateAxis) {
                    // height = height + 50;
                    chartContainer.style.width = '' + height + 'px';
                    chartContainer.style.height = '';
                    // chartContainer.style.height = '' + chartHeight + 'px';
                } else {
                    // height = height + 30;
                    chartContainer.style.height = '' + height + 'px';
                    chartContainer.style.width = '';
                    // chartContainer.style.width = '' + chartWidth + 'px';
                }
            } else {
                parent.style.position = '';
                parent.style.top = '';
                parent.style.right = '';
                parent.style.bottom = '';
                parent.style.left = '';
                parent.style.overflowY = '';
                chartContainer.style.width = '';
                chartContainer.style.height = '';
            }
        }

        /**
         * @name formatDataForGroupByIndividual
         * @desc formats data when Group By exists
         * @param {object} data orginial data
         * @param {object} groupBy groupBy object
         * @returns {void}
         */
        function formatDataForGroupByIndividual(data, groupBy) {
            var formattedData = data,
                groupByIndex,
                i;

            groupByIndex = data.headers.indexOf(groupBy.selectedDim);
            if (groupByIndex === -1) {
                groupByIndex = data.headers.length;
            }

            // Remove Group By dimension from data headers and values
            formattedData.headers.splice(groupByIndex, 1);
            formattedData.rawHeaders.splice(groupByIndex, 1);
            for (i = 0; i < data.values.length; i++) {
                formattedData.values[i].splice(groupByIndex, 1);
            }
            return formattedData;
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (dendrogramChart) {
                dendrogramChart.clear();
                dendrogramChart.dispose();
            }
            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            dendrogramChart = echarts.init(ele[0].firstElementChild);

            var option = {
                tooltip: {
                    show: eChartsConfig.options.showTooltips,
                    trigger: 'item',
                    triggerOn: 'mousemove',
                    confine: true,
                    formatter: function (info) {
                        var returnArray = [];

                        if (info.marker) {
                            returnArray.push(info.marker);
                        }
                        if (info.name) {
                            returnArray.push(
                                '' + cleanValue(info.name) + '<br>'
                            );
                        }

                        return returnArray.join('');
                    },
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
                series: eChartsConfig.series,
            };

            if (eChartsConfig.backgroundColorStyle) {
                option.backgroundColor = eChartsConfig.backgroundColorStyle;
            }

            if (eChartsConfig.title && eChartsConfig.title.text) {
                option.title = eChartsConfig.title;
            }

            option.legend = {
                data: eChartsConfig.legendData,
                show: eChartsConfig.showLegend,
                type: 'scroll',
                orient: 'horizontal',
                left: '10',
                pageButtonPosition: 'start',
                formatter: function (value) {
                    return value.replace(/_/g, ' ');
                },
                textStyle: eChartsConfig.legendLabelStyle,
            };
            option.textStyle = {
                fontFamily: 'Inter',
            };
            // use configuration item and data specified to show chart
            EchartsHelper.setOption(dendrogramChart, option);

            // Add event listeners
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

            dendrogramChart.on('click', eChartClicked);
            dendrogramChart.on('mouseover', eChartMouse);
            dendrogramChart.on('mouseout', eChartMouseOut);
            dendrogramChart._dom.addEventListener('mouseout', mouseOut);

            // Context Menu
            dendrogramChart.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [null],
                });
            });
            dendrogramChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            // it is necessary to initialize comment mode so the nodes are painted
            EchartsHelper.initializeCommentMode({
                comments: eChartsConfig.comments,
                currentMode: eChartsConfig.currentMode,
                saveCb: eChartsConfig.callbacks.commentMode.onSave,
            });
        }

        /**
         * @name eChartClicked
         * @desc single click event from echarts
         * @param {object} event - echarts event sent back on click
         * @returns {void}
         */
        function eChartClicked(event) {
            if (clickTimer) {
                clearTimeout(clickTimer);
                eventCallback(event, 'onDoubleClick');
            } else {
                clickTimer = setTimeout(
                    eventCallback.bind(null, event, 'onClick'),
                    250
                );
            }
        }

        /**
         * @name eChartMouse
         * @desc onHover event for echarts
         * @param {object} event - echarts event sent back on hover
         * @returns {void}
         */
        function eChartMouse(event) {
            if (hoverTimer) {
                clearTimeout(hoverTimer);
            }
            hoverTimer = setTimeout(
                eventCallback.bind(null, event, 'onHover'),
                2000
            );
        }

        /**
         * @name eChartMouseOut
         * @desc offHover event for echarts
         * @param {object} event - echarts event sent back on offHover
         * @returns {void}
         */
        function eChartMouseOut(event) {
            var currentEvent = scope.widgetCtrl.getEvent('currentEvent');
            if (currentEvent.type === 'onHover') {
                eventCallback(event, 'onMouseOut');
            }
        }

        /**
         * @name mouseOut
         * @desc clears timers on mouse out of canvas
         * @returns {void}
         */
        function mouseOut() {
            clearTimeout(hoverTimer);
        }

        /**
         * @name eventCallback
         * @desc click callback event
         * @param {object} event - echarts event sent back on click
         * @param {string} type - click or double click
         * @desc sends event data to event service, also checks if underlying data is abbreviated so proper data is sent
         * @returns {void}
         */
        function eventCallback(event, type) {
            var returnObj = {
                    data: {},
                },
                selectedValue,
                selectedDimension;

            // Since Dendrogram has default click event (collapse/expand nodes), ignore custom click events for now
            if (eChartsConfig.options.clickToCollapse && type === 'onClick') {
                return;
            }

            if (event.data) {
                selectedDimension = event.data.dimension;
                selectedValue = event.data.name;
            }

            returnObj.data[selectedDimension] = [selectedValue];
            eChartsConfig.callbacks.defaultMode[type](returnObj);
            clickTimer = null;
            hoverTimer = null;
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
         * @name resizeViz
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz() {
            dendrogramChart.resize();
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
