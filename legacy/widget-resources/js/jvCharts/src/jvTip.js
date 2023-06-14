/** *  jvTip ***/
import * as d3 from 'd3';
import visualizationUniversal from '../../../../core/store/visualization/visualization';
class jvTip {
    constructor(configObj) {
        let tip = this,
            defaultConfig = {
                type: 'simple'
            };
        tip.tipConfig = configObj.tipConfig || defaultConfig;
        tip.chartDiv = configObj.chartDiv;
        tip.options = configObj.uiOptions;

        // Create initial div
        tip.chartDiv.select('.jv-tooltip').remove();

        tip.chartDiv.append('div')
            .attr('class', 'tooltip jv-tooltip')
            .style('pointer-events', 'none')
            .style('opacity', 0);
    }

    showTip(transitionDuration = 50) {
        let tip = this,
            left = 'auto',
            top = 'auto',
            mouse = d3.mouse(tip.chartDiv.select('svg').node()),
            // Logic to determine where tooltip will be placed on page
            leftOfMouse = mouse[0] > (tip.chartDiv._groups[0][0].clientWidth / 2),
            topOfMouse = mouse[1] < (tip.chartDiv._groups[0][0].clientHeight / 2),
            tooltipHeight = tip.toolTip._groups[0][0].clientHeight === 0 ? 75 : tip.toolTip._groups[0][0].clientHeight,
            tooltipWidth = tip.toolTip._groups[0][0].clientWidth,
            t,
            tooltipStyle = tip.options.tooltip || {};

        if (leftOfMouse) {
            if (tooltipWidth === 0) {
                tooltipWidth = 250;
            }
            left = mouse[0] - tooltipWidth;
        } else {
            left = mouse[0];
        }
        if (topOfMouse) {
            top = mouse[1];
        } else {
            if (tooltipHeight === 0) {
                tooltipHeight = 75;
            }
            top = mouse[1] - tooltipHeight;
        }

        if (!leftOfMouse && topOfMouse) {
            left = mouse[0] + 13;
        }


        // COOL CURSOR, a function of the height and width of the container
        // var container = tip.chartDiv.select('.bar-container').node().getBoundingClientRect();
        // svgMouse = d3.mouse(tip.chartDiv.select('.bar-container').node());

        // var tooltipHeight = tip.toolTip._groups[0][0].clientHeight === 0 ? 75 : tip.toolTip._groups[0][0].clientHeight;
        // top = mouse[1] - (tooltipHeight * svgMouse[1] / container.height);

        // var tooltipWidth = tip.toolTip._groups[0][0].clientWidth;
        // left = mouse[0] - (tooltipWidth * svgMouse[0] / container.width);

        // STICKY CURSOR IN THE BOTTOM RIGHT
        // top = mouse[1];
        // left = mouse[0];
        // set max left
        // if(left > container.width - tooltipWidth + container.left) {
        // left = container.width - tooltipWidth + container.left;
        // }

        // // set max top
        // if (top > container.height - tooltipHeight + container.top) {
        // top = container.height - tooltipHeight + container.top;
        // }

        t = d3.transition()
            .duration(transitionDuration)
            .ease(d3.easeLinear);

        tip.toolTip
            .transition(t)
            .style('left', left + 'px')
            .style('top', top + 'px')
            .style('display', 'block')
            .style('opacity', 1)
            .style('background-color', tooltipStyle.backgroundColor || '#FFFFFF')
            .style('border-width', tooltipStyle.borderWidth || '0px')
            .style('border-color', tooltipStyle.borderColor || '')
            .style('border-style', 'solid')
            .style('font-size', parseFloat(tooltipStyle.fontSize) || 12)
            .style('font-family', tooltipStyle.fontFamily || 'Inter')
            .style('color', tooltipStyle.fontColor || '#000000');
    }

