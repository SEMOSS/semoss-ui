'use strict';

export default angular
    .module('app.color-panel-mode.directive', [])
    .directive('colorPanelMode', colorPanelModeDirective);

colorPanelModeDirective.$inject = ['VIZ_COLORS'];

function colorPanelModeDirective(VIZ_COLORS) {
    colorPanelModeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        scope: {},
        link: colorPanelModeLink,
    };

    function colorPanelModeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var colorPanels = [];
        colorPanels.push({
            name: 'Semoss',
            displayName: 'Semoss',
            colors: VIZ_COLORS.COLOR_SEMOSS,
        });
        colorPanels.push({
            name: 'One',
            displayName: 'Option 1',
            colors: VIZ_COLORS.COLOR_ONE,
        });
        colorPanels.push({
            name: 'Two',
            displayName: 'Option 2',
            colors: VIZ_COLORS.COLOR_TWO,
        });
        colorPanels.push({
            name: 'Three',
            displayName: 'Option 3',
            colors: VIZ_COLORS.COLOR_THREE,
        });
        colorPanels.push({
            name: 'Four',
            displayName: 'Option 4',
            colors: VIZ_COLORS.COLOR_FOUR,
        });
        colorPanels.push({
            name: 'Five',
            displayName: 'Option 5',
            colors: VIZ_COLORS.COLOR_FIVE,
        });
        colorPanels.push({
            name: 'Six',
            displayName: 'Option 6',
            colors: VIZ_COLORS.COLOR_SIX,
        });
        colorPanels.push({
            name: 'Seven',
            displayName: 'Option 7',
            colors: VIZ_COLORS.COLOR_SEVEN,
        });
        colorPanels.push({
            name: 'Eight',
            displayName: 'Option 8',
            colors: VIZ_COLORS.COLOR_EIGHT,
        });
        colorPanels.push({
            name: 'Nine',
            displayName: 'Option 9',
            colors: VIZ_COLORS.COLOR_NINE,
        });
        colorPanels.push({
            name: 'Ten',
            displayName: 'Option 10',
            colors: VIZ_COLORS.COLOR_TEN,
        });
        colorPanels.push({
            name: 'Eleven',
            displayName: 'Option 11',
            colors: VIZ_COLORS.COLOR_ELEVEN,
        });
        colorPanels.push({
            name: 'Thirteen',
            displayName: 'Option 13',
            colors: VIZ_COLORS.COLOR_THIRTEEN,
        });
        colorPanels.push({
            name: 'Fourteen',
            displayName: 'Option 14',
            colors: VIZ_COLORS.COLOR_FOURTEEN,
        });
        colorPanels.push({
            name: 'Fifteen',
            displayName: 'Option 15',
            colors: VIZ_COLORS.COLOR_FIFTEEN,
        });

        function init() {
            var currentColorName = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.colorName'
                ),
                nextColor,
                newTool = {},
                colorsToUse = [],
                i,
                len;

            switch (currentColorName) {
                case 'Semoss':
                    nextColor = 'One';
                    break;
                case 'One':
                    nextColor = 'Two';
                    break;
                case 'Two':
                    nextColor = 'Three';
                    break;
                case 'Three':
                    nextColor = 'Four';
                    break;
                case 'Four':
                    nextColor = 'Five';
                    break;
                case 'Five':
                    nextColor = 'Six';
                    break;
                case 'Six':
                    nextColor = 'Seven';
                    break;
                case 'Seven':
                    nextColor = 'Eight';
                    break;
                case 'Eight':
                    nextColor = 'Nine';
                    break;
                case 'Nine':
                    nextColor = 'Semoss';
                    break;
                default:
                    nextColor = 'Semoss';
            }

            for (i = 0, len = colorPanels.length; i < len; i++) {
                if (colorPanels[i].name === nextColor) {
                    colorsToUse = colorPanels[i].colors;
                    break;
                }
            }

            newTool.colorName = nextColor;
            newTool.color = colorsToUse;

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

        init();
    }
}
