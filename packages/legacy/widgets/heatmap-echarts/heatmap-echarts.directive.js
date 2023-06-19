/* eslint-disable one-var */
/* eslint-disable valid-jsdoc */
'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';
import './heatmap-echarts.service.js';

/**
 *
 * @name heatmap-echarts
 * @desc heatmap-echarts chart directive for creating and visualizing a heatmap
 */

export default angular
    .module('app.heatmap-echarts.directive', ['app.heatmap.service'])
    .directive('heatmapEcharts', heatmapEcharts);

heatmapEcharts.$inject = ['semossCoreService', 'heatmapService'];

function heatmapEcharts(semossCoreService, heatmapService) {
    heatmapChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: heatmapChartLink,
    };

    function heatmapChartLink(scope, ele, attrs, ctrl) {
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
            heatmapChart,
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
            // TODO correct way to do this is remove the brush via eharts API instead of repainting
            removeBrushListener = scope.widgetCtrl.on('remove-brush', paint);

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
            var selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.heatmap-echarts'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                groupBy = {},
                groupByInstance,
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                ),
                uiOptions = angular.extend(sharedTools, individiualTools),
                colorArray = [],
                aliasArray = [],
                i,
                j;

            if (groupByInfo && groupByInfo.viewType) {
                groupBy = formatDataForGroupBy(data, groupByInfo);
                data = groupBy.data;
                groupByInstance = groupBy.name;
            }

            // Zoom Out / Unfilter on emtpy brush hack
            // TODO: check if data is empty initially
            for (j = 0; j < keys.length; j++) {
                if (keys[j].model !== 'tooltip') {
                    aliasArray.push(keys[j].alias);
                }
            }
            // if (data && data.values.length === 0) {
            //     return;
            // }

            // Color panel change...echarts will only accept an Array
            if (typeof uiOptions.color !== Array) {
                for (i in uiOptions.color) {
                    if (uiOptions.color.hasOwnProperty(i)) {
                        colorArray.push(uiOptions.color[i]);
                    }
                }

                uiOptions.color = colorArray;
            }

            eChartsConfig = heatmapService.getConfig(
                'heatmap',
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
            eChartsConfig.echartsMode = EchartsHelper.getEchartsMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.groupByInfo = groupByInfo;
            eChartsConfig.dimensions = getDimensions();
            setContainerSize();
            paint();
        }

        /**
         * @name getDimensions
         * @desc calculates the desired grid height and width
         * @return {void}
         */
        function getDimensions() {
            var boxHeight = 25,
                boxWidth = 25,
                boxLength = 25,
                gridHeight =
                    eChartsConfig.yAxisConfig[0].data.length * boxHeight,
                gridWidth = eChartsConfig.xAxisConfig[0].data.length * boxWidth,
                topMargin = 200,
                bottomMargin = 0,
                leftMargin = 100,
                rightMargin = 60,
                canvasHeight = 0,
                canvasWidth,
                canvasArea,
                maxCanvasHeight = 8129,
                maxCanvasWidth = maxCanvasHeight,
                maxCanvasArea = 268435456;

            // Canvas max height/width of IE: 8,192 px
            // Canvas max height/width of Chrome & Firefox: 32,767 px
            // Canvas max areah of IE: N/A
            // Canvas max area of Chrome: 268,435,456 px
            if (!eChartsConfig.options.fitToView) {
                if (eChartsConfig.options.squareSize) {
                    boxLength = eChartsConfig.options.squareSize;
                    gridHeight =
                        eChartsConfig.yAxisConfig[0].data.length * boxLength;
                    gridWidth =
                        eChartsConfig.xAxisConfig[0].data.length * boxLength;
                }
                if (eChartsConfig.options.squareHeight) {
                    boxHeight = eChartsConfig.options.squareHeight;
                    gridHeight =
                        eChartsConfig.yAxisConfig[0].data.length * boxHeight;
                }
                if (eChartsConfig.options.squareWidth) {
                    boxWidth = eChartsConfig.options.squareWidth;
                    gridWidth =
                        eChartsConfig.xAxisConfig[0].data.length * boxWidth;
                }
                if (
                    eChartsConfig.groupByInfo &&
                    eChartsConfig.groupByInfo.viewType === 'Individual Instance'
                ) {
                    bottomMargin += 40;
                }
                canvasHeight = topMargin + gridHeight + bottomMargin;
                canvasWidth = leftMargin + gridWidth + rightMargin;
                canvasArea = canvasHeight * canvasWidth;
                if (
                    canvasHeight >= maxCanvasHeight ||
                    canvasWidth >= maxCanvasWidth ||
                    canvasArea >= maxCanvasArea
                ) {
                    eChartsConfig.options.fitToView = true;

                    scope.widgetCtrl.alert(
                        'warn',
                        'Forcing canvas to fit panel due to length of axis values.'
                    );
                }
            }

            return {
                gridHeight: gridHeight,
                gridWidth: gridWidth,
                topMargin: topMargin,
                bottomMargin: bottomMargin,
                leftMargin: leftMargin,
                rightMargin: rightMargin,
            };
        }

        /**
         * @name setContainerSize
         * @desc changes heatmap container to be a size that keeps squares from overlapping
         *       as in jvHeatMap
         * @return {void}
         */
        function setContainerSize() {
            var chartContainer = ele[0].childNodes[0],
                parent = ele[0],
                width,
                height;
            parent.style.overflow = 'auto';
            parent.style.position = 'absolute';
            parent.style.top = 0;
            parent.style.bottom = '10px';
            parent.style.left = 0;
            parent.style.right = 0;

            if (eChartsConfig.options.widthFitToScreen) {
                width = '100%';
            }

            if (eChartsConfig.options.heightFitToScreen) {
                height = '100%';
            }

            if (eChartsConfig.options.fitToView) {
                chartContainer.style.width = '100%';
                chartContainer.style.height = '100%';
                return;
            }

            if (!height) {
                if (
                    eChartsConfig.dimensions.topMargin +
                        eChartsConfig.dimensions.gridHeight +
                        eChartsConfig.dimensions.bottomMargin >
                    parent.clientHeight
                ) {
                    height =
                        eChartsConfig.dimensions.topMargin +
                        eChartsConfig.dimensions.gridHeight +
                        eChartsConfig.dimensions.bottomMargin +
                        'px';
                } else {
                    height = '100%';
                }
            }

            if (!width) {
                if (
                    eChartsConfig.dimensions.leftMargin +
                        eChartsConfig.dimensions.gridWidth +
                        eChartsConfig.dimensions.rightMargin >
                    parent.clientWidth
                ) {
                    width =
                        eChartsConfig.dimensions.leftMargin +
                        eChartsConfig.dimensions.gridWidth +
                        eChartsConfig.dimensions.rightMargin +
                        'px';
                } else {
                    width = '100%';
                }
            }

            chartContainer.style.width = width;
            chartContainer.style.height = height;
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
            if (heatmapChart) {
                heatmapChart.clear();
                heatmapChart.dispose();
            }
            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            heatmapChart = echarts.init(ele[0].firstElementChild);
            let option = {},
                i,
                dataEmpty;

            option.title = [];

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
                confine: true,
                formatter: function (info) {
                    let k,
                        formatDimension,
                        tooltipType,
                        dataTypes = eChartsConfig.dataTypes,
                        temp =
                            '<b>' +
                            cleanValue(eChartsConfig.xName) +
                            ':</b> ' +
                            visualizationUniversal.formatValue(
                                info.data.value[0],
                                dataTypes.xType
                            ) +
                            '<br>' +
                            '<b>' +
                            cleanValue(eChartsConfig.yName) +
                            ':</b> ' +
                            visualizationUniversal.formatValue(
                                info.data.value[1],
                                dataTypes.yType
                            ) +
                            '<br>' +
                            '<b>' +
                            info.marker +
                            cleanValue(eChartsConfig.heat) +
                            ':</b> ' +
                            visualizationUniversal.formatValue(
                                info.data.value[2],
                                dataTypes.heatType
                            ) +
                            '<br>',
                        t = info.data.tip;

                    if (info.data.tip) {
                        t.forEach(function (el, j) {
                            let tempTip = el;
                            if (el.length > 40) {
                                tempTip = el.substring(0, 40);
                                tempTip += '...';
                            }

                            // get primary db format type
                            for (k = 0; k < eChartsConfig.keys.length; k++) {
                                var cleanName = eChartsConfig.keys[
                                    k
                                ].alias.replace(/_/g, ' ');
                                if (cleanName === eChartsConfig.tooltips[j]) {
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
                                        eChartsConfig.options.formatDataValues
                                            .formats[i].dimension;
                                    cleanName = formatDimension.replace(
                                        /_/g,
                                        ' '
                                    );
                                    if (
                                        cleanName === eChartsConfig.tooltips[j]
                                    ) {
                                        tooltipType =
                                            eChartsConfig.options
                                                .formatDataValues.formats[i];
                                    }
                                }
                            }

                            temp +=
                                '<b>' +
                                cleanValue(eChartsConfig.tooltips[j]) +
                                ':</b> ' +
                                visualizationUniversal.formatValue(
                                    tempTip,
                                    tooltipType
                                ) +
                                '<br>';
                        });
                    }
                    return temp;
                },
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
                // position: 'bottom'
            };
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
            option.brush = {
                xAxisIndex: 0,
                brushStyle: {
                    borderWidth: 1,
                    color: 'rgba(120,140,180,0.15)',
                    borderColor: 'rgba(120,140,180,0.35)',
                },
            };

            if (eChartsConfig.title && eChartsConfig.title.text) {
                option.title.push({
                    chartTitle: true,
                    show: eChartsConfig.title.show,
                    text: eChartsConfig.title.text,
                    textStyle: {
                        fontSize: eChartsConfig.title.fontSize || 18,
                        color: eChartsConfig.title.fontColor || '#000000',
                        fontWeight: eChartsConfig.title.fontWeight || 'normal',
                        fontFamily:
                            eChartsConfig.title.fontFamily || 'sans-serif',
                    },
                    left: eChartsConfig.title.align,
                    top: '5%',
                    // subtext: 'this is an example of a sub text'
                });
            }
            option.title.push({
                show: !eChartsConfig.options.toggleLegend,
                text: getCleanTitle(),
                top: '5px',
                left: '10px',
                textStyle: {
                    color: eChartsConfig.options.legend.fontColor || '#000000',
                    fontSize:
                        parseFloat(eChartsConfig.options.legend.fontSize) || 12,
                    fontFamily:
                        eChartsConfig.options.legend.fontFamily || 'Inter',
                    fontWeight: eChartsConfig.options.legend.fontWeight || 400,
                },
            });
            option.xAxis = semossCoreService.utility.freeze(
                eChartsConfig.xAxisConfig
            );
            option.yAxis = semossCoreService.utility.freeze(
                eChartsConfig.yAxisConfig
            );

            // set the label width to see how to place the heatmap so that the labels show & don't get cut off
            // refactor for heat map
            if (option.xAxis[0].data) {
                let widths = EchartsHelper.getLabelWidth(
                    ele[0],
                    option.xAxis[0].data,
                    option.xAxis[0].axisLabel.rotate,
                    option.xAxis[0].maxLength,
                    'x',
                    option.xAxis[0].fontSize
                );
                option.xAxis[0].labelWidth = widths[0];
            }

            if (option.yAxis[0].data) {
                let widths = EchartsHelper.getLabelWidth(
                    ele[0],
                    option.yAxis[0].data,
                    option.yAxis[0].axisLabel.rotate,
                    option.yAxis[0].maxLength,
                    'y',
                    option.yAxis[0].fontSize
                );
                option.yAxis[0].labelWidth = widths[0];
            }

            option.grid = customizeGrid(
                option.title,
                option.yAxis,
                option.xAxis
            );
            option.visualMap = customizeLegend(
                eChartsConfig.options,
                eChartsConfig.maxHeat,
                eChartsConfig.minHeat,
                eChartsConfig.legendLabelStyle
            );
            option.dataZoom = toggleZoom(eChartsConfig.options.dataZoom);
            option.series = eChartsConfig.data;

            option.textStyle = {
                fontFamily: 'Inter',
            };
            // use configuration item and data specified to show chart
            EchartsHelper.setOption(heatmapChart, option);
            // Add event listeners
            initializeEvents();
        }

        /**
         * @name getCleanTitle
         * @desc clean name of heat dimension
         * @returns {string} cclean name
         */
        function getCleanTitle() {
            var title = cleanValue(eChartsConfig.heat);

            if (title.length > 24) {
                return title.substring(0, 24) + '...';
            }
            return title;
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

            // Context Menu
            heatmapChart.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [eChartsConfig.xName, eChartsConfig.yName],
                });
            });
            heatmapChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            if (eChartsConfig.echartsMode) {
                heatmapChart.dispatchAction({
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
                EchartsHelper.initializeBrush(heatmapChart, {
                    xLabels: eChartsConfig.xAxisConfig[0].data,
                    legendLabels: eChartsConfig.xName,
                    yLabels: eChartsConfig.yAxisConfig[0].data,
                    yLegendLabels: eChartsConfig.yName,
                    brushCb: eChartsConfig.callbacks.defaultMode.onBrush,
                    repaint: paint,
                    openContextMenu: scope.visualizationCtrl.openContextMenu,
                    setContextMenuDataFromBrush:
                        scope.visualizationCtrl.setContextMenuDataFromBrush,
                    type: 'heatmap',
                });

                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    heatmapChart,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: eChartsConfig.legendLabels,
                        getCurrentEvent: function () {
                            return scope.widgetCtrl.getEvent('currentEvent');
                        },
                        vizType: 'heatmap',
                        heatData: {
                            x: eChartsConfig.xName,
                            y: eChartsConfig.yName,
                        },
                    }
                );
            }

            EchartsHelper.initializeCommentMode({
                comments: eChartsConfig.comments,
                currentMode: eChartsConfig.currentMode,
                saveCb: eChartsConfig.callbacks.commentMode.onSave,
            });
        }

        /**
         * @name customizeGrid
         * @param {string} title title
         * @param {*} yAxis yaxis config
         * @param {*} xAxis xaxis config
         * @desc sets grid based on whether or not axis labels are present
         * @returns {Obj} - array of objects defining Data Zoom settings
         */
        function customizeGrid(title, yAxis, xAxis) {
            var grid = {
                right: eChartsConfig.dimensions.rightMargin, // 60,
                bottom: eChartsConfig.dimensions.bottomMargin,
                left: eChartsConfig.dimensions.leftMargin,
            };
            if (!eChartsConfig.options.fitToView) {
                if (!eChartsConfig.options.heightFitToScreen) {
                    grid.height = eChartsConfig.dimensions.gridHeight;
                }
                if (!eChartsConfig.options.widthFitToScreen) {
                    grid.width = eChartsConfig.dimensions.gridWidth;
                }
            }
            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType === 'Individual Instance'
            ) {
                grid.bottom += 40;
            }
            yAxis[0].nameGap += yAxis[0].labelWidth + 15;
            grid.left = yAxis[0].nameGap + 20;
            xAxis[0].nameGap += xAxis[0].labelWidth + 30;
            grid.top = xAxis[0].nameGap + 100;
            // TODO these numbers can go lower than 0....need to fix
            // grid.height -= xAxis[0].nameGap; // prevents cutoff at the bottom of the grid when nameGap increases
            // grid.width -= yAxis[0].nameGap; // prevents cutoff at the right of the grid when nameGap increases

            if (title[0].hasOwnProperty('chartTitle')) {
                grid.top += title[0].textStyle.fontSize + 50;
                title[1].top = title[0].textStyle.fontSize + 50;
            }
            return grid;
        }

        /**
         * @name toggleZoom
         * @desc toggles Data Zoom feature
         * @param {object} style - data zoom style
         * @returns {Array} - array of objects defining Data Zoom settings
         */
        function toggleZoom(style) {
            var dataZoom = [],
                xSlider,
                xInside,
                ySlider,
                bottom = 20,
                yInside,
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
            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType === 'Individual Instance'
            ) {
                bottom += 40;
            }
            if (eChartsConfig.options.toggleZoomXEnabled === true) {
                eChartsConfig.options.toggleZoomX =
                    !eChartsConfig.options.toggleZoomX;
            }
            if (eChartsConfig.options.toggleZoomX) {
                xSlider = Object.assign(
                    {
                        type: 'slider',
                        show: true,
                        xAxisIndex: 0,
                        bottom: bottom + 'px',
                        showDetail: false,
                        // CustomStyle
                        height: 20,
                    },
                    zoomStyle
                );

                dataZoom.push(xSlider);
            }

            if (eChartsConfig.options.toggleZoomY) {
                ySlider = Object.assign(
                    {
                        type: 'slider',
                        show: true,
                        yAxisIndex: 0,
                        right: '20px',
                        showDetail: false,
                        // CustomStyle
                        width: 20,
                    },
                    zoomStyle
                );

                dataZoom.push(ySlider);
            }

            if (eChartsConfig.options.fitToView) {
                xInside = {
                    type: 'inside',
                    xAxisIndex: 0,
                };

                yInside = {
                    type: 'inside',
                    yAxisIndex: 0,
                };
                dataZoom.push(xInside, yInside);
            } else {
                if (eChartsConfig.options.widthFitToScreen) {
                    xInside = {
                        type: 'inside',
                        xAxisIndex: 0,
                    };
                    dataZoom.push(xInside);
                }

                if (eChartsConfig.options.heightFitToScreen) {
                    yInside = {
                        type: 'inside',
                        yAxisIndex: 0,
                    };
                    dataZoom.push(yInside);
                }
            }
            return dataZoom;
        }

        /**
         * @name customizeLegend
         * @desc sets the legend type
         * @param {boolean} options - uiOptions
         * @param {number} maxValue - max value of heat dimension
         * @param {number} minValue - max value of heat dimension
         * @param {object} legendStyle - legend label styles
         * @returns {object} - object of visual map settings
         */
        function customizeLegend(options, maxValue, minValue, legendStyle) {
            var visualMap = {};
            visualMap.type = options.heatmapLegend;
            if (options.heatRange) {
                if (
                    options.heatRange.min.show &&
                    typeof options.heatRange.min.value !== 'undefined'
                ) {
                    visualMap.min = options.heatRange.min.value;
                } else {
                    visualMap.min = minValue;
                }
                if (
                    options.heatRange.max.show &&
                    typeof options.heatRange.max.value !== 'undefined'
                ) {
                    visualMap.max = options.heatRange.max.value;
                } else {
                    visualMap.max = maxValue;
                }
            } else {
                visualMap.min = minValue;
                visualMap.max = maxValue;
            }

            visualMap.precision =
                minValue !== Math.floor(minValue) ||
                maxValue !== Math.floor(maxValue)
                    ? 2
                    : 0;
            visualMap.calculable = true;
            visualMap.orient = 'horizontal';

            // /set min and max for chart title size
            // /set the top of visual to position based on title existence
            if (options.chartTitle.text.length) {
                visualMap.top = options.chartTitle.fontSize + 65;
            } else {
                visualMap.top = '25px';
            }
            visualMap.left = '10px';
            // visualMap.text = ['High', 'Low'];
            visualMap.show = !eChartsConfig.options.toggleLegend;
            visualMap.formatter = function (value) {
                return visualizationUniversal.formatValue(
                    value,
                    eChartsConfig.dataTypes.heatType
                );
            };

            if (options.heatmapLegend === 'piecewise') {
                visualMap.splitNumber = options.heatBuckets || 5;
            } else {
                visualMap.itemHeight = 100;
            }

            if (typeof options.heatmapColor !== 'undefined') {
                visualMap.inRange = {
                    color: options.heatmapColor,
                };
            } else {
                visualMap.inRange = {
                    color: [
                        '#4575b4',
                        '#74add1',
                        '#abd9e9',
                        '#e0f3f8',
                        '#ffffbf',
                        '#EECF96',
                        '#DD9080',
                        '#CE6661',
                        '#C0444E',
                    ],
                };
            }

            visualMap.textStyle = legendStyle;

            return visualMap;
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
            setContainerSize();
            heatmapChart.resize();
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
