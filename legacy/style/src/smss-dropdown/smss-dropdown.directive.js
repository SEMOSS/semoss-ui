import Utility from '../utility.js';

import './smss-dropdown.scss';

export default angular
    .module('smss-style.dropdown', [])
    .directive('smssDropdown', smssDropdownDirective);

smssDropdownDirective.$inject = ['$timeout', '$filter'];

function smssDropdownDirective($timeout, $filter) {
    smssDropdownCompile.$inject = ['tElement', 'tAttributes'];
    smssDropdownCtrl.$inject = [];
    smssDropdownLink.$inject = ['scope', 'ele', 'attrs', 'ctrl', 'transclude'];

    return {
        restrict: 'E',
        template: require('./smss-dropdown.directive.html'),
        scope: {},
        bindToController: {
            model: '=',
            disabled: '=?ngDisabled',
            options: '=',
            display: '@?',
            value: '@?',
            change: '&?',
            scroll: '&?',
            loading: '=',
            filter: '=?',
            search: '&?',
            mouseover: '&?',
            mouseleave: '&?',
            open: '=?',
        },
        replace: true,
        transclude: {
            toggle: '?smssDropdownToggle',
            list: '?smssDropdownList',
            action: '?smssDropdownAction',
        },
        controllerAs: 'smssDropdown',
        controller: smssDropdownCtrl,
        compile: smssDropdownCompile,
    };

    function smssDropdownCompile(tElement, tAttributes) {
        var popoverEle = tElement[0].querySelector('smss-popover-content');
        // att the special attributes
        if (tAttributes.hasOwnProperty('body')) {
            popoverEle.setAttribute('body', !(tAttributes.body === 'false'));
        }

        if (tAttributes.hasOwnProperty('container')) {
            popoverEle.setAttribute('container', tAttributes.container);
        }

        return smssDropdownLink;
    }

    function smssDropdownCtrl() {}

    function smssDropdownLink(scope, ele, attrs, ctrl, transclude) {
        var dropdownToggleEle,
            dropdownScrollEle,
            dropdownScrollScrollerEle,
            dropdownSearchEle,
            optionHeight,
            filtered,
            currentScroll,
            previousScroll,
            searchTimeout;
        const DEFAULT_OPTION_HEIGHT = 32;
        scope.smssDropdown.showDropdown = showDropdown;
        scope.smssDropdown.hideDropdown = hideDropdown;
        scope.smssDropdown.searchDropdown = searchDropdown;
        scope.smssDropdown.searchDropdownKeydown = searchDropdownKeydown;
        scope.smssDropdown.keyupDropdownList = keyupDropdownList;
        scope.smssDropdown.keydownDropdownList = keydownDropdownList;
        scope.smssDropdown.changeDropdown = changeDropdown;
        scope.smssDropdown.getOption = getOption;
        scope.smssDropdown.setView = setView;
        scope.smssDropdown.isSelected = isSelected;

        /**
         * @name renderDropdownToggle
         * @desc called when the dropdown model changes
         * @returns {void}
         */
        function renderDropdownToggle() {
            var opt, view;

            if (
                !Utility.isDefined(scope.smssDropdown.model) ||
                scope.smssDropdown.model.length === 0
            ) {
                scope.smssDropdown.showPlaceholder = true;
                return;
            }

            // get the option
            opt = getOption(scope.smssDropdown.model);

            if (!Utility.isDefined(opt)) {
                scope.smssDropdown.showPlaceholder = true;
                return;
            }

            view = Utility.toDisplay(
                Utility.convert(opt, scope.smssDropdown.display)
            );

            if (scope.smssDropdown.filter) {
                view = $filter(scope.smssDropdown.filter)(view);
            }

            scope.smssDropdown.showPlaceholder = false;
            scope.smssDropdown.toggle = view;
        }

        /**
         * @name keyupDropdownToggle
         * @param {event} $event - DOM event
         * @desc key up event for the toggle
         * @returns {void}
         */
        function keyupDropdownToggle($event) {
            if ($event.keyCode === 27) {
                // esc
                changeDropdown('');
            }
        }

        /**
         * @name renderDropdownList
         * @desc called when the dropdown model changes
         * @returns {void}
         */
        function renderDropdownList() {
            if (
                scope.smssDropdown.open &&
                dropdownScrollEle &&
                dropdownScrollScrollerEle
            ) {
                var scrollTop = dropdownScrollScrollerEle.scrollTop, //find position of scroll
                    height = dropdownScrollEle.offsetHeight,
                    start = Math.floor((scrollTop - height * 2) / optionHeight), //find start
                    end = Math.floor((scrollTop + height * 2) / optionHeight), //we will render extra
                    i,
                    len;

                //set listStyle
                scope.smssDropdown.listStyle = {
                    height: filtered.length * optionHeight + 'px',
                };

                start = start > 0 ? start : 0;
                end = filtered.length > end ? end : filtered.length;

                //create painted
                scope.smssDropdown.painted = filtered.slice(start, end);

                //push values down
                scope.smssDropdown.styles = [];
                for (
                    i = 0, len = scope.smssDropdown.painted.length;
                    i < len;
                    i++
                ) {
                    scope.smssDropdown.styles.push({
                        top: (start + i) * optionHeight + 'px',
                    });
                }
            }
        }

        /**
         * @name showDropdown
         * @desc dropdown is opened
         * @param {ele} contentEle - contentEle
         * @returns {void}
         */
        function showDropdown(contentEle) {
            //register the eles
            dropdownScrollEle = contentEle.querySelector('#smss-scroll');
            dropdownScrollScrollerEle = contentEle.querySelector(
                '#smss-scroll-scroller'
            );
            dropdownSearchEle = contentEle.querySelector(
                '#smss-dropdown__list__input'
            );

            if (scope.smssDropdown.searchable) {
                dropdownSearchEle = dropdownSearchEle.querySelector(
                    '#smss-search__input'
                );
            }

            //add listener
            dropdownScrollScrollerEle.addEventListener(
                'scroll',
                scrollDropdown
            );

            // render the list
            renderDropdownList();

            $timeout(function () {
                var input = contentEle.querySelector('input');
                if (input) {
                    input.focus();
                }
            });
        }

        /**
         * @name hideDropdown
         * @desc dropdown is hidden
         * @param {ele} contentEle - contentEle
         * @returns {void}
         */
        function hideDropdown() {
            if (dropdownToggleEle) {
                dropdownToggleEle.focus();
            }
        }

        /**
         * @name searchDropdown
         * @desc called when a search is executed
         * @param {string} searchTerm - the user's input
         * @returns {void}
         */
        function searchDropdown(searchTerm) {
            if (scope.smssDropdown.search) {
                if (searchTimeout) {
                    $timeout.cancel(searchTimeout);
                }
                searchTimeout = $timeout(function () {
                    scope.smssDropdown.search({
                        search: scope.smssDropdown.searchTerm,
                    });
                    $timeout.cancel(searchTimeout);
                }, 500);
            } else {
                filtered = Utility.filter(
                    scope.smssDropdown.options,
                    searchTerm,
                    scope.smssDropdown.display
                );
                renderDropdownList();
            }
        }

        /**
         * @name searchDropdownKeydown
         * @param {event} $event - DOM event
         * @desc menu navigation - handles keydown events for search element
         * @returns {void}
         */
        function searchDropdownKeydown($event) {
            var selectedEle;

            if ($event.keyCode === 40) {
                //down
                $event.preventDefault();

                if (dropdownScrollEle) {
                    selectedEle = dropdownScrollEle.querySelectorAll(
                        '.smss-dropdown__list__option'
                    );
                    if (selectedEle[0]) {
                        selectedEle[0].focus();
                    }
                }
            } else if ($event.keyCode === 9) {
                // tab
                scope.smssDropdown.open = false;
            }
        }

        /**
         * @name keyupDropdownList
         * @param {event} $event - angular event
         * @param {*} opt - selected option
         * @desc key up event for select
         * @returns {void}
         */
        function keyupDropdownList($event, opt) {
            if ($event.keyCode === 13) {
                // enter
                changeDropdown(opt);
            }
        }

        /**
         * @name keydownDropdownList
         * @param {event} $event - angular event
         * @desc key down event for navigation
         * @returns {void}
         */
        function keydownDropdownList($event) {
            var nextElement, prevElement;
            //only if there is a focused element
            if ($event.keyCode === 40) {
                //down
                $event.preventDefault();

                nextElement = $event.target.nextElementSibling;
                if (nextElement) {
                    nextElement.focus();
                }
            } else if ($event.keyCode === 38) {
                //up
                $event.preventDefault();

                prevElement = $event.target.previousElementSibling;
                if (prevElement) {
                    prevElement.focus();
                } else if (dropdownSearchEle) {
                    dropdownSearchEle.focus();
                }
            } else if ($event.keyCode === 13) {
                //enter
                $event.preventDefault();
            } else if ($event.keyCode === 9) {
                //tab
                scope.smssDropdown.open = false;
            }
        }

        /**
         * @name changeDropdown
         * @param {*} opt - selected option
         * @desc called when a new option is selected
         * @returns {void}
         */
        function changeDropdown(opt) {
            var value = getValue(opt);

            scope.smssDropdown.model = value;

            $timeout(function () {
                if (scope.smssDropdown.change) {
                    scope.smssDropdown.change({
                        model: scope.smssDropdown.model,
                        delta: {
                            type: 'replace',
                            value: value,
                        },
                        opt: opt,
                    });
                }

                scope.smssDropdown.open = false;
            });
        }

        /**
         * @name scroll
         * @desc called when the dropdown is scrolled
         * @returns {void}
         */
        function scrollDropdown() {
            renderDropdownList();

            if (
                scope.smssDropdown.open &&
                dropdownScrollEle &&
                dropdownScrollScrollerEle
            ) {
                //make sure scroll is reverse
                currentScroll =
                    dropdownScrollScrollerEle.scrollTop +
                    dropdownScrollScrollerEle.offsetHeight;
                if (
                    currentScroll >
                        parseInt(scope.smssDropdown.listStyle.height, 10) *
                            0.75 &&
                    currentScroll > previousScroll
                ) {
                    if (
                        scope.smssDropdown.scroll &&
                        !scope.smssDropdown.loading
                    ) {
                        scope.smssDropdown.scroll();
                    }
                }

                previousScroll = currentScroll;

                scope.$apply();
            }
        }

        /** Helpers */
        /**
         * @name getOption
         * @desc called when the dropdown model changes
         * @param {*} value - value to get the option for
         * @returns {*} opt - option related to the model
         */
        function getOption(value) {
            var optValue, optIdx, optLen;
            if (!scope.smssDropdown.value) {
                return value;
            }
            // loop through the model to backtrack to the selected option;
            // need to look at every option to find the true option
            for (
                optIdx = 0, optLen = scope.smssDropdown.options.length;
                optIdx < optLen;
                optIdx++
            ) {
                optValue = Utility.convert(
                    scope.smssDropdown.options[optIdx],
                    scope.smssDropdown.value
                );

                // compare the traversed value to the model value, if equal we assume that first option is correct (so options need to be 1 to 1)
                if (Utility.isEqual(optValue, value)) {
                    return scope.smssDropdown.options[optIdx];
                }
            }

            return undefined;
        }

        /**
         * @name getValue
         * @desc called to get the actual model value
         * @param {*} opt - model backing this option
         * @returns {*} value
         */
        function getValue(opt) {
            return Utility.convert(opt, scope.smssDropdown.value);
        }

        /**
         * @name setView
         * @desc called to set the view
         * @param {*} opt - model backing this option
         * @returns {string} view
         */
        function setView(opt) {
            var view = Utility.toDisplay(
                Utility.convert(opt, scope.smssDropdown.display)
            );

            if (scope.smssDropdown.filter) {
                view = $filter(scope.smssDropdown.filter)(view);
            }

            return view;
        }

        /**
         * @name isSelected
         * @param {*} opt - selected option
         * @desc called to set the view
         * @returns {void}
         */
        function isSelected(opt) {
            return angular.equals(scope.smssDropdown.model, getValue(opt));
        }

        /**
         * @name initialize
         * @desc Called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            scope.smssDropdown.searchTerm = '';
            scope.smssDropdown.painted = [];
            scope.smssDropdown.styles = [];

            if (attrs.hasOwnProperty('compact')) {
                scope.smssDropdown.compact = true;
            }

            if (attrs.hasOwnProperty('placeholder')) {
                scope.smssDropdown.placeholder = attrs.placeholder;
            }

            if (attrs.hasOwnProperty('display') && attrs.display) {
                scope.smssDropdown.display = attrs.display.split('.');
            }

            if (attrs.hasOwnProperty('value') && attrs.value) {
                scope.smssDropdown.value = attrs.value.split('.');
            }

            if (!Array.isArray(scope.smssDropdown.options)) {
                scope.smssDropdown.options = [];
            }

            if (
                attrs.hasOwnProperty('searchable') &&
                attrs.searchable === 'false'
            ) {
                scope.smssDropdown.searchable = false;
            } else {
                scope.smssDropdown.searchable = true;
            }

            if (transclude.isSlotFilled('action')) {
                scope.smssDropdown.action = true;
            } else {
                scope.smssDropdown.action = false;
            }

            // get the toggle
            dropdownToggleEle = ele[0].querySelector('#smss-dropdown__toggle');

            dropdownToggleEle.addEventListener('keyup', keyupDropdownToggle);

            let computedStyles = getComputedStyle(dropdownToggleEle);
            optionHeight =
                computedStyles.getPropertyValue('font-size').match(/\d+/g) * 2;
            if (optionHeight === 0) {
                optionHeight = DEFAULT_OPTION_HEIGHT;
            }

            if (
                attrs.hasOwnProperty('maxOptions') &&
                typeof Number(attrs.maxOptions) === 'number' &&
                Number(attrs.maxOptions) > 0
            ) {
                let height = Number(attrs.maxOptions) * optionHeight + 4; // 4px to account for smss-scroll padding
                if (scope.smssDropdown.searchable) {
                    height += optionHeight;
                }
                if (scope.smssDropdown.action) {
                    height += optionHeight;
                }
                scope.smssDropdown.height = height + 'px';
            }

            filtered = Utility.freeze(scope.smssDropdown.options);

            //set the view and update after the digest is complete
            $timeout(function () {
                if (!Array.isArray(scope.smssDropdown.options)) {
                    scope.smssDropdown.options = [];
                }
                filtered = Utility.freeze(scope.smssDropdown.options);

                renderDropdownToggle();
                renderDropdownList();

                if (scope.smssDropdown.compact) {
                    scope.smssDropdown.width = 268;
                } else {
                    scope.smssDropdown.width =
                        dropdownToggleEle.getBoundingClientRect().width;

                    scope.$watch(
                        function () {
                            return dropdownToggleEle.getBoundingClientRect()
                                .width;
                        },
                        function (newValue, oldValue) {
                            if (!angular.equals(newValue, oldValue)) {
                                scope.smssDropdown.width = newValue;
                            }
                        }
                    );
                }

                scope.$watch('smssDropdown.model', function (newVal, oldVal) {
                    if (!angular.equals(newVal, oldVal)) {
                        renderDropdownToggle();
                    }
                });

                scope.$watchCollection(
                    'smssDropdown.options',
                    function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            // apply the search only if it's local search within the directive
                            if (!Array.isArray(scope.smssDropdown.options)) {
                                scope.smssDropdown.options = [];
                            }

                            renderDropdownToggle();

                            filtered = Utility.freeze(
                                scope.smssDropdown.options
                            );
                            if (
                                scope.smssDropdown.searchTerm &&
                                !scope.smssDropdown.search
                            ) {
                                searchDropdown();
                            } else {
                                renderDropdownList();
                            }
                        }
                    }
                );

                if (attrs.hasOwnProperty('autofocus')) {
                    let focusEle = ele[0].querySelector(
                        '#smss-dropdown__toggle'
                    );
                    if (focusEle) {
                        focusEle.focus();
                    }
                }
            });

            scope.$watch(
                function () {
                    let style = getComputedStyle(dropdownToggleEle);
                    return style.getPropertyValue('font-size');
                },
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        optionHeight = newValue.match(/\d+/g) * 2;
                        if (optionHeight === 0) {
                            optionHeight = DEFAULT_OPTION_HEIGHT;
                        }
                        renderDropdownList();
                    }
                }
            );
        }

        initialize();
    }
}
