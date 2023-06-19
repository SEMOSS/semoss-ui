/***  jvCharts ***/
function jvCharts(configObj) {
    "use strict";
    var chart = this;
    chart.config = {
        type: configObj.type.toLowerCase(),
        name: configObj.name,
        zoomEvent: null,
        container: configObj.container
    };

    chart.tip = new jvTip_v3({
        type: configObj.tipConfig.type,
        chartDiv: configObj.chartDiv
    });

    chart.options = chart.cleanToolData(configObj.options);

    chart.showComments = false;

    chart.draw = {};
    chart.currentData = {};
    chart.chartDiv = configObj.chartDiv;
}

/************************************************ Data functions ******************************************************/

/**setBarData
 *  gets bar data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
jvCharts.prototype.setBarData = function (data, dataTable, colors) {
    var chart = this;

    chart.data = {chartData: data, dataTable: dataTable};

    //sort chart data if there is a sort type and label in the options
    if (chart.options.sortType) {
        if (chart.options.sortLabel) {
            chart.organizeChartData(chart.options.sortLabel, chart.options.sortType);
        }
    }
    chart.data.legendData = setBarLineLegendData(chart.data);
    chart.data.xAxisData = setXAxisData(chart.data);
    chart.data.yAxisData = setYAxisData(chart.data);
    if (chart.options.seriesFlipped) {
        chart.setFlippedSeries();
        chart.flippedData.color = chart.setChartColors(chart.options.color, chart.flippedData.legendData, colors);
    }

    //define color object for chartData
    chart.data.color = chart.setChartColors(chart.options.color, chart.data.legendData, colors);
};


/**setBarLineLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setBarLineLegendData(data) {
    var legendArray = [];
    for (var item in data.dataTable) {
        if (data.dataTable.hasOwnProperty(item)) {
            if (item !== 'label') {
                legendArray.push(data.dataTable[item]);
            }
        }
    }
    return legendArray;
}
/**setXAxisData
 *  gets x axis data based on the chartData
 *
 * @params data, dataTable
 * @returns object with label and values
 */
function setXAxisData(data) {
    //declare vars
    var xAxisData = [];
    var chartData = data.chartData;
    var label = '';
    var textorNum = 'text';

    if (data.dataTable) {
        label = data.dataTable.label;
    } else {
        console.log('dataTable does not exist');
    }

    //loop through data to get the x axis data
    for (var i = 0; i < chartData.length; i++) {
        if (chartData[i][label]) {
            xAxisData.push(chartData[i][label]);
        }
    }

    return {
        'label': label,
        'values': xAxisData,
        'textOrNum': textorNum
    };
}
/**setYAxisData
 *  gets y axis data based on the chartData
 *
 * @params data, dataTable
 * @returns object with label and values
 */
function setYAxisData(data, options) {
    //declare vars
    var yAxisData = [],
        label = '',
        chartData = data.chartData,
        yMin = 0,
        yMax = 0,
        yMaxStack = 0,
        textOrNum = 'text';


    //loop over data to find max and min
    //also determines the y axis total if the data is stacked
    for (var i = 0; i < chartData.length; i++) {
        var stack = 0;

        for (var k in data.dataTable) {
            if (data.dataTable.hasOwnProperty(k) && chartData[i].hasOwnProperty(data.dataTable[k])) {
                var num = chartData[i][data.dataTable[k]];
                if (!isNaN(num) && (label === '' || data.dataTable[k] === label)) {
                    num = parseFloat(num);
                    textOrNum = 'num';
                    stack += num;
                    if (num > yMax) {
                        yMax = num;
                    }
                    if (num < yMin) {
                        yMin = num;
                    }
                }
            }
        }
        if (stack > yMaxStack) {
            yMaxStack = stack;
        }
    }

    yAxisData.push(yMin);
    if (options && options.stackToggle === 'stack-data') {
        yAxisData.push(yMaxStack);
    } else {
        yAxisData.push(yMax);
    }


    return {
        'label': label,
        'values': yAxisData,
        'textOrNum': textOrNum
    };
}


/**setFlippedSeries
 *  flips series and returns flipped data
 *
 * @params chartData, dataTable, dataLabel
 * @returns Object of data and table for flipped series
 */
jvCharts.prototype.setFlippedSeries = function () {
    var chart = this;
    var chartData = chart.data.chartData;
    var dataTable = chart.data.dataTable;
    var dataLabel = chart.data.xAxisData.label;

    var flippedData = [];
    var flippedDataTable = {};
    var valueCount = 1;
    var filteredDataTableArray = [];

    for (var k in dataTable) {
        if (dataTable.hasOwnProperty(k)) {
            var flippedObject = {};
            if (dataTable[k] !== dataLabel) {
                flippedObject[dataLabel] = dataTable[k];
                for (var i = 0; i < chartData.length; i++) {
                    flippedObject[chartData[i][dataLabel]] = chartData[i][dataTable[k]];
                    if (filteredDataTableArray.indexOf(chartData[i][dataLabel]) === -1) {
                        flippedDataTable['value ' + valueCount] = chartData[i][dataLabel];
                        valueCount++;
                        filteredDataTableArray.push(chartData[i][dataLabel]);
                    }
                }
                flippedData.push(flippedObject);
            }
        }
    }
    flippedDataTable.label = dataLabel;
    chart.flippedData = {chartData: flippedData, dataTable: flippedDataTable};

    if (chart.config.type === 'bar' || chart.config.type === 'line') {
        chart.flippedData.xAxisData = chart.setXAxisData(chart.flippedData);
        chart.flippedData.yAxisData = chart.setYAxisData(chart.flippedData);
        chart.flippedData.legendData = chart.setLegendData(chart.flippedData);
    }
    else {
        console.log("Add additional chart type to set flipped series");
    }
};


/**organizeChartData
 *  reorders all data based on the sortLabel and sortType
 *  -Only for chartData, does not work with flipped data
 *
 * @params sortLabel , sortType
 * @returns [] sorted data
 */
jvCharts.prototype.organizeChartData = function (sortLabel, sortType) {
    var chart = this,
        organizedData;

    if (!chart.data.chartData[0][sortLabel]) {
        return;
    }

    organizedData = chart.data.chartData.sort(function (a, b) {
        if (!isNaN(a[sortLabel]) && !isNaN(b[sortLabel])) {
            if (parseFloat(a[sortLabel]) < parseFloat(b[sortLabel])) //sort string ascending
                return -1;
            if (parseFloat(a[sortLabel]) > parseFloat(b[sortLabel]))
                return 1;
            return 0
        } else {
            if (a[sortLabel].toLowerCase() < b[sortLabel].toLowerCase()) //sort string ascending
                return -1;
            if (a[sortLabel].toLowerCase() > b[sortLabel].toLowerCase())
                return 1;
            return 0
        }
    });

    switch (sortType) {
        case 'sortAscending':
        case 'ascending':
            chart.data.chartData = organizedData;
            break;
        case 'sortDescending':
        case 'descending':
            chart.data.chartData = organizedData.reverse();
    }

};

/**setChartColors
 *  cleans incoming colors for consistency
 *
 * @params colorArray, legendData
 * @returns object with colors
 */

jvCharts.prototype.setChartColors = function (toolData, legendData, defaultColorArray) {
    var colorsArray = [],
        toolDataWorks = true;

    if (!Array.isArray(toolData)) {
        var toolColors = [];

        for (var key in toolData) {
            if (toolData.hasOwnProperty(key)) {
                toolColors.push(toolData[key]);
            }
        }
        if (toolData === 'none' || toolColors.length !== legendData.length) {
            colorsArray = defaultColorArray;
            toolDataWorks = false;
        } else {
            colorsArray = toolColors;
        }
    } else {
        colorsArray = toolData;
    }

    var colors = {};
    var count = 0;

    //creates an object of colors mapped to each legend item
    //instead of using a colorArray that has no mapping
    for (var i = 0; i < legendData.length; i++) {
        if (count > colorsArray.length - 1) {
            count = 0;
        }
        colors[legendData[i]] = colorsArray[count];
        count++;
        if (!toolData.hasOwnProperty(legendData[i])) {
            toolDataWorks = false;
        }
    }
    if (toolDataWorks) {
        return toolData;
    } else {
        return colors;
    }

};

/** setTipData
 *
 * creates data object to display in tooltip
 * @params
 * @returns {{}}
 */
jvCharts.prototype.setTipData = function (d, i) {
    var chart = this,
        data = chart.currentData.chartData;

    //Get Color from chartData and add to object
    var color = chart.options.color;

    var title = d[chart.data.dataTable.label];
    var dataTable = {};

    if(chart.config.type === 'treemap'){
        for (var item in d) {
            if (item === chart.data.dataTable.series || item === chart.data.dataTable.size) {
                dataTable[item] = d[item];
            }
            else {
                continue;
            }
        }
    } else if(chart.config.type === 'bar') {
        title = data[i][chart.data.dataTable.label];
        for (var item in data[i]) {
            if (item !== chart.data.dataTable.label) {
                dataTable[item] = data[i][item];
            }
            else {
                continue;
            }
        }
    } else if(chart.config.type === 'pie' || chart.config.type === 'radial') {
        title = d.label
        for (var item in d) {
            if (item !== "label") {
                dataTable[item] = d[item];
            }
            else {
                continue;
            }
        }
        delete dataTable.outerRadius;
    } else if(chart.config.type === 'jvpack' || chart.config.type === 'jvsunburst') {
        title = d.data.name;
        dataTable[chart.data.dataTable.value] = d.value;
    } else {
        for (var item in d) {
            if (item !== chart.data.dataTable.label) {
                dataTable[item] = d[item];
            }
            else {
                continue;
            }
        }
    }
    

    return {"data": d, "tipData": dataTable, "index": i, "title": title, "color": color, "viz": chart.config.type};
}

/**cleanToolData
 *  cleans incoming toolData for consistency
 *
 * @param toolData
 * @returns object with tooldata
 */
jvCharts.prototype.cleanToolData = function (data) {
    if (data) {
        if (!data.hasOwnProperty('rotateAxis')) {
            data.rotateAxis = false;
        }
        if (!data.hasOwnProperty('stackToggle')) {
            data.stackToggle = 'group-data';
        }
        if (data.hasOwnProperty('colors')) {
            data.color = data.colors;
        }
    }
    return data;
};


/************************************************ Draw functions ******************************************************/

/** generateSVG
 *creates an SVG element on the panel
 *
 * @params container, margin, name
 *
 */
jvCharts.prototype.generateSVG = function (legendData, customMargins) {
    var chart = this,
        margin = {},
        container = {};

    //set margins
    if (!customMargins) {
        //declare margins if they arent passed in
        margin = {
            top: 55,
            right: 50,
            left: 100,
            bottom: 70
        };
        if (legendData != null) {
            if (legendData.length <= 3) {
                margin.bottom = 70;
            } else if (legendData.length <= 6) {
                margin.bottom = 85;
            } else {
                margin.bottom = 130;
            }
        }
    } else {
        margin = customMargins;
    }

    //Temporarily setting gantt margin to 200px
    //TODO make this dynamic
    if (chart.config.type === 'gantt') {
        margin.left = 200;
    }

    //set container attributes

    var dimensions = chart.chartDiv.node().getBoundingClientRect();

    container.height = parseInt(dimensions.height) - margin.top - margin.bottom;
    container.width = parseInt(dimensions.width) - margin.left - margin.right;

    //container.height = parseInt(chart.config.container.height) - margin.top - margin.bottom;
    //container.width = parseInt(chart.config.container.width) - margin.left - margin.right;

    //add margin and container to chart config object
    chart.config.margin = margin;
    chart.config.container = container;

    //remove old svg if it exists
    chart.svg = chart.chartDiv.select("svg").remove();

    //svg layer
    chart.svg = chart.chartDiv.append("svg")
        .attr("class", "full-width full-height editable-svg")
        .attr("width", container.width + margin.left + margin.right)
        .attr("height", container.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + (margin.top) + ")");

    //TODO move to edit mode
    if (chart.options.hasOwnProperty('backgroundColor')) {
        chart.colorBackground(chart.options['backgroundColor']);
    }
};

//TODO Comment
//TODO break out for each chart type
function values(object, dataTableAlign, type) {
    var values = [];

    if (type === 'bar' || type === 'pie' || type === 'line') {
        //for (var key in object) {
        for (var i = 1; i < _.keys(dataTableAlign).length; i++) {
            if (dataTableAlign.hasOwnProperty("value " + i)) {
                if (object[dataTableAlign["value " + i]] != null) {//!= checks for null
                    values.push(object[dataTableAlign["value " + i]]);
                }
            }
        }
    }
    else {
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                values.push(object[key]);
            }
        }
    }
    return values;
}

/** generateXAxis
 * creates x axis on the svg
 *
 * @params xAxisData
 */
jvCharts.prototype.generateXAxis = function (xAxisData, ticks) {
    //declare variables
    var chart = this,
        zoomEvent = chart.config.zoomEvent,
        translateX = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[0], //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale,
        xAxis,
        xAxisScale = getXScale(xAxisData, chart.config.container, null, zoomEvent, chart.options.filtered),
        containerHeight = chart.config.container.height,
        containerWidth = chart.config.container.width;

    //remove previous xAxis container if its there
    chart.svg.selectAll(".xAxisContainer").remove();

    //determine translations
    translateX = Math.min(0, translateX);
    translateX = Math.min(0, Math.max(translateX, containerWidth - (containerWidth * zoomScale)));

    //Save the axis scale to chart object
    chart.currentData.xAxisScale = xAxisScale;

    //create xAxis drawing function
    xAxis = d3.axisBottom()
        .scale(xAxisScale)
        //.ticks(xAxisData.values.length)
        .tickSize(0.5);

    //xAxis = d3.svg.axis()
    //    .scale(xAxisScale)
    //    //.ticks(xAxisData.values.length)
    //    .tickSize(0.5);

    if (ticks) {
        xAxis.ticks(ticks);
    }


    var xContent = chart.svg.append("g")
        .attr("class", "xAxisContainer")
        .attr("transform", "translate(0," + (containerHeight) + ")");

    var xAxisGroup = xContent.append("g").attr("class", "xAxis")
        .transition()
        .duration(function () {
            if (typeof zoomEvent !== 'undefined' && zoomEvent !== null) {
                return 0;//No animation on zoom
            }
            return 800;
        })
        .call(xAxis);

    xAxisGroup.selectAll("text")
        .attr("fill", "black")//Customize the color of axis labels
        .attr("class", "xAxisLabels")
        .attr("transform", "rotate(0)")//Add logic to rotate axis based on size of title
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("transform", "translate(" + translateX + ", 3)");

    var xLabel = xContent.append("g")
        .attr("class", 'xLabel')
        .append("text")
        .attr("class", "xLabel editable editable-text editable-content")
        .attr("text-anchor", "middle")
        .attr("font-size", "12")
        .text(function () {
            if (xAxisData.textOrNum === "date") {
                return "";
            }
            else {
                return xAxisData.label
            }
        })
        .attr("transform", "translate(" + containerWidth / 2 + ", 33)");

    //assign css class for edit mode
    // if the axis is numbers add editable-num
    var editable = 'editable editable-xAxis editable-text';

    if (xAxisData.textOrNum === 'num') {
        editable += ' editable-num';
    }
    chart.svg.select('.xAxis').selectAll('text').attr("class", editable);
};
/** getYScale
 *
 * gets the scale for the y axis
 * @params yAxisData, container, padding, zoomEvent
 * @returns {{}}
 */
function getYScale(yAxisData, container, padding, zoomEvent, yReversed) {
    var yAxisScale;
    var leftPadding = 0.4,
        rightPadding = 0.2;
    if (padding === 'no-padding') {
        leftPadding = 0;
        rightPadding = 0;
    }

    var y = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

    if (yAxisData.textOrNum === 'text') {
        yAxisScale = d3.scale.ordinal().domain(yAxisData.values).rangePoints([0, container.height])
            .rangeRoundBands([0, container.height * y], leftPadding, rightPadding);
    } else if (yAxisData.textOrNum === 'num') {
        var max = yAxisData.values[(yAxisData.values.length - 1)];
        var min = yAxisData.values[0];
        if(yReversed) {
            yAxisScale = d3.scaleLinear().domain([max, min]).rangeRound([container.height, 0]);
        }
        else{
            yAxisScale = d3.scaleLinear().domain([max, min]).rangeRound([0, container.height]);
        }


    }
    return yAxisScale;
}


