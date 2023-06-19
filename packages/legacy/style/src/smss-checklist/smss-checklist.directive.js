import Utility from '../utility.js';

/**
 * @name smss-checklist.directive.js
 * @desc smss-checklist field
 */
export default angular
    .module('smss-style.checklist', [])
    .directive('smssChecklist', smssChecklist);

import './smss-checklist.scss';

smssChecklist.$inject = ['$timeout', '$filter'];

function smssChecklist($timeout, $filter) {
    smssChecklistLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: require('./smss-checklist.directive.html'),
        scope: {
            multiple: '=?',
            model: '=',
            options: '=',
            change: '&',
            selectAll: '=?',
            scroll: '&?',
            loading: '=',
            filter: '=?',
            search: '&?',
            mouseover: '&?',
            mouseleave: '&?',
            disabled: '=?ngDisabled',
            searchTerm: '=?',
        },
        transclude: {
            label: '?smssChecklistLabel',
        },
        replace: true,
        link: smssChecklistLink,
    };

    function smssChecklistLink(scope, ele, attrs) {
        scope.searchTerm = '';
        scope.painted = [];
        scope.styles = [];

        scope.searchOptions = searchOptions;
        scope.searchKeydown = searchKeydown;
        scope.setView = setView;
        scope.isSelected = isSelected;
        scope.select = select;
        scope.listKeyup = listKeyup;
        scope.listKeydown = listKeydown;
        scope.selectKeyup = selectKeyup;
        scope.selectKeydown = selectKeydown;
        scope.toggleSelect = toggleSelect;

        var checklistEle,
            checklistScrollEle,
            checklistScrollScrollerEle,
            optionHeight = 32,
            filteredOptions,
            currentScroll,
            previousScroll,
            searchTimeout;

        /**
         * @name searchOptions
         * @desc called when a search is executed
         * @param {string} searchTerm the user's input
         * @returns {void}
         */
        function searchOptions(searchTerm) {
            if (scope.search) {
                if (searchTimeout) {
                    $timeout.cancel(searchTimeout);
                }
                searchTimeout = $timeout(function () {
                    scope.search({
                        search: scope.searchTerm,
                    });
                    $timeout.cancel(searchTimeout);
                }, 500);
            } else {
                filteredOptions = Utility.filter(
                    scope.options,
                    searchTerm,
                    scope.display
                );
                renderChecklist();
            }
            isAllSelected();
        }

        /**
         * @name searchKeydown
         * @param {event} $event - angular event
         * @desc key down event for navigation
         * @returns {void}
         */
        function searchKeydown($event) {
            var focusEle;

            if ($event.keyCode === 40) {
                //down
                $event.preventDefault();

                focusEle = checklistEle.querySelector(
                    '#smss-checklist__selectall__option'
                );
                if (focusEle) {
                    focusEle.focus();
                    return;
                }

                focusEle = checklistEle.querySelector(
                    '#smss-checklist__option'
                );
                if (focusEle) {
                    focusEle.focus();
                }
            }
        }

        /**
         * @name renderChecklist
         * @desc called to update the view
         * @returns {void}
         */
        function renderChecklist() {
            var scrollTop = checklistScrollScrollerEle.scrollTop, //find position of scroll
                height = checklistScrollEle.offsetHeight,
                start = Math.floor((scrollTop - height * 2) / optionHeight), //find start
                end = Math.floor((scrollTop + height * 2) / optionHeight), //we will render extra
                i,
                len;

            //set listStyle
            scope.listStyle = {
                height: filteredOptions.length * optionHeight + 'px',
            };

            start = start > 0 ? start : 0;
            end = filteredOptions.length > end ? end : filteredOptions.length;

            //create painted
            scope.painted = filteredOptions.slice(start, end);

            //push values down
            scope.styles = [];
            for (i = 0, len = scope.painted.length; i < len; i++) {
                scope.styles.push({
                    top: (start + i) * optionHeight + 'px',
                });
            }
        }

        /**
         * @name setView
         * @desc called to set the view
         * @param {*} opt - model backing this option
         * @returns {string} view
         */
        function setView(opt) {
            var view = Utility.toDisplay(Utility.convert(opt, scope.display));

            if (scope.filter) {
                view = $filter(scope.filter)(view);
            }

            return view;
        }

        /**
         * @name getValue
         * @desc called to get the actual model value
         * @param {*} opt - model backing this option
         * @returns {*} value
         */
        function getValue(opt) {
            return Utility.convert(opt, scope.value);
        }

        /**
         * @name scroll
         * @desc called when the directive is scrolled
         * @returns {void}
         */
        function scroll() {
            renderChecklist();

            //make sure scroll is reverse
            currentScroll =
                checklistScrollScrollerEle.scrollTop +
                checklistScrollScrollerEle.offsetHeight;
            if (
                currentScroll > parseInt(scope.listStyle.height, 10) * 0.75 &&
                currentScroll > previousScroll
            ) {
                if (scope.scroll && !scope.loading) {
                    scope.scroll();
                }
            }
            previousScroll = currentScroll;

            scope.$apply();
        }

        /**
         * @name isSelected
         * @param {*} opt - selected option
         * @desc called to set the view
         * @returns {void}
         */
        function isSelected(opt) {
            var i,
                len,
                value = getValue(opt);

            //This is necessary for model changes in the filter directive
            if (scope.model === undefined) {
                scope.model = [];
            }

            for (i = 0, len = scope.model.length; i < len; i++) {
                if (angular.equals(scope.model[i], value)) {
                    return true;
                }
            }

            return false;
        }

        /**
         * @name select
         * @param {*} opt - selected option
         * @desc called when a new option is selected
         * @returns {void}
         */
        function select(opt) {
            var value = getValue(opt),
                idx = -1,
                delta = {
                    type: null,
                    value: null,
                },
                i,
                len;

            if (!scope.multiple) {
                delta = {
                    type: 'replace',
                    value: value,
                };
                scope.model = [value];
            } else {
                for (i = 0, len = scope.model.length; i < len; i++) {
                    if (angular.equals(scope.model[i], value)) {
                        idx = i;
                        break;
                    }
                }

                if (idx === -1) {
                    delta = {
                        type: 'add',
                        value: value,
                    };
                    scope.model.push(value);
                } else {
                    delta = {
                        type: 'remove',
                        value: value,
                    };
                    scope.model.splice(idx, 1);
                }
            }

            $timeout(function () {
                if (scope.change) {
                    //TODO CAPTURE DELTA?
                    scope.change({
                        model: scope.model,
                        delta: delta,
                        opt: opt,
                    });
                }

                isAllSelected();
            });
        }

        /**
         * @name listKeyup
         * @param {event} $event - angular event
         * @param {*} opt - selected option
         * @desc key up event for select
         * @returns {void}
         */
        function listKeyup($event, opt) {
            if ($event.keyCode === 13) {
                // enter
                select(opt);
            } else if ($event.keyCode === 32) {
                // space
                select(opt);
            }
        }

        /**
         * @name listKeydown
         * @param {event} $event - angular event
         * @desc key down event for navigation
         * @returns {void}
         */
        function listKeydown($event) {
            var focusEle;
            //only if there is a focused element

            if ($event.keyCode === 40) {
                //down
                $event.preventDefault();
                focusEle = $event.target.nextElementSibling;
                if (focusEle) {
                    focusEle.focus();
                }
            } else if ($event.keyCode === 38) {
                //up
                $event.preventDefault();
                focusEle = $event.target.previousElementSibling;
                if (focusEle) {
                    focusEle.focus();
                    return;
                }

                focusEle = checklistEle.querySelector(
                    '#smss-checklist__selectall__option'
                );
                if (focusEle) {
                    focusEle.focus();
                    return;
                }

                focusEle = checklistEle
                    .querySelector('#smss-checklist__input')
                    .querySelector('#smss-search__input');
                if (focusEle) {
                    focusEle.focus();
                    return;
                }
            } else if ($event.keyCode === 32) {
                // space
                $event.preventDefault();
            } else if ($event.keyCode === 13) {
                // enter
                $event.preventDefault();
            }
        }

        /**
         * @name selectKeydown
         * @param {event} $event - angular event
         * @desc key down for the select element
         * @returns {void}
         */
        function selectKeydown($event) {
            var focusEle;
            if ($event.keyCode === 32) {
                // space
                $event.preventDefault();
            } else if ($event.keyCode === 40) {
                //down
                $event.preventDefault();
                focusEle = checklistEle.querySelector(
                    '#smss-checklist__option'
                );
                if (focusEle) {
                    focusEle.focus();
                }
            } else if ($event.keyCode === 38) {
                //up
                $event.preventDefault();
                focusEle = checklistEle
                    .querySelector('#smss-checklist__input')
                    .querySelector('#smss-search__input');
                if (focusEle) {
                    focusEle.focus();
                }
            }
        }

        /**
         * @name selectKeyup
         * @param {event} $event - angular event
         * @desc key up for the select element
         * @returns {void}
         */
        function selectKeyup($event) {
            if ($event.keyCode === 13) {
                // enter
                toggleSelect();
            } else if ($event.keyCode === 32) {
                // space
                toggleSelect();
            }
        }
        /**
         * @name toggleSelect
         * @desc view selectAll
         * @returns {void}
         */
        function toggleSelect() {
            var delta = {
                type: null,
                value: null,
            };

            scope.viewAll = !scope.viewAll;

            if (scope.viewAll) {
                let include = {};

                // Get list of values that were unselected
                for (
                    let modelIdx = 0, modelLen = scope.model.length;
                    modelIdx < modelLen;
                    modelIdx++
                ) {
                    include[scope.model[modelIdx]] = true;
                }

                for (
                    let filteredIdx = 0, filteredLen = filteredOptions.length;
                    filteredIdx < filteredLen;
                    filteredIdx++
                ) {
                    let value = getValue(filteredOptions[filteredIdx]);
                    if (!include.hasOwnProperty(value)) {
                        scope.model.push(value);
                    }
                }

                delta = {
                    type: 'all',
                    value: scope.model,
                };
            } else {
                let exclude = {},
                    newModel = [];

                // Get list of values that were unselected
                for (
                    let filteredIdx = 0, filteredLen = filteredOptions.length;
                    filteredIdx < filteredLen;
                    filteredIdx++
                ) {
                    exclude[getValue(filteredOptions[filteredIdx])] = true;
                }

                // Create new list of selected values
                for (
                    let modelIdx = 0, modelLen = scope.model.length;
                    modelIdx < modelLen;
                    modelIdx++
                ) {
                    if (!exclude.hasOwnProperty(scope.model[modelIdx])) {
                        newModel.push(scope.model[modelIdx]);
                    }
                }

                scope.model = newModel;

                delta = {
                    type: 'none',
                    value: scope.model,
                };
            }

            $timeout(function () {
                if (scope.change) {
                    //TODO CAPTURE DELTA?
                    scope.change({
                        model: scope.model,
                        delta: delta,
                    });
                }
            });
        }

        /**
         * @name isAllSelected
         * @desc verifies if everything is selected
         * @returns {void}
         */
        function isAllSelected() {
            if (scope.quickselect) {
                if (typeof scope.selectAll !== 'undefined') {
                    scope.viewAll = scope.selectAll;
                } else {
                    var viewAll = true,
                        foundMatch = false,
                        optionIdx,
                        modelIdx;
                    //verify viewAll by looking at all of the options and see if model contains all of them
                    for (
                        optionIdx = 0;
                        optionIdx < filteredOptions.length;
                        optionIdx++
                    ) {
                        foundMatch = false;
                        for (
                            modelIdx = 0;
                            modelIdx < scope.model.length;
                            modelIdx++
                        ) {
                            //stringifying in cases where the options and model are objects
                            //using getValue in cases where model and the option are different, so we always compare the same value
                            if (
                                JSON.stringify(scope.model[modelIdx]) ===
                                JSON.stringify(
                                    getValue(filteredOptions[optionIdx])
                                )
                            ) {
                                foundMatch = true;
                                break;
                            }
                        }

                        if (!foundMatch) {
                            viewAll = false;
                            break;
                        }
                    }

                    scope.viewAll = viewAll;
                }
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            var initializeTimeout;

            scope.painted = [];
            scope.styles = [];

            if (attrs.hasOwnProperty('display') && attrs.display) {
                scope.display = attrs.display.split('.');
            }

            if (attrs.hasOwnProperty('value') && attrs.value) {
                scope.value = attrs.value.split('.');
            }

            if (attrs.hasOwnProperty('multiple')) {
                scope.multiple = true;
            }

            if (attrs.hasOwnProperty('searchable')) {
                scope.searchable = true;
            }

            if (attrs.hasOwnProperty('quickselect') && scope.multiple) {
                scope.quickselect = true;
            }

            if (!Array.isArray(scope.model)) {
                // convert the model into an array if it's a valid value
                if (
                    typeof scope.model === 'undefined' ||
                    (typeof scope.model === 'string' &&
                        scope.model.length === 0)
                ) {
                    scope.model = [];
                } else {
                    scope.model = [scope.model];
                }
            }

            //get the eles
            checklistEle = ele[0];
            checklistScrollEle = ele[0].querySelector('#smss-scroll');
            checklistScrollScrollerEle = ele[0].querySelector(
                '#smss-scroll-scroller'
            );

            // get height
            let computedStyles = getComputedStyle(checklistEle);
            if (computedStyles.getPropertyValue('font-size')) {
                optionHeight =
                    computedStyles.getPropertyValue('font-size').match(/\d+/g) *
                    2;
            }

            //add listener
            checklistScrollScrollerEle.addEventListener('scroll', scroll);

            if (!Array.isArray(scope.options)) {
                scope.options = [];
            }

            filteredOptions = Utility.freeze(scope.options);

            //set the view and update after the digest is complete
            initializeTimeout = $timeout(function () {
                if (!Array.isArray(scope.options)) {
                    scope.options = [];
                }

                filteredOptions = Utility.freeze(scope.options);
                isAllSelected();
                renderChecklist();

                scope.$watchCollection(
                    'options',
                    function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            //set listStyle

                            //This is necessary for model changes in the filter directive
                            if (!Array.isArray(scope.options)) {
                                scope.options = [];
                            }

                            filteredOptions = Utility.freeze(scope.options);
                            isAllSelected();
                            if (scope.searchTerm && !scope.search) {
                                // apply the search only if it's local search within the directive
                                searchOptions();
                            } else {
                                renderChecklist();
                            }
                        }
                    }
                );

                scope.$watchCollection('model', function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        renderChecklist();
                    }
                });

                //listener for size changes
                scope.$watch(
                    function () {
                        return checklistScrollScrollerEle.offsetHeight;
                    },
                    function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            renderChecklist();
                        }
                    }
                );

                if (typeof scope.selectAll !== 'undefined') {
                    scope.$watch('selectAll', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            isAllSelected();
                        }
                    });
                }

                scope.$on('$destroy', function () {
                    checklistScrollScrollerEle.removeEventListener(
                        'scroll',
                        scroll
                    );
                });

                if (attrs.hasOwnProperty('autofocus')) {
                    let focusEle;
                    if (!focusEle && scope.searchable) {
                        focusEle = ele[0]
                            .querySelector('#smss-checklist__input')
                            .querySelector('#smss-search__input');
                    }

                    if (!focusEle && scope.quickselect) {
                        focusEle = ele[0].querySelector(
                            '#smss-checklist__selectall__option'
                        );
                    }

                    if (!focusEle) {
                        focusEle = ele[0].querySelector(
                            '#smss-checklist__option'
                        );
                    }

                    if (focusEle) {
                        focusEle.focus();
                    }
                }

                $timeout.cancel(initializeTimeout);
            });
            scope.$watch(
                function () {
                    let style = getComputedStyle(checklistEle);
                    return style.getPropertyValue('font-size');
                },
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        optionHeight = newValue.match(/\d+/g) * 2;
                        renderChecklist();
                    }
                }
            );
        }

        initialize();
    }
}
