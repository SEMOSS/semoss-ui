'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import variables from '@/style/src/variables.scss';
import './clean-statistics.scss';

/**
 * @name clean-statistics
 * @desc clean-statistics tabular data - accessible through the left panel
 */
export default angular
    .module('app.clean-statistics.directive', [])
    .directive('cleanStatistics', cleanStatisticsDirective);

cleanStatisticsDirective.$inject = ['semossCoreService'];

function cleanStatisticsDirective(semossCoreService) {
    cleanStatisticsCtrl.$inject = [];
    cleanStatisticsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'cleanStatistics',
        bindToController: {},
        template: require('./clean-statistics.directive.html'),
        controller: cleanStatisticsCtrl,
        link: cleanStatisticsLink,
    };

    function cleanStatisticsCtrl() {}

    function cleanStatisticsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var barChartEle, barChart;

        scope.cleanStatistics.headers = [];
        scope.cleanStatistics.selectedHeader = undefined;

        scope.cleanStatistics.setSelectedHeader = setSelectedHeader;

        /**
         * @name updateHeaders
         * @desc updates the header list
         * @returns {void}
         */
        function updateHeaders() {
            var frameType = scope.widgetCtrl.getFrame('type'),
                keepSelected = false,
                i,
                len,
                selected;

            if (frameType !== 'R' && frameType !== 'PY') {
                return;
            }

            scope.cleanStatistics.headers =
                scope.widgetCtrl.getFrame('headers') || [];

            selected = scope.widgetCtrl.getSelected('selected');
            if (selected && selected.length > 0) {
                for (
                    i = 0, len = scope.cleanStatistics.headers.length;
                    i < len;
                    i++
                ) {
                    if (
                        scope.cleanStatistics.headers[i].alias ===
                        selected[0].alias
                    ) {
                        keepSelected = true;
                        break;
                    }
                }
            }

            if (keepSelected) {
                setSelectedHeader(selected[0].alias);
            } else if (scope.cleanStatistics.headers[0]) {
                setSelectedHeader(scope.cleanStatistics.headers[0].alias);
            }
        }

        /**
         * @name setSelectedHeader
         * @param {string} alias - selected alias
         * @desc function to update the the histogram and statistics for a specified header
         * @returns {void}
         */
        function setSelectedHeader(alias) {
            var selectedHeaderInfo,
                pixel = scope.widgetCtrl.getFrame('name') + '|',
                i,
                len,
                callback;

            scope.cleanStatistics.selectedHeader = alias;

            // clear chart data
            scope.cleanStatistics.chartData = null;

            for (
                i = 0, len = scope.cleanStatistics.headers.length;
                i < len;
                i++
            ) {
                if (
                    scope.cleanStatistics.selectedHeader ===
                    scope.cleanStatistics.headers[i].alias
                ) {
                    selectedHeaderInfo = scope.cleanStatistics.headers[i];
                }
            }

            if (!selectedHeaderInfo) {
                console.warn(
                    'Incorrect header received: ' +
                        scope.cleanStatistics.selectedHeader
                );
                return;
            }

            // set header
            if (
                selectedHeaderInfo.dataType === 'STRING' ||
                selectedHeaderInfo.dataType === 'DATE'
            ) {
                pixel +=
                    'ColumnCount(column = [' +
                    selectedHeaderInfo.alias +
                    '], top = [true], panel = ["0"] );';
            } else {
                pixel +=
                    'Histogram(column = [' +
                    selectedHeaderInfo.alias +
                    '], breaks = [0], panel = ["0"] );';
            }

            // register message to come back to
            callback = function (response) {
                // order dependent
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                scope.cleanStatistics.loading = false;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // histogram
                if (output) {
                    scope.widgetCtrl.emit('shift-clean-grid', {
                        column: alias,
                    });
                    setColumnData(output);
                }
            };

            scope.cleanStatistics.loading = true;

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                        meta: true,
                    },
                ],
                callback,
                []
            );
        }

        /**
         * @name setColumnData
         * @param {object} output output to reformat
         * @returns {void}
         * @desc Takes in our chart data and converts it to echarts bar chart standard.
         *       Once this is done the function also paints our bar chart.
         */
        function setColumnData(output) {
            var lgdData = [], // holds our data labels
                seriesData = [], // holds our data values
                headerPos = -1, // position of our data labels in our data objects
                valuePos = -1, // position of our data values in our data objects
                option, // option for paitning our echart
                header, // header label
                tempVal,
                i;

            // When data changes we need to make sure that we destroy the old chart
            if (barChart) {
                barChart.clear();
                barChart.dispose();
            }

            // Initialize Chart
            barChart = echarts.init(barChartEle);

            // ******** FORMAT DATA FOR ECHARTS *********

            // Grab the name of our header
            for (i = 0; i < output.headerInfo.length; i++) {
                if (output.headerInfo[i].alias !== 'Frequency') {
                    header = output.headerInfo[i].alias;
                    break;
                }
            }

            // Get the position of our header and values
            for (i = 0; i < output.data.headers.length; i++) {
                if (output.data.headers[i] === header) {
                    headerPos = i;
                } else {
                    valuePos = i;
                }
            }

            // Now that we know the position of our headers and values, loop
            // through our data and assign data appropriately
            for (i = 0; i < output.data.values.length; i++) {
                tempVal = output.data.values[i][headerPos];

                if (typeof tempVal === 'string') {
                    tempVal = tempVal.replace(/_/g, ' ');
                }

                lgdData.push(tempVal);

                tempVal = output.data.values[i][valuePos];

                if (typeof tempVal === 'string') {
                    tempVal = tempVal.replace(/_/g, ' ');
                }

                seriesData.push({
                    value: tempVal,
                });
            }

            let bgColor = variables.backgroundAlt,
                primaryColor = variables.defaultPrimary;
            // Set our echarts option
            option = {
                backgroundColor: bgColor,
                color: [primaryColor],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'line',
                    },
                },
                xAxis: [
                    {
                        axisTick: {
                            alignWithLabel: true,
                        },
                        data: lgdData,
                        splitLine: {
                            show: false,
                        },
                        type: 'category',
                        axisLabel: {
                            formatter: function (label) {
                                var retString = '';

                                // If label is longer than 12 chars, give it an ellipsis at the 10th position (...)
                                if (label.length > 12) {
                                    retString = label.replace(
                                        /^(.{10}).+/,
                                        '$1...'
                                    );
                                } else {
                                    retString = label;
                                }

                                return retString;
                            },
                        },
                    },
                ],
                yAxis: [
                    {
                        inverse: false,
                        type: 'value',
                    },
                ],
                barWidth: 'Default',
                series: {
                    barGap: '5%',
                    data: seriesData,
                    name: 'Frequency',
                    type: 'bar',
                    cursor: 'default',
                },
            };

            // Paint
            EchartsHelper.setOption(barChart, option);
        }

        /**
         * @name resizeViz
         * @return {void}
         * @desc helper function for resizing our clean bar chart
         */
        function resizeViz() {
            if (barChart) {
                barChart.resize();
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var cleanStatisticsUpdateFrameListener,
                cleanStatisticsSelectListener;

            barChartEle = ele[0].querySelector(
                '#clean-statistics__chart__hook'
            );

            // add listeners
            cleanStatisticsSelectListener = scope.widgetCtrl.on(
                'update-selected',
                function () {
                    var selected = scope.widgetCtrl.getSelected('selected'),
                        keepSelected = false,
                        i,
                        len;
                    if (selected && selected.length > 0) {
                        // validate
                        for (
                            i = 0, len = scope.cleanStatistics.headers.length;
                            i < len;
                            i++
                        ) {
                            if (
                                scope.cleanStatistics.headers[i].alias ===
                                selected[0].alias
                            ) {
                                keepSelected = true;
                                break;
                            }
                        }

                        if (keepSelected) {
                            setSelectedHeader(selected[0].alias);
                        }
                    }
                }
            );

            cleanStatisticsUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                updateHeaders
            );

            // resize listener
            scope.$watch(
                function () {
                    return (
                        barChartEle.offsetHeight + '-' + barChartEle.offsetWidth
                    );
                },
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        resizeViz();
                    }
                }
            );

            // cleanup
            scope.$on('$destroy', function () {
                cleanStatisticsUpdateFrameListener();
                cleanStatisticsSelectListener();
            });

            updateHeaders();
        }

        initialize();
    }
}
