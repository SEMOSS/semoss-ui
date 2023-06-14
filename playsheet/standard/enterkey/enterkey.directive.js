(function () {
    'use strict';

    /**
     * @name enterKey
     * @desc handle enter key press down events.
     */

    angular.module('app.enterkey.directive', [])
        .directive('enterKey', enterKey);

    enterKey.$inject = [];

    function enterKey() {

        enterKeyLink.$inject = ['scope', 'ele', 'attrs'];

        return {
            restrict: 'A',
            link: enterKeyLink
        };

        function enterKeyLink(scope, ele, attrs) {
            ele.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.enterKey);
                    });
                    event.preventDefault();
                }
            });
        }
    }
})
();