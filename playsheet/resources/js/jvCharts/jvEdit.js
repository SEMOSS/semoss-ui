/***  jvEdit ***/
function jvEdit(configObj) {
    "use strict";
    var editObj = this;
    editObj.chartDiv = configObj.chartDiv;
    editObj.editOptions = '';
    editObj.editDiv = '';
    editObj.vizOptions = configObj.vizOptions;
    editObj.fontSizeIncrement = 0;
    editObj.disabled = false;
}


/********************************************* All Edit Mode Functions **************************************************/

/** displayEdit
 *
 * Displays the edit div, grabbing it from the template
 *
 */
jvEdit.prototype.displayEdit = function (event, options) {
    var editObj = this;

    //return if you click on the same element twice, no need to display a second edit div if the current one is still open
    if (editObj.editOptions === options) {
        return;
    }
    editObj.editDiv.html('');
    editObj.editOptions = options;
    var mouseX = d3.mouse(event)[0],
        mouseY = d3.mouse(event)[1];


    //get the edit template html and then determine which pieces to show
    $.get('resources/js/jvCharts/editOptionsTemplate.html', function (data) {
        //assign html to editDiv (basically displays the div)
        editObj.editDiv.html(data);

        //optionValues - an array of strings.
        //      String is the id to the element in the editDiv form.
        //      This string contains the specific option that is being changed

        //itemToChange
        //      String that is the class of the svg element to be changed on the viz itself


        var optionValues = [],
            itemToChange = '';

        //if statements to determine which edit options to display
        if (options.indexOf('editable-yAxis') >= 0) {
            editObj.editDiv.select("#edit-option-element").html('&nbsp;for Y Axis');
            editObj.editDiv.select("#edit-option-element").style('visibility', 'visible');
            itemToChange = 'yAxis';
        } else if (options.indexOf('editable-xAxis') >= 0) {
            editObj.editDiv.select("#edit-option-element").html('&nbsp;for X Axis');
            editObj.editDiv.select("#edit-option-element").style('visibility', 'visible');
            itemToChange = 'xAxis';
        } else if (options.indexOf('yLabel') >= 0) {
            editObj.editDiv.select("#edit-option-element").html('&nbsp;for Y Label');
            editObj.editDiv.select("#edit-option-element").style('visibility', 'visible');
            itemToChange = 'yLabel';
        } else if (options.indexOf('xLabel') >= 0) {
            editObj.editDiv.select("#edit-option-element").html('&nbsp;for X Label');
            editObj.editDiv.select("#edit-option-element").style('visibility', 'visible');
            itemToChange = 'xLabel';
        } else if (options.indexOf('legendText') >= 0) {
            editObj.editDiv.select("#edit-option-element").html('&nbsp;for Legend Item');
            editObj.editDiv.select("#edit-option-element").style('visibility', 'visible');
            itemToChange = options.substring(options.indexOf('editable-legend-')).split(' ')[0];
        } else if (options.indexOf('editable-bar') >= 0) {
            editObj.editDiv.select("#edit-option-element").html('&nbsp;for Bar Chart');
            editObj.editDiv.select("#edit-option-element").style('visibility', 'visible');
            editObj.editDiv.select(".editable-bar").style('display', 'block');
            optionValues.push('editable-bar');
            itemToChange = options.substring(options.indexOf('bar-col-')).split(' ')[0];
        } else if (options.indexOf('editable-pie') >= 0) {
            editObj.editDiv.select("#edit-option-element").html('&nbsp;for Pie Slice');
            editObj.editDiv.select("#edit-option-element").style('visibility', 'visible');
            editObj.editDiv.select(".editable-pie").style('display', 'block');
            optionValues.push('editable-pie');
            itemToChange = options.substring(options.indexOf('pie-slice-')).split(' ')[0];
        } else if (options.indexOf('editable-scatter') >= 0) {
            editObj.editDiv.select("#edit-option-element").html('&nbsp;for Scatter Plot');
            editObj.editDiv.select("#edit-option-element").style('visibility', 'visible');
            editObj.editDiv.select(".editable-scatter").style('display', 'block');
            optionValues.push('editable-scatter');
            itemToChange = options.substring(options.indexOf('scatter-circle-')).split(' ')[0];
        }
        else if (options.indexOf('editable-svg') >= 0) {
            editObj.editDiv.select("#edit-option-element").html('&nbsp;for All Text');
            editObj.editDiv.select("#edit-option-element").style('visibility', 'visible');
            editObj.editDiv.select(".editable-text-size-buttons").style('display', 'block');
            //editObj.editDiv.select(".editable-default-and-apply").style('display', 'none');
            optionValues.push('editable-text-size');
            itemToChange = 'svg';
        }
        else {
            console.log("Still need to add option to display edit");
        }

        if (options.indexOf('editable-num') >= 0) {
            editObj.editDiv.select(".editable-num-format").style('display', 'block');
            optionValues.push('editable-num-format');
        }
        if (options.indexOf('editable-text') >= 0) {
            editObj.editDiv.select(".editable-text-color").style('display', 'block');
            optionValues.push('editable-text-color');
            editObj.editDiv.select(".editable-text-size").style('display', 'block');
            optionValues.push('editable-text-size');
        }
        if (options.indexOf('editable-content') >= 0) {
            editObj.editDiv.select(".editable-content").style('display', 'block');
            optionValues.push('editable-content');
        }

        //populate edit div with initial values
        if (editObj.vizOptions[itemToChange]) {
            populateSelectionsEditMode(editObj.editDiv, editObj.vizOptions[itemToChange]);
        }
        editObj.editDiv
            .style('display', 'block')
            .style("left", 0 + 'px')
            .style("top", 0 + 'px');

        //calculate position of overlay div
        var editHeight = parseFloat(editObj.editDiv.style('height')),
            editWidth = parseFloat(editObj.editDiv.style('width')),
            position = editObj.overlayDivPosition(editWidth, editHeight, mouseX, mouseY);

        //show the new edit div
        editObj.editDiv
            .style("left", position.x + 'px')
            .style("top", position.y + 'px');

        //add submit, default, and exit listeners to the div
        editObj.editDiv.select('#submitEditMode').on("click", function () {
            submitEditMode(editObj, optionValues, itemToChange);
            editObj.removeEdit();
        });
        editObj.editDiv.select('#submitEditModeDefault').on("click", function () {
            submitEditMode(editObj, optionValues, itemToChange, true);
            editObj.removeEdit();
        });
        editObj.editDiv.select('#exitEditMode').on("click", function () {
            editObj.removeEdit();
        });

        //Adding click events for increase/decrease font size buttons
        editObj.editDiv.select("#increaseFontSize").on("click", function () {
            editObj.increaseFontSize();
        });
        editObj.editDiv.select("#decreaseFontSize").on("click", function () {
            editObj.decreaseFontSize();
        });
    });
};


