'use strict';

export default angular
    .module('app.pie-radius.directive', [])
    .directive('pieRadius', pieRadiusDirective);

pieRadiusDirective.$inject = [];

function pieRadiusDirective() {
    pieRadiusCtrl.$inject = [];
    pieRadiusLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'pieRadius',
        bindToController: {},
        template: require('./pie-radius.directive.html'),
        controller: pieRadiusCtrl,
        link: pieRadiusLink,
    };

    function pieRadiusCtrl() {}

    function pieRadiusLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var pieRadiusUpdateFrameListener,
            pieRadiusUpdateTaskListener,
            updateOrnamentsListener;

        // variables
        scope.pieRadius = {
            innerRadius: 0,
            outerRadius: 70,
        };

        // functions
        scope.pieRadius.execute = execute;

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

            scope.pieRadius.innerRadius =
                sharedTools.pieRadius.innerRadius || 0;
            scope.pieRadius.outerRadius =
                sharedTools.pieRadius.outerRadius || 70;
        }

        /**
         * @name execute
         * @desc executes the groub by
         * @param {bool} update whether to add rule or not
         * @returns {void}
         */
        function execute(update) {
            var newTool = {};

            if (update) {
                newTool.pieRadius = {
                    innerRadius: scope.pieRadius.innerRadius,
                    outerRadius: scope.pieRadius.outerRadius,
                };
            } else {
                newTool.pieRadius = {
                    innerRadius: 0,
                    outerRadius: 70,
                };
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
            pieRadiusUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            pieRadiusUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                pieRadiusUpdateFrameListener();
                pieRadiusUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
