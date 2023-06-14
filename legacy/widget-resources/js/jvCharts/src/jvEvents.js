/** *jvEvents
 * Eventing layer on top of JV Charts to allow custom callbacks to be attached to mouse events
 */
'use strict';

import * as d3 from 'd3';
import jvCharts from './jvCharts.js';
import jvComment from './jvComment.js';
import jvEdit from './jvEdit.js';
import jvBrush from './jvBrush.js';

Object.assign(jvCharts.prototype, {
    initializeModes, createDefaultMode, createCommentMode,
    createEditMode, createBrushMode, createSelectMode, toggleModes,
    toggleDefaultMode, toggleCommentMode, toggleEditMode, toggleBrushMode,
    toggleSelectMode, addBrushEvents, registerClickEvents, addTimer, clearTimer
});

let editModeFontSize;

function setEditModeFontSize(size) {
    editModeFontSize = size;
}

function getEditModeFontSize() {
    return editModeFontSize;
}

/**
* @name initializeModes
* @desc function that initializes and creates the chart toolbar
* @return {undefined} - no return
*/
function initializeModes() {
    let chart = this,
        callbacks = chart.config.callbacks, size;

    if (!getEditModeFontSize()) {
        size = chart._vars.fontSize;
        size = Number(size.substr(0, size.indexOf('p')));
        setEditModeFontSize(size);
    }
    // check if callbacks are needed
    if (callbacks) {
        for (let mode in callbacks) {
            // loop through all the types of modes to initialize the mode and register the appropriate events
            if (callbacks.hasOwnProperty(mode) && callbacks[mode]) {
                let camelCaseMode = mode.charAt(0).toUpperCase() + mode.slice(1);
                chart[mode] = chart['create' + camelCaseMode]();
            }
        }
        if (chart.editMode) {
            chart.editMode.applyAllEdits();
        }
        chart.toggleModes(chart.mode);
    } else {
        chart.createDefaultMode();
        // user has not defined any other modes, so just use default mode
        chart.toggleDefaultMode('default-mode');
    }
}

/**
* @name createDefaultMode
* @desc function that initializes and creates the default mode
* @return {undefined} - no return
*/
function createDefaultMode() {
    let chart = this;
    if (chart.config.callbacks && chart.config.callbacks.defaultMode.onBrush) {
        chart.brushMode = chart.createBrushMode(chart.config.callbacks.defaultMode.onBrush);
    }
}

/**
* @name createCommentMode
* @desc function that initializes and creates the comment mode
* @return {jvComment} - created comment mode
*/
function createCommentMode() {
    let chart = this;
    return new jvComment({
        chartDiv: chart.chartDiv,
        comments: chart.config.comments || {},
        onSaveCallback: chart.config.callbacks.commentMode.onSave,
        getMode: function () {
            return chart.mode;
        }
    });
}

/**
* @name createEditMode
* @desc function that initializes and creates the edit mode
* @return {jvEdit} - created edit mode object
*/
function createEditMode() {
    let chart = this;

    return new jvEdit({
        chartDiv: chart.chartDiv,
        vizOptions: chart.config.editOptions || {},
        onSaveCallback: chart.config.callbacks.editMode.onSave,
        onFontSize: setEditModeFontSize,
        fontSize: editModeFontSize
    });
}

/**
* @name createBrushMode
* @desc function that initializes and creates the brush mode
* @param {function} callbackParam - function that is an optional callback for brush mode
* @return {jvBrush} - created brush mode object
*/
function createBrushMode(callbackParam) {
    let chart = this,
        callback = callbackParam;
    if (!callback) {
        if (chart.config.callbacks.brushMode && typeof chart.config.callbacks.brushMode.onBrush === 'function') {
            callback = chart.config.callbacks.brushMode.onBrush;
        } else {
            console.log('no brush callback, pass it into the callbacks option');
            return null;
        }
    }
    return new jvBrush({
        chartDiv: chart.chartDiv,
        jvChart: chart,
        onBrushCallback: callback
    });
}

/**
* @name createSelectMode
* @desc function that initializes and creates the select mode
* @return {boolean} - true since the creation of a mode is only called when callbacks for the mode exist
*/
function createSelectMode() {
    return true;
}

