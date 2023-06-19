'use strict';

import angular from 'angular';
import { FONT_FAMILY } from '../../core/constants';

export default angular
    .module('app.legend-viz.directive', [])
    .directive('legendViz', legendVizDirective);

legendVizDirective.$inject = ['VIZ_COLORS'];

function legendVizDirective(VIZ_COLORS) {
    legendVizCtrl.$inject = [];
    legendVizLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        controllerAs: 'legendViz',
        bindToController: {},
        template: require('./legend-viz.directive.html'),
        controller: legendVizCtrl,
        link: legendVizLink,
        require: ['^widget'],
    };

    function legendVizCtrl() {}

    function legendVizLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        // default options
        scope.legendViz.options = {
            backgroundColor: '#FFFFFF',
            fontColor: '#000000',
            fontFamily: 'Sans-Serif',
            fontSize: 12,
            leftalign: 'left',
            orient: 'vertical',
            topalign: 'top',
            toggleSwitch: false,
        };
        scope.legendViz.topAlignOptions = ['top', 'middle', 'bottom'];
        scope.legendViz.leftAlignOptions = ['left', 'center', 'right'];
        scope.legendViz.orientOptions = ['vertical', 'horizontal'];
        scope.legendViz.fontOptions = FONT_FAMILY;
        scope.legendViz.theme = VIZ_COLORS.COLOR_SEMOSS;

        // functions
        scope.legendViz.execute = execute;
        scope.legendViz.reset = reset;
        scope.legendViz.togglelegendViz = togglelegendViz;

        /**
         * @name togglelegendViz
         * @desc add the ornaments
         * @returns {void}
         */
        function togglelegendViz() {
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
                                shared: {
                                    toggleLegend:
                                        scope.legendViz.options.toggleSwitch,
                                },
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
         * @name setOptions
         * @desc settings the options
         * @returns {void}
         */
        function setOptions() {
            const legend = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.legend'
                ),
                toggleLegend = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.toggleLegend'
                );
            if (!toggleLegend) {
                scope.legendViz.options.toggleSwitch = false;
            }
            if (toggleLegend && legend) {
                scope.legendViz.options = {
                    backgroundColor: legend.backgroundColor
                        ? legend.backgroundColor
                        : 'transparent',
                    fontColor: legend.fontColor ? legend.fontColor : '#5c5c5c',
                    fontFamily: legend.fontFamily ? legend.fontFamily : 'Inter',
                    fontSize: legend.fontSize ? parseInt(legend.fontSize) : 12,
                    leftalign: legend.leftalign ? legend.leftalign : 'left',
                    orient: legend.orient ? legend.orient : 'horizontal',
                    topalign: legend.topalign ? legend.topalign : 'top',
                    toggleSwitch: true,
                };
            }
        }

        /**
         * @name execute
         * @desc add the ornaments
         * @returns {void}
         */
        function execute() {
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
                                shared: {
                                    legend: scope.legendViz.options,
                                },
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
         * @name reset
         * @desc resets legend options to theme defaults
         * @returns {void}
         */
        function reset() {
            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'removePanelOrnaments',
                    components: ['tools.shared.legend'],
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
            const updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                setOptions
            );

            setOptions();

            scope.$on('$destroy', function () {
                console.log('destroying legend-viz....');
                updateOrnamentsListener();
            });
        }

        initialize();
    }
}
