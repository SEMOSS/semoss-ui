'use strict';

export default angular
    .module('app.toggle-trendline-mode.directive', [])
    .directive('toggleTrendlineMode', togglTrendlineModeDirective);

togglTrendlineModeDirective.$inject = [];

function togglTrendlineModeDirective() {
    togglTrendlineModeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        scope: {},
        link: togglTrendlineModeLink,
    };

    function togglTrendlineModeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        function init() {
            var currentTrend = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.toggleTrendline'
                ),
                nextTrend;

            switch (currentTrend) {
                case 'No Trendline':
                    nextTrend = '"Smooth"';
                    break;
                case 'Smooth':
                    nextTrend = '"Exact"';
                    break;
                case 'Exact':
                    nextTrend = '"Step (start)"';
                    break;
                case 'Step (start)':
                    nextTrend = '"Step (middle)"';
                    break;
                case 'Step (middle)':
                    nextTrend = '"Step (end)"';
                    break;
                case 'Step (end)':
                    nextTrend = '"No Trendline"';
                    break;
                default:
                    nextTrend = '"Smooth"';
            }

            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [
                        'Panel(' +
                            scope.widgetCtrl.panelId +
                            ')|AddPanelOrnaments({"tools":{"shared":{"toggleTrendline":' +
                            nextTrend +
                            '}}});Panel(' +
                            scope.widgetCtrl.panelId +
                            ')|RetrievePanelOrnaments("tools.shared.toggleTrendline");',
                    ],
                    terminal: true,
                },
            ]);
        }

        init();
    }
}
