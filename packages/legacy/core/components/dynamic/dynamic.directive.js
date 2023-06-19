'use strict';

/**
 * @name dynamic
 * @desc dynamically compile html when passed in or changed.
 */

export default angular
    .module('app.dynamic.directive', [])
    .directive('dynamic', dynamic);

dynamic.$inject = ['$compile'];

function dynamic($compile) {
    dynamicLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'A',
        replace: true,
        link: dynamicLink,
    };

    function dynamicLink(scope, ele, attrs) {
        var childScope;

        scope.$watch(attrs.dynamic, function (html) {
            if (childScope) {
                childScope.$destroy();
            }

            ele.html(html);

            childScope = scope.$new();

            $compile(ele.contents())(childScope);
        });
    }
}
