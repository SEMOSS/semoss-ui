'use strict';

/**
 * @name infinite-viz
 * @desc Loads more view data
 */
export default angular
    .module('app.infinite-viz.directive', [])
    .directive('infiniteViz', infiniteVizDirective);

infiniteVizDirective.$inject = [];

function infiniteVizDirective() {
    infiniteVizCtrl.$inject = [];
    infiniteVizLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'infiniteViz',
        bindToController: {},
        template: require('./infinite-viz.directive.html'),
        controller: infiniteVizCtrl,
        link: infiniteVizLink,
    };

    function infiniteVizCtrl() {}

    function infiniteVizLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // listeners
        var taskListener, addDataListener;

        scope.infiniteViz.setIncrementer = setIncrementer;
        scope.infiniteViz.load = load;
        scope.infiniteViz.toggleCountView = toggleCountView;

        scope.infiniteViz.hideCounts = false;

        /**
         * @name load
         * @param {number} incrementer - how much more data to load
         * @desc function that loads more data when needed
         * @returns {void}
         */
        function setIncrementer(incrementer) {
            if (incrementer <= 0) {
                return;
            }

            scope.infiniteViz.limit = incrementer;
        }

        /**
         * @name load
         * @desc function that loads more data when needed
         * @returns {void}
         */
        function load() {
            // set it in the options first because 'refresh' will depend on the new limit
            scope.widgetCtrl.setOptions('limit', scope.infiniteViz.limit);
            scope.widgetCtrl.execute([
                {
                    type: 'refresh',
                    components: [scope.widgetCtrl.widgetId],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'setPanelCollect',
                    components: [scope.infiniteViz.limit],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name updateCounts
         * @desc update the counts to show on the viz
         * @returns {void}
         */
        function updateCounts() {
            var vizData,
                layerIndex = 0;
            vizData = scope.widgetCtrl.getWidget('view.visualization');

            if (
                vizData.tasks[layerIndex] &&
                vizData.tasks[layerIndex].data &&
                vizData.layout === 'Grid'
            ) {
                scope.infiniteViz.dataCounts = {
                    total: vizData.tasks[layerIndex].totalRows,
                    collected: vizData.tasks[layerIndex].data.values.length,
                };
            } else {
                scope.infiniteViz.dataCounts = {};
            }
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
                countOrnament = {},
                callback;

            countOrnament.hideCounts = !hideCounts;

            callback = function (response) {
                if (
                    response.pixelReturn[0].operationType.indexOf('ERROR') ===
                    -1
                ) {
                    scope.widgetCtrl.alert(
                        'success',
                        countOrnament.hideCounts
                            ? 'The display of data count has been toggled off.'
                            : 'The display of data count has been toggled on.'
                    );
                }
            };

            scope.widgetCtrl.execute(
                [
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
                ],
                callback
            );
        }

        /**
         * @name resetPanel
         * @desc function that is resets panel when selected Widget Changes
         * @return {void}
         */
        function resetPanel() {
            var limit = scope.widgetCtrl.getOptions('limit');

            updateCounts();

            scope.infiniteViz.limit = limit;
            // update the options service to make sure its grabbing the correct limit from the panel ornaments
            scope.widgetCtrl.setOptions('limit', scope.infiniteViz.limit);
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var hideCounts = scope.widgetCtrl.getWidget(
                'view.visualization.tools.shared.hideCounts'
            );

            scope.infiniteViz.hideCounts = hideCounts;
            // listeners
            taskListener = scope.widgetCtrl.on('update-task', resetPanel);
            addDataListener = scope.widgetCtrl.on('added-data', resetPanel);

            resetPanel();
        }

        initialize();

        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying infiniteViz....');
            taskListener();
            addDataListener();
        });
    }
}
