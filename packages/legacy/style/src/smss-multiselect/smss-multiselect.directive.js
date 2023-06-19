import Utility from '../utility.js';

import './smss-multiselect.scss';

export default angular
    .module('smss-style.multiselect', [])
    .directive('smssMultiselect', smssMultiselectDirective);

smssMultiselectDirective.$inject = ['$timeout', '$filter'];

function smssMultiselectDirective($timeout, $filter) {
    smssMultiselectCtrl.$inject = [];
    smssMultiselectLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: require('./smss-multiselect.directive.html'),
        scope: {},
        bindToController: {
            model: '=',
            options: '=',
            disabled: '=?ngDisabled',
            display: '@?',
            value: '@?',
            change: '&?',
            scroll: '&?',
            loading: '=',
            filter: '=?',
            search: '&?',
            mouseover: '&?',
            mouseleave: '&?',
            show: '&?',
            hide: '&?',
        },
        replace: true,
        controllerAs: 'smssMultiselect',
        controller: smssMultiselectCtrl,
        compile: smssMultiselectCompile,
    };

    function smssMultiselectCompile(tElement, tAttributes) {
        var popoverEle = tElement[0].querySelector('smss-popover-content');
        // att the special attributes
        if (tAttributes.hasOwnProperty('body')) {
            popoverEle.setAttribute('body', !(tAttributes.body === 'false'));
        }

        return smssMultiselectLink;
    }

    function smssMultiselectCtrl() {}

    function smssMultiselectLink(scope, ele, attrs) {
        var multiselectTriggerEle,
            multiselectScrollEle,
            multiselectScrollScrollerEle,
            multiselectChecklistEle,
            multiselectSearchEle,
            currentScroll,
            previousScroll,
            searchTimeout;
        scope.smssMultiselect.filtered = [];
        scope.smssMultiselect.allSelected = false;
        scope.smssMultiselect.addedNew = false;
        scope.smssMultiselect.tags = {
            options: [
                'blue',
                'orange',
                'teal',
                'purple',
                'yellow',
                'pink',
                'violet',
                'olive',
            ],
            mapping: {},
        };
        scope.smssMultiselect.colored = false;
        scope.smssMultiselect.showMultiselect = showMultiselect;
        scope.smssMultiselect.hideMultiselect = hideMultiselect;
        scope.smssMultiselect.searchMultiselect = searchMultiselect;
        scope.smssMultiselect.searchMultiselectKeydown =
            searchMultiselectKeydown;
        scope.smssMultiselect.changeMultiselect = changeMultiselect;
        scope.smssMultiselect.setView = setView;
        scope.smssMultiselect.isSelected = isSelected;
        scope.smssMultiselect.getValue = getValue;
        scope.smssMultiselect.toggleMultiselectList = toggleMultiselectList;

        /**
         * @name toggleMultiselectList
         * @desc show/hide the list
         * @returns {void}
         */
        function toggleMultiselectList() {
            scope.smssMultiselect.open = !scope.smssMultiselect.open;
        }

        /**
         * @name showMultiselect
         * @desc multiselect is opened
         * @param {ele} contentEle - contentEle
         * @returns {void}
         */
        function showMultiselect(contentEle) {
            if (scope.smssMultiselect.filtered.length > 0) {
                if (contentEle) {
                    multiselectScrollEle =
                        contentEle.querySelector('#smss-scroll');
                    multiselectScrollScrollerEle = contentEle.querySelector(
                        '#smss-scroll-scroller'
                    );
                    multiselectScrollScrollerEle.addEventListener(
                        'scroll',
                        scrollMultiselect
                    );
                    multiselectChecklistEle =
                        multiselectScrollEle.querySelector(
                            '.smss-checklist__list__options__holder'
                        );
                }
                $timeout(function () {
                    if (multiselectSearchEle) {
                        multiselectSearchEle.focus();
                    }
                });
                if (scope.smssMultiselect.show) {
                    scope.smssMultiselect.show({
                        contentEle: contentEle,
                    });
                }
            } else {
                scope.smssMultiselect.open = false;
            }
        }

        /**
         * @name hideMultiselect
         * @desc multiselect popover is closed
         * @param {ele} contentEle - contentEle
         * @returns {void}
         */
        function hideMultiselect(contentEle) {
            if (contentEle && multiselectScrollScrollerEle) {
                multiselectScrollScrollerEle.removeEventListener(
                    'scroll',
                    scrollMultiselect
                );
                if (scope.smssMultiselect.hide) {
                    scope.smssMultiselect.hide({
                        contentEle: contentEle,
                    });
                }
            }
        }

        /**
         * @name searchMultiselect
         * @desc called when a search is executed
         * @returns {void}
         */
        function searchMultiselect() {
            if (scope.smssMultiselect.search) {
                if (searchTimeout) {
                    $timeout.cancel(searchTimeout);
                }
                searchTimeout = $timeout(function () {
                    scope.smssMultiselect.search({
                        search: scope.smssMultiselect.searchTerm,
                    });
                    $timeout.cancel(searchTimeout);
                }, 500);
            } else {
                scope.smssMultiselect.filtered = Utility.filter(
                    scope.smssMultiselect.options,
                    scope.smssMultiselect.searchTerm,
                    scope.smssMultiselect.display
                );
                if (scope.smssMultiselect.filtered.length === 0) {
                    scope.smssMultiselect.open = false;
                }
            }
        }

        /**
         * @name searchMultiselectKeydown
         * @param {event} $event - DOM event
         * @desc menu navigation - handles keydown events for search element
         * @returns {void}
         */
        function searchMultiselectKeydown($event) {
            var selectedEle;
            if (!scope.smssMultiselect.open && $event.keyCode !== 13) {
                scope.smssMultiselect.open = true;
            }
            if ($event.keyCode === 40) {
                //down
                $event.preventDefault();

                if (multiselectScrollEle) {
                    selectedEle = multiselectScrollEle.querySelectorAll(
                        '.smss-checklist__option'
                    );
                    if (selectedEle[0]) {
                        selectedEle[0].focus();
                    }
                }
            } else if ($event.keyCode === 9) {
                // tab
                scope.smssMultiselect.open = false;
            } else if (
                $event.keyCode === 13 &&
                $event.target.value.length > 0 &&
                scope.smssMultiselect.model.indexOf($event.target.value) === -1
            ) {
                // enter
                changeMultiselect($event.target.value);
                scope.smssMultiselect.addedNew = true;
            }
        }

        /**
         * @name changeMultiselect
         * @param {*} opt - selected option
         * @param {boolean} isManual - if true, will need to create the delta obj
         * @desc called when a new option is selected
         * @returns {void}
         */
        function changeMultiselect(opt, isManual = true) {
            var delta,
                option = isManual ? opt : opt.opt,
                value = getValue(option);
            scope.smssMultiselect.searchTerm = '';
            if (isManual) {
                if (isSelected(value)) {
                    delta = {
                        type: 'remove',
                        value: value,
                    };
                    scope.smssMultiselect.model =
                        scope.smssMultiselect.model.filter((x) => x !== value);
                } else {
                    delta = {
                        type: 'add',
                        value: value,
                    };
                    scope.smssMultiselect.model.push(value);
                }
            } else {
                delta = opt.delta;
            }

            // if (scope.smssMultiselect.open) {
            //     scope.smssMultiselect.open = false;
            // }

            if (delta.type === 'add' && scope.smssMultiselect.colored) {
                setTagColor(value);
            }

            $timeout(function () {
                if (scope.smssMultiselect.change) {
                    scope.smssMultiselect.change({
                        model: scope.smssMultiselect.model,
                        delta: delta,
                        value: value,
                        searchTerm: scope.smssMultiselect.searchTerm,
                    });
                }
            });
        }

        /**
         * @name clearMultiselect
         * @param {*} opt - selected option
         * @desc called when a new option is selected
         * @returns {void}
         */
        function clearMultiselect() {
            scope.smssMultiselect.model = [];

            $timeout(function () {
                if (scope.smssMultiselect.change) {
                    scope.smssMultiselect.change({
                        model: scope.smssMultiselect.model,
                        delta: {
                            type: 'replace',
                            value: [],
                        },
                        value: [],
                        searchTerm: scope.smssMultiselect.searchTerm,
                    });
                }
                scope.smssMultiselect.open = false;
            });

            scope.smssMultiselect.searchTerm = '';
        }

        /**
         * @name getValue
         * @desc called to get the actual model value
         * @param {*} opt - model backing this option
         * @returns {*} value
         */
        function getValue(opt) {
            var value = opt;
            if (
                scope.smssMultiselect.value &&
                opt &&
                opt.hasOwnProperty(scope.smssMultiselect.value)
            ) {
                value = Utility.convert(opt, scope.smssMultiselect.value);
            }
            return value;
        }
        /**
         * @name scroll
         * @desc called when the multiselect is scrolled
         * @returns {void}
         */
        function scrollMultiselect() {
            if (
                scope.smssMultiselect.open &&
                multiselectScrollEle &&
                multiselectScrollScrollerEle &&
                multiselectChecklistEle
            ) {
                //make sure scroll is reverse
                currentScroll =
                    multiselectScrollScrollerEle.scrollTop +
                    multiselectScrollScrollerEle.offsetHeight;
                if (
                    currentScroll >
                        multiselectChecklistEle.offsetHeight * 0.75 &&
                    currentScroll > previousScroll
                ) {
                    if (
                        scope.smssMultiselect.scroll &&
                        !scope.smssMultiselect.loading
                    ) {
                        scope.smssMultiselect.scroll();
                    }
                }

                previousScroll = currentScroll;

                scope.$apply();
            }
        }

        function getFullObject(value) {
            // need to handle null/undefined values in the array.
            var obj = scope.smssMultiselect.options.filter((x) =>
                x ? x[scope.smssMultiselect.value] === value : false
            )[0];
            if (obj) {
                return obj;
            }
            return value;
        }

        /**
         * @name setView
         * @desc called to set the view
         * @param {*} opt - model backing this option
         * @returns {string} view
         */
        function setView(opt) {
            var value = opt,
                view,
                obj = getFullObject(opt);
            if (scope.smssMultiselect.display) {
                if (obj.hasOwnProperty(scope.smssMultiselect.display)) {
                    value = Utility.convert(obj, scope.smssMultiselect.display);
                } else {
                    value = obj;
                }
            }
            view = Utility.toDisplay(value);

            if (scope.smssMultiselect.filter) {
                view = $filter(scope.smssMultiselect.filter)(view);
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
            return scope.smssMultiselect.model.indexOf(opt) > -1;
        }

        /**
         * @name keyupMultiselectTrigger
         * @param {event} $event - DOM event
         * @desc key up event for the trigger
         * @returns {void}
         */
        function keyupMultiselectTrigger($event) {
            if ($event.keyCode === 27) {
                // esc
                clearMultiselect();
            } else if (
                $event.keyCode === 13 &&
                scope.smssMultiselect.addedNew
            ) {
                // enter
                // Don't close the list if a user is adding a new tag
                $event.stopPropagation();
                scope.smssMultiselect.addedNew = false;
            }
        }

        function setTagColor(tag) {
            if (!scope.smssMultiselect.tags.mapping.hasOwnProperty(tag)) {
                const charCode = tag
                        .split('')
                        .map((x) => x.charCodeAt(0))
                        .reduce((a, b) => a + b),
                    color = scope.smssMultiselect.tags.options[charCode % 8];
                scope.smssMultiselect.tags.mapping[tag] = color;
            }
        }

        /**
         * @name initialize
         * @desc Called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            scope.smssMultiselect.searchTerm = '';
            scope.smssMultiselect.painted = [];
            scope.smssMultiselect.styles = [];

            if (attrs.hasOwnProperty('display') && attrs.display) {
                scope.smssMultiselect.display = attrs.display.split('.');
            }

            if (attrs.hasOwnProperty('value') && attrs.value) {
                scope.smssMultiselect.value = attrs.value.split('.');
            }

            if (attrs.hasOwnProperty('nowrap')) {
                scope.smssMultiselect.nowrap = true;
            }

            if (attrs.hasOwnProperty('placeholder')) {
                scope.smssMultiselect.placeholder = attrs.placeholder;
            }

            if (attrs.hasOwnProperty('quickselect')) {
                scope.smssMultiselect.quickselect = true;
            }

            if (attrs.hasOwnProperty('colored')) {
                scope.smssMultiselect.colored = true;
            }

            if (!Array.isArray(scope.smssMultiselect.options)) {
                scope.smssMultiselect.options = [];
            }

            if (!Array.isArray(scope.smssMultiselect.model)) {
                scope.smssMultiselect.model = [];
            }

            if (
                scope.smssMultiselect.colored &&
                scope.smssMultiselect.model.length > 0
            ) {
                for (let i = 0; i < scope.smssMultiselect.model.length; i++) {
                    setTagColor(scope.smssMultiselect.model[i]);
                }
            }

            // get eles
            multiselectTriggerEle = ele[0].querySelector(
                '#smss-multiselect__trigger'
            );
            multiselectSearchEle = ele[0].querySelector(
                '#smss-multiselect__input'
            );

            multiselectTriggerEle.addEventListener(
                'keyup',
                keyupMultiselectTrigger
            );

            scope.smssMultiselect.filtered = Utility.freeze(
                scope.smssMultiselect.options
            );

            //set the view and update after the digest is complete
            $timeout(function () {
                if (!Array.isArray(scope.smssMultiselect.options)) {
                    scope.smssMultiselect.options = [];
                }
                scope.smssMultiselect.filtered = Utility.freeze(
                    scope.smssMultiselect.options
                );

                scope.$watch(
                    'smssMultiselect.searchTerm',
                    function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            if (newValue.length === 0) {
                                scope.smssMultiselect.filtered =
                                    scope.smssMultiselect.options;
                            }
                        }
                    }
                );

                scope.$watchCollection(
                    'smssMultiselect.options',
                    function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            // apply the search only if it's local search within the directive
                            if (!Array.isArray(scope.smssMultiselect.options)) {
                                scope.smssMultiselect.options = [];
                            }

                            scope.smssMultiselect.filtered = Utility.freeze(
                                scope.smssMultiselect.options
                            );
                            if (scope.smssMultiselect.searchTerm.length > 0) {
                                searchMultiselect();
                            }
                        }
                    }
                );

                scope.$on('$destroy', function () {
                    multiselectTriggerEle.removeEventListener(
                        'keyup',
                        keyupMultiselectTrigger
                    );
                });
            });
        }

        initialize();
    }
}
