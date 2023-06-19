(function () {
    'use strict';
    /**
     * @name matrix regression
     * @desc directive that sets options for matrix regression
     */
    angular.module('app.associatedLearning.directive', [])
        .directive('associatedLearning', associatedLearning);

    associatedLearning.$inject = [];
    function associatedLearning() {

        associatedLearningLink.$inject = ["scope", "ele", "attrs", "ctrl"];


        return {
            restrict: 'A',
            scope: {},
            require: ['^analyticsPanel'],
            templateUrl: 'custom/associated-learning/associated-learning.directive.html',
            link: associatedLearningLink
        };

        function associatedLearningLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.analyticsPanel = ctrl[0];
        }
    }
}()); //end of controller IIFE
