'use strict';

export default angular
    .module('app.dendrogram-echarts.service', [])
    .factory('dendrogramEchartsService', dendrogramEchartsService);

dendrogramEchartsService.$inject = ['semossCoreService'];

function dendrogramEchartsService(semossCoreService) {
    const PRIMARY_COLOR = '#40A0FF';
    function getConfig(type, data, uiOptions, headers, dataTableAlign, height) {
        var tempDataObject,
            animation = customizeAnimation(uiOptions.animation),
            titleObject = {},
            statIdx,
            key,
            allHash = {},
            list = [],
            tipHeader,
            legendSeries = [],
            headerIdx,
            legendData = [];

        if (uiOptions.showHierarchy) {
            tempDataObject = processHierarchy(
                JSON.parse(JSON.stringify(data.viewData)),
                dataTableAlign,
                uiOptions.showHierarchyByUpstream
            );
        } else if (data.viewData) {
            // when there is a dimension where the tooltip is the same
            // as it, there will not be an additional header, so we should
            // not pop the headers array
            if (
                dataTableAlign.tooltip &&
                headers.indexOf(dataTableAlign.tooltip) !== -1
            ) {
                tipHeader = headers.pop();
            }

            tempDataObject = formatData(
                JSON.parse(JSON.stringify(data.rawData)),
                headers,
                tipHeader
            );
            for (headerIdx = 0; headerIdx < headers.length; headerIdx++) {
                legendSeries.push({
                    name: headers[headerIdx],
                    data: [],
                    type: 'tree',
                    itemStyle: {
                        normal: {
                            color:
                                uiOptions.color.length > 0
                                    ? uiOptions.color[0]
                                    : PRIMARY_COLOR,
                        },
                    },
                });

                legendData.push({
                    name: headers[headerIdx],
                    icon: getSymbol(uiOptions.changeSymbolDendrogram),
                });
            }
        } else {
            makeTree(data.children, list);
            if (list.length > 1) {
                allHash.name = 'root';
                allHash.children = list;
            } else if (list.length === 1) {
                allHash = list[0];
            } else {
                allHash = {};
            }

            tempDataObject = allHash;

            if (headers) {
                for (headerIdx = 0; headerIdx < headers.length; headerIdx++) {
                    legendSeries.push({
                        name: headers[headerIdx],
                        data: [],
                        type: 'tree',
                        itemStyle: {
                            normal: {
                                color:
                                    uiOptions.color.length > 0
                                        ? uiOptions.color[0]
                                        : PRIMARY_COLOR,
                            },
                        },
                    });

                    legendData.push({
                        name: headers[headerIdx],
                        icon: getSymbol(uiOptions.changeSymbolDendrogram),
                    });
                }
            }
        }

        if (typeof uiOptions.toggleDendrogramLabels === 'undefined') {
            if (data.rawData && data.rawData.length > 60) {
                uiOptions.toggleDendrogramLabels = false;
            } else {
                uiOptions.toggleDendrogramLabels = true;
            }
        }

        if (data.stats) {
            titleObject.text = '';
            titleObject.textStyle = {
                fontWeight: 'normal',
                fontSize: 16,
            };
            for (statIdx = 0; statIdx < data.stats.length; statIdx++) {
                for (key in data.stats[statIdx]) {
                    if (data.stats[statIdx].hasOwnProperty(key)) {
                        titleObject.text +=
                            key + ': ' + data.stats[statIdx][key];
                    }
                }

                titleObject.text += '\n';
            }
        }

        let legendLabelStyle = {
            color:
                uiOptions.legend.fontColor || uiOptions.fontColor || '#000000',
            fontSize:
                parseFloat(uiOptions.legend.fontSize) ||
                uiOptions.fontSize ||
                12,
            fontFamily: uiOptions.legend.fontFamily || 'Inter',
            fontWeight: uiOptions.legend.fontWeight || 400,
        };

        // Configure data for ECharts
        return {
            title: titleObject,
            data: tempDataObject,
            series: setEChartsDataSeries(
                type,
                tempDataObject,
                uiOptions,
                height,
                legendSeries
            ),
            // legendHeaders: headers,
            // legendLabels: tempDataObject.labelName,
            legendData: legendData,
            showLegend: uiOptions.toggleLegend,
            legendLabelStyle: legendLabelStyle,
            showAnimation: animation.showAnimation,
            animationType: animation.defaultAnimationType,
            animationDelay: animation.defaultAnimationSpeed,
            animationDuration: animation.defaultAnimationDuration,
            axisPointer: uiOptions.axisPointer,
            backgroundColorStyle: getBackgroundColorStyle(uiOptions.watermark),
            options: uiOptions,
        };
    }

    /**
     * @name processHierarchy
     * @desc puts data into ECharts data format from widget hierarchy
     * @param {Object} data - object of data in original format
     * @param {Array} headers - headers of data
     * @param {Boolean} byUpstream - boolean determining how to do the hierarchy
     * @returns {Object} - object of data in ECharts format
     */
    function processHierarchy(data, headers, byUpstream) {
        var upstreamArr,
            downstreamArr,
            root,
            i,
            a,
            tree,
            flat,
            addItemToTree,
            result;

        if (byUpstream) {
            Array.prototype.diff = function (a) {
                return this.filter(function (i) {
                    return a.indexOf(i) < 0;
                });
            };

            upstreamArr = [];
            downstreamArr = [];
            data.forEach(function (a) {
                upstreamArr.push(a.Upstream);
                downstreamArr.push(a.Downstream);
            }, {});

            root = upstreamArr.diff(downstreamArr);
            root = root[0];

            for (i = 0; i < data.length; i++) {
                if (data[i][headers.dimension] === root) {
                    a = data.splice(i, 1); // removes the item
                    data.unshift(a[0]); // adds it back to the beginning
                    break;
                }
            }

            tree = {};
            flat = {};

            addItemToTree = function (item) {
                var parent = flat[item[headers.dimension]],
                    child = flat[item[headers['dimension 1']]];
                if (!parent) {
                    parent = flat[item[headers.dimension]] = {
                        dimension: headers.dimension,
                        name: item[headers.dimension],
                        tooltip: item[headers.tooltip],
                    };
                    if (!Object.keys(tree).length) tree = parent;
                }
                if (!child) {
                    child = flat[item[headers['dimension 1']]] = {
                        dimension: headers.dimension,
                        name: item[headers['dimension 1']],
                        tooltip: item[headers.tooltip],
                    };
                    child.parent = parent.name;
                }
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(child);
            };

            data.forEach(addItemToTree);

            return tree;
        }

        data.sort(function (first, b) {
            var dataResult, newA, newB;
            newA = first[headers.dimension].split('.');
            newB = b[headers.dimension].split('.');
            while (newA.length) {
                if ((dataResult = newA.shift() - (newB.shift() || 0))) {
                    return dataResult;
                }
            }

            return -newB.length;
        });

        // After sort, get first element and split on '.' to retrieve rootNumber
        let rootNumber = data[0][headers.dimension].split('.');

        if (rootNumber.length > 1) {
            // This functions under the assumption that the root is being defined as 1.0
            // kinda specific and messy
            data[0][headers.dimension] = rootNumber[0];
        }

        result = [];

        data.forEach(function (item) {
            var parent = item[headers.dimension]
                    .split('.')
                    .slice(0, -1)
                    .join('.'),
                child;

            this[item[headers.dimension]] = {
                NodeId: item[headers.dimension],
                dimension: headers.dimension,
                name: item[headers['dimension 1']],
                tooltip: item[headers.tooltip],
            };
            if (parent) {
                this[parent] = this[parent] || {};
                this[parent].children = this[parent].children || [];
                child = this[item[headers.dimension]];
                child.parent = parent;
                this[parent].children.push(child);
            } else {
                result.push(this[item[headers.dimension]]);
            }
        }, {});

        return result[0];
    }

    /**
     * @name formatData
     * @desc puts data into ECharts data format
     * @param {Object} data - object of data in original format
     * @returns {Object} - object of data in ECharts format
     */
    // pass in all of the tabular data and the selected levels (dataTableAlign); we will set up the tree data according to the order of the data table align
    function formatData(data, tableHeaders, tipHeader) {
        var allHash = {},
            list = [],
            rootMap = {},
            currentMap = {},
            i,
            count,
            j,
            tipMap = {},
            nextMap,
            currentValue,
            currentTip;

        for (i in data) {
            // all of this is to change it to a tree structure and then call makeTree to structure the data appropriately for this viz
            if (data.hasOwnProperty(i)) {
                count = 0;
                for (j = 0; j < tableHeaders.length; j++) {
                    if (
                        !data[i][tableHeaders[j]] &&
                        data[i][tableHeaders[j]] !== 0
                    ) {
                        continue;
                    }

                    currentValue = data[i][tableHeaders[j]]
                        .toString()
                        .replace(/[']/g, '');

                    if (tipHeader) {
                        currentTip = data[i][tipHeader]
                            .toString()
                            .replace(/[']/g, '');
                    }
                    nextMap = {};

                    if (count === 0) {
                        // will take care of the first level and put into rootmap if it doesnt already exist in rootmap
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
                    if (currentTip) {
                        tipMap[currentValue] = currentTip;
                    }
                }
            }
        }

        makeTree(rootMap, list, tableHeaders, 'root', tipMap);

        if (list.length > 1) {
            allHash.name = 'root';
            allHash.children = list;
        } else if (list.length === 1) {
            allHash = list[0];
        } else {
            allHash = {};
        }

        return allHash;
    }

    function makeTree(map, list, tableHeaders, parent, tipMap) {
        var keyset = Object.keys(map),
            childSet = [],
            key,
            childMap,
            dataMap;

        for (key in keyset) {
            if (keyset.hasOwnProperty(key)) {
                childMap = map[keyset[key]];
                dataMap = {};

                // give nodes unique id's and info as to which dimension they belong to
                dataMap.name = keyset[key];
                dataMap.NodeId = semossCoreService.utility.random(dataMap.name);
                dataMap.dimension = tableHeaders ? tableHeaders[0] : null;
                dataMap.parent = parent;
                if (tipMap && tipMap.hasOwnProperty(keyset[key])) {
                    dataMap.tooltip = tipMap[keyset[key]];
                }

                if (
                    !childMap ||
                    (Array.isArray(childMap) && childMap.length === 0) ||
                    Object.keys(childMap).length === 0
                ) {
                    list.push(dataMap);
                } else {
                    dataMap.children = childSet;
                    list.push(dataMap);

                    makeTree(
                        childMap,
                        childSet,
                        tableHeaders ? tableHeaders.slice(1) : null,
                        dataMap.name
                    );
                    childSet = [];
                }
            }
        }
    }

    /**
     * @name customizeAnimation
     * @desc sets the animation style
     * @param {object} param - object of animation settings
     * @returns {object} - object of animation settings
     */
    function customizeAnimation(param) {
        var animationSettings = {};
        // TODO small refactor
        if (param && param.chooseType === 'No Animation') {
            animationSettings.showAnimation = false;
        } else if (param) {
            animationSettings.showAnimation = true;
            animationSettings.defaultAnimationType = param.chooseType;
            animationSettings.defaultAnimationSpeed = param.animationSpeed;
            animationSettings.defaultAnimationDuration =
                param.animationDuration;
        } else {
            // default
            animationSettings.showAnimation = true;
            // TODO set as same as widget service default state
            animationSettings.defaultAnimationType = 'No Animation';
            animationSettings.defaultAnimationSpeed = 1;
            animationSettings.defaultAnimationDuration = 500;
        }
        return animationSettings;
    }

    /**
     * @name setLevelColors
     * @param {array} colors the colors to set
     * @param {object} data the data to color
     * @param {array} legendSeries the series backing the legend -- set them to their appropriate colors
     * @param {object} options viz options
     * @desc color the data points based on level
     * @returns {void}
     */
    function setLevelColors(colors, data, legendSeries, options) {
        let set = [],
            queue = [data],
            dequeuedNode,
            i,
            colorCounter = 0,
            colorMapping = {},
            idx,
            defaultColor =
                options.color.length > 0 ? options.color[0] : PRIMARY_COLOR;

        while (queue.length > 0) {
            dequeuedNode = queue.pop();
            if (!colorMapping[dequeuedNode.dimension]) {
                colorMapping[dequeuedNode.dimension] = colors[colorCounter];
                if (colorCounter === colors.length - 1) {
                    // recycle the colors after it reaches the end
                    colorCounter = 0;
                } else {
                    colorCounter++;
                }
            }

            if (set.indexOf(dequeuedNode.NodeId) === -1) {
                set.push(dequeuedNode.NodeId);
                dequeuedNode.itemStyle = {
                    borderColor: colorMapping[dequeuedNode.dimension],
                    color: colorMapping[dequeuedNode.dimension],
                };

                if (dequeuedNode.children) {
                    for (i = 0; i < dequeuedNode.children.length; i++) {
                        queue.unshift(dequeuedNode.children[i]);
                    }
                }
            }
        }

        for (idx = 0; idx < legendSeries.length; idx++) {
            legendSeries[idx].itemStyle.normal.color =
                colorMapping[legendSeries[idx].name] || defaultColor;
        }
    }

    /**
     * @name runColorByValue
     * @param {array} colorByValue in the options
     * @param {object} data data structure representing the dendrogram
     * @desc BFS to look thru nodes and see if color by value rules apply.
     *       if so set the color
     * @return {void}
     */
    function runColorByValue(colorByValue, data) {
        colorByValue.forEach(function (rule) {
            var colorOn = rule.colorOn,
                set = [],
                queue = [data],
                dequeuedNode,
                i,
                k;

            while (queue.length > 0) {
                dequeuedNode = queue.pop();
                if (set.indexOf(dequeuedNode.NodeId) === -1) {
                    set.push(dequeuedNode.NodeId);
                    if (dequeuedNode.dimension === colorOn) {
                        for (k = 0; k < rule.valuesToColor.length; k++) {
                            if (rule.valuesToColor[k] === dequeuedNode.name) {
                                dequeuedNode.itemStyle = {
                                    borderColor: rule.color,
                                    color: rule.color,
                                };
                            }
                        }
                    }

                    if (dequeuedNode.children) {
                        for (i = 0; i < dequeuedNode.children.length; i++) {
                            queue.unshift(dequeuedNode.children[i]);
                        }
                    }
                }
            }
        });
    }

    function runColorPath(valuesToColor, data, upstreamHierarchy) {
        var count = 0;
        valuesToColor.forEach(function (val) {
            var set = [],
                queue = [data],
                dequeuedNode,
                i;

            while (queue.length > 0) {
                dequeuedNode = queue.pop();
                if (!upstreamHierarchy) {
                    if (!dequeuedNode.parent) {
                        dequeuedNode.itemStyle = {
                            // THIS IS OLD, WHEN ECHARTS IS UPDATED NEED TO CHANGE THIS TO JUST
                            // ITEMSTYLE: {BORDERCOLOR: rule.color}
                            normal: {
                                borderColor: val.color,
                                color: val.color,
                            },
                        };
                    }
                } else if (count === 0) {
                    data.itemStyle = {
                        // THIS IS OLD, WHEN ECHARTS IS UPDATED NEED TO CHANGE THIS TO JUST
                        // ITEMSTYLE: {BORDERCOLOR: rule.color}
                        normal: {
                            borderColor: val.color,
                            color: val.color,
                        },
                    };
                }
                if (dequeuedNode.children) {
                    for (i = 0; i < dequeuedNode.children.length; i++) {
                        if (dequeuedNode.children[i].hasOwnProperty('name')) {
                            if (
                                set.indexOf(dequeuedNode.children[i].name) ===
                                -1
                            ) {
                                if (dequeuedNode.children[i].name === val) {
                                    dequeuedNode.children[i].itemStyle = {
                                        // THIS IS OLD, WHEN ECHARTS IS UPDATED NEED TO CHANGE THIS TO JUST
                                        // ITEMSTYLE: {BORDERCOLOR: rule.color}
                                        normal: {
                                            borderColor: val.color,
                                            color: val.color,
                                        },
                                    };
                                }

                                set.push(dequeuedNode.name);
                                queue.unshift(dequeuedNode.children[i]);
                            }
                        }
                    }
                }
            }
            count++;
        });
    }

    /**
     * @name setEChartsDataSeries
     * @desc creates data series object to define ECharts viz
     * @param {string} type - chart type
     * @param {object} data - object of data in ECharts format created from formData function
     * @param {object} options - ui options
     * @param {num} height - calculated container height
     * @param {array} legendSeries - custom series to be used to display as legends
     * @returns {Object} - object of ECharts data series
     */
    function setEChartsDataSeries(type, data, options, height, legendSeries) {
        var series = [],
            dataObj = {},
            layout,
            labels;

        if (legendSeries && legendSeries.length > 0) {
            series = legendSeries;
        }

        if (Array.isArray(options.dendrogramColor)) {
            setLevelColors(options.dendrogramColor, data, series, options);
        }

        if (options.colorByValue && options.colorByValue.length > 0) {
            runColorByValue(options.colorByValue, data);
        }

        if (options.colorPath) {
            runColorPath(
                options.valuesToColor,
                data,
                options.showHierarchyByUpstream
            );
        }

        dataObj.itemStyle = {
            normal: {
                borderColor:
                    options.color.length > 0 ? options.color[0] : PRIMARY_COLOR,
                color:
                    options.color.length > 0 ? options.color[0] : PRIMARY_COLOR,
            },
        };
        dataObj.type = 'tree';
        dataObj.data = [data];

        if (options.changeSymbolDendrogram) {
            dataObj.symbol = getSymbol(options.changeSymbolDendrogram);
            if (options.changeSymbolDendrogram.symbolSize) {
                dataObj.symbolSize = options.changeSymbolDendrogram.symbolSize;
            }
        } else {
            dataObj.symbol = 'emptyCircle';
            dataObj.symbolSize = 10;
        }
        dataObj.expandAndCollapse = options.clickToCollapse;
        dataObj.animationDuration = 550;
        dataObj.animationDurationUpdate = 750;

        dataObj.lineStyle = {
            width: parseFloat(options.dendrogram.lineWidth) || 1,
            color: options.dendrogram.lineColor || '#ccc',
        };

        // Depth of tree
        dataObj.initialTreeDepth = options.treeDepth;

        // Start
        if (options.fitToView && !options.toggleRadial) {
            if (options.rotateAxis) {
                dataObj.width = '' + height + 'px';
            } else {
                dataObj.height = '' + height + 'px';
            }
        }

        layout = customizeLayout(
            options.toggleRadial,
            options.rotateAxis,
            options.fitToView
        );

        dataObj.top = layout.top || '10%';
        dataObj.bottom = layout.bottom || '10%';
        dataObj.left = layout.left || '10%';
        dataObj.right = layout.right || '20%';
        dataObj.orient = layout.orient;
        dataObj.layout = layout.layout;

        labels = customizeLabels(options);
        dataObj.label = labels.label;
        dataObj.leaves = labels.leaves;

        series.push(dataObj);

        return series;
    }

    /**
     * @name customizeLayout
     * @desc set dendogram layout
     * @param {bool} toggleRadial - uiOptions.toggleRadial
     * @param {bool} rotateAxis - uiOptions.rotateAxis
     * @param {bool} fitToView - uiOptions.fitToView
     * @returns {obj} layout object
     */
    function customizeLayout(toggleRadial, rotateAxis, fitToView) {
        var layout = {};

        if (toggleRadial) {
            layout.layout = 'radial';
            layout.top = '20%';
            layout.left = '10%';
            layout.right = '10%';
            layout.bottom = '20%';
        } else {
            layout.layout = 'orthogonal';
        }

        if (rotateAxis) {
            layout.orient = 'vertical';
        } else {
            layout.orient = 'horizontal';
        }

        if (fitToView && !toggleRadial) {
            if (rotateAxis) {
                layout.top = '2%';
                layout.left = '30px';
                layout.right = '12%';
                layout.bottom = '150px';
            } else {
                layout.top = '0%';
                layout.left = '80px';
                layout.right = '300px';
                layout.bottom = '1%';
            }
        }

        if (!fitToView && !toggleRadial) {
            if (rotateAxis) {
                layout.top = '10%';
                layout.left = '10%';
                layout.right = '10%';
                layout.bottom = '20%';
            } else {
                layout.top = '10%';
                layout.left = '10%';
                layout.right = '22%';
                layout.bottom = '10%';
            }
        }

        return layout;
    }

    /**
     * @name customizeLabels
     * @desc set dendogram layout
     * @param {obj} options chart options
     * @returns {obj} layout object
     */
    function customizeLabels(options) {
        let toggleRadial = options.toggleRadial,
            rotateAxis = options.rotateAxis,
            fitToView = options.fitToView,
            toggleLabels = options.toggleDendrogramLabels,
            labelStyle = options.valueLabel,
            fontColor = labelStyle.fontColor || options.fontColor || '#000000',
            fontFamily = labelStyle.fontFamily || 'Inter',
            fontWeight = labelStyle.fontWeight || 400,
            fontSize =
                parseFloat(labelStyle.fontSize) || options.fontSize || 12,
            fontNormal = fontSize,
            fontEmphasis = fontSize + 2,
            labels = {};

        if (fitToView && !toggleRadial) {
            toggleLabels = true;
        }

        if (toggleRadial) {
            labels.label = {
                normal: {
                    show: toggleLabels,
                    position: 'top',
                    rotate: 45,
                    fontSize: fontNormal,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    color: fontColor,
                    formatter: function (info) {
                        return typeof info.name === 'string'
                            ? info.name.replace(/_/g, ' ')
                            : info.name;
                    },
                },
                emphasis: {
                    show: true,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    fontSize: fontEmphasis,
                    color: fontColor,
                },
            };

            labels.leaves = {
                label: {
                    normal: {
                        show: toggleLabels,
                        position: 'bottom',
                        rotate: -45,
                        formatter: function (info) {
                            return typeof info.name === 'string'
                                ? info.name.replace(/_/g, ' ')
                                : info.name;
                        },
                    },
                },
            };

            return labels;
        }

        if (rotateAxis) {
            labels.label = {
                normal: {
                    show: toggleLabels,
                    position: 'top',
                    rotate: -45,
                    verticalAlign: 'middle',
                    align: 'right',
                    fontSize: fontNormal,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    color: fontColor,
                    formatter: function (obj) {
                        var value = obj.data.name,
                            pxSpace = 150,
                            maxCharacters = pxSpace / 5;

                        if (value.length > maxCharacters) {
                            return (
                                value
                                    .replace(/_/g, ' ')
                                    .substr(0, maxCharacters) + '...'
                            );
                        }
                        return value.replace(/_/g, ' ');
                    },
                },
                emphasis: {
                    show: true,
                    fontSize: fontEmphasis,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    color: fontColor,
                },
            };

            labels.leaves = {
                label: {
                    normal: {
                        show: toggleLabels,
                        position: 'bottom',
                        rotate: -45,
                        verticalAlign: 'middle',
                        align: 'left',
                        formatter: function (info) {
                            var value = info.data.name;
                            return typeof value === 'string'
                                ? value.replace(/_/g, ' ')
                                : value;
                        },
                    },
                },
            };
        } else {
            labels.label = {
                normal: {
                    show: toggleLabels,
                    position: 'left',
                    verticalAlign: 'middle',
                    align: 'right',
                    fontSize: fontNormal,
                    color: fontColor,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    formatter: function (obj) {
                        var value = obj.data.name,
                            pxSpace = 300,
                            maxCharacters = pxSpace / 6;

                        if (value && value.length > maxCharacters) {
                            return (
                                value
                                    .replace(/_/g, ' ')
                                    .substr(0, maxCharacters) + '...'
                            );
                        }
                        return typeof value === 'string'
                            ? value.replace(/_/g, ' ')
                            : value;
                    },
                },
                emphasis: {
                    show: true,
                    fontSize: fontEmphasis,
                    color: fontColor,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                },
            };

            labels.leaves = {
                label: {
                    normal: {
                        show: toggleLabels,
                        position: 'right',
                        verticalAlign: 'middle',
                        align: 'left',
                    },
                },
            };
        }

        return labels;
    }

    /**
     * @name getSymbol
     * @desc set scatter symbol
     * @param {bool} param - uiOptions.changeSymbolDendrogram
     * @returns {string} symbol shape
     */
    function getSymbol(param) {
        if (param.symbolUrl && param.symbolUrl !== '') {
            return 'image://' + param.symbolUrl;
            // Error alert if not of acceptable type
        }

        if (param.chooseType === 'Empty Circle') {
            return 'emptyCircle';
        } else if (param.chooseType === 'Rectangle') {
            return 'rect';
        } else if (param.chooseType === 'Round Rectangle') {
            return 'roundRect';
        } else if (param.chooseType === 'Triangle') {
            return 'triangle';
        } else if (param.chooseType === 'Diamond') {
            return 'diamond';
        } else if (param.chooseType === 'Pin') {
            return 'pin';
        } else if (param.chooseType === 'Arrow') {
            return 'arrow';
        } else if (param.chooseType === 'Circle') {
            return 'circle';
        }
        return 'emptyCircle';
    }

    /**
     * @name getBackgroundColorStyle
     * @desc customize the background style of the canvas
     * @param {string} watermark - string of the watermark text
     * @returns {Object} - canvas details
     */
    function getBackgroundColorStyle(watermark) {
        if (/\S/.test(watermark)) {
            return {
                type: 'pattern',
                image: paintWaterMark(watermark),
                repeat: 'repeat',
            };
        }

        return false;
    }

    /**
     * @name paintWaterMark
     * @desc paints a custom watermark on the viz
     * @param {string} watermark - string of the watermark text
     * @returns {Object} - canvas details
     */
    function paintWaterMark(watermark) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');
        canvas.width = canvas.height = 100;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.08;
        ctx.font = '20px Microsoft Yahei';
        ctx.translate(50, 50);
        ctx.rotate(-Math.PI / 4);
        if (watermark) {
            ctx.fillText(watermark, 0, 0);
        }
        return canvas;
    }

    return {
        getConfig: getConfig,
    };
}
