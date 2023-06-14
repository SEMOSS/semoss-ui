'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import variables from '@/style/src/variables.scss';
import './analytics-summary.scss';

/**
 * @name analytics-summary
 * @desc analytics-summary tabular data - accessible through the left panel
 */
export default angular
    .module('app.analytics-summary.directive', [])
    .directive('analyticsSummary', analyticsSummaryDirective);

analyticsSummaryDirective.$inject = ['semossCoreService'];

function analyticsSummaryDirective(semossCoreService) {
    analyticsSummaryCtrl.$inject = [];
    analyticsSummaryLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'analyticsSummary',
        bindToController: {},
        template: require('./analytics-summary.directive.html'),
        controller: analyticsSummaryCtrl,
        link: analyticsSummaryLink,
    };

    function analyticsSummaryCtrl() {}

    function analyticsSummaryLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var barChartEle, barChart;

        scope.analyticsSummary.headers = [];
        scope.analyticsSummary.selectedHeader = undefined;
        scope.analyticsSummary.noNumericalData = false;

        scope.analyticsSummary.setSelectedHeader = setSelectedHeader;

        /**
         * @name updateHeaders
         * @desc updates the header list
         * @returns {void}
         */
        function updateHeaders() {
            var output = scope.widgetCtrl.getFrame('headers') || [],
                keepSelected = false,
                i,
                len,
                selected;

            scope.analyticsSummary.headers = [];

            for (i = 0, len = output.length; i < len; i++) {
                if (output[i].dataType === 'NUMBER') {
                    scope.analyticsSummary.headers.push(output[i]);
                }
            }

            scope.analyticsSummary.noNumericalData =
                scope.analyticsSummary.headers.length === 0;

            if (scope.analyticsSummary.noNumericalData) {
                return;
            }

            selected = scope.widgetCtrl.getSelected('selected');

            if (selected && selected.length > 0) {
                for (
                    i = 0, len = scope.analyticsSummary.headers.length;
                    i < len;
                    i++
                ) {
                    if (
                        scope.analyticsSummary.headers.alias ===
                        selected[0].alias
                    ) {
                        keepSelected = true;
                        break;
                    }
                }
            }

            if (keepSelected) {
                setSelectedHeader(selected[0].alias);
            } else if (scope.analyticsSummary.headers[0]) {
                setSelectedHeader(scope.analyticsSummary.headers[0].alias);
            }
        }

        /**
         * @name setSelectedHeader
         * @param {string} alias - selected alias
         * @desc function to update the the summary statistics for a specified header
         * @returns {void}
         */
        function setSelectedHeader(alias) {
            var callback;

            scope.analyticsSummary.selectedHeader = alias;

            callback = function (output) {
                var type = output.pixelReturn[0].operationType;

                scope.analyticsSummary.loading = false;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                formatData(output.pixelReturn[0].output.data.values);
            };

            scope.analyticsSummary.loading = true;

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            scope.widgetCtrl.getFrame('name') +
                                ' | SummaryStats(column=["' +
                                scope.analyticsSummary.selectedHeader +
                                '"], panel=[99])',
                        ],
                        terminal: true,
                    },
                ],
                callback,
                []
            );
        }

        /**
         * @name formatData
         * @param {array} results results from SummaryStats pixel for selected header
         * @returns {void}
         * @desc Takes in our chart data and converts it to echarts bar chart standard.
         *       Once this is done the function also paints our bar chart.
         */
        function formatData(results) {
            var headers = [],
                values = [],
                rawValues = [],
                labelRight,
                maxValue,
                maxValues = [],
                i;

            labelRight = {
                normal: {
                    position: 'insideLeft',
                },
            };

            for (i = 0; i < results.length; i++) {
                if (results[i][0] !== "NA's") {
                    headers.push(results[i][0]);
                    values.push({
                        value: results[i][1],
                        label: labelRight,
                    });
                    rawValues.push(results[i][1]);
                }
            }

            maxValue = Math.max.apply(null, rawValues);
            for (i = 0; i < results.length; i++) {
                maxValues.push(maxValue);
            }

            paint(headers, values, maxValues);
        }

        /**
         * @name paint
         * @param {array} headers formatted headers
         * @param {array} values formatted data
         * @param {num} maxValues max value
         * @returns {void}
         * @desc Takes in our chart data and converts it to echarts bar chart standard.
         *       Once this is done the function also paints our bar chart.
         */
        function paint(headers, values, maxValues) {
            var option,
                bgColor = variables.backgroundAlt,
                primaryColor = variables.defaultPrimary;

            // When data changes we need to make sure that we destroy the old chart
            if (barChart) {
                barChart.clear();
                barChart.dispose();
            }

            // Initialize Chart
            barChart = echarts.init(barChartEle);

            // ******** FORMAT DATA FOR ECHARTS *********
            option = {
                backgroundColor: bgColor,
                color: [primaryColor],
                tooltip: {
                    show: false,
                },
                grid: {
                    top: 0,
                    bottom: 30,
                    left: 100,
                    right: 40,
                },
                xAxis: {
                    type: 'value',
                    position: 'top',
                    axisLine: {
                        show: false,
                    },
                    axisLabel: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                    splitLine: {
                        show: false,
                    },
                },
                yAxis: {
                    type: 'category',
                    axisLine: {
                        show: false,
                    },
                    axisLabel: {
                        show: true,
                    },
                    axisTick: {
                        show: false,
                    },
                    splitLine: {
                        show: false,
                    },
                    data: headers,
                },
                series: [
                    {
                        type: 'bar',
                        itemStyle: {
                            normal: {
                                color: '#ededed',
                            },
                        },
                        silent: true,
                        barWidth: 35,
                        barGap: '-100%', // Make series be overlap
                        barCategoryGap: '10%',
                        data: maxValues,
                        animationDuration: 0,
                    },
                    {
                        type: 'bar',
                        label: {
                            normal: {
                                show: true,
                                formatter: function (info) {
                                    return cleanValue(info.value);
                                },
                                color: '#000000',
                            },
                        },
                        barWidth: 35,
                        z: 10,
                        barCategoryGap: '10%',
                        data: values,
                    },
                ],
            };

            // Paint
            EchartsHelper.setOption(barChart, option);
        }

        /**
         * @name cleanValue
         * @param {string | number} item value to clean
         * @return {string} clean value
         * @desc cleans and formats a value
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
         * @name resizeViz
         * @return {void}
         * @desc helper function for resizing our analytics bar chart
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
            var analyticsSummarySelectListener,
                analyticsSummaryUpdateFrameListener,
                frameType = scope.widgetCtrl.getFrame('type');

            barChartEle = ele[0].querySelector(
                '#analytics-summary__chart__hook'
            );

            // add listeners
            analyticsSummarySelectListener = scope.widgetCtrl.on(
                'update-selected',
                function () {
                    var selected = scope.widgetCtrl.getSelected('selected'),
                        keepSelected = false,
                        i,
                        len;
                    if (selected && selected.length > 0) {
                        // validate
                        for (
                            i = 0, len = scope.analyticsSummary.headers.length;
                            i < len;
                            i++
                        ) {
                            if (
                                scope.analyticsSummary.headers[i].alias ===
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
            analyticsSummaryUpdateFrameListener = scope.widgetCtrl.on(
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
                analyticsSummaryUpdateFrameListener();
                analyticsSummarySelectListener();
            });

            // if frame type is already R, we know it's not being converted and wont trigger the above listeners to run summary stats pixel, so we will run it here.
            if (frameType === 'R') {
                updateHeaders();
            }
        }

        initialize();
    }
}
