'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';

import './polar-bar-echarts.service.js';

/**
 *
 * @name polar-bar-echarts
 * @desc polar-bar-echarts chart directive for creating and visualizing a column chart
 */

export default angular
    .module('app.polar-bar-echarts.directive', ['app.polar-bar.service'])
    .directive('polarBarEcharts', polarBarEcharts);

polarBarEcharts.$inject = ['VIZ_COLORS', 'polarBarService'];

function polarBarEcharts(VIZ_COLORS, polarBarService) {
    polarBarChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: polarBarChartLink,
    };

    function polarBarChartLink(scope, ele, attrs, ctrl) {
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
            polarBarChart,
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
                individual =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                ),
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                groupBy = {},
                groupByInstance,
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                ),
                uiOptions;

            uiOptions = angular.extend(sharedTools, individual);
            uiOptions.colorByValue = colorBy;
            getDataTypes(keys, uiOptions);

            if (groupByInfo && groupByInfo.viewType) {
                groupBy = formatDataForGroupBy(data, groupByInfo);
                data = groupBy.data;
                groupByInstance = groupBy.name;
            }

            eChartsConfig = polarBarService.getConfig(
                'barPolar',
                data,
                uiOptions,
                colorBy,
                groupByInstance,
                keys
            );
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            eChartsConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            eChartsConfig.groupByInfo = groupByInfo;
            paint();
        }

        /**
         * @name getDataTypes
         * @desc gets the data formatting options for each dimension
         * @param {Object} keys - object of data keys
         * @param {object} options- uiOptions
         */
        function getDataTypes(keys, options) {
            dataTypes = {
                labelType: '',
                valueType: '',
            };
            let k, j, i, labelName, valueName, formatType, formatDimension;

            for (k = 0; k < keys.length; k++) {
                if (keys[k].model === 'label') {
                    dataTypes.labelType = visualizationUniversal.mapFormatOpts(
                        keys[k]
                    );
                    labelName = keys[k].alias;
                }
                // only use formatting rules from 1st series selected to configure Y axis
                if (keys[k].model === 'value' && dataTypes.valueType === '') {
                    dataTypes.valueType = visualizationUniversal.mapFormatOpts(
                        keys[k]
                    );
                    valueName = keys[k].alias;
                }
                if (keys[k].model === 'tooltip' || keys[k].model === 'value') {
                    dataTypes[keys[k].alias] = [];
                    formatType = visualizationUniversal.mapFormatOpts(keys[k]);
                    dataTypes[keys[k].alias].push(formatType);
                    if (options.formatDataValues) {
                        for (
                            j = 0;
                            j < options.formatDataValues.formats.length;
                            j++
                        ) {
                            formatType = options.formatDataValues.formats[j];
                            if (keys[k].alias === formatType.dimension) {
                                dataTypes[formatType.dimension] = [];
                                dataTypes[formatType.dimension].push(
                                    formatType
                                );
                            }
                        }
                    }
                }
            }

            if (options.formatDataValues) {
                for (i = 0; i < options.formatDataValues.formats.length; i++) {
                    formatDimension =
                        options.formatDataValues.formats[i].dimension;
                    if (formatDimension === labelName) {
                        dataTypes.labelType =
                            options.formatDataValues.formats[i];
                    }
                    if (formatDimension === valueName) {
                        dataTypes.valueType =
                            options.formatDataValues.formats[i];
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
            if (polarBarChart) {
                polarBarChart.clear();
                polarBarChart.dispose();
            }
            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            polarBarChart = echarts.init(ele[0].firstElementChild);

            var option = {},
                i,
                dataEmpty;

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType
            ) {
                dataEmpty = true;
                for (i = 0; i < eChartsConfig.data.length; i++) {
                    if (eChartsConfig.data[i].data.length !== 0) {
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
                            top: '60%',
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
                        tooltipName = info[0].name,
                        j,
                        formatType,
                        tooltipType;

                    if (tooltipName) {
                        returnArray.push(
                            '<b>' +
                                visualizationUniversal.formatValue(
                                    tooltipName,
                                    dataTypes.labelType
                                ) +
                                '</b>' +
                                '<br>'
                        );
                    }

                    for (j = 0; j < info.length; j++) {
                        formatType = dataTypes[info[j].seriesName][0];

                        if (
                            !info[j].data ||
                            info[j].componentSubType === 'line'
                        ) {
                            continue;
                        }
                        if (info[j].marker) {
                            returnArray.push(info[j].marker);
                        }
                        if (info[j].seriesName) {
                            returnArray.push(
                                '' +
                                    cleanValue(info[j].seriesName) +
                                    ': ' +
                                    visualizationUniversal.formatValue(
                                        info[j].value,
                                        formatType
                                    ) +
                                    '<br>'
                            );
                        }
                    }

                    if (info[0].data.tooltip) {
                        for (j = 0; j < info[0].data.tooltip.length; j++) {
                            tooltipType =
                                dataTypes[info[0].data.tooltip[j].header][0];
                            if (
                                eChartsConfig.legendHeaders.indexOf(
                                    info[0].data.tooltip[j].header
                                ) === -1
                            ) {
                                returnArray.push(
                                    '' +
                                        cleanValue(
                                            info[0].data.tooltip[j].header
                                        ) +
                                        ': ' +
                                        visualizationUniversal.formatValue(
                                            info[0].data.tooltip[j].value || 0,
                                            tooltipType
                                        ) +
                                        '<br>'
                                );
                            }
                        }
                    }

                    return returnArray.join('');
                },
                trigger: 'axis',
                axisPointer: {
                    type: eChartsConfig.axisPointer,
                    lineStyle: {
                        color:
                            eChartsConfig.options.axis.pointer.lineStyle
                                .lineColor || '#000000',
                        width:
                            parseFloat(
                                eChartsConfig.options.axis.pointer.lineStyle
                                    .lineWidth
                            ) || 2,
                        type:
                            eChartsConfig.options.axis.pointer.lineStyle
                                .lineType || 'dashed',
                        opacity:
                            eChartsConfig.options.axis.pointer.lineStyle
                                .opacity || 0.1,
                    },
                    shadowStyle: {
                        color:
                            eChartsConfig.options.axis.pointer.shadowStyle
                                .backgroundColor || '#000000',
                        opacity:
                            eChartsConfig.options.axis.pointer.shadowStyle
                                .opacity || 0.05,
                    },
                    crossStyle: {
                        color:
                            eChartsConfig.options.axis.pointer.lineStyle
                                .lineColor || '#000000',
                        width:
                            parseFloat(
                                eChartsConfig.options.axis.pointer.lineStyle
                                    .lineWidth
                            ) || 2,
                        type:
                            eChartsConfig.options.axis.pointer.lineStyle
                                .lineType || 'dashed',
                        opacity:
                            eChartsConfig.options.axis.pointer.lineStyle
                                .opacity || 0.1,
                    },
                    label: {
                        backgroundColor:
                            eChartsConfig.options.tooltip.backgroundColor ||
                            'auto',
                        color:
                            eChartsConfig.options.tooltip.fontColor ||
                            '#000000',
                        fontFamily:
                            eChartsConfig.options.tooltip.fontFamily || 'Inter',
                        fontSize:
                            parseFloat(
                                eChartsConfig.options.tooltip.fontSize
                            ) || 12,
                        shadowBlur: 5,
                        shadowColor: 'rgba(0,0,0,0.2)',
                        shadowOffsetX: 0,
                        shadowOffsetY: 2,
                    },
                },
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
                show: eChartsConfig.showLegend,
                //When legendTop === top pass charttitle font size(Numeric) else pass legendTop (String)  i.e. 'top'
                top:
                    eChartsConfig.options.legend.topalign === 'top' ||
                    eChartsConfig.options.legend.topalign === undefined
                        ? eChartsConfig.title && eChartsConfig.title.show
                            ? eChartsConfig.title.fontSize
                            : 0
                        : eChartsConfig.options.legend.topalign,
                left: eChartsConfig.options.legend.leftalign,
                orient: eChartsConfig.options.legend.orient,
                backgroundColor: eChartsConfig.options.legend.backgroundColor,
                pageButtonPosition: 'start',
                formatter: function (value) {
                    return value.replace(/_/g, ' ');
                },
                textStyle: eChartsConfig.legendLabelStyle,
            };
            // option.angleAxis = eChartsConfig.angleAxis;
            option.angleAxis = {
                type: 'value',
                min: eChartsConfig.angleAxis.min,
                max: eChartsConfig.angleAxis.max,
                // data: eChartsConfig.angleAxis,
                axisLabel: Object.assign(
                    {
                        formatter: function (obj) {
                            if (obj) {
                                return visualizationUniversal.formatValue(
                                    obj,
                                    dataTypes.valueType
                                );
                            }
                            return String(obj).replace(/_/g, ' ');
                        },
                    },
                    eChartsConfig.angleAxis.axisLabel
                ),
                splitLine: eChartsConfig.angleAxis.splitLine,
                axisLine: eChartsConfig.angleAxis.axisLine,
            };
            option.radiusAxis = {
                type: 'category',
                data: eChartsConfig.legendData,
                z: 10,
                axisLabel: Object.assign(
                    {
                        formatter: function (obj) {
                            if (obj) {
                                return visualizationUniversal.formatValue(
                                    obj,
                                    dataTypes.valueType
                                );
                            }
                            return String(obj).replace(/_/g, ' ');
                        },
                    },
                    eChartsConfig.angleAxis.axisLabel
                ),
                axisLine: eChartsConfig.angleAxis.axisLine,
            };
            option.polar = {
                center: ['50%', '50%'],
                radius: '75%',
            };
            option.dataZoom =
                getDataZoom(
                    eChartsConfig.options.togglePolarZoom,
                    eChartsConfig.options.dataZoom
                ) || [];
            // option.barWidth = eChartsConfig.barWidth;
            option.series = eChartsConfig.data;

            option.textStyle = {
                fontFamily: 'Inter',
            };

            // use configuration item and data specified to show chart
            EchartsHelper.setOption(polarBarChart, option);

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
         * @name getDataZoom
         * @desc defines data zoom on polar bar chart
         * @param {string} zoomType - echartsConfig.options.togglePolarZoom
         * @param {object} style - zoom style
         * @returns {array} dataZoom array of slider and inside zoom
         */
        function getDataZoom(zoomType, style) {
            var dataZoom,
                zoomStyle = {
                    backgroundColor: style.backgroundColor || 'transparent',
                    fillerColor: style.fillerColor || 'transparent',
                    borderColor: style.borderColor || '#CCCCCC',
                    dataBackground: {
                        lineStyle: {
                            color:
                                style.dataBackground.lineStyle.lineColor ||
                                'rgba(64, 160, 255, .25)',
                            width: parseFloat(
                                style.dataBackground.lineStyle.lineWidth || 1
                            ),
                            lineStyle:
                                style.dataBackground.lineStyle.lineStyle ||
                                'solid',
                        },
                        areaStyle: {
                            color:
                                style.dataBackground.areaStyle
                                    .backgroundColor ||
                                'rgba(64, 160, 255, .1)',
                            opacity:
                                style.dataBackground.areaStyle.opacity || 1,
                        },
                    },
                    selectedDataBackground: {
                        lineStyle: {
                            color:
                                style.selectedDataBackground.lineStyle
                                    .lineColor || 'rgba(64, 160, 255, 1)',
                            width:
                                parseFloat(
                                    style.selectedDataBackground.lineStyle
                                        .lineWidth
                                ) || 1,
                            lineStyle:
                                style.selectedDataBackground.lineStyle
                                    .lineStyle || 'solid',
                        },
                        areaStyle: {
                            color:
                                style.selectedDataBackground.areaStyle
                                    .backgroundColor ||
                                'rgba(64, 160, 255, .5)',
                            opacity:
                                style.selectedDataBackground.areaStyle
                                    .opacity || 1,
                        },
                    },
                    handleStyle: {
                        color: style.handle.backgroundColor || '#FFFFFF',
                        borderWidth: parseFloat(style.handle.borderWidth) || 1,
                        borderStyle: style.handle.borderStyle || 'solid',
                        borderColor: style.handle.borderColor || '#CCCCCC',
                    },
                    moveHandleStyle: {
                        color: style.moveHandle.backgroundColor || '#FFFFFF',
                        borderWidth:
                            parseFloat(style.moveHandle.borderWidth) || 1,
                        borderStyle: style.moveHandle.borderStyle || 'solid',
                        borderColor: style.moveHandle.borderColor || '#CCCCCC',
                    },
                    emphasis: {
                        moveHandleStyle: {
                            color:
                                style.selectedDataBackground.lineStyle
                                    .lineColor || 'rgba(64, 160, 255, 1)',
                        },
                        handleStyle: {
                            borderColor:
                                style.selectedDataBackground.lineStyle
                                    .lineColor || 'rgba(64, 160, 255, 1)',
                        },
                    },
                };
            if (zoomType === 'Radius Zoom') {
                dataZoom = [
                    {
                        type: 'inside',
                        radiusAxisIndex: 0,
                    },
                    Object.assign(
                        {
                            type: 'slider',
                            radiusAxisIndex: 0,
                            left: '95%',
                            top: '10%',
                            bottom: '50%',
                            orient: 'vertical',
                            showDetail: false,
                            width: 20,
                        },
                        zoomStyle
                    ),
                ];
            } else if (zoomType === 'Angle Zoom') {
                dataZoom = [
                    {
                        type: 'inside',
                        angleAxisIndex: 0,
                    },
                    Object.assign(
                        {
                            type: 'slider',
                            angleAxisIndex: 0,
                            showDetail: false,
                            height: 20,
                        },
                        zoomStyle
                    ),
                ];
            } else {
                dataZoom = [];
            }
            return dataZoom;
        }

        /**
         * @name initializeEvents
         * @desc creates the event layer
         * @returns {void}
         */
        function initializeEvents() {
            // Event: On single click open new tab with wikipedia page of selected label
            polarBarChart.on('click', eChartClicked);
            polarBarChart.on('mouseover', eChartMouse);
            polarBarChart.on('mouseout', eChartMouseOut);
            polarBarChart._dom.addEventListener('mouseout', mouseOut);

            // Context Menu
            polarBarChart.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [eChartsConfig.legendLabels],
                });
            });
            polarBarChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            // it is necessary to initialize comment mode so the nodes are painted
            EchartsHelper.initializeCommentMode({
                comments: eChartsConfig.comments,
                currentMode: eChartsConfig.currentMode,
                saveCb: eChartsConfig.callbacks.commentMode.onSave,
            });

            if (
                typeof eChartsConfig.callbacks.defaultMode.onKeyUp ===
                    'function' ||
                typeof eChartsConfig.callbacks.defaultMode.onKeyDown ===
                    'function'
            ) {
                polarBarChart._dom.tabIndex = 1;
                if (
                    typeof eChartsConfig.callbacks.defaultMode.onKeyUp ===
                    'function'
                ) {
                    polarBarChart._dom.addEventListener('keyup', function (e) {
                        eChartsConfig.callbacks.defaultMode.onKeyUp({
                            eventType: 'onKeyUp',
                            key: e.key,
                            event: e,
                            keyCode: e.keyCode,
                        });
                    });
                }
                if (
                    typeof eChartsConfig.callbacks.defaultMode.onKeyDown ===
                    'function'
                ) {
                    polarBarChart._dom.addEventListener(
                        'keydown',
                        function (e) {
                            eChartsConfig.callbacks.defaultMode.onKeyDown({
                                eventType: 'onKeyDown',
                                key: e.key,
                                event: e,
                                keyCode: e.keyCode,
                            });
                        }
                    );
                }
            }
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
         * @returns {void}
         */
        function eventCallback(event, type) {
            var returnObj = {
                data: {},
            };
            returnObj.data[eChartsConfig.legendLabels] = [event.name];
            eChartsConfig.callbacks.defaultMode[type](returnObj);
            clickTimer = null;
            clearTimeout(hoverTimer);
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
         * @name toggleMode
         * @desc switches the jv mode to the new specified mode
         * @returns {void}
         */
        function toggleMode() {
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
        }

        /**
         * @name resizeViz
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz() {
            polarBarChart.resize();
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
