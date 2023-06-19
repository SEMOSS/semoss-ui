(function () {
    'use strict';

    /**
     * @name replaceSpaces
     * @desc replace spaces with under scores
     */

    angular.module('app.replace-spaces.directive', [])
        .directive('replaceSpaces', replaceSpaces);

    replaceSpaces.$inject = ['$parse'];
    function replaceSpaces($parse) {

        replaceSpacesLink.$inject = ["scope", "ele", "attrs", "modelCtrl"];

        return {
            require: 'ngModel',
            link: replaceSpacesLink
        };

        function replaceSpacesLink(scope, ele, attrs, modelCtrl) {
            var replaceSpaceWithUnderscore = function (inputValue) {
                if (inputValue) {
                    var replacedSpace = inputValue.replace(/ /g, "_");
                    if (replacedSpace !== inputValue) {
                        modelCtrl.$setViewValue(replacedSpace);
                        modelCtrl.$render();
                    }
                    return replacedSpace;
                }
            };
            var model = $parse(attrs.ngModel);
            modelCtrl.$parsers.push(replaceSpaceWithUnderscore);
            replaceSpaceWithUnderscore(model(scope));
        }

    }
})
();