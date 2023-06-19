export default angular
    .module('smss-style.search', [])
    .directive('smssSearch', smssSearch);

import './smss-search.scss';

smssSearch.$inject = ['$timeout'];

function smssSearch($timeout) {
    smssSearchLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: require('./smss-search.directive.html'),
        scope: {},
        bindToController: {
            model: '=',
            change: '&?',
            keydown: '&?',
            keyup: '&?',
            clear: '&?',
            disabled: '=?ngDisabled',
        },
        replace: true,
        controllerAs: 'smssSearch',
        controller: smssSearchController,
        transclude: true,
        link: smssSearchLink,
    };

    function smssSearchController() {}

    function smssSearchLink(scope, ele, attrs) {
        let inputEle;

        scope.smssSearch.placeholder = 'Search...';

        scope.smssSearch.clearInput = clearInput;
        scope.smssSearch.onChange = onChange;
        scope.smssSearch.onClearKeydown = onClearKeydown;
        scope.smssSearch.onInputKeydown = onInputKeydown;
        scope.smssSearch.onInputKeyup = onInputKeyup;

        /**
         * @name onChange
         * @desc called whenever the model changes
         * @returns {void}
         */
        function onChange() {
            $timeout(function () {
                if (scope.smssSearch.change) {
                    scope.smssSearch.change({
                        searchTerm: scope.smssSearch.model,
                    });
                }
            });
        }

        /**
         * @name clear
         * @desc clears the input
         * @returns {void}
         */
        function clearInput() {
            scope.smssSearch.model = '';
            if (scope.smssSearch.change) {
                onChange();
            }
            if (scope.smssSearch.clear) {
                scope.smssSearch.clear();
            }
        }

        /**
         * @name onClearKeydown
         * @desc clears the input on enter for the clear button
         * @param {*} event keydown event
         * @returns {void}
         */
        function onClearKeydown(event) {
            if (event.keyCode === 13) {
                clearInput();
            }
        }

        /**
         * @name onInputKeydown
         * @desc calls keydown function for input element
         * @param {*} event keydown event
         * @returns {void}
         */
        function onInputKeydown(event) {
            if (scope.smssSearch.keydown) {
                scope.smssSearch.keydown(event);
            }
        }

        /**
         * @name onInputKeyup
         * @desc calls keyup function for input element
         * @param {*} event keyup event
         * @returns {void}
         */
        function onInputKeyup(event) {
            if (scope.smssSearch.keyup) {
                scope.smssSearch.keyup(event);
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            inputEle = ele[0].querySelector('#smss-search__input');

            if (attrs.hasOwnProperty('autofocus')) {
                $timeout(function () {
                    if (inputEle) {
                        inputEle.focus();
                    }
                });
            }

            if (attrs.hasOwnProperty('inline')) {
                scope.smssSearch.isInline = !(attrs.inline === 'false');
            } else {
                scope.smssSearch.isInline = false;
            }

            if (attrs.hasOwnProperty('placeholder')) {
                scope.smssSearch.placeholder = attrs.placeholder;
            }
        }

        initialize();
    }
}
