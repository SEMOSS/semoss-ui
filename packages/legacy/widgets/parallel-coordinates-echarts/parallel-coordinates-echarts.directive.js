'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';

/**
 *
 * @name parallel-coordinates-echarts
 * @desc parallel-coordinates-echarts chart directive for creating and visualizing a column chart
 */

export default angular
    .module('app.parallel-coordinates-echarts.directive', [])
    .directive('parallelCoordinatesEcharts', parcoords);

parcoords.$inject = ['semossCoreService'];

function parcoords(semossCoreService) {
    parCoordsLink.$inject = ['scope', 'ele', 'atts', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: parCoordsLink,
    };

    function parCoordsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        // scope.visualizationCtrl = ctrl[1];

        /** ************* Main Event Listeners ************************/
        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            toolListener,
            modeListener,
            destroyListeners,
            /** *************** ECharts ****************************/
            parcoordsConfig,
            parCoords,
            eChartsConfig = {};

        /**
         * @name initialize
         * @desc creates the visualization on the chart div
         * @returns {void}
         */
        function initialize() {
            // bind listeners
            resizeListener = scope.widgetCtrl.on('resize-widget', resizeViz);
            updateTaskListener = scope.widgetCtrl.on('update-task', setData);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                setData
            );
            addDataListener = scope.widgetCtrl.on('added-data', setData);
            toolListener = scope.widgetCtrl.on(
                'update-tool',
                toolUpdateProcessor
            );
            modeListener = scope.widgetCtrl.on('update-mode', toggleMode);

            scope.$on('$destroy', destroy);

            setData();
        }

        /**
         * @name setData
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var dataTypes,
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                ),
                chartTitle = {},
                uiOptions = angular.extend(sharedTools, individualTools);
            dataTypes = getDataTypes(keys, uiOptions);

            // if (uiOptions.count || uiOptions.count === 0) {
            //     data.values = addCount(data, uiOptions.count);
            // }
            determineResize(
                individualTools.widthFitToScreen,
                individualTools.heightFitToScreen,
                uiOptions.fontSize,
                keys.length,
                data.values.length,
                uiOptions.rotateAxis
            );
            uiOptions.hideLabels = labelsOverlap(
                data,
                uiOptions.fontSize,
                keys
            );
            parcoordsConfig = getConfig(
                data,
                uiOptions,
                keys,
                groupByInfo,
                dataTypes
            );
            // TODO add comments
            // comments: scope.widgetCtrl.getWidget('view.visualization.commentData'),
            if (uiOptions.chartTitle && uiOptions.chartTitle.text) {
                chartTitle = {};
                chartTitle.show = true;
                chartTitle.text = uiOptions.chartTitle.text;
                chartTitle.fontSize = uiOptions.chartTitle.fontSize;
                chartTitle.fontWeight = uiOptions.chartTitle.fontWeight;
                chartTitle.fontFamily = uiOptions.chartTitle.fontFamily;
                chartTitle.fontColor = uiOptions.chartTitle.fontColor;
                chartTitle.padding = uiOptions.chartTitle.padding;
                chartTitle.align = uiOptions.chartTitle.align || 'left';
            }
            eChartsConfig.uiOptions = uiOptions;
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            eChartsConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            eChartsConfig.title = chartTitle;
            eChartsConfig.dataTypes = dataTypes;

            paint(parcoordsConfig);
        }
        /**
         * @name getDataTypes
         * @desc gets the data formatting options for each dimension
         * @param {Object} keys - object of data keys
         * @param {object} options- uiOptions
         */

        function getDataTypes(keys, options) {
            let k,
                i,
                formatDimension,
                dataTypes = [],
                dataTypeObj = {
                    dimensionType: '',
                    dimensionName: '',
                    seriesType: '',
                    seriesName: '',
                };
            for (k = 0; k < keys.length; k++) {
                if (keys[k].model === 'dimension') {
                    dataTypeObj.dimensionType =
                        visualizationUniversal.mapFormatOpts(keys[k]);
                    dataTypeObj.dimensionName = keys[k].alias;
                } else if (keys[k].model === 'series') {
                    dataTypeObj.seriesType =
                        visualizationUniversal.mapFormatOpts(keys[k]);
                    dataTypeObj.seriesName = keys[k].alias;
                }
                if (options.formatDataValues) {
                    for (
                        i = 0;
                        i < options.formatDataValues.formats.length;
                        i++
                    ) {
                        if (
                            options.formatDataValues.formats[i].type ===
                                'Accounting' &&
                            !options.formatDataValues.formats[i].prepend.length
                        ) {
                            options.formatDataValues.formats[i].prepend = '$';
                        }
                        formatDimension =
                            options.formatDataValues.formats[i].dimension;
                        if (formatDimension === dataTypeObj.dimensionName) {
                            dataTypeObj.dimensionType =
                                options.formatDataValues.formats[i];
                        } else if (formatDimension === dataTypeObj.seriesName) {
                            dataTypeObj.seriesType =
                                options.formatDataValues.formats[i];
                        }
                    }
                }
                dataTypes.push(dataTypeObj);
                dataTypeObj = {};
            }
            return dataTypes;
        }

        /**
         * @name labelsOverlap
         * @param {object} data semoss data
         * @param {string} fontSize uioptions font size
         * @param {object} keys semoss keys
         * @desc determines if labels will overlap
         * @return {object} object that determines which dimensions have overlapping labels
         */
        function labelsOverlap(data, fontSize, keys) {
            var axisHeight = ele[0].childNodes[0].offsetHeight,
                uiLabelDefinition = {},
                header,
                numericFontSize = Number(
                    fontSize.substr(0, fontSize.indexOf('p'))
                );
            axisHeight = axisHeight - axisHeight * 0.05; // need to account for bottom padding 5%

            data.values.forEach(function (value) {
                var i;
                for (i = 0; i < value.length; i++) {
                    if (typeof value[i] === 'number') {
                        // echarts handles numbers so labels don't overlap
                        if (!uiLabelDefinition[data.headers[i]]) {
                            uiLabelDefinition[data.headers[i]] = [];
                        } else {
                            continue;
                        }
                    } else if (!uiLabelDefinition[data.headers[i]]) {
                        uiLabelDefinition[data.headers[i]] = [value[i]];
                    } else if (
                        uiLabelDefinition[data.headers[i]].indexOf(value[i]) ===
                        -1
                    ) {
                        uiLabelDefinition[data.headers[i]].push(value[i]);
                    }
                }
            });

            for (header in uiLabelDefinition) {
                if (uiLabelDefinition.hasOwnProperty(header)) {
                    // echarts puts dates on two lines so have to look at half axis height
                    if (
                        isDate(header, keys) &&
                        numericFontSize * uiLabelDefinition[header].length >
                            axisHeight / 2
                    ) {
                        uiLabelDefinition[header] = true;
                    } else if (
                        numericFontSize * uiLabelDefinition[header].length >
                        axisHeight
                    ) {
                        uiLabelDefinition[header] = true;
                    } else {
                        uiLabelDefinition[header] = false;
                    }
                }
            }

            return uiLabelDefinition;
        }

        /**
         * @name isDate
         * @param {string} header header to check for date
         * @param {object} keys semoss keys
         * @return {bool} if true header is a date
         */
        function isDate(header, keys) {
            var i,
                isADate = false;

            for (i = 0; i < keys.length; i++) {
                if (keys[i].alias === header && keys[i].type === 'DATE') {
                    isADate = true;
                }
            }

            return isADate;
        }

        /**
         * @name determineResize
         * @param {boolean} widthFit if user has toggled on fit horizontal
         * @param {boolean} heightFit if user has toggled on fit vertical
         * @param {number} fontSize the size of the font
         * @param {number} numDims number of dimensions
         * @param {number} numVals number of values
         * @param {boolean} rotateAxis if axis is flipped or not
         * @desc if a user wants to expand width, set the width to number of dimensions * 100
         * if a user wants to expand height, take the number of values, multiplied by font size and 1.5 for some extra padding
         * @return {void}
         */
        function determineResize(
            widthFit,
            heightFit,
            fontSize,
            numDims,
            numVals,
            rotateAxis
        ) {
            var chartContainer = ele[0].childNodes[0],
                parent = ele[0];
            if (widthFit) {
                if (rotateAxis) {
                    chartContainer.style.width =
                        Number(fontSize.substr(0, fontSize.indexOf('p'))) *
                            numVals *
                            1.5 +
                        'px';
                    parent.style.overflowY = 'auto';
                } else {
                    chartContainer.style.width =
                        (numDims *
                            (ele[0].clientWidth ||
                                chartContainer.clientWidth)) /
                            1.5 +
                        'px';
                    parent.style.overflowX = 'auto';
                }
            } else {
                chartContainer.style.width = '100%';
            }

            if (heightFit) {
                if (rotateAxis) {
                    chartContainer.style.height =
                        (numDims *
                            (ele[0].clientWidth ||
                                chartContainer.clientWidth)) /
                            1.5 +
                        'px';
                    parent.style.overflowX = 'auto';
                } else {
                    chartContainer.style.height =
                        Number(fontSize.substr(0, fontSize.indexOf('p'))) *
                            numVals *
                            1.5 +
                        'px';
                    parent.style.overflowY = 'auto';
                }
            } else {
                chartContainer.style.height = '100%';
            }

            if (heightFit || widthFit) {
                parent.style.position = 'absolute';
                parent.style.top = '0';
                parent.style.right = '0';
                parent.style.bottom = '0';
                parent.style.left = '0';
            } else {
                parent.style.postion = 'static';
            }
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @param {object} option the parcoords configuration object
         * @returns {void}
         */
        function paint(option) {
            if (parCoords) {
                parCoords.clear();
                parCoords.dispose();
            }
            // TODO also think about abstracting some of these options to variables for more customizabilty from uiOptions
            parCoords = echarts.init(ele[0].firstElementChild);
            initializeEvents();
            if (eChartsConfig.title && eChartsConfig.title.text) {
                option.title = {
                    show: eChartsConfig.title.show,
                    text: eChartsConfig.title.text,
                    textStyle: {
                        fontSize: eChartsConfig.title.fontSize || 18,
                        color: eChartsConfig.title.fontColor || '#000000',
                        fontWeight: eChartsConfig.title.fontWeight || 'normal',
                        fontFamily:
                            eChartsConfig.title.fontFamily || 'sans-serif',
                    },
                    left: eChartsConfig.title.align,
                    top: '10px',
                };
            }
            option.textStyle = {
                fontFamily: 'Inter',
            };
            // use configuration item and data specified to show chart
            EchartsHelper.setOption(parCoords, option);
            // Add event listeners
            // TODO figure out comment / brush / eventing paradigm
        }

        /**
         * @name initializeEvents
         * @desc creates the event layer
         * @returns {void}
         */
        function initializeEvents() {
            if (typeof destroyListeners === 'function') {
                destroyListeners();
            }

            destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                parCoords,
                {
                    cb: eChartsConfig.callbacks.defaultMode,
                    header: '',
                    getCurrentEvent: function () {
                        return scope.widgetCtrl.getEvent('currentEvent');
                    },
                }
            );

            // Context Menu
            // parCoords.on('contextmenu', function (e) {
            //     scope.visualizationCtrl.setContextMenuDataFromClick(e, {name: null});
            // });
            // parCoords._dom.addEventListener('contextmenu', scope.visualizationCtrl.openContextMenu);

            EchartsHelper.initializeCommentMode({
                comments: eChartsConfig.comments,
                currentMode: eChartsConfig.currentMode,
                saveCb: eChartsConfig.callbacks.commentMode.onSave,
            });
        }

        /**
         * @name toolUpdateProcessor
         * @param {object} toolUpdateConfig information passed from message service
         * @desc routes tools when they are used (ie add count)
         * @return {void}
         */
        function toolUpdateProcessor(toolUpdateConfig) {
            if (toolUpdateConfig) {
                if (toolUpdateConfig.fn === 'heightFitToScreen') {
                    heightFitToScreen();
                } else if (toolUpdateConfig.fn === 'widthFitToScreen') {
                    widthFitToScreen();
                } else if (toolUpdateConfig.fn === 'smoothLine') {
                    smoothLine();
                } else if (toolUpdateConfig.fn === 'drillDown') {
                    drillDown();
                }
            }
            // setData();
        }

        /**
         * @name drillDown
         * @desc filter the data based on the selections
         * @returns {void}
         */
        function drillDown() {
            var dimensionObj =
                    parCoords._api.getCoordinateSystems()[0]._axesMap.data,
                dimensionDetails = [],
                data,
                selectedData = [],
                dimIdx,
                dimensionName,
                dimType,
                activeIntervals,
                intervalIdx,
                components = [],
                replaceUnderscores = false,
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                );

            for (const dim in dimensionObj) {
                if (dimensionObj.hasOwnProperty(dim)) {
                    dimensionDetails.push(dimensionObj[dim].model);
                }
            }

            for (dimIdx = 0; dimIdx < dimensionDetails.length; dimIdx++) {
                activeIntervals = dimensionDetails[dimIdx].activeIntervals;
                if (activeIntervals && activeIntervals.length > 0) {
                    dimensionName = dimensionDetails[dimIdx].name;
                    dimType = dimensionDetails[dimIdx].subType; // category or value (number)
                    data = dimensionDetails[dimIdx].option.data;

                    if (dimType === 'category') {
                        replaceUnderscores = false;
                        // the keys and the dimensionDetails match by index
                        if (keys[dimIdx].type === 'STRING') {
                            replaceUnderscores = true;
                        }

                        selectedData = [];
                        for (
                            intervalIdx = activeIntervals[0][0];
                            intervalIdx <= activeIntervals[0][1];
                            intervalIdx++
                        ) {
                            if (replaceUnderscores) {
                                selectedData.push(String(data[intervalIdx]));
                            } else {
                                selectedData.push(data[intervalIdx]);
                            }
                        }

                        dimensionName = keys[dimIdx].alias;

                        if (selectedData.length > 0) {
                            components.push(
                                {
                                    type: 'variable',
                                    components: [
                                        scope.widgetCtrl.getFrame('name'),
                                    ],
                                },
                                {
                                    type: 'setFrameFilter',
                                    components: [
                                        [
                                            {
                                                type: 'value',
                                                alias: dimensionName,
                                                comparator: '==',
                                                values: selectedData,
                                            },
                                        ],
                                    ],
                                    terminal: true,
                                }
                            );
                        }
                    } else if (dimType === 'value') {
                        dimensionName = keys[dimIdx].alias;
                        components.push(
                            {
                                type: 'variable',
                                components: [scope.widgetCtrl.getFrame('name')],
                            },
                            {
                                type: 'setFrameFilter',
                                components: [
                                    [
                                        {
                                            type: 'value',
                                            alias: dimensionName,
                                            comparator: '==',
                                            values: activeIntervals[0],
                                        },
                                    ],
                                ],
                                terminal: true,
                            }
                        );
                    }
                }
            }
            if (components.length > 0) {
                components.push({
                    type: 'refreshInsight',
                    components: [scope.widgetCtrl.insightID],
                    terminal: true,
                });

                scope.widgetCtrl.execute(components);
            }
        }

        function smoothLine() {
            var selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                smooth = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.individual.' +
                        selectedLayout +
                        '.smoothLine'
                ),
                individual = {
                    ParallelCoordinates: {},
                };

            individual[selectedLayout].smoothLine = !smooth;
            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: {
                                individual,
                            },
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools'],
                    terminal: true,
                },
            ]);
        }

        function widthFitToScreen() {
            var selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                adjustWidth = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.individual.' +
                        selectedLayout +
                        '.widthFitToScreen'
                ),
                individual = {
                    ParallelCoordinates: {},
                };

            individual[selectedLayout].widthFitToScreen = !adjustWidth;
            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: {
                                individual,
                            },
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools'],
                    terminal: true,
                },
            ]);
        }

        function heightFitToScreen() {
            var selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                adjustHeight = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.individual.' +
                        selectedLayout +
                        '.heightFitToScreen'
                ),
                individual = {
                    ParallelCoordinates: {},
                };

            individual[selectedLayout].heightFitToScreen = !adjustHeight;
            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: {
                                individual,
                            },
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools'],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name toggleMode
         * @desc switches the jv mode to the new specified mode
         * @returns {void}
         */
        function toggleMode() {
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
        }

        /**
         * @name resizeViz
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz() {
            parCoords.resize();
        }

        /**
         * @name getSchema
         * @param {array} headers display headers
         * @param {array} rawHeaders headers as they are
         * @desc builds the schema array
         * @return {array} array of objects with schema information per header
         */
        function getSchema(headers, rawHeaders) {
            return headers.map(function (header, idx) {
                return {
                    name: rawHeaders[idx],
                    index: idx,
                    text: header,
                };
            });
        }

        /**
         * @name getKeysTypeMap
         * @param {object} keys the visualization keys
         * @desc makes a map with key aliases as props and the keys type as values
         * @return {object} object of the key aliases mapped to their types
         */
        function getKeysTypeMap(keys) {
            var typeMap = {};
            keys.forEach(function (key) {
                typeMap[key.alias] = key.type;
            });

            return typeMap;
        }

        /**
         * @name getParallelAxis
         * @param {array} schema the schema data from the configuration object
         * @param {object} chartData the chart data
         * @param {objecy} keys the visualization keys
         * @param {boolean} uiOptions  Semoss uiOptions
         * @param {Array} dataTypes array with dataTypes objects for formatting
         * @desc builds parallel axis object, adding appropriate flags depending on data type
         * @return {array} array of axis configurations
         */
        function getParallelAxis(
            schema,
            chartData,
            keys,
            uiOptions,
            dataTypes
        ) {
            let schemaData = schema.map(function (data, idx) {
                var parallelAxisObj = {
                        dim: idx,
                        name: cleanValue(data.text),
                    },
                    typeMap = getKeysTypeMap(keys);
                if (uiOptions.formatDataValues.formats) {
                    //  check to see if format is being applied
                    for (let i = 0; i < dataTypes.length; i++) {
                        if (
                            dataTypes[i].dimensionName ===
                            parallelAxisObj.name.split(' ').join('_')
                        ) {
                            parallelAxisObj.axisLabel = {
                                // keeping dimensions and series separate
                                formatter: function (value) {
                                    return EchartsHelper.formatLabel(
                                        value,
                                        dataTypes[i].dimensionType
                                    )
                                        .toString()
                                        .replace(/_/g, ' ');
                                },
                            };
                        } else if (
                            dataTypes[i].seriesName ===
                            parallelAxisObj.name.split(' ').join('_')
                        ) {
                            parallelAxisObj.axisLabel = {
                                formatter: function (value) {
                                    return EchartsHelper.formatLabel(
                                        value,
                                        dataTypes[i].seriesType
                                    )
                                        .toString()
                                        .replace(/_/g, ' ');
                                },
                            };
                        }
                    }
                }
                if (uiOptions.hideLabels[data.text]) {
                    if (!parallelAxisObj.axisLabel) {
                        parallelAxisObj.axisLabel = {};
                    }
                    parallelAxisObj.axisLabel.color = 'transparent';
                    parallelAxisObj.axisTick = {
                        show: false,
                    };
                }
                // if this data is a string we need to add special flags and refeed echarts the data
                if (typeMap[schema[idx].text] === 'STRING') {
                    parallelAxisObj.type = 'category';
                    parallelAxisObj.data = chartData
                        .map(function (dataPoint) {
                            return dataPoint[idx];
                        })
                        .filter(function (value, index, self) {
                            // need to assert uniqueness
                            return self.indexOf(value) === index;
                        });
                } else if (typeMap[schema[idx].text] === 'DATE') {
                    parallelAxisObj.type = 'time';
                }

                // sets min max thru echarts
                // parallelAxisObj.min = 'dataMin';
                // parallelAxisObj.max = 'dataMax';

                if (uiOptions.rotateAxis) {
                    parallelAxisObj.nameLocation = 'end';
                }
                return parallelAxisObj;
            });
            return schemaData;
        }

        /**
         * @name getParallelAxisDefault
         * @param {object} uiOptions semoss uiOptions
         * @desc gets default values for axes
         * @return {object} keys and props for default values
         */
        function getParallelAxisDefault(uiOptions) {
            let fontSize = uiOptions.fontSize
                    ? uiOptions.fontSize.substring(
                          0,
                          uiOptions.fontSize.indexOf('p')
                      )
                    : 12,
                fontColor = uiOptions.fontColor || 'black';
            return {
                // type: 'value',
                name: 'parcoords', // really not sure what this is
                nameLocation: 'end',
                nameGap: 20,
                nameTextStyle: {
                    fontWeight:
                        parseInt(uiOptions.axis.name.fontWeight, 10) || 400,
                    fontSize:
                        parseFloat(uiOptions.axis.name.fontSize) || fontSize,
                    fontFamily: uiOptions.axis.name.fontFamily || 'Inter',
                    color: uiOptions.axis.name.fontColor || fontColor,
                },
                axisLine: {
                    lineStyle: {
                        color: uiOptions.axis.borderColor,
                        width: parseFloat(uiOptions.axis.borderWidth),
                    },
                },
                axisTick: {
                    lineStyle: {
                        color: uiOptions.axis.borderColor,
                        width: parseFloat(uiOptions.axis.borderWidth),
                    },
                },
                splitLine: {
                    show: false,
                },
                axisLabel: {
                    formatter: function (value) {
                        if (typeof value === 'string') {
                            return value.replace(/_/g, ' ');
                        }
                        return value;
                    },
                    fontWeight:
                        parseInt(uiOptions.axis.label.fontWeight, 10) || 400,
                    fontSize:
                        parseFloat(uiOptions.axis.label.fontSize) || fontSize,
                    fontFamily: uiOptions.axis.label.fontFamily || 'Inter',
                    color: uiOptions.axis.label.fontColor || fontColor,
                },
            };
        }
        /**
         * @name getSeries
         * @param {object} data chart data
         * @param {string} uiOptions  Semoss uiOptions
         * @desc series for parcoords echarts is the line groupings.
         * @return {object} series config object
         */
        function getSeries(data, uiOptions) {
            var lineStyle,
                series = [],
                prop,
                colorsIdx = 0;

            for (prop in data) {
                if (data.hasOwnProperty(prop)) {
                    lineStyle = {
                        normal: {
                            width: 1.3,
                            opacity: 0.75,
                            color: uiOptions.color[colorsIdx],
                        },
                    };
                    series.push({
                        name: prop,
                        type: 'parallel',
                        lineStyle: lineStyle,
                        data: data[prop],
                        animation: false,
                        smooth: !!uiOptions.smoothLine,
                        inactiveOpacity: 0.05,
                        activeOpacity: 1,
                    });
                    colorsIdx++;
                }
            }

            return series;
        }
        // /**
        //  * @name getToolTip
        //  * @param {array} schema schema data for chart
        //  * @desc builds tooltip config object
        //  * @return {object} tooltip config object
        //  */
        // function getToolTip(schema) {
        //     return {
        //         padding: 10,
        //         backgroundColor: '#222',
        //         borderColor: '#777',
        //         borderWidth: 1,
        //         trigger: 'item',
        //         formatter: function (obj) {
        //             var value = obj.value,
        //                 i, text;
        //             text = '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">' +
        //                 obj.seriesName + ' ' + value[0] +
        //                 value[7] +
        //                 '</div>';
        //             for (i = 1; i < schema.length; i++) {
        //                 text += schema[i].text + ': ' + value[i] + '<br>';
        //             }

        //             return text;
        //         }
        //     };
        // }

        /**
         * @name getParallel
         * @param {object} uiOptions Semoss uiOptions
         * @param {object} groupByInfo facet info
         * @desc gets parallel property object
         * @return {object} configured object for current Chart
         */
        function getParallel(uiOptions, groupByInfo) {
            var parallelObj = {
                right: '15%',
                bottom: 60,
                left: 80,
                parallelAxisDefault: getParallelAxisDefault(uiOptions),
            };

            if (uiOptions.chartTitle.text.length) {
                parallelObj.top = uiOptions.chartTitle.fontSize + 82;
            } else {
                parallelObj.top = 100;
            }

            if (uiOptions.toggleLegend) {
                parallelObj.bottom += 10;
            }
            if (groupByInfo && groupByInfo.viewType === 'Individual Instance') {
                parallelObj.bottom += 30;
            }

            if (uiOptions.rotateAxis) {
                parallelObj.layout = 'vertical';
            }

            return parallelObj;
        }

        /**
         * @name getParcoordsData
         * @param {object} data Semoss chart data
         * @param {object} keys Semoss keys data
         * @desc transforms the data to an object of property names to values in a part
         * of that property, in order to color and use the legend correctly. If there is no
         * series specified by the user, the object property will be 'All'.
         * @return {object} {property: values, property: values} or {All: values}
         */
        function getParcoordsData(data, keys) {
            var parcoordsData = {},
                seriesIndex,
                dateIndex = getDateIndices(keys, data.headers),
                semossData = JSON.parse(JSON.stringify(data)); // keeping semoss data immutable

            if (hasSeries(keys)) {
                // if there is a series, all the data needs to be
                // in an object with a key/value pair where
                // the key name is the name of the series for the legend label,
                // and then all the values for that series
                seriesIndex = getSeriesIndex(keys, data.headers);
                semossData.values.forEach(function (value) {
                    if (dateIndex.length > 0) {
                        dateIndex.forEach(function (idx) {
                            convertToDate(value, idx);
                        });
                    }
                    if (parcoordsData.hasOwnProperty(value[seriesIndex])) {
                        parcoordsData[value[seriesIndex]].push(value);
                    } else {
                        parcoordsData[value[seriesIndex]] = [value];
                    }
                });
            } else {
                // legend label will be all
                parcoordsData.All = [];
                semossData.values.forEach(function (value) {
                    if (dateIndex.length > 0) {
                        dateIndex.forEach(function (idx) {
                            convertToDate(value, idx);
                        });
                    }
                    parcoordsData.All.push(value);
                });
            }

            return parcoordsData;
        }

        /**
         * @name convertToDate
         * @param {array} value value array in semoss data.values
         * @param {number} dateIdx position of date value to mutate
         * @desc converts date value for echarts ie 2016-1-23
         * @return {void}
         */
        function convertToDate(value, dateIdx) {
            // example of semoss date: Jan 3, 2007
            var date = value[dateIdx],
                year,
                month,
                day;

            date = date.split(', ');
            year = date[1];
            month = monthToNumber(date[0].split(' ')[0]);
            day = date[0].split(' ')[1];

            value[dateIdx] = +echarts.number.parseDate(
                [year, month, day].join('-')
            );
        }

        /**
         * @name monthToNumber
         * @param {string} month semoss month
         * @desc converts semoss month to number (1 index)
         * @return {number} number of month
         */
        function monthToNumber(month) {
            var months = [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                ],
                i;

            for (i = 0; i < months.length; i++) {
                if (months[i] === month) {
                    return i + 1;
                }
            }

            return -1;
        }

        /**
         * @name hasSeries
         * @param {object} keys Semoss keys data
         * @desc determines if the user has selected a series for the vi
         * @return {boolean} true if series has been selected
         */
        function hasSeries(keys) {
            var hasSerie = false;

            keys.forEach(function (key) {
                if (key.model === 'series') {
                    hasSerie = true;
                }
            });

            return hasSerie;
        }

        /**
         * @name getSeriesIndex
         * @param {object} keys Semoss keys object
         * @param {object} headers Semoss headers
         * @desc determines what position the series value will be in in Semoss' chart data.values
         * @return {number} the aforementioned position
         */
        function getSeriesIndex(keys, headers) {
            var series, i;

            for (i = 0; i < keys.length; i++) {
                if (keys[i].model === 'series') {
                    series = headers.indexOf(keys[i].alias);
                    break;
                }
            }

            return series;
        }

        /**
         * @name getDateIndex
         * @param {object} keys Semoss keys object
         * @param {object} headers Semoss headers
         * @desc determines what position the date value will be in in Semoss' chart data.values
         * @return {number} the aforementioned position
         */
        function getDateIndices(keys, headers) {
            var date = [],
                i;

            for (i = 0; i < keys.length; i++) {
                if (keys[i].type === 'DATE') {
                    date.push(headers.indexOf(keys[i].alias));
                }
            }

            return date;
        }

        /**
         * @name getLegend
         * @param {object} ui Semoss uiOptions
         * @param {object} data parcoords data from the getParcoordsData function
         * @param {object} groupByInfo facet info
         * @desc configures echarts legend configuration object
         * @return {object} echarts legend configuration object
         */
        function getLegend(ui, data, groupByInfo) {
            var legendObj = {},
                name;
            legendObj.show = ui.toggleLegend;
            legendObj.bottom = 30;
            legendObj.data = [];
            for (name in data) {
                if (data.hasOwnProperty(name)) {
                    legendObj.data.push(name);
                }
            }
            legendObj.itemGap = 20;
            legendObj.type = 'scroll';
            legendObj.pageButtonPosition = 'start';
            legendObj.formatter = function (value) {
                return cleanValue(value);
            };
            legendObj.textStyle = {
                color: ui.legend.fontColor || ui.fontColor || '#000000',
                fontSize: parseFloat(ui.legend.fontSize) || ui.fontSize || 12,
                fontFamily: ui.legend.fontFamily || 'Inter',
                fontWeight: ui.legend.fontWeight || 400,
            };

            // TODO add formatter to clean underscores

            if (groupByInfo && groupByInfo.viewType === 'Individual Instance') {
                legendObj.bottom += 30;
            }

            return legendObj;
        }

        /**
         * @name getBackgroundColorStyle
         * @desc customize the background style of the canvas
         * @param {string} watermark - string of the watermark text
         * @returns {Object} - canvas details
         */
        function getBackgroundColorStyle(watermark) {
            if (/\S/.test(watermark)) {
                return {
                    type: 'pattern',
                    image: paintWaterMark(watermark),
                    repeat: 'repeat',
                };
            }

            return false;
        }

        /**
         * @name paintWaterMark
         * @desc paints a custom watermark on the viz
         * @param {string} watermark - string of the watermark text
         * @returns {Object} - canvas details
         */
        function paintWaterMark(watermark) {
            var canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');
            canvas.width = canvas.height = 100;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 0.08;
            ctx.font = '20px Microsoft Yahei';
            ctx.translate(50, 50);
            ctx.rotate(-Math.PI / 4);
            if (watermark) {
                ctx.fillText(watermark, 0, 0);
            }
            return canvas;
        }

        /**
         * @name formatDataForGroupBy
         * @desc formats data when Group By exists
         * @param {object} data orginial data
         * @param {object} groupBy groupBy object
         * @returns {void}
         */
        function formatDataForGroupBy(data, groupBy) {
            var formattedData = data,
                groupByIndex,
                name,
                i,
                j,
                instanceIdx,
                returnObj = {};

            // TODO remove underscores
            groupBy.selectedDim = groupBy.selectedDim;
            for (j = 0; j < groupBy.uniqueInstances.length; j++) {
                if (typeof groupBy.uniqueInstances[j] === 'string') {
                    groupBy.uniqueInstances[j] = groupBy.uniqueInstances[j];
                }
            }

            if (groupBy.viewType === 'Individual Instance') {
                groupByIndex = data.headers.indexOf(groupBy.selectedDim);
                if (groupByIndex === -1) {
                    // return data;
                    groupByIndex = data.headers.length;
                }

                if (typeof groupBy.instanceIndex === 'string') {
                    instanceIdx = parseInt(groupBy.instanceIndex, 10);
                }
                // Create name for title
                name =
                    groupBy.selectedDim +
                    ' : ' +
                    groupBy.uniqueInstances[instanceIdx];
                // Remove Group By dimension from data headers and values
                formattedData.headers.splice(groupByIndex, 1);
                formattedData.rawHeaders.splice(groupByIndex, 1);

                // Remove any added data from brush/click
                for (i = 0; i < data.values.length; i++) {
                    if (
                        data.values[i][groupByIndex] !==
                        groupBy.uniqueInstances[instanceIdx]
                    ) {
                        data.values.splice(i, 1);
                        i--;
                    }
                }

                for (i = 0; i < data.values.length; i++) {
                    data.values[i].splice(groupByIndex, 1);
                }
                returnObj.name = name;
                returnObj.data = data;
            }

            return returnObj;
        }

        /**
         * @name countDimensions
         * @param {object} keys Semoss keys
         * @desc builds and returns chart config
         * @return {bool} whether or not there are at least 2 dimensions
         */
        function countDimensions(keys) {
            var i,
                count = 0;

            for (i = 0; i < keys.length; i++) {
                if (
                    keys[i].model === 'dimension' ||
                    keys[i].model === 'series'
                ) {
                    count++;
                }
            }
            if (count > 1) {
                return true;
            }
            return false;
        }

        /**
         * @name convertSeriesOrder
         * @param {*} data the data to convert
         * @param {*} keys the dimension details
         * @desc this function will go throug hand reorganize the order the the series dimension to be the right-most dim
         * @returns {void}
         */
        function convertSeriesOrder(data, keys) {
            var keyIdx, series, indexOfSeries, headerIdx;

            for (keyIdx = 0; keyIdx < keys.length; keyIdx++) {
                if (keys[keyIdx].model === 'series') {
                    series = keys[keyIdx].alias;
                    break;
                }
            }

            // if series exist, we will try to swap the order of the series in the data to be right-most because we want it painted that way
            if (series) {
                for (
                    headerIdx = 0;
                    headerIdx < data.headers.length;
                    headerIdx++
                ) {
                    if (data.headers[headerIdx] === series) {
                        indexOfSeries = headerIdx;
                        break;
                    }
                }

                if (typeof indexOfSeries !== 'undefined') {
                    // we will swap the order of series to be the end of the array
                    let tempHeader = data.headers.splice(indexOfSeries, 1),
                        tempRawHeader = data.rawHeaders.splice(
                            indexOfSeries,
                            1
                        );

                    data.headers.push(tempHeader[0]);
                    data.rawHeaders.push(tempRawHeader[0]);

                    data.values.forEach(function (value) {
                        let tempVal = value.splice(indexOfSeries, 1);
                        value.push(tempVal[0]);
                    });
                }
            }
        }

        /**
         * @name getConfig
         * @param {object} tempData Semoss chart data
         * @param {object} uiOptions Semoss uiOptions
         * @param {object} keys Semoss keys
         * @param {object} groupByInfo Semoss group by
         * @param {Array} dataTypes array with dataTypes objects used for formatting
         * @desc builds and returns chart config
         * @return {object} chart config
         */
        function getConfig(tempData, uiOptions, keys, groupByInfo, dataTypes) {
            var schema,
                option = {},
                groupBy = {},
                parcoordsData,
                enoughDimensions = countDimensions(keys),
                backgroundColorStyle,
                dataEmpty,
                data = tempData;

            // data = cleanUnderscores(data);

            if (groupByInfo && groupByInfo.viewType) {
                groupBy = formatDataForGroupBy(data, groupByInfo);
                data = groupBy.data;
            }

            convertSeriesOrder(data, keys);

            schema = getSchema(data.headers, data.rawHeaders);
            parcoordsData = getParcoordsData(data, keys);

            if (groupByInfo && groupByInfo.viewType && enoughDimensions) {
                dataEmpty = false;

                if (groupByInfo.viewType === 'Individual Instance') {
                    option.graphic = [];
                    if (dataEmpty) {
                        option.graphic = option.graphic.concat({
                            id: 'textGroup',
                            type: 'group',
                            right: 'center',
                            top: 'center',
                            children: [
                                {
                                    type: 'rect',
                                    top: 'center',
                                    right: 'center',
                                    shape: {
                                        width: 200,
                                        height: 40,
                                    },
                                    style: {
                                        fill: '#fff',
                                        stroke: '#999',
                                        lineWidth: 2,
                                        shadowBlur: 8,
                                        shadowOffsetX: 3,
                                        shadowOffsetY: 3,
                                        shadowColor: 'rgba(0,0,0,0.3)',
                                    },
                                },
                                {
                                    type: 'text',
                                    right: 'center',
                                    top: 'center',
                                    style: {
                                        text: 'There is no data for this instance.',
                                        textAlign: 'center',
                                    },
                                },
                            ],
                        });
                    }
                }
            }

            if (!enoughDimensions) {
                option.graphic = [
                    {
                        id: 'textGroup',
                        type: 'group',
                        right: 'center',
                        top: 'center',
                        children: [
                            {
                                type: 'rect',
                                top: 'center',
                                right: 'center',
                                shape: {
                                    width: 400,
                                    height: 40,
                                },
                                style: {
                                    fill: '#fff',
                                    stroke: '#999',
                                    lineWidth: 2,
                                    shadowBlur: 8,
                                    shadowOffsetX: 3,
                                    shadowOffsetY: 3,
                                    shadowColor: 'rgba(0,0,0,0.3)',
                                },
                            },
                            {
                                type: 'text',
                                right: 'center',
                                top: 'center',
                                style: {
                                    text: 'At least two dimensions are required (or one dimension and one series).',
                                    textAlign: 'center',
                                },
                            },
                        ],
                    },
                ];
            }
            backgroundColorStyle = getBackgroundColorStyle(uiOptions.watermark);
            if (backgroundColorStyle) {
                option.backgroundColor = backgroundColorStyle;
            }
            option.legend = getLegend(uiOptions, parcoordsData, groupByInfo);
            // option.tooltip = getToolTip(schema);
            option.parallelAxis = getParallelAxis(
                schema,
                data.values,
                keys,
                uiOptions,
                dataTypes
            );
            option.parallel = getParallel(uiOptions, groupByInfo);
            option.series = getSeries(parcoordsData, uiOptions);
            return option;
        }

        function cleanValue(item) {
            if (typeof item === 'string') {
                return item.replace(/_/g, ' ');
            } else if (typeof item === 'number') {
                return item.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                });
            }
            return item;
        }

        /**
         * @name destroy
         * @desc destroys listeners and dom elements outside of the scope
         * @returns {void}
         */
        function destroy() {
            resizeListener();
            updateTaskListener();
            updateOrnamentsListener();
            addDataListener();
            toolListener();
            modeListener();
        }

        // Start Visualization Creation
        initialize();
    }
}
