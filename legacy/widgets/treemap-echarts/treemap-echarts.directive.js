'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';
import './treemap-echarts.service.js';

export default angular
    .module('app.treemap-echarts.directive', ['app.treemap.service'])
    .directive('treemapEcharts', treemapEcharts);

treemapEcharts.$inject = ['VIZ_COLORS', 'semossCoreService', 'treemapService'];

function treemapEcharts(VIZ_COLORS, semossCoreService, treemapService) {
    treemapChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: treemapChartLink,
    };

    function treemapChartLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        // scope.visualizationCtrl = ctrl[1];
        var dataTypes,
            /** ************* Main Event Listeners ************************/
            resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            /** *************** ECharts ****************************/
            eChartsConfig,
            treemapChart,
            oldKeys = 0,
            oldColors,
            clickTimer,
            oldMode = '',
            hoverTimer;

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
            var selectedLayout = scope.widgetCtrl.getWidget(
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
                createViz = checkKeys(
                    keys,
                    semossCoreService.visualization.getDataTableAlign(keys)
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                groupBy = {},
                groupByInstance,
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                ),
                uiOptions,
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                nonTooltipUpdate = calculateTooltipUpdate(keys.length),
                tempLegendLabels = [],
                i;

            uiOptions = angular.extend(sharedTools, individualTools);
            uiOptions.colorByValue = colorBy;
            getDataTypes(keys, uiOptions);

            if (groupByInfo && groupByInfo.viewType) {
                groupBy = formatDataForGroupBy(data, groupByInfo);
                data = groupBy.data;
                groupByInstance = groupBy.name;
            }

            if (createViz) {
                eChartsConfig = treemapService.getConfig(
                    'treemap',
                    data,
                    uiOptions,
                    semossCoreService.visualization.getDataTableAlign(keys),
                    groupByInstance,
                    keys
                );
                eChartsConfig.comments = scope.widgetCtrl.getWidget(
                    'view.visualization.commentData'
                );
                eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                    scope.widgetCtrl.getMode('selected')
                );
                eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
                eChartsConfig.groupByInfo = groupByInfo;

                if (nonTooltipUpdate) {
                    for (i = 0; i < eChartsConfig.data.length; i++) {
                        tempLegendLabels.push(eChartsConfig.data[i].name);
                    }
                    oldColors = uiOptions.color;
                } else {
                    uiOptions.color = oldColors;
                }

                paint();
            } else {
                return;
            }
        }

        /**
         * @name getDataTypes
         * @desc gets the data formatting options for each dimension
         * @param {Object} keys - object of data keys
         * @param {object} options - uiOptions
         * @returns {void}
         */
        function getDataTypes(keys, options) {
            dataTypes = {
                seriesType: '',
                seriesName: '',
                sizeType: '',
                sizeName: '',
                labelType: '',
                labelName: '',
            };
            let k, i, formatDimension;

            for (k = 0; k < keys.length; k++) {
                if (keys[k].model === 'series') {
                    dataTypes.seriesType = visualizationUniversal.mapFormatOpts(
                        keys[k]
                    );
                    dataTypes.seriesName = keys[k].alias;
                }
                if (keys[k].model === 'label') {
                    dataTypes.labelType = visualizationUniversal.mapFormatOpts(
                        keys[k]
                    );
                    dataTypes.labelName = keys[k].alias;
                }
                if (keys[k].model === 'size') {
                    dataTypes.sizeType = visualizationUniversal.mapFormatOpts(
                        keys[k]
                    );
                    dataTypes.sizeName = keys[k].alias;
                }
            }

            if (options.formatDataValues) {
                for (i = 0; i < options.formatDataValues.formats.length; i++) {
                    formatDimension =
                        options.formatDataValues.formats[i].dimension;
                    if (formatDimension === dataTypes.seriesName) {
                        dataTypes.seriesType =
                            options.formatDataValues.formats[i];
                    }
                    if (formatDimension === dataTypes.labelName) {
                        dataTypes.labelType =
                            options.formatDataValues.formats[i];
                    }
                    if (formatDimension === dataTypes.sizeName) {
                        dataTypes.sizeType =
                            options.formatDataValues.formats[i];
                    }
                }
            }
        }

        /**
         * @name toggleMode
         * @desc switches the jv mode to the new specified mode
         * @returns {void}
         */
        function toggleMode() {
            var mode = scope.widgetCtrl.getMode('selected');
            if (eChartsConfig) {
                eChartsConfig.currentMode = EchartsHelper.getCurrentMode(mode);

                if (
                    eChartsConfig.currentMode === 'zoomMode' &&
                    oldMode !== 'zoomMode'
                ) {
                    // scope.widgetCtrl.alert('warn','Entering zoom mode, you can now click to zoom into a node but click events will not work on Treemap.');
                    paint();
                } else if (
                    oldMode === 'zoomMode' &&
                    eChartsConfig.currentMode !== 'zoomMode'
                ) {
                    // scope.widgetCtrl.alert('warn','Exiting zoom mode, click events will now work on Treemap but you will not be able to click to zoom into a node.');
                    paint();
                }

                oldMode = eChartsConfig.currentMode;
            }
        }

        /**
         * @name calculateTooltipUpdate
         * @param {number} len The length of the keys array being passed in
         * @return {boolean} Whether or not setData is including tooltips
         * @desc Helper function that takes in the length of our current Keys array
         *       and decides whether or not we should repaint. This is to preserve
         *       colors if the only update that occured involved custom tooltips.
         */
        function calculateTooltipUpdate(len) {
            if (oldKeys === 0 || len === 3 || oldKeys === len) {
                oldKeys = len;
                return true;
            }

            oldKeys = len;
            return false;
        }

        /**
         * @name checkKeys
         * @param {array} keys Array containing metadata around our viz's keys
         * @param {Object} keysObj Object containing our keys and header names
         * @return {boolean} Weather or not we should paint our viz
         * @desc Simple keys type checker that ensures our size key is actually a number.
         *       If this is not the case then we throw a warning to let the user know.
         */
        function checkKeys(keys, keysObj) {
            if (keysObj.series === keysObj.label) {
                scope.widgetCtrl.alert(
                    'error',
                    'Having the same column for series and label is currently not supported. Please choose unique columns.'
                );
                return false;
            }

            return true;
        }

        /**
         * @name getBreadCrumbs
         * @return {object} breadcrumbs configuration
         * @desc defines the configuration of the breadcrumbs based on facet
         */
        function getBreadCrumbs() {
            var breadcrumbs = Object.assign(
                {
                    show: true,
                },
                eChartsConfig.breadcrumbStyle
            );

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType === 'Individual Instance'
            ) {
                breadcrumbs.top = 0;
            } else {
                breadcrumbs.bottom = 0;
            }

            return breadcrumbs;
        }

        /**
         * @name generateTooltip
         * @param {Object} instanceData Object that contains the data for the square we are hovering over
         * @return {array} Array of strings that contain the HTML to render for our tooltip
         * @desc Takes in the instance-level data for the current square in treemap that we are hovered
         *       over and creates a tooltip for it. Series, label, and size are always displayed while
         *       custom tooltip params are optional and displayed if used. When the treemap is "grouped",
         *       we display the sum of that category on hover of the grouping.
         */
        function generateTooltip(instanceData) {
            var returnArray = [],
                i,
                j,
                k,
                tempName,
                tempValue,
                tempParent,
                tempChild,
                tooltipType,
                formatDimension;

            // Only show tooltips if we have data or we are in parent mode
            if (instanceData.data.keys || eChartsConfig.options.showParent) {
                tempName = visualizationUniversal.formatValue(
                    instanceData.data.name,
                    dataTypes.labelType
                );
                tempValue = visualizationUniversal.formatValue(
                    instanceData.data.value,
                    dataTypes.sizeType
                );
                // If showing parents and is a parent sum label
                if (
                    eChartsConfig.options.showParent &&
                    !instanceData.data.keys
                ) {
                    if (instanceData.data.children[0].keys) {
                        tempChild = cleanValue(
                            instanceData.data.children[0].keys.sizeName
                        );

                        returnArray = [
                            '<b>' +
                                instanceData.marker +
                                tempName +
                                ' Total for ' +
                                tempChild +
                                ':' +
                                '</b>',
                            '<br><b>' +
                                tempValue +
                                getPercentage(
                                    instanceData.treePathInfo,
                                    instanceData.name,
                                    instanceData.value
                                ) +
                                '</b>',
                        ];
                    } else {
                        returnArray = [
                            '<b>' +
                                instanceData.marker +
                                tempName +
                                ' Total</b>',
                            '<br><b>' +
                                tempValue +
                                getPercentage(
                                    instanceData.treePathInfo,
                                    instanceData.name,
                                    instanceData.value
                                ) +
                                '</b>',
                        ];
                    }
                    // Else is a normal label
                } else {
                    tempParent = visualizationUniversal.formatValue(
                        instanceData.data.parent,
                        dataTypes.seriesType
                    );
                    // calculate percentage of parent here...
                    returnArray = [
                        '<b>' +
                            instanceData.marker +
                            instanceData.data.keys.seriesName +
                            '</b>: ' +
                            tempParent +
                            '<br>',
                        '<b>' +
                            instanceData.data.keys.labelName +
                            '</b>: ' +
                            tempName +
                            '<br>',
                        '<b>' +
                            instanceData.data.keys.sizeName +
                            '</b>: ' +
                            tempValue +
                            getPercentage(
                                instanceData.treePathInfo,
                                instanceData.name,
                                instanceData.value
                            ),
                    ];
                }

                // Add in custom tooltip columns if present
                if (instanceData.data.tooltips) {
                    for (i in instanceData.data.tooltips) {
                        // If our tooltip value is a string, run a replace on the actual value
                        if (instanceData.data.tooltips.hasOwnProperty(i)) {
                            for (k = 0; k < eChartsConfig.keys.length; k++) {
                                if (eChartsConfig.keys[k].alias === i) {
                                    tooltipType =
                                        visualizationUniversal.mapFormatOpts(
                                            eChartsConfig.keys[k]
                                        );
                                }
                            }
                            if (eChartsConfig.options.formatDataValues) {
                                for (
                                    j = 0;
                                    j <
                                    eChartsConfig.options.formatDataValues
                                        .formats.length;
                                    j++
                                ) {
                                    formatDimension =
                                        eChartsConfig.options.formatDataValues
                                            .formats[j].dimension;
                                    if (formatDimension === i) {
                                        tooltipType =
                                            eChartsConfig.options
                                                .formatDataValues.formats[j];
                                    }
                                }
                            }
                            returnArray.push(
                                '<br><b>' +
                                    String(i).replace(/_/g, ' ') +
                                    '</b>: ' +
                                    visualizationUniversal.formatValue(
                                        instanceData.data.tooltips[i],
                                        tooltipType
                                    )
                            );
                        }
                    }
                }

                return returnArray.join('');
            }

            // Return empty to avoid null tooltips
            return [''].join('');
        }

        /**
         * @name getPercentage
         * @param {array} treePathInfo path to selected box
         * @param {array} selectedName name of selected box
         * @param {array} selectedValue value of selected box
         * @return {string} child's calculated percentage of parent box
         * @desc calculate the percentage of the selected box of its parent box
         */
        function getPercentage(treePathInfo, selectedName, selectedValue) {
            var key, parentTotal, parentIdx, percentage;

            if (
                typeof selectedValue === 'undefined' ||
                selectedValue === null
            ) {
                return '';
            }

            if (treePathInfo.length === 2) {
                for (key in treePathInfo) {
                    if (treePathInfo.hasOwnProperty(key)) {
                        if (treePathInfo[key].name === 'Home') {
                            parentTotal = treePathInfo[key].value;
                            break;
                        }
                    }
                }
            } else if (treePathInfo.length === 3) {
                parentIdx = treePathInfo.length - 2;
                parentTotal = treePathInfo[parentIdx].value;
            }

            if (!parentTotal || parentTotal === 0) {
                return '';
            }

            percentage = cleanValue((selectedValue / parentTotal) * 100);

            if (percentage === '100') {
                return '';
            }

            return ' (' + percentage + ' %)';
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
                instanceIdx,
                returnObj = {};

            if (groupBy.viewType === 'Individual Instance') {
                groupByIndex = data.headers.indexOf(groupBy.selectedDim);
                if (groupByIndex === -1) {
                    // return data;
                    groupByIndex = data.headers.length;
                }

                if (typeof groupBy.instanceIndex === 'string') {
                    instanceIdx = parseInt(groupBy.instanceIndex, 0);
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
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (treemapChart) {
                treemapChart.clear();
                treemapChart.dispose();
            }
            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            treemapChart = echarts.init(ele[0].firstElementChild);

            // Set the zoom mode
            if (eChartsConfig.currentMode === 'zoomMode') {
                eChartsConfig.nodeClick = 'zoomToNode';
            } else {
                eChartsConfig.nodeClick = false;
            }

            var option = {},
                i,
                dataEmpty;

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType
            ) {
                dataEmpty = true;
                for (i = 0; i < eChartsConfig.data.length; i++) {
                    if (eChartsConfig.data[i].children.length !== 0) {
                        dataEmpty = false;
                        break;
                    }
                }

                if (
                    eChartsConfig.groupByInfo.viewType === 'Individual Instance'
                ) {
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

            if (eChartsConfig.backgroundColorStyle) {
                option.backgroundColor = eChartsConfig.backgroundColorStyle;
            }
            option.color = eChartsConfig.options.color;
            option.tooltip = {
                show: eChartsConfig.options.showTooltips,
                confine: true,
                formatter: function (info) {
                    var ret = generateTooltip(info);

                    return ret;
                },
                backgroundColor:
                    eChartsConfig.options.tooltip.backgroundColor || '#FFFFFF',
                borderWidth:
                    parseFloat(eChartsConfig.options.tooltip.borderWidth) || 0,
                borderColor: eChartsConfig.options.tooltip.borderColor || '',
                textStyle: {
                    color: eChartsConfig.options.tooltip.fontColor || '#000000',
                    fontFamily:
                        eChartsConfig.options.tooltip.fontFamily || 'Inter',
                    fontSize:
                        parseFloat(eChartsConfig.options.tooltip.fontSize) ||
                        12,
                },
            };
            // TODO::: legend is basically impossible to do with their data format...
            // legend: {
            //     data: eChartsConfig.legendHeaders,
            //     bottom: 55,
            //     itemGap: 7,
            //     borderRadius: [5, 5, 0, 0]
            // },
            option.series = [
                {
                    name: 'Home',
                    type: 'treemap',
                    visibleMin: 300,
                    left: 'center',
                    top: 'middle',
                    label: {
                        show: true,
                        formatter: function (info) {
                            return visualizationUniversal.formatValue(
                                info.name,
                                dataTypes.labelType
                            );
                        },
                    },
                    upperLabel: {
                        normal: Object.assign(
                            {
                                show: eChartsConfig.options.showParent,
                                height: 30,
                                formatter: function (info) {
                                    return visualizationUniversal.formatValue(
                                        info.name,
                                        dataTypes.seriesType
                                    );
                                },
                                padding: [0, 0, 0, 8],
                            },
                            eChartsConfig.upperLabelStyle
                        ),
                    },
                    itemStyle: {
                        normal: {
                            borderColor: '#fff',
                        },
                    },
                    breadcrumb: getBreadCrumbs(),
                    levels: eChartsConfig.options.levels,
                    data: eChartsConfig.data,
                    nodeClick: eChartsConfig.nodeClick,
                },
            ];
            option.animation = eChartsConfig.showAnimation;
            option.animationDuration = eChartsConfig.animationDuration;
            // animationDelay: function (idx) {
            //     return idx * eChartsConfig.animationDelay;
            // },
            option.animationDelay = eChartsConfig.animationDelay;
            option.animationEasing = eChartsConfig.animationType;

            option.textStyle = {
                fontFamily: 'Inter',
            };

            // use configuration item and data specified to show chart
            EchartsHelper.setOption(treemapChart, option);

            // Add event listeners
            // TODO figure out comment / brush / eventing paradigm
            initializeEvents();
        }

        /**
         * @name initializeEvents
         * @desc creates the event layer
         * @returns {void}
         */
        function initializeEvents() {
            /** ******************************************************/
            // Event: On single click open new tab with wikipedia page of selected label
            treemapChart.on('click', eChartClicked);
            treemapChart.on('mouseover', eChartMouse);
            treemapChart.on('mouseout', eChartMouseOut);
            treemapChart._dom.addEventListener('mouseout', mouseOut);

            // Context Menu
            // treemapChart.on('contextmenu', function (e) {
            //     scope.visualizationCtrl.setContextMenuDataFromClick(e, {name: eChartsConfig.legendLabels});
            // });
            // treemapChart._dom.addEventListener('contextmenu', scope.visualizationCtrl.openContextMenu);

            // it is necessary to initialize comment mode so the nodes are painted
            EchartsHelper.initializeCommentMode({
                comments: eChartsConfig.comments,
                currentMode: eChartsConfig.currentMode,
                saveCb: eChartsConfig.callbacks.commentMode.onSave,
            });

            if (
                typeof eChartsConfig.callbacks.defaultMode.onKeyUp ===
                    'function' ||
                typeof eChartsConfig.callbacks.defaultMode.onKeyDown ===
                    'function'
            ) {
                treemapChart._dom.tabIndex = 1;
                if (
                    typeof eChartsConfig.callbacks.defaultMode.onKeyUp ===
                    'function'
                ) {
                    treemapChart._dom.addEventListener('keyup', function (e) {
                        eChartsConfig.callbacks.defaultMode.onKeyUp({
                            eventType: 'onKeyUp',
                            key: e.key,
                            event: e,
                            keyCode: e.keyCode,
                        });
                    });
                }
                if (
                    typeof eChartsConfig.callbacks.defaultMode.onKeyDown ===
                    'function'
                ) {
                    treemapChart._dom.addEventListener('keydown', function (e) {
                        eChartsConfig.callbacks.defaultMode.onKeyDown({
                            eventType: 'onKeyDown',
                            key: e.key,
                            event: e,
                            keyCode: e.keyCode,
                        });
                    });
                }
            }
        }

        /**
         * @name eChartClicked
         * @desc single click event from echarts
         * @param {object} event - echarts event sent back on click
         * @returns {void}
         */
        function eChartClicked(event) {
            if (eChartsConfig.currentMode === 'zoomMode') {
                return;
            }

            if (clickTimer) {
                clearTimeout(clickTimer);
                eventCallback(event, 'onDoubleClick');
            } else {
                clickTimer = setTimeout(
                    eventCallback.bind(null, event, 'onClick'),
                    250
                );
            }
        }

        /**
         * @name eChartMouse
         * @desc onHover event for echarts
         * @param {object} event - echarts event sent back on hover
         * @returns {void}
         */
        function eChartMouse(event) {
            if (hoverTimer) {
                clearTimeout(hoverTimer);
            }
            hoverTimer = setTimeout(
                eventCallback.bind(null, event, 'onHover'),
                2000
            );
        }

        /**
         * @name eChartMouseOut
         * @desc offHover event for echarts
         * @param {object} event - echarts event sent back on offHover
         * @returns {void}
         */
        function eChartMouseOut(event) {
            var currentEvent = scope.widgetCtrl.getEvent('currentEvent');
            if (currentEvent.type === 'onHover') {
                eventCallback(event, 'onMouseOut');
            }
        }

        /**
         * @name mouseOut
         * @desc clears timers on mouse out of canvas
         * @returns {void}
         */
        function mouseOut() {
            clearTimeout(hoverTimer);
        }

        /**
         * @name eventCallback
         * @desc click callback event
         * @param {object} event - echarts event sent back on click
         * @param {string} type - click or double click
         * @returns {void}
         */
        function eventCallback(event, type) {
            var returnObj = {
                data: {},
            };
            returnObj.data[eChartsConfig.legendLabels] = [event.name];
            eChartsConfig.callbacks.defaultMode[type](returnObj);
            clickTimer = null;
            hoverTimer = null;
        }

        /**
         * @name resizeViz
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz() {
            treemapChart.resize();
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
            modeListener();
        }

        // Start Visualization Creation
        initialize();
    }
}