    hideTip() {
        let tip = this,
            t = d3.transition()
                .duration('100')
                .ease(d3.easeLinear);
        if (tip.toolTip) {
            tip.toolTip.transition(t).style('display', 'none');
        }
    }

    generateSimpleTip(dataObj, dataTable, dataHeaders) {
        let tip = this,
            tooltipHtml = '';

        if (dataObj.hasOwnProperty('title') && dataObj.title === '') {
            dataObj.title = 'Empty';
        }

        if (dataObj.viz === 'clusters' || dataObj.viz === 'circleviewplot' || dataObj.viz === 'scatterplot' || dataObj.viz === 'treemap' || dataObj.viz === 'singleaxis') {
            tooltipHtml = generateSingleColorHTML(dataObj, dataTable, dataHeaders, tip);
        } else if (dataObj.viz === 'radial' || dataObj.viz === 'pie') {
            tooltipHtml = generatePieHTML(dataObj, dataTable, dataHeaders, tip);
        } else if (dataObj.viz === 'circlepack' || dataObj.viz === 'sunburst') {
            tooltipHtml = generatePackHTML(dataObj, dataHeaders, tip);
        } else if (dataObj.viz === 'heatmap' || dataObj.viz === 'cloud') {
            tooltipHtml = generateHeatmapHTML(dataObj, dataHeaders, dataTable, tip);
        } else if (dataObj.viz === 'sankey') {
            tooltipHtml = generateSankeyHTML(dataObj, dataHeaders, tip);
        } else if (dataObj.viz === 'bubble') {
            tooltipHtml = generateBubbleHTML(dataObj, dataHeaders, tip, dataTable);
        } else if (dataObj.viz === 'boxwhisker') {
            tooltipHtml = generateBoxHTML(dataObj, dataHeaders, tip, dataTable);
        } else if (dataObj.viz === 'clustergram') {
            tooltipHtml = generateClustergramHTML(dataObj, dataHeaders, tip);
        } else if (dataObj.viz === 'gantt') {
            tooltipHtml = generateGanttHTML(dataObj, dataTable, tip);
        } else {
            tooltipHtml = generateSimpleHTML(dataObj, dataHeaders, tip);
        }

        // add content to tooltip
        tip.toolTip = tip.chartDiv.select('.tooltip')
            .html(tooltipHtml);

        // paint the tooltip
        tip.showTip(0);

        return tip.tooltip;
    }
}

/* ***********************************************  Declare jv tip components *******************************************************************************/
var jvHr = '';

/**
 * @name getValueContent
 * @desc creates html for tooltip data
 * @param {*} item - value label
 * @param {*} value - the actual value
 * @param {string} colorTile - html for the color tile
 * @returns {string} html to create the row of data in the tooltip
 */
function getValueContent(item, value, colorTile) {
    let label = item.replace(/_/g, ' '),
        valueString = value.toString() ? `: ${value.toString().replace(/_/g, ' ')}` : '',
        colorTileString = colorTile ? colorTile : '';
    return `<div class='jv-tip-content '>${colorTileString}<span class="jv-tip-item-text">${label}</span>${valueString}</div>`;
}

/**
 * @name getTitleTemplate
 * @param {*} dataObj - the data
 * @returns {string} html to create the title element of the tooltip
 */
function getTitleTemplate(dataObj) {
    let title = dataObj.title.toString().replace(/_/g, ' ');
    return `<div class='title jv-top-margin jv-inline'><b>${title}</b></div>${jvHr}`;
}
/**
 * @name getColorTileByObj
 * @desc checks the whole data object
 * @param {string} defaultColor - default color
 * @param {*} dataObj - data
 * @param {*} colorBy - color by rules
 * @returns {string} - html to create color tile
 */
