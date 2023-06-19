/** *  jvEdit ***/
'use strict';
import * as d3 from 'd3';
import editTemplate from './editOptionsTemplate.js';
/**
* @name jvEdit
* @desc Constructor for JV Edit - creates edits to a jv visualization and executes a callback for the edit options to be saved
* @param {object} configObj - constructor object containing the jvChart and other options
* @return {undefined} - no return
*/
export default class jvEdit {
    constructor(configObj) {
        this.chartDiv = configObj.chartDiv;
        this.vizOptions = configObj.vizOptions ? configObj.vizOptions : {};
        this.chartDiv.selectAll('.edit-div').remove();
        this.editDiv = this.chartDiv.append('div').attr('class', 'edit-div');
        this.onSaveCallback = configObj.onSaveCallback;
        this.onFontSize = configObj.onFontSize;
        this.fontSizeIncrement = configObj.fontSize;
    }

    /**
    * @name displayEdit
    * @desc Displays the edit div, grabbing it from the template
    * @param {array} mouse - mouse location of the click event, used to place the edit mode div on the visual
    * @param {string} options - css class of clicked element, provides the options that are editable by edit mode
    * @return {undefined} - no return
    */
    displayEdit(mouse, options) {
        var editObj = this,
            mouseX = mouse[0],
            mouseY = mouse[1],
            optionValues = [],
            itemToChange = '',
            editOptionElement,
            editHeight = parseFloat(editObj.editDiv.style('height')),
            editWidth = parseFloat(editObj.editDiv.style('width')),
            position;

        // return if you click on the same element twice, no need to display a second edit div if the current one is still open
        if (editObj.editOptions === options) {
            return;
        }
        editObj.editDiv.html('');
        editObj.editOptions = options;

        // assign html to editDiv (basically displays the div)
        editObj.editDiv.html(editTemplate);

        // optionValues - an array of strings.
        // String is the id to the element in the editDiv form.
        // This string contains the specific option that is being changed

        // itemToChange
        // String that is the class of the svg element to be changed on the viz itself
        editOptionElement = editObj.editDiv.select('#edit-option-element');

        // if statements to determine which edit options to display
        if (options.indexOf('editable-yAxis') >= 0) {
            editOptionElement.html('&nbsp;for Y Axis');
            editOptionElement.style('visibility', 'visible');
            itemToChange = 'yAxis';
        } else if (options.indexOf('editable-xAxis') >= 0) {
            editOptionElement.html('&nbsp;for X Axis');
            editOptionElement.style('visibility', 'visible');
            itemToChange = 'xAxis';
        } else if (options.indexOf('yLabel') >= 0) {
            editOptionElement.html('&nbsp;for Y Label');
            editOptionElement.style('visibility', 'visible');
            itemToChange = 'yLabel';
        } else if (options.indexOf('xLabel') >= 0) {
            editOptionElement.html('&nbsp;for X Label');
            editOptionElement.style('visibility', 'visible');
            itemToChange = 'xLabel';
        } else if (options.indexOf('legendText') >= 0) {
            editOptionElement.html('&nbsp;for Legend Item');
            editOptionElement.style('visibility', 'visible');
            itemToChange = options.substring(options.indexOf('editable-legend-')).split(' ')[0];
        } else if (options.indexOf('editable-bar') >= 0) {
            editOptionElement.html('&nbsp;for Bar Chart');
            editOptionElement.style('visibility', 'visible');
            editObj.editDiv.select('.editable-bar').style('display', 'block');
            optionValues.push('editable-bar');
            itemToChange = options.substring(options.indexOf('bar-col-')).split(' ')[0];
        } else if (options.indexOf('editable-pie') >= 0) {
            editOptionElement.html('&nbsp;for Pie Slice');
            editOptionElement.style('visibility', 'visible');
            editObj.editDiv.select('.editable-pie').style('display', 'block');
            optionValues.push('editable-pie');
            itemToChange = options.substring(options.indexOf('pie-slice-')).split(' ')[0];
        } else if (options.indexOf('editable-scatter') >= 0) {
            editOptionElement.html('&nbsp;for Scatter Plot');
            editOptionElement.style('visibility', 'visible');
            editObj.editDiv.select('.editable-scatter').style('display', 'block');
            optionValues.push('editable-scatter');
            itemToChange = options.substring(options.indexOf('scatter-circle-')).split(' ')[0];
        } else if (options.indexOf('editable-bubble') >= 0) {
            editOptionElement.html('&nbsp;for Bubble Chart');
            editOptionElement.style('visibility', 'visible');
            editObj.editDiv.select('.editable-bubble').style('display', 'block');
            optionValues.push('editable-bubble');
            itemToChange = options.substring(options.indexOf('bubble-')).split(' ')[0];
        } else if (options.indexOf('editable-box') >= 0) {
            editOptionElement.html('&nbsp;for Box and Whisker Plot');
            editOptionElement.style('visibility', 'visible');
            editObj.editDiv.select('.editable-box').style('display', 'block');
            optionValues.push('editable-box');
            itemToChange = options.substring(options.indexOf('box-')).split(' ')[0];
        } else if (options.indexOf('editable-comment') >= 0) {
            editOptionElement.html('&nbsp;for Comment');
            editOptionElement.style('visibility', 'visible');
            itemToChange = options.substring(options.indexOf('editable-comment-')).split(' ')[0];
        } else if (options.indexOf('editable-svg') >= 0) {
            editOptionElement.html('&nbsp;for All Text');
            editOptionElement.style('visibility', 'visible');
            editObj.editDiv.select('.editable-text-size-buttons').style('display', 'block');
            optionValues.push('editable-text-size');
            itemToChange = 'svg';
        } else {
            console.log('Still need to add option to display edit');
        }

        if (options.indexOf('editable-num') >= 0) {
            editObj.editDiv.select('.editable-num-format').style('display', 'block');
            optionValues.push('editable-num-format');
        }
        if (options.indexOf('editable-text') >= 0) {
            editObj.editDiv.select('.editable-text-color').style('display', 'block');
            optionValues.push('editable-text-color');
            editObj.editDiv.select('.editable-text-size').style('display', 'block');
            optionValues.push('editable-text-size');
        }
        if (options.indexOf('editable-content') >= 0) {
            editObj.editDiv.select('.editable-content').style('display', 'block');
            optionValues.push('editable-content');
        }

        // populate edit div with initial values
        if (editObj.vizOptions[itemToChange]) {
            jvEdit.populateSelectionsEditMode(editObj.editDiv, editObj.vizOptions[itemToChange]);
        }
        editObj.editDiv
            .style('display', 'block')
            .style('left', 0 + 'px')
            .style('top', 0 + 'px');

        // calculate position of overlay div
        editHeight = parseFloat(editObj.editDiv.style('height'));
        editWidth = parseFloat(editObj.editDiv.style('width'));
        position = editObj.overlayDivPosition(editWidth, editHeight, mouseX, mouseY);

        // show the new edit div
        editObj.editDiv
            .style('left', position.x + 'px')
            .style('top', position.y + 'px');

        // add submit, default, and exit listeners to the div
        editObj.editDiv.select('#submitEditMode').on('click', function () {
            editObj.submitEditMode(optionValues, itemToChange);
            editObj.removeEdit();
        });
        editObj.editDiv.select('#submitEditModeDefault').on('click', function () {
            editObj.submitEditMode(optionValues, itemToChange, true);
            editObj.removeEdit();
        });
        editObj.editDiv.select('#exitEditMode').on('click', function () {
            editObj.removeEdit();
        });

        // Click events for increase/decrease font size buttons
        editObj.editDiv.select('#increaseFontSize').on('click', jvEdit.increaseFontSize.bind(this, editObj));
        editObj.editDiv.select('#decreaseFontSize').on('click', jvEdit.decreaseFontSize.bind(this, editObj));
    }

