'use strict';

const MENU = require('./menu.json');

export default angular
    .module('app.widget-tab.widget-tab-share', [])
    .directive('widgetTabShare', widgetTabShareDirective);

widgetTabShareDirective.$inject = [];

function widgetTabShareDirective() {
    widgetTabShareCtrl.$inject = [];
    widgetTabShareLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', 'widgetTab'],
        controllerAs: 'widgetTabShare',
        bindToController: {},
        controller: widgetTabShareCtrl,
        link: widgetTabShareLink,
    };

    function widgetTabShareCtrl() {}

    function widgetTabShareLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.widgetTabCtrl = ctrl[1];

        function initialize() {
            let updateNewInsightListener;
            scope.widgetTabShare.filterMenu = [
                {
                    name: 'Share / Export',
                    widgets: [],
                    height: 100,
                },
            ];
            // register listeners
            updateNewInsightListener = scope.widgetCtrl.on(
                'update-new-insight',
                function () {
                    scope.widgetTabCtrl.refreshContent();
                }
            );
            // cleanup
            scope.$on('$destroy', function () {
                updateNewInsightListener();
                console.log('DESTROY');
            });
            scope.widgetTabCtrl.setContent(MENU);
        }

        initialize();
    }
}
