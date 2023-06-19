'use strict';

import './color-scheme.scss';

export default angular
    .module('app.color-scheme.directive', [])
    .directive('colorScheme', colorSchemeDirective);

colorSchemeDirective.$inject = ['VIZ_COLORS'];

function colorSchemeDirective(VIZ_COLORS) {
    colorSchemeCtrl.$inject = [];
    colorSchemeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        controllerAs: 'colorScheme',
        bindToController: {},
        template: require('./color-scheme.directive.html'),
        controller: colorSchemeCtrl,
        link: colorSchemeLink,
    };

    function colorSchemeCtrl() {}

    function colorSchemeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var updateTaskListener,
            layout = scope.widgetCtrl.getWidget('view.visualization.layout');

        if (layout === 'HeatMap' || layout === 'Choropleth') {
            scope.colorScheme.colorPanels = [
                {
                    name: 'Default',
                    displayName: 'Default',
                    colors: [
                        '#4575b4',
                        '#74add1',
                        '#abd9e9',
                        '#e0f3f8',
                        '#ffffbf',
                        '#EECF96',
                        '#DD9080',
                        '#CE6661',
                        '#C0444E',
                    ],
                },
                {
                    name: 'One',
                    displayName: 'Option 1',
                    colors: [
                        '#ffffe5',
                        '#fff2d8',
                        '#F8EEA8',
                        '#EECF96',
                        '#E3B28B',
                        '#DD9080',
                        '#D9776D',
                        '#CE6661',
                        '#C75756',
                        '#C0444E',
                    ],
                },
                {
                    name: 'Two',
                    displayName: 'Option 2',
                    colors: [
                        '#ffffe5',
                        '#f7fcb9',
                        '#d9f0a3',
                        '#addd8e',
                        '#78c679',
                        '#41ab5d',
                        '#238443',
                        '#006837',
                        '#004529',
                        '#00331f',
                    ],
                },
                {
                    name: 'Three',
                    displayName: 'Option 3',
                    colors: [
                        '#f7fcfd',
                        '#e0ecf4',
                        '#bfd3e6',
                        '#9ebcda',
                        '#90aed5',
                        '#8c96c6',
                        '#8c6bb1',
                        '#88419d',
                        '#810f7c',
                        '#4d004b',
                    ],
                },
                {
                    name: 'Four',
                    displayName: 'Option 4',
                    colors: [
                        '#dae4f1',
                        '#c8d6ea',
                        '#a3bbdc',
                        '#90aed5',
                        '#6b93c7',
                        '#5985c0',
                        '#3f6ca6',
                        '#386094',
                        '#315481',
                        '#2a486f',
                    ],
                },
                {
                    name: 'Five',
                    displayName: 'Option 5',
                    colors: [
                        '#C0444E',
                        '#CE6661',
                        '#DD9080',
                        '#EECF96',
                        '#F8EEA8',
                        '#ffffbf',
                        '#e0f3f8',
                        '#abd9e9',
                        '#74add1',
                        '#4575b4',
                    ],
                },
                {
                    name: 'Six',
                    displayName: 'Option 6',
                    colors: [
                        '#4575b4',
                        '#74add1',
                        '#abd9e9',
                        '#e0f3f8',
                        '#ffffbf',
                        '#F8EEA8',
                        '#EECF96',
                        '#DD9080',
                        '#CE6661',
                        '#C0444E',
                    ],
                },
                {
                    name: 'Seven',
                    displayName: 'Option 7',
                    colors: [
                        '#C0444E',
                        '#CE6661',
                        '#DD9080',
                        '#EECF96',
                        '#F8EEA8',
                        '#ffffbf',
                        '#d9f0a3',
                        '#addd8e',
                        '#238443',
                        '#004529',
                    ],
                },
                {
                    name: 'Eight',
                    displayName: 'Option 8',
                    colors: [
                        '#004529',
                        '#238443',
                        '#addd8e',
                        '#d9f0a3',
                        '#ffffbf',
                        '#F8EEA8',
                        '#EECF96',
                        '#DD9080',
                        '#CE6661',
                        '#C0444E',
                    ],
                },
                {
                    name: 'Nine',
                    displayName: 'Option 9',
                    colors: [
                        '#cc3300',
                        '#ff3300',
                        '#ff9900',
                        '#ffcc00',
                        '#ffff00',
                        '#ccff33',
                        '#33cc33',
                        '#0099cc',
                        '#0066ff',
                        '#6600cc',
                    ],
                },
                {
                    name: 'Ten',
                    displayName: 'Option 10',
                    colors: [
                        '#6600cc',
                        '#0066ff',
                        '#0099cc',
                        '#33cc33',
                        '#ccff33',
                        '#ffff00',
                        '#ffcc00',
                        '#ff9900',
                        '#ff3300',
                        '#cc3300',
                    ],
                },
                {
                    name: 'Eleven',
                    displayName: 'Option 11',
                    colors: [
                        '#30a9fc',
                        '#2d9deb',
                        '#288dd3',
                        '#237eba',
                        '#2175ad',
                        '#1e699c',
                        '#195a85',
                        '#164e74',
                        '#12405e',
                        '#0f344d',
                    ],
                },
            ];
        } else if (layout === 'Gauge') {
            scope.colorScheme.colorPanels = [
                {
                    name: 'Default',
                    displayName: 'Default',
                    colors: ['#4575b4', '#74add1', '#CE6661', '#C0444E'],
                },
                {
                    name: 'One',
                    displayName: 'Option 1',
                    colors: [
                        '#ffffe5',
                        '#fff2d8',
                        '#F8EEA8',
                        '#EECF96',
                        '#E3B28B',
                        '#DD9080',
                        '#D9776D',
                        '#CE6661',
                        '#C75756',
                        '#C0444E',
                    ],
                },
                {
                    name: 'Two',
                    displayName: 'Option 2',
                    colors: [
                        '#ffffe5',
                        '#f7fcb9',
                        '#d9f0a3',
                        '#addd8e',
                        '#78c679',
                        '#41ab5d',
                        '#238443',
                        '#006837',
                        '#004529',
                        '#00331f',
                    ],
                },
                {
                    name: 'Three',
                    displayName: 'Option 3',
                    colors: [
                        '#f7fcfd',
                        '#e0ecf4',
                        '#bfd3e6',
                        '#9ebcda',
                        '#90aed5',
                        '#8c96c6',
                        '#8c6bb1',
                        '#88419d',
                        '#810f7c',
                        '#4d004b',
                    ],
                },
                {
                    name: 'Four',
                    displayName: 'Option 4',
                    colors: [
                        '#dae4f1',
                        '#c8d6ea',
                        '#a3bbdc',
                        '#90aed5',
                        '#6b93c7',
                        '#5985c0',
                        '#3f6ca6',
                        '#386094',
                        '#315481',
                        '#2a486f',
                    ],
                },
                {
                    name: 'Five',
                    displayName: 'Option 5',
                    colors: [
                        '#C0444E',
                        '#CE6661',
                        '#DD9080',
                        '#EECF96',
                        '#F8EEA8',
                        '#ffffbf',
                        '#e0f3f8',
                        '#abd9e9',
                        '#74add1',
                        '#4575b4',
                    ],
                },
                {
                    name: 'Six',
                    displayName: 'Option 6',
                    colors: [
                        '#4575b4',
                        '#74add1',
                        '#abd9e9',
                        '#e0f3f8',
                        '#ffffbf',
                        '#F8EEA8',
                        '#EECF96',
                        '#DD9080',
                        '#CE6661',
                        '#C0444E',
                    ],
                },
                {
                    name: 'Seven',
                    displayName: 'Option 7',
                    colors: [
                        '#C0444E',
                        '#CE6661',
                        '#DD9080',
                        '#EECF96',
                        '#F8EEA8',
                        '#ffffbf',
                        '#d9f0a3',
                        '#addd8e',
                        '#238443',
                        '#004529',
                    ],
                },
                {
                    name: 'Eight',
                    displayName: 'Option 8',
                    colors: [
                        '#004529',
                        '#238443',
                        '#addd8e',
                        '#d9f0a3',
                        '#ffffbf',
                        '#F8EEA8',
                        '#EECF96',
                        '#DD9080',
                        '#CE6661',
                        '#C0444E',
                    ],
                },
                {
                    name: 'Nine',
                    displayName: 'Option 9',
                    colors: [
                        '#cc3300',
                        '#ff3300',
                        '#ff9900',
                        '#ffcc00',
                        '#ffff00',
                        '#ccff33',
                        '#33cc33',
                        '#0099cc',
                        '#0066ff',
                        '#6600cc',
                    ],
                },
                {
                    name: 'Ten',
                    displayName: 'Option 10',
                    colors: [
                        '#6600cc',
                        '#0066ff',
                        '#0099cc',
                        '#33cc33',
                        '#ccff33',
                        '#ffff00',
                        '#ffcc00',
                        '#ff9900',
                        '#ff3300',
                        '#cc3300',
                    ],
                },
            ];
        } else if (layout === 'Dendrogram') {
            scope.colorScheme.colorPanels = [
                {
                    name: 'Default',
                    displayName: 'Default',
                    colors: ['#40A0FF'],
                },
                {
                    name: 'Semoss',
                    displayName: 'Semoss',
                    colors: VIZ_COLORS.COLOR_SEMOSS,
                },
                {
                    name: 'One',
                    displayName: 'Option 1',
                    colors: VIZ_COLORS.COLOR_ONE,
                },
                {
                    name: 'Two',
                    displayName: 'Option 2',
                    colors: VIZ_COLORS.COLOR_TWO,
                },
                {
                    name: 'Three',
                    displayName: 'Option 3',
                    colors: VIZ_COLORS.COLOR_THREE,
                },
                {
                    name: 'Four',
                    displayName: 'Option 4',
                    colors: VIZ_COLORS.COLOR_FOUR,
                },
                {
                    name: 'Five',
                    displayName: 'Option 5',
                    colors: VIZ_COLORS.COLOR_FIVE,
                },
                {
                    name: 'Six',
                    displayName: 'Option 6',
                    colors: VIZ_COLORS.COLOR_SIX,
                },
                {
                    name: 'Seven',
                    displayName: 'Option 7',
                    colors: VIZ_COLORS.COLOR_SEVEN,
                },
                {
                    name: 'Eight',
                    displayName: 'Option 8',
                    colors: VIZ_COLORS.COLOR_EIGHT,
                },
                {
                    name: 'Nine',
                    displayName: 'Option 9',
                    colors: VIZ_COLORS.COLOR_NINE,
                },
                {
                    name: 'Ten',
                    displayName: 'Option 10',
                    colors: VIZ_COLORS.COLOR_TEN,
                },
                {
                    name: 'Eleven',
                    displayName: 'Option 11',
                    colors: VIZ_COLORS.COLOR_ELEVEN,
                },
            ];
        } else if (layout === 'Waterfall') {
            scope.colorScheme.colorPanels = [
                {
                    name: 'Default',
                    displayName: 'Default',
                    colors: ['#76B7B2', '#E15759'],
                },
                {
                    name: 'Semoss',
                    displayName: 'Semoss',
                    colors: VIZ_COLORS.COLOR_SEMOSS,
                },
                {
                    name: 'One',
                    displayName: 'Option 1',
                    colors: VIZ_COLORS.COLOR_ONE,
                },
                {
                    name: 'Two',
                    displayName: 'Option 2',
                    colors: VIZ_COLORS.COLOR_TWO,
                },
                {
                    name: 'Three',
                    displayName: 'Option 3',
                    colors: VIZ_COLORS.COLOR_THREE,
                },
                {
                    name: 'Four',
                    displayName: 'Option 4',
                    colors: VIZ_COLORS.COLOR_FOUR,
                },
                {
                    name: 'Five',
                    displayName: 'Option 5',
                    colors: VIZ_COLORS.COLOR_FIVE,
                },
                {
                    name: 'Six',
                    displayName: 'Option 6',
                    colors: VIZ_COLORS.COLOR_SIX,
                },
                {
                    name: 'Seven',
                    displayName: 'Option 7',
                    colors: VIZ_COLORS.COLOR_SEVEN,
                },
                {
                    name: 'Eight',
                    displayName: 'Option 8',
                    colors: VIZ_COLORS.COLOR_EIGHT,
                },
                {
                    name: 'Nine',
                    displayName: 'Option 9',
                    colors: VIZ_COLORS.COLOR_NINE,
                },
                {
                    name: 'Ten',
                    displayName: 'Option 10',
                    colors: VIZ_COLORS.COLOR_TEN,
                },
                {
                    name: 'Eleven',
                    displayName: 'Option 11',
                    colors: VIZ_COLORS.COLOR_ELEVEN,
                },
            ];
        } else {
            scope.colorScheme.colorPanels = [];
        }

        scope.colorScheme.updateColor = updateColor;
        scope.colorScheme.resetColor = resetColor;

        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            var individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + layout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                );

            scope.colorScheme.selectedState = angular.extend(
                individualTools,
                sharedTools
            );
        }

        /**
         * @name resetColor
         * @desc removes the ornament to reset the color to the default theme's color
         * @returns {void}
         */
        function resetColor() {
            let ornamentName = '';
            if (layout === 'HeatMap' || layout === 'Choropleth') {
                ornamentName = 'heatmapColor';
            } else if (layout === 'Gauge') {
                ornamentName = 'gaugeColor';
            } else if (layout === 'Dendrogram') {
                ornamentName = 'dendrogramColor';
            } else if (layout === 'Waterfall') {
                ornamentName = 'waterfallColor';
            } else {
                return;
            }
            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'removePanelOrnaments',
                    components: [`tools.shared.${ornamentName}`],
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
         * @name updateState
         * @desc function that updates the state
         * @param {string} name - color palette name
         * @returns {void}
         */
        function updateColor(name) {
            var newTool = {};

            if (layout === 'HeatMap' || layout === 'Choropleth') {
                newTool.heatmapColor = name;
            } else if (layout === 'Gauge') {
                newTool.gaugeColor = name;
            } else if (layout === 'Dendrogram') {
                newTool.dendrogramColor = name;
            } else if (layout === 'Waterfall') {
                newTool.waterfallColor = name;
            } else {
                return;
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
                console.log('destroying color scheme....');
                updateTaskListener();
            });

            resetPanel();
        }

        initialize();
    }
}
