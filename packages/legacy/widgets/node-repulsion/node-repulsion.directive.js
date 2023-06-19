'use strict';

export default angular
    .module('app.node-repulsion.directive', [])
    .directive('nodeRepulsion', nodeRepulsionDirective);

nodeRepulsionDirective.$inject = [];

function nodeRepulsionDirective() {
    nodeRepulsionCtrl.$inject = [];
    nodeRepulsionLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'nodeRepulsion',
        bindToController: {},
        template: require('./node-repulsion.directive.html'),
        controller: nodeRepulsionCtrl,
        link: nodeRepulsionLink,
    };

    function nodeRepulsionCtrl() {}

    function nodeRepulsionLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        var updateOrnamentsListener;

        // variables
        scope.nodeRepulsion.repulsion = 60;
        scope.nodeRepulsion.gravity = 0.25;
        scope.nodeRepulsion.edgeLength = 100;

        // functions
        scope.nodeRepulsion.updateRepulsion = updateRepulsion;
        scope.nodeRepulsion.updateGravity = updateGravity;
        scope.nodeRepulsion.updateEdgeLength = updateEdgeLength;

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

            if (sharedTools.nodeRepulsion) {
                scope.nodeRepulsion.repulsion =
                    sharedTools.nodeRepulsion.repulsion;
                scope.nodeRepulsion.gravity = sharedTools.nodeRepulsion.gravity;
                scope.nodeRepulsion.edgeLength =
                    sharedTools.nodeRepulsion.edgeLength;
            }
        }

        /**
         * @name updateRepulsion
         * @desc update the repulsion value and execute
         * @param {bool} value repulsion value
         * @returns {void}
         */
        function updateRepulsion(value) {
            scope.nodeRepulsion.repulsion = value;
            execute();
        }

        /**
         * @name updateGravity
         * @desc update the gravity value and execute
         * @param {bool} value gravity value
         * @returns {void}
         */
        function updateGravity(value) {
            scope.nodeRepulsion.gravity = value;
            execute();
        }

        /**
         * @name updateEdgeLength
         * @desc update the edge length value and execute
         * @param {bool} value edge length value
         * @returns {void}
         */
        function updateEdgeLength(value) {
            scope.nodeRepulsion.edgeLength = value;
            execute();
        }

        /**
         * @name execute
         * @desc executes the groub by
         * @returns {void}
         */
        function execute() {
            var newTool = {};

            // Add rule to rule set and push to shared tools
            newTool.nodeRepulsion = {};
            newTool.nodeRepulsion.repulsion = scope.nodeRepulsion.repulsion;
            newTool.nodeRepulsion.gravity = scope.nodeRepulsion.gravity;
            newTool.nodeRepulsion.edgeLength = scope.nodeRepulsion.edgeLength;

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
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
