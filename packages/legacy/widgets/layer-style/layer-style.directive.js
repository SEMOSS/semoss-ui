'use strict';

export default angular
    .module('app.layer-style.directive', [])
    .directive('layerStyle', layerStyleDirective);

layerStyleDirective.$inject = ['VIZ_COLORS', '$timeout'];

function layerStyleDirective(VIZ_COLORS, $timeout) {
    layerStyleCtrl.$inject = [];
    layerStyleLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'layerStyle',
        bindToController: {},
        template: require('./layer-style.directive.html'),
        controller: layerStyleCtrl,
        link: layerStyleLink,
    };

    function layerStyleCtrl() {}

    function layerStyleLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var sliderTimeout;

        // variables
        scope.layerStyle.borderColor = '##e0dede';
        scope.layerStyle.opacity = 0.8;
        scope.layerStyle.theme = VIZ_COLORS.COLOR_SEMOSS;

        // functions
        scope.layerStyle.execute = execute;

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

            if (sharedTools.layerStyle) {
                scope.layerStyle.borderColor =
                    sharedTools.layerStyle.borderColor;
                scope.layerStyle.opacity = sharedTools.layerStyle.opacity;
            }
        }

        /**
         * @name execute
         * @desc executes and updates ornaments
         * @param {bool} reset whether to reset tool
         * @returns {void}
         */
        function execute(reset) {
            var newTool = {};

            if (reset) {
                scope.layerStyle.borderColor = '#e0dede';
                scope.layerStyle.opacity = 0.8;
            }

            newTool.layerStyle = {
                borderColor: scope.layerStyle.borderColor,
                opacity: scope.layerStyle.opacity,
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
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var layerStyleUpdateFrameListener,
                layerStyleUpdateTaskListener,
                updateOrnamentsListener;

            // listeners
            layerStyleUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            layerStyleUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                layerStyleUpdateFrameListener();
                layerStyleUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
