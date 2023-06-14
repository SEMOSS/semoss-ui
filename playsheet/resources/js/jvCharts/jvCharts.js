/***  jvCharts ***/

/**jvCharts
 *
 * @desc jvCharts constructor object
 * @params configObj
 */
function jvCharts(configObj) {
    "use strict";
    var chart = this;
    chart.config = {
        type: configObj.type.toLowerCase(),
        name: configObj.name,
        zoomEvent: null,
        container: configObj.container
    };

    if (configObj.hasOwnProperty('tipConfig')) {
        chart.tip = new jvTip({
            type: configObj.tipConfig.type,
            chartDiv: configObj.chartDiv
        });
    }

    chart.options = chart.cleanToolData(configObj.options);

    chart.showComments = false;

    chart.draw = {};
    chart.currentData = {};
    chart.chartDiv = configObj.chartDiv;
}

/************************************************ Data functions ******************************************************/

/**setBarData
 *
 * @desc gets bar data and adds it to the chart object
 * @params data, dataTable, colors
 */
jvCharts.prototype.setBarData = function (data, dataTable, dataTableKeys, colors) {
    var chart = this;

    chart.data = {chartData: data, dataTable: dataTable, dataTableKeys: dataTableKeys};

    //sort chart data if there is a sort type and label in the options
    if (chart.options.sortType) {
        if (chart.options.sortLabel) {
            chart.organizeChartData(chart.options.sortLabel, chart.options.sortType);
        }
    }
    chart.data.legendData = setBarLineLegendData(chart.data);
    chart.data.xAxisData = setXAxisData(chart.data);
    chart.data.yAxisData = setYAxisData(chart.data, chart.options);

    if (chart.options.seriesFlipped) {
        chart.setFlippedSeries();
        chart.flippedData.color = chart.setChartColors(chart.options.color, chart.flippedData.legendData, colors);
    }

    //define color object for chartData
    chart.data.color = chart.setChartColors(chart.options.color, chart.data.legendData, colors);
};

/**setLineData
 *
 * @desc gets line data and adds it to the chart object
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

/**
 *
 * @param data
 * @param dataTable
 * @param colors
 */
jvCharts.prototype.setSankeyData = function (data, dataTable, colors){
    var chart = this;
    var sankeyData = {};

    sankeyData.links = [];
    sankeyData.nodes = [];

    //Iterate through sources and targets to make a node list
    var nodeList = [];
    for(item in dataTable) {
        if(item === "value"){continue;};
        for (var i = 0; i < data.length; i++) {
            var potentialNode = data[i][dataTable[item]];
            var addToList = true;
            for (var j = 0; j < nodeList.length; j++) {
                if (potentialNode === nodeList[j]) {
                    addToList = false;
                    break;
                }
            }
            if (addToList) {
                nodeList.push(potentialNode);
            }
        }
    }
    //Create nodes object
    for (var i = 0; i < nodeList.length; i++) {
        sankeyData.nodes.push({
            "name": nodeList[i]
        });
    }

    sankeyData.links = data.map(function(x){
        return{
            "source": x[dataTable.start],
            "target": x[dataTable.end],
            "value": x[dataTable.value]
        }
    });

    var nodeMap = {};
    for (var i = 0; i < sankeyData.nodes.length; i++) {
        sankeyData.nodes[i].node = i;
        nodeMap[sankeyData.nodes[i].name] = i;
    }
    sankeyData.links = sankeyData.links.map(function(x){
        return {
            source: nodeMap[x.source],
            target: nodeMap[x.target],
            value: x.value
        };
    });

    chart.data = {chartData: sankeyData, dataTable: dataTable};
    chart.data.color = d3.scale.category20();
}

/**
 *
 * @param data
 * @param dataTable
 * @param colors
 */
jvCharts.prototype.setChordData = function (data, dataTable, colors){
    var chart = this;
    var chordData = {};

    chordData.links = [];
    chordData.nodes = [];

    //Iterate through sources and targets to make a node list
    var nodeList = [];
    for(item in dataTable) {
        if(item === "value"){continue;};
        for (var i = 0; i < data.length; i++) {
            var potentialNode = data[i][dataTable[item]];
            var addToList = true;
            for (var j = 0; j < nodeList.length; j++) {
                if (potentialNode === nodeList[j]) {
                    addToList = false;
                    break;
                }
            }
            if (addToList) {
                nodeList.push(potentialNode);
            }
        }
    }
    //Create nodes object
    for (var i = 0; i < nodeList.length; i++) {
        chordData.nodes.push({
            "name": nodeList[i]
        });
    }

    chordData.links = data.map(function(x){
        return{
            "source": x[dataTable.start],
            "target": x[dataTable.end],
            "value": x[dataTable.value]
        }
    });

    var nodeMap = {};
    for (var i = 0; i < chordData.nodes.length; i++) {
        chordData.nodes[i].node = i;
        nodeMap[chordData.nodes[i].name] = i;
    }
    chordData.links = chordData.links.map(function(x){
        return {
            source: nodeMap[x.source],
            target: nodeMap[x.target],
            value: x.value
        };
    });

    chart.data = {chartData: chordData, dataTable: dataTable};
    chart.data.color = d3.scale.category20();
}

/**setBarLineLegendData
 *
 * @desc gets legend info from chart Data
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
 *
 * @desc gets x axis data based on the chartData
 * @params data, dataTable
 * @returns object with label and values
 */
function setXAxisData(data) {
    //declare vars
    var xAxisData = [];
    var chartData = data.chartData;
    var label = '';
    var textOrNum = 'text';//Set text by default

    if (data.dataTable) {
        label = data.dataTable.label;
    } else {
        console.log('dataTable does not exist');
    }

    //Check if data table keys exist, if so, get type from there
    if(data.hasOwnProperty('dataTableKeys') && data.dataTableKeys){
        for (var i = 0; i < data.dataTableKeys.length; i++) {
            if(data.dataTableKeys[i].varKey === label){
                textOrNum = data.dataTableKeys[i].type;
                break;
            }
        }
    }

    //loop through data to get the x axis data
    for (var i = 0; i < chartData.length; i++) {
        if (chartData[i][label]) {
            xAxisData.push(chartData[i][label]);
        }
    }


    //TODO make these the defaults across all viz's
    // if(textOrNum === 'STRING'){
    //default to text
    textOrNum = "text";
    // }

    if(textOrNum === 'NUMBER'){
        textOrNum = 'num';
    }

    if(textOrNum === 'DATE'){
        textOrNum = 'text';
    }

    return {
        'label': label,
        'values': xAxisData,
        'textOrNum': textOrNum
    };
}
/**setYAxisData
 *
 * @desc gets y axis data based on the chartData
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
        yMaxLabel = "",
        textOrNum = 'text';

    //loop over data to find max and min
    //also determines the y axis total if the data is stacked
    for (var i = 0; i < chartData.length; i++) {
        var stack = 0;

        for (var k in data.dataTable) {
            if (data.dataTable.hasOwnProperty(k) && chartData[i].hasOwnProperty(data.dataTable[k]) && k !== 'label') {
                var num = chartData[i][data.dataTable[k]];
                if (!isNaN(num) && (label === '' || data.dataTable[k] === label)) {
                    num = parseFloat(num);
                    textOrNum = 'num';
                    stack += num;
                    if (num > yMax) {
                        yMax = num;
                        yMaxLabel = k;
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

    //Set the yAxis label to the label of the max value
    label = data.dataTable[yMaxLabel];

    yAxisData.push(yMin);
    if (options && options.stackToggle === true) {
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

/**setPieData
 *
 * @desc gets pie data and adds it to the chart object
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
 *
 * @desc gets legend info from chart Data
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

/**setScatterData
 *
 * @desc gets scatter data and adds it to the chart object
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
 *
 * @desc gets legend info from chart Data
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
 *
 * @desc gets z axis data based on the chartData
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

/**setRadialData
 *
 * @desc gets radial data and adds it to the chart object
 * @params data, dataTable, colors
 */
jvCharts.prototype.setRadialChartData = function (data, dataTable, colors) {
    var chart = this;
    chart.data = {chartData: data, dataTable: dataTable};
    chart.data.legendData = setRadialLegendData(chart.data);
    //define color object for chartData
    chart.data.color = chart.setChartColors(chart.options.color, chart.data.legendData, colors);
};
/**setRadialLegendData
 *
 * @desc gets legend info from chart Data
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

/**setTreeMapData
 *
 * @desc gets treemap data and adds it to the chart object
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
 *
 * @desc gets legend info from chart Data
 * @params data, type
 * @returns [] of legend text
 */
function setTreeMapLegendData(data) {
    var legendArray = [];
    for (var i = 0; i < data.chartData.length; i++) {
        if (legendArray.indexOf(data.chartData[i][data.dataTable.series]) == -1) {
            legendArray.push((data.chartData[i][data.dataTable.series]));
        }
    }
    return legendArray;
}

/**setGanttData
 *
 * @desc gets gantt data and adds it to the chart object
 * @params data, dataTable, colors
 */
jvCharts.prototype.setGanttData = function (data, dataTable, colors) {
    var chart = this;
    chart.data = {chartData: data, dataTable: dataTable};
    chart.data.legendData = setGanttLegendData(chart.data);
    chart.data.xAxisData = setGanttAxisData(chart, 'x');
    chart.data.yAxisData = setGanttAxisData(chart, 'y');
    //define color object for chartData
    chart.data.color = chart.setChartColors(chart.options.color, chart.data.legendData, colors);
};

/**setGanttLegendData
 *
 * @desc gets legend info from chart Data
 * @params data, type
 * @returns [] of legend text
 */
function setGanttLegendData(data) {
    var legendArray = [];
    //for (var i = 1; i <= Object.keys(data.dataTable).length; i++) {
    //    if(data.dataTable.hasOwnProperty(["start_" + i])){
    //        //check to make sure it has a matching end date
    //        if(data.dataTable.hasOwnProperty(["end_" + i])){
    //            legendArray.push(data.dataTable["start_" + i]);
    //        }
    //    }
    //
    //}
    legendArray.push("completed");
    legendArray.push("active");
    legendArray.push("projected");
    legendArray.push("slack");
    legendArray.push("delay");
    return legendArray;
}
/** setGanttAxisData
 *
 * @desc sets axis data for gantt
 * @params data, axis
 * @returns [] of legend text
 */
function setGanttAxisData(chart, axis) {
    var axisData = [],
        data = chart.data,
        chartData = data.chartData,
        textorNum;

    if (axis === 'x') {
        var label = data.dataTable.Group;
        textorNum = 'date';

        var numBars = data.legendData.length;
        //Loop through dataTable and assign labels based on how many groups there are
        var valueContainer = [];
        valueContainer.push(data.dataTable["start_1"]);
        valueContainer.push(data.dataTable["end_1"]);
        for (var i = 1; i < numBars; i++) {
            valueContainer.push(data.dataTable["start_" + (i + 1)]);
            valueContainer.push(data.dataTable["end_" + (i + 1)]);
        }

        //Get all the start and end dates and add them to axis data
        for (var i = 0; i < valueContainer.length; i++) {
            for (var ii = 0; ii < chartData.length; ii++) {
                if (chartData[ii][valueContainer[i]] != null) {
                    axisData.push(chartData[ii][valueContainer[i]]);
                }
            }
        }

        //Add any axis formatting to this object, need to use when painting
        chart.options.xAxisFormatting = {};

    } else {
        textorNum = "text";
        var label = data.dataTable.Group;

        //Add any axis formatting to this object, need to use when painting
        chart.options.yAxisFormatting = {};

        for (var i = 0; i < chartData.length; i++) {
            axisData.push(chartData[i][label]);
            if(chartData[i].CriticalPath === "true"){
                chart.options.yAxisFormatting[chartData[i][label]] = true;
            }
        }
    }

    return {
        'label': label,
        'values': axisData,
        'textOrNum': textorNum
    };
}


