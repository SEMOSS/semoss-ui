'use strict';

const MENU = require('./menu.json');

export default angular
    .module('app.widget-tab.widget-tab-enrich', [])
    .directive('widgetTabEnrich', widgetTabEnrichDirective);

widgetTabEnrichDirective.$inject = [];

function widgetTabEnrichDirective() {
    widgetTabEnrichCtrl.$inject = [];
    widgetTabEnrichLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', 'widgetTab'],
        controllerAs: 'widgetTabEnrich',
        bindToController: {},
        controller: widgetTabEnrichCtrl,
        link: widgetTabEnrichLink,
    };

    function widgetTabEnrichCtrl() {}

    function widgetTabEnrichLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.widgetTabCtrl = ctrl[1];

        function initialize() {
            let updateFrameListener;

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

            scope.widgetTabCtrl.setContent(MENU);
        }

        initialize();
    }
}
