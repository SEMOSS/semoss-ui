'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';
import './radar-echarts.service.js';

/**
 *
 * @name radar-echarts
 * @desc radar-echarts chart directive for creating and visualizing a column chart
 */

export default angular
    .module('app.radar-echarts.directive', ['app.radar.service'])
    .directive('radarEcharts', radarEcharts);

radarEcharts.$inject = ['VIZ_COLORS', 'radarService'];

function radarEcharts(VIZ_COLORS, radarService) {
    radarChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: radarChartLink,
    };

    function radarChartLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];
        var dataTypes;

        /** ************* Main Event Listeners ************************/
        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            /** *************** ECharts ****************************/
            eChartsConfig,
            radarChart,
            clickTimer,
            hoverTimer,
            destroyListeners;

        /**
         * @name initialize
         * @desc creates the visualization on the chart div
         * @returns {void}
         */
        function initialize() {
            var classArray;

            // bind listeners
            resizeListener = scope.widgetCtrl.on('resize-widget', resizeViz);
            updateTaskListener = scope.widgetCtrl.on('update-task', setData);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                setData
            );
            addDataListener = scope.widgetCtrl.on('added-data', setData);
            modeListener = scope.widgetCtrl.on('update-mode', toggleMode);

            // add scroll bar
            classArray = ele[0].firstElementChild.className.split(' ');
            if (classArray.indexOf('widget-view__scroll') === -1) {
                ele[0].firstElementChild.className += ' widget-view__scroll';
            }

            scope.$on('$destroy', destroy);

            setData();
        }

        /**
         * @name setData
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.Radar'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                // TODO types support for dates?... use keys
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.Radar'
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                viewInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks'
                ),
                groupBy = {},
                groupByInstance,
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                ),
                uiOptions,
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                i,
                legend = [];

            uiOptions = angular.extend(sharedTools, individiualTools);
            uiOptions.colorByValue = colorBy;
            getDataTypes(keys, uiOptions);

            if (groupByInfo && groupByInfo.viewType) {
                groupBy = formatDataForGroupBy(data, groupByInfo);
                data = groupBy.data;
                groupByInstance = groupBy.name;
            }

            eChartsConfig = {};
            eChartsConfig = radarService.getConfig(
                data,
                uiOptions,
                keys,
                groupByInstance
            );
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            eChartsConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            eChartsConfig.groupByInfo = groupByInfo;

            for (i = 0; i < eChartsConfig.data.length; i++) {
                legend.push(eChartsConfig.data[i].name);
            }
            eChartsConfig.legendHeaders = legend;

            paint();
        }

        /**
         * @name getDataTypes
         * @desc gets the data formatting options for each dimension
         * @param {Object} keys - object of data keys
         * @param {object} options- uiOptions
         */
        function getDataTypes(keys, options) {
            dataTypes = {};
            let k, j, formatType, newFormat;

            for (k = 0; k < keys.length; k++) {
                if (keys[k].model !== 'facet') {
                    dataTypes[keys[k].alias] = [];
                    formatType = visualizationUniversal.mapFormatOpts(keys[k]);
                    dataTypes[keys[k].alias].push(formatType);
                }
                if (options.formatDataValues && keys[k].model !== 'facet') {
                    for (
                        j = 0;
                        j < options.formatDataValues.formats.length;
                        j++
                    ) {
                        newFormat = options.formatDataValues.formats[j];
                        if (keys[k].alias === newFormat.dimension) {
                            dataTypes[newFormat.dimension] = [];
                            dataTypes[newFormat.dimension].push(newFormat);
                        }
                    }
                }
            }
        }

        /**
         * @name formatDataForGroupBy
         * @desc formats data when Group By exists
         * @param {object} data orginial data
         * @param {object} groupBy groupBy object
         * @returns {void}
         */
        function formatDataForGroupBy(data, groupBy) {
            var formattedData = data,
                groupByIndex,
                name,
                i,
                instanceIdx,
                returnObj = {};

            if (groupBy.viewType === 'Individual Instance') {
                groupByIndex = data.headers.indexOf(groupBy.selectedDim);
                if (groupByIndex === -1) {
                    // return data;
                    groupByIndex = data.headers.length;
                }

                if (typeof groupBy.instanceIndex === 'string') {
                    instanceIdx = parseInt(groupBy.instanceIndex, 10);
                }
                // Create name for title
                name =
                    groupBy.selectedDim +
                    ' : ' +
                    groupBy.uniqueInstances[instanceIdx];
                // Remove Group By dimension from data headers and values
                formattedData.headers.splice(groupByIndex, 1);
                formattedData.rawHeaders.splice(groupByIndex, 1);

                // Remove any added data from brush/click
                for (i = 0; i < data.values.length; i++) {
                    if (
                        data.values[i][groupByIndex] !==
                        groupBy.uniqueInstances[instanceIdx]
                    ) {
                        data.values.splice(i, 1);
                        i--;
                    }
                }

                for (i = 0; i < data.values.length; i++) {
                    data.values[i].splice(groupByIndex, 1);
                }
                returnObj.name = name;
                returnObj.data = data;
            }

            return returnObj;
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (radarChart) {
                radarChart.clear();
                radarChart.dispose();
            }
            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            radarChart = echarts.init(ele[0].firstElementChild);

            var option = {},
                dataEmpty,
                labelType,
                labelName,
                labelDimension,
                i,
                k;

            // get primary db format type
            for (k = 0; k < eChartsConfig.keys.length; k++) {
                if (eChartsConfig.keys[k].model === 'label') {
                    labelType = visualizationUniversal.mapFormatOpts(
                        eChartsConfig.keys[k]
                    );
                    labelName = eChartsConfig.keys[k].alias;
                }
            }

            // if user has updated formatting rules in widget, override db format types
            if (eChartsConfig.options.formatDataValues) {
                for (
                    i = 0;
                    i < eChartsConfig.options.formatDataValues.formats.length;
                    i++
                ) {
                    labelDimension =
                        eChartsConfig.options.formatDataValues.formats[i]
                            .dimension;
                    if (labelDimension === labelName) {
                        labelType =
                            eChartsConfig.options.formatDataValues.formats[i];
                    }
                }
            }

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType
            ) {
                dataEmpty = true;
                for (i = 0; i < eChartsConfig.data.length; i++) {
                    if (eChartsConfig.data[i].value.length !== 0) {
                        dataEmpty = false;
                        break;
                    }
                }

                if (
                    eChartsConfig.groupByInfo.viewType === 'Individual Instance'
                ) {
                    option.graphic = [];
                    if (dataEmpty) {
                        option.graphic = option.graphic.concat({
                            id: 'textGroup',
                            type: 'group',
                            right: 'center',
                            top: 'center',
                            children: [
                                {
                                    type: 'rect',
                                    top: 'center',
                                    right: 'center',
                                    shape: {
                                        width: 200,
                                        height: 40,
                                    },
                                    style: {
                                        fill: '#fff',
                                        stroke: '#999',
                                        lineWidth: 2,
                                        shadowBlur: 8,
                                        shadowOffsetX: 3,
                                        shadowOffsetY: 3,
                                        shadowColor: 'rgba(0,0,0,0.3)',
                                    },
                                },
                                {
                                    type: 'text',
                                    right: 'center',
                                    top: 'center',
                                    style: {
                                        text: 'There is no data for this instance.',
                                        textAlign: 'center',
                                    },
                                },
                            ],
                        });
                    }
                }
            }

            if (eChartsConfig.backgroundColorStyle) {
                option.backgroundColor = eChartsConfig.backgroundColorStyle;
            }
            option.color = eChartsConfig.options.color;
            option.tooltip = {
                show: eChartsConfig.options.showTooltips,
                formatter: function (info) {
                    var returnArray = [],
                        j,
                        formatType,
                        dim;

                    // catch undefined case
                    if (!info.data) {
                        return;
                    }

                    if (info.marker) {
                        returnArray.push(info.marker);
                    }

                    if (info.name) {
                        returnArray.push(
                            '<b>' +
                                visualizationUniversal.formatValue(
                                    info.name,
                                    labelType
                                ) +
                                '</b>' +
                                '<br>'
                        );
                    }

                    for (j = 0; j < eChartsConfig.indicator.length; j++) {
                        formatType =
                            dataTypes[eChartsConfig.indicator[j].name][0];
                        returnArray.push(
                            '' +
                                cleanValue(eChartsConfig.indicator[j].name) +
                                ': ' +
                                visualizationUniversal.formatValue(
                                    info.data.value[j],
                                    formatType
                                ) +
                                '<br>'
                        );
                    }

                    for (dim in info.data.tooltip) {
                        if (info.data.tooltip.hasOwnProperty(dim)) {
                            formatType = dataTypes[dim][0];
                            returnArray.push(
                                '' +
                                    cleanValue(dim) +
                                    ': ' +
                                    visualizationUniversal.formatValue(
                                        info.data.tooltip[dim],
                                        formatType
                                    ) +
                                    '<br>'
                            );
                        }
                    }
                    return returnArray.join('');
                },
                trigger: 'item',
                confine: true,
                backgroundColor:
                    eChartsConfig.options.tooltip.backgroundColor || '#FFFFFF',
                borderWidth:
                    parseFloat(eChartsConfig.options.tooltip.borderWidth) || 0,
                borderColor: eChartsConfig.options.tooltip.borderColor || '',
                textStyle: {
                    color: eChartsConfig.options.tooltip.fontColor || '#000000',
                    fontFamily:
                        eChartsConfig.options.tooltip.fontFamily || 'Inter',
                    fontSize:
                        parseFloat(eChartsConfig.options.tooltip.fontSize) ||
                        12,
                },
            };
            option.legend = {
                type: 'scroll',
                data: eChartsConfig.legendHeaders,
                show: eChartsConfig.options.toggleLegend,
                formatter: function (info) {
                    return visualizationUniversal.formatValue(info, labelType);
                },
                orient: 'vertical',
                left: 'left',
                textStyle: eChartsConfig.legendLabelStyle,
            };
            option.radar = {
                name: Object.assign(
                    {
                        formatter: function (info) {
                            return info.replace(/_/g, ' ');
                        },
                    },
                    eChartsConfig.labelTextStyle
                ),
                shape: getShape(eChartsConfig.options.toggleShape) || 'polygon',
                indicator: eChartsConfig.indicator,
                axisLine: eChartsConfig.axisLineStyle,
                splitLine: eChartsConfig.radarLineStyle,
            };
            option.series = [
                {
                    type: 'radar',
                    itemStyle: getArea(eChartsConfig.options.toggleArea) || '',
                    data: eChartsConfig.data,
                    label: Object.assign(
                        {
                            show: eChartsConfig.options.displayValues,
                            formatter: function (info) {
                                var headerIdx, headerName, formatType;

                                headerIdx = info.data.value.indexOf(info.value);
                                headerName =
                                    eChartsConfig.indicator[headerIdx].name;
                                formatType = dataTypes[headerName][0];
                                return visualizationUniversal.formatValue(
                                    info.value,
                                    formatType
                                );
                            },
                        },
                        eChartsConfig.valueTextStyle
                    ),
                    lineStyle: {
                        normal: {
                            width: 3,
                        },
                        emphasis: {
                            width: 5,
                        },
                    },
                },
            ];
            option.animation = false;
            // option.animationDuration = eChartsConfig.animationDuration;
            // option.animationEasing = eChartsConfig.animationType;
            option.draggable = true;

            option.textStyle = {
                fontFamily: 'Inter',
            };

            // use configuration item and data specified to show chart
            EchartsHelper.setOption(radarChart, option);

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
                radarChart._componentsMap[
                    Object.keys(radarChart._componentsMap)[0]
                ]._features.brush.model.iconPaths[
                    eChartsConfig.echartsMode
                ].trigger('click');
            }

            // Context Menu
            radarChart.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [eChartsConfig.label],
                });
            });
            radarChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            if (eChartsConfig.currentMode === 'defaultMode') {
                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    radarChart,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: eChartsConfig.label,
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
            // console.log(event);
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
         * @returns {void}
         */
        function eventCallback(event, type) {
            var returnObj = {
                data: {},
            };
            returnObj.data[eChartsConfig.label] = [event.name];
            eChartsConfig.callbacks.defaultMode[type](returnObj);
            clickTimer = null;
            hoverTimer = null;
        }

        /**
         * @name executeCallback
         * @desc execute callback for a specific type with params
         * @param {string} type - type of callback to execute
         * @param {object} args - arguments to pass into the callback
         * @returns {void}
         */
        // TODO determine if hardcoding events or not... Use below for current mode checks
        // function executeCallback(type, args) {
        //     var cb;
        //     if (eChartsConfig.currentMode && eChartsConfig.callbacks.hasOwnProperty(eChartsConfig.currentMode)) {
        //         cb = eChartsConfig.callbacks[eChartsConfig.currentMode][type];
        //         if (typeof cb === 'function') {
        //             cb.apply(null, args);
        //         }
        //     }
        // }

        /**
         * @name getShape
         * @desc sets the shape of the radar chart
         * @param {bool} selectedShape - eChartsConfig.options.toggleShape
         * @returns {string} - 'polygon' or 'circle'
         */
        function getShape(selectedShape) {
            var shape;
            if (selectedShape) {
                shape = 'polygon';
            } else {
                shape = 'circle';
            }
            return shape;
        }

        /**
         * @name getArea
         * @desc sets the area fill of the radar chart
         * @param {bool} selectedArea - eChartsConfig.options.toggleArea
         * @returns {string} - describes whether or not to fill the radar area
         */
        function getArea(selectedArea) {
            var area;
            if (selectedArea) {
                area = {
                    normal: {
                        areaStyle: {
                            type: 'default',
                            opacity: 0.75,
                        },
                    },
                };
            } else {
                area = '';
            }
            return area;
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
            radarChart.resize();
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
