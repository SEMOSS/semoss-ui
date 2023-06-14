'use strict';

export default angular
    .module('app.clusterColor.directive', [])
    .directive('clusterColor', clusterColorDirective);

clusterColorDirective.$inject = [];

function clusterColorDirective() {
    clusterColorCtrl.$inject = [];
    clusterColorLink.$inject = ['scope'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'clusterColor',
        bindToController: {},
        template: require('./cluster-color.directive.html'),
        controller: clusterColorCtrl,
        link: clusterColorLink,
    };

    function clusterColorCtrl() {}

    function clusterColorLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var updateTaskListener;

        scope.clusterColor.frameType = '';
        scope.clusterColor.vizType = '';
        scope.clusterColor.layoutOptions = [];
        scope.clusterColor.layoutSelected = '';
        scope.clusterColor.graphName =
            'graph' + Math.floor(1000 + Math.random() * 9000);

        // Functions
        scope.clusterColor.updateLayout = updateLayout;

        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            scope.clusterColor.frameType = scope.widgetCtrl.getFrame('type');
            scope.clusterColor.vizType = scope.widgetCtrl.getWidget(
                'view.visualization.options.type'
            );

            if (scope.clusterColor.frameType === 'GRAPH') {
                scope.clusterColor.layoutOptions = [
                    'Option 1 (Cluster using random walks)',
                    'Option 2 (Cluster using maximal connected components)',
                    'Default (No Cluster)',
                ];
            } else {
                scope.clusterColor.layoutOptions = [];
            }
        }

        /**
         * @name updateLayout
         * @desc function that updates the state
         * @returns {void}
         */
        function updateLayout() {
            if (scope.clusterColor.frameType === 'GRAPH') {
                if (
                    scope.clusterColor.layoutSelected[0].indexOf('Option 1') !==
                    -1
                ) {
                    execute(true, 'cluster_walktrap');
                } else if (
                    scope.clusterColor.layoutSelected[0].indexOf('Option 2') !==
                    -1
                ) {
                    execute(true, 'clusters');
                } else {
                    execute(false, false);
                }
            }
        }

        /**
         * @name execute
         * @desc function that updates the graph cluster and panel ornaments
         * @param {bool} state state of clusterExists
         * @param {string} method clusters or cluster_walktrap
         * @returns {void}
         */
        function execute(state, method) {
            var newTool = {},
                taskOptionsComponent = {},
                commandList,
                frameName = scope.widgetCtrl.getShared(
                    'frames.' + scope.widgetCtrl.getWidget('frame') + '.name'
                );

            newTool.clusterExists = state;

            taskOptionsComponent[scope.widgetCtrl.panelId] = {
                layout: scope.widgetCtrl.getWidget('view.visualization.layout'),
            };

            if (method) {
                commandList = [
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
                        type: 'clusterGraph',
                        components: [method, frameName],
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
                ];
            } else {
                commandList = [
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
                ];
            }

            scope.widgetCtrl.execute(commandList);
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