function getColorTileByObj(defaultColor, dataObj, colorBy) {
    let color;
    for (let i = 0; i < colorBy.length; i++) {
        let rule = colorBy[i],
            cleanCol = rule.colorOn.replace(/_/g, ' ');
        for (let k = 0; k < rule.valuesToColor.length; k++) {
            let valueToColor = rule.valuesToColor[k],
                valueToCheck = dataObj.data[cleanCol];

            if (typeof valueToCheck === 'string') {
                valueToCheck = valueToCheck.replace(/_/g, ' ');
            }

            if (typeof valueToColor === 'string') {
                valueToColor = valueToColor.replace(/_/g, ' ');
            }

            if (valueToColor === valueToCheck) {
                color = rule.color;
            }
        }
    }
    return `<div class='d3-tooltip-circle jv-inline jv-tip-color-tile' style='background:${color ? color : defaultColor}'></div>`;
}

/**
 * @name getColorTileByValue
 * @desc only checks the value
 * @param {*} color default color
 * @param {*} label column name of value
 * @param {*} rawValue the value
 * @param {*} colorByValue colorby rules
 * @param {*} headers headers
 * @returns {string} - html to create color tile
 */
function getColorTileByValue(color, label, rawValue, colorByValue, headers) {
    let column = label ? label.replace(/ /g, '_') : '',
        value,
        colorCode,
        columnType;
    if (colorByValue) {
        // Get the datatype
        for (let k = 0; k < headers.length; k++) {
            if (headers[k].name === column) {
                columnType = headers[k].type;
                break;
            }
        }
        // Convert the value into the right format
        if (columnType === 'NUMBER' || columnType === 'INT' || columnType === 'DOUBLE') {
            value = Number(rawValue);
        }
        if (columnType === 'STRING') {
            value = rawValue.replace(/ /g, '_');
        }
        // Get color from colorby rules
        for (let i = 0; i < colorByValue.length; i++) {
            let rule = colorByValue[i];
            if (rule.colorOn === column && rule.valuesToColor.indexOf(value) > -1) {
                colorCode = colorByValue[i].color;
            }
        }
    }
    // Apply colorby color
    if (colorCode) {
        return `<div class='d3-tooltip-circle jv-inline jv-tip-color-tile' style='background:${colorCode}'></div>`;
    }
    // Case that we either have an rgba object with a toString or a hex color string
    if ((color && Object.getPrototypeOf(color).rgb) || typeof color === 'string') {
        return `<div class='d3-tooltip-circle jv-inline jv-tip-color-tile' style='background:${color}'></div>`;
    // Case that we have a custom rgba object
    } else if (color) {
        return `<div class='d3-tooltip-circle jv-inline jv-tip-color-tile' style='background:rgba(${color.r}, ${color.g}, ${color.b}, ${color.opacity})'></div>`;
    }

    // No color to return
    return '';
}

/**
 * @name createRowHtml
 * @desc creates the html for each value in the tooltip
 * @param {*} tipData - the data to display in the tooltip
 * @param {*} dataHeaders - header info
 * @param {*} tip - tip info
 * @param {*} valuesToSkip - optional: list of values in the tipdata to not add to the html
 * @returns {string} the html
 */
function createRowHtml(tipData, dataHeaders, tip, valuesToSkip = []) {
    let html = '';
    for (let item in tipData) {
        if (tipData.hasOwnProperty(item) && valuesToSkip.indexOf(item) === -1) {
            let type = getDataType(item, dataHeaders),
                formatted = tipData[item],
                additionalFormat = null;
            if (tip.options && tip.options.formatDataValues) {
                additionalFormat = getAdditionalFormat(item, tip.options.formatDataValues.formats);
                formatted = visualizationUniversal.formatValue(formatted, additionalFormat);
            } else if (type) {
                formatted = visualizationUniversal.formatValue(formatted, type);
            }
            html += getValueContent(item, formatted);
        }
    }
    return html;
}

/* ************************************************ Viz Specific Functions **********************************************************************************/

/**
 * @name generateSimpleHTML
 * @desc default function to create the tooltip
 * @param {*} dataObj - the data
 * @param {*} dataHeaders - header info
 * @param {*} tip - tip info
 * @returns {string} html that builds the tooltip
 */
