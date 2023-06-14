'use strict';

import './add.scss';

import '../pipeline';
import '../pipeline-app';

import { OPERATIONS, EXPRESSIONS, COMPARATOR } from '../../core/constants';
import angular from 'angular';

/**
 * @name add
 * @desc add tabular data - accessible through the left panel
 */
export default angular
    .module('app.add.directive', [
        'app.pipeline.component',
        'app.pipeline.pipeline-app',
    ])
    .directive('add', addDirective);

addDirective.$inject = ['semossCoreService', '$timeout'];

function addDirective(semossCoreService, $timeout) {
    addCtrl.$inject = ['$scope'];
    addLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        template: require('./add.directive.html'),
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        controller: addCtrl,
        controllerAs: 'add',
        bindToController: {},
        link: addLink,
    };

    function addCtrl($scope) {
        $scope.add.registerFormula = registerFormula;
        $scope.add.registerManualFormula = registerManualFormula;
        /**
         * @name registerFormula
         * @desc register the formula callbacks to the parent
         * @param {*} updateTree - get the tree from the view
         * @param {*} getTree - get the tree from the view
         */
        function registerFormula(updateTree, getTree): void {
            $scope.add.updateTree = updateTree;
            $scope.add.getTree = getTree;
        }

        /**
         * @name registerManualFormula
         * @desc register the manualformula callbacks to the parent
         * @param {*} manualQuery - get the manualQuery from the view
         */
        function registerManualFormula(manualQuery): void {
            $scope.add.manualQuery = manualQuery;
        }
    }

    function addLink(scope, ele, attrs, ctrl) {
        let keys;
        let updateTaskListener;
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.add.PIPELINE = scope.pipelineComponentCtrl !== null;
        scope.add.isTemporalFormula = false;
        scope.add.isColumnNameValid = true;
        scope.add.name = '';
        scope.add.open = false;
        scope.add.type = 'Simple';
        scope.add.query = '';
        scope.add.formula = {
            menu: [],
            options: {},
        };
        scope.add.simple = {
            column: {
                options: [],
                selected: '',
            },
            function: {
                options: [],
                selected: '',
            },
        };

        scope.add.canSubmit = canSubmit;
        scope.add.changeCalculationType = changeCalculationType;
        scope.add.execute = execute;
        scope.add.validateName = validateName;
        scope.add.cancel = cancel;

        const MENU = {
            custom: [
                {
                    name: 'Number',
                    type: 'value',
                    data: {
                        // app: scope.add.selectedApp,
                        calculation: {
                            custom: true,
                            type: 'number',
                            value: '',
                        },
                    },
                    view: '<pipeline-app-calculation-single app="data.app" calculation="data.calculation"></pipeline-app-calculation-single>',
                },
                {
                    name: 'String',
                    type: 'value',
                    data: {
                        // app: scope.add.selectedApp,
                        calculation: {
                            custom: true,
                            type: 'text',
                            value: '',
                        },
                    },
                    view: '<pipeline-app-calculation-single app="data.app" calculation="data.calculation"></pipeline-app-calculation-single>',
                },
            ],
        };

        /**
         * @name cancel
         * @desc closes pipeline component
         * @return {void}
         */
        function cancel() {
            scope.pipelineComponentCtrl.closeComponent();
        }

        /**
         * @name validateName
         * @desc validate the name
         * @returns {void}
         */
        function validateName() {
            const cleanedName = String(scope.add.name).replace(/ /g, '_');

            let isColumnNameValid = true;

            for (let i = 0, len = keys.length; i < len; i++) {
                if (cleanedName === keys[i].alias) {
                    // is it alraedy there?
                    scope.widgetCtrl.alert(
                        'warn',
                        'Name cannot exist in the Grid'
                    );
                    isColumnNameValid = false;
                    break;
                }
            }

            scope.add.isColumnNameValid = isColumnNameValid;
        }

        /**
         * @name getFrame
         * @param {string} accessor - how do we want to access the frame?
         * @returns {*} frame options
         */
        function getFrame(accessor) {
            if (scope.add.PIPELINE) {
                return scope.pipelineComponentCtrl.getComponent(
                    accessor
                        ? 'parameters.SOURCE.value.' + accessor
                        : 'parameters.SOURCE.value'
                );
            }

            return scope.widgetCtrl.getFrame(accessor);
        }

        /**
         * @name createCalculationHtml
         * @desc Takes the selected calculation and builds it in a pretty/readable format.
         * @param current - current level of the current calculation traversal
         * @returns the final html
         */
        function createCalculationHtml(selector: any): string {
            if (!selector) {
                return '';
            }

            const { type, content } = selector;

            if (type === 'FUNCTION') {
                return `${selector.content.function} ( ${content.innerSelectors
                    .map((s) => {
                        return createCalculationHtml(s);
                    })
                    .join('')} )`;
            } else if (type === 'ARITHMETIC') {
                return `( ${createCalculationHtml(content.left[0])} ${
                    content.mathExpr
                } ${createCalculationHtml(content.right[0])} )`;
            } else if (type === 'COLUMN') {
                return String(content.alias);
            } else if (type === 'CONSTANT') {
                if (typeof content.constant === 'number') {
                    return content.constant;
                }

                return `"${content.constant}"`;
            } else if (type === 'IF_ELSE') {
                return `If ( ${createCalculationHtml(
                    content.condition
                )}, ${createCalculationHtml(
                    content.precedent
                )}, ${createCalculationHtml(content.antecedent)} )`;
            }

            return '';
        }

        /**
         * @name changeCalculationType
         * @desc changes the type of calculation the user wants to make
         * @param type type of calculation (Simple, Advanced)
         */
        function changeCalculationType(type: string): void {
            scope.add.type = type;
        }

        /**
         * @name canSubmit
         * @desc validate the name
         * @returns {boolean} is the query valid
         */
        function canSubmit() {
            if (!scope.add.name) {
                return false;
            }

            if (scope.add.type === 'Simple') {
                if (
                    scope.add.simple.function.selected === undefined ||
                    scope.add.simple.column.selected === undefined
                ) {
                    return false;
                }
            } else if (scope.add.type === 'Advanced') {
                if (
                    scope.add.getTree().leaf === null ||
                    flushFormula(scope.add.getTree().leaf) === false
                ) {
                    return false;
                }
            } else if (scope.add.type === 'Manual') {
                if (!scope.add.manualQuery()) {
                    return false;
                }
            }

            for (
                let i = 0,
                    len = keys.length,
                    cleanedName = cleanName(scope.add.name);
                i < len;
                i++
            ) {
                if (cleanedName === keys[i].alias) {
                    return false;
                }
            }

            return true;
        }

        /**
         * Coerces into a string and replaces spaces with underscores
         * @param {string} string
         * @return {string}
         */
        function cleanName(string: string): string {
            return String(string).replace(/ /g, '_');
        }

        /**
         * Retrieves formula based on formula builder type
         * @return {{ alias: string, selector: string }[]}
         */
        function getCalculations(alias: string) {
            if (scope.add.type === 'Simple') {
                return [
                    {
                        alias,
                        selector: `${
                            scope.add.simple.function.selected.function
                        } ( ${cleanName(
                            scope.add.simple.column.selected.alias
                        )} )`,
                    },
                ];
            } else if (scope.add.type === 'Advanced') {
                return [
                    {
                        alias,
                        selector: createCalculationHtml(
                            flushFormula(scope.add.getTree().leaf)
                        ),
                    },
                ];
            } else if (scope.add.type === 'Manual') {
                return [
                    {
                        alias,
                        selector: scope.add.manualQuery(
                            scope.add.formula.query
                        ),
                    },
                ];
            }

            return [];
        }

        /**
         * @name buildParams
         * @desc build the params needed to run pixel in pipeline
         * @returns the params and their values
         */
        function buildParams(query) {
            const params = {
                SOURCE: {
                    name: scope.pipelineComponentCtrl.getComponent(
                        'parameters.SOURCE.value.name'
                    ),
                },
                QUERY: query,
            };

            return params;
        }

        /**
         * Executes addition of formula column on server. Displays a success or error message.
         * @return {void}
         */
        function execute(): void {
            const alias = cleanName(scope.add.name);
            const calculations = getCalculations(alias);

            if (scope.add.PIPELINE) {
                let pixelComponents = [
                        {
                            type: 'select2',
                            components: [calculations],
                        },
                        {
                            type: scope.add.isTemporalFormula
                                ? 'collectNewTemporalCol'
                                : 'collectNewCol',
                            components: [],
                            terminal: true,
                        },
                    ],
                    query = semossCoreService.pixel.build(pixelComponents);
                query = query.slice(0, -1);
                scope.pipelineComponentCtrl.executeComponent(
                    buildParams(query),
                    {}
                );
            } else {
                // get the current aliases
                const aliases = keys.map((k) => {
                    return {
                        alias: k.alias,
                    };
                });

                // add the new one
                aliases.push({
                    alias: alias,
                });

                const pixelComponents = [
                    {
                        type: 'frame',
                        components: [getFrame('name')],
                    },
                    {
                        type: 'select2',
                        components: [calculations],
                    },
                    {
                        type: scope.add.isTemporalFormula
                            ? 'collectNewTemporalCol'
                            : 'collectNewCol',
                        components: [],
                        terminal: true,
                    },
                    {
                        type: 'frame',
                        components: [getFrame('name')],
                    },
                    {
                        type: 'select2',
                        components: [aliases],
                    },
                    {
                        type: 'with',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'format',
                        components: ['table'],
                    },
                    {
                        type: 'taskOptions',
                        components: [
                            {
                                [scope.widgetCtrl.panelId]: {
                                    layout: 'Grid',
                                    alignment: {
                                        label: aliases.map((a) => {
                                            return a.alias;
                                        }),
                                    },
                                },
                            },
                        ],
                    },
                    {
                        type: 'collect',
                        components: [scope.widgetCtrl.getOptions('limit')],
                        terminal: true,
                    },
                ];

                scope.widgetCtrl.execute(pixelComponents, function (response) {
                    let outputIdx,
                        hasErrors = false;

                    for (
                        outputIdx = 0;
                        outputIdx < response.pixelReturn.length;
                        outputIdx++
                    ) {
                        if (
                            response.pixelReturn[
                                outputIdx
                            ].operationType.indexOf('ERROR') > -1
                        ) {
                            hasErrors = true;
                            break;
                        }
                    }

                    if (!hasErrors) {
                        scope.widgetCtrl.alert(
                            'success',
                            'Successfully added ' + alias + '.'
                        );

                        // set the view
                        scope.add.type = 'Simple';
                        scope.add.name = '';
                        scope.add.simple.column.selected = undefined;
                        scope.add.simple.function.selected = undefined;

                        //reset Manual box
                        scope.add.manualQuery(null);

                        // reset the tree
                        scope.add.updateTree({
                            placeholder: '',
                            leaf: null,
                        });
                    }
                });
            }
        }

        /**
         * @name resetCalculation
         * @desc reset the calculation
         */
        function resetCalculation(): void {
            // clear it out
            scope.add.formula = {
                menu: [],
                options: {}, // set the menu
            };

            // create the menu
            setMenu();
        }

        /**
         * @name setMenu
         * @desc set the menu from the calculation
         */
        function setMenu(): void {
            // Using Keys as getFrame('headers') is giving current frame data
            // scope.widgetCtrl.getFrame().headers is not giving headers for the current one
            const columns = keys ? keys : scope.widgetCtrl.getFrame().headers;

            scope.add.formula.menu = [
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
                    open: true,
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
                    open: true,
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
                    open: true,
                },
                {
                    name: 'Custom',
                    options: MENU.custom,
                    open: true,
                },
                {
                    name: 'Columns',
                    options: columns.map((column) => {
                        return {
                            name: `${String(column.alias).replace(/_/g, ' ')}`,
                            type: 'value',
                            data: {
                                app: scope.add.calculationApp,
                                calculation: {
                                    selected: column,
                                },
                            },
                            view: `<pipeline-app-calculation-single
                                app="data.app"
                                calculation="data.calculation"
                            ></pipeline-app-calculation-single>`,
                        };
                    }),
                    open: true,
                },
            ];

            // Set the options for simple calculations
            scope.add.simple.column.options = columns;
            scope.add.simple.function.options = OPERATIONS;
        }

        /**
         * @name flushFormula
         * @desc flush the formula into a QS
         */
        function flushFormula(leaf): any {
            if (!leaf) {
                return false;
            }

            if (leaf.type === 'function') {
                const innerSelectors: any[] = [];
                for (const childId in leaf.children) {
                    if (leaf.children.hasOwnProperty(childId)) {
                        const child = flushFormula(leaf.children[childId].leaf);

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
                const left = flushFormula(leaf.left.leaf);

                if (!left) {
                    return false;
                }

                const right = flushFormula(leaf.right.leaf);

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
                const condition = flushFormula(leaf.condition.leaf);

                if (!condition) {
                    return false;
                }

                const truthy = flushFormula(leaf.truthy.leaf);

                if (!truthy) {
                    return false;
                }

                const falsey = flushFormula(leaf.falsey.leaf);

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
         * Update keys
         * @return {void}
         */
        function updateKeys() {
            keys = getFrame('headers') || [];
        }

        /**
         * @name convertAdvancedCondition
         * @desc convert the QS into a formula tree
         * @param {Selector} selector - selector portion of the query struct
         */
        function convertAdvancedCondition(filter: any) {
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
         * @name convertAdvanced
         * @desc convert the QS into a formula tree
         * @param {Selector} selector - selector portion of the query struct
         */
        function convertAdvanced(selector: any) {
            const source =
                scope.pipelineComponentCtrl.getComponent('parameters.SOURCE');

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
                        type: scope.add.type,
                        source: source.value,
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
                        type: 'Advanced',
                        source: source.value,
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
         * @name advancedToManual
         * @desc convert the QS into a string query
         * @param {Selector} selector - selector portion of the query struct
         */
        function advancedToManual(selector: any) {
            if (!selector) {
                return null;
            }

            const { type, content } = selector;

            if (type === 'FUNCTION') {
                let children = '';
                for (
                    let childIdx = 0, childLen = content.innerSelectors.length;
                    childIdx < childLen;
                    childIdx++
                ) {
                    children =
                        children +
                        advancedToManual(content.innerSelectors[childIdx]);
                    if (childIdx < childLen - 1) {
                        children = children + ', ';
                    }
                }
                return content.function + ' ( ' + children + ' ) ';
            } else if (type === 'COLUMN') {
                return content.alias;
            } else if (type === 'ARITHMETIC') {
                return (
                    '( ' +
                    advancedToManual(content.left[0]) +
                    ' ' +
                    content.mathExpr +
                    ' ' +
                    advancedToManual(content.right[0]) +
                    ' )'
                );
            } else if (type === 'CONSTANT') {
                return content.constant;
            } else if (type === 'IF_ELSE') {
                return content.pixelString;
            }

            return null;
        }

        /**
         * @name parseQS
         * @desc parse the qs
         */
        function parseQS(qsComponent) {
            const selected: any = [];
            for (
                let selectorIdx = 0, selectorLen = qsComponent.selectors.length;
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
                    selected.push({
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

            return selected;
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize() {
            updateTaskListener = scope.widgetCtrl.on(
                'update-task',
                function () {
                    updateKeys();
                    resetCalculation();
                }
            );

            // when directive ends, make sure to clean out excess listeners and dom elements outside of the scope
            scope.$on('$destroy', function () {
                console.log('destroying formula....');
                updateTaskListener();
            });

            updateKeys();
            resetCalculation();
            if (scope.add.PIPELINE) {
                const qs = scope.pipelineComponentCtrl.getComponent(
                    'parameters.QS.value'
                );
                if (qs) {
                    scope.add.type = 'Advanced';
                    const calculation = parseQS(qs)[0];
                    const tree = {
                        placeholder: '',
                        leaf:
                            calculation && calculation.selector
                                ? convertAdvanced(calculation.selector)
                                : null,
                    };
                    scope.add.name = calculation ? calculation.alias : '';

                    // Parsing the calcualtion for Manual Query box
                    scope.add.query = advancedToManual(calculation.selector);

                    $timeout(function () {
                        scope.add.updateTree(tree);
                        scope.add.manualQuery(scope.add.query);
                    });
                }
            }
        }

        initialize();
    }
}
