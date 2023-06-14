'use strict';

import angular from 'angular';

export default angular
    .module('app.loading-screen.directive', [])
    .directive('loadingScreen', loadingScreen);

import './loading-screen.scss';

loadingScreen.$inject = ['$timeout'];

function loadingScreen($timeout) {
    loadingScreenCtrl.$inject = [];
    loadingScreenLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'EA',
        scope: {},
        template: require('./loading-screen.directive.html'),
        bindToController: {
            model: '=',
            messages: '=?',
            close: '&?',
        },
        controllerAs: 'loadingScreen',
        controller: loadingScreenCtrl,
        link: loadingScreenLink,
    };

    function loadingScreenCtrl() {}

    function loadingScreenLink(scope, ele) {
        let loadingListEle, loadingListWatcher, scrollTimeout;

        scope.loadingScreen.list = false;

        scope.loadingScreen.toggleList = toggleList;
        scope.loadingScreen.closeScreen = closeScreen;

        /**
         * @name updateLoadingScreen
         * @desc update the loading screen to be open or closed
         */
        function updateLoadingScreen(): void {
            if (scope.loadingScreen.model) {
                if (typeof scope.loadingScreen.messages === 'undefined') {
                    scope.loadingScreen.messages = [];
                }
            } else {
                // reset
                scope.loadingScreen.messages = [];
            }
        }

        /**
         * @name toggleList
         * @desc toggles the list to be open or closed
         */
        function toggleList(): void {
            scope.loadingScreen.list = !scope.loadingScreen.list;
        }

        /**
         * @name closeScreen
         * @desc closes the screen when the close button is clicked
         */
        function closeScreen(): void {
            scope.loadingScreen.model = false;
            if (scope.loadingScreen.close) {
                scope.loadingScreen.close();
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         */
        function initialize(): void {
            // add in listeners
            scope.$watch('model', updateLoadingScreen);
        }

        initialize();
    }
}
