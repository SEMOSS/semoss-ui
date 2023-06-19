'use strict';

import angular from 'angular';
import './implied-insights-attribute-importance.scss';

import * as echarts from 'echarts';
import EchartsHelper from '../../widget-resources/js/echarts/echarts-helper';
import { THEME } from '../../core/constants';

export default angular
    .module('app.implied-insights-attribute-importance.directive', [])
    .directive(
        'impliedInsightsAttributeImportance',
        attributeImportanceDirective
    );

attributeImportanceDirective.$inject = ['semossCoreService'];

function attributeImportanceDirective(semossCoreService) {
    attributeImportanceLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'E',
        template: require('./implied-insights-attribute-importance.directive.html'),
        scope: {},
        require: ['^widget'],
        controllerAs: 'attributeImportance',
        bindToController: {},
        link: attributeImportanceLink,
        controller: attributeImportanceCtrl,
    };

    function attributeImportanceCtrl() {}

    function attributeImportanceLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        let barChartEle, resizeVizListener, barChart;

        scope.attributeImportance.selectedCol = '';
        scope.attributeImportance.selectedFrame = '';
        scope.attributeImportance.columns = [];
        scope.attributeImportance.tableData = [];

        scope.attributeImportance.runAttributeImportance =
            runAttributeImportance;
        /**
         * @name runAttributeImportance
         * @desc runs the reactor that will retrieve the attribute importance data
         */
        function runAttributeImportance(): void {
            if (scope.attributeImportance.selectedCol.length) {
                const callback = function (response) {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0];
                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }
                    scope.attributeImportance.tableData =
                        semossCoreService.visualization.getTableData(
                            output.headers,
                            output.values,
                            output.headers
                        );
                    paint();
                };
                scope.widgetCtrl.meta(
                    [
                        {
                            type: 'Pixel',
                            components: [
                                `${scope.attributeImportance.selectedFrame} | RunKeyAttributes(column=["${scope.attributeImportance.selectedCol}"])`,
                            ],
                            terminal: true,
                        },
                    ],
                    callback
                );
            }
        }

        /**
         * @name paint
         * @desc creates the bar chart
         */
        function paint(): void {
            const chartOptions = THEME.chart;

            if (barChart) {
                barChart.clear();
                barChart.dispose();
            }

            // Initialize Chart
            barChart = echarts.init(barChartEle);

            const option = {
                backgroundColor: THEME.panel.backgroundColor || '#FFFFFF',
                color: THEME.color.scheme.colors || '#40A0FF',
                grid: {
                    top: 10,
                    bottom: 60,
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'line',
                    },
                },
                xAxis: [
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
                                parseFloat(chartOptions.axis.label.fontSize) ||
                                14,
                            fontFamily:
                                chartOptions.axis.label.fontFamily || 'Inter',
                            color:
                                chartOptions.axis.label.fontColor || '#000000',
                        },
                        data: scope.attributeImportance.tableData.labelData
                            .Feature,
                        name: 'Feature',
                        nameLocation: 'middle',
                        nameGap: 30,
                        lineStyle: {
                            color: chartOptions.axis.borderColor || '#000000',
                            width:
                                parseFloat(chartOptions.axis.borderWidth) || 1,
                        },
                        nameTextStyle: {
                            fontWeight:
                                parseInt(
                                    chartOptions.axis.name.fontWeight,
                                    10
                                ) || 400,
                            fontSize:
                                parseFloat(chartOptions.axis.name.fontSize) ||
                                14,
                            fontFamily:
                                chartOptions.axis.name.fontFamily || 'Inter',
                            color:
                                chartOptions.axis.name.fontColor || '#000000',
                        },
                    },
                ],
                yAxis: [
                    {
                        axisLine: {
                            show: true,
                        },
                        inverse: false,
                        type: 'value',
                        name: 'Importance',
                        nameLocation: 'middle',
                        nameGap: 40,
                        splitLine: {
                            lineStyle: {
                                color:
                                    chartOptions.grid.borderColor || '#d9d9d9',
                                width:
                                    parseFloat(chartOptions.grid.borderWidth) ||
                                    1,
                            },
                        },
                        lineStyle: {
                            color: chartOptions.axis.borderColor || '#000000',
                            width:
                                parseFloat(chartOptions.axis.borderWidth) || 1,
                        },
                        axisLabel: {
                            fontWeight:
                                parseInt(
                                    chartOptions.axis.label.fontWeight,
                                    10
                                ) || 400,
                            fontSize:
                                parseFloat(chartOptions.axis.label.fontSize) ||
                                14,
                            fontFamily:
                                chartOptions.axis.label.fontFamily || 'Inter',
                            color:
                                chartOptions.axis.label.fontColor || '#000000',
                        },
                        nameTextStyle: {
                            fontWeight:
                                parseInt(
                                    chartOptions.axis.name.fontWeight,
                                    10
                                ) || 400,
                            fontSize:
                                parseFloat(chartOptions.axis.name.fontSize) ||
                                14,
                            fontFamily:
                                chartOptions.axis.name.fontFamily || 'Inter',
                            color:
                                chartOptions.axis.name.fontColor || '#000000',
                        },
                    },
                ],
                barWidth: 'Default',
                series: {
                    barGap: '5%',
                    data: scope.attributeImportance.tableData.labelData
                        .Importance,
                    type: 'bar',
                    cursor: 'default',
                },
            };

            // Paint
            EchartsHelper.setOption(barChart, option);
        }

        /**
         * @name resizeViz
         * @desc resize the viz when the panel size changes
         */
        function resizeViz(): void {
            if (barChart) {
                barChart.resize();
            }
        }

        /**
         * @name initialize
         * @desc initialize the widget
         */
        function initialize(): void {
            const active = scope.widgetCtrl.getWidget('active');
            scope.attributeImportance.selectedFrame =
                scope.widgetCtrl.getWidget('view.' + active + '.options.frame');
            scope.attributeImportance.columns = scope.widgetCtrl.getWidget(
                'view.' + active + '.options.columns'
            );
            barChartEle = ele[0].querySelector('#attribute-importance__chart');

            resizeVizListener = scope.widgetCtrl.on('resize-widget', resizeViz);

            scope.$on('$destroy', function () {
                console.log('destroying attribute-importance...');
                resizeVizListener();
            });
        }
        initialize();
    }
}