/** getZScale
 *
 * gets the scale for the z axis
 * @params zAxisData, container, padding, zoomEvent
 * @returns {{}}
 */
function getZScale(zAxisData, container, options, zoomEvent) {
    var zAxisScale;

    //TODO: incorporate zoomEvent
    var z = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

    zAxisScale = d3.scaleLinear().domain([d3.min(zAxisData.values), d3.max(zAxisData.values)]).rangeRound([options.NODE_MIN_SIZE, options.NODE_MAX_SIZE]).nice();
    return zAxisScale;
}
/** FormatXAxisLabels
 *
 * If x-axis labels are too long/overlapping, they will be hidden/shortened
 */
jvCharts.prototype.formatXAxisLabels = function (dataLength) {
    var chart = this;
    var container = chart.config.container;
    var zoomScale = (typeof chart.config.zoomEvent === 'undefined' || chart.config.zoomEvent === null) ? 1 : chart.config.zoomEvent.scale;

    var showAxisLabels = true;
    chart.svg.selectAll(".xAxis").selectAll("text")
        .style("display", function (d, i, j) {
            //Don't show text element
            if (j[i].getBBox().width + 10 > (container.width / dataLength * zoomScale)) {
                showAxisLabels = false;
            }
        });

    if (showAxisLabels) {
        chart.svg.selectAll(".xAxis").selectAll("text").style("display", 'block');
    } else {
        if (dataLength > 0 && chart.currentData.xAxisData.textOrNum === 'num') {
            dataLength -= 1;
            chart.generateXAxis(chart.currentData.xAxisData, dataLength);
            chart.formatXAxisLabels(dataLength);
        } else {
            chart.svg.selectAll(".xAxis").selectAll("text").style("display", 'none');
        }
    }
};

/** generateYAxis
 * creates y axis on the svg
 *
 * @params generateYAxis
 */
jvCharts.prototype.generateYAxis = function (yAxisData) {

    //declare local variables
    var chart = this,
        zoomEvent = chart.config.zoomEvent,
        translateY = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[1], //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale,
        yAxisScale = getYScale(yAxisData, chart.config.container, null, zoomEvent);

    //Save y axis scale to chart object
    chart.currentData.yAxisScale = yAxisScale;

    //remove previous svg elements
    chart.svg.selectAll(".yAxisContainer").remove();
    chart.svg.selectAll("text.yLabel").remove();

    translateY = Math.min(0, translateY);
    translateY = Math.min(0, Math.max(translateY, chart.config.container.height - (chart.config.container.height * zoomScale)));

    var yAxis = d3.axisLeft()//Link to D3.svg.axis options: https://github.com/mbostock/d3/wiki/SVG-Axes
        .scale(yAxisScale)//Sets the scale to use in the axis
        .ticks(10)//Sets the number of labels to display
        .tickSize(.5)//Sets the thickness of the axis line
        .tickPadding(5);

    var yContent = chart.svg.append('g')
        .attr("class", "yAxisContainer");

    var yLabel = yContent.append("g")
        .attr("class", "yLabel")
        .append('text')
        .attr("class", "yLabel editable editable-text editable-content")
        .attr("text-anchor", "middle")
        .attr("font-size", "12")
        .attr("x", 0)
        .attr("y", 0)
        .attr("transform", "translate(0, -10)")
        .text(yAxisData.label);

    var yAxisGroup = yContent.append("g")
        .attr("class", "yAxis");


    yAxisGroup
        .transition()
        .duration(function () {
            if (zoomEvent) {
                return 0;
            }
            return 800;
        })
        .call(yAxis);

    yAxisGroup.selectAll("text")
        .attr("fill", "black")//Customize the color of axis labels
        .attr("class", "yAxisLabels")
        .attr("transform", "rotate(0)")//Add logic to rotate axis based on size of title
        .attr("font-size", "12px")
        .attr("transform", "translate(0," + translateY + ")")
        .text(function (d) {
            var maxLength = 30;
            var current = "";
            if (d.length > maxLength) {
                current = d.substring(0, maxLength) + "...";
            }
            else {
                current = d;
            }
            return current;
        })
        .append("svg:title")
        .text(function (d) {
            return d;
        });

    ////Adding info box to legend elements when hovering over
    //yAxisGroup
    //    .append("svg:title")
    //    .text(function (d) {
    //        return d;
    //    });

    //assign css class for edit mode
    // if the axis is numbers add editable-num
    var editable = 'editable editable-yAxis editable-text';

    if (yAxisData.textOrNum === 'num') {
        editable += ' editable-num';
    }
    chart.svg.select('.yAxis').selectAll('text').attr("class", editable);
};


/************************************************ Legend functions ******************************************************/

jvCharts.prototype.generateLegend = function (legendData, drawFunc) {
    var chart = this,
        svg = chart.svg;

    svg.selectAll(".legend").remove();

    //Returns the legend rectangles that are toggled on/off
    var legendElements = generateLegendElements(chart, legendData, drawFunc);
    if (drawFunc) {
        attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
    }

};

function attachClickEventsToLegend(chart, legendElements, drawFunc, legendData) {
    //Adding the click event to legend rectangles for toggling on/off

    legendElements
        .on("click", function (d, i) {
            var selectedRect = d3.select(this);
            chart.config.zoomEvent = null;
            if (selectedRect._groups[0][0].attributes.fill.value !== "#FFFFFF") {
                selectedRect
                    .attr("fill", "#FFFFFF");
            }
            else {
                selectedRect
                    .attr("fill", getColors(chart.options.color, i, legendData[i]));
            }

            //Gets the headers of the data to be drawn
            var dataHeaders = updateDataFromLegend(legendElements._groups);

            //Sets the legendData to the updated headers
            if (chart.options.seriesFlipped) {
                chart.options.flippedLegendHeaders = dataHeaders;
            }
            else {
                chart.options.legendHeaders = dataHeaders;
            }

            //////Calculate and set the legendElementToggleArray based on filtered legend
            //if(chart.config.type === 'pie'){
            //    var legendElementToggleArray = getLegendElementToggleArray(dataHeaders, chart.currentData.legendData);
            //
            //    //Set legend element toggle array based on if data is flipped or not
            //    if(chart.options.seriesFlipped){
            //        chart.options.flippedLegendOptions = legendElementToggleArray;
            //    }
            //    else{
            //        chart.options.legendOptions = legendElementToggleArray;
            //    }
            //}

            //Using the headers and data, outputs data to be plotted
            //var dataToPlot = getToggledData(chart.currentData, dataHeaders);
            //chart.currentData.chartData = dataToPlot;

            //Plots the data
            if (chart.options.seriesFlipped) {
                chart[drawFunc](chart.flippedData);
            }
            else {
                chart[drawFunc](chart.data);
            }

            //PKQL can't handle empty arrays so don't send if it's equal to 0
            // if (chart.config.type === 'bar' || chart.config.type === 'line' || chart.config.type === 'pie') {
            //     if (!chart.options.seriesFlipped && chart.options.legendHeaders.length !== 0) {
            //         chart.updateOptions(chart.options);//Updates options through PKQL; Defined in chart directive
            //     }
            //     else if (chart.options.seriesFlipped && chart.options.flippedLegendHeaders.length !== 0) {
            //         chart.updateOptions(chart.options);
            //     }
            //     else if (chart.config.type === 'pie') {
            //         chart.updateOptions(chart.options);
            //     }
            // }

        });
}

/** generateVerticalLegend
 *
 * creates and draws a vertical legend on the svg element
 * @params svg, legendData, options, container, chartData, xAxisData, yAxisData, chartType
 * @returns {{}}
 */
jvCharts.prototype.generateVerticalLegend = function () {
    var chart = this,
        svg = chart.svg,
        legendData = chart.currentData.legendData;

    svg.selectAll(".legend").remove();

    //Returns the legend rectangles that are toggled on/off
    var legendElements = generateVerticalLegendElements(chart, legendData, 'generatePie');
    attachClickEventsToLegend(chart, legendElements, 'generatePie', legendData);

};

/** generateVerticalLegendElements
 *
 * Creates the legend elements--rectangles and labels
 * @params chart, legendData, drawFunc
 */
function generateVerticalLegendElements(chart, legendData, drawFunc) {
    var svg = chart.svg,
        options = chart.options,
        legend,
        legendDataLength = legendData.length;

    options.gridSize = 20;

    options.legendMax = 9;

    if (!options.legendIndex) {
        options.legendIndex = 0;
    }

    if (!options.legendIndexMax) {
        options.legendIndexMax = Math.floor(legendDataLength / options.legendMax - .01);
    }

    //Check to see if legend element toggle array needs to be set
    if (options.legendIndexMax >= 0) {

        if (!options.legendHeaders) {
            options.legendHeaders = JSON.parse(JSON.stringify(legendData));
        }

        var legendElementToggleArray = getLegendElementToggleArray(options.legendHeaders, legendData);
        //if (options.seriesFlipped && !options.flippedLegendOptions){
        //    var legendElementToggleArray = [];
        //    if (options.legendOptions && options.legendOptions.length === legendData.length) {
        //        legendElementToggleArray = options.legendOptions;
        //    } else {
        //        for (var i = 0; i < legendData.length; i++) {
        //            legendElementToggleArray[i] = {element: legendData[i], toggle: true};
        //        }
        //    }
        //    options.flippedLegendOptions = legendElementToggleArray;
        //}
        //else if (!options.seriesFlipped && !options.legendOptions){
        //    var legendElementToggleArray = [];
        //    if (options.legendOptions && options.legendOptions.length === legendData.length) {
        //        legendElementToggleArray = options.legendOptions;
        //    } else {
        //        for (var i = 0; i < legendData.length; i++) {
        //            legendElementToggleArray[i] = {element: legendData[i], toggle: true};
        //        }
        //    }
        //    options.legendOptions = legendElementToggleArray;
        //}
    }

    legend = svg.append("g")
        .attr("class", "legend");

    //Adding colored rectangles to the legend
    var legendRectangles = legend.selectAll("rect")
        .data(legendData)
        .enter()
        .append("rect")
        .attr("class", "legendRect")
        .attr("x", "3")
        .attr("y", function (d, i) {
            return (options.gridSize) * (i % options.legendMax) * 1.1;
        })
        .attr("width", options.gridSize)
        .attr("height", options.gridSize)
        .attr("transform", "translate(" + 18 + "," + 20 + ")")
        .attr("stroke-width", "0.5px")
        .attr("stroke", "black")
        .attr('fill', function (d, i) {
            if ((!legendElementToggleArray && !chart.options.seriesFlipped) || (chart.options.seriesFlipped && !legendElementToggleArray)) {
                return getColors(options.color, i, legendData);
            }
            if ((!chart.options.seriesFlipped && legendElementToggleArray[i].toggle === true) ||
                (chart.options.seriesFlipped && legendElementToggleArray[i].toggle === true)) {
                return getColors(options.color, i, legendData);
            }
            else {
                return "#FFFFFF";
            }
        })
        .attr("display", function (d, i) {
            if (i >= (options.legendIndex * options.legendMax) && i <= ((options.legendIndex * options.legendMax) + (options.legendMax - 1))) {
                return "all";
            }
            else {
                return "none";
            }
        })
        .attr("opacity", "1");

    //Adding text labels for each rectangle in legend
    var legendText = legend.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("class", function (d, i) {
            return "legendText editable editable-text editable-content editable-legend-" + i;
        })
        .attr("x", options.gridSize + 5)
        .attr("y", function (d, i) {
            return (options.gridSize) * (i % options.legendMax) * 1.1 + 10;
        })
        .attr("transform", "translate(" + 20 + "," + 20 + ")")
        .attr("text-anchor", "start")
        .attr("dy", "0.35em") //Vertically align with node
        .attr("fill", "black")
        .attr("font-size", "11px")
        .attr("display", function (d, i) {
            if (i >= (options.legendIndex * options.legendMax) && i <= ((options.legendIndex * options.legendMax) + (options.legendMax - 1))) {
                return "all";
            }
            else {
                return "none";
            }
        })
        .text(function (d, i) {
            var elementName = legendData[i];
            if (elementName.length > 20) {
                return elementName.substring(0, 19) + "...";
            }
            else {
                return elementName;
            }
        });

    //Adding info box to legend elements when hovering over
    legendText
        .data(legendData)
        .append("svg:title")
        .text(function (d) {
            return d;
        });

    //Only create carousel if the number of elements exceeds one legend "page"
    if (options.legendIndexMax > 0) {
        createVerticalCarousel(chart, legendData, drawFunc);
    }

    return legendRectangles;
}

/** createVerticalCarousel
 *
 * Draws the vertical legend carousel
 * @params chart, legendData, drawFunc
 */
function createVerticalCarousel(chart, legendData, drawFunc) {
    var svg = chart.svg,
        legend,
        options = chart.options,
        legendPolygon;

    //Adding carousel to legend
    svg.selectAll(".legend-carousel").remove();
    svg.selectAll("#legend-text-index").remove();

    legendPolygon = svg.append("g")
        .attr("class", "legend-carousel");

    //Creates left navigation arrow for carousel
    legendPolygon.append("polygon")
        .attr("id", "leftChevron")
        .attr("class", "pointer-cursor")
        .style("fill", "#c2c2d6")
        .attr("transform", "translate(0," + ((options.legendMax * options.gridSize) + 50) + ")")
        .attr("points", "0,7.5, 15,0, 15,15")
        .on("click", function (d) {
            if (options.legendIndex >= 1) {
                options.legendIndex--;
            }
            svg.selectAll(".legend").remove();
            var legendElements = generateVerticalLegendElements(chart, legendData, drawFunc);
            attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
            chart.localCallbackApplyEdits();
        })
        .attr({
            display: function (d) {
                if (options.legendIndex === 0) {
                    return "none";
                }
                else {
                    return "all";
                }
            }
        });

    //Creates page number for carousel navigation
    legendPolygon.append("text")
        .attr("id", "legend-text-index")
        .attr("x", 35)
        .attr("y", 242.5)
        .style("text-anchor", "start")
        .style("font-size", "14px")
        .text(function (d) {
            return options.legendIndex + " / " + options.legendIndexMax;
        })
        .attr({
            display: function (d) {
                if (options.legendIndexMax === 0) {
                    return "none";
                }
                else {
                    return "all";
                }
            }
        });

    //Creates right navigation arrow for carousel
    legendPolygon.append("polygon")
        .attr("id", "rightChevron")
        .attr("class", "pointer-cursor")
        .style("fill", "#c2c2d6")
        .attr("transform", "translate(85," + ((options.legendMax * options.gridSize) + 50) + ")")
        .attr("points", "15,7.5, 0,0, 0,15")
        .on("click", function (d) {
            if (options.legendIndex < options.legendIndexMax) {
                options.legendIndex++;
            }
            svg.selectAll(".legend").remove();
            var legendElements = generateVerticalLegendElements(chart, legendData, drawFunc);
            attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
            // chart.localCallbackApplyEdits();
        })
        .attr({
            display: function (d) {
                if (options.legendIndex === options.legendIndexMax) {
                    return "none";
                }
                else {
                    return "all";
                }
            }
        });
}


/** getToggledData
 *
 * Gets the headers of the data to be drawn and filters the data based on that
 * @params chartData, dataHeaders
 */
function getToggledData(chartData, dataHeaders) {
    var legendElementToggleArray = getLegendElementToggleArray(dataHeaders, chartData.legendData);
    var data = JSON.parse(JSON.stringify(chartData.chartData));
    if (legendElementToggleArray) {
        for (var j = 0; j < data.length; j++) {
            for (var i = 0; i < legendElementToggleArray.length; i++) {
                if (legendElementToggleArray[i].toggle === false) {
                    delete data[j][legendElementToggleArray[i].element];
                }
            }
        }
    }
    return data;
}

/** getLegendElementToggleArray
 *
 * Gets an array of legend elements with true/false tags for if toggled
 * @params selectedHeaders, allHeaders
 */
function getLegendElementToggleArray(selectedHeaders, allHeaders) {
    var legendElementToggleArray = [];
    for (var i = 0; i < allHeaders.length; i++) {
        legendElementToggleArray.push({element: allHeaders[i]});
    }

    for (var i = 0; i < legendElementToggleArray.length; i++) {
        for (var j = 0; j < selectedHeaders.length; j++) {
            if (legendElementToggleArray[i].element === selectedHeaders[j]) {
                legendElementToggleArray[i].toggle = true;
                continue;
            }
        }
        if (legendElementToggleArray[i].toggle !== true) {
            legendElementToggleArray[i].toggle = false;
        }
    }
    return legendElementToggleArray;
}

