'use strict';

const MENU = require('./menu.json');

export default angular
    .module('app.widget-tab.widget-tab-analytics', [])
    .directive('widgetTabAnalytics', widgetTabAnalyticsDirective);

widgetTabAnalyticsDirective.$inject = [];

function widgetTabAnalyticsDirective() {
    widgetTabAnalyticsCtrl.$inject = [];
    widgetTabAnalyticsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', 'widgetTab'],
        controllerAs: 'widgetTabAnalytics',
        bindToController: {},
        controller: widgetTabAnalyticsCtrl,
        link: widgetTabAnalyticsLink,
    };

    function widgetTabAnalyticsCtrl() {}

    function widgetTabAnalyticsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.widgetTabCtrl = ctrl[1];

        /**
         * @name switchToRFrame
         * @desc switch frame to R frame
         * @returns {void}
         */
        function switchToRFrame() {
            let commandList = [],
                frameName = scope.widgetCtrl.getFrame('name');

            commandList = [
                {
                    type: 'variable',
                    components: [frameName],
                },
                {
                    type: 'convert',
                    components: ['R', frameName],
                    terminal: true,
                },
            ];

            scope.widgetCtrl.execute(commandList);
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            let frameType = scope.widgetCtrl.getFrame('type'),
                updateFrameListener;

            // register listeners
            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                function () {
                    scope.widgetTabCtrl.refreshContent();
                }
            );

            // cleanup
            scope.$on('$destroy', function () {
                updateFrameListener();
                console.log('DESTROY');
            });

            if (frameType !== 'R') {
                switchToRFrame();
            }

            scope.widgetTabCtrl.setContent(MENU);
        }

        initialize();
    }
}
