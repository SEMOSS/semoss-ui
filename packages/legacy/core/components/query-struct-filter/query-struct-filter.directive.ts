import * as angular from 'angular';

import './query-struct-filter.scss';
import './query-struct-filter-single/query-struct-filter-single.directive';
import './query-struct-filter-group/query-struct-filter-group.directive';

import {
    QueryStructFilter,
    QueryStructFilterPixelTypes,
    SimpleNode,
    GroupNode,
} from './query-struct-filter.types';

interface QueryStructFilterScope extends ng.IScope {
    queryStructFilter: {
        type: 'database' | 'frame';
        source: string;
        filter: QueryStructFilter;
        columns: {
            [key: string]: NonNullable<SimpleNode['filter']['selected']>;
        };
        register: (methods: { getFilter: () => QueryStructFilter }) => void;
        meta: (
            commandList: PixelCommand[],
            callback: () => void,
            listeners: string[]
        ) => void;
        rendered: GroupNode | null;
        availableColumns: NonNullable<SimpleNode['filter']['selected']>[];
        deleteFilter: (key: string) => void;
        addFilter: (
            key: string,
            type: GroupNode['type'] | SimpleNode['type']
        ) => void;
    };
}

export default angular
    .module('app.query-struct-filter.directive', [
        'app.query-struct-filter.single',
        'app.query-struct-filter.group',
    ])
    .directive('queryStructFilter', queryStructFilterDirective);

queryStructFilterDirective.$inject = ['$timeout'];

