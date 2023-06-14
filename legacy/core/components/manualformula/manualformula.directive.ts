import * as angular from 'angular';

import './manualformula.scss';

export type Root = Stem;

export type Leaf =
    | ValueLeaf
    | ExpressionLeaf
    | FunctionLeaf
    | GroupLeaf
    | ConditionalLeaf;

export interface Stem {
    placeholder: string;
    leaf: Leaf | null;
}

export interface ValueLeaf extends BaseLeaf {
    type: 'value';
    view: string;
}

export interface ExpressionLeaf extends BaseLeaf {
    type: 'expression';
    expression: string;
    left: Stem;
    right: Stem;
}

export interface FunctionLeaf extends BaseLeaf {
    type: 'function';
    function: string;
    children: {
        [child: string]: Stem;
    };
}

export interface GroupLeaf extends BaseLeaf {
    type: 'group';
    selected: string;
    options: string[];
    children: {
        [child: string]: Stem;
    };
}

export interface ConditionalLeaf extends BaseLeaf {
    type: 'conditional';
    condition: Stem;
    truthy: Stem;
    falsey: Stem;
}

interface BaseLeaf {
    id: string;
    type: string;
    name: string;
    color?: 'primary' | 'success' | 'warn' | 'error' | string;
    vertical?: boolean;
    data?: any;
}

export default angular
    .module('app.manualformula.directive', [])
    .directive('manualformula', manualformulaDirective);

manualformulaDirective.$inject = ['$timeout'];

