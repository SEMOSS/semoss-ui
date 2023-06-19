'use strict';

import angular from 'angular';

export default angular
    .module('smss-style.loading', [])
    .directive('smssLoading', smssLoading);

import './smss-loading.scss';

smssLoading.$inject = ['$timeout'];

function smssLoading() {
    smssLoadingCtrl.$inject = [];
    smssLoadingLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'EA',
        scope: {},
        template: require('./smss-loading.directive.html'),
        bindToController: {
            model: '=',
            messages: '=?',
            close: '&?',
        },
        controllerAs: 'smssLoading',
        controller: smssLoadingCtrl,
        link: smssLoadingLink,
    };

    function smssLoadingCtrl() {}

    function smssLoadingLink(scope) {
        scope.smssLoading.list = false;

        scope.smssLoading.toggleList = toggleList;
        scope.smssLoading.closeScreen = closeScreen;

        /**
         * @name updateLoadingScreen
         * @desc update the loading screen to be open or closed
         */
        function updateLoadingScreen() {
            if (scope.smssLoading.model) {
                if (typeof scope.smssLoading.messages === 'undefined') {
                    scope.smssLoading.messages = [];
                }
            } else {
                // reset
                scope.smssLoading.messages = [];
            }
        }

        /**
         * @name toggleList
         * @desc toggles the list to be open or closed
         */
        function toggleList() {
            scope.smssLoading.list = !scope.smssLoading.list;
        }

        /**
         * @name closeScreen
         * @desc closes the screen when the close button is clicked
         */
        function closeScreen() {
            scope.smssLoading.model = false;
            if (scope.smssLoading.close) {
                scope.smssLoading.close();
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         */
        function initialize() {
            // add in listeners
            scope.$watch('model', updateLoadingScreen);
        }

        initialize();
    }
}
