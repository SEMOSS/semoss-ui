'use strict';

import './traverse.scss';

export default angular
    .module('app.traverse.directive', [])
    .directive('traverse', traverse);

traverse.$inject = ['ENDPOINT', 'semossCoreService'];

function traverse(ENDPOINT, semossCoreService) {
    traverseCtrl.$inject = [];
    traverseLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        template: require('./traverse.directive.html'),
        scope: {},
        bindToController: {},
        controllerAs: 'traverse',
        controller: traverseCtrl,
        link: traverseLink,
    };

    function traverseCtrl() {}

    function traverseLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        scope.traverse.connectedConcepts = [];
        scope.traverse.frameHeaders = [];
        scope.traverse.selectedHeader = {};
        scope.traverse.prevSelectedHeader = {}; // used to see if selected header has changed
        scope.traverse.queuedComponents = [];
        scope.traverse.joinType = {
            list: [
                {
                    display: 'Inner',
                    value: 'inner',
                },
                {
                    display: 'Partial Left',
                    value: 'partial_left',
                },
                {
                    display: 'Partial Right',
                    value: 'partial_right',
                },
                {
                    display: 'Outer',
                    value: 'outer',
                },
            ],
            selected: 'inner',
        };
        scope.traverse.selectedConceptInstances = {
            list: [],
            selected: [],
        };
        scope.traverse.engineNodes = {
            options: {
                nodes: [],
                edges: [],
            },
            selected: {},
        };
        scope.traverse.instances = {
            list: [],
            selected: [],
            clicked: [],
            taskId: '',
            loading: false,
            numCollected: 0,
            count: 0,
            searchTerm: '',
            pixelComponents: [],
            equals: false,
        };
        scope.traverse.showLimit = false;

        scope.traverse.instanceLimit;
        scope.traverse.database = {
            list: [],
            selected: '',
            show: false,
        };
        scope.traverse.loading = false;
        scope.traverse.loadingMessageList = ['Getting Results...'];
        scope.traverse.newAlignment = {
            start: '',
            end: '',
        };

        scope.traverse.selectDB = selectDB;
        scope.traverse.getConnectedConcepts = getConnectedConcepts;
        scope.traverse.getConceptInstances = getConceptInstances;
        scope.traverse.getSelectedConceptInstances =
            getSelectedConceptInstances;
        scope.traverse.getPropertyInstances = getPropertyInstances;
        scope.traverse.getMoreInstances = getMoreInstances;
        scope.traverse.searchInstances = searchInstances;
        scope.traverse.queueComponent = queueComponent;
        scope.traverse.executeMerge = executeMerge;
        scope.traverse.cancel = cancel;
        scope.traverse.selectedInstance = selectedInstance;

        /**
         * @name selectDB
         * @desc changes the db being used to traverse
         * @return {void}
         */
        function selectDB() {
            var callback;

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    nodeIdx,
                    selectedConceptualName,
                    foundMatchingColumn = false;

                scope.traverse.engineNodes.options = {
                    nodes: output.nodes,
                    edges: output.edges,
                };

                if (
                    scope.traverse.selectedHeader &&
                    Object.keys(scope.traverse.selectedHeader).length !== 0
                ) {
                    selectedConceptualName =
                        scope.traverse.selectedHeader.qsName[
                            Object.keys(scope.traverse.selectedHeader.qsName)[0]
                        ][0];
                    // loop through and see which node to set to selected
                    for (
                        nodeIdx = 0;
                        nodeIdx < output.nodes.length;
                        nodeIdx++
                    ) {
                        if (
                            selectedConceptualName ===
                            output.nodes[nodeIdx].conceptualName
                        ) {
                            scope.traverse.engineNodes.selected =
                                output.nodes[nodeIdx];
                            foundMatchingColumn = true;
                            break;
                        }
                    }

                    // set it to nothing if that concept doesnt exist in the selected db
                    if (!foundMatchingColumn) {
                        scope.traverse.engineNodes.selected = {
                            conceptualName: '...',
                        };
                    }
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'getDatabaseMetamodel',
                        components: [scope.traverse.database.selected, []],
                        terminal: true,
                        meta: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name getFrameHeaders
         * @desc executes pixel that gets all the headers in the frame
         * @returns {void}
         */
        function getFrameHeaders() {
            scope.traverse.frameHeaders =
                scope.widgetCtrl.getFrame('headers') || [];
            if (!scope.traverse.database.selected) {
                // no selections so default to these
                scope.traverse.selectedHeader =
                    scope.traverse.forcegraphHeader ||
                    scope.traverse.frameHeaders[0];
                scope.traverse.prevSelectedHeader =
                    scope.traverse.forcegraphHeader ||
                    scope.traverse.frameHeaders[0];
                scope.traverse.database.selected = Object.keys(
                    scope.traverse.frameHeaders[0].qsName
                )[0];
            }
        }

        /**
         * @name getconnectedConcepts
         * @param {Object} concept the concept we want to explore
         * @desc builds and executes pixel to see what other concepts are related to the one selected
         * @return {void}
         */
        function getConnectedConcepts(concept) {
            var conceptualNames = [],
                engineName,
                conceptIdx,
                callback;

            if (concept.qsName) {
                for (engineName in concept.qsName) {
                    if (concept.qsName.hasOwnProperty(engineName)) {
                        for (
                            conceptIdx = 0;
                            conceptIdx < concept.qsName[engineName].length;
                            conceptIdx++
                        ) {
                            conceptualNames.push(
                                concept.qsName[engineName][conceptIdx]
                            );
                        }
                    }
                }
            } else if (
                concept.conceptualName &&
                concept.conceptualName !== '...'
            ) {
                conceptualNames = [concept.conceptualName];
            }

            scope.traverse.showInstances = false;
            scope.traverse.loadingMessageList = [
                'Getting traversal options...',
            ];
            // register message to come back to
            callback = function (data) {
                var listIdx,
                    listLen,
                    type = data.pixelReturn[0].operationType,
                    i,
                    appId,
                    conceptType,
                    selectedConcept,
                    connectedDimension,
                    keepSelected = false;

                if (type.indexOf('Error') > -1) {
                    return;
                }

                scope.traverse.connectedConcepts = {};
                scope.traverse.connectedProperties = {};

                for (i = 0; i < data.pixelReturn[0].output.length; i++) {
                    appId = data.pixelReturn[0].output[i].database_id;
                    conceptType = data.pixelReturn[0].output[i].type;

                    if (conceptType === 'property') {
                        if (data.pixelReturn[0].output[i].pk) {
                            connectedDimension = {
                                display: data.pixelReturn[0].output[i].column,
                                value: data.pixelReturn[0].output[i].column,
                            };
                        } else {
                            connectedDimension = {
                                display: data.pixelReturn[0].output[i].column,
                                value:
                                    data.pixelReturn[0].output[i].table +
                                    '__' +
                                    data.pixelReturn[0].output[i].column,
                            };
                        }

                        if (data.pixelReturn[0].output[i].equivPk) {
                            selectedConcept =
                                data.pixelReturn[0].output[i].equivColumn;
                        } else {
                            selectedConcept =
                                data.pixelReturn[0].output[i].equivTable +
                                '__' +
                                data.pixelReturn[0].output[i].equivColumn;
                        }

                        if (
                            !scope.traverse.connectedProperties.hasOwnProperty(
                                appId
                            )
                        ) {
                            scope.traverse.connectedProperties[appId] = {};
                        }

                        if (
                            !scope.traverse.connectedProperties[
                                appId
                            ].hasOwnProperty(selectedConcept)
                        ) {
                            scope.traverse.connectedProperties[appId][
                                selectedConcept
                            ] = [];
                        }

                        if (
                            scope.traverse.connectedProperties[appId][
                                selectedConcept
                            ].indexOf(connectedDimension) === -1
                        ) {
                            scope.traverse.connectedProperties[appId][
                                selectedConcept
                            ].push(connectedDimension);
                        }
                    } else if (
                        conceptType === 'upstream' ||
                        conceptType === 'downstream'
                    ) {
                        selectedConcept =
                            data.pixelReturn[0].output[i].equivTable;
                        connectedDimension =
                            data.pixelReturn[0].output[i].table;

                        if (
                            !scope.traverse.connectedConcepts.hasOwnProperty(
                                appId
                            )
                        ) {
                            scope.traverse.connectedConcepts[appId] = {};
                        }

                        if (
                            !scope.traverse.connectedConcepts[
                                appId
                            ].hasOwnProperty(selectedConcept)
                        ) {
                            scope.traverse.connectedConcepts[appId][
                                selectedConcept
                            ] = [];
                        }

                        scope.traverse.connectedConcepts[appId][
                            selectedConcept
                        ].push({
                            name: connectedDimension,
                            direction: conceptType,
                        });
                    }
                }

                for (
                    listIdx = 0, listLen = scope.traverse.database.list.length;
                    listIdx < listLen;
                    listIdx++
                ) {
                    if (
                        scope.traverse.database.selected ===
                        scope.traverse.database.list[listIdx].value
                    ) {
                        keepSelected = true;
                        break;
                    }
                }

                if (!keepSelected && scope.traverse.database.list.length > 0) {
                    scope.traverse.database.selected =
                        scope.traverse.database.list[0].value;
                }

                scope.traverse.loading = false;
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'getDatabaseConnections',
                        components: [conceptualNames],
                        meta: true,
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name getConceptInstances
         * @param {*} direction the direction of the traversal
         * @param {*} equivalentConcept the name to use to join the table
         * @param {*} conceptName the name of the selected concept to traverse to
         * @param {boolean} queue boolean to indicate whether to queue the component without going through filtering
         * @returns {void}
         */
        function getConceptInstances(
            direction,
            equivalentConcept,
            conceptName,
            queue
        ) {
            var pixelComponents = [],
                countComponents = [],
                joinComponent = [],
                filterObj = {},
                countCallback,
                pixelCallback;

            if (direction === 'downstream') {
                joinComponent = [
                    {
                        fromColumn: equivalentConcept,
                        joinType: 'inner',
                        toColumn: conceptName,
                    },
                ];
            } else {
                joinComponent = [
                    {
                        fromColumn: conceptName,
                        joinType: 'inner',
                        toColumn: equivalentConcept,
                    },
                ];
            }

            scope.traverse.currentComponent = {
                frameConcept: scope.traverse.selectedHeader.alias,
                equivalentConcept: equivalentConcept,
                conceptName: conceptName,
                display: conceptName,
                filters: filterObj,
                join: JSON.parse(JSON.stringify(joinComponent)),
                type: 'concept',
            };

            if (queue) {
                queueComponent();
            }

            // if (!scope.traverse.selectedConceptInstances.legendSelected) {
            // add the filter for the selected concept
            filterObj[equivalentConcept] = {
                comparator: '==',
                value: scope.traverse.selectedConceptInstances.selected,
            };
            // }

            pixelComponents = [
                {
                    type: 'database',
                    components: [scope.traverse.database.selected],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                alias: conceptName,
                            },
                        ],
                    ],
                },
                {
                    type: 'filter',
                    components: [filterObj],
                },
                {
                    type: 'join',
                    components: [joinComponent],
                },
                {
                    type: 'sort',
                    components: [[conceptName]],
                },
                {
                    type: 'collect',
                    components: [500],
                    terminal: true,
                },
            ];

            countComponents = [
                {
                    type: 'database',
                    components: [scope.traverse.database.selected],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                selector: 'UniqueCount(' + conceptName + ')',
                                alias: 'Unique_Count_of_' + conceptName,
                            },
                        ],
                    ],
                },
                {
                    type: 'filter',
                    components: [filterObj],
                },
                {
                    type: 'join',
                    components: [joinComponent],
                },
                {
                    type: 'collect',
                    components: [500],
                    terminal: true,
                },
            ];

            scope.traverse.showInstances = true;
            // register message to come back to

            countCallback = function (returnData) {
                var output;

                if (returnData.pixelReturn[0].output.data) {
                    output = returnData.pixelReturn[0].output;
                } else if (returnData.pixelReturn[1].output.data) {
                    output = returnData.pixelReturn[1].output;
                }

                scope.traverse.instances.count = output.data.values[0][0];
                scope.traverse.instanceLimit = output.data.values[0][0];

                if (scope.traverse.instances.count >= 500) {
                    scope.traverse.showLimit = true;
                    scope.traverse.instanceLimit = 500;
                }
            };

            scope.widgetCtrl.meta(countComponents, countCallback);

            // register message to come back to
            pixelCallback = function (returnData) {
                var output;

                if (returnData.pixelReturn[0].output.data) {
                    output = returnData.pixelReturn[0].output;
                } else if (returnData.pixelReturn[1].output.data) {
                    output = returnData.pixelReturn[1].output;
                }

                scope.traverse.instances.list = [];
                scope.traverse.instances.selected = [];
                for (
                    let valueIdx = 0, valueLen = output.data.values.length;
                    valueIdx < valueLen;
                    valueIdx++
                ) {
                    const value = output.data.values[valueIdx][0];

                    scope.traverse.instances.list.push(value);
                    // auto select them by default
                    scope.traverse.instances.selected.push(value);
                }

                // auto select them by default
                scope.traverse.instances.taskId = output.taskId;
                scope.traverse.instances.numCollected += output.numCollected;
                scope.traverse.instances.searchTerm = '';
                // keep this so we can reuse and easily modify for when we need to do search
                scope.traverse.instances.pixelComponents = pixelComponents;
                scope.traverse.instances.concept = conceptName;
            };

            scope.widgetCtrl.meta(pixelComponents, pixelCallback);
        }

        /**
         * @name getMoreInstances
         * @desc get more instances of the current task we're working with
         * @returns {void}
         */
        function getMoreInstances() {
            var pixelComponents = [
                    {
                        type: 'task',
                        components: [scope.traverse.instances.taskId],
                        meta: true,
                    },
                    {
                        type: 'collect',
                        components: [500],
                        terminal: true,
                    },
                ],
                callback;

            // have we reached the end? if not, get more
            if (
                scope.traverse.instances.numCollected ===
                scope.traverse.instances.list.length
            ) {
                scope.traverse.instances.loading = true;
                // register message to come back to
                callback = function (returnData) {
                    var output = returnData.pixelReturn[0].output,
                        clickedIdx,
                        matchIndex;
                    if (!scope.traverse.instances.equals) {
                        // if select all then we will move these values over to selected
                        // add more
                        for (
                            let valueIdx = 0,
                                valueLen = output.data.values.length;
                            valueIdx < valueLen;
                            valueIdx++
                        ) {
                            const value = output.data.values[valueIdx][0];

                            scope.traverse.instances.selected.push(value);
                        }

                        // TODO check clicked values and make sure they're not in selected
                        for (
                            clickedIdx = 0;
                            clickedIdx <
                            scope.traverse.instances.clicked.length;
                            clickedIdx++
                        ) {
                            matchIndex =
                                scope.traverse.instances.selected.indexOf(
                                    scope.traverse.instances.clicked[clickedIdx]
                                );
                            if (matchIndex > -1) {
                                scope.traverse.instances.selected.splice(
                                    matchIndex,
                                    1
                                );
                            }
                        }
                    } else {
                        // check clicked values and make sure they are in the selected
                        for (
                            clickedIdx = 0;
                            clickedIdx <
                            scope.traverse.instances.clicked.length;
                            clickedIdx++
                        ) {
                            if (
                                scope.traverse.instances.selected.indexOf(
                                    scope.traverse.instances.clicked[clickedIdx]
                                ) === -1
                            ) {
                                scope.traverse.instances.selected.push(
                                    scope.traverse.instances.clicked[clickedIdx]
                                );
                            }
                        }
                    }

                    for (
                        let valueIdx = 0, valueLen = output.data.values.length;
                        valueIdx < valueLen;
                        valueIdx++
                    ) {
                        const value = output.data.values[valueIdx][0];

                        scope.traverse.instances.list.push(value);
                    }

                    scope.traverse.instances.taskId = output.taskId;
                    scope.traverse.instances.loading = false;

                    if (output.data.length === 0) {
                        // if no data comes back, we will increment numCollected so that it becomes higher than list. takes care of edge case where the length and numCollected is exactly the same.
                        scope.traverse.instances.numCollected += 1;
                    }

                    scope.traverse.instances.numCollected +=
                        output.numCollected;
                };

                scope.widgetCtrl.meta(pixelComponents, callback);
            }
        }

        /**
         * @name searchInstances
         * @param {object} searchTerm the search term used
         * @desc search instances by the search term
         * @returns {void}
         */
        function searchInstances(searchTerm) {
            var pixelComponents,
                componentIdx,
                searchFilter = {},
                searchFilterComponent = {
                    type: 'filter',
                    components: [searchFilter],
                },
                callback;

            // have to reset some values and keep some
            scope.traverse.instances.loading = true;
            scope.traverse.instances.taskId = '';
            scope.traverse.instances.numCollected = 0;
            scope.traverse.instances.searchTerm = searchTerm;
            pixelComponents = JSON.parse(
                JSON.stringify(scope.traverse.instances.pixelComponents)
            );

            // set up the filter component
            searchFilter[scope.traverse.instances.concept] = {
                comparator: '?like',
                value: [scope.traverse.instances.searchTerm],
            };

            // insert the ?like filter into the first filter position and break out
            for (
                componentIdx = 0;
                componentIdx < pixelComponents.length;
                componentIdx++
            ) {
                if (pixelComponents[componentIdx].type === 'select2') {
                    pixelComponents.splice(
                        componentIdx + 1,
                        0,
                        searchFilterComponent
                    );
                    break;
                }
            }

            // register message to come back to
            callback = function (returnData) {
                var output, matchIndex, clickedIdx;
                if (returnData.pixelReturn[0].output.data) {
                    output = returnData.pixelReturn[0].output;
                } else if (returnData.pixelReturn[1].output.data) {
                    output = returnData.pixelReturn[1].output;
                }

                if (!scope.traverse.instances.equals) {
                    scope.traverse.instances.selected = [];
                    for (
                        let valueIdx = 0, valueLen = output.data.values.length;
                        valueIdx < valueLen;
                        valueIdx++
                    ) {
                        const value = output.data.values[valueIdx][0];

                        // auto select them by default
                        scope.traverse.instances.selected.push(value);
                    }

                    // check clicked values and remove them from selected
                    for (
                        clickedIdx = 0;
                        clickedIdx < scope.traverse.instances.clicked.length;
                        clickedIdx++
                    ) {
                        matchIndex = scope.traverse.instances.selected.indexOf(
                            scope.traverse.instances.clicked[clickedIdx]
                        );
                        if (matchIndex > -1) {
                            scope.traverse.instances.selected.splice(
                                matchIndex,
                                1
                            );
                        }
                    }
                } else {
                    scope.traverse.instances.selected = [];
                    // check clicked values and add them to selected
                    for (
                        clickedIdx = 0;
                        clickedIdx < scope.traverse.instances.clicked.length;
                        clickedIdx++
                    ) {
                        if (
                            scope.traverse.instances.selected.indexOf(
                                scope.traverse.instances.clicked[clickedIdx]
                            ) === -1
                        ) {
                            scope.traverse.instances.selected.push(
                                scope.traverse.instances.clicked[clickedIdx]
                            );
                        }
                    }
                }

                scope.traverse.instances.list = [];
                for (
                    let valueIdx = 0, valueLen = output.data.values.length;
                    valueIdx < valueLen;
                    valueIdx++
                ) {
                    const value = output.data.values[valueIdx][0];

                    scope.traverse.instances.list.push(value);
                }
                scope.traverse.instances.taskId = output.taskId;
                scope.traverse.instances.numCollected += output.numCollected;
                scope.traverse.instances.loading = false;
            };

            scope.widgetCtrl.meta(pixelComponents, callback);
        }

        /**
         * @name selectedInstance
         * @param {*} selected the value selected
         * @desc keep track of the actual selected values
         * @returns {void}
         */
        function selectedInstance(selected) {
            if (selected.type === 'all' || selected.type === 'none') {
                // wipe the list
                scope.traverse.instances.clicked = [];
                // this is how we are tracking whether to do '==' or '!='
                if (selected.type === 'none') {
                    scope.traverse.instances.equals = true;
                } else {
                    scope.traverse.instances.equals = false;
                }
            } else if (
                scope.traverse.instances.clicked.indexOf(selected.value) > -1
            ) {
                // remove it
                scope.traverse.instances.clicked.splice(
                    scope.traverse.instances.clicked.indexOf(selected.value),
                    1
                );
            } else {
                // add it
                scope.traverse.instances.clicked.push(selected.value);
            }
        }

        /**
         * @name getPropertyInstances
         * @param {*} propertyName the name of the selected property
         * @param {*} parentName the name of the parent
         * @returns {void}
         */
        function getPropertyInstances(propertyName, parentName) {
            var pixelComponents,
                filterObj = {},
                countComponents = [],
                countCallback,
                pixelCallback;

            // lets set up the component that would be pushed to the queue
            scope.traverse.currentComponent = {
                frameConcept: scope.traverse.selectedHeader.alias,
                equivalentConcept: parentName,
                conceptName: propertyName.value,
                display: propertyName.display,
                filters: filterObj,
                join: [],
                type: 'property',
            };

            queueComponent();

            if (!scope.traverse.selectedConceptInstances.legendSelected) {
                // add the filter for the selected concept
                filterObj[scope.traverse.currentComponent.equivalentConcept] = {
                    comparator: '==',
                    value: scope.traverse.selectedConceptInstances.selected,
                };
            }

            pixelComponents = [
                {
                    type: 'database',
                    components: [scope.traverse.database.selected],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                alias: scope.traverse.currentComponent
                                    .conceptName,
                            },
                        ],
                    ],
                },
                {
                    type: 'filter',
                    components: [filterObj],
                },
                {
                    type: 'sort',
                    components: [[scope.traverse.currentComponent.conceptName]],
                },
                {
                    type: 'collect',
                    components: [500],
                    terminal: true,
                },
            ];

            countComponents = [
                {
                    type: 'database',
                    components: [scope.traverse.database.selected],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                selector:
                                    'UniqueCount(' +
                                    scope.traverse.currentComponent
                                        .conceptName +
                                    ')',
                                alias:
                                    'Unique_Count_of_' +
                                    scope.traverse.currentComponent.conceptName,
                            },
                        ],
                    ],
                },
                {
                    type: 'filter',
                    components: [filterObj],
                },
                {
                    type: 'collect',
                    components: [500],
                    terminal: true,
                },
            ];

            scope.traverse.showInstances = true;

            countCallback = function (returnData) {
                var output;

                if (returnData.pixelReturn[0].output.data) {
                    output = returnData.pixelReturn[0].output;
                } else if (returnData.pixelReturn[1].output.data) {
                    output = returnData.pixelReturn[1].output;
                }

                scope.traverse.instances.count = output.data.values[0][0];
                scope.traverse.instanceLimit = output.data.values[0][0];
            };

            scope.widgetCtrl.meta(countComponents, countCallback);

            pixelCallback = function (returnData) {
                var output;
                if (returnData.pixelReturn[1]) {
                    output = returnData.pixelReturn[1].output;
                } else {
                    output = returnData.pixelReturn[0].output;
                }

                scope.traverse.instances.list = [];
                scope.traverse.instances.selected = [];
                for (
                    let valueIdx = 0, valueLen = output.data.values.length;
                    valueIdx < valueLen;
                    valueIdx++
                ) {
                    const value = output.data.values[valueIdx][0];

                    scope.traverse.instances.list.push(value);
                    // auto select them by default
                    scope.traverse.instances.selected.push(value);
                }
                scope.traverse.instances.taskId = output.taskId;
                scope.traverse.instances.numCollected += output.numCollected;
                scope.traverse.instances.searchTerm = '';
                // keep this so we can reuse and easily modify for when we need to do search
                scope.traverse.instances.pixelComponents = pixelComponents;
            };

            scope.widgetCtrl.meta(pixelComponents, pixelCallback);
        }

        /**
         * @name queueComponent
         * @desc this will push the current component into the queue where we store all of the queued components before executing
         * @returns {void}
         */
        function queueComponent() {
            var legendSelected = scope.widgetCtrl.getSelected('concept');

            if (
                legendSelected &&
                scope.traverse.currentComponent.filters.hasOwnProperty(
                    scope.traverse.currentComponent.frameConcept
                )
            ) {
                delete scope.traverse.currentComponent.filters[
                    scope.traverse.currentComponent.frameConcept
                ];
            }

            if (scope.traverse.instances.clicked.length > 0) {
                // TODO check and see if it's using the limit slider or instance selection. if using limit slider, it is ALWAYS '=='
                scope.traverse.currentComponent.filters[
                    scope.traverse.currentComponent.conceptName
                ] = {
                    comparator: scope.traverse.instances.equals ? '==' : '!=',
                    value: scope.traverse.instances.clicked,
                };
            }

            scope.traverse.queuedComponents = [
                JSON.parse(JSON.stringify(scope.traverse.currentComponent)),
            ];
            scope.traverse.showInstances = false;
        }

        /**
         * @name executeMerge
         * @desc convert components into pixel components and then execute to merge the data
         * @returns {void}
         */
        function executeMerge() {
            var pixelComponents = [],
                callback;

            if (scope.traverse.queuedComponents.length > 0) {
                pixelComponents = getPixelComponents(
                    scope.traverse.queuedComponents
                );

                callback = function (response) {
                    var type = response.pixelReturn[0].operationType;

                    if (type.indexOf('Error') > -1) {
                        return;
                    }

                    scope.widgetCtrl.alert(
                        'success',
                        'Successfully added new data'
                    );

                    // reset these values
                    scope.traverse.newAlignment = {
                        start: scope.traverse.selectedHeader.alias,
                        end: scope.traverse.queuedComponents[0].display,
                    };

                    scope.traverse.queuedComponents = [];

                    scope.traverse.instances = {
                        list: [],
                        selected: [],
                        clicked: [],
                        count: 0,
                        taskId: '',
                        numCollected: 0,
                        loading: false,
                        searchTerm: '',
                        pixelComponents: [],
                        equals: false,
                    };

                    scope.traverse.instanceLimit;

                    getFrameHeaders();

                    // if it's graph, data has already been returned during the merge.
                    if (scope.widgetCtrl.getFrame('type') !== 'GRAPH') {
                        refreshTask();
                    }
                };

                scope.widgetCtrl.execute(pixelComponents, callback);
            }
        }

        /**
         * @name getSubSelections
         * @param {string} component - alias the concept to get the frame filters for
         * @returns {string} the query that assigns a variable for the instances for this concept in the frame
         */
        function getSubSelections(component) {
            var subselection,
                filterObj = {},
                buildPixelComponents;

            // add the filter for the selected concept
            filterObj[scope.traverse.currentComponent.equivalentConcept] = {
                comparator: '==',
                value: scope.traverse.selectedConceptInstances.selected,
            };

            buildPixelComponents = [
                {
                    type: 'database',
                    components: [scope.traverse.database.selected],
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                selector: component.conceptName,
                                alias: component.display,
                            },
                        ],
                    ],
                },
                {
                    type: 'filter',
                    components: [component.filters],
                    // 'components': [filterObj]
                },
                {
                    type: 'join',
                    components: [scope.traverse.currentComponent.join],
                },
            ];

            if (scope.traverse.showLimit) {
                buildPixelComponents.push({
                    type: 'limit',
                    components: [scope.traverse.instanceLimit || 1],
                });
            }

            buildPixelComponents.push({
                type: 'iterate',
                components: [],
                terminal: true,
            });

            // create the pixel for filtering instances down to what's in the frame for the selected header
            subselection =
                'subselection = ' +
                semossCoreService.pixel.build(buildPixelComponents);

            return subselection;
        }

        /**
         * @name getPixelComponents
         * @param {*} components the queued components
         * @desc converts the queued components into pixel components and return it
         * @returns {object} the pixel components to return
         */
        function getPixelComponents(components) {
            var pixelComponents = [],
                filters = components[0].filters,
                mergeJoins = [],
                joins = [],
                filter,
                layout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                taskOptions = {},
                frameName = scope.widgetCtrl.getShared(
                    'frames.' + scope.widgetCtrl.getWidget('frame') + '.name'
                );

            // create the pixel for filtering instances down to what's in the frame for the selected header

            // we only need one merge because we will be automatically merging before we queue concepts that'd require multiple merges
            if (mergeJoins.length === 0) {
                mergeJoins.push({
                    fromColumn: scope.traverse.queuedComponents[0].frameConcept,
                    joinType: 'left.outer.join',
                    toColumn:
                        scope.traverse.queuedComponents[0].equivalentConcept,
                });
            }

            // put in all of the selected filters...they will override each other if exists
            for (filter in components[0].filters) {
                if (components[0].filters.hasOwnProperty(filter)) {
                    filters[filter] = components[0].filters[filter];
                }
            }

            joins = joins.concat(scope.traverse.queuedComponents[0].join);

            // using the slider so we will use the subselection and do a limit

            if (
                scope.traverse.instanceLimit !== scope.traverse.instances.count
            ) {
                pixelComponents.push({
                    type: 'Pixel',
                    components: [
                        getSubSelections(scope.traverse.currentComponent),
                    ],
                    terminal: 'true',
                });

                filters[scope.traverse.currentComponent.conceptName] = {
                    comparator: '==',
                    value: 'subselection',
                    isVariable: true,
                };
            }
            // now that we have all the pieces we need, we will create the pixel components needed to create the pixel
            pixelComponents.push({
                type: 'database',
                components: [scope.traverse.database.selected],
            });

            pixelComponents.push({
                type: 'select2',
                components: [
                    [
                        {
                            selector: components[0].equivalentConcept,
                            alias: components[0].frameConcept, // components[0].equivalentConcept
                        },
                        {
                            selector: components[0].conceptName,
                            alias: components[0].display,
                        },
                    ],
                ],
            });

            if (filters && Object.keys(filters).length > 0) {
                pixelComponents.push({
                    type: 'filter',
                    components: [filters],
                });
            }

            if (joins.length > 0) {
                pixelComponents.push({
                    type: 'join',
                    components: [joins],
                });
            }

            pixelComponents.push({
                type: 'merge',
                components: [mergeJoins, scope.widgetCtrl.getFrame('name')],
                terminal: true,
            });

            // if this is a graph, we can push it the component for 'CollectGraph()' to get all of the graph
            if (scope.widgetCtrl.getFrame('type') === 'GRAPH') {
                taskOptions[scope.widgetCtrl.panelId] = {
                    layout: layout,
                };

                pixelComponents.push({
                    type: 'taskOptions',
                    components: [taskOptions],
                });

                pixelComponents.push({
                    type: 'collectGraph',
                    components: [frameName],
                    terminal: true,
                });
            }

            return pixelComponents;
        }

        /**
         * @name addGraphPixels
         * @desc builds a graph pixel based on user selections
         * @return {Array} the pixel components
         */
        function addGraphPixels() {
            var layout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + layout
                ),
                start = [],
                end = [],
                taskOptions = {},
                allSelectors = [],
                newStart,
                newEnd,
                layerIndex = 0,
                options = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.meta.options'
                )
                    ? scope.widgetCtrl.getWidget(
                          'view.visualization.tasks.' +
                              layerIndex +
                              '.meta.options'
                      )
                    : {};

            options.connections = scope.widgetCtrl.getWidget(
                'view.visualization.tasks.' +
                    layerIndex +
                    '.meta.options.connections'
            )
                ? scope.widgetCtrl.getWidget(
                      'view.visualization.tasks.' +
                          layerIndex +
                          '.meta.options.connections'
                  ) + ';'
                : '';

            taskOptions[scope.widgetCtrl.panelId] = {
                layout: layout,
                alignment: {},
            };

            newStart = {
                alias: scope.traverse.newAlignment.start,
                model: 'start',
            };

            newEnd = {
                alias: scope.traverse.newAlignment.end,
                model: 'end',
            };

            // add new keys to keys object (start and end)
            keys.push(newStart);
            keys.push(newEnd);

            // add new connection
            options.connections += newStart.alias + '.' + newEnd.alias;

            // rebuild start/end
            keys.forEach(function (key) {
                if (
                    start.indexOf(key.alias) === -1 &&
                    end.indexOf(key.alias) === -1
                ) {
                    allSelectors.push(key);
                }
                if (key.model === 'start') {
                    start.push(key.alias);
                }
                if (key.model === 'end') {
                    end.push(key.alias);
                }
            });
            // add rest of selectors to build graph
            // add start/end to alignment
            taskOptions[scope.widgetCtrl.panelId].alignment.start = start;
            taskOptions[scope.widgetCtrl.panelId].alignment.end = end;

            return [
                {
                    type: 'frame',
                    components: [scope.widgetCtrl.getFrame('name')],
                },
                {
                    type: 'select2',
                    components: [allSelectors],
                },
                {
                    type: 'with',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'format',
                    components: ['graph', [options]],
                },
                {
                    type: 'taskOptions',
                    components: [taskOptions],
                },
                {
                    type: 'collect',
                    components: [-1],
                    terminal: true,
                },
            ];
        }

        /**
         * @name cancel
         * @desc cancels the instance selections and go back to the connected concepts/properties view
         * @returns {void}
         */
        function cancel() {
            scope.traverse.showInstances = false;
            scope.traverse.instances = {
                list: [],
                selected: [],
                clicked: [],
                taskId: '',
                numCollected: 0,
                count: 0,
                loading: false,
                searchTerm: '',
                pixelComponents: [],
                equals: false,
            };
            scope.traverse.currentComponent = {};
        }

        /**
         * @name setSelectedConcept
         * @param {string} alias - selected alias
         * @desc set the selected concept based on what the user clicked
         * @returns {void}
         */
        function setSelectedConcept(alias) {
            for (
                let headerIdx = 0,
                    headerLen = scope.traverse.frameHeaders.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                if (alias === scope.traverse.frameHeaders[headerIdx].alias) {
                    scope.traverse.selectedHeader =
                        scope.traverse.frameHeaders[headerIdx];
                    scope.traverse.prevSelectedHeader =
                        scope.traverse.frameHeaders[headerIdx];
                    scope.traverse.forcegraphHeader =
                        scope.traverse.frameHeaders[headerIdx];
                    break;
                }
            }

            let match = false;
            for (
                let nodeIdx = 0,
                    nodeLen = scope.traverse.engineNodes.options.nodes.length;
                nodeIdx < nodeLen;
                nodeIdx++
            ) {
                if (
                    scope.traverse.engineNodes.options.nodes[nodeIdx]
                        .conceptualName === alias
                ) {
                    match = true;
                    break;
                }
            }

            if (scope.traverse.database.selected && !match) {
                scope.traverse.engineNodes.selected = {
                    conceptualName: '...',
                };
            } else {
                scope.traverse.engineNodes.selected = {
                    conceptualName: alias,
                };
            }
            getConnectedConcepts(scope.traverse.selectedHeader);
        }

        function getSelectedConceptInstances(
            selectedHeader,
            selectedConceptInstances,
            headersChange
        ) {
            var pixelComponents = [],
                callback;

            pixelComponents = [
                {
                    meta: true,
                    type: 'database',
                    components: [scope.traverse.database.selected],
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                alias: selectedHeader.alias,
                            },
                        ],
                    ],
                },
                {
                    type: 'collect',
                    components: [500],
                    terminal: true,
                },
            ];

            // register message to come back to
            callback = function (returnData) {
                const output = returnData.pixelReturn[0].output;

                // add the list
                scope.traverse.selectedConceptInstances.list = [];
                for (
                    let valueIdx = 0, valueLen = output.data.values.length;
                    valueIdx < valueLen;
                    valueIdx++
                ) {
                    const value = output.data.values[valueIdx][0];

                    scope.traverse.selectedConceptInstances.list.push(value);
                }

                if (selectedConceptInstances) {
                    scope.traverse.selectedConceptInstances.selected =
                        selectedConceptInstances;
                } else if (headersChange) {
                    scope.traverse.selectedConceptInstances.selected = [];
                    for (
                        let valueIdx = 0, valueLen = output.data.values.length;
                        valueIdx < valueLen;
                        valueIdx++
                    ) {
                        const value = output.data.values[valueIdx][0];

                        scope.traverse.selectedConceptInstances.selected.push(
                            value
                        );
                    }
                }
            };

            scope.widgetCtrl.meta(pixelComponents, callback);
        }

        /**
         * @name refreshTask
         * @desc refresh the graph
         * @returns {void}
         */
        function refreshTask() {
            var graphPixels = addGraphPixels();

            scope.traverse.newAlignment = {
                start: '',
                end: '',
            };

            scope.widgetCtrl.execute(graphPixels);
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var selectedDataListener, selected, callback;

            selectedDataListener = scope.widgetCtrl.on(
                'update-selected',
                function () {
                    var selectedData = scope.widgetCtrl.getSelected('selected');

                    // get out of show instances if we select data while looking at instances
                    traverse.showInstances = false;

                    if (selectedData && selectedData.length > 0) {
                        scope.traverse.selectedConceptInstances.selected =
                            selectedData[0].instances;
                        scope.traverse.selectedConceptInstances.legendSelected =
                            selectedData[0].legendSelected;
                    }

                    setSelectedConcept(selectedData[0].alias);

                    // we've selected a node but we are using an alias
                    if (
                        scope.traverse.engineNodes.selected.conceptualName &&
                        scope.traverse.selectedHeader.alias !==
                            scope.traverse.engineNodes.selected
                                .conceptualName &&
                        scope.traverse.engineNodes.selected.conceptualName !==
                            '...'
                    ) {
                        getConnectedConcepts(
                            scope.traverse.engineNodes.selected
                        );
                    }
                }
            );

            // cleanup
            scope.$on('$destroy', function () {
                selectedDataListener();
            });

            selected = scope.widgetCtrl.getSelected('selected');

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    i,
                    len;

                scope.traverse.database.list = [];
                for (i = 0, len = output.length; i < len; i++) {
                    scope.traverse.database.list.push({
                        display: String(output[i].app_name).replace(/_/g, ' '),
                        value: output[i].app_id,
                        image: semossCoreService.app.generateDatabaseImageURL(
                            output[i].app_id
                        ),
                    });
                }

                getFrameHeaders();

                if (selected && selected.length > 0) {
                    scope.traverse.selectedConceptInstances.selected =
                        selected[0].instances;
                    scope.traverse.selectedConceptInstances.legendSelected =
                        selected[0].legendSelected;
                    setSelectedConcept(selected[0].alias);
                }

                selectDB();
            };

            scope.widgetCtrl.query(
                [
                    {
                        meta: true,
                        type: 'getDatabaseList',
                        components: [],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        initialize();
    }
}