function queryStructFilterDirective() {
    queryStructFilterCtrl.$inject = [];
    queryStructFilterLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./query-struct-filter.directive.html'),
        scope: true, // queryStructFilter + it's helpers have a prototypical scope, so they can compile correctly
        require: [],
        controller: queryStructFilterCtrl,
        controllerAs: 'queryStructFilter',
        bindToController: {
            type: '=',
            source: '=',
            columns: '=',
            filter: '=',
            meta: '=',
            register: '&?',
        },
        link: queryStructFilterLink,
        transclude: true,
    };

    function queryStructFilterCtrl() {}

    function queryStructFilterLink(
        scope: QueryStructFilterScope,
        ele,
        attrs,
        ctrl
    ) {
        let count = 0;
        scope.queryStructFilter.rendered = null;

        scope.queryStructFilter.availableColumns = [];
        scope.queryStructFilter.deleteFilter = deleteFilter;
        scope.queryStructFilter.addFilter = addFilter;

        /**
         * Reset the rendered filter
         */
        function resetFilter(): void {
            // set the options
            scope.queryStructFilter.availableColumns = [];

            for (const concept in scope.queryStructFilter.columns) {
                const c = scope.queryStructFilter.columns[concept];

                scope.queryStructFilter.availableColumns.push(c);
            }

            // copy it to remove the reference
            const copied =
                JSON.parse(JSON.stringify(scope.queryStructFilter.filter)) ||
                [];

            // render the filter
            scope.queryStructFilter.rendered = buildRootNode(copied);
        }

        /**
         * Build the rendered filter nodes
         * @param filter - filter to render
         * @returns the rendered filter view
         */
        function buildRootNode(filter: QueryStructFilter): GroupNode {
            const key = 'root';

            // wrap in a group
            if (
                filter.length === 0 ||
                filter.length > 1 ||
                filter[0].type === 'SIMPLE'
            ) {
                return {
                    type: 'GROUP',
                    key: key,
                    parent: '',
                    value: 'AND',
                    children: buildRenderedNodes(filter, key),
                };
            } else {
                return {
                    type: 'GROUP',
                    key: key,
                    parent: '',
                    value: filter[0].type,
                    children: buildRenderedNodes(filter[0].content, key),
                };
            }
        }

        /**
         * Build the rendered filter nodes
         * @param filter - filter to render
         * @returns the rendered filter view
         */
        function buildRenderedNodes(
            filter: QueryStructFilter,
            key: string
        ): (GroupNode | SimpleNode)[] {
            if (!filter || !Array.isArray(filter)) {
                return [];
            }

            return filter.reduce((acc, val) => {
                const { type, content } = val;

                // get a unique key for this filter
                const k = getKey();

                if (type === 'AND' || type === 'OR') {
                    acc.push({
                        type: 'GROUP',
                        key: k,
                        parent: key,
                        value: type,
                        children: buildRenderedNodes(content, k),
                    });
                } else if (type === 'SIMPLE') {
                    let columnBranch;
                    if (
                        content.left.pixelType ===
                            QueryStructFilterPixelTypes.COLUMN &&
                        content.right.pixelType ===
                            QueryStructFilterPixelTypes.COLUMN
                    ) {
                        // noop
                    } else if (
                        content.left.pixelType ===
                        QueryStructFilterPixelTypes.COLUMN
                    ) {
                        columnBranch = content.left.value[0].content;
                    } else if (
                        content.right.pixelType ===
                        QueryStructFilterPixelTypes.COLUMN
                    ) {
                        columnBranch = content.right.value[0].content;
                    }

                    let column: SimpleNode['filter']['selected'] = undefined;
                    if (columnBranch) {
                        if (columnBranch.column === 'PRIM_KEY_PLACEHOLDER') {
                            column =
                                scope.queryStructFilter.columns[
                                    `${scope.queryStructFilter.source}__${columnBranch.table}`
                                ];
                        } else {
                            column =
                                scope.queryStructFilter.columns[
                                    `${columnBranch.table}__${columnBranch.column}`
                                ];
                        }
                    }

                    let valueBranch;
                    if (
                        content.left.pixelType !==
                            QueryStructFilterPixelTypes.COLUMN &&
                        content.right.pixelType !==
                            QueryStructFilterPixelTypes.COLUMN
                    ) {
                        //noop
                    } else if (
                        content.left.pixelType !==
                        QueryStructFilterPixelTypes.COLUMN
                    ) {
                        valueBranch = content.left;
                    } else if (
                        content.right.pixelType !==
                        QueryStructFilterPixelTypes.COLUMN
                    ) {
                        valueBranch = content.right;
                    }

                    // render if both are present
                    if (column && valueBranch) {
                        const comparator = content.comparator,
                            value = valueBranch.value;

                        acc.push({
                            type: 'SIMPLE',
                            key: k,
                            parent: key,
                            filter: {
                                selected: column,
                                comparator: comparator,
                                comparatorOptions: [],
                                active: '',
                                equality: {
                                    loading: false,
                                    taskId: false,
                                    model:
                                        comparator === '==' ||
                                        comparator === '!='
                                            ? value
                                            : [],
                                    options: [],
                                    search: '',
                                    limit: 20,
                                    canCollect: true,
                                },
                                numerical: {
                                    model:
                                        (comparator === '<' ||
                                            comparator === '<=' ||
                                            comparator === '>' ||
                                            comparator === '>=') &&
                                        (column.type === 'NUMBER' ||
                                            column.type === 'DOUBLE' ||
                                            column.type === 'INT')
                                            ? value[0]
                                            : '',
                                },
                                date: {
                                    model:
                                        (comparator === '<' ||
                                            comparator === '<=' ||
                                            comparator === '>' ||
                                            comparator === '>=') &&
                                        column.type === 'DATE'
                                            ? value[0]
                                            : '',
                                },
                                timestamp: {
                                    model:
                                        (comparator === '<' ||
                                            comparator === '<=' ||
                                            comparator === '>' ||
                                            comparator === '>=') &&
                                        column.type === 'TIMESTAMP'
                                            ? value[0]
                                            : '',
                                },
                                match: {
                                    loading: false,
                                    taskId: '',
                                    model:
                                        comparator === '?like' ||
                                        comparator === '?begins' ||
                                        comparator === '?ends'
                                            ? value[0]
                                            : '',
                                    options: [], // all values on the dom for the alias
                                    limit: 20, // how many values to collect
                                    canCollect: true, // infinite scroll,
                                },
                            },
                        });
                    } else {
                        console.error('Error: Cannot Render Filter', val);
                    }
                }

                return acc;
            }, [] as (GroupNode | SimpleNode)[]);
        }

        /**
         * Delete a rendered filter
         * @param key - key of the filter to delete
         */
        function deleteFilter(key: string): void {
            // get the filter
            const filter = findFilter(key);
            if (!filter) {
                console.error('Error: Cannot Find Filter', key);
                return;
            }

            // get the filter
            const parent = findFilter(filter.parent);
            if (!parent) {
                console.error('Error: Cannot Find Parent of Filter', key);
                return;
            }

            if (parent.type === 'SIMPLE') {
                console.error('Error: Simple Filter cannot have children', key);
                return;
            }

            // find the first one that matches
            let idx = -1;
            for (let i = 0, len = parent.children.length; i < len; i++) {
                if (parent.children[i].key === key) {
                    idx = i;
                    break;
                }
            }

            if (idx === -1) {
                console.error('Error: Cannot Find Filter', key);
                return;
            }

            // remove it
            parent.children.splice(idx, 1);

            // reset if you delete the last one
            if (
                !scope.queryStructFilter.rendered ||
                scope.queryStructFilter.rendered.children.length === 0
            ) {
                scope.queryStructFilter.rendered = buildRootNode([]);
                return;
            }
        }

        /**
         * Add a new filter
         * @param key - key of the filter to add
         * @param type - type of the filter to add
         */
        function addFilter(
            key: string,
            type: GroupNode['type'] | SimpleNode['type']
        ): void {
            // get the filter
            const parent = findFilter(key);

            if (!parent) {
                console.error('Error: Cannot Find Filter', key);
                return;
            }

            if (parent.type === 'SIMPLE') {
                console.error('Error: Simple Filter cannot have children', key);
                return;
            }

            const k = getKey();

            if (type === 'SIMPLE') {
                parent.children.push({
                    type: 'SIMPLE',
                    key: getKey(),
                    parent: key,
                    filter: {
                        selected: undefined,
                        comparator: '==',
                        comparatorOptions: [],
                        active: '',
                        equality: {
                            loading: false,
                            taskId: false,
                            model: [],
                            options: [],
                            search: '',
                            limit: 20,
                            canCollect: true,
                        },
                        numerical: {
                            model: '',
                        },
                        date: {
                            model: '',
                        },
                        timestamp: {
                            model: '',
                        },
                        match: {
                            loading: false,
                            taskId: '',
                            model: '',
                            options: [], // all values on the dom for the alias
                            limit: 20, // how many values to collect
                            canCollect: true, // infinite scroll,
                        },
                    },
                });
            } else if (type === 'GROUP') {
                parent.children.push({
                    type: 'GROUP',
                    key: k,
                    parent: key,
                    value: 'AND',
                    children: [],
                });

                // add a child one
                addFilter(k, 'SIMPLE');
            }
        }

        /**
         * Get a filter by key (DFS)
         * @param key - key of the filter
         * @returns the filter
         */
        function findFilter(key: string): GroupNode | SimpleNode | null {
            if (!scope.queryStructFilter.rendered) {
                return null;
            }

            if (key === 'root') {
                return scope.queryStructFilter.rendered;
            }

            const queue = [...scope.queryStructFilter.rendered.children];
            while (queue.length) {
                const current = queue.shift();
                if (!current) {
                    continue;
                }

                if (current.key === key) {
                    return current;
                }

                // get the children
                if (current.type === 'SIMPLE') {
                    continue;
                }

                // traverse the children
                for (
                    let cIdx = 0, cLen = current.children.length;
                    cIdx < cLen;
                    cIdx++
                ) {
                    queue.push(current.children[cIdx]);
                }
            }

            return null;
        }

        /**
         * Convert the rendered to a Query Struct Filter
         * @returns the query struct
         */
        function getFilter(): QueryStructFilter {
            const node = scope.queryStructFilter.rendered;

            if (!node) {
                return [];
            }

            const qs = getFilterQS(node);
            if (!qs) {
                return [];
            }

            return [qs];
        }

        /**
         * Convert the rendered to a Query Struct Filter
         * @returns the query struct
         */
        function getFilterQS(
            node: SimpleNode | GroupNode
        ): QueryStructFilter[number] | null {
            if (node.type === 'GROUP') {
                // needs to have children
                if (node.children.length === 0) {
                    return null;
                }

                return {
                    type: node.value,
                    content: node.children.reduce((acc, val) => {
                        const qs = getFilterQS(val);
                        if (qs) {
                            acc.push(qs);
                        }

                        return acc;
                    }, [] as QueryStructFilter),
                };
            }

            // no filter ignore it
            if (!node.filter.selected) {
                return null;
            }

            const comparator = node.filter.comparator,
                type = node.filter.selected.type;

            let value,
                pixelType: QueryStructFilterPixelTypes =
                    QueryStructFilterPixelTypes.CONST_STRING; // attempt the pixel type
            if (comparator === '==' || comparator === '!=') {
                value = node.filter.equality.model;
                pixelType = QueryStructFilterPixelTypes.CONST_STRING;
            } else if (
                (comparator === '<' ||
                    comparator === '<=' ||
                    comparator === '>' ||
                    comparator === '>=') &&
                (type === 'NUMBER' || type === 'DOUBLE' || type === 'INT')
            ) {
                value = node.filter.numerical.model;
                if (type === 'INT') {
                    pixelType = QueryStructFilterPixelTypes.CONST_INT;
                } else {
                    pixelType = QueryStructFilterPixelTypes.CONST_DECIMAL;
                }
            } else if (
                (comparator === '<' ||
                    comparator === '<=' ||
                    comparator === '>' ||
                    comparator === '>=') &&
                type === 'DATE'
            ) {
                value = node.filter.date.model;
                pixelType = QueryStructFilterPixelTypes.CONST_DATE;
            } else if (
                (comparator === '<' ||
                    comparator === '<=' ||
                    comparator === '>' ||
                    comparator === '>=') &&
                type === 'TIMESTAMP'
            ) {
                value = node.filter.timestamp.model;
                pixelType = QueryStructFilterPixelTypes.CONST_TIMESTAMP;
            } else if (
                comparator === '?like' ||
                comparator === '?begins' ||
                comparator === '?ends'
            ) {
                value = node.filter.match.model;
                pixelType = QueryStructFilterPixelTypes.CONST_STRING;
            }

            return {
                type: 'SIMPLE',
                content: {
                    left: {
                        pixelType: QueryStructFilterPixelTypes.COLUMN,
                        value: [
                            {
                                type: 'COLUMN',
                                content: {
                                    table: node.filter.selected.table,
                                    column: node.filter.selected.column,
                                },
                            },
                        ],
                    },
                    comparator: comparator,
                    right: {
                        pixelType: pixelType,
                        value: value,
                    },
                },
            };
        }

        /** Utility */
        /**
         * @name getKey
         * @desc get a unique key
         */
        function getKey(): string {
            // increment it
            count++;

            // return it
            return `${count}`;
        }
        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            scope.$watch(
                function () {
                    return `${scope.queryStructFilter.type}-${
                        scope.queryStructFilter.source
                    }-${JSON.stringify(scope.queryStructFilter.filter)}`;
                },
                function () {
                    resetFilter();
                }
            );

            // register the newly create scope
            if (scope.queryStructFilter.hasOwnProperty('register')) {
                scope.queryStructFilter.register({
                    getFilter: getFilter,
                });
            }
        }

        initialize();
    }
}
