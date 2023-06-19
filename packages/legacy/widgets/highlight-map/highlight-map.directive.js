'use strict';

/**
 * @name highlightMap.directive.js
 * @desc Widget that handles highlighting map data
 */

export default angular
    .module('app.highlightMap.directive', [])
    .directive('highlightMap', highlightMapDirective);

highlightMapDirective.$inject = ['semossCoreService'];

function highlightMapDirective(semossCoreService) {
    highlightMapCtrl.$inject = [];
    highlightMapLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'highlightMap',
        bindToController: {},
        template: require('./highlight-map.directive.html'),
        controller: highlightMapCtrl,
        link: highlightMapLink,
    };

    function highlightMapCtrl() {}

    function highlightMapLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var updateTaskListener;

        scope.highlightMap.updateState = updateState;
        scope.highlightMap.resetHighlight = resetHighlight;

        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            var selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                ),
                chartData = angular.extend(
                    data,
                    semossCoreService.visualization.getTableData(
                        data.headers,
                        data.values,
                        data.rawHeaders
                    )
                );

            scope.highlightMap.viewData = chartData.viewData.map(function (
                val
            ) {
                return val[
                    semossCoreService.visualization.getDataTableAlign(keys).size
                ];
            });

            scope.highlightMap.selectedState = angular.extend(
                individualTools,
                sharedTools
            );
        }

        function resetHighlight() {
            var newTool = {},
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individualTools = {
                    individual: {},
                };

            individualTools.individual[selectedLayout] = newTool;
            newTool.highlightMaps = 0;

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: individualTools,
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

            scope.highlightMap.selectedState.highlightMaps = 1;
        }

        /**
         * @name updateState
         * @desc function that updates the state
         * @param {string} key - ornament to update
         * @param {string} value - value to update to
         * @returns {void}
         */
        function updateState(key, value) {
            var newTool = {},
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individualTools = {
                    individual: {},
                };

            individualTools.individual[selectedLayout] = newTool;

            newTool[key] = value;

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: individualTools,
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
                console.log('destroying highlightMap....');
                updateTaskListener();
            });

            resetPanel();
        }

        initialize();
    }
}
