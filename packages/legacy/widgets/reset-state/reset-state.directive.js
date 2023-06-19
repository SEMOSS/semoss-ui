'use strict';

export default angular
    .module('app.reset-state.directive', [])
    .directive('resetState', resetState);

resetState.$inject = ['semossCoreService'];

function resetState(semossCoreService) {
    resetStateLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: resetStateLink,
    };

    function resetStateLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            // Set shared state variables
            var currentView = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                selectedTab = scope.widgetCtrl.getWidgetTab('selected'),
                newTools = {},
                widgetName,
                vizType = scope.widgetCtrl.getWidget(
                    'view.visualization.options.type'
                );

            // look for the widget directive name so we can grab its tools from widget service's config object
            widgetName = semossCoreService.getActiveVisualizationId(
                currentView,
                vizType
            );

            newTools.shared = semossCoreService.getSharedTools();
            newTools.individual = {};
            if (widgetName) {
                newTools.individual[widgetName] =
                    semossCoreService.getSpecificConfig(widgetName, 'tools');
            } else {
                newTools.individual[widgetName] = {};
            }

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: newTools,
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

            if (selectedTab === 'visualization' || selectedTab === 'clean') {
                scope.widgetCtrl.emit('hidden-widget-destroy');
            }

            scope.widgetCtrl.alert('success', 'Visualization has been reset.');
        }

        initialize();
    }
}