/** increaseFontSize
 *
 * Increases the font size by 1 when increased via edit options for all text
 *
 */
jvEdit.prototype.increaseFontSize = function (optionalIncrement) {
    var editObj = this;
    var newSize;
    var fontIncrement = 1;

    //If this is being called via apply all edits, only apply increment, do not save it again
    if (optionalIncrement) {
        fontIncrement = optionalIncrement;

        editObj.chartDiv.selectAll('text').each(function (d, i) {
            var thisDiv = this;
            var textSize;

            if (thisDiv.getAttribute('font-size')) {
                textSize = thisDiv.getAttribute('font-size');
            }
            else {
                //Do nothing
            }

            newSize = Math.min(parseInt(textSize) + fontIncrement, 40);

            thisDiv.setAttribute('font-size', newSize);
        });
    }
    //If increment is applied via increment button, save the number of increments
    else {
        editObj.chartDiv.selectAll('text').each(function (d, i) {
            var thisDiv = this;
            var textSize;

            if (thisDiv.getAttribute('font-size')) {
                textSize = thisDiv.getAttribute('font-size');
            }
            else {
                //Do nothing
                textSize = 12;
            }

            newSize = Math.min(parseInt(textSize) + fontIncrement, 40);

            thisDiv.setAttribute('font-size', newSize);
        });

        editObj.fontSizeIncrement++;


        editObj.vizOptions["text"] = {'editable-text-increment': editObj.fontSizeIncrement};
        //save vizOptions
        //editObj.localCallbackSaveVizOptions(editObj.vizOptions);
    }
};


