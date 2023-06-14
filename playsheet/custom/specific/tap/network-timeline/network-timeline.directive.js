(function () {
    'use strict';
    angular.module('app.tap.network-timeline.directive', [])
        .directive('networkTimeline', networkTimeline);

    networkTimeline.$inject = ['$rootScope', 'ngTableParams', '$filter', '_', 'networkTimelineService'];

    function networkTimeline($rootScope, ngTableParams, $filter, _, networkTimelineService) {
        networkTimelineLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];

        return {
            restrict: 'EA',
            require: ['chart'],
            bindToController: true,
            link: networkTimelineLink,
            controller: networkTimelineCtrl,
            controllerAs: "networkCtrl",
            templateUrl: "custom/specific/tap/network-timeline/network-timeline.directive.html"
        };

        function networkTimelineLink(scope, ele, attrs, controllers) {
            var tableDB,
                toolFunction = {
                    setTableData: setTableData,
                    setSliderState: setSliderState,
                    updateDataFromSlider: updateDataFromSlider,
                    toggleLabel: toggleLabel,
                    freezeNodes: freezeNodes,
                    unfreezeNodes: unfreezeNodes
                };

            scope.chartCtrl = controllers[0];
            scope.tableData = [];
            scope.chartCtrl.timeHashLocation = '';
            scope.sliderState = 'Initial';
            scope.labelToggle = true;
            scope.forceGraphOptions = {
                type: {
                    properties: []
                },
                currentLabels: []
            };

            scope.chartCtrl.dataProcessor = function (newData) {
                if (!_.isEmpty(newData)) {
                    scope.forceData = newData;
                    //scope.chartCtrl.forceData = newData;
                    scope.tableData = [];

                    //check if it nodes and/or edges have timeHash
                    var nodesTimeHash = networkTimelineService.hasTimeHash(newData.nodes);
                    var edgesTimeHash = networkTimelineService.hasTimeHash(newData.edges);

                    if (nodesTimeHash && edgesTimeHash) {
                        scope.chartCtrl.timeHashLocation = "Both";
                    } else if (nodesTimeHash) {
                        scope.chartCtrl.timeHashLocation = "Nodes";
                    } else if (edgesTimeHash) {
                        scope.chartCtrl.timeHashLocation = "Edges";
                    }

                    var nodesICD = hasICD(newData.nodes, "VERTEX_TYPE_PROPERTY");
                    var edgesICD = hasICD(newData.edges, "EDGE_TYPE");

                    if (nodesICD && edgesICD) {
                        scope.tableData = createTableModel(newData.nodes, "Nodes");
                        var edgeTableData = createTableModel(newData.edges, "Edges");
                        //combine tables
                        for (var i = 0; i < edgeTableData.length; i++) {
                            scope.tableData.push(edgeTableData[i]);
                        }
                    } else if (nodesICD) {
                        scope.tableData = createTableModel(newData.nodes, "Nodes");
                    } else if (edgesICD) {
                        scope.tableData = createTableModel(newData.edges, "Edges");
                    }

                    tableDB = TAFFY(scope.tableData);
                    scope.chartCtrl.maxLOE = networkTimelineService.calculateMaxLOE(scope.forceData);
                    networkTimelineService.setSliderMax(scope.chartCtrl.maxLOE);
                    networkTimelineService.setMaxLOE(scope.chartCtrl.maxLOE);
                    setTableData(0);
                    $rootScope.$emit('network-timeline-forcegraph-receive', 'update-data');
                }
            };

            function hasICD(collection, type) {
                for (var item in collection) {
                    if (collection[item].propHash[type] === "SystemInterface") {
                        return true;
                    }
                }
                return false;
            }

            var toggleLabelCleanUpFunc = $rootScope.$on('networktimelinetools.toggle-label', function (event, label) {
                toggleLabels(label);
            });

            //show/hide node text
            function toggleLabels(label) {
                if (label === true) {
                    d3.selectAll(".nodetext")
                        .attr("display", "block");
                } else {
                    d3.selectAll(".nodetext")
                        .attr("display", "none");
                }
            }

            function createTableModel(itemArray, timeHashLocation) {
                var tableData = [],
                    name,
                    type,
                    newItem = {};

                if (timeHashLocation === "Nodes") {
                    name = "VERTEX_LABEL_PROPERTY";
                    type = "VERTEX_TYPE_PROPERTY";
                } else if (timeHashLocation === "Edges") {
                    name = "EDGE_NAME";
                    type = "EDGE_TYPE";
                }

                for (var item in itemArray) {

                    if (itemArray[item].propHash.timeHash && itemArray[item].propHash[type] === "SystemInterface") {
                        if (itemArray[item].propHash.timeHash["Decommissioned"]) { //decommissioned
                            //new item data model
                            newItem = {
                                name: itemArray[item].propHash[name],
                                uri: itemArray[item].uri,
                                phase: "Decommissioned",
                                startLOE: 0,
                                LOE: 0,
                                totalLOE: 0,
                                dependICDS: [],
                                gltag: "",
                                type: itemArray[item].propHash[type]
                            };

                            tableData.push(newItem);
                        } else { //requirements, design, test, develop, deploy phases

                            //create total for LOE hours
                            var totalLOE = 0;
                            var phases = ["Requirements", "Design", "Develop", "Test", "Deploy"];

                            for (var i = 0; i < phases.length; i++) {
                                if (itemArray[item].propHash.timeHash[phases[i]]) {


                                    //new item data model
                                    newItem = {};
                                    newItem.name = itemArray[item].propHash[name];
                                    newItem.uri = itemArray[item].uri;
                                    newItem.phase = itemArray[item].propHash.timeHash[phases[i]].phase;
                                    newItem.startLOE = totalLOE;
                                    newItem.LOE = itemArray[item].propHash.timeHash[phases[i]].LOE;
                                    //set the edges properties
                                    itemArray[item].propHash.timeHash[phases[i]].startLOE = totalLOE;

                                    //add to previous total
                                    totalLOE += itemArray[item].propHash.timeHash[phases[i]].LOE;

                                    //set the edges properties
                                    itemArray[item].propHash.timeHash[phases[i]].totalLOE = totalLOE;
                                    newItem.totalLOE = totalLOE;
                                    //dependICDS come back as an array stringified, need to parse back to array
                                    if (_.isString(itemArray[item].propHash.timeHash[phases[i]].dependICDS)) {
                                        itemArray[item].propHash.timeHash[phases[i]].dependICDS = JSON.parse(itemArray[item].propHash.timeHash[phases[i]].dependICDS);
                                    }
                                    newItem.dependICDS = itemArray[item].propHash.timeHash[phases[i]].dependICDS;
                                    newItem.gltag = itemArray[item].propHash.timeHash[phases[i]].gltag;
                                    newItem.type = itemArray[item].propHash[type];

                                    tableData.push(newItem);
                                }
                            }

                            //add the completed state
                            newItem = {
                                name: itemArray[item].propHash[name],
                                uri: itemArray[item].uri,
                                phase: "Completed",
                                startLOE: totalLOE,
                                LOE: 0,
                                totalLOE: totalLOE,
                                dependICDS: itemArray[item].propHash.timeHash["Requirements"].dependICDS,
                                gltag: "",
                                type: itemArray[item].propHash[type]
                            };
                            itemArray[item].propHash.timeHash["Completed"] = newItem;

                            tableData.push(newItem);
                        }
                    } else if (!itemArray[item].propHash.timeHash && itemArray[item].propHash[type] === "SystemInterface") {
                        //new item data modelcreateedge
                        newItem = {
                            name: itemArray[item].propHash[name],
                            uri: itemArray[item].uri,
                            phase: "Sustainment",
                            startLOE: 0,
                            LOE: 0,
                            totalLOE: 0,
                            dependICDS: [],
                            gltag: "",
                            type: itemArray[item].propHash[type]
                        };
                        tableData.push(newItem);
                    }

                }

                return tableData;
            }

            function setTableData(sliderValue) {
                //scope.sliderState = toolService.getSliderState();


                //slider state at time initial, get all ICDs that are currently implemented and the ones that will be Decommissioned
                if (scope.sliderState === "Initial") {

                    scope.tableData = tableDB(function () {
                        if (this.phase === "Sustainment" || this.phase === "Decommissioned") {
                            return true;
                        }
                    }).get();

                } else if (scope.sliderState === "Transition") {

                    var dependICDs = [];
                    //get all dependent ICDs that can be decommissioned
                    tableDB().each(function (item) {
                        if (item.totalLOE < sliderValue && item.phase === "Completed") {
                            //dependICDS come back as a string but they need to be parsed into an array
                            if (_.isString(item.dependICDS)) {
                                item.dependICDS = JSON.parse(item.dependICDS);
                            }
                            for (var i = 0; i < item.dependICDS.length; i++) {
                                dependICDs.push(item.dependICDS[i]);
                            }
                        }
                    });

                    scope.tableData = tableDB(function () {
                        //checks first to see if the dependent ICD is able to be decommissioned
                        for (var i = 0; i < dependICDs.length; i++) {
                            if (dependICDs[i] === this.uri) {
                                return true;
                            }
                        }

                        //completed phase only has a start and no end, so only check the startLOE and phase name
                        if (sliderValue > this.startLOE && this.phase === "Completed") {
                            return true;
                        }
                        //all other phases are based on the start and total LOE
                        else if (this.totalLOE >= sliderValue && sliderValue > this.startLOE) {
                            return true;
                        }
                        //add the decommissioned systems if the slider is over the maxLOE
                        else if (sliderValue >= scope.chartCtrl.maxLOE && this.phase === "Decommissioned") {
                            return true;
                        } else if (sliderValue === 0 && this.phase === "Requirements") {
                            return true;
                        }

                        //adding in all sustained interfaces
                        return (sliderValue >= scope.chartCtrl.maxLOE && this.phase === "Sustainment");

                    }).get();
                } else if (scope.sliderState === "Final") {
                    scope.tableData = tableDB(function () {
                        if (this.phase === "Completed" || this.phase === "Sustainment") {
                            return true;
                        }
                    }).get();
                }

                scope.tableParams.reload();
            }

            var updateTableCleanUpFunc = $rootScope.$on('timelineforcegraph.update-table', function (event, sliderVal) {
                setTableData(sliderVal);
            });

            scope.setCurrentLabels = function (type, value) {
                scope.forceGraphOptions.currentLabels[type] = value;
                updateLabels();
            };

            scope.setGraphLabels = function () {
                var labelTypes = scope.forceGraphOptions.currentLabels;

                for (var indNode in scope.chartCtrl.data.nodes) {
                    var nodeType = scope.chartCtrl.data.nodes[indNode].propHash.VERTEX_TYPE_PROPERTY;
                    // If our type isn't in our current labels object, add it.
                    if (!scope.forceGraphOptions.currentLabels[nodeType]) {
                        var valueArray = [];
                        valueArray.length = 0;
                        var currentLabelSelected = "VERTEX_LABEL_PROPERTY";
                        for (var key in scope.chartCtrl.data.nodes[indNode].propHash) {
                            valueArray.push(key);
                            if (key === labelTypes[nodeType]) {
                                currentLabelSelected = key;
                            }
                        }
                        scope.forceGraphOptions.type.properties.push({
                            name: nodeType,
                            values: valueArray,
                            selected: currentLabelSelected
                        });

                        if (!labelTypes[nodeType]) {
                            scope.forceGraphOptions.currentLabels[nodeType] = "VERTEX_LABEL_PROPERTY";
                        } else {
                            for (var type in labelTypes) {
                                if (nodeType === type) {
                                    scope.forceGraphOptions.currentLabels[nodeType] = labelTypes[type];
                                }
                            }
                        }
                    }
                }
                updateLabels();
            };

            function updateLabels() {
                d3.selectAll(".nodetext") //this graphs all force-labels and then filter to update labels specific to the container
                    .text(function (d) {
                        for (var type in scope.forceGraphOptions.currentLabels) {
                            var valuesForType = scope.forceGraphOptions.currentLabels[type];
                            if (type === d.propHash.VERTEX_TYPE_PROPERTY) {
                                if (_.isObject(d.propHash[valuesForType])) {
                                    return d.propHash[valuesForType].label;
                                } else {
                                    return d.propHash[valuesForType];
                                }
                            }
                        }
                    });
            }

            scope.$on('networktimelinetools.set-labels', function (event, name, selected) {
                scope.setCurrentLabels(name, selected);
            });

            function getTableData() {
                if (scope.tableData.length > 0) {
                    return scope.tableData;
                } else {
                    return [];
                }
            }

            scope.tableParams = new ngTableParams({
                page: 1,
                count: 25, // count per page
                sorting: {
                    phase: 'asc' // initial sorting
                }
            }, {
                //counts: [],
                total: getTableData().length, // length of data
                getData: function ($defer, params) {
                    var data = getTableData();
                    // use build-in angular filter
                    var filteredData = params.filter() ?
                        $filter('filter')(data, params.filter()) :
                        data;
                    var orderedData = params.sorting() ?
                        $filter('orderBy')(filteredData, params.orderBy()) :
                        data;
                    params.total(orderedData.length); // set total for recalc pagination
                    $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                }
            });

            scope.$on("destroy", function networktimelineDestroyer() {
                toggleLabelCleanUpFunc();
                updateTableCleanUpFunc();
            });

            scope.chartCtrl.toolUpdateProcessor = function (toolUpdateConfig) {
                //need to invoke tool functions
                toolFunction[toolUpdateConfig.fn](toolUpdateConfig.args);
            };

            function updateDataFromSlider(value) {
                setTableData(value);
                scope.networkCtrl.updateForceStateAndSlider(scope.sliderState, value);
            }

            function setSliderState(state) {
                scope.sliderState = state;
            }

            function toggleLabel(bool) {
                scope.networkCtrl.toggleForceLabel(bool);
            }

            function freezeNodes() {
                scope.networkCtrl.freezeNodes();
            }

            function unfreezeNodes() {
                scope.networkCtrl.unfreezeNodes();
            }

            /*function setCurrentLabels(labelInfo) {
             scope.networkCtrl.setCurrentLabels(labelInfo.name, labelInfo.selected);
             }*/

        }


        function networkTimelineCtrl() {
            var networkCtrl = this;

            networkCtrl.updateForceStateAndSlider = function () {
            };
            networkCtrl.toggleForceLabel = function () {
            };
            networkCtrl.setCurrentLabels = function () {
            };
            networkCtrl.freezeNodes = function () {
            };
            networkCtrl.unfreezeNodes = function () {
            };

        }


    }
})(); //end of controller IIFE