function manualformulaDirective($timeout: ng.ITimeoutService) {
    manualformulaCtrl.$inject = [];
    manualformulaLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'E',
        template: require('./manualformula.directive.html'),
        scope: true, // manualformula + it's helpers have a prototypical scope, so they can compile correctly
        require: [],
        controller: manualformulaCtrl,
        controllerAs: 'manualformula',
        bindToController: {
            menu: '=',
            manualregister: '&?',
        },
        link: manualformulaLink,
    };

    function manualformulaCtrl() {}

    function manualformulaLink(scope, ele) {
        let ace,
            editorEle = HTMLElement,
            editor,
            editorLanguageTools;

        scope.manualformula.rendered = {
            options: [],
            search: '',
        };

        // store the data for each leaf
        scope.manualformula.searchMenu = searchMenu;

        // store the data for manual box
        scope.manualformula.query = '';

        //Clear Query
        scope.manualformula.clearQuery = clearQuery;
        /** Menu */
        /**
         * @name setMenu
         * @desc set the initial menu
         */
        function setMenu() {
            scope.manualformula.rendered = {
                raw: scope.manualformula.menu || [],
                searched: [],
                search: '',
            };

            searchMenu();
        }

        /**
         * @name clearQuery
         * @desc Empties the Query Box
         * @return {void}
         */
        function clearQuery() {
            scope.manualformula.query = '';
            if (editor) {
                editor.setValue('');
            }
        }

        /** Editor */
        /**
         * @name initializeEditor
         * @desc sets up ace editor
         * @return {void}
         */
        function initializeEditor() {
            editorLanguageTools = ace.require('ace/ext/language_tools');
            editor = ace.edit(editorEle);
            editor.setTheme('ace/theme/chrome');
            editor.setShowPrintMargin(false);
            editor.setFontSize(16);
            editor.session.setMode('ace/mode/formula');
            editor.setOptions({
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true,
                autoScrollEditorIntoView: true,
                wrap: true,
                useWorker: false,
            });
            // need this to turn off an ace message clogging up console
            editor.$blockScrolling = Infinity;

            // Adding this if to preserve the query on edit after import.
            if (scope.manualformula.query) {
                editor.setValue(scope.manualformula.query);
            }

            // Passing the data to exisiting scope variable to use the existing code flow.
            editor.session.on('change', function () {
                scope.manualformula.query = editor.getValue();
                editor.resize();
            });

            updateAutocomplete();
        }

        /**
         * @name updateAutocomplete
         * @desc update the information based on the selected frame and menu
         * @returns {void}
         */
        function updateAutocomplete() {
            let editorPixelCompleter,
                reactorAutoComplete: {
                    name: string;
                    value: string;
                    meta: string;
                    score: number;
                }[] = [];

            for (
                let menuIdx = 0, menuLen = scope.manualformula.menu.length;
                menuIdx < menuLen;
                menuIdx++
            ) {
                for (
                    let keywordIdx = 0,
                        keywordLen =
                            scope.manualformula.menu[menuIdx].options.length;
                    keywordIdx < keywordLen;
                    keywordIdx++
                ) {
                    const keyword =
                        scope.manualformula.menu[menuIdx].options[keywordIdx];

                    if (
                        keyword.type === 'value' &&
                        keyword.name !== 'Number' &&
                        keyword.name !== 'String'
                    ) {
                        reactorAutoComplete.push({
                            name: keyword.name,
                            value: keyword.data.calculation.selected.alias,
                            meta: 'columnName',
                            score: 0,
                        });
                    }
                }
            }

            reactorAutoComplete.push({
                name: 'IF/Else',
                value: 'If(Condition,True,False)',
                meta: 'IF/Else',
                score: 0,
            });

            editorPixelCompleter = {
                id: 'pixel',
                getCompletions: function (e, s, p, pre, cb) {
                    cb(null, reactorAutoComplete);
                },
            };
            if (
                typeof reactorAutoComplete !== 'undefined' &&
                typeof editorLanguageTools !== 'undefined'
            ) {
                // set the completer
                editorLanguageTools.setCompleters([
                    editorLanguageTools.snippetCompleter,
                    editorLanguageTools.textCompleter,
                    editorLanguageTools.keyWordCompleter,
                    editorPixelCompleter,
                ]);
            }
        }

        /**
         * @name searchMenu
         * @desc search the menu items
         */
        function searchMenu() {
            const cleaned = String(scope.manualformula.rendered.search)
                .replace(/ /g, '_')
                .toUpperCase();

            if (!cleaned) {
                scope.manualformula.rendered.searched =
                    scope.manualformula.rendered.raw;
                return;
            }

            scope.manualformula.rendered.searched = [];

            for (
                let groupIdx = 0,
                    groupLen = scope.manualformula.rendered.raw.length;
                groupIdx < groupLen;
                groupIdx++
            ) {
                const group = scope.manualformula.rendered.raw[groupIdx],
                    holder: {
                        name: string;
                        options: any[];
                        open: boolean;
                    } = {
                        name: group.name,
                        options: [],
                        open: true,
                    };

                for (
                    let optionIdx = 0, optionLen = group.options.length;
                    optionIdx < optionLen;
                    optionIdx++
                ) {
                    const option = group.options[optionIdx],
                        name = String(option.name)
                            .replace(/ /g, '_')
                            .toUpperCase();

                    if (name && name.indexOf(cleaned) > -1) {
                        holder.options.push(option);
                    }
                }

                if (holder.options.length > 0) {
                    scope.manualformula.rendered.searched.push(holder);
                }
            }
        }

        /**
         * @name generateNameId
         * @desc generates the NameId
         */
        function generateNameId(name: string) {
            return name.split(/\/| /).join('-');
        }

        /**
         * @name manualQuery
         * @desc update or get the query
         * @returns the query from the query box
         * @param query - To set the query from parent
         */
        function manualQuery(query: string) {
            if (query === null) {
                clearQuery();
            } else if (query) {
                scope.manualformula.query = query;
                editor.setValue(query);
            }
            return scope.manualformula.query;
        }

        /** Utility */
        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            scope.$watch(
                function () {
                    //Adding resize to resize the editor when used from Additional Tool
                    if (editor) {
                        editor.resize();
                    }
                    return JSON.stringify(scope.manualformula.menu);
                },
                function () {
                    $timeout(() => {
                        if (scope.manualformula.menu.length > 0) {
                            const dataToTransfer = {};
                            //Generating formula option ids and populating dataTransfer object with [id]:[data_to_transfer_to_editor]
                            scope.manualformula.menu.forEach(
                                (group, groupIdx) => {
                                    if (group.name == 'Functions') {
                                        group.options.forEach((op, opIdx) => {
                                            scope.manualformula.menu[
                                                groupIdx
                                            ].options[
                                                opIdx
                                            ].id = `${op.type}-${op.function}`;
                                            dataToTransfer[
                                                `${op.type}-${op.function}`
                                            ] = op.function + '( ColumnName )';
                                        });
                                    } else {
                                        group.options.forEach((op, opIdx) => {
                                            scope.manualformula.menu[
                                                groupIdx
                                            ].options[opIdx].id = `${
                                                op.type
                                            }-${generateNameId(op.name)}`;
                                            switch (op.type) {
                                                case 'expression': {
                                                    dataToTransfer[
                                                        `${
                                                            op.type
                                                        }-${generateNameId(
                                                            op.name
                                                        )}`
                                                    ] = op.expression;
                                                    break;
                                                }
                                                case 'conditional': {
                                                    dataToTransfer[
                                                        `${
                                                            op.type
                                                        }-${generateNameId(
                                                            op.name
                                                        )}`
                                                    ] = `If(${op.condition.placeholder},${op.truthy.placeholder},${op.falsey.placeholder})`;
                                                    break;
                                                }
                                                case 'value': {
                                                    if (
                                                        op.data.calculation
                                                            .selected
                                                    ) {
                                                        dataToTransfer[
                                                            `${
                                                                op.type
                                                            }-${generateNameId(
                                                                op.name
                                                            )}`
                                                        ] =
                                                            op.data.calculation.selected.alias;
                                                    } else {
                                                        dataToTransfer[
                                                            `${
                                                                op.type
                                                            }-${generateNameId(
                                                                op.name
                                                            )}`
                                                        ] = `<${op.data.calculation.type}>`;
                                                    }
                                                    break;
                                                }
                                            }
                                        });
                                    }
                                }
                            );

                            //Using a common top level listener for all the different option divs
                            const manualFormOptions = document.querySelector(
                                '#manualformula_options'
                            );

                            if (manualFormOptions) {
                                manualFormOptions.addEventListener(
                                    'dragstart',
                                    (evt: any) => {
                                        evt.dataTransfer.setData(
                                            'text',
                                            dataToTransfer[evt.target.id]
                                        );
                                    }
                                );
                            }
                        }
                    }, 10);
                    setMenu();
                }
            );

            // get the editor div
            editorEle = ele[0].querySelector('#manualformula__manual__editor');

            // register the newly create scope
            if (scope.manualformula.hasOwnProperty('manualregister')) {
                scope.manualformula.manualregister({
                    manualQuery: manualQuery,
                });
            }

            // Importing ace js
            import(
                /* webpackChunkName: "ace"  */ /* webpackPrefetch: true */ '../../../core/components/terminal/ace'
            )
                .then((module) => {
                    ace = module.ace;
                    // initialize the editor
                    initializeEditor();
                })
                .catch((err) => {
                    console.error('Error: ', err);
                });
        }

        initialize();
    }
}
