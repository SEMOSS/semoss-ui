'use strict';

/**
 * @name bucket.directive.js
 * @desc Widget that handles bucketing your data
 */

export default angular
    .module('app.bucket.directive', [])
    .directive('bucket', bucketDirective);

bucketDirective.$inject = ['semossCoreService'];

function bucketDirective(semossCoreService) {
    bucketCtrl.$inject = [];
    bucketLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'bucket',
        bindToController: {},
        template: require('./bucket.directive.html'),
        controller: bucketCtrl,
        link: bucketLink,
    };

    function bucketCtrl() {}

    function bucketLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var updateTaskListener, updateFrameListener;

        // Functions
        scope.bucket.updateState = updateState;

        // Properties
        scope.bucket.numBuckets = 5;

        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            var layerIndex = 0,
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                vizType = scope.widgetCtrl.getWidget(
                    'view.visualization.options.type'
                ),
                widgetName = semossCoreService.getActiveVisualizationId(
                    selectedLayout,
                    vizType
                ),
                individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + widgetName
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                chartData = angular.extend(
                    data,
                    semossCoreService.visualization.getTableData(
                        data.headers,
                        data.values,
                        data.rawHeaders
                    )
                );

            scope.bucket.selectedLayout = selectedLayout;
            scope.bucket.vizType = vizType;
            scope.bucket.heatmapLegend = sharedTools.heatmapLegend;
            scope.bucket.viewData = chartData.viewData;
            scope.bucket.selectedState = angular.extend(
                individualTools,
                sharedTools
            );

            // get old selection
            if (
                (selectedLayout === 'HeatMap' ||
                    selectedLayout === 'Choropleth') &&
                sharedTools.hasOwnProperty('heatBuckets')
            ) {
                // 10 is max buckets for heatmap and 5 is default
                if (sharedTools.heatBuckets <= 10) {
                    scope.bucket.numBuckets = sharedTools.heatBuckets;
                } else {
                    scope.bucket.numBuckets = 5;
                }
            }
            // for all other visualizations the max buckets is the length of the data
            if (
                selectedLayout !== 'HeatMap' &&
                selectedLayout !== 'Choropleth' &&
                sharedTools.hasOwnProperty('buckets')
            ) {
                if (sharedTools.buckets <= scope.bucket.viewData.length) {
                    scope.bucket.numBuckets = sharedTools.buckets;
                } else {
                    scope.bucket.numBuckets = scope.bucket.viewData.length;
                }
            }
        }

        /**
         * @name updateState
         * @desc function that updates the state
         * @param {string} value - number of buckets selected by user
         * @returns {void}
         */
        function updateState(value) {
            var tools = {
                shared: {},
            };

            if (
                scope.bucket.selectedLayout === 'HeatMap' ||
                scope.bucket.selectedLayout === 'Choropleth'
            ) {
                tools.shared.heatBuckets = value;
            } else {
                tools.shared.buckets = value;
            }
            scope.bucket.numBuckets = value;

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: tools,
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
            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                updateTaskListener();
                updateFrameListener();
            });

            resetPanel();
        }

        initialize();
    }
}
