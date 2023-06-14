/***  jvTip ***/
function jvTip(configObj) {
    "use strict";
    var tip = this;

    tip.type = configObj.type;
    tip.chartDiv = configObj.chartDiv;

    //Create initial div
    tip.chartDiv.select('.jv-tooltip').remove();
    tip.chartDiv.select("div")
        .attr("class", "tooltip jv-tooltip")
        .style("pointer-events", "none");
    }

jvTip.prototype.showTip = function(){
    var tip = this;

    tip.toolTip.style("display", "block");
}

jvTip.prototype.hideTip = function(){
    var tip = this;

    tip.toolTip.style("display", "none");
}



/************************************************* Viz Specific Functions ***********************************************************************************************************/

jvTip.prototype.generateSimpleTip = function (dataObj, dataTable, event) {
    var tip = this;

    //Logic to determine where tooltip will be placed on page

    //If event is on right side, tooltip to the left
    //console.log(tip.chartDiv);
    var offsetX = 0;
    if(event.pageX > (tip.chartDiv[0][0].clientWidth / 2)) {
        offsetX = -200;
    }
    else if(event.pageX <= (tip.chartDiv[0][0].clientWidth / 2)) {
        offsetX = 10;
    }

    //If event is on left side, tooltip to the right


    tip.toolTip = tip.chartDiv.select(".tooltip")
        .html(function(){
            if(dataObj.viz === 'pie' || dataObj.viz ==='treemap'){
                return generateSingleColorHTML(dataObj, dataTable, dataObj.color[dataObj.title]);
            }
            else if(dataObj.viz === 'scatterplot'){
                //If a series exists
                if(dataObj.tipData[dataTable.series]) {
                    return generateSingleColorHTML(dataObj, dataTable, dataObj.color[dataObj.data[dataTable.series]]);
                }
                else {
                    return generateSingleColorHTML(dataObj, dataTable, dataObj.color[dataTable.label]);
                }
            }
            else{
                return generateSimpleHTML(dataObj, dataTable, null);
            }

        })
        .style("left", function(d, i) {
            //console.log(this.getBoundingClientRect().width);
            return (event.pageX + offsetX) + "px";
        })
        .style("top", (event.pageY) + "px")
        .style("display", "block")
        .style("opacity", 1);


    return tip.tooltip;
}

function generateSimpleHTML(dataObj, dataTable, color) {
    //var html = "";
    ////html = "<div>" + dataTable.value + ": " + data.value + "</div>";
    //html = "<div class='jv-tip'>Test Tool Tip. Testing a long tool tip. is there overflow</div>";

    var tooltipText;
    tooltipText = "<div><div class='title sm-left-margin xs-top-margin sm-right-margin'><b>" + dataObj.title +"</b></div><hr style='margin:3px 0 3px 0;'/>";

    //for (var k = 0; k < dataObj.data.length; k++) {
    for (var item in dataObj.tipData) {
        var outputVal = 50;
        var backgroundColor = "blue";
        //if (options.seriesFlipped) {
        //    backgroundColor = (options.flippedLegendOptions ? options.flippedLegendOptions[k].toggle ? getColors(colors, d.i, legendData[k]) : "white" : getColors(colors, d.i, legendData[k]))
        //}
        //else {
        //    backgroundColor = (options.legendOptions ? options.legendOptions[k].toggle ? getColors(colors, d.i, legendData[k]) : "white" : getColors(colors, d.i, legendData[k]))
        //}

        if(typeof dataObj.tipData[item] === 'number'){
            if (dataObj.tipData[item] > 1000 || dataObj.tipData[item] % 1 === 0) {
                dataObj.tipData[item] = d3.format(",f")(dataObj.tipData[item]);
            } else {
                dataObj.tipData[item] = d3.format(",.2f")(dataObj.tipData[item]);
            }
        }

        if(dataObj.color[item]){
            tooltipText += "<span class='semoss-d3-tip-content sm-right-margin'>" +
                "<div class='circleBase d3-tooltip-circle inline sm-right-margin sm-left-margin' style='background: " + dataObj.color[item] + "'>" +
                "</div>" + item + ": " +  dataObj.tipData[item] + "</span><br/>";
        }
        else{
            tooltipText += "<span class='semoss-d3-tip-content sm-left-margin sm-right-margin'>" +
                item + ": " +  dataObj.tipData[item] + "</span><br/>";
        }

    }
    tooltipText += "</div>";
    return tooltipText;


    //return html;
}

function generateSingleColorHTML(dataObj, dataTable, color) {
    var tooltipText;
    tooltipText = "<div class='inline'>" + "<div class='circleBase d3-tooltip-circle inline sm-right-margin sm-left-margin' style='background: " + color + "'>" +
        "</div>" + "<div class='title xxs-left-margin xs-top-margin sm-right-margin inline'><b>" + dataObj.title +"</b></div><hr style='margin:3px 0 3px 0;'/>";

    for (var item in dataObj.tipData) {
        var outputVal = 50;
        var backgroundColor = "blue";

        if (dataObj.tipData[item] > 1000 || dataObj.tipData[item] % 1 === 0) {
            dataObj.tipData[item] = d3.format(",f")(dataObj.tipData[item]);
        } else if(typeof dataObj.tipData[item] == 'number') {
            dataObj.tipData[item] = d3.format(",.2f")(dataObj.tipData[item]);
        }
        tooltipText += "<span class='semoss-d3-tip-content sm-left-margin sm-right-margin'>" +
            item + ": " +  dataObj.tipData[item] + "</span><br/>";
    }
    tooltipText += "</div>";
    return tooltipText;


    //return html;
}
