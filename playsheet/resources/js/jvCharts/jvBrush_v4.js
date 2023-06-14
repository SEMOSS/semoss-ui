/***  jvBrush ***/
function jvBrush(configObj) {
    "use strict";
    var brushObj = this;
    brushObj.chartDiv = configObj.chartDiv;
    brushObj.brushDiv = '';
    brushObj.jvChart = configObj.jvChart;
    brushObj.disabled = false;
}

jvBrush.prototype.removeBrush = function () {
    var brushObj = this;
    var svg = brushObj.jvChart.svg;

    svg.selectAll(".brusharea").remove();
};

jvBrush.prototype.startBrush = function (){
    var brushObj = this;
    var height = brushObj.jvChart.config.container.height;
    var width = brushObj.jvChart.config.container.width;
    var svg = brushObj.jvChart.svg;

    // var brush = d3.brush()
    //     .x(brushObj.jvChart.currentData.xAxisScale)
    //     .y(brushObj.jvChart.currentData.yAxisScale)
    //     .on('brushend', brushend);

    var brush = d3.brush()
        .extent([0, 0], [width, height])
        .on('brush end', brushend);

    var brushableArea = svg.append("g").attr("class", "brusharea");

    // brush.move(brushableArea);

    brushableArea.selectAll("rect.background")
        .attr("height", height);

    function brushend(p) {
        var e = brush.extent(),
            xScale = brushObj.jvChart.currentData.xAxisScale,
            yScale = brushObj.jvChart.currentData.yAxisScale,
            filteredXAxisLabels,
            filteredYAxisLabels,
            shouldReset = false;

        if(typeof xScale.rangePoints === "function" ) { //means that the scale is ordinal and not linear
            var returnObj = calculateBrushAreaOrdinal(e[0][0], e[1][0], xScale);
            filteredXAxisLabels = returnObj.filteredAxisLabels;
            shouldReset = returnObj.shouldReset ? true : shouldReset;
        } else {
            //calculate labels for linear scale
            var returnObj = calculateBrushAreaLinear(e[0][0], e[1][0], xScale, brushObj.jvChart.currentData, brushObj.jvChart.config.type, 'x');
            filteredXAxisLabels = returnObj.filteredAxisLabels;
            shouldReset = returnObj.shouldReset ? true : shouldReset;
        }

        if(typeof yScale.rangePoints === "function" ) { //means that the scale is oridnal and not linear
            var returnObj = calculateBrushAreaOrdinal(e[0][1], e[1][1], yScale);
            filteredYAxisLabels = returnObj.filteredAxisLabels;
            shouldReset = returnObj.shouldReset ? true : shouldReset;
        } else {
            //calculate labels for linear scale
            var returnObj = calculateBrushAreaLinear(e[0][1], e[1][1], yScale, brushObj.jvChart.currentData, brushObj.jvChart.config.type, 'y');
            filteredYAxisLabels = returnObj.filteredAxisLabels;
            shouldReset = returnObj.shouldReset ? true : shouldReset;
        }

        //merge axisLabels
        var filteredLabels = [];

        for(var j = 0; j < filteredXAxisLabels.length; j ++) {
            var index = filteredYAxisLabels.indexOf(filteredXAxisLabels[j]);
            if(index > -1) {
                filteredLabels.push(filteredXAxisLabels[j]);
            }
        }

        var filterCol = brushObj.jvChart.currentData.xAxisData.label;

        if(brushObj.jvChart.config.type === 'scatterplot') {
            filterCol = brushObj.jvChart.currentData.dataTable.label;
        }

        var filteredConcepts = {};
        filteredConcepts[filterCol] = filteredLabels;

        brushObj.removeBrush();
        //calls back to chart.directive.js
        brushObj.localCallbackUpdateChartForBrush(filteredConcepts, shouldReset);
    }

};

/**calculateBrushAreaOrdinal
 *
 * @param mousePosMin
 * @param mousePosMax
 * @param scale
 * @returns {Array}
 * @desc calculates the ordinal values that are in the brushed area
 */
