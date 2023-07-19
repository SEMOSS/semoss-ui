'use strict';

import * as d3 from 'd3';

import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';

import * as symbols from '@/widget-resources/js/d3-symbols';

import './gantt.scss';

export default angular
    .module('app.gantt.directive', [])
    .directive('gantt', gantt);

gantt.$inject = ['semossCoreService'];

function gantt(semossCoreService) {
    ganttLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        link: ganttLink,
    };

    function ganttLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];
        let dataTypes;

        /** **************Get Chart Div *************************/
        scope.chartDiv = d3.select(ele[0].firstElementChild);
        /** ************* Main Event Listeners ************************/
        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            /** *************** d3Object Object ****************************/
            svg,
            dimensions,
            width,
            height,
            maxLabelLenth,
            /** *************** local data Object ****************************/
            ganttConfig = {};
        /** **************** Destory Listener *************************/
        scope.$on('$destroy', destroy);

        /**
         * @name initialize
         * @desc creates the visualization on the chart div
         * @returns {void}
         */
        function initialize() {
            // bind listeners
            resizeListener = scope.widgetCtrl.on('resize-widget', function () {
                resizeViz();
            });
            updateTaskListener = scope.widgetCtrl.on(
                'update-task',
                function () {
                    setData();
                }
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                function () {
                    setData();
                }
            );
            addDataListener = scope.widgetCtrl.on('added-data', function () {
                setData();
            });
            modeListener = scope.widgetCtrl.on('update-mode', function () {
                toggleMode();
            });

            setData();

            // TODO add in comment mode
            // TODO add in brush
        }

        /**
         * @name setData
         * @desc grabs the original data and tools
         * @returns {void}
         */
        function setData() {
            var individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.GanttD3'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.GanttD3'
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                uiOptions = angular.extend(sharedTools, individiualTools);

            getDataTypes(keys, uiOptions);
            maxLabelLenth = 0;

            ganttConfig.uiOptions = uiOptions;
            ganttConfig.uiOptions.colorByValue = colorBy;
            ganttConfig.keys = keys;

            // get data type of dates from the db
            for (let k = 0; k < keys.length; k++) {
                if (keys[k].model === 'start') {
                    ganttConfig.startType =
                        visualizationUniversal.mapFormatOpts(keys[k]);
                }
            }
            // if user has selected custom formats, apply those
            if (uiOptions.formatDataValues) {
                for (
                    let i = 0;
                    i < uiOptions.formatDataValues.formats.length;
                    i++
                ) {
                    if (
                        uiOptions.formatDataValues.formats[i].model === 'start'
                    ) {
                        ganttConfig.startType =
                            uiOptions.formatDataValues.formats[i];
                    }
                }
            }

            ganttConfig.axisData = {};
            ganttConfig.axisData.dates = [];
            ganttConfig.axisData.tasks = {};
            ganttConfig.axisData.tasks.values = [];
            ganttConfig.groups = [];
            ganttConfig.groupInfo = {};
            ganttConfig.legend = {};
            ganttConfig.legend.startIdx = 0;
            ganttConfig.legend.show = [];
            ganttConfig.legend.hide = [];
            ganttConfig.fiscalData = [];
            ganttConfig.milestoneData = [];
            ganttConfig.progressExists = false;
            ganttConfig.milestonesExists = false;
            ganttConfig.chartData = formatData(data, keys);
            ganttConfig.modelKeyMapping = _createModelKeyMapping(keys);
            ganttConfig.axisData.tasks.maxLabelLenth = maxLabelLenth;
            ganttConfig.color = uiOptions.color;
            ganttConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            ganttConfig.currentMode =
                scope.widgetCtrl.getMode('selected') || 'default-mode';
            ganttConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            ganttConfig.groupByInfo = scope.widgetCtrl.getWidget(
                'view.visualization.tasks.' + layerIndex + '.groupByInfo'
            );

            if (ganttConfig.uiOptions.fiscalAxis.enabled === 'Yes') {
                ganttConfig.fiscalData = formatFiscalData();
            }

            paint();
        }

        /**
         * @name getDataTypes
         * @desc gets the data formatting options for each dimension
         * @param {Object} keys - object of data keys
         * @param {object} options - uiOptions
         * @returns {void}
         */
        function getDataTypes(keys, options) {
            dataTypes = {};
            let k, j, formatType, newFormat;

            for (k = 0; k < keys.length; k++) {
                if (keys[k].model !== 'facet') {
                    dataTypes[keys[k].alias] = [];
                    formatType = visualizationUniversal.mapFormatOpts(keys[k]);
                    dataTypes[keys[k].alias].push(formatType);
                }
                if (options.formatDataValues && keys[k].model !== 'facet') {
                    for (
                        j = 0;
                        j < options.formatDataValues.formats.length;
                        j++
                    ) {
                        newFormat = options.formatDataValues.formats[j];
                        if (keys[k].alias === newFormat.dimension) {
                            dataTypes[newFormat.dimension] = [];
                            dataTypes[newFormat.dimension].push(newFormat);
                        }
                    }
                }
            }
        }

        /**
         * @name formatData
         * @desc format data the way we want it. If a group dimension exists as one of the chart options, the returned
         * value will be an object with each key representing a group. If no group dimension exists, the returned value
         * will be an array of objects, with each object representing an individual task
         * @param {obj} data - original semoss data
         * @param {array} keys - semoss keys
         * @returns {array/obj} formatted data
         */
        function formatData(data, keys) {
            var formattedData, indecies;

            indecies = getHeaderIdx(data.headers, keys);

            if (
                (indecies.groupIdx || indecies.groupIdx === 0) &&
                ganttConfig.uiOptions.ganttGroupView
            ) {
                formattedData = formatDataGroupView(data, indecies);
            } else {
                // TODO if (ganttGroupview) alert that a group dimension is necessary
                formattedData = formatDataTaskView(data, indecies);
            }

            return formattedData;
        }

        /**
         * @name getHeaderIdx
         * @desc find the index of chart dimension by comparing the keys to the data headers
         * @param {array} headers - semoss data headers
         * @param {array} keys - semoss keys
         * @returns {obj} keys indecies
         */
        function getHeaderIdx(headers, keys) {
            var i,
                n,
                indecies = {};

            indecies.tooltipIdx = [];

            for (i = 0; i < headers.length; i++) {
                for (n = 0; n < keys.length; n++) {
                    if (keys[n].alias === headers[i]) {
                        switch (keys[n].model) {
                            case 'task':
                                indecies.taskIdx = i;
                                ganttConfig.axisData.tasks.dataType =
                                    keys[n].type;
                                ganttConfig.axisData.tasks.taskLabel =
                                    keys[n].alias;
                                break;
                            case 'start':
                                indecies.startIdx = i;
                                break;
                            case 'end':
                                indecies.endIdx = i;
                                break;
                            case 'milestone':
                                indecies.milestoneIdx = i;
                                ganttConfig.milestonesExists = true;
                                break;
                            case 'group':
                                indecies.groupIdx = i;
                                ganttConfig.axisData.groupLabel = keys[n].alias;
                                break;
                            case 'progress':
                                indecies.progressIdx = i;
                                ganttConfig.progressExists = true;
                                break;
                            case 'tooltip':
                                indecies.tooltipIdx.push(i);
                                break;
                            default:
                                continue;
                        }
                    }
                }
            }
            return indecies;
        }

        /**
         * @name formatDataTaskView
         * @desc format data when there is no group dimension. Returned value will be an array of object
         * Each object represents an individual task
         * @param {obj} data - original semoss data
         * @param {obj} indecies - semoss keys
         * @returns {array} formatted data array
         */
        function formatDataTaskView(data, indecies) {
            var formattedData = [],
                dataIdx,
                i;

            for (i = 0; i < data.values.length; i++) {
                dataIdx = getDataIdx(data.values[i], indecies);
                formattedData.push(dataIdx);
            }

            return formattedData;
        }

        /**
         * @name getDataIdx
         * @desc formats individual data index
         * @param {array} data - individual data index
         * @param {obj} indecies - semoss keys
         * @returns {object} formatted data index
         */
        function getDataIdx(data, indecies) {
            var dataIdx = {},
                i;

            ganttConfig.axisData.dates.push(
                data[indecies.startIdx],
                data[indecies.endIdx]
            );
            ganttConfig.axisData.tasks.values.push(data[indecies.taskIdx]);

            if (
                data[indecies.taskIdx] &&
                data[indecies.taskIdx].toString().length > maxLabelLenth
            ) {
                maxLabelLenth = data[indecies.taskIdx].toString().length;
            }

            dataIdx.task = data[indecies.taskIdx];
            dataIdx.start = data[indecies.startIdx];
            dataIdx.end = data[indecies.endIdx];
            if (indecies.milestoneIdx) {
                dataIdx.milestone = data[indecies.milestoneIdx];
            }
            if (indecies.progressIdx) {
                dataIdx.progress = data[indecies.progressIdx];
            }
            if (indecies.tooltipIdx.length > 0) {
                dataIdx.tooltip = [];
                for (i = 0; i < indecies.tooltipIdx.length; i++) {
                    dataIdx.tooltip.push(data[indecies.tooltipIdx[i]]);
                }

                // dataIdx.tooltip = data[indecies.tooltipIdx];
            }
            if (indecies.groupIdx) {
                if (
                    ganttConfig.groups.indexOf(data[indecies.groupIdx]) === -1
                ) {
                    ganttConfig.groups.push(data[indecies.groupIdx]);
                }
                dataIdx.group = data[indecies.groupIdx];
            } else {
                // Remove ganttGroupView if it exists
                ganttConfig.uiOptions.ganttGroupView = false;
            }
            return dataIdx;
        }

        /**
         * @name formatDataGroupView
         * @desc format data when group dimension exists. Returned value will be an object with each key being a unique group
         * and each value being an array of the tasks that are within that group
         * @param {obj} data - original semoss data
         * @param {obj} indecies - semoss keys
         * @returns {obj} formatted data object
         */
        function formatDataGroupView(data, indecies) {
            var formattedData = [],
                groupsObj = {},
                group,
                startDate,
                startIdx,
                endDate,
                // milestoneIdx,
                // milestoneDate,
                endIdx,
                dataIdx,
                progressTotal,
                progressAvg,
                groups = [],
                i,
                n;

            for (i = 0; i < data.values.length; i++) {
                if (groups.indexOf(data.values[i][indecies.groupIdx]) === -1) {
                    groups.push(data.values[i][indecies.groupIdx]);
                    groupsObj[data.values[i][indecies.groupIdx]] = {};
                    groupsObj[data.values[i][indecies.groupIdx]].startDates =
                        [];
                    groupsObj[data.values[i][indecies.groupIdx]].endDates = [];
                    groupsObj[
                        data.values[i][indecies.groupIdx]
                    ].startDatesOriginalFormat = [];
                    groupsObj[
                        data.values[i][indecies.groupIdx]
                    ].endDatesOriginalFormat = [];
                    groupsObj[data.values[i][indecies.groupIdx]].tasks = [];

                    if (indecies.milestoneIdx) {
                        groupsObj[
                            data.values[i][indecies.groupIdx]
                        ].milestoneDates = [];
                        groupsObj[
                            data.values[i][indecies.groupIdx]
                        ].milestoneDatesOriginalFormat = [];
                    }
                    if (indecies.progressIdx) {
                        groupsObj[data.values[i][indecies.groupIdx]].progress =
                            [];
                    }
                    if (indecies.tooltipIdx) {
                        groupsObj[data.values[i][indecies.groupIdx]].tooltip =
                            [];
                    }
                }

                if (
                    groupsObj.hasOwnProperty(data.values[i][indecies.groupIdx])
                ) {
                    groupsObj[data.values[i][indecies.groupIdx]].tasks.push(
                        data.values[i][indecies.taskIdx]
                    );

                    groupsObj[
                        data.values[i][indecies.groupIdx]
                    ].startDates.push(
                        new Date(data.values[i][indecies.startIdx])
                    );
                    groupsObj[
                        data.values[i][indecies.groupIdx]
                    ].startDatesOriginalFormat.push(
                        data.values[i][indecies.startIdx]
                    );

                    groupsObj[data.values[i][indecies.groupIdx]].endDates.push(
                        new Date(data.values[i][indecies.endIdx])
                    );
                    groupsObj[
                        data.values[i][indecies.groupIdx]
                    ].endDatesOriginalFormat.push(
                        data.values[i][indecies.endIdx]
                    );
                    if (indecies.milestoneIdx) {
                        groupsObj[
                            data.values[i][indecies.groupIdx]
                        ].milestoneDates.push(
                            new Date(data.values[i][indecies.milestoneIdx])
                        );
                        groupsObj[
                            data.values[i][indecies.groupIdx]
                        ].milestoneDatesOriginalFormat.push(
                            data.values[i][indecies.milestoneIdx]
                        );
                    }
                    if (indecies.progressIdx) {
                        groupsObj[
                            data.values[i][indecies.groupIdx]
                        ].progress.push(data.values[i][indecies.progressIdx]);
                    }
                    if (indecies.tooltipIdx) {
                        groupsObj[
                            data.values[i][indecies.groupIdx]
                        ].tooltip.push(data.values[i][indecies.tooltipIdx]);
                    }
                }
            }

            ganttConfig.groupInfo = groupsObj;

            for (group in groupsObj) {
                if (groupsObj.hasOwnProperty(group)) {
                    startDate = new Date(
                        Math.min.apply(null, groupsObj[group].startDates)
                    );
                    endDate = new Date(
                        Math.max.apply(null, groupsObj[group].endDates)
                    );
                    // milestoneDate = new Date(Math.min.apply(null, groupsObj[group].milestoneDates));
                    startIdx = groupsObj[group].startDates
                        .map(Number)
                        .indexOf(+startDate);
                    endIdx = groupsObj[group].endDates
                        .map(Number)
                        .indexOf(+endDate);
                    // milestoneIdx = groupsObj[group].milestoneDates.map(Number).indexOf(+milestoneDate);
                    // tooltipIx = groupsObj[group].tooltips

                    dataIdx = {};
                    dataIdx.task = group;
                    dataIdx.start =
                        groupsObj[group].startDatesOriginalFormat[startIdx];
                    dataIdx.end =
                        groupsObj[group].endDatesOriginalFormat[endIdx];
                    dataIdx.group = group;
                    // dataIdx.milestone = groupsObj[group].milestoneDatesOriginalFormat[milestoneIdx];
                    // dataIdx.tooltip = groupsObj[group].tooltip;

                    if (indecies.progressIdx) {
                        progressTotal = 0;
                        for (n = 0; n < groupsObj[group].progress.length; n++) {
                            progressTotal =
                                progressTotal +
                                Number(groupsObj[group].progress[n]);
                        }
                        progressAvg = Math.round(
                            progressTotal / groupsObj[group].progress.length
                        );
                        dataIdx.progress = progressAvg;
                    }

                    formattedData.push(dataIdx);

                    ganttConfig.axisData.dates.push(dataIdx.start, dataIdx.end);
                    ganttConfig.axisData.tasks.values.push(group);

                    if (dataIdx.task.toString().length > maxLabelLenth) {
                        maxLabelLenth = dataIdx.task.toString().length;
                    }
                }
            }
            ganttConfig.groups = groups;
            ganttConfig.axisData.tasks.taskLabel =
                ganttConfig.axisData.groupLabel;
            return formattedData;
        }

        /**
         * @name _createModelKeyMapping
         * @desc creates a mapping from semoss keys to column headers
         * @param {array} keys - semoss keys
         * @returns {obj} formatted data with a mapping of keys to column header names
         */
        function _createModelKeyMapping(keys) {
            var returnObj = {},
                i = 0;

            returnObj.tooltip = [];

            for (i; i < keys.length; i++) {
                if (keys[i].model === 'tooltip') {
                    returnObj.tooltip.push(keys[i].header);
                } else {
                    returnObj[keys[i].model] = keys[i].header;
                }
            }

            return returnObj;
        }

        /**
         * @name formatFiscalData
         * @desc generate fiscal data
         * @returns {array/obj} formatted fiscal data with months, quarters, and years
         */
        function formatFiscalData() {
            var dateStart, dateEnd, fiscalData;

                    
            dateStart = d3.min(ganttConfig.chartData, function (d) {
                return new Date(
                    Date.parse(d.start) >= Date.parse(d.end) ? d.end : d.start,
                );
            });
            dateEnd = d3.max(ganttConfig.chartData, function (d) {
                return new Date(Date.parse(d.end) <= Date.parse(d.start) ? d.start : d.end);
            });
            dateStart = new Date(
                dateStart.getFullYear(),
                dateStart.getMonth(),
                1
            );
            dateEnd = new Date(
                dateEnd.getFullYear(),
                dateEnd.getMonth() + 1,
                0
            );

            fiscalData = generateFiscalAxisData(
                dateStart,
                dateEnd,
                new Date(
                    1 +
                        ganttConfig.uiOptions.fiscalAxis.startMonth +
                        dateStart.getFullYear()
                )
            );

            return fiscalData;
        }

        /**
         * @name generateFiscalAxisData
         * @desc generates data representing FY axis
         * @param {date} start - beginning date of axis
         * @param {date} end - end date of axis
         * @param {date} fyStart - fiscal year start
         * @returns {object/array} the fiscal months, quarters, and years contained within date interval
         */
        function generateFiscalAxisData(start, end, fyStart) {
            var currentDate = start,
                monthData = [],
                quarterData = [],
                yearData = [],
                i,
                range,
                quarterStart,
                yearStart;

            // Generate range to determine if months or quarters should be shown
            range = end.getFullYear() - start.getFullYear();

            while (currentDate <= end) {
                monthData.push({
                    month: currentDate.getMonth(),
                    quarter: _getFiscalQuarter(fyStart, currentDate),
                    calendarYear: currentDate.getFullYear(),
                    fiscalYear: _getFiscalYear(fyStart, currentDate),
                    dateStart: new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        1
                    ),
                    dateEnd: new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        1
                    ),
                });
                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            for (i = 0; i < monthData.length; i++) {
                /* Format Quarter Data */
                // If entering the first fiscal quarter on timeline or next quarter has begun
                if (
                    i === 0 ||
                    monthData[i].quarter !== monthData[i - 1].quarter
                ) {
                    quarterStart = new Date(
                        monthData[i].calendarYear,
                        monthData[i].month,
                        1
                    );
                }
                // If ending any fiscal quarter apart from final quarter
                if (
                    i !== monthData.length - 1 &&
                    monthData[i].quarter !== monthData[i + 1].quarter
                ) {
                    quarterData.push({
                        quarter: monthData[i].quarter,
                        dateStart: quarterStart,
                        dateEnd: new Date(
                            monthData[i].calendarYear,
                            monthData[i].month + 1,
                            1
                        ),
                    });
                }
                // If ending final fiscal quarter
                if (i === monthData.length - 1) {
                    quarterData.push({
                        quarter: monthData[i].quarter,
                        dateStart: quarterStart,
                        dateEnd: new Date(
                            monthData[i].calendarYear,
                            monthData[i].month + 1,
                            1
                        ),
                    });
                }

                /* Format Year Data */
                // If entering the first fiscal quarter on timeline or beginning Q1
                if (
                    i === 0 ||
                    (monthData[i].quarter === 1 &&
                        monthData[i].fiscalYear !== monthData[i - 1].fiscalYear)
                ) {
                    yearStart = new Date(
                        monthData[i].calendarYear,
                        monthData[i].month,
                        1
                    );
                }
                // If ending any FY apart from final
                if (
                    i !== monthData.length - 1 &&
                    monthData[i].fiscalYear !== monthData[i + 1].fiscalYear
                ) {
                    yearData.push({
                        fiscalYear: monthData[i].fiscalYear,
                        dateStart: yearStart,
                        dateEnd: new Date(
                            monthData[i].calendarYear,
                            monthData[i].month + 1,
                            1
                        ),
                    });
                }
                // If ending final FY
                if (i === monthData.length - 1) {
                    yearData.push({
                        fiscalYear: monthData[i].fiscalYear,
                        dateStart: yearStart,
                        dateEnd: new Date(
                            monthData[i].calendarYear,
                            monthData[i].month + 1,
                            1
                        ),
                    });
                }
            }

            return {
                range: range,
                monthData: monthData,
                quarterData: quarterData,
                yearData: yearData,
            };
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            var margin;
            // marginZoom,
            // zoomHeight = 20;

            margin = determineMargin();
            determineResize(margin);

            // Remove existing svg
            scope.chartDiv.select('svg').remove();
            d3.select('#GANTT-TOOLTIP').remove();

            dimensions = scope.chartDiv.node().getBoundingClientRect();
            width = dimensions.width - margin.left - margin.right;
            height = dimensions.height - margin.top - margin.bottom;
            svg = scope.chartDiv
                .append('svg')
                .attr('class', 'editable-svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.bottom + margin.top);

            if (
                ganttConfig.uiOptions.chartTitle.text &&
                ganttConfig.uiOptions.chartTitle.text.length
            ) {
                generateTitle(margin, ganttConfig.uiOptions.chartTitle);
            }

            svg = svg
                .append('g')
                .attr(
                    'transform',
                    'translate(' + margin.left + ',' + margin.top + ')'
                )
                .attr('id', 'group');

            generateDatesAxis();
            generateTasksAxis();

            svg.append('g')
                .attr('class', 'brush')
                .call(d3.brush().on('end', brushEnded))
                .on('click', function (d) {
                    initializeEvents('click', d);
                });

            if (ganttConfig.uiOptions.fiscalAxis.enabled === 'Yes') {
                generateFiscalAxis(width, margin.top, margin.left);
            }
            generateGanttBars(margin.top, margin.left);

            if (ganttConfig.uiOptions.toggleLegend) {
                generateLegend();
            }
        }

        /**
         * @name generateTitle
         * @desc creates chart title
         * @param {*} margin - margin dimensions
         * @param {*} config - chartTitle options
         * @returns {void}
         */
        function generateTitle(margin, config) {
            let translateX, translateY, anchorPos;
            if (config.align === 'left') {
                translateX = '10px';
                anchorPos = 'start';
            } else if (config.align === 'right') {
                translateX = 'calc(100% - 10px)';
                anchorPos = 'end';
            } else {
                translateX = '50%';
                anchorPos = 'middle';
            }

            if (ganttConfig.uiOptions.fiscalAxis.enabled === 'Yes') {
                translateY = parseInt(config.fontSize, 10) + 'px';
            } else {
                translateY = margin.top / 2 + 'px';
            }

            svg.append('text')
                .attr('text-anchor', anchorPos)
                .style('transform', `translate(${translateX},${translateY})`)
                .style('fill', config.fontColor)
                .style('font-size', config.fontSize)
                .style('font-family', config.fontFamily)
                .style('font-weight', config.fontWeight)
                .text(config.text);
        }

        /**
         * @name generateDatesAxis
         * @desc draw the axis to represent the dates. Include date labels, grid lines, tick marks, and
         * today's date line
         * @returns {void}
         */
        function generateDatesAxis() {
            var scale,
                datesContent,
                datesAxisGroup,
                datesAxis,
                numLabels = Math.floor(width / 75),
                axisOptions = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.axis'
                );
            // zoom;

            if (numLabels === 0) {
                numLabels = 1;
            }

            // Remove previous dates axis container if its there
            svg.selectAll('.datesAxisContainer').remove();
            // Calculate and Set the Scale for the dates axis
            scale = getAxisScale('dates');
            datesAxis = d3.axisBottom(scale).tickSize(0).ticks(numLabels);
            datesContent = svg
                .append('g')
                .attr('class', 'datesAxisContainer')
                .attr('transform', 'translate(0,' + height + ')');
            datesAxisGroup = datesContent
                .append('g')
                .attr('class', 'datesAxis');
            datesAxisGroup.call(datesAxis);

            datesAxisGroup
                .selectAll('path')
                .style('stroke', axisOptions.borderColor)
                .style('stroke-width', axisOptions.borderWidth);

            datesAxisGroup
                .selectAll('line')
                .style('stroke', axisOptions.borderColor)
                .style('stroke-width', axisOptions.borderWidth);

            datesAxisGroup
                .selectAll('text')
                .style('font-family', axisOptions.label.fontFamily)
                .style('font-size', axisOptions.label.fontSize)
                .style('font-weight', axisOptions.label.fontWeight)
                .style('fill', axisOptions.label.fontColor);

            // TODO add wheel zoom on dates axis
            //             if (ganttConfig.uiOptions.toggleZoomX) {
            //                 zoom = d3.zoom()
            //                     .scaleExtent([1, 32])
            //                     .translateExtent([[0, 0], [width, height]])
            //                     .extent([[0, 0], [width, height]])
            //                     .on('zoom', function () {
            //                         var t = d3.event.transform,
            //                             xt = t.rescaleX(scale);
            //                         // g.select(".area").attr("d", area.x(function(d) { return xt(d.date); }));
            //                         g.select('datesAxis').call(datesAxis.scale(xt));
            //                     });

            //             }
        }

        /**
         * @name generateTasksAxis
         * @desc draw the axis to represent the tasks/groups. Include tasks/groups labels and tick marks
         * @returns {void}
         */
        function generateTasksAxis() {
            // TODO
            // Consider uiOptions (flipped axis, hide values, reversed axis, etc.)

            var scale,
                numberOfTicks = Math.floor(height / 14),
                tasksAxis,
                tasksAxisGroup,
                tasksContent,
                axisOptions = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.axis'
                );

            // Remove previous tasksAxis container if its there
            svg.selectAll('.tasksAxisContainer').remove();
            // Set Number of Tick Marks
            if (numberOfTicks > 10) {
                if (numberOfTicks < 20) {
                    numberOfTicks = 10;
                } else if (numberOfTicks < 30) {
                    numberOfTicks /= 2;
                } else {
                    numberOfTicks = 15;
                }
            }
            // Calculate and Set the Scale for the tasks/group axis
            scale = getAxisScale('tasks');
            tasksAxis = d3
                .axisLeft()
                .ticks(numberOfTicks)
                .scale(scale)
                .tickSize(5)
                .tickPadding(5);
            tasksContent = svg.append('g').attr('class', 'tasksAxisContainer');
            tasksContent
                .append('g')
                .append('text')
                .attr('text-anchor', 'start')
                .attr('x', 0)
                .attr('y', 0)
                .attr('fill-opacity', 1);

            tasksAxisGroup = tasksContent
                .append('g')
                .attr('class', 'tasksAxis');

            tasksAxisGroup.call(tasksAxis);

            tasksAxisGroup
                .selectAll('path')
                .style('stroke', axisOptions.borderColor)
                .style('stroke-width', axisOptions.borderWidth);

            tasksAxisGroup
                .selectAll('line')
                .style('stroke', axisOptions.borderColor)
                .style('stroke-width', axisOptions.borderWidth);

            tasksAxisGroup
                .selectAll('text')
                .text(function (d) {
                    var label = d + '';
                    label = label.replace(/_/g, ' ');
                    if (label.length > 19) {
                        return label.substring(0, 19) + '...';
                    }
                    return label;
                })
                .style('font-family', axisOptions.label.fontFamily)
                .style('font-size', axisOptions.label.fontSize)
                .style('font-weight', axisOptions.label.fontWeight)
                .style('fill', axisOptions.label.fontColor);
        }

        /**
         * @name generateGanttBars
         * @param {number} h The height offset of our svg
         * @param {number} w The width offset of our svg
         * @desc draw the gantt bars
         * @returns {void}
         */
        function generateGanttBars(h, w) {
            // Reference jvGantt.js (lines 136-332)
            var bars, ganttBars, x, y, i;

            x = getAxisScale('dates');
            y = getAxisScale('tasks');

            // Draw date ranges before bars so shading appears behind data
            if (ganttConfig.uiOptions.targetDateRange) {
                generateDateRanges(
                    x,
                    ganttConfig.uiOptions.targetDateRange.dateRanges
                );
            }

            svg.selectAll('.gantt-bars-container').remove();
            bars = svg.append('g').attr('class', 'gantt-bars-container');

            ganttBars = [];
            drawBars(0, bars, ganttBars, x, y);
            if (ganttConfig.progressExists) {
                drawBars(1, bars, ganttBars, x, y);
            }

            if (ganttConfig.uiOptions.showDate) {
                generateTodaysDateLine(x, ganttConfig.startType);
            }

            if (ganttConfig.uiOptions.targetDate) {
                // for (i = 0; i < ganttConfig.uiOptions.targetDate.dates.length; i++) {
                //     generateTargetLine(x, ganttConfig.uiOptions.targetDate.dates[i]);
                // }
                let target_dates = ganttConfig.uiOptions.targetDate.dates;
                generateTargetLine(x, target_dates);
            }

            if (ganttConfig.milestonesExists) {
                if (ganttConfig.progressExists) {
                    drawShapes(1, bars, x, y);
                } else {
                    drawShapes(0, bars, x, y);
                }
            }
        }

        function getD3Symbol(symbol) {
            const d3Symbols = {
                circle: d3.symbolCircle,
                cross: d3.symbolCross,
                diamond: d3.symbolDiamond,
                square: d3.symbolSquare,
                star: d3.symbolStar,
                triangle: d3.symbolTriangle,
                rect: d3.symbolSquare,
                arrow: symbols.symbolArrow,
                pin: symbols.symbolPin,
                roundRect: symbols.symbolRoundRect,
            };

            return d3Symbols[symbol] || d3Symbols.triangle;
        }

        function getSymbolType(rule) {
            if (rule) {
                return getD3Symbol(rule.symbol);
            }

            return getD3Symbol('triangle');
        }

        function isCustomUrlSymbol(rule, prefix) {
            if (rule === undefined) {
                return false;
            }

            if (prefix) {
                return new RegExp('^'.concat(prefix)).test(rule.symbol);
            }

            return rule.symbol !== undefined;
        }

        /**
         * @name drawShapes
         * @desc draw milestone shapes
         * @param {number} index - 0 or 1. 1 representing progress bars
         * @param {obj} bars - svg
         * @param {obj} x - dates svg scale
         * @param {obj} y - tasks svg scale
         * @returns {void}
         */
        function drawShapes(index, bars, x, y) {
            var arc,
                ganttBarGroups,
                shape,
                taskText,
                dateText,
                shapeGroup,
                i,
                xTransform,
                yTransform,
                yDiff,
                shapeDatum,
                shapeData = [],
                tooltip = {},
                type,
                customizeSymbolRule,
                customUrlPrefix;

            // Insert group elements to draw shape groups. Append rect data to path data to draw shapes.
            ganttBarGroups = bars.selectAll('.gantt-bar-group' + index);

            ganttBarGroups.each(function (d) {
                shapeData = [];

                // Format data so that each painting of path works, regardless of group or non-group mode
                if (!ganttConfig.uiOptions.ganttGroupView) {
                    shapeDatum = {
                        ganttBar: d.task,
                        task: d.task,
                        start: d.start,
                        end: d.end,
                        milestone: d.milestone,
                        tooltip: d.tooltip,
                    };

                    if (ganttConfig.progressExists) {
                        shapeDatum.progress = d.progress;
                    }

                    if (d.group) {
                        shapeDatum.group = d.group;
                    }

                    shapeData.push(shapeDatum);
                } else {
                    for (
                        i = 0;
                        i <
                        ganttConfig.groupInfo[d.task]
                            .milestoneDatesOriginalFormat.length;
                        i++
                    ) {
                        shapeDatum = {
                            task: ganttConfig.groupInfo[d.task].tasks[i],
                            ganttBar: d.task,
                            milestone:
                                ganttConfig.groupInfo[d.task]
                                    .milestoneDatesOriginalFormat[i],
                            start: ganttConfig.groupInfo[d.task]
                                .startDatesOriginalFormat[i],
                            end: ganttConfig.groupInfo[d.task]
                                .endDatesOriginalFormat[i],
                            tooltip: [ganttConfig.groupInfo[d.task].tooltip[i]],
                        };
                        if (ganttConfig.progressExists) {
                            shapeDatum.progress =
                                ganttConfig.groupInfo[d.task].progress[i];
                        }
                        shapeData.push(shapeDatum);
                    }
                }

                // Create compare function for shapeData sort. Need data in chronological order for
                // text ordering (to prevent overlapping text)
                shapeData.sort(function (a, b) {
                    if (new Date(a.milestone) < new Date(b.milestone)) {
                        return -1;
                    }
                    if (new Date(a.milestone) > new Date(b.milestone)) {
                        return 1;
                    }
                    return 0;
                });

                shapeGroup = d3
                    .select(this)
                    .selectAll('.ganttShapeContainer')
                    .data(shapeData)
                    .enter()
                    .append('g')
                    .attr('class', function (param, shapeGroupNum) {
                        return (
                            'shapeGroup ' +
                            shapeGroupNum +
                            ' ' +
                            param.task +
                            ' ' +
                            param.milestone
                        );
                    });

                if (ganttConfig.uiOptions.displayValues) {
                    taskText = shapeGroup
                        .append('text')
                        .attr('class', function (param) {
                            return 'taskText ' + param.task + param.milestone;
                        })
                        .text(function (param) {
                            var shapeLabel = param.task + '';
                            shapeLabel = shapeLabel.replace(/_/g, ' ');
                            if (shapeLabel.length > 22) {
                                return shapeLabel.substring(0, 22) + '...';
                            }
                            return shapeLabel;
                        })
                        .attr('font-size', '85%')
                        .attr('font-weight', '600')
                        .attr('text-anchor', 'middle');

                    taskText
                        .transition()
                        // eslint-disable-next-line no-loop-func
                        .attr('transform', function (param, textNum) {
                            xTransform = x(new Date(param.milestone));
                            yTransform = y(param.ganttBar) + y.bandwidth() / 2;
                            switch (textNum % 4) {
                                case 0:
                                    yDiff = -y.bandwidth() / 4;
                                    break;
                                case 1:
                                    yDiff = y.bandwidth() / 4;
                                    break;
                                case 2:
                                    yDiff = -y.bandwidth() / 2;
                                    break;
                                case 3:
                                    yDiff = y.bandwidth() / 2;
                                    break;
                                default:
                                    break;
                            }
                            return (
                                'translate(' +
                                xTransform +
                                ',' +
                                (yTransform + yDiff) +
                                ')'
                            );
                        });

                    dateText = shapeGroup
                        .append('text')
                        .attr('class', function (param) {
                            return 'dateText ' + param.task + param.milestone;
                        })
                        .text(function (param) {
                            var shapeLabel = param.milestone + ' ';
                            return shapeLabel;
                        })
                        .attr('font-size', '65%')
                        .attr('font-weight', '500')
                        .attr('text-anchor', 'middle');

                    dateText
                        .transition()
                        // eslint-disable-next-line no-loop-func
                        .attr('transform', function (param, textNum) {
                            xTransform = x(new Date(param.milestone));
                            yTransform = y(param.ganttBar) + y.bandwidth() / 2;
                            switch (textNum % 4) {
                                case 0:
                                    yDiff = -y.bandwidth() / 6;
                                    break;
                                case 1:
                                    yDiff = y.bandwidth() / 3;
                                    break;
                                case 2:
                                    yDiff = -y.bandwidth() / 2.5;
                                    break;
                                case 3:
                                    yDiff = y.bandwidth() / 1.65;
                                    break;
                                default:
                                    break;
                            }
                            return (
                                'translate(' +
                                xTransform +
                                ',' +
                                (yTransform + yDiff) +
                                ')'
                            );
                        });
                }

                // Define d3 standard symbols so that user can eventually input the shape for each milestone task
                // TODO: Implement shape picker (shape by value)

                customizeSymbolRule =
                    ganttConfig.uiOptions.customizeSymbol.rules[0];
                customUrlPrefix = 'image://';

                if (isCustomUrlSymbol(customizeSymbolRule, customUrlPrefix)) {
                    const href = customizeSymbolRule.symbol.slice(
                        customUrlPrefix.length
                    );

                    shape = shapeGroup
                        .append('image')
                        .attr('xlink:href', function () {
                            return href;
                        })
                        .attr('height', customizeSymbolRule.symbolSize)
                        .attr('width', customizeSymbolRule.symbolSize);

                    shape.transition().attr('transform', function (param) {
                        return (
                            'translate(' +
                            (x(new Date(param.milestone)) -
                                customizeSymbolRule.symbolSize / 2) +
                            ',' +
                            (y(param.ganttBar) +
                                y.bandwidth() / 2 -
                                customizeSymbolRule.symbolSize) +
                            ')'
                        );
                    });
                } else {
                    type = getSymbolType(customizeSymbolRule);

                    // Define shape using d3. Defines d attribute values for path elements
                    arc = d3
                        .symbol()
                        .type(type)
                        .size(
                            customizeSymbolRule
                                ? Math.pow(customizeSymbolRule.symbolSize, 2)
                                : y.bandwidth()
                        );

                    shape = shapeGroup.append('path');

                    shape
                        .transition()
                        .attr('d', arc)
                        .attr('fill', function (param) {
                            if (
                                customizeSymbolRule &&
                                customizeSymbolRule.specifyColor
                            ) {
                                return customizeSymbolRule.selectedColor;
                            }

                            return _getGanttColor(param, 'fill', index);
                        })
                        .attr('stroke', '#000')
                        .attr('stroke-width', 1)
                        .attr('transform', function (param) {
                            return (
                                'translate(' +
                                x(new Date(param.milestone)) +
                                ',' +
                                (y(param.ganttBar) + y.bandwidth() / 2) +
                                ')'
                            );
                        });
                }

                shape
                    .attr('class', function (param, shapeNum) {
                        return (
                            'shape ' +
                            shapeNum +
                            ' ' +
                            param.task +
                            ' ' +
                            param.milestone
                        );
                    })
                    .on('mouseover', function (param) {
                        return _tooltipMouseover(param, tooltip);
                    })
                    .on('mousemove', function () {
                        return _tooltipMousemove(tooltip);
                    })
                    .on('mouseout', function (param) {
                        return _tooltipMouseout(param, tooltip);
                    })
                    .on('click', function (param) {
                        initializeEvents('click', param);
                    });
            });
        }

        /**
         * @name drawBars
         * @desc draw gantt bars
         * @param {number} index - 0 or 1. 1 representing progress bars
         * @param {obj} bars - svg
         * @param {array} ganttBars - ganttBars array
         * @param {obj} x - dates svg scale
         * @param {obj} y - tasks svg scale
         * @returns {void}
         */
        function drawBars(index, bars, ganttBars, x, y) {
            var counter = -1,
                counter2 = -1,
                barWidth,
                barHeight,
                label,
                tooltip = {}; // Object that contains all necessary tooltip information

            ganttBars[index] = bars
                .selectAll('.gantt-bar' + index)
                .data(ganttConfig.chartData)
                .enter()
                .append('g')
                .attr('class', function () {
                    counter2++;
                    label = String(ganttConfig.chartData[counter2].task);
                    return (
                        'gantt-bar-group' +
                        index +
                        ' highlight-class-' +
                        label +
                        ' g '
                    );
                })
                .append('rect')
                .on('mouseover', function (d) {
                    return _tooltipMouseover(d, tooltip);
                })
                .on('mousemove', function () {
                    return _tooltipMousemove(tooltip);
                })
                .on('mouseout', function (d) {
                    return _tooltipMouseout(d, tooltip);
                })
                .on('click', function (d) {
                    initializeEvents('click', d);
                })
                .on('contextmenu', function (d) {
                    scope.visualizationCtrl.setContextMenuDataFromClick(
                        d.task,
                        {
                            name: ganttConfig.uiOptions.ganttGroupView
                                ? [ganttConfig.modelKeyMapping.group]
                                : [ganttConfig.modelKeyMapping.task],
                        }
                    );
                    scope.visualizationCtrl.openContextMenu(d3.event);
                })
                .attr('class', function () {
                    counter++;
                    label = String(ganttConfig.chartData[counter].task);
                    return (
                        'gantt-bar' +
                        index +
                        ' editable editable-bar bar-col-' +
                        label +
                        '-index-' +
                        0 +
                        ' highlight-class-' +
                        label +
                        ' rect '
                    );
                })
                .attr('width', 0)
                .attr('height', function () {
                    barHeight = y.bandwidth();
                    if (
                        ganttConfig.milestonesExists &&
                        ganttConfig.uiOptions.ganttGroupView
                    ) {
                        barHeight = y.bandwidth() / 20;
                    }
                    if (barHeight < 3) barHeight = 3;
                    if (barHeight > 35) barHeight = 35;
                    return barHeight;
                })
                .attr('x', function (d) {
                    if (d.start) {
                        return x(new Date(d.start));
                    }
                    return 0;
                })
                .attr('y', function (d) {
                    // return ganttThinBarMode ? (y(d.task) + (y.bandwidth() / 2) - y.bandwidth() / 40) : y(d.task);
                    return y(d.task) + y.bandwidth() / 2 - barHeight / 2;
                })
                .attr('rx', 1)
                .attr('ry', 1)
                .attr('stroke', function (d) {
                    return _getGanttColor(d, 'stroke');
                })
                .attr('stroke-width', function () {
                    if (ganttConfig.progressExists && index === 0) {
                        return 1;
                    }
                    return 0;
                })
                .attr('fill', function (d) {
                    return _getGanttColor(d, 'fill', index);
                });

            ganttBars[index]
                .transition()
                // .duration(400)
                // .delay(100)
                .attr('width', function (d) {
                    barWidth = x(new Date(d.end)) - x(new Date(d.start));

                    // if progress bar
                    if (index === 1) {
                        barWidth *= d.progress / 100;
                    }

                    if (barWidth > 0) {
                        return barWidth;
                    } else if (barWidth === 0) {
                        return '3';
                    }

                    return 0;
                });
        }

        /**
         * @name generateFiscalAxis
         * @param {number} w The width of the fiscal axis/panel
         * @param {number} h The height of the fiscal axis
         * @param {number} leftMargin The left margin between svg and task axis
         * @desc draw the fiscal year axis
         * @returns {void}
         */
        function generateFiscalAxis(w, h, leftMargin) {
            var xScale = getAxisScale('dates'),
                monthLabels = [
                    'J',
                    'F',
                    'M',
                    'A',
                    'M',
                    'J',
                    'J',
                    'A',
                    'S',
                    'O',
                    'N',
                    'D',
                ],
                fiscalAxis,
                headerHeight,
                x,
                y,
                translateY = -h;

            // Set up headerHeight to responsively adapt to panel width
            if (w < 425 && w > 275) {
                headerHeight = 0.7 * h;
            } else if (w < 275) {
                headerHeight = 0.4 * h;
            } else {
                headerHeight = h;
            }
            if (
                ganttConfig.uiOptions.chartTitle.text &&
                ganttConfig.uiOptions.chartTitle.text.length
            ) {
                translateY +=
                    parseInt(ganttConfig.uiOptions.chartTitle.fontSize, 10) + 5;
            }

            svg.selectAll('.fiscalAxisContainer').remove();
            fiscalAxis = svg
                .append('g')
                .attr('class', 'fiscalAxisContainer')
                .attr('transform', 'translate(0,' + translateY + ')');

            // Draw month boxes. Only do so if range is less than or equal to five years
            if (ganttConfig.fiscalData.range <= 5 && w > 425) {
                fiscalAxis
                    .selectAll('.fiscalAxis')
                    .data(ganttConfig.fiscalData.monthData)
                    .enter()
                    .append('g')
                    .attr('transform', function (d) {
                        x = xScale(d.dateStart);
                        y = 0.7 * h;
                        return 'translate(' + x + ',' + y + ')';
                    })
                    .attr('class', 'month-group')
                    .append('rect')
                    .attr('width', function (d) {
                        return xScale(d.dateEnd) - xScale(d.dateStart);
                    })
                    .attr('height', 0.3 * h)
                    .attr('stroke', '#aeb0b5')
                    .attr('stroke-width', 1)
                    .attr('fill', 'none')
                    .attr('text-anchor', 'middle');

                // Draw month labels
                fiscalAxis
                    .selectAll('.month-group')
                    .append('text')
                    .text(function (d) {
                        return monthLabels[d.month];
                    })
                    .attr('transform', function (d) {
                        x =
                            xScale(d.dateEnd) -
                            xScale(d.dateStart) -
                            (xScale(d.dateEnd) - xScale(d.dateStart)) / 2;
                        // x = w / ganttConfig.fiscalData.monthData.length / 4;
                        y = h * 0.2;
                        return 'translate(' + x + ',' + y + ')';
                    })
                    .attr('text-anchor', 'middle');
            }

            // Draw shapes representing fiscal quarters. Only do so if range is less than or equal to 10 years
            if (ganttConfig.fiscalData.range <= 10 && w > 275) {
                fiscalAxis
                    .selectAll('.fiscalAxis')
                    .data(ganttConfig.fiscalData.quarterData)
                    .enter()
                    .append('g')
                    .attr('class', 'quarter-group')
                    .attr('transform', function (d) {
                        x = xScale(d.dateStart);
                        y = 0.4 * h;
                        return 'translate(' + x + ',' + y + ')';
                    })
                    .append('rect')
                    .attr('width', function (d) {
                        return xScale(d.dateEnd) - xScale(d.dateStart);
                    })
                    .attr('height', 0.3 * h)
                    .attr('stroke', '#aeb0b5')
                    .attr('stroke-width', 1)
                    .attr('fill', 'none');

                fiscalAxis
                    .selectAll('.quarter-group')
                    .append('text')
                    .text(function (d) {
                        return 'Q' + d.quarter;
                    })
                    .attr('transform', function (d) {
                        x =
                            xScale(d.dateEnd) -
                            xScale(d.dateStart) -
                            (xScale(d.dateEnd) - xScale(d.dateStart)) / 2;
                        y = h * 0.2;
                        return 'translate(' + x + ',' + y + ')';
                    })
                    .attr('text-anchor', 'middle');
            }
            // Draw shapes representing fiscal years
            fiscalAxis
                .selectAll('.fiscalAxis')
                .data(ganttConfig.fiscalData.yearData)
                .enter()
                .append('g')
                .attr('class', 'year-group')
                .attr('transform', function (d) {
                    x = xScale(d.dateStart);
                    y = 0;
                    return 'translate(' + x + ',' + y + ')';
                })
                .append('rect')
                .attr('width', function (d) {
                    return xScale(d.dateEnd) - xScale(d.dateStart);
                })
                .attr('height', 0.4 * h)
                .attr('stroke', ganttConfig.uiOptions.fiscalAxis.axisColor)
                .attr('stroke-width', 1)
                .attr('fill', ganttConfig.uiOptions.fiscalAxis.axisColor);

            fiscalAxis
                .selectAll('.year-group')
                .append('text')
                .text(function (d) {
                    if (w < 275) {
                        return 'F' + (d.fiscalYear % 100);
                    }
                    return 'FY' + (d.fiscalYear % 100);
                })
                .attr('transform', function (d) {
                    x =
                        xScale(d.dateEnd) -
                        xScale(d.dateStart) -
                        (xScale(d.dateEnd) - xScale(d.dateStart)) / 2;
                    y = h * 0.25;
                    return 'translate(' + x + ',' + y + ')';
                })
                .attr('text-anchor', 'middle')
                .attr('font-weight', function () {
                    if (w < 275) {
                        return 'regular';
                    }
                    return 'bold';
                })
                .style('fill', 'white');

            // Draw task axis header
            fiscalAxis
                .append('rect')
                .attr('class', 'tasksAxisHeader')
                .attr('transform', 'translate(' + -leftMargin + ', 0)')
                .attr('height', headerHeight)
                .attr('width', leftMargin)
                .attr('stroke', ganttConfig.uiOptions.fiscalAxis.axisColor)
                .attr('stroke-width', 1)
                .attr('fill', ganttConfig.uiOptions.fiscalAxis.axisColor);

            fiscalAxis
                .append('text')
                .attr('class', 'tasksAxisHeader')
                .text(function () {
                    if (ganttConfig.uiOptions.ganttGroupView) {
                        return cleanValue(ganttConfig.axisData.groupLabel);
                    }
                    return cleanValue(ganttConfig.axisData.tasks.taskLabel);
                })
                .attr(
                    'transform',
                    'translate(' +
                        -leftMargin / 2 +
                        ',' +
                        (6 + headerHeight / 2) +
                        ')'
                )
                .attr('text-anchor', 'middle')
                .attr('font-weight', 'bold')
                .style('fill', 'white');
        }

        /**
         * @name _getFiscalQuarter
         * @desc given a fiscal year start and date, find the quarter that the date falls into
         * @param {date} fyStart date that fiscal year begins
         * @param {date} date given date
         * @returns {number} the quarter number
         */
        function _getFiscalQuarter(fyStart, date) {
            var fiscalMonth = fyStart.getMonth(),
                month = date.getMonth(),
                distanceFromFYStart =
                    12 - fiscalMonth + month >= 12
                        ? -fiscalMonth + month
                        : 12 - fiscalMonth + month,
                quarter;

            if (distanceFromFYStart <= 2) {
                quarter = 1;
            } else if (distanceFromFYStart <= 5) {
                quarter = 2;
            } else if (distanceFromFYStart <= 8) {
                quarter = 3;
            } else if (distanceFromFYStart <= 11) {
                quarter = 4;
            } else {
                quarter = -1;
            }
            return quarter;
        }

        /**
         * @name _getFiscalYear
         * @desc given a fiscal year start and date, find the year that the date falls into
         * @param {date} fyStart date that fiscal year begins
         * @param {date} date the given date
         * @returns {number} the number representing fiscal year
         */
        function _getFiscalYear(fyStart, date) {
            if (date.getMonth() < fyStart.getMonth()) {
                return date.getFullYear();
            }
            return date.getFullYear() + 1;
        }

        /** ******************************* HANDLE TOOLTIP LOGIC BELOW ***************************/

        /**
         * @name _tooltipMouseover
         * @desc callback function for d3.on('mouseover') that creates, formats and, displays tooltip on a JS mouseover event
         * @param {obj} dataObj - d3 data element
         * @param {obj} tooltip - custom object holding information on tooltip
         * @returns {function} d3 selection that activates d3.style callback to activate tooltip
         */
        function _tooltipMouseover(dataObj, tooltip) {
            initializeEvents('mouseover', dataObj);

            if (!ganttConfig.uiOptions.showTooltips) {
                return '';
            }
            d3.select('#GANTT-TOOLTIP').remove();
            let tooltipStyle = ganttConfig.uiOptions.tooltip || {};

            tooltip.tooltipText = _constructTooltip(dataObj);
            tooltip.d3Selection = d3
                .select('body')
                .append('div')
                .html(function () {
                    var tip =
                        '<div class="gantt-tooltip-container">' +
                        '    <div class="gantt-tooltip-text">' +
                        '        ' +
                        tooltip.tooltipText +
                        '    </div>' +
                        '</div>';

                    return tip;
                })
                .attr('id', 'GANTT-TOOLTIP')
                .style('position', 'absolute')
                .style('z-index', 100000000)
                .style('opacity', 0)
                .style('pointer-events', 'none')
                .style(
                    'background-color',
                    tooltipStyle.backgroundColor || '#FFFFFF'
                )
                .style('border-width', tooltipStyle.borderWidth || '0px')
                .style('border-color', tooltipStyle.borderColor || '')
                .style('border-style', 'solid')
                .style('font-size', parseFloat(tooltipStyle.fontSize) || 12)
                .style('font-family', tooltipStyle.fontFamily || 'Inter')
                .style('color', tooltipStyle.fontColor || '#000000');

            // We want to offset the tooltip by it's width and height, so it does not cover the mouse
            // during mousemove
            tooltip.leftOffset = tooltip.d3Selection
                .node()
                .getBoundingClientRect().width;
            tooltip.topOffset = tooltip.d3Selection
                .node()
                .getBoundingClientRect().height;
            tooltip.scrollTop = d3.select('gantt').node().scrollTop;
            // When gantt scrolls, use <gantt>. Else, use chart-container
            tooltip.halfHeight =
                d3.select('gantt').node().getBoundingClientRect().height / 2; // <gantt>
            if (tooltip.halfHeight === 0) {
                tooltip.halfHeight =
                    d3.select('#chart-container').node().getBoundingClientRect()
                        .height / 2;
            }
            tooltip.halfWidth =
                d3.select('#chart-container').node().getBoundingClientRect()
                    .width / 2;

            return tooltip.d3Selection.style('opacity', 1);
        }

        /**
         * @name _tooltipMousemove
         * @desc callback function for d3.on('mousemove') that repositions tooltip on a JS mousemove event
         * @param {obj} tooltip - custom object holding information on tooltip
         * @returns {function} d3 selection that activates d3.style callback to reposition tooltip
         */
        function _tooltipMousemove(tooltip) {
            var xPlacement, yPlacement;

            if (!ganttConfig.uiOptions.showTooltips) {
                return '';
            }
            // Base positioning off offset since gantt can scroll
            if (event.offsetX > tooltip.halfWidth) {
                xPlacement = event.pageX - 1.2 * tooltip.leftOffset;
            } else {
                xPlacement = event.pageX + 0.2 * tooltip.leftOffset;
            }

            if (event.offsetY > tooltip.halfHeight + tooltip.scrollTop) {
                yPlacement = event.pageY - 1.2 * tooltip.topOffset;
            } else {
                yPlacement = event.pageY + 0.2 * tooltip.topOffset;
            }

            // Edge Cases
            if (yPlacement < 0) {
                yPlacement = 0;
            }
            if (xPlacement < 0) {
                xPlacement = 0;
            }
            if (yPlacement + tooltip.topOffset > window.innerHeight) {
                yPlacement = window.innerHeight - tooltip.topOffset;
            }

            return tooltip.d3Selection
                .style('position', 'fixed')
                .style('top', yPlacement + 'px')
                .style('left', xPlacement + 'px');
        }

        /**
         * @name _tooltipMouseout
         * @desc callback function for d3.on('mouseout') that sets opacity to 0 on a JS mouseout event
         * @param {obj} dataObj - d3 data element
         * @param {obj} tooltip - custom object holding information on tooltip
         * @returns {function} d3 selection that activates d3.style callback to reposition tooltip
         */
        function _tooltipMouseout(dataObj, tooltip) {
            initializeEvents('mouseout', dataObj);
            if (!ganttConfig.uiOptions.showTooltips) {
                return '';
            }
            return tooltip.d3Selection.style('opacity', 0);
        }

        /**
         * @name _constructTooltip
         * @desc Using dataObj, construct the html representing a tooltip
         * @param {obj} dataObj - d3 data element
         * @param {obj} tooltip - custom object holding information on tooltip
         * @returns {string} html that contains tooltip text and information
         */
        function _constructTooltip(dataObj) {
            var tooltipText = '',
                color = _getGanttColor(dataObj, 'tooltip'),
                key,
                startDate,
                i,
                endDate,
                timeDiff,
                duration,
                startType,
                tooltipType,
                formatType,
                durationText;

            startType = ganttConfig.startType;
            // Construct tooltip for Target Date Line
            if (dataObj.task && dataObj.task === 'Target_Date_Line') {
                tooltipText +=
                    '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
                    dataObj.color +
                    '"></span>';
                tooltipText += '<b>' + cleanValue(dataObj.label) + '</b><br>';
                tooltipText +=
                    '' +
                    'Date: ' +
                    visualizationUniversal.formatValue(dataObj.date, startType) +
                    '<br>';
                tooltipText +=
                    'Tasks: ' +
                    dataObj.task_matches
                        .map((m) => m.replaceAll('_', ' ').toLowerCase())
                        .join(', ') +
                    '<br>';
                return tooltipText;
            }

            // Construct tooltip for Target Date Range
            if (dataObj.task && dataObj.task === 'Target_Date_Range') {
                tooltipText +=
                    '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
                    dataObj.color +
                    '; opacity:' +
                    dataObj.opacity +
                    ';"></span>';
                tooltipText += '<b>' + cleanValue(dataObj.label) + '</b><br>';
                tooltipText +=
                    '' +
                    'Start Date: ' +
                    visualizationUniversal.formatValue(
                        dataObj.dateStart,
                        startType,
                    ) +
                    '<br>';
                tooltipText +=
                    '' +
                    'End Date: ' +
                    visualizationUniversal.formatValue(dataObj.dateEnd, startType) +
                    '<br>';
                if (dataObj.description) {
                    tooltipText +=
                        '' +
                        'Description: ' +
                        cleanValue(dataObj.description) +
                        '<br>';
                }
                return tooltipText;
            }

            for (key in dataObj) {
                if (dataObj.hasOwnProperty(key)) {
                    // check if custom formats have been applied

                    if (key === 'tooltip') {
                        for (
                            i = 0;
                            i < ganttConfig.modelKeyMapping.tooltip.length;
                            i++
                        ) {
                            tooltipType =
                                dataTypes[ganttConfig.modelKeyMapping[key][i]][0];
                            tooltipText +=
                                '<b>' +
                                cleanValue(ganttConfig.modelKeyMapping[key][i]) +
                                ':</b> ' +
                                visualizationUniversal.formatValue(
                                    dataObj[key][i],
                                    tooltipType,
                                );
                            tooltipText += '<br>';
                        }
                    } else {
                        const toolTipKeyText = cleanValue(
                            ganttConfig.modelKeyMapping[key],
                        );
                        if (tooltipText.indexOf(toolTipKeyText) === -1) {
                            // Skips duplicate tooltip entries
                            if (
                                (key === 'ganttBar' &&
                                    !ganttConfig.uiOptions.ganttGroupView) ||
                                (key === 'task' && dataObj.task === dataObj.group)
                            ) {
                                continue;
                            }
                            if (
                                key === 'ganttBar' &&
                                ganttConfig.uiOptions.ganttGroupView
                            ) {
                                tooltipText +=
                                    '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
                                    color +
                                    ';"></span>';
                                tooltipText +=
                                    '<b>' +
                                    cleanValue(ganttConfig.modelKeyMapping.group) +
                                    ':</b> ' +
                                    cleanValue(dataObj[key]);
                            } else {
                                if (key === 'task') {
                                    tooltipText +=
                                        '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
                                        color +
                                        ';"></span>';
                                }
                                formatType =
                                    dataTypes[ganttConfig.modelKeyMapping[key]][0];
                                tooltipText +=
                                    '<b>' +
                                    '' +
                                    toolTipKeyText +
                                    ':</b> ' +
                                    visualizationUniversal.formatValue(
                                        dataObj[key],
                                        formatType,
                                    );
                            }
                            formatType =
                                dataTypes[ganttConfig.modelKeyMapping[key]][0];
                            tooltipText +=
                                '<b>' +
                                '' +
                                cleanValue(ganttConfig.modelKeyMapping[key]) +
                                ':</b> ' +
                                visualizationUniversal.formatValue(
                                    dataObj[key],
                                    formatType,
                                );
                        }

                        if (key === 'progress') {
                            tooltipText += '%';
                        }
                        tooltipText += '<br>';
                    }
                }
            }

            if (dataObj.hasOwnProperty('start') && dataObj.hasOwnProperty('end')) {
                startDate = new Date(dataObj.start);
                endDate = new Date(dataObj.end);
                timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
                duration = Math.ceil(timeDiff / (1000 * 3600 * 24));
                if (duration === 1) {
                    durationText = duration + ' day';
                } else {
                    durationText = duration + ' days';
                }
                tooltipText += '<b>Duration:</b> ' + durationText + '<br>';
            }

            return tooltipText;
        }
        /**
         * @name cleanValue
         * @desc Removes underscores and truncates decimals in item
         * @param {any} item - element to be cleaned
         * @returns {any} cleaned element
         */
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
         * @name _getGanttColor
         * @desc Determines color to be applied to dataObj.
         * @param {obj} dataObj - d3 data element
         * @param {any} type - either 'fill' or 'stroke'
         * @param {any} index - same index from drawBars. Represents if we're drawing progress bars or not.
         * @returns {string} string color hex
         */
        function _getGanttColor(dataObj, type, index) {
            var colorIdx = ganttConfig.groups.indexOf(dataObj.group),
                colorByValue,
                highlight;

            if (colorIdx === -1) {
                colorIdx = 0;
            } else if (colorIdx > ganttConfig.color.length - 1) {
                colorIdx = colorIdx % ganttConfig.color.length;
            }

            if (type === 'fill') {
                if (ganttConfig.progressExists && index !== 1) {
                    return '#dbdbdb';
                }
            }

            if (type === 'stroke') {
                highlight = checkHighlight(dataObj);
                if (highlight) {
                    return highlight;
                }
            }

            colorByValue = checkColorByValue(dataObj);

            if (colorByValue) {
                return colorByValue;
            }

            return ganttConfig.color[colorIdx];
        }

        /**
         * @name checkHighlight
         * @desc set stroke color if highlight rule applies to bar
         * @param {obj} dataObj data object
         * @returns {string/bool} string of color or false if rule does not apply
         */
        function checkHighlight(dataObj) {
            var prop, key, value;

            if (
                ganttConfig.uiOptions.highlight &&
                ganttConfig.uiOptions.highlight.data
            ) {
                for (prop in ganttConfig.uiOptions.highlight.data) {
                    if (
                        ganttConfig.uiOptions.highlight.data.hasOwnProperty(
                            prop
                        )
                    ) {
                        for (key in ganttConfig.modelKeyMapping) {
                            if (ganttConfig.modelKeyMapping[key] === prop) {
                                for (value in ganttConfig.uiOptions.highlight
                                    .data[prop]) {
                                    if (
                                        dataObj[key] ===
                                        ganttConfig.uiOptions.highlight.data[
                                            prop
                                        ][value]
                                    ) {
                                        return '#000';
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return false;
        }

        /**
         * @name checkColorByValue
         * @desc set color if color by value rule applies to specific bar
         * @param {obj} dataObj data object
         * @returns {string/bool} string of color or false if rule does not apply
         */
        function checkColorByValue(dataObj) {
            var i, j, valueToColor, group, dataObjValue;

            scope.widgetCtrl
                .getWidget('view.visualization.keys.GanttD3')
                .forEach(function (key) {
                    if (key.model === 'group') {
                        group = key.alias;
                    }
                });

            if (
                ganttConfig.uiOptions.colorByValue &&
                ganttConfig.uiOptions.colorByValue.length > 0
            ) {
                for (
                    i = 0;
                    i < ganttConfig.uiOptions.colorByValue.length;
                    i++
                ) {
                    for (
                        j = 0;
                        j <
                        ganttConfig.uiOptions.colorByValue[i].valuesToColor
                            .length;
                        j++
                    ) {
                        valueToColor =
                            ganttConfig.uiOptions.colorByValue[i].valuesToColor[
                                j
                            ];
                        dataObjValue = dataObj.task;
                        if (
                            ganttConfig.uiOptions.colorByValue[i].colorOn ===
                            group
                        ) {
                            if (dataObj.group === valueToColor) {
                                return ganttConfig.uiOptions.colorByValue[i]
                                    .color;
                            }
                        } else if (dataObjValue === valueToColor) {
                            return ganttConfig.uiOptions.colorByValue[i].color;
                        }
                    }
                }
            }

            return false;
        }

        /**
         * @name getAxisScale
         * @desc determine scale based on axis type (dates vs. tasks) and axis values
         * @param {string} axisType either 'dates' or 'tasks'
         * @returns {void}
         */
        function getAxisScale(axisType) {
            var scale, maxValue, minValue, oneDay, i;

            if (axisType === 'dates') {
                for (i = 0; i < ganttConfig.axisData.dates.length; i++) {
                    ganttConfig.axisData.dates[i] = new Date(
                        ganttConfig.axisData.dates[i]
                    );
                }
                oneDay = 1000 * 60 * 60 * 24;
                maxValue =
                    Math.max.apply(null, ganttConfig.axisData.dates) + oneDay;
                minValue =
                    Math.min.apply(null, ganttConfig.axisData.dates) - oneDay;
                scale = d3
                    .scaleTime()
                    .domain([new Date(minValue), new Date(maxValue)])
                    .rangeRound([0, width]);

                return scale;
            }

            // if (ganttConfig.axisData.tasks.dataType === 'STRING') {
            scale = d3
                .scaleBand()
                .domain(ganttConfig.axisData.tasks.values)
                .range([0, height])
                .paddingInner([0.2])
                .paddingOuter([0.1]);

            return scale;
        }

        /**
         * @name generateTodaysDateLine
         * @desc draw a line representing today's date
         * @param {obj} x - dates svg scale
         * @param {string} startType start type
         * @returns {void}
         */
        function generateTodaysDateLine(x, startType) {
            var currentDate = new Date(),
                dateData = [currentDate];

            if (
                currentDate > Math.max.apply(null, ganttConfig.axisData.dates)
            ) {
                return;
            }

            // Draws a line representing the current date
            svg.selectAll('.currentDateLine')
                .data(dateData)
                .enter()
                .append('line')
                .attr('x1', function (d) {
                    return x(d);
                })
                .attr('x2', function (d) {
                    return x(d);
                })
                .attr('y1', function () {
                    return height * 0;
                })
                .attr('y2', function () {
                    return height * 1;
                })
                .attr('class', 'currentDateLine')
                .attr('stroke', '#000000')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '3, 3')
                .style('pointer-events', 'none');

            svg.selectAll('.currentDateLabel')
                .data(dateData)
                .enter()
                .append('text')
                .text(function () {
                    var today = new Date(),
                        dd = today.getDate(),
                        mm = today.getMonth() + 1, // January is 0!
                        yyyy = today.getFullYear();
                    if (dd < 10) {
                        dd = '0' + dd;
                    }
                    if (mm < 10) {
                        mm = '0' + mm;
                    }
                    if (!startType || startType === '') {
                        return mm + '/' + dd + '/' + yyyy;
                    }
                    return visualizationUniversal.formatValue(today, startType);
                })
                .attr('x', function (d) {
                    return x(d);
                })
                .attr('y', function () {
                    if (ganttConfig.uiOptions.fiscalAxis.enabled === 'Yes') {
                        return height + 25;
                    }
                    return -25;
                })
                .attr('text-anchor', 'middle')
                .attr('fill', '#000000')
                .style('pointer-events', 'none');
        }

        /**
         * @name generateTargetLine
         * @desc draw target lines specified by user
         * @param {obj} x - dates svg scale
         * @param {array} dates - array of dates for target lines
         * @returns {void}
         */
        function generateTargetLine(x, dates) {
            dates.forEach((e) => {
                e.task = 'Target_Date_Line';
                let current_date = new Date(e.date);
                let task_matches = ganttConfig.chartData
                    .filter(
                        (data) =>
                            current_date >= new Date(data.start) &&
                            current_date <= new Date(data.end)
                    )
                    .map((data) => data.task);
                e.task_matches = task_matches;
            });
            let tooltip = {};
            let min_date = Math.min.apply(null, ganttConfig.axisData.dates);
            let max_date = Math.max.apply(null, ganttConfig.axisData.dates);
            let dates_length = dates.length;
            dates = dates.filter((e) => {
                let current_date = new Date(e.date);
                return current_date >= min_date && current_date <= max_date;
            });

            if (dates.length != dates_length) {
                scope.widgetCtrl.alert(
                    'warn',
                    'One or more target date lines are out of bounds'
                );
            }

            svg.selectAll('.targetDateLine')
                .data(dates)
                .enter()
                .append('line')
                .attr('x1', function (d) {
                    return x(new Date(d.date));
                })
                .attr('x2', function (d) {
                    return x(new Date(d.date));
                })
                .attr('y1', function () {
                    return height * 0;
                })
                .attr('y2', function () {
                    return height * 1;
                })
                .attr('class', 'targetDateLine')
                .attr('stroke', function (d) {
                    return d.color;
                })
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '3, 3')
                .style('pointer-events', 'none');

            svg.selectAll('.targetDateHoverBox')
                .data(dates)
                .enter()
                .append('rect')
                .attr('x', function (d) {
                    return x(new Date(d.date)) - 2.5;
                })
                .attr('y', 0)
                .attr('width', '5px')
                .attr('height', height)
                .attr('fill-opacity', 0)
                .on('mouseover', function (d) {
                    return _tooltipMouseover(d, tooltip);
                })
                .on('mousemove', function () {
                    return _tooltipMousemove(tooltip);
                })
                .on('mouseout', function (d) {
                    return _tooltipMouseout(d, tooltip);
                });

            // Display label only if displayValues widget is enabled
            if (ganttConfig.uiOptions.displayValues) {
                svg.selectAll('.targetDateLabel')
                    .data(dates)
                    .enter()
                    .append('text')
                    .text(function (d) {
                        return d.label || 'Target';
                    })
                    .attr('x', function (d) {
                        return x(new Date(d.date));
                    })
                    .attr('y', function () {
                        if (
                            ganttConfig.uiOptions.fiscalAxis.enabled === 'Yes'
                        ) {
                            return height + 40;
                        }
                        return -10;
                    })
                    .attr('text-anchor', 'middle')
                    .attr('fill', function (d) {
                        return d.color;
                    })
                    .style('pointer-events', 'none');
            }
        }

        /**
         * @name generateDateRanges
         * @desc draw a line the target line specified by user
         * @param {obj} x - dates svg scale
         * @param {array/obj} dateRanges - dateRanges from uiOptions.targetDateRange.
         *       Properties of each object within dateRanges
         *          color: Hex value for color of range (e.g. "#0000FF")
         *          dateEnd: string date value for beginning of range (e.g. "2019-08-23")
         *          dateStart: string date value for end of range (e.g. "2019-09-12")
         *          description: string describing range
         *          label: string name for range
         *          opacity: string number between 0.0 and 1.0 inclusive representing
         *                   opacity of range color. (e.g. "0.4")
         * @returns {void}
         */
        function generateDateRanges(x, dateRanges) {
            var tooltip = {},
                i = 0,
                dateMax,
                dateMin,
                fifoRanges = [];

            // Catch ranges outside the axis. Adjust start and end dates based on max and min of range
            dateMax = d3.max(ganttConfig.axisData.dates);
            dateMin = d3.min(ganttConfig.axisData.dates);
            for (i = 0; i < dateRanges.length; i++) {
                dateRanges[i].task = 'Target_Date_Range';
                // Generate Date type for start and finish of range for comparisons
                dateRanges[i].dateStartDate = new Date(dateRanges[i].dateStart);
                dateRanges[i].dateEndDate = new Date(dateRanges[i].dateEnd);
                // catch dates that fall outside range, set to respective min or max in range
                if (dateRanges[i].dateEndDate > dateMax) {
                    dateRanges[i].dateEndDate = dateMax;
                }
                if (dateRanges[i].dateStartDate < dateMin) {
                    dateRanges[i].dateStartDate = dateMin;
                }
            }

            // Paint FIFO, first rule specified is first painted. This way the last range
            // is on top of the stack
            fifoRanges = dateRanges.reverse();

            // Draws a rectangle representing the desired date ranges
            svg.selectAll('.targetDateRange')
                .data(fifoRanges)
                .enter()
                .append('rect')
                .attr('width', function (d) {
                    return x(d.dateEndDate) - x(d.dateStartDate);
                })
                .attr('height', height)
                .attr('x', function (d) {
                    return x(d.dateStartDate);
                })
                .attr('class', 'targetDateRange')
                .attr('stroke', function (d) {
                    return d.color;
                })
                .attr('fill', function (d) {
                    return d.color;
                })
                .attr('opacity', function (d) {
                    return d.opacity;
                })
                .on('mouseover', function (d) {
                    return _tooltipMouseover(d, tooltip);
                })
                .on('mousemove', function () {
                    return _tooltipMousemove(tooltip);
                })
                .on('mouseout', function (d) {
                    return _tooltipMouseout(d, tooltip);
                });
        }

        /**
         * @name generateLegend
         * @desc draw the legend when group dimension exists
         * @returns {void}
         */
        function generateLegend() {
            var legendText,
                numElements,
                elementWidth,
                legendData = ganttConfig.groups,
                legend,
                legendWidth,
                xPos,
                j,
                jj,
                labelStyle = ganttConfig.uiOptions.legend,
                fontColor = labelStyle.fontColor || '#000000',
                fontSize = labelStyle.fontSize || '12px',
                fontFamily = labelStyle.fontFamily || 'Inter',
                fontWeight = labelStyle.fontWeight || 400;

            svg.selectAll('.legend').remove();

            // Calculate Number of Legend Elements to show
            elementWidth = 150;
            numElements =
                Math.floor((dimensions.width * 0.9) / elementWidth) || 1;

            if (legendData.length === 0) {
                ganttConfig.legend.show = [];
                ganttConfig.legend.show.push(ganttConfig.modelKeyMapping.task);
            } else if (numElements > legendData.length) {
                ganttConfig.legend.show = legendData;
            } else {
                ganttConfig.legend.show = [];
                for (
                    j = ganttConfig.legend.startIdx;
                    j < ganttConfig.legend.startIdx + numElements;
                    j++
                ) {
                    if (j >= legendData.length) {
                        jj = j % legendData.length;
                    } else {
                        jj = j;
                    }

                    ganttConfig.legend.show.push(legendData[jj]);
                }
            }

            legend = svg.append('g').attr('class', 'legend');

            // Adding colored rectangles to the legend
            legend
                .selectAll('rect')
                .data(ganttConfig.legend.show)
                .enter()
                .append('rect')
                .attr('class', 'legendRect')
                .attr('x', function (d, i) {
                    xPos = i * elementWidth;
                    return xPos;
                })
                .attr('y', function () {
                    return height + 42.5;
                })
                .attr('rx', 2)
                .attr('ry', 2)
                .attr('width', 25)
                .attr('height', 15)
                .attr('fill', function (d) {
                    var colorObj = {};

                    colorObj.group = d;

                    return _getGanttColor(colorObj);
                })
                .attr('display', 'all')
                .attr('opacity', '1');

            legendText = legend
                .selectAll('text')
                .data(ganttConfig.legend.show)
                .enter()
                .append('text')
                .attr('class', function (d, i) {
                    return (
                        'legendText editable editable-text editable-content editable-legend-' +
                        i
                    );
                })
                .attr('x', function (d, i) {
                    xPos = 30 + i * elementWidth;
                    return xPos;
                })
                .attr('y', function () {
                    return height + 50;
                })
                .attr('text-anchor', 'start')
                .attr('dy', '0.35em')
                .style('fill', fontColor)
                .style('font-size', fontSize)
                .style('font-family', fontFamily)
                .style('font-weight', fontWeight)
                .attr('display', 'all')
                .text(function (d, i) {
                    var elementName = ganttConfig.legend.show[i];

                    if (elementName.length > 12) {
                        return elementName.substring(0, 11) + '...';
                    }

                    return elementName;
                });

            // Adding info box to legend elements when hovering over
            legendText
                .data(ganttConfig.legend.show)
                .append('svg:title')
                .text(function (d) {
                    return d;
                });

            // Centers the legend in the panel
            legendWidth = legend.node().getBBox().width;
            legend.attr(
                'transform',
                'translate(' + (width - legendWidth) / 2 + ', 0)'
            );

            // Only create carousel if the number of elements exceeds one legend "page"
            if (ganttConfig.legend.show.length < ganttConfig.groups.length) {
                createLegendCarousel(numElements);
            }
        }

        /**
         * @name createLegendCarousel
         * @desc draw the legend arrows if we cannot fit all legend elements within panel
         * @param {number} numElements number of legend elements showing
         * @returns {void}
         */
        function createLegendCarousel(numElements) {
            var legendPolygon;

            // Adding carousel to legend
            svg.selectAll('.legend-carousel').remove();

            legendPolygon = svg.append('g').attr('class', 'legend-carousel');

            // Creates left navigation arrow for carousel
            legendPolygon
                .append('polygon')
                .attr('id', 'leftChevron')
                .attr('class', 'pointer-cursor')
                .style('fill', '#000000')
                .attr(
                    'transform',
                    'translate(-' +
                        (dimensions.width - width) / 4 +
                        ',' +
                        (height + 42.5) +
                        ')'
                )
                .attr('points', '0,7.5, 15,0, 15,15')
                .on('click', function () {
                    var idx = ganttConfig.legend.startIdx - numElements;

                    if (idx < 0) {
                        idx =
                            ganttConfig.legend.startIdx %
                            ganttConfig.groups.length;
                    }

                    ganttConfig.legend.startIdx = idx;
                    generateLegend();
                })
                .attr({
                    display: function () {
                        return 'all';
                    },
                });

            // Creates right navigation arrow for carousel
            legendPolygon
                .append('polygon')
                .attr('id', 'rightChevron')
                .attr('class', 'pointer-cursor')
                .style('fill', '#000000')
                .attr(
                    'transform',
                    'translate(' +
                        (width + (dimensions.width - width) / 4) +
                        ',' +
                        (height + 42.5) +
                        ')'
                )
                .attr('points', '15,7.5, 0,0, 0,15')
                .on('click', function () {
                    var idx = ganttConfig.legend.startIdx + numElements;

                    if (idx > ganttConfig.groups.length) {
                        idx =
                            ganttConfig.legend.startIdx %
                            ganttConfig.groups.length;
                    }

                    ganttConfig.legend.startIdx = idx;
                    generateLegend();
                })
                .attr({
                    display: function () {
                        return 'all';
                    },
                });
        }

        /** ******************************* HANDLE EVENTING LOGIC BELOW ***************************/

        /**
         * @name brushEnded
         * @desc handle brush event
         * @returns {void}
         */
        function brushEnded() {
            var e = d3.event.selection,
                startX,
                startY,
                endX,
                endY,
                selectedTasks,
                scaleX = getAxisScale('dates'),
                scaleY = getAxisScale('tasks');

            if (e) {
                startX = scaleX.invert(e[0][0]);
                startY = e[0][1];
                endX = scaleX.invert(e[1][0]);
                endY = e[1][1];
                selectedTasks = getBrushedTasks(
                    startY,
                    endY,
                    scaleY,
                    startX,
                    endX
                );

                ganttConfig.callbacks.defaultMode.onBrush({
                    data: selectedTasks,
                    reset: true,
                    clean: false,
                });
            }
        }

        /**
         * @name getBrushedTasks
         * @desc determine the brushed elements on the tasks axis based off of the brushed area
         * @param {number} startY start y coordinate
         * @param {number} endY endY coordinate
         * @param {object} scaleY d3 task axis scale
         * @param {date} startDate start x date
         * @param {date} endDate end x date
         * @returns {void}
         */
        function getBrushedTasks(startY, endY, scaleY, startDate, endDate) {
            var domain = scaleY.domain(),
                padding = scaleY.padding(),
                step = scaleY.step(),
                minIndex,
                maxIndex,
                paddingDistance = (padding * step) / 2,
                filteredYAxisLabels,
                filteredXTasks = [],
                filteredYTasks = [],
                filteredTotalTasks = [],
                i,
                j,
                returnObj = {};

            if (startY % step > step - paddingDistance) {
                minIndex = Math.floor(startY / step) + 1;
            } else {
                minIndex = Math.floor(startY / step);
            }

            if (endY % step < paddingDistance) {
                maxIndex = Math.floor(endY / step) - 1;
            } else {
                maxIndex = Math.floor(endY / step);
                if (maxIndex === domain.length) {
                    maxIndex -= 1;
                }
            }

            // All tasks within Y range
            filteredYAxisLabels = domain.slice(minIndex, maxIndex + 1);

            // TODO if tasks names are identical, then both are kept, even if only one is brushed
            // Need to consider additional identifying info (start/finish, etc) to uniquely identify
            // brushed items
            if (ganttConfig.uiOptions.ganttGroupView) {
                for (i = 0; i < filteredYAxisLabels.length; i++) {
                    if (
                        ganttConfig.groupInfo.hasOwnProperty(
                            filteredYAxisLabels[i]
                        )
                    ) {
                        // Make sure that each task falls within date range given
                        filteredYTasks =
                            ganttConfig.groupInfo[filteredYAxisLabels[i]].tasks;
                        for (j = 0; j < filteredYTasks.length; j++) {
                            // If milestones exist, then keep all tasks whose milestones fall within brush
                            if (ganttConfig.milestonesExists) {
                                if (
                                    ganttConfig.groupInfo[
                                        filteredYAxisLabels[i]
                                    ].milestoneDates[j] > startDate &&
                                    ganttConfig.groupInfo[
                                        filteredYAxisLabels[i]
                                    ].milestoneDates[j] < endDate
                                ) {
                                    filteredXTasks.push(filteredYTasks[j]);
                                }
                            } else if (
                                ganttConfig.groupInfo[filteredYAxisLabels[i]]
                                    .startDates[j] > startDate &&
                                ganttConfig.groupInfo[filteredYAxisLabels[i]]
                                    .endDates[j] < endDate
                            ) {
                                filteredXTasks.push(filteredYTasks[j]);
                            }
                        }
                    }
                    filteredTotalTasks =
                        filteredTotalTasks.concat(filteredXTasks);
                }
                returnObj[ganttConfig.modelKeyMapping.task] =
                    filteredTotalTasks;
            } else {
                returnObj[ganttConfig.modelKeyMapping.task] =
                    filteredYAxisLabels;
            }
            return returnObj;
        }

        /**
         * @name initializeEvents
         * @desc creates the event layer
         * @param {string} actionType mouseover, mouseout, click, etc.
         * @param {obj} data selected data
         * @returns {void}
         */
        function initializeEvents(actionType, data) {
            var mode, actionData;

            // TODO: Better clarify between shapes/bars for actionData.
            // TODO add double click logic
            if (ganttConfig.currentMode === 'default-mode') {
                mode = formatMode(ganttConfig.currentMode);
                switch (actionType) {
                    case 'mouseover':
                        actionData = getDataForEvents(data);
                        ganttConfig.callbacks[mode].onMouseIn(actionData);
                        break;
                    case 'mouseout':
                        actionData = getDataForEvents(data);
                        ganttConfig.callbacks[mode].onMouseOut(actionData);
                        break;
                    case 'click':
                        actionData = getDataForEvents(data);
                        ganttConfig.callbacks[mode].onClick(actionData);
                        break;
                    default:
                        return;
                }
            }

            // it is necessary to initialize comment mode so the nodes are painted
            EchartsHelper.initializeCommentMode({
                comments: ganttConfig.comments,
                currentMode: ganttConfig.currentMode,
                saveCb: ganttConfig.callbacks.commentMode.onSave,
            });
        }

        /**
         * @name toggleMode
         * @desc switches the jv mode to the new specified mode
         * @returns {void}
         */
        function toggleMode() {
            initializeEvents();
        }

        /**
         * @name getDataForEvents
         * @desc format data for event service
         * @param {obj} data - selected data
         * @returns {obj} selected data formatted for event service
         */
        function getDataForEvents(data) {
            var actionData = {};

            actionData.data = {};
            actionData.data[ganttConfig.axisData.tasks.taskLabel] = [];
            if (data) {
                actionData.data[ganttConfig.axisData.tasks.taskLabel].push(
                    data.task.toString()
                );
            }
            // TODO check if in group view... if in group view, replace key with task dimension not group dimension
            actionData.eventType = '';
            actionData.mouse = [];

            return actionData;
        }
        /**
         * @name formatMode
         * @desc formats mode name for event service
         * @param {string} mode - original mode name
         * @returns {string} formatted mode name
         */
        function formatMode(mode) {
            switch (mode) {
                case 'edit-mode':
                    return 'editMode';
                case 'comment-mode':
                    return 'commentMode';
                case 'select-mode':
                    return 'selectMode';
                default:
                    return 'defaultMode';
            }
        }
        /** ******************************* HANDLE Resizing LOGIC BELOW ***************************/
        /**
         * @name determineMargin
         * @desc detemine the proper margin based on task labels
         * @returns {obj} margin object (top, botton, right, left)
         */
        function determineMargin() {
            var margin = {
                top: 60,
                right: 100,
                bottom: 60,
                left: 100,
            };

            if (ganttConfig.uiOptions.fiscalAxis.enabled === 'Yes') {
                margin.top += 40;
            }

            if (ganttConfig.uiOptions.toggleLegend) {
                margin.bottom += 40;
            }

            if (ganttConfig.groupByInfo) {
                margin.bottom += 40;
            }

            if (ganttConfig.axisData.tasks.maxLabelLenth > 19) {
                margin.left += 60;
            }

            return margin;
        }

        /**
         * @name determineResize
         * @desc detemine parent and chart container dimensions if Facet exists
         * @param {obj} margin margin object (top, bottom, right, left)
         * @returns {number} factor to expand chart container by
         */
        function determineResize(margin) {
            var chartContainer = ele[0].childNodes[0],
                parent = ele[0],
                barHeight,
                barHeightThreshold = 13,
                factor = 1;

            // Reset
            parent.style.position = '';
            parent.style.top = '';
            parent.style.right = '';
            parent.style.bottom = '';
            parent.style.left = '';
            parent.style.overflowY = '';
            chartContainer.style.width = '';
            chartContainer.style.height = '';

            // Calculate
            barHeight =
                (chartContainer.clientHeight - margin.top - margin.bottom) /
                ganttConfig.axisData.tasks.values.length;
            if (barHeight > barHeightThreshold) {
                return;
            }
            factor = barHeightThreshold / barHeight;

            // Apply
            parent.style.position = 'absolute';
            parent.style.top = '0';
            parent.style.right = '0';
            parent.style.bottom = '0';
            parent.style.left = '0';
            parent.style.overflowY = 'auto';
            chartContainer.style.height =
                '' + chartContainer.clientHeight * factor + 'px';
            chartContainer.style.width = '';
            parent.style.overflowY = 'auto';
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
            scope.chartDiv.node().innerHTML = '';
        }

        /** ********* Start Visualization Creation ***************/
        initialize();
    }
}
