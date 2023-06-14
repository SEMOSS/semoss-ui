import * as angular from 'angular';

import './pipeline-app-calculation.scss';

import './pipeline-app-calculation-single/pipeline-app-calculation-single.directive';

import { OPERATIONS, EXPRESSIONS, COMPARATOR } from '../../../core/constants';
import { Leaf } from '../../../core/components/formula/formula.directive';

type Calculation = {
    alias: string;
    hasAliasError: boolean;
    selector: any;
    type: 'Advanced' | 'Simple';
    simple?: {
        column: any;
        function: string;
    };
};

export default angular
    .module('app.pipeline.pipeline-app.calculation', [
        'app.pipeline.pipeline-app.calculation.single',
    ])
    .directive('pipelineAppCalculation', pipelineAppCalculationDirective);

pipelineAppCalculationDirective.$inject = [];

function pipelineAppCalculationDirective() {
    pipelineAppCalculationCtrl.$inject = [];
    pipelineAppCalculationLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./pipeline-app-calculation.directive.html'),
        scope: {
            options: '<',
        },
        require: ['^widget', '^pipelineApp'],
        controller: pipelineAppCalculationCtrl,
        controllerAs: 'pipelineAppCalculation',
        bindToController: {},
        link: pipelineAppCalculationLink,
    };

    function pipelineAppCalculationCtrl() {
        const pipelineAppCalculation = this;

        pipelineAppCalculation.registerFormula = registerFormula;
        /**
         * @name registerFormula
         * @desc register the formula callbacks to the parent
         * @param {*} updateTree - get the tree from the view
         * @param {*} getTree - get the tree from the view
         */
        function registerFormula(updateTree, getTree): void {
            pipelineAppCalculation.updateTree = updateTree;
            pipelineAppCalculation.getTree = getTree;
        }
    }

    function pipelineAppCalculationLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineAppCtrl = ctrl[1];

        const MENU = {
            custom: [
                {
                    name: 'Number',
                    type: 'value',
                    data: {
                        type: scope.pipelineAppCtrl.type,
                        source: scope.pipelineAppCtrl.source.value,
                        calculation: {
                            custom: true,
                            type: 'number',
                            value: '',
                        },
                    },
                    view: '<pipeline-app-calculation-single type="data.type" source="data.source" calculation="data.calculation"></pipeline-app-calculation-single>',
                },
                {
                    name: 'String',
                    type: 'value',
                    data: {
                        type: scope.pipelineAppCtrl.type,
                        source: scope.pipelineAppCtrl.source.value,
                        calculation: {
                            custom: true,
                            type: 'text',
                            value: '',
                        },
                    },
                    view: '<pipeline-app-calculation-single type="data.type" source="data.source" calculation="data.calculation"></pipeline-app-calculation-single>',
                },
            ],
        };

        let previousName;

        scope.pipelineAppCalculation.name = '';

        scope.pipelineAppCalculation.columns = {};

        scope.pipelineAppCalculation.formula = {
            menu: [],
            options: {},
        };

        scope.pipelineAppCalculation.simple = {
            column: {
                options: [],
                selected: '',
            },
            function: {
                options: [],
                selected: '',
            },
        };

        scope.pipelineAppCalculation.cancelCalculation = cancelCalculation;
        scope.pipelineAppCalculation.updateCalculation = updateCalculation;
        scope.pipelineAppCalculation.clearCalculation = clearCalculation;
        scope.pipelineAppCalculation.changeCalculationType =
            changeCalculationType;

        /** Calculation */
        /**
         * @name changeCalculationType
         * @desc changes the type of calculation the user wants to make
         * @param type type of calculation (Simple, Advanced)
         */
        function changeCalculationType(type: string): void {
            scope.pipelineAppCtrl.calculation.type = type;
        }

        /**
         * @name getCalculation
         * @desc get the selected calculation object
         */
        function getCalculation() {
            return scope.pipelineAppCtrl.calculation.selected[
                scope.pipelineAppCtrl.calculation.selectedIndex
            ];
        }

        /**
         * @name resetCalculation
         * @desc reset the calculation
         */
        function resetCalculation(): void {
            // clear it out
            scope.pipelineAppCalculation.formula = {
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

                    scope.pipelineAppCalculation.columns[`${column.concept}`] =
                        column;
                }
            }

            const calculation = getCalculation();
            const name = calculation ? calculation.alias : '';

            previousName = name;
            scope.pipelineAppCalculation.name = name;
            scope.pipelineAppCalculation.action = calculation
                ? 'Update'
                : 'Add';

            // set the simple
            resetSimple();

            // set advanced
            resetAdvanced();
        }

        /**
         * @name hideCalculation
         * @desc hide the calculation on close
         */
        function hideCalculation(): void {
            previousName = null;
            scope.pipelineAppCtrl.calculation.open = false;
        }

        /**
         * @name cancelCalculation
         * @desc Revert name, then hide modal
         */
        function cancelCalculation(): void {
            const calculation = getCalculation();

            if (calculation) {
                // Revert name to previous state
                calculation.alias = previousName;
            }

            hideCalculation();
        }

        /**
         * @name updateCalculation
         * @desc update the calculation
         */
        function updateCalculation(): void {
            if (!scope.pipelineAppCalculation.name) {
                scope.widgetCtrl.alert(
                    'error',
                    'Name is required. Please add a valid name.'
                );
                return;
            }

            let calculation: Calculation | false = false;
            if (scope.pipelineAppCtrl.calculation.type === 'Simple') {
                calculation = getSimple();
            } else if (scope.pipelineAppCtrl.calculation.type === 'Advanced') {
                calculation = getAdvanced();
            }

            if (!calculation) {
                return;
            }

            // save it
            if (
                scope.pipelineAppCtrl.calculation.selected.length > 0 &&
                scope.pipelineAppCtrl.calculation.selected[
                    scope.pipelineAppCtrl.calculation.selectedIndex
                ]
            ) {
                scope.pipelineAppCtrl.calculation.selected[
                    scope.pipelineAppCtrl.calculation.selectedIndex
                ] = calculation;
            } else {
                scope.pipelineAppCtrl.calculation.selected.push(calculation);
            }

            // hide the calculation;
            hideCalculation();
        }

        /**
         * @name clearCalculation
         * @desc add the calculation
         */
        function clearCalculation(): void {
            // clear it
            scope.pipelineAppCtrl.calculation.selected = [];

            // hide the calculation;
            hideCalculation();
        }

        /** Simple */
        /**
         * @name resetSimple
         * @desc reset and build the simple fields
         */
        function resetSimple() {
            // set the simple options
            scope.pipelineAppCalculation.simple.function.options = OPERATIONS;

            scope.pipelineAppCalculation.simple.column.options = [];
            for (const concept in scope.pipelineAppCalculation.columns) {
                const column = scope.pipelineAppCalculation.columns[concept];

                scope.pipelineAppCalculation.simple.column.options.push(column);
            }

            // If a simple calculation is being edited, need to reselect the previous options
            if (
                scope.pipelineAppCtrl.calculation.selected.length > 0 &&
                scope.pipelineAppCtrl.calculation.selected[
                    scope.pipelineAppCtrl.calculation.selectedIndex
                ] &&
                scope.pipelineAppCtrl.calculation.selected[
                    scope.pipelineAppCtrl.calculation.selectedIndex
                ].simple
            ) {
                scope.pipelineAppCalculation.simple.column.selected =
                    scope.pipelineAppCtrl.calculation.selected[
                        scope.pipelineAppCtrl.calculation.selectedIndex
                    ].simple.column;
                scope.pipelineAppCalculation.simple.function.selected =
                    scope.pipelineAppCtrl.calculation.selected[
                        scope.pipelineAppCtrl.calculation.selectedIndex
                    ].simple.function;
            }
        }

        /**
         * @name getSimple
         * @desc get the advanced calculation object
         */
        function getSimple(): Calculation | false {
            if (!scope.pipelineAppCalculation.simple.column.selected) {
                scope.widgetCtrl.alert(
                    'error',
                    'Column is missing. Please select a column.'
                );
                return false;
            }

            if (!scope.pipelineAppCalculation.simple.function.selected) {
                scope.widgetCtrl.alert(
                    'error',
                    'Calculation is missing. Please select a column.'
                );
                return false;
            }

            // Create calculation
            return {
                alias: String(scope.pipelineAppCalculation.name).replace(
                    /_/g,
                    ' '
                ),
                hasAliasError: false,
                selector: {
                    type: 'FUNCTION',
                    content: {
                        function:
                            scope.pipelineAppCalculation.simple.function
                                .selected.function,
                        innerSelectors: [
                            {
                                type: 'COLUMN',
                                content: {
                                    alias: scope.pipelineAppCalculation.simple
                                        .column.selected.alias,
                                    column: scope.pipelineAppCalculation.simple
                                        .column.selected.isPrimKey
                                        ? 'PRIM_KEY_PLACEHOLDER'
                                        : scope.pipelineAppCalculation.simple
                                              .column.selected.column,
                                    table: scope.pipelineAppCalculation.simple
                                        .column.selected.table,
                                },
                            },
                        ],
                    },
                },
                type: 'Simple',
                simple: {
                    column: scope.pipelineAppCalculation.simple.column.selected,
                    function:
                        scope.pipelineAppCalculation.simple.function.selected,
                },
            };
        }

        /** Advanced */
        /**
         * @name resetAdvanced
         * @desc reset and build the formula
         */
        function resetAdvanced() {
            // create the menu
            scope.pipelineAppCalculation.formula.menu = [
                {
                    name: 'Functions',
                    options: OPERATIONS.map((o) => {
                        return {
                            name: o.display,
                            type: 'function',
                            function: o.function,
                            children: {
                                '0': {
                                    id: '',
                                    placeholder: '',
                                    leaf: null,
                                },
                            },
                        };
                    }),
                },
                {
                    name: 'Expressions',
                    options: EXPRESSIONS.map((o) => {
                        return {
                            name: o.display,
                            type: 'expression',
                            expression: o.expression,
                            left: {
                                id: '',
                                placeholder: '',
                                leaf: null,
                            },
                            right: {
                                id: '',
                                placeholder: '',
                                leaf: null,
                            },
                        };
                    }),
                },
                {
                    name: 'Conditional',
                    options: [
                        {
                            name: 'If/Else',
                            type: 'conditional',
                            condition: {
                                id: '',
                                placeholder: 'Condition',
                                leaf: null,
                            },
                            truthy: {
                                id: '',
                                placeholder: 'True',
                                leaf: null,
                            },
                            falsey: {
                                id: '',
                                placeholder: 'False',
                                leaf: null,
                            },
                        },
                        ...COMPARATOR.map((c) => {
                            return {
                                name: c.display,
                                type: 'expression',
                                expression: c.value,
                                left: {
                                    id: '',
                                    placeholder: '',
                                    leaf: null,
                                },
                                right: {
                                    id: '',
                                    placeholder: '',
                                    leaf: null,
                                },
                            };
                        }),
                    ],
                },
                {
                    name: 'Custom',
                    options: MENU.custom,
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
            for (const concept in scope.pipelineAppCalculation.columns) {
                const column = scope.pipelineAppCalculation.columns[concept];

                group.options.push({
                    name: `${String(column.column).replace(/_/g, ' ')}`,
                    type: 'value',
                    data: {
                        type: scope.pipelineAppCtrl.type,
                        source: scope.pipelineAppCtrl.source.value,
                        calculation: {
                            selected: column,
                        },
                    },
                    view: '<pipeline-app-calculation-single type="data.type" source="data.source" calculation="data.calculation"></pipeline-app-calculation-single>',
                });
            }

            scope.pipelineAppCalculation.formula.menu.push(group);

            // create the formula
            const calculation = getCalculation();

            const tree = {
                placeholder: '',
                leaf:
                    calculation && calculation.selector
                        ? convertAdvanced(calculation.selector)
                        : null,
            };

            scope.pipelineAppCalculation.updateTree(tree);
        }

        /**
         * @name convertAdvanced
         * @desc convert the QS into a formula tree
         * @param {Selector} selector - selector portion of the query struct
         */
        function convertAdvanced(selector: any): Leaf | null {
            if (!selector) {
                return null;
            }

            const { type, content } = selector;

            if (type === 'FUNCTION') {
                const children = {};
                for (
                    let childIdx = 0, childLen = content.innerSelectors.length;
                    childIdx < childLen;
                    childIdx++
                ) {
                    children[`${childIdx}`] = {
                        placeholder: '',
                        leaf: convertAdvanced(content.innerSelectors[childIdx]),
                    };
                }

                return {
                    id: '',
                    type: 'function',
                    name: content.function,
                    function: content.function,
                    children: children,
                };
            } else if (type === 'ARITHMETIC') {
                return {
                    id: '',
                    type: 'expression',
                    name: content.mathExpr,
                    expression: content.mathExpr,
                    left: {
                        placeholder: '',
                        leaf: convertAdvanced(content.left[0]),
                    },
                    right: {
                        placeholder: '',
                        leaf: convertAdvanced(content.right[0]),
                    },
                };
            } else if (type === 'COLUMN') {
                return {
                    id: '',
                    type: 'value',
                    name: content.column,
                    view: '<pipeline-app-calculation-single type="data.type" source="data.source" calculation="data.calculation"></pipline-app-calculation-single>',
                    data: {
                        type: scope.pipelineAppCtrl.type,
                        source: scope.pipelineAppCtrl.source.value,
                        calculation: {
                            selected: content,
                        },
                    },
                };
            } else if (type === 'CONSTANT') {
                return {
                    id: '',
                    type: 'value',
                    name: content.constant,
                    view: '<pipeline-app-calculation-single type="data.type" source="data.source" calculation="data.calculation"></pipline-app-calculation-single>',
                    data: {
                        type: scope.pipelineAppCtrl.type,
                        source: scope.pipelineAppCtrl.source.value,
                        calculation: {
                            custom: true,
                            type: 'text',
                            value: content.constant,
                        },
                    },
                };
            } else if (type === 'IF_ELSE') {
                // special
                return {
                    id: '',
                    type: 'conditional',
                    name: 'If/Else',
                    condition: {
                        placeholder: '',
                        leaf: convertAdvancedCondition(content.condition),
                    },
                    truthy: {
                        placeholder: '',
                        leaf: convertAdvanced(content.precedent),
                    },
                    falsey: {
                        placeholder: '',
                        leaf: convertAdvanced(content.antecedent),
                    },
                };
            }

            return null;
        }

        /**
         * @name convertAdvancedCondition
         * @desc convert the QS into a formula tree
         * @param {Selector} selector - selector portion of the query struct
         */
        function convertAdvancedCondition(filter: any): Leaf | null {
            if (!filter) {
                return null;
            }

            const type = filter.type,
                content = filter.content;

            if (type === 'OR' || type === 'AND') {
                // not supported... yet
            } else if (type === 'SIMPLE') {
                const components: any[] = [],
                    chunks = [content.left, content.right];

                while (chunks.length > 0) {
                    const chunk = chunks.shift();

                    if (!chunk) {
                        continue;
                    }

                    let component;
                    if (chunk.pixelType === 'COLUMN') {
                        component = convertAdvanced(chunk.value[0]);
                    } else if (
                        chunk.pixelType === 'BOOLEAN' ||
                        chunk.pixelType === 'NULL_VALUE' ||
                        chunk.pixelType === 'CONST_STRING' ||
                        chunk.pixelType === 'CONST_INT' ||
                        chunk.pixelType === 'CONST_DATE' ||
                        chunk.pixelType === 'CONST_DECIMAL' ||
                        chunk.pixelType === 'LAMBDA'
                    ) {
                        component = convertAdvanced({
                            type: 'CONSTANT',
                            content: {
                                constant: chunk.value[0],
                            },
                        });
                    }

                    if (component) {
                        components.push(component);
                    }
                }

                return {
                    id: '',
                    type: 'expression',
                    name: content.comparator,
                    expression: content.comparator,
                    left: {
                        placeholder: '',
                        leaf: components[0] || null,
                    },
                    right: {
                        placeholder: '',
                        leaf: components[1] || null,
                    },
                };
            }

            return null;
        }

        /**
         * @name flushAdvanced
         * @desc flush the formula into a QS
         */
        function flushAdvanced(leaf: Leaf | null): any {
            if (!leaf) {
                return false;
            }

            if (leaf.type === 'function') {
                const innerSelectors: any[] = [];
                for (const childId in leaf.children) {
                    if (leaf.children.hasOwnProperty(childId)) {
                        const child = flushAdvanced(
                            leaf.children[childId].leaf
                        );

                        if (child) {
                            innerSelectors.push(child);
                        }
                    }
                }

                // content is valid
                if (innerSelectors.length === 0) {
                    return false;
                }

                return {
                    type: 'FUNCTION',
                    content: {
                        function: leaf.function,
                        innerSelectors: innerSelectors,
                    },
                };
            } else if (leaf.type === 'expression') {
                const left = flushAdvanced(leaf.left.leaf);

                if (!left) {
                    return false;
                }

                const right = flushAdvanced(leaf.right.leaf);

                if (!right) {
                    return false;
                }

                return {
                    type: 'ARITHMETIC',
                    content: {
                        mathExpr: leaf.expression,
                        left: [left],
                        right: [right],
                    },
                };
            } else if (leaf.type === 'value') {
                if (leaf.data.calculation.custom) {
                    return {
                        type: 'CONSTANT',
                        content: {
                            constant: leaf.data.calculation.value,
                        },
                    };
                }

                const column = leaf.data.calculation.selected;
                if (!column) {
                    return false;
                }

                return {
                    type: 'COLUMN',
                    content: {
                        alias: column.alias,
                        column: column.isPrimKey
                            ? 'PRIM_KEY_PLACEHOLDER'
                            : column.column,
                        table: column.table,
                    },
                };
            } else if (leaf.type === 'conditional') {
                // condition is a special case...
                const condition = flushAdvancedCondition(leaf.condition.leaf);
                if (!condition) {
                    return false;
                }

                const truthy = flushAdvanced(leaf.truthy.leaf);

                if (!truthy) {
                    return false;
                }

                const falsey = flushAdvanced(leaf.falsey.leaf);

                if (!falsey) {
                    return false;
                }

                return {
                    type: 'IF_ELSE',
                    content: {
                        condition: condition,
                        precedent: truthy,
                        antecedent: falsey,
                    },
                };
            }

            return false;
        }

        /**
         * @name flushAdvancedCondition
         * @desc flush the formula into a QS
         */
        function flushAdvancedCondition(leaf: Leaf | null): any {
            // condition is a special case...
            if (!leaf || leaf.type !== 'expression') {
                return false;
            }

            const left = flushAdvanced(leaf.left.leaf);
            if (!left) {
                return false;
            }

            const right = flushAdvanced(leaf.right.leaf);
            if (!right) {
                return false;
            }

            const condition = {
                type: 'SIMPLE',
                content: {
                    left: {
                        pixelType:
                            left.type === 'CONSTANT'
                                ? 'CONST_STRING'
                                : 'COLUMN',
                        value: [
                            left.type === 'CONSTANT'
                                ? left.content.constant
                                : left,
                        ],
                    },
                    comparator: leaf.expression,
                    right: {
                        pixelType:
                            right.type === 'CONSTANT'
                                ? 'CONST_STRING'
                                : 'COLUMN',
                        value: [
                            right.type === 'CONSTANT'
                                ? right.content.constant
                                : right,
                        ],
                    },
                },
            };

            return condition;
        }

        /**
         * @name getAdvanced
         * @desc get the advanced calculation object
         */
        function getAdvanced(): Calculation | false {
            const tree = scope.pipelineAppCalculation.getTree();

            // this is the calculation QS
            const selector = flushAdvanced(tree.leaf);

            if (!selector) {
                scope.widgetCtrl.alert(
                    'error',
                    'Calculation is not valid. Please validate calculation and fill in any missing fields.'
                );
                return false;
            }

            return {
                alias: String(scope.pipelineAppCalculation.name).replace(
                    /_/g,
                    ' '
                ),
                hasAliasError: false,
                selector: selector,
                type: 'Advanced',
            };
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            resetCalculation();
        }

        initialize();
    }
}
