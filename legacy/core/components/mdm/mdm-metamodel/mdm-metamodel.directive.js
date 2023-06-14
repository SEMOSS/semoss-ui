'use strict';

import angular from 'angular';
import jsPlumb from 'jsplumb';
import panzoom from 'panzoom';
import Movable from '../../../utility/movable-old.ts';

import './mdm-metamodel.scss';

export default angular
    .module('app.mdm-metamodel.directive', [])
    .directive('mdmMetamodel', mdmMetamodelDirective);

mdmMetamodelDirective.$inject = ['$timeout', '$compile', 'semossCoreService'];

function mdmMetamodelDirective($timeout, $compile, semossCoreService) {
    mdmMetamodelCtrl.$inject = [];
    mdmMetamodelLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./mdm-metamodel.directive.html'),
        scope: {},
        require: ['^mdm'],
        controllerAs: 'mdmMetamodel',
        bindToController: {},
        controller: mdmMetamodelCtrl,
        link: mdmMetamodelLink,
    };

    function mdmMetamodelCtrl() {}

    function mdmMetamodelLink(scope, ele, attrs, ctrl) {
        scope.mdmCtrl = ctrl[0];

        var metamodelGraphEle, metamodelScope, plumbing, zoom;

        scope.mdmMetamodel.loading = false;

        scope.mdmMetamodel.movable = {};

        scope.mdmMetamodel.accordionSettings = {
            first: {
                name: 'Metamodel',
                height: 100,
                disabled: false,
            },
            second: {
                name: 'Select a Concept for Details',
                height: 0,
                disabled: true,
            },
        };

        scope.mdmMetamodel.concepts = {
            initialized: false,
            searched: '',
            nodes: [],
            edges: [],
            selected: false,
        };

        scope.mdmMetamodel.description = {
            current: '',
            new: '',
        };

        scope.mdmMetamodel.logical = {
            current: [],
            new: [],
            add: '',
        };

        scope.mdmMetamodel.searchMetamodel = searchMetamodel;
        scope.mdmMetamodel.selectConcept = selectConcept;
        scope.mdmMetamodel.setConceptView = setConceptView;
        scope.mdmMetamodel.resetDescription = resetDescription;
        scope.mdmMetamodel.predictDescription = predictDescription;
        scope.mdmMetamodel.updateDescription = updateDescription;
        scope.mdmMetamodel.resetLogical = resetLogical;
        scope.mdmMetamodel.predictLogical = predictLogical;
        scope.mdmMetamodel.addLogical = addLogical;
        scope.mdmMetamodel.removeLogical = removeLogical;
        scope.mdmMetamodel.updateLogical = updateLogical;
        /** Database Functions */
        /**
         * @name setDatabaseMetamodel
         * @desc gets gets the database's metamodel
         * @return {void}
         */
        function setDatabaseMetamodel() {
            var i, j, len, len2, temp;

            // clear out concepts
            scope.mdmMetamodel.concepts = {
                initialized: false,
                searched: '',
                nodes: [],
                edges: [],
                selected: false,
            };

            if (scope.mdmCtrl.metamodel.nodeProp) {
                for (
                    i = 0, len = scope.mdmCtrl.metamodel.nodeProp.length;
                    i < len;
                    i++
                ) {
                    temp = {
                        table: scope.mdmCtrl.metamodel.nodeProp[i]
                            .conceptualName,
                        columns: [],
                        position:
                            scope.mdmCtrl.metamodel.positions &&
                            scope.mdmCtrl.metamodel.positions[
                                scope.mdmCtrl.metamodel.nodeProp[i]
                                    .conceptualName
                            ]
                                ? scope.mdmCtrl.metamodel.positions[
                                      scope.mdmCtrl.metamodel.nodeProp[i]
                                          .conceptualName
                                  ]
                                : {
                                      top: 0,
                                      left: 0,
                                  },
                    };

                    if (scope.mdmCtrl.metamodel.nodeProp[i].keySet) {
                        for (
                            j = 0,
                                len2 =
                                    scope.mdmCtrl.metamodel.nodeProp[i].keySet
                                        .length;
                            j < len2;
                            j++
                        ) {
                            temp.columns.push({
                                column: scope.mdmCtrl.metamodel.nodeProp[i]
                                    .keySet[j],
                                table: scope.mdmCtrl.metamodel.nodeProp[i]
                                    .conceptualName,
                                conceptualName:
                                    scope.mdmCtrl.metamodel.nodeProp[i]
                                        .conceptualName +
                                    '__' +
                                    scope.mdmCtrl.metamodel.nodeProp[i].keySet[
                                        j
                                    ],
                                isPrimKey: true,
                            });
                        }
                    }

                    if (scope.mdmCtrl.metamodel.nodeProp[i].propSet) {
                        for (
                            j = 0,
                                len2 =
                                    scope.mdmCtrl.metamodel.nodeProp[i].propSet
                                        .length;
                            j < len2;
                            j++
                        ) {
                            temp.columns.push({
                                column: scope.mdmCtrl.metamodel.nodeProp[i]
                                    .propSet[j],
                                table: scope.mdmCtrl.metamodel.nodeProp[i]
                                    .conceptualName,
                                conceptualName:
                                    scope.mdmCtrl.metamodel.nodeProp[i]
                                        .conceptualName +
                                    '__' +
                                    scope.mdmCtrl.metamodel.nodeProp[i].propSet[
                                        j
                                    ],
                                isPrimKey: false,
                            });
                        }
                    }

                    scope.mdmMetamodel.concepts.nodes.push(temp);
                }
            }

            if (scope.mdmCtrl.metamodel.relationProp) {
                for (
                    i = 0, len = scope.mdmCtrl.metamodel.relationProp.length;
                    i < len;
                    i++
                ) {
                    temp =
                        scope.mdmCtrl.metamodel.relationProp[i].rel.split('.');

                    scope.mdmMetamodel.concepts.edges.push({
                        sourceTable: temp[0],
                        sourceColumn: temp[1],
                        sourceConceptual: temp[0] + '__' + temp[1],
                        targetTable: temp[2],
                        targetColumn: temp[3],
                        targetConceptual: temp[2] + '__' + temp[3],
                        rel: scope.mdmCtrl.metamodel.relationProp[i].rel,
                    });
                }
            }

            drawMetamodel();
        }

        /** Metamodel Functions */
        /**
         * @name drawMetamodel
         * @desc draw the metamodel
         * @returns {void}
         */
        function drawMetamodel() {
            let html, eles;

            // destroy it before creating it
            destroyMetamodel();

            html = '';

            // generate the html
            // add the table
            html += '<div>';
            for (
                let tableIdx = 0,
                    tableLen = scope.mdmMetamodel.concepts.nodes.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                html += generateTable(
                    scope.mdmMetamodel.concepts.nodes[tableIdx],
                    tableIdx
                );
            }
            html += '</div>';

            // create a new scope
            metamodelScope = scope.$new();

            // mount and compile
            metamodelGraphEle.appendChild(angular.element(html)[0]);
            $compile(metamodelGraphEle)(metamodelScope);

            eles = {};
            for (
                let tableIdx = 0,
                    tableLen = scope.mdmMetamodel.concepts.nodes.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                eles[scope.mdmMetamodel.concepts.nodes[tableIdx].table] =
                    metamodelGraphEle.querySelector(
                        `#mdm-metamodel__graph__table--${scope.mdmMetamodel.concepts.nodes[tableIdx].table}`
                    );

                // add movable
                scope.mdmMetamodel.movable[
                    scope.mdmMetamodel.concepts.nodes[tableIdx].table
                ] = Movable({
                    handle: eles[
                        scope.mdmMetamodel.concepts.nodes[tableIdx].table
                    ],
                    content:
                        eles[scope.mdmMetamodel.concepts.nodes[tableIdx].table],
                    container: metamodelGraphEle,
                    restrict: {
                        top: -Infinity,
                        right: -Infinity,
                        bottom: -Infinity,
                        left: -Infinity,
                    },
                    on: () => {
                        // noop
                    },
                    stop: () => {
                        plumbing.revalidate(
                            eles[
                                scope.mdmMetamodel.concepts.nodes[tableIdx]
                                    .table
                            ]
                        );
                    },
                });
            }

            // add edges
            for (
                let edgeIdx = 0,
                    edgeLen = scope.mdmMetamodel.concepts.edges.length;
                edgeIdx < edgeLen;
                edgeIdx++
            ) {
                plumbing.connect({
                    source: eles[
                        scope.mdmMetamodel.concepts.edges[edgeIdx].sourceTable
                    ],
                    target: eles[
                        scope.mdmMetamodel.concepts.edges[edgeIdx].targetTable
                    ],
                    detachable: false,
                    anchor: 'AutoDefault',
                    endpoint: 'Blank',
                    connectionsDetachable: false,
                    maxConnections: -1,
                    connector: [
                        'Flowchart',
                        {
                            cssClass: 'metamodel__graph__edge__connector',
                        },
                    ],
                });
            }
        }

        /**
         * @name destroyMetamodel
         * @desc destroy the metamodel
         * @returns {void}
         */
        function destroyMetamodel() {
            // remove connections
            if (plumbing) {
                plumbing.reset();
            }

            // remove movable
            for (let id in scope.mdmMetamodel.movable) {
                if (scope.mdmMetamodel.movable.hasOwnProperty(id)) {
                    scope.mdmMetamodel.movable[id].destroy();
                }
            }

            // destroy the old scope
            if (metamodelScope) {
                metamodelScope.$destroy();
            }

            // remove the eles
            if (metamodelGraphEle) {
                while (metamodelGraphEle.firstChild) {
                    if (metamodelGraphEle.lastChild) {
                        metamodelGraphEle.removeChild(
                            metamodelGraphEle.lastChild
                        );
                    }
                }
            }
        }

        /**
         * @name searchMetamodel
         * @desc search the metamodel
         * @returns {void}
         */
        function searchMetamodel() {
            if (metamodelGraphEle) {
                let tables =
                    metamodelGraphEle.querySelectorAll('[metamodel-alias]') ||
                    [];
                const len = tables.length;
                if (len > 0) {
                    let searchString =
                        scope.mdmMetamodel.concepts.searched || '';
                    searchString = searchString
                        .toUpperCase()
                        .replace(/ /g, '_');

                    for (let i = 0; i < len; i++) {
                        // clear the old
                        let temp =
                            tables[i].getAttribute('metamodel-alias') || '';
                        temp = temp.toUpperCase().replace(/ /g, '_');

                        if (
                            temp.indexOf(searchString) === -1 ||
                            !searchString
                        ) {
                            tables[i].style.backgroundColor = 'transparent';
                        } else {
                            tables[i].style.backgroundColor = '#fff9e9';
                        }
                    }
                }
            }
        }

        /**
         * @name highlightMetamodel
         * @param {object} payload - {}
         * @desc update the highlight
         * @returns {void}
         */
        function highlightMetamodel(payload) {
            if (metamodelGraphEle) {
                let tables =
                    metamodelGraphEle.querySelectorAll('[metamodel-alias]') ||
                    [];
                const len = tables.length;

                if (len > 0) {
                    for (let i = 0; i < len; i++) {
                        // clear the old
                        let temp =
                            tables[i].getAttribute('metamodel-alias') || '';
                        temp = temp.toUpperCase().replace(/ /g, '_');

                        if (payload.source === temp) {
                            tables[i].style.outline = '2px solid #278DD3';
                        } else if (payload.target === temp) {
                            tables[i].style.outline = '2px solid #278DD3';
                        } else {
                            tables[i].style.outline = 'inherit';
                        }
                    }
                }
            }
        }

        /**
         * @name generateTable
         * @param {*} table - table to create
         * @param {number} tableIdx - index
         * @desc generates a label for the selected table
         * @return {string} the html for the table
         */
        function generateTable(table, tableIdx) {
            let labelHolder = '';

            labelHolder += `<div id="mdm-metamodel__graph__table--${
                table.table
            }"
                            class="mdm-metamodel__graph__table"
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

            labelHolder += `<div class="mdm-metamodel__graph__table__item mdm-metamodel__graph__table__item--border"
                    title="${table.table}"
                    metamodel-alias="${table.table}"> 
                <div class="mdm-metamodel__graph__table__item__icon">
                    <i class="fa fa-table"></i>
                </div>
                <div class="mdm-metamodel__graph__table__item__text">
                    <span>${table.table}</span>
                </div>
            </div>`;

            // column list
            for (
                let columnIdx = 0, columnLen = table.columns.length;
                columnIdx < columnLen;
                columnIdx++
            ) {
                labelHolder += `<div class="mdm-metamodel__graph__table__item" 
                        title="Select Concept: ${
                            table.columns[columnIdx].column
                        }"
                        metamodel-alias="${table.columns[columnIdx].column}"
                        ng-class="{'smss-border--primary': mdmMetamodel.concepts.selected.data.conceptualName === '${
                            table.columns[columnIdx].conceptualName
                        }'}"
                        ng-click="mdmMetamodel.selectConcept(${tableIdx}, ${columnIdx})">
                        <div class="mdm-metamodel__graph__table__item__icon">
                            ${
                                table.columns[columnIdx].isPrimKey
                                    ? '<i class="fa fa-key"></i>'
                                    : ''
                            }
                        </div>
                        <div class="mdm-metamodel__graph__table__item__text">
                            <span>${table.columns[columnIdx].column}</span>
                        </div>
                        <smss-btn class="smss-btn--icon" title="Edit Column: ${
                            table.columns[columnIdx].column
                        }" ng-click="metamodel.editMetamodel('column', {'table':'${
                    table.table
                }', 'column': '${table.columns[columnIdx].column}'})">
                            <i class="fa " ng-class="{'fa-check smss-color--success': mdmMetamodel.concepts.selected.data.conceptualName === '${
                                table.columns[columnIdx].conceptualName
                            }', 'fa-plus': mdmMetamodel.concepts.selected.data.conceptualName !== '${
                    table.columns[columnIdx].conceptualName
                }'}"></i>
                        </smss-btn>
                    </div>`;
            }
            labelHolder += '</div>';

            return labelHolder;
        }

        /** Concept Functions */
        /**
         * @name selectConcept
         * @desc selects a concept to grab data about
         * @param {string} tableIdx - selected table idx
         * @param {string} columnIdx - selected column idx
         * @return {void}
         */
        function selectConcept(tableIdx, columnIdx) {
            if (
                scope.mdmMetamodel.concepts.nodes[tableIdx] === 'undefined' ||
                scope.mdmMetamodel.concepts.nodes[tableIdx].columns[
                    columnIdx
                ] === 'undefined'
            ) {
                console.error('Cannot find the selected table or column');
                return;
            }

            // set the selected
            scope.mdmMetamodel.concepts.selected = {
                data: scope.mdmMetamodel.concepts.nodes[tableIdx].columns[
                    columnIdx
                ],
                view: 'description',
            };

            // set the view
            setConceptView('description');

            // change accordion
            scope.mdmMetamodel.accordionSettings.second.name =
                'Selected Concept: ' +
                scope.mdmMetamodel.concepts.selected.data.table +
                '.' +
                scope.mdmMetamodel.concepts.selected.data.column;
            scope.mdmMetamodel.accordionSettings.second.disabled = false;
        }

        /**
         * @name setConceptView
         * @desc sets the view for the selected convept
         * @param {name} view - view to set
         * @return {void}
         */
        function setConceptView(view) {
            // set the selected
            scope.mdmMetamodel.concepts.selected.view = view;
            if (scope.mdmMetamodel.concepts.selected.view === 'description') {
                getDescription();
            } else if (
                scope.mdmMetamodel.concepts.selected.view === 'logical'
            ) {
                // get logical names
                getLogicalNames();
            } else if (
                scope.mdmMetamodel.concepts.selected.view === 'instances'
            ) {
                // get instances
                // done by directive
            }
        }

        /**
         * @name getDescription
         * @desc get description
         * @return {void}
         */
        function getDescription() {
            var message = semossCoreService.utility.random('meta-pixel'),
                pixel = '';
            // clear out description
            scope.mdmMetamodel.description = {
                current: '',
                new: '',
            };

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    description = output[0] || '';

                scope.mdmMetamodel.description = {
                    current: description,
                    new: description,
                };
            });

            if (scope.mdmMetamodel.concepts.selected.data.isPrimKey) {
                pixel +=
                    'GetOwlDescriptions(database=["' +
                    scope.mdmCtrl.appId +
                    '"], concept=["' +
                    scope.mdmMetamodel.concepts.selected.data.table +
                    '"]);';
            } else {
                pixel +=
                    'GetOwlDescriptions(database=["' +
                    scope.mdmCtrl.appId +
                    '"], concept=["' +
                    scope.mdmMetamodel.concepts.selected.data.table +
                    '"], column=["' +
                    scope.mdmMetamodel.concepts.selected.data.column +
                    '"]);';
            }

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        meta: true,
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name resetDescription
         * @desc reset the description
         * @return {void}
         */
        function resetDescription() {
            scope.mdmMetamodel.description.new =
                scope.mdmMetamodel.description.current;
        }

        /**
         * @name predictDescription
         * @desc predict the description
         * @param {number} idx - index to predict
         * @return {void}
         */
        function predictDescription() {
            var pixel = '',
                message;

            if (scope.mdmMetamodel.concepts.selected.data.isPrimKey) {
                pixel +=
                    'PredictOwlDescription(database=["' +
                    scope.mdmCtrl.appId +
                    '"], concept=["' +
                    scope.mdmMetamodel.concepts.selected.data.table +
                    '"]);';
            } else {
                pixel +=
                    'PredictOwlDescription(database=["' +
                    scope.mdmCtrl.appId +
                    '"], concept=["' +
                    scope.mdmMetamodel.concepts.selected.data.table +
                    '"], column=["' +
                    scope.mdmMetamodel.concepts.selected.data.column +
                    '"]);';
            }

            message = semossCoreService.utility.random('meta');
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (output[0]) {
                    scope.mdmMetamodel.description.new = output[0];
                }
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name updateDescription
         * @desc update the description
         * @return {void}
         */
        function updateDescription() {
            var message = semossCoreService.utility.random('meta-pixel'),
                components = [];

            if (!scope.mdmMetamodel.description.new) {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Description is needed',
                });
                return;
            }

            if (
                !scope.mdmMetamodel.description.new ===
                scope.mdmMetamodel.description.current
            ) {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Description did not change',
                });
            }

            // register message to come back to
            semossCoreService.once(message, function () {
                getDescription();
            });

            components.push({
                type: 'editOwlDescription',
                components: [
                    scope.mdmCtrl.appId,
                    scope.mdmMetamodel.concepts.selected.data.table,
                    scope.mdmMetamodel.concepts.selected.data.isPrimKey
                        ? false
                        : scope.mdmMetamodel.concepts.selected.data.column,
                    scope.mdmMetamodel.description.new,
                ],
                meta: true,
                terminal: true,
            });

            if (components.length === 0) {
                return;
            }

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: components,
                response: message,
            });
        }

        /**
         * @name getLogicalNames
         * @desc get a list of the logical names
         * @returns {void}
         */
        function getLogicalNames() {
            var message = semossCoreService.utility.random('meta-pixel'),
                pixel = '';
            // clear out logical
            scope.mdmMetamodel.logical = {
                current: [],
                new: [],
            };

            // TODO: cleanup I know this is bad
            if (scope.mdmMetamodel.concepts.selected.data.isPrimKey) {
                pixel +=
                    'GetOwlLogicalNames(database=["' +
                    scope.mdmCtrl.appId +
                    '"], concept=["' +
                    scope.mdmMetamodel.concepts.selected.data.table +
                    '"]);';
            } else {
                pixel +=
                    'GetOwlLogicalNames(database=["' +
                    scope.mdmCtrl.appId +
                    '"], concept=["' +
                    scope.mdmMetamodel.concepts.selected.data.table +
                    '"], column=["' +
                    scope.mdmMetamodel.concepts.selected.data.column +
                    '"]);';
            }

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    sorted = output.sort(),
                    i,
                    len;

                for (i = 0, len = sorted.length; i < len; i++) {
                    if (
                        sorted[i] !==
                        scope.mdmMetamodel.concepts.selected.data.column
                    ) {
                        scope.mdmMetamodel.logical.current.push(sorted[i]);
                        scope.mdmMetamodel.logical.new.push(sorted[i]);
                    }
                }
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name resetLogical
         * @desc reset the logical
         * @return {void}
         */
        function resetLogical() {
            // reset it
            scope.mdmMetamodel.logical.new = JSON.parse(
                JSON.stringify(scope.mdmMetamodel.logical.current)
            );
            scope.mdmMetamodel.logical.add = '';
        }

        /**
         * @name predictLogical
         * @desc predict the logical
         * @return {void}
         */
        function predictLogical() {
            var pixel = '',
                message;

            if (scope.mdmMetamodel.concepts.selected.data.isPrimKey) {
                pixel +=
                    'PredictOwlLogicalNames(database=["' +
                    scope.mdmCtrl.appId +
                    '"], concept=["' +
                    scope.mdmMetamodel.concepts.selected.data.table +
                    '"]);';
            } else {
                pixel +=
                    'PredictOwlLogicalNames(database=["' +
                    scope.mdmCtrl.appId +
                    '"], concept=["' +
                    scope.mdmMetamodel.concepts.selected.data.table +
                    '"], column=["' +
                    scope.mdmMetamodel.concepts.selected.data.column +
                    '"]);';
            }

            message = semossCoreService.utility.random('meta');
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                scope.mdmMetamodel.logical.new =
                    scope.mdmMetamodel.logical.new.concat(output);
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name addLogical
         * @desc add a new logical
         * @returns {void}
         */
        function addLogical() {
            if (validateLogical(scope.mdmMetamodel.logical.add)) {
                scope.mdmMetamodel.logical.new.push(
                    scope.mdmMetamodel.logical.add
                );

                // clear
                scope.mdmMetamodel.logical.add = '';
            }
        }

        /**
         * @name removeLogical
         * @desc remove a logical
         * @param {number} idx - value's idx to remove
         * @returns {void}
         */
        function removeLogical(idx) {
            scope.mdmMetamodel.logical.new.splice(idx, 1);
        }

        /**
         * @name validateLogical
         * @desc validate the logical values
         * @param {string} value - name to validate
         * @returns {boolean} is the logical valid?
         */
        function validateLogical(value) {
            var i, len;

            if (!value) {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Value is needed',
                });
                return false;
            }

            for (
                i = 0, len = scope.mdmMetamodel.logical.new.length;
                i < len;
                i++
            ) {
                if (scope.mdmMetamodel.logical.new[i] === value) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Value already exists: ' + value,
                    });
                    return false;
                }
            }

            for (
                i = 0, len = scope.mdmMetamodel.logical.current.length;
                i < len;
                i++
            ) {
                if (scope.mdmMetamodel.logical.current[i] === value) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Value already added: ' + value,
                    });
                    return false;
                }
            }

            return true;
        }

        /**
         * @name updateLogical
         * @desc update the logical names
         * @return {void}
         */
        function updateLogical() {
            var components = [],
                message = semossCoreService.utility.random('meta-pixel');

            if (
                JSON.stringify(scope.mdmMetamodel.logical.current) ===
                JSON.stringify(scope.mdmMetamodel.logical.new)
            ) {
                return;
            }

            components.push({
                type: 'editOwlLogicalNames',
                components: [
                    scope.mdmCtrl.appId,
                    scope.mdmMetamodel.concepts.selected.data.table,
                    scope.mdmMetamodel.concepts.selected.data.isPrimKey
                        ? false
                        : scope.mdmMetamodel.concepts.selected.data.column,
                    scope.mdmMetamodel.logical.new,
                ],
                meta: true,
                terminal: true,
            });

            if (components.length === 0) {
                return;
            }

            // register message to come back to
            semossCoreService.once(message, function () {
                getLogicalNames();
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: components,
                response: message,
            });
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var mdmHighlightListener;

            mdmHighlightListener = semossCoreService.on(
                'mdm-highlight',
                highlightMetamodel
            );

            $timeout(function () {
                metamodelGraphEle = ele[0].querySelector(
                    '#mdm-metamodel__graph'
                );

                // set up the plumbing
                plumbing = jsPlumb.jsPlumb.getInstance({
                    Container: metamodelGraphEle,
                });

                // add panzoom
                zoom = panzoom(metamodelGraphEle);

                scope.$on('$destroy', function () {
                    mdmHighlightListener();

                    destroyMetamodel();

                    if (plumbing) {
                        plumbing.reset();
                    }

                    if (zoom) {
                        zoom.dispose();
                    }
                });

                scope.$watch(
                    'mdmCtrl.metamodel',
                    function (newValue, oldValue) {
                        if (
                            JSON.stringify(newValue) !==
                            JSON.stringify(oldValue)
                        ) {
                            setDatabaseMetamodel();
                        }
                    }
                );

                setDatabaseMetamodel();
            });
        }

        initialize();
    }
}
