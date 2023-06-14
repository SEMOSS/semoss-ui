'use strict';
import jvCharts from './jvCharts.js';

jvCharts.prototype.getDefaultOptions = getDefaultOptions;

function getDefaultOptions(userOptions = {}) {
    var _vars = {};

    // General Styles/Attributes
    // CONST variables - try to not use in jvCharts as they do not have much context
    _vars.GRAY = '#cccccc';
    _vars.WHITE = '#FFFFFF';
    _vars.BLACK = '#000000';
    _vars.SMALL_STROKE_WIDTH = '1px';
    _vars.light = '#BBBBBB';
    _vars.strokeWidth = '2px';

    // Action Attributes
    _vars.highlightBorderColor = _vars.BLACK;
    _vars.highlightBorderWidth = '2px';

    // Component Specific Styles/Attributes
    _vars.thresholds = 'none'; // if not none, expected to be an array
    _vars.thresholdLegend = false;
    _vars.axisColor = _vars.GRAY;
    _vars.gridLineColor = _vars.WHITE;
    _vars.axisWidth = _vars.strokeWidth;
    _vars.gridLineStrokeWidth = _vars.SMALL_STROKE_WIDTH;
    _vars.displayValues = false;
    _vars.toggleLegend = false;

    // _vars.legendArrowColor = 'c2c2d6';
    // _vars.legendArrowColor = '000000';
    _vars.legendArrowColor = 'e7e7e7';

    _vars.legendMax = 9;
    _vars.gridSize = 12;
    _vars.xReversed = false;
    _vars.yReversed = false;

    // font styles
    _vars.fontSize = '12px';
    _vars.fontColor = _vars.BLACK;
    _vars.xLabelFontSize = 'none';
    _vars.yLabelFontSize = 'none';

    // colorByValue 
    _vars.colorByValue = false;

    // Heatmap Specific Styles/Attributes
    _vars.color = '#ff0000';
    _vars.toggleLegend = false;
    _vars.buckets = '10';
    _vars.opacity = '10';
    _vars.colorLabel = 'none';
    _vars.min = '0';
    _vars.max = '10';
    _vars.domainArray = '';
    _vars.step = '1';
    _vars.quantiles = true;
    _vars.heatLegendSpacing = 2;
    _vars.heatGridSize = 20;
    _vars.colors = [
        '#fbf2d2',
        '#fdedb5',
        '#fee7a0',
        '#ffda84',
        '#ffc665',
        '#feb44e',
        '#fea743',
        '#fd9b3f',
        '#fd8c3c',
        '#fd7735',
        '#fd602f',
        '#fb4b29',
        '#f43723',
        '#ea241e',
        '#e0161c',
        '#d60b20',
        '#c80324',
        '#b10026',
        '#870025',
        '#620023'
    ];
    _vars.clusterColors = [
        '#00009C',
        '#003399',
        '#002FA7',
        '#2A52BE',
        '#0000FF',
        '#8C92AC',
        '#92A1CF',
        '#C4C3D0',
        '#CCCCFF',
        '#F8F8FF',
        '#FFFAFA',
        '#F4C2C2',
        '#FF6961',
        '#FF5C5C',
        '#FF1C00',
        '#FF0800',
        '#FF0000',
        '#CD5C5C',
        '#E34234',
        '#D73B3E'
    ];

    // pie specific
    _vars.pieBorder = _vars.WHITE;
    _vars.pieBorderWidth = _vars.SMALL_STROKE_WIDTH;
    _vars.pieTextColor = _vars.WHITE;
    _vars.emptyLegendSquare = _vars.WHITE;

    // line specific
    _vars.lineCurveType = 'Linear';

    // bar specific
    _vars.displayValuesStackAsPercent = false;
    _vars.displayValuesStackTotal = false;
    _vars.displayYAxisLabel = true;

    _vars.transitionTime = 200;

    // scatter specific
    _vars.toggleZ = true;
    _vars.lineGuide = true;

    // single axis specific
    _vars.singleAxisFillHoverColor = 'red';

    Object.assign(_vars, userOptions);
    return _vars;
}