/**
* @name toggleModes
* @desc sets the correct events for the specific mode param
* @param {string} mode - specified mode to toggle to
* @return {undefined} - no return
*/
function toggleModes(mode) {
    let chart = this;
    chart.mode = mode;
    chart.toggleDefaultMode(mode);
    chart.commentMode && chart.toggleCommentMode(mode);
    chart.editMode && chart.toggleEditMode(mode);
    chart.brushMode && chart.toggleBrushMode(mode);
    chart.selectMode && chart.toggleSelectMode(mode);
}

/**
* @name toggleDefaultMode
* @desc updates event listeners for default mode
* @param {string} mode - specified mode to toggle to
* @return {undefined} - no return
*/
function toggleDefaultMode(mode) {
    let chart = this;
    if (mode === 'default-mode') {
        let defaultMode = chart.config.callbacks ? chart.config.callbacks.defaultMode : false,
            entireSvg = chart.chartDiv.select('svg'),
            callbacks;
        // change cursor and show tooltips
        chart.chartDiv.style('cursor', 'default');
        chart.showToolTip = true;

        // return if no callbacks exist
        if (!defaultMode) {
            return;
        }
        callbacks = {
            onDoubleClick: (event, mouse) => {
                if (typeof defaultMode.onDoubleClick === 'function') {
                    defaultMode.onDoubleClick(getEventObj(event, mouse, chart, 'onDoubleClick'));
                }
            },
            onClick: (event, mouse) => {
                // If click was a right-click, ignore
                if (event && event.which === 3) {
                    return;
                }
                if (typeof defaultMode.onClick === 'function') {
                    defaultMode.onClick(getEventObj(event, mouse, chart, 'onSingleClick'));
                }
            },
            onHover: (event, mouse) => {
                if (typeof defaultMode.onHover === 'function') {
                    defaultMode.onHover(getEventObj(event, mouse, chart, 'onHover'));
                }
            },
            onMouseOut: (event, mouse, prevEventData) => {
                if (typeof defaultMode.onMouseOut === 'function') {
                    let newEventData = event;
                    if (prevEventData && (prevEventData.eventType === 'onHover' || prevEventData.eventType === 'onSingleClick')) {
                        newEventData = prevEventData;
                    }
                    defaultMode.onMouseOut(getEventObj(newEventData, mouse, chart, 'onMouseOut'));
                }
            },
            onKeyUp: () => {
                if (typeof defaultMode.onKeyUp === 'function') {
                    let e = d3.event;
                    defaultMode.onKeyUp({
                        eventType: 'onKeyUp',
                        key: e.key,
                        event: e,
                        keyCode: e.keyCode
                    });
                }
            },
            onKeyDown: () => {
                if (typeof defaultMode.onKeyDown === 'function') {
                    let e = d3.event;
                    defaultMode.onKeyDown({
                        eventType: 'onKeyDown',
                        key: e.key,
                        event: e,
                        keyCode: e.keyCode
                    });
                }
            }
        };

        if (defaultMode.onBrush && chart.brushMode) {
            callbacks.mousedown = addBrushMousedown.bind(chart);
            callbacks.mouseup = () => {
                chart.chartDiv.select('svg').on('mousemove', false);
                chart.chartDiv.select('svg').style('cursor', 'default');
                chart.brushMode.removeBrush();
            };
        }
        chart.registerClickEvents(entireSvg, callbacks, chart.config.currentEvent);
    } else {
        // remove tooltips and any highlights
        chart.showToolTip = false;
        chart.removeHighlight();
    }
}

function getEventObj(event, mouse, chart, eventType) {
    let returnObj = {};
    if (event.hasOwnProperty('eventType')) {
        returnObj = event;
    } else {
        returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
        returnObj.mouse = mouse;
    }
    returnObj.eventType = eventType;
    returnObj.clientWidth = chart.chartDiv._groups[0][0].clientWidth;
    returnObj.clientHeight = chart.chartDiv._groups[0][0].clientHeight;
    return returnObj;
}

