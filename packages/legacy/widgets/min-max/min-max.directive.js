'use strict';

export default angular
    .module('app.min-max.directive', [])
    .directive('minMax', minMaxDirective);

minMaxDirective.$inject = ['$timeout'];

function minMaxDirective($timeout) {
    minMaxCtrl.$inject = [];
    minMaxLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'minMax',
        bindToController: {},
        template: require('./min-max.directive.html'),
        controller: minMaxCtrl,
        link: minMaxLink,
    };

    function minMaxCtrl() {}

    function minMaxLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        var minMaxUpdateFrameListener,
            minMaxUpdateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            titleTimeout,
            rangeTimeout;

        // variables
        scope.minMax.max = {
            show: false,
        };
        scope.minMax.min = {
            show: false,
        };

        // functions
        scope.minMax.updateRange = updateRange;
        scope.minMax.execute = execute;
        scope.minMax.resetTool = resetTool;

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

            scope.minMax.layout = scope.widgetCtrl.getWidget(
                'view.' + active + '.layout'
            );

            if (sharedTools.minMax) {
                scope.minMax.min = sharedTools.minMax.min;
                scope.minMax.max = sharedTools.minMax.max;
            } else {
                scope.minMax.min = {
                    show: false,
                };
                scope.minMax.max = {
                    show: false,
                };
            }
        }

        /**
         * @name updateRange
         * @desc update the axis title when user changes it
         * @returns {void}
         */
        function updateRange() {
            if (rangeTimeout) {
                $timeout.cancel(rangeTimeout);
            }

            rangeTimeout = $timeout(function () {
                execute();
            }, 800);
        }

        /**
         * @name execute
         * @desc executes the pixel with updated tools settings
         * @returns {void}
         */
        function execute() {
            var newTool = {},
                yMin = scope.minMax.min.value,
                yMax = scope.minMax.max.value;

            if (scope.minMax.min.value === null) {
                yMin = undefined;
            }

            if (scope.minMax.max.value === null) {
                yMax = undefined;
            }

            newTool.minMax = {};
            newTool.minMax.min = {
                show: scope.minMax.min.show,
                value: yMin,
            };
            newTool.minMax.max = {
                show: scope.minMax.max.show,
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

            scope.minMax.min = {
                show: false,
            };
            scope.minMax.max = {
                show: false,
            };

            newTool.minMax = false;

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
            minMaxUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            minMaxUpdateTaskListener = scope.widgetCtrl.on(
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
                minMaxUpdateFrameListener();
                minMaxUpdateTaskListener();
                updateOrnamentsListener();
                addDataListener();
            });

            resetPanel();
        }

        initialize();
    }
}