function generateSimpleHTML(dataObj, dataHeaders, tip) {
    let tooltipText,
        colorBy = tip.options.colorByValue;
    tooltipText = `<div><div class='title jv-tip-container jv-top-margin'><b>${dataObj.title}</b></div>${jvHr}`;

    for (let item in dataObj.tipData) {
        if (visualizationUniversal) {
            let type = dataHeaders ? getDataType(item, dataHeaders) : null,
                additionalFormat,
                formatted = dataObj.tipData[item];
            if (tip.options && tip.options.formatDataValues) {
                additionalFormat = getAdditionalFormat(item, tip.options.formatDataValues.formats);
                formatted = visualizationUniversal.formatValue(formatted, additionalFormat);
            } else if (type) {
                formatted = visualizationUniversal.formatValue(formatted, type);
            }
            tooltipText += getValueContent(item, formatted, getColorTileByObj(dataObj.color[item], dataObj, colorBy));
        } else {
            tooltipText += getValueContent(item, dataObj.tipData[item], getColorTileByObj(dataObj.color[item], dataObj, colorBy));
        }
    }

    tooltipText += '</div>';
    return tooltipText;
}

/**
 * @name generateSingleColorHTML
 * @desc creates tooltip html for clusters, circleviewplot, scatterplot, treemap, singleaxis
 * @param {*} dataObj - the data
 * @param {*} dataTable - mapping of data
 * @param {*} dataHeaders - header info
 * @param {*} tip - tip info
 * @returns {string} html that builds the tooltip
 */
function generateSingleColorHTML(dataObj, dataTable, dataHeaders, tip) {
    let tooltipText,
        tooltipColor,
        showColorCircle = true,
        colorCircle = '',
        colorBy = tip.options.colorByValue;

    if (!!dataObj.color[dataObj.data[dataTable.series]]) {
        tooltipColor = dataObj.color[dataObj.data[dataTable.series]];
    } else if (!!dataObj.color[dataTable.label] && dataObj.viz !== 'singleaxis') {
        tooltipColor = dataObj.color[dataTable.label];
    } else if (dataObj.color && dataObj.viz === 'singleaxis') {
        tooltipColor = dataObj.color;
    } else {
        showColorCircle = false;
    }

    if (showColorCircle) {
        if (dataObj.viz === 'treemap') {
            colorCircle = getColorTileByObj(tooltipColor, dataObj, colorBy);
        } else {
            colorCircle = getColorTileByValue(tooltipColor, dataTable.label, dataObj.title, colorBy, dataHeaders);
        }
    } else {
        colorCircle = getColorTileByValue();
    }

    tooltipText = `<div class='jv-inline jv-full-width'>${colorCircle}<div class='title jv-inline jv-top-margin'><b>${dataObj.title}</b></div>${jvHr}`;

    tooltipText += createRowHtml(dataObj.tipData, dataHeaders, tip);

    tooltipText += '</div>';
    return tooltipText;
}

/**
 * @name generatePackHTML
 * @desc creates tooltip html for circlepack and sunburst
 * @param {*} dataObj - the data
 * @param {*} dataHeaders - header info
 * @param {*} tip - tip info
 * @returns {string} html that builds the tooltip
 */
function generatePackHTML(dataObj, dataHeaders, tip) {
    let tooltipText,
        colorByValue = tip.options.colorByValue;
    tooltipText = `<div class='jv-inline jv-full-width'>
        ${getColorTileByValue(dataObj.data.color, dataObj.data.data.label, dataObj.title, colorByValue, dataHeaders)}
        ${getTitleTemplate(dataObj)}`;
    tooltipText += createRowHtml(dataObj.tipData, dataHeaders, tip);

    tooltipText += '</div>';
    return tooltipText;
}
/**
 * @name generateBubbleHTML
 * @desc creates tooltip html for bubble
 * @param {*} dataObj - the data
 * @param {*} dataHeaders - header info
 * @param {*} tip - tip info
 * @param {*} dataTable - mapping of data
 * @returns {string} html that builds the tooltip
 */
