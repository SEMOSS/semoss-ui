(function () {
    'use strict';

    /**
     * @name dynamic
     * @desc dynamically compile html when passed in or changed.
     */

    angular.module('app.dynamic.directive', [])
        .directive('dynamic', dynamic);

    dynamic.$inject = ['$compile'];
    function dynamic($compile) {

        dynamicLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
        return {
            restrict: 'A',
            replace: true,
            link: dynamicLink
        };

        function dynamicLink(scope, ele, attrs) {
            scope.$watch(attrs.dynamic, function (html) {
                if (ele.children().scope()) {
                    ele.children().scope().$destroy()
                }
                ele.html(html);
                $compile(ele.contents())(scope.$new());
            });
        }
    }
})
();