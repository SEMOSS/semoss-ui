(function () {
    'use strict';

    /**
     * @name tool-panel
     * @desc The tool panel for a given visualization
     */
    angular.module('app.tool-panel.directive', [])
        .directive('toolPanel', toolPanel);

    toolPanel.$inject = ['$rootScope', 'VIZ_COLORS', "$window", "$timeout", 'dataService', 'pkqlService', 'widgetConfigService'];

    function toolPanel($rootScope, VIZ_COLORS, $window, $timeout, dataService, pkqlService, widgetConfigService) {

        toolPanelCtrl.$inject = ["$scope"];
        toolPanelLink.$inject = ["scope", "ele", "attrs", "controllers"];

        return {
            restrict: 'EA',
            scope: {},
            require: [],
            controllerAs: 'toolPanel',
            bindToController: {
            },
            templateUrl: 'standard/tool-panel/tool-panel.directive.html',
            controller: toolPanelCtrl,
            link: toolPanelLink
        };

        function toolPanelCtrl($scope) {
            var toolPanel = this;
            toolPanel.selectedData = null;//data of the selected viz
            toolPanel.loadScreen = false;

            //functions
            toolPanel.toolUpdater = toolUpdater;
            toolPanel.updateUiOptions = updateUiOptions;
            toolPanel.updateVizColor = updateVizColor;
            toolPanel.checkToolOptions = checkToolOptions;
            toolPanel.resetPanel = resetPanel;
            toolPanel.resetConfig = resetConfig;
            toolPanel.saveHTML = saveHTML;
            toolPanel.saveImage = saveImage;


            /**
             * @name toolUpdater
             * @param fn {String} tool function to run
             * @param data {Object} any associated data with that function
             * @desc notifies the store whenever a tool function is run. also sends the uiOptions to the store.
             */
            function toolUpdater(fn, data) {
                var config = widgetConfigService.getVizConfig(toolPanel.selectedData.layout);

                //if statements to run tool updater through pkql or not
                if (toolPanel.selectedData.layout === "VivaGraph" || toolPanel.selectedData.layout === "Graph" || toolPanel.selectedData.layout === "prerna.ui.components.specific.tap.InterfaceGraphPlaySheet") {
                    dontRunToolsPKQL();
                } else if (config.pkqlEnabled && fn !== 'drillDown' && fn !== 'resetPerspective' && fn !== 'createOverlap') {
                    runToolsPKQL();
                } else {
                    dontRunToolsPKQL();
                }


                /** runToolsPKQL
                 *  creates and runs the tool query through pkql
                 *  saves uiOptions and adds to the recipe
                 */
                function runToolsPKQL() {
                    //Run tool updater through pkql
                    // make sure vizOptions and comments are removed
                    if (toolPanel.selectedData.uiOptions['vizOptions']) {
                        delete toolPanel.selectedData.uiOptions['vizOptions'];
                    }
                    if (toolPanel.selectedData.uiOptions['comments']) {
                        delete toolPanel.selectedData.uiOptions['comments'];
                    }
                    var currentWidget = dataService.getWidgetData();
                    var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, toolPanel.selectedData.uiOptions);
                    pkqlService.executePKQL(currentWidget.insightId, toolQuery);
                }

                /** dontRunToolsPKQL
                 *  Does not run the tool query in pkql
                 *
                 *  This assumes that either pkql is disabled or the tool should not run through the tool PKQL
                 *  -filtering on drill down in parcoords is an example where we have to run a different pkql in this
                 *  spot instead of the tools pkql
                 */
                function dontRunToolsPKQL() {
                    //don't update tools through pkql
                    var toolObjectConfig = {
                        'fn': fn,
                        'args': data,
                        'uiOptions': toolPanel.selectedData.uiOptions
                    };
                    dataService.setUiOptions(toolPanel.selectedData.uiOptions);
                    dataService.runToolFunction(toolObjectConfig);
                }
            }

            /**
             * @name updateUiOptions
             * @param toolKey {String} tool name that is being updated
             * @param newValue {String} new value of updated tool
             * @desc function that is broadcasts to the sheet whenever a ui Option Changes
             */
            function updateUiOptions(toolKey, newValue) {
                console.log("Setting UI Options of " + toolKey + " to " + newValue);
                toolPanel.selectedData.uiOptions[toolKey] = newValue;
            }

            /**
             * @name updateVizColor
             * @param newValue {String} new value of updated viz color
             * @desc controls updating the sheet color
             */
            function updateVizColor(newValue) {
                var colorArray = [];

                switch (newValue) {
                    case 'Semoss':
                        colorArray = VIZ_COLORS.COLOR_SEMOSS;
                        break;
                    case 'Blue':
                        colorArray = VIZ_COLORS.COLOR_BLUE;
                        break;
                    case "Red":
                        colorArray = VIZ_COLORS.COLOR_RED;
                        break;
                    case "Green":
                        colorArray = VIZ_COLORS.COLOR_GREEN;
                        break;
                    case 'One':
                        colorArray = VIZ_COLORS.COLOR_ONE;
                        break;
                    case "Two":
                        colorArray = VIZ_COLORS.COLOR_TWO;
                        break;
                    case "Three":
                        colorArray = VIZ_COLORS.COLOR_THREE;
                        break;
                    case "Four":
                        colorArray = VIZ_COLORS.COLOR_FOUR;
                        break;
                    case "Five":
                        colorArray = VIZ_COLORS.COLOR_FIVE;
                        break;
                    case "Six":
                        colorArray = VIZ_COLORS.COLOR_SIX;
                        break;
                    case "custom":
                        colorArray = 'aaa';
                        break;
                    default:
                        return;
                }
                toolPanel.updateUiOptions('color', colorArray);
            }

            /**
             * @name checkToolOptions
             * @desc function grabs the defaultToolOptions and checks if the visualization is in accordance with them.
             */
            function checkToolOptions() {
                var defaultToolOptions = JSON.parse(JSON.stringify(widgetConfigService.getDefaultToolOptions(toolPanel.selectedData.layout)));

                if (_.isEmpty(toolPanel.selectedData.uiOptions)) {
                    //sets default to uiOptions if uioptions do not exist
                    toolPanel.selectedData.uiOptions = defaultToolOptions;
                } else {
                    //cleans the uiOptions to have only the default tool options defined in viz services
                    for (var i in toolPanel.selectedData.uiOptions) {
                        if (_.keys(defaultToolOptions).indexOf(i) > -1) {
                            defaultToolOptions[i] = toolPanel.selectedData.uiOptions[i];
                        }
                    }
                    toolPanel.selectedData.uiOptions = defaultToolOptions;
                }
            }

            /**
             * @name resetPanel
             * @desc function that is resets panel when selected Widget Changes
             */
            function resetPanel() {
                toolPanel.content = widgetConfigService.getToolDirectiveElement(toolPanel.selectedData.layout);
            }

            /**
             * @name resetConfig
             * @desc function that resets the config object when selected Widget Changes
             */
            function resetConfig() {
                //TODO remove dont think this is ever used
                toolPanel.config = widgetConfigService.getVizConfig(toolPanel.selectedData.layout);
            }


            /**
             * @name saveHTML
             * @desc saves the viz image as HTML
             */
            function saveHTML() {
                //unused function but could be useful down the line. Function takes the dom and grabs all styles inside the #chart-viz div
                downloadCurrentDocument();

                function downloadCurrentDocument() {
                    var html = getElementChildrenAndStyles();
                    var base64doc = btoa(unescape(encodeURIComponent(html))),
                        a = document.createElement('a'),
                        e = document.createEvent("HTMLEvents");

                    a.download = 'doc.html';
                    a.href = 'data:text/html;base64,' + base64doc;
                    e.initEvent('click');
                    a.dispatchEvent(e);
                }

                function getElementChildrenAndStyles() {
                    var html = '';
                    var id = "chart-viz";
                    var selector = "#" + id;

                    function outerHTML(node) {
                        return node.outerHTML || new XMLSerializer().serializeToString(node);
                    }

                    var element = document.getElementById(id);
                    //var element = angular.element(selector);
                    if (!element) {
                        element = document.getElementById('singleContent')
                    }
                    html += outerHTML(element);
                    selector = selector.split(",").map(function (subselector) {
                        return subselector + "," + subselector + " *";
                    }).join(",");
                    var elts = angular.element(selector);
                    var rulesUsed = [];
                    // main part: walking through all declared style rules
                    // and checking, whether it is applied to some element
                    var sheets = document.styleSheets;
                    for (var c = 0; c < sheets.length; c++) {
                        var rules = sheets[c].rules || sheets[c].cssRules;
                        if (rules) {
                            for (var r = 0; r < rules.length; r++) {
                                var selectorText = rules[r].selectorText;
                                if (selectorText && selectorText.indexOf('[ng:cloak]') < 0) {
                                    var matchedElts = $(selectorText);
                                    for (var i = 0; i < elts.length; i++) {
                                        if (matchedElts.index(elts[i]) != -1) {
                                            rulesUsed.push(rules[r]);
                                            break;
                                        }
                                    }
                                }
                            }

                        }
                    }
                    var style = rulesUsed.map(function (cssRule) {
                        var cssText;
                        if (navigator.userAgent.match(/MSIE ([0-9]+)\./)) {
                            cssText = cssRule.style.cssText.toLowerCase();
                        } else {
                            cssText = cssRule.cssText;
                        }
                        // some beautifying of css
                        return cssText.replace(/(\{|;)\s+/g, "\$1\n  ").replace(/\A\s+}/, "}");
                        //                 set indent for css here ^
                    }).join("\n");

                    var script = '';
                    var canvases = document.getElementsByTagName("canvas");
                    if (canvases.length > 0) {
                        var canvasContexts = [];
                        for (var i = 0; i < canvases.length; i++) {
                            canvasContexts.push("'" + canvases[i].toDataURL() + "'");
                        }
                        //add script to add canvas
                        script += '' +
                            'window.onload = function() {\n' +
                            '    var canvases = document.getElementsByTagName("canvas");\n' +
                            '    var passedInImg=[' + canvasContexts + ']; \n' +
                            '    for(var i=0; i<canvases.length;i++){\n' +
                            '        var ctx=canvases[i].getContext("2d");\n' +
                            '        var img=new Image; \n' +
                            '        img.onload=function(){ctx.drawImage(this,0,0)};\n' +
                            '        img.src=passedInImg[i];\n' +
                            '    }' +
                            '}';

                    } else {
                        //add script for dynamic sizing of the svgs
                        script += '' +
                            'window.onresize = resize;\n' +
                            'function resize() {\n' +
                            '    var svgs = document.getElementsByTagName("svg");\n' +
                            '    for(var i =0; i <svgs.length; i ++){\n' +
                            '        var svg = svgs[i];\n' +
                            '        svg.setAttribute("width", "95%");\n' +
                            '        svg.setAttribute("height", "95%");\n' +
                            '    }\n' +
                            '}\n' +
                            'window.onload = function() {\n' +
                            '    var svgs = document.getElementsByTagName("svg");\n' +
                            '    for(var i =0; i <svgs.length; i ++){\n' +
                            '        var svg = svgs[i];\n' +
                            '        var w = svg.getAttribute("width").replace("px", "");\n' +
                            '        var h = svg.getAttribute("height").replace("px", "");\n' +
                            '        svg.setAttribute("viewBox", "0 0 " + w + " " + h);\n' +
                            '        svg.setAttribute("preserveAspectRatio", "xMinYMin meet");\n' +
                            '        svg.setAttribute("width", "95%");\n' +
                            '        svg.setAttribute("height", "95%");\n' +
                            '    }\n' +
                            '}';
                    }
                    return "<style>\n" + style + "\n</style>\n\n<script>\n" + script + "\n</script>\n\n" + html;
                }
            }


            /**
             * @name saveImage
             * @desc saves the visualization as an image
             * @TODO still in development
             */
            function saveImage() {
                console.log(toolPanel.selectedData);
                var body = document.body;
                var vizData = dataService.getWidgetData();
                var format = "png";
                var chartElement = angular.element("#chart-viz");
                var w = chartElement.width();
                var h = chartElement.height();
                //if(!format) format = 'png';

                /*this.stopped = true;
                 if(this.staticPlot) this.container.appendChild(STATIC_CANVAS);*/

                // force redraw
                /*this.glplot.setDirty();
                 this.glplot.draw();*/

                // grab context and yank out pixels
                /*var gl = this.glplot.gl,
                 w = gl.drawingBufferWidth,
                 h = gl.drawingBufferHeight;*/
                //var w = ;
                //var h = ;

                //gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                //var pixels = new Uint8Array(w * h * 4);
                //gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

                // flip pixels
                /*for(var j = 0, k = h - 1; j < k; ++j, --k) {
                 for(var i = 0; i < w; ++i) {
                 for(var l = 0; l < 4; ++l) {
                 var tmp = pixels[4 * (w * j + i) + l];
                 pixels[4 * (w * j + i) + l] = pixels[4 * (w * k + i) + l];
                 pixels[4 * (w * k + i) + l] = tmp;
                 }
                 }
                 }*/

                var canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;

                // var context = canvas.getContext('2d');
                // var imageData = context.createImageData(w, h);
                // imageData.data.set(pixels);
                // context.putImageData(imageData, 0, 0);

                //from: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas
                //var canvas = document.getElementById('canvas');
                var ctx = canvas.getContext('2d');

                var data = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
                    '<foreignObject width="100%" height="100%">' +
                    '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:40px">' +
                    '<em>I</em> like ' +
                    '<span style="color:white; text-shadow:0 0 2px blue;">' +
                    'cheese</span>' +
                    '<h1>hello</h1>' +
                    '</div>' +
                    '</foreignObject>' +
                    '</svg>';

                //var DOMURL = window.URL || window.webkitURL || window;

                $window.URL = ($window.URL || $window.webkitURL);

                var img = new Image();
                var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
                // /var url = DOMURL.createObjectURL(svg);
                var url = $window.URL.createObjectURL(new Blob([data], {"type": "text\/xml"}));

                img.onload = function () {
                    ctx.drawImage(img, 0, 0);
                    DOMURL.revokeObjectURL(url);
                }

                img.src = url;
                //*******************************

                //var dataURL;

                /*switch(format) {
                 case 'jpeg':
                 dataURL = canvas.toDataURL('image/jpeg');
                 break;
                 case 'webp':
                 dataURL = canvas.toDataURL('image/webp');
                 break;
                 default:
                 dataURL = canvas.toDataURL('image/png');
                 }*/

                //if(this.staticPlot) this.container.removeChild(STATIC_CANVAS);

                var a = document.createElement("a");
                body.appendChild(a);
                a.setAttribute("download", "semoss_img" + "." + format);
                a.setAttribute("href", url);
                a.style["display"] = "none";
                a.click();
                //need to remove the a element from the DOM

                $timeout(function () {
                    $window.URL.revokeObjectURL(url);
                }, 10);
            }

        }

        function toolPanelLink(scope, ele, attrs, ctrl) {
            /**
             * @name initialize
             */
            function initialize() {
                var currentWidget = dataService.getWidgetData(),
                    currentInsight = dataService.getInsightData();

                if (currentWidget && currentWidget.data) {
                    scope.toolPanel.selectedData = currentWidget.data.chartData;
                }

                if (currentInsight && currentInsight.selected) {
                    scope.toolPanel.selectedItem = currentInsight.selected.data
                }

                if (scope.toolPanel.selectedData) {
                    scope.toolPanel.resetPanel();
                    scope.toolPanel.resetConfig();
                    scope.toolPanel.checkToolOptions()
                }
            }

            initialize();

            //listeners
            var toolPanelUpdateListener = $rootScope.$on('update-widget', function (event) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'update-widget');
                var currentWidget = dataService.getWidgetData();
                if (currentWidget && currentWidget.data) {
                    scope.toolPanel.selectedData = currentWidget.data.chartData;
                }

                if (scope.toolPanel.selectedData) {
                    scope.toolPanel.resetPanel();
                    scope.toolPanel.resetConfig();
                    scope.toolPanel.checkToolOptions()
                }
            });

            var toolPanelSelectedNodeListner = $rootScope.$on('data-selected', function (event, data) {
                    console.log('%cPUBSUBV2:', "color:lightseagreen", 'data-selected', data);
                    scope.toolPanel.selectedItem = data.selectedItem
            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying toolPanel....');
                toolPanelUpdateListener();
                toolPanelSelectedNodeListner();
            });
        }

    }
})();
