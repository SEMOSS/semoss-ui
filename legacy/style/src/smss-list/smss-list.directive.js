import Utility from '../utility.js';

/**
 * @name smss-list.directive.js
 * @desc smss-list field
 */
export default angular
    .module('smss-style.list', [])
    .directive('smssList', smssList);

import './smss-list.scss';

smssList.$inject = ['$timeout', '$filter'];

function smssList($timeout, $filter) {
    smssListLink.$inject = ['scope', 'ele', 'attrs', 'ctrl', 'transclude'];

    return {
        restrict: 'E',
        template: require('./smss-list.directive.html'),
        scope: {
            header: '=?',
            filter: '=?',
            options: '=',
            scroll: '&?',
            loading: '=',
            mouseover: '&?',
            mouseleave: '&?',
            keydown: '&?',
            keyup: '&?',
            click: '&?',
        },
        transclude: {
            header: '?smssListHeader',
            label: '?smssListLabel',
        },
        replace: true,
        link: smssListLink,
    };

    function smssListLink(scope, ele, attrs, ctrl, transclude) {
        scope.painted = [];
        scope.styles = [];

        scope.setView = setView;

        var listEle,
            listScrollEle,
            listScrollScrollerEle,
            filteredOptions,
            currentScroll,
            previousScroll;

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
         * @name renderList
         * @desc called to update the view
         * @returns {void}
         */
        function renderList() {
            var scrollTop = listScrollScrollerEle.scrollTop, //find position of scroll
                optionHeight = scope.optionHeight,
                offsetTop = parseInt(scope.offsetTop, 10),
                height = listScrollEle.offsetHeight,
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
                    top: (start + i) * optionHeight + offsetTop + 'px',
                });
            }
        }

        /**
         * @name scroll
         * @desc called when the directive is scrolled
         * @returns {void}
         */
        function scroll() {
            renderList();

            //make sure scroll is reverse
            currentScroll =
                listScrollScrollerEle.scrollTop +
                listScrollScrollerEle.offsetHeight;
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
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            if (!Array.isArray(scope.options)) {
                scope.options = [];
            }

            scope.painted = [];
            scope.styles = [];

            scope.headerPresent =
                typeof scope.header !== 'undefined' ||
                transclude.isSlotFilled('header');

            if (attrs.hasOwnProperty('display')) {
                scope.display = attrs.display.split('.');
            }

            if (attrs.hasOwnProperty('optionHeight')) {
                scope.optionHeight = attrs.optionHeight;
            }

            if (attrs.hasOwnProperty('offsetTop')) {
                scope.offsetTop = attrs.offsetTop;
            } else {
                scope.offsetTop = 0;
            }

            //get the eles
            listEle = ele[0];
            listScrollEle = ele[0].querySelector('#smss-scroll');
            listScrollScrollerEle = ele[0].querySelector(
                '#smss-scroll-scroller'
            );

            if (!attrs.hasOwnProperty('optionHeight')) {
                let computedStyles = getComputedStyle(listEle);
                scope.optionHeight =
                    computedStyles.getPropertyValue('font-size').match(/\d+/g) *
                    2;
            }

            //add listener
            listScrollScrollerEle.addEventListener('scroll', scroll);

            //set the view and update after the digest is complete
            var initializeTimeout = $timeout(function () {
                filteredOptions = Utility.freeze(scope.options);
                renderList();

                scope.$watch(
                    function () {
                        return JSON.stringify(scope.options);
                    },
                    function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            //set listStyle

                            //This is necessary for model changes in the filter directive
                            if (!Array.isArray(scope.options)) {
                                scope.options = [];
                            }

                            filteredOptions = Utility.freeze(scope.options);
                            renderList();
                        }
                    }
                );

                //listener for size changes
                scope.$watch(
                    function () {
                        return listScrollScrollerEle.offsetHeight;
                    },
                    function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            renderList();
                        }
                    }
                );

                if (!attrs.hasOwnProperty('optionHeight')) {
                    scope.$watch(
                        function () {
                            let computedStyles = getComputedStyle(listEle);
                            return computedStyles.getPropertyValue('font-size');
                        },
                        function (newValue, oldValue) {
                            if (!angular.equals(newValue, oldValue)) {
                                scope.optionHeight = newValue.match(/\d+/g) * 2;
                                renderList();
                            }
                        }
                    );
                }

                $timeout.cancel(initializeTimeout);
            });
        }

        initialize();

        scope.$on('$destroy', function () {
            listScrollScrollerEle.removeEventListener('scroll', scroll);
        });
    }
}