function generateBubbleHTML(dataObj, dataHeaders, tip, dataTable) {
    let tooltipText,
        colorByValue = tip.options.colorByValue,
        label = dataTable.label.replace(/ /g, '_'); // Bubble uses rawdata so we need to replace the spaces
    tooltipText = `<div class='jv-inline jv-full-width'>
        ${getColorTileByValue(dataObj.data.color, label, dataObj.data[label], colorByValue, dataHeaders)}
        ${getTitleTemplate(dataObj)}`;

    tooltipText += createRowHtml(dataObj.tipData, dataHeaders, tip, ['color']);

    tooltipText += '</div>';
    return tooltipText;
}

/**
 * @name generateBoxHTML
 * @desc creates tooltip html for boxwhisker
 * @param {*} dataObj - the data
 * @param {*} dataHeaders - header info
 * @param {*} tip - tip info
 * @param {*} dataTable - mapping of data
 * @returns {string} html that builds the tooltip
 */
function generateBoxHTML(dataObj, dataHeaders, tip, dataTable) {
    let tooltipText,
        colorByValue = tip.options.colorByValue,
        colorTile = getColorTileByValue(dataObj.color, dataTable.labelCol, dataTable.label, colorByValue, dataHeaders);
    tooltipText = `<div class="jv-inline jv-full-width">${colorTile}<div class='title jv-tip-container jv-inline jv-top-margin'><b>${dataObj.tipData.label}</b></div>`;

    tooltipText += createRowHtml(dataObj.tipData, dataHeaders, tip, ['Value', 'label', 'labelCol']);

    tooltipText += '</div>';
    return tooltipText;
}
/**
 * @name generateHeatmapHTML
 * @desc creates tooltip html for heatmap and cloud
 * @param {*} dataObj - the data
 * @param {*} dataHeaders - header info
 * @param {*} dataTable - mapping of data
 * @param {*} tip - tip info
 * @returns {string} html that builds the tooltip
 */
function generateHeatmapHTML(dataObj, dataHeaders, dataTable, tip) {
    let tooltipText,
        colorBy = tip.options.colorByValue;
    if (dataObj.xAxisCat) {
        tooltipText = `<div class='jv-inline jv-full-width'>
            ${getColorTileByValue(dataObj.color, dataTable.label, dataObj.title, colorBy, dataHeaders)}` +
            "<div class='title jv-top-margin jv-inline jv-full-width'><b>" + dataObj.data.xAxisName + "</b></div><hr style='margin:3px 0 3px 0;'/>";

        tooltipText += "<span class='jv-tip-content'>" + dataObj.xAxisCat + '</span><br/>';
        tooltipText += '</div>';
        return tooltipText;
    } else if (dataObj.yAxisCat) {
        tooltipText = `<div class='jv-inline jv-full-width'>
            ${getColorTileByValue(dataObj.color, dataTable.label, dataObj.title, colorBy, dataHeaders)}` +
            "<div class='title jv-top-margin jv-inline jv-full-width'><b>" + dataObj.data.yAxisName + "</b></div><hr style='margin:3px 0 3px 0;'/>";

        tooltipText += "<span class='jv-tip-content'>" + dataObj.yAxisCat + '</span><br/>';
        tooltipText += '</div>';
        return tooltipText;
    }
    tooltipText = `<div class='jv-inline jv-full-width'>
            ${getColorTileByValue(dataObj.color, dataTable.label, dataObj.title, colorBy, dataHeaders)}
            ${getTitleTemplate(dataObj)}`;

    tooltipText += createRowHtml(dataObj.tipData, dataHeaders, tip);

    tooltipText += '</div>';
    return tooltipText;
}
/**
 * @name generateClusterHTML
 * @desc creates tooltip html for clustergram
 * @param {*} dataObj - the data
 * @param {*} dataHeaders - header info
 * @param {*} tip - tip info
 * @returns {string} html that builds the tooltip
 */
