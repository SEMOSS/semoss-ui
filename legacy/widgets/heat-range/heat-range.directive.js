'use strict';

export default angular
    .module('app.heat-range.directive', [])
    .directive('heatRange', heatRangeDirective);

heatRangeDirective.$inject = ['$timeout'];

function heatRangeDirective($timeout) {
    heatRangeCtrl.$inject = [];
    heatRangeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'heatRange',
        bindToController: {},
        template: require('./heat-range.directive.html'),
        controller: heatRangeCtrl,
        link: heatRangeLink,
    };

    function heatRangeCtrl() {}

    function heatRangeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        var heatRangeUpdateFrameListener,
            heatRangeUpdateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            titleTimeout,
            rangeTimeout;

        // variables
        scope.heatRange.max = {
            show: false,
        };
        scope.heatRange.min = {
            show: false,
        };

        // functions
        scope.heatRange.execute = execute;
        scope.heatRange.resetTool = resetTool;

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

            if (sharedTools.heatRange) {
                scope.heatRange.min = sharedTools.heatRange.min;
                scope.heatRange.max = sharedTools.heatRange.max;
            } else {
                scope.heatRange.min = {
                    show: false,
                };
                scope.heatRange.max = {
                    show: false,
                };
            }
        }

        /**
         * @name execute
         * @desc executes the pixel with updated tools settings
         * @returns {void}
         */
        function execute() {
            var newTool = {},
                yMin = scope.heatRange.min.value,
                yMax = scope.heatRange.max.value;

            if (scope.heatRange.min.value === null) {
                yMin = undefined;
            }

            if (scope.heatRange.max.value === null) {
                yMax = undefined;
            }

            newTool.heatRange = {};
            newTool.heatRange.min = {
                show: scope.heatRange.min.show,
                value: yMin,
            };
            newTool.heatRange.max = {
                show: scope.heatRange.max.show,
                value: yMax,
            };

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
         * @name resetTool
         * @desc reset tool and execute pixel
         * @returns {void}
         */
        function resetTool() {
            var newTool = {};

            scope.heatRange.min = {
                show: false,
            };
            scope.heatRange.max = {
                show: false,
            };

            newTool.heatRange = false;

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
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            // listeners
            heatRangeUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            heatRangeUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );
            addDataListener = scope.widgetCtrl.on('added-data', resetPanel);

            // cleanup
            scope.$on('$destroy', function () {
                heatRangeUpdateFrameListener();
                heatRangeUpdateTaskListener();
                updateOrnamentsListener();
                addDataListener();
            });

            resetPanel();
        }

        initialize();
    }
}
