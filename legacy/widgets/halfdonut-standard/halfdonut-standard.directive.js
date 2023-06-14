'use strict';

import * as d3 from 'd3';
import '@/widget-resources/js/jvCharts/src/jv.css';
/**
 * @name halfdonutStandard
 * @desc halfdonutStandard chart directive for creating and visualizing a line chart
 */

export default angular
    .module('app.halfdonut-standard.directive', [])
    .directive('halfdonutStandard', halfdonutStandard);

halfdonutStandard.$inject = ['$filter', 'semossCoreService'];

function halfdonutStandard($filter, semossCoreService) {
    halfdonutLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: halfdonutLink,
    };

    function halfdonutLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        /** **************Get Chart Div *************************/
        scope.chartDiv = d3.select(ele[0].firstElementChild);
        scope.$on('$destroy', destroy);
        /** ************* Main Event Listeners ************************/
        var updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            resizeListener,
            /** *************** local data Object ****************************/
            halfDonutConfig = {};

        /**
         * @name initialize
         * @desc creates the visualization on the chart div
         * @returns {void}
         */
        function initialize() {
            // bind listeners
            resizeListener = scope.widgetCtrl.on('resize-widget', function () {
                setData();
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

            setData();
        }

        /**
         * @name setData
         * @param {*} transitionTime transition time
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                chartData = semossCoreService.visualization.getTableData(
                    data.headers,
                    data.values,
                    data.rawHeaders
                ),
                tasks = scope.widgetCtrl.getWidget('view.visualization.tasks'),
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                ),
                individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.HalfDonut'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                uiOptions,
                formattedData = '';
            uiOptions = angular.extend(sharedTools, individualTools);
            uiOptions.colorByValue = colorBy;
            halfDonutConfig.uiOptions = uiOptions;
            halfDonutConfig.legend = {};
            halfDonutConfig.legend.original = [];
            if (
                Object.keys(data).length === 0 ||
                Object.keys(
                    semossCoreService.visualization.getDataTableAlign(keys)
                ).length === 0
            ) {
                return;
            }
            for (
                let taskIdx = 0, taskLen = tasks.length;
                taskIdx < taskLen;
                taskIdx++
            ) {
                if (tasks[taskIdx].layout === 'HalfDonut') {
                    formattedData = tasks[taskIdx];
                }
            }
            let tooltip = [],
                value = [],
                label = '',
                targetValue = '',
                headers = {},
                sum = 0,
                bobValue = [],
                formatted;

            // generate the tooltip, label, value
            const keysOptions = formattedData.keys.HalfDonut;
            for (
                let keyIdx = 0, keyLen = keysOptions.length;
                keyIdx < keyLen;
                keyIdx++
            ) {
                if (keysOptions[keyIdx].model === 'tooltip') {
                    tooltip.push(keysOptions[keyIdx].alias);
                } else if (keysOptions[keyIdx].model === 'value') {
                    value = keysOptions[keyIdx].alias;
                } else if (keysOptions[keyIdx].model === 'label') {
                    label = keysOptions[keyIdx].alias;
                } else if (keysOptions[keyIdx].model === 'targetValue') {
                    targetValue = keysOptions[keyIdx].alias;
                }
            }
            for (
                let headerIdx = 0,
                    headerLen = formattedData.data.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                headers[formattedData.data.headers[headerIdx]] = headerIdx;
            }

            formatted = [];
            for (
                let valueIdx = 0, valueLen = data.values.length;
                valueIdx < valueLen;
                valueIdx++
            ) {
                // push the newly formatted data
                sum = sum + data.values[valueIdx][headers[value]];
                bobValue.push({
                    label: targetValue,
                    value: data.values[valueIdx][headers[targetValue]],
                });
                halfDonutConfig.legend.original.push(
                    data.values[valueIdx][headers[label]]
                );
                formatted.push({
                    label: String(
                        data.values[valueIdx][headers[label]]
                    ).replace(/_/g, ' '),
                    targetValue: data.values[valueIdx][headers[targetValue]],
                    value: data.values[valueIdx][headers[value]],
                    tooltip: tooltip.map((t) => {
                        return {
                            label: String(t).replace(/_/g, ' '),
                            value: data.values[valueIdx][headers[t]],
                        };
                    }),
                });
            }
            formatted.sort(function (a, b) {
                return a.value - b.value;
            });
            halfDonutConfig.formatted = formatted;
            halfDonutConfig.valueLabel = value;
            halfDonutConfig.sumOfValues = sum;
            halfDonutConfig.chartData = chartData;
            if (bobValue.length > 0) {
                halfDonutConfig.bobValue = bobValue[0];
            }
            paintDonut();
        }

        /**
         * @name getColorPalette
         * @return {array} Array of the color hex values
         */
        function getColorPalette() {
            const sharedTools = scope.widgetCtrl.getWidget(
                'view.visualization.tools.shared'
            );
            return sharedTools.color;
        }

        /**
         * @name paintDonut
         * @desc paint donut for the visualization and paints
         * @returns {void}
         */
        function paintDonut() {
            scope.chartDiv.select('svg').remove();
            scope.chartDiv.select('.jv-tooltip').remove();
            scope.chartDiv.select('foreignObject').remove();
            // d3.select('.jv-tooltip').remove();
            var color = d3.scaleOrdinal(getColorPalette()),
                formattedData = halfDonutConfig.formatted,
                valueLabel = halfDonutConfig.valueLabel,
                sumOfValues = halfDonutConfig.sumOfValues,
                axisLabel = halfDonutConfig.uiOptions.axis
                    ? halfDonutConfig.uiOptions.axis.label
                    : null,
                tooltipStyle = halfDonutConfig.uiOptions.tooltip || {},
                width = 860,
                height = 400,
                radius = Math.min(width, height),
                subIndicator = null,
                texts,
                tooltip,
                legend,
                foreign,
                innerSvg,
                legendLength,
                legendHeight,
                g;
            // start at 270deg
            let totalPercent = 0.75,
                percToDeg = function (perc) {
                    return perc * 360;
                },
                percToRad = function (perc) {
                    return degToRad(percToDeg(perc));
                },
                degToRad = function (deg) {
                    return (deg * Math.PI) / 180;
                },
                svg = scope.chartDiv
                    .append('svg')
                    .attr('class', 'chart-svg')
                    .attr('width', '100%')
                    .attr('height', '100%')
                    .attr(
                        'viewBox',
                        -width / 2 +
                            ' ' +
                            -height / 1.1 +
                            ' ' +
                            width +
                            ' ' +
                            height
                    )
                    .attr('preserveAspectRatio', 'xMidYMid meet'),
                arc = d3
                    .arc() // this will create <path> elements for us using arc data
                    .innerRadius(radius - 100)
                    .outerRadius(radius - 50), // full height semi pie
                pie = d3
                    .pie() // this will create arc data for us given a list of values
                    .startAngle(-90 * (Math.PI / 180))
                    .endAngle(90 * (Math.PI / 180))
                    .sort(null) // No! we don't want to order it by size
                    .value(function (d) {
                        return d.value;
                    });
            texts = svg.selectAll('.title').data(pie(formattedData)).enter();
            texts
                .append('text')
                .text(function () {
                    return 0 + '%';
                })
                .attr(
                    'transform',
                    'translate(' + -width / 2.6 + ', ' + height / 20 + ')'
                )
                .attr('font-size', axisLabel.fontSize || 15)
                .style('fill', axisLabel.fontColor || '#000000')
                .style('font-family', axisLabel.fontFamily || 'Inter')
                .style('font-weight', axisLabel.fontWeight || 400)
                .attr('class', 'title');
            texts
                .append('text')
                .text(function () {
                    return 100 + '%';
                })
                .attr(
                    'transform',
                    'translate(' + width / 2.8 + ', ' + height / 20 + ')'
                )
                .attr('font-size', axisLabel.fontSize || 15)
                .style('fill', axisLabel.fontColor || '#000000')
                .style('font-family', axisLabel.fontFamily || 'Inter')
                .style('font-weight', axisLabel.fontWeight || 400)
                .attr('class', 'title');

            tooltip = scope.chartDiv // select element in the DOM with id 'chart'
                .append('div') // append a div element to the element we've selected
                .attr('class', 'jv-tooltip') // add class 'tooltip' on the divs we just selected
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
            tooltip
                .append('div') // add divs to the tooltip defined above
                .attr('class', 'label'); // add class 'label' on the selection
            tooltip
                .append('div') // add divs to the tooltip defined above
                .attr('class', 'percent');
            g = svg
                .selectAll('.chart-arc')
                .data(pie(formattedData))
                .enter()
                .append('g')
                .attr('class', 'chart-arc');
            g.append('path')
                .attr('d', arc)
                .style('fill', function (d) {
                    return color(d.data.label);
                })
                .on('mouseover', function (d) {
                    let tooltipColor =
                        '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
                        color(d.data.label) +
                        '"></span>';
                    tooltip
                        .select('.label')
                        .html(
                            tooltipColor +
                                ' ' +
                                String(d.data.label).replace(/_/g, ' ')
                        ); // set current label
                    tooltip.style('display', 'block');
                    tooltip
                        .select('.percent')
                        .html(
                            String(valueLabel).replace(/_/g, ' ') +
                                ': ' +
                                d.data.value
                        );
                    if (d.data.tooltip && d.data.tooltip.length > 0) {
                        for (
                            let index = 0;
                            index < d.data.tooltip.length;
                            index++
                        ) {
                            tooltip
                                .append('div') // add divs to the extra tooltip defined above
                                .attr('class', 'toolTipOptions' + index);
                            tooltip
                                .select('.toolTipOptions' + index)
                                .html(
                                    d.data.tooltip[index].label +
                                        ': ' +
                                        d.data.tooltip[index].value
                                );
                        }
                    }
                })
                .on('mousemove', function () {
                    tooltip
                        .style('top', d3.event.layerY + 10 + 'px') // always 10px below the cursor
                        .style('left', d3.event.layerX + 10 + 'px');
                })
                .on('mouseout', function () {
                    // when mouse leaves div
                    tooltip.style('display', 'none'); // hide tooltip for that element
                });
            if (halfDonutConfig.uiOptions.displayValues) {
                let fontSize =
                        parseFloat(
                            halfDonutConfig.uiOptions.valueLabel.fontSize
                        ) ||
                        halfDonutConfig.uiOptions.fontSize ||
                        12,
                    fontFamily =
                        halfDonutConfig.uiOptions.valueLabel.fontFamily ||
                        'Inter',
                    fontWeight =
                        halfDonutConfig.uiOptions.valueLabel.fontWeight || 400,
                    fontColor =
                        halfDonutConfig.uiOptions.valueLabel.fontColorAlt ||
                        halfDonutConfig.uiOptions.valueLabel.fontColor ||
                        '#FFFFFF';
                g.append('text') // add a label to each slice
                    .attr('fill', fontColor)
                    .attr('transform', function (d) {
                        // set the label's origin to the center of the arc
                        return 'translate(' + arc.centroid(d) + ')'; // this gives us a pair of coordinates like [50, 50]
                    })
                    .style('font-family', fontFamily)
                    .style('font-size', fontSize)
                    .style('font-weight', fontWeight)
                    .attr('text-anchor', 'middle') // center the text on it's origin
                    .text(function (d) {
                        return typeof d.data.value === 'number'
                            ? ((d.data.value / sumOfValues) * 100).toFixed(1) +
                                  '%'
                            : d.data.value;
                    }); // get the label from our original data array
            }
            if (halfDonutConfig.uiOptions.toggleLegend) {
                let labelStyle = halfDonutConfig.uiOptions.legend,
                    fontColor = labelStyle.fontColor || '#000000',
                    fontSize = labelStyle.fontSize || '12px',
                    fontFamily = labelStyle.fontFamily || 'Inter',
                    fontWeight = labelStyle.fontWeight || 400;
                if (
                    formattedData.length === 1 ||
                    formattedData.length === 2 ||
                    formattedData.length === 3
                ) {
                    legendLength = 12;
                } else if (
                    formattedData.length === 4 ||
                    formattedData.length === 5 ||
                    formattedData.length === 6
                ) {
                    legendLength = 32;
                }
                if (formattedData && formattedData.length > 0) {
                    legendHeight = formattedData.length % 3 === 0 ? 5 : 20;
                }
                foreign = svg
                    .append('foreignObject')
                    .attr(
                        'transform',
                        'translate(' + -width / 4 + ',' + 0 + ')'
                    )
                    .attr('width', width / 2)
                    .attr('height', 32)
                    .append('xhtml:div')
                    .style('max-height', legendLength ? -1 + 'px' : 32 + 'px')
                    .style('overflow-y', 'auto')
                    .style('overflow-x', 'hidden');
                innerSvg = foreign
                    .append('svg')
                    .attr('width', width / 2)
                    .attr(
                        'height',
                        legendLength
                            ? legendLength
                            : 6.65 * formattedData.length + legendHeight
                    );

                legend = innerSvg
                    .selectAll('.legend1')
                    .data(color.domain())
                    .enter()
                    .append('g')
                    .attr('class', 'legend1')
                    .attr('transform', function (d, i) {
                        var xOff = (i % 3) * 150,
                            yOff = Math.floor(i / 3) * 20;
                        return 'translate(' + xOff + ',' + yOff + ')';
                    });
                legend
                    .append('rect')
                    .attr('width', 12)
                    .attr('height', 12)
                    .style('fill', color);
                legend
                    .append('text')
                    .attr('dx', +16)
                    .attr('dy', '0.8em')
                    .style('fill', fontColor)
                    .style('font-size', fontSize)
                    .style('font-family', fontFamily)
                    .style('font-weight', fontWeight)
                    .text((d) =>
                        d && d.length > 15 ? d.substring(0, 14) + '...' : d
                    );
            }
            if (halfDonutConfig.bobValue) {
                let bobArc,
                    calBob =
                        (halfDonutConfig.bobValue.value / sumOfValues) * 100;
                subIndicator = calBob > 100 ? 100 : calBob;
                subIndicator = subIndicator < 0 ? 0 : subIndicator;
                subIndicator = totalPercent + subIndicator / 200;
                bobArc = d3
                    .arc()
                    .outerRadius(radius / 1.1)
                    .innerRadius(radius / 1.4)
                    .startAngle(percToRad(subIndicator))
                    .endAngle(percToRad(subIndicator));
                g.append('path')
                    .attr('d', bobArc)
                    .style('stroke', 'orange')
                    .style('stroke-width', '8px')
                    .on('mouseover', function () {
                        let tooltipColor =
                            '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:orange"></span>';
                        tooltip
                            .select('.label')
                            .html(
                                tooltipColor +
                                    ' ' +
                                    String(
                                        halfDonutConfig.bobValue.label
                                    ).replace(/_/g, ' ')
                            ); // set current label
                        tooltip.style('display', 'block');
                        tooltip
                            .select('.percent')
                            .html(halfDonutConfig.bobValue.value);
                    })
                    .on('mousemove', function () {
                        tooltip
                            .style('top', d3.event.layerY + 10 + 'px') // always 10px below the cursor
                            .style('left', d3.event.layerX + 10 + 'px');
                    })
                    .on('mouseout', function () {
                        // when mouse leaves div
                        tooltip.style('display', 'none'); // hide tooltip for that element
                    });
            }
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
            // jvModeListener();
        }

        /** ********* Start Visualization Creation ***************/
        initialize();
    }
}
