'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';
import './funnel-echarts.service.js';

/**
 *
 * @name funnel-echarts
 * @desc funnel-echarts chart directive for creating and visualizing a funnel chart
 */

export default angular
    .module('app.funnel-echarts.directive', ['app.funnel.service'])
    .directive('funnelEcharts', funnelEcharts);

funnelEcharts.$inject = ['VIZ_COLORS', 'funnelService', 'visualizationService'];

function funnelEcharts(VIZ_COLORS, funnelService, visualizationService) {
    funnelChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: funnelChartLink,
    };

    function funnelChartLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];

        /** ************* Main Event Listeners ************************/
        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            /** *************** ECharts ****************************/
            eChartsConfig,
            funnelChart,
            clientHeight,
            clientWidth,
            clickTimer,
            hoverTimer,
            destroyListeners;

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

            // cleanup
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
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                groupBy = {},
                groupedData,
                groupByInstance,
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                ),
                uiOptions,
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                valuesMapping,
                i,
                n,
                j,
                k,
                thresh,
                bucketData = [],
                otherValues = [],
                otherArray = [];

            uiOptions = angular.extend(sharedTools, individualTools);
            uiOptions.colorByValue = colorBy;

            if (groupByInfo && groupByInfo.viewType) {
                if (groupByInfo.viewType === 'Individual Instance') {
                    groupBy = formatDataForGroupByIndividual(data, groupByInfo);
                    data = groupBy.data;
                    groupByInstance = groupBy.name;
                } else if (groupByInfo.viewType === 'All Instances') {
                    groupedData = formatDataForGroupByAll(data, groupByInfo);
                    groupByInfo.tempData = groupedData;
                    // Remove empty groups (if filtered)
                    groupByInfo.uniqueInstances = [];
                    for (n = 0; n < Object.keys(groupedData).length; n++) {
                        groupByInfo.uniqueInstances.push(
                            Object.keys(groupedData)[n]
                        );
                    }
                }
            }

            valuesMapping = getValuesMapping(keys, data.headers);

            if (!(groupByInfo && groupByInfo.viewType === 'All Instances')) {
                if (!sharedTools.buckets && data.values.length > 10) {
                    sharedTools.buckets = 10;
                }
                data.values.sort(function (a, b) {
                    return (
                        b[valuesMapping.mappingByModel.value] -
                        a[valuesMapping.mappingByModel.value]
                    );
                });
                if (
                    sharedTools.hasOwnProperty('buckets') &&
                    parseInt(sharedTools.buckets, 10) !== 0
                ) {
                    for (i = 0; i < data.values.length; i++) {
                        thresh = sharedTools.buckets || !sharedTools.buckets;
                        if (i < thresh) {
                            bucketData.push(data.values[i]);
                        } else {
                            for (j = 0; j < data.headers.length; j++) {
                                if (j === valuesMapping.mappingByModel.label) {
                                    otherValues[j] = 'Other';
                                    continue;
                                }
                                if (i === thresh) {
                                    otherValues[j] = 0;
                                }
                                otherValues[j] += data.values[i][j];
                            }
                        }
                    }
                    if (otherValues.length > 0) {
                        for (k = 0; k < otherValues.length; k++) {
                            if (
                                typeof otherValues[k] === 'string' &&
                                otherValues[k] !== 'Other'
                            ) {
                                otherValues[k] = '';
                            }
                        }
                        bucketData.push(otherValues);
                        data.values = bucketData;
                    }

                    data.values.sort(function (a, b) {
                        return (
                            b[valuesMapping.mappingByModel.value] -
                            a[valuesMapping.mappingByModel.value]
                        );
                    });
                }
            }

            eChartsConfig = funnelService.getConfig(
                'funnel',
                data,
                uiOptions,
                colorBy,
                groupByInstance,
                groupByInfo,
                valuesMapping,
                keys
            );
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            eChartsConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            eChartsConfig.groupByInfo = groupByInfo;
            paint();
        }

        /**
         * @name getValueMapping
         * @desc loop through keys and grab value dimension and tooltip info
         * @param {object} keys semoss keys
         * @param {object} headers data headers
         * @returns {void}
         */
        function getValuesMapping(keys, headers) {
            var key,
                mappingByDimension = {},
                mappingByModel = {};

            mappingByModel.tooltip = [];

            for (key in keys) {
                if (keys.hasOwnProperty(key)) {
                    mappingByDimension[keys[key].alias] = headers.indexOf(
                        keys[key].alias
                    );
                    if (keys[key].model === 'tooltip') {
                        mappingByModel.tooltip.push(
                            headers.indexOf(keys[key].alias)
                        );
                    } else {
                        mappingByModel[keys[key].model] = headers.indexOf(
                            keys[key].alias
                        );
                    }
                }
            }
            return {
                mappingByDimension: mappingByDimension,
                mappingByModel: mappingByModel,
            };
        }

        /**
         * @name formatDataForGroupByIndividual
         * @desc formats data when Group By exists
         * @param {object} data orginial data
         * @param {object} groupBy groupBy object
         * @returns {void}
         */
        function formatDataForGroupByIndividual(data, groupBy) {
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
         * @name formatDataForGroupByAll
         * @desc formats data when Group By All Instances exists
         * @param {object} data orginial data
         * @param {object} groupBy groupBy object
         * @returns {void}
         */
        function formatDataForGroupByAll(data, groupBy) {
            var groupByIndex,
                i,
                n,
                dataObj = {};

            groupByIndex = data.headers.indexOf(groupBy.selectedDim);
            data.headers.splice(groupByIndex, 1);
            data.rawHeaders.splice(groupByIndex, 1);

            data.values.sort(function (a, b) {
                return b[1] - a[1];
            });

            for (n = 0; n < groupBy.uniqueInstances.length; n++) {
                dataObj[groupBy.uniqueInstances[n]] = [];
                for (i = 0; i < data.values.length; i++) {
                    if (
                        data.values[i][groupByIndex] ===
                        groupBy.uniqueInstances[n]
                    ) {
                        data.values[i].splice(groupByIndex, 1);
                        dataObj[groupBy.uniqueInstances[n]].push(
                            data.values[i]
                        );
                    }
                }
                // TODO FACET: bucket data
                if (dataObj[groupBy.uniqueInstances[n]].length === 0) {
                    delete dataObj[groupBy.uniqueInstances[n]];
                }
            }

            return dataObj;
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (funnelChart) {
                funnelChart.clear();
                funnelChart.dispose();
            }

            determineResize();
            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            funnelChart = echarts.init(ele[0].firstElementChild);

            var option = {},
                dataEmpty,
                facetLayout,
                titleFontSize,
                dataTypes = eChartsConfig.dataTypes;

            if (
                eChartsConfig.options.facetHeaders &&
                eChartsConfig.options.facetHeaders.titleFontSize
            ) {
                titleFontSize =
                    eChartsConfig.options.facetHeaders.titleFontSize;
            } else {
                titleFontSize = 18;
            }

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType
            ) {
                dataEmpty = true;
                if (
                    eChartsConfig.groupByInfo.viewType === 'Individual Instance'
                ) {
                    if (eChartsConfig.data.data.length !== 0) {
                        dataEmpty = false;
                    }

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
                formatter: function (info) {
                    var returnArray = [],
                        j,
                        k,
                        i,
                        tooltipType,
                        formatDimension;

                    // catch undefined case
                    if (!info.data) {
                        return;
                    }

                    if (info.marker) {
                        returnArray.push(info.marker);
                    }

                    if (info.name) {
                        returnArray.push(
                            '<b>' +
                                visualizationUniversal.formatValue(
                                    info.name,
                                    dataTypes.labelType
                                ) +
                                '</b>' +
                                '<br>'
                        );
                    }

                    if (info.seriesName) {
                        returnArray.push(
                            '' +
                                cleanValue(eChartsConfig.valueDimension) +
                                ': ' +
                                visualizationUniversal.formatValue(
                                    info.value,
                                    dataTypes.valueType
                                ) +
                                ' (' +
                                info.percent +
                                '%)' +
                                '<br>'
                        );
                    }

                    if (info.name !== 'Other') {
                        for (j = 0; j < info.data.tooltip.length; j++) {
                            //get primary db format type
                            for (k = 0; k < eChartsConfig.keys.length; k++) {
                                if (
                                    eChartsConfig.keys[k].alias ===
                                    info.data.tooltip[j].header
                                ) {
                                    tooltipType =
                                        visualizationUniversal.mapFormatOpts(
                                            eChartsConfig.keys[k]
                                        );
                                }
                            }
                            //if user has updated formatting rules in widget, override db format types
                            if (eChartsConfig.options.formatDataValues) {
                                for (
                                    i = 0;
                                    i <
                                    eChartsConfig.options.formatDataValues
                                        .formats.length;
                                    i++
                                ) {
                                    formatDimension =
                                        eChartsConfig.options.formatDataValues
                                            .formats[i].dimension;
                                    if (
                                        formatDimension ===
                                        info.data.tooltip[j].header
                                    ) {
                                        tooltipType =
                                            eChartsConfig.options
                                                .formatDataValues.formats[i];
                                    }
                                }
                            }

                            if (
                                info.data.tooltip[j].header !==
                                eChartsConfig.valueDimension
                            ) {
                                returnArray.push(
                                    '' +
                                        cleanValue(
                                            info.data.tooltip[j].header
                                        ) +
                                        ': ' +
                                        visualizationUniversal.formatValue(
                                            info.data.tooltip[j].value,
                                            tooltipType
                                        ) +
                                        '<br>'
                                );
                            }
                        }
                    }
                    return returnArray.join('');
                },
                trigger: 'item',
                confine: true,
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

            option.legend = {
                type: 'scroll',
                data: eChartsConfig.legendHeaders,
                show: eChartsConfig.showLegend,
                //When legendTop === top pass charttitle font size(Numeric) else pass legendTop (String)  i.e. 'top'
                top:
                    eChartsConfig.options.legend.topalign === 'top' ||
                    eChartsConfig.options.legend.topalign === undefined
                        ? eChartsConfig.title && eChartsConfig.title.show
                            ? eChartsConfig.title.fontSize
                            : 0
                        : eChartsConfig.options.legend.topalign,
                left: eChartsConfig.options.legend.leftalign,
                orient: eChartsConfig.options.legend.orient,
                backgroundColor: eChartsConfig.options.legend.backgroundColor,
                formatter: function (info) {
                    return visualizationUniversal.formatValue(
                        info,
                        dataTypes.labelType
                    );
                },
                textStyle: eChartsConfig.legendLabelStyle,
            };

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType
            ) {
                if (eChartsConfig.groupByInfo.viewType === 'All Instances') {
                    option.legend = {
                        type: 'scroll',
                        data: eChartsConfig.legendHeaders,
                        show: eChartsConfig.showLegend,
                        orient: 'horizontal',
                        left: 'center',
                        bottom: '20px',
                        formatter: function (info) {
                            return cleanValue(info);
                        },
                        textStyle: eChartsConfig.legendLabelStyle,
                    };
                    facetLayout = customizeFacetLayout(eChartsConfig.data);
                    option.title = facetLayout.title.concat([
                        {
                            text:
                                eChartsConfig.options.facetHeaders.titleName ||
                                'All Instances of ' +
                                    eChartsConfig.groupByInfo.selectedDim.replace(
                                        /_/g,
                                        ' '
                                    ),
                            top: '20px',
                            left: 'center',
                            textStyle: {
                                fontSize: titleFontSize,
                            },
                        },
                    ]);
                    eChartsConfig.data = facetLayout.data;
                }
            }
            option.textStyle = {
                fontFamily: 'Inter',
            };
            option.series = eChartsConfig.data;

            // use configuration item and data specified to show chart
            EchartsHelper.setOption(funnelChart, option);

            // Add event listeners
            initializeEvents();
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
         * @name customizeFacetLayout
         * @desc sets grid dimensions based on whether or not datazoom is present
         * @param {obj} data - eChartsConfig.data
         * @returns {obj} - object of grid dimensions
         */
        function customizeFacetLayout(data) {
            var x,
                xRel,
                xTitle,
                y,
                yRel,
                yTitle,
                i,
                title,
                rowIndex,
                columnIndex,
                calculatedGridWidth,
                calculatedGridHeight,
                calculatedSpacingX,
                calculatedSpacingY,
                facetPadding = {
                    // padding within the top and left of the panel
                    top: 100,
                    right: 120,
                    bottom: 100,
                    left: 120,
                },
                titleArray = [],
                dataArray = [];

            for (
                i = 0;
                i < eChartsConfig.groupByInfo.uniqueInstances.length;
                i++
            ) {
                // Define Pie Position
                rowIndex = Math.floor(
                    i / eChartsConfig.options.facetHeaders.numberColumns
                );
                columnIndex =
                    i % eChartsConfig.options.facetHeaders.numberColumns;

                calculatedGridWidth =
                    eChartsConfig.options.facetHeaders.grid.width;
                calculatedGridHeight =
                    eChartsConfig.options.facetHeaders.grid.height;
                calculatedSpacingX =
                    eChartsConfig.options.facetHeaders.spacing.x;
                calculatedSpacingY =
                    eChartsConfig.options.facetHeaders.spacing.y;

                if (eChartsConfig.options.facetHeaders.unitType === '%') {
                    calculatedGridWidth =
                        (ele[0].clientWidth *
                            eChartsConfig.options.facetHeaders.grid.width) /
                        100;
                    calculatedGridHeight =
                        (ele[0].clientHeight *
                            eChartsConfig.options.facetHeaders.grid.height) /
                        100;
                    calculatedSpacingX =
                        (ele[0].clientWidth *
                            eChartsConfig.options.facetHeaders.spacing.x) /
                        100;
                    calculatedSpacingY =
                        (ele[0].clientHeight *
                            eChartsConfig.options.facetHeaders.spacing.y) /
                        100;
                }

                // Define Funnel Size
                data[i].height = calculatedGridHeight + 'px';
                data[i].width = calculatedGridWidth + 'px';

                x =
                    facetPadding.left +
                    (calculatedGridWidth + calculatedSpacingX) * columnIndex;
                y =
                    facetPadding.top +
                    (calculatedGridHeight + calculatedSpacingY) * rowIndex;

                // Center everything
                x =
                    x +
                    (clientWidth -
                        facetPadding.left -
                        facetPadding.right -
                        calculatedGridWidth *
                            eChartsConfig.options.facetHeaders.numberColumns -
                        calculatedSpacingX *
                            (eChartsConfig.options.facetHeaders.numberColumns -
                                1)) /
                        2;

                xRel = (x / clientWidth) * 100 + '%';
                yRel = (y / clientHeight) * 100 + '%';

                data[i].left = xRel;
                data[i].top = yRel;

                xTitle =
                    ((x + calculatedGridWidth / 2) / clientWidth) * 100 + '%';
                yTitle = ((y - 30) / clientHeight) * 100 + '%';

                dataArray.push(data[i]);

                title = getFacetHeaders(
                    eChartsConfig.groupByInfo.uniqueInstances[i],
                    xTitle,
                    yTitle,
                    eChartsConfig.options.facetHeaders
                );
                titleArray.push(title);
            }

            return {
                data: dataArray,
                title: titleArray,
            };
        }

        /**
         * @name getFacetHeaders
         * @desc dynamically adjusts header size to not overlap grid
         * @param {string} text - header text
         * @param {string} x - x position
         * @param {string} y - y position
         * @param {obj} facetHeaders - uiOptions.facetHeaders
         * @returns {obj} - object of grid dimensions
         */
        function getFacetHeaders(text, x, y, facetHeaders) {
            var title = {},
                fontSize;

            if (typeof text === 'string') {
                title.text = text.replace(/_/g, ' ');
            } else {
                title.text = text;
            }

            title.left = x;
            title.top = y;

            if (facetHeaders && facetHeaders.headerFontSize) {
                fontSize = facetHeaders.headerFontSize;
            } else {
                fontSize = 14;
            }

            title.textAlign = 'center';
            title.textStyle = {
                fontSize: fontSize,
            };

            return title;
        }

        /**
         * @name determineResize
         * @desc detemin parent and chart container dimensions if Facet exists
         * @returns {void}
         */
        function determineResize() {
            var chartContainer = ele[0].childNodes[0],
                parent = ele[0],
                numRows,
                numColumns,
                containerHeight,
                containerWidth,
                calculatedGridWidth,
                calculatedGridHeight,
                calculatedSpacingX,
                calculatedSpacingY,
                facetPadding = {
                    // padding within the top and left of the panel
                    top: 100,
                    right: 120,
                    bottom: 100,
                    left: 120,
                };

            parent.style.position = '';
            parent.style.top = '';
            parent.style.right = '';
            parent.style.bottom = '';
            parent.style.left = '';
            parent.style.overflowY = '';
            chartContainer.style.width = '';
            chartContainer.style.height = '';

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType === 'All Instances'
            ) {
                numColumns = eChartsConfig.options.facetHeaders.numberColumns;
                numRows = Math.ceil(
                    eChartsConfig.groupByInfo.uniqueInstances.length /
                        numColumns
                );
                calculatedGridWidth =
                    eChartsConfig.options.facetHeaders.grid.width;
                calculatedGridHeight =
                    eChartsConfig.options.facetHeaders.grid.height;
                calculatedSpacingX =
                    eChartsConfig.options.facetHeaders.spacing.x;
                calculatedSpacingY =
                    eChartsConfig.options.facetHeaders.spacing.y;

                if (
                    eChartsConfig.options.facetHeaders.customLayout &&
                    eChartsConfig.options.facetHeaders.unitType === '%'
                ) {
                    calculatedGridWidth =
                        (chartContainer.clientWidth *
                            eChartsConfig.options.facetHeaders.grid.width) /
                        100;
                    calculatedGridHeight =
                        (chartContainer.clientHeight *
                            eChartsConfig.options.facetHeaders.grid.height) /
                        100;
                    calculatedSpacingX =
                        (chartContainer.clientWidth *
                            eChartsConfig.options.facetHeaders.spacing.x) /
                        100;
                    calculatedSpacingY =
                        (chartContainer.clientHeight *
                            eChartsConfig.options.facetHeaders.spacing.y) /
                        100;
                }

                containerHeight =
                    facetPadding.top +
                    numRows * calculatedGridHeight +
                    (numRows - 1) * calculatedSpacingY +
                    facetPadding.bottom;
                containerWidth =
                    facetPadding.left +
                    numColumns * calculatedGridWidth +
                    (numColumns - 1) * calculatedSpacingX +
                    facetPadding.right;

                parent.style.position = 'absolute';
                parent.style.top = '0';
                parent.style.right = '0';
                parent.style.bottom = '0';
                parent.style.left = '0';
                parent.style.overflowY = 'auto';

                if (chartContainer.clientWidth < containerWidth) {
                    chartContainer.style.width = '' + containerWidth + 'px';
                    clientWidth = containerWidth;
                } else {
                    chartContainer.style.width = '';
                    clientWidth = chartContainer.clientWidth;
                }

                if (chartContainer.clientHeight < containerHeight) {
                    chartContainer.style.height = '' + containerHeight + 'px';
                    clientHeight = containerHeight;
                } else {
                    chartContainer.style.height = '';
                    clientHeight = chartContainer.clientHeight;
                }
            }
        }

        /**
         * @name initializeEvents
         * @desc creates the event layer
         * @returns {void}
         */
        function initializeEvents() {
            /** ******************************************************/
            // Event: On single click open new tab with wikipedia page of selected label
            funnelChart.on('click', eChartClicked);
            funnelChart.on('mouseover', eChartMouse);
            funnelChart.on('mouseout', eChartMouseOut);
            funnelChart._dom.addEventListener('mouseout', mouseOut);

            // it is necessary to initialize comment mode so the nodes are painted
            EchartsHelper.initializeCommentMode({
                comments: eChartsConfig.comments,
                currentMode: eChartsConfig.currentMode,
                saveCb: eChartsConfig.callbacks.commentMode.onSave,
            });

            // Context Menu
            funnelChart.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [eChartsConfig.legendLabels],
                });
            });
            funnelChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            if (
                typeof eChartsConfig.callbacks.defaultMode.onKeyUp ===
                    'function' ||
                typeof eChartsConfig.callbacks.defaultMode.onKeyDown ===
                    'function'
            ) {
                funnelChart._dom.tabIndex = 1;
                if (
                    typeof eChartsConfig.callbacks.defaultMode.onKeyUp ===
                    'function'
                ) {
                    funnelChart._dom.addEventListener('keyup', function (e) {
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
                    funnelChart._dom.addEventListener('keydown', function (e) {
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
            // console.log(event);
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
            paint();
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
