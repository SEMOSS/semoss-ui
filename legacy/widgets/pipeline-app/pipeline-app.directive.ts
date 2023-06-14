'use strict';

import angular from 'angular';
import jsPlumb from 'jsplumb';
import panzoom from 'panzoom';
import { PREVIEW_LIMIT } from '../../core/constants.js';
import Resizable from '../../core/utility/resizable-old';

import './pipeline-app.scss';

import './pipeline-app-filter/pipeline-app-filter.directive.ts';
import './pipeline-app-calculation/pipeline-app-calculation.directive.ts';

export default angular
    .module('app.pipeline.pipeline-app', [
        'app.pipeline.pipeline-app.filter',
        'app.pipeline.pipeline-app.calculation',
    ])
    .directive('pipelineApp', pipelineAppDirective);

pipelineAppDirective.$inject = [
    '$filter',
    '$timeout',
    '$compile',
    'ENDPOINT',
    'semossCoreService',
    'CONFIG',
    'RDBMS_TYPES',
];

function pipelineAppDirective(
    $filter,
    $timeout,
    $compile,
    ENDPOINT,
    semossCoreService,
    CONFIG,
    RDBMS_TYPES
) {
    pipelineAppCtrl.$inject = [];
    pipelineAppLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./pipeline-app.directive.html'),
        scope: {},
        require: ['^widget', '^pipelineComponent'],
        controller: pipelineAppCtrl,
        controllerAs: 'pipelineApp',
        bindToController: {
            type: '@',
        },
        link: pipelineAppLink,
    };

    function pipelineAppCtrl() {}

    function pipelineAppLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        let aliasTimeout, resizable, contentEle, leftEle, rightEle;

        scope.pipelineApp.valid = false;
        scope.pipelineApp.view = 'list';
        scope.pipelineApp.cache = false;
        scope.pipelineApp.CONFIG = CONFIG;

        scope.pipelineApp.frameType = undefined;
        scope.pipelineApp.customFrameName = {
            name: '',
            valid: true,
            message: '',
        };
        scope.pipelineApp.recommendations = {};

        scope.pipelineApp.structure = {
            searchTerm: '',
            loading: false,
            open: false,
            tables: [],
            edges: [],
        };

        scope.pipelineApp.metamodel = {
            plumbing: undefined,
            zoom: undefined,
            graph: undefined,
            scope: undefined,
        };

        scope.pipelineApp.traversal = {
            selectedQueueTableIdx: -1,
            selectedQueueTable: undefined,
            searchTerm: '',
            options: [],
            searched: [],
            toggle: true,
        };

        scope.pipelineApp.selected = {
            queue: [],
            toggle: true,
        };

        scope.pipelineApp.filter = {
            selected: [],
            html: '',
            open: false,
            toggle: true,
        };

        scope.pipelineApp.calculation = {
            selected: [],
            selectedIdx: -1,
            html: '',
            open: false,
            type: 'Simple',
            toggle: true,
        };

        scope.pipelineApp.toggleRight = true;

        scope.pipelineApp.distinct = false;

        scope.pipelineApp.joinOptions = {
            'inner.join': {
                display: 'Inner Join',
                img: require('images/inner_join.svg'),
            },
            'left.outer.join': {
                display: 'Left Join',
                img: require('images/left_join.svg'),
            },
            'right.outer.join': {
                display: 'Right Join',
                img: require('images/right_join.svg'),
            },
            'outer.join': {
                display: 'Outer Join',
                img: require('images/outer_join.svg'),
            },
        };

        scope.pipelineApp.collapsible = {
            selectors: true,
            calculation: true,
            filter: true,
        };

        scope.pipelineApp.updateFrame = updateFrame;
        scope.pipelineApp.validateFrameName = validateFrameName;
        scope.pipelineApp.updateSource = updateSource;
        scope.pipelineApp.updateData = updateData;
        scope.pipelineApp.updateView = updateView;
        scope.pipelineApp.updateTraversal = updateTraversal;
        scope.pipelineApp.searchTraversal = searchTraversal;
        scope.pipelineApp.toggleTraversal = toggleTraversal;
        scope.pipelineApp.checkTraversalToggle = checkTraversalToggle;
        scope.pipelineApp.toggleRightTables = toggleRightTables;
        scope.pipelineApp.getRightTablesToggleStatus =
            getRightTablesToggleStatus;
        scope.pipelineApp.checkSelectedToggle = checkSelectedToggle;
        scope.pipelineApp.addAllSelected = addAllSelected;
        scope.pipelineApp.addSelected = addSelected;
        scope.pipelineApp.removeSelected = removeSelected;
        scope.pipelineApp.validateSelected = validateSelected;
        scope.pipelineApp.checkSelected = checkSelected;
        scope.pipelineApp.toggleSelected = toggleSelected;
        scope.pipelineApp.updateSelectedAlias = updateSelectedAlias;
        scope.pipelineApp.previewSelected = previewSelected;
        scope.pipelineApp.showCalculation = showCalculation;
        scope.pipelineApp.deleteCalculation = deleteCalculation;
        scope.pipelineApp.onCalculationClose = onCalculationClose;
        scope.pipelineApp.showFilter = showFilter;
        scope.pipelineApp.clearFilter = clearFilter;
        scope.pipelineApp.onFilterClose = onFilterClose;
        scope.pipelineApp.searchMetamodel = searchMetamodel;
        scope.pipelineApp.selectTable = selectTable;
        scope.pipelineApp.getTableType = getTableType;
        scope.pipelineApp.selectColumn = selectColumn;
        scope.pipelineApp.getColumnType = getColumnType;
        scope.pipelineApp.getColumnButtonClass = getColumnButtonClass;
        scope.pipelineApp.importQueue = importQueue;
        scope.pipelineApp.importAuto = importAuto;

        /**
         * @name setFrame
         * @desc set the frame type
         */
        function setFrame(): void {
            const existingFrameType = scope.pipelineComponentCtrl.getComponent(
                'parameters.IMPORT_FRAME.value.type'
            );
            let defaultFrameType = semossCoreService.utility.freeze(
                scope.widgetCtrl.getOptions('initialFrameType')
            );

            // if its an rdbms db we will default frame type to be NATIVE, otherwise it will be the initial frame type (R)
            if (scope.pipelineApp.source && scope.pipelineApp.source.type) {
                defaultFrameType =
                    RDBMS_TYPES.indexOf(scope.pipelineApp.source.type) > -1
                        ? 'NATIVE'
                        : defaultFrameType;
            }
            // set the frame type; if it's already set we will leave it. otherwise we update the default frame type based on the db type
            scope.pipelineApp.frameType = existingFrameType || defaultFrameType;

            // if frame name exists, set it. if not we will generate a new one.
            const frameName = scope.pipelineComponentCtrl.getComponent(
                'parameters.IMPORT_FRAME.value.name'
            );
            if (frameName) {
                scope.pipelineApp.customFrameName.name = frameName;
                return;
            }

            // set the new frame name based on the source
            if (!scope.pipelineApp.source || !scope.pipelineApp.source.value) {
                return;
            }

            // generate a new frame
            if (scope.pipelineApp.type === 'database') {
                if (scope.pipelineApp.source.display) {
                    scope.pipelineApp.customFrameName.name =
                        scope.pipelineComponentCtrl.createFrameName(
                            scope.pipelineApp.source.display
                        );
                    validateFrameName();
                } else {
                    const callback = (response) => {
                        const output = response.pixelReturn[0].output,
                            type = response.pixelReturn[0].operationType;

                        if (type.indexOf('ERROR') > -1) {
                            scope.pipelineApp.customFrameName.name =
                                scope.pipelineComponentCtrl.createFrameName(
                                    'FRAME'
                                );
                            validateFrameName();
                            return;
                        }

                        scope.pipelineApp.customFrameName.name =
                            scope.pipelineComponentCtrl.createFrameName(
                                output.database_name || 'FRAME'
                            );
                        validateFrameName();
                    };

                    scope.widgetCtrl.meta(
                        [
                            {
                                type: 'databaseInfo',
                                components: [scope.pipelineApp.source.value],
                                terminal: true,
                                meta: true,
                            },
                        ],
                        callback,
                        []
                    );
                }
            } else if (scope.pipelineApp.type === 'frame') {
                scope.pipelineApp.customFrameName.name =
                    scope.pipelineComponentCtrl.createFrameName(
                        scope.pipelineApp.source.value
                    );
                validateFrameName();
            }
        }

        /**
         * @name updateFrame
         * @param {string} type - new frame type
         * @desc update the frame type
         */
        function updateFrame(type: string): void {
            scope.widgetCtrl.setOptions('initialFrameType', type);
        }

        /**
         * @name validateFrameName
         * @desc checks if the frame name entered by the user is valid
         */
        function validateFrameName(): void {
            const results = scope.pipelineComponentCtrl.validateFrameName(
                scope.pipelineApp.customFrameName.name
            );
            scope.pipelineApp.customFrameName.valid = results.valid;
            scope.pipelineApp.customFrameName.message = results.message;
        }

        /** Frames */
        /**
         * @name updateFrameRecommendations
         * @desc get recommendations for the frames (this tells us what we can link too)
         */
        function updateFrameRecommendations(): void {
            // clear it out
            scope.pipelineApp.recommendations = {};

            let pixel = '';

            const frames = scope.widgetCtrl.getShared('frames');
            for (const f in frames) {
                if (frames.hasOwnProperty(f)) {
                    const frame = frames[f];

                    pixel += `META | ${frame.name} | GetFrameDatabaseJoins();`;
                }
            }

            if (pixel.length === 0) {
                return;
            }

            const callback = (response) => {
                const merged = {};
                for (
                    let returnIdx = 0, returnLen = response.pixelReturn.length;
                    returnIdx < returnLen;
                    returnIdx++
                ) {
                    const output = response.pixelReturn[returnIdx].output,
                        type = response.pixelReturn[returnIdx].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }

                    for (const app in output) {
                        if (output.hasOwnProperty(app)) {
                            // add the app if it doesn't exist
                            if (!merged.hasOwnProperty(app)) {
                                merged[app] = {};
                            }

                            // look at all the concepts
                            for (const concept in output[app]) {
                                if (output[app].hasOwnProperty(concept)) {
                                    // add the concept if it doesn't exist
                                    if (!merged[app].hasOwnProperty(concept)) {
                                        merged[app][concept] = [];
                                    }

                                    // add in all of the frames, its safe to assume that each frame/colun is unique
                                    for (
                                        let frameIdx = 0,
                                            frameLen =
                                                output[app][concept].length;
                                        frameIdx < frameLen;
                                        frameIdx++
                                    ) {
                                        merged[app][concept].push(
                                            output[app][concept][frameIdx]
                                        );
                                    }
                                }
                            }
                        }
                    }
                }

                for (const app in merged) {
                    if (merged.hasOwnProperty(app)) {
                        // look at all the concepts
                        for (const concept in merged[app]) {
                            if (merged[app].hasOwnProperty(concept)) {
                                let message =
                                    'This concept may connect to others that have already been imported (';

                                // add in all of the frames, its safe to assume that each frame/colun is unique
                                for (
                                    let frameIdx = 0,
                                        frameLen = merged[app][concept].length;
                                    frameIdx < frameLen;
                                    frameIdx++
                                ) {
                                    if (merged[app][concept][frameIdx]) {
                                        const split =
                                            merged[app][concept][
                                                frameIdx
                                            ].split('__');
                                        message += `Table ${split[0]} with ${split[1]}, `;
                                    }
                                }

                                // clean up the end
                                message = message.slice(0, -2);
                                message += ')';

                                merged[app][concept] = message;
                            }
                        }
                    }
                }

                // for(let app)
                scope.pipelineApp.recommendations = merged;
            };

            // execute a meta query
            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                callback,
                []
            );
        }

        /** Source **/
        /**
         * @name setSource
         * @desc set the initial source data
         */
        function setSource(): void {
            // set the source
            scope.pipelineApp.source = {
                display: '',
                value: '',
                type: '',
            };

            // reset the stuff?
            let reset = true;

            // get the qs
            const qsComponent = scope.pipelineComponentCtrl.getComponent(
                'parameters.QUERY_STRUCT.value'
            );

            if (scope.pipelineApp.type === 'database') {
                const selectedApp = semossCoreService.app.get('selectedApp');

                // it is coming from the QS
                if (qsComponent && qsComponent.engineName) {
                    scope.pipelineApp.source.value = qsComponent.engineName;
                    scope.pipelineApp.source.type = qsComponent.type;
                    scope.pipelineApp.source.display =
                        qsComponent.display || '';
                    reset = false;

                    // this is a hack, because in pipeline-landing, we use the paramter to set the initial options
                    if (qsComponent.landing) {
                        reset = true;
                    }
                } else if (selectedApp && selectedApp !== 'NEWSEMOSSAPP') {
                    scope.pipelineApp.source.value = selectedApp;
                    reset = true;
                }
            } else if (scope.pipelineApp.type === 'frame') {
                // get the source
                const source = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );

                // set the source
                if (source && source.name) {
                    scope.pipelineApp.source.value = source.name;
                }

                // if the qs is there do not reset
                if (qsComponent && qsComponent.frameName) {
                    reset = false;
                }
            }

            updateSource(reset);
        }

        /**
         * @name updateSource
         * @desc update the information based on the selected APP
         * @param reset - should we reset the information or use the information from the QUERY_STRUCT
         */
        function updateSource(reset: boolean): void {
            // no source, the user must select it first
            if (!scope.pipelineApp.source.value) {
                return;
            }

            // set the frame based on the updated source
            setFrame();

            // clear the structure
            scope.pipelineApp.structure = {
                tables: {},
                edges: [],
            };

            // register message to come back to
            const callback = function (response) {
                const tableStructure = response.pixelReturn[0].output,
                    metamodel = response.pixelReturn[1].output;

                if (metamodel.nodes) {
                    for (
                        let nodeIdx = 0, nodeLen = metamodel.nodes.length;
                        nodeIdx < nodeLen;
                        nodeIdx++
                    ) {
                        const table = {
                                alias: String(
                                    metamodel.nodes[nodeIdx].conceptualName
                                ).replace(/_/g, ' '),
                                table: metamodel.nodes[nodeIdx].conceptualName,
                                position:
                                    metamodel.positions &&
                                    metamodel.positions[
                                        metamodel.nodes[nodeIdx].conceptualName
                                    ]
                                        ? metamodel.positions[
                                              metamodel.nodes[nodeIdx]
                                                  .conceptualName
                                          ]
                                        : {
                                              top: 0,
                                              left: 0,
                                          },
                                columns: {},
                            },
                            concept = metamodel.nodes[nodeIdx].conceptualName;

                        for (let i = 0; i < tableStructure.length; i++) {
                            if (table.table !== tableStructure[i][0]) continue;
                            let columnQs, columnAlias, columnType, columnPk;
                            // 0 index = table
                            // 1 index = column
                            // 2 index = data type
                            // 3 index = isTable?
                            if (tableStructure[i][3]) {
                                columnQs = tableStructure[i][1];
                                columnAlias = String(
                                    tableStructure[i][1]
                                ).replace(/_/g, ' ');
                                columnPk = true;
                            } else {
                                columnQs =
                                    tableStructure[i][0] +
                                    '__' +
                                    tableStructure[i][1];
                                columnAlias = String(
                                    tableStructure[i][1]
                                ).replace(/_/g, ' ');
                                columnPk = false;
                            }

                            columnType = getTypeInformation(
                                metamodel.dataTypes[concept],
                                metamodel.additionalDataTypes[concept]
                            );

                            table.columns[tableStructure[i][1]] = {
                                alias: columnAlias,
                                table: tableStructure[i][0],
                                column: tableStructure[i][1],
                                concept: columnQs,
                                isPrimKey: columnPk,
                                type: tableStructure[i][2],
                                typeFormat: columnType.typeFormat,
                            };
                        }

                        scope.pipelineApp.structure.tables[table.table] = table;
                    }
                }

                if (metamodel.edges) {
                    for (
                        let edgeIdx = 0, edgeLen = metamodel.edges.length;
                        edgeIdx < edgeLen;
                        edgeIdx++
                    ) {
                        scope.pipelineApp.structure.edges.push({
                            source: metamodel.edges[edgeIdx].source,
                            target: metamodel.edges[edgeIdx].target,
                        });
                    }
                }

                // update the data
                updateData(reset);

                // update view
                updateView(scope.pipelineApp.view);
            };

            let components: PixelCommand[] = [];
            if (scope.pipelineApp.type === 'database') {
                components = [
                    {
                        type: 'getDatabaseTableStructure',
                        components: [scope.pipelineApp.source.value],
                        terminal: true,
                        meta: true,
                    },
                    {
                        type: 'getDatabaseMetamodel',
                        components: [
                            scope.pipelineApp.source.value,
                            ['dataTypes', 'positions'],
                        ],
                        terminal: true,
                        meta: true,
                    },
                ];
            } else if (scope.pipelineApp.type === 'frame') {
                components = [
                    {
                        type: 'variable',
                        components: [scope.pipelineApp.source.value],
                        meta: true,
                    },
                    {
                        type: 'getFrameTableStructure',
                        components: [],
                        terminal: true,
                    },
                    {
                        type: 'variable',
                        components: [scope.pipelineApp.source.value],
                        meta: true,
                    },
                    {
                        type: 'getFrameMetamodel',
                        components: [['dataTypes', 'positions']],
                        terminal: true,
                    },
                ];
            }

            if (components.length === 0) {
                return;
            }

            scope.widgetCtrl.meta(components, callback);
        }

        /**
         * @name updateData
         * @desc set the selected information (and grab it from QUERY_STRUCT)
         * @param reset - should we reset the information or use the information from the QUERY_STRUCT
         */
        function updateData(reset: boolean): void {
            // clear the selected
            scope.pipelineApp.selected = {
                queue: [],
                toggle: true,
            };

            // clear the calculations
            scope.pipelineApp.calculation.selected = [];
            scope.pipelineApp.calculation.selectedIndex = -1;
            scope.pipelineApp.calculation.html = '';

            // clear the selected filter
            scope.pipelineApp.filter.selected = [];
            scope.pipelineApp.filter.html = '';

            // set the distinct
            scope.pipelineApp.distinct = false;

            // we are not setting the data
            if (!reset) {
                const qsComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.QUERY_STRUCT.value'
                );

                if (qsComponent) {
                    // grab the selected information from the traversal options
                    // (we use this because the QUERY_STRUCT doesn't contain all of the required information)

                    // extract the tables from the QUERY_STRUCT
                    const tables = {}; // mapping of table -> column -> alias[]

                    if (qsComponent.selectors) {
                        for (
                            let selectorIdx = 0,
                                selectorLen = qsComponent.selectors.length;
                            selectorIdx < selectorLen;
                            selectorIdx++
                        ) {
                            const selector = qsComponent.selectors[selectorIdx];

                            extractFromSelector(tables, selector);
                        }
                    }

                    if (qsComponent.groups) {
                        for (
                            let groupIdx = 0,
                                groupLen = qsComponent.groups.length;
                            groupIdx < groupLen;
                            groupIdx++
                        ) {
                            const group = qsComponent.groups[groupIdx];

                            // extract the table stuff
                            extractFromGroup(tables, group);
                        }
                    }

                    if (qsComponent.explicitFilters) {
                        for (
                            let filterIdx = 0,
                                filterLen = qsComponent.explicitFilters.length;
                            filterIdx < filterLen;
                            filterIdx++
                        ) {
                            extractFromFilter(
                                tables,
                                qsComponent.explicitFilters[filterIdx]
                            );
                        }
                    }

                    // now we have a mapping of our tables
                    // look at the selectors again, and push all of the valid ones
                    // we essentially want a list of visible + hidden selectors
                    if (qsComponent.selectors) {
                        for (
                            let selectorIdx = 0,
                                selectorLen = qsComponent.selectors.length;
                            selectorIdx < selectorLen;
                            selectorIdx++
                        ) {
                            const type =
                                    qsComponent.selectors[selectorIdx].type,
                                content =
                                    qsComponent.selectors[selectorIdx].content;

                            // mark the alias
                            if (
                                type === 'COLUMN' &&
                                content &&
                                tables[content.table] &&
                                tables[content.table][content.column]
                            ) {
                                tables[content.table][content.column].push(
                                    content.alias
                                );
                            }
                        }
                    }

                    // create the stuff
                    for (const table in tables) {
                        if (tables.hasOwnProperty(table)) {
                            const holder: any = {
                                idx: scope.pipelineApp.selected.queue.length,
                                table: table,
                                fromTable: undefined,
                                toTable: undefined,
                                joinType: undefined,
                                columns: [],
                                open: true,
                            };

                            for (const column in tables[table]) {
                                if (
                                    tables[table].hasOwnProperty(column) &&
                                    scope.pipelineApp.structure.tables.hasOwnProperty(
                                        table
                                    )
                                ) {
                                    let base,
                                        added = false;

                                    if (column === 'PRIM_KEY_PLACEHOLDER') {
                                        base =
                                            scope.pipelineApp.structure.tables[
                                                table
                                            ].columns[table];
                                    } else {
                                        base =
                                            scope.pipelineApp.structure.tables[
                                                table
                                            ].columns[column];
                                    }

                                    for (
                                        let aliasIdx = 0,
                                            aliasLen =
                                                tables[table][column].length;
                                        aliasIdx < aliasLen;
                                        aliasIdx++
                                    ) {
                                        holder.columns.push({
                                            alias: tables[table][column][
                                                aliasIdx
                                            ],
                                            table: base.table,
                                            column: base.column,
                                            concept: base.concept,
                                            isPrimKey: base.isPrimKey,
                                            conceptualName: base.conceptualName,
                                            type: base.type,
                                            typeFormat: base.typeFormat,
                                            hasAliasError: false,
                                            calculation: false,
                                            filter: false,
                                            visible: true,
                                            edit: false,
                                        });

                                        added = true;
                                    }

                                    // these are the hidden ones
                                    if (!added) {
                                        holder.columns.push({
                                            alias: String(base.column).replace(
                                                /_/g,
                                                ' '
                                            ),
                                            table: base.table,
                                            column: base.column,
                                            concept: base.concept,
                                            isPrimKey: base.isPrimKey,
                                            conceptualName: base.conceptualName,
                                            type: base.type,
                                            typeFormat: base.typeFormat,
                                            hasAliasError: false,
                                            calculation: false,
                                            filter: false,
                                            visible: false,
                                            edit: false,
                                        });
                                    }
                                }
                            }

                            scope.pipelineApp.selected.queue.push(holder);
                        }
                    }

                    // we go backwards and associate the join with the first table that is there
                    let relations: { content: any; type: string }[] = [];
                    if (qsComponent.relations) {
                        if (typeof qsComponent.relations === 'string') {
                            relations = JSON.parse(qsComponent.relations);
                        } else {
                            relations = qsComponent.relations || [];
                        }
                    }

                    for (
                        let relationIdx = relations.length - 1;
                        relationIdx >= 0;
                        relationIdx--
                    ) {
                        if (relations[relationIdx].type !== `BASIC`) {
                            console.log(
                                `Cannot handle relationships of type: ` +
                                    relations[relationIdx].type
                            );
                            continue;
                        }
                        for (
                            let tableIdx =
                                scope.pipelineApp.selected.queue.length - 1;
                            tableIdx >= 0;
                            tableIdx--
                        ) {
                            const table =
                                    scope.pipelineApp.selected.queue[tableIdx],
                                relDetails: {
                                    fromConcept: string;
                                    toConcept: string;
                                    joinType: string;
                                    comparator: string;
                                    relationName: string;
                                } = relations[relationIdx].content;

                            if (
                                table.table === relDetails.fromConcept ||
                                table.table === relDetails.toConcept
                            ) {
                                if (
                                    typeof table.fromTable !== 'undefined' ||
                                    typeof table.toTable !== 'undefined'
                                ) {
                                    console.warn(
                                        `Relations mapping is not correct for ${table.table}`
                                    );
                                }

                                table.fromTable = relDetails.fromConcept;
                                table.joinType = relDetails.joinType;
                                table.toTable = relDetails.toConcept;
                                break;
                            }
                        }
                    }

                    if (qsComponent.selectors) {
                        scope.pipelineApp.calculation.selected = [];
                        for (
                            let selectorIdx = 0,
                                selectorLen = qsComponent.selectors.length;
                            selectorIdx < selectorLen;
                            selectorIdx++
                        ) {
                            const selector = qsComponent.selectors[selectorIdx];

                            // only these top level types are calculated columns
                            if (
                                selector.type === 'FUNCTION' ||
                                selector.type === 'ARITHMETIC' ||
                                selector.type === 'IF_ELSE' ||
                                selector.type === 'CONSTANT'
                            ) {
                                scope.pipelineApp.calculation.selected.push({
                                    alias:
                                        selector &&
                                        selector.content &&
                                        selector.content.alias
                                            ? selector.content.alias
                                            : '',
                                    hasAliasError: false,
                                    selector: selector,
                                });
                            }
                        }
                    }

                    // save the filter
                    scope.pipelineApp.filter.selected =
                        qsComponent.explicitFilters || [];

                    // save distinct
                    scope.pipelineApp.distinct = qsComponent.hasOwnProperty(
                        'isDistinct'
                    )
                        ? qsComponent.isDistinct
                        : false;
                }
            }

            // generate html
            generateCalculation();
            generateFilter();

            // update the traversals
            updateTraversal(scope.pipelineApp.selected.queue.length - 1);

            // validate that the available are correct (naming)
            validateSelected();

            // check the visible icons
            checkSelected();

            // update preview
            previewSelected(false);
        }

        /**
         * @name updateView
         * @desc update the view based on selection
         * @param view - view to switch to
         */
        function updateView(view: string): void {
            scope.pipelineApp.view = view;

            if (scope.pipelineApp.view === 'list') {
                closeMetamodel();
            } else if (scope.pipelineApp.view === 'metamodel') {
                openMetamodel();
            }
        }

        /**
         * @name updateTraversal
         * @desc updates the traversal based on the selection
         * @param selectedQueueTableIdx - index of the selected traversal
         */
        function updateTraversal(selectedQueueTableIdx: number): void {
            const upstreamTables = {},
                downstreamTables = {},
                // capture the open/close of the previous state
                previousSearched = {};
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.traversal.searched.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                const table = scope.pipelineApp.traversal.searched[tableIdx];

                previousSearched[table.alias] = table.open;
            }

            scope.pipelineApp.traversal = {
                selectedQueueTableIdx: selectedQueueTableIdx,
                selectedQueueTable:
                    selectedQueueTableIdx === -1
                        ? undefined
                        : scope.pipelineApp.selected.queue[
                              selectedQueueTableIdx
                          ],
                searchTerm:
                    scope.pipelineApp.traversal &&
                    scope.pipelineApp.traversal.searchTerm
                        ? scope.pipelineApp.traversal.searchTerm
                        : '',
                options: [],
                searched: [],
                toggle: true,
            };

            // we can load everything, we are starting from fresh
            if (scope.pipelineApp.traversal.selectedQueueTableIdx === -1) {
                for (const table in scope.pipelineApp.structure.tables) {
                    if (
                        scope.pipelineApp.structure.tables.hasOwnProperty(table)
                    ) {
                        const tableObj: any = {
                            alias: scope.pipelineApp.structure.tables[table]
                                .alias,
                            table: scope.pipelineApp.structure.tables[table]
                                .table,
                            columns: [],
                            open: previousSearched.hasOwnProperty(
                                scope.pipelineApp.structure.tables[table].alias
                            )
                                ? previousSearched[
                                      scope.pipelineApp.structure.tables[table]
                                          .alias
                                  ]
                                : true,
                            direction: undefined,
                            fromTable: undefined,
                            toTable: undefined,
                        };
                        for (const column in scope.pipelineApp.structure.tables[
                            table
                        ].columns) {
                            if (
                                scope.pipelineApp.structure.tables[
                                    table
                                ].columns.hasOwnProperty(column)
                            ) {
                                tableObj.columns.push(
                                    scope.pipelineApp.structure.tables[table]
                                        .columns[column]
                                );
                            }
                        }

                        tableObj.columns = semossCoreService.utility.sort(
                            tableObj.columns,
                            'alias'
                        );

                        scope.pipelineApp.traversal.options.push(tableObj);
                    }
                }

                scope.pipelineApp.traversal.options =
                    semossCoreService.utility.sort(
                        scope.pipelineApp.traversal.options,
                        'alias'
                    );

                // filter with the search
                searchTraversal();

                return;
            }

            // look at the connetions, if one of them matches the traversed table, we can connect to the other one
            for (
                let edgeIdx = 0,
                    edgeLen = scope.pipelineApp.structure.edges.length;
                edgeIdx < edgeLen;
                edgeIdx++
            ) {
                // the target is DOWNSTREAM from our traversed table
                if (
                    scope.pipelineApp.structure.edges[edgeIdx].source ===
                    scope.pipelineApp.traversal.selectedQueueTable.table
                ) {
                    downstreamTables[
                        scope.pipelineApp.structure.edges[edgeIdx].target
                    ] = true;
                }

                // the source is UPSTREAM from our traversed table
                if (
                    scope.pipelineApp.structure.edges[edgeIdx].target ===
                    scope.pipelineApp.traversal.selectedQueueTable.table
                ) {
                    upstreamTables[
                        scope.pipelineApp.structure.edges[edgeIdx].source
                    ] = true;
                }
            }

            // now we, need to construct the object
            for (const table in scope.pipelineApp.structure.tables) {
                if (scope.pipelineApp.structure.tables.hasOwnProperty(table)) {
                    // the table is there add it in as an upstream table
                    if (
                        upstreamTables.hasOwnProperty(
                            scope.pipelineApp.structure.tables[table].table
                        )
                    ) {
                        const tableObj: any = {
                            alias: scope.pipelineApp.structure.tables[table]
                                .alias,
                            table: scope.pipelineApp.structure.tables[table]
                                .table,
                            columns: [],
                            open: previousSearched.hasOwnProperty(
                                scope.pipelineApp.structure.tables[table].alias
                            )
                                ? previousSearched[
                                      scope.pipelineApp.structure.tables[table]
                                          .alias
                                  ]
                                : true,
                            direction: 'upstream',
                            fromTable:
                                scope.pipelineApp.structure.tables[table].table,
                            toTable:
                                scope.pipelineApp.traversal.selectedQueueTable
                                    .table,
                        };

                        for (const column in scope.pipelineApp.structure.tables[
                            table
                        ].columns) {
                            if (
                                scope.pipelineApp.structure.tables[
                                    table
                                ].columns.hasOwnProperty(column)
                            ) {
                                tableObj.columns.push(
                                    scope.pipelineApp.structure.tables[table]
                                        .columns[column]
                                );
                            }
                        }

                        tableObj.columns = semossCoreService.utility.sort(
                            tableObj.columns,
                            'alias'
                        );

                        scope.pipelineApp.traversal.options.push(tableObj);
                    }
                }

                // the table is there add it in as an downstream table
                if (
                    downstreamTables.hasOwnProperty(
                        scope.pipelineApp.structure.tables[table].table
                    )
                ) {
                    const tableObj: any = {
                        alias: scope.pipelineApp.structure.tables[table].alias,
                        table: scope.pipelineApp.structure.tables[table].table,
                        columns: [],
                        open: previousSearched.hasOwnProperty(
                            scope.pipelineApp.structure.tables[table].alias
                        )
                            ? previousSearched[
                                  scope.pipelineApp.structure.tables[table]
                                      .alias
                              ]
                            : true,
                        direction: 'downstream',
                        fromTable:
                            scope.pipelineApp.traversal.selectedQueueTable
                                .table,
                        toTable:
                            scope.pipelineApp.structure.tables[table].table,
                    };

                    for (const column in scope.pipelineApp.structure.tables[
                        table
                    ].columns) {
                        if (
                            scope.pipelineApp.structure.tables[
                                table
                            ].columns.hasOwnProperty(column)
                        ) {
                            tableObj.columns.push(
                                scope.pipelineApp.structure.tables[table]
                                    .columns[column]
                            );
                        }
                    }

                    tableObj.columns = semossCoreService.utility.sort(
                        tableObj.columns,
                        'alias'
                    );

                    scope.pipelineApp.traversal.options.push(tableObj);
                }

                // same table add it in
                if (
                    scope.pipelineApp.traversal.selectedQueueTable.table ===
                    scope.pipelineApp.structure.tables[table].table
                ) {
                    const tableObj: any = {
                        alias: scope.pipelineApp.structure.tables[table].alias,
                        table: scope.pipelineApp.structure.tables[table].table,
                        columns: [],
                        open: previousSearched.hasOwnProperty(
                            scope.pipelineApp.structure.tables[table].alias
                        )
                            ? previousSearched[
                                  scope.pipelineApp.structure.tables[table]
                                      .alias
                              ]
                            : true,
                        direction: undefined,
                        fromTable: undefined,
                        toTable: undefined,
                    };

                    for (const column in scope.pipelineApp.structure.tables[
                        table
                    ].columns) {
                        if (
                            scope.pipelineApp.structure.tables[
                                table
                            ].columns.hasOwnProperty(column)
                        ) {
                            tableObj.columns.push(
                                scope.pipelineApp.structure.tables[table]
                                    .columns[column]
                            );
                        }
                    }

                    tableObj.columns = semossCoreService.utility.sort(
                        tableObj.columns,
                        'alias'
                    );

                    scope.pipelineApp.traversal.options.push(tableObj);
                }
            }

            scope.pipelineApp.traversal.options =
                semossCoreService.utility.sort(
                    scope.pipelineApp.traversal.options,
                    'alias'
                );

            // filter with the search
            searchTraversal();
        }

        /**
         * @name searchTraversal
         * @desc search the traverse list and update the options
         * @returns {void}
         */
        function searchTraversal() {
            // if nothing is searched we can just used the original
            if (!scope.pipelineApp.traversal.searchTerm) {
                scope.pipelineApp.traversal.searched =
                    semossCoreService.utility.freeze(
                        scope.pipelineApp.traversal.options
                    );
                return;
            }

            // if it is searched, we only check the column
            const cleanedSearch = String(
                scope.pipelineApp.traversal.searchTerm
            ).replace(/_/g, ' '); // name is already w/o spaces

            scope.pipelineApp.traversal.searched = [];
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.traversal.options.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                const table = semossCoreService.utility.freeze(
                    scope.pipelineApp.traversal.options[tableIdx]
                );
                table.columns = $filter('filter')(
                    semossCoreService.utility.freeze(table.columns),
                    {
                        alias: cleanedSearch,
                    }
                );

                if (table.columns.length > 0) {
                    scope.pipelineApp.traversal.searched.push(table);
                }
            }
        }

        /**
         * @name toggleTraversal
         * @desc toggle the traversal tables to be open/close
         * @returns {void}
         */
        function toggleTraversal() {
            scope.pipelineApp.traversal.toggle =
                !scope.pipelineApp.traversal.toggle;

            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.traversal.searched.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                scope.pipelineApp.traversal.searched[tableIdx].open =
                    scope.pipelineApp.traversal.toggle;
            }
        }

        /**
         * @name checkTraversalToggle
         * @desc check to see if any of the traversal tables are expanded and set the toggle accordingly
         * @returns {void}
         */
        function checkTraversalToggle() {
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.traversal.searched.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                if (scope.pipelineApp.traversal.searched[tableIdx].open) {
                    scope.pipelineApp.traversal.toggle = true;
                    return;
                }
            }

            scope.pipelineApp.traversal.toggle = false;
        }

        /**
         * @name toggleRightTables
         * @desc toggle the selected tables to be open/close
         * @returns {void}
         */
        function toggleRightTables() {
            scope.pipelineApp.toggleRight = !scope.pipelineApp.toggleRight; // determine whether all are open / closed
            scope.pipelineApp.selected.toggle = scope.pipelineApp.toggleRight;
            scope.pipelineApp.filter.toggle = scope.pipelineApp.toggleRight;
            scope.pipelineApp.calculation.toggle =
                scope.pipelineApp.toggleRight;

            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.selected.queue.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                scope.pipelineApp.selected.queue[tableIdx].open =
                    scope.pipelineApp.toggleRight;
            }
        }

        /**
         * @name getRightTablesToggleStatus
         * @desc toggle the selected tables to be open/close
         * @returns {void}
         */
        function getRightTablesToggleStatus() {
            let toggle = scope.pipelineApp.selected.toggle;
            if (scope.pipelineApp.filter.selected.length > 0) {
                toggle = toggle && scope.pipelineApp.filter.toggle;
            }
            if (scope.pipelineApp.calculation.selected.length > 0) {
                toggle = toggle && scope.pipelineApp.calculation.toggle;
            }
            scope.pipelineApp.toggleRight = toggle;
        }

        /**
         * @name checkSelectedToggle
         * @desc check to see if any of the selected tables are expanded and set the toggle accordingly
         * @returns {void}
         */
        function checkSelectedToggle() {
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.selected.queue.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                if (scope.pipelineApp.selected.queue[tableIdx].open) {
                    scope.pipelineApp.selected.toggle = true;
                    return;
                }
            }

            scope.pipelineApp.selected.toggle = false;
        }

        /**
         * @name addAllSelected
         * @desc add all the whole traversal table
         * @param {index} selectedTableIdx - traversal table to add
         * @returns {void}
         */
        function addAllSelected(selectedTableIdx) {
            const table =
                scope.pipelineApp.traversal.searched[selectedTableIdx];

            table.columns.forEach((col) => {
                addSelected(table, col, true);
            });

            // update the traversals (if its the 1st one)
            if (scope.pipelineApp.traversal.selectedQueueTableIdx === -1) {
                updateTraversal(scope.pipelineApp.selected.queue.length - 1);
            }

            // validate that the available are correct (naming)
            validateSelected();

            // check the visible icons
            checkSelected();

            previewSelected(false);
        }

        /**
         * @name addSelected
         * @desc add the column to the selected queue
         * @param {object} tableObj - add table object
         * @param {object} columnObj - add column object
         * @param {boolean} block - block updating the view
         * @returns {void}
         */
        function addSelected(tableObj, columnObj, block) {
            // if it is already added, we add it to the same table (we cannot do 'merges')
            let addedTableIdx = -1;
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.selected.queue.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                if (
                    scope.pipelineApp.selected.queue[tableIdx].table ===
                    columnObj.table
                ) {
                    addedTableIdx = tableIdx;
                    break;
                }
            }

            // add a new one
            if (addedTableIdx === -1) {
                scope.pipelineApp.selected.queue.push({
                    idx: scope.pipelineApp.selected.queue.length,
                    table: columnObj.table,
                    fromTable: tableObj.fromTable,
                    toTable: tableObj.toTable,
                    joinType: 'inner.join',
                    columns: [],
                    open: true,
                });

                addedTableIdx = scope.pipelineApp.selected.queue.length - 1;
            }

            // add a column
            scope.pipelineApp.selected.queue[addedTableIdx].columns.push({
                alias: columnObj.alias,
                table: columnObj.table,
                column: columnObj.column,
                concept: columnObj.concept,
                isPrimKey: columnObj.isPrimKey,
                conceptualName: columnObj.conceptualName,
                type: columnObj.type,
                typeFormat: columnObj.typeFormat,
                hasAliasError: false,
                calculation: false,
                filter: false,
                visible: true,
                edit: false,
            });

            if (!block) {
                // update the traversals (if its the 1st one)
                if (scope.pipelineApp.traversal.selectedQueueTableIdx === -1) {
                    updateTraversal(
                        scope.pipelineApp.selected.queue.length - 1
                    );
                }

                // validate that the available are correct (naming)
                validateSelected();

                // check the visible icons
                checkSelected();

                previewSelected(false);
            }
        }

        /**
         * @name removeSelected
         * @param  removedTableIdx - table to remove the column from
         * @param  removedColumnIdx - column to remove
         * @desc remove a column from the selected queue
         */
        function removeSelected(
            removedTableIdx: number,
            removedColumnIdx: number
        ): void {
            let removedColumns: number[] = [];

            if (scope.pipelineApp.selected.queue.length === 0) {
                return; // not removed
            }

            // remove the column
            if (removedColumnIdx !== -1) {
                const removed = scope.pipelineApp.selected.queue[
                    removedTableIdx
                ].columns.splice(removedColumnIdx, 1);

                // remove the column from the filter
                removeFilter(removed[0].table, removed[0].column);
            }

            // if the table is empty, there is no need to keep it there
            if (
                scope.pipelineApp.selected.queue[removedTableIdx].columns
                    .length === 0
            ) {
                if (removedTableIdx === 0) {
                    // if first column, we need to check to see if there are other columns traversing from it. if so, we need to remove that table due to undefined joins
                    // we skip over the next table though because that becomes the starting point and no need to remove.
                    removedColumns = getSelectedColumnsToRemove(
                        2,
                        [
                            scope.pipelineApp.selected.queue[removedTableIdx]
                                .table,
                        ],
                        [0]
                    );
                } else {
                    // run through the same logic to remove tables after this table if they are using this table to join from
                    removedColumns = getSelectedColumnsToRemove(
                        removedTableIdx + 1,
                        [
                            scope.pipelineApp.selected.queue[removedTableIdx]
                                .table,
                        ],
                        [removedTableIdx]
                    );
                }

                // lets actually remove those items now, but in reverse because we don't want to mess up the index when removing
                for (let i = removedColumns.length - 1; i >= 0; i--) {
                    scope.pipelineApp.selected.queue.splice(
                        removedColumns[i],
                        1
                    );
                }

                // doing some cleanup after the removal
                for (
                    let idx = 0;
                    idx < scope.pipelineApp.selected.queue.length;
                    idx++
                ) {
                    if (idx === 0) {
                        // first table has no from or to table so set them empty
                        scope.pipelineApp.selected.queue[0].fromTable = null;
                        scope.pipelineApp.selected.queue[0].toTable = null;
                    }
                    // set the idx correctly
                    scope.pipelineApp.selected.queue[idx].idx = idx;
                }
            }

            // reset the data
            if (scope.pipelineApp.selected.queue.length === 0) {
                updateData(true);
                return;
            }

            // update the traversals
            updateTraversal(scope.pipelineApp.selected.queue.length - 1);

            // generate the html
            generateCalculation();
            generateFilter();

            // when the filter is closed
            checkSelected();

            // validate that the available are correct (naming)
            validateSelected();

            // preview the changes
            previewSelected(false);
        }

        /**
         * @name getSelectedColumnsToRemove
         * @param startingIdx - the idx to start loop from
         * @param removedCols - list of table names to be removed
         * @param IdxToRemove - list of index of table to remove
         * @desc check to see which tables need to be removed; all tables using the removed table to join from needs to be removed
         * @returns array of index to remove
         */
        function getSelectedColumnsToRemove(
            startingIdx: number,
            removedCols: string[],
            IdxToRemove: number[]
        ): number[] {
            for (
                let i = startingIdx;
                i < scope.pipelineApp.selected.queue.length;
                i++
            ) {
                // found column to remove because it uses a column that is to be removed
                if (
                    removedCols.indexOf(
                        scope.pipelineApp.selected.queue[i].fromTable
                    ) > -1
                ) {
                    removedCols.push(scope.pipelineApp.selected.queue[i].table);
                    IdxToRemove.push(i);
                }
            }

            return IdxToRemove;
        }

        /**
         * @name validateSelected
         * @desc validate the selected options and update them
         */
        function validateSelected(): void {
            let valid = false;

            // need one visible column
            if (scope.pipelineApp.calculation.selected.length > 0) {
                valid = true;
            }

            // check the visible columns
            if (!valid) {
                tableLoop: for (
                    let tableIdx = 0,
                        tableLen = scope.pipelineApp.selected.queue.length;
                    tableIdx < tableLen;
                    tableIdx++
                ) {
                    for (
                        let colIdx = 0,
                            colLen =
                                scope.pipelineApp.selected.queue[tableIdx]
                                    .columns.length;
                        colIdx < colLen;
                        colIdx++
                    ) {
                        const column =
                            scope.pipelineApp.selected.queue[tableIdx].columns[
                                colIdx
                            ];

                        if (column.visible) {
                            valid = true;
                            break tableLoop;
                        }
                    }
                }
            }

            // check for invalid aliases
            // and aggregate alias that match ignoring case
            const aliasMap = {};
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.selected.queue.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                for (
                    let colIdx = 0,
                        colLen =
                            scope.pipelineApp.selected.queue[tableIdx].columns
                                .length;
                    colIdx < colLen;
                    colIdx++
                ) {
                    const column =
                        scope.pipelineApp.selected.queue[tableIdx].columns[
                            colIdx
                        ];

                    // skip the hidden one, they do not need to have aliases
                    if (!column.visible) {
                        continue;
                    }

                    // check if the alias itself is valid and save the duplicate
                    column.hasAliasError =
                        !column.alias ||
                        !!column.alias.match(/[-\/\\^$*+?.()|[\]{};!%#@~`]/g) ||
                        !!column.alias.match(/( |_)( |_)/g);

                    if (column.hasAliasError) {
                        valid = false;
                    }

                    const upperAlias = column.alias.toUpperCase();
                    if (!aliasMap.hasOwnProperty(upperAlias)) {
                        aliasMap[upperAlias] = [];
                    }

                    aliasMap[upperAlias].push({
                        isCalculation: false,
                        table: tableIdx,
                        column: colIdx,
                    });
                }
            }

            for (
                let calculationIdx = 0,
                    calculationLen =
                        scope.pipelineApp.calculation.selected.length;
                calculationIdx < calculationLen;
                calculationIdx++
            ) {
                const calculation =
                    scope.pipelineApp.calculation.selected[calculationIdx];

                // check if the alias itself is valid and save the duplicate
                calculation.hasAliasError =
                    !calculation.alias ||
                    !!calculation.alias.match(
                        /[-\/\\^$*+?.()|[\]{};!%#@~`]/g
                    ) ||
                    !!calculation.alias.match(/( |_)( |_)/g);

                if (calculation.hasAliasError) {
                    valid = false;
                }

                const upperAlias = calculation.alias.toUpperCase();
                if (!aliasMap.hasOwnProperty(upperAlias)) {
                    aliasMap[upperAlias] = [];
                }

                aliasMap[upperAlias].push({
                    isCalculation: true,
                    calculation: calculationIdx,
                });
            }

            for (const alias in aliasMap) {
                if (aliasMap.hasOwnProperty(alias)) {
                    // duplicates
                    if (aliasMap[alias].length >= 2) {
                        for (
                            let aliasIdx = 0, aliasLen = aliasMap[alias].length;
                            aliasIdx < aliasLen;
                            aliasIdx++
                        ) {
                            const aliasOption = aliasMap[alias][aliasIdx];

                            if (aliasOption.isCalculation) {
                                scope.pipelineApp.calculation.selected[
                                    aliasOption.calculation
                                ].hasAliasError = true;
                            } else {
                                scope.pipelineApp.selected.queue[
                                    aliasOption.table
                                ].columns[aliasOption.column].hasAliasError =
                                    true;
                            }

                            valid = false;
                        }
                    }
                }
            }

            scope.pipelineApp.valid = valid;
        }

        /**
         * @name checkSelected
         * @desc check the selected options and update them
         */
        function checkSelected(): void {
            // check the filter
            const filters = {};

            // get the filter columns/tables
            for (
                let filterIdx = 0,
                    filterLen = scope.pipelineApp.filter.selected.length;
                filterIdx < filterLen;
                filterIdx++
            ) {
                extractFromFilter(
                    filters,
                    scope.pipelineApp.filter.selected[filterIdx]
                );
            }

            // check the calculations
            const calculations = {};
            for (
                let calculationIdx = 0,
                    calculationLen =
                        scope.pipelineApp.calculation.selected.length;
                calculationIdx < calculationLen;
                calculationIdx++
            ) {
                const calculation =
                    scope.pipelineApp.calculation.selected[calculationIdx];

                extractFromSelector(calculations, calculation.selector);
            }

            // apply the booleans
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.selected.queue.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                for (
                    let colIdx = 0,
                        colLen =
                            scope.pipelineApp.selected.queue[tableIdx].columns
                                .length;
                    colIdx < colLen;
                    colIdx++
                ) {
                    const column =
                        scope.pipelineApp.selected.queue[tableIdx].columns[
                            colIdx
                        ];

                    // if it is present in the filters, mark as true
                    if (
                        filters &&
                        filters.hasOwnProperty(column.table) &&
                        filters[column.table].hasOwnProperty(column.column)
                    ) {
                        column.filter = true;
                    } else {
                        column.filter = false;
                    }

                    // if it is present in the calculations, mark as true
                    if (
                        calculations &&
                        calculations.hasOwnProperty(column.table) &&
                        calculations[column.table].hasOwnProperty(column.column)
                    ) {
                        column.calculation = true;
                    } else {
                        column.calculation = false;
                    }
                }
            }
        }

        /**
         * @name toggleSelected
         * @desc hide the selected alias
         */
        function toggleSelected(): void {
            // validate it
            validateSelected();

            // check the visible icons
            checkSelected();

            // preview it
            previewSelected(false);
        }

        /**
         * @name updateSelectedAlias
         * @desc when user updates alias we want to update preview but not on each change
         *       so, we create a timeout that is canceled at the beginning of each call
         *       to this function so when the user types, load preview will not be continuously
         *       called. After one second of no typing previewSelected is called
         */
        function updateSelectedAlias(): void {
            validateSelected();

            if (aliasTimeout) {
                $timeout.cancel(aliasTimeout);
            }

            aliasTimeout = $timeout(function () {
                previewSelected(false);
            }, 300);
        }

        /**
         * @name previewSelected
         * @param {boolean} alert - message on errors
         * @desc preview the selected data
         * @returns {void}
         */
        function previewSelected(alert) {
            let parameters = {},
                valid = false;

            //TODO: Merge with validate selected
            // not valid
            if (!scope.pipelineApp.valid) {
                return;
            }

            // need one visible column
            if (scope.pipelineApp.calculation.selected.length > 0) {
                valid = true;
            }

            if (!valid) {
                tableLoop: for (
                    let tableIdx = 0,
                        tableLen = scope.pipelineApp.selected.queue.length;
                    tableIdx < tableLen;
                    tableIdx++
                ) {
                    for (
                        let colIdx = 0,
                            colLen =
                                scope.pipelineApp.selected.queue[tableIdx]
                                    .columns.length;
                        colIdx < colLen;
                        colIdx++
                    ) {
                        const column =
                            scope.pipelineApp.selected.queue[tableIdx].columns[
                                colIdx
                            ];

                        if (column.visible) {
                            valid = true;
                            break tableLoop;
                        }
                    }
                }
            }

            if (!valid) {
                if (alert) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Selectors are empty. Please select columns to import.'
                    );
                }
            }

            if (valid) {
                parameters = buildParameters('queue', true);
            }

            scope.pipelineComponentCtrl.previewComponent(parameters);
        }

        /**
         * @name showCalculation
         * @desc show screen to edit a calculation
         * @param {object} column - calculation to add
         */
        function showCalculation(selectedIndex: number): void {
            scope.pipelineApp.calculation.selectedIndex = selectedIndex;
            scope.pipelineApp.calculation.open = true;
            // Add some temporary table html so that the scroll element will scroll to the correct height on calculation close
            scope.pipelineApp.calculation.html = `
            <table>
                    <thead>
                        <tr></tr>
                    </thead>
                    <tbody>
                        <tr></tr>
                        <tr></tr>
                    </tbody>
            </table>`;

            // Set the calculation type (New columns will default to Simple, Edited columns after importing will default to Advanced)
            if (!selectedIndex && selectedIndex !== 0) {
                scope.pipelineApp.calculation.type = 'Simple';
            } else {
                scope.pipelineApp.calculation.type = scope.pipelineApp
                    .calculation.selected[selectedIndex].type
                    ? scope.pipelineApp.calculation.selected[selectedIndex].type
                    : 'Advanced';
            }
        }

        /**
         * Remove calculation, then update view
         * @param {number} selectedIndex Index of calculation to remove
         */
        function deleteCalculation(selectedIndex: number): void {
            scope.pipelineApp.calculation.selected.splice(selectedIndex, 1);
            scope.pipelineApp.calculation.selectedIndex = -1;

            // Update state
            onCalculationClose();
        }

        /**
         * @name onCalculationClose
         * @desc Called when the calculation overlay is closed and parses the calculation into a string
         */
        function onCalculationClose() {
            scope.pipelineApp.calculation.html = '';

            // generate the html
            generateCalculation();

            // when the calculation is closed
            checkSelected();

            // make the recently calculation selectors invisible
            let calculation;
            if (scope.pipelineApp.calculation.selected.length > 0) {
                if (
                    scope.pipelineApp.calculation.selected[
                        scope.pipelineApp.calculation.selectedIndex
                    ]
                ) {
                    calculation =
                        scope.pipelineApp.calculation.selected[
                            scope.pipelineApp.calculation.selectedIndex
                        ];
                } else {
                    calculation =
                        scope.pipelineApp.calculation.selected[
                            scope.pipelineApp.calculation.selected.length - 1
                        ];
                }
            }

            if (!calculation) {
                return;
            }

            // auto hide the columns if it is an aggergation
            if (isSelectorAggregation(calculation.selector)) {
                const calculations = {};

                // extract the table/column
                extractFromSelector(calculations, calculation.selector);

                for (
                    let tableIdx = 0,
                        tableLen = scope.pipelineApp.selected.queue.length;
                    tableIdx < tableLen;
                    tableIdx++
                ) {
                    for (
                        let colIdx = 0,
                            colLen =
                                scope.pipelineApp.selected.queue[tableIdx]
                                    .columns.length;
                        colIdx < colLen;
                        colIdx++
                    ) {
                        const column =
                            scope.pipelineApp.selected.queue[tableIdx].columns[
                                colIdx
                            ];

                        // if it is present in the calculations, make it invisible
                        if (
                            calculations &&
                            calculations.hasOwnProperty(column.table) &&
                            calculations[column.table].hasOwnProperty(
                                column.column
                            )
                        ) {
                            column.visible = false;
                        }
                    }
                }
            }

            // validate that the available are correct (naming)
            validateSelected();

            ele[0]
                .querySelector('.pipeline-app__calculation')
                .scrollIntoView({ block: 'end', behavior: 'smooth' });

            previewSelected(false);
        }

        /**
         * @name generateCalculation
         * @desc Generate the calculation view
         */
        function generateCalculation(): void {
            let html = '';

            if (scope.pipelineApp.calculation.selected.length) {
                let calculationIdx = 0,
                    calculationLen =
                        scope.pipelineApp.calculation.selected.length;

                html += `
                <table class="pipeline-app__selected__table pipeline-app__selected__table--teal">
                            <thead ng-class="{'pipeline-app__selected__table--closed': !pipelineApp.calculation.toggle}"
                                ng-click="pipelineApp.calculation.toggle = !pipelineApp.calculation.toggle; pipelineApp.getRightTablesToggleStatus(); $event.stopPropagation();">
                                <tr title="Calculated Columns"
                                    class="pipeline-app__selected__table__row">
                                    <th class="smss-center smss--icon  pipeline-app__selected__table--teal__icon">
                                        <i class="fa fa-calculator"></i>
                                    </th>
                                    <th>
                                        <h6>Calculated Columns</h6>
                                    </th>
                                    <th class="smss-col--6"></th>
                                    <th class="smss--icon"></th>
                                    <th class="smss-center smss--icon">
                                        <i class="fa"
                                            ng-class="{'fa-caret-down': pipelineApp.calculation.toggle, 'fa-caret-right': !pipelineApp.calculation.toggle}"></i>
                                    </th>
                                </tr>
                            </thead>
                            <tbody ng-show="pipelineApp.calculation.toggle">
                `;

                for (; calculationIdx < calculationLen; calculationIdx++) {
                    const calculation =
                        scope.pipelineApp.calculation.selected[calculationIdx];
                    html += `
                        <tr class="pipeline-app__selected__table__row">
                            <td class="smss-center smss--icon">
                            </td>
                            <td>
                                <span class="smss-text">
                                    {{pipelineApp.calculation.selected[${calculationIdx}].alias}}
                                </span>
                            </td>
                            <td class="smss-col--6">
                                <span class="smss-text">
                                    ${createCalculationHtml(
                                        calculation.selector
                                    )}
                                </span>
                            </td>
                            <td class="smss--icon">
                                <smss-btn class="smss-btn--icon" title="Edit Calculation"
                                            ng-click="pipelineApp.showCalculation(${calculationIdx})">
                                    <i class="fa fa-edit"></i>
                                </smss-btn>
                            </td>
                            <td class="smss--icon">
                                <smss-btn class="smss-btn--icon" title="Remove Calculation"
                                            ng-click="pipelineApp.deleteCalculation(${calculationIdx}); pipelineApp.getRightTablesToggleStatus();">
                                    <i class="fa fa-trash"></i>
                                </smss-btn>
                            </td>
                        </tr>
                    `;
                }

                html += `</tbody>
                </table>
                `;
            }

            scope.pipelineApp.calculation.html = html;
        }

        /**
         * @name createCalculationHtml
         * @desc Takes the selected calculation and builds it in a pretty/readable format.
         * @param selector - current level of the current calculation traversal
         * @returns the final html
         */
        function createCalculationHtml(selector: any): string {
            if (!selector) {
                return '';
            }

            //TODO:
            return flattenSelector(selector);
        }

        /**
         * @name showFilter
         * @desc show screen for a new filter
         * @returns {void}
         */
        function showFilter(): void {
            scope.pipelineApp.filter.open = true;
            // Add some temporary table html so that the scroll element will scroll to the correct height on filter close
            scope.pipelineApp.filter.html = `
            <table>
                    <thead>
                        <tr></tr>
                    </thead>
                    <tbody>
                        <tr></tr>
                        <tr></tr>
                    </tbody>
            </table>`;
        }

        /**
         * @name removeFilter
         * @desc a column has been removed, remove it from the filter
         * @param {object} table - table to update
         * @param {object} column - column info
         */
        function removeFilter(table: string, column: string): void {
            // remove the filter (backwards because of splice);
            for (
                let filterIdx = scope.pipelineApp.filter.selected.length - 1;
                filterIdx >= 0;
                filterIdx--
            ) {
                removeFromFilter(
                    scope.pipelineApp.filter.selected[filterIdx],
                    scope.pipelineApp.filter.selected,
                    filterIdx,
                    table,
                    column
                );
            }
        }

        /**
         * @name removeFromFilter
         * @desc a column has been removed, remove it from the filter
         * @param current - current level of the current filter traversal
         * @param table - table of the column we want to remove
         * @param column - column we want to remvoe
         */
        function removeFromFilter(
            current: any,
            parent: any[],
            parentIdx: number,
            table: string,
            column: string
        ): void {
            if (!current) {
                return;
            }

            const type = current.type,
                content = current.content;

            if (type === 'OR' || type === 'AND') {
                if (!content || content.length === 0) {
                    return;
                }

                // remove from the children
                // backwards so we can splice
                for (
                    let contentIdx = content.length - 1;
                    contentIdx >= 0;
                    contentIdx--
                ) {
                    removeFromFilter(
                        content[contentIdx],
                        content,
                        contentIdx,
                        table,
                        column
                    );
                }

                // if the content is zero, remove that parent
                if (content.length === 0) {
                    parent.splice(parentIdx, 1);
                }
            } else if (type === 'SIMPLE') {
                const chunks = [content.left, content.right];

                let remove = false;
                while (chunks.length > 0) {
                    const chunk = chunks.shift();

                    if (!chunk) {
                        continue;
                    }

                    if (
                        chunk.pixelType === 'COLUMN' &&
                        chunk.value[0].content.table === table &&
                        chunk.value[0].content.column === column
                    ) {
                        remove = true;
                        break;
                    }
                }

                if (remove) {
                    parent.splice(parentIdx, 1);
                }
            }
        }

        /**
         * @name onFilterClose
         * @desc Called when the filter overlay is closed and parses the filter into a string
         */
        function onFilterClose(): void {
            scope.pipelineApp.filter.html = '';

            // generate the html
            generateFilter();

            // when the filter is closed
            checkSelected();

            // scroll to the filter table
            ele[0]
                .querySelector('.pipeline-app__filter')
                .scrollIntoView({ block: 'end', behavior: 'smooth' });

            previewSelected(false);
        }

        /**
         * @name generateFilter
         * @desc Generate the filter view
         */
        function generateFilter(): void {
            scope.pipelineApp.filter.html = ``;

            if (scope.pipelineApp.filter.selected.length) {
                let html = ` 
                <table class="pipeline-app__selected__table pipeline-app__selected__table--purple"
                       ng-if="pipelineApp.filter.selected.length">
                    <thead ng-class="{'pipeline-app__selected__table--closed': !pipelineApp.filter.toggle}"
                        ng-click="pipelineApp.filter.toggle = !pipelineApp.filter.toggle; pipelineApp.getRightTablesToggleStatus(); $event.stopPropagation();">
                        <tr title="Filters"
                            class="pipeline-app__selected__table__row">
                            <th class="smss-center smss--icon  pipeline-app__selected__table--purple__icon">
                                <i class="fa fa-filter"></i>
                            </th>
                            <th>
                                <h6>Filters</h6>
                            </th>
                            <th class="smss--icon"></th>
                            <th class="smss-center smss--icon">
                                <i class="fa"
                                    ng-class="{'fa-caret-down': pipelineApp.filter.toggle, 'fa-caret-right': !pipelineApp.filter.toggle}"></i>
                            </th>
                        </tr>
                    </thead>
                    <tbody ng-show="pipelineApp.filter.toggle">
                        <tr class="pipeline-app__selected__table__row">
                            <td class="smss-center smss--icon">
                            </td>
                            <td>
                                <div class="pipeline-app__selected__table__col">
                                    <span class="smss-text"
                `;

                let smssText = ``;
                for (
                    let filterIdx = 0,
                        filterLen = scope.pipelineApp.filter.selected.length;
                    filterIdx < filterLen;
                    filterIdx++
                ) {
                    smssText += createFilterHTML(
                        scope.pipelineApp.filter.selected[filterIdx]
                    );
                }
                smssText = smssText
                    .substring(1, smssText.length - 1)
                    .trim()
                    .replace(/\s{3,}/g, ' '); // remove the extra parentheses and whitespace
                html += `title="${smssText}">`;
                smssText = smssText.replace(/AND|OR/g, function (joiner) {
                    return (
                        `<h6 class="smss-color--primary" style="display: inline">` +
                        joiner +
                        `</h6>`
                    );
                });

                html += smssText;
                html += `
                                    </span>
                                </div>
                            </td>
                            <td class="smss--icon">
                                <smss-btn class="smss-btn--icon" title="Edit Filter"
                                            ng-click="pipelineApp.showFilter()">
                                    <i class="fa fa-edit"></i>
                                </smss-btn>
                            </td>
                            <td class="smss--icon">
                                <smss-btn class="smss-btn--icon" title="Remove Filter"
                                            ng-click="pipelineApp.clearFilter(); pipelineApp.getRightTablesToggleStatus();">
                                    <i class="fa fa-trash"></i>
                                </smss-btn>
                            </td>
                        </tr>
                    </tbody>
                </table>
                `;

                scope.pipelineApp.filter.html = html;
            }
        }

        /**
         * @name createFilterHTML
         * @desc Takes the selected filter and builds it in a pretty/readable format.
         * @param filter - current level of the current filter traversal
         * @returns the final html
         */
        function createFilterHTML(filter: any): string {
            if (!filter) {
                return '';
            }

            const type = filter.type,
                content = filter.content;

            if (type === 'OR' || type === 'AND') {
                if (!content || content.length === 0) {
                    return '';
                }

                return ` (${content
                    .map((c) => createFilterHTML(c))
                    .join(type)}) `;
            } else if (type === 'SIMPLE') {
                const components: string[] = [],
                    chunks = [content.left, content.right];

                while (chunks.length > 0) {
                    let chunk = chunks.shift(),
                        component = '';

                    if (!chunk) {
                        continue;
                    }

                    if (chunk.pixelType === 'COLUMN') {
                        component = flattenSelector(chunk.value[0]);
                    } else if (
                        chunk.pixelType === 'BOOLEAN' ||
                        chunk.pixelType === 'NULL_VALUE' ||
                        chunk.pixelType === 'CONST_STRING' ||
                        chunk.pixelType === 'CONST_INT' ||
                        chunk.pixelType === 'CONST_DATE' ||
                        chunk.pixelType === 'CONST_DECIMAL' ||
                        chunk.pixelType === 'LAMBDA'
                    ) {
                        component = Array.isArray(chunk.value)
                            ? chunk.value
                                  .map((c) => {
                                      return String(c) ? String(c) : '""';
                                  })
                                  .join(', ')
                                  .replace(/_/g, ' ')
                            : String(chunk.value).replace(/_/g, ' ');
                    }

                    if (component) {
                        components.push(component);
                    }
                }

                return `
                        ${components[0] || ''}  ${content.comparator} ${
                    components[1] || ''
                }
                    `;
            }

            return '';
        }

        /**
         * @name clearFilter
         * @desc add the filter
         */
        function clearFilter(): void {
            // clear it
            scope.pipelineApp.filter.selected = [];
        }

        /**
         * @name openMetamodel
         * @desc open the metamodel
         */
        function openMetamodel(): void {
            // close before opening
            closeMetamodel();

            scope.pipelineApp.structure.loading = true;
            scope.pipelineApp.structure.searchTerm = '';

            //  get the metamodel
            $timeout(function () {
                scope.pipelineApp.metamodel.graph = ele[0].querySelector(
                    '#pipeline-app__metamodel__graph'
                );
                scope.pipelineApp.metamodel.plumbing =
                    jsPlumb.jsPlumb.getInstance({
                        Container: scope.pipelineApp.metamodel.graph,
                    });

                // add panzoom
                scope.pipelineApp.metamodel.zoom = panzoom(
                    scope.pipelineApp.metamodel.graph
                );

                drawMetamodel();

                scope.pipelineApp.structure.loading = false;
            });
        }

        /**
         * @name closeMetamodel
         * @desc destroy the metamodel
         * @returns {void}
         */
        function closeMetamodel() {
            // remove connections
            if (scope.pipelineApp.metamodel.plumbing) {
                scope.pipelineApp.metamodel.plumbing.reset();
            }

            if (scope.pipelineApp.metamodel.zoom) {
                scope.pipelineApp.metamodel.zoom.dispose();
                scope.pipelineApp.metamodel.zoom = undefined;
            }

            // destroy the old scope
            if (scope.pipelineApp.metamodel.scope) {
                scope.pipelineApp.metamodel.scope.$destroy();
            }

            // remove the eles
            if (scope.pipelineApp.metamodel.graph) {
                while (scope.pipelineApp.metamodel.graph.firstChild) {
                    if (scope.pipelineApp.metamodel.graph.lastChild) {
                        scope.pipelineApp.metamodel.graph.removeChild(
                            scope.pipelineApp.metamodel.graph.lastChild
                        );
                    }
                }
            }
        }

        /**
         * @name drawMetamodel
         * @desc draw the metamodel
         * @returns {void}
         */
        function drawMetamodel() {
            let html = '',
                eles = {};

            // generate the html
            // add the tables
            html += '<div>';
            for (const table in scope.pipelineApp.structure.tables) {
                if (scope.pipelineApp.structure.tables.hasOwnProperty(table)) {
                    html += generateTable(
                        scope.pipelineApp.structure.tables[table].table
                    );
                }
            }
            html += '</div>';

            // create a new scope
            scope.pipelineApp.metamodel.scope = scope.$new();

            // mount and compile
            scope.pipelineApp.metamodel.graph.appendChild(
                angular.element(html)[0]
            );
            $compile(scope.pipelineApp.metamodel.graph)(
                scope.pipelineApp.metamodel.scope
            );

            // store all of the eles
            for (const table in scope.pipelineApp.structure.tables) {
                if (scope.pipelineApp.structure.tables.hasOwnProperty(table)) {
                    eles[scope.pipelineApp.structure.tables[table].table] =
                        scope.pipelineApp.metamodel.graph.querySelector(
                            `#pipeline-app__metamodel__graph__table--${scope.pipelineApp.structure.tables[table].table}`
                        );
                }
            }

            // add edges
            for (
                let edgeIdx = 0,
                    edgeLen = scope.pipelineApp.structure.edges.length;
                edgeIdx < edgeLen;
                edgeIdx++
            ) {
                scope.pipelineApp.metamodel.plumbing.connect({
                    source: eles[
                        scope.pipelineApp.structure.edges[edgeIdx].source
                    ],
                    target: eles[
                        scope.pipelineApp.structure.edges[edgeIdx].target
                    ],
                    detachable: false,
                    anchor: 'AutoDefault',
                    endpoint: 'Blank',
                    connectionsDetachable: false,
                    maxConnections: -1,
                    connector: [
                        'Flowchart',
                        {
                            cssClass:
                                'pipeline-app__metamodel__graph__edge__connector',
                        },
                    ],
                });
            }
        }

        /**
         * @name searchMetamodel
         * @desc search the metamodel
         * @returns {void}
         */
        function searchMetamodel() {
            if (scope.pipelineApp.metamodel.graph) {
                const tables =
                        scope.pipelineApp.metamodel.graph.querySelectorAll(
                            '[metamodel-alias]'
                        ) || [],
                    len = tables.length;
                if (len > 0) {
                    let searchString =
                        scope.pipelineApp.structure.searchTerm || '';
                    searchString = searchString
                        .toUpperCase()
                        .replace(/ /g, '_');

                    for (let i = 0; i < len; i++) {
                        // clear the old
                        let temp =
                                tables[i].getAttribute('metamodel-alias') || '',
                            iconEle =
                                tables[i].querySelector(
                                    '.pipeline-app__metamodel__graph__table__item__icon'
                                ) || [],
                            textEle =
                                tables[i].querySelector(
                                    '.pipeline-app__metamodel__graph__table__item__text'
                                ) || [];

                        temp = temp.toUpperCase().replace(/ /g, '_');
                        if (
                            temp.indexOf(searchString) === -1 ||
                            !searchString
                        ) {
                            iconEle.style.color = '';
                            textEle.style.color = '';
                            tables[i].style.backgroundColor = '';
                        } else {
                            iconEle.style.color = '#000000';
                            textEle.style.color = '#000000';
                            tables[i].style.backgroundColor = '#fff9e9';
                        }
                    }
                }
            }
        }

        /**
         * @name generateTable
         * @param {string} id - id of the table to create
         * @desc generates a label for the selected table
         * @return {string}  the html for the table
         */
        function generateTable(id) {
            const table = scope.pipelineApp.structure.tables[id];

            let labelHolder = '';
            labelHolder += `<div id="pipeline-app__metamodel__graph__table--${
                table.table
            }"
                            class="pipeline-app__metamodel__graph__table"
                            ng-class="{'pipeline-app__metamodel__graph__table--light': pipelineApp.traversal.selectedQueueTableIdx !== -1 && !pipelineApp.getTableType('${
                                table.table
                            }'), 'pipeline-app__metamodel__graph__table--selected': pipelineApp.getTableType('${
                table.table
            }') === 'selected', 'pipeline-app__metamodel__graph__table--imported': pipelineApp.getTableType('${
                table.table
            }') === 'selected' || pipelineApp.getTableType('${
                table.table
            }') === 'previous'}"
                            style="top:${
                                table.position &&
                                table.position.hasOwnProperty('top')
                                    ? table.position.top
                                    : 0
                            }px;left:${
                table.position && table.position.hasOwnProperty('left')
                    ? table.position.left
                    : 0
            }px">`;
            labelHolder += `<div class="pipeline-app__metamodel__graph__table__item pipeline-app__metamodel__graph__table__item--border smss-clear"
                title="${table.alias}"
                metamodel-alias="${table.alias}">
                <div class="pipeline-app__metamodel__graph__table__item__icon smss-text">
                    <i class="fa fa-table"></i>
                </div>
                <div class="pipeline-app__metamodel__graph__table__item__text pipeline-app__metamodel__graph__table__item__text--wide">
                    <span class="smss-small">${table.alias}</span>
                </div>
                <smss-btn class="smss-btn--icon pipeline-app__metamodel__graph__table__item__traversal" title="Traverse from: ${table.alias}" ng-show="(pipelineApp.getTableType('${table.table}') === 'selected' || pipelineApp.getTableType('${table.table}') === 'previous')" ng-click="pipelineApp.selectTable('${table.table}')">
                    <i class="fa fa-eye" ng-class="{'smss-color--primary': pipelineApp.traversal.selectedQueueTable.table === '${table.table}'}"></i>
                </smss-btn>
            </div>`;

            // column list
            for (const column in table.columns) {
                if (table.columns.hasOwnProperty(column)) {
                    labelHolder += `<div class="pipeline-app__metamodel__graph__table__item"
                        title="${table.columns[column].alias}"
                        metamodel-alias="${table.columns[column].alias}">
                        ${
                            table.columns[column].isPrimKey
                                ? `
                            <div class="pipeline-app__metamodel__graph__table__item__icon">
                                <i class="fa fa-key"></i>
                            </div>`
                                : ''
                        }
                        <div class="pipeline-app__metamodel__graph__table__item__text">
                            <span class="smss-small"> ${
                                table.columns[column].alias
                            } </span>
                        </div>
                        <div class="pipeline-app__metamodel__graph__table__item__icon">
                            ${
                                table.columns[column].type === 'STRING'
                                    ? '<i class="fa fa-font"></i>'
                                    : ''
                            }
                            ${
                                table.columns[column].type === 'DATE'
                                    ? '<i class="fa fa-calendar-o"></i>'
                                    : ''
                            }
                            ${
                                table.columns[column].type === 'TIMESTAMP'
                                    ? '<i class="fa fa-clock-o"></i>'
                                    : ''
                            }
                            ${
                                table.columns[column].type === 'NUMBER'
                                    ? '<i class="fa fa-hashtag"></i>'
                                    : ''
                            }
                        </div>
                        <smss-btn class="smss-btn--icon" title="${
                            table.columns[column].alias
                        }" ng-show="pipelineApp.getColumnType('${
                        table.columns[column].table
                    }', '${
                        table.columns[column].column
                    }')" ng-click="pipelineApp.selectColumn('${
                        table.columns[column].table
                    }', '${table.columns[column].column}')">
                            <i ng-class="pipelineApp.getColumnButtonClass('${
                                table.columns[column].table
                            }', '${table.columns[column].column}')"></i>
                        </smss-btn>
                    </div>`;
                }
            }
            labelHolder += '</div>';

            return labelHolder;
        }

        /**
         * @name selectTable
         * @param {string} table - table
         * @desc select the table
         * @returns {void}
         */
        function selectTable(table) {
            const option = getTableOptions(table);

            if (option.type === 'previous') {
                updateTraversal(option.tableIdx);
            }
        }

        /**
         * @name getTableType
         * @desc get the class for the metamodel
         * @param table - table
         * @returns previous, selected
         */
        function getTableType(table: string): string {
            const option = getTableOptions(table);

            return option.type;
        }

        /**
         * @name getTableOptions
         * @desc get the options for the column
         * @param table - table
         * @returns type, tableIdx
         */
        function getTableOptions(table: string): {
            tableIdx: number;
            type: string;
        } {
            if (scope.pipelineApp.traversal.selectedQueueTableIdx === -1) {
                return {
                    tableIdx: -1,
                    type: '',
                };
            }

            // no need to traverse if it is already st
            if (
                scope.pipelineApp.traversal.selectedQueueTable.table === table
            ) {
                return {
                    tableIdx: scope.pipelineApp.traversal.selectedQueueTable,
                    type: 'selected',
                };
            }

            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.selected.queue.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                if (
                    scope.pipelineApp.selected.queue[tableIdx].table === table
                ) {
                    return {
                        tableIdx: tableIdx,
                        type: 'previous',
                    };
                }
            }

            // check if its is a traversal option
            // this is nasty =(
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.traversal.options.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                if (
                    scope.pipelineApp.traversal.options[tableIdx].table ===
                    table
                ) {
                    return {
                        tableIdx: -1,
                        type: 'traverse',
                    };
                }
            }

            // can't over
            return {
                tableIdx: -1,
                type: '',
            };
        }

        /**
         * @name selectColumn
         * @desc select the column and trigger the appropriate action
         * @param table - table
         * @param  column - column
         */
        function selectColumn(table: string, column: string): void {
            const option = getColumnOptions(table, column);

            if (option.type === 'add' || option.type === 'remove') {
                if (option.type === 'add') {
                    addSelected(option.tableObj, option.columnObj, false);
                }

                if (option.type === 'remove') {
                    const removedTableIdx =
                            scope.pipelineApp.selected.queue.length - 1,
                        removedColumnIdx =
                            scope.pipelineApp.selected.queue[removedTableIdx]
                                .columns.length - 1;

                    removeSelected(removedTableIdx, removedColumnIdx);
                }
            }
        }

        /**
         * @name getColumnType
         * @desc get the type for the metamodel
         * @param {string} table - table
         * @param {string} column - column
         * @returns {boolean} show it?
         */
        function getColumnType(table, column) {
            const option = getColumnOptions(table, column);

            return option.type;
        }

        /**
         * @name getColumnButtonClass
         * @desc get the class for the metamodel
         * @param {string} table - table
         * @param {string} column - column
         * @returns {string} button class to show
         */
        function getColumnButtonClass(table, column) {
            const option = getColumnOptions(table, column);

            if (option.type === 'added') {
                return 'fa fa-check';
            } else if (option.type === 'add') {
                return 'fa fa-plus smss-color--success';
            } else if (option.type === 'remove') {
                return 'fa fa-times smss-color--error';
            }

            return '';
        }

        /**
         * @name getColumnOptions
         * @desc get the options for the column
         * @param {string} table - table
         * @param {string} column - column
         * @returns {object} type, columnObj, tableObj
         */
        function getColumnOptions(table, column) {
            // three classes accept, reject, nothing
            if (scope.pipelineApp.traversal.selectedQueueTableIdx === -1) {
                for (
                    let tableIdx = 0,
                        tableLen = scope.pipelineApp.traversal.options.length;
                    tableIdx < tableLen;
                    tableIdx++
                ) {
                    if (
                        scope.pipelineApp.traversal.options[tableIdx].table ===
                        table
                    ) {
                        for (
                            let colIdx = 0,
                                colLen =
                                    scope.pipelineApp.traversal.options[
                                        tableIdx
                                    ].columns.length;
                            colIdx < colLen;
                            colIdx++
                        ) {
                            if (
                                scope.pipelineApp.traversal.options[tableIdx]
                                    .columns[colIdx].column === column
                            ) {
                                return {
                                    tableObj:
                                        scope.pipelineApp.traversal.options[
                                            tableIdx
                                        ],
                                    columnObj:
                                        scope.pipelineApp.traversal.options[
                                            tableIdx
                                        ].columns[colIdx],
                                    type: 'add',
                                };
                            }
                        }
                    }
                }
            }

            // removable one
            if (
                scope.pipelineApp.selected.queue[
                    scope.pipelineApp.selected.queue.length - 1
                ].table === table &&
                scope.pipelineApp.selected.queue[
                    scope.pipelineApp.selected.queue.length - 1
                ].columns[
                    scope.pipelineApp.selected.queue[
                        scope.pipelineApp.selected.queue.length - 1
                    ].columns.length - 1
                ].column === column
            ) {
                return {
                    tableObj:
                        scope.pipelineApp.selected.queue[
                            scope.pipelineApp.selected.queue.length - 1
                        ],
                    columnObj:
                        scope.pipelineApp.selected.queue[
                            scope.pipelineApp.selected.queue.length - 1
                        ].columns[
                            scope.pipelineApp.selected.queue[
                                scope.pipelineApp.selected.queue.length - 1
                            ].columns.length - 1
                        ],
                    type: 'remove',
                };
            }

            // check if it is added
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.selected.queue.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                if (
                    scope.pipelineApp.selected.queue[tableIdx].table === table
                ) {
                    for (
                        let colIdx = 0,
                            colLen =
                                scope.pipelineApp.selected.queue[tableIdx]
                                    .columns.length;
                        colIdx < colLen;
                        colIdx++
                    ) {
                        if (
                            scope.pipelineApp.selected.queue[tableIdx].columns[
                                colIdx
                            ].column === column
                        ) {
                            return {
                                tableObj:
                                    scope.pipelineApp.selected.queue[tableIdx],
                                columnObj:
                                    scope.pipelineApp.selected.queue[tableIdx]
                                        .columns[colIdx],
                                type: 'added',
                            };
                        }
                    }
                }
            }

            // check if its is a traversal option
            // this is nasty =(
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineApp.traversal.options.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                if (
                    scope.pipelineApp.traversal.options[tableIdx].table ===
                    table
                ) {
                    for (
                        let colIdx = 0,
                            colLen =
                                scope.pipelineApp.traversal.options[tableIdx]
                                    .columns.length;
                        colIdx < colLen;
                        colIdx++
                    ) {
                        if (
                            scope.pipelineApp.traversal.options[tableIdx]
                                .columns[colIdx].column === column
                        ) {
                            return {
                                tableObj:
                                    scope.pipelineApp.traversal.options[
                                        tableIdx
                                    ],
                                columnObj:
                                    scope.pipelineApp.traversal.options[
                                        tableIdx
                                    ].columns[colIdx],
                                type: 'add',
                            };
                        }
                    }
                }
            }

            // can't over
            return {
                tableObj: undefined,
                columnObj: undefined,
                type: '',
            };
        }

        /**
         * @name setCacheSettings
         * @param {*} frameName the frame name to cache
         * @param {*} frameType the frame type to cache into
         * @desc if its a native frame, we can cache the frame
         * @returns {void}
         */
        function setCacheSettings(frameName, frameType) {
            if (
                scope.pipelineApp.cache &&
                scope.pipelineApp.frameType === 'NATIVE'
            ) {
                // add cache pixel
                scope.pipelineComponentCtrl.data.pixel +=
                    semossCoreService.pixel.build([
                        {
                            type: 'cacheNativeFrame',
                            components: [frameName, frameType],
                            terminal: true,
                        },
                    ]);
            }
        }

        /**
         * @name checkImportLimits
         * @param {string} type the type of import auto or queue
         * @desc checks to see if the data is over the limit
         * @returns {*} object containing isOverLimit boolean and the warning message
         */
        function checkImportLimits(type) {
            let returnObj = {
                    isOverLimits: false,
                    message: '',
                },
                columnCount = 0,
                queueIndex;

            // no limit set or type is auto where the FE does not have the row count so let it through. BE will have to do a check for limits
            if (
                !CONFIG.importLimit ||
                !scope.pipelineApp.totalCount ||
                type === 'auto'
            ) {
                return returnObj;
            }

            // get the column counts
            if (type === 'queue') {
                for (
                    queueIndex = 0;
                    queueIndex < scope.pipelineApp.selected.queue.length;
                    queueIndex++
                ) {
                    columnCount +=
                        scope.pipelineApp.selected.queue[queueIndex].columns
                            .length;
                }
            }

            if (
                CONFIG.importLimit <
                scope.pipelineApp.totalCount * columnCount
            ) {
                returnObj.message =
                    'The number data points (' +
                    scope.pipelineApp.totalCount * columnCount +
                    ') exceeds the limit of ' +
                    CONFIG.importLimit +
                    '. ';
                returnObj.message +=
                    'Please reduce your data points by filtering or removing columns.';
                returnObj.isOverLimits = true;
            }

            return returnObj;
        }

        /**
         * @name importQueue
         * @param {boolean} visualize - if true visualize frame
         * @desc import the queue
         * @returns {void}
         */
        function importQueue(visualize) {
            let parameters,
                options,
                callback,
                limitCheckObj,
                valid = false;

            //TODO: Merge with validate selected
            // need one visible column
            if (scope.pipelineApp.calculation.selected.length > 0) {
                valid = true;
            }

            if (!valid) {
                tableLoop: for (
                    let tableIdx = 0,
                        tableLen = scope.pipelineApp.selected.queue.length;
                    tableIdx < tableLen;
                    tableIdx++
                ) {
                    for (
                        let colIdx = 0,
                            colLen =
                                scope.pipelineApp.selected.queue[tableIdx]
                                    .columns.length;
                        colIdx < colLen;
                        colIdx++
                    ) {
                        const column =
                            scope.pipelineApp.selected.queue[tableIdx].columns[
                                colIdx
                            ];

                        if (column.visible) {
                            valid = true;
                            break tableLoop;
                        }
                    }
                }
            }

            if (!valid) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Selectors are empty. Please select data.'
                );
                return;
            }

            limitCheckObj = checkImportLimits('queue');

            if (limitCheckObj.isOverLimits) {
                scope.widgetCtrl.alert('warn', limitCheckObj.message);
                return;
            }

            parameters = buildParameters('queue', false);

            options = {};

            callback = function () {
                const panels = scope.widgetCtrl.getShared('panels');

                // refresh all other panels to make sure they are updated with latest
                for (let panelIdx = 0; panelIdx < panels.length; panelIdx++) {
                    if (
                        panels[panelIdx].widgetId !== scope.widgetCtrl.widgetId
                    ) {
                        semossCoreService.emit('refresh-task', {
                            meta: false,
                            widgetId: panels[panelIdx].widgetId,
                        });
                    }
                }

                if (visualize) {
                    scope.pipelineComponentCtrl.visualizeComponent();
                }
            };

            setCacheSettings(parameters.IMPORT_FRAME.name, 'R');
            scope.pipelineComponentCtrl.executeComponent(
                parameters,
                options,
                callback
            );
        }

        /**
         * @name importAuto
         * @param visualize - if true visualize frame
         * @desc import automatically
         */
        function importAuto(visualize: boolean): void {
            let parameters, options, callback, limitCheckObj;

            if (Object.keys(scope.pipelineApp.structure.tables).length === 0) {
                scope.widgetCtrl.alert(
                    'warn',
                    'There are no tables. Please select a new database.'
                );
                return;
            }

            limitCheckObj = checkImportLimits('auto');

            if (limitCheckObj.isOverLimits) {
                scope.widgetCtrl.alert('warn', limitCheckObj.message);
                return;
            }

            // adding everything to the queue so user can come back to component
            scope.pipelineApp.traversal.options.forEach((table) => {
                table.columns.forEach((col) => addSelected(table, col, true));
            });

            parameters = buildParameters('auto', false);

            options = {};

            if (visualize) {
                callback = scope.pipelineComponentCtrl.visualizeComponent;
            }

            setCacheSettings(parameters.IMPORT_FRAME.name, 'R');
            scope.pipelineComponentCtrl.executeComponent(
                parameters,
                options,
                callback
            );
        }

        /**
         * @name buildParameters
         * @desc build the parameters for the current module
         * @param {string} type - type of parameter to build
         * @param {boolelan} preview - true if coming from preview
         * @returns {object} - map of the paramters to value
         */
        function buildParameters(type, preview) {
            let relations: any = [],
                selectors: any = [],
                explicitFilters = [],
                havingFilters = [],
                group = false,
                groups: any[] = [];

            if (type === 'auto') {
                const added = {};
                for (const table in scope.pipelineApp.structure.tables) {
                    if (
                        scope.pipelineApp.structure.tables.hasOwnProperty(table)
                    ) {
                        for (const column in scope.pipelineApp.structure.tables[
                            table
                        ].columns) {
                            if (
                                scope.pipelineApp.structure.tables[
                                    table
                                ].columns.hasOwnProperty(column)
                            ) {
                                const alias =
                                    scope.pipelineApp.structure.tables[
                                        table
                                    ].columns[column].alias.replace(/ /g, '_');

                                if (
                                    !scope.pipelineApp.structure.tables[table]
                                        .columns[column].isPrimKey
                                ) {
                                    if (added.hasOwnProperty(alias)) {
                                        added[alias] = added[alias] + 1;
                                    } else {
                                        added[alias] = 0;
                                    }

                                    selectors.push({
                                        type: 'COLUMN',
                                        content: {
                                            table: scope.pipelineApp.structure
                                                .tables[table].columns[column]
                                                .table,
                                            column: scope.pipelineApp.structure
                                                .tables[table].columns[column]
                                                .isPrimKey
                                                ? 'PRIM_KEY_PLACEHOLDER'
                                                : scope.pipelineApp.structure
                                                      .tables[table].columns[
                                                      column
                                                  ].column,
                                            alias:
                                                added[alias] > 0
                                                    ? alias + '_' + added[alias]
                                                    : alias,
                                        },
                                    });
                                }

                                // else {
                                //     console.warn('Multiple nodes with the same alias:' + alias);
                                // }

                                // added[alias] = 0;
                            }
                        }
                    }
                }

                for (
                    let edgeIdx = 0,
                        edgeLen = scope.pipelineApp.structure.edges.length;
                    edgeIdx < edgeLen;
                    edgeIdx++
                ) {
                    const join =
                        scope.pipelineApp.structure.edges[edgeIdx].source +
                        '.' +
                        scope.pipelineApp.structure.edges[edgeIdx].target;

                    if (!added.hasOwnProperty(join)) {
                        relations.push([
                            scope.pipelineApp.structure.edges[edgeIdx].source,
                            'inner.join',
                            scope.pipelineApp.structure.edges[edgeIdx].target,
                        ]);
                    } else {
                        console.warn(
                            'Multiple nodes with the same join:' +
                                scope.pipelineApp.structure.edges[edgeIdx]
                                    .source +
                                ' to ' +
                                scope.pipelineApp.structure.edges[edgeIdx]
                                    .target
                        );
                    }
                }
            } else if (type === 'queue') {
                for (
                    let tableIdx = 0,
                        tableLen = scope.pipelineApp.selected.queue.length;
                    tableIdx < tableLen;
                    tableIdx++
                ) {
                    if (
                        typeof scope.pipelineApp.selected.queue[tableIdx]
                            .fromTable !== 'undefined' &&
                        typeof scope.pipelineApp.selected.queue[tableIdx]
                            .toTable !== 'undefined'
                    ) {
                        relations.push([
                            scope.pipelineApp.selected.queue[tableIdx]
                                .fromTable,
                            scope.pipelineApp.selected.queue[tableIdx].joinType,
                            scope.pipelineApp.selected.queue[tableIdx].toTable,
                        ]);
                    }

                    for (
                        let colIdx = 0,
                            colLen =
                                scope.pipelineApp.selected.queue[tableIdx]
                                    .columns.length;
                        colIdx < colLen;
                        colIdx++
                    ) {
                        const column =
                            scope.pipelineApp.selected.queue[tableIdx].columns[
                                colIdx
                            ];

                        if (!column.visible) {
                            continue;
                        }

                        // add to selectors if it is NOT hidden
                        const alias = String(column.alias).replace(/ /g, '_');

                        // add the selector
                        selectors.push({
                            type: 'COLUMN',
                            content: {
                                table: column.table,
                                column: column.isPrimKey
                                    ? 'PRIM_KEY_PLACEHOLDER'
                                    : column.column,
                                alias: alias,
                            },
                        });
                    }
                }

                // add calculations
                for (
                    let calculationIdx = 0,
                        calculationLen =
                            scope.pipelineApp.calculation.selected.length;
                    calculationIdx < calculationLen;
                    calculationIdx++
                ) {
                    const calculation =
                        scope.pipelineApp.calculation.selected[calculationIdx];

                    if (!group && isSelectorAggregation(calculation.selector)) {
                        // we can group if it is an aggregate
                        // there is an aggregation
                        group = true;
                    }

                    // clean the alias
                    const alias = String(calculation.alias).replace(/ /g, '_');

                    selectors.push({
                        ...calculation.selector,
                        content: {
                            ...calculation.selector.content,
                            alias: alias,
                        },
                    });
                }

                // if there is a group, built it
                // the group is based on all of the NON aggregate columns
                if (group) {
                    const tables: any = {};
                    for (
                        let selectorIdx = 0, selectorLen = selectors.length;
                        selectorIdx < selectorLen;
                        selectorIdx++
                    ) {
                        const selector = selectors[selectorIdx];

                        // extract the table stuff, but skip over the 'FUNCTION' ones (not in the group)
                        extractFromSelector(tables, selector, ['FUNCTION']);
                    }

                    for (const table in tables) {
                        for (const column in tables[table]) {
                            groups.push({
                                content: {
                                    table: table,
                                    column: column,
                                },
                            });
                        }
                    }
                }

                // set the filters
                explicitFilters = scope.pipelineApp.filter.selected || [];
            }

            // build the QUERY_STRUCT
            const QUERY_STRUCT: any = {
                isDistinct: scope.pipelineApp.distinct,
                limit: preview ? PREVIEW_LIMIT : -1,
                offset: -1,
                relations: relations,
                groups: group ? groups : [],
                orders: [],
                selectors: selectors,
                explicitFilters: explicitFilters,
                havingFilters: havingFilters,
            };

            let SOURCE;
            if (scope.pipelineApp.type === 'database') {
                QUERY_STRUCT.qsType = 'ENGINE';
                QUERY_STRUCT.engineName = scope.pipelineApp.source.value;

                SOURCE = undefined;
            } else if (scope.pipelineApp.type === 'frame') {
                QUERY_STRUCT.qsType = 'FRAME';
                QUERY_STRUCT.frameName = scope.pipelineApp.source.value;

                SOURCE = {
                    name: scope.pipelineApp.source.value,
                };
            }

            return {
                SOURCE: SOURCE,
                QUERY_STRUCT: QUERY_STRUCT,
                IMPORT_FRAME: {
                    name: scope.pipelineApp.customFrameName.name,
                    type: scope.pipelineApp.frameType,
                    override: true,
                },
            };
        }

        /** Utility */

        /**
         * @name extractFromSelector
         * @desc extract table/column information from the selector
         * @param {*} tables - extracted tables
         * @param {*} selector - selector to look at
         * @param {*} ignore - ignore certain types
         */
        function extractFromSelector(
            tables,
            selector,
            ignore?: string[]
        ): void {
            const type = selector.type,
                content = selector.content;

            // this will allow us to ignore certain types
            if (ignore && ignore.indexOf(type) > -1) {
                return;
            }

            if (type === 'CONSTANT') {
                // noop
            } else if (type === 'COLUMN') {
                extractContent(tables, content);
            } else if (type === 'ARITHMETIC') {
                // extract the left
                extractFromSelector(tables, content.left[0]);

                // extract the right
                extractFromSelector(tables, content.right[0]);
            } else if (type === 'FUNCTION') {
                // extract the inner ones
                for (
                    let selectorIdx = 0,
                        selectorLen = content.innerSelectors.length;
                    selectorIdx < selectorLen;
                    selectorIdx++
                ) {
                    extractFromSelector(
                        tables,
                        content.innerSelectors[selectorIdx]
                    );
                }
            } else if (type === 'IF_ELSE') {
                // extract the condition (this is always a filter type)
                extractFromFilter(tables, content.condition, ignore);

                // extract the precedent
                extractFromSelector(tables, content.precedent);

                // extract the antecedent
                extractFromSelector(tables, content.antecedent);
            }
        }

        /**
         * @name extractFromGroup
         * @desc extract table/column information from the group
         * @param {*} tables - extracted tables
         * @param {*} group - group to look at
         */
        function extractFromGroup(tables, group): void {
            if (!group) {
                return;
            }

            let content;
            if (typeof group === 'string') {
                content = JSON.parse(group);
            } else {
                content = group;
            }

            if (Object.keys(content).length > 0) {
                extractFromSelector(tables, content.content);
            }
        }

        /**
         * @name extractFromFilter
         * @desc extract table/column information from the filter
         * @param {*} tables - extracted tables
         * @param {*} filter - filter to look at
         * @param {*} ignore - ignore certain types
         * @returns {void}
         */
        function extractFromFilter(tables, filter, ignore?: string[]) {
            const type = filter.type,
                content = filter.content;

            if (type === 'OR' || type === 'AND') {
                for (
                    let childIdx = 0, childLen = content.length;
                    childIdx < childLen;
                    childIdx++
                ) {
                    extractFromFilter(tables, content[childIdx]);
                }
            } else if (type === 'SIMPLE') {
                const chunks = [content.left, content.right];

                while (chunks.length > 0) {
                    const chunk = chunks.shift();

                    if (!chunk) {
                        continue;
                    }

                    if (chunk.pixelType === 'COLUMN') {
                        extractFromSelector(tables, chunk.value[0], ignore);
                    } else if (
                        chunk.pixelType === 'BOOLEAN' ||
                        chunk.pixelType === 'NULL_VALUE' ||
                        chunk.pixelType === 'CONST_STRING' ||
                        chunk.pixelType === 'CONST_INT' ||
                        chunk.pixelType === 'CONST_DATE' ||
                        chunk.pixelType === 'CONST_DECIMAL' ||
                        chunk.pixelType === 'LAMBDA'
                    ) {
                        // noop
                    }
                }
            }
        }

        /**
         * @name extractContent
         * @desc extract table/column information from the filter
         * @param {*} tables - extracted tables
         * @param {*} content - content
         */
        function extractContent(tables, content): void {
            if (!tables.hasOwnProperty(content.table)) {
                // create the table
                tables[content.table] = {};
            }

            if (!tables[content.table].hasOwnProperty(content.column)) {
                tables[content.table][content.column] = [];
            }
        }

        /**
         * @name isSelectorAggregation
         * @desc check if the selector has an aggregation
         * @param {*} selector - selector to look at
         */
        function isSelectorAggregation(selector): boolean {
            const type = selector.type,
                content = selector.content;

            if (type === 'CONSTANT') {
                return false;
            } else if (type === 'COLUMN') {
                return false;
            } else if (type === 'ARITHMETIC') {
                return (
                    isSelectorAggregation(content.left[0]) ||
                    isSelectorAggregation(content.right[0])
                );
            } else if (type === 'FUNCTION') {
                return true;
            } else if (type === 'IF_ELSE') {
                return (
                    isFilterAggregation(content.condition) ||
                    isSelectorAggregation(content.precedent) ||
                    isSelectorAggregation(content.antecedent)
                );
            }

            return false;
        }

        /**
         * @name isFilterAggregation
         * @desc check if the filter has an aggregation
         * @param {*} filter - filter to look at
         */
        function isFilterAggregation(filter): boolean {
            const type = filter.type,
                content = filter.content;

            if (type === 'OR' || type === 'AND') {
                for (
                    let childIdx = 0, childLen = content.length;
                    childIdx < childLen;
                    childIdx++
                ) {
                    const aggregate = isFilterAggregation(content[childIdx]);

                    if (aggregate) {
                        return true;
                    }
                }
            } else if (type === 'SIMPLE') {
                const chunks = [content.left, content.right];

                while (chunks.length > 0) {
                    const chunk = chunks.shift();

                    if (!chunk) {
                        continue;
                    }

                    if (chunk.pixelType === 'COLUMN') {
                        const aggregate = isSelectorAggregation(chunk.value[0]);

                        if (aggregate) {
                            return true;
                        }
                    } else if (
                        chunk.pixelType === 'BOOLEAN' ||
                        chunk.pixelType === 'NULL_VALUE' ||
                        chunk.pixelType === 'CONST_STRING' ||
                        chunk.pixelType === 'CONST_INT' ||
                        chunk.pixelType === 'CONST_DATE' ||
                        chunk.pixelType === 'CONST_DECIMAL' ||
                        chunk.pixelType === 'LAMBDA'
                    ) {
                        // noop
                    }
                }
            }

            return false;
        }

        /**
         * @name flattenSelector
         * @desc Takes the selected selector and flattens it
         * @param selector - current selector
         * @returns the final flattened selector
         */
        function flattenSelector(selector: any): string {
            if (!selector) {
                return '';
            }

            const { type, content } = selector;

            if (type === 'FUNCTION') {
                return `<h6 class="smss-color--primary" style="display: inline">${
                    selector.content.function
                }</h6> (${content.innerSelectors
                    .map((s) => {
                        return flattenSelector(s);
                    })
                    .join('')}) `;
            } else if (type === 'ARITHMETIC') {
                return ` (${flattenSelector(content.left[0])} ${
                    content.mathExpr
                } ${flattenSelector(content.right[0])}) `;
            } else if (type === 'COLUMN') {
                if (content.column === 'PRIM_KEY_PLACEHOLDER') {
                    return String(content.table).replace(/_/g, ' ');
                } else {
                    return String(content.column).replace(/_/g, ' ');
                }
            } else if (type === 'CONSTANT') {
                if (typeof content.constant === 'number') {
                    return content.constant;
                }

                return `"${content.constant}"`;
            } else if (type === 'IF_ELSE') {
                return `If (${flattenFilter(
                    content.condition
                )}, ${flattenSelector(content.precedent)}, ${flattenSelector(
                    content.antecedent
                )}) `;
            }

            return '';
        }

        /**
         * @name flattenFilter
         * @desc Takes the selected filter and flattens it
         * @param filter - current filter
         * @returns the final flattened filter
         */
        function flattenFilter(filter: any): string {
            if (!filter) {
                return '';
            }

            const type = filter.type,
                content = filter.content;

            if (type === 'OR' || type === 'AND') {
                if (!content || content.length === 0) {
                    return '';
                }

                return content.map((c) => flattenFilter(c)).join('');
            } else if (type === 'SIMPLE') {
                const components: string[] = [],
                    chunks = [content.left, content.right];

                while (chunks.length > 0) {
                    let chunk = chunks.shift(),
                        component = '';

                    if (!chunk) {
                        continue;
                    }

                    if (chunk.pixelType === 'COLUMN') {
                        component = flattenSelector(chunk.value[0]);
                    } else if (
                        chunk.pixelType === 'BOOLEAN' ||
                        chunk.pixelType === 'NULL_VALUE' ||
                        chunk.pixelType === 'CONST_STRING' ||
                        chunk.pixelType === 'CONST_INT' ||
                        chunk.pixelType === 'CONST_DATE' ||
                        chunk.pixelType === 'CONST_DECIMAL' ||
                        chunk.pixelType === 'LAMBDA'
                    ) {
                        component = Array.isArray(chunk.value)
                            ? chunk.value
                                  .map((c) => {
                                      return String(c) ? String(c) : '""';
                                  })
                                  .join(', ')
                                  .replace(/_/g, ' ')
                            : String(chunk.value).replace(/_/g, ' ');
                    }

                    if (component) {
                        components.push(component);
                    }
                }

                return `${components[0] || ''}  ${content.comparator} ${
                    components[1] || ''
                }`;
            }

            return '';
        }

        /**
         * @name getTypeInformation
         * @param type - data type to set
         * @param typeFormat - typeFormat
         * @returns map containing the type information
         */
        function getTypeInformation(
            type: string,
            typeFormat: string
        ): { type: string; typeFormat: string } {
            let newType = type,
                newTypeFormat = typeFormat;

            if (newType === 'INT' || newType === 'DOUBLE') {
                // ui considers int and double a type format for number,
                newTypeFormat = type;
                newType = 'NUMBER';
            }

            if (
                (newType === 'DATE' || newType === 'TIMESTAMP') &&
                !typeFormat
            ) {
                // needs type format, must tell user
            }

            if (!newType) {
                newType = 'STRING';
                newTypeFormat = '';
            }

            return {
                type: newType,
                typeFormat: newTypeFormat,
            };
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            // no type, force it
            if (!scope.pipelineApp.type) {
                scope.pipelineApp.type = 'database';
            }

            const selectPreviewListener = scope.widgetCtrl.on(
                'select-preview',
                function (selected) {
                    if (selected && selected.length > 0) {
                        // check queue
                        for (
                            let tableIdx = 0,
                                tableLen =
                                    scope.pipelineApp.selected.queue.length;
                            tableIdx < tableLen;
                            tableIdx++
                        ) {
                            for (
                                let colIdx = 0,
                                    colLen =
                                        scope.pipelineApp.selected.queue[
                                            tableIdx
                                        ].columns.length;
                                colIdx < colLen;
                                colIdx++
                            ) {
                                if (
                                    scope.pipelineApp.selected.queue[tableIdx]
                                        .columns[colIdx].alias ===
                                    selected[0].display
                                ) {
                                    updateTraversal(tableIdx);
                                    return;
                                }
                            }
                        }
                    }
                }
            );

            const totalCountListener = scope.widgetCtrl.on(
                'preview-total-count',
                function (payload) {
                    scope.pipelineApp.totalCount = payload.data;
                }
            );

            contentEle = ele[0].querySelector('#pipeline-app__content');
            leftEle = ele[0].querySelector('#pipeline-app__content__left');
            rightEle = ele[0].querySelector('#pipeline-app__content__right');

            // add the resize events
            resizable = Resizable({
                available: ['W'],
                container: contentEle,
                content: rightEle,
                unit: '%',
                restrict: {
                    minimumWidth: '20%',
                    maximumWidth: '70%',
                },
                start: function () {
                    // trigger digest
                    $timeout();
                },
                on: function () {},
                stop: function (top, left, height, width) {
                    leftEle.style.right = `${100 - left}%`;
                },
            });

            // set the source
            setSource();

            // update the recommendations
            updateFrameRecommendations();

            scope.$on('$destroy', function () {
                selectPreviewListener();

                totalCountListener();

                // remove the resizable;
                if (resizable) {
                    resizable.destroy();
                }
            });
        }

        initialize();
    }
}
