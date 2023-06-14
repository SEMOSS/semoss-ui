'use strict';

/**
 * @name number.js
 * @desc number field
 */
export default angular
    .module('app.widget-compiler.number', [])
    .directive('number', number);

number.$inject = ['$compile'];

function number($compile) {
    numberCtrl.$inject = [];
    numberLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        controller: numberCtrl,
        link: numberLink,
        require: [],
        bindToController: {
            handle: '=',
        },
        controllerAs: 'numberCtrl',
    };

    function numberCtrl() {}

    function numberLink(scope, ele) {
        function initialize() {
            var template = '<div ';
            if (
                scope.numberCtrl.handle.view &&
                scope.numberCtrl.handle.view.attributes &&
                scope.numberCtrl.handle.view.attributes.container
            ) {
                template +=
                    'class="' +
                    scope.numberCtrl.handle.view.attributes.container +
                    '"';
            }

            template +=
                '><smss-input type="number" ng-model="numberCtrl.handle.model.defaultValue" ';

            if (
                scope.numberCtrl.handle.model.min ||
                scope.numberCtrl.handle.model.min === 0
            ) {
                template += 'min="' + scope.numberCtrl.handle.model.min + '" ';
            }
            if (
                scope.numberCtrl.handle.model.max ||
                scope.numberCtrl.handle.model.max === 0
            ) {
                template += 'max="' + scope.numberCtrl.handle.model.max + '" ';
            }

            if (scope.numberCtrl.handle.view.attributes) {
                if (scope.numberCtrl.handle.view.attributes.step) {
                    template +=
                        'step="' + scope.handle.view.attributes.step + '" ';
                }
                if (scope.numberCtrl.handle.view.attributes.readonly) {
                    template += 'ng-disabled="true"';
                }
            }

            template += '></smss-input></div>';

            // compile
            ele.html(template);
            $compile(ele.contents())(scope);
        }

        initialize();

        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying number');
        });
    }
}
