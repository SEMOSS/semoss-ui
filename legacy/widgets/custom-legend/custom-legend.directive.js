'use strict';

import { PANEL_TYPES } from '../../core/constants.js';

export default angular
    .module('app.custom-legend.directive', [])
    .directive('customLegend', customLegendDirective);

customLegendDirective.$inject = [];

function customLegendDirective() {
    customLegendCtrl.$inject = [];
    customLegendLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^insight'],
        controllerAs: 'legend',
        controller: customLegendCtrl,
        link: customLegendLink,
    };

    function customLegendCtrl() {}

    function customLegendLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];

        function initialize() {
            var legendPanel = scope.insightCtrl.getShared('panelCounter');

            legendPanel++;

            scope.insightCtrl.execute([
                {
                    type: 'addPanel',
                    components: [
                        legendPanel,
                        scope.insightCtrl.getWorkbook('worksheet'),
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [legendPanel],
                },
                {
                    type: 'addPanelConfig',
                    components: [
                        {
                            type: PANEL_TYPES.GOLDEN,
                            opacity: 100,
                            label: '',
                            labelOverride: true,
                            zIndex: 3,
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [legendPanel],
                },
                {
                    type: 'setPanelView',
                    components: [
                        'visualization',
                        {
                            type: 'echarts',
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [legendPanel],
                },
                {
                    type: 'setPanelView',
                    components: ['legend-panel'],
                    terminal: true,
                },
            ]);
        }

        initialize();
    }
}