/** generateLegendElements
 *
 * Creates the legend elements--rectangles and labels
 * @params chart, legendData, drawFunc
 */
function generateLegendElements(chart, legendData, drawFunc) {
    var svg = chart.svg,
        container = chart.config.container,
        options = chart.options,
        legend,
        legendRow = 0,
        legendColumn = 0,
        newLegendData = [],
        legendDataLength = legendData.length;

    options.legendMax = 9;
    options.gridSize = 12;

    if (!options.legendIndex) {
        options.legendIndex = 0;
    }

    if (!options.legendIndexMax) {
        options.legendIndexMax = Math.floor(legendDataLength / options.legendMax - .01);
    }

    //Check to see if legend element toggle array needs to be set
    //if (options.legendIndexMax >= 0) {

    //Check if legendHeaders exist, if not, set them equal to a clone of legendData

    //if legend headers don't exist, set them equal to legend data
    if (!options.legendHeaders && !options.seriesFlipped) {
        options.legendHeaders = JSON.parse(JSON.stringify(legendData));
    }
    else if (!options.flippedLegendHeaders && options.seriesFlipped) {
        options.flippedLegendHeaders = JSON.parse(JSON.stringify(legendData));

    }
    //Set legend element toggle array based on if series is flipped
    if (!options.seriesFlipped) {
        var legendElementToggleArray = getLegendElementToggleArray(options.legendHeaders, legendData);
    }
    else {
        var flippedLegendElementToggleArray = getLegendElementToggleArray(options.flippedLegendHeaders, legendData);
    }
    //}

    //Check to see if legend element toggle array needs to be set
    //if (options.legendIndexMax > 0){
    //    if (options.seriesFlipped && !options.flippedLegendOptions){
    //        var legendElementToggleArray = [];
    //        if (options.legendOptions && options.legendOptions.length === legendData.length) {
    //            legendElementToggleArray = options.legendOptions;
    //        } else {
    //            for (var i = 0; i < legendData.length; i++) {
    //                legendElementToggleArray[i] = {element: legendData[i], toggle: true};
    //            }
    //        }
    //        options.flippedLegendOptions = legendElementToggleArray;
    //    }
    //    else if (!options.seriesFlipped && !options.legendOptions){
    //        var legendElementToggleArray = [];
    //        if (options.legendOptions && options.legendOptions.length === legendData.length) {
    //            legendElementToggleArray = options.legendOptions;
    //        } else {
    //            for (var i = 0; i < legendData.length; i++) {
    //                legendElementToggleArray[i] = {element: legendData[i], toggle: true};
    //            }
    //        }
    //        options.legendOptions = legendElementToggleArray;
    //    }
    //}

    //Reset legend element toggle array when flipped
    ////TODO move this so that elements aren't all toggled back on resize
    //if(chart.options.seriesFlipped){
    //    chart.options.legendOptions = null;
    //    chart.options.legendHeaders = null;
    //}

    legend = svg.append("g")
        .attr("class", "legend");

    //Adding colored rectangles to the legend
    var legendRectangles = legend.selectAll("rect")
        .data(legendData)
        .enter()
        .append("rect")
        .attr("class", "legendRect")
        .attr("x", function (d, i) {
            if (i % (options.legendMax / 3) === 0 && i > 0) {
                legendColumn = 0;
            }
            var legendPos = 200 * legendColumn;
            legendColumn++;
            return legendPos;
        })
        .attr("y", function (d, i) {
            if (i % (options.legendMax / 3) === 0 && i > 0) {
                legendRow++;
            }
            if (i % options.legendMax === 0 && i > 0) {
                legendRow = 0;
            }
            return (container.height + 10) + (15 * (legendRow + 1)) - 5; //Increment row when column limit is reached
        })
        .attr("width", options.gridSize)
        .attr("height", options.gridSize)
        .attr("stroke-width", "0.5px")
        .attr("stroke", "black")
        .attr('fill', function (d, i) {
            if ((!legendElementToggleArray && !chart.options.seriesFlipped) || (chart.options.seriesFlipped && !flippedLegendElementToggleArray)) {
                return getColors(options.color, i, legendData);
            }
            if ((!chart.options.seriesFlipped && legendElementToggleArray[i].toggle === true) ||
                (chart.options.seriesFlipped && flippedLegendElementToggleArray[i].toggle === true)) {
                return getColors(options.color, i, legendData);
            }
            else {
                return "#FFFFFF";
            }
        })
        .attr("display", function (d, i) {
            if (i >= (options.legendIndex * options.legendMax) && i <= ((options.legendIndex * options.legendMax) + (options.legendMax - 1))) {
                return "all";
            }
            else {
                return "none";
            }
        })
        .attr("opacity", 1);

    legendRow = 0;
    legendColumn = 0;

    //Adding text labels for each rectangle in legend
    var legendText = legend.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("class", function (d, i) {
            return "legendText editable editable-text editable-content editable-legend-" + i;
        })
        .attr("x", function (d, i) {
            if (i % (options.legendMax / 3) === 0 && i > 0) {
                legendColumn = 0;
            }
            var legendPos = 200 * legendColumn;
            legendColumn++;
            return legendPos + 17;
        })
        .attr("y", function (d, i) {
            if (i % (options.legendMax / 3) === 0 && i > 0) {
                legendRow++;
            }
            if (i % options.legendMax === 0 && i > 0) {
                legendRow = 0;
            }
            return (container.height + 10) + (15 * (legendRow + 1)); //Increment row when column limit is reached
        })
        .attr("text-anchor", "start")
        .attr("dy", "0.35em") //Vertically align with node
        .attr("fill", "black")
        .attr("font-size", "11px")
        .attr("display", function (d, i) {
            if (i >= (options.legendIndex * options.legendMax) && i <= ((options.legendIndex * options.legendMax) + (options.legendMax - 1))) {
                return "all";
            }
            else {
                return "none";
            }
        })
        .text(function (d, i) {
            var elementName = legendData[i];
            if (chart.config.type === 'gantt') {
                elementName = legendData[i].slice(0, -5);//Removing last 5 characters of legend label---i.e plannedSTART -> planned
            }
            if (elementName.length > 20) {
                return elementName.substring(0, 19) + "...";
            }
            else {
                return elementName;
            }
        });

    //Adding info box to legend elements when hovering over
    legendText
        .data(legendData)
        .append("svg:title")
        .text(function (d) {
            return d;
        });

    //Only create carousel if the number of elements exceeds one legend "page"
    if (options.legendIndexMax > 0) {
        createCarousel(chart, legendData, drawFunc);
    }
    //Centers the legend in the panel
    if (legend) {
        var legendWidth = legend.node().getBBox().width;
        legend.attr("transform", "translate(" + ((container.width - legendWidth) / 2) + ", 30)");
    }

    return legendRectangles;
}

/** updateDataFromLegend
 *
 * Returns a list of data headers that should be displayed in viz
 * based off what is toggled on/off in legend
 * @params legendData
 */
function updateDataFromLegend(legendData) {
    var data = [];
    var legendElement = legendData[0];
    for (var i = 0; i < legendElement.length; i++) {
        if (legendElement[i].attributes.fill.value !== "#FFFFFF") {
            //If not white, add it to the updated data array
            data.push(legendElement[i].__data__);
        }
    }
    return data;
}

/** createCarousel
 *
 * Draws the horizontal legend carousel
 * @params chart, legendData, drawFunc
 */
//TODO is there a way to combine this carousel with the vertical one?
function createCarousel(chart, legendData, drawFunc) {
    var svg = chart.svg,
        legend,
        container = chart.config.container,
        options = chart.options,
        legendPolygon;

    //Adding carousel to legend
    svg.selectAll(".legend-carousel").remove();
    svg.selectAll("#legend-text-index").remove();

    legendPolygon = svg.append("g")
        .attr("class", "legend-carousel");

    //Creates left navigation arrow for carousel
    legendPolygon.append("polygon")
        .attr("id", "leftChevron")
        .attr("class", "pointer-cursor")
        .style("fill", "#c2c2d6")
        .attr("transform", "translate(0,0)")
        .attr("points", "0,7.5, 15,0, 15,15")
        .on("click", function (d) {
            if (options.legendIndex >= 1) {
                options.legendIndex--;
            }
            svg.selectAll(".legend").remove();
            var legendElements = generateLegendElements(chart, legendData, drawFunc);
            attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
            chart.localCallbackApplyEdits();
        })
        .attr({
            display: function (d) {
                if (options.legendIndex === 0) {
                    return "none";
                }
                else {
                    return "all";
                }
            }
        });

    //Creates page number for carousel navigation
    legendPolygon.append("text")
        .attr("id", "legend-text-index")
        .attr("x", 35)
        .attr("y", 12.5)
        .style("text-anchor", "start")
        .style("font-size", "14px")
        .text(function (d) {
            return options.legendIndex + " / " + options.legendIndexMax;
        })
        .attr({
            display: function (d) {
                if (options.legendIndexMax === 0) {
                    return "none";
                }
                else {
                    return "all";
                }
            }
        });

    //Creates right navigation arrow for carousel
    legendPolygon.append("polygon")
        .attr("id", "rightChevron")
        .attr("class", "pointer-cursor")
        .style("fill", "#c2c2d6")
        .attr("transform", "translate(85,0)")
        .attr("points", "15,7.5, 0,0, 0,15")
        .on("click", function (d) {
            if (options.legendIndex < options.legendIndexMax) {
                options.legendIndex++;
            }
            svg.selectAll(".legend").remove();
            var legendElements = generateLegendElements(chart, legendData, drawFunc);
            attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
            chart.localCallbackApplyEdits();
        })
        .attr({
            display: function (d) {
                if (options.legendIndex === options.legendIndexMax) {
                    return "none";
                }
                else {
                    return "all";
                }
            }
        });

    //Centers the legend polygons in the panel
    if (legendPolygon) {
        var legendPolygonWidth = legendPolygon.node().getBBox().width;
        legendPolygon.attr("transform", "translate(" + ((container.width - legendPolygonWidth) / 2) + "," + (container.height + 105) + ")");
    }
}


/************************************************ Bar functions ******************************************************/

/** paintBarChart
 *
 * The initial starting point for bar chart, begins the drawing process. Must already have the data stored in the chart
 * object
 */
jvCharts.prototype.paintBarChart = function () {
    var chart = this;

    //Uses the original data and then manipulates it based on any existing options
    var dataObj = chart.getBarDataFromOptions();

    //assign current data which is used by all bar chart operations
    chart.currentData = dataObj;

    //Overwrite any pre-existing zoom
    chart.config.zoomEvent = null;

    //generate svg dynamically based on legend data
    chart.generateSVG(dataObj.legendData);
    chart.generateXAxis(dataObj.xAxisData);
    chart.generateYAxis(dataObj.yAxisData);
    chart.generateLegend(dataObj.legendData, 'generateBars');
    //chart.formatXAxisLabels(dataObj.chartData.length);

    // chart.options.rotateAxis ? chart.drawGridlines(dataObj.xAxisData) : chart.drawGridlines(dataObj.yAxisData);
    //need to save tooltip because it is used in other functions
    //chart.draw.toolTip = chart.generateToolTip(dataObj.chartData);
    chart.generateBars(dataObj);

    //zoom specific items, zoom is disabled for now
    // var funcArray = chart.rotateAxis ?  ['generateYAxis', 'generateBars'] : ['generateXAxis', 'generateBars'];
    // var argArray = chart.rotateAxis ? [dataObj.yAxisData, dataObj.chartData] : [dataObj.xAxisData, dataObj.chartData];
    // chart.zoomFunc(funcArray, argArray);
};

/** getBarDataFromOptions
 *
 * Assigns the correct chart data to current data using the chart.options
 */
jvCharts.prototype.getBarDataFromOptions = function () {
    var chart = this;
    //creating these two data variables to avoid having to reference the chart obejct everytime
    var flipped = chart.flippedData;
    var data = chart.data;

    var dataObj = {};
    if (chart.options.seriesFlipped) {
        dataObj.chartData = flipped.chartData;
        dataObj.legendData = flipped.legendData;
        dataObj.dataTable = flipped.dataTable;
        chart.options.color = flipped.color;
        if (chart.options.rotateAxis === true) {
            dataObj.xAxisData = flipped.yAxisData;
            dataObj.yAxisData = flipped.xAxisData;
        } else {
            dataObj.xAxisData = flipped.xAxisData;
            dataObj.yAxisData = flipped.yAxisData;
        }
    } else {
        dataObj.chartData = data.chartData;
        dataObj.legendData = data.legendData;
        dataObj.dataTable = data.dataTable;
        chart.options.color = data.color;
        if (chart.options.rotateAxis === true) {
            dataObj.xAxisData = data.yAxisData;
            dataObj.yAxisData = data.xAxisData;
        } else {
            dataObj.xAxisData = data.xAxisData;
            dataObj.yAxisData = data.yAxisData;
        }
    }

    ////Filters data if there is a legend element toggled off
    //if(chart.options.legendHeaders){
    //    dataObj.chartData = getToggledData(chart.data, chart.options.legendHeaders);
    //}

    return dataObj;

};

/** generateBars
 *
 * Does the actual painting of bars on the bar chart
 * @params barData
 */