/** decreaseFontSize
 *
 * Decreases the font size by 1 when decreased via edit options for all text
 *
 */
jvEdit.prototype.decreaseFontSize = function (optionalDecrement) {
    var editObj = this;
    var fontDecrement = 1;

    if (optionalDecrement) {
        fontDecrement = optionalDecrement;

        editObj.chartDiv.selectAll('text').each(function (d, i) {
            var thisDiv = this;
            var textSize;

            if (thisDiv.getAttribute('font-size')) {
                textSize = thisDiv.getAttribute('font-size');
            }
            else {
                textSize = 12;//Set default text size to 12 if it doesn't exist
            }

            var newSize = Math.max(parseInt(textSize) - fontDecrement, 1);

            thisDiv.setAttribute('font-size', newSize);
        });
    }
    else {
        editObj.chartDiv.selectAll('text').each(function (d, i) {
            var thisDiv = this;
            var textSize;

            if (thisDiv.getAttribute('font-size')) {
                textSize = thisDiv.getAttribute('font-size');
            }
            else {
                textSize = 12;//Set default text size to 12 if it doesn't exist
            }

            var newSize = Math.max(parseInt(textSize) - fontDecrement, 1);

            thisDiv.setAttribute('font-size', newSize);
        });

        //Store font size decrease in object
        editObj.fontSizeIncrement--;

        editObj.vizOptions["text"] = {'editable-text-increment': editObj.fontSizeIncrement};
        //save vizOptions
        //editObj.localCallbackSaveVizOptions(editObj.vizOptions);
    }
}


/** populateSelectionsEditMode
 *
 * Initially populates the editDiv if there are vizOptions
 *
 */
function populateSelectionsEditMode(editDiv, vizOptions) {
    for (var option in vizOptions) {
        if (vizOptions.hasOwnProperty(option)) {
            var selectedObject = editDiv.select('#' + option)[0][0];
            //default color inputs to gray
            if (vizOptions[option] === 'default') {
                if (selectedObject.type === 'color') {
                    if (selectedObject.id.indexOf('text') > 0) {
                        selectedObject.value = '#000000';
                    } else {
                        selectedObject.value = '#aaaaaa';
                    }
                }
            } else {
                selectedObject.value = vizOptions[option];
            }
        }
    }
}

/** submitEditMode
 *
 *
 */
function submitEditMode(editObj, optionValues, itemToChange, defaultBtnClicked) {
    var optionArray = optionValues;
    var selectedEditOptions = {};

    for (var i = 0; i < optionArray.length; i++) {
        if (optionArray[i].indexOf('editable-legend') > 0) {
            //change item to change for legend elements
            itemToChange = optionArray[i];
        }
        if (editObj.editDiv.select('#' + optionArray[i]) && editObj.editDiv.select('#' + optionArray[i])[0] && editObj.editDiv.select('#' + optionArray[i])[0][0]) {
            //get selected option from edit div
            if (optionArray[i] === 'editable-content' && editObj.editDiv.select('#' + optionArray[i])[0][0].value === '') {
                //dont add an empty string to the viz options for editable content
                break;
            }
            selectedEditOptions[optionArray[i]] = editObj.editDiv.select('#' + optionArray[i])[0][0].value;
            if ((!selectedEditOptions[optionArray[i]] || defaultBtnClicked === true) && optionArray[i].indexOf('content') < 0) {
                selectedEditOptions[optionArray[i]] = 'default';
            }
        }
    }

    editObj.vizOptions[itemToChange] = selectedEditOptions;
    //save vizOptions
    editObj.localCallbackSaveVizOptions(editObj.vizOptions);
}


