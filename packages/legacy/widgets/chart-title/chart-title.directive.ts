'use strict';

import angular from 'angular';
import { FONT_FAMILY, THEME } from '../../core/constants';

export default angular
    .module('app.chart-title.directive', [])
    .directive('chartTitle', chartTitleDirective);

chartTitleDirective.$inject = ['VIZ_COLORS', 'semossCoreService'];

function chartTitleDirective(VIZ_COLORS, semossCoreService) {
    chartTitleCtrl.$inject = [];
    chartTitleLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        controllerAs: 'chartTitle',
        bindToController: {},
        template: require('./chart-title.directive.html'),
        controller: chartTitleCtrl,
        link: chartTitleLink,
        require: ['^widget'],
    };

    function chartTitleCtrl() {}

    function chartTitleLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // variables
        scope.chartTitle.colorTheme = VIZ_COLORS.COLOR_SEMOSS;
        scope.chartTitle.options = {};
        scope.chartTitle.fontWeightOptions = [
            'normal',
            'bold',
            '100',
            '200',
            '300',
            '400',
            '500',
            '600',
            '700',
            '800',
            '900',
        ];
        scope.chartTitle.fontOptions = FONT_FAMILY;
        scope.chartTitle.alignOptions = ['left', 'center', 'right'];
        scope.chartTitle.showAlign = true;

        // functions
        scope.chartTitle.execute = execute;
        scope.chartTitle.resetToDefault = resetToDefault;

        /** Logic **/
        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            const options =
                scope.widgetCtrl.getWidget('view.visualization.tools.shared') ||
                {};

            scope.chartTitle.colorTheme = options.color;

            if (options.hasOwnProperty('chartTitle') && options.chartTitle) {
                scope.chartTitle.options = options.chartTitle;
                // handling older insights where 'enterCustomFont' doesn't exist. we will default to true
                if (
                    !scope.chartTitle.options.hasOwnProperty('enterCustomFont')
                ) {
                    scope.chartTitle.options.enterCustomFont = true;
                }
                if (scope.chartTitle.options.align.length === 0) {
                    scope.chartTitle.options.align = 'left';
                }
            } else {
                scope.chartTitle.options = Object.assign(
                    {
                        text: '',
                        enterCustomFont: false,
                    },
                    THEME.chart.title
                );

                scope.chartTitle.options.align = 'left';
            }

            // Ensure font size is a number
            if (typeof scope.chartTitle.options.fontSize !== 'number') {
                scope.chartTitle.options.fontSize = parseFloat(
                    scope.chartTitle.options.fontSize
                );
            }
        }

        /**
         * @name resetToDefault
         * @desc resets the font options to the default
         */
        function resetToDefault(): void {
            let theme = scope.widgetCtrl.getShared('theme.chart.title'),
                isCustom = true;

            // Check if the font family is custom
            for (let i = 0; i < FONT_FAMILY.length; i++) {
                const font = FONT_FAMILY[i].value;
                if (font === theme.fontFamily) {
                    isCustom = false;
                    break;
                }
            }

            scope.chartTitle.options = Object.assign(
                {
                    text: scope.chartTitle.options.text,
                    enterCustomFont: isCustom,
                    align: 'left',
                },
                theme
            );

            // Ensure font size is a number
            if (typeof scope.chartTitle.options.fontSize !== 'number') {
                scope.chartTitle.options.fontSize = parseFloat(
                    scope.chartTitle.options.fontSize
                );
            }

            execute();
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
                                    chartTitle: scope.chartTitle.options,
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
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            let updateFrameListener,
                updateTaskListener,
                updateOrnamentsListener,
                active = scope.widgetCtrl.getWidget('active'),
                layout = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                );

            if (layout === 'Choropleth') {
                scope.chartTitle.showAlign = false;
            }

            // listeners
            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            updateTaskListener = scope.widgetCtrl.on('update-task', resetPanel);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                updateFrameListener();
                updateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
