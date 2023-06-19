(function () {
    'use strict';

    /**
     * @name visual-panel
     * @desc Visual Panel Directive used to switch between visualizations
     */

    angular.module('app.jv-pie-tools.directive', [])
        .directive('jvPieTools', jvPieTools);

    jvPieTools.$inject = [];

    function jvPieTools() {

        jvPieToolsCtrl.$inject = ["$scope"];
        jvPieToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];


        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'jvPieTools',
            bindToController: {},
            templateUrl: 'custom/jv-pie/jv-pie-tools.directive.html',
            controller: jvPieToolsCtrl,
            link: jvPieToolsLink
        };

        function jvPieToolsCtrl($scope) {
            var jvPieTools = this;

            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
            }

            initialize();
        }

        function jvPieToolsLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.toolPanelCtrl = ctrl[0];
        }

    }
})();
