import angular from 'angular';

import './pixel-timer.scss';

export default angular
    .module('app.pixel-timer.directive', [])
    .directive('pixelTimer', pixelTimerDirective);

pixelTimerDirective.$inject = ['semossCoreService'];

function pixelTimerDirective(semossCoreService) {
    pixelTimerLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'E',
        require: ['^widget'],
        template: require('./pixel-timer.directive.html'),
        controller: pixelTimerCtrl,
        controllerAs: 'pixelTimer',
        link: pixelTimerLink,
        scope: {},
    };

    function pixelTimerCtrl() {}

    function pixelTimerLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        scope.pixelTimer.statement = '';
        scope.pixelTimer.timer = 0.5;
        scope.pixelTimer.refresh = false;

        scope.pixelTimer.execute = execute;
        scope.pixelTimer.cancel = cancel;
        scope.pixelTimer.edit = edit;

        function execute(): void {
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
                                    pixelTimer: {
                                        statement: scope.pixelTimer.statement,
                                        timer: scope.pixelTimer.timer,
                                        refresh: scope.pixelTimer.refresh,
                                    },
                                },
                            },
                        },
                    ],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools.shared'],
                    terminal: true,
                },
            ]);

            scope.pixelTimer.currentStatement = scope.pixelTimer.statement;
            scope.pixelTimer.statement = '';
        }

        function cancel(): void {
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
                                    pixelTimer: false,
                                },
                            },
                        },
                    ],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools.shared'],
                    terminal: true,
                },
            ]);

            scope.pixelTimer.currentStatement = '';
        }

        function edit(): void {
            scope.pixelTimer.statement = scope.pixelTimer.currentStatement;

            cancel();
        }

        function initialize(): void {
            const pixelTimerSettings = semossCoreService.getPixelTimer(
                scope.widgetCtrl.widgetId
            );
            if (pixelTimerSettings) {
                scope.pixelTimer.currentStatement =
                    pixelTimerSettings.statement;
                scope.pixelTimer.timer = pixelTimerSettings.timer;
                scope.pixelTimer.refresh = pixelTimerSettings.refresh;
            }
        }

        initialize();
    }
}
