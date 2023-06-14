'use strict';

export default angular
    .module('app.edit-grid.directive', [])
    .directive('editGrid', editGridDirective);

editGridDirective.$inject = [];

function editGridDirective() {
    editGridCtrl.$inject = [];
    editGridLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'editGrid',
        bindToController: {},
        template: require('./edit-grid.directive.html'),
        controller: editGridCtrl,
        link: editGridLink,
    };

    function editGridCtrl() {}

    function editGridLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var editGridUpdateFrameListener,
            editGridUpdateTaskListener,
            updateOrnamentsListener;

        // variables
        scope.editGrid.title = {};

        // functions
        scope.editGrid.execute = execute;
        scope.editGrid.resetTool = resetTool;

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

            scope.editGrid.selectedLayout = layout;

            if (sharedTools.editGrid) {
                scope.editGrid.x = sharedTools.editGrid.x;
                scope.editGrid.y = sharedTools.editGrid.y;
                scope.editGrid.xScatter = sharedTools.editGrid.xScatter;
                scope.editGrid.yWaterfall = sharedTools.editGrid.yWaterfall;
            } else {
                scope.editGrid.x = false;
                scope.editGrid.y = true;
                scope.editGrid.xScatter = true;
                scope.editGrid.yWaterfall = false;
            }
        }

        /**
         * @name execute
         * @desc executes the pixel with updated tools settings
         * @returns {void}
         */
        function execute() {
            var newTool = {};

            newTool.editGrid = {};
            newTool.editGrid.x = scope.editGrid.x;
            newTool.editGrid.y = scope.editGrid.y;
            newTool.editGrid.xScatter = scope.editGrid.xScatter;
            newTool.editGrid.yWaterfall = scope.editGrid.yWaterfall;

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

            newTool.editGrid = {};
            newTool.editGrid.x = false;
            newTool.editGrid.y = true;
            newTool.editGrid.xScatter = true;
            newTool.editGrid.yWaterfall = false;

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
            editGridUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            editGridUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                editGridUpdateFrameListener();
                editGridUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
