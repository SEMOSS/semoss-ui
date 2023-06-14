import semossCoreService from '../../core/services/semoss-core/semoss-core.service';

export default angular
    .module('app.changeLayout.directive', [])
    .directive('changeLayout', changeLayoutDirective);

changeLayoutDirective.$inject = [];

function changeLayoutDirective() {
    changeLayoutCtrl.$inject = [];
    changeLayoutLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'changeLayout',
        bindToController: {},
        template: require('./change-layout.directive.html'),
        controller: changeLayoutCtrl,
        link: changeLayoutLink,
    };

    function changeLayoutCtrl() {}

    function changeLayoutLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var updateTaskListener;

        scope.changeLayout.frameType = '';
        scope.changeLayout.vizType = '';
        scope.changeLayout.layoutOptions = [];
        scope.changeLayout.layoutSelected = '';
        scope.changeLayout.graphName =
            'graph' + Math.floor(1000 + Math.random() * 9000);
        scope.changeLayout.selectedLayout = scope.widgetCtrl.getWidget(
            'view.visualization.layout'
        );

        // Functions
        scope.changeLayout.updateLayout = updateLayout;

        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            scope.changeLayout.frameType = scope.widgetCtrl.getFrame('type');
            scope.changeLayout.vizType = scope.widgetCtrl.getWidget(
                'view.visualization.options.type'
            );
            scope.changeLayout.layoutOptions = [];

            // Check frame type and define available layouts
            if (scope.changeLayout.frameType === 'GRAPH') {
                scope.changeLayout.layoutOptions = [
                    'random',
                    'circle',
                    'sphere',
                    'fruchterman.reingold',
                    'kamada.kawai',
                    'fruchterman.reingold.grid',
                    'graphopt',
                    'svd',
                    'Default (No Layout)',
                ];
            } else if (scope.changeLayout.selectedLayout !== 'GraphGL') {
                scope.changeLayout.layoutOptions = ['force', 'circular'];
            }
        }

        /**
         * @name updateLayout
         * @desc function that updates the state
         * @returns {void}
         */
        function updateLayout() {
            if (
                scope.changeLayout.layoutSelected[0] !== 'Default (No Layout)'
            ) {
                updatePanelOrnaments(scope.changeLayout.layoutSelected[0]);
                if (scope.changeLayout.frameType === 'GRAPH') {
                    changeGraphLayout();
                }
            } else {
                updatePanelOrnaments(false);
            }
        }

        /**
         * @name changeGraphLayout
         * @desc function that updates the graph layout
         * @returns {void}
         */
        function changeGraphLayout() {
            var newTool = {},
                taskOptionsComponent = {},
                frameName = scope.widgetCtrl.getShared(
                    'frames.' + scope.widgetCtrl.getWidget('frame') + '.name'
                );

            taskOptionsComponent[scope.widgetCtrl.panelId] = {
                layout: scope.widgetCtrl.getWidget('view.visualization.layout'),
            };

            newTool.toggleLayout = true;

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
                {
                    type: 'changeGraphLayout',
                    components: [
                        scope.changeLayout.layoutSelected[0],
                        frameName,
                    ],
                    terminal: true,
                },
                {
                    type: 'taskOptions',
                    components: [taskOptionsComponent],
                },
                {
                    type: 'collectGraph',
                    components: [frameName],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name updatePanelOrnaments
         * @desc function that updates and retrieves panel ornaments
         * @param {bool} state state of toggleLayout
         * @returns {void}
         */
        function updatePanelOrnaments(state) {
            var newTool = {};

            newTool.toggleLayout = state;

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
            updateTaskListener = scope.widgetCtrl.on('update-task', resetPanel);

            // cleanup
            scope.$on('$destroy', function () {
                console.log('destroying graph layout....');
                updateTaskListener();
            });

            resetPanel();
        }

        initialize();
    }
}