/**
* @name toggleCommentMode
* @desc updates event listeners for comment mode
* @param {string} mode - specified mode to toggle to
* @return {undefined} - no return
*/
function toggleCommentMode(mode) {
    let chart = this,
        commentObj = chart.commentMode;
    if (mode === 'comment-mode') {
        let entireSvg = chart.chartDiv.select('svg'),
            editObj = chart.editMode,
            callbacks = {
                onDoubleClick: (event, mouse) => {
                    commentObj.makeComment();
                    if (typeof chart.config.callbacks.commentMode.onDoubleClick === 'function') {
                        let returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                        returnObj.eventType = 'onDoubleClick';
                        chart.config.callbacks.commentMode.onDoubleClick(returnObj);
                    }
                },
                onClick: (event, mouse) => {
                    if (typeof chart.config.callbacks.commentMode.onClick === 'function') {
                        let returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                        returnObj.eventType = 'onSingleClick';
                        chart.config.callbacks.commentMode.onClick(returnObj);
                    }
                }
            };
        // clear svg listeners
        chart.registerClickEvents(editObj.chartDiv, {}, chart.config.currentEvent);
        chart.registerClickEvents(entireSvg, callbacks, chart.config.currentEvent);
        // set cursor for comment mode
        chart.chartDiv.style('cursor', 'pointer');
        // add movementlisteners
        chart.chartDiv.selectAll('.min-comment')
            .on('mousedown', function () {
                // logic to move comments
                commentObj.createMoveListener(d3.select(this));
            })
            .on('mouseup', () => {
                if (commentObj.moved) {
                    commentObj.updatePosition(commentObj);
                }
                commentObj.moved = false;
                chart.chartDiv.on('mousemove', false);
            });
    } else {
        commentObj.removeComment();
    }
}

/**
* @name toggleEditMode
* @desc updates event listeners for edit mode
* @param {string} mode - specified mode to toggle to
* @return {undefined} - no return
*/
function toggleEditMode(mode) {
    let chart = this,
        editObj = chart.editMode,
        entireSvg = editObj.chartDiv.select('svg');
    if (mode === 'edit-mode') {
        editObj.chartDiv.style('cursor', 'default');
        entireSvg.selectAll('.event-rect')
            .attr('display', 'none');

        let callbacks = {
            onDoubleClick: (event, mouse) => {
                if (typeof chart.config.callbacks.editMode.onDoubleClick === 'function') {
                    let returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    returnObj.eventType = 'onDoubleClick';
                    chart.config.callbacks.editMode.onDoubleClick(returnObj);
                }
            },
            onClick: (event, mouse) => {
                // edit mode events
                // going to be mouseover to highlight options for whatever piece you hover over
                let classText = d3.select(event.target).attr('class');
                if (classText) {
                    if (classText.indexOf('editable') >= 0) {
                        editObj.displayEdit(mouse, classText);
                    }
                }

                if (typeof chart.config.callbacks.editMode.onClick === 'function') {
                    let returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    returnObj.eventType = 'onSingleClick';
                    chart.config.callbacks.editMode.onClick(returnObj);
                }
            }
        };
        // clear svg listeners
        chart.registerClickEvents(entireSvg, {}, chart.config.currentEvent);
        // add chart div level listeners
        chart.registerClickEvents(editObj.chartDiv, callbacks, chart.config.currentEvent);

        editObj.chartDiv.selectAll('.editable').classed('pointer', true);
    } else {
        // clear chart div level listeners
        editObj.removeEdit();
        entireSvg.selectAll('.editable').classed('pointer', false);
        entireSvg.selectAll('.event-rect')
            .attr('display', 'block');
    }
}

/**
* @name toggleBrushMode
* @desc updates event listeners for brush mode
* @param {string} mode - specified mode to toggle to
* @return {undefined} - no return
*/
function toggleBrushMode(mode) {
    var chart = this;
    if (mode === 'brush-mode' && chart.config.callbacks.brushMode) {
        chart.addBrushEvents();
    }
}

function addTimer(timer) {
    if (!this.timers) {
        this.timers = [];
    }
    this.timers.push(timer);
}

function clearTimer(timer) {
    if (!this.timers) {
        return;
    }
    this.timers.splice(this.timers.indexOf(timer), 1);
}

