'use strict';
import * as d3 from 'd3';
import jvCharts from '../jvCharts.js';
import visualizationUniversal from '../../../../../core/store/visualization/visualization';

jvCharts.prototype.bubble = {
    paint: paint,
    setData: setData,
    getEventData: getEventData,
    highlightFromEventData: highlightFromEventData
};

jvCharts.prototype.generateBubble = generateBubble;

/* *********************************************** Bubble functions ******************************************************/

function paint(transitionTime) {
    var chart = this,
        bubbleMargins = {
            top: 15,
            right: 15,
            left: 15,
            bottom: 15
        };
    if (transitionTime || transitionTime === 0) {
        chart._vars.transitionTime = transitionTime;
    } else if (!chart._vars.transitionTime) {
        chart._vars.transitionTime = 800;
    }
    if (!chart.smallerFontRepaint) {
        chart._vars.fontSizeMax = 80;
        chart.currentData = chart.data;
    } else {
        chart.currentData = JSON.parse(JSON.stringify(chart.data));
    }

    chart._vars.color = chart.data.color;

    // Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, bubbleMargins);
    chart.generateVerticalLegend('generateBubble');
    chart.generateBubble(chart.currentData);
}

/* setData
 *  gets Bubble data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    // define color object for chartData
    chart.data.legendData = setBubbleLegendData(chart.data);
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}

function getEventData(event) {
    var chart = this,
        ele = event.target.classList.value.split('bubble-data-')[1],
        rawValue = event.target.getAttribute('data-raw-value');
    if (ele) {
        let value = rawValue ? rawValue : jvCharts.getRawForValue(ele);
        return {
            data: {
                [chart.currentData.dataTable.label.replace(/ /g, '_')]: [value]
            },
            node: event.target
        };
    } else if (event.target.classList.value.indexOf('bubble-container') > -1) {
        return {
            data: {
                [chart.currentData.dataTable.label.replace(/ /g, '_')]: []
            },
            node: event.target
        };
    }
    return {
        data: false
    };
}

/* setBubbleLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setBubbleLegendData(data) {
    var legendArray = [],
        item = data.dataTable.label.replace(/ /g, '_');

    for (let value in data.chartData) {
        if (data.chartData.hasOwnProperty(value)) {
            let legendElement = data.chartData[value][item];
            if (legendArray.indexOf(legendElement) === -1) {
                legendArray.push(legendElement);
            }
        }
    }

    return legendArray;
}

function highlightFromEventData(event) {
    let chart = this,
        label,
        cssClass,
        node;

    if (event.data[chart.currentData.dataTable.label.replace(/ /g, '_')]) {
        label = event.data[chart.currentData.dataTable.label.replace(/ /g, '_')][0];
        cssClass = '.highlight-class-' + jvCharts.getViewForValue(label);
        node = chart.svg.selectAll(cssClass);
    }
    chart.svg.selectAll('.bubble')
        .attr('stroke', 0)
        .attr('stroke-width', 0);
    // highlight necessary slices
    if (node) {
        node
            .attr('stroke', chart._vars.highlightBorderColor)
            .attr('stroke-width', chart._vars.highlightBorderWidth);
    }
}


/* generateBubble
 *
 * paints the bubble  on the chart
 * @params bubble Data
 */
