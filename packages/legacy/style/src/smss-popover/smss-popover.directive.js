/**
 * @name smss-popover.directive.js
 * @desc smss-popover field
 */
export default angular
    .module('smss-style.popover', [])
    .directive('smssPopover', smssPopoverDirective)
    .directive('smssPopoverContent', smssPopoverContentDirective);

import './smss-popover.scss';

smssPopoverDirective.$inject = [];
smssPopoverContentDirective.$inject = ['$timeout'];

function smssPopoverDirective() {
    smssPopoverCtrl.$inject = ['$element'];

    return {
        restrict: 'EA',
        bindToController: {},
        controllerAs: 'smssPopover',
        controller: smssPopoverCtrl,
    };

    function smssPopoverCtrl($element) {
        var smssPopover = this;

        smssPopover.getParent = getParent;

        /**
         * @name getParent
         * @desc get the target element
         * @returns {void}
         */
        function getParent() {
            return $element[0];
        }
    }
}

function smssPopoverContentDirective($timeout) {
    smssPopoverContentCtrl.$inject = [];
    smssPopoverContentLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template:
            '' +
            `<div class="smss-popover-content">
                <ng-transclude></ng-transclude>
            </div>`,
        transclude: true,
        replace: true,
        scope: {},
        require: ['^smssPopover'],
        bindToController: {
            target: '@',
            container: '@?',
            show: '&?',
            hide: '&?',
            model: '=?',
        },
        controllerAs: 'smssPopoverContent',
        controller: smssPopoverContentCtrl,
        link: smssPopoverContentLink,
    };

    function smssPopoverContentCtrl() {}

    function smssPopoverContentLink(scope, ele, attrs, ctrl) {
        var smssPopoverCtrl,
            containerEle,
            targetEle,
            contentEle,
            popoverTimeout;

        smssPopoverCtrl = ctrl[0];

        /**
         * @name onTargetKeyDown
         * @param {object} event the event object
         * @desc function called when a keydown event is triggered the smss-popover target element.
         * @returns {void}
         */
        function onTargetKeyDown(event) {
            if (event.keyCode === 13) {
                // enter
                event.preventDefault();
            }
        }

        /**
         * @name onTargetClick
         * @desc function called when a click event is triggered the smss-popover target element.
         * @returns {void}
         */
        function onTargetClick() {
            // toggle, trigger a digest
            togglePopover();
            $timeout();
        }

        /**
         * @name onTargetKeyUp
         * @param {object} event the event object
         * @desc function called when a keyup event is triggered the smss-popover target element.
         * @returns {void}
         */
        function onTargetKeyUp(event) {
            event.preventDefault();
            if (event.keyCode === 13) {
                // enter
                // toggle, trigger a digest
                togglePopover();
                $timeout();
            }
        }

        /**
         * @name onDocumentClick
         * @desc hide the content if the document is clicked (not on the target or content)
         * @param {event} event - dom event
         * @returns {void}
         */
        function onDocumentClick(event) {
            // ignore if it is on the target (bubbling)
            if (
                event &&
                event.target &&
                (targetEle.contains(event.target) ||
                    contentEle.contains(event.target))
            ) {
                return;
            }
            // If click is not disabled, close the popover
            if (!scope.smssPopoverContent.disableDocumentClick) {
                // set it to false, trigger a digest
                scope.smssPopoverContent.model = false;
                $timeout();
            }
        }

        /**
         * @name togglePopover
         * @desc function called to show the smss-popover element.
         * @returns {void}
         */
        function togglePopover() {
            //toggle open or close
            scope.smssPopoverContent.model = !scope.smssPopoverContent.model;
        }

        /**
         * @name setPopover
         * @desc function called to show or hide the smss-popover element.
         * @returns {void}
         */
        function setPopover() {
            if (scope.smssPopoverContent.model) {
                showPopover();
            } else {
                hidePopover();
            }
        }

        /**
         * @name showPopover
         * @desc function called to show the smss-popover element.
         * @returns {void}
         */
        function showPopover() {
            //TODO: iframe hack
            angular
                .element(document.querySelector('.iframe'))
                .css('pointer-events', 'none');

            addContent();

            document.addEventListener('mousedown', onDocumentClick, true);
            document.addEventListener('touchstart', onDocumentClick, true);
            window.addEventListener('resize', positionContent);
            document.addEventListener('scroll', positionContent, true);

            if (scope.smssPopoverContent.show) {
                scope.smssPopoverContent.show({
                    contentEle: contentEle,
                });
            }
        }

        /**
         * @name hidePopover
         * @param {event} event - DOM event
         * @desc function called when the mouse leaves the smss-popover element.
         * @returns {void}
         */
        function hidePopover() {
            //TODO: iframe hack
            angular
                .element(document.querySelector('.iframe'))
                .css('pointer-events', 'auto');

            removeContent();

            document.removeEventListener('mousedown', onDocumentClick, true);
            document.removeEventListener('touchstart', onDocumentClick, true);
            window.removeEventListener('resize', positionContent);
            document.removeEventListener('scroll', positionContent, true);

            if (scope.smssPopoverContent.hide) {
                scope.smssPopoverContent.hide({
                    contentEle: contentEle,
                });
            }
        }

        /**
         * @name addContent
         * @desc actually add the content to the view
         * @returns {void}
         */
        function addContent() {
            // set the width if defined
            if (typeof scope.smssPopoverContent.width !== 'undefined') {
                if (scope.smssPopoverContent.width === 'auto') {
                    contentEle.style.width =
                        targetEle.getBoundingClientRect().width + 'px';
                } else {
                    contentEle.style.width = scope.smssPopoverContent.width;
                }
            }

            // we want to hide it, but add it to the dom to get its height and width
            contentEle.style.visibility = 'hidden';
            contentEle.style.opacity = '0';

            contentEle.addEventListener('keyup', onContentKeyup);

            containerEle.appendChild(contentEle);

            if (popoverTimeout) {
                $timeout.cancel(popoverTimeout);
            }

            popoverTimeout = $timeout(function () {
                positionContent();

                contentEle.style.visibility = 'visible';
                contentEle.style.opacity = '1';
            });
        }

        /**
         * @name removeContent
         * @desc function called to remove the content element
         * @returns {void}
         */
        function removeContent() {
            contentEle.style.visibility = 'hidden';
            contentEle.style.opacity = '0';

            contentEle.removeEventListener('keyup', onContentKeyup);

            if (contentEle) {
                if (contentEle.parentNode !== null) {
                    contentEle.parentNode.removeChild(contentEle);
                }
            }
        }

        /**
         * @name onContentKeyup
         * @desc key down event for the picker
         * @param {event} event - dom event
         * @returns {void}
         */
        function onContentKeyup(event) {
            if (event.keyCode === 27) {
                // esc
                scope.smssPopoverContent.model = false;
                $timeout();
            }
        }

        /**
         * @name positionContent
         * @desc position the content to the view. Triggered when the view is scrolled or resized
         * @returns {void}
         */
        function positionContent() {
            var targetRect = targetEle.getBoundingClientRect(),
                contentRect = contentEle.getBoundingClientRect(),
                containerRect,
                positionIdx,
                positionLen = scope.smssPopoverContent.position.length,
                calculatedPositions,
                pos,
                iteration;

            containerRect = containerEle.getBoundingClientRect();

            calculatedPositions = {};
            for (positionIdx = 0; positionIdx < positionLen; positionIdx++) {
                calculatedPositions[
                    scope.smssPopoverContent.position[positionIdx]
                ] = {
                    count: 0,
                    pos: calculatePosition(
                        scope.smssPopoverContent.position[positionIdx],
                        targetRect,
                        contentRect
                    ),
                };

                if (
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].pos.top >=
                    containerRect.top + window.pageYOffset
                ) {
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].count++;
                }

                if (
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].pos.right <=
                    containerRect.left +
                        containerRect.width +
                        window.pageXOffset
                ) {
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].count++;
                }

                if (
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].pos.bottom <=
                    containerRect.top +
                        containerRect.height +
                        window.pageYOffset
                ) {
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].count++;
                }

                if (
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].pos.left >=
                    containerRect.left + window.pageXOffset
                ) {
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].count++;
                }

                if (
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].pos.top >= window.pageYOffset
                ) {
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].count++;
                }

                if (
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].pos.right <=
                    window.innerWidth + window.pageXOffset
                ) {
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].count++;
                }

                if (
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].pos.bottom <=
                    window.innerHeight + window.pageYOffset
                ) {
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].count++;
                }

                if (
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].pos.left >= window.pageXOffset
                ) {
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].count++;
                }

                // perfect match! (we do 8 calculations.... so it's 8)
                if (
                    calculatedPositions[
                        scope.smssPopoverContent.position[positionIdx]
                    ].count === 8
                ) {
                    break;
                }
            }

            // perfect match! (we do 8 calculations.... so it's 8)
            iteration = 8;
            while (iteration >= 0 && !pos) {
                for (
                    positionIdx = 0;
                    positionIdx < positionLen;
                    positionIdx++
                ) {
                    if (
                        calculatedPositions[
                            scope.smssPopoverContent.position[positionIdx]
                        ].count === iteration
                    ) {
                        pos =
                            calculatedPositions[
                                scope.smssPopoverContent.position[positionIdx]
                            ].pos;
                        break;
                    }
                }

                iteration--;
            }

            contentEle.style.top = pos.top - containerRect.top + 'px';
            contentEle.style.left = pos.left - containerRect.left + 'px';
        }

        /**
         * @name calculatePosition
         * @desc calculate the position of the content
         * @param {string} position - position to calculate for N, NE, E, SE, S, SW, W, NW
         * @param {object} targetRect - target rect
         * @param {object} contentRect - content rect
         * @returns {void}
         */
        function calculatePosition(position, targetRect, contentRect) {
            var topPos = 0,
                leftPos = 0;

            //position top
            if (position === 'NW' || position === 'N' || position === 'NE') {
                topPos += window.pageYOffset + targetRect.top;

                if (scope.smssPopoverContent.verticalAlign === 'auto') {
                    topPos +=
                        -contentRect.height - scope.smssPopoverContent.spacing;
                }
            } else if (position === 'E' || position === 'W') {
                topPos +=
                    window.pageYOffset + targetRect.top + targetRect.height / 2;

                if (scope.smssPopoverContent.verticalAlign === 'auto') {
                    topPos += -contentRect.height / 2;
                }
            } else if (
                position === 'SE' ||
                position === 'S' ||
                position === 'SW'
            ) {
                topPos +=
                    window.pageYOffset + targetRect.top + targetRect.height;

                if (scope.smssPopoverContent.verticalAlign === 'auto') {
                    topPos += scope.smssPopoverContent.spacing;
                }
            }

            if (scope.smssPopoverContent.verticalAlign === 'top') {
                topPos += 0;
            } else if (scope.smssPopoverContent.verticalAlign === 'middle') {
                topPos += -contentRect.height / 2;
            } else if (scope.smssPopoverContent.verticalAlign === 'bottom') {
                topPos += -contentRect.height;
            }

            //position left
            if (position === 'NW' || position === 'W' || position === 'SW') {
                leftPos += window.pageXOffset + targetRect.left;

                if (scope.smssPopoverContent.horizontalAlign === 'auto') {
                    if (position === 'W') {
                        leftPos +=
                            -contentRect.width -
                            scope.smssPopoverContent.spacing;
                    } else {
                        leftPos += 0;
                    }
                }
            } else if (position === 'N' || position === 'S') {
                leftPos +=
                    window.pageXOffset + targetRect.left + targetRect.width / 2;

                if (scope.smssPopoverContent.horizontalAlign === 'auto') {
                    leftPos += -contentRect.width / 2;
                }
            } else if (
                position === 'NE' ||
                position === 'E' ||
                position === 'SE'
            ) {
                leftPos +=
                    window.pageXOffset + targetRect.left + targetRect.width;

                if (scope.smssPopoverContent.horizontalAlign === 'auto') {
                    if (position === 'E') {
                        leftPos += scope.smssPopoverContent.spacing;
                    } else {
                        leftPos += -contentRect.width;
                    }
                }
            }

            if (scope.smssPopoverContent.horizontalAlign === 'left') {
                leftPos += 0;
            } else if (scope.smssPopoverContent.horizontalAlign === 'middle') {
                leftPos += -contentRect.width / 2;
            } else if (scope.smssPopoverContent.horizontalAlign === 'right') {
                leftPos += -contentRect.width;
            }

            return {
                top: topPos,
                right: leftPos + contentRect.width,
                bottom: topPos + contentRect.height,
                left: leftPos,
            };
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            let parentEle;

            if (attrs.hasOwnProperty('spacing')) {
                scope.smssPopoverContent.spacing = +attrs.spacing;
            } else {
                scope.smssPopoverContent.spacing = 4;
            }

            if (attrs.hasOwnProperty('position')) {
                scope.smssPopoverContent.position = scope.$eval(attrs.position);
            } else {
                scope.smssPopoverContent.position = [
                    'S',
                    'N',
                    'E',
                    'W',
                    'NE',
                    'SE',
                    'SW',
                    'NW',
                ];
            }

            if (attrs.hasOwnProperty('verticalAlign')) {
                scope.smssPopoverContent.verticalAlign = attrs.verticalAlign;
            } else {
                scope.smssPopoverContent.verticalAlign = 'auto';
            }

            if (attrs.hasOwnProperty('horizontalAlign')) {
                scope.smssPopoverContent.horizontalAlign =
                    attrs.horizontalAlign;
            } else {
                scope.smssPopoverContent.horizontalAlign = 'auto';
            }

            if (attrs.hasOwnProperty('body')) {
                scope.smssPopoverContent.body = !(attrs.body === 'false');
            } else {
                scope.smssPopoverContent.body = true;
            }

            if (attrs.hasOwnProperty('autofocus')) {
                scope.smssPopoverContent.autofocus = true;
            }

            if (attrs.hasOwnProperty('width')) {
                scope.smssPopoverContent.width = attrs.width;
            }

            if (attrs.hasOwnProperty('disableDocumentClick')) {
                if (attrs.disableDocumentClick === 'true') {
                    scope.smssPopoverContent.disableDocumentClick = true;
                } else {
                    scope.smssPopoverContent.disableDocumentClick = false;
                }
            }

            if (attrs.hasOwnProperty('disableEvents')) {
                if (attrs.disableEvents === 'true') {
                    scope.smssPopoverContent.disableEvents = true;
                } else {
                    scope.smssPopoverContent.disableEvents = false;
                }
            }

            //bind target
            parentEle = smssPopoverCtrl.getParent();

            contentEle = ele[0];

            //need to register controller because of element
            if (scope.smssPopoverContent.target) {
                targetEle = parentEle.querySelector(
                    scope.smssPopoverContent.target
                );
            } else {
                targetEle = parentEle;
            }

            if (scope.smssPopoverContent.container) {
                containerEle = document.querySelector(
                    scope.smssPopoverContent.container
                );
            } else if (scope.smssPopoverContent.body) {
                containerEle = document.body;
            } else {
                containerEle = parentEle;
            }

            //remove content
            removeContent();

            //add listeners
            if (!scope.smssPopoverContent.disableEvents) {
                targetEle.addEventListener('keydown', onTargetKeyDown);
                targetEle.addEventListener('click', onTargetClick);
                targetEle.addEventListener('keyup', onTargetKeyUp);
            }

            scope.$watch('smssPopoverContent.model', function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    setPopover();
                }
            });

            scope.$watch(
                function () {
                    return (
                        contentEle.offsetHeight + '-' + contentEle.offsetWidth
                    );
                },
                function (newValue, oldValue) {
                    if (
                        scope.smssPopoverContent.model &&
                        !angular.equals(newValue, oldValue)
                    ) {
                        positionContent();
                    }
                }
            );

            if (scope.smssPopoverContent.autofocus) {
                $timeout(function () {
                    if (targetEle) {
                        targetEle.focus();
                    }
                });
            }

            //cleanup
            scope.$on('$destroy', function () {
                //remove listeners
                targetEle.removeEventListener('keydown', onTargetKeyDown);
                targetEle.removeEventListener('click', onTargetClick);
                targetEle.removeEventListener('keyup', onTargetKeyUp);
                document.removeEventListener(
                    'mousedown',
                    onDocumentClick,
                    true
                );
                document.removeEventListener(
                    'touchstart',
                    onDocumentClick,
                    true
                );
                window.removeEventListener('resize', positionContent);
                document.removeEventListener('scroll', positionContent, true);

                removeContent();
            });
        }

        initialize();
    }
}
