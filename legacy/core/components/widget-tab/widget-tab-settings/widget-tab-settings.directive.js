'use strict';

const MENU = require('./menu.json');

export default angular
    .module('app.widget-tab.widget-tab-settings', [])
    .directive('widgetTabSettings', widgetTabSettingsDirective);

widgetTabSettingsDirective.$inject = [];

function widgetTabSettingsDirective() {
    widgetTabSettingsCtrl.$inject = [];
    widgetTabSettingsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', 'widgetTab'],
        controller: widgetTabSettingsCtrl,
        controllerAs: 'widgetTabSettings',
        bindToController: {},
        link: widgetTabSettingsLink,
    };

    function widgetTabSettingsCtrl() {}

    function widgetTabSettingsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.widgetTabCtrl = ctrl[1];

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.widgetTabCtrl.setContent(MENU);
        }

        initialize();
    }
}
