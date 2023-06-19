'use strict';

import angular from 'angular';
import './implied-insights-composition.scss';

import * as echarts from 'echarts';
import EchartsHelper from '../../widget-resources/js/echarts/echarts-helper';
import { THEME } from '../../core/constants';

export default angular
    .module('app.implied-insights-composition.directive', [])
    .directive(
        'impliedInsightsComposition',
        impliedInsightsCompositionDirective
    );

impliedInsightsCompositionDirective.$inject = ['semossCoreService', '$timeout'];

function impliedInsightsCompositionDirective(semossCoreService, $timeout) {
    impliedInsightsCompositionLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'E',
        template: require('./implied-insights-composition.directive.html'),
        scope: {},
        require: ['^widget'],
        controllerAs: 'impliedInsightsComposition',
        bindToController: {},
        link: impliedInsightsCompositionLink,
        controller: impliedInsightsCompositionCtrl,
    };

    function impliedInsightsCompositionCtrl() {}

    function impliedInsightsCompositionLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        let resizeVizListener,
            mainColor = THEME.color.scheme.colors[0] || '#40A0FF',
            outlierColor = '#f84c34';

        scope.impliedInsightsComposition.charts = {};
        scope.impliedInsightsComposition.compositionData = {};
        scope.impliedInsightsComposition.summaryData = {};
        scope.impliedInsightsComposition.legend = [
            {
                color: mainColor,
                label: 'Instance',
            },
            {
                color: outlierColor,
                label: 'Outlier',
            },
        ];

        scope.impliedInsightsComposition.paint = paint;

        /**
         * @name paint
         * @desc paints the charts for each column
         * @param index index used to get the chart ele
         * @param col column name
         */
        function paint(index, col) {
            let chartEle = ele[0].querySelector(`#composition-chart-${index}`),
                chart = scope.impliedInsightsComposition.charts[col];
            if (chartEle && col) {
                const chartOptions = THEME.chart,
                    data =
                        scope.impliedInsightsComposition.compositionData[col];

                if (chart) {
                    chart.clear();
                    chart.dispose();
                }

                // Initialize Chart
                chart = echarts.init(chartEle);
                scope.impliedInsightsComposition.charts[col] = chart;
                const option = {
                    backgroundColor: THEME.panel.backgroundColor || '#FFFFFF',
                    color: THEME.color.scheme.colors || '#40A0FF',
                    grid: {
                        top: 10,
                        bottom: 60,
                        left: 120,
                    },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'line',
                        },
                    },
                    yAxis: [
                        {
                            axisTick: {
                                show: false,
                            },
                            splitLine: {
                                show: false,
                            },
                            type: 'category',
                            axisLabel: {
                                formatter: function (label) {
                                    let retString = '';

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
                                fontWeight:
                                    parseInt(
                                        chartOptions.axis.label.fontWeight,
                                        10
                                    ) || 400,
                                fontSize:
                                    parseFloat(
                                        chartOptions.axis.label.fontSize
                                    ) || 14,
                                fontFamily:
                                    chartOptions.axis.label.fontFamily ||
                                    'Inter',
                                color:
                                    chartOptions.axis.label.fontColor ||
                                    '#000000',
                            },
                            data: data.Instance,
                            name: 'Instance',
                            nameLocation: 'middle',
                            nameGap: 100,
                            lineStyle: {
                                color:
                                    chartOptions.axis.borderColor || '#000000',
                                width:
                                    parseFloat(chartOptions.axis.borderWidth) ||
                                    1,
                            },
                            nameTextStyle: {
                                fontWeight:
                                    parseInt(
                                        chartOptions.axis.name.fontWeight,
                                        10
                                    ) || 400,
                                fontSize:
                                    parseFloat(
                                        chartOptions.axis.name.fontSize
                                    ) || 14,
                                fontFamily:
                                    chartOptions.axis.name.fontFamily ||
                                    'Inter',
                                color:
                                    chartOptions.axis.name.fontColor ||
                                    '#000000',
                            },
                        },
                    ],
                    xAxis: [
                        {
                            axisLine: {
                                show: true,
                            },
                            inverse: false,
                            type: 'value',
                            name: 'Frequency',
                            nameLocation: 'middle',
                            nameGap: 30,
                            splitLine: {
                                lineStyle: {
                                    color:
                                        chartOptions.grid.borderColor ||
                                        '#d9d9d9',
                                    width:
                                        parseFloat(
                                            chartOptions.grid.borderWidth
                                        ) || 1,
                                },
                            },
                            lineStyle: {
                                color:
                                    chartOptions.axis.borderColor || '#000000',
                                width:
                                    parseFloat(chartOptions.axis.borderWidth) ||
                                    1,
                            },
                            axisLabel: {
                                fontWeight:
                                    parseInt(
                                        chartOptions.axis.label.fontWeight,
                                        10
                                    ) || 400,
                                fontSize:
                                    parseFloat(
                                        chartOptions.axis.label.fontSize
                                    ) || 14,
                                fontFamily:
                                    chartOptions.axis.label.fontFamily ||
                                    'Inter',
                                color:
                                    chartOptions.axis.label.fontColor ||
                                    '#000000',
                            },
                            nameTextStyle: {
                                fontWeight:
                                    parseInt(
                                        chartOptions.axis.name.fontWeight,
                                        10
                                    ) || 400,
                                fontSize:
                                    parseFloat(
                                        chartOptions.axis.name.fontSize
                                    ) || 14,
                                fontFamily:
                                    chartOptions.axis.name.fontFamily ||
                                    'Inter',
                                color:
                                    chartOptions.axis.name.fontColor ||
                                    '#000000',
                            },
                        },
                    ],
                    barWidth: 'Default',
                    series: {
                        barGap: '5%',
                        data: data.Frequency,
                        type: 'bar',
                        cursor: 'default',
                    },
                };

                // Paint
                EchartsHelper.setOption(chart, option);
            }
        }

        /**
         * @name addSummaryData
         * @desc gets the summary data in the correct format
         * @param data raw data
         */
        function addSummaryData(data) {
            for (let i = 0; i < data.data.values.length; i++) {
                const colData = data.data.values[i];
                scope.impliedInsightsComposition.summaryData[colData[0]] = {};
                for (let d = 1; d < colData.length; d++) {
                    const key = data.data.headers[d];
                    scope.impliedInsightsComposition.summaryData[colData[0]][
                        key
                    ] = colData[d];
                }
            }
        }

        /**
         * @name addCompositionData
         * @desc gets the composition data in the correct format
         * @param data raw data
         */
        function addCompositionData(data) {
            const headerIndex = {
                Column: 0, // Column
                Frequency: 1, // Frequency
                Instance: 2, // Instance
                Outlier: 3,
            };

            for (let i = 0; i < data.data.values.length; i++) {
                const key = data.data.values[i][headerIndex.Column];
                if (
                    scope.impliedInsightsComposition.compositionData.hasOwnProperty(
                        key
                    )
                ) {
                    scope.impliedInsightsComposition.compositionData[
                        key
                    ].Frequency.push({
                        value: data.data.values[i][headerIndex.Frequency],
                        itemStyle: {
                            color:
                                data.data.values[i][headerIndex.Outlier] ===
                                'TRUE'
                                    ? outlierColor
                                    : mainColor,
                        },
                    });
                    scope.impliedInsightsComposition.compositionData[
                        key
                    ].Instance.push(data.data.values[i][headerIndex.Instance]);
                } else {
                    scope.impliedInsightsComposition.compositionData[key] = {
                        Frequency: [
                            {
                                value: data.data.values[i][
                                    headerIndex.Frequency
                                ],
                                itemStyle: {
                                    color:
                                        data.data.values[i][
                                            headerIndex.Outlier
                                        ] === 'TRUE'
                                            ? outlierColor
                                            : mainColor,
                                },
                            },
                        ],
                        Instance: [data.data.values[i][headerIndex.Instance]],
                    };
                }
            }
        }

        /**
         * @name getData
         * @desc queries the data from a list of frames
         * @param frames list of frames
         */
        function getData(frames) {
            scope.impliedInsightsComposition.compositionData = {};
            scope.impliedInsightsComposition.summaryData = {};

            for (const key in frames) {
                const callback = function (response) {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0];
                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }
                    if (key !== 'composition') {
                        addSummaryData(output);
                    } else {
                        addCompositionData(output);
                        $timeout(function () {
                            for (
                                let i = 0;
                                i <
                                Object.keys(
                                    scope.impliedInsightsComposition
                                        .compositionData
                                ).length;
                                i++
                            ) {
                                const col = Object.keys(
                                    scope.impliedInsightsComposition
                                        .compositionData
                                )[i];
                                paint(i, col);
                            }
                        });
                    }
                };
                scope.widgetCtrl.meta(
                    [
                        {
                            meta: true,
                            type: 'frame',
                            components: [frames[key]],
                        },
                        {
                            type: 'queryAll',
                            components: [],
                        },
                        {
                            type: 'collect',
                            components: [-1],
                            terminal: true,
                        },
                    ],
                    callback
                );
            }
        }

        /**
         * @name initialize
         * @desc initialize the widget
         */
        function initialize(): void {
            const active = scope.widgetCtrl.getWidget('active'),
                frames = scope.widgetCtrl.getWidget(
                    'view.' + active + '.options.frames'
                );

            if (Object.keys(frames).length) {
                getData(frames);
            }

            resizeVizListener = scope.widgetCtrl.on(
                'resize-widget',
                function () {
                    for (const chart in scope.impliedInsightsComposition
                        .charts) {
                        if (scope.impliedInsightsComposition.charts[chart]) {
                            scope.impliedInsightsComposition.charts[
                                chart
                            ].resize();
                        }
                    }
                }
            );

            scope.$on('$destroy', function () {
                console.log('destroying implied-insights-composition...');
                resizeVizListener();
            });
        }
        initialize();
    }
}
