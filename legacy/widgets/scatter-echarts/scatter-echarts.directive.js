'use strict';

import * as echarts from 'echarts';
import './scatter-echarts.service.js';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';

/**
 *
 * @name scatter-echarts
 * @desc scatter-echarts chart directive for creating and visualizing a scatter chart
 */

export default angular
    .module('app.scatter-echarts.directive', ['app.scatter-echarts.service'])
    .directive('scatterEcharts', scatterEcharts);

scatterEcharts.$inject = ['VIZ_COLORS', 'semossCoreService', 'scatterService'];

function scatterEcharts(VIZ_COLORS, semossCoreService, scatterService) {
    scatterChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: scatterChartLink,
    };

    function scatterChartLink(scope, ele, attrs, ctrl) {
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
            scatterChart,
            clientHeight,
            clientWidth,
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
            var individual =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.Scatter'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.Scatter'
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                groupBy = {},
                groupByInstance,
                groupedData,
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                uiOptions,
                n;

            uiOptions = angular.extend(sharedTools, individual);
            uiOptions.colorBy = colorBy;

            if (groupByInfo && groupByInfo.viewType) {
                if (groupByInfo.viewType === 'Individual Instance') {
                    groupBy = formatDataForGroupByIndividual(data, groupByInfo);
                    data = groupBy.data;
                    groupByInstance = groupBy.name;
                } else if (groupByInfo.viewType === 'All Instances') {
                    groupedData = formatDataForGroupByAll(data, groupByInfo);
                    groupByInfo.tempData = groupedData;

                    groupByInfo.uniqueInstances = [];
                    for (n = 0; n < Object.keys(groupedData).length; n++) {
                        groupByInfo.uniqueInstances.push(
                            Object.keys(groupedData)[n]
                        );
                    }
                }
            }

            eChartsConfig = scatterService.getEchartsConfig(
                'scatter',
                data,
                uiOptions,
                keys,
                colorBy,
                groupByInstance,
                groupByInfo
            );
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            eChartsConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            eChartsConfig.headersGlobal = data.headers;
            eChartsConfig.echartsMode = EchartsHelper.getEchartsMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.groupByInfo = groupByInfo;
            determineResize();
            // manually syncing the toggleZoomX to the storeService because echarts-helper can automatically set zoom to true based on # of instances in the view
            semossCoreService.set(
                'widgets.' +
                    scope.widgetCtrl.widgetId +
                    '.view.visualization.tools.shared.toggleZoomX',
                uiOptions.toggleZoomX
            );
            paint();
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
         * @name formatDataForGroupByAll
         * @desc formats data when Group By All Instances exists
         * @param {object} data orginial data
         * @param {object} groupBy groupBy object
         * @returns {void}
         */
        function formatDataForGroupByAll(data, groupBy) {
            var groupByIndex,
                i,
                n,
                dataObj = {};

            groupByIndex = data.headers.indexOf(groupBy.selectedDim);
            data.headers.splice(groupByIndex, 1);
            data.rawHeaders.splice(groupByIndex, 1);

            for (n = 0; n < groupBy.uniqueInstances.length; n++) {
                dataObj[groupBy.uniqueInstances[n]] = [];
                for (i = 0; i < data.values.length; i++) {
                    if (
                        data.values[i][groupByIndex] ===
                        groupBy.uniqueInstances[n]
                    ) {
                        data.values[i].splice(groupByIndex, 1);
                        dataObj[groupBy.uniqueInstances[n]].push(
                            data.values[i]
                        );
                    }
                }

                if (dataObj[groupBy.uniqueInstances[n]].length === 0) {
                    delete dataObj[groupBy.uniqueInstances[n]];
                }
            }
            return dataObj;
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (scatterChart) {
                scatterChart.clear();
                scatterChart.dispose();
            }
            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            scatterChart = echarts.init(ele[0].firstElementChild);

            var option = {},
                i,
                dataEmpty,
                facetLayout,
                titleFontSize;

            if (
                eChartsConfig.options.facetHeaders &&
                eChartsConfig.options.facetHeaders.titleFontSize
            ) {
                titleFontSize =
                    eChartsConfig.options.facetHeaders.titleFontSize;
            } else {
                titleFontSize = 18;
            }

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType === 'Individual Instance'
            ) {
                dataEmpty = true;
                for (i = 0; i < eChartsConfig.data.length; i++) {
                    if (eChartsConfig.data[i].data.length !== 0) {
                        dataEmpty = false;
                        break;
                    }
                }

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

            option.backgroundColor = eChartsConfig.backgroundColorStyle;

            option.toolbox = {
                show: false,
                left: '2',
                bottom: '5',
                orient: 'vertical',
                feature: {
                    brush: {
                        type: ['rect', 'polygon'],
                        title: {
                            rect: 'Brush',
                            polygon: 'Polygon Brush',
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
            option.dataZoom = toggleZoom(
                eChartsConfig.options.toggleZoomX,
                eChartsConfig.options.toggleZoomY,
                eChartsConfig.options.dataZoom
            );
            option.tooltip = {
                show: eChartsConfig.options.showTooltips,
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
                formatter: function (obj) {
                    var value = obj.value,
                        returnString = '',
                        valueString = '',
                        labelString = '',
                        key,
                        formatType,
                        yType,
                        xType,
                        dataTypes = eChartsConfig.dataTypes,
                        keys = eChartsConfig.keys;

                    // get primary data type of x and y Axis
                    for (key in keys) {
                        if (keys[key].model === 'y') {
                            yType = dataTypes[keys[key].alias][0];
                        }
                        if (keys[key].model === 'x') {
                            xType = dataTypes[keys[key].alias][0];
                        }
                    }

                    if (obj.componentType === 'markLine') {
                        if (obj.data.hasOwnProperty('yAxis')) {
                            formatType = yType;
                        } else if (obj.data.hasOwnProperty('xAxis')) {
                            formatType = xType;
                        }
                        return (
                            obj.marker +
                            '<b>' +
                            cleanValue(obj.name) +
                            '</b>: ' +
                            visualizationUniversal.formatValue(
                                obj.value,
                                formatType
                            )
                        );
                    }

                    if (obj.componentType === 'markArea') {
                        let xStart = visualizationUniversal.formatValue(
                                obj.data.coord[0][0],
                                xType
                            ),
                            xEnd = visualizationUniversal.formatValue(
                                obj.data.coord[1][0],
                                xType
                            ),
                            yStart = visualizationUniversal.formatValue(
                                obj.data.coord[0][1],
                                yType
                            ),
                            yEnd = visualizationUniversal.formatValue(
                                obj.data.coord[1][1],
                                yType
                            );
                        labelString +=
                            '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:';
                        labelString += obj.data.itemStyle.color + ';"></span>';
                        labelString +=
                            '<b>' + cleanValue(obj.name) + '</b><br>';
                        labelString +=
                            'X Range: [' + xStart + ' - ' + xEnd + ']<br>';
                        labelString +=
                            'Y Range: [' + yStart + ' - ' + yEnd + ']<br>';
                        return labelString;
                    }

                    for (key in eChartsConfig.chartMapping) {
                        if (eChartsConfig.chartMapping.hasOwnProperty(key)) {
                            formatType = dataTypes[key][0];
                            if (key === eChartsConfig.legendLabels) {
                                labelString =
                                    obj.marker +
                                    '<b>' +
                                    visualizationUniversal.formatValue(
                                        value[eChartsConfig.chartMapping[key]],
                                        formatType
                                    ) +
                                    '</b>' +
                                    '<br>';
                            } else {
                                valueString +=
                                    cleanValue(key) +
                                    ': ' +
                                    visualizationUniversal.formatValue(
                                        value[eChartsConfig.chartMapping[key]],
                                        formatType
                                    ) +
                                    '<br>';
                            }
                        }
                    }
                    returnString = labelString.concat('', valueString);

                    return returnString;
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
            };

            if (
                !(
                    eChartsConfig.groupByInfo &&
                    eChartsConfig.groupByInfo.viewType === 'All Instances'
                )
            ) {
                // TODO enable brush for Facet All Instances (pass in correct labelIndex)
                option.brush = {
                    xAxisIndex: 0,
                    brushStyle: {
                        borderWidth: 1,
                        color: 'rgba(120,140,180,0.15)',
                        borderColor: 'rgba(120,140,180,0.35)',
                    },
                };
            }
            option.legend = {
                data: eChartsConfig.legendHeaders,
                formatter: function (name) {
                    return cleanValue(name);
                },
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
                type: 'scroll',
                pageButtonPosition: 'start',
                textStyle: eChartsConfig.legendLabelStyle,
            };

            option.xAxis = eChartsConfig.xAxisConfig;
            option.yAxis = eChartsConfig.yAxisConfig;
            option.series = eChartsConfig.data;
            option.textStyle = {
                fontFamily: 'Inter',
            };

            if (eChartsConfig.title && eChartsConfig.title.text) {
                option.title = {
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
                    // subtext: 'this is an example of a sub text'
                };
                ///set option legend to move down along with grid
                option.legend.top = option.title.textStyle.fontSize;
            }

            // Options specific to Facet All Instances
            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType === 'All Instances'
            ) {
                facetLayout = customizeFacetLayout();
                option.grid = facetLayout.grid;
                option.title = facetLayout.title.concat([
                    {
                        text:
                            eChartsConfig.options.facetHeaders.titleName ||
                            'All Instances of ' +
                                eChartsConfig.groupByInfo.selectedDim.replace(
                                    /_/g,
                                    ' '
                                ),
                        top: '20px',
                        left: 'center',
                        textStyle: {
                            fontSize: titleFontSize,
                        },
                    },
                ]);
            } else {
                option.grid = setGrid(
                    eChartsConfig.options.toggleZoomX,
                    eChartsConfig.options.toggleZoomY,
                    option.title
                );
            }
            // use configuration item and data specified to show chart
            EchartsHelper.setOption(scatterChart, option);

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
         * @name customizeFacetLayout
         * @desc defines grid, title, xAxis, yAxis, and series arrays used in echarts options configuration
         * @returns {obj} - object of grid dimensions
         */
        function customizeFacetLayout() {
            var i,
                gridPixel,
                gridPercent,
                gridArray = [],
                title,
                titleArray = [],
                rowIndex,
                columnIndex,
                calculatedGridWidth,
                calculatedGridHeight,
                calculatedSpacingX,
                calculatedSpacingY,
                facetPadding = {
                    // padding within the top and left of the panel
                    top: 100,
                    right: 120,
                    bottom: 100,
                    left: 120,
                };

            for (
                i = 0;
                i < eChartsConfig.groupByInfo.uniqueInstances.length;
                i++
            ) {
                rowIndex = Math.floor(
                    i / eChartsConfig.options.facetHeaders.numberColumns
                );
                columnIndex =
                    i % eChartsConfig.options.facetHeaders.numberColumns;

                calculatedGridWidth =
                    eChartsConfig.options.facetHeaders.grid.width;
                calculatedGridHeight =
                    eChartsConfig.options.facetHeaders.grid.height;
                calculatedSpacingX =
                    eChartsConfig.options.facetHeaders.spacing.x;
                calculatedSpacingY =
                    eChartsConfig.options.facetHeaders.spacing.y;

                if (eChartsConfig.options.facetHeaders.unitType === '%') {
                    calculatedGridWidth =
                        (ele[0].clientWidth *
                            eChartsConfig.options.facetHeaders.grid.width) /
                        100;
                    calculatedGridHeight =
                        (ele[0].clientHeight *
                            eChartsConfig.options.facetHeaders.grid.height) /
                        100;
                    calculatedSpacingX =
                        (ele[0].clientWidth *
                            eChartsConfig.options.facetHeaders.spacing.x) /
                        100;
                    calculatedSpacingY =
                        (ele[0].clientHeight *
                            eChartsConfig.options.facetHeaders.spacing.y) /
                        100;
                }

                gridPixel = {
                    top:
                        facetPadding.top +
                        (calculatedGridHeight + calculatedSpacingY) * rowIndex +
                        'px',
                    left:
                        facetPadding.left +
                        (calculatedGridWidth + calculatedSpacingX) *
                            columnIndex +
                        'px',
                    width: calculatedGridWidth + 'px',
                    height: calculatedGridHeight + 'px',
                };

                if (eChartsConfig.options.facetHeaders.customLayout) {
                    // Center everything
                    gridPixel.left =
                        parseFloat(gridPixel.left) +
                        (clientWidth -
                            facetPadding.left -
                            facetPadding.right -
                            calculatedGridWidth *
                                eChartsConfig.options.facetHeaders
                                    .numberColumns -
                            calculatedSpacingX *
                                (eChartsConfig.options.facetHeaders
                                    .numberColumns -
                                    1)) /
                            2 +
                        'px';
                }

                gridPercent = {
                    top: (parseFloat(gridPixel.top) / clientHeight) * 100 + '%',
                    left:
                        (parseFloat(gridPixel.left) / clientWidth) * 100 + '%',
                    width:
                        (parseFloat(gridPixel.width) / clientWidth) * 100 + '%',
                    height:
                        (parseFloat(gridPixel.height) / clientHeight) * 100 +
                        '%',
                };

                gridArray.push(gridPercent);

                title = getFacetHeaders(
                    eChartsConfig.groupByInfo.uniqueInstances[i],
                    gridPercent,
                    gridPixel,
                    eChartsConfig.options.facetHeaders
                );
                titleArray.push(title);

                // Format Axes
                if (columnIndex === 0) {
                    if (eChartsConfig.options.editYAxis) {
                        eChartsConfig.yAxisConfig[i].axisLabel.show =
                            eChartsConfig.options.editYAxis.values;
                    } else {
                        eChartsConfig.yAxisConfig[i].axisLabel.show = true;
                        eChartsConfig.yAxisConfig[i].name = null;
                    }
                } else {
                    eChartsConfig.yAxisConfig[i].name = null;
                    eChartsConfig.yAxisConfig[i].axisLabel.show = false;
                }
                if (!eChartsConfig.options.editXAxis) {
                    eChartsConfig.xAxisConfig[i].name = null;
                    eChartsConfig.xAxisConfig[i].axisLabel.show = false;
                }
            }
            return {
                grid: gridArray,
                title: titleArray,
            };
        }

        /**
         * @name getFacetHeaders
         * @desc dynamically adjusts header size to not overlap grid
         * @param {string} text - header text
         * @param {obj} gridPercent - grid object (percent)
         * @param {obj} gridPixel - grid object (percent)
         * @param {obj} facetHeaders - uiOptions.facetHeaders
         * @returns {obj} - object of grid dimensions
         */
        function getFacetHeaders(text, gridPercent, gridPixel, facetHeaders) {
            var title = {},
                fontSize;

            if (typeof text === 'string') {
                title.text = text.replace(/_/g, ' ');
            } else {
                title.text = text;
            }

            title.left =
                parseFloat(gridPercent.left) +
                parseFloat(gridPercent.width) / 2 +
                '%';

            if (facetHeaders && facetHeaders.headerFontSize) {
                fontSize = facetHeaders.headerFontSize;
                title.top =
                    Number(
                        gridPixel.top.substring(0, gridPixel.top.indexOf('px'))
                    ) -
                    facetHeaders.headerFontSize -
                    8 +
                    'px';
            } else {
                fontSize = 14;
                title.top =
                    Number(
                        gridPixel.top.substring(0, gridPixel.top.indexOf('px'))
                    ) -
                    fontSize -
                    8 +
                    'px';
            }

            title.textAlign = 'center';
            title.textStyle = {
                fontSize: fontSize,
            };
            return title;
        }

        /**
         * @name setGrid
         * @desc sets grid dimensions based on whether or not datazoom is present
         * @param {bool} showX - boolean to show x zoom or not
         * @param {bool} showY - boolean to show y zoom or not
         * @param {obj} title - chart title
         * @returns {obj} - object of grid dimensions
         */
        function setGrid(showX, showY, title) {
            var grid = {
                right: 45,
                bottom: 45,
                left: 40,
                containLabel: true,
            };
            if (typeof title !== 'undefined' && title.text.length) {
                grid.top = title.textStyle.fontSize + 60;
            } else {
                grid.top = 60;
            }

            if (showX) {
                grid.bottom += 15;
            }

            if (showY) {
                grid.right += 15;
            }

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType === 'Individual Instance'
            ) {
                grid.bottom += 40;
            }
            return grid;
        }

        /**
         * @name initializeEvents
         * @desc creates the event layer
         * @returns {void}
         */
        function initializeEvents() {
            var xLabels = eChartsConfig.legendData,
                i,
                j,
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.Scatter'
                ),
                config = {
                    dataTable:
                        semossCoreService.visualization.getDataTableAlign(keys),
                };

            if (config.dataTable.series) {
                xLabels = [];
                for (i = 0; i < eChartsConfig.data.length; i++) {
                    if (
                        eChartsConfig.data[i].name === 'regression' &&
                        eChartsConfig.data[i].type === 'line' &&
                        eChartsConfig.options.regressionLine !== 'None'
                    ) {
                        continue;
                    }
                    xLabels[i] = [];
                    for (j = 0; j < eChartsConfig.data[i].data.length; j++) {
                        xLabels[i].push(
                            eChartsConfig.data[i].data[j].value[
                                eChartsConfig.chartMapping[
                                    config.dataTable.label
                                ]
                            ]
                        );
                    }
                }
            }

            if (typeof destroyListeners === 'function') {
                destroyListeners();
            }

            if (eChartsConfig.echartsMode) {
                scatterChart.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'brush',
                    brushOption: {
                        brushType: eChartsConfig.echartsMode,
                    },
                });
            }

            // Context Menu
            scatterChart.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [eChartsConfig.legendLabels],
                    idx: eChartsConfig.chartMapping[eChartsConfig.legendLabels],
                });
            });
            scatterChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            if (
                eChartsConfig.currentMode === 'defaultMode' ||
                eChartsConfig.currentMode === 'polygonBrushMode'
            ) {
                if (
                    !(
                        eChartsConfig.groupByInfo &&
                        eChartsConfig.groupByInfo.viewType === 'All Instances'
                    )
                ) {
                    EchartsHelper.initializeBrush(scatterChart, {
                        xLabels: xLabels,
                        legendLabels: eChartsConfig.legendLabels,
                        brushCb: eChartsConfig.callbacks.defaultMode.onBrush,
                        openContextMenu:
                            scope.visualizationCtrl.openContextMenu,
                        setContextMenuDataFromBrush:
                            scope.visualizationCtrl.setContextMenuDataFromBrush,
                        type: 'scatter',
                        repaint: paint,
                    });
                }

                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    scatterChart,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: eChartsConfig.legendLabels,
                        getCurrentEvent: function () {
                            return scope.widgetCtrl.getEvent('currentEvent');
                        },
                        vizType: 'scatter',
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
         * @name toggleZoom
         * @desc toggles Data Zoom feature
         * @param {bool} showX - boolean to show x zoom or not
         * @param {bool} showY - boolean to show y zoom or not
         * @param {object} style - data zoom style
         * @returns {Array} - array of objects defining Data Zoom settings
         */
        function toggleZoom(showX, showY, style) {
            var dataZoom = [],
                xSlider,
                xInside,
                ySlider,
                i,
                xAxisIndex,
                yAxisIndex,
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
                eChartsConfig.groupByInfo.viewType === 'All Instances'
            ) {
                xAxisIndex = [];
                yAxisIndex = [];
                for (
                    i = 0;
                    i < eChartsConfig.groupByInfo.uniqueInstances.length;
                    i++
                ) {
                    xAxisIndex.push(i);
                    yAxisIndex.push(i);
                }
            } else {
                xAxisIndex = 0;
                yAxisIndex = 0;
            }

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType === 'Individual Instance'
            ) {
                bottom += 40;
            }

            if (showX) {
                xSlider = Object.assign(
                    {
                        type: 'slider',
                        show: true,
                        // xAxisIndex: 0,
                        xAxisIndex: xAxisIndex,
                        bottom: bottom + 'px',
                        filterMode: 'empty',
                        showDetail: false,
                        // CustomStyle
                        height: 20,
                    },
                    zoomStyle
                );
                xInside = {
                    type: 'inside',
                    xAxisIndex: xAxisIndex,
                    filterMode: 'empty',
                };
                dataZoom.push(xSlider, xInside);
            }
            if (showY) {
                ySlider = Object.assign(
                    {
                        type: 'slider',
                        show: true,
                        yAxisIndex: yAxisIndex,
                        right: '20px',
                        filterMode: 'empty',
                        showDetail: false,
                        // CustomStyle
                        width: 20,
                    },
                    zoomStyle
                );
                yInside = {
                    type: 'inside',
                    yAxisIndex: yAxisIndex,
                    filterMode: 'empty',
                };
                dataZoom.push(ySlider, yInside);
            }
            return dataZoom;
        }

        /**
         * @name determineResize
         * @desc detemin parent and chart container dimensions if Facet exists
         * @returns {void}
         */
        function determineResize() {
            var chartContainer = ele[0].childNodes[0],
                parent = ele[0],
                numRows,
                numColumns,
                containerHeight,
                containerWidth,
                calculatedGridWidth,
                calculatedGridHeight,
                calculatedSpacingX,
                calculatedSpacingY,
                facetPadding = {
                    // padding within the top and left of the panel
                    top: 100,
                    right: 120,
                    bottom: 100,
                    left: 120,
                };

            parent.style.position = '';
            parent.style.top = '';
            parent.style.right = '';
            parent.style.bottom = '';
            parent.style.left = '';
            parent.style.overflowY = '';
            chartContainer.style.width = '';
            chartContainer.style.height = '';

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType === 'All Instances'
            ) {
                numColumns = eChartsConfig.options.facetHeaders.numberColumns;
                numRows = Math.ceil(
                    eChartsConfig.groupByInfo.uniqueInstances.length /
                        numColumns
                );
                calculatedGridWidth =
                    eChartsConfig.options.facetHeaders.grid.width;
                calculatedGridHeight =
                    eChartsConfig.options.facetHeaders.grid.height;
                calculatedSpacingX =
                    eChartsConfig.options.facetHeaders.spacing.x;
                calculatedSpacingY =
                    eChartsConfig.options.facetHeaders.spacing.y;

                if (
                    eChartsConfig.options.facetHeaders.customLayout &&
                    eChartsConfig.options.facetHeaders.unitType === '%'
                ) {
                    calculatedGridWidth =
                        (chartContainer.clientWidth *
                            eChartsConfig.options.facetHeaders.grid.width) /
                        100;
                    calculatedGridHeight =
                        (chartContainer.clientHeight *
                            eChartsConfig.options.facetHeaders.grid.height) /
                        100;
                    calculatedSpacingX =
                        (chartContainer.clientWidth *
                            eChartsConfig.options.facetHeaders.spacing.x) /
                        100;
                    calculatedSpacingY =
                        (chartContainer.clientHeight *
                            eChartsConfig.options.facetHeaders.spacing.y) /
                        100;
                }

                if (!eChartsConfig.options.facetHeaders.customLayout) {
                    calculatedGridWidth =
                        (chartContainer.clientWidth -
                            facetPadding.left -
                            (numColumns - 1) * calculatedSpacingX -
                            facetPadding.right) /
                        numColumns;
                    eChartsConfig.options.facetHeaders.grid.width =
                        calculatedGridWidth;
                }

                containerHeight =
                    facetPadding.top +
                    numRows * calculatedGridHeight +
                    (numRows - 1) * calculatedSpacingY +
                    facetPadding.bottom;
                containerWidth =
                    facetPadding.left +
                    numColumns * calculatedGridWidth +
                    (numColumns - 1) * calculatedSpacingX +
                    facetPadding.right;

                parent.style.position = 'absolute';
                parent.style.top = '0';
                parent.style.right = '0';
                parent.style.bottom = '0';
                parent.style.left = '0';
                parent.style.overflowY = 'auto';

                if (chartContainer.clientWidth < containerWidth) {
                    chartContainer.style.width = '' + containerWidth + 'px';
                    clientWidth = containerWidth;
                } else {
                    chartContainer.style.width = '';
                    clientWidth = chartContainer.clientWidth;
                }

                if (chartContainer.clientHeight < containerHeight) {
                    chartContainer.style.height = '' + containerHeight + 'px';
                    clientHeight = containerHeight;
                } else {
                    chartContainer.style.height = '';
                    clientHeight = chartContainer.clientHeight;
                }
            }
        }

        /**
         * @name resizeViz
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz() {
            if (scatterChart) {
                scatterChart.resize();
            }

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType === 'All Instances'
            ) {
                determineResize();
                paint();
            }
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
