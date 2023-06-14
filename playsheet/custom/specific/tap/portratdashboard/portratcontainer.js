(function () {
    'use strict';
    angular.module('app.tap.portratcontainer', [])
        .directive('portratcontainer', portratcontainer);

    portratcontainer.$inject = [];

    function portratcontainer() {

        return {
            restrict: 'EA',
            scope: {
                label: "="
            },
            templateUrl: 'custom/specific/tap/portratdashboard/portratcontainer.html',
            transclude: true,
            link: function(scope, ele, attrs) {

            }
        };
    }
})(); //end of controller IIFE