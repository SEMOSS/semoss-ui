'use strict';
/**
 * @name sankey-echarts.service.js
 * @desc configures echarts sankey
 */
angular
    .module('app.sankey.service', [])
    .factory('sankeyService', sankeyService);

sankeyService.$inject = ['semossCoreService'];

function sankeyService(semossCoreService) {
    /**
     * @name getConfig
     * @param {object} data - semoss chart data
     * @param {object} uiOptions - panel ornaments
     * @param {array} keys - semoss chart keys
     * @param {string} groupByInstance - used to determine facet
     * @param {array} colorByValue - color by value data
     * @desc sets echarts sankey configuration object required to paint the chart
     * @returns {object} echarts sankey config
     */
    function getConfig(data, uiOptions, keys, groupByInstance, colorByValue) {
        var sankeyData = formatSankey(data, keys, colorByValue),
            enoughDimensions = countDimensions(keys),
            config;

        config = {
            data: sankeyData,
            groupByInstance: groupByInstance,
            options: uiOptions,
            enoughDimensions: enoughDimensions,
            backgroundColorStyle: getBackgroundColorStyle(uiOptions.watermark),
            title: getChartTitle(uiOptions.chartTitle),
        };
        return config;
    }

    /**
     * @name countDimensions
     * @param {array} keys - semoss chart keys
     * @desc checks for number of labels in chart
     * @return {boolean} trie of more than one label
     */
    function countDimensions(keys) {
        var i,
            count = 0;

        for (i = 0; i < keys.length; i++) {
            if (keys[i].model === 'label') {
                count++;
            }
        }
        if (count > 1) {
            return true;
        }
        return false;
    }

    /**
     * @name formatSankey
     * @param {object} data - semoss chart data
     * @param {array} keys - semoss chart keys
     * @param {array} colorByValue - color by value data
     * @desc sets sankey nodes and links
     * @returns {object} nodes and links
     */
    function formatSankey(data, keys, colorByValue) {
        var potentialNode,
            i,
            j,
            keyIdx,
            headerIdx,
            tipIndex,
            source,
            valueIdx,
            tipPosition,
            dataEle,
            key,
            links = [],
            nodes = [],
            tipIndices = [],
            labelIndices = [],
            node,
            nodeMap = {},
            linkMap = {},
            tipMap = {},
            numTips,
            hasCycle;

        // Iterate through keys to find the value index\
        for (headerIdx = 0; headerIdx < data.headers.length; headerIdx++) {
            for (keyIdx = 0; keyIdx < keys.length; keyIdx++) {
                if (data.headers[headerIdx] === keys[keyIdx].alias) {
                    if (keys[keyIdx].model === 'value') {
                        valueIdx = headerIdx;
                    } else if (keys[keyIdx].model.indexOf('label') > -1) {
                        labelIndices.push(headerIdx);
                    } else if (keys[keyIdx].model.indexOf('tooltip') > -1) {
                        tipIndices.push(headerIdx);
                    }
                }
            }
        }

        // Iterate through data to build node and link maps
        for (i = 0; i < data.values.length; i++) {
            dataEle = data.values[i];
            source = -1;
            for (j = 0; j < labelIndices.length; j++) {
                potentialNode = dataEle[labelIndices[j]];
                if (!nodeMap.hasOwnProperty(potentialNode)) {
                    nodeMap[potentialNode] = true;
                }

                // Build Link Map
                if (source > -1) {
                    // we have a source, so update
                    key = dataEle[source] + '/' + dataEle[labelIndices[j]];
                    if (!linkMap.hasOwnProperty(key)) {
                        // 0 index is actual value
                        // 1 index is tooltip object
                        linkMap[key] = [0, {}];
                    }
                    linkMap[key][0] += dataEle[valueIdx];

                    for (
                        tipIndex = 0;
                        tipIndex < tipIndices.length;
                        tipIndex++
                    ) {
                        tipPosition = tipIndices[tipIndex];
                        if (
                            !linkMap[key][1].hasOwnProperty(
                                data.headers[tipPosition]
                            )
                        ) {
                            linkMap[key][1][data.headers[tipPosition]] = 0;
                        }
                        linkMap[key][1][data.headers[tipPosition]] +=
                            dataEle[tipPosition];
                    }
                }

                // Update for next iteration
                source = labelIndices[j];
            }
        }

        // Create nodes array
        Object.keys(nodeMap).forEach(function (name) {
            node = {
                name: name,
            };
            node.tooltip = nodeMap[name].tooltip;
            if (colorByValue) {
                colorByValue.forEach(function (rule) {
                    rule.valuesToColor.forEach(function (value) {
                        if (value === name) {
                            node.itemStyle = {
                                color: rule.color,
                            };
                        }
                    });
                });
            }
            nodes.push(node);
        });
        // Create links array
        hasCycle = false;
        for (key in linkMap) {
            if (linkMap.hasOwnProperty(key)) {
                if (key.split('/')[0] === key.split('/')[1]) {
                    hasCycle = true;
                } else {
                    links.push({
                        source: key.split('/')[0],
                        target: key.split('/')[1],
                        value: linkMap[key][0],
                        tooltip: linkMap[key][1],
                    });
                }
            }
        }

        if (hasCycle) {
            // TODO: Make the alert bound to a widget
            semossCoreService.emit('alert', {
                color: 'error',
                text: 'Cycles detected in your data. Sankey cannot be rendered.',
            });

            return {
                nodes: [],
                links: [],
            };
        }

        return {
            nodes: nodes,
            links: links,
            tooltip: tipMap,
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
     * @name getChartTitle
     * @desc sets options for chart title
     * @param {*} options - style options
     * @returns {*} object representing chart title
     */
    function getChartTitle(options) {
        return {
            show: true,
            text: options.text,
            fontSize: options.fontSize || 14,
            fontWeight: options.fontWeight || 'bold',
            fontFamily: options.fontFamily || 'Inter',
            fontColor: options.fontColor || '#000000',
            left: options.align || 'left',
        };
    }

    /**
     * @name paintWaterMark
     * @desc paints a custom watermark on the viz
     * @param {string} watermark - string of the watermark text
     * @param {string} backgroundColor user defined panel background color
     * @returns {Object} - canvas details
     */
    function paintWaterMark(watermark, backgroundColor) {
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
        if (backgroundColor) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(-70, -70, 170, 170);
        }
        return canvas;
    }

    return {
        getConfig: getConfig,
        formatSankey: formatSankey,
    };
}
