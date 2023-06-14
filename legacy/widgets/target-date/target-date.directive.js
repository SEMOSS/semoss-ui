'use strict';

import './target-date.scss';

export default angular
    .module('app.target-date.directive', [])
    .directive('targetDate', targetDateDirective);

targetDateDirective.$inject = ['VIZ_COLORS'];

function targetDateDirective(VIZ_COLORS) {
    targetDateCtrl.$inject = [];
    targetDateLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'targetDate',
        bindToController: {},
        template: require('./target-date.directive.html'),
        controller: targetDateCtrl,
        link: targetDateLink,
    };

    function targetDateCtrl() {}

    function targetDateLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // variables
        scope.targetDate.dates = [];
        scope.targetDate.theme = VIZ_COLORS.COLOR_SEMOSS;
        scope.targetDate.label = 'Target';
        scope.targetDate.date = null;
        scope.targetDate.selectedColor = '#ff0000';

        // functions
        scope.targetDate.execute = execute;
        scope.targetDate.removeFromAppliedDates = removeFromAppliedDates;

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

            if (sharedTools.targetDate) {
                scope.targetDate.dates = sharedTools.targetDate.dates || [];
            }
        }

        /**
         * @name removeFromAppliedDates
         * @desc remove the selected date from the target dates
         * @param {num} idx - selected date
         * @returns {void}
         */
        function removeFromAppliedDates(idx) {
            scope.targetDate.dates.splice(idx, 1);
            execute(false);
        }

        /**
         * @name checkRequirements
         * @desc check if all required parameters are selected; check if the user inputted date is of an acceptable format
         * @returns {bool} array of missing parameters
         */
        function checkRequirements() {
            // TODO add all checks here before executing new target date
            var d;

            if (!scope.targetDate.date) {
                scope.widgetCtrl.alert('warn', 'Please select a date.');
                return false;
            }

            d = new Date(scope.targetDate.date);

            if (Object.prototype.toString.call(d) === '[object Date]') {
                if (isNaN(d.getTime())) {
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
                'Target Date is not of the correct format. Please enter a date using the following format: YYYY-MM-DD.'
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
                date = {},
                proceed;

            // Define new rule
            if (update) {
                proceed = checkRequirements();
                if (!proceed) {
                    return;
                }
                date.label = scope.targetDate.label || 'Target';
                date.date = scope.targetDate.date;
                date.color = scope.targetDate.selectedColor || '#ff0000';
                scope.targetDate.dates.unshift(date);
            }

            // Add rule to rule set and push to shared tools
            newTool.targetDate = {};
            newTool.targetDate.dates = scope.targetDate.dates;

            // Reset selections for next rule
            scope.targetDate.label = 'Target';
            scope.targetDate.date = null;
            scope.targetDate.selectedColor = '#ff0000';

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
            var targetDateUpdateFrameListener,
                targetDateUpdateTaskListener,
                updateOrnamentsListener;

            // listeners
            targetDateUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            targetDateUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                targetDateUpdateFrameListener();
                targetDateUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
