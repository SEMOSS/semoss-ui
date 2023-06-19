'use strict';
/**
 * @name gauge-echarts.service.js
 * @desc This service configures our data into echarts data as according to the
 *       e-charts examples (one of which is: https://ecomfe.github.io/echarts-examples/public/editor.html?c=gauge-disk).
 *       This service functions similarly to the other e-charts services but it
 *       has two specific functions: setgaugeDataSeries() and constructChildObj().
 *       The first function simply loops through our structured data and converts
 *       it into the appropriate data object to display gauge data, while the
 *       second is a function and the first calls in order to create child objects
 *       that are populated into our gauge data object.
 */

angular.module('app.gauge.service', []).factory('gaugeService', gaugeService);

gaugeService.$inject = ['semossCoreService'];

function gaugeService(semossCoreService) {
    var globalMin, globalMax;

    function getConfig(type, data, uiOptions, keysObj, groupByInstance, keys) {
        var tempDataObject = formatData(data, keysObj),
            animation = customizeAnimation(uiOptions.animation);

        // Configure data for ECharts
        return {
            data: tempDataObject,
            showLegend: !uiOptions.toggleLegend,
            showAnimation: animation.showAnimation,
            animationType: animation.defaultAnimationType,
            animationDelay: animation.defaultAnimationSpeed,
            animationDuration: animation.defaultAnimationDuration,
            backgroundColorStyle: getBackgroundColorStyle(uiOptions.watermark),
            min: globalMin,
            max: globalMax,
            keys: keysObj,
            groupByInstance: groupByInstance,
            options: getUiOptions(uiOptions),
            allKeys: keys,
        };
    }

    /**
     * @name formatData
     * @desc puts data into ECharts data format
     * @param {Object} data - object of data in original format
     * @param {Object} keysObj - keys info
     * @returns {Object} - object of data in ECharts format
     */
    function formatData(data, keysObj) {
        var returnArray = [],
            labelPos,
            valuePos,
            i;

        for (i = 0; i < data.headers.length; i++) {
            if (
                data.headers[i].replace(/_/g, ' ') ===
                keysObj.label.replace(/_/g, ' ')
            ) {
                labelPos = i;
            } else if (
                data.headers[i].replace(/_/g, ' ') ===
                keysObj.value.replace(/_/g, ' ')
            ) {
                valuePos = i;
            }
        }

        if (data.values.length > 0) {
            if (typeof data.values[0][valuePos] !== 'number') {
                // TODO: Make the alert bound to a widget
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'You can only have Numerical values in the value category, please enter a numerical value.',
                });
                return returnArray;
            }
        }

        for (i = 0; i < data.values.length; i++) {
            returnArray.push({
                name: data.values[i][labelPos] + '',
                value: data.values[i][valuePos],
                tooltip: getTooltipData(data.headers, data.values[i], keysObj),
            });
        }

        getMinMax(returnArray);

        return returnArray;
    }

    /**
     * @name getTooltipData
     * @desc  set tooltip data for feature
     * @param {array} headers headers
     * @param {array} data data
     * @param {Object} keysObj - keys info
     * @returns {object} array of tooltip data
     */
    function getTooltipData(headers, data, keysObj) {
        var tooltipData = {},
            longName,
            prop;

        for (prop in keysObj) {
            if (prop.indexOf('tooltip') > -1) {
                // add back underscores to keysObj name to match header name stored in data
                longName = keysObj[prop].replace(/\s+/g, '_');
                tooltipData[keysObj[prop]] = data[headers.indexOf(longName)];
            }
        }

        return tooltipData;
    }

    function getMinMax(array) {
        globalMin = undefined;
        globalMax = undefined;

        for (
            let valueIdx = 0, valueLen = array.length;
            valueIdx < valueLen;
            valueIdx++
        ) {
            const value = array[valueIdx].value;

            if (typeof globalMin === 'undefined' || value < globalMin) {
                globalMin = value;
            }

            if (typeof globalMax === 'undefined' || value > globalMax) {
                globalMax = value;
            }
        }

        if (globalMin > 0) {
            globalMin = 0;
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

    function getUiOptions(options) {
        return options;
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