/**
* @name toggleSelectMode
* @desc updates event listeners for select mode
* @param {string} mode - specified mode to toggle to
* @return {undefined} - no return
*/
function toggleSelectMode(mode) {
    var chart = this;
    if (mode === 'select-mode') {
        let callbacks = {
            onDoubleClick: (event, mouse) => {
                if (typeof chart.config.callbacks.selectMode.onDoubleClick === 'function') {
                    let returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    returnObj.eventType = 'onDoubleClick';
                    chart.config.callbacks.selectMode.onDoubleClick(returnObj);
                }
            },
            onClick: (event, mouse) => {
                if (typeof chart.config.callbacks.selectMode.onClick === 'function') {
                    let returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    returnObj.eventType = 'onSingleClick';
                    chart.config.callbacks.selectMode.onClick(returnObj);
                }
            }
        };
        chart.registerClickEvents(chart.chartDiv.select('svg'), callbacks, chart.config.currentEvent);
    }
}

/**
* @name addBrushEvents
* @desc registers events for brush mode
* @return {undefined} - no return
*/
function addBrushEvents() {
    let chart = this,
        entireSvg = chart.chartDiv.select('svg'),
        callbacks = {
            mousedown: addBrushMousedown.bind(chart),
            mouseup: () => {
                chart.chartDiv.select('svg').on('mousemove', false);
                chart.brushMode.removeBrush();
            }
        };
    chart.registerClickEvents(entireSvg, callbacks, chart.config.currentEvent);
}

/**
* @name addBrushMousedown
* @desc creates mousedown event for brush mode
* @return {undefined} - no return
*/
function addBrushMousedown() {
    var chart = this,
        brushStarted = false,
        brushContainer = chart.chartDiv.select('.' + chart.config.type + '-container').node(),
        entireSvg = chart.chartDiv.select('svg'),
        timeMouseDown = new Date().getTime();
    entireSvg.on('mousemove', () => {
        var timeMouseMove = new Date().getTime();
        if (timeMouseDown > timeMouseMove - 10) {
            // mouse move happend too quickly, chrome bug
            return;
        }
        if (brushStarted) {
            return;
        }
        let containerBox,
            x,
            y,
            mouse;
        if (brushContainer === undefined || brushContainer === null) {
            chart.brushMode.startBrush(d3.event);
            brushStarted = true;
        } else {
            containerBox = brushContainer.getBoundingClientRect();
            mouse = d3.mouse(entireSvg.node());
            x = mouse[0];
            y = mouse[1];

            // Absolute value enforcement for container and mouse offset
            if (containerBox.left < 0) {
                x = x + containerBox.left;
            }

            if (containerBox.top < 0) {
                y = y + containerBox.top;
            }

            if (x < containerBox.right && y < containerBox.bottom && x > containerBox.left && y > containerBox.top) {
                chart.brushMode.startBrush(d3.event);
                brushStarted = true;
            }
        }
    });
}

/**
* @name registerClickEvents
* @desc register handler for jv events
* @param {d3element} svg - d3 selected element to bind events on
* @param {object} callbacks - callbacks to run for each type of click event
* @return {undefined} - no return
*/
function registerClickEvents(svg, callbacks = {}, currentEvent = {}) {
    // using default parameters to show available parts of the callbacks object
    var chart = this,
        down,
        clickedSpot,
        tolerance = 5,
        clickTimer = null,
        CLICK_TIMER = 250,
        node;

    svg.on('mousedown', false);
    svg.on('mouseup', false);
    svg.on('mousemove', false);
    svg.on('mouseout', false);
    svg.on('keyup', false);
    svg.on('focus', false);

    if (typeof callbacks.onHover === 'function' || typeof callbacks.onMouseOut === 'function' || currentEvent.type === 'onSingleClick') {
        registerHoverEvents(svg, callbacks, currentEvent, chart.addTimer.bind(chart), chart.clearTimer.bind(chart));
    }

    if (typeof callbacks.onKeyUp === 'function') {
        svg.on('keyup', callbacks.onKeyUp);
        svg.on('focus', () => { });

        // because of our good friends at MS ..... https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8479637/
        node = svg.node();
        if (typeof node.focus === 'function') {
            node.focus();
        }
    }

    if (typeof callbacks.onKeyDown === 'function') {
        svg.on('keydown', callbacks.onKeyDown);
        svg.on('focus', () => { });

        // because of our good friends at MS ..... https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8479637/
        node = svg.node();
        if (typeof node.focus === 'function') {
            node.focus();
        }
    }

    if (typeof callbacks.mousedown === 'function') {
        svg.on('mousedown', () => {
            down = d3.mouse(svg.node());
            callbacks.mousedown();
        });
    }

    svg.on('mouseup', function () {
        if (typeof callbacks.mouseup === 'function') {
            callbacks.mouseup();
        }
        if (typeof callbacks.onDoubleClick !== 'function') {
            // run single click if double click doesnt exist
            onClickEvent(d3.event, d3.mouse(this), callbacks.onClick);
        } else {
            if (dist(down, d3.mouse(svg.node())) > tolerance) {
                // drag not click so return
                return;
            }
            // need to determine whether single or double click
            if (clickedSpot && dist(clickedSpot, d3.mouse(svg.node())) < tolerance && clickTimer) {
                window.clearTimeout(clickTimer);
                chart.clearTimer(clickTimer);
                clickTimer = null;
                callbacks.onDoubleClick(d3.event, d3.mouse(this), this);
            } else {
                // d3.event and d3.mouse both lose their scope in a timeout and no longer return the expected value, so binding is necessary
                clickTimer = window.setTimeout(onClickEvent.bind(this, d3.event, d3.mouse(this), callbacks.onClick), CLICK_TIMER);
                chart.addTimer(clickTimer);
                clickedSpot = d3.mouse(svg.node());
            }
        }
    });

    function onClickEvent(e, mouse, onClick) {
        if (typeof onClick === 'function') {
            onClick(e, mouse, this);
            chart.clearTimer(clickTimer);
            clickTimer = null;
        }
    }
}

