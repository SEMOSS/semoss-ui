'use strict';

/**
 * @name execute.js
 * @desc execute button that will run a pkql
 */
export default angular
    .module('app.widget-compiler.execute', [])
    .directive('execute', execute);

execute.$inject = [];

function execute() {
    executeCtrl.$inject = [];
    executeLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./execute.directive.html'),
        controller: executeCtrl,
        link: executeLink,
        require: [],
        scope: {
            handle: '=?',
            execute: '=?',
            executeQuery: '&',
        },
    };

    function executeCtrl() {}

    function executeLink(scope) {
        scope.onButtonClick = onButtonClick;

        /**
         * @name onButtonClick
         * @desc execute the query
         * @param {string} value - value that was clicked
         * @returns {void}
         */
        function onButtonClick(value) {
            scope.handle.model.defaultValue = value;
            scope.executeQuery();
        }

        /**
         * @name initalize
         * @desc init function
         * @returns {void}
         */
        function initialize() {
            if (!scope.handle) {
                if (scope.execute === 'button' || scope.execute === 'all') {
                    scope.handle = {
                        model: {
                            defaultOptions: ['Execute'],
                            defaultValues: '',
                        },
                    };
                } else {
                    scope.handle = {
                        model: {
                            defaultOptions: [scope.execute],
                            defaultValues: '',
                        },
                    };
                }
            }
        }

        initialize();
    }
}