jvCharts.prototype.generateBars = function (barData) {
    var chart = this,
        offset,
        svg = chart.svg,
        options = chart.options,
        container = chart.config.container;
    //legendElementToggle = options.legendOptions;

    //Temporary variables until zoom is implemented
    var zoomEvent = chart.config.zoomEvent;
    var translateX = 0;
    var translateY = 0;
    var zoomScale;
    if (options.rotateAxis) {
        translateY = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[1]; //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

        translateY = Math.min(0, translateY);
        translateY = Math.min(0, Math.max(translateY, container.height - (container.height * zoomScale)));
    }
    else {
        translateX = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[0]; //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

        translateX = Math.min(0, translateX);
        translateX = Math.min(0, Math.max(translateX, container.width - (container.width * zoomScale)));
    }

    //Used to draw line that appears when tool tips are visible
    var tipLineX = 0,
        tipLineWidth = 0,
        tipLineHeight = 0,
        tipLineY = 0;

    //Removes any existing bar containers and creates a new one
    svg.selectAll("g.bar-container").remove();
    var bars = svg.append("g")
        .attr("class", "bar-container")
        .selectAll("g");

    //Add logic to filter bardata
    var dataHeaders = chart.options.seriesFlipped ? chart.options.flippedLegendHeaders ? chart.options.flippedLegendHeaders : barData.legendData : chart.options.legendHeaders ? chart.options.legendHeaders : barData.legendData;

    var barDataNew = getToggledData(barData, dataHeaders);

    
    var barGroups = generateBarGroups(bars, barDataNew, chart);
    var eventGroups = generateEventGroups(bars, barDataNew, chart);

    //Add listeners

    eventGroups
        .on("mouseover", function (d, i, j) { // Transitions in D3 don't support the 'on' function They only exist on selections. So need to move that event listener above transition and after append
            if (chart.draw.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d, i);

                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);

                svg.selectAll(".tip-line").remove();

                var mouseItem = d3.select(this);
                tipLineX = mouseItem.node().getBBox().x;
                tipLineWidth = mouseItem.node().getBBox().width;
                tipLineHeight = mouseItem.node().getBBox().height;
                tipLineY = mouseItem.node().getBBox().y;

                //Draw line in center of event-rect
                svg
                    .append("line")
                    .attr("class", "tip-line")
                    .attr("x1", function() {
                        return options.rotateAxis ? 0 : tipLineX + tipLineWidth / 2;
                    })
                    .attr("x2", function() {
                        return options.rotateAxis ? tipLineWidth : tipLineX + tipLineWidth / 2;
                    })
                    .attr("y1", function() {
                        return options.rotateAxis ? tipLineY + tipLineHeight / 2 : 0;
                    })
                    .attr("y2", function() {
                        return options.rotateAxis ? tipLineY + tipLineHeight / 2 : tipLineHeight;
                    })
                    .attr("fill", "none")
                    .attr("shape-rendering", "crispEdges")
                    .attr("stroke", "black")
                    .attr("stroke-width", "1px")
                    .attr("transform", "translate(" + translateX + "," + translateY + ")");

            }

        })
        .on("mousemove", function (d, i) {
            if (chart.draw.showToolTip) {
                chart.tip.hideTip();
                //Get tip data
                var tipData = chart.setTipData(d, i);
                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on("mouseout", function (d) {
            if (chart.draw.showToolTip) {
                chart.tip.hideTip();
                svg.selectAll("line.tip-line").remove();
            }
        })
        .on("zoom", function (d) {
        });

    // barGroups
    //     .on("mouseover", function (d, i, j) {
    //         if (chart.draw.showToolTip && chart.draw.tip) {
    //             chart.draw.tip.show({d: d, i: j}, eventGroups[0][j]);//j is for event rects, i is for bars
    //             //offset for tooltip based on mouse position
    //             if (options.rotateAxis) {
    //                 var offset = -1 * (container.width - d3.mouse(this)[0]);//d3.mouse(this)[0];
    //                 chart.draw.tip.offset([0, offset]);
    //             }
    //             else {
    //                 var offset = d3.mouse(this)[1];
    //                 chart.draw.tip.offset([offset, 0]);
    //             }
    //             //Draw tip line

    //             svg
    //                 .append("line")
    //                 .attr({
    //                     "class": "tip-line",
    //                     "x1": function () {
    //                         return options.rotateAxis ? 0 : tipLineX + tipLineWidth / 2;
    //                     },
    //                     "x2": function () {
    //                         return options.rotateAxis ? tipLineWidth : tipLineX + tipLineWidth / 2;
    //                     },
    //                     "y1": function () {
    //                         return options.rotateAxis ? tipLineY + tipLineHeight / 2 : 0;
    //                     },
    //                     "y2": function () {
    //                         return options.rotateAxis ? tipLineY + tipLineHeight / 2 : tipLineHeight;
    //                     },
    //                     "fill": "none",
    //                     "shape-rendering": "crispEdges",
    //                     "stroke": "black",
    //                     "stroke-width": "1px"
    //                 });
    //         }

    //     })
    //     .on("mouseout", function (d) {
    //         if (chart.draw.tip) {
    //             chart.draw.tip.hide();
    //             svg.selectAll(".tip-line").remove();
    //         }
    //     })
    //     //.on("mousemove", function(d){
    //     //    var offset = d3.mouse(this)[1];
    //     //    chart.draw.tip.offset([offset, 0]);
    //     //})
    //     .on("zoom", function (d) {
    //         if (chart.draw.tip) {
    //             chart.draw.tip.hide();
    //         }
    //     });

    chart.displayValues();

};

/** generateBarGroups
 *
 * Paints the groups of the bars
 * @params chartContainer, barData, chart
 */
function generateBarGroups(chartContainer, barData, chart) {
    var container = chart.config.container,
        options = chart.options,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        colors = options.color;

    //Temporary variables until zoom is implemented
    var zoomEvent = chart.config.zoomEvent;
    var translateX = 0;
    var translateY = 0;
    var zoomScale;
    if (options.rotateAxis) {
        translateY = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[1]; //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

        translateY = Math.min(0, translateY);
        translateY = Math.min(0, Math.max(translateY, container.height - (container.height * zoomScale)));
    }
    else {
        translateX = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[0]; //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

        translateX = Math.min(0, translateX);
        translateX = Math.min(0, Math.max(translateX, container.width - (container.width * zoomScale)));
    }

    

    var x = getXScale(xAxisData, container, zoomEvent, options.filtered);
    var y = getYScale(yAxisData, container, zoomEvent);

    var posCalc = getPosCalculations(barData, options, xAxisData, yAxisData, container, zoomEvent, chart);

    
    var dataToPlot = getPlotData(barData, chart);

    var barGroups;
    if (xAxisData.textOrNum === 'text' || xAxisData.values.length > 2) {
        //Creates bar groups
        barGroups = chartContainer
            .data(dataToPlot)
            .enter()
            .append("g")
            .attr("class", "bar-group")
            .attr("transform", function (d, i) {
                //Translate the bar groups by (outer padding * step) and the width of the bars (container.width / barData.length * i)
                return "translate(" + ((x.paddingOuter() * x.step()) + (x.step() * i)) + ",0)";
            })
    }
    else if (xAxisData.textOrNum === 'num') {
        //Creates bar groups
        barGroups = chartContainer
            .data(dataToPlot)
            .enter()
            .append("g")
            .attr("class", "bar-group")
            .attr("transform", function (d, i) {
                //Translate the bar groups by (outer padding * step) and the width of the bars (container.width / barData.length * i)
                return "translate(" + ((x.paddingOuter() * x.step()) + (x.step() * i)) + ",0)";
            })

    }

    

    //Creates bars within bar groups
    var bars = barGroups.selectAll("rect")
        .data(function (d) {
            return d;
        })
        .enter()
        .append("rect")
        .attr("x", function (d, i, j) {
            return posCalc.getx(d, i, j);
        })
        .attr("y", function (d, i, j) {
            return container.height;
        })
        .attr("width", function (d, i, j) {
            return posCalc.getwidth(d,i,j);
        })
        .attr("height", function (d, i, j) {
            return 0;
        })
        .attr("fill", function(d, i){
            var color = getColors(colors, i, chart.options.legendHeaders[i]);
            return color;
        })
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("opacity", 0.9);

    bars.transition()
        .duration(800)
        .ease(d3.easePolyOut)
        .attr("x", function (d, i, j) {
            return posCalc.getx(d, i, j);
        })
        .attr("y", function (d, i, j) {
            return posCalc.gety(d, i, j);
        })
        .attr("width", function (d, i, j) {
            return posCalc.getwidth(d,i,j);
        })
        .attr("height", function (d, i, j) {
            return posCalc.getheight(d, i, j);
        })


    return barGroups;//returns the bar containers
}

/** generateEventGroups
 *
 * Not sure what this guy does, TODO find out what is different from this and generateBarGroups
 * @params chartContainer, barData, chart
 */
function generateEventGroups(chartContainer, barData, chart) {
    var container = chart.config.container,
        options = chart.options;

    //Temporary variables until zoom is implemented
    var offset;
    var zoomEvent = chart.config.zoomEvent;
    var translateX = 0;
    var translateY = 0;
    var zoomScale;
    if (options.rotateAxis) {
        translateY = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[1]; //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

        translateY = Math.min(0, translateY);
        translateY = Math.min(0, Math.max(translateY, container.height - (container.height * zoomScale)));
    }
    else {
        translateX = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[0]; //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

        translateX = Math.min(0, translateX);
        translateX = Math.min(0, Math.max(translateX, container.width - (container.width * zoomScale)));
    }

    //Gets the data used in the plot
    var dataToPlot = getPlotData(barData, chart);

    //var dataToPlot = dataToPlot.slice(0,5);

    //Invisible rectangles on screen that represent bar groups. Used to show/hide tool tips on hover
    var eventGroups = chartContainer
        .data(dataToPlot)
        .enter()
        .append('rect')
        .attr("class", 'event-rect')
        .attr('x', function (d, i) { // sets the x position of the bar)
            return (options.rotateAxis ? 0 : (container.width / barData.length * i) * zoomScale);
        })
        .attr('y', function (d, i) { // sets the y position of the bar
            return options.rotateAxis ? (container.height / 5 * i) * zoomScale : 0;
            //return options.rotateAxis ? (container.height / barData.length * i) * zoomScale : 0;
        })
        .attr('width', function (d, i) { // sets the x position of the bar)
            return (options.rotateAxis ? container.width : (container.width / barData.length) * zoomScale);
        })
        .attr('height', function (d, i) { // sets the y position of the bar
            return options.rotateAxis ? (container.height / 5) * zoomScale : container.height;
            //return options.rotateAxis ? (container.height / barData.length) * zoomScale : container.height;
        })
        .attr('fill', 'transparent')
        //.attr("stroke", "#e6e6e6")
        .attr("transform", "translate(" + translateX + "," + translateY + ")");

    return eventGroups;
}

/** getPlotData
 *
 * Returns only data values to be plotted; input is the data object
 * @params objectData, chart
 */
function getPlotData(objectData, chart) {
    var data = [];
    var objDataNew = JSON.parse(JSON.stringify(objectData));//Copy of barData
    for (var i = 0; i < objDataNew.length; i++) {
        var group = [];
        for (var j = 0; j < chart.currentData.legendData.length; j++) {
            if (typeof objDataNew[i][chart.currentData.legendData[j]] !== 'undefined') {
                group.push(objDataNew[i][chart.currentData.legendData[j]]);
            }
        }
        data.push(group)
    }
    return data;
}


/** getPosCalculations
 *Holds the logic for positioning all bars on a bar chart (depends on toolData)
 *
 * @params svg, barData, options, xAxisData, yAxisData, container
 * @returns {{}}
 */
function getPosCalculations(barData, options, xAxisData, yAxisData, container, zoomEvent, chart) {
    var x,
        y,
        scaleFactor = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale,//if there is a zoom event
        data = [],
        size = Object.keys(chart.currentData.dataTable).length - 1,
        positionFunctions = {};


    x = getXScale(xAxisData, container, zoomEvent, options.filtered);
    y = getYScale(yAxisData, container, zoomEvent);

    for (var i = 0; i < barData.length; i++) {
        var val = [];
        for (var key in barData[i]) {
            if (barData[i].hasOwnProperty(key)) {
                val.push(barData[i][key]);
            }
        }
        data.push(val.slice(1, barData[i].length));
    }

    if (options.rotateAxis === true && options.stackToggle === 'stack-data') {
        // scenario 1
        positionFunctions.getx = function (d, i, j) {
            return 0;
        };
        positionFunctions.gety = function (d, i, j) {
            return y(barData[j][yAxisData.label]);
        };
        positionFunctions.getwidth = function (d, i, j) {
            return 0;
        };
        positionFunctions.getheight = function (d, i, j) {
            return y.bandwidth() * 0.95;
        };
        positionFunctions.transitionx = function (d, i, j) {
            var increment = 0;
            for (var k = i; k > 0; k--) {
                var dataLabel = 'value ' + k;
                var val = barData[j][chart.currentData.dataTable[dataLabel]];
                if (!isNaN(val)) {
                    increment += parseFloat(val);

                }
            }
            return x(increment);
        };
        positionFunctions.transitiony = function (d, i, j) {
            return y(barData[j][yAxisData.label]);
        };
        positionFunctions.transitionwidth = function (d, i, j) {
            return x(d);
        };
        positionFunctions.transitionheight = function (d, i, j) {
            return y.bandwidth() * 0.95;
        };
    }
    else if (options.rotateAxis === true && options.stackToggle === 'group-data') {
        //scenario 2
        positionFunctions.getx = function (d, i, j) {
            return 0;
        };
        positionFunctions.gety = function (d, i, j) {
            return (y(barData[j][yAxisData.label]) + y.bandwidth() / size * i) * scaleFactor;
        };
        positionFunctions.getwidth = function (d, i, j) {
            return 0;
        };
        positionFunctions.getheight = function (d, i, j) {
            return (y.bandwidth() / size * 0.95) * scaleFactor;
        };
        positionFunctions.transitionx = function (d, i, j) {
            return 0;
        };
        positionFunctions.transitiony = function (d, i, j) {
            return (y(barData[j][yAxisData.label]) + y.bandwidth() / size * i) * scaleFactor;
        };
        positionFunctions.transitionwidth = function (d, i, j) {
            return x(d);
        };
        positionFunctions.transitionheight = function (d, i, j) {
            return (y.bandwidth() / size * 0.95) * scaleFactor;
        };
    }
    else if (options.rotateAxis === false && options.stackToggle === 'stack-data') {
        //scenario 3
        positionFunctions.getx = function (d, i, j) {
            return (x(barData[i][xAxisData.label])) * scaleFactor;
        };
        positionFunctions.gety = function (d, i, j) {
            return container.height;
        };
        positionFunctions.getwidth = function (d, i, j) {
            return (x.bandwidth() * 0.95) * scaleFactor;
        };
        positionFunctions.getheight = function (d, i, j) {
            return 0;
        };
        positionFunctions.transitionx = function (d, i, j) {
            return (x(barData[i][xAxisData.label])) * scaleFactor;
        };
        positionFunctions.transitiony = function (d, i, j) {
            var increment = 0;
            for (var k = i; k > 0; k--) {
                var dataLabel = 'value ' + k;
                var val = barData[i][chart.currentData.dataTable[dataLabel]];
                if (!isNaN(val)) {
                    increment += parseFloat(val);

                }
            }
            return y(parseFloat(d) + increment);
        };
        positionFunctions.transitionwidth = function (d, i, j) {
            return (x.bandwidth() * 0.95) * scaleFactor;
        };
        positionFunctions.transitionheight = function (d, i, j) {
            return container.height - y(d);
        };
    }
    else if (options.rotateAxis === false && options.stackToggle === 'group-data') {
        //scenario 4
        positionFunctions.getx = function (d, i, j) {
            return x.bandwidth()/size * i;
        };
        positionFunctions.gety = function (d, i, j) {
            return y(0) - y(d) > 0 ? y(d) : y(0);
        };
        positionFunctions.getwidth = function (d, i, j) {
            return (x.bandwidth() / size *.95);
        };
        positionFunctions.getheight = function (d, i, j) {
            return Math.abs(y(0) - y(d));
        };
    }
    return positionFunctions;
}



/** getColors
 *
 * gets the colors to apply to the specific chart
 * @params colorObj, index, label
 * @returns {{}}
 */
function getColors(colorObj, index, label) {
    //TODO comment this

    //logic to return the color if the colorObj passed in
    // is an object with the label being the key
    if (label && colorObj.hasOwnProperty(label) && colorObj[label]) {
        return colorObj[label];
    }

    var cleanedColors = [];

    if (!Array.isArray(colorObj)) {
        cleanedColors = [];
        for (var k in colorObj) {
            if (colorObj.hasOwnProperty(k)) {
                if (colorObj[k]) {
                    cleanedColors.push(colorObj[k]);
                }
            }
        }

    } else {
        cleanedColors = colorObj;
    }

    //logic to return a repeating set of colors assuming that
    //the user changed data (ex: flip series on bar chart)
    if (!cleanedColors[index]) {
        while (index > cleanedColors.length - 1) {
            index = index - cleanedColors.length;
        }
    }
    return cleanedColors[index];
}

jvCharts.prototype.colorBackground = function (color) {
    var chart = this;
    var chartDiv = chart.chartDiv;
    chart.options.backgroundColor = color;
    chartDiv.style('background-color', '' + color);
};

/** getXScale
 *
 * get the scale for the x axis
 * @params xAxisData, container, padding, zoomEvent
 * @returns {{}}
 */
function getXScale(xAxisData, container, padding, zoomEvent, filtered) {
    var xAxisScale;
    var leftPadding = 0.4,
        rightPadding = 0.2;
    if (padding === 'no-padding') {
        leftPadding = 0;
        rightPadding = 0;
    }

    var x = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;//scales x axis if zoomed

    //check if values length is greater than two incase the labels are all numbers. if it is a linear scale then there will only be a min and max

    if (xAxisData.textOrNum === 'date') {
        for (var i = 0; i < xAxisData.values.length; i++) {
            //if(xAxisData.values[i] != "Invalid Date" && xAxisData.values[i] != null && xAxisData.values[i] !== "null"){
            xAxisData.values[i] = new Date(xAxisData.values[i]);
            //}
        }


        var maxDate = Math.max.apply(null, xAxisData.values);
        var minDate = Math.min.apply(null, xAxisData.values);

        xAxisScale = d3.time.scale().domain([new Date(minDate), new Date(maxDate)]).rangeRound([0, container.width]);
    }
    else if (xAxisData.textOrNum === 'text' || xAxisData.values.length > 2) {
        xAxisScale = d3.scaleBand()
            .domain(xAxisData.values)
            .range([0, container.width])
            .paddingInner(leftPadding)
            .paddingOuter(rightPadding);
    }
    else if (xAxisData.textOrNum === 'num') {
        var max = xAxisData.values[(xAxisData.values.length - 1)];
        var min = xAxisData.values[0];

        xAxisScale = d3.scaleLinear().domain([min, max]).rangeRound([0, container.width]);

        //xAxisScale = d3.scale.linear().domain([min, max]).rangeRound([0, container.width]);

    }
    return xAxisScale;
}

/** getYScale
 *
 * gets the scale for the y axis
 * @params yAxisData, container, padding, zoomEvent
 * @returns {{}}
 */
function getYScale(yAxisData, container, padding, zoomEvent) {
    var yAxisScale;
    var leftPadding = 0.4,
        rightPadding = 0.2;
    if (padding === 'no-padding') {
        leftPadding = 0;
        rightPadding = 0;
    }

    var y = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

    if (yAxisData.textOrNum === 'text') {
        yAxisScale = d3.scaleOrdinal().domain(yAxisData.values).range([0, container.height]);

        //yAxisScale = d3.scale.ordinal().domain(yAxisData.values).rangePoints([0, container.height])
        //    .rangeRoundBands([0, container.height * y], leftPadding, rightPadding);
    } else if (yAxisData.textOrNum === 'num') {
        var max = yAxisData.values[(yAxisData.values.length - 1)];
        var min = yAxisData.values[0];


        yAxisScale = d3.scaleLinear().domain([max, min]).rangeRound([0, container.height]);
        //yAxisScale = d3.scale.linear().domain([max, min]).rangeRound([0, container.height]);
    }
    return yAxisScale;
}

/** displayValues
 *
 * toggles data values that are displayed on the specific type of chart on the svg
 * @params svg, barData, options, xAxisData, yAxisData, container, zoomEvent
 * @returns {{}}
 */
jvCharts.prototype.displayValues = function () {
    //TODO receive data similar to generateBar
    var chart = this,
        svg = chart.svg,
        options = chart.options,
        container = chart.config.container,
        barData = chart.data.chartData,
        dataTableAlign = chart.currentData.dataTable,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        zoomEvent = chart.config.zoomEvent,
        legendOptions = chart.options.legendOptions,
        translateX = 0,
        translateY = 0;

    //If series is flipped, use flipped data; initialize with the full data set
    if (options.seriesFlipped) {
        barData = chart.flippedData.chartData;
        legendOptions = chart.options.flippedLegendOptions;
    }

    if (options.displayValues === true) {


        svg.selectAll(".displayValueContainer").remove();

        var zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

        //Setting zoom variables based on if axis is rotated
        if (options.rotateAxis) {
            translateY = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[1]; //translates if there is zoom
            translateY = Math.min(0, translateY);
            translateY = Math.min(0, Math.max(translateY, container.height - (container.height * zoomScale)));
        }
        else {
            translateX = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[0]; //translates if there is zoom
            translateX = Math.min(0, translateX);
            translateX = Math.min(0, Math.max(translateX, container.width - (container.width * zoomScale)));
        }

        var data = [];//Only stores values for bars
        var barDataNew = JSON.parse(JSON.stringify(barData));//Copy of barData

        if (legendOptions) {//Checking which legend elements are toggled on resize
            for (var j = 0; j < barDataNew.length; j++) {
                for (var i = 0; i < legendOptions.length; i++) {
                    if (legendOptions[i].toggle === false) {
                        delete barDataNew[j][legendOptions[i].element];
                    }
                }
            }
        }

        for (var i = 0; i < barDataNew.length; i++) {//barDataNew used
            var val = values(barDataNew[i], chart.currentData.dataTable, chart.config.type);
            data.push(val.slice(0, barDataNew[i].length));
        }

        var posCalc = getPosCalculations(barDataNew, options, xAxisData, yAxisData, container, zoomEvent, chart);


        if (options.rotateAxis) {
            var displayValues = svg.append("g")
                .attr("class", "displayValueContainer")
                .selectAll("g")
                .data(data)
                .enter()
                .append("g")
                .attr("class", "displayValueGroup")
                .selectAll("text")
                .data(function (d, i, j) {
                    return d;
                })
                .enter()
                .append("text")
                .attr("class", "displayValue")
                .attr('x', function (d, i, j) { // sets the x position of the bar)
                    return posCalc.transitionwidth(d, i, j);
                })
                .attr('y', function (d, i, j) { // sets the y position of the bar
                    return posCalc.transitiony(d, i, j) + (posCalc.transitionheight(d, i, j) / 2);
                })
                .attr('dy', '.35em')
                .attr("text-anchor", "start")
                .attr("fill", "black")
                .attr("font-size", 0)
                .text(function (d, i, j) {
                    //var displayValuesFormat;
                    //displayValuesFormat = chart.localCallbackGetVizOption('yAxis');
                    //
                    //var expression = getFormatExpression(displayValuesFormat);
                    return d;//expression(d);
                })
                .attr("transform", "translate(" + 0 + "," + translateY + ")")
                .transition()
                .duration(function () {
                    if (zoomEvent) {
                        return 0;
                    }
                    return 750;
                })
                .attr("font-size", "12px");
        }
        else {
            var displayValues = svg.append("g")
                .attr("class", "displayValueContainer")
                .selectAll("g")
                .data(data)
                .enter()
                .append("g")
                .attr("class", "displayValueGroup")
                .selectAll("text")
                .data(function (d, i, j) {
                    return d;
                })
                .enter()
                .append("text")
                .attr("class", "displayValue")
                .attr('x', function (d, i, j) { // sets the x position of the bar)
                    return (posCalc.getx(d, i, j) + (posCalc.getwidth(d, i, j) / 2));
                })
                .attr('y', function (d, i, j) { // sets the y position of the bar
                    return posCalc.gety(d, i, j) - posCalc.transitionheight(d, i, j) - 5;
                })
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .attr("font-size", 0)
                .text(function (d, i, j) {
                    var displayValuesFormat;
                    //displayValuesFormat = chart.localCallbackGetVizOption('yAxis');

                    //var expression = getFormatExpression(displayValuesFormat);
                    return d;//expression(d);
                })
                .attr("transform", "translate(" + translateX + ",0)")
                .transition()
                .duration(function () {
                    if (zoomEvent) {
                        return 0;
                    }
                    return 750;
                })
                .attr("font-size", "12px");
        }
    }
    else {
        svg.selectAll(".displayValueContainer").remove();
    }
};

/************************************************ Radial Data functions ******************************************************/

/**setBarData
 *  gets bar data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
jvCharts.prototype.setRadialChartData = function (data, dataTable, colors) {
    var chart = this;
    chart.data = {chartData: data, dataTable: dataTable};
    chart.data.legendData = setRadialLegendData(chart.data);

    //define color object for chartData
    chart.data.color = chart.setChartColors(chart.options.color, chart.data.legendData, colors);
};

jvCharts.prototype.paintRadialChart = function () {
    var chart = this;

    chart.options.color = chart.data.color;

    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship

    var radialMargins = {
        top: 45,
        right: 50,
        left: 50,
        bottom: 130
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, radialMargins);
    chart.generateLegend(chart.currentData.legendData, 'generateRadial');
    chart.generateRadial(chart.currentData);


};

/**setRadialLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setRadialLegendData(data) {
    var legendArray = [];
    for (var i = 0; i < data.chartData.length; i++) {
        if (legendArray.indexOf(data.chartData[i][data.dataTable.label]) == -1) {
            legendArray.push((data.chartData[i][data.dataTable.label]));
        }
    }
    return legendArray;
}

/** generateRadial
 *
 * paints the radil bar chart on the chart
 * @params radialData
 */

 jvCharts.prototype.generateRadial = function (radialData) {

    var chart = this,
        svg = chart.svg,
        colors = chart.options.color,
        container = chart.config.container,
        allFilterList = [],
        relationMap = chart.data.dataTable,
        legendData = chart.data.legendData,
        radial = null,
        radialData = radialData.chartData;
        chartName = chart.config.name;

    var barHeight = container.height / 2 - 40,
        width = container.width,
        height = container.height,
        r = Math.min(height / 2, width / 3);



    var data = [];
    var total = 0;
    var allKeys = [chart.data.dataTable.label, chart.data.dataTable.value];

    for (var i = 0; i < radialData.length; i++) {
        data[i] = {label: radialData[i][allKeys[0]], value: radialData[i][allKeys[1]]};
        //total += parseFloat(radialData[i][keys[1]]);
    }

    var radialDataNew = JSON.parse(JSON.stringify(data));//copy of pie data


    if (!chart.options.legendHeaders) {
        chart.options.legendHeaders = legendData;
    }

    var dataHeaders = chart.options.legendHeaders;

    var legendElementToggleArray = getLegendElementToggleArray(dataHeaders, legendData);

    var radialDataFiltered = [];

    if (legendElementToggleArray) {
        for (var j = 0; j < radialDataNew.length; j++) {
            for (var i = 0; i < legendElementToggleArray.length; i++) {
                if (legendElementToggleArray[i].element === radialDataNew[j].label && legendElementToggleArray[i].toggle === false) {
                    radialDataNew[j].value = -1;
                }
            }
        }
    }

    for (var j = 0; j < radialDataNew.length; j++) {
        if(radialDataNew[j].value !== -1){
            radialDataFiltered.push(radialDataNew[j]);
        }
    }

    radialDataFiltered.sort(function(a,b) { 
        return b.value - a.value; 
    });

    //Remove existing bars from page
    svg.selectAll("g.radial-container").remove();

    var formatNumber = d3.format("s");

    var vis = svg
        .append("g")
        .attr("class", "radial-container")
        .attr("height", height)
        .attr("transform", "translate(" + (width / 2) + "," + r + ")");

    var extent = d3.extent(radialDataFiltered, function(d) { 
        return d.value; 
    });
    var barScale = d3.scaleLinear()
        .domain(extent)
        .range([0, barHeight]);

    var keys = radialDataFiltered.map(function(d,i) { 
        return d.label; 
    });
    var numBars = keys.length;

    var x = d3.scaleLinear()
        .domain(extent)
        .range([0, -barHeight]);

    //create xAxis drawing function
    var xAxis = d3.axisLeft()
        .scale(x)
        .ticks(3)
        .tickFormat(formatNumber);
      
    var circles = vis.selectAll("circle")
          .data(x.ticks(3))
        .enter().append("circle")
          .attr("r", function(d) {return barScale(d);})
          .style("fill", "none")
          .style("stroke", "black")
          .style("stroke-dasharray", "2,2")
          .style("stroke-width",".5px");

    var arc = d3.arc()
      .startAngle(function(d,i) { 
            return (i * 2 * Math.PI) / numBars; 
        })
      .endAngle(function(d,i) { 
            return ((i + 1) * 2 * Math.PI) / numBars; 
        })
      .innerRadius(0);

    var segments = vis.selectAll("path")
        .data(radialDataFiltered)
        .enter().append("g")
        // .attr("class", "label")
        .append("path")
        .each(function(d) { d.outerRadius = 0; })
        .style("fill", function (d, i) { 
            return getColors(colors, i, d.label); 
        })
        .attr("d", arc)
        .on("mouseover", function(d, i) {
            //Get tip data
            var tipData = chart.setTipData(d, i);
            //Draw tip line
            chart.tip.generateSimpleTip(tipData, tipData.tipData, d3.event);
        })
        .on("mouseout", function(d) {
            chart.tip.hideTip();
        });

    segments.transition().duration(800).ease(d3.easeElastic).delay(function(d,i) {
            return (25-i)*50;
        })
        .attrTween("d", function(d,index) {
        var i = d3.interpolate(d.outerRadius, barScale(+d.value));
            return function(t) { 
                d.outerRadius = i(t); return arc(d,index); 
            };
        });

    // vis.selectAll("g.label").append("text")
    //     .attr("transform", function(d, i) { 
    //         return "rotate(" + ((i * 360 / numBars) - 90) + ")"; 
    //     })
    //     .attr("x", function(d) { 
    //         return  (barHeight); 
    //     })
    //     .style("text-anchor", "start")
    //     .attr("dx", "6") // margin
    //     // .attr("dy", "6em") // vertical-align
    //     // .append("textPath")
    //     // .attr("startOffset", function(d, i) {return i * 100 / numBars + 50 / numBars + '%';})
    //     .text(function(d) {
    //         return d.label.toUpperCase(); 
    //     });


    vis.append("circle")
      .attr("r", barHeight)
      .classed("outer", true)
      .style("fill", "none")
      .style("stroke", "black")
      .style("stroke-width","1.5px");

    var lines = vis.selectAll("line")
      .data(keys)
        .enter().append("g")
        .attr("class", "label")
        .append("line")
        .attr("y2", -barHeight - 20)
        .style("stroke", "black")
        .style("stroke-width",".5px")
        .attr("transform", function(d, i) { return "rotate(" + (i * 360 / numBars) + ")"; });

    vis.append("g")
    .attr("class", "x axis")
    .call(xAxis);


    //This isn't very well done
    // vis.selectAll("g.label").append("text")
    //     .attr("transform", function(d, i) { 
    //         return "rotate(" + ((i * 360 / numBars) - 90) + ")"; 
    //     })
    //     .attr("x", function(d) { 
    //         return  (barHeight); 
    //     })
    //     .style("text-anchor", "start")
    //     .attr("dx", "6") // margin
    //     // .attr("dy", "6em") // vertical-align
    //     // .append("textPath")
    //     // .attr("startOffset", function(d, i) {return i * 100 / numBars + 50 / numBars + '%';})
    //     .text(function(d) {
    //         return d.toUpperCase(); 
    //     });

    // Labels
    // var labelRadius = barHeight * 1.025;

    // var labels = vis.append("g")
    //   .classed("labels", true);

    // labels.append("def")
    //     .append("path")
    //     .attr("id", "label-path")
    //     .attr("d", "m0 " + -labelRadius + " a" + labelRadius + " " + labelRadius + " 0 1,1 -0.01 0");

    // labels.selectAll("text")
    //     .data(keys)
    //   .enter().append("text")
    //     .style("text-anchor", "middle")
    //     .style("font-weight","bold")
    //     .style("fill", function(d, i) {return "#3e3e3e";})
    //     .append("textPath")
    //     .attr("xlink:href", "#label-path")
    //     .attr("startOffset", function(d, i) {return i * 100 / numBars + 50 / numBars + '%';})
    //     .text(function(d) {
    //         return d.toUpperCase(); 
    //     });
}

/************************************************ TreeMap functions ******************************************************/

/**setTreeMapData
 *  gets treemap data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
jvCharts.prototype.setTreeMapData = function (data, dataTable, colors) {
    var chart = this;
    chart.data = {chartData: data, dataTable: dataTable};
    chart.data.legendData = setTreeMapLegendData(chart.data);
    //define color object for chartData
    chart.data.color = chart.setChartColors(chart.options.color, chart.data.legendData, colors);
};

/**setTreeMapLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setTreeMapLegendData(data) {
    var legendArray = [];
    for (var i = 0; i < data.chartData.children.length; i++) {
        if (legendArray.indexOf(data.chartData.children[i][data.dataTable.series]) == -1) {
            legendArray.push((data.chartData.children[i][data.dataTable.series]));
        }
    }
    return legendArray;
}

jvCharts.prototype.paintTreeMapChart = function () {
    var chart = this;

    chart.options.color = chart.data.color;

    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship

    var treeMapMargins = {
        top: 45,
        right: 50,
        left: 50,
        bottom: 130
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, treeMapMargins);
    chart.generateLegend(chart.currentData.legendData, 'generateTreeMap');
    chart.generateTreeMap(chart.currentData);


};

/** generateTreeMap
 *
 * paints the treemap on the chart
 * @params treeMapData
 */
jvCharts.prototype.generateTreeMap = function (treeMapData) {

    var chart = this,
        svg = chart.svg,
        colors = treeMapData.color,
        container = chart.config.container,
        allFilterList = [],
        relationMap = chart.data.dataTable,
        treemap = null,
        chartName = chart.config.name;

    chart.children = chart.data.chartData;

    var newData = JSON.parse(JSON.stringify(chart.children));//copy of pie data

    if (!chart.options.legendHeaders) {
        chart.options.legendHeaders = legendData;
    }

    var dataHeaders = chart.options.legendHeaders;

    var legendElementToggleArray = getLegendElementToggleArray(dataHeaders, chart.data.legendData);

    

    if (legendElementToggleArray) {
        for (var j = 0; j < newData.children.length; j++) {
            for (var i = 0; i < legendElementToggleArray.length; i++) {
                if (legendElementToggleArray[i].element === newData.children[j][relationMap.series] && legendElementToggleArray[i].toggle === false) {
                    newData.children[j].show = false;
                }
            }
        }
    }

    var treeMapDataFiltered = {};
    treeMapDataFiltered["Parent"] = "Top Level";
    treeMapDataFiltered.children = [];

    for (var j = 0; j < newData.children.length; j++) {
        if(newData.children[j].show !== false){
            treeMapDataFiltered.children.push(newData.children[j]);
        }
    }

    //  assigns the data to a hierarchy using parent-child relationships
    var root = d3.hierarchy(treeMapDataFiltered, function(d) {
        return d.children;
    });

    var treemap = d3.treemap()
    .size([container.width, container.height])
    .padding(2);

    var nodes = treemap(root
        .sum(function(d) { 
            return d[relationMap.size]; 
        })
        .sort(function(a, b) { 
            return b.height - a.height || b.value - a.value; 
        }))
        .descendants();

    //Remove existing bars from page
    svg.selectAll("g.treemap").remove();
    svg.append("g").attr("class", "treemap");

    var node = svg.select(".treemap")
        .selectAll("g")
        .data(root.leaves())
        .enter().append('g')
        .attr('transform', function (d) {
            return 'translate(0,0)';
        });

    node.append('rect')
        // .call(position)
        .attr("x", function (d) {
            return d.x0 + "px";
        })
        .attr("y", function (d) {
            return d.y0 + "px";
        })
        .attr("width", function (d) {
            return d.x1 - d.x0 + "px";
        })
        .attr("height", function (d) {
            return d.y1 - d.y0 + "px";
        })
        .attr("fill", function (d, i) {
            return getColors(colors, i, d.data[relationMap.series]);
        })
        .attr("fill-opacity", .8)
        .attr("stroke", "#FFFFFF")
        .attr("stroke-width", "1")
        .on("mouseover", function (d, i) {
            //Get tip data
            var tipData = chart.setTipData(d.data, i);
            //Draw tip line
            chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);

            var rect = d3.select(this);
            rect.attr("fill", '#BBB');
            rect.transition().duration(200);
        })
        .on("mouseout", function (d) {
            chart.tip.hideTip();
            var rect = d3.select(this);
            rect.attr("fill", function (d, i) {
                return getColors(colors, i, d.data[relationMap.series]);
            });
            rect.transition().duration(200);
        });

    node.append('text')
        // .call(position)
        .attr("x", function (d) {
            return d.x0 + "px";
        })
        .attr("y", function (d) {
            return d.y0 + "px";
        })
        .attr("width", function (d) {
            return d.x1 - d.x0 + "px";
        })
        .attr("height", function (d) {
            return d.y1 - d.y0 + "px";
        })
        .attr("transform", "translate(3, 18)")
        .text(function (d) {
            if (d.dy !== 0) {
                return d.children ? null : d.data[relationMap.label];
            }
        });
        // .on("mouseover", function (d, i) {
        //     chart.draw.tip.show({d: d, i: i}, this);
        // })
        // .on("mouseout", function (d) {
        //     chart.draw.tip.hide();
        // });


    /* Don't display text if text is wider than rect */
    var temp = svg.select(".treemap").selectAll("g").selectAll("text");
    temp.attr("style", function (d) {
        if (this.getBBox().width >= (d.x1 - d.x0) - 5) {
            return "display:none";
        }
        if (this.getBBox().height >= (d.y1 - d.y0) - 5) {
            return "display:none";
        }
    });
};

/************************************************ Pie Data functions ******************************************************/

/**setPieData
 *  gets pie data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
jvCharts.prototype.setPieData = function (data, dataTable, colors) {
    var chart = this;
    chart.data = {chartData: data, dataTable: dataTable};
    chart.data.legendData = setPieLegendData(chart.data);
    //define color object for chartData
    chart.data.color = chart.setChartColors(chart.options.color, chart.data.legendData, colors);
};
/**setPieLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setPieLegendData(data) {
    var legendArray = [];
    for (var i = 0; i < data.chartData.length; i++) {
        legendArray.push((data.chartData[i][data.dataTable.label]));
    }
    return legendArray;
}

jvCharts.prototype.drawPie = function () {
    var chart = this;

    var customMargins = {
        top: 40,
        right: 20,
        bottom: 20,
        left: 20
    };
    chart.currentData = chart.data;
    chart.options.color = chart.data.color;
    chart.legendData = chart.data.legendData;
    chart.generateSVG(chart.data.legendData, customMargins);

    //If the container size is small, don't generate a legend
    if (chart.config.container.width > 550) {
        chart.generateVerticalLegend();
    }

    chart.generatePie(chart.currentData);


    //chart.localCallbackApplyAllEdits();
};

jvCharts.prototype.drawPie = function () {
    var chart = this;

    var customMargins = {
        top: 40,
        right: 20,
        bottom: 20,
        left: 20
    };
    chart.currentData = chart.data;
    chart.options.color = chart.data.color;
    chart.legendData = chart.data.legendData;
    chart.generateSVG(chart.data.legendData, customMargins);

    //If the container size is small, don't generate a legend
    if (chart.config.container.width > 550) {
        chart.generateVerticalLegend();
    }

    chart.generatePie(chart.currentData);


    //chart.localCallbackApplyAllEdits();
};


/** generatePie
 *
 * creates and draws a pie chart on the svg element
 * @params svg, pieData, options, container, chartName
 * @returns {{}}
 */
jvCharts.prototype.generatePie = function () {
    var chart = this,
        svg = chart.svg,
        pieData = chart.currentData.chartData,
        options = chart.options,
        container = chart.config.container,
        legendData = chart.data.legendData,
        chartName = chart.config.name;

    //define variables to change attr's
    svg.select('g.pie-container').remove();

    //var keys = Object.keys(pieData[0]);//Data headers
    var keys = [chart.data.dataTable.label, chart.data.dataTable['value 1']];
    var colors = options.color;

    var w = container.width;
    var h = container.height;
    var r = Math.min(h / 2, w / 3);

    var data = [];
    var total = 0;

    for (var i = 0; i < pieData.length; i++) {
        data[i] = {label: pieData[i][keys[0]], value: pieData[i][keys[1]]};
        //total += parseFloat(pieData[i][keys[1]]);
    }

    var pieDataNew = JSON.parse(JSON.stringify(data));//copy of pie data


    if (!chart.options.legendHeaders) {
        chart.options.legendHeaders = legendData;
    }

    var dataHeaders = chart.options.legendHeaders;

    var legendElementToggleArray = getLegendElementToggleArray(dataHeaders, legendData);

    if (legendElementToggleArray) {
        for (var j = 0; j < pieDataNew.length; j++) {
            for (var i = 0; i < legendElementToggleArray.length; i++) {
                if (legendElementToggleArray[i].element === pieDataNew[j].label && legendElementToggleArray[i].toggle === false) {
                    //pieDataNew.splice(j,1);
                    pieDataNew[j].value = 0;
                }
            }
        }
    }


    for (var i = 0; i < pieDataNew.length; i++) {
        total += parseFloat(pieDataNew[i].value);
    }

    var vis = svg
        .append("g")
        .data([pieDataNew])
        .attr("class", "pie-container")
        .attr("height", 200)
        .attr("transform", "translate(" + (w / 2) + "," + r + ")");

    var pie = d3.pie().value(function (d) {
        return d.value;
    });

    // declare an arc generator function
    var arc = d3.arc()
        .innerRadius(0)//Normal pie chart when this = 0, can be changed to create donut chart
        .outerRadius(r);

    var arcOver = d3.arc()
        .innerRadius(0)
        .outerRadius(r + 15);

    // select paths, use arc generator to draw
    var arcs = vis
        .selectAll("g.slice")
        .data(pie)
        .enter().append("g").attr("class", "slice");

    arcs.append("path")
        .attr("fill", function (d, i) {
            return getColors(colors, i, pieData[i][keys[0]]);
        })
        .attr("d", function (d) {
            return arc(d);
        })
        .attr('class', function (d, i) {
            return 'editable editable-pie pie-slice-' + i + ' highlight-class-' + i;
        })
        .attr("stroke", '#FFFFFF')
        .attr("stroke-width", 1)
        .on("mouseover", function (d, i) {
            if (chart.draw.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d.data, i);
                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);

                arcs.selectAll("*").style("opacity", 0.7);
                var slice = d3.select(this);
                slice.style("opacity", 1);
                slice.transition()
                    .duration(200)
                    .attr("d", arcOver);
            }
        })
        .on("mousemove", function (d, i) {
            if (chart.draw.showToolTip) {
                chart.tip.hideTip();
                //Get tip data
                var tipData = chart.setTipData(d.data, i);
                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on("mouseout", function (d) {
            chart.tip.hideTip();
            arcs.selectAll("*").style("opacity", 1);
            d3.select(this).transition()
                .duration(250)
                .attr("d", arc);
        });

    arcs.append("svg:text")
        .attr("class", "sliceLabel")
        .attr("transform", function (d) {
            var test = arc.centroid(d);
            test[0] = test[0] * 1.6;
            test[1] = test[1] * 1.6;
            return "translate(" + test + ")";
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(function (d, i) {
            var percent = pieDataNew[i].value / total * 100;
            percent = d3.format(".1f")(percent);
            if (percent > 5) {
                return percent + '%';
            }
        })
        .attr('font-size', '13px')
        .attr('fill', '#FFFFFF')
        .attr('pointer-events', 'none');
};

/************************************************ Scatter functions ******************************************************/

/**setScatterData
 *  gets scatter data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
jvCharts.prototype.setScatterData = function (data, dataTable, colors) {
    var chart = this;

    chart.data = {chartData: data, dataTable: dataTable};
    chart.data.legendData = setScatterLegendData(chart.data);
    chart.data.xAxisData = setScatterAxisData(chart.data, 'x');
    chart.data.yAxisData = setScatterAxisData(chart.data, 'y');
    chart.data.zAxisData = dataTable.hasOwnProperty('z') ? setScatterAxisData(chart.data, 'z') : {};

    //define color object for chartData
    chart.data.color = chart.setChartColors(chart.options.color, chart.data.legendData, colors);
};
/**setScatterLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setScatterLegendData(data) {
    var legendArray = [];
    if (data.dataTable.hasOwnProperty('series')) {
        var item = data.dataTable.series;
        for (var value in data.chartData) {
            var legendElement = data.chartData[value][item];
            if (legendArray.indexOf(legendElement) === -1) {
                legendArray.push(legendElement);
            }
        }
    }
    else {
        if (data.dataTable.hasOwnProperty('label')) {
            legendArray.push(data.dataTable.label);
        }
    }
    if (typeof legendArray[0] === 'undefined') {
        legendArray = [];
        legendArray.push(data.dataTable.label);
    }
    //order legend data in alphabetical order
    legendArray.sort();
    return legendArray;
}
/**setScatterAxisData
 *  gets z axis data based on the chartData
 *
 * @params data, dataTable
 * @returns object with label and values
 */
function setScatterAxisData(data, axis) {
    //declare vars
    var axisData = [],
        chartData = data.chartData,
        label = data.dataTable[axis],
        min = label ? chartData[0][label] : 0,
        max = label ? chartData[0][label] : 0;

    //loop over data to find max and min
    //also determines the y axis total if the data is stacked
    for (var i = 1; i < chartData.length; i++) {
        if (chartData[i].hasOwnProperty(label)) {
            var num = chartData[i][label];
            if (!isNaN(num)) {
                num = parseFloat(num);
                if (num > max) {
                    max = num;
                }
                else if (num < min) {
                    min = num;
                }
            }
        }
    }
    if (axis !== 'z') {
        min *= 0.9;
        max *= 1.1;
    }

    axisData.push(min);
    axisData.push(max);

    return {
        'label': label,
        'values': axisData,
        'textOrNum': 'num'
    };

}

jvCharts.prototype.drawScatter = function () {

    //determine data to use from tooltip
    var chart = this,
        dataObj = {};

    //Overwrite any pre-existing zoom
    chart.config.zoomEvent = null;

    dataObj.chartData = chart.data.chartData;
    dataObj.legendData = chart.data.legendData;
    dataObj.dataTable = chart.data.dataTable;
    chart.options.color = chart.data.color;
    dataObj.xAxisData = chart.data.xAxisData;
    dataObj.yAxisData = chart.data.yAxisData;
    dataObj.zAxisData = chart.data.zAxisData;
    chart.currentData = dataObj;

    //generate svg dynamically based on legend data
    chart.generateSVG(dataObj.legendData);

    //TODO remove these from draw object
    chart.generateXAxis(chart.currentData.xAxisData);
    chart.generateYAxis(chart.currentData.yAxisData);
    chart.generateLegend(chart.currentData.legendData, 'generateScatter');

    chart.generateScatter();
    chart.createLineGuide();

    //TODO: zoom function
    // chart.zoomFunc();
    // chart.formatXAxisLabels(chart.currentData.xAxisScale.ticks().length);
};

function calculateMean(data, type) {
    return d3.mean(data, function (value) {
        return +value[type];
    });
}

jvCharts.prototype.createLineGuide = function () {
    var chart = this,
        svg = chart.svg,
        options = chart.options,
        container = chart.config.container,
        chartData = chart.currentData.chartData,
        dataTable = chart.currentData.dataTable,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        zoomEvent = chart.config.zoomEvent;

    var xLineVal = calculateMean(chartData, dataTable['x']);
    var yLineVal = calculateMean(chartData, dataTable['y']);

    var x = getXScale(xAxisData, container, 'no-padding', zoomEvent, options.filtered);
    var y = getYScale(yAxisData, container, 'no-padding', zoomEvent);

    svg.selectAll("g.lineguide.x").remove();
    svg.selectAll("g.lineguide.y").remove();

    var lineGroup = svg.append("g")
        .attr("class", "line-group");

    //x line group for crosshair
    var lineGuideX = lineGroup.append("g")
        .attr("class", "lineguide x")
        .append("line")
        .style("stroke", "gray")
        .style("stroke-dasharray", ("3, 3"))
        .style("opacity", function () {
            if (options.lineGuide) {
                return 1;
            }
            else {
                return 0;
            }
        })
        .style("fill", "black");

    //y line group for crosshair
    var lineGuideY = lineGroup.append("g")
        .attr("class", "lineguide y")
        .append("line")
        .style("stroke", "gray")
        .style("stroke-dasharray", ("3, 3"))
        .style("opacity", function () {
            if (options.lineGuide) {
                return 1;
            }
            else {
                return 0;
            }
        })
        .style("fill", "black");

    //create crosshair based on median x (up/down) 'potentially' passed with data
    lineGuideX
        .attr("x1", x(xLineVal))
        .attr("y1", 0)
        .attr("x2", x(xLineVal))
        .attr("y2", container.height);

    //create crosshair based on median y (left/right) 'potentially' passed with data
    lineGuideY
        .attr("x1", x(0))
        .attr("y1", y(yLineVal))
        .attr("x2", container.width)
        .attr("y2", y(yLineVal));

    return lineGroup;
};
/** generateScatter
 *
 * creates and draws a scatter plot on the svg element
 * @params svg, scatterData, options, xAxisData, yAxisData, zAxisData, container, dataTable legendData, chartName, zoomEvent
 * @returns {{}}
 */
jvCharts.prototype.generateScatter = function () {
    var chart = this,
        svg = chart.svg,
        options = chart.options,
        container = chart.config.container,
        chartName = chart.config.name,
        scatterData = chart.currentData.chartData,
        dataTable = chart.currentData.dataTable,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        zAxisData = chart.currentData.zAxisData,
        legendData = chart.currentData.legendData,
        zoomEvent = chart.config.zoomEvent;

    if (!options.NODE_MIN_SIZE) {
        options.NODE_MIN_SIZE = 4.5;
    }
    if (!options.NODE_MAX_SIZE) {
        options.NODE_MAX_SIZE = 35;
    }

    //TODO set up legend toggle array for toggling legend elements

    svg.selectAll("g.scatter-container").remove();
    svg.selectAll("g.scatter-container.editable-scatter").remove();

    var translateX = 0;
    var translateY = 0;
    var zoomScale;

    translateX = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[0]; //translates if there is zoom
    zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

    translateX = Math.min(0, translateX);
    translateX = Math.min(0, Math.max(translateX, container.width - (container.width * zoomScale)));

    var colors = options.color;
    var keys = [
            chart.data.dataTable.label,
            chart.data.dataTable.x, 
            chart.data.dataTable.y,
            chart.data.dataTable.z,
            chart.data.dataTable['series']
            ];
    var data = [];
    var total = 0;

    var scatterDataNew = JSON.parse(JSON.stringify(scatterData));//copy of pie data


    if (!chart.options.legendHeaders) {
        chart.options.legendHeaders = legendData;
    }

    var dataHeaders = chart.options.legendHeaders;

    var legendElementToggleArray = getLegendElementToggleArray(dataHeaders, legendData);

    var scatterDataFiltered = [];

    if (legendElementToggleArray) {
        for (var j = 0; j < scatterDataNew.length; j++) {
            for (var i = 0; i < legendElementToggleArray.length; i++) {
                if(typeof scatterDataNew[j][dataTable.label] === 'undefined' || scatterDataNew[j][dataTable.label] === ""){
                    if (legendElementToggleArray[i].toggle === false) {
                        //scatterDataNew.splice(j,1);
                        scatterDataNew[j][dataTable.x] = -1;
                        scatterDataNew[j][dataTable.y] = -1;
                        scatterDataNew[j][dataTable.z] = -1;
                    }
                } else {
                    if (legendElementToggleArray[i].element === scatterDataNew[j][dataTable.series] && legendElementToggleArray[i].toggle === false) {
                        //scatterDataNew.splice(j,1);
                        scatterDataNew[j][dataTable.x] = -1;
                        scatterDataNew[j][dataTable.y] = -1;
                        scatterDataNew[j][dataTable.z] = -1;
                    }
                }
            }
        }
    }

    for (var j = 0; j < scatterDataNew.length; j++) {
        if(scatterDataNew[j][dataTable.x] !== -1 && scatterDataNew[j][dataTable.y] !== -1){
            scatterDataFiltered.push(scatterDataNew[j]);
        }
    }

    var x = getXScale(xAxisData, container, 'no-padding', zoomEvent, options.filtered);
    var y = getYScale(yAxisData, container, 'no-padding', zoomEvent);
    if (!_.isEmpty(zAxisData)) {
        var z = getZScale(zAxisData, container, options, zoomEvent);
    }

    var cxTranslate,
        cyTranslate;

    cxTranslate = function (d, i) {
        return x(scatterDataFiltered[i][xAxisData.label]);
    };
    cyTranslate = function (d, i) {
        return y(scatterDataFiltered[i][yAxisData.label]);
    };

    var scatters = svg.append("g")
        .attr("class", "scatter-container")
        .selectAll("g");

    var scatterGroup = scatters
        .data(function () {
            return scatterDataFiltered;
        })
        .enter()
        .append('circle')
        .attr("class", function (d, i) {
            return 'editable editable-scatter scatter-circle-' + i + ' highlight-class';
        })
        .attr("cx", function (d, i) {

            return cxTranslate(d, i);
        })
        .attr("cy", function (d, i) {
            return cyTranslate(d, i);
        })
        .attr("transform", "translate(" + translateX + "," + translateY + ")")
        .attr("r", function (d, i) {
            if (dataTable.hasOwnProperty('z')) {
                if (!_.isEmpty(zAxisData) && scatterDataFiltered[i][dataTable.z]) {
                    return z(scatterDataFiltered[i][dataTable.z]);
                }
            }
            return options.NODE_MIN_SIZE;
        })
        .on("mouseover", function (d, i, j) {
            if (chart.draw.showToolTip) {
                var tipData = chart.setTipData(d, i);

                //Draw tip line
                chart.tip.generateScatterTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on("mousemove", function (d, i) {
            if (chart.draw.showToolTip) {
                chart.tip.hideTip();
                //Get tip data
                var tipData = chart.setTipData(d, i);
                //Draw tip line
                chart.tip.generateScatterTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on("mouseout", function () {
            if (chart.draw.showToolTip) {
                chart.tip.hideTip();
            }
        })
        .on("zoom", function () {
            if (chart.draw.showToolTip) {
                // chart.draw.tip.hide();
            }
        })
        .attr('fill', function (d, i) {
            if (dataTable.hasOwnProperty('series')) {
                var color = getColors(colors, i, scatterDataFiltered[i][dataTable.series]);
            }
            else {
                var color = getColors(colors, i, scatterDataFiltered[i][dataTable.label]);
            }
            return color;
        });

    return scatters;
};
/************************************************ Line functions ******************************************************/

/**setLineData
 *  gets line data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
jvCharts.prototype.setLineData = function (data, dataTable, colors) {
    var chart = this;
    chart.data = {chartData: data, dataTable: dataTable};

    //sort chart data if there is a sort type and label in the options
    if (chart.options.sortType) {
        if (chart.options.sortLabel) {
            chart.organizeChartData(chart.options.sortLabel, chart.options.sortType);
        }
    }
    chart.data.legendData = setBarLineLegendData(chart.data);
    chart.data.xAxisData = setXAxisData(chart.data);
    chart.data.yAxisData = setYAxisData(chart.data);

    //define color object for chartData
    chart.data.color = chart.setChartColors(chart.options.color, chart.data.legendData, colors);
};
/**setBarLineLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setBarLineLegendData(data) {
    var legendArray = [];
    for (var item in data.dataTable) {
        if (data.dataTable.hasOwnProperty(item)) {
            if (item !== 'label') {
                legendArray.push(data.dataTable[item]);
            }
        }
    }
    return legendArray;
}
/** paintLineChart
 *
 * The initial starting point for line chart, begins the drawing process. Must already have the data stored in the chart
 * object
 */
jvCharts.prototype.paintLineChart = function () {
    var chart = this;

    //Uses the original data and then manipulates it based on any existing options
    var dataObj = chart.getBarDataFromOptions();

    //assign current data which is used by all bar chart operations
    chart.currentData = dataObj;

    //Overwrite any pre-existing zoom
    chart.config.zoomEvent = null;

    //generate svg dynamically based on legend data
    chart.generateSVG(dataObj.legendData);
    chart.generateXAxis(dataObj.xAxisData);
    chart.generateYAxis(dataObj.yAxisData);
    chart.generateLegend(dataObj.legendData, 'generateLine');
    chart.formatXAxisLabels(dataObj.chartData.length);

    // chart.options.rotateAxis ? chart.drawGridlines(dataObj.xAxisData) : chart.drawGridlines(dataObj.yAxisData);
    //need to save tooltip because it is used in other functions
    // chart.draw.toolTip = chart.generateToolTip(dataObj.chartData);
    chart.generateLine(dataObj);

    //zoom disabled for now
};

/** generateLine
 *
 * Paints the lines
 * @params lineData
 */
jvCharts.prototype.generateLine = function (lineData) {
    var chart = this,
        svg = chart.svg,
        options = chart.options,
        container = chart.config.container;


    svg.selectAll("g.line-container").remove();

    var translateX = 0;
    var translateY = 0;
    var zoomScale = 1;

    //Used to draw line that appears when tool tips are visible
    var tipLineX = 0,
        tipLineWidth = 0,
        tipLineHeight = 0,
        tipLineY = 0;

    //Setting zoom variables based on if axis is rotated
    if (options.rotateAxis) {
        translateY = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[1]; //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

        translateY = Math.min(0, translateY);
        translateY = Math.min(0, Math.max(translateY, container.height - (container.height * zoomScale)));
    }
    else {
        translateX = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[0]; //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

        translateX = Math.min(0, translateX);
        translateX = Math.min(0, Math.max(translateX, container.width - (container.width * zoomScale)));
    }

    var colors = options.color, x, y;

    svg.selectAll("g.line-container").remove();
    var lines = svg.append("g")
        .attr("class", "line-container")
        .selectAll("g");

    var dataHeaders = chart.options.seriesFlipped ? chart.options.flippedLegendHeaders ? chart.options.flippedLegendHeaders : lineData.legendData : chart.options.legendHeaders ? chart.options.legendHeaders : lineData.legendData;

    var lineDataNew = getToggledData(lineData, dataHeaders);

    var eventGroups = generateEventGroups(lines, lineDataNew, chart);
    var lineGroups = generateLineGroups(lines, lineDataNew, chart);

    eventGroups
        .on("mouseover", function (d, i, j) { // Transitions in D3 don't support the 'on' function They only exist on selections. So need to move that event listener above transition and after append
            if (chart.draw.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d, i);

                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }

        })
        .on("mouseout", function (d) {
            chart.tip.hideTip();
            svg.selectAll(".tip-line").remove();
        });

    // TODO add tooltips when hovering over the line or circles

    // lineGroups
    //    .on("mouseover", function (d, i, j) {
    //        //console.log(d, i, j);
    //        //if (chart.draw.showToolTip) {
    //        //    chart.draw.tip.show({d: d, i: j}, eventGroups[0][j]);//j is for event rects, i is for bars
    //        //    //offset for tooltip based on mouse position
    //        //    if (options.rotateAxis) {
    //        //        var offset = -1 * (container.width - d3.mouse(this)[0]);//d3.mouse(this)[0];
    //        //        chart.draw.tip.offset([0, offset]);
    //        //    }
    //        //    else {
    //        //        var offset = d3.mouse(this)[1];
    //        //        chart.draw.tip.offset([offset, 0]);
    //        //    }
    //        //    //Draw tip line
    //        //
    //        //    svg
    //        //        .append("line")
    //        //        .attr({
    //        //            "class": "tip-line",
    //        //            "x1": function () {
    //        //                return options.rotateAxis ? 0 : tipLineX + tipLineWidth / 2;
    //        //            },
    //        //            "x2": function () {
    //        //                return options.rotateAxis ? tipLineWidth : tipLineX + tipLineWidth / 2;
    //        //            },
    //        //            "y1": function () {
    //        //                return options.rotateAxis ? tipLineY + tipLineHeight / 2 : 0;
    //        //            },
    //        //            "y2": function () {
    //        //                return options.rotateAxis ? tipLineY + tipLineHeight / 2 : tipLineHeight;
    //        //            },
    //        //            "fill": "none",
    //        //            "shape-rendering": "crispEdges",
    //        //            "stroke": "black",
    //        //            "stroke-width": "1px"
    //        //        });
    //        //}
    
    //    })
    //    .on("mouseout", function (d) {
    //        chart.draw.tip.hide();
    //        svg.selectAll(".tip-line").remove();
    //    });

    return lines;

};
/** generateLineGroups
 *
 * Paints the groups of the lines
 * @params chartContainer, barData, chart
 */
function generateLineGroups(lineContainer, lineData, chart) {
    var container = chart.config.container,
        options = chart.options,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        legendData = chart.currentData.legendData,
        colors = options.color,
        lines;

    //Get Position Calculations
    var x = getXScale(xAxisData, container, 'no-padding', null, options.filtered);
    var y = getYScale(yAxisData, container, 'no-padding', null);

    var xTranslate,
        yTranslate;

    if (options.rotateAxis === true) {
        xTranslate = function (d, i) {
            return x(d);
        };
        yTranslate = function (d, i) {
            return (y(lineData[i][yAxisData.label]) + container.height / (yAxisData.values.length) / 2);
        };
    } else {
        xTranslate = function (d, i) {
            return (x(lineData[i][xAxisData.label]) + container.width / (xAxisData.values.length) / 2);
        };
        yTranslate = function (d, i) {
            return y(d);
        };
    }

    //Append lines and circles

    var data = {};

    for (var i = 0; i < lineData.length; i++) {
        for (var k = 0; k < legendData.length; k++) {

            if (typeof options.legendOptions !== "undefined") {//Accounting for legend toggles
                if (options.legendOptions[k].toggle === false) {
                    //Don't write anything to data
                    continue;
                }
                else {
                    //Write something to data
                    if (!data[legendData[k]]) {
                        data[legendData[k]] = [];
                    }
                    data[legendData[k]].push(parseFloat(lineData[i][legendData[k]]));
                }
            }
            else {//Initial creation of visualization w/o legend options
                if (!data[legendData[k]]) {
                    data[legendData[k]] = [];
                }
                data[legendData[k]].push(parseFloat(lineData[i][legendData[k]]));

            }
        }

    }

    chart.svg.selectAll(".lines").remove();

    chart.svg.selectAll(".line").remove();
    chart.svg.selectAll(".circle").remove();

    lines = chart.svg.selectAll(".line-container");

    var valueline = {};
    var circles = {};
    for (var k in data) {
        //Create path generator for each series
        if (data.hasOwnProperty(k)) {
            valueline[k] = d3.line()//line drawing function
                .x(function (d, i) {
                    if (isNaN(d)) {
                        return null;
                    }
                    return xTranslate(d, i);
                })
                .y(function (d, i) {
                    if (isNaN(d)) {
                        return null;
                    }
                    return yTranslate(d, i);
                });

            //Add lines to the line-container
            lines
                .append('g')
                .attr('class', 'line ' + (k))
                .append("path")//draws the line
                .attr('stroke', function (d, i, j) {
                    return getColors(colors, i, k);
                })   // fills the bar with color
                .attr("stroke-width", "2")
                .attr("fill", "none")
                .attr("d", valueline[k](data[k]));

            //Add circles at joints in the lines
            circles[k] = lines
                .append('g')
                .attr('class', 'circle ' + (k))
                .selectAll('circle' + k)
                .data(data[k])
                .enter()
                .append("circle")//Circles for the joints in the line
                .attr('class', function (d, i) {
                    return 'circle-' + chart.currentData.chartData[i][chart.currentData.dataTable.label] + ' highlight-class-' + i;
                })
                .attr("cx", function (d, i) {
                    if (isNaN(d)) {
                        return null;
                    }
                    return xTranslate(d, i);
                })
                .attr("cy", function (d, i) {
                    if (isNaN(d)) {
                        return null;
                    }
                    return yTranslate(d, i);
                })
                .attr('fill', function (d, i, j) {
                    if (isNaN(d)) {
                        return null;
                    }
                    return getColors(colors, i, k);
                })
                .attr('opacity', function (d, i, j) {
                    if (isNaN(d)) {
                        return 0;
                    }
                    return 1;
                })
                .attr("r", 4);
        }
    }

    //Return line groups
    return lines.selectAll(".circle");
}

/************************************************ HeatMap functions ******************************************************/

/**setHeatMapData
 *  gets heatmap data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
jvCharts.prototype.setHeatMapData = function (data, dataTable, colors) {
    var chart = this;
    chart.data = {chartData: data, dataTable: dataTable};
    chart.data.xAxisNames = setXAxisNames(chart.data);
    chart.data.yAxisNames = setYAxisNames(chart.data);
    //define color object for chartData
    chart.data.color = chart.setChartColors(chart.options.color, chart.data.xAxisNames, colors);
};

/**setHeatMapLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setXAxisNames(data) {
    var xAxisNames = [];
    for (var i = 0; i < data.chartData.processedData.length; i++) {
        if (xAxisNames.indexOf(data.chartData.processedData[i].xAxisName) == -1) {
            if (data.chartData.processedData[i].length > 20) {
                xAxisNames.push(data.chartData.processedData[i].xAxisName.substring(0, 20) + '...');
            } else {
                xAxisNames.push(data.chartData.processedData[i].xAxisName);
            }
        }
    }
    xAxisNames.sort();
    return xAxisNames;
}

function setYAxisNames(data) {
    var yAxisNames = [];
    for (var i = 0; i < data.chartData.processedData.length; i++) {
        if (yAxisNames.indexOf(data.chartData.processedData[i].yAxisName) == -1) {
            if (data.chartData.processedData[i].length > 20) {
                yAxisNames.push(data.chartData.processedData[i].yAxisName.substring(0, 20) + '...');
            } else {
                yAxisNames.push(data.chartData.processedData[i].yAxisName);
            }
        }
    }
    yAxisNames.sort();
    return yAxisNames;
}

jvCharts.prototype.paintHeatMapChart = function () {
    var chart = this;

    chart.options.color = chart.data.color;

    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship

    var heatMapMargins = {
        top: 100,
        right: 0,
        bottom: 0,
        left: 110
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, heatMapMargins);
    // chart.generateLegend(chart.currentData.legendData, 'generateHeatMap');
    chart.generateHeatMap(chart.currentData);


};

/** generateHeatMap
 *
 * paints the HeatMap on the chart
 * @params HeatMapData
 */
jvCharts.prototype.generateHeatMap = function (heatMapData) {

    var chart = this,
        svg = chart.svg,
        colors = heatMapData.chartData.colors,
        container = chart.config.container,
        allFilterList = [],
        relationMap = chart.data.dataTable,
        heatMap = null,
        chartName = chart.config.name,
        buckets = chart.buckets,
        minContainer = 300,
        maxContainer = 1200,
        quantiles = heatMapData.chartData.uiOptions.quantiles,
        data = chart.data.chartData.processedData;

    if(heatMapData.xAxisNames.length > heatMapData.yAxisNames.length){
        scaleByMinCategory = heatMapData.xAxisNames.length;
    } else {
        scaleByMinCategory = heatMapData.yAxisNames.length;
    }

    if(container.width < minContainer || container.height < minContainer){
        scaleByContainer = minContainer;
    } else if(container.width > maxContainer && container.height > maxContainer){
        scaleByContainer = maxContainer;
    } else {
        if(container.height > container.width){
            scaleByContainer = container.width;
        } else {
            scaleByContainer = container.height;
        }
    }

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var colorScale = d3.scaleQuantile()
        .domain(heatMapData.chartData.valueArray)
        .range(colors);

    var gridSize = Math.floor(scaleByContainer / scaleByMinCategory);

    var vis = svg.append("g").attr("transform", "translate(300,0)").attr("class", "heatmap");

    var yAxisTitle = vis.selectAll(".heatmap")
            .data([heatMapData.dataTable.y])
        .enter().append("text")
            .attr("class", "axisLabels bold")
            .attr("x", -21)
            .attr("y", -5)
            .attr("text-anchor", "end")
            .text(function (d) {
                return d;
            });
        yAxisTitle.exit().remove();

    var yAxis = vis.selectAll(".yAxis")
            .data(heatMapData.yAxisNames)
        .enter().append("text")
            .text(function (d) {
                return d;
            })
            .attr("x", 0)
            .attr("y", function (d, i) {
                return i * gridSize;
            })
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
            .attr("class", "axisLabels");

        var xAxisTitle = vis.selectAll(".xAxisTitle")
            .data([heatMapData.dataTable.x])
        .enter().append("text")
            .attr("class", "axisLabels bold")
            .attr("x", 6)
            .attr("y", 9)
            .attr("transform", function (d, i) {
                return "translate(" + -gridSize / 2 + ", -26)rotate(-45)";
            })
            .text(function (d) {
                return d;
            });
        xAxisTitle.exit().remove();

        var xAxis = vis.selectAll(".xAxis")
            .data(heatMapData.xAxisNames)
            .enter().append("svg:g");

        xAxis.append("text")
            .text(function (d) {
                return d;
            })
            .style("text-anchor", "start")
            .attr("x", 6)
            .attr("y", 7)
            .attr("class", "axisLabels")
            .attr("transform", function (d, i) {
                return "translate(" + ((i * gridSize) + (gridSize / 2)) + ", -6)rotate(-45)";
            });

        var width = heatMapData.xAxisNames.length * gridSize;
        var height = heatMapData.yAxisNames.length * gridSize;

        //vertical lines
        var vLine = vis.selectAll(".vline")
            .data(d3.range(heatMapData.xAxisNames.length + 1))
        .enter().append("line")
            .attr("x1", function (d) {
                return d * gridSize;
            })
            .attr("x2", function (d) {
                return d * gridSize;
            })
            .attr("y1", function (d) {
                return 0;
            })
            .attr("y2", function (d) {
                return height;
            })
            .style("stroke", "#eee");

        // horizontal lines
        var hLine = vis.selectAll(".hline")
            .data(d3.range(heatMapData.yAxisNames.length + 1))
        .enter().append("line")
            .attr("y1", function (d) {
                return d * gridSize;
            })
            .attr("y2", function (d) {
                return d * gridSize;
            })
            .attr("x1", function (d) {
                return 0;
            })
            .attr("x2", function (d) {
                return width;
            })
            .style("stroke", "#eee");

        var heatMap = vis.selectAll(".heat")
            .data(data)
            .enter().append("rect")
            .attr("x", function (d) {
                return (d.xAxis) * gridSize;
            })
            .attr("y", function (d) {
                return (d.yAxis) * gridSize;
            })
            .attr("rx", 2)
            .attr("ry", 2)
            .attr("class", "heat")
            .attr("width", gridSize)
            .attr("height", gridSize)
            .style("fill", function (d) {
                return colorScale(d.value);
            })
            .style("stroke", "#E6E6E6")
            .style("stroke-width", 2)
            .on("mouseover", function(d) {
                chart.tip.generateSimpleTip(d, chart.data.dataTable, colorScale(d.value), d3.event.pageX, d3.event.pageY);
            })
            .on("mouseout", function(d) {
                chart.tip.hideTip();
            });

        var legendContainer = svg.append("g").attr("transform", "translate(0,0)").attr("class", "legend");
        var legendTextContainer = svg.append("g").attr("transform", "translate(0,0)").attr("class", "legendText");
        var legendTranslation = {x: 0, y: 15},        
            legendElementHeight = 30,
            legendElementWidth = 20;

        var legend = legendContainer.selectAll(".legend")
            .data([0].concat(colorScale.quantiles()))
            .enter().append("g");

        legend.append("rect")
            .attr("class", "legend")
            .attr("x", 3)
            .attr("y", function(d,i){
                return ((gridSize) * i / 2);
            })
            .attr("width", legendElementWidth)
            .attr("height", legendElementHeight)
            .style("fill", function (d, i) {
                return colors[i];
            })
            .attr("transform", "translate(" + legendTranslation.x + "," + (legendTranslation.y) + ")");

        legend.append("text")
            .attr("class", "legendText")
            .attr("transform", "translate(" + legendTranslation.x + "," + (legendTranslation.y + 20) + ")")
            .attr("x", legendElementWidth + 5)
            .attr("y", function(d,i){
                return ((gridSize) * i / 2);
            })
            .attr("dy", ".35em")
            .text(function (d) {
                return d;
            })
            .style("fill", "black");
};

/************************************************ Pack functions ******************************************************/

/**setPackChartData
 *  gets pack data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
jvCharts.prototype.setPackChartData = function (data, dataTable, colors) {
    var chart = this;
    chart.data = {chartData: data, dataTable: dataTable};
    // chart.data.legendData = setPackLegendData(chart.data);
    //define color object for chartData
    chart.data.color = colors;
};

/**setPackLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setPackLegendData(data) {
    var legendArray = [];
    for (var i = 0; i < data.chartData.children.length; i++) {
        if (legendArray.indexOf(data.chartData.children[i][data.dataTable.series]) == -1) {
            legendArray.push((data.chartData.children[i][data.dataTable.series]));
        }
    }
    return legendArray;
}

jvCharts.prototype.paintPackChart = function () {
    var chart = this;

    chart.options.color = chart.data.color;

    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship

    var packMargins = {
        top: 45,
        right: 50,
        left: 50,
        bottom: 130
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, packMargins);
    // chart.generateLegend(chart.currentData.legendData, 'generatePack');
    chart.generatePack(chart.currentData);


};

/** generatePack
 *
 * paints the pack on the chart
 * @params packData
 */
jvCharts.prototype.generatePack = function (packData) {

    var chart = this,
        svg = chart.svg,
        colors = packData.color,
        container = chart.config.container,
        allFilterList = [],
        relationMap = chart.data.dataTable,
        chartName = chart.config.name;

    chart.children = chart.data.chartData;

    var newData = JSON.parse(JSON.stringify(chart.children));//copy of pie data

    var color = d3.scaleOrdinal()
        .range(chart.data.color
        .map(function(c) { c = d3.rgb(c); c.opacity = 0.8; return c; }));

    var margin = 20,
        diameter = container.width / 1.75;

    //  assigns the data to a hierarchy using parent-child relationships
    var root = d3.hierarchy(chart.children, function(d) {
        return d.children;
    });

    var pack = d3.pack()
        .size([container.width - margin, container.height - margin])
        .padding(2);

    var nodes = pack(root
        .sum(function(d) { 
            return d.name; 
        })
        .sort(function(a, b) { 
            return b.height - a.height || b.value - a.value; 
        }))
        .descendants();

    var vis = svg.append("g")
        .attr("class", "pack")
        .attr("width", container.width)
        .attr("height", container.height)
        .attr("transform", "translate(" + container.width / 2 + "," + container.height / 2 + ")");
        // .style("background", "#FFF")
        // .on("click", function() { 
        //     zoom(root); 
        // });

    var circle = vis.selectAll("circle")
        .data(root.descendants())
    .enter().append("circle")
        .attr("class", function(d) { 
            return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; 
        })
        .style("fill", function(d) { 
            d.color = color(d.depth);
            return d.children ? color(d.depth) : null; 
        })
        .on("click", function(d) { 
            if (focus !== d) {
                zoom(d), d3.event.stopPropagation(); 
            } 
        })
        .on("mouseover", function(d, i) {
            //Get tip data
            var tipData = chart.setTipData(d, i);
            //Draw tip line
            chart.tip.generateSimpleTip(tipData, tipData.tipData, d3.event);
        })
        .on("mouseout", function(d) {
            chart.tip.hideTip();
        });

    var text = vis.selectAll("text")
        .data(root.descendants())
    .enter().append("text")
        .attr("class", "label")
        .style("fill-opacity", function(d) { 
            return d.parent === root ? 1 : 0; 
        })
        .style("display", function(d) { 
            return d.parent === root ? "inline" : "none"; 
        });

    var node = svg.selectAll("circle,text");

    d3.select(".node--root")
        .on("click", function() { 
            zoom(root); 
        });

    zoomTo([root.x, root.y, root.r * 2 + margin]);

    function zoom(d) {
        var focus0 = focus; focus = d;

        var transition = d3.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", function(d) {
                var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                return function(t) { 
                    zoomTo(i(t)); 
                };
        });

        transition.selectAll("text")
            .filter(function(d) { 
                return d.parent === focus || this.style.display === "inline";
            })
            .style("fill-opacity", function(d) { 
                return d.parent === focus ? 1 : 0; 
            })
            .style("display", function(d) { 
                return d.parent === focus ? "inline" : "none"; 
            })
            .each("start", function(d) { 
                if (d.parent === focus) {
                   this.style.display = "inline"; 
                }  
            })
            .each("end", function(d) { 
                if (d.parent !== focus) {
                  this.style.display = "none";   
                } 
            });
    }

    function zoomTo(v) {
        var k = diameter / v[2]; view = v;

        node.attr("transform", function(d) { 
            return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; 
        });

        circle.attr("r", function(d) { 
            return d.r * k; 
        });
    }
};

/************************************************ Sunburst functions ******************************************************/

/**setSunburstChartData
 *  gets sunburst data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
jvCharts.prototype.setSunburstChartData = function (data, dataTable, colors) {
    var chart = this;
    chart.data = {chartData: data, dataTable: dataTable};
    // chart.data.legendData = setPackLegendData(chart.data);
    //define color object for chartData
    chart.data.color = colors;
};

jvCharts.prototype.paintSunburstChart = function () {
    var chart = this;

    chart.options.color = chart.data.color;

    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship

    var sunburstMargins = {
        top: 45,
        right: 50,
        left: 50,
        bottom: 130
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, sunburstMargins);
    // chart.generateLegend(chart.currentData.legendData, 'generateSunburst');
    chart.generateSunburst(chart.currentData);


};

/** generateSunburst
 *
 * paints the sunburst on the chart
 * @params sunburstData
 */
jvCharts.prototype.generateSunburst = function (sunburstData) {

    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        allFilterList = [],
        relationMap = chart.data.dataTable,
        chartName = chart.config.name,
        width = container.width,
        height = container.height,
        radius = (Math.min(width, height) / 2) - 10;

    chart.children = chart.data.chartData;

    var newData = JSON.parse(JSON.stringify(chart.children));//copy of pie data

    var formatNumber = d3.format(",d");

    var x = d3.scaleLinear()
        .range([0, 2 * Math.PI]);

    var y = d3.scaleSqrt()
        .range([0, radius]);

    var color = d3.scaleOrdinal()
        .range(chart.data.color
        .map(function(c) { c = d3.rgb(c); c.opacity = 0.8; return c; }));

    // var color = d3.scaleOrdinal(d3.schemeCategory10);

    var partition = d3.partition();

    var arc = d3.arc()
        .startAngle(function(d) { 
            return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); 
        })
        .endAngle(function(d) { 
            return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); 
        })
        .innerRadius(function(d) { 
            return Math.max(0, y(d.y0)); 
        })
        .outerRadius(function(d) { 
            return Math.max(0, y(d.y1)); 
        });

    //  assigns the data to a hierarchy using parent-child relationships
    var root = d3.hierarchy(chart.children, function(d) {
        return d.children;
    });

    root.sum(function(d) {
        return d.value;
    })

    var vis = svg.append("g")
        .attr("class", "sunburst")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");


    vis.selectAll("path")
        .data(partition(root).descendants())
    .enter().append("g").attr("class", "node");

    var path = vis.selectAll(".node")
        .append("path")
        .attr("d", arc)
        .style("fill", function(d) {
            if(d.data.name === "root"){
                d.color = chart.options.backgroundColor;
                return chart.options.backgroundColor;
            } else {
                d.color = color((d.children ? d : d.parent).data.name);
                return color((d.children ? d : d.parent).data.name); 
            }
        })
        .on("mouseenter", function(d, i) {
            //Get tip data
            var tipData = chart.setTipData(d, i);
            //Draw tip line
            chart.tip.generateSimpleTip(tipData, tipData.tipData, d3.event);
        })
        .on("click", click)
        .on("mouseout", function(d) {
            chart.tip.hideTip();
        });

    // var text = vis.selectAll(".node")
    //     .append("text")
    //     .attr("transform", function(d) { 
    //         return "rotate(" + computeTextRotation(d) + ")"; 
    //     })
    //     .attr("x", function(d) { 
    //         return y(d.y0); 
    //     })
    //     .attr("dx", "6") // margin
    //     .attr("dy", ".35em") // vertical-align
    //     .text(function(d) { 
    //         return d.data.name === "root" ? "" : d.data.name
    //     });


    function click(d) {
        vis.transition()
            .duration(750)
            .tween("scale", function() {
                var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                    yd = d3.interpolate(y.domain(), [d.y0, 1]),
                    yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);

                return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
            })
            .selectAll("path")
            .attrTween("d", function(d) { 
                return function() { 
                    return arc(d); 
                }; 
            });
    }

    function computeTextRotation(d) {
        return (x(d.x0 + d.x1 / 2) - Math.PI / 2) / Math.PI * 180;
    }
};
/** highlightItems
 *
 * highlights items on the svg element
 * @params items, svg
 * @returns {{}}
 */
jvCharts.prototype.highlightItem = function (items, tag, highlightIndex, highlightUri) {
    var chart = this,
        svg = chart.svg;

    //TODO remove if statements
    if (highlightIndex >= 0) {
        if (chart.config.type === 'pie') {
            //set all circles stroke width to 0
            svg.select('.pie-container').selectAll(tag).attr({'stroke': '#FFFFFF', "stroke-width": 1});
            //highlight necessary pie slices
            var nodes = svg.select('.pie-container').selectAll(tag).nodes();
            for(var i =0; i < nodes.length; i ++) {
                if(nodes[i].classList.value.indexOf("highlight-class-"+highlightIndex) > -1) {
                    nodes[i].attr({
                        "stroke": "black",
                        "stroke-width": 2.0
                    });
                }
            }

        }
        if (chart.config.type === 'scatterplot') {
            //set all circles stroke width to 0
            svg.select('.scatter-container').selectAll(tag).attr({"stroke-width": 0});
            //highlight necessary scatter dots
            svg.select('.scatter-container').selectAll(tag).filter('.scatter-circle-' + highlightIndex).attr({
                "stroke": "black",
                "stroke-width": 2.0
            });
        }
    } else if(highlightUri) {
        if (chart.config.type === 'bar') {
            //set all bars stroke width to 0
            svg.select('.bar-container').selectAll(tag).attr({'stroke': 0, "stroke-width": 0});
            //highlight necessary bars
            svg.select('.bar-container').selectAll('.highlight-class-' + highlightUri).attr({
                "stroke": "black",
                "stroke-width": 2.0
            });
        }
        if (chart.config.type === 'line') {
            //set all circles stroke width to 0
            svg.select('.line-container').selectAll(tag).attr({'stroke': 0, "stroke-width": 0});
            //highlight necessary cirlces
            svg.select('.line-container').selectAll(tag).filter('.highlight-class-' + highlightUri).attr({
                "stroke": "black",
                "stroke-width": 2.0
            });
        }

    } else {
        console.log('need to pass highlight index to highlight item');
    }

};