/**setFlippedSeries
 *
 * @desc flips series and returns flipped data
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
        chart.flippedData.xAxisData = setXAxisData(chart.flippedData);
        chart.flippedData.yAxisData = setYAxisData(chart.flippedData, chart.options);
        chart.flippedData.legendData = setBarLineLegendData(chart.flippedData);
    }
    else {
        console.log("Add additional chart type to set flipped series");
    }
};


/**organizeChartData
 *
 *  @desc reorders all data based on the sortLabel and sortType
 *  -Only for chartData, does not work with flipped data
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

    //catch multiple sortType inputs
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
 *
 * @desc cleans incoming colors for consistency
 * @params colorArray, legendData
 * @returns object with colors
 */

jvCharts.prototype.setChartColors = function (toolData, legendData, defaultColorArray) {
    var colorsArray = [];
    var colors = {};

    if (!Array.isArray(toolData)) {
        if (toolData === 'none' || legendData.length === 0) {
            colorsArray = defaultColorArray;
        } else {
            var legendElementsNotInToolData = [];
            for (var i = 0; i < legendData.length; i++) {
                if (toolData.hasOwnProperty(legendData[i])) {
                    colors[legendData[i]] = toolData[legendData[i]];
                } else {
                    legendElementsNotInToolData.push(legendData[i]);
                }
            }
            if (Object.keys(colors).length === 0 && colors.constructor === Object) {
                colorsArray = defaultColorArray;
            } else {
                for (var i = 0; i < legendElementsNotInToolData.length; i++) {
                    colors[legendElementsNotInToolData[i]] = '#AAAAAA';
                }
                return colors;
            }
        }
    } else {
        colorsArray = toolData;
    }

    var count = 0;

    //creates an object of colors mapped to each legend item
    //instead of using a colorArray that has no mapping
    for (var i = 0; i < legendData.length; i++) {
        if (count > colorsArray.length - 1) {
            count = 0;
        }
        colors[legendData[i]] = colorsArray[count];
        count++;
    }

    return colors;
};

/** cleanToolData
 *
 * @desc cleans incoming toolData for consistency
 * @param data - tooldata
 * @returns object with tooldata
 */
jvCharts.prototype.cleanToolData = function (data) {
    if (data) {
        if (!data.hasOwnProperty('rotateAxis')) {
            data.rotateAxis = false;
        }
        if (!data.hasOwnProperty('stackToggle')) {
            data.stackToggle = false;
        }

        if (data.stackToggle === 'stack-data') {
            data.stackToggle = true;
        }

        if (data.stackToggle === 'group-data') {
            data.stackToggle = false;
        }

        if (data.hasOwnProperty('colors')) {
            data.color = data.colors;
        }

    }
    return data;
};


/************************************************ Draw functions ******************************************************/

/** generateSVG
 *
 * @desc creates an SVG element on the panel
 * @params legendData, customMargins
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

    //add margin and container to chart config object
    chart.config.margin = margin;
    chart.config.container = container;

    //remove old svg if it exists
    chart.svg = chart.chartDiv.select("svg").remove();

    //svg layer
    chart.svg = chart.chartDiv.append("svg")
        .attr("class", "full-width full-height editable-svg")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + (margin.top) + ")");

    if (chart.options.hasOwnProperty('backgroundColor')) {
        chart.colorBackground(chart.options['backgroundColor']);
    }
};

/** generateXAxis
 *
 * @desc creates x axis on the svg
 * @params xAxisData
 */
jvCharts.prototype.generateXAxis = function (xAxisData, ticks) {
    //declare variables
    var chart = this,
        zoomEvent = chart.config.zoomEvent,
        translateX = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[0], //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale,
        xAxis,
        xAxisScale = getXScale(xAxisData, chart.config.container, null, zoomEvent, chart.options.xReversed),
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
    xAxis = d3.svg.axis()
        .scale(xAxisScale)
        //.ticks(xAxisData.values.length)
        .tickSize(0.5);

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

    var editable = 'xAxisLabels editable editable-xAxis editable-text';

    if (xAxisData.textOrNum === 'num') {
        editable += ' editable-num';
    }
    xAxisGroup.selectAll("text")
        .attr("class", editable)
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

/** generateYAxis
 *
 * @desc creates y axis on the svg
 * @params generateYAxis
 */
jvCharts.prototype.generateYAxis = function (yAxisData) {
    //declare local variables
    var chart = this,
        zoomEvent = chart.config.zoomEvent,
        translateY = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[1], //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale,
        yAxisScale = getYScale(yAxisData, chart.config.container, null, zoomEvent, chart.options.yReversed);

    //Save y axis scale to chart object
    chart.currentData.yAxisScale = yAxisScale;

    //remove previous svg elements
    chart.svg.selectAll(".yAxisContainer").remove();
    chart.svg.selectAll("text.yLabel").remove();

    translateY = Math.min(0, translateY);
    translateY = Math.min(0, Math.max(translateY, chart.config.container.height - (chart.config.container.height * zoomScale)));

    var yAxis = d3.svg.axis()//Link to D3.svg.axis options: https://github.com/mbostock/d3/wiki/SVG-Axes
        .scale(yAxisScale)//Sets the scale to use in the axis
        .ticks(10)//Sets the number of labels to display
        .tickSize(.5)//Sets the thickness of the axis line
        .tickPadding(5)
        .orient("left");
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
            if (chart.options.hasOwnProperty("yAxisFormatting")) {
                if (chart.options.yAxisFormatting.hasOwnProperty(d)) {
                    return '\uf024' + "  " + current;
                }
                else {
                    return current;
                }
            }
            else {
                return current;
            }
        })
        .style("font-weight", function (d) {
            if (chart.options.hasOwnProperty("yAxisFormatting")) {
                if (chart.options.yAxisFormatting.hasOwnProperty(d)) {
                    return "bold";
                }
            }
        })
        .attr('font-family', function (d, i) {
            if (chart.options.hasOwnProperty("yAxisFormatting")) {
                if (chart.options.yAxisFormatting.hasOwnProperty(d)) {
                    return 'FontAwesome';
                }
            }
        })
        .attr("fill", function (d, i) {
            if (chart.options.hasOwnProperty("yAxisFormatting")) {
                if (chart.options.yAxisFormatting.hasOwnProperty(d)) {
                    return "red";
                }
            }
        })
        .append("svg:title")
        .text(function (d) {
            return d;
        });

    //assign css class for edit mode
    // if the axis is numbers add editable-num
    var editable = 'editable editable-yAxis editable-text';

    if (yAxisData.textOrNum === 'num') {
        editable += ' editable-num';
    }
    chart.svg.select('.yAxis').selectAll('text').attr("class", editable);
};

/** drawGridlines
 *
 * @desc draws the gridlines with axis data
 * @params axixData
 */
jvCharts.prototype.drawGridlines = function (axisData) {
    var chart = this;
    var zoomEvent = chart.config.zoomEvent;

    chart.svg.selectAll("g.gridLines").remove();
    chart.svg.append("g")
        .attr("class", "gridLines");
    var scaleData;

    //Determine if gridlines are horizontal or vertical based on rotateAxis
    if (chart.options.rotateAxis === true || chart.config.type === 'gantt') {
        var gridLineHeight = chart.config.container.height;
        var xAxisScale = getXScale(axisData, chart.config.container, null, zoomEvent);

        if (axisData.textOrNum === 'text') {
            scaleData = axisData.values;
        }
        else if (axisData.textOrNum === 'num' || axisData.textOrNum === 'date') {
            scaleData = xAxisScale.ticks(10);
        }
        chart.svg.select(".gridLines").selectAll(".horizontalGrid").data(scaleData).enter()
            .append("line")
            .attr(
                {
                    "class": "horizontalGrid",
                    "x1": function (d, i) {
                        if (i > 0) {
                            return xAxisScale(d);
                        }
                        else {
                            return 0;
                        }
                    },
                    "x2": function (d, i) {
                        if (i > 0) {
                            return xAxisScale(d);
                        }
                        else {
                            return 0;
                        }
                    },
                    "y1": 0,
                    "y2": function (d, i) {
                        if (i > 0) {
                            return gridLineHeight;
                        }
                        else {
                            return 0;
                        }
                    },
                    "fill": "none",
                    "shape-rendering": "crispEdges",
                    "stroke": "#e6e6e6",
                    "stroke-width": "1px"
                });
    }
    else {
        var gridLineWidth = chart.config.container.width;
        var yAxisScale = getYScale(axisData, chart.config.container, null, zoomEvent);

        if (axisData.textOrNum === 'text') {
            scaleData = axisData.values;
        }
        else if (axisData.textOrNum === 'num' || axisData.textOrNum === 'date') {
            scaleData = yAxisScale.ticks(10);
        }
        chart.svg.select(".gridLines").selectAll(".horizontalGrid").data(scaleData).enter()
            .append("line")
            .attr(
                {
                    "class": "horizontalGrid",
                    "x1": 0,
                    "x2": function (d, i) {
                        if (i > 0) {
                            return gridLineWidth;
                        }
                        else {
                            return 0;
                        }
                    },
                    "y1": function (d, i) {
                        if (i > 0) {
                            return yAxisScale(d);
                        }
                        else {
                            return 0;
                        }
                    },
                    "y2": function (d, i) {
                        if (i > 0) {
                            return yAxisScale(d);
                        }
                        else {
                            return 0;
                        }
                    },
                    "fill": "none",
                    "shape-rendering": "crispEdges",
                    "stroke": "#e6e6e6",
                    "stroke-width": "1px"
                });
    }

};

/** createLineGuide
 *
 * @desc draws the lineGuide - a line in the middle of the x values and another in the middle of the y values
 */
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

    var x = getXScale(xAxisData, container, 'no-padding', zoomEvent, options.xReversed);
    var y = getYScale(yAxisData, container, 'no-padding', zoomEvent, options.yReversed);

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

    lineGuideX
        .attr("x1", x(xLineVal))
        .attr("y1", 0)
        .attr("x2", x(xLineVal))
        .attr("y2", container.height);

    lineGuideY
        .attr("x1", 0)
        .attr("y1", y(yLineVal))
        .attr("x2", container.width)
        .attr("y2", y(yLineVal));

    return lineGroup;
};

/************************************************ Legend functions ******************************************************/

/** generateLegend
 *
 * @desc draws the legend and attaches the redraw function to the legend elements
 * @params legendData, drawFunc
 */
