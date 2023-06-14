import Utility from '../utility.js';

/**
 * @name smss-typeahead.directive.js
 * @desc smss-typeahead field
 */
export default angular
    .module('smss-style.typeahead', [])
    .directive('smssTypeahead', smssTypeaheadDirective);

import './smss-typeahead.scss';

smssTypeaheadDirective.$inject = ['$timeout', '$filter'];

function smssTypeaheadDirective($timeout, $filter) {
    smssTypeaheadController.$inject = [];
    smssTypeaheadLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: require('./smss-typeahead.directive.html'),
        scope: {},
        bindToController: {
            model: '=',
            options: '=',
            placeholder: '=?',
            change: '&?',
            search: '&?',
            disabled: '=?ngDisabled',
            scroll: '&?',
            loading: '=?',
            keydown: '&?',
            keyup: '&?',
            click: '&?',
            showPopover: '&?',
            hidePopover: '&?',
        },
        replace: true,
        controllerAs: 'smssTypeahead',
        controller: smssTypeaheadController,
        compile: smssTypeaheadCompile,
    };

    function smssTypeaheadController() {}

    function smssTypeaheadCompile(tElement, tAttributes) {
        var popoverEle = tElement[0].querySelector('smss-popover-content');

        // att the special attributes
        if (tAttributes.hasOwnProperty('body')) {
            popoverEle.setAttribute('body', !(tAttributes.body === 'false'));
        }

        if (tAttributes.hasOwnProperty('container')) {
            popoverEle.setAttribute('container', tAttributes.container);
        }

        return smssTypeaheadLink;
    }

    function smssTypeaheadLink(scope, ele, attrs) {
        var searchTimeout, userInputTimeout, inputEle, popoverEle;

        scope.smssTypeahead.open = open;
        scope.smssTypeahead.close = close;
        scope.smssTypeahead.show = show;
        scope.smssTypeahead.hide = hide;
        scope.smssTypeahead.select = select;
        scope.smssTypeahead.setView = setView;
        scope.smssTypeahead.setModelView = setModelView;
        scope.smssTypeahead.inputKeydown = inputKeydown;
        scope.smssTypeahead.listKeydown = listKeydown;
        scope.smssTypeahead.listKeyup = listKeyup;
        scope.smssTypeahead.searchOptions = searchOptions;
        scope.smssTypeahead.visible = false;
        scope.smssTypeahead.keepUnderscores = false;

        /**
         * @name open
         * @desc toggles typeahead to open
         * @returns {void}
         */
        function open() {
            if (!scope.smssTypeahead.visible) {
                scope.smssTypeahead.visible = true;
            }
        }

        /**
         * @name close
         * @desc toggles typeahead to close
         * @returns {void}
         */
        function close() {
            if (scope.smssTypeahead.visible) {
                scope.smssTypeahead.visible = false;
            }
        }

        /**
         * @name show
         * @desc called when the popover is opened
         * @param {ele} contentEle - popover content
         * @returns {void}
         */
        function show(contentEle) {
            popoverEle = contentEle;
            if (scope.smssTypeahead.showPopover) {
                scope.smssTypeahead.showPopover({
                    contentEle: contentEle,
                });
            }
        }

        /**
         * @name hide
         * @desc called when the popover is closed
         * @returns {void}
         */
        function hide() {
            popoverEle = undefined;

            if (inputEle) {
                inputEle.focus();
            }

            if (scope.smssTypeahead.hidePopover) {
                scope.smssTypeahead.hidePopover({
                    contentEle: contentEle,
                });
            }
        }

        /**
         * @name setModelView
         * @param {object} model the elements model
         * @desc gets the option from the model and returns the view of the model
         * @return {function} setView Function
         */
        function setModelView(model) {
            var selectedOpt;
            if (!model && model !== 0 && model !== null) {
                return '';
            }

            selectedOpt = model;
            return setView(selectedOpt);
        }
        /**
         * @name setView
         * @desc called to set the view
         * @param {*} opt - model backing this option
         * @returns {string} view
         */
        function setView(opt) {
            var view = opt;
            if (
                scope.smssTypeahead.display &&
                opt.hasOwnProperty(scope.smssTypeahead.display)
            ) {
                view = Utility.convert(view, scope.smssTypeahead.display);
            }
            if (scope.filter) {
                view = $filter(scope.filter)(view);
            }
            if (scope.smssTypeahead.keepUnderscores) {
                return view;
            }
            view = Utility.toDisplay(view);

            return view;
        }

        /**
         * @name select
         * @param {*} opt - selected option
         * @desc called when a user clicks an option from the list
         * @returns {void}
         */
        function select(opt) {
            var model;
            if (scope.smssTypeahead.value) {
                model = opt[scope.smssTypeahead.value];
            } else {
                model = opt;
            }
            scope.smssTypeahead.model = model;
            scope.smssTypeahead.searchTerm = setModelView(opt);
            $timeout(function () {
                if (scope.smssTypeahead.change) {
                    scope.smssTypeahead.change({
                        model: scope.smssTypeahead.model,
                    });
                }
                close();
            });
            // Will keep the cursor at the end after selecting an option on click or enter
            inputEle.focus();
        }

        /**
         * @name setUserInput
         * @param {*} option - selected option
         * @param {number} delay - delay
         * @desc called when the user types in the input
         * @returns {void}
         */
        function setUserInput(option, delay) {
            if (userInputTimeout) {
                $timeout.cancel(userInputTimeout);
            }

            userInputTimeout = $timeout(
                function (opt) {
                    scope.smssTypeahead.model = opt;
                    scope.smssTypeahead.searchTerm = opt;

                    if (scope.smssTypeahead.change) {
                        scope.smssTypeahead.change({
                            model: scope.smssTypeahead.model,
                        });
                    }

                    $timeout.cancel(userInputTimeout);
                }.bind(null, option),
                delay
            );
        }

        /***Hooks */
        /**
         * @name searchOptions
         * @param {*} searchTerm - search
         * @desc called when list is searched
         * @returns {void}
         */
        function searchOptions(searchTerm) {
            var filteredOptions;

            if (scope.smssTypeahead.search) {
                if (searchTimeout) {
                    $timeout.cancel(searchTimeout);
                }
                searchTimeout = $timeout(
                    function (term) {
                        scope.smssTypeahead.search({
                            search: term,
                        });

                        $timeout.cancel(searchTimeout);
                    }.bind(null, searchTerm),
                    500
                );
            } else {
                filteredOptions = Utility.filter(
                    scope.smssTypeahead.options,
                    searchTerm,
                    scope.smssTypeahead.display
                );
                scope.smssTypeahead.listOptions = filteredOptions;
            }

            setUserInput(searchTerm, 300);
        }

        /**
         * @name inputKeydown
         * @param {event} $event - DOM event
         * @desc menu navigation - handles keydown events for input element
         * @returns {void}
         */
        function inputKeydown($event) {
            var selectedEle;

            if ($event.keyCode !== 13) {
                // enter
                open();
            }

            if ($event.keyCode === 40) {
                //down
                $event.preventDefault();

                if (popoverEle) {
                    selectedEle =
                        popoverEle.querySelectorAll('.smss-list__option');
                    if (selectedEle[0]) {
                        selectedEle[0].focus();
                    }
                }
            } else if ($event.keyCode === 38) {
                //up
                $event.preventDefault();
                close();
            } else if ($event.keyCode === 9) {
                // tab
                close();
            }

            if (scope.smssTypeahead.listOptions.length === 0) {
                close();
            }
            if (scope.smssTypeahead.keydown) {
                scope.smssTypeahead.keydown({ event: $event, type: 'input' });
            }
        }

        /**
         * @name listKeydown
         * @param {event} $event - angular event
         * @desc menu navigation - handles keydown events for list element
         * @returns {void}
         */
        function listKeydown($event) {
            var nextElement, prevElement;

            if ($event.keyCode === 40) {
                // down
                $event.preventDefault();

                nextElement = $event.target.nextElementSibling;
                if (nextElement) {
                    nextElement.focus();
                } else {
                    inputEle.focus();
                }
            } else if ($event.keyCode === 38) {
                // up
                $event.preventDefault();

                prevElement = $event.target.previousElementSibling;
                if (prevElement) {
                    prevElement.focus();
                } else {
                    inputEle.focus();
                }
            } else if ($event.keyCode === 13) {
                // enter
                $event.preventDefault();
            } else if ($event.keyCode === 9) {
                // tab
                close();
            }
            if (scope.smssTypeahead.keydown) {
                scope.smssTypeahead.keydown({ event: $event, type: 'list' });
            }
        }

        /**
         * @name listKeyup
         * @param {event} $event - angular event
         * @param {*} option - selected option
         * @desc menu navigation - handles keyup events for list element
         * @returns {void}
         */
        function listKeyup($event, option) {
            if ($event.keyCode === 13) {
                // enter
                $event.preventDefault();
                $event.stopPropagation();

                select(option);
                close();
            }
            if (scope.smssTypeahead.keyup) {
                scope.smssTypeahead.keyup({ event: $event, option: option });
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            // Elements
            inputEle = ele[0].querySelector('#smss-typeahead__input');

            // Attributes
            if (attrs.hasOwnProperty('display')) {
                scope.smssTypeahead.display = attrs.display.split('.');
            }
            if (attrs.hasOwnProperty('value')) {
                scope.smssTypeahead.value = attrs.value.split('.');
            }

            if (attrs.hasOwnProperty('keepUnderscores')) {
                scope.smssTypeahead.keepUnderscores = true;
            }

            if (attrs.hasOwnProperty('minlength')) {
                scope.smssTypeahead.minlength = attrs.minlength;
            }

            if (attrs.hasOwnProperty('maxlength')) {
                scope.smssTypeahead.maxlength = attrs.maxlength;
            }

            if (!Array.isArray(scope.smssTypeahead.options)) {
                scope.smssTypeahead.options = [];
            }

            scope.$watchCollection(
                'smssTypeahead.options',
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        scope.smssTypeahead.listOptions = newValue;
                    }
                }
            );

            scope.$watchCollection(
                'smssTypeahead.listOptions',
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        if (newValue && newValue.length === 0) {
                            close();
                        }
                    }
                }
            );

            scope.$watchCollection(
                'smssTypeahead.model',
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        scope.smssTypeahead.searchTerm = setModelView(newValue);
                    }
                }
            );

            scope.$watch(
                'smssTypeahead.visible',
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        if (
                            newValue &&
                            scope.smssTypeahead.listOptions.length === 0
                        ) {
                            close();
                        }
                    }
                }
            );

            $timeout(function () {
                scope.smssTypeahead.listOptions = scope.smssTypeahead.options;
                // Set searchTerm if model is specified
                scope.smssTypeahead.searchTerm = scope.smssTypeahead.model;

                if (attrs.hasOwnProperty('autofocus')) {
                    if (inputEle) {
                        inputEle.focus();
                    }
                }
            });
        }

        initialize();
    }
}
