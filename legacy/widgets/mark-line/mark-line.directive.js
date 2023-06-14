'use strict';

import './mark-line.scss';

export default angular
    .module('app.mark-line.directive', [])
    .directive('markLine', markLineDirective);

markLineDirective.$inject = ['VIZ_COLORS'];

function markLineDirective(VIZ_COLORS) {
    markLineCtrl.$inject = [];
    markLineLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'markLine',
        bindToController: {},
        template: require('./mark-line.directive.html'),
        controller: markLineCtrl,
        link: markLineLink,
    };

    function markLineCtrl() {}

    function markLineLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // variables
        scope.markLine.lines = [];
        scope.markLine.lineType = {
            selected: 'yAxis',
            options: [
                {
                    display: 'Horizontal',
                    value: 'yAxis',
                },
                {
                    display: 'Vertical',
                    value: 'xAxis',
                },
            ],
        };
        scope.markLine.lineStyle = {
            selected: 'solid',
            options: [
                {
                    display: 'Solid',
                    value: 'solid',
                },
                {
                    display: 'Dashed',
                    value: 'dashed',
                },
                {
                    display: 'Dotted',
                    value: 'dotted',
                },
            ],
        };
        scope.markLine.symbol = {
            start: 'none',
            end: 'none',
        };
        scope.markLine.symbolOptions = [
            {
                display: 'None',
                value: 'none',
            },
            {
                display: 'Arrow',
                value: 'arrow',
            },
            {
                display: 'Circle',
                value: 'circle',
            },
            {
                display: 'Diamond',
                value: 'diamond',
            },
        ];

        scope.markLine.label = {
            show: false,
        };
        scope.markLine.value = 0;
        scope.markLine.selectedColor = '#ff0000';
        scope.markLine.theme = VIZ_COLORS.COLOR_SEMOSS;

        // functions
        scope.markLine.execute = execute;
        scope.markLine.removeFromAppliedLines = removeFromAppliedLines;

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
                ),
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                );

            scope.markLine.layout = selectedLayout;

            if (sharedTools.markLine) {
                scope.markLine.lines = sharedTools.markLine.lines || [];
                scope.markLine.symbol = {
                    start: sharedTools.markLine.start || 'none',
                    end: sharedTools.markLine.end || 'none',
                };
            }
        }

        /**
         * @name removeFromAppliedLines
         * @desc remove the selected line from the target line
         * @param {num} idx - selected line
         * @returns {void}
         */
        function removeFromAppliedLines(idx) {
            scope.markLine.lines.splice(idx, 1);
            execute(false, scope.markLine.lines.length === 0);
        }

        /**
         * @name execute
         * @desc executes the groub by
         * @param {bool} update whether to add rule or not
         * @param {bool} noLines boolean to see if all lines have been removed
         * @returns {void}
         */
        function execute(update, noLines) {
            var newTool = {},
                line = {};

            // Define new rule
            if (update) {
                line = {
                    value: scope.markLine.value,
                    type: scope.markLine.lineType.selected || 'yAxis',
                    style: scope.markLine.lineStyle.selected || 'solid',
                    color: scope.markLine.selectedColor || '#ff0000',
                    label: scope.markLine.label,
                };
                scope.markLine.lines.unshift(line);
            }

            // Add rule to rule set and push to shared tools
            newTool.markLine = {};
            newTool.markLine.lines = scope.markLine.lines;
            newTool.markLine.start = scope.markLine.symbol.start;
            newTool.markLine.end = scope.markLine.symbol.end;

            // Reset selections for next rule
            // resetVariables();

            // no lines to paint so reset markLine back to false...
            if (noLines) {
                newTool.markLine = false;
            }

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

        /**
         * @name resetVariables
         * @desc function that resets scoped variables
         * @returns {void}
         */
        function resetVariables() {
            scope.markLine.lineType.selected = 'yAxis';
            scope.markLine.lineStyle.selected = 'solid';
            scope.markLine.value = 0;
            scope.markLine.selectedColor = '#ff0000';
            scope.markLine.label = {
                show: false,
            };
            scope.markLine.symbol = {
                start: 'none',
                end: 'none',
            };
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var markLineUpdateFrameListener,
                markLineUpdateTaskListener,
                updateOrnamentsListener;

            // listeners
            markLineUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            markLineUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                markLineUpdateFrameListener();
                markLineUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
