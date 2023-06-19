'use strict';

import './customize-label.scss';

export default angular
    .module('app.customize-label.directive', [])
    .directive('customizeLabel', customizeLabelDirective);

customizeLabelDirective.$inject = ['VIZ_COLORS', '$timeout'];

function customizeLabelDirective(VIZ_COLORS, $timeout) {
    customizeLabelCtrl.$inject = [];
    customizeLabelLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'customizeLabel',
        bindToController: {},
        template: require('./customize-label.directive.html'),
        controller: customizeLabelCtrl,
        link: customizeLabelLink,
    };

    function customizeLabelCtrl() {}

    function customizeLabelLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var customizeLabelUpdateFrameListener,
            customizeLabelUpdateTaskListener,
            updateOrnamentsListener,
            sliderTimeout;

        // Variables
        scope.customizeLabel.theme = VIZ_COLORS.COLOR_SEMOSS;
        scope.customizeLabel.tool = {};
        scope.customizeLabel.options = {
            position: [
                {
                    display: 'Top',
                    value: 'top',
                },
                {
                    display: 'Left',
                    value: 'left',
                },
                {
                    display: 'Right',
                    value: 'right',
                },
                {
                    display: 'Bottom',
                    value: 'bottom',
                },
                {
                    display: 'Inside',
                    value: 'inside',
                },
                {
                    display: 'Inside-Left',
                    value: 'insideLeft',
                },
                {
                    display: 'Inside-Right',
                    value: 'insideRight',
                },
                {
                    display: 'Inside-Top',
                    value: 'insideTop',
                },
                {
                    display: 'Inside-Bottom',
                    value: 'insideBottom',
                },
                {
                    display: 'Inside-Top-Left',
                    value: 'insideTopLeft',
                },
                {
                    display: 'Inside-Bottom-Left',
                    value: 'insideBottomLeft',
                },
                {
                    display: 'Inside-Top-Right',
                    value: 'insideTopRight',
                },
                {
                    display: 'Inside-Bottom-Right',
                    value: 'insideBottomRight',
                },
            ],
            align: [
                {
                    display: 'Left',
                    value: 'left',
                },
                {
                    display: 'Center',
                    value: 'center',
                },
                {
                    display: 'Right',
                    value: 'right',
                },
            ],
            verticalAlign: [
                {
                    display: 'Top',
                    value: 'top',
                },
                {
                    display: 'Middle',
                    value: 'middle',
                },
                {
                    display: 'Bottom',
                    value: 'bottom',
                },
            ],
            fontFamily: [
                {
                    display: 'Sans-Serif',
                    value: 'sans-serif',
                },
                {
                    display: 'Serif',
                    value: 'serif',
                },
                {
                    display: 'Monospace',
                    value: 'monospace',
                },
            ],
            fontWeight: [
                {
                    display: 'Normal',
                    value: 'normal',
                },
                {
                    display: 'Bold',
                    value: 'bold',
                },
            ],
        };

        // Functions
        scope.customizeLabel.execute = execute;
        scope.customizeLabel.reset = reset;
        scope.customizeLabel.updateRotation = updateRotation;
        scope.customizeLabel.updateFontSize = updateFontSize;

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
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                );

            scope.customizeLabel.selectedLayout = layout;

            if (sharedTools.customizeLabel) {
                scope.customizeLabel.tool = sharedTools.customizeLabel;
            } else {
                getDefaultValues();
            }
        }

        /**
         * @name getDefaultValues
         * @desc get default values dependent on viz type
         * @returns {void}
         */
        function getDefaultValues() {
            switch (scope.customizeLabel.selectedLayout) {
                case 'Graph':
                    scope.customizeLabel.tool = {
                        showLabels: false,
                        position: 'right',
                        fontSize: 12,
                        color: '#000000',
                        fontFamily: 'sans-serif',
                        fontWeight: 'normal',
                    };
                    break;
                default:
                    scope.customizeLabel.tool = {
                        showLabels: false,
                        position: 'top',
                        align: 'center',
                        verticalAlign: 'middle',
                        rotate: 0,
                        fontSize: 12,
                        color: '#000000',
                        fontFamily: 'sans-serif',
                        fontWeight: 'normal',
                    };
                    break;
            }
        }

        /**
         * @name updateRotation
         * @desc setting a delay to when the slider should make the change call
         * @returns {void}
         */
        function updateRotation() {
            if (sliderTimeout) {
                $timeout.cancel(sliderTimeout);
            }

            sliderTimeout = $timeout(function () {
                execute();
            }, 500);
        }

        /**
         * @name updateFontSize
         * @desc setting a delay to when the slider should make the change call
         * @returns {void}
         */
        function updateFontSize() {
            if (sliderTimeout) {
                $timeout.cancel(sliderTimeout);
            }

            sliderTimeout = $timeout(function () {
                execute();
            }, 500);
        }

        /**
         * @name execute
         * @desc executes the pixel
         * @returns {void}
         */
        function execute() {
            var newTool = {
                customizeLabel: scope.customizeLabel.tool,
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
         * @name reset
         * @desc executes the pixel
         * @returns {void}
         */
        function reset() {
            var newTool = {
                customizeLabel: false,
            };

            getDefaultValues();

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
            customizeLabelUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            customizeLabelUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                customizeLabelUpdateFrameListener();
                customizeLabelUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