function generateClustergramHTML(dataObj, dataHeaders, tip) {
    let tooltipText;
    dataObj.title = dataObj.title.replace(/_/g, ' ');
    tooltipText = `<div class='jv-inline jv-full-width'>
    ${getColorTileByValue(dataObj.color)}
    ${getTitleTemplate(dataObj)}`;
    tooltipText += createRowHtml(dataObj.tipData, dataHeaders, tip);

    tooltipText += '</div>';

    return tooltipText;
}
/**
 * @name generateGanttHTML
 * @desc creates tooltip html for gantt
 * @param {*} dataObj - the data
 * @param {*} dataHeaders - header info
 * @param {*} tip - tip info
 * @returns {string} html that builds the tooltip
 */
function generateGanttHTML(dataObj, dataHeaders, tip) {
    var tooltipText;

    dataObj.title = String(dataObj.title).replace(/_/g, ' ');

    tooltipText = `<div class='jv-inline jv-full-width'>
    ${getTitleTemplate(dataObj)}`;
    tooltipText += createRowHtml(dataObj.tipData, dataHeaders, tip);

    tooltipText += '</div>';

    return tooltipText;
}
/**
 * @name generatePieHTML
 * @desc creates tooltip html for radial, pie
 * @param {*} dataObj - the data
 * @param {*} dataTable - mapping of data
 * @param {*} dataHeaders - header info
 * @param {*} tip - tip info
 * @returns {string} html that builds the tooltip
 */
function generatePieHTML(dataObj, dataTable, dataHeaders, tip) {
    let tooltipText,
        colorByValue = tip.options.colorByValue;
    tooltipText = `<div class='jv-inline jv-full-width'>${getColorTileByValue(dataObj.color[dataObj.data[dataTable.label]], dataTable.label, dataObj.data[dataTable.label], colorByValue, dataHeaders)}${getTitleTemplate(dataObj)}`;
    tooltipText += createRowHtml(dataObj.tipData, dataHeaders, tip);
    tooltipText += '</div>';
    return tooltipText;
}
/**
 * @name generateSankeyHTML
 * @desc creates tooltip html for sankey
 * @param {*} dataObj - the data
 * @param {*} dataHeaders - header info
 * @param {*} tip - tip info
 * @returns {string} html that builds the tooltip
 */
function generateSankeyHTML(dataObj, dataHeaders, tip) {
    let tooltipText;
    tooltipText = `<div class='jv-inline jv-full-width'>${getTitleTemplate(dataObj)}`;
    tooltipText += createRowHtml(dataObj.tipData, dataHeaders, tip);
    tooltipText += '</div>';
    return tooltipText;
}
/* ************************************************ Utility Functions **********************************************************************************/
/**
 * @name getDataType
 * @desc gets the datatype of a column
 * @param {string} item - the data
 * @param {*} dataHeaders - header info
 * @returns {string} datatype
 */
function getDataType(item, dataHeaders) {
    let type;
    for (let i = 0; i < dataHeaders.length; i++) {
        if (dataHeaders[i].name === item.replace(/ /g, '_')) {
            type = dataHeaders[i].additionalDataType ? dataHeaders[i].additionalDataType : dataHeaders[i].type;
            break;
        }
    }
    return type;
}
/**
 * @name getAdditionalFormat
 * @desc grabs any additional formatting rules
 * @param {string} item - column
 * @param {*} options - viz formatting options
 * @returns {*} the matching format
 */
function getAdditionalFormat(item, options) {
    let format;
    for (let i = 0; i < options.length; i++) {
        if (options[i].dimension === item.replace(/ /g, '_')) {
            format = options[i];
            break;
        }
    }
    return format;
}

export default jvTip;
