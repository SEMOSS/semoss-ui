'use strict';

import './customize-symbol.scss';

export default angular
    .module('app.customize-symbol.directive', [])
    .directive('customizeSymbol', customizeSymbolDirective);

customizeSymbolDirective.$inject = ['semossCoreService', 'VIZ_COLORS'];

function customizeSymbolDirective(semossCoreService, VIZ_COLORS) {
    customizeSymbolCtrl.$inject = [];
    customizeSymbolLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'customizeSymbol',
        bindToController: {},
        template: require('./customize-symbol.directive.html'),
        controller: customizeSymbolCtrl,
        link: customizeSymbolLink,
    };

    function customizeSymbolCtrl() {}

    function customizeSymbolLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var customizeSymbolUpdateFrameListener,
            customizeSymbolUpdateTaskListener,
            updateOrnamentsListener;

        // variables
        scope.customizeSymbol.symbols = [
            'Custom URL',
            'Circle',
            'Empty Circle',
            'Rectangle',
            'Round Rectangle',
            'Triangle',
            'Diamond',
            'Pin',
            'Arrow',
        ];
        scope.customizeSymbol.viewType = '';
        scope.customizeSymbol.symbolSize = 15;
        scope.customizeSymbol.url = '';
        scope.customizeSymbol.rules = [];
        scope.customizeSymbol.instances = [];
        scope.customizeSymbol.showInstances = false;
        scope.customizeSymbol.theme = VIZ_COLORS.COLOR_SEMOSS;
        scope.customizeSymbol.specifyColor = false;

        // functions
        scope.customizeSymbol.executeGroup = executeGroup;
        scope.customizeSymbol.getUniqueInstances = getUniqueInstances;
        scope.customizeSymbol.removeFromAppliedRules = removeFromAppliedRules;
        scope.customizeSymbol.updateRule = updateRule;

        /** Logic **/
        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            var active = scope.widgetCtrl.getWidget('active'),
                layout = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.' + active + '.keys.' + layout
                ),
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                ),
                key;

            scope.customizeSymbol.selectedLayout = scope.widgetCtrl.getWidget(
                'view.visualization.layout'
            );
            if (scope.customizeSymbol.selectedLayout === 'GraphGL') {
                scope.customizeSymbol.symbols = [
                    'Circle',
                    'Rectangle',
                    'Round Rectangle',
                    'Triangle',
                    'Diamond',
                    'Pin',
                    'Arrow',
                ];
            }

            if (sharedTools.customizeSymbol) {
                scope.customizeSymbol.rules =
                    sharedTools.customizeSymbol.rules || [];
            }

            scope.customizeSymbol.symbolSize =
                scope.customizeSymbol.rules.length === 0
                    ? 15
                    : scope.customizeSymbol.rules[0].symbolSize;
            scope.customizeSymbol.headers = ['All Nodes'];
            scope.customizeSymbol.viewTypes = ['noneExist', ''];
            scope.customizeSymbol.selectedSymbol = 'Circle';
            scope.customizeSymbol.showInstances = false;
            scope.customizeSymbol.specifyColor = false;
            scope.customizeSymbol.selectedColor = null;

            for (key in keys) {
                if (keys[key].model === 'start' || keys[key].model === 'end') {
                    if (
                        scope.customizeSymbol.headers.indexOf(
                            keys[key].alias
                        ) === -1
                    ) {
                        scope.customizeSymbol.headers.push(keys[key].alias);
                    }
                }
            }
        }

        /**
         * @name getUniqueInstances
         * @desc executes the groub by
         * @param {string} selectedDim - selected dimension to group by
         * @returns {void}
         */
        function getUniqueInstances() {
            if (scope.customizeSymbol.selectedHeader !== 'All Nodes') {
                var limit = scope.widgetCtrl.getOptions('limit'),
                    callback;

                callback = function (output) {
                    var selectedDimInstances =
                            output.pixelReturn[0].output.data.values,
                        i;

                    scope.customizeSymbol.viewTypes = [];
                    for (i = 0; i < selectedDimInstances.length; i++) {
                        scope.customizeSymbol.viewTypes.push(
                            selectedDimInstances[i][0]
                        );
                    }
                };

                scope.widgetCtrl.meta(
                    [
                        {
                            meta: true,
                            type: 'Pixel',
                            components: [
                                'Select (' +
                                    scope.customizeSymbol.selectedHeader +
                                    ') | Collect(' +
                                    limit +
                                    ');',
                            ],
                            terminal: true,
                        },
                    ],
                    callback
                );
            }
        }

        /**
         * @name removeFromAppliedRules
         * @desc executes the groub by
         * @param {num} idx - selected dimension to group by
         * @returns {void}
         */
        function removeFromAppliedRules(idx) {
            scope.customizeSymbol.rules.splice(idx, 1);
            executeGroup(false);
        }

        /**
         * @name removeFromAppliedRules
         * @desc executes the groub by
         * @param {num} idx - selected dimension to group by
         * @returns {void}
         */
        function updateRule(idx) {
            scope.customizeSymbol.selectedHeader =
                scope.customizeSymbol.rules[idx].dimension;
            getUniqueInstances();
            scope.customizeSymbol.instances =
                scope.customizeSymbol.rules[idx].instances;
            scope.customizeSymbol.selectedSymbol = getSymbolName(
                scope.customizeSymbol.rules[idx].symbol
            );
            scope.customizeSymbol.symbolSize =
                scope.customizeSymbol.rules[idx].symbolSize;

            if (
                scope.customizeSymbol.rules[idx].symbol.indexOf('image://') ===
                0
            ) {
                scope.customizeSymbol.url =
                    scope.customizeSymbol.rules[idx].symbol.slice(8);
            }

            if (scope.customizeSymbol.rules[idx].specifyColor) {
                scope.customizeSymbol.specifyColor = true;
                scope.customizeSymbol.selectedColor =
                    scope.customizeSymbol.rules[idx].selectedColor;
            }

            if (scope.customizeSymbol.selectedHeader !== 'All Nodes') {
                scope.customizeSymbol.showInstances = true;
            } else {
                scope.customizeSymbol.showInstances = false;
            }
        }

        /**
         * @name getSymbolName
         * @desc executes the groub by
         * @param {string} name - selected dimension to group by
         * @returns {string} original name
         */
        function getSymbolName(name) {
            var originalName = name,
                cleanName;

            if (name.indexOf('image://') === 0) {
                originalName = 'url';
            }

            switch (originalName) {
                case 'circle':
                    cleanName = 'Circle';
                    break;
                case 'rect':
                    cleanName = 'Rectangle';
                    break;
                case 'roundRect':
                    cleanName = 'Round Rectangle';
                    break;
                case 'triangle':
                    cleanName = 'Triangle';
                    break;
                case 'diamond':
                    cleanName = 'Diamond';
                    break;
                case 'pin':
                    cleanName = 'Pin';
                    break;
                case 'arrow':
                    cleanName = 'Arrow';
                    break;
                case 'emptyCircle':
                    cleanName = 'Empty Circle';
                    break;
                case 'url':
                    cleanName = 'Custom URL';
                    break;
                default:
                    cleanName = 'Circle';
            }
            return cleanName;
        }

        /**
         * @name executeGroup
         * @desc executes the groub by
         * @param {bool} update whether to add rule or not
         * @returns {void}
         */
        function executeGroup(update) {
            var newTool = {},
                rule = {},
                selectedSymbol,
                execute = true;

            // Define symbol
            if (scope.customizeSymbol.selectedSymbol === 'Custom URL') {
                selectedSymbol = 'image://' + scope.customizeSymbol.url;
                if (scope.customizeSymbol.url === '') {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Please enter a valid imgage url path.'
                    );
                    execute = false;
                }
            } else if (scope.customizeSymbol.selectedSymbol === 'Circle') {
                selectedSymbol = 'circle';
            } else if (scope.customizeSymbol.selectedSymbol === 'Rectangle') {
                selectedSymbol = 'rect';
            } else if (
                scope.customizeSymbol.selectedSymbol === 'Round Rectangle'
            ) {
                selectedSymbol = 'roundRect';
            } else if (scope.customizeSymbol.selectedSymbol === 'Triangle') {
                selectedSymbol = 'triangle';
            } else if (scope.customizeSymbol.selectedSymbol === 'Diamond') {
                selectedSymbol = 'diamond';
            } else if (scope.customizeSymbol.selectedSymbol === 'Pin') {
                selectedSymbol = 'pin';
            } else if (scope.customizeSymbol.selectedSymbol === 'Arrow') {
                selectedSymbol = 'arrow';
            } else if (
                scope.customizeSymbol.selectedSymbol === 'Empty Circle'
            ) {
                selectedSymbol = 'emptyCircle';
            } else {
                selectedSymbol = 'circle';
            }

            // Define new rule
            if (update) {
                rule.dimension =
                    scope.customizeSymbol.selectedHeader || 'All Nodes';
                rule.instances = scope.customizeSymbol.instances || [];
                rule.symbol = selectedSymbol;
                rule.symbolSize = scope.customizeSymbol.symbolSize || 12;
                if (
                    scope.customizeSymbol.selectedHeader === undefined ||
                    scope.customizeSymbol.selectedHeader === 'All Nodes' ||
                    scope.customizeSymbol.instances.length ===
                        scope.customizeSymbol.viewTypes.length ||
                    scope.customizeSymbol.instances.length === 0
                ) {
                    rule.icon = {};
                    rule.icon.dimension =
                        scope.customizeSymbol.selectedHeader || 'All Nodes';
                    rule.icon.symbol = selectedSymbol;
                }
                if (scope.customizeSymbol.specifyColor) {
                    rule.specifyColor = true;
                    rule.selectedColor = scope.customizeSymbol.selectedColor;
                }
                scope.customizeSymbol.rules.unshift(rule);
            }

            // Add rule to rule set and push to shared tools
            newTool.customizeSymbol = {};
            newTool.customizeSymbol.rules = scope.customizeSymbol.rules;

            // Reset selections for next rule
            scope.customizeSymbol.instances = [];
            scope.customizeSymbol.symbolSize = 15;
            scope.customizeSymbol.selectedHeader = 'All Nodes';
            scope.customizeSymbol.showInstances = false;
            scope.customizeSymbol.specifyColor = false;

            if (execute) {
                scope.widgetCtrl.execute([
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'addPanelOrnaments',
                        components: [
                            {
                                tools: {
                                    shared: newTool,
                                },
                            },
                        ],
                        terminal: true,
                    },
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'retrievePanelOrnaments',
                        components: ['tools'],
                        terminal: true,
                    },
                ]);
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            // cleanup
            scope.$on('$destroy', function () {
                customizeSymbolUpdateFrameListener();
                customizeSymbolUpdateTaskListener();
                updateOrnamentsListener();
            });

            // listeners
            customizeSymbolUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            customizeSymbolUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            resetPanel();
        }

        initialize();
    }
}
