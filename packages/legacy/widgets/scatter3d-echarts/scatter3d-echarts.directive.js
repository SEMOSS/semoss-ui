'use strict';

import * as echarts from 'echarts';
import '@/widget-resources/js/echarts/GL/echarts-gl.min.js';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import './scatter3d-echarts.directive.js';

/**
 *
 * @name scatter3d-echarts
 * @desc scatter3d-echarts chart directive for creating and visualizing a scatter chart
 */

export default angular
    .module('app.scatter3d-echarts.directive', [])
    .directive('scatter3dEcharts', scatter3dEcharts);

scatter3dEcharts.$inject = [];

function scatter3dEcharts() {
    scatter3dChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: scatter3dChartLink,
    };

    function scatter3dChartLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            eChartsConfig,
            scatter3dChart;

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
                    'view.visualization.keys.Scatter3d'
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                uiOptions;

            uiOptions = angular.extend(sharedTools, individual);
            uiOptions.colorBy = colorBy;

            eChartsConfig = {};
            eChartsConfig.uiOptions = uiOptions;
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
            eChartsConfig.headers = getHeaders(keys, data.headers);
            eChartsConfig.finalData = getData(data, data.headers, uiOptions);
            eChartsConfig.backgroundColorStyle = setBackgroundColorStyle();

            paint();
        }

        /**
         * @name getHeaders
         * @desc determines axis names
         * @param {obj} keys - semoss keys
         * @param {array} chartHeaders - semoss headers
         * @returns {obj} - axis names
         */
        function getHeaders(keys, chartHeaders) {
            var headers = {},
                i;

            for (i = 0; i < keys.length; i++) {
                if (keys[i].model === 'x') {
                    headers.xAxis = keys[i].alias;
                } else if (keys[i].model === 'y') {
                    headers.yAxis = keys[i].alias;
                } else if (keys[i].model === 'z') {
                    headers.zAxis = keys[i].alias;
                } else if (keys[i].model === 'label') {
                    headers.label = keys[i].alias;
                } else if (keys[i].model === 'tooltip') {
                    if (!headers.tooltip) {
                        headers.tooltip = [];
                    }

                    headers.tooltip.push(chartHeaders.indexOf(keys[i].alias));
                }
            }
            return headers;
        }

        /**
         * @name getData
         * @desc formats data array
         * @param {obj} data - semoss data
         * @param {array} chartHeaders - semoss headers
         * @param {object} uiOptions - semoss ornaments
         * @returns {array} - formatted data
         */
        function getData(data, chartHeaders, uiOptions) {
            var finalData = [],
                labelIndex,
                xIndex,
                yIndex,
                zIndex;

            labelIndex = data.headers.indexOf(eChartsConfig.headers.label);
            xIndex = data.headers.indexOf(eChartsConfig.headers.xAxis);
            yIndex = data.headers.indexOf(eChartsConfig.headers.yAxis);
            zIndex = data.headers.indexOf(eChartsConfig.headers.zAxis);

            data.values.forEach(function (row, idx) {
                finalData[idx] = {
                    name: row[labelIndex],
                    value: [row[xIndex], row[yIndex], row[zIndex]],
                    tooltip: [],
                };

                if (uiOptions.colorBy && uiOptions.colorBy.length > 0) {
                    colorByValue(finalData[idx], uiOptions.colorBy);
                }

                if (eChartsConfig.headers.tooltip) {
                    eChartsConfig.headers.tooltip.forEach(function (tipIdx) {
                        var tipObj = {};
                        tipObj[chartHeaders[tipIdx]] = row[tipIdx];
                        finalData[idx].tooltip.push(tipObj);
                    });
                }
            });

            return finalData;
        }

        function colorByValue(dataPoint, colorRules) {
            colorRules.forEach(function (rule) {
                rule.valuesToColor.forEach(function (value) {
                    if (
                        dataPoint.value.indexOf(value) > -1 ||
                        dataPoint.name === value
                    ) {
                        if (
                            dataPoint.hasOwnProperty('itemStyle') &&
                            dataPoint.itemStyle.hasOwnProperty('normal')
                        ) {
                            dataPoint.itemStyle.normal.color = rule.color;
                        } else {
                            dataPoint.itemStyle = {
                                normal: {
                                    color: rule.color,
                                },
                            };
                        }
                    }
                });
            });
        }

        /**
         * @name setBackgroundColorStyle
         * @desc sets the background of the canvas
         * @param {string} watermark index of the data to highlight
         * @returns {Object} - background style
         */
        function setBackgroundColorStyle() {
            return {};
        }

        /**
         * @name getSymbolSize
         * @desc sets symbol size
         * @returns {number} - size of symbol (in pixels)
         */
        function getSymbolSize() {
            if (
                eChartsConfig.uiOptions.changeSymbol &&
                eChartsConfig.uiOptions.changeSymbol.hasOwnProperty(
                    'symbolSize'
                )
            ) {
                return eChartsConfig.uiOptions.changeSymbol.symbolSize;
            }
            return 12;
        }

        /**
         * @name getSymbol
         * @desc sets symbol shape
         * @returns {string} - shape of symbol
         */
        function getSymbol() {
            if (
                eChartsConfig.uiOptions.changeSymbol &&
                eChartsConfig.uiOptions.changeSymbol.hasOwnProperty(
                    'chooseType'
                )
            ) {
                if (
                    eChartsConfig.uiOptions.changeSymbol.symbolUrl &&
                    eChartsConfig.uiOptions.changeSymbol.symbolUrl !== ''
                ) {
                    return (
                        'image://' +
                        eChartsConfig.uiOptions.changeSymbol.symbolUrl
                    );
                    // Error alert if not of acceptable type
                }

                if (
                    eChartsConfig.uiOptions.changeSymbol.chooseType === 'Circle'
                ) {
                    return 'circle';
                } else if (
                    eChartsConfig.uiOptions.changeSymbol.chooseType ===
                    'Rectangle'
                ) {
                    return 'rect';
                } else if (
                    eChartsConfig.uiOptions.changeSymbol.chooseType ===
                    'Round Rectangle'
                ) {
                    return 'roundRect';
                } else if (
                    eChartsConfig.uiOptions.changeSymbol.chooseType ===
                    'Triangle'
                ) {
                    return 'triangle';
                } else if (
                    eChartsConfig.uiOptions.changeSymbol.chooseType ===
                    'Diamond'
                ) {
                    return 'diamond';
                } else if (
                    eChartsConfig.uiOptions.changeSymbol.chooseType === 'Pin'
                ) {
                    return 'pin';
                } else if (
                    eChartsConfig.uiOptions.changeSymbol.chooseType === 'Arrow'
                ) {
                    return 'arrow';
                } else if (
                    eChartsConfig.uiOptions.changeSymbol.chooseType ===
                    'Empty Circle'
                ) {
                    return 'emptyCircle';
                }
                return 'circle';
            }
            return 'circle';
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (scatter3dChart) {
                scatter3dChart.clear();
                scatter3dChart.dispose();
            }
            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            scatter3dChart = echarts.init(ele[0].firstElementChild);

            var option = {};

            option.color = eChartsConfig.uiOptions.color;
            option.tooltip = {
                formatter: function (info) {
                    var label = '';
                    if (typeof info.name === 'string') {
                        label += info.name.replace(/_/g, ' ');
                    } else {
                        label += info.name;
                    }

                    info.data.tooltip.forEach(function (tipObj) {
                        var tipKey = Object.keys(tipObj)[0];
                        label += '<br>';
                        label += tipKey + ': ';
                        label += tipObj[tipKey];
                    });

                    return label.replace(/_/g, ' ');
                },
                backgroundColor:
                    eChartsConfig.uiOptions.tooltip.backgroundColor ||
                    '#FFFFFF',
                borderWidth:
                    parseFloat(eChartsConfig.uiOptions.tooltip.borderWidth) ||
                    0,
                borderColor: eChartsConfig.uiOptions.tooltip.borderColor || '',
                textStyle: {
                    color:
                        eChartsConfig.uiOptions.tooltip.fontColor || '#000000',
                    fontFamily:
                        eChartsConfig.uiOptions.tooltip.fontFamily || 'Inter',
                    fontSize:
                        parseFloat(eChartsConfig.uiOptions.tooltip.fontSize) ||
                        12,
                },
            };
            let nameTextStyle = {
                    fontWeight:
                        parseInt(
                            eChartsConfig.uiOptions.axis.name.fontWeight,
                            10
                        ) || 400,
                    fontSize:
                        parseFloat(
                            eChartsConfig.uiOptions.axis.name.fontSize
                        ) || eChartsConfig.uiOptions.fontSize,
                    fontFamily:
                        eChartsConfig.uiOptions.axis.name.fontFamily || 'Inter',
                    color:
                        eChartsConfig.uiOptions.axis.name.fontColor ||
                        eChartsConfig.uiOptions.fontColor,
                },
                labelTextStyle = {
                    fontWeight:
                        parseInt(
                            eChartsConfig.uiOptions.axis.label.fontWeight,
                            10
                        ) || 400,
                    fontSize:
                        parseFloat(
                            eChartsConfig.uiOptions.axis.label.fontSize
                        ) || eChartsConfig.uiOptions.fontSize,
                    fontFamily:
                        eChartsConfig.uiOptions.axis.label.fontFamily ||
                        'Inter',
                    color:
                        eChartsConfig.uiOptions.axis.label.fontColor ||
                        eChartsConfig.uiOptions.fontColor,
                },
                lineStyle = {
                    color: eChartsConfig.uiOptions.axis.borderColor,
                    width: parseFloat(eChartsConfig.uiOptions.axis.borderWidth),
                };

            // GL Config
            option.grid3D = {};
            option.xAxis3D = {
                show: true,
                name: cleanValue(eChartsConfig.headers.xAxis),
                axisLabel: {
                    show: eChartsConfig.uiOptions.toggleAxisLabels,
                    textStyle: labelTextStyle,
                },
                splitLine: { lineStyle: eChartsConfig.uiOptions.grid },
                nameTextStyle: nameTextStyle,
                axisLine: { lineStyle: lineStyle },
                axisTick: { lineStyle: lineStyle },
            };
            option.yAxis3D = {
                show: true,
                name: cleanValue(eChartsConfig.headers.yAxis),
                axisLabel: {
                    show: eChartsConfig.uiOptions.toggleAxisLabels,
                    textStyle: labelTextStyle,
                },
                splitLine: { lineStyle: eChartsConfig.uiOptions.grid },
                nameTextStyle: nameTextStyle,
                axisLine: { lineStyle: lineStyle },
                axisTick: { lineStyle: lineStyle },
            };
            option.zAxis3D = {
                show: true,
                name: cleanValue(eChartsConfig.headers.zAxis),
                axisLabel: {
                    show: eChartsConfig.uiOptions.toggleAxisLabels,
                    textStyle: labelTextStyle,
                },
                splitLine: { lineStyle: eChartsConfig.uiOptions.grid },
                nameTextStyle: nameTextStyle,
                axisLine: { lineStyle: lineStyle },
                axisTick: { lineStyle: lineStyle },
            };
            option.series = {
                type: 'scatter3D',
                symbolSize: getSymbolSize() || 25,
                symbol: getSymbol() || 'circle',
                data: eChartsConfig.finalData,
                label: {
                    textStyle: {
                        color:
                            eChartsConfig.uiOptions.valueLabel.fontColor ||
                            eChartsConfig.uiOptions.fontColor ||
                            '#000000',
                        fontSize:
                            parseFloat(
                                eChartsConfig.uiOptions.valueLabel.fontSize
                            ) ||
                            eChartsConfig.uiOptions.fontSize ||
                            12,
                        fontFamily:
                            eChartsConfig.uiOptions.valueLabel.fontFamily ||
                            'Inter',
                        fontWeight:
                            eChartsConfig.uiOptions.valueLabel.fontWeight ||
                            400,
                    },
                },
            };
            option.textStyle = {
                fontFamily: 'Inter',
            };
            EchartsHelper.setOption(scatter3dChart, option);
        }

        /**
         * @name resizeViz
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz() {
            scatter3dChart.resize();
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
         * @name destroy
         * @desc destroys listeners and dom elements outside of the scope
         * @returns {void}
         */
        function destroy() {
            resizeListener();
            updateTaskListener();
            updateOrnamentsListener();
            addDataListener();
        }

        // Start Visualization Creation
        initialize();
    }
}
