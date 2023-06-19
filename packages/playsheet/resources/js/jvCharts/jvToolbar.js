/***  jvToolbar ***/
function jvToolbar(configObj) {
    "use strict";
    var toolBarObj = this;
    //append jv edit, and jv comment
    toolBarObj.jvChart = null;
    toolBarObj.commentObj = configObj.comment;
    toolBarObj.editObj = configObj.edit;
    toolBarObj.brushObj = configObj.brush;

    //add name and chartDiv
    toolBarObj.name = configObj.name;
    toolBarObj.chartDiv = configObj.chartDiv;

    toolBarObj.mode = 'default';

    //create listener (initialize function)
    //calling addToolBarListener on resize is still required
    toolBarObj.addToolBarListener();
}

/********************************************* TOOLBAR functions **************************************************/

/** addToolBarListener
 *
 * Adds listener for entire svg that shows the upper toolbar whenever the svg is hovered
 *
 */
jvToolbar.prototype.addToolBarListener = function () {
    var toolBarObj = this;

    //TODO determine if this line is needed
    if(toolBarObj.jvChart){
        toolBarObj.chartDiv = toolBarObj.editObj.chartDiv = toolBarObj.commentObj.chartDiv = toolBarObj.brushObj.chartDiv = toolBarObj.jvChart.chartDiv;
    }

    //update edit mode
    if (toolBarObj.editObj) {
        toolBarObj.chartDiv.selectAll('.edit-div').remove();
        toolBarObj.editObj.editDiv = toolBarObj.chartDiv.append('div').attr('class', 'edit-div semoss-d3-tip absolute');
    }

    //initial selection of default mode
    toolBarObj.highlightSelectedMode('default');

    toolBarObj.addToolBarClickEvents();
};

/** highlightSelectedMode
 *
 * Selects which mode the user switches to and updates the listeners with addToolBarClickEvents
 * -edit, comment, and default modes
 *
 */
jvToolbar.prototype.highlightSelectedMode = function (mode) {
    var toolBarObj = this,
        entireSvg = toolBarObj.chartDiv.select("svg"),
        editObj = toolBarObj.editObj,
        commentObj = toolBarObj.commentObj,
        brushObj = toolBarObj.brushObj;

    toolBarObj.mode = mode;

    //handles whether comment / edit / jvchart exists
    if (mode === 'edit') {
        entireSvg.selectAll(".event-rect")
            .attr("display", "none");

        if (toolBarObj.jvChart) {
            toolBarObj.jvChart.draw.showToolTip = false;
        }
        if (commentObj) {
            commentObj.removeComment();
        }
        if (editObj) {
            entireSvg.selectAll('.editable').classed('pointer', true);
        }
        if (brushObj) {
            brushObj.removeBrush();
        }
    }
    else if (mode === 'comment') {
        entireSvg.selectAll(".event-rect")
            .attr("display", "block");

        if (toolBarObj.jvChart) {
            toolBarObj.jvChart.draw.showToolTip = false;
        }
        if (editObj) {
            editObj.removeEdit();
            entireSvg.selectAll('.editable').classed('pointer', false);
        }
        if (brushObj) {
            brushObj.removeBrush();
        }
    }
    else if (mode === 'brush') {
        entireSvg.selectAll(".event-rect")
            .attr("display", "block");

        if (toolBarObj.jvChart) {
            toolBarObj.jvChart.draw.showToolTip = false;
        }
        if (editObj) {
            editObj.removeEdit();
        }
        if (commentObj) {
            commentObj.removeComment();
        }
        //Create a brush canvas on the chart area
        if (brushObj) {
            brushObj.startBrush();
        }
    }
    else {
        entireSvg.selectAll(".event-rect")
            .attr("display", "block");

        if (toolBarObj.jvChart) {
            toolBarObj.jvChart.draw.showToolTip = true;
        }
        if (commentObj) {
            commentObj.removeComment();
        }
        if (editObj) {
            editObj.removeEdit();
            entireSvg.selectAll('.editable').classed('pointer', false);
        }
        if (brushObj) {
            brushObj.removeBrush();
        }
    }
};


/** addToolBarClickEvents
 *
 * Adds listeners for each mode and removes listeners for previous mode
 * -Also adds callback for local insights
 * -edit, comment, and default modes
 *
 */
jvToolbar.prototype.addToolBarClickEvents = function () {
    var toolBarObj = this;
    var entireSvg = toolBarObj.chartDiv.select("svg");
    var commentObj = toolBarObj.commentObj;

    entireSvg.on('click', function () {
        if (toolBarObj.mode.toLowerCase() === 'edit') {
            //edit mode events
            //going to be mouseover to highlight options for whatever piece you hover over
            var classText = d3.select(d3.event.target).attr('class');
            if (classText) {
                if (classText.indexOf('editable') >= 0) {
                    toolBarObj.editObj.displayEdit(this, classText);
                }
            }
        }
    });

    entireSvg.on('dblclick', function (d) {
        if (toolBarObj.mode.toLowerCase() === 'default') {
            //callback function has already been added to the chart object. Therefore it already exists at this point
            //  so the function actually takes place in whatever function that
            //  called it (in our case, angular directive for bar chart)
            toolBarObj.localCallbackRelatedInsights();
        } else if (toolBarObj.mode.toLowerCase() === 'comment') {
            commentObj.makeComment(this);
        }
    });
};
