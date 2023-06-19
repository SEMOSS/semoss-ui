'use strict';

import './mark-area.scss';

export default angular
    .module('app.mark-area.directive', [])
    .directive('markArea', markAreaDirective);

markAreaDirective.$inject = ['VIZ_COLORS'];

function markAreaDirective(VIZ_COLORS) {
    markAreaCtrl.$inject = [];
    markAreaLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'markArea',
        bindToController: {},
        template: require('./mark-area.directive.html'),
        controller: markAreaCtrl,
        link: markAreaLink,
    };

    function markAreaCtrl() {}

    function markAreaLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // variables
        scope.markArea.areas = [];
        scope.markArea.label = {
            show: false,
        };
        scope.markArea.x = {
            start: 0,
            end: 0,
        };
        scope.markArea.y = {
            start: 0,
            end: 0,
        };
        scope.markArea.selectedColor = '#ff0000';
        scope.markArea.selectedFontColor = '#000000';
        scope.markArea.fontSize = 12;
        scope.markArea.position = {
            list: [
                'top',
                'left',
                'right',
                'bottom',
                'inside',
                'insideLeft',
                'insideRight',
                'insideTop',
                'insideBottom',
                'insideTopLeft',
                'insideBottomLeft',
                'insideTopRight',
                'insideBottomRight',
            ],
            selected: 'top',
        };
        scope.markArea.selectedOpacity = 0.85;
        scope.markArea.theme = VIZ_COLORS.COLOR_SEMOSS;

        // functions
        scope.markArea.execute = execute;
        scope.markArea.removeFromAppliedAreas = removeFromAppliedAreas;

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

            scope.markArea.layout = selectedLayout;

            if (sharedTools.markArea) {
                scope.markArea.areas = sharedTools.markArea.areas || [];
            }
        }

        /**
         * @name removeFromAppliedAreas
         * @desc remove the selected line from the target line
         * @param {num} idx - selected line
         * @returns {void}
         */
        function removeFromAppliedAreas(idx) {
            scope.markArea.areas.splice(idx, 1);
            execute(false);
        }

        /**
         * @name execute
         * @desc executes the groub by
         * @param {bool} update whether to add rule or not
         * @returns {void}
         */
        function execute(update) {
            var newTool = {},
                area = {};

            // Define new rule
            if (update) {
                area = {
                    value: scope.markArea.value,
                    x: scope.markArea.x,
                    y: scope.markArea.y,
                    color: scope.markArea.selectedColor,
                    fontColor: scope.markArea.selectedFontColor,
                    opacity: scope.markArea.selectedOpacity || 0.85,
                    label: scope.markArea.label,
                    position: scope.markArea.position.selected,
                    fontSize: scope.markArea.fontSize,
                };
                scope.markArea.areas.unshift(area);
            }

            // Add rule to rule set and push to shared tools
            newTool.markArea = {};
            newTool.markArea.areas = scope.markArea.areas;

            // Reset selections for next rule
            // resetVariables();

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
        // function resetVariables() {
        //     scope.markArea.x = {
        //         start: 0,
        //         end: 0
        //     };
        //     scope.markArea.y = {
        //         start: 0,
        //         end: 0
        //     };
        //     scope.markArea.selectedColor = '#ff0000';
        //     scope.markArea.selectedOpacity = 0.85;
        //     scope.markArea.label = {
        //         show: false
        //     };
        //     scope.markArea.fontSize = 12;
        //     scope.markArea.position.selected = 'top';
        //     scope.markArea.selectedFontColor = '#000000';
        // }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var markAreaUpdateFrameListener,
                markAreaUpdateTaskListener,
                updateOrnamentsListener;

            // listeners
            markAreaUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            markAreaUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                markAreaUpdateFrameListener();
                markAreaUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