jvCharts.prototype.generateLegend = function (legendData, drawFunc) {
    var chart = this,
        svg = chart.svg;

    svg.selectAll(".legend").remove();

    //Returns the legend rectangles that are toggled on/off
    var legendElements = generateLegendElements(chart, legendData, drawFunc);
    if (drawFunc) {
        //Don't attach click events if it's a gantt
        if (chart.config.type !== 'gantt' || !chart.currentData.dataTable.CriticalPath) {
            attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
        }
    }

};

/** attachClickEventsToLegend
 *
 * @desc Adds the necessary click events to the legend
 * @params chart, legendElements, drawFunc, legendData
 */
function attachClickEventsToLegend(chart, legendElements, drawFunc, legendData) {
    //Adding the click event to legend rectangles for toggling on/off
    legendElements
        .on("click", function (d, i) {
            var selectedRect = d3.select(this);
            chart.config.zoomEvent = null;
            if (selectedRect[0][0].attributes.fill.value !== "#FFFFFF") {
                selectedRect
                    .attr("fill", "#FFFFFF");
            }
            else {
                selectedRect
                    .attr("fill", getColors(chart.options.color, i, legendData[i]));
            }

            //Gets the headers of the data to be drawn
            var dataHeaders = updateDataFromLegend(legendElements);

            //Sets the legendData to the updated headers
            if (chart.options.seriesFlipped) {
                chart.options.flippedLegendHeaders = dataHeaders;
            }
            else {
                chart.options.legendHeaders = dataHeaders;
            }

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
            if (chart.config.type === 'bar' || chart.config.type === 'line' || chart.config.type === 'pie') {
                if (!chart.options.seriesFlipped && chart.options.legendHeaders.length !== 0) {
                    chart.updateOptions(chart.options);//Updates options through PKQL; Defined in chart directive
                }
                else if (chart.options.seriesFlipped && chart.options.flippedLegendHeaders.length !== 0) {
                    chart.updateOptions(chart.options);
                }
                else if (chart.config.type === 'pie') {
                    chart.updateOptions(chart.options);
                }
            }

        });
}

/** generateVerticalLegend
 *
 *  @desc Creates and draws a vertical legend on the svg element
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


/** getToggledData
 *
 * @desc Gets the headers of the data to be drawn and filters the data based on that
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
 * @desc Gets an array of legend elements with true/false tags for if toggled
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

/** generateVerticalLegendElements
 *
 * @desc Creates the legend elements--rectangles and labels
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

/** generateLegendElements
 *
 * @desc Creates the legend elements--rectangles and labels
 * @params chart, legendData, drawFunc
 */
