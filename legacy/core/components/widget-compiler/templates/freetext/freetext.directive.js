'use strict';

/**
 * @name freetext.js
 * @desc freetext button that will run a pkql
 */
export default angular
    .module('app.widget-compiler.freetext', [])
    .directive('freetext', freetext);

freetext.$inject = ['$compile'];

function freetext($compile) {
    freetextLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        link: freetextLink,
        require: [],
        scope: {
            handle: '=',
        },
        controllerAs: 'freetextCtrl',
    };

    function freetextLink(scope, ele, attrs, ctrl) {
        scope.validate = validate;

        function initialize() {
            var template = '<div';

            if (
                scope.handle.view.attributes &&
                scope.handle.view.attributes.container
            ) {
                template +=
                    ' class="' + scope.handle.view.attributes.container + '" ';
            }
            template += '>';
            template += '<smss-input style="width:100%"';
            template += ' ng-model="handle.model.defaultValue" ';

            if (scope.handle.view.attributes) {
                if (scope.handle.view.attributes.type) {
                    template +=
                        ' type="' + scope.handle.view.attributes.type + '" ';
                }
                if (scope.handle.view.attributes.pattern) {
                    template +=
                        ' pattern="' +
                        scope.handle.view.attributes.pattern +
                        '" ';
                }
                if (scope.handle.view.attributes.required) {
                    template += ' aria-required="true" ';
                    template += ' required';
                }
                if (scope.handle.view.attributes.readonly) {
                    template += ' ng-disabled="true"';
                }
                if (
                    scope.handle.view.attributes.pattern &&
                    scope.handle.view.attributes.required
                ) {
                    template += ' ng-blur="validate($event)"';
                }
                if (scope.handle.view.attributes.placeholder) {
                    template +=
                        ' placeholder="' +
                        scope.handle.view.attributes.placeholder +
                        '"';
                }
            }

            template += '>';
            template += '</smss-input>';
            template += '</div>';

            // compile
            ele.html(template);
            $compile(ele.contents())(scope);
        }

        function validate(e) {
            if (
                e.currentTarget.validity.patternMismatch &&
                !e.currentTarget.validity.valid
            ) {
                e.currentTarget.style['border-color'] = 'red';
            } else {
                e.currentTarget.style['border-color'] = '';
            }
        }

        initialize();
        // cleanup
        scope.$on('$destroy', function () {
            console.log('destroying freetext');
        });
    }
}