function calculateBrushAreaOrdinal(mousePosMin, mousePosMax, scale) {
    var leftEdges = scale.range(),
        width = scale.bandWidth(),
        lowerBound,upperBound;

    //3 main goals of for loop below:
    //get lowerBound - index of where the xMouseMin position is (what text label is the mousePosMin on in ordinal scales)
    //get UpperBound - same as above, index of where mousePosMax position is
    //get all data labels in between (in the 'brush area') - filterXAxisLabels
    lowerBound = 0;
    var filteredAxisLabels = [];
    //function keeps iterating until the upper bound has been reached
    //goal was to not have separate for loops so combining them into one made it most efficient
    //once lower bound has been reached, the labels will start to be added to filteredAxisLabels
    for(upperBound=0; mousePosMax > (leftEdges[upperBound] - leftEdges[0]); upperBound++) {
        if(mousePosMin > (leftEdges[lowerBound] - leftEdges[0])) {
            lowerBound++;
        } else {
            //had to add -1 to account for the fact that the for statement passes the initial label to be added
            filteredAxisLabels.push(scale.domain()[upperBound -1]);
        }
    }
    //since the for loop adds one to the upper bound and lower bound when the condition is still valid we need to subtract one
    //it is possible there is a more elegant way to write this without the minus 1
    lowerBound -= 1;
    upperBound -= 1;
    //finally add last label for the upper bound
    filteredAxisLabels.push(scale.domain()[upperBound]);


    //calculate what side of the object the user has brushed
    //variables will contain either 'left' 'onObject' or 'right'
    var xPositionMin = getPositionOnObject(mousePosMin, lowerBound, width, leftEdges);
    var xPositionMax = getPositionOnObject(mousePosMax, upperBound, width, leftEdges);

    //reset filter when no bars have been brushed
    var shouldReset = false;
    if((lowerBound === upperBound && xPositionMin === xPositionMax && xPositionMin !== 'onObject') || (upperBound - lowerBound === 1 && xPositionMin === 'right' && xPositionMax === 'left')) {
        shouldReset = true;
    } else {
        //since the user has not technically brushed the object if on the right side to start and left side to finish, remove those labels
        if(xPositionMin === 'right') {
            filteredAxisLabels.shift();
        }
        if(xPositionMax === 'left') {
            filteredAxisLabels.pop();
        }
    }

    return {filteredAxisLabels: filteredAxisLabels, shouldReset: shouldReset};
}

function getPositionOnObject(mousePosition, index, width, leftEdges) {
    var position = '';
    if(mousePosition > leftEdges[index] && mousePosition < leftEdges[index] + width){
        position = 'onObject';
    } else if(mousePosition > leftEdges[index] + width){
        position = 'right';
    } else {
        position = 'left';
    }
    return position
}

/**calculateBrushAreaOrdinal
 *
 * @param mousePosMin
 * @param mousePosMax
 * @param scale
 * @returns {Array}
 * @desc calculates the ordinal values that are in the brushed area
 */
function calculateBrushAreaLinear(mousePosMin, mousePosMax, scale, data, type, axis) {
    var filteredAxisLabels = [],
        shouldReset = false;

    if(type === 'bar') {
        for(var i =0; i < data.legendData.length; i ++) {
            var axisLabel = data.legendData[i];
            for(var j =0; j <data.chartData.length; j ++) {
                if(data.chartData[j][axisLabel] >= mousePosMin) {
                    filteredAxisLabels.push(data.chartData[j][data.dataTable.label]);
                }
            }
        }
    }

    if(type === 'line'){
        for(var i =0; i < data.legendData.length; i ++) {
            var axisLabel = data.legendData[i];
            for(var j =0; j <data.chartData.length; j ++) {
                if(data.chartData[j][axisLabel] >= mousePosMin && data.chartData[j][axisLabel] <= mousePosMax) {
                    filteredAxisLabels.push(data.chartData[j][data.dataTable.label]);
                }
            }
        }
    }

    if(type === 'scatterplot'){
        var axisLabel = data.dataTable[axis];
        for(var j =0; j <data.chartData.length; j ++) {
            if(data.chartData[j][axisLabel] >= mousePosMin && data.chartData[j][axisLabel] <= mousePosMax) {
                filteredAxisLabels.push(data.chartData[j][data.dataTable.label]);
            }
        }

    }

    if(filteredAxisLabels.length < 1) {
        shouldReset = true;
    }

    return {filteredAxisLabels: filteredAxisLabels, shouldReset: shouldReset};
}