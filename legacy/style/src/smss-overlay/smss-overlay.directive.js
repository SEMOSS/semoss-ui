import './smss-overlay.scss';

export default angular
    .module('smss-style.overlay', [])
    .directive('smssOverlay', smssOverlay);

smssOverlay.$inject = ['$timeout'];

function smssOverlay($timeout) {
    smssOverlayLink.$inject = ['scope', 'ele', 'attrs', 'ctrl', 'transclude'];

    return {
        restrict: 'EA',
        template: require('./smss-overlay.directive.html'),
        scope: {
            open: '=',
            disableClick: '=?',
            exit: '&?',
            show: '&?',
            hide: '&?',
        },
        replace: true,
        transclude: {
            header: '?smssOverlayHeader',
            body: 'smssOverlayBody',
            footer: '?smssOverlayFooter',
        },
        link: smssOverlayLink,
    };

    function smssOverlayLink(scope, ele, attrs, ctrl, transclude) {
        var containerEle, contentEle, bodyEle, bodyContentEle;
        scope.isHeaderPresent = false;
        scope.isFooterPresent = false;
        scope.isOverflow = false;

        /**
         * @name setContent
         * @desc if open or closed add or remove the content
         * @returns {void}
         */
        function setContent() {
            if (scope.open) {
                addContent();
                if (scope.show) {
                    scope.show();
                }
            } else {
                removeContent();
                if (scope.hide) {
                    scope.hide();
                }
            }
        }

        /**
         * @name addContent
         * @desc actually add the content to the view
         * @returns {void}
         */
        function addContent() {
            // clear the display
            contentEle.style.display = '';

            containerEle.appendChild(contentEle);
        }

        /**
         * @name removeContent
         * @desc remove the content element from the view
         * @returns {void}
         */
        function removeContent() {
            if (contentEle) {
                if (contentEle.parentNode !== null) {
                    contentEle.parentNode.removeChild(contentEle);
                }
            }
        }

        /**
         * @name exit
         * @desc exit the overlay
         * @returns {void}
         */
        function exit() {
            scope.open = false;
        }

        /**
         * @name checkOverflow
         * @desc checks if the body content overflows and will need to scroll
         * @returns {void}
         */
        function checkOverflow() {
            if (
                bodyEle &&
                bodyContentEle &&
                bodyContentEle.getBoundingClientRect().height >
                    bodyEle.getBoundingClientRect().height
            ) {
                scope.isOverflow = true;
            } else {
                scope.isOverflow = false;
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            if (attrs.hasOwnProperty('body')) {
                scope.body = !(attrs.body === 'false');
            } else {
                scope.body = true;
            }

            if (attrs.hasOwnProperty('size')) {
                scope.size = `smss-overlay__wrapper--${attrs.size}`;
            } else {
                scope.size = 'smss-overlay__wrapper--md';
            }

            if (transclude.isSlotFilled('header') || !scope.disableClick) {
                scope.isHeaderPresent = true;
            }
            if (transclude.isSlotFilled('footer')) {
                scope.isFooterPresent = true;
            }

            if (!scope.exit) {
                scope.exit = exit;
            }

            // this is the content
            contentEle = ele[0];

            if (scope.body) {
                containerEle = document.body;
            } else {
                containerEle = ele[0].parentNode;
            }

            // hide the element
            contentEle.style.display = 'none';

            // set the content after it has been compiled (so we can require parent directives...)
            $timeout(function () {
                // first go ahead we do not call show/hide, because it is the initial state
                // hence, we do not use setContent
                if (scope.open) {
                    addContent();
                } else {
                    removeContent();
                }
                bodyEle = contentEle.querySelector('#overlay-body');
                bodyContentEle = contentEle.querySelector(
                    '#overlay-body-content'
                );

                scope.$watch('open', function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        setContent();
                    }
                });
                scope.$watch(
                    function () {
                        return bodyContentEle.getBoundingClientRect().height;
                    },
                    function (newValue, oldValue) {
                        if (
                            !angular.equals(newValue, oldValue) &&
                            newValue !== 0
                        ) {
                            checkOverflow();
                        }
                    }
                );

                scope.$on('$destroy', function () {
                    removeContent();
                });
            });
        }

        initialize();
    }
}
