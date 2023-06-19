'use strict';

import * as d3 from 'd3';
import '@/widget-resources/css/d3-charts.css';

export default angular
    .module('app.scatter-matrix-standard.directive', [])
    .directive('scatterMatrixStandard', scatterMatrixStandard);

scatterMatrixStandard.$inject = ['$filter', 'semossCoreService'];

function scatterMatrixStandard($filter, semossCoreService) {
    scatterMatrixStandardLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: scatterMatrixStandardLink,
    };

    function scatterMatrixStandardLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            // For Data
            localData = {},
            k,
            dirtyData,
            cleanedData = [],
            cleanedEquations,
            domainByKey = {},
            originalDomainByKey = {},
            keys = [],
            yVal,
            z,
            n,
            // For Viz
            colorPalette,
            padding,
            spacing,
            size,
            x,
            y,
            xAxis,
            yAxis,
            lineGenerator,
            areaGenerator,
            brushCell,
            brush,
            svg,
            cell,
            celltop,
            oneRow = false;

        initialize();

        /**
         * @name initialize
         * @desc creates the visualization on the chart div
         * @returns {void}
         */
        function initialize() {
            resizeListener = scope.widgetCtrl.on('resize-widget', drawViz);
            updateTaskListener = scope.widgetCtrl.on('update-task', setData);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                setData
            );
            addDataListener = scope.widgetCtrl.on('added-data', setData);

            scope.chartDiv = d3.select(ele[0].firstElementChild);

            setData();
        }

        /**
         * @name setData
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                );

            colorPalette = scope.widgetCtrl.getWidget(
                'view.visualization.tools.shared.color'
            );

            if (!data.viewData) {
                data = semossCoreService.visualization.getTableData(
                    data.headers,
                    data.values,
                    data.rawHeaders
                );
            }

            scope.chartDiv.attr('style', 'overflow-y: auto');
            if (data) {
                localData = JSON.parse(JSON.stringify(data));

                scope.chartDiv.selectAll('*').remove();

                formatData(localData.viewData);

                // draw viz
                padding = 15;
                spacing = 15;
                drawViz();
            }
        }

        /**
         * @name formatData
         * @desc format the data
         * @param {array} unformatedData - unformatted data that we need to remove
         * @returns {void}
         */
        function formatData(unformatedData) {
            var i,
                len,
                j,
                idx,
                dirtyNames = [],
                cleanedNames;

            /** * Clean Data **/
            dirtyData = JSON.parse(JSON.stringify(unformatedData));
            for (i = 0, len = dirtyData.length; i < len; i++) {
                for (j in dirtyData[i]) {
                    if (dirtyData[i].hasOwnProperty(j)) {
                        if (!isNaN(+dirtyData[i][j])) {
                            dirtyData[i][j] = +dirtyData[i][j];
                        } else if (dirtyNames.indexOf(j) === -1) {
                            dirtyNames.push(j);
                        }
                    }
                }
            }

            cleanedData = JSON.parse(JSON.stringify(dirtyData));
            cleanedNames = JSON.parse(JSON.stringify(localData.viewHeaders));

            for (i = 0, len = dirtyNames.length; i < len; i++) {
                idx = cleanedNames.indexOf(dirtyNames[i]);
                if (idx > -1) {
                    cleanedNames.splice(idx, 1);
                }
            }

            if (
                localData.specificData &&
                Object.keys(localData.specificData).length !== 0
            ) {
                oneRow = localData.specificData['one-row'];
                if (oneRow) {
                    cleanedEquations = [];
                    for (i = 0, len = cleanedNames.length; i < len; i++) {
                        cleanedEquations.push({
                            x: cleanedNames[i],
                            y: cleanedNames[0],
                            m: localData.specificData.coefficients[i],
                            b: localData.specificData.coefficients[0],
                            shifts: localData.specificData.shift,
                            correlation: localData.specificData.correlations[i],
                        });
                    }
                } else {
                    cleanedEquations = cross(cleanedNames, cleanedNames);
                    for (k in cleanedEquations) {
                        if (
                            localData.specificData.correlations[
                                cleanedEquations[k].i
                            ] !== undefined
                        ) {
                            if (
                                !isNaN(
                                    +localData.specificData.correlations[
                                        cleanedEquations[k].i
                                    ][cleanedEquations[k].j]
                                )
                            ) {
                                cleanedEquations[k].correlation =
                                    +localData.specificData.correlations[
                                        cleanedEquations[k].i
                                    ][cleanedEquations[k].j];
                            } else {
                                cleanedEquations[k].correlation = undefined;
                            }
                        } else {
                            cleanedEquations[k].correlation = undefined;
                        }
                    }
                }
            }

            keys = JSON.parse(JSON.stringify(cleanedNames));
            keys.reverse();
            n = keys.length;

            if (oneRow) {
                z = 1;
            } else {
                z = n;
            }

            domainByKey = {};

            keys.forEach(function (key) {
                domainByKey[key] = d3.extent(cleanedData, function (d) {
                    return d[key];
                });
            });

            originalDomainByKey = JSON.parse(JSON.stringify(domainByKey));

            for (i in domainByKey) {
                if (domainByKey.hasOwnProperty(i)) {
                    domainByKey[i][0] -=
                        0.03 * (domainByKey[i][1] - domainByKey[i][0]);
                    domainByKey[i][1] +=
                        0.03 * (domainByKey[i][1] - domainByKey[i][0]);
                }
            }
        }

        /**
         * @name drawViz
         * @desc draw the visualization
         * @returns {void}
         */
        function drawViz() {
            var sizeBasedOnW, sizeBasedOnH, svgWidth, svgHeight;
            let gridOptions = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.grid'
                ),
                gridColor = gridOptions.color || '#d9d9d9',
                gridWidth = gridOptions.width
                    ? `${gridOptions.width}px`
                    : '1px',
                axisOptions = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.axis'
                );

            scope.chartDiv.selectAll('*').remove();
            // d3.scaleLinear().domain(domain).rangeRound([0, axis]);

            if (z === 0 || n === 0) {
                scope.widgetCtrl.alert(
                    'error',
                    'Invalid Data. Selected Columns Must be Numerical'
                );
                return;
            }

            sizeBasedOnW =
                (scope.chartDiv.node().getBoundingClientRect().width -
                    padding * 2 -
                    spacing * 2) /
                n;
            sizeBasedOnH =
                (scope.chartDiv.node().getBoundingClientRect().height -
                    padding * 2 -
                    spacing * z) /
                z;
            if (sizeBasedOnW > 105 && sizeBasedOnW < sizeBasedOnH) {
                size = sizeBasedOnW;
            } else if (sizeBasedOnH > 105) {
                size = sizeBasedOnH;
            } else {
                size = 105;
            }

            x = d3.scaleLinear().range([padding / 2, size - padding / 2]);

            y = d3.scaleLinear().range([size - padding / 2, padding / 2]);

            xAxis = d3.axisBottom().scale(x).tickSize(5);

            yAxis = d3.axisLeft().scale(y).tickSize(5);

            xAxis.tickSize((spacing + size) * z);
            yAxis.tickSize(-size * n);

            lineGenerator = d3
                .line()
                .x(function (d) {
                    return x(d.x);
                })
                .y(function (d) {
                    return y(d.y);
                });

            areaGenerator = d3
                .area()
                .x(function (d) {
                    return x(d.x);
                })
                .y0(function (d) {
                    return y(d.y0);
                })
                .y1(function (d) {
                    return y(d.y1);
                });

            svgWidth = size * n + padding * 2 + spacing * 2;
            svgHeight = (spacing + size) * z + padding * 2 + spacing * 2;

            brush = d3
                .brush()
                .extent([
                    [0, 0],
                    [size - padding, size - padding],
                ])
                .on('start', brushstart)
                .on('brush', brushmove)
                .on('end', brushend);

            if (oneRow) {
                yVal = [keys[n - 1]];
            } else {
                yVal = keys;
            }
            svg = scope.chartDiv
                .append('svg')
                .attr('width', svgWidth)
                .attr('height', svgHeight)
                .style('margin', '0 auto 0 auto')
                .style('font', '10px san-serif')
                .style('padding', '10px')
                .append('g')
                .attr(
                    'transform',
                    'translate(' +
                        (padding / 2 + spacing) +
                        ',' +
                        padding / 2 +
                        ')'
                );

            svg.selectAll('.x.axis')
                .data(keys)
                .enter()
                .append('g')
                .attr('class', 'x axis')
                .attr('transform', function (d, i) {
                    return 'translate(' + (n - i - 1) * size + ',0)';
                })
                .each(function (d) {
                    x.domain(domainByKey[d]);
                    d3.select(this)
                        .call(xAxis)
                        .selectAll('text')
                        .style('text-anchor', 'end')
                        .style('font-family', axisOptions.label.fontFamily)
                        .style('font-size', axisOptions.label.fontSize)
                        .style('font-weight', axisOptions.label.fontWeight)
                        .style('fill', axisOptions.label.fontColor)
                        .attr('transform', function () {
                            return 'rotate(-25 0,' + z * (size + spacing) + ')';
                        });
                });

            svg.selectAll('.y.axis')
                .data(yVal)
                .enter()
                .append('g')
                .attr('class', 'y axis')
                .attr('transform', function (d, i) {
                    return (
                        'translate(0,' + (z - i - 1) * (size + spacing) + ')'
                    );
                })
                .each(function (d) {
                    y.domain(domainByKey[d]);
                    d3.select(this)
                        .call(yAxis)
                        .selectAll('text')
                        .style('font-family', axisOptions.label.fontFamily)
                        .style('font-size', axisOptions.label.fontSize)
                        .style('font-weight', axisOptions.label.fontWeight)
                        .style('fill', axisOptions.label.fontColor)
                        .attr('transform', function () {
                            return 'rotate(-65)';
                        });
                });

            // axis styling
            svg.selectAll('.axis').style('shape-rendering', 'crispEdges');

            svg.selectAll('.axis line')
                .style('stroke', gridColor)
                .style('stroke-width', gridWidth);

            svg.selectAll('.axis path').style('display', 'none');

            cell = svg
                .selectAll('.cell')
                .data(cross(keys, keys))
                .enter()
                .append('g')
                .attr('class', 'cell')
                .attr('transform', function (d) {
                    return (
                        'translate(' +
                        (n - d.i - 1) * size +
                        ',' +
                        (n - d.j - 1) * (size + spacing) +
                        ')'
                    );
                });

            // Draws Each Cell
            celltop = cell.append('g').each(plot);

            // Adding correlation to cell background
            cell.append('text')
                .attr(
                    'transform',
                    'translate(' + size / 2 + ',' + size / 2 + ')'
                )
                .attr('font-size', '' + size / 3 + 'px')
                .attr('fill', '#737373')
                .attr('font-weight', 'bold')
                .attr('opacity', '0.5')
                .attr('text-anchor', 'middle')
                .text(function (d) {
                    if (d.x === d.y) {
                        // If the cell is on the diagonal, don't display any text
                        return '';
                    }
                    return getCorrelation(d);
                })
                .on('mouseover', function () {
                    d3.select(this)
                        .attr('opacity', '1')
                        .style('fill', '#737373');
                })
                .on('mouseout', function () {
                    d3.select(this)
                        .attr('opacity', '0.5')
                        .style('fill', '#737373');
                });

            // Titles for Diagonal
            celltop
                .filter(function (d) {
                    return d.i === d.j;
                })
                .append('foreignObject')
                .attr('width', size - padding)
                .attr('height', size - padding)
                .attr('x', padding / 2)
                .attr('y', padding / 2)
                .html(function (d) {
                    return (
                        "<div style='display:table;table-layout:fixed;text-align:center;text-overflow:ellipsis;word-wrap:break-word;width:" +
                        (size - padding) +
                        'px;height:' +
                        (size - padding) +
                        "px'><span style='display:table-cell;vertical-align:middle'>" +
                        $filter('shortenAndReplaceUnderscores')(d.x) +
                        '</span></div>'
                    );
                });

            // Brushing for non-Diagonals
            celltop
                .filter(function (d) {
                    return d.i !== d.j;
                })
                .call(brush);

            if (oneRow) {
                cell.append('g')
                    .filter(function (d) {
                        return d.i !== d.j;
                    })
                    .append('foreignObject')
                    .attr('x', padding / 2)
                    .attr('y', padding / 2)
                    .attr('width', size - padding)
                    .attr('height', spacing - 2)
                    .html(function (d) {
                        return (
                            "<div style='display:table;table-layout:fixed;text-align:center;text-overflow:ellipsis;word-wrap:break-word;font-size:15px;width:" +
                            (size - padding) +
                            'px;height:' +
                            (spacing - 2) +
                            "px'><span style='display:table-cell;vertical-align:middle'>" +
                            $filter('shortenAndReplaceUnderscores')(d.x) +
                            '</span></div>'
                        );
                    });
            }

            // extent styling
            svg.selectAll('.extent')
                .style('fill', '#000')
                .style('fill-opacity', '.30')
                .style('stroke', '#fff');
        }

        // Cross Each Variable
        function cross(a, b) {
            var c = [],
                aLen = a.length,
                bLen = b.length,
                i,
                j,
                jVal;

            if (oneRow) {
                jVal = bLen - 2;
            } else {
                jVal = -1;
            }

            for (i = -1; ++i < aLen; ) {
                for (j = jVal; ++j < bLen; ) {
                    c.push({
                        x: a[i],
                        i: i,
                        y: b[j],
                        j: j,
                    });
                }
            }
            return c;
        }

        // Plot Each Point
        function plot(p) {
            var celltoph = d3.select(this),
                axisOptions = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.axis'
                );
            x.domain(domainByKey[p.x]);
            y.domain(domainByKey[p.y]);

            celltoph
                .append('rect')
                .attr('class', 'frame')
                .attr('x', padding / 2)
                .attr('y', padding / 2)
                .attr('width', size - padding)
                .attr('height', size - padding)
                .style('fill', 'none')
                .style('stroke', axisOptions.borderColor)
                .style('stroke-width', axisOptions.borderWidth)
                .style('shape-rendering', 'crispEdges');

            if (p.x !== p.y) {
                celltoph
                    .selectAll('circle')
                    .data(cleanedData)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) {
                        return x(d[p.x]);
                    })
                    .attr('cy', function (d) {
                        return y(d[p.y]);
                    })
                    .attr('r', 3)
                    .style('fill', colorByValueFn)
                    .style('fill-opacity', '1')
                    .style('stroke', '#aaa');

                celltoph
                    .append('path')
                    .attr('d', lineGenerator(getPoints(p)))
                    .attr('id', 'regressionline')
                    .attr('stroke', 'black')
                    .attr('stroke-width', '2px')
                    .style('opacity', 0.8);

                celltoph
                    .append('path')
                    .attr('d', areaGenerator(getPoints(p, 'shade')))
                    .attr('id', 'shader')
                    .attr('class', 'shader')
                    .attr('opacity', 0.4)
                    .style('fill', '#4575b4');
            }
        }

        /**
         * @name colorByValueFn
         * @param {*} d the point/dot to style
         * @desc returns the color of the dot
         * @returns {string} the color rgb color to return
         */
        function colorByValueFn(d) {
            var colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                returnColor = false,
                currentVal,
                i;

            colorBy.forEach(function (rule) {
                var valueToColor;
                currentVal = d[rule.colorOn.replace(/_/g, ' ')];

                if (typeof currentVal === 'string') {
                    currentVal = currentVal.replace(/_/g, ' ');
                }
                for (i = 0; i < rule.valuesToColor.length; i++) {
                    valueToColor = rule.valuesToColor[i];

                    if (typeof valueToColor === 'string') {
                        valueToColor = valueToColor.replace(/_/g, ' ');
                    }

                    if (valueToColor === currentVal) {
                        returnColor = rule.color;
                        break;
                    }
                }
            });

            if (returnColor) {
                return returnColor;
            }

            return colorPalette[0] || 'rgb(26, 152, 80)';
        }

        // Gets Point for Line and Shade
        function getPoints(p, shade) {
            var i,
                cleanedLinePoints = [],
                lineM,
                lineB,
                lineShift,
                minX,
                maxX,
                minY,
                maxY,
                point;
            x.domain(domainByKey[p.x]);
            y.domain(domainByKey[p.y]);

            // Get Coefficients (Linear - y = mx + b)
            for (i in cleanedEquations) {
                if (
                    cleanedEquations[i].x === p.x &&
                    cleanedEquations[i].y === p.y &&
                    typeof cleanedEquations[i].m === 'number'
                ) {
                    lineM = +cleanedEquations[i].m;
                    lineB = +cleanedEquations[i].b;
                    lineShift = +cleanedEquations[i].shifts;
                    minX = originalDomainByKey[p.x][0];
                    maxX = originalDomainByKey[p.x][1];
                    minY = originalDomainByKey[p.y][0];
                    maxY = originalDomainByKey[p.y][1];

                    // Generate Points
                    for (i = 0; i < 1001; i++) {
                        point = {};
                        if (shade === 'shade') {
                            point.x = minX + ((maxX - minX) * i) / 1000;
                            point.y0 = lineM * point.x + lineB - lineShift;
                            point.y1 = lineM * point.x + lineB + lineShift;
                            if (
                                (minY <= point.y0 && point.y0 <= maxY) ||
                                (minY <= point.y1 && point.y1 <= maxY)
                            ) {
                                if (point.y0 <= maxY && maxY <= point.y1) {
                                    point.y1 = maxY;
                                } else if (
                                    minY <= point.y1 &&
                                    point.y0 <= minY
                                ) {
                                    point.y0 = minY;
                                }
                                cleanedLinePoints.push(point);
                            }
                        } else {
                            point.x = minX + ((maxX - minX) * i) / 1000;
                            point.y = lineM * point.x + lineB;
                            if (minY <= point.y && point.y <= maxY) {
                                cleanedLinePoints.push(point);
                            }
                        }
                    }
                    break;
                }
            }
            return cleanedLinePoints;
        }

        // Returns Correlation from Graph
        function getCorrelation(p) {
            var i;
            for (i in cleanedEquations) {
                if (
                    cleanedEquations[i].x === p.x &&
                    cleanedEquations[i].y === p.y
                ) {
                    return (
                        Math.round(+cleanedEquations[i].correlation * 100) / 100
                    );
                }
            }

            return '';
        }

        // Clear Previous Brush (if any) and Start New
        function brushstart(p) {
            if (brushCell !== this) {
                d3.select(brushCell).call(brush.move, null);
                x.domain(domainByKey[p.x]);
                y.domain(domainByKey[p.y]);
                brushCell = this;
            }
        }

        // Highlight Circles in Selected Area
        function brushmove(p) {
            var e = d3.event.selection,
                mouseX0,
                mouseX1,
                mouseY0,
                mouseY1;
            if (e) {
                mouseX0 = x.invert(e[0][0]);
                mouseX1 = x.invert(e[1][0]);
                mouseY0 = y.invert(e[0][1]);
                mouseY1 = y.invert(e[1][1]);

                svg.selectAll('circle').each(function (d) {
                    // determine if point is outside of brushed area
                    if (
                        d[p.x] > mouseX0 &&
                        d[p.x] < mouseX1 &&
                        d[p.y] > mouseY1 &&
                        d[p.y] < mouseY0
                    ) {
                        d3.select(this).style('fill', function () {
                            return colorPalette[0] || 'rgb(26, 152, 80)';
                        });
                    } else {
                        d3.select(this).style('fill', '#ccc');
                    }
                });
            }
        }

        // Selects All if Brush Empty
        function brushend(p) {
            var e = d3.event.selection,
                mouseX0,
                mouseX1,
                mouseY0,
                mouseY1;
            if (e) {
                mouseX0 = x.invert(e[0][0]);
                mouseX1 = x.invert(e[1][0]);
                mouseY0 = y.invert(e[0][1]);
                mouseY1 = y.invert(e[1][1]);

                svg.selectAll('circle').each(function (d) {
                    if (
                        d[p.x] > mouseX0 &&
                        d[p.x] < mouseX1 &&
                        d[p.y] > mouseY1 &&
                        d[p.y] < mouseY0
                    ) {
                        d3.select(this).style('fill', function () {
                            return colorPalette[0] || 'rgb(26, 152, 80)';
                        });
                    } else {
                        d3.select(this).style('fill', '#ccc');
                    }
                });
            } else {
                svg.selectAll('circle').each(function (d) {
                    d3.select(this).style('fill', colorByValueFn(d));
                });
            }
        }

        // CleanUp
        scope.$on('$destroy', function () {
            resizeListener();
            updateTaskListener();
            updateOrnamentsListener();
            addDataListener();
            // clear chart div
            scope.chartDiv.node().innerHTML = '';
        });
    }
}
