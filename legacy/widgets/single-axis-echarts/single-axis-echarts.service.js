'use strict';

import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';

/**
 * @name singleAxis-echarts.service.js
 * @desc This service configures our data into echarts data as according to the
 *       e-charts examples (one of which is: https://ecomfe.github.io/echarts-examples/public/editor.html?c=singleAxis-disk).
 *       This service functions similarly to the other e-charts services but it
 *       has two specific functions: setsingleAxisDataSeries() and constructChildObj().
 *       The first function simply loops through our structured data and converts
 *       it into the appropriate data object to display singleAxis data, while the
 *       second is a function and the first calls in order to create child objects
 *       that are populated into our singleAxis data object.
 */
export default angular
    .module('app.single-axis.service', [])
    .factory('singleAxisService', singleAxisService);

singleAxisService.$inject = [];

function singleAxisService() {
    var valuePos,
        groupPos,
        facetPos,
        sizePos,
        tooltipObj,
        singleAxisOptions,
        numFacets,
        facetArray,
        globalMin,
        globalMax,
        dataTypes;

    function getConfig(type, tasks, uiOptions, keys, keysObj) {
        const task = tasks[0],
            data = task.data;

        getDataTypes(keys, uiOptions);
        clearOptions();
        getDataTablePositions(data, keysObj);
        buildAxisOptions(task, keys, keysObj, uiOptions);
        buildAxisTooltips(
            data.headers,
            uiOptions.showTooltips,
            uiOptions.tooltip
        );

        // Configure data for ECharts
        return {
            showLegend: !uiOptions.toggleLegend,
            backgroundColorStyle: getBackgroundColorStyle(uiOptions.watermark),
            keys: keysObj,
            options: getUiOptions(uiOptions),
            option: singleAxisOptions,
        };
    }

    /**
     * @name getDataTypes
     * @desc gets the data formatting options for each dimension
     * @param {Object} keys - object of data keys
     * @param {Object} options - uiOptions
     * @returns {void} - void
     */
    function getDataTypes(keys, options) {
        dataTypes = {};
        let k, j, formatType, newFormat;

        for (k = 0; k < keys.length; k++) {
            if (keys[k].model) {
                dataTypes[keys[k].alias] = [];
                formatType = visualizationUniversal.mapFormatOpts(keys[k]);
                dataTypes[keys[k].alias].push(formatType);
            }
            if (options.formatDataValues) {
                for (j = 0; j < options.formatDataValues.formats.length; j++) {
                    newFormat = options.formatDataValues.formats[j];
                    if (keys[k].alias === newFormat.dimension) {
                        dataTypes[newFormat.dimension] = [];
                        dataTypes[newFormat.dimension].push(newFormat);
                    }
                }
            }
        }
    }

    function clearOptions() {
        singleAxisOptions = {
            tooltip: {},
            singleAxis: [],
            series: [],
            title: [],
        };
        valuePos = -1;
        groupPos = -1;
        facetPos = -1;
        sizePos = -1;
        tooltipObj = {};
        numFacets = 1;
        facetArray = [];
        globalMin = -1;
        globalMax = -1;
    }

    function formatData(data, keysObj, facetIdx, options) {
        var returnObj = {
                labels: [],
                values: [],
            },
            tempDataObj = {}, // this becomes individual data point
            tempObj = {},
            tempSize,
            min,
            max,
            hasSize = false,
            facetCategory = '',
            i,
            j,
            label;

        if (sizePos !== -1) {
            hasSize = true;
            for (
                let valueIdx = 0, valueLen = data.values.length;
                valueIdx < valueLen;
                valueIdx++
            ) {
                const value = data.values[valueIdx][sizePos];

                if (typeof min === 'undefined' || value < min) {
                    min = value;
                }

                if (typeof max === 'undefined' || value > max) {
                    max = value;
                }
            }
        }

        if (numFacets === 1) {
            for (i = 0; i < data.values.length; i++) {
                tempObj[keysObj.label] = data.values[i][groupPos];

                if (!hasSize) {
                    tempSize = 30;
                } else {
                    tempSize = calcSize(min, max, data.values[i][sizePos]);
                    tempObj[keysObj.size] = data.values[i][sizePos];
                }

                // Add in tooltips if they exist
                if (Object.keys(tooltipObj).length > 0) {
                    for (j in tooltipObj) {
                        if (tooltipObj.hasOwnProperty(j)) {
                            tempObj[j] = data.values[i][tooltipObj[j]]; // tooltipObj[j] = tooltipPos
                        }
                    }
                }

                tempDataObj.value = [
                    data.values[i][valuePos],
                    tempSize,
                    tempObj,
                ];

                tempDataObj.itemStyle = {
                    normal: {},
                };

                if (options.highlight && options.highlight.data) {
                    for (label in options.highlight.data) {
                        if (
                            (tempDataObj.value[2][label] ||
                                tempDataObj.value[2][label] === 0) &&
                            options.highlight.data[label].indexOf(
                                tempDataObj.value[2][label]
                            ) > -1
                        ) {
                            tempDataObj.itemStyle.normal.borderColor = '#000';
                            tempDataObj.itemStyle.normal.borderWidth = 2;
                        }
                    }
                }

                if (options.colorByValue && options.colorByValue.length > 0) {
                    // eslint-disable-next-line no-loop-func
                    options.colorByValue.forEach(function (rule) {
                        var i,
                            j,
                            valFound = false,
                            colorValue,
                            valueToCheck;
                        for (i = 0; i < rule.valuesToColor.length; i++) {
                            colorValue = rule.valuesToColor[i];
                            for (j = 0; j < tempDataObj.value.length; j++) {
                                if (
                                    typeof tempDataObj.value[j] === 'object' &&
                                    tempDataObj.value[j] !== null
                                ) {
                                    valueToCheck =
                                        tempDataObj.value[j][
                                            cleanValue(rule.colorOn)
                                        ] || tempDataObj.value[j][rule.colorOn];
                                } else {
                                    valueToCheck = tempDataObj.value[j];
                                }
                                if (valueToCheck === colorValue) {
                                    valFound = true;
                                    break;
                                }
                            }

                            if (valFound) {
                                break;
                            }
                        }

                        if (valFound) {
                            tempDataObj.itemStyle.normal.color = rule.color;
                        }
                    });
                }

                returnObj.labels.push(data.values[i][valuePos]);
                returnObj.values.push(tempDataObj);

                tempObj = {};
                tempDataObj = {};
            }
        } else {
            facetCategory = facetArray[facetIdx];

            for (i = 0; i < data.values.length; i++) {
                if (data.values[i][facetPos] === facetCategory) {
                    tempObj[keysObj.label] = data.values[i][groupPos];

                    if (!hasSize) {
                        tempSize = 30;
                    } else {
                        tempSize = calcSize(min, max, data.values[i][sizePos]);
                        tempObj[keysObj.size] = data.values[i][sizePos];
                    }

                    tempObj[keysObj.facet] = facetCategory;

                    // Add in tooltips if they exist
                    if (Object.keys(tooltipObj).length > 0) {
                        for (j in tooltipObj) {
                            if (tooltipObj.hasOwnProperty(j)) {
                                tempObj[j] = data.values[i][tooltipObj[j]]; // tooltipObj[j] = tooltipPos
                            }
                        }
                    }

                    tempDataObj.value = [
                        data.values[i][valuePos],
                        tempSize,
                        tempObj,
                    ];

                    tempDataObj.itemStyle = {
                        normal: {},
                    };

                    if (options.highlight && options.highlight.data) {
                        for (label in options.highlight.data) {
                            if (
                                (tempDataObj.value[2][label] ||
                                    tempDataObj.value[2][label] === 0) &&
                                options.highlight.data[label].indexOf(
                                    tempDataObj.value[2][label]
                                ) > -1
                            ) {
                                tempDataObj.itemStyle.normal.borderColor =
                                    '#000';
                                tempDataObj.itemStyle.normal.borderWidth = 2;
                            }
                        }
                    }

                    if (
                        options.colorByValue &&
                        options.colorByValue.length > 0
                    ) {
                        options.colorByValue.forEach(function (rule) {
                            var i,
                                j,
                                valFound = false,
                                colorValue,
                                valueToCheck;
                            for (i = 0; i < rule.valuesToColor.length; i++) {
                                colorValue = rule.valuesToColor[i];
                                for (j = 0; j < tempDataObj.value.length; j++) {
                                    if (
                                        typeof tempDataObj.value[j] ===
                                            'object' &&
                                        tempDataObj.value[j] !== null
                                    ) {
                                        valueToCheck =
                                            tempDataObj.value[j][
                                                cleanValue(rule.colorOn)
                                            ];
                                    } else {
                                        valueToCheck = tempDataObj.value[j];
                                    }
                                    if (valueToCheck === colorValue) {
                                        valFound = true;
                                        break;
                                    }
                                }

                                if (valFound) {
                                    break;
                                }
                            }

                            if (valFound) {
                                tempDataObj.itemStyle.normal.color = rule.color;
                            }
                        });
                    }

                    returnObj.labels.push(data.values[i][valuePos]);
                    returnObj.values.push(tempDataObj);

                    tempObj = {};
                    tempDataObj = {};
                }
            }
        }

        globalMin = -1;
        globalMax = -1;

        for (
            let valueIdx = 0, valueLen = data.values.length;
            valueIdx < valueLen;
            valueIdx++
        ) {
            const value = data.values[valueIdx][valuePos];

            if (
                typeof globalMin === 'undefined' ||
                globalMin === -1 ||
                value < globalMin
            ) {
                globalMin = value;
            }

            if (typeof globalMax === 'undefined' || value > globalMax) {
                globalMax = value;
            }
        }

        return returnObj;
    }

    function getDataTablePositions(data, keysObj) {
        var i, j, key;

        for (key in keysObj) {
            if (keysObj.hasOwnProperty(key)) {
                for (i = 0; i < data.headers.length; i++) {
                    if (
                        cleanValue(data.headers[i]) === cleanValue(keysObj[key])
                    ) {
                        assignPosition(key, i);
                    }
                }
            }
        }

        // for (i = 0; i < data.headers.length; i++) {
        //     if (cleanValue(data.headers[i]) === cleanValue(keysObj.x)) {
        //         valuePos = i;
        //     } else if (cleanValue(data.headers[i]) === cleanValue(keysObj.label)) {
        //         groupPos = i;
        //     } else if (cleanValue(data.headers[i]) === cleanValue(keysObj.facet)) {
        //         facetPos = i;
        //     } else if (cleanValue(data.headers[i]) === cleanValue(keysObj.size)) {
        //         sizePos = i;
        //     }
        // }

        for (i in keysObj) {
            if (keysObj.hasOwnProperty(i) && i.indexOf('tooltip') !== -1) {
                for (j = 0; j < data.headers.length; j++) {
                    if (
                        cleanValue(data.headers[j]) === cleanValue(keysObj[i])
                    ) {
                        tooltipObj[cleanValue(keysObj[i])] = j;
                    }
                }
            }
        }
    }

    /**
     * @name assignPosition
     * @desc assign data index position based on key
     * @param {string} key - data key
     * @param {number} i - data position index
     * @returns {obj} - null
     */
    function assignPosition(key, i) {
        switch (key) {
            case 'label':
                groupPos = i;
                break;
            case 'x':
                valuePos = i;
                break;
            case 'facet':
                facetPos = i;
                break;
            case 'size':
                sizePos = i;
                break;
            default:
                break;
        }
    }

    function getUiOptions(options) {
        return options;
    }

    /**
     * @name getXAxis
     * @desc sets configuration of y-axis (min, max, and inverse bool)
     * @param {Object} uiOptions - uiOptions
     * @param {Array} keys - array of data keys
     * @param {num} idx - groupBy instance index
     * @returns {Array} - array of object of y-axis configuration
     */
    function getXAxis(uiOptions, keys, idx) {
        var xAxisConfig = [],
            axisTitle = '',
            showAxisValues,
            nameGap = 25,
            showAxisLine,
            showAxisTicks,
            labelRotate = 0,
            formatType,
            key,
            settings = uiOptions.editXAxis,
            grid = uiOptions.editGrid.xScatter,
            fontSize = uiOptions.fontSize
                ? uiOptions.fontSize.substring(
                      0,
                      uiOptions.fontSize.indexOf('p')
                  )
                : 12,
            fontColor = uiOptions.fontColor || 'black';

        // get data type and header name of x-axis
        for (key in keys) {
            if (keys[key].model === 'value') {
                formatType = dataTypes[keys[key].alias][0];
                axisTitle = cleanValue(keys[key].alias);
            }
        }

        if (settings) {
            if (settings.title.show) {
                axisTitle = settings.title.name
                    ? cleanValue(settings.title.name)
                    : settings.title.name;
            } else {
                axisTitle = null;
            }
            showAxisValues = settings.values;
            nameGap = settings.nameGap;
            showAxisLine = settings.line;
            showAxisTicks = settings.line ? settings.showTicks : false;
            labelRotate = settings.rotate;
        } else {
            showAxisValues = true;
            showAxisLine = true;
            showAxisTicks = false;
        }

        xAxisConfig.push({
            type: 'value',
            axisTick: {
                show: showAxisTicks,
                alignWithLabel: true,
                lineStyle: {
                    color: uiOptions.axis.borderColor,
                    width: parseFloat(uiOptions.axis.borderWidth),
                },
            },
            splitLine: {
                show: grid,
                lineStyle: angular.merge({}, uiOptions.grid, {
                    opacity: 1,
                    type: 'dashed',
                }),
            },
            axisLabel: {
                show: showAxisValues,
                rotate: labelRotate,
                formatter: function (value) {
                    return EchartsHelper.formatLabel(
                        value,
                        settings.format,
                        formatType
                    );
                },
                fontWeight:
                    parseInt(uiOptions.axis.label.fontWeight, 10) || 400,
                fontSize: parseFloat(uiOptions.axis.label.fontSize) || fontSize,
                fontFamily: uiOptions.axis.label.fontFamily || 'Inter',
                color: uiOptions.axis.label.fontColor || fontColor,
            },
            name: axisTitle,
            nameLocation: 'center',
            nameGap: nameGap,
            nameTextStyle: {
                fontWeight: parseInt(uiOptions.axis.name.fontWeight, 10) || 400,
                fontSize: parseFloat(uiOptions.axis.name.fontSize) || fontSize,
                fontFamily: uiOptions.axis.name.fontFamily || 'Inter',
                color: uiOptions.axis.name.fontColor || fontColor,
            },
            gridIndex: idx,
            axisLine: {
                show: showAxisLine,
                lineStyle: {
                    color: uiOptions.axis.borderColor,
                    width: parseFloat(uiOptions.axis.borderWidth),
                },
            },
        });

        return xAxisConfig;
    }

    function buildAxisOptions(task, keys, keysObj, uiOptions) {
        var axisData,
            i,
            newAxis,
            combinedAxis,
            newSeries,
            combinedSeries,
            sqrtNumFacets;

        const data = task.data,
            series = EchartsHelper.getDataSeries(
                task,
                data,
                uiOptions,
                uiOptions.colorByValue,
                undefined,
                undefined,
                keys.map(function (key) {
                    if (key.model === 'x') {
                        key.model = 'value';
                    }

                    return key;
                }),
                dataTypes
            )[0],
            xAxis = getXAxis(uiOptions, keys, 0)[0];

        for (i = 0; i < data.headers.length; i++) {
            if (data.headers[i] === keysObj.label) {
                break;
            }
        }
        // Set labels
        singleAxisOptions.labels = data.values.map(function (val) {
            return val[i];
        });

        if (facetPos !== -1) {
            for (
                let valueIdx = 0, valueLen = data.values.length;
                valueIdx < valueLen;
                valueIdx++
            ) {
                const value = data.values[valueIdx][facetPos];

                // probably should be a map
                if (facetArray.indexOf(value) === -1) {
                    facetArray.push(value);
                }
            }

            numFacets = facetArray.length;
            sqrtNumFacets = Math.sqrt(numFacets);

            for (i = 0; i < numFacets; i++) {
                axisData = formatData(data, keysObj, i, uiOptions);
                newAxis = {
                    left: 150,
                    type: 'value',
                    boundaryGap: false,
                    min: globalMin,
                    max: globalMax,
                    top: (100 / numFacets) * i + 3 + '%',
                    height: 100 / numFacets - 10 + '%',
                };
                combinedAxis = angular.extend({}, xAxis, newAxis);
                // only show axis title for bottom axis
                if (i !== numFacets - 1) {
                    combinedAxis.name = null;
                    combinedAxis.nameLocation = '';
                    combinedAxis.nameGap = 0;
                    combinedAxis.nameTextStyle = {};
                }
                singleAxisOptions.singleAxis.push(combinedAxis);

                newSeries = {
                    singleAxisIndex: i,
                    coordinateSystem: 'singleAxis',
                    type: 'scatter',
                    data: axisData.values,
                    symbolSize: function (dataItem) {
                        return dataItem[1] / sqrtNumFacets;
                    },
                };
                combinedSeries = angular.extend({}, series, newSeries);
                singleAxisOptions.series.push(combinedSeries);

                singleAxisOptions.title.push({
                    textBaseline: 'middle',
                    top: ((i + 0.5) * 100) / numFacets + '%',
                    left: 15,
                    text: facetArray[i] ? alterText(facetArray[i]) : '',
                });
            }
        } else {
            axisData = formatData(data, keysObj, -1, uiOptions);

            singleAxisOptions.singleAxis.push(
                angular.extend(xAxis, {
                    left: 50,
                    type: 'value',
                    boundaryGap: false,
                    height: 100 - 13 + '%',
                })
            );

            singleAxisOptions.series.push(
                angular.extend(series, {
                    singleAxisIndex: 0,
                    coordinateSystem: 'singleAxis',
                    type: 'scatter',
                    data: axisData.values,
                    symbolSize: function (dataItem) {
                        return dataItem[1] / numFacets;
                    },
                })
            );
        }
    }

    function alterText(txt) {
        var cleanTxt = cleanValue(txt);
        return cleanTxt.length > 12
            ? cleanTxt.substr(0, 12 - 1) + '...'
            : cleanTxt;
    }

    function buildAxisTooltips(headers, showTips, tooltipStyle) {
        // singleAxisOptions.tooltip.show = showTips;
        singleAxisOptions.tooltip.trigger = 'item';
        singleAxisOptions.tooltip.confine = true;
        singleAxisOptions.tooltip.formatter = function (info) {
            if (!showTips) {
                return '';
            }
            var returnArray = [],
                i,
                valueType,
                labelType,
                tooltipName,
                tooltipType,
                tooltips = info.data.value[2];

            valueType = dataTypes[headers[valuePos]][0];

            returnArray.push(
                cleanValue(headers[valuePos]) +
                    ': ' +
                    visualizationUniversal.formatValue(
                        info.data.value[0],
                        valueType
                    ) +
                    '<br>' // actual value is always in pos 0
            );

            for (i in tooltips) {
                if (tooltips.hasOwnProperty(i)) {
                    labelType = dataTypes[headers[groupPos]][0];
                    if (
                        cleanValue(i) === cleanValue(headers[groupPos]) &&
                        info.color
                    ) {
                        returnArray.unshift(
                            '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
                                info.color +
                                ';"></span><b>' +
                                visualizationUniversal.formatValue(
                                    tooltips[i],
                                    labelType
                                ) +
                                '</b><br>'
                        );
                    } else {
                        tooltipName = i.replace(/ /g, '_');
                        tooltipType = dataTypes[tooltipName][0];
                        returnArray.push(
                            cleanValue(i) +
                                ': ' +
                                visualizationUniversal.formatValue(
                                    tooltips[i],
                                    tooltipType
                                ) +
                                '<br>'
                        );
                    }
                }
            }

            return returnArray.join('');
        };
        (singleAxisOptions.tooltip.backgroundColor =
            tooltipStyle.backgroundColor || '#FFFFFF'),
            (singleAxisOptions.tooltip.borderWidth =
                parseFloat(tooltipStyle.borderWidth) || 0),
            (singleAxisOptions.tooltip.borderColor =
                tooltipStyle.borderColor || ''),
            (singleAxisOptions.tooltip.textStyle = {
                color: tooltipStyle.fontColor || '#000000',
                fontFamily: tooltipStyle.fontFamily || 'Inter',
                fontSize: parseFloat(tooltipStyle.fontSize) || 12,
            });
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

    function calcSize(min, max, val) {
        var fraction;

        if (val === min) {
            return 15;
        } else if (val === max) {
            return 130;
        }

        fraction = val / max;

        return fraction * 130 + 15;
    }

    /**
     * @name getBackgroundColorStyle
     * @desc customize the background style of the canvas
     * @param {string} watermark - string of the watermark text
     * @returns {Object} - canvas details
     */
    function getBackgroundColorStyle(watermark) {
        if (/\S/.test(watermark)) {
            return {
                type: 'pattern',
                image: paintWaterMark(watermark),
                repeat: 'repeat',
            };
        }

        return false;
    }

    /**
     * @name paintWaterMark
     * @desc paints a custom watermark on the viz
     * @param {string} watermark - string of the watermark text
     * @returns {Object} - canvas details
     */
    function paintWaterMark(watermark) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');
        canvas.width = canvas.height = 100;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.08;
        ctx.font = '20px Microsoft Yahei';
        ctx.translate(50, 50);
        ctx.rotate(-Math.PI / 4);
        if (watermark) {
            ctx.fillText(watermark, 0, 0);
        }
        return canvas;
    }

    return {
        getConfig: getConfig,
    };
}