    /**
    * @name changeFontSize
    * @desc Increases or decreases font size by a certain increment
    * @param {integer} increment - number of increment
    * @return {undefined} - no return
    */
    changeFontSize(increment) {
        var editObj = this;
        editObj.chartDiv.selectAll('text').each(function () {
            jvEdit.updateFont(this, increment, editObj.onFontSize);
        });
        editObj.chartDiv.selectAll('.text').each(function () {
            jvEdit.updateFont(this, increment, editObj.onFontSize);
        });
    }

    /**
    * @name submitEditMode
    * @desc calls save callback on edit mode with edit options
    * @param {object} optionValues - new user options to save
    * @param {object} possibleItemToChange - item that the user clicked (might not be the actual item to update)
    * @param {object} defaultBtnClicked - reset viz option to default
    * @return {undefined} - no return
    */
    submitEditMode(optionValues, possibleItemToChange, defaultBtnClicked) {
        let editObj = this,
            optionArray = optionValues,
            selectedEditOptions = {},
            editValue,
            selectedObj,
            itemToChange = possibleItemToChange;

        for (let i = 0; i < optionArray.length; i++) {
            if (optionArray[i].indexOf('editable-legend') > 0) {
                // change item to change for legend elements
                itemToChange = optionArray[i];
            }
            selectedObj = editObj.editDiv.select('#' + optionArray[i]);
            // see if selected object exists
            if (selectedObj && selectedObj._groups[0] && selectedObj._groups[0][0]) {
                editValue = selectedObj._groups[0][0].value;
                // get selected option from edit div
                if (optionArray[i] === 'editable-content' && editValue === '') {
                    // dont add an empty string to the viz options for editable content
                    break;
                }
                selectedEditOptions[optionArray[i]] = editValue;
                if ((!selectedEditOptions[optionArray[i]]) && optionArray[i].indexOf('content') < 0) {
                    selectedEditOptions[optionArray[i]] = 'default';
                }
            }
        }

        if (defaultBtnClicked) {
            if (itemToChange === 'svg') {
                delete editObj.vizOptions.text;
            }
            delete editObj.vizOptions[itemToChange];
        } else {
            editObj.vizOptions[itemToChange] = selectedEditOptions;
        }

        if (itemToChange === 'svg') {
            delete editObj.vizOptions.svg;
        }

        // save vizOptions
        editObj.onSaveCallback(editObj.vizOptions);
    }

