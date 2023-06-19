'use strict';

export default angular
    .module('app.rose-mode.directive', [])
    .directive('roseMode', roseModeDirective);

roseModeDirective.$inject = [];
function roseModeDirective() {
    roseModeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        scope: {},
        link: roseModeLink,
    };

    function roseModeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        function init() {
            var currentRose = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.rose'
                ),
                nextRose,
                pixel;

            switch (currentRose) {
                case 'Default':
                    nextRose = 'RoseRadius';
                    break;
                case 'RoseRadius':
                    nextRose = 'RoseArea';
                    break;
                case 'RoseArea':
                    nextRose = 'Default';
                    break;
                default:
                    nextRose = 'RoseRadius';
            }

            pixel =
                'Panel(' +
                scope.widgetCtrl.panelId +
                ')|AddPanelOrnaments({"tools":{"shared":{"rose":' +
                nextRose +
                '}}});Panel(' +
                scope.widgetCtrl.panelId +
                ')|RetrievePanelOrnaments("tools.shared.rose");';

            scope.widgetCtrl.execeute([
                {
                    type: 'Pixel',
                    components: [pixel],
                    terminal: true,
                },
            ]);
        }

        init();
    }
}
