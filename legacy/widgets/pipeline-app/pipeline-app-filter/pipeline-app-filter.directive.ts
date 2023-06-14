import angular from 'angular';

import './pipeline-app-filter.scss';

import './pipeline-app-filter-single/pipeline-app-filter-single.directive';

import { Leaf } from '../../../core/components/formula/formula.directive';

export default angular
    .module('app.pipeline.pipeline-app.filter', [
        'app.pipeline.pipeline-app.filter.single',
    ])
    .directive('pipelineAppFilter', pipelineAppFilterDirective);

pipelineAppFilterDirective.$inject = [];

function pipelineAppFilterDirective() {
    pipelineAppFilterCtrl.$inject = [];
    pipelineAppFilterLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./pipeline-app-filter.directive.html'),
        scope: {},
        require: ['^widget', '^pipelineApp'],
        controller: pipelineAppFilterCtrl,
        controllerAs: 'pipelineAppFilter',
        bindToController: {},
        link: pipelineAppFilterLink,
    };

    function pipelineAppFilterCtrl() {
        const pipelineAppFilter = this;

        pipelineAppFilter.registerFormula = registerFormula;
        /**
         * @name registerFormula
         * @desc register the formula callbacks to the parent
         * @param {*} updateTree - get the tree from the view
         * @param {*} getTree - get the tree from the view
         */
        function registerFormula(updateTree, getTree): void {
            pipelineAppFilter.updateTree = updateTree;
            pipelineAppFilter.getTree = getTree;
        }
    }

    function pipelineAppFilterLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineAppCtrl = ctrl[1];

        const MENU = {
            AND: {
                name: 'AND',
                type: 'group',
                selected: 'AND',
                options: ['AND', 'OR'],
                vertical: true,
                children: {
                    '0': {
                        id: '',
                        placeholder: '',
                        leaf: null,
                    },
                    '1': {
                        id: '',
                        placeholder: '',
                        leaf: null,
                    },
                },
            },
            OR: {
                name: 'OR',
                type: 'group',
                selected: 'OR',
                options: ['AND', 'OR'],
                vertical: true,
                children: {
                    '0': {
                        id: '',
                        placeholder: '',
                        leaf: null,
                    },
                    '1': {
                        id: '',
                        placeholder: '',
                        leaf: null,
                    },
                },
            }, // selected output
        };

        // this is the initial set of filters
        scope.pipelineAppFilter.startFilters = [];
        scope.pipelineAppFilter.columns = {};
        scope.pipelineAppFilter.formula = {
            menu: [],
            options: {},
        };

        scope.pipelineAppFilter.hideFilter = hideFilter;
        scope.pipelineAppFilter.addFilter = addFilter;
        scope.pipelineAppFilter.clearFilter = clearFilter;

        /** Filter */

        /**
         * @name resetFilter
         * @desc reset the filter
         */
        function resetFilter(): void {
            // clear it out
            scope.pipelineAppFilter.formula = {
                menu: [],
                options: {}, // set the menu
            };

            // create the column mapping
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineAppCtrl.selected.queue.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                const table = scope.pipelineAppCtrl.selected.queue[tableIdx];

                for (
                    let colIdx = 0,
                        colLen =
                            scope.pipelineAppCtrl.selected.queue[tableIdx]
                                .columns.length;
                    colIdx < colLen;
                    colIdx++
                ) {
                    const column = table.columns[colIdx];

                    scope.pipelineAppFilter.columns[`${column.concept}`] =
                        column;
                }
            }

            // create the menu
            setMenu();

            // create the formula
            setFormula();

            console.warn(
                'TODO: take a look at RemoveTask. I do not think we are removing correctly'
            );
            console.warn('TODO: Can we optimize the options?');
            console.warn('TODO: Take a look at having');
        }

        /**
         * @name hideFilter
         * @desc hide the filter on close
         */
        function hideFilter(resetFilterChanges?: boolean): void {
            // this will be true when we cancel the modifications
            // false when we clear / add
            if (resetFilterChanges) {
                scope.pipelineAppCtrl.filter.selected = JSON.parse(
                    JSON.stringify(scope.pipelineAppFilter.startFilters)
                );
            }

            scope.pipelineAppCtrl.filter.open = false;
        }

        /**
         * @name addFilter
         * @desc add the filter
         */
        function addFilter(): void {
            const tree = scope.pipelineAppFilter.getTree();

            // this is the filter QS
            const filter = flushFormula(tree.leaf);
            if (!filter) {
                scope.widgetCtrl.alert(
                    'error',
                    'Filter is not valid. Please validate filter and fill in any missing fields.'
                );
                return;
            }

            // save it
            scope.pipelineAppCtrl.filter.selected = [filter];

            // hide the filter;
            hideFilter(false);
        }

        /**
         * @name clearFilter
         * @desc add the filter
         */
        function clearFilter(): void {
            // clear it
            scope.pipelineAppCtrl.filter.selected = [];

            // hide the filter;
            hideFilter(false);
        }

        /** Menu */
        /**
         * @name setMenu
         * @desc set the menu from the filter
         */
        function setMenu(): void {
            scope.pipelineAppFilter.formula.menu = [
                {
                    name: 'Operations',
                    options: [MENU.AND, MENU.OR],
                },
            ];

            // set the concept
            const group: {
                name: string;
                options: any[];
            } = {
                name: 'Columns',
                options: [],
            };

            // add the columns in
            for (const concept in scope.pipelineAppFilter.columns) {
                const column = scope.pipelineAppFilter.columns[concept];

                group.options.push({
                    name: `${String(column.column).replace(/_/g, ' ')}`,
                    type: 'value',
                    data: {
                        type: scope.pipelineAppCtrl.type,
                        source: scope.pipelineAppCtrl.source.value, // TODO: This is done on purpose, eventually will get rid of "value" from pipeline-app
                        filter: {
                            selected: column,
                            comparator: '',
                            comparatorOptions: [],
                            active: '',
                            equality: {
                                loading: false,
                                taskId: false,
                                model: [],
                                options: [], // all values on the dom for the alias
                                search: '', // search term used - only used for search term in filtermodel call, nothing else
                                limit: 20, // how many filter values to collect
                                canCollect: true, // flag to determine whether another filter model call should be made - infinite scroll
                            },
                            numerical: {
                                loading: false,
                                model: '',
                                min: -Infinity,
                                max: Infinity,
                            },
                            date: {
                                loading: false,
                                model: '',
                                min: '',
                                max: '',
                            },
                            timestamp: {
                                loading: false,
                                model: '',
                                min: '',
                                max: '',
                            },
                            match: {
                                loading: false,
                                taskId: false,
                                model: '',
                                options: [], // all values on the dom for the alias
                                limit: 20, // how many values to collect
                                canCollect: true, // infinite scroll,
                            },
                        },
                    },
                    view: `
                            <pipeline-app-filter-single type="data.type" source="data.source" filter="data.filter"><pipeline-app-filter-single>
                        `,
                });
            }

            scope.pipelineAppFilter.formula.menu.push(group);
        }

        /** Menu */
        /**
         * @name setFormula
         * @desc set and build the formula
         */
        function setFormula() {
            const tree = {
                placeholder: '',
                leaf:
                    convertFormula(scope.pipelineAppCtrl.filter.selected[0]) ||
                    JSON.parse(JSON.stringify(MENU.AND)), // only can handle 1 at a time for now
            };

            scope.pipelineAppFilter.updateTree(tree);
        }

        /**
         * @name convertFormula
         * @desc convert the QS into a formula tree
         * @param filter {QUERY_STRUCT} - filter portion of the query struct
         */
        function convertFormula(filter: any): Leaf | null {
            if (!filter) {
                return null;
            }

            const type = filter.type,
                content = filter.content;

            if (type === 'OR' || type === 'AND') {
                if (!content) {
                    return null;
                }

                const children = {};
                for (
                    let childIdx = 0, childLen = content.length;
                    childIdx < childLen;
                    childIdx++
                ) {
                    children[`${childIdx}`] = {
                        placeholder: '',
                        leaf: convertFormula(content[childIdx]),
                    };
                }

                if (Object.keys(children).length === 0) {
                    return null;
                }

                // add an extra one
                const next = Object.keys(children).length;

                children[`${next}`] = {
                    placeholder: '',
                    leaf: null,
                };

                return {
                    id: '',
                    name: type,
                    type: 'group',
                    selected: type,
                    options: ['AND', 'OR'],
                    vertical: true,
                    children: children,
                };
            } else if (type === 'SIMPLE') {
                // check left
                const components: any[] = [],
                    chunks = [content.left, content.right];

                while (chunks.length > 0) {
                    let chunk = chunks.shift(),
                        component = {};

                    if (!chunk) {
                        continue;
                    }

                    if (chunk.pixelType === 'COLUMN') {
                        component = {
                            type: 'COLUMN',
                            table: chunk.value[0].content.table,
                            column: chunk.value[0].content.column,
                        };
                    } else if (
                        chunk.pixelType === 'BOOLEAN' ||
                        chunk.pixelType === 'NULL_VALUE' ||
                        chunk.pixelType === 'CONST_STRING' ||
                        chunk.pixelType === 'CONST_INT' ||
                        chunk.pixelType === 'CONST_DATE' ||
                        chunk.pixelType === 'CONST_DECIMAL' ||
                        chunk.pixelType === 'LAMBDA'
                    ) {
                        component = {
                            type: 'value',
                            value: chunk.value,
                        };
                    }

                    if (Object.keys(component).length > 0) {
                        components.push(component);
                    }
                }

                // not valid
                if (components.length !== 2) {
                    return null;
                }

                if (
                    (components[0].type === 'COLUMN' &&
                        components[1].type === 'COLUMN') ||
                    (components[0].type !== 'COLUMN' &&
                        components[1].type !== 'COLUMN')
                ) {
                    console.error(
                        'Both are columns or not, we do not know how to handle this ... yet'
                    );
                    return null;
                }

                let column;
                // match based on concept
                if (components[0].type === 'COLUMN') {
                    if (components[0].column === 'PRIM_KEY_PLACEHOLDER') {
                        column =
                            scope.pipelineAppFilter.columns[
                                `${components[0].table}`
                            ];
                    } else {
                        column =
                            scope.pipelineAppFilter.columns[
                                `${components[0].table}__${components[0].column}`
                            ];
                    }
                } else {
                    if (components[1].column === 'PRIM_KEY_PLACEHOLDER') {
                        column =
                            scope.pipelineAppFilter.columns[
                                `${components[1].table}`
                            ];
                    } else {
                        column =
                            scope.pipelineAppFilter.columns[
                                `${components[1].table}__${components[1].column}`
                            ];
                    }
                }

                if (!column) {
                    return null;
                }

                let value;
                if (components[0].type === 'value') {
                    value = components[0].value;
                } else {
                    value = components[1].value;
                }

                return {
                    id: '', // this will get reassigned
                    name: type,
                    type: 'value',
                    data: {
                        type: scope.pipelineAppCtrl.type,
                        source: scope.pipelineAppCtrl.source.value,
                        filter: {
                            selected: column,
                            comparator: content.comparator,
                            comparatorOptions: [],
                            active: '',
                            equality: {
                                loading: false,
                                taskId: false,
                                model:
                                    content.comparator === '==' ||
                                    content.comparator === '!='
                                        ? value
                                        : [],
                                options: [], // all values on the dom for the alias
                                search: '', // search term used - only used for search term in filtermodel call, nothing else
                                limit: 20, // how many filter values to collect
                                canCollect: true, // flag to determine whether another filter model call should be made - infinite scroll
                            },
                            numerical: {
                                loading: false,
                                model:
                                    (content.comparator === '<' ||
                                        content.comparator === '<=' ||
                                        content.comparator === '>' ||
                                        content.comparator === '>=') &&
                                    (column.type === 'NUMBER' ||
                                        column.type === 'DOUBLE' ||
                                        column.type === 'INT')
                                        ? value[0]
                                        : '',
                                min: -Infinity,
                                max: Infinity,
                            },
                            date: {
                                loading: false,
                                model:
                                    (content.comparator === '<' ||
                                        content.comparator === '<=' ||
                                        content.comparator === '>' ||
                                        content.comparator === '>=') &&
                                    column.type === 'DATE'
                                        ? value[0]
                                        : '',
                                min: '',
                                max: '',
                            },
                            timestamp: {
                                loading: false,
                                model:
                                    (content.comparator === '<' ||
                                        content.comparator === '<=' ||
                                        content.comparator === '>' ||
                                        content.comparator === '>=') &&
                                    column.type === 'TIMESTAMP'
                                        ? value[0]
                                        : '',
                                min: '',
                                max: '',
                            },
                            match: {
                                loading: false,
                                taskId: false,
                                model:
                                    content.comparator === '?like' ||
                                    content.comparator === '?begins' ||
                                    content.comparator === '?ends'
                                        ? value[0]
                                        : '',
                                options: [], // all values on the dom for the alias
                                limit: 20, // how many values to collect
                                canCollect: true, // infinite scroll,
                            },
                        },
                    },
                    view: `
                        <pipeline-app-filter-single type="data.type" source="data.source" filter="data.filter"><pipeline-app-filter-single>
                    `,
                };
            }

            return null;
        }

        /**
         * @name flushFormula
         * @desc flush the formula into a QS
         */
        function flushFormula(leaf: Leaf | null): any {
            if (!leaf) {
                return false;
            }

            if (leaf.type === 'group') {
                const content: any[] = [];
                for (const childId in leaf.children) {
                    if (leaf.children.hasOwnProperty(childId)) {
                        const child = flushFormula(leaf.children[childId].leaf);

                        if (child) {
                            content.push(child);
                        }
                    }
                }

                // content is valid
                if (content.length === 0) {
                    return false;
                }

                return {
                    type: leaf.selected,
                    content: content,
                };
            } else if (leaf.type === 'value') {
                const column = leaf.data.filter.selected,
                    comparator = leaf.data.filter.comparator;

                let model;
                if (comparator === '==' || comparator === '!=') {
                    model = leaf.data.filter.equality.model;
                } else if (
                    (comparator === '<' ||
                        comparator === '<=' ||
                        comparator === '>' ||
                        comparator === '>=') &&
                    (column.type === 'NUMBER' ||
                        column.type === 'DOUBLE' ||
                        column.type === 'INT')
                ) {
                    model = leaf.data.filter.numerical.model;
                } else if (
                    (comparator === '<' ||
                        comparator === '<=' ||
                        comparator === '>' ||
                        comparator === '>=') &&
                    column.type === 'DATE'
                ) {
                    model = leaf.data.filter.date.model;
                } else if (
                    (comparator === '<' ||
                        comparator === '<=' ||
                        comparator === '>' ||
                        comparator === '>=') &&
                    column.type === 'TIMESTAMP'
                ) {
                    model = leaf.data.filter.timestamp.model;
                } else if (
                    comparator === '?like' ||
                    comparator === '?begins' ||
                    comparator === '?ends'
                ) {
                    model = leaf.data.filter.match.model;
                }

                if (!column || !comparator) {
                    return false;
                }

                return {
                    type: 'SIMPLE',
                    content: {
                        left: {
                            pixelType: 'COLUMN',
                            value: [
                                {
                                    type: 'COLUMN',
                                    content: {
                                        table: column.table,
                                        column: column.isPrimKey
                                            ? 'PRIM_KEY_PLACEHOLDER'
                                            : column.column,
                                        alias: column.alias,
                                    },
                                },
                            ],
                        },
                        comparator: leaf.data.filter.comparator,
                        right: {
                            pixelType: 'CONST_STRING',
                            value: Array.isArray(model) ? model : [model],
                        },
                    },
                };
            }

            return false;
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            // initialized oldFilter with the existing filter value, JSON.parse(JSON.stringify()) is for creating a deep copy of the existing filter
            scope.pipelineAppFilter.startFilters = JSON.parse(
                JSON.stringify(scope.pipelineAppCtrl.filter.selected)
            );
            resetFilter();
        }

        initialize();
    }
}
