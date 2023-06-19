(function () {
    'use strict';

    angular.module("app.create-panel.directive", [])
        .directive("createPanel", createPanel);

    createPanel.$inject = ["$rootScope", "$timeout", "$filter", "$compile", "$q", "alertService", "dataService", "createPanelService", "monolithService", "pkqlService", "permissionsService"];

    function createPanel($rootScope, $timeout, $filter, $compile, $q, alertService, dataService, createPanelService, monolithService, pkqlService, permissionsService) {
        createPanelLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        createPanelCtrl.$inject = ["$scope"];

        return {
            restrict: 'E',
            templateUrl: 'custom/create-panel/create-panel.directive.html',
            scope: {},
            bindToController: true,
            controllerAs: 'create',
            controller: createPanelCtrl,
            link: createPanelLink
        };

        function createPanelCtrl($scope) {
            var create = this;
            create.dbMetamodel = {};
            //initialize for create-metamodel directive. these will be overriden in that directive once it's been created. this way we can run these calls alongside the "single-view" dagre to keep them synchronized
            create.dbMetamodel.addNode = function () {
                console.log("addNode create");
            };
            create.dbMetamodel.removeNode = function () {
                console.log("removeNode create");
            };
            create.dbMetamodel.addProperty = function () {
                console.log("addProperty create");
            };
            create.dbMetamodel.initializeMetamodel = function (engine) {
                console.log("initializeMetamodel -- will be overridden by create-metamodel");
            };

            /** Dagre Variables **/
            var g, svg, inner, zoom, render;

            create.showLoading = false;
            create.addNode = false;
            create.visibleContent = 'engine-metamodel';
            create.engines = {list: [], selected: {}};
            create.nodeFilter = {name: ""};
            create.joinType = "inner"; //default value for joinType
            create.joinOptions = [
                {display: 'Inner Join', value: 'inner', show: true},
                {display: 'Partial Outer', value: 'partial', show: true},
                {display: 'Full Outer', value: 'outer', show: false}
            ];
            create.receivedAllConcepts = false;
            create.fileData = null;
            create.pkqlComponents = [];
            create.insightHasNodes = false;
            create.activeTab = {
                'dagre': false,
                'engine-metamodel': true,
                'table': false
            };
            create.loadMore = false;
            create.searchTerm = "";

            create.toggleView = toggleView;
            //create.createEngineMetamodel = createEngineMetamodel;
            create.selectNode = selectNode;
            create.addProperty = addProperty;
            create.addToView = addToView;
            create.saveFilter = saveFilter;
            create.toggleFilter = toggleFilter;
            create.cancelAddToView = cancelAddToView;
            create.getMoreInstances = getMoreInstances;
            create.searchInstances = searchInstances;
            create.selectAllToggle = selectAllToggle;
            create.checkSelectAll = checkSelectAll;
            create.resetInstanceList = resetInstanceList;
            create.changeJoinType = changeJoinType;
            create.isEmpty = isEmpty;
            create.editInstance = editInstance;
            create.createDataChange = createDataChange;
            create.nodeLabelMaker = nodeLabelMaker;
            create.disableRemove = disableRemove;
            create.disableProp = disableProp;
            create.getConnectedNodes = getConnectedNodes;
            create.getAndBuildMetamodel = getAndBuildMetamodel;
            create.fileAdded = fileAdded;
            create.hideFreeText = hideFreeText;
            create.hideRawData = hideRawData;
            create.addMoreTableData = addMoreTableData;
            create.setDataFrame = setDataFrame;
            create.runDataFrameQuery = runDataFrameQuery;
            create.joinQueuedNodes = joinQueuedNodes;
            create.updateMetamodel = updateMetamodel;
            create.selectDB = selectDB;
            create.isComponent = isComponent;
            create.removeNodeFromDagre = removeNodeFromDagre;
            create.removeEdgeFromDagre = removeEdgeFromDagre;
            create.addAllProps = addAllProps;
            create.removeAllProps = removeAllProps;
            create.showSelectAll = showSelectAll;
            create.filterJoins = filterJoins;

            //gets and sets the available engines
            permissionsService.getAllEngines();

            function filterJoins(value) {
                if (create.visibleContent === "engine-metamodel" && value === "outer") {
                    return true;
                }

                return false;
            }

            function isEmpty(obj) {
                return _.isEmpty(obj);
            }

            function editInstance(instance) {
                var filteredInstance = $filter("shortenAndReplaceUnderscores")(instance);
                if (filteredInstance.length > 20) {
                    return filteredInstance.substring(0, 20) + '...';
                } else {
                    return filteredInstance;
                }
            }

            /**
             * @name setDataFrame
             * @param dataFrameType grid or graph
             * @desc generates and runs a pkql command to set dataframe
             */
            function setDataFrame(dataFrameType) {
                create.dataFrameType = dataFrameType;
                create.addedNodes = {};

                var dataFrameQuery = runDataFrameQuery(true);
                var currentWidget = dataService.getWidgetData();
                pkqlService.executePKQL(currentWidget.insightId, dataFrameQuery);
            }

            function selectDB(dbName) {
                create.dbTitle = dbName;

                if (create.visibleContent === 'engine-metamodel') {
                    create.activeTab['engine-metamodel'] = 'true';
                    create.visibleContent = 'engine-metamodel';
                    create.dbMetamodel.initializeMetamodel({name: dbName});
                }
            }

            /**
             * @name removeNodeFromDagre
             * @param node
             * @desc removes the node  from dagre
             */
            function removeNodeFromDagre(node) {
                g.removeNode(node);
            }

            /**
             * @name removeEdgeFromDagre
             * @param source
             * @param target
             * @desc removes the edge from dagre
             */
            function removeEdgeFromDagre(source, target) {
                g.removeEdge(source, target);
            }

            /**
             * @name selectNode
             * @param node
             * @desc selects the node and get all instances of that node
             */
            function selectNode(node) {
                var engine = node.db[0],
                    tripleObj = {},
                    existingConcept = "",
                    joinType = create.joinType,
                    insightID = create.widgetData.insightId,
                    searchTerm = "",
                    limit = 50,
                    offset = 0,
                    joinConcept = "",
                    component = {};

                create.selectedNode = JSON.parse(JSON.stringify(node));
                if (_.isEmpty(create.addedNodes)) {
                    create.highlightedNode = JSON.parse(JSON.stringify(node));
                    create.receivedAllConcepts = false;
                    create.newTripleObj = {relTriples: [[node.conceptualName]]};
                } else {
                    if (node.direction === "downstream") {
                        create.newTripleObj = {
                            relTriples: [
                                [node.conceptualName, node.relation, node.equivalent]
                            ]
                        };
                    } else if (node.direction === "upstream") {
                        create.newTripleObj = {
                            relTriples: [
                                [node.equivalent, node.relation, node.conceptualName]
                            ]
                        };
                    }
                }
                tripleObj = create.newTripleObj;
                if (create.visibleContent === "engine-metamodel") {
                    component = {};
                    component[node.name] = {
                        engineName: node.db[0].name,
                        node: node,
                        properties: [],
                        relTriples: create.newTripleObj.relTriples[0],
                        existingConcept: create.highlightedNode.conceptualName,
                        joinConcept: create.selectedNode.equivalent ? create.selectedNode.equivalent : undefined,
                        queryJoin: "inner.join"
                    };
                    create.pkqlComponents.push(component);

                    addToView();
                    create.showLoading = true;
                    getConceptInstances(insightID, limit, offset);
                } else {
                    component = {};
                    component[node.name] = {
                        engineName: node.db[0].name,
                        node: node,
                        properties: [],
                        relTriples: create.newTripleObj.relTriples[0],
                        existingConcept: create.highlightedNode.conceptualName,
                        joinConcept: create.selectedNode.equivalent ? create.selectedNode.equivalent : undefined,
                        queryJoin: "inner.join"
                    };

                    create.showLoading = true;
                    getConceptInstances(insightID, limit, offset, null, [component]);
                }
            }

            /**
             * @name getConceptInstances
             * @param insightID
             * @param limit
             * @param offset
             * @param existingValues
             * @param pkqlComponents
             * @desc get the instances for each concept
             */
            function getConceptInstances(insightID, limit, offset, existingValues, pkqlComponents) {
                var pkqlObjects = [], pkqlQuery = "";
                create.searchTerm = "";

                if (existingValues) {
                    pkqlComponents = JSON.parse(JSON.stringify(create.pkqlComponents));
                    for (var index = 0; index < pkqlComponents.length; index++) {
                        if (pkqlComponents[index][existingValues.name]) {
                            if (pkqlComponents[index][existingValues.name].filters) {
                                delete pkqlComponents[index][existingValues.name].filters[existingValues.name];
                                delete pkqlComponents[index][existingValues.name].filterSigns[existingValues.name];
                            }
                        } else {
                            //check properties
                            for (var node in pkqlComponents[index]) {
                                if (pkqlComponents[index][node].properties && pkqlComponents[index][node].properties.indexOf(existingValues.name) > -1) {
                                    if (pkqlComponents[index][node].filters) {
                                        delete pkqlComponents[index][node].filters[existingValues.name];
                                        delete pkqlComponents[index][node].filterSigns[existingValues.name];
                                    }
                                }
                            }
                        }
                    }
                }

                pkqlObjects = createPKQLObject(pkqlComponents || create.pkqlComponents, false);
                var conceptualName = "";
                for (var i = 0; i < pkqlObjects.length; i++) {
                    conceptualName = create.selectedNode.conceptualName;
                    if(create.selectedNode.parentName) {
                        conceptualName = create.selectedNode.parentName + "__" +create.selectedNode.conceptualName;
                    }
                    pkqlObjects[i].selectors = [conceptualName];
                    pkqlObjects[i].range = {getCount: true};
                    pkqlQuery += pkqlService.generateDBImportPKQLQuery(pkqlObjects[i], true);
                }

                create.showLoading = true;
                createPanelService.getInstancesForConcept(insightID ? insightID : "new", pkqlQuery)
                    .then(function (data) {
                        create.instanceList.maxSize = data.list[0];
                    });

                pkqlQuery = "";
                for (var j = 0; j < pkqlObjects.length; j++) {
                    pkqlObjects[j].range = {limit: limit, offset: offset, getCount: false};
                    pkqlQuery += pkqlService.generateDBImportPKQLQuery(pkqlObjects[j], true);
                }

                createPanelService.getInstancesForConcept(insightID ? insightID : "new", pkqlQuery)
                    .then(function (data) {
                        create.showLoading = false;
                        if (data.list) {
                            create.instanceList.concept = create.selectedNode.conceptualName;
                            create.instanceList.list = JSON.parse(JSON.stringify(data.list));

                            if (existingValues) {
                                create.selectAll = existingValues.selected.length === 0 && !existingValues.equals;
                                create.instanceList.equals = existingValues.equals;
                                create.instanceList.selected = JSON.parse(JSON.stringify(existingValues.selected));

                                if (create.instanceList.equals) {
                                    if (create.selectAll) {
                                        create.instanceList.tempSelected = JSON.parse(JSON.stringify(data.list));
                                    } else {
                                        create.instanceList.tempSelected = JSON.parse(JSON.stringify(existingValues.selected));
                                    }
                                } else {
                                    create.instanceList.tempSelected = data.list;
                                    create.instanceList.tempSelected = _.remove(create.instanceList.tempSelected, function (item) {
                                        for (var index = 0; index < existingValues.selected.length; index++) {
                                            if (existingValues.selected[index] === item) {
                                                return false;
                                            }
                                        }

                                        return true;
                                    })
                                }
                            } else {
                                create.selectAll = true; //default to select all

                                if (!create.instanceList.equals) {
                                    //create.instanceList.selected = JSON.parse(JSON.stringify(data.data));
                                    create.instanceList.tempSelected = JSON.parse(JSON.stringify(data.list));
                                }
                            }
                        } else {
                            alertService('No matching elements found', 'Error', 'toast-error', 3000);
                        }
                    }, function (err) {
                        var errMessage = "";
                        if (err.message) {
                            errMessage = "err.message";
                        } else {
                            errMessage = "An error occurred retrieving instances.";
                        }
                        create.showLoading = false;
                        alertService(errMessage, 'Error', 'toast-error', 3000);
                    });

                create.showConcept = false;
                create.showInstances = true;
            }

            /**
             * @name saveFilter
             * @desc this will save the filter information, which will be passed into the query struct
             */
            function saveFilter() {
                //we will check the pkqlcomponent that has the selected node
                for (var componentIndex = 0; componentIndex < create.pkqlComponents.length; componentIndex++) {
                    var component = create.pkqlComponents[componentIndex],
                        concept = create.instanceList.concept;

                    for (var node in component) { //loop through all the nodes and also check their properties because we can filter on props as well
                        if (node === concept || (component[node].properties && component[node].properties.indexOf(concept) > -1)) {
                            if (!create.pkqlComponents[componentIndex][node].filters) {
                                create.pkqlComponents[componentIndex][node].filters = {};
                                create.pkqlComponents[componentIndex][node].filterSigns = {};
                            }

                            if (create.instanceList.selected.length !== 0) {
                                create.pkqlComponents[componentIndex][node].filters[concept] = create.instanceList.selected;
                                create.pkqlComponents[componentIndex][node].filterSigns[concept] = !create.instanceList.equals ? "!=" : "="; //false is normal filter--keep selected values; true is remove selected values
                                break;
                            } else {
                                //nothing selected so we will remove the filter
                                delete create.pkqlComponents[componentIndex][node].filters[concept];
                                delete create.pkqlComponents[componentIndex][node].filterSigns[concept];
                            }
                        }
                    }
                }
            }

            /**
             * @name toggleFilter
             * @param node
             * @param parent
             * @desc will show/hide the filter and set the correct selected values
             */
            function toggleFilter(node, parent) {
                if (create.selectedNode.name === node) {
                    create.showInstances = !create.showInstances;
                } else {
                    create.showInstances = true;

                    create.receivedAllConcepts = false;
                    getConnectedNodes(create.dbMetamodel.metamodelObject.nodes[node]);
                }

                if (create.showInstances) {
                    getFilterValues(node, parent);
                } else {
                    //show the database selection
                    create.showConcept = true;
                }

                create.selectedNode = create.dbMetamodel.metamodelObject.nodes[node];
            }

            /**
             * @name getFilterValues
             * @param node
             * @desc this will get back the filterValues for the selected node
             */
            function getFilterValues(node) {
                var existingValues = {
                    selected: [],
                    equals: false
                }, insightID = create.widgetData.insightId || "new";
                create.selectedNode = create.addedNodes[node];
                existingValues.name = create.selectedNode.conceptualName;
                create.instanceListOffset = 0;

                node = create.selectedNode.conceptualName;

                for (var index = 0; index < create.pkqlComponents.length; index++) {
                    if (create.pkqlComponents[index][node]) {
                        if (create.pkqlComponents[index][node].filters && create.pkqlComponents[index][node].filters[node]) {
                            existingValues.selected = create.pkqlComponents[index][node].filters[node];
                            if (create.pkqlComponents[index][node].filterSigns[node] === "=") {
                                existingValues.equals = true;
                            } else {
                                existingValues.equals = false;
                            }

                            break;
                        }
                    } else {
                        //check properties
                        for (var node2 in create.pkqlComponents[index]) {
                            if (create.pkqlComponents[index][node2].properties && create.pkqlComponents[index][node2].properties.indexOf(node) > -1) {
                                if (create.pkqlComponents[index][node2].filters && create.pkqlComponents[index][node2].filters[node]) {
                                    existingValues.selected = create.pkqlComponents[index][node2].filters[node];
                                    if (create.pkqlComponents[index][node2].filterSigns[node] === "=") {
                                        existingValues.equals = true;
                                    } else {
                                        existingValues.equals = false;
                                    }

                                    break;
                                }
                            }
                        }
                    }
                }

                create.showLoading = true;
                getConceptInstances(insightID, 50, 0, existingValues);
            }

            /**
             * @name cancelAddToView
             * @desc cancel instance selection and return to concepts list
             */
            function cancelAddToView() {
                create.showInstances = false;
                create.showConcept = true;
                //create.addedEdges.pop();
                resetInstanceList();
                if (_.isEmpty(create.addedNodes)) {
                    create.selectedNode = {};
                    create.highlightedNode = {};
                }
            }

            /**
             * @name addToView
             * @desc adds the selected instances to backend then get the connected nodes to the selected node
             */
            function addToView() {
                var engine = create.selectedNode.db[0],
                    tripleObj = create.newTripleObj,
                    existingConcept = create.highlightedNode.name, // TODO check if physical or unique name should be passed into here
                    joinConcept = create.selectedNode.name, //defaults to selectedNode name when it's first node to be selected // TODO check if physical or unique name should be passed into here
                    joinType = create.joinType,
                    insightID = create.widgetData.insightId || "new";

                create.showInstances = false;
                create.showConcept = true;

                if (create.instanceList.selected && create.instanceList.selected.length > 0) {
                    create.newTripleObj.filter = {};
                    create.newTripleObj.filterSigns = {};
                    if (create.selectedNode.parentName) {
                        create.newTripleObj.filter[create.selectedNode.parentName + "__" + create.selectedNode.name] = create.instanceList.selected;
                        create.newTripleObj.filterSigns[create.selectedNode.conceptualName] = !create.instanceList.equals ? "!=" : "=";
                    } else {
                        create.newTripleObj.filter[create.selectedNode.conceptualName] = create.instanceList.selected;
                        create.newTripleObj.filterSigns[create.selectedNode.conceptualName] = !create.instanceList.equals ? "!=" : "=";
                    }
                }

                var pkqlObject = {};
                if (create.selectedNode.parentName) {//handles property as a concept
                    pkqlObject = {
                        engineName: engine.name,
                        selectors: [],
                        filters: tripleObj.filter,
                        joinType: [joinType],
                        triples: tripleObj.relTriples,
                        existingConcept: [create.highlightedNode.name],
                        joinConcept: [create.selectedNode.equivalent ? create.selectedNode.equivalent : undefined],
                        queryJoins: []
                    };

                    if (tripleObj.relTriples[0].length === 1) { //first node
                        pkqlObject.triples[0][0] = create.selectedNode.parentName + "__" + create.selectedNode.conceptualName;
                        pkqlObject.selectors.push(create.selectedNode.parentName + "__" + create.selectedNodeconceptualName);
                    } else {
                        if (create.selectedNode.conceptualName === tripleObj.relTriples[0][0]) {
                            pkqlObject.triples[0][0] = create.selectedNode.parentName + "__" + tripleObj.relTriples[0][0];
                        } else if (create.selectedNode.conceptualName === tripleObj.relTriples[0][2]) {
                            pkqlObject.triples[0][2] = create.selectedNode.parentName + "__" + tripleObj.relTriples[0][2];
                        }

                        pkqlObject.selectors.push(create.selectedNode.parentName);
                        pkqlObject.selectors.push(create.selectedNode.parentName + "__" + create.selectedNode.conceptualName);
                    }
                } else { //handles normal concepts
                    pkqlObject = {
                        engineName: engine.name,
                        selectors: [],
                        filterSigns: tripleObj.filterSigns,
                        filters: tripleObj.filter,
                        joinType: [joinType],
                        triples: tripleObj.relTriples,
                        existingConcept: [create.highlightedNode.name],
                        joinConcept: [create.selectedNode.equivalent ? create.selectedNode.equivalent : undefined],
                        queryJoins: []
                    };

                    if (tripleObj.relTriples[0].length === 1) { //first node
                        pkqlObject.selectors.push(tripleObj.relTriples[0][0]);
                    } else {
                        pkqlObject.selectors.push(tripleObj.relTriples[0][0]);
                        pkqlObject.selectors.push(tripleObj.relTriples[0][2]);
                    }
                }

                if (create.visibleContent !== "engine-metamodel") {
                    resetInstanceList();
                    generateAndRunQuery([pkqlObject]);
                }

                getProperties(create.selectedNode).then(function (node) {
                    create.addedNodes[node.name] = node;
                    if (tripleObj.relTriples[0].length > 1) { //add edge if there is a triple
                        if (create.selectedNode.direction === "downstream") {
                            create.addedEdges.push({
                                source: create.selectedNode.name,
                                relation: create.selectedNode.relation,
                                target: create.highlightedNode.name
                            });
                        } else if (create.selectedNode.direction === "upstream") {
                            create.addedEdges.push({
                                source: create.highlightedNode.name,
                                relation: create.selectedNode.relation,
                                target: create.selectedNode.name
                            });
                        }
                    }
                    create.dbMetamodel.addNode();

                    addDagreNode(node);
                    addEdges();
                });

                dataService.setWidgetEngine(create.selectedNode.db[0]);

                if (_.keys(create.addedNodes).length === 0 || create.visibleContent === "engine-metamodel") {
                    create.receivedAllConcepts = false;
                    getConnectedNodes(create.selectedNode);
                }

                if (tripleObj.relTriples[0].length !== 1) {//if we're traversing, we need to check the existingConcept and see if the db is same. if not, we need to add the new db into the db list (if not already in)
                    if (_.findIndex(create.addedNodes[existingConcept].db, {'name': engine.name}) == -1) {
                        create.addedNodes[existingConcept].db.push(engine);
                        createPanelService.getConceptProperties(create.addedNodes[existingConcept])
                            .then(function (data) {
                                for (var prop in data) {
                                    create.addedNodes[existingConcept].properties.push(data[prop]);
                                }
                            });
                    }
                }

                create.nodeFilter = {name: ''};
            }

            function generateAndRunQuery(pkqlObjects) {
                create.contentLoading = true;
                var pkqlQuery = "";

                for (var i = 0; i < pkqlObjects.length; i++) {
                    pkqlQuery += pkqlService.generateDBImportPKQLQuery(pkqlObjects[i]);
                }

                if (!pkqlQuery) {
                    return;
                }

                var currentWidget = dataService.getWidgetData();
                pkqlService.executePKQL(currentWidget.insightId, /*runDataFrameQuery() + */pkqlQuery);
            }

            /**
             * @name runDataFrameQuery
             * @param clearDataFrame
             * @desc run the dataframe query which will clear the dataframe
             * @returns {*}
             */
            function runDataFrameQuery(clearDataFrame) {
                var dataFrameQuery = "";
                if (_.isEmpty(create.addedNodes) || clearDataFrame || !create.insightHasNodes) {
                    dataFrameQuery = pkqlService.generateDataFrameQuery(create.dataFrameType);
                    create.insightHasNodes = false;
                }

                return dataFrameQuery;
            }

            /**
             * @name getMoreInstances
             * @desc get the next set of results from backend and add to our existing list
             */
            function getMoreInstances() {
                var insightID = create.widgetData.insightId,
                    limit = 50,
                    offset = create.instanceListOffset += limit,
                    tempComponents = JSON.parse(JSON.stringify(create.pkqlComponents));

                if (create.instanceList.searchTerm) {
                    return; //do nothing because it should have gotten all results
                }

                //remove the filters from the selected node
                for (var component = 0; component < tempComponents.length; component++) {
                    for (var node in tempComponents[component]) {
                        for (var filter in tempComponents[component][node].filters) {
                            if (filter === create.selectedNode.conceptualName) {
                                delete tempComponents[component][node].filters[filter];
                                delete tempComponents[component][node].filterSigns[filter];
                            }
                        }
                    }
                }

                var pkqlObjects = createPKQLObject(tempComponents, false), pkqlQuery = "";

                for (var i = 0; i < pkqlObjects.length; i++) {
                    pkqlObjects[i].selectors = [create.selectedNode.conceptualName];
                    pkqlObjects[i].range = {limit: limit, offset: offset};
                    pkqlQuery += pkqlService.generateDBImportPKQLQuery(pkqlObjects[i], true);
                }

                create.showLoading = true;
                createPanelService.getInstancesForConcept(insightID ? insightID : "new", pkqlQuery)
                    .then(function (data) {
                        create.showLoading = false;
                        if (data) {
                            create.instanceList.concept = create.selectedNode.conceptualName;

                            //add new data to the list
                            create.instanceList.list = _.union(create.instanceList.list, data.list);
                            if (!create.instanceList.equals) {
                                //create.instanceList.selected = _.union(create.instanceList.selected, data.data);
                                create.instanceList.tempSelected = _.union(create.instanceList.tempSelected, data.list);
                            }
                        }
                    }, function (err) {
                        var errMessage = "";
                        if (err.message) {
                            errMessage = "err.message";
                        } else {
                            errMessage = "An error occurred retrieving instances.";
                        }
                        create.showLoading = false;
                        alertService(errMessage, 'Error', 'toast-error', 3000);
                    });
            }

            /**
             * @name searchInstances
             * @desc make backend call to search for matching instances
             */
            function searchInstances() {
                var insightID = create.widgetData.insightId,
                    limit = 50,
                    offset = 0;

                create.instanceListOffset = 0;

                if (create.searchTerm) {
                    limit = 0; //get all for when there is a search
                    create.instanceList.searchTerm = JSON.parse(JSON.stringify(create.searchTerm));
                } else {
                    create.instanceList.searchTerm = "";
                }

                var pkqlObjects = createPKQLObject(create.pkqlComponents, false), pkqlQuery = "";

                for (var i = 0; i < pkqlObjects.length; i++) {
                    pkqlObjects[i].selectors = [create.selectedNode.conceptualName];
                    pkqlObjects[i].range = {limit: limit, offset: offset, getCount: true};
                    if (create.instanceList.searchTerm) {
                        if (!pkqlObjects[i].filters) {
                            pkqlObjects[i].filters = {};
                            pkqlObjects[i].filterSigns = {};
                        }
                        pkqlObjects[i].filters[create.selectedNode.conceptualName] = [create.instanceList.searchTerm];
                        pkqlObjects[i].filterSigns[create.selectedNode.conceptualName] = "?like";
                    } else {
                        //remove the filter for the selected node...
                        if (pkqlObjects[i].filters) {
                            delete pkqlObjects[i].filters[create.selectedNode.conceptualName];
                            delete pkqlObjects[i].filterSigns[create.selectedNode.conceptualName];
                        }
                    }
                    pkqlQuery += pkqlService.generateDBImportPKQLQuery(pkqlObjects[i], true);
                }
                create.instanceList.list = [];
                create.showLoading = true;

                //i think this is stupid but BE wants us to make separate calls to get size of list...so they can asynchronously return the data vs the size
                createPanelService.getInstancesForConcept(insightID ? insightID : "new", pkqlQuery)
                    .then(function (data) {
                        create.instanceList.maxSize = data.list[0];

                        if (create.instanceList.searchTerm) {
                            //how should we set select all...?
                            //create.instanceList.selectAll
                        }
                    });
                pkqlQuery = "";
                //don't get the count...i hate this
                for (var j = 0; j < pkqlObjects.length; j++) {
                    pkqlObjects[j].range.getCount = false;
                    pkqlQuery += pkqlService.generateDBImportPKQLQuery(pkqlObjects[j], true);
                }

                createPanelService.getInstancesForConcept(insightID ? insightID : "new", pkqlQuery)
                    .then(function (data) {
                        create.showLoading = false;
                        if (data) {
                            //loop through the data array and push all the new values to the list
                            create.instanceList.list = data.list;

                            if (!create.instanceList.equals) {
                                //create.instanceList.selected = _.union(create.instanceList.selected, data.data);
                                create.instanceList.tempSelected = _.union(create.instanceList.tempSelected, data.list);
                                create.instanceList.tempSelected = _.remove(create.instanceList.tempSelected, function (item) {
                                    for (var index = 0; index < create.instanceList.selected.length; index++) {
                                        if (create.instanceList.selected[index] === item) {
                                            return false;
                                        }
                                    }

                                    return true;
                                })
                            }

                            if (!create.instanceList.searchTerm) {
                                create.instanceList.selectAll = create.instanceList.selected.length === 0 && !create.instanceList.equals;
                            } else {
                                if (!create.instanceList.equals && create.instanceList.selected.length === 0) {
                                    create.instanceList.selectAll = true;
                                } else {
                                    create.instanceList.selectAll = false;
                                }
                            }
                        }
                    }, function (err) {
                        var errMessage = "";
                        if (err.message) {
                            errMessage = "err.message";
                        } else {
                            errMessage = "An error occurred retrieving instances.";
                        }
                        create.showLoading = false;
                        alertService(errMessage, 'Error', 'toast-error', 3000);
                    });
            }

            /**
             * @name selectAll
             * @desc when select all is clicked
             */
            function selectAllToggle() {
                create.instanceList.selectAll = !create.instanceList.selectAll;

                if (!create.instanceList.searchTerm) {
                    create.instanceList.selected = [];

                    if (create.instanceList.selectAll) {
                        create.instanceList.equals = false;
                        create.instanceList.tempSelected = JSON.parse(JSON.stringify(create.instanceList.list));
                    } else {
                        create.instanceList.equals = true;
                        create.instanceList.tempSelected = [];
                    }

                    saveFilter();
                } else {
                    //make call to get all search term results and push into create.instanceList.selected
                    var pkqlObjects = createPKQLObject(create.pkqlComponents, false), pkqlQuery = "",
                        insightID = create.widgetData.insightId;

                    for (var i = 0; i < pkqlObjects.length; i++) {
                        pkqlObjects[i].selectors = [create.selectedNode.conceptualName];
                        //add the filter for searching this term
                        if (!pkqlObjects[i].filters) {
                            pkqlObjects[i].filters = {};
                            pkqlObjects[i].filterSigns = {};
                        }
                        pkqlObjects[i].filters[create.selectedNode.conceptualName] = [create.instanceList.searchTerm];
                        pkqlObjects[i].filterSigns[create.selectedNode.conceptualName] = "?like";
                        pkqlQuery += pkqlService.generateDBImportPKQLQuery(pkqlObjects[i], true);
                    }

                    create.showLoading = true;
                    createPanelService.getInstancesForConcept(insightID ? insightID : "new", pkqlQuery)
                        .then(function (data) {
                            create.showLoading = false;
                            if (create.instanceList.selectAll) {
                                create.instanceList.selected = _.union(create.instanceList.selected, data.list);
                                create.instanceList.tempSelected = _.union(create.instanceList.tempSelected, data.list);
                            } else {
                                for (var index = 0; index < data.list.length; index++) {
                                    //remove all of the items unselected from view
                                    if (create.instanceList.tempSelected.indexOf(data.list[index]) > -1) {
                                        create.instanceList.tempSelected.splice(create.instanceList.tempSelected.indexOf(data.list[index]), 1);
                                    }

                                    if (create.instanceList.selected.indexOf(data.list[index]) > -1) {
                                        create.instanceList.selected.splice(create.instanceList.selected.indexOf(data.list[index]), 1);
                                    }
                                }
                            }

                            saveFilter();
                        }, function (err) {
                            var errMessage = "";
                            if (err.message) {
                                errMessage = "err.message";
                            } else {
                                errMessage = "An error occurred retrieving instances.";
                            }
                            create.showLoading = false;
                            alertService(errMessage, 'Error', 'toast-error', 3000);
                        });
                }
            }

            /**
             * @name checkSelectAll
             * @desc this will indicate whether the select all button should be checked by length of tempSelected and full instanceList
             */
            function checkSelectAll(selectedInstance) {
                if (create.instanceList.selected.indexOf(selectedInstance) > -1) {
                    create.instanceList.selected.splice(create.instanceList.selected.indexOf(selectedInstance), 1);
                } else {
                    create.instanceList.selected.push(selectedInstance);
                }

                if (create.instanceList.searchTerm) { //if it's a searched result then we only check this list's size rather than the max size
                    create.instanceList.selectAll = _.difference(create.instanceList.list, create.instanceList.tempSelected).length === 0;

                    saveFilter();
                    return;
                }

                //reset .selected when selected.length is === maxsize;
                if (create.instanceList.selected.length === create.instanceList.maxSize) {
                    create.instanceList.selectAll = !create.instanceList.selectAll;
                    create.instanceList.selected = [];
                    //create.instanceList.equals = !create.instanceList.equals;
                } else {
                    if (create.instanceList.selected.length === 0 && create.instanceList.equals) {
                        create.instanceList.selectAll = false;
                    } else if (create.instanceList.selected.length === 0 && !create.instanceList.equals) {
                        create.instanceList.selectAll = true;
                    } else if (create.instanceList.selectAll && create.instanceList.selected.length > 0) {
                        create.instanceList.selectAll = false;
                    }
                }

                saveFilter();
            }

            /**
             * @name getConnectedNodes
             * @param node find connected nodes
             * @desc takes the passed in node and find all nodes connected to it; backend returns a huge nested object so we need to loop through all of that
             */
            function getConnectedNodes(node) {
                if (!node || _.isEmpty(node) || create.receivedAllConcepts) {
                    return; //no node passed in
                }
                var nodeName = node.conceptualName, parentName = "";
                if (node.parentName) { //for properties we need to send its conceptual name without the concept concatenation
                    parentName = node.parentName;
                }

                create.showLoading = true;
                createPanelService.getConnectedNodes(nodeName, parentName)
                    .then(function (data) {
                        setConnectedNodesData(data);
                        create.receivedAllConcepts = true;
                    }, function (error) {
                        var errMessage = "";
                        create.showLoading = false;
                        if (error.message) {
                            errMessage = error.message;
                        } else {
                            errMessage = "Error occurred retrieving connected nodes.";
                        }
                        alertService(errMessage, 'Error', 'toast-error', 3000);
                    });
            }

            /**
             * @name setConnectedNodesData
             * @param data {object} the data coming back from either getNeighbors or getConnectedNodes
             * @desc set up the data structure for connected nodes
             */
            function setConnectedNodesData(data) {
                create.showLoading = false;
                if (_.isEmpty(data)) {
                    create.dbTitle = "None Found";
                    create.nodes = {};
                } else {
                    var tempObj = {};
                    var allDBConcepts = [];
                    var securitySettings = permissionsService.getSecuritySettings(),
                        authorizedEngines = securitySettings.availableEngines;

                    for (var engine in data) {
                        var combinedObj = [];
                        if (_.findIndex(authorizedEngines, ['name', engine]) === -1) {
                            continue; //user doesnt have access to dbs outside of the engines returned from getAllEngines so we will not add those even though its returned from those calls.
                        }

                        for(var concept in data[engine]) {
                            for (var direction in data[engine][concept]) {
                                if (direction === "upstream" || direction === "downstream") {
                                    for (var index = 0; index < data[engine][concept][direction].length; index++) {
                                        combinedObj.push({
                                            name: data[engine][concept][direction][index],
                                            conceptualName: data[engine][concept][direction][index],
                                            direction: direction.toLowerCase(),
                                            relation: "",
                                            parentName: "",
                                            equivalent: concept,
                                            db: [{name: engine}]
                                        });
                                    }
                                }
                            }
                        }

                        tempObj[engine] = combinedObj;
                        allDBConcepts = _.union(allDBConcepts, combinedObj);
                    }

                    create.nodes = tempObj;
                    create.nodes.All_DBs = allDBConcepts;

                    //if the selected db does not have any related/neighbor nodes, we will show the nodes for the first db
                    if (!create.nodes[create.dbTitle]) {
                        var dbs = _.keys(create.nodes);
                        create.dbTitle = dbs[0];
                    }
                }
            }

            /**
             * @name getProperties
             * @param node selected node
             * @desc takes the passed in node and finds all the properties of the node, then triggers rendering
             */
            function getProperties(node) {
                var propQueries = [];
                //for (var db in node.db) {
                propQueries.push(createPanelService.getConceptProperties(node));
                //}
                return $q.all(propQueries).then(function (data) {
                    var combinedProps = [];

                    for (var engine in data) {
                        for (var index in data[engine]) {
                            for (var prop in data[engine][index]) {
                                combinedProps.push(data[engine][index][prop]);
                            }
                        }
                    }

                    node.properties = combinedProps;
                    node.selectedPropertiesSheet = 0;
                    return node;
                });
            }

            /**
             * @name addPropNode
             * @param prop selected property
             * @desc create the node and edge for the prop node
             */
            function addPropNode(prop) {
                g.setNode(prop.name, {
                    label: function () {
                        return $compile(propertyNodeMaker(prop))($scope)[0];
                    },
                    shape: 'diamond',
                    labelType: 'html',
                    data: prop,
                    rx: 5,
                    ry: 5,
                    style: "fill: #fff; opacity: 1; stroke: #000; stroke-width: 1"
                });

                create.addedEdges.push({
                    source: prop.parentName,
                    relation: "hasProperty",
                    target: prop.name
                });
            }

            /**
             * @name addEdges
             * @desc add all of the edges to dagre
             */
            function addEdges() {
                for (var i in create.addedEdges) {
                    g.setEdge(create.addedEdges[i].source, create.addedEdges[i].target, {
                        label: "",
                        labelType: "html",
                        data: create.addedEdges[i],
                        lineInterpolate: "cardinal",
                        arrowhead: "normal",
                        style: "stroke:#000;fill: none;stroke-opacity: .3"
                    });
                }

                highlightNode();
                render(inner, g);
                addEvents();
            }

            /**
             * @name addProperty
             * @param prop property for selected node
             * @desc takes the passed in property and adds  to the dataframe
             */
            function addProperty(prop) {
                var insightID = create.widgetData.insightId,
                    propIndex = _.findIndex(create.addedNodes[prop.parentName].properties, {
                        'name': prop.name,
                        'db': prop.db
                    });
                $scope.create.resetInstanceList();

                if (create.dbMetamodel.metamodelObject) {
                    if (create.dbMetamodel.metamodelObject.nodes[prop.parentName].properties[prop.name]) {
                        create.dbMetamodel.metamodelObject.nodes[prop.parentName].properties[prop.name].selected = true;
                    }
                }
                create.addedNodes[prop.parentName].properties[propIndex].selected = true;

                if (create.visibleContent === "engine-metamodel") {
                    if (_.findIndex(create.pkqlComponents, prop.parentName) === -1) { //if the parent of this property doesnt exist
                        var component = {};
                        component[prop.parentName] = {
                            engineName: prop.db[0].name,
                            node: create.addedNodes[prop.parentName],
                            properties: [prop.parentName+"__"+prop.conceptualName],
                            relTriples: [],
                            existingConcept: null,
                            joinConcept: null
                        };

                        if (create.insightHasNodes) {
                            component[prop.parentName].existingConcept = prop.parentName;
                            component[prop.parentName].joinConcept = prop.parentName;
                        }

                        create.pkqlComponents.push(component);
                    } else {
                        var parentLocation = _.findIndex(create.pkqlComponents, prop.parentName);
                        create.pkqlComponents[parentLocation][prop.parentName].properties.push(prop.parentName+"__"+prop.conceptualName);
                    }

                    create.addedNodes[prop.name] = prop;
                    //create.highlightedNode = create.addedNodes[prop.name];
                    addPropNode(prop);
                    addEdges();
                    create.selectedNode = prop;
                    create.dbMetamodel.orderedPropList.push(prop.name);

                    if (create.showInstances) {
                        getConceptInstances(insightID, 50, 0);
                    }
                } else {
                    var pkqlObject = {
                        engineName: prop.db[0].name || prop.db[0],
                        selectors: [],
                        filters: undefined,
                        joinType: ["partial"],
                        triples: [],
                        existingConcept: [prop.parentName],
                        joinConcept: [prop.parentName]
                    };

                    pkqlObject.selectors.push(prop.parentName);
                    pkqlObject.selectors.push(prop.parentName+"__"+prop.conceptualName);

                    var pkqlQuery = pkqlService.generateDBImportPKQLQuery(pkqlObject);
                    var currentWidget = dataService.getWidgetData();
                    pkqlService.executePKQL(currentWidget.insightId, pkqlQuery);

                    create.addedNodes[prop.name] = prop;
                    addPropNode(prop);
                    addEdges();

                    dataService.setWidgetEngine(create.selectedNode.db[0]);
                }

                getProperties(prop);
            }

            /**
             * @name addAllProps
             * @param node
             * @desc all all props of this node
             */
            function addAllProps(node) {
                create.showConcept = true;
                create.showInstances = false;

                for (var prop in create.dbMetamodel.metamodelObject.nodes[node].properties) {
                    if (!create.dbMetamodel.metamodelObject.nodes[node].properties[prop].selected) {
                        create.addProperty(create.dbMetamodel.metamodelObject.nodes[node].properties[prop]);
                    }
                }
            }

            /**
             * @name removeAllProps
             * @param node
             * @desc removes all of the selected properties
             */
            function removeAllProps(node) {
                for (var prop in create.dbMetamodel.metamodelObject.nodes[node].properties) {
                    if (create.dbMetamodel.metamodelObject.nodes[node].properties[prop].selected) {
                        //check to see if it's in pkqlComponents, if not continue because we cannot remove properties that have been added into the dataframe already
                        if (!isComponent(create.dbMetamodel.metamodelObject.nodes[node].properties[prop].name)) {
                            continue;
                        }
                        create.removeProperty(create.dbMetamodel.metamodelObject.nodes[node].properties[prop].name, node);
                    }
                }

                create.showConcept = true;
                create.showInstances = false;
            }

            /**
             * @name showSelectAll
             * @param node
             * @desc returns true when there is at least one property not selected else returns false
             */
            function showSelectAll(node) {
                if (!create.dbMetamodel.metamodelObject.nodes[node]) {
                    return;
                }

                for (var prop in create.dbMetamodel.metamodelObject.nodes[node].properties) {
                    if (!create.dbMetamodel.metamodelObject.nodes[node].properties[prop].selected) {
                        return true;
                    }
                }

                return false;
            }

            //TODO REMOVE ALL TIMEOUTS AND FIGURE OUT WHY ITS NOT PAINTING CORRECTLY
            /*** Dagre Functions **/
            /**
             * @name initializeDagre
             * @desc initializes a new d3Dagre
             */
            function initializeDagre() {
                svg = d3.select('#svg').select("svg");

                inner = svg.select("g");

                //clear out previous if any
                inner.selectAll("*").remove();

                g = new dagreD3.graphlib.Graph().setGraph({multigraph: true});
                g.setDefaultEdgeLabel(function () {
                    return {
                        label: "",
                        style: "stroke:#333;fill: none;stroke-width: 1.5px;"
                    }
                });

                g.graph().rankDir = "TB";
                g.graph().nodeSep = 20;

                g.graph().transition = function (selection) {
                    return selection.transition().duration(500);
                };

                render = new dagreD3.render();

                zoom = d3.behavior.zoom().on("zoom", function () {
                    inner.attr("transform", "translate(" + d3.event.translate + ")" +
                        "scale(" + d3.event.scale + ")");
                });

                svg.call(zoom).on("dblclick.zoom", null);
            }

            /**
             * @name addDagreNode
             * @param node selected node
             * @desc takes in the passed in node and adds it to dagre. Adds in associated edges and then renders
             */
            function addDagreNode(node) {
                g.setNode(node.name, {
                    label: function () {
                        return $compile(nodeLabelMaker(node))($scope)[0];
                    },
                    labelType: 'html',
                    data: node,
                    rx: 5,
                    ry: 5,
                    style: "fill: #fff; opacity: 1; stroke: #000; stroke-width: 1"
                });
            }

            //TODO Can optimize - remove input boxes and combine function
            /**
             * @name nodeLabelMaker
             * @param node selected node
             * @param makeProperties {boolean} determines whether we want to create the properties for the node
             * @desc generates a label for the selected node
             */
            function nodeLabelMaker(node, makeProperties) {
                var labelHolder = "<div><div style='height:12px'> ";
                labelHolder += "<div class='pull-right fa fa-times fa-lg pointer red-font' style='width: 5px; height: 0; margin-left: 10px'";
                labelHolder += "ng-show='create.unselectable(\"" + node.name + "\")' ng-click='create.removeNode(\"" + node.name + "\"); $event.stopPropagation()'></div>";
                labelHolder += "</i><div class='pull-left pointer' style='color: black' title='" + node.name + "'>";
                labelHolder += "<i class='fa fa-filter pull-left' ng-show='create.addedNodes[\"" + node.name + "\"] && create.isComponent(\"" + node.name + "\")' ng-click='create.toggleFilter(\"" + node.name + "\")'></i>" + node.name;
                labelHolder += "</div></div>";

                if (makeProperties) {
                    labelHolder = propertiesMaker(node, labelHolder);
                }

                labelHolder += "</div>";

                return labelHolder;
            }

            /**
             * @name isComponent
             * @param node
             * @desc checks to see if the node is a pkqlcomponent--this means it has not been run yet
             */
            function isComponent(node) {
                for (var index = 0; index < create.pkqlComponents.length; index++) {
                    if (create.pkqlComponents[index][node]) {
                        return true;
                    }

                    for (var node2 in create.pkqlComponents[index]) { //check properties
                        if (create.pkqlComponents[index][node2].properties && create.pkqlComponents[index][node2].properties.indexOf(node2 + "__" + node) > -1) {
                            return true;
                        }
                    }
                }

                return false;
            }

            /**
             * @name disableRemove
             * @param node
             * @returns {boolean}
             */
            function disableRemove(node) {
                if (!create.stepMapping[create.stepMapping.length - 1] || (create.stepMapping[create.stepMapping.length - 1].type === "Add Property" || create.stepMapping[create.stepMapping.length - 1].node !== node)) {
                    return true;
                }

                return false;
            }

            /**
             * @name propertyNodeMaker
             * @param prop property passed in to create a node label out of
             * @desc generate a node to hold the property
             */
            function propertyNodeMaker(prop) {
                var propName = prop.name;
                if (propName.length > 11) {
                    propName = propName.substring(0, 10) + "...";
                }

                var labelHolder = "<div><div title='" + prop.name + "' class='create-dagre-label overflow-ellipsis' style='height:15px; max-width: 70px'> ";
                labelHolder += "<div class='pointer' style='color: black'>" + propName;
                labelHolder += "</div></div>";
                labelHolder += "</div>";

                return labelHolder;
            }

            /**
             * @name propertiesMaker
             * @param node the node this property belongs to
             * @param labelHolder the label created so far; we will append and then return the completed
             * @desc generate a node to hold the property--currently configured to work with create-metamodel
             */
            function propertiesMaker(node, labelHolder) {
                if (!_.isEmpty(node.properties)) {
                    labelHolder += "<hr class='create-dagre-bar'>";
                }

                //column list
                var columnCount = 0, propsShown = 5;
                labelHolder += "<div class='create-dagre-label-holder'>";
                for (var i in node.properties) {
                    if (columnCount === 0 && Object.keys(node.properties).length >= propsShown) {
                        //Select all
                        labelHolder += "<div class='create-dagre-label-line'>";
                        labelHolder += "<div title='Select All' style='width: 120px; text-align: left' class='pull-left overflow-ellipsis' >Select All</div>";
                        labelHolder += "<div class='pull-right' >";
                        labelHolder += "<button class='pull-right fa fa-plus create-border-btn' ng-click=\"$event.stopPropagation(); create.addAllProps(\'" + node.name + "\');\" ng-show=\"create.showSelectAll(\'" + node.name + "\');\" ng-class=\"{'create-dagre-disabled':" + "!create.addedNodes[\'" + node.name + "\']}\"" + ">";
                        labelHolder += "</button>";
                        labelHolder += "<button class='pull-right fa fa-times create-border-btn' ng-show=\"!create.showSelectAll(\'" + node.name + "\');\" ng-click=\"$event.stopPropagation(); create.removeAllProps(\'" + node.name + "\');\">";
                        labelHolder += "</button>";
                        labelHolder += "</div>";
                        labelHolder += "</div>";

                        propsShown = 4;
                    }

                    labelHolder += "<div class='create-dagre-label-line' ng-show=\"" + "create.dbMetamodel.metamodelObject.nodes[\'" + node.name + "\'].selectedPropertiesSheet === " + Math.floor(columnCount / propsShown) + "\">";
                    labelHolder += "<div title='" + $filter('replaceUnderscores')(node.properties[i].name) + "' style='width: 120px; text-align: left'  class='pull-left overflow-ellipsis' >";
                    labelHolder += "<i class='fa fa-filter pull-left' style='margin-top: 5px' ng-show='create.addedNodes[\"" + node.name + "\"] && create.isComponent(\"" + node.properties[i].name + "\")' ng-click='create.toggleFilter(\"" + node.properties[i].name + "\"," + node.properties[i].parentName + ")'></i>"
                    labelHolder += $filter('replaceUnderscores')(node.properties[i].name) + "</div>";
                    labelHolder += "<div class='pull-right' >";
                    labelHolder += "<button class='pull-right fa fa-plus create-border-btn' ng-click=\"$event.stopPropagation(); create.addProperty(" + "create.dbMetamodel.metamodelObject.nodes[\'" + node.name + "\'].properties[\'" + node.properties[i].name + "\'])\" ng-class=\"{'create-dagre-disabled':" + "create.disableProp(\'" + node.properties[i].parentName + "\', \'" + node.properties[i].name + "\')}\"" + " ng-show=\"!create.dbMetamodel.metamodelObject.nodes[\'" + node.name + "\'].properties[\'" + node.properties[i].name + "\'].selected\">";
                    labelHolder += "</button>";
                    labelHolder += "<button class='pull-right fa fa-times create-border-btn' ng-click=\"$event.stopPropagation(); create.removeProperty(\'" + node.properties[i].name + "\',\'" + node.name + "\')\" ng-class=\"{'create-dagre-disabled':" + "create.disableProp(\'" + node.properties[i].parentName + "\', \'" + node.properties[i].name + "\')}\"" + " ng-show=\"create.dbMetamodel.metamodelObject.nodes[\'" + node.name + "\'].properties[\'" + node.properties[i].name + "\'].selected\">";
                    labelHolder += "</button>";
                    labelHolder += "</div>";
                    labelHolder += "</div>";
                    columnCount++;
                }
                labelHolder += "</div>";
                //add in pagination (if necessary)
                if (columnCount > propsShown) {
                    labelHolder += "<div class='create-dagre-carets'>";
                    labelHolder += "<i class='fa fa-caret-square-o-left fa-lg pointer' style='margin-right: 5px;' ng-class=\"{'create-dagre-disabled':" + "create.dbMetamodel.metamodelObject.nodes[" + "\'" + node.name + "\'" + "]['selectedPropertiesSheet'] <= 0}\" ng-click=\"$event.stopPropagation();" + "create.dbMetamodel.metamodelObject.nodes[" + "\'" + node.name + "\'" + "]['selectedPropertiesSheet'] = " + "(create.dbMetamodel.metamodelObject.nodes[" + "\'" + node.name + "\'" + "]['selectedPropertiesSheet'] - 1)" + "\"></i>";
                    labelHolder += "<i class='fa fa-caret-square-o-right fa-lg pointer' style='margin-left: 5px;' ng-class=\"{'create-dagre-disabled':" + "create.dbMetamodel.metamodelObject.nodes[" + "\'" + node.name + "\'" + "]['selectedPropertiesSheet'] >= " + Math.floor(columnCount / propsShown) + "}\" ng-click=\"$event.stopPropagation();" + "create.dbMetamodel.metamodelObject.nodes[" + "\'" + node.name + "\'" + "]['selectedPropertiesSheet'] = " + "(create.dbMetamodel.metamodelObject.nodes[" + "\'" + node.name + "\'" + "]['selectedPropertiesSheet'] + 1)" + "\"></i>";
                    labelHolder += "</div>";
                }

                return labelHolder;
            }

            /**
             * @name disableProp
             * @param parentName {string} node the node this property belongs to
             * @param propName {string} name of property
             * @desc disables/enables the prop
             */
            function disableProp(parentName, propName) {
                if (!create.dbMetamodel.metamodelObject.nodes[parentName] || !create.dbMetamodel.metamodelObject.nodes[parentName].properties[propName]) {
                    return;
                }

                for (var index = 0; index < create.dbMetamodel.orderedPropList.length; index++) {
                    if (create.dbMetamodel.orderedPropList.indexOf(propName) === -1 && create.dbMetamodel.metamodelObject.nodes[parentName].properties[propName].selected) {
                        return true;
                    }
                }

                if (create.dbMetamodel.orderedPropList.length === 0) {
                    if (create.dbMetamodel.metamodelObject.nodes[parentName].properties[propName].selected) {
                        return true;
                    }
                }

                //dbMetamodel.metamodelObject.nodes[" + "\'" + node.name + "\'" + "]['properties'][" + "\'" + node.properties[i].name + "\'" + "]['selected'] && (create.stepMapping[create.stepMapping.length-1].property !== \'" + node.properties[i].name + "\' || create.stepMapping[create.stepMapping.length-1].node !== \'" + node.name + "\')}\"
                if (!create.addedNodes[parentName] || !create.dbMetamodel.metamodelObject.nodes[parentName].properties[propName] || (create.dbMetamodel.metamodelObject.nodes[parentName].properties[propName].selected && (create.stepMapping.length > 0 && create.stepMapping[create.stepMapping.length - 1].property !== propName))) {
                    return true;
                }

                return false;
            }

            /**
             * @name highlightNode
             * @desc highlights the selected node and greys out the rest
             */
            function highlightNode() {
                for (var i in create.addedNodes) {
                    if (create.addedNodes[i].name && create.addedNodes[i].name === create.highlightedNode.name) { //check for node
                        if (g._nodes[create.addedNodes[i].name])
                            g._nodes[create.highlightedNode.name].style = "fill:  rgba(79, 164, 222, 0.75); opacity: 1; stroke: #000; stroke-width: 1";
                    }
                    else {
                        if (create.addedNodes[i].name)
                            if (g._nodes[create.addedNodes[i].name])
                                g._nodes[create.addedNodes[i].name].style = "fill: #fff; opacity: 1; stroke: #000; stroke-width: 1;";
                    }
                }
            }

            /**
             * @name addEvents
             * @desc adds event listeners to every rendered node to highlight and get connections on click
             */
            function addEvents() {
                var nodes = svg.selectAll(".node");
                nodes.each(function (d) {
                    var node = d3.select(this);
                    node.on('click', function (d) {
                        if (create.addedNodes[d] && d !== create.highlightedNode.name) {
                            create.highlightedNode = create.addedNodes[d];
                            create.receivedAllConcepts = false;
                            create.dbTitle = create.highlightedNode.db[0].name;

                            highlightNode();
                            render(inner, g);
                            getConnectedNodes(create.addedNodes[d]);
                        }
                    })
                })
            }

            /*** Navigation Functions **/
            /**
             * @name createDataChange
             * @desc send new data to sheet
             */
            function createDataChange() {
                dataService.toggleWidgetHandle('visual');

                joinQueuedNodes();
            }

            /**
             * @name changeJoinType
             * @param joinType
             * @desc change the joinType and get the instances
             */
            function changeJoinType(joinType) {
                var limit = 50,
                    offset = 0;
                if (create.joinType === joinType) { //do nothing if selecting the same joinType
                    return;
                }

                create.joinType = joinType;

                if (create.visibleContent === "engine-metamodel") {
                    //look for the node in the components and update its join type
                    for (var index = 0; index < create.pkqlComponents.length; index++) {
                        if (create.pkqlComponents[index][create.selectedNode.name]) {
                            var tempJoin = "";
                            if (create.joinType === "inner") {
                                tempJoin = "inner.join";
                            } else if (create.joinType === "partial") {
                                tempJoin = "left.outer.join";
                            } else if (create.joinType === "outer") {
                                tempJoin = "outer.join";
                            }

                            create.pkqlComponents[index][create.selectedNode.name].queryJoin = tempJoin;
                            break;
                        }
                    }

                    getConceptInstances(create.widgetData.insightId, limit, offset);
                } else {
                    selectNode(create.selectedNode);
                }
            }

            /**
             * @name toggleView
             * @desc switches the view of the content
             */
            function toggleView(view) {
                create.visibleContent = view;
                create.activeTab[view] = true;
                create.showInstances = false;
                create.showConcept = true;
                //create.showDatabase = true;

                if (view === 'dagre') {
                    if (!_.isEmpty(create.selectedNode)) {
                        create.highlightedNode = JSON.parse(JSON.stringify(create.selectedNode));
                    }

                    create.receivedAllConcepts = false;
                    getConnectedNodes(create.highlightedNode);
                    $timeout(function () {
                        render(inner, g);
                    });

                    create.joinOptions = [
                        {display: 'Inner Join', value: 'inner', show: true},
                        {display: 'Partial Outer', value: 'partial', show: true},
                        {display: 'Full Outer', value: 'outer', show: true}
                    ];
                } else if (view === 'engine-metamodel') {
                    create.joinOptions = [
                        {display: 'Inner Join', value: 'inner', show: true},
                        {display: 'Partial Outer', value: 'partial', show: true},
                        {display: 'Full Outer', value: 'outer', show: false}
                    ];
                }

                if (view === 'dagre' || view === 'table') {
                    //create the combined pkql in db metamodel if any and then run them
                    joinQueuedNodes();
                }
            }

            /**
             * @name joinQueuedNodes
             * @desc this will loop through any queued up nodes we have selected in db metamodel and run them
             */
            function joinQueuedNodes() {
                create.dbMetamodel.orderedNodeList = [];
                create.dbMetamodel.orderedPropList = [];
                if (create.pkqlComponents.length > 0) {
                    var pkqlObjList = createPKQLObject(create.pkqlComponents, true), pkqlQuery = "", config = {};
                    generateAndRunQuery(pkqlObjList);

                    dataService.setWidgetEngine(create.selectedNode.db[0]);
                }
            }

            /**
             * @name createPKQLObject
             * @param pkqlComponents {Object} all of the selections we've done on the db metamodel
             * @param clearComponents {Boolean}
             * @desc this will create a list of pkqlObjects which we will use to create pkql queries. we will be setting a new query every 7 concepts (properties dont count)
             * @return {Array} of pkqlObjects which equates to number of pkql queries we'll be chaining
             */
            function createPKQLObject(pkqlComponents, clearComponents) {
                var pkqlObjList = [], pkqlObject = {}, counter = 0, tempComponents = JSON.parse(JSON.stringify(pkqlComponents));

                pkqlObject = {
                    engineName: create.selectedNode.db[0].name,
                    selectors: [],
                    //filters: {},
                    joinType: [],
                    triples: [],
                    existingConcept: [],
                    joinConcept: [],
                    queryJoins: []
                };

                //add the table join to join to existing table
                if (create.insightHasNodes) {
                    if (tempComponents.length === 0) {
                        var component = {};
                        component[create.selectedNode.name] = {
                            engineName: create.selectedNode.db[0].name,
                            node: create.selectedNode,
                            properties: [],
                            relTriples: create.newTripleObj.relTriples[0],
                            existingConcept: create.highlightedNode.name,
                            joinConcept: create.selectedNode.equivalent ? create.selectedNode.equivalent : undefined,
                            queryJoin: ""
                        };

                        tempComponents.push(component);
                    }

                    pkqlObject.existingConcept.push(tempComponents[0][_.keys(tempComponents[0])[0]].existingConcept);
                    pkqlObject.selectors.push(tempComponents[0][_.keys(tempComponents[0])[0]].existingConcept);
                    pkqlObject.joinType.push("inner");
                    pkqlObject.joinConcept.push(tempComponents[0][_.keys(tempComponents[0])[0]].joinConcept);
                }

                for (var i = 0; i < tempComponents.length; i++) {
                    if (counter === 7 && clearComponents) { //limits to 7 joins maximum in the query
                        pkqlObjList.push(JSON.parse(JSON.stringify(pkqlObject)));
                        pkqlObject = {
                            engineName: "",
                            selectors: [],
                            //filters: {},
                            joinType: [],
                            triples: [],
                            existingConcept: [],
                            joinConcept: [],
                            queryJoins: []
                        };

                        //setting up table join for next pkql query
                        pkqlObject.existingConcept.push(tempComponents[i][_.keys(tempComponents[i])[0]].existingConcept);
                        pkqlObject.selectors.push(pkqlObject.existingConcept[0]);
                        pkqlObject.joinType.push("inner");
                        pkqlObject.joinConcept.push(tempComponents[i][_.keys(tempComponents[i])[0]].joinConcept);

                        counter = 0;
                    }

                    var key = _.keys(tempComponents[i])[0];
                    pkqlObject.engineName = tempComponents[i][key].engineName;
                    if (_.indexOf(pkqlObject.selectors, tempComponents[i][key].node.conceptualName) === -1) { //make unique so dont add if it's already in selectors
                        pkqlObject.selectors.push(tempComponents[i][key].node.conceptualName);
                    }

                    for (var j = 0; j < tempComponents[i][key].properties.length; j++) {
                        pkqlObject.selectors.push(tempComponents[i][key].properties[j]);
                        //no joins for properties
                        //pkqlObject.triples.push([tempComponents[i][key].node.conceptualName, "hasProperty", tempComponents[i][key].properties[j]]);
                    }
                    //pkqlObject.filters = {}; //filters always empty for create db metamodel
                    if (tempComponents[i][key].relTriples.length > 0) {
                        pkqlObject.triples.push(tempComponents[i][key].relTriples);
                    }

                    //add all the filters..
                    if (tempComponents[i][key].filters && Object.keys(tempComponents[i][key].filters).length !== 0) {
                        for (var filter in tempComponents[i][key].filters) {
                            if (!pkqlObject.filters) {
                                pkqlObject.filters = {};
                                pkqlObject.filterSigns = {};
                            }

                            pkqlObject.filters[filter] = tempComponents[i][key].filters[filter];
                            pkqlObject.filterSigns[filter] = tempComponents[i][key].filterSigns[filter];
                        }
                    }

                    pkqlObject.queryJoins.push(tempComponents[i][key].queryJoin);

                    counter++;
                }

                pkqlObjList.push(JSON.parse(JSON.stringify(pkqlObject)));

                if (clearComponents) {
                    create.pkqlComponents = [];
                }
                return pkqlObjList;
            }

            /**
             * @name resetInstanceList
             * @desc reset the parameters in instanceList
             */
            function resetInstanceList() {
                create.instanceListOffset = 0;

                create.instanceList = {
                    concept: "",
                    equals: false, //filter or unfilter the selected values
                    list: [],
                    selected: [],
                    tempSelected: [],
                    selectAll: true,
                    hideSelectAll: false,
                    searchTerm: "",
                    size: 0,
                    maxSize: 0
                };
            }

            /**
             * @name initializeVars
             * @desc initializes the variables we use in create
             */
            function initializeVars() {
                create.visibleContent = 'engine-metamodel';
                create.dataFrameType = 'grid';
                create.showDatabase = true;

                if (create.widgetData.data.preSelectedDb) {
                    create.dbTitle = create.widgetData.data.preSelectedDb;
                } else {
                    create.dbTitle = "All_DBs"; //initially select all
                }
                create.nodes = {};
                create.stepMapping = [];
                create.addedNodes = {};
                create.addedEdges = [];
                create.instanceListOffset = 0;
                create.showConcept = true;
                create.addNode = false;
                create.showInstances = false;
                create.instanceList = {
                    concept: "",
                    equals: false, //filter or unfilter the selected values
                    list: [],
                    selected: [],
                    selectAll: true,
                    tempSelected: [],
                    hideSelectAll: false,
                    searchTerm: "",
                    size: 0,
                    maxSize: 0
                };
            }

            /**
             * @name getAndBuildMetamodel
             * @desc get the metamodel data from BE and then create the metamodel view
             */
            function getAndBuildMetamodel() {
                createPanelService.getInsightMetamodel(create.widgetData.insightId)
                    .then(function (data) {

                        if (!_.isEmpty(data.data.nodes) || !_.isEmpty(data.data.edges)) {
                            toggleView('dagre');
                            create.showConcept = true;
                            create.showInstances = false;
                            create.insightHasNodes = true;
                            var edgeList = [];
                            for (var edge in data.data.triples) {
                                edgeList.push({
                                    source: data.data.triples[edge].fromNode,
                                    target: data.data.triples[edge].toNode,
                                    relation: data.data.triples[edge].relationshipTriple
                                });
                            }

                            var nodeQueries = [];
                            for (var node in data.data.nodes) {
                                var nodeObj = {};
                                if (data.data.nodes[node].prop) {
                                    nodeObj = {
                                        parentName: "",
                                        db: [],
                                        equivalent: "",
                                        name: "",
                                        conceptualName: ""
                                    };

                                    nodeObj.parentName = data.data.nodes[node].prop;
                                    nodeObj.name = node;
                                    nodeObj.conceptualName = node;
                                } else {
                                    nodeObj = {db: [], name: "", uri: "", properties: [], conceptualName: ""};
                                    nodeObj.name = node;
                                    //nodeObj.uri = data.data.nodes[node].uri;
                                }

                                for (var engine in data.data.nodes[node].engineToPhysical) {
                                    nodeObj.db.push({name: engine});
                                    nodeObj.conceptualName = data.data.nodes[node].engineToPhysical[engine];
                                }

                                nodeQueries.push(getProperties(nodeObj));
                            }

                            $q.all(nodeQueries).then(function (nodeArray) {
                                for (var i in nodeArray) {
                                    for (var prop in nodeArray[i].properties) {
                                        if (data.data.nodes[nodeArray[i].properties[prop].name] && data.data.nodes[nodeArray[i].properties[prop].name].engineName[0] === nodeArray[i].properties[prop].db[0].name) { //check db here too
                                            nodeArray[i].properties[prop].selected = true;
                                            //below we might need to do a db check as well....what if two properties are named the same?
                                            nodeArray[_.findIndex(nodeArray, {'name': nodeArray[i].properties[prop].name})] = nodeArray[i].properties[prop];
                                            if (create.addedNodes[nodeArray[i].properties[prop].name]) //if it's been added to addedNodes then we reset it
                                                create.addedNodes[nodeArray[i].properties[prop].name] = nodeArray[i].properties[prop];
                                        }
                                    }
                                    create.addedNodes[nodeArray[i].name] = nodeArray[i];
                                }

                                create.selectedNode = !_.isEmpty(create.addedNodes) ? JSON.parse(JSON.stringify(create.addedNodes[_.keys(create.addedNodes)[0]])) : {}; //set it here cuz we need it in addPropNode..
                                create.highlightedNode = create.selectedNode;
                                create.receivedAllConcepts = false;
                                if (create.widgetData.stepMapping) {
                                    create.stepMapping = create.widgetData.stepMapping;
                                }
                                if (create.selectedNode.db && create.selectedNode.db[0].name !== "LocalMasterDatabase") {
                                    create.dbTitle = create.selectedNode.db[0].name;
                                }

                                for (var i in create.addedNodes) {
                                    if (create.addedNodes[i].parentName) {
                                        addPropNode(create.addedNodes[i]);
                                    } else {
                                        addDagreNode(create.addedNodes[i]);
                                    }

                                    //getProperties(create.addedNodes[i]);
                                }

                                addEdges();
                                if (create.highlightedNode && !_.isEmpty(create.highlightedNode)) {
                                    getConnectedNodes(create.highlightedNode);
                                } else {
                                    //no nodes...so bring back all concepts
                                    setAllDBConcepts();
                                }
                                toggleView('dagre');
                                create.showDatabase = false;
                            });

                            create.addedEdges = edgeList;
                        }
                        else {
                            //Initialize as new
                            setAllDBConcepts();
                        }
                    });
            }


            /*** External Functions ***/
            /**Create Free Text **/
            /**
             * @name fileAdded
             * @desc shows free text when the file is added
             */
            function fileAdded() {
                joinQueuedNodes();

                create.importType = 'fileDrop';
                create.showRawData = true;
            }

            /**
             * @name hideFreeText
             * @desc passed into create-free-text and is used to hide the modal when done
             */
            function hideFreeText() {
                create.showFreeText = false;
                if (create.fileData) {
                    create.fileData.files = [];
                }
            }

            /**
             * @name hideFreeText
             * @desc passed into create-free-text and is used to hide the modal when done
             */
            function hideRawData() {
                create.showRawData = false;
                if (create.fileData) {
                    create.fileData.files = [];
                }
            }

            /*** Table Functions ***/
            /**
             * @desc this is used to lazy load 500 more rows of table for the preview table, connected to the load more button
             */
            function addMoreTableData() {
                dataService.loadData();
            }

            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
                create.widgetData = dataService.getWidgetData();

                if (create.widgetData.data && create.widgetData.data.chartData && create.widgetData.data.chartData.data && create.widgetData.rowOffset.end <= create.widgetData.data.chartData.data.length) {
                    create.loadMore = true;
                }
                else {
                    create.loadMore = false;
                }


                initializeVars();
                $timeout(function () {
                    initializeDagre();
                });


                if (create.widgetData.data.chartData.layout === "Graph") {
                    console.log('add in graph');
                }

                if (!_.isEmpty(create.widgetData.data.insightData) && create.widgetData.insightId) {
                    //always checking first/original data for insightData
                    //we need to setup create if coming from an insight
                    $timeout(function () { //TODO need to remove this timeout...recreate issue by going to text and then coming back to metamodel and svg/g is not initialized...due to the timeout for initliazeDagre()
                        getAndBuildMetamodel();
                    });
                }
            }

            function setAllDBConcepts() {
                create.showLoading = true;
                permissionsService.getAllEngines()
                    .then(function (data) {
                        create.engines.selected = {name: create.dbTitle};
                        create.engines.list = data;
                        monolithService.getAllDBConcepts()
                            .then(function (data2) {
                                var securitySettings = permissionsService.getSecuritySettings(),
                                    authorizedEngines = securitySettings.availableEngines;
                                if (!create.nodes["All_DBs"]) { //initialize the All_DBs object to start holding all the nodes
                                    create.nodes["All_DBs"] = [];
                                }

                                for (var db in data2) {
                                    if (_.findIndex(authorizedEngines, ['name', db]) === -1) {
                                        continue; //user doesnt have access to dbs outside of the engines returned from getAllEngines so we will not add those even though its returned from those calls.
                                    }

                                    if (!create.nodes[db]) {
                                        create.nodes[db] = [];
                                    }

                                    for (var nodeIdx = 0; nodeIdx < data2[db].length; nodeIdx++) {
                                        create.nodes[db].push({
                                            properties: [],
                                            db: [{name: db}],
                                            name: data2[db][nodeIdx],
                                            conceptualName: data2[db][nodeIdx],
                                            parentName: ""
                                        });
                                    }

                                    create.nodes.All_DBs = _.concat(create.nodes.All_DBs, create.nodes[db]);
                                }
                                create.nodes.All_DBs = _.sortBy(create.nodes.All_DBs, 'conceptualName');
                                create.showLoading = false;
                                createPanelService.setAllMetamodel(create.nodes);
                            });
                    });
            }

            function updateMetamodel() {
                var currentWidget = dataService.getWidgetData(),
                    currentInsight = dataService.getInsightData();
                //TODO get the whole metamodel and then add the new nodes/edges; ideally the backend would send us the new nodes and edges to paint/add to dagre
                monolithService.getInsightMetamodel(currentInsight.insightId)
                    .then(function (data) {
                        var propCalls = [], allNodes = [];
                        for (var node in data.data.nodes) {
                            if (!create.addedNodes[node]) {
                                var addedNode = {
                                    name: node,
                                    properties: [],
                                    db: [{name: data.data.nodes[node].engineName[0]}],
                                    conceptualNames: data.data.nodes[node].engineToPhysical,
                                    conceptualName: data.data.nodes[node].engineToPhysical[data.data.nodes[node].engineName[0]]
                                };

                                allNodes.push(addedNode);
                                propCalls.push(createPanelService.getConceptProperties(addedNode));
                            }
                        }

                        $q.all(propCalls).then(function (props) {
                            var newNode = {}, combinedProps;
                            for (var i = 0; i < props.length; i++) {
                                combinedProps = [];
                                newNode = allNodes[i];
                                for (var prop in props[i]) {
                                    combinedProps.push(props[i][prop]);
                                }

                                newNode.properties = combinedProps;
                                newNode.selectedPropertiesSheet = 0;
                                if (data.data.nodes[newNode.name].prop) {//add as a prop node.
                                    newNode.conceptualName = data.data.nodes[newNode.name].prop + "__" + newNode.name;
                                    newNode.parentName = data.data.nodes[newNode.name].prop;
                                    create.addedNodes[newNode.name] = newNode;
                                    addPropNode(newNode);
                                } else {
                                    create.addedNodes[newNode.name] = newNode;
                                    addDagreNode(newNode);
                                }
                            }

                            //TODO not an optimal way of checking if an edge already exists
                            var currentAddedEdges = JSON.parse(JSON.stringify(create.addedEdges)), addEdge = true;
                            for (var edge in data.data.triples) {
                                addEdge = true;
                                if (create.addedEdges.length > 0) {
                                    //make sure this edge don't already exists
                                    for (var addedEdge in currentAddedEdges) {
                                        if ((data.data.triples[edge].fromNode === currentAddedEdges[addedEdge].source && data.data.triples[edge].toNode === currentAddedEdges[addedEdge].target)
                                            || data.data.triples[edge].fromNode === currentAddedEdges[addedEdge].target && data.data.triples[edge].toNode === currentAddedEdges[addedEdge].source) {
                                            addEdge = false;
                                        }
                                    }

                                    if (addEdge) {
                                        create.addedEdges.push({
                                            source: data.data.triples[edge].fromNode,
                                            relation: data.data.triples[edge].relationshipTriple,
                                            target: data.data.triples[edge].toNode
                                        });
                                    }
                                } else {
                                    create.addedEdges.push({
                                        source: data.data.triples[edge].fromNode,
                                        relation: data.data.triples[edge].relationshipTriple,
                                        target: data.data.triples[edge].toNode
                                    });
                                }
                            }

                            if (!create.highlightedNode) {
                                if (!_.isEmpty(create.addedNodes) && !_.isEmpty(allNodes)) {
                                    create.highlightedNode = create.addedNodes[allNodes[0].name];
                                    create.selectedNode = create.addedNodes[allNodes[0].name];
                                    getConnectedNodes(create.highlightedNode);
                                }
                            }
                            if (create.widgetData.data.chartData.headers && create.widgetData.data.chartData.headers.length > 0) {
                                create.insightHasNodes = true;
                            } else {
                                create.insightHasNodes = false;
                            }
                            create.dbMetamodel.addNode();
                            addEdges();
                        });
                    });
            }

            initialize();
        }

        function createPanelLink(scope, ele, attrs, ctrl) {
            //listeners
            var createPanelUpdateListener = $rootScope.$on('update-data', function (event) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'update-data');
                scope.create.widgetData = dataService.getWidgetData();


                if (scope.create.widgetData.data && scope.create.widgetData.data.chartData && scope.create.widgetData.data.chartData.data && scope.create.widgetData.rowOffset.end <= scope.create.widgetData.data.chartData.data.length) {
                    scope.create.loadMore = true;
                }
                else {
                    scope.create.loadMore = false;
                }

                if (scope.create.widgetData.data.chartData.headers && scope.create.widgetData.data.chartData.headers.length > 0) {
                    scope.create.insightHasNodes = true;
                } else {
                    scope.create.insightHasNodes = false;
                }
                scope.create.updateMetamodel();
            });

            var createPanelListener = $rootScope.$on('create-panel-receive', function (event, message, data) {
                if (message === 'join-queued-nodes') {
                    scope.create.joinQueuedNodes();
                }
            });


            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying createPanel....');
                scope.create.joinQueuedNodes();
                createPanelListener();
                createPanelUpdateListener();
            });
        }
    }
})();