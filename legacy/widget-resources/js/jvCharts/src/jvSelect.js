/***  jvEdit ***/
function jvSelect(configObj) {
    'use strict';
    var selectObj = this;
    selectObj.chartDiv = configObj.chartDiv;
    selectObj.jvChart = configObj.jvChart;
    selectObj.singleClickCallback = configObj.singleClickCallback;
    selectObj.doubleClickCallback = configObj.doubleClickCallback;

}

function singleClick(selectObj, event) {
    if (typeof selectObj.singleClickCallback === 'function') {
        selectObj.singleClickCallback(event);
    }
}
function dblclick(selectObj, event) {
    if (typeof selectObj.doubleClickCallback === 'function') {
        selectObj.doubleClickCallback(event);
    }
}

/********************************************* Select Mode Functions **************************************************/


export default jvSelect;
