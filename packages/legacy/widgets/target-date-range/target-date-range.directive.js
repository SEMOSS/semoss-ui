'use strict';

import './target-date-range.scss';

export default angular
    .module('app.target-date-range.directive', [])
    .directive('targetDateRange', targetDateRangeDirective);

targetDateRangeDirective.$inject = ['VIZ_COLORS'];

function targetDateRangeDirective(VIZ_COLORS) {
    targetDateRangeCtrl.$inject = [];
    targetDateRangeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'targetDateRange',
        bindToController: {},
        template: require('./target-date-range.directive.html'),
        controller: targetDateRangeCtrl,
        link: targetDateRangeLink,
    };

    function targetDateRangeCtrl() {}

    function targetDateRangeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // variables
        scope.targetDateRange.dateRanges = [];
        scope.targetDateRange.theme = VIZ_COLORS.COLOR_SEMOSS;
        scope.targetDateRange.label = 'Target Date Range';
        scope.targetDateRange.dateStart = null;
        scope.targetDateRange.dateEnd = null;
        scope.targetDateRange.selectedColor = '#ff0000';
        scope.targetDateRange.opacity = '0.5';
        scope.targetDateRange.description = '';

        // functions
        scope.targetDateRange.execute = execute;
        scope.targetDateRange.removeFromAppliedDates = removeFromAppliedDates;

        /** Logic **/
        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            var active = scope.widgetCtrl.getWidget('active'),
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                );

            if (sharedTools.targetDateRange) {
                scope.targetDateRange.dateRanges =
                    sharedTools.targetDateRange.dateRanges || [];
            }
        }

        /**
         * @name removeFromAppliedDates
         * @desc remove the selected date from the target dates
         * @param {num} idx - selected date
         * @returns {void}
         */
        function removeFromAppliedDates(idx) {
            scope.targetDateRange.dateRanges.splice(idx, 1);
            execute(false);
        }

        /**
         * @name checkRequirements
         * @desc check if all required parameters are selected; check if the user inputted date is of an acceptable format
         * @returns {bool} array of missing parameters
         */
        function checkRequirements() {
            // TODO add all checks here before executing new target date
            var dStart, dEnd;

            if (
                +scope.targetDateRange.opacity > 1 ||
                +scope.targetDateRange.opacity < 0.1
            ) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please specify opacity between 0.1 and 1 inclusive.'
                );
                return false;
            }

            if (!scope.targetDateRange.dateStart) {
                scope.widgetCtrl.alert('warn', 'Please select a start date.');
                return false;
            }

            if (!scope.targetDateRange.dateEnd) {
                scope.widgetCtrl.alert('warn', 'Please select an end date.');
                return false;
            }

            dStart = new Date(scope.targetDateRange.dateStart);
            dEnd = new Date(scope.targetDateRange.dateEnd);
            // Check to see if start date if after end date
            if (dStart > dEnd) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please ensure that Start Date is before end date.'
                );
                return false;
            }

            if (
                Object.prototype.toString.call(dStart) === '[object Date]' &&
                Object.prototype.toString.call(dEnd) === '[object Date]'
            ) {
                if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) {
                    scope.widgetCtrl.alert(
                        'error',
                        'Target Date is not of the correct format. Please enter a date using the following format: YYYY-MM-DD.'
                    );
                    return false;
                }
                return true;
            }
            scope.widgetCtrl.alert(
                'error',
                'Start or End date is not of the correct format. Please enter dates using the following format: YYYY-MM-DD.'
            );
            return false;
        }

        /**
         * @name execute
         * @desc executes the groub by
         * @param {bool} update whether to add rule or not
         * @returns {void}
         */
        function execute(update) {
            var newTool = {},
                dateRangeInfo = {},
                proceed;

            // Define new rule
            if (update) {
                proceed = checkRequirements();
                if (!proceed) {
                    return;
                }
                dateRangeInfo.label =
                    scope.targetDateRange.label || 'Target Date Range';
                dateRangeInfo.dateStart = scope.targetDateRange.dateStart;
                dateRangeInfo.dateEnd = scope.targetDateRange.dateEnd;
                dateRangeInfo.opacity = scope.targetDateRange.opacity || 0.25;
                dateRangeInfo.description =
                    scope.targetDateRange.description || '';
                dateRangeInfo.color =
                    scope.targetDateRange.selectedColor || '#ff0000';
                scope.targetDateRange.dateRanges.unshift(dateRangeInfo);
            }

            // Add rule to rule set and push to shared tools
            newTool.targetDateRange = {};
            newTool.targetDateRange.dateRanges =
                scope.targetDateRange.dateRanges;

            // Reset selections for next rule
            scope.targetDateRange.label = 'Target Date Range';
            scope.targetDateRange.dateStart = null;
            scope.targetDateRange.dateEnd = null;
            scope.targetDateRange.description = '';
            scope.targetDateRange.opacity = '0.50';
            scope.targetDateRange.selectedColor = '#ff0000';

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
            var targetDateRangeUpdateFrameListener,
                targetDateRangeUpdateTaskListener,
                updateOrnamentsListener;

            // listeners
            targetDateRangeUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            targetDateRangeUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                targetDateRangeUpdateFrameListener();
                targetDateRangeUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
