'use strict';
/**
 * @name radar-echarts.service.js
 * @desc configures echarts radar
 */
angular.module('app.radar.service', []).factory('radarService', radarService);

radarService.$inject = ['semossCoreService'];

function radarService(semossCoreService) {
    function getConfig(data, uiOptions, keys, groupByInstance) {
        var config = formatRadar(data, keys, uiOptions);

        config.options = uiOptions;
        config.groupByInstance = groupByInstance;
        config.backgroundColorStyle = getBackgroundColorStyle(
            uiOptions.watermark
        );
        config.keys = keys;
        config.radarLineStyle = { lineStyle: uiOptions.grid };
        // Axis Labels
        config.labelTextStyle = {
            fontWeight: parseInt(uiOptions.axis.label.fontWeight, 10) || 400,
            fontSize:
                parseFloat(uiOptions.axis.label.fontSize) ||
                uiOptions.fontSize ||
                12,
            fontFamily: uiOptions.axis.label.fontFamily || 'Inter',
            color:
                uiOptions.axis.label.fontColor ||
                uiOptions.fontColor ||
                '#000000',
        };
        // Value Labels
        config.valueTextStyle = {
            fontWeight: uiOptions.valueLabel.fontWeight || 400,
            fontSize:
                parseFloat(uiOptions.valueLabel.fontSize) ||
                uiOptions.fontSize ||
                12,
            fontFamily: uiOptions.valueLabel.fontFamily || 'Inter',
            color:
                uiOptions.valueLabel.fontColor ||
                uiOptions.fontColor ||
                '#000000',
        };
        config.axisLineStyle = {
            lineStyle: {
                color: uiOptions.axis.borderColor,
                width: parseFloat(uiOptions.axis.borderWidth),
            },
        };
        // Legend Labels
        config.legendLabelStyle = {
            color:
                uiOptions.legend.fontColor || uiOptions.fontColor || '#000000',
            fontSize:
                parseFloat(uiOptions.legend.fontSize) ||
                uiOptions.fontSize ||
                12,
            fontFamily: uiOptions.legend.fontFamily || 'Inter',
            fontWeight: uiOptions.legend.fontWeight || 400,
        };

        return config;
    }

    function formatRadar(data, keys, uiOptions) {
        var indicator = [],
            labelIdx,
            tooltipIdx = {},
            tooltipData,
            j,
            i,
            k,
            prop,
            keyIdx,
            dim,
            dataEle,
            radarData = [],
            selectedHeaders = [],
            unusedHeaders = [],
            maxValue = 0,
            name,
            dataObj;

        for (keyIdx = 0; keyIdx < keys.length; keyIdx++) {
            if (keys[keyIdx].model === 'label') {
                labelIdx = data.headers.indexOf(keys[keyIdx].alias);
            } else if (keys[keyIdx].model === 'tooltip') {
                tooltipIdx[keys[keyIdx].alias] = data.headers.indexOf(
                    keys[keyIdx].alias
                );
            } else {
                if (
                    keys[keyIdx].model !== 'facet' &&
                    keys[keyIdx].model !== 'groupBy' &&
                    selectedHeaders.indexOf(keys[keyIdx].alias) === -1
                ) {
                    indicator.push({
                        name: keys[keyIdx].alias,
                        max: 0,
                    });
                }
                if (
                    keys[keyIdx].model !== 'facet' &&
                    keys[keyIdx].model !== 'groupBy' &&
                    selectedHeaders.indexOf(keys[keyIdx].alias) !== -1
                ) {
                    unusedHeaders.push(keys[keyIdx].alias);
                }
                selectedHeaders.push(keys[keyIdx].alias);
            }
        }
        if (unusedHeaders.length > 0) {
            // TODO: Make the alert bound to a widget
            semossCoreService.emit('alert', {
                color: 'warn',
                text:
                    unusedHeaders +
                    ' is already being displayed in the radar chart. Ignoring this entry for now.',
            });
        }

        // Iterate through data to build node and link maps
        for (i = 0; i < data.values.length; i++) {
            dataEle = data.values[i];
            tooltipData = {};
            for (dim in tooltipIdx) {
                if (tooltipIdx.hasOwnProperty(dim)) {
                    tooltipData[dim] = dataEle[tooltipIdx[dim]];
                }
            }
            name = dataEle.splice(labelIdx, 1)[0];
            for (j = 0; j < indicator.length; j++) {
                if (!uiOptions.normalizeAxis) {
                    if (indicator[j].max < 1.05 * dataEle[j]) {
                        indicator[j].max = 1.05 * dataEle[j];
                    }
                } else if (dataEle[j] > maxValue) {
                    maxValue = dataEle[j];
                }
            }

            dataObj = {
                name: name,
                value: data.values[i],
                tooltip: tooltipData,
            };

            if (uiOptions.colorByValue && uiOptions.colorByValue.length > 0) {
                uiOptions.colorByValue.forEach(function (rule) {
                    var i,
                        values = rule.valuesToColor,
                        value;
                    for (i = 0; i < values.length; i++) {
                        value = values[i];
                        if (value === name) {
                            dataObj.itemStyle = {
                                normal: {
                                    color: rule.color,
                                },
                            };
                        }
                    }
                });
            }

            if (uiOptions.highlight) {
                // check all properties in our highlight data
                for (prop in uiOptions.highlight.data) {
                    if (uiOptions.highlight.data.hasOwnProperty(prop)) {
                        // if x-axis label is equal to the property we are
                        if (data.headers[labelIdx] === prop) {
                            uiOptions.highlight.data[prop].forEach(function (
                                hiliteValue
                            ) {
                                if (hiliteValue === name) {
                                    dataObj.itemStyle = {
                                        normal: {
                                            borderColor: '#000',
                                            borderWidth: 2,
                                        },
                                    };
                                }
                            });
                        }
                    }
                }
            }

            radarData.push(dataObj);
        }

        if (uiOptions.normalizeAxis) {
            for (j = 0; j < indicator.length; j++) {
                indicator[j].max = maxValue * 1.05;
            }
        }

        return {
            label: keys[labelIdx].alias,
            indicator: indicator,
            data: radarData,
        };
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
        formatRadar: formatRadar,
    };
}
