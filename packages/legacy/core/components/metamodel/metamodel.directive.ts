'use strict';

import angular from 'angular';
import jsPlumb from 'jsplumb';
import panzoom from 'panzoom';
import Movable from '../../utility/movable-old';

import './metamodel.scss';

import './metamodel-tables/metamodel-tables.directive';
import './metamodel-relationships/metamodel-relationships.directive';
import './metamodel-table/metamodel-table.directive';
import './metamodel-column/metamodel-column.directive';
import './metamodel-column-table/metamodel-column-table.directive';

export default angular
    .module('app.metamodel.directive', [
        'app.metamodel.metamodel-tables',
        'app.metamodel.metamodel-relationships',
        'app.metamodel.metamodel-table',
        'app.metamodel.metamodel-column',
        'app.metamodel.metamodel-column-table',
    ])
    .directive('metamodel', metamodelDirective);

metamodelDirective.$inject = ['$compile', '$timeout'];

function metamodelDirective(
    $compile: ng.ICompileService,
    $timeout: ng.ITimeoutService
) {
    metamodelCtrl.$inject = [];
    metamodelLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./metamodel.directive.html'),
        scope: {},
        controllerAs: 'metamodel',
        bindToController: {
            metamodel: '=',
            type: '=',
            edit: '&?',
            hideControls: '=?',
            hideDelete: '=?',
        },
        controller: metamodelCtrl,
        link: metamodelLink,
    };

    function metamodelCtrl() {}

    function metamodelLink(scope, ele, attrs, ctrl) {
        let metamodelGraphEle: HTMLElement,
            metamodelEle: HTMLElement,
            metamodelScope,
            matchArray: any[] = [],
            plumbing,
            zoom,
            watch;

        scope.metamodel.searched = '';
        scope.metamodel.movable = {};
        scope.metamodel.searchMetamodel = searchMetamodel;
        scope.metamodel.editMetamodel = editMetamodel;
        scope.metamodel.tableZoom = tableZoom;
        scope.metamodel.switchTableZoom = switchTableZoom;

        /** Metamodel Functions */
        /**
         * @name drawMetamodel
         * @desc initialize the metamodel
         */
        function drawMetamodel(): void {
            scope.metamodel.loading = true;

            // since externalchanges will only be passed when editing an existing apps metamodel, if it is undefined set to false
            if (!scope.metamodel) {
                scope.metamodel = {};
                scope.metamodel.metamodel = {};
                scope.metamodel.metamodel.externalChangesApplied = false;
            } else if (!scope.metamodel.metamodel) {
                scope.metamodel.metamodel = {};
                scope.metamodel.metamodel.externalChangesApplied = false;
            } else if (
                !scope.metamodel.metamodel.hasOwnProperty(
                    'externalChangesApplied'
                )
            ) {
                scope.metamodel.metamodel.externalChangesApplied = false;
            }

            // destroy it before creating it
            destroyMetamodel();

            let html = '';

            // generate the html
            // add the table
            html += '<div>';
            for (const table in scope.metamodel.metamodel.tables) {
                if (scope.metamodel.metamodel.tables.hasOwnProperty(table)) {
                    html += generateTable(
                        scope.metamodel.metamodel.tables[table].table
                    );
                }
            }
            html += '</div>';

            // create a new scope
            metamodelScope = scope.$new();

            // mount and compile
            metamodelGraphEle.appendChild(angular.element(html)[0]);
            $compile(metamodelGraphEle)(metamodelScope);

            // store all of the eles and add the movable
            const eles = {};
            for (const table in scope.metamodel.metamodel.tables) {
                if (scope.metamodel.metamodel.tables.hasOwnProperty(table)) {
                    eles[scope.metamodel.metamodel.tables[table].table] =
                        metamodelGraphEle.querySelector(
                            `#metamodel__graph__table--${scope.metamodel.metamodel.tables[table].table}`
                        );

                    scope.metamodel.movable[
                        scope.metamodel.metamodel.tables[table].table
                    ] = Movable({
                        handle: eles[
                            scope.metamodel.metamodel.tables[table].table
                        ],
                        content:
                            eles[scope.metamodel.metamodel.tables[table].table],
                        container: metamodelGraphEle,
                        restrict: {
                            top: -Infinity,
                            right: -Infinity,
                            bottom: -Infinity,
                            left: -Infinity,
                        },
                        on: () => {
                            //noop
                        },
                        stop: (top: string, left: string) => {
                            // save in the data
                            removeWatch();

                            // if no position, add it
                            if (
                                !scope.metamodel.metamodel.tables[
                                    table
                                ].hasOwnProperty('position')
                            ) {
                                scope.metamodel.metamodel.tables[
                                    table
                                ].position = {
                                    top: 0,
                                    left: 0,
                                };
                            }

                            scope.metamodel.metamodel.tables[
                                table
                            ].position.top = top;
                            scope.metamodel.metamodel.tables[
                                table
                            ].position.left = left;

                            plumbing.revalidate(
                                eles[
                                    scope.metamodel.metamodel.tables[table]
                                        .table
                                ]
                            );

                            // new digest
                            $timeout(() => {
                                addWatch();
                            });
                        },
                    });
                }
            }

            // add edges
            if (scope.metamodel.metamodel.relationships) {
                for (
                    let edgeIdx = 0,
                        edgeLen =
                            scope.metamodel.metamodel.relationships.length;
                    edgeIdx < edgeLen;
                    edgeIdx++
                ) {
                    plumbing.connect({
                        source: eles[
                            scope.metamodel.metamodel.relationships[edgeIdx]
                                .fromTable
                        ],
                        target: eles[
                            scope.metamodel.metamodel.relationships[edgeIdx]
                                .toTable
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

            // now add the watch
            addWatch();

            scope.metamodel.loading = false;
        }

        /**
         * @name destroyMetamodel
         * @desc destroy the metamodel
         */
        function destroyMetamodel(): void {
            // remove watch
            removeWatch();

            // remove connections
            if (plumbing) {
                plumbing.reset();
            }

            // remove movable
            for (const id in scope.metamodel.movable) {
                if (scope.metamodel.movable.hasOwnProperty(id)) {
                    scope.metamodel.movable[id].destroy();
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
         * @name switchTableZoom
         * @param {event} $event - DOM event
         * @desc zoom to next table element when enter key pressed - handles keydown events for search element
         * @returns {void}
         */
        function switchTableZoom($event) {
            let firstSelection = true,
                lastTable;

            if ($event.keyCode === 13) {
                for (let i = 0; i < matchArray.length - 1; i++) {
                    const table = matchArray[i];
                    if (table.selected) {
                        firstSelection = false;
                        // reset old match
                        table.selected = false;
                        matchArray[i].tableEle.style.border = 'none';
                        // set next match
                        matchArray[i + 1].selected = true;
                        matchArray[i + 1].tableEle.style.border =
                            '1px solid #000000';
                        tableZoom(matchArray[i + 1]);
                        return;
                    }
                }
                // start loop over if last match is currently selected
                if (matchArray.length > 0) {
                    lastTable = matchArray[matchArray.length - 1];
                    if (lastTable.selected) {
                        lastTable.selected = false;
                        firstSelection = true;
                    }
                }
                // for first match or last match, select the first in the array
                if (matchArray.length > 0 && firstSelection) {
                    matchArray[0].selected = true;
                    matchArray[0].tableEle.style.border = '1px solid #000000';
                    tableZoom(matchArray[0]);
                }
            }
        }

        /**
         * @name tableZoom
         * @desc move the zoom to the next search match
         */
        function tableZoom(table): void {
            const clientRect = table.tableEle.getBoundingClientRect();
            let cx = clientRect.left + clientRect.width / 2;
            let cy = clientRect.top + clientRect.height / 2;

            const container = metamodelEle.getBoundingClientRect();
            cx = cx - container.left;
            cy = cy - container.top;
            const dx = container.width / 2 - cx;
            const dy = container.height / 2 - cy;

            zoom.moveBy(dx, dy, true);
        }

        /**
         * @name searchMetamodel
         * @desc search the metamodel
         */
        function searchMetamodel(): void {
            if (metamodelGraphEle) {
                const tables =
                    metamodelGraphEle.querySelectorAll<HTMLElement>(
                        '[metamodel-alias]'
                    ) || [];

                matchArray = [];
                const len = tables.length;
                if (len > 0) {
                    let searchString = scope.metamodel.searched || '';
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
                            tables[i].style.border = 'none';
                        } else {
                            tables[i].style.backgroundColor = '#ffff00';
                            const newColumn = {
                                column: temp,
                                tableEle: tables[i],
                                selected: false,
                            };
                            // add exact matches to the top
                            if (temp === searchString) {
                                matchArray.unshift(newColumn);
                            } else {
                                matchArray.push(newColumn);
                            }
                        }
                    }
                }
            }
        }

        /**
         * @name editMetamodel
         * @desc search the metamodel
         * @param {string} type - type of edit (table, column)
         * @param {string} options - options to save
         * @param {boolean} isDelete - is this a delete operation
         * @param {any} colObject - column Object { colType: '', colFormat: ''} // TODO: add defaultFormat and determine what to change about a column
         */
        function editMetamodel(
            type: string,
            options: any,
            isDelete: boolean,
            colObject: any
        ): void {
            if (scope.metamodel.edit) {
                scope.metamodel.edit({
                    type: type,
                    options: options,
                    isDelete: isDelete || false,
                    colObject: colObject,
                });
            }
        }

        /** Table */
        /**
         * @name generateTable
         * @param id - id for the table to create
         * @desc generates a label for the selected table
         * @return  the html for the table
         */
        function generateTable(id: string): string {
            const table = scope.metamodel.metamodel.tables[id];

            let labelHolder = '';
            labelHolder += `<div id="metamodel__graph__table--${table.table}"
                            class="metamodel__graph__table"
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
            labelHolder += `<div class="metamodel__graph__table__item metamodel__graph__table__item--header "
                    title="${table.alias}"
                    metamodel-alias="${table.alias}">
                <div class="metamodel__graph__table__item__icon">
                    <i class="fa fa-table"></i>
                </div>
                <h6 class="metamodel__graph__table__item__text">
                    ${table.alias}
                </h6>
                ${
                    scope.metamodel.edit
                        ? `<span>
                                <smss-btn ng-if="!metamodel.hideControls" class="metamodel__graph__table__item__btn smss-btn--icon" title="Edit Table: ${table.alias}" ng-disabled="${scope.metamodel.metamodel.externalChangesApplied}" ng-click="metamodel.editMetamodel('table', {'table':'${table.table}'})">
                                    <i class="fa fa-edit"></i>
                                </smss-btn>
                                <smss-btn ng-if="!metamodel.hideControls && !metamodel.hideDelete" class="metamodel__graph__table__item__btn smss-btn--icon" title="Delete Table: ${table.alias}" ng-disabled="${scope.metamodel.metamodel.externalChangesApplied}" ng-click="metamodel.editMetamodel('table', {'table':'${table.table}'}, true)">
                                    <i class="fa fa-trash-o smss-color--error"></i>
                                </smss-btn>
                            </span>`
                        : ''
                }
            </div>`;

            // column list
            for (const column in table.columns) {
                if (table.columns.hasOwnProperty(column)) {
                    labelHolder += `<div class="metamodel__graph__table__item"
                        title="${table.columns[column].alias}"
                        metamodel-alias="${table.columns[column].alias}">
                        <div class="metamodel__graph__table__item__icon">
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
                                table.columns[column].type === 'INT' ||
                                table.columns[column].type === 'DOUBLE'
                                    ? '<i class="fa fa-hashtag"></i>'
                                    : ''
                            }
                        </div>
                        <div class="metamodel__graph__table__item__text">
                            ${table.columns[column].alias}
                        </div>
                        ${
                            table.columns[column].isPrimKey
                                ? '<div class="metamodel__graph__table__item__icon"><i class="fa fa-key"></i></div>'
                                : ''
                        }
                        ${
                            scope.metamodel.edit
                                ? `<span>
                                        <smss-btn ng-if="!metamodel.hideControls" class="metamodel__graph__table__item__btn smss-btn--icon" title="Edit Column: ${table.columns[column].alias}"  ng-disabled="${scope.metamodel.metamodel.externalChangesApplied}" ng-click="metamodel.editMetamodel('column', {'table':'${table.table}', 'column': '${table.columns[column].column}'}, false, { 'colType': '${table.columns[column].type}', 'colFormat': '${table.columns[column].typeFormat}', 'description': '${table.columns[column].description}', 'isPrimKey': '${table.columns[column].isPrimKey}' })">
                                            <i class="fa fa-edit"></i>
                                        </smss-btn>
                                        <smss-btn ng-if="!metamodel.hideControls && !metamodel.hideDelete" class="metamodel__graph__table__item__btn smss-btn--icon" title="Delete Column: ${table.columns[column].alias}"  ng-disabled="${scope.metamodel.metamodel.externalChangesApplied}" ng-click="metamodel.editMetamodel('column', {'table':'${table.table}', 'column': '${table.columns[column].column}'}, true)">
                                            <i class="fa fa-trash-o smss-color--error"></i>
                                        </smss-btn>
                                    </span>`
                                : ''
                        }
                    </div>`;
                }
            }

            labelHolder += '</div>';

            return labelHolder;
        }

        /** Helpers */
        /**
         * @name addWatch
         * @desc add the watch
         */
        function addWatch(): void {
            if (watch) {
                watch();
            }

            watch = scope.$watch(
                function () {
                    return JSON.stringify(scope.metamodel.metamodel);
                },
                function (newValue: string, oldValue: string) {
                    if (newValue !== oldValue) {
                        drawMetamodel();
                    }
                }
            );
        }

        /**
         * @name removeWatch
         * @desc remove the watch
         */
        function removeWatch(): void {
            if (watch) {
                watch();
            }
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            metamodelEle = ele[0].querySelector('.metamodel');
            metamodelGraphEle = ele[0].querySelector('#metamodel__graph');

            // set up the plumbing
            plumbing = jsPlumb.jsPlumb.getInstance({
                Container: metamodelGraphEle,
            });

            // add panzoom
            zoom = panzoom(metamodelGraphEle);

            scope.$on('$destroy', function () {
                destroyMetamodel();

                if (plumbing) {
                    plumbing.reset();
                }

                if (zoom) {
                    zoom.dispose();
                }
            });

            drawMetamodel();
        }

        initialize();
    }
}
