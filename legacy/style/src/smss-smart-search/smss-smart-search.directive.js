export default angular
    .module('smss-style.smart-search', [])
    .directive('smssSmartSearch', smssSmartSearch);

import './smss-smart-search.scss';

smssSmartSearch.$inject = ['$timeout'];

function smssSmartSearch($timeout) {
    smssSmartSearchLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: require('./smss-smart-search.directive.html'),
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
        controllerAs: 'smssSmartSearch',
        controller: smssSmartSearchController,
        transclude: true,
        link: smssSmartSearchLink,
    };

    function smssSmartSearchController() {}

    function smssSmartSearchLink(scope, ele, attrs) {
        let inputEle;

        scope.smssSmartSearch.placeholder = 'Search...';

        scope.smssSmartSearch.clearInput = clearInput;
        scope.smssSmartSearch.onChange = onChange;
        scope.smssSmartSearch.onClearKeydown = onClearKeydown;
        scope.smssSmartSearch.onInputKeydown = onInputKeydown;
        scope.smssSmartSearch.onInputKeyup = onInputKeyup;
        scope.smssSmartSearch.onVoiceInput = onVoiceInput;

        /**
         * @name onChange
         * @desc called whenever the model changes
         * @returns {void}
         */
        function onChange() {
            $timeout(function () {
                if (scope.smssSmartSearch.change) {
                    scope.smssSmartSearch.change({
                        searchTerm: scope.smssSmartSearch.model,
                    });
                }
            });
        }

        /**
         * @name onVoiceInput
         * @desc takes voice input and sneds it back to parent
         * @returns {void}
         */
        function onVoiceInput(text) {
            scope.smssSmartSearch.model = text;
            if (scope.smssSmartSearch.change) {
                onChange();
            }
        }

        /**
         * @name clear
         * @desc clears the input
         * @returns {void}
         */
        function clearInput() {
            scope.smssSmartSearch.model = '';
            if (scope.smssSmartSearch.change) {
                onChange();
            }
            if (scope.smssSmartSearch.clear) {
                scope.smssSmartSearch.clear();
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
            if (scope.smssSmartSearch.keydown) {
                scope.smssSmartSearch.keydown(event);
            }
        }

        /**
         * @name onInputKeyup
         * @desc calls keyup function for input element
         * @param {*} event keyup event
         * @returns {void}
         */
        function onInputKeyup(event) {
            if (scope.smssSmartSearch.keyup) {
                scope.smssSmartSearch.keyup(event);
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            inputEle = ele[0].querySelector('#smss-search__input');

            console.log(scope.smssSmartSearch.model);

            if (attrs.hasOwnProperty('autofocus')) {
                $timeout(function () {
                    if (inputEle) {
                        inputEle.focus();
                    }
                });
            }

            if (attrs.hasOwnProperty('inline')) {
                scope.smssSmartSearch.isInline = !(attrs.inline === 'false');
            } else {
                scope.smssSmartSearch.isInline = false;
            }

            if (attrs.hasOwnProperty('placeholder')) {
                scope.smssSmartSearch.placeholder = attrs.placeholder;
            }
        }

        initialize();
    }
}