    /**
    * @name applyEditMode
    * @desc applies individual viz option on the visual
    * @param {string} itemToChange - viz option to update
    * @param {object} options - viz option properties
    * @return {undefined} - no return
    */
    applyEditMode(itemToChange, options) {
        var editObj = this,
            object = editObj.chartDiv.select('.' + itemToChange),
            objectGroups = object._groups,
            objectTagName = objectGroups[0][0] ? objectGroups[0][0].tagName.toLowerCase() : null;

        if (itemToChange === 'text') {
            // do something if it is all the text that is being changed
            object = editObj.chartDiv.selectAll('text');
        }

        // options by tagName
        if (objectTagName === 'g') {
            object = editObj.chartDiv.select('.' + itemToChange).selectAll('text');
        } else if (objectTagName === 'rect') {
            if (options['editable-bar']) {
                object.attr('fill', options['editable-bar']);
            }
            if (options['editable-box']) {
                object.attr('fill', options['editable-box']);
            }
        } else if (objectTagName === 'circle') {
            if (options['editable-scatter']) {
                object.attr('fill', options['editable-scatter']);
            }
            if (options['editable-bubble']) {
                object.attr('fill', options['editable-bubble']);
            }
        } else if (objectTagName === 'path') {
            if (options['editable-pie']) {
                object.attr('fill', options['editable-pie']);
            }
        }

        // standard options
        // If a text increment exists, apply it based on the sign of the variable
        if (options.hasOwnProperty('editable-text-increment')) {
            editObj.changeFontSize(options['editable-text-increment']);
        }

        if (options.hasOwnProperty('editable-text-size')) {
            object.style('font-size', options['editable-text-size'] + 'px');
        }
        if (options.hasOwnProperty('editable-text-color')) {
            object.style('fill', options['editable-text-color']);
            object.style('color', options['editable-text-color']);
        }
        if (options.hasOwnProperty('editable-num-format')) {
            let expression = jvEdit.getFormatExpression(options['editable-num-format']);
            object
                .transition()
                .text((d) => {
                    if (!isNaN(d) && typeof expression === 'function') {
                        return (expression(d));
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
    }

    /**
    * @name applyAllEdits
    * @desc applies all viz options in the edit mode object
    * @return {undefined} - no return
    */
    applyAllEdits() {
        let editObj = this;
        for (let option in editObj.vizOptions) {
            if (editObj.vizOptions.hasOwnProperty(option) && editObj.chartDiv.select(option)) {
                editObj.applyEditMode(option, editObj.vizOptions[option]);
            }
        }
    }

    /**
    * @name removeEdit
    * @desc removes edit div from the visual
    * @return {undefined} - no return
    */
    removeEdit() {
        let editObj = this;
        if (editObj.editDiv) {
            editObj.editDiv.html('');
            editObj.editDiv
                .style('display', 'none');
        }
        editObj.editOptions = '';
    }

    /**
    * @name overlayDivPosition
    * @desc function to determine the placement of the div on the visual
    * @param {number} divWidth - width of the comment entry box
    * @param {number} divHeight - height of the comment entry box
    * @param {number} mouseX - x position of the click event
    * @param {number} mouseY - y position of the click event
    * @return {object} - position of div
    */
    overlayDivPosition(divWidth, divHeight, mouseX, mouseY) {
        let editObj = this,
            position = {
                x: mouseX,
                y: mouseY + 10
            };
        if (mouseX > parseInt(editObj.chartDiv.style('width'), 10) / 2) {
            position.x = mouseX - divWidth;
        }
        if (mouseY - divHeight - 10 > 0) {
            position.y = mouseY - divHeight - 10;
        }
        return position;
    }

    /**
    * @name increaseFontSize
    * @desc Increases font size by an increment
    * @return {undefined} - no return
    */
    static increaseFontSize() {
        var editObj = this,
            maxSize = 28;
        if (editObj.fontSizeIncrement < maxSize) {
            editObj.fontSizeIncrement++;
            editObj.changeFontSize(editObj.fontSizeIncrement);
            editObj.vizOptions.text = { 'editable-text-increment': editObj.fontSizeIncrement };
        }
    }

    /**
    * @name decreaseFontSize
    * @desc Decreases font size by an increment
    * @return {undefined} - no return
    */
    static decreaseFontSize() {
        var editObj = this,
            minSize = -12;
        // min size is neg 12 because default size is 12px on our charts
        if (editObj.fontSizeIncrement > minSize) {
            editObj.fontSizeIncrement--;
            editObj.changeFontSize(editObj.fontSizeIncrement);
            editObj.vizOptions.text = { 'editable-text-increment': editObj.fontSizeIncrement };
        }
    }

    /**
    * @name updateFont
    * @desc changes the size of the font by a given increment
    * @param {htmlNode} thisDiv - node to change font size
    * @param {integer} increment - number of increment
    * @param {function} cb - function to run to update font size in edit
    * @return {undefined} - no return
    */
    static updateFont(thisDiv, increment, cb) {
        if (thisDiv && thisDiv.getAttribute('font-size')) {
            thisDiv.setAttribute('font-size', increment + 'px');
        } else if (thisDiv) {
            thisDiv.style.fontSize = increment + 'px';
        }

        cb(increment);
    }

    /**
    * @name populateSelectionsEditMode
    * @desc Initially populates the editDiv if there are vizOptions
    * @param {htmlNode} editDiv - edit mode options div
    * @param {object} vizOptions - current user options to apply to the edit div
    * @return {undefined} - no return
    */
    static populateSelectionsEditMode(editDiv, vizOptions) {
        for (let option in vizOptions) {
            if (vizOptions.hasOwnProperty(option)) {
                let selectedObject = editDiv.select('#' + option)._groups[0][0];
                // default color inputs to gray
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

    /**
    * @name getFormatExpression
    * @desc returns the d3 format expression for a given option
    * @param {string} option - type of data format
    * @return {function} - expression
    */
    static getFormatExpression(option) {
        let expression = '',
            p;
        if (option === 'currency') {
            expression = d3.format('$,');
        } else if (option === 'fixedCurrency') {
            expression = d3.format('($.2f');
        } else if (option === 'percent') {
            p = Math.max(0, d3.precisionFixed(0.05) - 2);
            expression = d3.format('.' + p + '%');
        } else if (option === 'millions') {
            p = d3.precisionPrefix(1e5, 1.3e6);
            expression = d3.formatPrefix('.' + p, 1.3e6);
        } else if (option === 'commas') {
            expression = d3.format(',.0f');
        } else {
            expression = d3.format('');
        }
        return expression;
    }
}
