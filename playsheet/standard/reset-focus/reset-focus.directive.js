(function () {
    'use strict';

    angular.module('app.reset-focus.directive', [])
        .directive('resetFocus', resetFocus);
    //focus directive keeps the cursor on the latest input in the console
    function resetFocus() {
        return function (scope, element) {
            element.focus();
        };
    }
})();