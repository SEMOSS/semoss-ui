/**
 * Created by jlemoel on 12/17/2015.
 */
(function () {
    "use strict";

    angular.module("app.sunburst.directive", [])
        .directive("sunburst", sunburst);

    sunburst.$inject = ["$compile", "_"];

    function sunburst($compile, _) {
        sunburstLink.$inject = ["scope", "ele", "attrs", "controllers"];
        sunburstCtrl.$inject = ["$scope"];

        return {
            restrict: "A",
            require: ["^chart"],
            priority: 300,
            link: sunburstLink,
            controller: sunburstCtrl
        };

        function sunburstLink(scope, ele, attrs, controllers) {
            var root,
                radius,
                viz,
                color = d3.scale.category20c(),
                x,
                y,
                g,
                path,
                svg,
                partition,
                arc,
                labelOnButton = true,
                labelFormat,
                toolData = {},
                colors;

            scope.chartCtrl = controllers[0];

            var html = '<div class="append-viz" id="' + scope.chartCtrl.chartName + '-append-viz"><div class="absolute-size" id="' + scope.chartCtrl.chartName + '"></div></div>';
            ele.append($compile(html)(scope));

            scope.chartCtrl.margin = {
                top: 100,
                bottom: 75,
                left: 0,
                right: 0
            };

            //Widget Functions
            scope.chartCtrl.dataProcessor = function (data) {
                if (!(data == undefined || data == null || data == {} || data == '')) {
                    //clear the elements inside of the directive
                    if (!data.specificData || _.isEmpty(data.specificData)) {
                        var headers = [];
                        if (data.dataTableAlign) {
                            var sizeHeader = "";
                            for (var header in data.dataTableAlign) {
                                if (header === 'size') {
                                    sizeHeader = data.dataTableAlign[header];
                                    continue;
                                }
                                headers.push(data.dataTableAlign[header]);
                            }
                            //have to add size in last to make sure tree is created properly
                            headers.push(sizeHeader);
                        } else {
                            for (var header in data.headers) {
                                headers.push(data.headers[header].title);
                            }
                        }
                        root = processTableData(JSON.parse(JSON.stringify(data.filteredData)), headers);
                    } else {
                        root = JSON.parse(JSON.stringify(data.specificData));
                    }
                }

                toolData = data.uiOptions;

                if (toolData) {
                    if (toolData.hasOwnProperty('labelOnButton')) {
                        labelOnButton = toolData.labelOnButton;
                    }
                }
                else {
                    toolData = {};
                }


                drawViz();
                update();
            };

            scope.chartCtrl.toolUpdateProcessor = function (toolUpdateConfig) {
                if (toolUpdateConfig.fn === 'color-change') {
                    scope.chartCtrl.dataProcessor(toolUpdateConfig.args);
                } else {
                    //need to invoke tool functions
                    scope[toolUpdateConfig.fn](toolUpdateConfig.args);
                }
            };

            scope.chartCtrl.highlightSelectedItem = function (selectedItem) {
                //console.log('Need to Add Highlighting Feature')
            };

            scope.chartCtrl.filterAction = function () {
                //console.log('Need to Add Filtering Viz Feature')
            };

            scope.chartCtrl.resizeViz = function () {
                drawViz();
                update();
            };

            function update() {

                d3.select('#' + scope.chartCtrl.chartName + "-append-viz").selectAll("text").remove();

                var g = svg.selectAll("g")
                    .data(partition.nodes(root))
                    .enter().append("g");

                /* Initialize tooltip */
                var tip = d3.tip()
                    .attr('class', 'd3-tip')
                    .attr("id", "sunburst-d3-tip")
                    .html(function (d) {
                        if (d.depth > 1) {
                            return "<div> <span class='light'>" + "Name " + ":</span> " + d.name + "</div>" +
                                "<div><span class='light'>" + d.parent.parent.name + ":</span> " + d.parent.name + "</div>" +
                                "<div><span class='light'>" + "Value " + ":</span> " + d.value + "</div>"
                        }
                        else if (d.depth < 1) {
                            return "<div> <span class='light'>" + "Label " + ":</span> " + d.name + "</div>"
                        }
                        else {
                            return "<div> <span class='light'>" + d.parent.name + ":</span> " + d.name + "</div>" +
                                "<div><span class='light'>" + "Value " + ":</span> " + d.value + "</div>"
                        }


                    });


                path = g.append("path")
                    .attr("d", arc)
                    .attr("id", function (d, i) {
                        return ("slice" + i);
                    })
                    .style("fill", function (d) {
                        if (d.depth < 1) {
                            return "White";
                        }
                        else {
                            return color((d.children ? d : d.parent).name);
                        }
                    })
                    .on("click", click)
                    .on('mouseover', function (d, i) {
                        tip.show(d, i);

                        d3.select('#' + scope.chartCtrl.chartName + "-append-viz").select("#slice" + i).attr("stroke", "black").attr("stroke-width", 3);
                    })
                    .on('mouseout', function (d, i) {
                        tip.hide(d, i);
                        d3.select('#' + scope.chartCtrl.chartName + "-append-viz").select("#slice" + i).attr("stroke-width", 0);
                    });

                path.call(tip);

                if (labelOnButton) {
                    var text = g.append("text")
                        .attr("transform", function (d) {
                            return "rotate(" + computeTextRotation(d) + ")";
                        })
                        .attr("x", function (d) {
                            return y(d.y);
                        })
                        .attr("dx", "6") // margin
                        .attr("dy", ".35em") // vertical-align
                        .text(function (d) {
                            return d.name;
                        });
                }

                function click(d) {
                    // fade out all text elements
                    text.transition().attr("opacity", 0);

                    path.transition()
                        .duration(750)
                        .attrTween("d", arcTween(d))
                        .each("end", function (e, i) {
                            // check if the animated element's data e lies within the visible angle span given in d
                            if (e.x >= d.x && e.x < (d.x + d.dx)) {
                                // get a selection of the associated text element
                                var arcText = d3.select(this.parentNode).select("text");
                                // fade in the text element and recalculate positions
                                arcText.transition().duration(750)
                                    .attr("opacity", 1)
                                    .attr("transform", function () {
                                        return "rotate(" + computeTextRotation(e) + ")";
                                    })
                                    .attr("x", function (d) {
                                        return y(d.y);
                                    });
                            }
                        });
                }

                //d3.select(self.frameElement).style("height", scope.chartCtrl.container.height + "px");

                // Interpolate the scales!
                function arcTween(d) {
                    var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                        yd = d3.interpolate(y.domain(), [d.y, 1]),
                        yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
                    return function (d, i) {
                        return i
                            ? function (t) {
                            return arc(d);
                        }
                            : function (t) {
                            x.domain(xd(t));
                            y.domain(yd(t)).range(yr(t));
                            return arc(d);
                        };
                    };
                }

                function computeTextRotation(d) {
                    return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
                }

            }

            function drawViz() {
                d3.select('#' + scope.chartCtrl.chartName + "-append-viz").selectAll('*').remove();
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);


                radius = Math.min(scope.chartCtrl.container.width, scope.chartCtrl.container.height) / 2

                x = d3.scale.linear()
                    .range([0, 2 * Math.PI]);

                y = d3.scale.sqrt()
                    .range([0, radius]);

                svg = d3.select('#' + scope.chartCtrl.chartName + "-append-viz").append("svg")
                    .attr("width", scope.chartCtrl.container.width)
                    .attr("height", scope.chartCtrl.container.height + 125)
                    .append("g")
                    .attr("transform", "translate(" + scope.chartCtrl.container.width / 2 + "," + (scope.chartCtrl.container.height / 2 + 75) + ")");

                partition = d3.layout.partition()
                    .value(function (d) {
                        return d.size;
                    });

                arc = d3.svg.arc()
                    .startAngle(function (d) {
                        return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
                    })
                    .endAngle(function (d) {
                        return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
                    })
                    .innerRadius(function (d) {
                        return Math.max(0, y(d.y));
                    })
                    .outerRadius(function (d) {
                        return Math.max(0, y(d.y + d.dy));
                    });
            }

            //pass in all of the tabular data and the selected levels (dataTableAlign); we will set up the tree data according to the order of the data table align
            function processTableData(data, tableHeaders) {
                var allHash = {}, rootMap = {}, currentMap = {};

                for (var i in data) { //all of this is to change it to a tree structure and then call makeTree to structure the data appropriately for this viz
                    var count = 0;

                    for (var j = 0; j < tableHeaders.length; j++) {
                        var currentValue = data[i][tableHeaders[j].replace(/[_]/g, " ")].toString().replace(/["]/g, ""), nextMap = {};

                        if (count === 0) { // will take care of the first level and put into rootmap is it doesnt already exist in rootmap
                            currentMap = rootMap[currentValue];

                            if (!currentMap) {
                                currentMap = {};
                                rootMap[currentValue] = currentMap;
                            }

                            nextMap = currentMap;
                            count++;
                        } else {
                            nextMap = currentMap[currentValue];

                            if (!nextMap) {
                                nextMap = {};
                                currentMap[currentValue] = nextMap;
                            }

                            currentMap = nextMap;
                        }
                    }
                }

                allHash = createTree(rootMap, tableHeaders[0]);
                return allHash;
            }

            function createTree(map, parentName) {
                var parent = {
                    name: parentName,
                    children: []
                };

                for (var key in map) {
                    var child = {};
                    //if not empty it has kids, run it through createTree
                    if (!_.isEmpty(map[key])) {
                        child = createTree(map[key], key);
                        parent.children.push(child);

                    } else {

                        if (_.isUndefined(parent.size)) {
                            parent.size = 0;
                        }

                        //if the keys are numbers we add them, if not we count them
                        if (!_.isNaN(parseFloat(key))) {
                            parent.size += parseFloat(key);
                        } else {
                            parent.size++;
                        }

                    }
                }

                if (parent.children.length === 0) {
                    delete parent.children;
                }
                return parent;

            }

            scope.displayValues = function (displayBool) {
                labelOnButton = displayBool;

                if (labelOnButton === false) {
                    d3.select('#' + scope.chartCtrl.chartName + "-append-viz").selectAll("text").remove();
                    //d3.select("svg").selectAll("text").remove();
                }
                else {
                    drawViz();
                    update();
                }
            };

            scope.colorChange = function (colorParam) {
                colors = colorParam;
                var counter = 0;
                var colorCounter = 0;
                var currentColor = "";
                path
                    .style("fill", function (d, i) {
                        if (d.depth === 0) {
                            return "white";
                        }
                        if (d.depth > counter) {
                            colorCounter = 0;
                            counter++;
                        }
                        currentColor = colors[colorCounter % 10];
                        colorCounter++;
                        return currentColor
                    });

            };

            scope.zoomHome = function () {
                drawViz();
                update();
            };

            //when directive ends, make sure to clean out all $on watchers
            scope.$on('$destroy', function sunburstDestroyer() {
                //cleaning up d3-tooltip
                d3.selectAll("#sunburst-d3-tip").remove();
                console.log("sunburst destroy");
            });
        }

        function sunburstCtrl($scope) {
            //do something
        }
    }

})();