function registerHoverEvents(svg, callbacks, currentEvent, addTimerFunc, clearTimerFunc) {
    let hoverData = {},
        hoverTimer = null,
        HOVER_TIMER = 2000,
        prevEvent = currentEvent,
        debounce = 10;
    svg.on('mouseout', () => {
        if (prevEvent.type === 'onHover' || currentEvent.type === 'onSingleClick') {
            onMouseOutEvent(callbacks.onMouseOut, prevEvent.data);
        }
        hoverTimer = window.clearTimeout(hoverTimer);
        clearTimerFunc(hoverTimer);
        hoverTimer = null;
    });

    svg.on('mousemove', function () {
        if (debounce > 0) {
            debounce--;
            return;
        }
        debounce = 10;

        if (hoverTimer) {
            // determine to clear timer
            if (!sameNode(hoverData.ele, d3.event.target)) {
                // create new timer and assign to hover target ele
                hoverTimer = window.clearTimeout(hoverTimer);
                clearTimerFunc(hoverTimer);
                hoverTimer = null;
            }
            hoverData.ele = d3.event.target;
        } else {
            if (prevEvent.type === 'onHover' || currentEvent.type === 'onSingleClick') {
                if (hoverData.ele && !sameNode(hoverData.ele, d3.event.target)) {
                    onMouseOutEvent(callbacks.onMouseOut, prevEvent.data);
                }
            } else {
                // same element, we want to fire the hover if more than x seconds
                // add timer
                hoverTimer = window.setTimeout(onHoverEvent.bind(this, callbacks.onHover, d3.event, d3.mouse(this)), HOVER_TIMER);
                addTimerFunc(hoverTimer);
            }
            // update hovered ele
            hoverData.ele = d3.event.target;
        }
    });

    function onMouseOutEvent(onMouseOut, prevEventData) {
        if (typeof onMouseOut === 'function') {
            prevEvent.type = 'onMouseOut';
            onMouseOut(hoverData.event, hoverData.mouse, prevEventData);
        }
    }

    function onHoverEvent(onHover, e, m) {
        if (typeof onHover === 'function') {
            hoverData = {
                mouse: m,
                event: e
            };
            onHover(hoverData.event, hoverData.mouse);
            clearTimerFunc(hoverTimer);
            hoverTimer = null;
        }
    }

    function sameNode(node1, node2) {
        let response;
        if (node1 && node2) {
            // both exist, check for equality
            if (node1.classList.value === node2.classList.value) {
                response = true;
            } else {
                response = false;
            }
        } else if (node1 || node2) {
            // one empty and one not
            response = true;
        } else {
            // both null
            response = true;
        }
        return response;
    }
}


/**
* @name dist
* @desc euclidean distance to determine if the mouse moved in between clicks for double click
* @param {array} a - point a
* @param {array} b - point b
* @return {number} - distance between a and b
*/
function dist(a, b) {
    if (a && b && Array.isArray(a) && Array.isArray(b)) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
    }
    return 0;
}
