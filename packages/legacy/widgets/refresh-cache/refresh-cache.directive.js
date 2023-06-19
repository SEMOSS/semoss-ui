'use strict';

/**
 * @name refresh-cache.directive.js
 * @desc delete cache and refresh recipe
 */
export default angular
    .module('app.refresh-cache.directive', [])
    .directive('refreshCache', refreshCacheDirective);

refreshCacheDirective.$inject = ['semossCoreService'];

function refreshCacheDirective(semossCoreService) {
    refreshCacheLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        link: refreshCacheLink,
        scope: {},
    };

    function refreshCacheLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name initialize
         * @returns {void}
         */
        function initialize() {
            const appId = scope.widgetCtrl.getShared('insight.app_id'),
                appInsightId = scope.widgetCtrl.getShared(
                    'insight.app_insight_id'
                );

            // need to delete it b/c it won't look the same the next time
            if (appId && appInsightId) {
                scope.widgetCtrl.query([
                    {
                        type: 'deleteInsightCache',
                        components: [appId, appInsightId],
                        terminal: true,
                    },
                ]);
            }

            scope.widgetCtrl.emit('execute-pixel', {
                insightID: scope.widgetCtrl.insightID,
                commandList: [
                    {
                        type: 'setInsightConfig',
                        components: [
                            semossCoreService.workspace.saveWorkspace(
                                scope.widgetCtrl.insightID
                            ),
                        ],
                        terminal: true,
                        meta: true,
                    },
                    {
                        type: 'replayRecipe',
                        components: [],
                        meta: true,
                        terminal: true,
                    },
                ],
            });
        }

        initialize();
    }
}
