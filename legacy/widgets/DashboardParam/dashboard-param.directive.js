'use strict';

export default angular
    .module('app.dashboard-param.directive', [])
    .directive('dashboardParam', dashboardParam);

dashboardParam.$inject = [];

function dashboardParam() {
    dashboardParamCtrl.$inject = [];
    dashboardParamLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        template: require('./dashboard-param.directive.html'),
        controller: dashboardParamCtrl,
        bindToController: {},
        controllerAs: 'dashboardParam',
        link: dashboardParamLink,
    };

    function dashboardParamCtrl() {}

    function dashboardParamLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        if (scope.widgetCtrl.getWidget('view.param.options.json')) {
            // check to see if we have a 'state' saved already. if so we will bring that one back else we will use the original json in view.param.options.json
            if (scope.widgetCtrl.getOptions('widgetOptions.param.json')) {
                // angular to json so that it would strip out $$hashkey and object...
                scope.dashboardParam.json = JSON.parse(
                    angular.toJson(
                        scope.widgetCtrl.getOptions('widgetOptions.param.json')
                    )
                );
            } else {
                scope.dashboardParam.json = scope.widgetCtrl.getWidget(
                    'view.param.options.json'
                );
            }
        }
    }
}
