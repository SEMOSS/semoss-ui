'use strict';

export default angular
    .module('app.bar-image.directive', [])
    .directive('barImage', barImageDirective);

import './bar-image.scss';

barImageDirective.$inject = [];

function barImageDirective() {
    barImageCtrl.$inject = [];
    barImageLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'barImage',
        bindToController: {},
        template: require('./bar-image.directive.html'),
        controller: barImageCtrl,
        link: barImageLink,
    };

    function barImageCtrl() {}

    function barImageLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var barImageUpdateFrameListener,
            barImageUpdateTaskListener,
            updateOrnamentsListener;

        // variables
        scope.barImage.borderRadius = 0;
        scope.barImage.symbols = [
            'Default (Bar)',
            'Custom URL',
            'Circle',
            'Rectangle',
            'Round Rectangle',
            'Triangle',
            'Diamond',
            'Pin',
            'Arrow',
        ];
        scope.barImage.selectedSymbol = 'Default (Bar)';
        scope.barImage.url = '';

        // functions
        scope.barImage.executeGroup = executeGroup;

        /** Logic **/
        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            var active = scope.widgetCtrl.getWidget('active'),
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                );

            scope.barImage.selectedSymbol = getSymbolName(
                sharedTools.barImage.symbol
            );
            scope.barImage.borderRadius =
                sharedTools.barImage.borderRadius || 0;

            if (
                sharedTools.barImage.symbolSize &&
                typeof sharedTools.barImage.symbolSize === 'object'
            ) {
                scope.barImage.symbolSize = 20;
            } else {
                scope.barImage.symbolSize =
                    sharedTools.barImage.symbolSize || 20;
            }
            if (sharedTools.barImage.repeat === false) {
                scope.barImage.repeat = false;
            } else {
                scope.barImage.repeat = true;
            }
            if (sharedTools.barImage.clip === false) {
                scope.barImage.clip = false;
            } else {
                scope.barImage.clip = true;
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

            if (typeof name === 'undefined' || name === 'Default (Bar)') {
                return 'Default (Bar)';
            }

            if (name.indexOf('image://') === 0) {
                originalName = 'url';
                scope.barImage.url = name.slice(8);
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
                selectedSymbol,
                selectedBorderRadius,
                execute = true;

            // Define symbol
            if (scope.barImage.selectedSymbol === 'Custom URL') {
                selectedSymbol = 'image://' + scope.barImage.url;
                if (scope.barImage.url === '') {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Please enter a valid imgage url path.'
                    );
                    execute = false;
                }
            } else if (scope.barImage.selectedSymbol === 'Circle') {
                selectedSymbol = 'circle';
                selectedBorderRadius = 0;
            } else if (scope.barImage.selectedSymbol === 'Rectangle') {
                selectedSymbol = 'rect';
                selectedBorderRadius = 0;
            } else if (scope.barImage.selectedSymbol === 'Round Rectangle') {
                selectedSymbol = 'roundRect';
                selectedBorderRadius = 0;
            } else if (scope.barImage.selectedSymbol === 'Triangle') {
                selectedSymbol = 'triangle';
                selectedBorderRadius = 0;
            } else if (scope.barImage.selectedSymbol === 'Diamond') {
                selectedSymbol = 'diamond';
                selectedBorderRadius = 0;
            } else if (scope.barImage.selectedSymbol === 'Pin') {
                selectedSymbol = 'pin';
                selectedBorderRadius = 0;
            } else if (scope.barImage.selectedSymbol === 'Arrow') {
                selectedSymbol = 'arrow';
                selectedBorderRadius = 0;
            } else {
                selectedSymbol = 'Default (Bar)';
                selectedBorderRadius = scope.barImage.borderRadius;
            }

            if (update) {
                newTool.barImage = {
                    symbol: selectedSymbol,
                    repeat: scope.barImage.repeat,
                    clip: scope.barImage.clip,
                    borderRadius: selectedBorderRadius,
                };
                if (scope.barImage.repeat === false) {
                    newTool.barImage.symbolSize = ['100%', '100%'];
                } else {
                    newTool.barImage.symbolSize = scope.barImage.symbolSize;
                }
            } else {
                newTool.barImage = false;
                scope.barImage.selectedSymbol = 'Default (Bar)';
                scope.barImage.symbolSize = 20;
                scope.barImage.repeat = true;
                scope.barImage.clip = true;
                scope.barImage.borderRadius = 0;
            }

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
            // listeners
            barImageUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            barImageUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                barImageUpdateFrameListener();
                barImageUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
