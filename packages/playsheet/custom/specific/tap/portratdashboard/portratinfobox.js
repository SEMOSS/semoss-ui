(function () {
    'use strict';
    angular.module('app.tap.portratinfobox', [])
        .directive('portratinfobox', portratinfobox);

    portratinfobox.$inject = [];

    function portratinfobox() {

        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'custom/specific/tap/portratdashboard/portratinfobox.html',
            transclude: true
        };
    }
})(); //end of controller IIFE