function generateLegendElements(chart, legendData, drawFunc) {
    var svg = chart.svg,
        container = chart.config.container,
        options = chart.options,
        legend,
        legendRow = 0,
        legendColumn = 0,
        legendDataLength = legendData.length;

    options.legendMax = 9;
    options.gridSize = 12;

    if (!options.legendIndex) {
        options.legendIndex = 0;
    }

    if (!options.legendIndexMax) {
        options.legendIndexMax = Math.floor(legendDataLength / options.legendMax - .01);
    }

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
            if (chart.config.type === "gantt" && chart.currentData.dataTable.CriticalPath) {
                //TODO get this outof here, see if you can pass something into uiOptions to do the same thing
                if (d === 'completed') {
                    return "green";
                }
                else if (d === 'active') {
                    return "#E5C100";
                }
                else if (d === 'projected') {
                    return "gray";
                }
                else if (d === 'slack') {
                    return "blue";
                }
                else if (d === 'delay') {
                    return "red";
                }
                else {
                    return "#FFFFFF";
                }
            }
            else {
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
 * @desc Returns a list of data headers that should be displayed in viz based off what is toggled on/off in legend
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
 * @desc Draws the horizontal legend carousel
 * @params chart, legendData, drawFunc
 */
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
        // .style("fill", "#c2c2d6")
        .style("fill", "#e7e7e7")
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
        // .style("fill", "#c2c2d6")
        .style("fill", "#e7e7e7")
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

/** createVerticalCarousel
 *
 * @desc Draws the vertical legend carousel
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
        // .style("fill", "#c2c2d6")
        // .style("fill", "#e7e7e7")
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
        // .style("fill", "#c2c2d6")
        // .style("fill", "#e7e7e7")
        .attr("transform", "translate(85," + ((options.legendMax * options.gridSize) + 50) + ")")
        .attr("points", "15,7.5, 0,0, 0,15")
        .on("click", function (d) {
            if (options.legendIndex < options.legendIndexMax) {
                options.legendIndex++;
            }
            svg.selectAll(".legend").remove();
            var legendElements = generateVerticalLegendElements(chart, legendData, drawFunc);
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
}

/************************************************ Gantt functions ******************************************************/

/** paintGanttChart
 *
 * @desc Initial painting function for a Gantt Chart
 */
jvCharts.prototype.paintGanttChart = function () {
    var chart = this;

    chart.options.color = chart.data.color;

    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(chart.currentData.legendData);
    chart.generateXAxis(chart.currentData.xAxisData);
    chart.generateYAxis(chart.currentData.yAxisData);
    chart.generateLegend(chart.currentData.legendData, 'generateGanttBars');
    chart.drawGridlines(chart.currentData.xAxisData);
    chart.generateGanttBars(chart.currentData);

};


/************************************************ Hard Code functions ****************************************************/
/** generateCriticalLegendElement
 *
 * @desc Ville is removing this entire function
 */
jvCharts.prototype.generateCriticalLegendElement = function () {
    var chart = this,
        container = chart.config.container,
        width = container.width,
        height = container.height;
    chart.svg.append('text')
        .attr("class", "critical-text")
        .text('\uf024')
        .attr('font-family', 'FontAwesome')
        .style("fill", "Red")
        .attr("transform", "translate(" + (0) + ", " + (height + 40) + ")");

    chart.svg.append("text")
        .attr("class", "critical-text")
        .text(" = Activities on the Critical Path")
        .attr("transform", "translate(" + (15) + ", " + (height + 40) + ")");

};

/************************************************ TreeMap functions ******************************************************/
/** paintTreeMapChart
 *
 * @desc Initial painting function for a Tree Map
 */
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


jvCharts.prototype.paintSankeyChart = function (){
    var chart = this;
    //chart.options.color = chart.data.color;
    //chart.currentData = chart.data;
    var data = chart.data.chartData;

    //generate SVG
    chart.generateSVG(null, null);
    chart.generateSankey(data);
}

jvCharts.prototype.paintChordChart = function (){
    var chart = this;
    //chart.options.color = chart.data.color;
    //chart.currentData = chart.data;
    var data = chart.data.chartData;

    //generate SVG
    chart.generateSVG(null, null);
    chart.generateChord(data);
}

/************************************************ Radial functions ******************************************************/
/** paintRadialChart
 *
 * @desc Initial painting function for a Radial Chart
 */
jvCharts.prototype.paintRadialChart = function () {
    var chart = this;

    chart.options.color = chart.data.color;
    chart.currentData = chart.data;

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

/************************************************ Bar functions ******************************************************/

/** paintBarChart
 *
 *  @desc The initial starting point for bar chart, begins the drawing process. Must already have the data stored in the chart object
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
    chart.formatXAxisLabels(dataObj.chartData.length);
    chart.generateBars(dataObj);
};

/** getBarDataFromOptions
 *
 *  @desc Assigns the correct chart data to current data using the chart.options
 */
jvCharts.prototype.getBarDataFromOptions = function () {
    var chart = this;
    //creating these two data variables to avoid having to reference the chart object everytime
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

    return dataObj;
};

/** generateBars
 *
 * @desc Does the actual painting of bars on the bar chart
 * @params barData
 */
jvCharts.prototype.generateBars = function (barData) {
    var chart = this,
        svg = chart.svg,
        options = chart.options,
        container = chart.config.container;

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

    //Add logic to filter data
    var dataHeaders = chart.options.seriesFlipped ? chart.options.flippedLegendHeaders ? chart.options.flippedLegendHeaders : barData.legendData : chart.options.legendHeaders ? chart.options.legendHeaders : barData.legendData;

    var barDataNew = getToggledData(barData, dataHeaders);

    generateBarGroups(bars, barDataNew, chart);
    var eventGroups = generateEventGroups(bars, barDataNew, chart);

    //Add event listeners
    eventGroups
        .on("mouseover", function (d, i, j) { // Transitions in D3 don't support the 'on' function They only exist on selections. So need to move that event listener above transition and after append
            if (chart.draw.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d, i);

                //Draw tip
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);

                svg.selectAll(".tip-line").remove();

                //Draw line through hovered over bar
                var mouseItem = d3.select(this);
                tipLineX = mouseItem.node().getBBox().x;
                tipLineWidth = mouseItem.node().getBBox().width;
                tipLineHeight = mouseItem.node().getBBox().height;
                tipLineY = mouseItem.node().getBBox().y;

                //Draw line in center of event-rect
                svg
                    .append("line")
                    .attr({
                        "class": "tip-line",
                        "x1": function () {
                            return options.rotateAxis ? 0 : tipLineX + tipLineWidth / 2;
                        },
                        "x2": function () {
                            return options.rotateAxis ? tipLineWidth : tipLineX + tipLineWidth / 2;
                        },
                        "y1": function () {
                            return options.rotateAxis ? tipLineY + tipLineHeight / 2 : 0;
                        },
                        "y2": function () {
                            return options.rotateAxis ? tipLineY + tipLineHeight / 2 : tipLineHeight;
                        },
                        "fill": "none",
                        "shape-rendering": "crispEdges",
                        "stroke": "black",
                        "stroke-width": "1px"
                    })
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
                svg.selectAll(".tip-line").remove();
            }
        })
        .on("zoom", function (d) {
        });

    chart.displayValues();
};

/** generateRadial
 *
 * @desc paints the radial bar chart on the chart
 * @params radialData
 */

jvCharts.prototype.generateRadial = function (radialData) {

    var chart = this,
        svg = chart.svg,
        colors = chart.options.color,
        container = chart.config.container,
        relationMap = chart.data.dataTable,
        legendData = chart.data.legendData,
        radial = null,
        radialData = radialData.chartData,
        chartName = chart.config.name,
        barHeight = container.height / 2 - 40,
        width = container.width,
        height = container.height,
        r = Math.min(height / 2, width / 3),
        data = [],
        allKeys = [chart.data.dataTable.label, chart.data.dataTable.value],
        radialDataNew,
        dataHeaders,
        legendElementToggleArray,
        radialDataFiltered;

    for (var i = 0; i < radialData.length; i++) {
        data[i] = {label: radialData[i][allKeys[0]], value: radialData[i][allKeys[1]]};
    }

    radialDataNew = JSON.parse(JSON.stringify(data));//copy of pie data

    if (!chart.options.legendHeaders) {
        chart.options.legendHeaders = legendData;
    }

    dataHeaders = chart.options.legendHeaders;
    legendElementToggleArray = getLegendElementToggleArray(dataHeaders, legendData);
    radialDataFiltered = [];

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
        if (radialDataNew[j].value !== -1) {
            radialDataFiltered.push(radialDataNew[j]);
        }
    }

    radialDataFiltered.sort(function (a, b) {
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

    var extent = d3.extent(radialDataFiltered, function (d) {
        return d.value;
    });
    var barScale = d3.scale.linear()
        .domain(extent)
        .range([0, barHeight]);

    var keys = radialDataFiltered.map(function (d, i) {
        return d.label;
    });
    var numBars = keys.length;

    var x = d3.scale.linear()
        .domain(extent)
        .range([0, -barHeight]);

    var xAxis = d3.svg.axis()
        .scale(x).orient("left")
        .ticks(3)
        .tickFormat(formatNumber);

    var circles = vis.selectAll("circle")
        .data(x.ticks(3))
        .enter().append("circle")
        .attr("r", function (d) {
            return barScale(d);
        })
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-dasharray", "2,2")
        .style("stroke-width", ".5px");

    var arc = d3.svg.arc()
        .startAngle(function (d, i) {
            return (i * 2 * Math.PI) / numBars;
        })
        .endAngle(function (d, i) {
            return ((i + 1) * 2 * Math.PI) / numBars;
        })
        .innerRadius(0);

    var segments = vis.selectAll("path")
        .data(radialDataFiltered)
        .enter().append("path")
        .each(function (d) {
            d.outerRadius = 0;
        })
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

    segments.transition().ease("elastic").duration(1000).delay(function (d, i) {
        return (25 - i) * 100;
    })
        .attrTween("d", function (d, index) {
            var i = d3.interpolate(d.outerRadius, barScale(+d.value));
            return function (t) {
                d.outerRadius = i(t);
                return arc(d, index);
            };
        });

    vis.append("circle")
        .attr("r", barHeight)
        .classed("outer", true)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", "1.5px");

    var lines = vis.selectAll("line")
        .data(keys)
        .enter().append("line")
        .attr("y2", -barHeight - 20)
        .style("stroke", "black")
        .style("stroke-width", ".5px")
        .attr("transform", function (d, i) {
            return "rotate(" + (i * 360 / numBars) + ")";
        });

    vis.append("g")
        .attr("class", "x axis")
        .call(xAxis);

    // Labels
    var labelRadius = barHeight * 1.025;

    var labels = vis.append("g")
        .classed("labels", true);

    labels.append("def")
        .append("path")
        .attr("id", "label-path")
        .attr("d", "m0 " + -labelRadius + " a" + labelRadius + " " + labelRadius + " 0 1,1 -0.01 0");

    labels.selectAll("text")
        .data(keys)
        .enter().append("text")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("fill", function (d, i) {
            return "#3e3e3e";
        })
        .append("textPath")
        .attr("xlink:href", "#label-path")
        .attr("startOffset", function (d, i) {
            return i * 100 / numBars + 50 / numBars + '%';
        })
        .text(function (d) {
            return d.toUpperCase();
        });
};

/** generateTreeMap
 *
 * @desc paints the treemap on the chart
 * @params treeMapData
 */
jvCharts.prototype.generateTreeMap = function (treeMapData) {

    var chart = this,
        svg = chart.svg,
        colors = treeMapData.color,
        container = chart.config.container,
        relationMap = chart.data.dataTable,
        treemap = null;

    chart.children = chart.data.chartData;

    treemap = d3.layout.treemap()
        .size([container.width, container.height])
        .sticky(false)
        .value(function (d) {
            return d[relationMap.size]
        });

    svg.append("g").attr("class", "treemap");

    var node = svg.select(".treemap")
        .datum(chart)
        .selectAll("g")
        .data(treemap.nodes)
        .enter().append('g')
        .attr('transform', function (d) {
            return 'translate(0,0)';
        });

    node.append('rect')
        .call(position)
        .attr("fill", function (d, i) {
            return getColors(colors, i, d[relationMap.series]);
        })
        .attr("fill-opacity", .8)
        .attr("stroke", "#FFFFFF")
        .attr("stroke-width", "1")
        .on("mouseover", function (d, i) {
            //Get tip data
            var tipData = chart.setTipData(d, i);
            //Draw tip
            chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);

            var rect = d3.select(this);
            rect.attr("fill", '#BBB');
            rect.transition().duration(200);
        })
        .on("mouseout", function (d) {
            chart.tip.hideTip();
            var rect = d3.select(this);
            rect.attr("fill", function (d, i) {
                return getColors(colors, i, d[relationMap.series]);
            });
            rect.transition().duration(200);
        });

    node.append('text')
        .call(position)
        .attr("transform", "translate(3, 13)")
        .text(function (d) {
            if (d.dy !== 0) {
                return d.children ? null : d[relationMap.label];
            }
        })
        .on("mouseover", function (d, i) {
            var tipData = chart.setTipData(d, i);
            //Draw tip
            chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
        })
        .on("mouseout", function (d) {
            chart.tip.hideTip();
        });


    /* Don't display text if text is wider than rect */
    var temp = svg.select(".treemap").selectAll("g").selectAll("text");
    temp.attr("style", function (d) {
        if (this.getBBox().width >= (d.dx - 2)) {
            return "display:none";
        }
        if (this.getBBox().height >= (d.dy - 2)) {
            return "display:none";
        }
    });
    function position() {
        this
            .attr("x", function (d) {
                return d.x - 0.1 + "px";
            })
            .attr("y", function (d) {
                return d.y - 0.1 + "px";
            })
            .attr("width", function (d) {
                return d.dx + "px";
            })
            .attr("height", function (d) {
                return d.dy + "px";
            });
    }
};

/**
 * Generates a sankey chart with the given data
 * @param sankeyData
 */
jvCharts.prototype.generateSankey = function (sankeyData){
    var chart = this,
        svg = chart.svg,
        color= chart.options.color;

    var width = chart.config.container.width;
    var height = chart.config.container.height;

    var formatNumber = d3.format(",.0f"),    // zero decimal places
        format = function(d) { return formatNumber(d) + " " + "Widgets"; },
        color = d3.scale.category20();

    //var nodeMap = {};
    //for (var i = 0; i < sankeyData.nodes.length; i++) {
    //    sankeyData.nodes[i].node = i;
    //    nodeMap[sankeyData.nodes[i].name] = i;
    //}
    //sankeyData.links = sankeyData.links.map(function(x){
    //    return {
    //        source: nodeMap[x.source],
    //        target: nodeMap[x.target],
    //        value: x.value
    //    };
    //});

    var sankey = d3.sankey()
        .nodeWidth(10)
        .nodePadding(15)
        .size([width, height]);

    var path = sankey.link();

    //Adding zoom behavior to sankey
    d3.select(".editable-svg").call(d3.behavior.zoom()
        .scaleExtent([.1, 10])
        .on("zoom", zoom));

    sankey
        .nodes(sankeyData.nodes)
        .links(sankeyData.links)
        .layout(32);

    var link = svg.append("g").selectAll(".sankey-link")
        .data(sankeyData.links)
        .enter()
        .append("path")
        .attr("class", "sankey-link")
        .attr("d", path)
        .style("stroke-width", function(d){
            return Math.max(1, d.dy);
        })
        .sort(function(a, b){
            return b.dy - a.dy;
        })
        .on("mouseover", function(d, i){
            if(chart.draw.showToolTip){
                var tipData = chart.setTipData(d, i);
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on("mousemove", function(d, i){
            if(chart.draw.showToolTip){
                chart.tip.hideTip();
                var tipData = chart.setTipData(d, i);
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on("mouseout", function(d, i){
            if(chart.draw.showToolTip){
                chart.tip.hideTip();
            }
        });

    var node = svg.append("g").selectAll(".node")
        .data(sankeyData.nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d){
            return "translate(" + d.x + ", " + d.y + ")";
        })
        .call(d3.behavior.drag()
            .origin(function(d){
                return d;
            })
            .on("dragstart", function(d){
                d3.event.sourceEvent.stopPropagation();
                this.parentNode.appendChild(this);
            })
            .on("drag", dragmove));

    node.append("rect")
        .attr("height", function(d){
            return Math.max(d.dy, 0);
        })
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d){
            return d.color = color(d.name);
        })
        .style("stroke", function(d){
            return d3.rgb(d.color).darker(2);
        });

    node.append("text")
        .attr("x", -6)
        .attr("y", function(d){
            return d.dy / 2;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function(d){
            return d.name;
        })
        .filter(function(d){
            return d.x < width / 2;
        })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");

    function dragmove(d){
        d3.select(this).attr("transform",
            "translate(" + (
                d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))
            ) + "," + (
                d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
            ) + ")");
        sankey.relayout();
        link.attr("d", path);
    }

    function zoom() {
        svg.attr("transform", "translate("
            + d3.event.translate
            + ")scale(" + d3.event.scale + ")");
    }

}


/** generateGanttBars
 *
 * @desc paints the gantt bars on the chart
 * @params ganttData
 */
jvCharts.prototype.generateGanttBars = function (ganttData) {
    var chart = this,
        svg = chart.svg,
        colors = ganttData.color,
        options = chart.options,
        container = chart.config.container,
        yAxisData = ganttData.yAxisData;

    //Remove existing bars from page
    svg.selectAll("g.bar-container").remove();
    var bars = svg.append("g")
            .attr("class", "bar-container"),
        dataHeaders = chart.options.legendHeaders ? chart.options.legendHeaders : ganttData.legendData,
        ganttDataNew = getToggledData(ganttData, dataHeaders),
        x = getXScale(ganttData.xAxisData, container, null, null),
        y = getYScale(ganttData.yAxisData, container, null, null),
        sampleData = ganttDataNew;

    options.rotateAxis = true;

    //Create num bars variable and loop through to draw bars based on how many groups there are
    //var keys = Object.keys(ganttData.dataTable);
    //var count = 0;
    //for (var i = 0; i < keys.length; i++) {
    //    if (ganttData.dataTable[keys[i]] != null && ganttData.dataTable[keys[i]] != "") {
    //        count++;
    //    }
    //}
    //var numBars = Math.floor((count - 1) / 2);
    var numBars = 2//WILL ALWAYS BE 2 FOR STATUS DASHBOARD ganttData.legendData.length;
    var ganttBars = [];

    //create array of start dates and end dates to iterate through
    var startDates = [];
    var endDates = [];
    for (var i = 1; i <= numBars; i++) {
        startDates.push(chart.currentData.dataTable["start_" + i]);
        endDates.push(chart.currentData.dataTable["end_" + i]);
    }

    for (var ii = 0; ii < numBars; ii++) {
        ganttBars[ii] = bars.selectAll(".gantt-bar" + ii)
            .data(sampleData)
            .enter()
            .append("rect")
            .attr("class", "gantt-bar" + ii)
            .attr("width", function (d, i) {
                return 0;
            })
            .attr("height", function (d, i) {
                return y.rangeBand() / numBars;
            })
            .attr("x", function (d, i) {
                if (d[startDates[ii]]) {
                    return x(new Date(d[startDates[ii]]));
                }
                else {
                    return 0;
                }
            })
            .attr("y", function (d, i) {
                return y(d[yAxisData.label]) + (y.rangeBand() / numBars * ii);
            })
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("fill", function (d, i, j) {
                var typeVal = chart.currentData.dataTable["Type" + (ii + 1)];
                if (chart.options.legendHeaders) {
                    var color = getColors(colors, 0, d[typeVal]);
                }
                else {
                    var color = getColors(colors, 0, d[typeVal]);
                }
                return color;
            });


        ganttBars[ii].transition()
            .duration(400)
            .delay(100)
            .attr("width", function (d, i) {
                var width = x(new Date(d[endDates[ii]])) - x(new Date(d[startDates[ii]]));//(x(d.StartDate) - x(d.EndDate));
                if (width >= 0) {
                    return width;
                }
                else {
                    return 0;
                }
            });
    }

    var dataToPlot = getPlotData(ganttDataNew, chart);
    var eventGroups = bars.selectAll(".event-rect")
        .data(dataToPlot)
        .enter()
        .append('rect')
        .attr("class", "event-rect")
        .attr("x", 0)
        .attr("y", function (d, i) {
            return container.height / ganttDataNew.length * i;
        })
        .attr("width", container.width)
        .attr("height", function (d, i) {
            return container.height / ganttDataNew.length;
        })
        .attr("fill", "transparent")
        .attr("transform", "translate(0,0)");
    eventGroups
        .on("mouseover", function (d, i, j) { // Transitions in D3 don't support the 'on' function They only exist on selections. So need to move that event listener above transition and after append
            if (chart.draw.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d, i);
                //Draw tip
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
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
            }
        });

    var currentDate = new Date();
    var dateData = [currentDate];
    //Draws a line representing the current date
    svg.selectAll(".currentDateLine")
        .data(dateData)
        .enter()
        .append("line")
        .attr({
            "x1": function (d, i) {
                return x(d);
            },
            "x2": function (d, i) {
                return x(d);
            },
            "y1": function (d, i) {
                return "0px";
            },
            "y2": function (d, i) {
                return chart.config.container.height;
            },
            "class": "currentDateLine",
            "stroke": "black",
            "stroke-width": "2px"
        })
        .style("stroke-dasharray", ("3,3"));

    svg.selectAll(".currentDateLabel")
        .data(dateData)
        .enter()
        .append("text")
        .text(function () {
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1; //January is 0!

            var yyyy = today.getFullYear();
            if (dd < 10) {
                dd = '0' + dd
            }
            if (mm < 10) {
                mm = '0' + mm
            }
            var today = mm + '/' + dd + '/' + yyyy;
            return today;
        })
        .attr({
            "x": function (d) {
                return x(d);
            },
            "y": "-10px",
            "text-anchor": "middle"
        });
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
        colors = options.color,
        zoomEvent = chart.config.zoomEvent,
        translateX = 0,
        translateY = 0,
        zoomScale,
        posCalc = getPosCalculations(barData, options, xAxisData, yAxisData, container, zoomEvent, chart),
    //Gets the data used in the plot
        dataToPlot = getPlotData(barData, chart);

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

    var barGroups = chartContainer
        .data(dataToPlot)
        .enter()
        .append("g")
        .attr("class", "bar-group")
        .selectAll("rect")
        .data(function (d, i, j) {
            return d;
        }) //lines
        .enter()
        .append("rect")
        .attr("class", function (d, i, j) {
            return 'editable editable-bar bar-col-' + String(barData[j][chart.currentData.dataTable.label]).replace(/\s/g, '_') + '-index-' + String(chart.currentData.legendData[i]).replace(/\s/g, '_') + ' highlight-class-' + String(barData[j][chart.currentData.dataTable.label]).replace(/\s/g, '_');
        })
        .attr('x', function (d, i, j) { // sets the x position of the bar)
            return posCalc.getx(d, i, j);
        })
        .attr('y', function (d, i, j) { // sets the y position of the bar
            return posCalc.gety(d, i, j);
        })
        .attr('width', function (d, i, j) {
            return posCalc.getwidth(d, i, j);
        }) // sets the width of bar
        .attr('height', function (d, i, j) {      // sets the height of bar
            var height = posCalc.getheight(d, i, j);
            if(height == null){
                return 0;
            }
            else{
                return height;
            }
        })
        .attr("rx", 3)//Change to round corners
        .attr("ry", 3)//^^
        .attr("transform", "translate(" + translateX + "," + translateY + ")")//Translate Bars based on zoom
        .attr("opacity", 0.9)
        .attr('fill', function (d, i, j) {
            var color;
            if (chart.options.seriesFlipped) {
                if (chart.options.flippedLegendHeaders) {
                    color = getColors(colors, i, chart.options.flippedLegendHeaders[i]);
                }
                else {
                    color = getColors(colors, i, chart.currentData.legendData[i]);
                }
            }
            else {
                if (chart.options.legendHeaders) {
                    color = getColors(colors, i, chart.options.legendHeaders[i]);
                }
                else {
                    color = getColors(colors, i, chart.currentData.legendData[i]);
                }
            }
            return color;
        });

    //transition to show the bars 'growing' into their position
    barGroups.transition()
        .duration(function () {
            if (zoomEvent) {
                return 0;
            }
            return 400;
        })
        .delay(function () {
            if (zoomEvent) {
                return 0;
            }
            return 100;
        })
        .attr('x', function (d, i, j) { // sets the y position of the bar
            return posCalc.transitionx(d, i, j);
        })
        .attr('y', function (d, i, j) { // sets the y position of the bar
            return posCalc.transitiony(d, i, j);
        })
        .attr('width', function (d, i, j) {      // sets the height of bar
            return posCalc.transitionwidth(d, i, j);
        })
        .attr('height', function (d, i, j) {      // sets the height of bar
            var height = posCalc.transitionheight(d, i, j);
            if(height == null){
                return 0;
            }
            else{
                return height;
            }
        });

    return barGroups;//returns the bar containers
}

/** generateEventGroups
 *
 * @desc TODO Might want to remove this
 * @params chartContainer, barData, chart
 */
function generateEventGroups(chartContainer, barData, chart) {
    var container = chart.config.container,
        options = chart.options,
        zoomEvent = chart.config.zoomEvent,
        translateX = 0,
        translateY = 0,
        zoomScale;

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

    //Invisible rectangles on screen that represent bar groups. Used to show/hide tool tips on hover
    return chartContainer
        .data(dataToPlot)
        .enter()
        .append('rect')
        .attr("class", 'event-rect')
        .attr('x', function (d, i) { // sets the x position of the bar)
            return (options.rotateAxis ? 0 : (container.width / barData.length * i) * zoomScale);
        })
        .attr('y', function (d, i) { // sets the y position of the bar
            return options.rotateAxis ? (container.height / barData.length * i) * zoomScale : 0;
        })
        .attr('width', function (d, i) { // sets the x position of the bar)
            return (options.rotateAxis ? container.width : (container.width / barData.length) * zoomScale);
        })
        .attr('height', function (d, i) { // sets the y position of the bar
            return options.rotateAxis ? (container.height / barData.length) * zoomScale : container.height;
        })
        .attr('fill', 'transparent')
        .attr("class", function (d, i, j) {
            return 'event-rect editable-bar bar-col-' + String(barData[i][chart.currentData.dataTable.label]).replace(/\s/g, '_');
        })
        //.attr("stroke", "#e6e6e6")
        .attr("transform", "translate(" + translateX + "," + translateY + ")");

}

/** getPlotData
 *
 * @desc Returns only data values to be plotted; input is the data object
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

/************************************************ Line functions ******************************************************/
/** paintLineChart
 *
 * @desc The initial starting point for line chart, begins the drawing process. Must already have the data stored in the chartobject
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
    chart.generateLine(dataObj);
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

    var translateX = 0,
        translateY = 0,
        zoomScale = 1,
        tipLineX = 0,
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

    svg.selectAll("g.line-container").remove();
    var lines = svg.append("g")
        .attr("class", "line-container")
        .selectAll("g");

    var dataHeaders = chart.options.seriesFlipped ? chart.options.flippedLegendHeaders ? chart.options.flippedLegendHeaders : lineData.legendData : chart.options.legendHeaders ? chart.options.legendHeaders : lineData.legendData;

    var lineDataNew = getToggledData(lineData, dataHeaders);

    generateLineGroups(lineDataNew, chart);
    var eventGroups = generateEventGroups(lines, lineDataNew, chart);


    eventGroups
        .on("mouseover", function (d, i, j) { // Transitions in D3 don't support the 'on' function They only exist on selections. So need to move that event listener above transition and after append
            if (chart.draw.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d, i);

                //Draw tip
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
                    .attr({
                        "class": "tip-line",
                        "x1": function () {
                            return options.rotateAxis ? 0 : tipLineX + tipLineWidth / 2;
                        },
                        "x2": function () {
                            return options.rotateAxis ? tipLineWidth : tipLineX + tipLineWidth / 2;
                        },
                        "y1": function () {
                            return options.rotateAxis ? tipLineY + tipLineHeight / 2 : 0;
                        },
                        "y2": function () {
                            return options.rotateAxis ? tipLineY + tipLineHeight / 2 : tipLineHeight;
                        },
                        "fill": "none",
                        "shape-rendering": "crispEdges",
                        "stroke": "black",
                        "stroke-width": "1px"
                    })
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
                svg.selectAll(".tip-line").remove();
            }
        });

    chart.displayValues();

    return lines;
};

/** generateLineGroups
 *
 * @desc Paints the groups of the lines
 * @params lineData, chart
 */
function generateLineGroups(lineData, chart) {
    var container = chart.config.container,
        options = chart.options,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        legendData = chart.currentData.legendData,
        colors = options.color,
        lines,
    //Get Position Calculations
        x = getXScale(xAxisData, container, 'no-padding', null),
        y = getYScale(yAxisData, container, 'no-padding', null),
        xTranslate,
        yTranslate,
        data = {},
        valueline = {},
        circles = {};

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
    for (var k in data) {
        //Create path generator for each series
        if (data.hasOwnProperty(k)) {
            valueline[k] = d3.svg.line()//line drawing function
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


            if (data[k].length === 1) {
                //Add circles at joints in the lines
                circles[k] = lines
                    .append('g')
                    .attr('class', 'circle ' + (k))
                    .selectAll('circle' + k)
                    .data(data[k])
                    .enter()
                    .append("circle")//Circles for the joints in the line
                    .attr('class', function (d, i) {
                        var dataPoint = chart.currentData.chartData[i],
                            label = chart.currentData.dataTable.label;
                        if (dataPoint && label && dataPoint.hasOwnProperty(label)) {
                            return 'circle-' + dataPoint[label].replace(/\s/g, '_') + ' highlight-class-' + dataPoint[label].replace(/\s/g, '_');
                        }
                        return 'circle-' + i + ' highlight-class-' + i;
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
    }

    //Return line groups
    return lines.selectAll(".circle");
}


/************************************************ Pie functions ******************************************************/
/** drawPie
 *
 * @desc Paints the pie chart
 */
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
};

/** generatePie
 *
 * @desc creates and draws a pie chart on the svg element
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
        chartName = chart.config.name,
        keys = [chart.data.dataTable.label, chart.data.dataTable['value']],
        colors = options.color,
        w = container.width,
        h = container.height,
        r = Math.min(h / 2, w / 3),
        data = [],
        total = 0;

    if(!keys[1]) {
        keys[1] = chart.data.dataTable['value 1']
    }

    svg.select('g.pie-container').remove();

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

    var offset = (container.height / 4);

    var vis = svg
        .append("g")
        .data([pieDataNew])
        .attr("class", "pie-container")
        .attr("height", 200)
        .attr("transform", "translate(" + (w / 2) + "," + r + ")");

    var pie = d3.layout.pie().value(function (d) {
        return d.value;
    });

    // declare an arc generator function
    var arc = d3.svg.arc()
        .innerRadius(0)//Normal pie chart when this = 0, can be changed to create donut chart
        .outerRadius(r);

    var arcOver = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(r + 15);

    // select paths, use arc generator to draw
    var arcs = vis
        .selectAll("g.slice")
        .data(pie)
        .enter().append("g").attr("class", "slice");
    console.log(pieData);
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
                var tipData = chart.setTipData(d, i);
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
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
                var tipData = chart.setTipData(d, i);
                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on("mouseout", function (d) {
            if (chart.draw.showToolTip) {
                chart.tip.hideTip();
            }
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
/** drawScatter
 *
 * @desc creates and draws a scatter chart on the svg element
 */
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
    chart.generateXAxis(chart.currentData.xAxisData);
    chart.generateYAxis(chart.currentData.yAxisData);
    chart.generateLegend(chart.currentData.legendData, 'generateScatter');
    chart.generateScatter();
    chart.createLineGuide();
    chart.formatXAxisLabels(chart.currentData.xAxisScale.ticks().length);
};

/** generateScatter
 *
 * @desc creates and draws a scatter plot on the svg element
 */
jvCharts.prototype.generateScatter = function () {
    var chart = this,
        svg = chart.svg,
        options = chart.options,
        container = chart.config.container,
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

    svg.selectAll("g.scatter-container").remove();
    svg.selectAll("g.scatter-container.editable-scatter").remove();

    var colors = options.color,
        scatterDataNew = JSON.parse(JSON.stringify(scatterData)),//copy of pie data
        translateY = 0,
        translateX = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[0], //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

    translateX = Math.min(0, translateX);
    translateX = Math.min(0, Math.max(translateX, container.width - (container.width * zoomScale)));


    if (!chart.options.legendHeaders) {
        chart.options.legendHeaders = legendData;
    }

    var dataHeaders = chart.options.legendHeaders;
    var legendElementToggleArray = getLegendElementToggleArray(dataHeaders, legendData);
    var scatterDataFiltered = [];

    if (legendElementToggleArray) {
        for (var j = 0; j < scatterDataNew.length; j++) {
            for (var i = 0; i < legendElementToggleArray.length; i++) {
                if (typeof scatterDataNew[j][dataTable.label] === 'undefined' || scatterDataNew[j][dataTable.label] === "") {
                    if (legendElementToggleArray[i].toggle === false) {
                        scatterDataNew[j][dataTable.x] = -1;
                        scatterDataNew[j][dataTable.y] = -1;
                        scatterDataNew[j][dataTable.z] = -1;
                    }
                } else {
                    if (legendElementToggleArray[i].element === scatterDataNew[j][dataTable.series] && legendElementToggleArray[i].toggle === false) {
                        scatterDataNew[j][dataTable.x] = -1;
                        scatterDataNew[j][dataTable.y] = -1;
                        scatterDataNew[j][dataTable.z] = -1;
                    }
                }
            }
        }
    }

    for (var j = 0; j < scatterDataNew.length; j++) {
        if (scatterDataNew[j][dataTable.x] !== -1 && scatterDataNew[j][dataTable.y] !== -1) {
            scatterDataFiltered.push(scatterDataNew[j]);
        }
    }

    var x = getXScale(xAxisData, container, 'no-padding', zoomEvent, options.xReversed);
    var y = getYScale(yAxisData, container, 'no-padding', zoomEvent, options.yReversed);
    if (!_.isEmpty(zAxisData)) {
        var z = getZScale(zAxisData, options, zoomEvent);
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

    scatters
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
                if (options.toggleZ && !_.isEmpty(zAxisData) && scatterDataFiltered[i][dataTable.z]) {
                    return z(scatterDataFiltered[i][dataTable.z]);
                }
            }
            return options.NODE_MIN_SIZE;
        })
        .on("mouseover", function (d, i, j) {
            if (chart.draw.showToolTip) {
                var tipData = chart.setTipData(d, i);
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on("mousemove", function (d, i) {
            if (chart.draw.showToolTip) {
                chart.tip.hideTip();
                var tipData = chart.setTipData(d, i);
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on("mouseout", function (d, i) {
            if (chart.draw.showToolTip) {
                chart.tip.hideTip();
                svg.selectAll(".tip-line").remove();
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

/** toggleLineGuide
 *
 * @desc Toggles the line guide on and off
 */
jvCharts.prototype.toggleLineGuide = function () {
    var chart = this,
        svg = chart.svg,
        options = chart.options;

    var lineSelectX = svg.select(".lineguide.x").select("line");
    var lineSelectY = svg.select(".lineguide.y").select("line");

    if (options.lineGuide) {
        lineSelectX.transition().style("opacity", 1);
        lineSelectY.transition().style("opacity", 1);
    } else {
        lineSelectX.transition().style("opacity", 0);
        lineSelectY.transition().style("opacity", 0);
    }
};

/** displayValues
 *
 * @desc toggles data values that are displayed on the specific type of chart on the svg
 */
jvCharts.prototype.displayValues = function () {
    var chart = this,
        svg = chart.svg,
        options = chart.options,
        container = chart.config.container,
        chartData = chart.data.chartData,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        zoomEvent = chart.config.zoomEvent,
        legendOptions = chart.options.legendOptions,
        translateX = 0,
        translateY = 0;

    //If series is flipped, use flipped data; initialize with the full data set
    if (options.seriesFlipped) {
        chartData = chart.flippedData.chartData;
        legendOptions = chart.options.flippedLegendOptions;
    }

    if (options.displayValues === true) {
        svg.selectAll(".displayValueContainer").remove();

        var zoomScale = 1;

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
        var chartDataNew = JSON.parse(JSON.stringify(chartData));//Copy of chartData

        if (legendOptions) {//Checking which legend elements are toggled on resize
            for (var j = 0; j < chartDataNew.length; j++) {
                for (var i = 0; i < legendOptions.length; i++) {
                    if (legendOptions[i].toggle === false) {
                        delete chartDataNew[j][legendOptions[i].element];
                    }
                }
            }
        }

        for (var i = 0; i < chartDataNew.length; i++) {//chartDataNew used
            var val = values(chartDataNew[i], chart.currentData.dataTable, chart.config.type);
            data.push(val.slice(0, chartDataNew[i].length));
        }

        var posCalc = getPosCalculations(chartDataNew, options, xAxisData, yAxisData, container, zoomEvent, chart);

        if (options.rotateAxis) {
            svg.append("g")
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
                .text(function (d, i, j) {
                    return d;
                })
                .attr("transform", "translate(" + 0 + "," + translateY + ")")
                .transition()
                .duration(function () {
                    if (zoomEvent) {
                        return 0;
                    }
                    return 750;
                });
        }
        else {
            svg.append("g")
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
                .text(function (d, i, j) {
                    return d;
                })
                .attr("transform", "translate(" + translateX + ",0)")
                .transition()
                .duration(function () {
                    if (zoomEvent) {
                        return 0;
                    }
                    return 750;
                });
        }
    }
    else {
        svg.selectAll(".displayValueContainer").remove();
    }
};


/** highlightItems
 *
 * @desc highlights items on the svg element
 * @params items, tag, highlightIndex, highlightUri
 */
jvCharts.prototype.highlightItem = function (items, tag, highlightIndex, highlightUri) {
    var chart = this,
        svg = chart.svg;

    if (highlightIndex >= 0) {
        if (chart.config.type === 'pie') {
            //set all circles stroke width to 0
            svg.select('.pie-container').selectAll(tag).attr({'stroke': '#FFFFFF', "stroke-width": 1});
            //highlight necessary pie slices
            svg.select('.pie-container').selectAll(tag).filter('.highlight-class-' + highlightIndex).attr({
                "stroke": "black",
                "stroke-width": 2.0
            });
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
    } else if (highlightUri) {
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

/** getPosCalculations
 * @desc Holds the logic for positioning all bars on a bar chart (depends on toolData)
 *
 * @params chartData, options, xAxisData, yAxisData, container, zoomEvent, chart
 * @returns {{}}
 */
function getPosCalculations(chartData, options, xAxisData, yAxisData, container, zoomEvent, chart) {
    var x,
        y,
        scaleFactor = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale,//if there is a zoom event
        data = [],
        size = Object.keys(chart.currentData.dataTable).length - 1,
        positionFunctions = {};


    x = getXScale(xAxisData, container, zoomEvent);
    y = getYScale(yAxisData, container, zoomEvent);

    for (var i = 0; i < chartData.length; i++) {
        var val = [];
        for (var key in chartData[i]) {
            if (chartData[i].hasOwnProperty(key)) {
                val.push(chartData[i][key]);
            }
        }
        data.push(val.slice(1, chartData[i].length));
    }

    if (options.rotateAxis === true && options.stackToggle === true) {
        // scenario 1
        positionFunctions.getx = function (d, i, j) {
            return 0;
        };
        positionFunctions.gety = function (d, i, j) {
            return y(chartData[j][yAxisData.label]);
        };
        positionFunctions.getwidth = function (d, i, j) {
            return 0;
        };
        positionFunctions.getheight = function (d, i, j) {
            return y.rangeBand() * 0.95;
        };
        positionFunctions.transitionx = function (d, i, j) {
            var increment = 0;
            for (var k = i; k > 0; k--) {
                var dataLabel = 'value ' + k;
                var val = chartData[j][chart.currentData.dataTable[dataLabel]];
                if (!isNaN(val)) {
                    increment += parseFloat(val);

                }
            }
            return x(increment);
        };
        positionFunctions.transitiony = function (d, i, j) {
            return y(chartData[j][yAxisData.label]);
        };
        positionFunctions.transitionwidth = function (d, i, j) {
            return x(d);
        };
        positionFunctions.transitionheight = function (d, i, j) {
            return y.rangeBand() * 0.95;
        };
    }
    else if (options.rotateAxis === true && options.stackToggle === false) {
        //scenario 2
        positionFunctions.getx = function (d, i, j) {
            return 0;
        };
        positionFunctions.gety = function (d, i, j) {
            return (y(chartData[j][yAxisData.label]) + y.rangeBand() / size * i) * scaleFactor;
        };
        positionFunctions.getwidth = function (d, i, j) {
            return 0;
        };
        positionFunctions.getheight = function (d, i, j) {
            return (y.rangeBand() / size * 0.95) * scaleFactor;
        };
        positionFunctions.transitionx = function (d, i, j) {
            return 0;
        };
        positionFunctions.transitiony = function (d, i, j) {
            return (y(chartData[j][yAxisData.label]) + y.rangeBand() / size * i) * scaleFactor;
        };
        positionFunctions.transitionwidth = function (d, i, j) {
            return x(d);
        };
        positionFunctions.transitionheight = function (d, i, j) {
            return (y.rangeBand() / size * 0.95) * scaleFactor;
        };
    }
    else if (options.rotateAxis === false && options.stackToggle === true) {
        //scenario 3
        positionFunctions.getx = function (d, i, j) {
            return (x(chartData[j][xAxisData.label])) * scaleFactor;
        };
        positionFunctions.gety = function (d, i, j) {
            return container.height;
        };
        positionFunctions.getwidth = function (d, i, j) {
            return (x.rangeBand() * 0.95) * scaleFactor;
        };
        positionFunctions.getheight = function (d, i, j) {
            return 0;
        };
        positionFunctions.transitionx = function (d, i, j) {
            return (x(chartData[j][xAxisData.label])) * scaleFactor;
        };
        positionFunctions.transitiony = function (d, i, j) {
            var increment = 0;
            for (var k = i; k > 0; k--) {
                var dataLabel = 'value ' + k;
                var val = chartData[j][chart.currentData.dataTable[dataLabel]];
                if (!isNaN(val)) {
                    increment += parseFloat(val);

                }
            }
            return y(parseFloat(d) + increment);
        };
        positionFunctions.transitionwidth = function (d, i, j) {
            return (x.rangeBand() * 0.95) * scaleFactor;
        };
        positionFunctions.transitionheight = function (d, i, j) {
            return container.height - y(d);
        };
    }
    else if (options.rotateAxis === false && options.stackToggle === false) {
        //scenario 4
        positionFunctions.getx = function (d, i, j) {
            if(chart.config.type === "line"){
                return (x(chartData[j][xAxisData.label]));//+ container.width / (xAxisData.values.length) / 2);
            }
            else{
                return (x(chartData[j][xAxisData.label]) + x.rangeBand() / size * i) * scaleFactor;
            }
        };
        positionFunctions.gety = function (d, i, j) {
            return y(0);
        };
        positionFunctions.getwidth = function (d, i, j) {
            return (x.rangeBand() / size * 0.95) * scaleFactor;
        };
        positionFunctions.getheight = function (d, i, j) {
            return 0;
        };
        positionFunctions.transitionx = function (d, i, j) {
            return (x(chartData[j][xAxisData.label]) + x.rangeBand() / size * i) * scaleFactor;
        };
        positionFunctions.transitiony = function (d, i, j) {
            return y(0) - y(d) > 0 ? y(d) : y(0);
        };
        positionFunctions.transitionwidth = function (d, i, j) {
            return (x.rangeBand() / size * 0.95) * scaleFactor;
        };
        positionFunctions.transitionheight = function (d, i, j) {
            return Math.abs(y(0) - y(d));
        };
    }
    return positionFunctions;
}


/*************************** Color Functions ******************************************************************/
/** getColors
 *
 * @desc gets the colors to apply to the specific chart
 * @params colorObj, index, label
 * @returns {{}}
 */
function getColors(colorObj, index, label) {
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

/** getColors
 *
 * @desc gets the colors to apply to the specific chart
 * @params colorObj, index, label
 * @returns {{}}
 */
jvCharts.prototype.colorBackground = function (color) {
    var chart = this,
        chartDiv = chart.chartDiv;
    chart.options.backgroundColor = color;
    chartDiv.style('background-color', '' + color);
};

/********************************************* Utility Functions **************************************************/

/** calculateMean
 *
 * @desc calculates the mean value for a set of data
 * @params data, type
 * @returns mean
 */
function calculateMean(data, type) {
    return d3.mean(data, function (value) {
        return +value[type];
    });
}

/** getFormatExpression
 *
 * @desc returns the d3 format expression for a given option
 * @params option
 * @returns string expression
 */
function getFormatExpression(option) {
    var expression = '';
    if (option === "currency") {
        expression = d3.format("$,");
    }
    if (option === "percent") {
        expression = d3.format("%,");
    }
    if (option === 'default' || expression === '') {
        expression = d3.format(",.0f");
    }
    return expression;
}

/** values
 *
 * @desc returns the values for a given set of data
 * @params object, dataTableAlign, type
 * @returns [] of values
 */
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


/** getXScale
 *
 * @desc get the scale for the x axis
 * @params xAxisData, container, padding, zoomEvent
 * @returns {{}}
 */
function getXScale(xAxisData, container, padding, zoomEvent, xReversed) {
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
            xAxisData.values[i] = new Date(xAxisData.values[i]);
        }

        var maxDate = Math.max.apply(null, xAxisData.values);
        var minDate = Math.min.apply(null, xAxisData.values);

        xAxisScale = d3.time.scale().domain([new Date(minDate), new Date(maxDate)]).rangeRound([0, container.width]);
    }
    else if (xAxisData.textOrNum === 'text' || xAxisData.values.length > 2) {
        xAxisScale = d3.scale.ordinal().domain(xAxisData.values).rangePoints([0, container.width])
            .rangeBands([0, container.width * x], leftPadding, rightPadding);
    }
    else if (xAxisData.textOrNum === 'num') {
        //Reverse the xAxis, if reversed
        var max = xAxisData.values[(xAxisData.values.length - 1)];
        var min = xAxisData.values[0];
        if (xReversed) {
            xAxisScale = d3.scale.linear().domain([min, max]).rangeRound([container.width, 0]);
        }
        else {
            xAxisScale = d3.scale.linear().domain([min, max]).rangeRound([0, container.width]);
        }
    }
    return xAxisScale;
}

/** getYScale
 *
 * @desc gets the scale for the y axis
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
        if (yReversed) {
            yAxisScale = d3.scale.linear().domain([max, min]).rangeRound([container.height, 0]);
        }
        else {
            yAxisScale = d3.scale.linear().domain([max, min]).rangeRound([0, container.height]);
        }


    }
    return yAxisScale;
}


/** getZScale
 *
 * @desc gets the scale for the z axis
 * @params zAxisData, padding, zoomEvent
 * @returns {{}} scale
 */
function getZScale(zAxisData, options) {
    return d3.scale.linear().domain([d3.min(zAxisData.values), d3.max(zAxisData.values)]).rangeRound([options.NODE_MIN_SIZE, options.NODE_MAX_SIZE]).nice();
}

/** getRelatedInsights
 *
 * @desc passes back the related insights data array
 * @params event, type
 * @returns []
 */
jvCharts.prototype.getRelatedInsights = function (event, type) {
    var chart = this,
        xAxisData = chart.currentData.xAxisData,
        ele = event.target || event.srcElement,
        object = [],
        classes = ele.classList,
        index = 0,
        highlightClass;

    for (var i = 0; i < classes.length; i++) {
        if (type === 'bar' || type === 'line') {
            if (classes.item(i).match(/bar-col-/gi)) {
                highlightClass = classes.item(i);
            }
        } else if (type === 'scatter') {
            if (classes.item(i).match(/scatter-circle/gi)) {
                highlightClass = classes.item(i);
            }
        }


    }
    if (highlightClass) {
        if (type === 'bar' || type === 'line') {
            //TODO update format to this for all visuals
            var uri = highlightClass.split('bar-col-')[1].replace(/_/g, ' ');

            index = xAxisData.values.indexOf(uri);
            object = [{
                index: index,
                axisName: xAxisData.label,
                uri: uri
            }];
        } else {
            index = parseInt(highlightClass.match(/\d+/)[0]);
            object = [{
                index: index,
                axisName: xAxisData.label
            }];
        }
        return object;
    }
};


/** FormatXAxisLabels
 *
 *  @desc If x-axis labels are too long/overlapping, they will be hidden/shortened
 */
jvCharts.prototype.formatXAxisLabels = function (dataLength) {
    var chart = this;
    var container = chart.config.container;
    var zoomScale = (typeof chart.config.zoomEvent === 'undefined' || chart.config.zoomEvent === null) ? 1 : chart.config.zoomEvent.scale;

    var showAxisLabels = true;
    chart.svg.selectAll(".xAxis").selectAll("text")
        .style("display", function (d, i) {
            //Don't show text element
            if (chart.svg.select(".xAxis").selectAll("text")[0][i].getBBox().width + 10 > (container.width / dataLength * zoomScale)) {
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

/************************************************ Sunburst functions ******************************************************/

/**setSunburstChartData
 *  gets sunburst data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
jvCharts.prototype.setSunburstChartData = function (data, dataTable, colors) {
    var chart = this;
    chart.data = {chartData: data, dataTable: dataTable};
    // chart.data.legendData = setSunburstLegendData(chart.data);
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
        options = chart.options,
        radius = Math.min(width, height) / 2;

    chart.children = chart.data.chartData;

    var x = d3.scale.linear()
        .range([0, 2 * Math.PI]);

    var y = d3.scale.linear()
        .range([0, radius]);

    var color = d3.scale.category20c()

    var partition = d3.layout.partition()
        .value(function(d) {
            return d.value;
        });

    var arc = d3.svg.arc()
        .startAngle(function(d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
        })
        .endAngle(function(d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
        })
        .innerRadius(function(d) {
            return Math.max(0, y(d.y));
        })
        .outerRadius(function(d) {
            return Math.max(0, y(d.y + d.dy));
        });

    var vis = svg.append("g")
        .attr("class", "sunburst")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

    vis.selectAll("path")
        .data(partition.nodes(chart.data.chartData))
        .enter().append("g").attr("class", "burst");

    var path = vis.selectAll(".burst")
        .append("path")
        .attr("d", arc)
        .style("fill", function(d) {
            return color((d.children ? d : d.parent).name);
        })
        .on("mouseenter", function(d, i) {
            //Get tip data
            var tipData = chart.setTipData(d, i);
            //Draw tip line
            chart.tip.generateSimpleTip(tipData, tipData.tipData, d3.event);
        })
        .on("mousemove", function(d, i){
            chart.tip.hideTip();
            var tipData = chart.setTipData(d, i);
            chart.tip.generateSimpleTip(tipData, tipData.tipData, d3.event);
        })
        .on("click", click)
        .on("mouseout", function(d) {
            chart.tip.hideTip();
        });


    if(chart.options.hasOwnProperty('displayValues')){
        if(chart.options.displayValues === true){
            var text = vis.selectAll(".burst")
                .append("text")
                .attr("transform", function(d) {
                    return "rotate(" + computeTextRotation(d) + ")";
                })
                .attr("x", function(d) {
                    return y(d.y);
                })
                .attr("dx", "6") // margin
                .attr("dy", ".35em") // vertical-align
                .text(function(d) {
                    return d.name;
                });

        }
    }


    function click(d) {
        // fade out all text elements
        if(chart.options.hasOwnProperty('displayValues')){
            if(chart.options.displayValues === true){
                text.transition().attr("opacity", 0);
            }
        }

        path.transition()
            .duration(750)
            .attrTween("d", arcTween(d))
            .each("end", function(e, i) {
                // check if the animated element's data e lies within the visible angle span given in d
                if (e.x >= d.x && e.x < (d.x + d.dx)) {
                    // get a selection of the associated text element
                    var arcText = d3.select(this.parentNode).select("text");
                    // fade in the text element and recalculate positions
                    arcText.transition().duration(750)
                        .attr("opacity", 1)
                        .attr("transform", function() {
                            return "rotate(" + computeTextRotation(e) + ")"
                        })
                        .attr("x", function(d) {
                            return y(d.y);
                        });
                }
            });
    }

    // d3.select(self.frameElement).style("height", height + "px");

    // Interpolate the scales!
    function arcTween(d) {
        var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
        return function(d, i) {
            return i
                ? function(t) { return arc(d); }
                : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
        };
    }

    function computeTextRotation(d) {
        return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
    }
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
        top: 100,
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

    var root = chart.data.chartData;

    var color = d3.scale.ordinal()
        .range(chart.data.color
            .map(function(c) { c = d3.rgb(c); c.opacity = 0.8; return c; }));

    var margin = 20,
        diameter = container.width / 1.75;

    var pack = d3.layout.pack()
        .size([container.width - margin, container.height - margin])
        .padding(2)
        .value(function (d) {
            return d.name
        });

    var nodes = pack.nodes(root);

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
        .data(nodes)
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
        .data(nodes)
        .enter().append("text")
        .attr("class", "label")
        .style("fill-opacity", function(d) {
            return d.parent === root ? 1 : 0;
        })
        .style("display", function(d) {
            return d.parent === root ? "inline" : "none";
        });

    var node = svg.selectAll("circle,text");

    d3.select("body")
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

/**
 * Generates a sankey chart with the given data
 * @param sankeyData
 */
jvCharts.prototype.generateChord = function (chordData){
    var chart = this,
        svg = chart.svg,
        color = chart.options.color;

    var imports = chordData.links;

    var width = chart.config.container.width;
    var height = chart.config.container.height;
    var outerRadius = 0;

    if(width > height){
        outerRadius = height / 1.75;
    } else {
        outerRadius = width / 1.75;
    }

    var innerRadius = outerRadius - 130;

    var fill = d3.scale.category10();

    var chord = d3.layout.chord()
        .padding(.04)
        .sortSubgroups(d3.descending)
        .sortChords(d3.descending);

    var arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(innerRadius + 20);

    var vis = svg.append("g")
        .attr("class", "chord")
        .attr("width", outerRadius * 2)
        .attr("height", outerRadius * 2)
        .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

    var indexByName = d3.map(),
        nameByIndex = d3.map(),
        matrix = [],
        n = 0;


    var testData = [
        {"source":"Action - Adventure","size":0,"target":["Action - Adventure","Drama","Comedy - Musical"]},
        {"source":"Drama","size":0,"target":["Comedy - Musical","Drama"]},
        {"source":"Comedy - Musical","size":0,"target":[,"Drama","Comedy - Musical","Thriller- Horror","Action - Adventure"]},
        {"source":"Thriller- Horror","size":0,"target":["Action - Adventure"]}];

    // Compute a unique index for each package name.
    testData.forEach(function(d) {
        if (!indexByName.has(d = d.source)) {
            nameByIndex.set(n, d);
            indexByName.set(d, n++);
        }
    });

    // Construct a square matrix counting package imports.
    testData.forEach(function(d) {
        var source = indexByName.get(d.source),
            row = matrix[source];
        if (!row) {
            row = matrix[source] = [];
            for (var i = -1; ++i < n;) {
                row[i] = 0;
            }
        }
        d.target.forEach(function(d) {
            row[indexByName.get(d)]++;
        });
    });

    chord.matrix(matrix);

    var g = vis.selectAll(".group")
        .data(chord.groups)
        .enter().append("g")
        .attr("class", "group");

    g.append("path")
        .style("fill", function(d) { return fill(d.index); })
        .style("stroke", function(d) { return fill(d.index); })
        .attr("d", arc);

    g.append("text")
        .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("transform", function(d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                + "translate(" + (innerRadius + 26) + ")"
                + (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
        .text(function(d) {
            return nameByIndex.get(d.index);
        });

    vis.selectAll(".chord")
        .data(chord.chords)
        .enter().append("path")
        .attr("class", "chord")
        .style("stroke", function(d) {
            return d3.rgb(fill(d.source.index)).darker();
        })
        .style("fill", function(d) {
            return fill(d.source.index);
        })
        .attr("d", d3.svg.chord().radius(innerRadius))
        .each(function(d) {
            d.source.name = nameByIndex.get(d.source.index);
            d.target.name = nameByIndex.get(d.target.index);
        })
        .on("mouseenter", function(d, i) {

            //Get tip data
            var tipData = chart.setTipData(d, i);
            //Draw tip line
            chart.tip.generateSimpleTip(tipData, tipData.tipData, d3.event);
        })
        .on("mouseout", function(d) {
            chart.tip.hideTip();
        });

    // d3.select(self.frameElement).style("height", outerRadius * 2 + "px");

}

/************************************************ Cloud functions ******************************************************/

/**setCloudData
 *  gets cloud data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
jvCharts.prototype.setCloudData = function (data, dataTable, colors) {
    var chart = this;
    chart.data = {chartData: data, dataTable: dataTable};
    // chart.data.legendData = setCloudLegendData(chart.data);
    //define color object for chartData
    chart.data.color = colors;
};

/**setCloudLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setCloudLegendData(data) {
    var legendArray = [];
    for (var i = 0; i < data.chartData.children.length; i++) {
        if (legendArray.indexOf(data.chartData.children[i][data.dataTable.series]) == -1) {
            legendArray.push((data.chartData.children[i][data.dataTable.series]));
        }
    }
    return legendArray;
}

jvCharts.prototype.paintCloudChart = function () {
    var chart = this;

    chart.options.color = chart.data.color;

    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship

    var cloudMargins = {
        top: 45,
        right: 50,
        left: 50,
        bottom: 130
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, cloudMargins);
    // chart.generateLegend(chart.currentData.legendData, 'generateCloud');
    chart.generateCloud(chart.currentData);


};

/** generateCloud
 *
 * paints the cloud  on the chart
 * @params cloud Data
 */
jvCharts.prototype.generateCloud = function (cloudData) {

    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        allFilterList = [],
        relationMap = chart.data.dataTable,
        chartName = chart.config.name;

    //set vars to normalize font sizes
    var maxVal, minVal;

    var color = d3.scale.linear()
        .domain([0,1,2,3,4,5,6,10,15,20,100,200])
        .range(cloudData.color);

    d3.layout.cloud()
        .size([container.width, container.height])
        .words(cloudData.chartData)
        .rotate(function(d){
            //Set up rotation for element, applied on selection
            //d.rotate = Math.random() * 45 * (Math.round(Math.random()) * -1);
            //return Math.random() * 45 * (Math.round(Math.random()) * -1);
            return 0;
        })
        .fontSize(function(d) {
            //Set maxVal and minVal to normalize the data
            if(maxVal == null){
                maxVal = d[relationMap.value];
            }
            else{
                if(d[relationMap.value] > maxVal){
                    maxVal = d[relationMap.value];
                }
            }
            if(minVal == null){
                minVal = d[relationMap.value];
            }
            else{
                if(d[relationMap.value] < minVal){
                    minVal = d[relationMap.value];
                }
            }
            return d[relationMap.value];
        })
        .on("end", draw)
        .start();

    function draw(words) {
        var vis = svg.append("g")
            .attr("class", "cloud")
            .attr("width", container.width + 50)
            .attr("height", container.height + 50)
            .attr("transform", "translate(300,200)");

        console.log(maxVal, minVal);

        vis.selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", function(d) {
                //Calculate the normalized value with the max/min
                var normalizedVal = (d[relationMap.value] - minVal)/(maxVal - minVal);
                return ((normalizedVal * 60) + "px");
            })
            .style("fill", function(d, i) {
                return color(i);
            })
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) {
                return d[relationMap.label];
            });
    }

}

/** setTipData
 *
 * creates data object to display in tooltip
 * @params
 * @returns {{}}
 */
jvCharts.prototype.setTipData = function (d, i) {
    var chart = this,
        data = chart.currentData.chartData,
        title = d[chart.data.dataTable.label],
        dataTable = {},
        item,
        color = chart.options.color;

    if (chart.config.type === 'treemap') {
        for (item in d) {
            if (d.hasOwnProperty(item) && item === chart.data.dataTable.series || item === chart.data.dataTable.size) {
                dataTable[item] = d[item];
            }
        }
    } else if (chart.config.type === 'bar' || chart.config.type === 'line') {
        title = data[i][chart.data.dataTable.label];
        for (item in data[i]) {
            if (data[i].hasOwnProperty(item) && item !== chart.data.dataTable.label) {
                dataTable[item] = data[i][item];
            }
        }
    } else if (chart.config.type === "gantt") {
        //Calculate length of dates
        for (item in data[i]) {
            if (data[i].hasOwnProperty(item) && item !== chart.data.dataTable.Group && item !== "SDLCPhase ActivityGroup DHAGroup") {
                dataTable[item] = data[i][item];
            }
        }

        var start,
            end,
            difference;

        //Calculting duration of date ranges to add to tooltip
        var numPairs = 2;//GANTT WILL ALWAYS HAVE 2 WHEN RAN THROUGH PLAYSHEET
        for (var j = 1; j <= numPairs; j++) {
            start = new Date(data[i][chart.data.dataTable["start_" + j]]);
            end = new Date(data[i][chart.data.dataTable["end_" + j]]);
            difference = end.getTime() - start.getTime();
            dataTable["Duration " + j] = Math.ceil(difference / (1000 * 60 *60 *24)) + " days";
        }

        title = data[i][chart.data.dataTable.Group];

    } else if (chart.config.type === 'pie') {
        title = d.data.label;
        for (item in d.data) {
            if (d.hasOwnProperty(item) && item !== "label") {
                dataTable[chart.currentData.dataTable[item]] = d.data[item];
            }
            else {
                continue;
            }
        }
    } else if (chart.config.type === 'radial') {
        title = d.label;
        for (item in d) {
            if (d.hasOwnProperty(item) && item !== "label" && item !== "outerRadius") {
                dataTable[chart.currentData.dataTable[item]] = d[item];
            }
            else {
                continue;
            }
        }
    }
    else if(chart.config.type === 'sankey'){
        title = d.source.name + " to " + d.target.name;
        if(d.hasOwnProperty("value")){
            dataTable["value"]= d.value;
        }
    }
    else if(chart.config.type === 'chord'){
        title = d.source.name + " to " + d.target.name;
        if(d.hasOwnProperty("value")){
            dataTable["value"]= d.value;
        }
    }
    else if(chart.config.type === 'jvpack' || chart.config.type === 'jvsunburst') {
        title = d.name;
        dataTable[chart.data.dataTable.value] = d.value;
    }
    else {
        for (item in d) {
            if (d.hasOwnProperty(item) && item !== chart.data.dataTable.label) {
                dataTable[item] = d[item];
            }
        }
    }
    return {"data": d, "tipData": dataTable, "index": i, "title": title, "color": color, "viz": chart.config.type};
};


