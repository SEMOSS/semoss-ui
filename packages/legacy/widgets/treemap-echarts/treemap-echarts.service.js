'use strict';
/**
 * @name treemap-echarts.service.js
 * @desc This service configures our data into echarts data as according to the
 *       e-charts examples (one of which is: https://ecomfe.github.io/echarts-examples/public/editor.html?c=treemap-disk).
 *       This service functions similarly to the other e-charts services but it
 *       has two specific functions: setTreemapDataSeries() and constructChildObj().
 *       The first function simply loops through our structured data and converts
 *       it into the appropriate data object to display treemap data, while the
 *       second is a function and the first calls in order to create child objects
 *       that are populated into our treemap data object.
 */
export default angular
    .module('app.treemap.service', [])
    .factory('treemapService', treemapService);

treemapService.$inject = ['semossCoreService'];

function treemapService(semossCoreService) {
    var hasTooltips = false,
        bigGrouping = false;

    function getConfig(
        type,
        data,
        uiOptions,
        keysObj,
        groupByInstance,
        allKeys
    ) {
        var tempDataObject = formatData(data, keysObj),
            animation = customizeAnimation(uiOptions.animation);

        // Configure data for ECharts
        return {
            data: setTreemapDataSeries(data, keysObj, uiOptions),
            legendLabels: getLegendLabels(data.headers, keysObj),
            showLegend: !uiOptions.toggleLegend,
            showAnimation: animation.showAnimation,
            animationType: animation.defaultAnimationType,
            animationDelay: animation.defaultAnimationSpeed,
            animationDuration: animation.defaultAnimationDuration,
            backgroundColorStyle: getBackgroundColorStyle(uiOptions.watermark),
            groupByInstance: groupByInstance,
            options: getUiOptions(uiOptions),
            keys: allKeys,
            upperLabelStyle: getLabelStyle(uiOptions.treemap),
            breadcrumbStyle: getBreadcrumbStyle(uiOptions.treemap),
        };
    }

    function getLabelStyle(options) {
        return {
            backgroundColor: options.heading.backgroundColor || 'transparent',
            color: options.heading.fontColor || '#FFFFFF',
            fontFamily: options.heading.fontFamily || 'Inter',
            fontSize: parseFloat(options.heading.fontSize) || 12,
            fontWeight: parseInt(options.heading.fontWeight, 10) || 400,
        };
    }

    function getBreadcrumbStyle(options) {
        return {
            itemStyle: {
                color: options.breadcrumb.backgroundColor || 'grey',
                borderWidth: parseFloat(options.breadcrumb.borderWidth) || 0,
                borderStyle: options.breadcrumb.borderStyle || '',
                borderColor: options.breadcrumb.borderColor || '',
                textStyle: {
                    color: options.breadcrumb.fontColor || '#FFFFFF',
                    fontFamily: options.breadcrumb.fontFamily || 'Inter',
                    fontSize: parseFloat(options.breadcrumb.fontSize) || 12,
                    fontWeight:
                        parseInt(options.breadcrumb.fontWeight, 10) || 400,
                },
            },
        };
    }

    function getLegendLabels(headers, keysObj) {
        var label = '',
            i;

        if (headers && Array.isArray(headers)) {
            for (i = 0; i < headers.length; i++) {
                if (headers[i] === keysObj.label) {
                    label = headers[i];
                }
            }
        }

        return label;
    }

    /**
     * @name formatData
     * @desc puts data into ECharts data format
     * @param {Object} data - object of data in original format
     * @param {Object} keysObj - object of data in ECharts format
     * @return {object} object structured for eCharts
     */
    function formatData(data, keysObj) {
        // Check for null, return empty object
        if (
            Object.keys(data).length === 0 ||
            Object.keys(keysObj).length === 0
        ) {
            return {};
        }

        var eChartsDataObject = {},
            tempNames = [],
            i,
            name;

        // Let the user know that they have duplicate values
        checkForDuplicateTooltips(keysObj);

        // We will display an overall treemap
        if (keysObj.label === keysObj.name) {
            bigGrouping = true;
        }

        for (i = 0; i < data.values.length; i++) {
            name = data.values[i][0];

            if (tempNames.indexOf(name) === -1) {
                tempNames.push(name);
            }
        }

        eChartsDataObject.valuesNames = tempNames;

        if (data.headers.length > 3) {
            hasTooltips = true;
        }

        return eChartsDataObject;
    }

    function checkForDuplicateTooltips(keysObj) {
        var i;

        for (i in keysObj) {
            if (keysObj.hasOwnProperty(i)) {
                if (
                    i.indexOf('tooltip') !== -1 &&
                    (keysObj[i] === keysObj.label ||
                        keysObj[i] === keysObj.series ||
                        keysObj[i] === keysObj.size)
                ) {
                    // TODO: Make the alert bound to a widget
                    semossCoreService.emit('alert', {
                        color: 'warn',
                        text:
                            keysObj[i] +
                            ' is already being displayed in the tooltip. Ignoring this entry for now.',
                    });
                }
            }
        }
    }

    /**
     * @name customizeAnimation
     * @desc sets the animation style
     * @param {object} param - object of animation settings
     * @returns {object} - object of animation settings
     */
    function customizeAnimation(param) {
        var animationSettings = {};
        // TODO small refactor
        if (param && param.chooseType === 'No Animation') {
            animationSettings.showAnimation = false;
        } else if (param) {
            animationSettings.showAnimation = true;
            animationSettings.defaultAnimationType = param.chooseType;
            animationSettings.defaultAnimationSpeed = param.animationSpeed;
            animationSettings.defaultAnimationDuration =
                param.animationDuration;
        } else {
            // default
            animationSettings.showAnimation = true;
            // TODO set as same as widget service default state
            animationSettings.defaultAnimationType = 'No Animation';
            animationSettings.defaultAnimationSpeed = 1;
            animationSettings.defaultAnimationDuration = 500;
        }
        return animationSettings;
    }

    /**
     * @name setTreemapDataSeries
     * @param {Object} data - object that contains our actual data
     * @param {Object} keysObj - Object that contains the mapping of headers and names for our data
     * @param {Object} uiOptions - Object that contains the ui options
     * @returns {array} - array of our data that is defined as according to: https://ecomfe.github.io/echarts-examples/public/editor.html?c=treemap-disk
     * @desc Takes in our default eCharts data alignment and converts it to the proper format for
     *       the eCharts treemap. The final data object is an array of objects that contain a children
     *       array as well as values.
     */
    function setTreemapDataSeries(data, keysObj, uiOptions) {
        // Check for improper values being passed
        if (
            !data.headers ||
            !data.values ||
            !keysObj.label ||
            !keysObj.series ||
            !keysObj.size
        ) {
            return [];
        }

        var seriesArray = [],
            headers = data.headers,
            dataArray = data.values,
            tempChild = {},
            headerMapping = {},
            label = keysObj.label,
            series = keysObj.series,
            size = keysObj.size,
            seriesPosition = headers.indexOf(series.replace(/ /g, '_')),
            labelPosition = headers.indexOf(label.replace(/ /g, '_')),
            sizePosition = headers.indexOf(size.replace(/ /g, '_')),
            tooltipPositions = [],
            tooltipHeaderName = '',
            tempObj = {},
            i,
            j;

        if (bigGrouping) {
            seriesArray.push({
                name: 'Overall',
                path: 'Overall',
                children: [],
            });
        }

        if (hasTooltips) {
            for (i = 0; i < headers.length; i++) {
                if (
                    i !== seriesPosition &&
                    i !== labelPosition &&
                    i !== sizePosition
                ) {
                    tooltipPositions.push(i);
                }
            }
        }

        // Loop through each element in our dataArray and either create a parent object for it
        // if the headerMapping doesn't have it and then push in our child, or simply push
        // in our child if the headerMapping does contain this specific instance of our series
        for (i = 0; i < dataArray.length; i++) {
            tempChild = constructChildObj(
                dataArray[i][seriesPosition],
                dataArray[i][labelPosition],
                dataArray[i][sizePosition],
                uiOptions
            );

            if (tempChild === -1) {
                return [];
            }
            // We pass this in so that we can properly display our data in tooltips
            tempChild.keys = {
                seriesName: series,
                labelName: label,
                sizeName: size,
            };

            // Push in tooltips
            if (hasTooltips) {
                for (j = 0; j < tooltipPositions.length; j++) {
                    tooltipHeaderName = headers[tooltipPositions[j]];
                    tempObj[tooltipHeaderName] =
                        dataArray[i][tooltipPositions[j]];
                }

                tempChild.tooltips = tempObj;
                tempObj = {};
            }

            if (!bigGrouping) {
                const cleanHeader = dataArray[i][seriesPosition];

                if (headerMapping.hasOwnProperty(cleanHeader)) {
                    seriesArray[headerMapping[cleanHeader]].children.push(
                        tempChild
                    );
                } else {
                    headerMapping[cleanHeader] =
                        Object.keys(headerMapping).length;
                    seriesArray.push({
                        name: cleanHeader,
                        path: cleanHeader,
                        children: [],
                    });
                    seriesArray[headerMapping[cleanHeader]].children.push(
                        tempChild
                    );
                }
                tempChild = {};
            } else {
                seriesArray[0].children.push(tempChild);
            }
        }

        return seriesArray;
    }

    function getUiOptions(options) {
        if (options.showParent === true) {
            options.levels = [
                {
                    itemStyle: {
                        normal: {
                            borderColor: 'transparent',
                            borderWidth: 0,
                            gapWidth: 0,
                        },
                    },
                    upperLabel: {
                        normal: {
                            show: false,
                        },
                    },
                },
                {
                    itemStyle: {
                        normal: {
                            borderColor: 'transparent',
                            borderWidth: 0,
                            gapWidth: 0,
                        },
                        emphasis: {
                            borderColor: 'transparent',
                        },
                    },
                },
                {
                    colorSaturation: [0.35, 0.5],
                    itemStyle: {
                        normal: {
                            borderWidth: 0,
                            gapWidth: 0,
                            borderColorSaturation: 0.6,
                        },
                    },
                },
            ];

            options.showParent = true;
        } else {
            options.levels = [
                {
                    itemStyle: {
                        normal: {
                            borderWidth: 0,
                            gapWidth: 0,
                        },
                    },
                },
                {
                    itemStyle: {
                        normal: {
                            gapWidth: 0,
                        },
                    },
                },
                {
                    colorSaturation: [0.35, 0.5],
                    itemStyle: {
                        normal: {
                            gapWidth: 0,
                            borderColorSaturation: 0.6,
                        },
                    },
                },
            ];

            options.showParent = false;
        }
        options.formatDataValues = options.formatDataValues;
        return options;
    }

    /**
     * @name replaceSpacesWithUnderScores
     * @param {string | number} value the value to replace
     * @desc if number just returns value, otherwise removes spaces from string
     * @return {string | number} altered value
     */
    function replaceSpacesWithUnderScores(value) {
        if (typeof value === 'string') {
            return value.replace(/ /g, '_');
        }

        return value;
    }

    /**
     * @name constructChildObj
     * @param {string} series - The instance of series to use for our childObj
     * @param {string} label - The instance of lable to use for our childObj
     * @param {string} amt - The value to use for our childObj
     * @param {object} uiOptions - semoss ui options
     * @return {Object} The childObj to push into our seriesArray in setTreemapDataSeries()
     * @desc Creates a child object using series, label, and value. If a child object
     *       should contain any other relavent data pieces this is where they should
     *       be calculated and inserted.
     */
    function constructChildObj(series, label, amt, uiOptions) {
        // Check for null values
        if (amt === null) {
            amt = 0;
        }
        if (series === null || label === null || amt === null) {
            // TODO: Make the alert bound to a widget
            semossCoreService.emit('alert', {
                color: 'error',
                text: 'Child object contains null values, cannot paint',
            });
            return -1;
        }

        var tempLabel = '',
            tempSeries = '',
            itemStyle = {};

        if (uiOptions.colorByValue && uiOptions.colorByValue.length > 0) {
            uiOptions.colorByValue.forEach(function (rule) {
                var i, value;
                for (i = 0; i < rule.valuesToColor.length; i++) {
                    value = replaceSpacesWithUnderScores(rule.valuesToColor[i]);
                    if (
                        replaceSpacesWithUnderScores(series) === value ||
                        replaceSpacesWithUnderScores(label) === value ||
                        replaceSpacesWithUnderScores(amt) === value
                    ) {
                        itemStyle.color = rule.color;
                    }
                }
            });
        }
        // Make labels easy to read
        if (typeof label === 'string') {
            tempLabel = label.replace(/_/g, ' ');
        } else {
            tempLabel = label;
        }

        // Make series easy to read
        if (typeof series === 'string') {
            tempSeries = series.replace(/_/g, ' ');
        } else {
            tempSeries = series;
        }

        return {
            value: amt,
            name: tempLabel,
            itemStyle: itemStyle,
            path: tempSeries + '/' + tempLabel,
            parent: tempSeries,
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
    };
}