function generateBubble(bubbleData) {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        width = container.width,
        height = container.height,
        pack = d3.pack().size([width, height]).padding(1.5),
        legendData = chart.data.legendData,
        valueKey = chart.data.dataTable.value.replace(/ /g, '_'),
        labelKey = chart.data.dataTable.label.replace(/ /g, '_'),
        colors = chart._vars.color,
        colorByValue = chart._vars.colorByValue,
        dataHeaders,
        bubbleDataNew,
        legendElementToggleArray,
        root,
        bubble,
        additionalFormats = chart.config.options.formatDataValues ? chart.config.options.formatDataValues : null;
    if (!chart._vars.legendHeaders) {
        chart._vars.legendHeaders = legendData;
    }
    dataHeaders = chart._vars.legendHeaders;
    if (!chart._vars.legendHeaders) {
        chart._vars.legendHeaders = legendData;
    }
    bubbleDataNew = jvCharts.getToggledData(bubbleData, dataHeaders);
    legendElementToggleArray = jvCharts.getLegendElementToggleArray(dataHeaders, legendData);

    if (legendElementToggleArray) {
        for (let j = 0; j < bubbleDataNew.length; j++) {
            for (let legendEle of legendElementToggleArray) {
                if (legendEle.element === bubbleDataNew[j][labelKey] && legendEle.toggle === false) {
                    bubbleDataNew.splice(j, 1);
                }
            }
        }
    }
    svg.selectAll('.bubble').remove();
    // assigns the data to a hierarchy using parent-child relationships
    root = d3.hierarchy({ children: bubbleDataNew })
        .sum(d => d[valueKey]);

    bubble = svg.selectAll('.bubble')
        .data(pack(root).leaves())
        .enter().append('g')
        .attr('class', (d) => 'bubble')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    bubble.append('circle')
        .attr('fill', d => {
            if (colorByValue && jvCharts.colorByValue(d, colorByValue)) {
                return jvCharts.colorByValue(d, colorByValue);
            }
            return jvCharts.getColors(colors, legendData.indexOf(d.data[labelKey]), d.data[labelKey]);
        })
        .attr('class', (d, i) => `editable editable-bubble bubble-${i} highlight-class-${jvCharts.getViewForValue(d.data[labelKey])}  bubble-data-${jvCharts.getViewForValue(d.data[labelKey])}`)
        .attr('r', d => d.r)
        .attr('data-raw-value', d => d.data[labelKey])
        .on('mouseover', function (d, i) {
            if (chart._vars.showTooltips) {
                // Get tip data
                var tipData = chart.setTipData(d.data, i);
                // Draw tip line
                tipData.data.color = jvCharts.getColors(colors, tipData.index, d.data[labelKey]);
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                chart.tip.d = d.data;
                chart.tip.i = i;
            }
        })
        .on('mousemove', function (d, i) {
            if (chart._vars.showTooltips) {
                if (chart.tip.d === d && chart.tip.i === i) {
                    chart.tip.showTip(0);
                } else {
                    // Get tip data
                    var tipData = chart.setTipData(d.data, i);
                    // Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                }
            }
        })
        .on('mouseout', function () {
            if (chart._vars.showTooltips) {
                chart.tip.hideTip();
            }
        })
        .on('contextmenu', function (d) {
            if (labelKey && d.hasOwnProperty('data') && d.data[labelKey]) {
                chart.config.setContextMenuDataFromClick(typeof d.data[labelKey] === 'string' ? d.data[labelKey].replace(/ /g, '_') : d.data[labelKey],
                    {
                        name: [typeof labelKey === 'string' ? labelKey.replace(/ /g, '_') : labelKey]
                    }
                );
                chart.config.openContextMenu(d3.event);
            }
        });

    if (!chart._vars.displayValues) {
        let fontSize = parseFloat(chart._vars.valueLabel.fontSize) || chart._vars.fontSize || 12,
            fontFamily = chart._vars.valueLabel.fontFamily || 'Inter',
            fontWeight = chart._vars.valueLabel.fontWeight || 400,
            fontColor = chart._vars.valueLabel.fontColorAlt || chart._vars.valueLabel.fontColor || '#FFFFFF';
        bubble.append('text')
            .attr('class', 'bubble-text')
            .text(d => (d.data[labelKey] ? d.data[labelKey].toString().replace(/_/g, ' ') : 'NA') )
            // hide text if its too wide
            .attr('style', function (d) {
                if (this.clientWidth > d.r * 2) {
                    return 'display: none';
                }
                return '';
            })
            .style('font-family', fontFamily)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .style('fill', fontColor)
            // center the text on the bubble
            .attr('transform', function (d) {
                var diameter = d.r * 2,
                    textWidth = this.clientWidth,
                    emptySpace = diameter - textWidth;

                if (emptySpace < 0) {
                    return '';
                }
                return `translate(-${d.r - (emptySpace / 2)}, 0)`;
            })
            .on('mouseover', function (d, i) {
                if (chart._vars.showTooltips) {
                    // Get tip data
                    var tipData = chart.setTipData(d.data, i);

                    // Draw tip line
                    tipData.data.color = jvCharts.getColors(colors, tipData.index, d.data[labelKey]);
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                    chart.tip.d = d.data;
                    chart.tip.i = i;
                }
            })
            .on('mousemove', function (d, i) {
                if (chart._vars.showTooltips) {
                    if (chart.tip.d === d && chart.tip.i === i) {
                        chart.tip.showTip(0);
                    } else {
                        // Get tip data
                        var tipData = chart.setTipData(d.data, i);
                        // Draw tip line
                        chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                    }
                }
            })
            .on('mouseout', function () {
                if (chart._vars.showTooltips) {
                    chart.tip.hideTip();
                }
            });

        bubble.append('text')
            .text(d => {
                let type,
                    format,
                    formattedValue = d.data[valueKey];
                for (let i = 0; i < chart.data.dataTableKeys.length; i++) {
                    if (valueKey && chart.data.dataTableKeys[i].name === valueKey.replace(/ /g, '_')) {
                        type = chart.data.dataTableKeys[i].additionalDataType;
                        break;
                    }
                }
                if (additionalFormats) {
                    for (let i = 0; i < additionalFormats.formats.length; i++) {
                        if (additionalFormats.formats[i].dimension === valueKey.replace(/ /g, '_')) {
                            format = additionalFormats.formats[i];
                            break;
                        }
                    }
                    formattedValue = visualizationUniversal.formatValue(formattedValue, format);
                } else if (type) {
                    formattedValue = visualizationUniversal.formatValue(formattedValue, type);
                } else {
                    formattedValue = d3.format(',.0f')(formattedValue);
                }
                return formattedValue;
            })
            // hide text if its too wide
            .attr('style', function (d) {
                if (this.clientWidth > d.r * 2) {
                    return 'display: none';
                }
                return '';
            })
            .style('font-family', fontFamily)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .style('fill', fontColor)
            // center the text on the bubble
            .attr('transform', function (d) {
                var diameter = d.r * 2,
                    textWidth = this.clientWidth,
                    emptySpace = diameter - textWidth;

                if (emptySpace < 0) {
                    return '';
                }
                return `translate(-${d.r - (emptySpace / 2)}, 15)`;
            })
            .on('mouseover', function (d, i) {
                if (chart._vars.showTooltips) {
                    // Get tip data
                    var tipData = chart.setTipData(d.data, i);

                    // Draw tip line
                    tipData.data.color = jvCharts.getColors(colors, tipData.index, d.data[labelKey]);
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                    chart.tip.d = d.data;
                    chart.tip.i = i;
                }
            })
            .on('mousemove', function (d, i) {
                if (chart._vars.showTooltips) {
                    if (chart.tip.d === d && chart.tip.i === i) {
                        chart.tip.showTip(0);
                    } else {
                        // Get tip data
                        var tipData = chart.setTipData(d.data, i);
                        // Draw tip line
                        chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                    }
                }
            })
            .on('mouseout', function () {
                if (chart._vars.showTooltips) {
                    chart.tip.hideTip();
                }
            });
    }
}

export default jvCharts;