jvEdit.prototype.applyEditMode = function (itemToChange, options) {
    var editObj = this;
    var object = editObj.chartDiv.select("." + itemToChange),
        objectTagName = object[0][0] ? object[0][0].tagName.toLowerCase() : null;

    if (itemToChange === 'text') {
        //do something if it is all the text that is being changed
        object = editObj.chartDiv.selectAll("text");
    }

    //options by tagName
    if (objectTagName === 'g') {
        object = editObj.chartDiv.select("." + itemToChange).selectAll('text');
    } else if (objectTagName === 'rect') {
        if (options['editable-bar']) {
            var matchedString = itemToChange.split('bar-col-')[1];
            var j = matchedString[0];
            var iString = itemToChange.substring(matchedString.index + matchedString[0].length);
            var i = matchedString;
            var color;
            if (options['editable-bar'] === 'default' || options['editable-bar'] === '') {
                //TODO figure this out
                //color = getColors(chart.options.color, i, Object.keys(chart.currentData.chartData[j])[i + 1]);
            } else {
                color = options['editable-bar'];
            }
            object.attr('fill', color);
        }
    } else if (objectTagName === 'circle') {
        if (options['editable-scatter']) {
            var matchedString = itemToChange.match(/\d+/);
            var j = matchedString[0];
            var color;
            if (options['editable-scatter'] === 'default' || options['editable-scatter'] === '') {
                //TODO figure this out
                //color = getColors(chart.options.color, i, Object.keys(chart.currentData.chartData[j])[i + 1]);
            } else {
                color = options['editable-scatter'];
            }
            object.attr('fill', color);
        }
    } else if (objectTagName === 'path') {
        if (options['editable-pie']) {
            var matchedString = itemToChange.match(/\d+/);
            var i = matchedString[0];
            var color;
            if (options['editable-pie'] === 'default' || options['editable-pie'] === '') {
                //TODO figure this out
                // var label = chart.currentData.chartData[i][chart.currentData.dataTable.label];
                // color = getColors(chart.options.color, i, label);
            } else {
                color = options['editable-pie'];
            }
            object.attr('fill', color);
        }
    }

    //standard options
    //If a text increment exists, apply it based on the sign of the variable
    if (options.hasOwnProperty('editable-text-increment')) {
        if (options['editable-text-increment'] > 0) {
            editObj.increaseFontSize(options['editable-text-increment']);
        }
        else if (options['editable-text-increment'] < 0) {
            editObj.decreaseFontSize((options['editable-text-increment']));
        }
        else {
            //Do nothing
        }
    }
    if (options.hasOwnProperty('editable-text-size')) {
        object.style('font-size', options['editable-text-size']);
    }
    if (options.hasOwnProperty('editable-text-color')) {
        object.style('fill', options['editable-text-color']);
    }
    if (options.hasOwnProperty('editable-num-format')) {
        var expression = getFormatExpression(options['editable-num-format']);
        object.text(function (d) {
            if (!isNaN(d)) {
                return expression(d);
            }
            return d;
        });
    }
    if (options.hasOwnProperty('editable-content')) {
        if (options['editable-content'].length > 0) {
            object.html(options['editable-content']);
        }
    }
    editObj.removeEdit();
};

jvEdit.prototype.applyAllEdits = function () {
    var editObj = this;

    //If the font size has been changed universally, apply it before applying other edits
    //console.log(editObj.vizOptions['text']);
    ////if(editObj.vizOptions['text']){
    ////
    ////}
    //if(editObj.fontSizeIncrement < 0 ){
    //    editObj.decreaseFontSize(Math.abs(editObj.fontSizeIncrement));
    //}
    //else if(editObj.fontSizeIncrement > 0){
    //    editObj.increaseFontSize((editObj.fontSizeIncrement));
    //}
    //else{
    //    //Do nothing
    //}

    for (var option in editObj.vizOptions) {
        if (editObj.vizOptions.hasOwnProperty(option) && editObj.chartDiv.select(option)) {
            editObj.applyEditMode(option, editObj.vizOptions[option]);
        }
    }
};

jvEdit.prototype.removeEdit = function () {
    var editObj = this;

    editObj.editDiv.html('');
    editObj.editDiv
        .style('display', 'none');
    editObj.editOptions = '';
};


/******************************* Utility functions **********************************************/

jvEdit.prototype.overlayDivPosition = function (divWidth, divHeight, mouseX, mouseY) {
    var editObj = this;
    var position = {};
    if (mouseX > (parseInt(editObj.chartDiv.style('width'))) / 2) {
        position.x = mouseX - divWidth;
    } else {
        position.x = mouseX;
    }
    if (mouseY - divHeight - 10 > 0) {
        position.y = mouseY - divHeight - 10;
    } else {
        position.y = mouseY + 10;
    }
    return position;
};