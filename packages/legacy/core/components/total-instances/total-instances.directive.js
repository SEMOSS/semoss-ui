'use strict';

import './total-instances.scss';

export default angular
    .module('app.total-instances.directive', [])
    .directive('totalInstances', totalInstancesDirective);

totalInstancesDirective.$inject = [];

function totalInstancesDirective() {
    totalInstancesCtrl.$inject = [];
    totalInstancesLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        scope: {},
        controller: totalInstancesCtrl,
        controllerAs: 'totalInstances',
        bindToController: {
            previewData: '=?',
            totalCount: '=?',
        },
        link: totalInstancesLink,
        template: require('./total-instances.directive.html'),
    };

    function totalInstancesCtrl() {}
    function totalInstancesLink(scope, ele, attrs, ctrl) {
        let addedDataListener, updateOrnamentsListener, taskDataListener;

        scope.widgetCtrl = ctrl[0];
        scope.totalInstances.PIPELINE = scope.pipelineComponentCtrl !== null;
        scope.totalInstances.hideCounts = false;
        scope.totalInstances.editLimit = false;
        scope.totalInstances.dataCounts = {
            collected: 0,
            total: 0,
        };

        scope.totalInstances.toggleCountView = toggleCountView;
        scope.totalInstances.changeLimit = changeLimit;

        /**
         * @name updateCounts
         * @desc update the counts to show on the viz
         * @returns {void}
         */
        function updateCounts() {
            let instanceData, layerIndex, tempTasks;

            if (scope.totalInstances.previewData) {
                instanceData = {
                    tasks: {
                        totalRows:
                            scope.totalInstances.previewData.values.length,
                        data: {
                            values: scope.totalInstances.previewData.values,
                        },
                    },
                };
                tempTasks = instanceData.tasks;
            } else {
                instanceData = scope.widgetCtrl.getWidget('view.visualization');
                layerIndex = 0;
                tempTasks = instanceData[layerIndex]
                    ? instanceData[layerIndex].tasks
                    : '';
            }

            if (
                tempTasks &&
                tempTasks.data &&
                tempTasks.data.values /** && instanceData.layout === 'Grid' **/
            ) {
                scope.totalInstances.dataCounts = {
                    total: scope.totalInstances.totalCount
                        ? scope.totalInstances.totalCount
                        : tempTasks.totalRows,
                    collected: tempTasks.data.values.length,
                };
            } else {
                scope.totalInstances.dataCounts = {};
            }

            updateOrnament();
        }

        /**
         * @name updateOrnament
         * @desc listens to ornament changes
         * @returns {void}
         */
        function updateOrnament() {
            var hideCounts = scope.widgetCtrl.getWidget(
                'view.visualization.tools.shared.hideCounts'
            );

            scope.totalInstances.hideCounts = hideCounts;
        }
        /**
         * @name changeLimit
         * @param {number} limit the new limit to set
         * @desc function that sets a new limit for number of rows to grab
         * @returns {void}
         */
        function changeLimit(limit) {
            scope.widgetCtrl.setOptions('limit', limit);

            scope.widgetCtrl.execute([
                {
                    type: 'refresh',
                    components: [scope.widgetCtrl.widgetId],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name toggleCountView
         * @desc toggles the hiding/showing of the counts in the viz UI
         * @returns {void}
         */
        function toggleCountView() {
            var hideCounts = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.hideCounts'
                ),
                countOrnament = {};

            countOrnament.hideCounts = !hideCounts;

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
                                shared: countOrnament,
                            },
                        },
                    ],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools'],
                    terminal: true,
                },
            ]);
        }

        function initialize() {
            scope.totalInstances.preview = attrs.hasOwnProperty('previewData');
            addedDataListener = scope.widgetCtrl.on('added-data', updateCounts);
            taskDataListener = scope.widgetCtrl.on('update-task', updateCounts);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                updateOrnament
            );
            updateCounts();
            // if (scope.totalInstances.previewData) {
            scope.$watch('totalInstances.previewData', function () {
                updateCounts();
            });
            scope.$watch('totalInstances.totalCount', function (newValue) {
                scope.totalInstances.dataCounts.total = newValue;
            });
            // }
        }

        initialize();
        scope.$on('$destroy', function () {
            addedDataListener();
            taskDataListener();
            updateOrnamentsListener();
        });
    }
}
