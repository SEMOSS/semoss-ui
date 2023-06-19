'use strict';
import { FONT_FAMILY } from '../../core/constants.js';
export default angular
    .module('app.kpi-settings.directive', [])
    .directive('kpiSettings', kpiSettingsDirective);

kpiSettingsDirective.$inject = ['VIZ_COLORS', 'semossCoreService'];

function kpiSettingsDirective(VIZ_COLORS, semossCoreService) {
    kpiSettingsCtrl.$inject = [];
    kpiSettingsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        controllerAs: 'kpiSettings',
        bindToController: {},
        template: require('./kpi-settings.directive.html'),
        controller: kpiSettingsCtrl,
        link: kpiSettingsLink,
        require: ['^widget'],
    };

    function kpiSettingsCtrl() {}

    function kpiSettingsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // variables
        scope.kpiSettings.colorTheme = VIZ_COLORS.COLOR_SEMOSS;
        scope.kpiSettings.options = {};
        scope.kpiSettings.kpiDimensions = {};
        scope.kpiSettings.dimensions = {
            options: [],
            selected: '',
        };
        scope.kpiSettings.justificationOptions = [
            {
                display: 'Left',
                value: 'start',
            },
            {
                display: 'Center',
                value: 'middle',
            },
            {
                display: 'Right',
                value: 'end',
            },
        ];
        scope.kpiSettings.borderOptions = [
            {
                display: 'Solid',
                value: 'solid',
            },
            {
                display: 'Dashed',
                value: 'dashed',
            },
            {
                display: 'Dotted',
                value: 'dotted',
            },
            {
                display: 'Double',
                value: 'double',
            },
            {
                display: 'Groove',
                value: 'groove',
            },
            {
                display: 'Ridge',
                value: 'ridge',
            },
            {
                display: 'Inset',
                value: 'inset',
            },
            {
                display: 'Outset',
                value: 'outset',
            },
        ];
        scope.kpiSettings.fontOptions = FONT_FAMILY;

        // functions
        scope.kpiSettings.updateSelectedDimension = updateSelectedDimension;
        scope.kpiSettings.execute = execute;
        scope.kpiSettings.reset = reset;

        /** Logic **/
        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            var individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.KPI'
                    ) || {},
                sharedTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.shared'
                    ) || {},
                options;

            options = angular.extend(sharedTools, individualTools) || {};

            scope.kpiSettings.colorTheme = options.color;

            scope.kpiSettings.options = {
                kpiColor: options.hasOwnProperty('kpiColor')
                    ? options.kpiColor
                    : '#40A0FF',
                kpiBackgroundColor: options.hasOwnProperty('kpiBackgroundColor')
                    ? options.kpiBackgroundColor
                    : '#FFFFFF',
                kpiValueSize: options.hasOwnProperty('kpiValueSize')
                    ? options.kpiValueSize
                    : 28,
                kpiTitleText: options.hasOwnProperty('kpiTitleText')
                    ? options.kpiTitleText
                    : '',
                kpiTitleSize: options.hasOwnProperty('kpiTitleSize')
                    ? options.kpiTitleSize
                    : 14,
                kpiAutoScale: options.hasOwnProperty('kpiAutoScale')
                    ? options.kpiAutoScale
                    : true,
                kpiVerticalAlign: options.hasOwnProperty('kpiVerticalAlign')
                    ? options.kpiVerticalAlign
                    : false,
                kpiBorder: options.hasOwnProperty('kpiBorder')
                    ? options.kpiBorder
                    : false,
                kpiBorderWidth: options.hasOwnProperty('kpiBorderWidth')
                    ? options.kpiBorderWidth
                    : 1,
                kpiBorderColor: options.hasOwnProperty('kpiBorderColor')
                    ? options.kpiBorderColor
                    : '#000000',
                kpiBorderStyle: options.hasOwnProperty('kpiBorderStyle')
                    ? options.kpiBorderStyle
                    : 'solid',
                kpiFontFamily: options.hasOwnProperty('kpiFontFamily')
                    ? options.kpiFontFamily
                    : 'Inter',
                kpiJustification: options.hasOwnProperty('kpiJustification')
                    ? options.kpiJustification
                    : 'middle',
                kpiWrapTitle: options.hasOwnProperty('kpiWrapTitle')
                    ? options.kpiWrapTitle
                    : false,
                // TODO remove when functional team approves
                // kpiFormat: options.hasOwnProperty('kpiFormat') ? options.kpiFormat : 'None',
                // kpiRound: options.hasOwnProperty('kpiRound') ? options.kpiRound : false,
                // kpiRoundShift: options.hasOwnProperty('kpiRoundShift') ? options.kpiRoundShift : 2,
            };

            scope.kpiSettings.kpiDimensions = {};

            if (
                options.hasOwnProperty('kpiDimensions') &&
                options.kpiDimensions
            ) {
                scope.kpiSettings.kpiDimensions = options.kpiDimensions;
            }

            // for old KPIs existing settings applied to all dimensions
            scope.kpiSettings.kpiDimensions['All Dimensions'] = JSON.parse(
                JSON.stringify(scope.kpiSettings.options)
            );

            getDimensions();
        }

        /**
         * @name getDimensions
         * @desc set the list of dimensions available to format
         * @returns {void}
         */
        function getDimensions() {
            const keys = scope.widgetCtrl.getWidget(
                'view.visualization.keys.KPI'
            );
            let options = [];

            for (
                let keyIdx = 0, keyLen = keys.length;
                keyIdx < keyLen;
                keyIdx++
            ) {
                options.push(keys[keyIdx].alias);
                if (!scope.kpiSettings.kpiDimensions[keys[keyIdx].alias]) {
                    // if custom settings dont already exist set the dimension settings to the parent settings
                    scope.kpiSettings.kpiDimensions[keys[keyIdx].alias] =
                        JSON.parse(JSON.stringify(scope.kpiSettings.options));
                    // need to update kpi title text for each individual dimension
                    if (
                        typeof scope.kpiSettings.options.kpiTitleText !==
                        'string'
                    ) {
                        if (
                            scope.kpiSettings.options.kpiTitleText.hasOwnProperty(
                                keys[keyIdx].alias
                            )
                        ) {
                            scope.kpiSettings.kpiDimensions[
                                keys[keyIdx].alias
                            ].kpiTitleText =
                                scope.kpiSettings.options.kpiTitleText[
                                    keys[keyIdx].alias
                                ];
                        } else {
                            scope.kpiSettings.kpiDimensions[
                                keys[keyIdx].alias
                            ].kpiTitleText = '';
                        }
                    }
                }
            }

            options.sort(function (a, b) {
                let lowerA = a.toLowerCase(),
                    lowerB = b.toLowerCase();

                if (lowerA > lowerB) {
                    return 1;
                } else if (lowerA === lowerB) {
                    return 0;
                }

                return -1;
            });

            // set the dimensions
            scope.kpiSettings.dimensions.options = JSON.parse(
                JSON.stringify(options)
            );
            // if only 1 dimension we won't add 'All Dimensions' option
            if (keys.length > 1) {
                scope.kpiSettings.dimensions.options.push('All Dimensions');
                if (!scope.kpiSettings.dimensions.selected) {
                    scope.kpiSettings.dimensions.selected = 'All Dimensions';
                }
            }

            if (!scope.kpiSettings.dimensions.selected) {
                scope.kpiSettings.dimensions.selected = options[0];
            }

            updateSelectedDimension();
        }

        /**
         * @name updateSelectedDimension
         * @desc set the list of dimensions available to format
         * @returns {void}
         */
        function updateSelectedDimension() {
            for (let dim in scope.kpiSettings.kpiDimensions) {
                if (dim === scope.kpiSettings.dimensions.selected) {
                    // if selected dimension has applied formats, populate widget with selected rules
                    scope.kpiSettings.options =
                        scope.kpiSettings.kpiDimensions[dim];
                    return;
                }
            }
        }

        /**
         * @name execute
         * @desc add the ornaments
         * @returns {void}
         */
        function execute() {
            let newSettings = {},
                dim;

            // clear out All Dimensions kpiTitle text since we are removing this feature
            scope.kpiSettings.kpiDimensions['All Dimensions'].kpiTitleText = '';
            // original kpi setting individual tools will store 'all dimensions' settings
            newSettings = semossCoreService.utility.freeze(
                scope.kpiSettings.kpiDimensions['All Dimensions']
            );
            newSettings.kpiDimensions = {};

            if (scope.kpiSettings.dimensions.selected === 'All Dimensions') {
                // when All Dimensions selected we need to preserve individual titles seperately
                newSettings.kpiTitleText = {};
                for (dim in scope.kpiSettings.kpiDimensions) {
                    if (dim !== 'All Dimensions') {
                        newSettings.kpiTitleText[dim] =
                            scope.kpiSettings.kpiDimensions[dim].kpiTitleText;
                    }
                }
            } else {
                // only add dimensions to ornaments where settings are different than All Dimensions
                for (dim in scope.kpiSettings.kpiDimensions) {
                    // TODO potentially looping through the options and only add options that are different than 'All Dimensions'
                    if (
                        !angular.equals(
                            scope.kpiSettings.kpiDimensions[dim],
                            scope.kpiSettings.kpiDimensions['All Dimensions']
                        )
                    ) {
                        newSettings.kpiDimensions[dim] =
                            scope.kpiSettings.kpiDimensions[dim];
                    }
                }
            }

            // if no dimensions were added
            if (Object.keys(newSettings.kpiDimensions).length === 0) {
                newSettings.kpiDimensions = false;
            }

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'removePanelOrnaments',
                    components: ['tools.individual.KPI.kpiDimensions'],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: {
                                individual: {
                                    KPI: newSettings,
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
         * @desc remove the ornaments
         * @returns {void}
         */
        function reset() {
            // TODO: reset is not exposed because the way we set tools doesn't work properly.
            // it comes back without the KPI, so we keep the old ones
            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'removePanelOrnaments',
                    components: ['tools.individual.KPI'],
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
                updateOrnamentsListener;

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
