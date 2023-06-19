export default angular
    .module('smss-style.scroll', [])
    .directive('smssScroll', smssScrollDirective);

import variables from '../variables.scss';

import './smss-scroll.scss';
import Scroll from './scroll.js';

smssScrollDirective.$inject = ['$timeout'];

function smssScrollDirective($timeout) {
    smssScrollLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'EA',
        scope: {
            scrollY: '&?',
            scrollX: '&?',
            staticY: '=',
            staticX: '=',
        },
        replace: true,
        transclude: true,
        template: require('./smss-scroll.directive.html'),
        link: smssScrollLink,
    };

    function smssScrollLink(scope, ele) {
        var containerEle,
            contentEle,
            scrollerEle,
            thumbYEle,
            trackYEle,
            thumbXEle,
            trackXEle,
            eventsY = false,
            eventsX = false,
            thumbY = {
                top: 0,
                height: 12,
            },
            thumbX = {
                left: 0,
                width: 12,
            },
            start = {
                x: 0,
                y: 0,
            },
            buildScrollYTimeout,
            buildScrollXTimeout,
            onThumbScrollY,
            onThumbScrollX,
            onThumbClickY,
            onThumbClickX,
            onThumbActionStartY,
            onThumbActionStartX,
            onThumbActionMoveY,
            onThumbActionMoveX,
            onThumbActionEndY,
            onThumbActionEndX,
            onTrackClickY,
            onTrackClickX;

        /**
         * @name buildScroll
         * @param {string} type - type of event
         * @desc called to build the scroll
         * @returns {void}
         */
        function buildScroll(type) {
            var pos;

            // set the height of the thumb
            if (type === 'y') {
                contentEle.style.paddingLeft = variables.scrollSize;
                contentEle.style.paddingRight = variables.scrollSize;

                if (containerEle.offsetHeight >= scrollerEle.scrollHeight) {
                    trackYEle.style.display = 'none';
                    removeEvents(type);
                    return;
                }

                trackYEle.style.display = 'block';
                addEvents(type);
                pos =
                    (containerEle.offsetHeight / scrollerEle.scrollHeight) *
                    containerEle.offsetHeight;
                if (pos < 12) {
                    pos = 12;
                }

                thumbY.height = pos;
                thumbYEle.style.height = thumbY.height + 'px';

                positionThumb(type);
            } else if (type === 'x') {
                contentEle.style.paddingTop = variables.scrollSize;
                contentEle.style.paddingBottom = variables.scrollSize;

                if (containerEle.offsetWidth >= scrollerEle.scrollWidth) {
                    trackXEle.style.display = 'none';
                    removeEvents(type);
                    return;
                }

                trackXEle.style.display = 'block';
                addEvents(type);
                pos =
                    (containerEle.offsetWidth / scrollerEle.scrollWidth) *
                    containerEle.offsetWidth;
                if (pos < 12) {
                    pos = 12;
                }

                thumbX.width = pos;
                thumbXEle.style.width = thumbX.width + 'px';

                positionThumb(type);
            }
        }

        /**
         * @name positionThumb
         * @param {string} type - type of event
         * @desc called to position the thumb
         * @returns {void}
         */
        function positionThumb(type) {
            //set the position of the thumn
            if (type === 'y') {
                thumbY.top = restrictDimensions(
                    type,
                    (1 - thumbY.height / containerEle.offsetHeight) *
                        containerEle.offsetHeight *
                        (scrollerEle.scrollTop /
                            (scrollerEle.scrollHeight -
                                containerEle.offsetHeight))
                );
                thumbYEle.style.top = thumbY.top + 'px';
            } else if (type === 'x') {
                thumbX.left = restrictDimensions(
                    type,
                    (1 - thumbX.width / containerEle.offsetWidth) *
                        containerEle.offsetWidth *
                        (scrollerEle.scrollLeft /
                            (scrollerEle.scrollWidth -
                                containerEle.offsetWidth))
                );
                thumbXEle.style.left = thumbX.left + 'px';
            }
        }

        /**
         * @name onThumbScroll
         * @desc called when the thumb is scrolled
         * @param {string} type - type of event
         * @param {event} event - browser event
         * @returns {void}
         */
        function onThumbScroll(type, event) {
            positionThumb(type);

            if (type === 'y') {
                if (scope.scrollY) {
                    scope.scrollY(event);
                }
            } else if (type === 'x') {
                if (scope.scrollX) {
                    scope.scrollX(event);
                }
            }
        }

        /**
         * @name onThumbClick
         * @desc called when the thumb is clicked
         * @param {string} type - type of event
         * @param {event} event - browser event
         * @returns {void}
         */
        function onThumbClick(type, event) {
            event.preventDefault();
            event.stopPropagation();
        }

        /**
         * @name onThumbActionStart
         * @desc called when the thumb is pressed down
         * @param {string} type - type of event
         * @param {event} event - browser event
         * @returns {void}
         */
        function onThumbActionStart(type, event) {
            var thumbEleBoundingClientRect,
                pageX = 0,
                pageY = 0;

            if (event.cancelable) {
                event.preventDefault();
            }

            event.stopPropagation();

            if (type === 'y') {
                thumbEleBoundingClientRect = thumbYEle.getBoundingClientRect();
                if (event.type === 'touchstart') {
                    pageY = event.touches[0].pageY;
                } else if (event.type === 'mousedown') {
                    pageY = event.pageY;
                }

                start.y =
                    pageY -
                    (window.pageYOffset + thumbEleBoundingClientRect.top);

                trackYEle.style.opacity = '1';
                document.addEventListener('mousemove', onThumbActionMoveY);
                document.addEventListener('mouseup', onThumbActionEndY);
                document.addEventListener('touchmove', onThumbActionMoveY);
                document.addEventListener('touchend', onThumbActionEndY);
            } else if (type === 'x') {
                thumbEleBoundingClientRect = thumbXEle.getBoundingClientRect();
                if (event.type === 'touchstart') {
                    pageX = event.touches[0].pageX;
                } else if (event.type === 'mousedown') {
                    pageX = event.pageX;
                }

                start.x =
                    pageX -
                    (window.pageXOffset + thumbEleBoundingClientRect.left);

                trackXEle.style.opacity = '1';
                document.addEventListener('mousemove', onThumbActionMoveX);
                document.addEventListener('mouseup', onThumbActionEndX);
                document.addEventListener('touchmove', onThumbActionMoveX);
                document.addEventListener('touchend', onThumbActionMoveX);
            }
        }

        /**
         * @name onThumbActionMove
         * @desc called when the thumb is pressed down and moved
         * @param {string} type - type of event
         * @param {event} event - browser event
         * @returns {void}
         */
        function onThumbActionMove(type, event) {
            var containerEleBoundingClientRect =
                    containerEle.getBoundingClientRect(),
                pos,
                pageX = 0,
                pageY = 0;

            event.stopPropagation();

            // check Y
            if (type === 'y') {
                if (event.type === 'touchmove') {
                    pageY = event.touches[0].pageY;
                } else if (event.type === 'mousemove') {
                    pageY = event.pageY;
                }

                pos = restrictDimensions(
                    type,
                    (pageY -
                        start.y -
                        (window.pageYOffset +
                            containerEleBoundingClientRect.top)) *
                        (1 - thumbY.height / containerEle.offsetHeight)
                );
            } else if (type === 'x') {
                if (event.type === 'touchmove') {
                    pageX = event.touches[0].pageX;
                } else if (event.type === 'mousemove') {
                    pageX = event.pageX;
                }

                pos = restrictDimensions(
                    type,
                    (pageX -
                        start.x -
                        (window.pageXOffset +
                            containerEleBoundingClientRect.left)) *
                        (1 - thumbX.width / containerEle.offsetWidth)
                );
            }

            //scroll
            if (pos) {
                scrollContent(type, pos);
            }
        }

        /**
         * @name onThumbActionEnd
         * @desc called when the thumb is let go
         * @param {string} type - type of event
         * @param {event} event - browser event
         * @returns {void}
         */
        function onThumbActionEnd(type, event) {
            if (event.cancelable) {
                event.preventDefault();
            }

            event.stopPropagation();

            if (type === 'y') {
                start.y = 0;

                trackYEle.style.opacity = null;
                document.removeEventListener('mousemove', onThumbActionMoveY);
                document.removeEventListener('mouseup', onThumbActionEndY);
                document.removeEventListener('touchmove', onThumbActionMoveY);
                document.removeEventListener('touchend', onThumbActionEndY);
            } else if (type === 'x') {
                start.x = 0;

                trackXEle.style.opacity = null;
                document.removeEventListener('mousemove', onThumbActionMoveX);
                document.removeEventListener('mouseup', onThumbActionEndX);
                document.removeEventListener('touchmove', onThumbActionMoveX);
                document.removeEventListener('touchend', onThumbActionEndX);
            }
        }

        /**
         * @name onTrackClick
         * @desc called when the track is clicked
         * @param {string} type - type of event
         * @param {event} event - browser event
         * @returns {void}
         */
        function onTrackClick(type, event) {
            var containerEleBoundingClientRect =
                    containerEle.getBoundingClientRect(),
                pos;

            event.preventDefault();
            event.stopPropagation();

            // check click
            if (type === 'y') {
                pos = restrictDimensions(
                    type,
                    (event.pageY -
                        (window.pageYOffset +
                            containerEleBoundingClientRect.top)) *
                        (1 - thumbY.height / containerEle.offsetHeight)
                );
            } else if (type === 'x') {
                pos = restrictDimensions(
                    type,
                    (event.pageX -
                        (window.pageXOffset +
                            containerEleBoundingClientRect.left)) *
                        (1 - thumbX.width / containerEle.offsetWidth)
                );
            }
            //scroll
            scrollContent(type, pos);
        }

        /**
         * @name restrictDimensions
         * @desc restricts the dimensions so that it is in the correct bounds
         * @param {string} type - type of restriction
         * @param {number} pos - position
         * @returns {number} correct position
         */
        function restrictDimensions(type, pos) {
            if (type === 'y') {
                if (pos > containerEle.offsetHeight - thumbY.height) {
                    return containerEle.offsetHeight - thumbY.height;
                }
            } else if (type === 'x') {
                if (pos > containerEle.offsetWidth - thumbX.width) {
                    return containerEle.offsetWidth - thumbX.width;
                }
            }

            if (pos < 0) {
                return 0;
            }

            return pos;
        }

        /**
         * @name scrollContent
         * @desc scroll the content
         * @param {string} type - type of restriction
         * @param {number} pos - pos of the thumb
         * @returns {void}
         */
        function scrollContent(type, pos) {
            if (type === 'y') {
                scrollerEle.scrollTop =
                    ((1 +
                        thumbY.height /
                            (containerEle.offsetHeight - thumbY.height)) *
                        pos *
                        scrollerEle.scrollHeight) /
                    containerEle.offsetHeight;
            } else if (type === 'x') {
                scrollerEle.scrollLeft =
                    ((1 +
                        thumbX.width /
                            (containerEle.offsetWidth - thumbX.width)) *
                        pos *
                        scrollerEle.scrollWidth) /
                    containerEle.offsetWidth;
            }
        }

        /**
         * @name addEvents
         * @desc add events
         * @param {string} type - type of restriction
         * @returns {void}
         */
        function addEvents(type) {
            if (type === 'y') {
                if (eventsY) {
                    // already added
                    return;
                }
                // add listener for scroll
                scrollerEle.addEventListener('scroll', onThumbScrollY);

                // add listeners for thumb
                thumbYEle.addEventListener('click', onThumbClickY);
                thumbYEle.addEventListener('mousedown', onThumbActionStartY);
                thumbYEle.addEventListener('touchstart', onThumbActionStartY);

                // add listener for track
                trackYEle.addEventListener('click', onTrackClickY);
                eventsY = true;
            } else if (type === 'x') {
                if (eventsX) {
                    // already added
                    return;
                }
                // add listener for scroll
                scrollerEle.addEventListener('scroll', onThumbScrollX);

                // add listeners for thumb
                thumbXEle.addEventListener('click', onThumbClickX);
                thumbXEle.addEventListener('mousedown', onThumbActionStartX);
                thumbXEle.addEventListener('touchstart', onThumbActionStartX);

                // add listener for track
                trackXEle.addEventListener('click', onTrackClickX);
                eventsX = true;
            }
        }

        /**
         * @name removeEvents
         * @desc remove events
         * @param {string} type - type of restriction
         * @returns {void}
         */
        function removeEvents(type) {
            if (type === 'y') {
                if (!eventsY) {
                    // already removed
                    return;
                }
                // remove listener for scroll
                scrollerEle.removeEventListener('scroll', onThumbScrollY);

                // remove listeners for thumb
                thumbYEle.removeEventListener('click', onThumbClickY);
                thumbYEle.removeEventListener('mousedown', onThumbActionStartY);
                thumbYEle.removeEventListener(
                    'touchstart',
                    onThumbActionStartY
                );

                // remove listener for track
                trackYEle.removeEventListener('click', onTrackClickY);
                eventsY = false;
            } else if (type === 'x') {
                if (!eventsX) {
                    // already removed
                    return;
                }
                // remove listener for scroll
                scrollerEle.removeEventListener('scroll', onThumbScrollX);

                // remove listeners for thumb
                thumbXEle.removeEventListener('click', onThumbClickX);
                thumbXEle.removeEventListener('mousedown', onThumbActionStartX);
                thumbXEle.removeEventListener(
                    'touchstart',
                    onThumbActionStartX
                );

                // remove listener for track
                trackXEle.removeEventListener('click', onTrackClickX);
                eventsX = false;
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            // get elements
            containerEle = ele[0];
            contentEle = ele[0].querySelector('#smss-scroll-content');
            scrollerEle = ele[0].querySelector('#smss-scroll-scroller');
            thumbYEle = ele[0].querySelector('#smss-scroll-thumbY');
            trackYEle = ele[0].querySelector('#smss-scroll-trackY');
            thumbXEle = ele[0].querySelector('#smss-scroll-thumbX');
            trackXEle = ele[0].querySelector('#smss-scroll-trackX');

            // build alias
            onThumbScrollY = onThumbScroll.bind(null, 'y');
            onThumbClickY = onThumbClick.bind(null, 'y');
            onThumbActionStartY = onThumbActionStart.bind(null, 'y');
            onThumbActionMoveY = onThumbActionMove.bind(null, 'y');
            onThumbActionEndY = onThumbActionEnd.bind(null, 'y');
            onTrackClickY = onTrackClick.bind(null, 'y');

            onThumbScrollX = onThumbScroll.bind(null, 'x');
            onThumbClickX = onThumbClick.bind(null, 'x');
            onThumbActionStartX = onThumbActionStart.bind(null, 'x');
            onThumbActionMoveX = onThumbActionMove.bind(null, 'x');
            onThumbActionEndX = onThumbActionEnd.bind(null, 'x');
            onTrackClickX = onTrackClick.bind(null, 'x');

            // initialize the global scroll object
            if (!Scroll.initialized) {
                Scroll.initialize();
            }

            // if it is mac and not webkit, we just add the padding and use the default overlay scroll
            if (Scroll.isMac && !Scroll.isWebkit) {
                if (!scope.staticY) {
                    contentEle.style.paddingLeft = variables.scrollSize;
                    contentEle.style.paddingRight = variables.scrollSize;
                }

                if (!scope.staticX) {
                    contentEle.style.paddingTop = variables.scrollSize;
                    contentEle.style.paddingBottom = variables.scrollSize;
                }

                return;
            }

            // if it is webkit, we force to be 0, otherwise we need to calculate and adjust the borders
            if (!Scroll.isWebkit) {
                if (Scroll.scrollBarWidth !== 0) {
                    scrollerEle.style.width =
                        'calc(100% + ' + Scroll.scrollBarWidth + 'px)';
                }

                if (Scroll.scrollBarHeight !== 0) {
                    scrollerEle.style.height =
                        'calc(100% + ' + Scroll.scrollBarHeight + 'px)';
                }
            }

            // $timeout(function () {
            // add watch to watch the size of the list
            if (!scope.staticY) {
                scope.$watch(
                    function () {
                        return (
                            containerEle.offsetHeight +
                            '-' +
                            scrollerEle.scrollHeight
                        );
                    },
                    function () {
                        if (buildScrollYTimeout) {
                            $timeout.cancel(buildScrollYTimeout);
                        }

                        buildScrollYTimeout = $timeout(function () {
                            buildScroll('y');
                            $timeout.cancel(buildScrollYTimeout);
                        }, 300);
                    }
                );

                buildScroll('y');
            }

            if (!scope.staticX) {
                scope.$watch(
                    function () {
                        return (
                            containerEle.offsetWidth +
                            '-' +
                            scrollerEle.scrollWidth
                        );
                    },
                    function () {
                        if (buildScrollXTimeout) {
                            $timeout.cancel(buildScrollXTimeout);
                        }

                        buildScrollXTimeout = $timeout(function () {
                            buildScroll('x');
                            $timeout.cancel(buildScrollXTimeout);
                        }, 300);
                    }
                );

                buildScroll('x');
            }

            //add destroy
            scope.$on('$destroy', function () {
                if (!scope.staticY) {
                    removeEvents('y');
                }

                if (!scope.staticX) {
                    removeEvents('x');
                }
            });
            // });
        }

        initialize();
    }
}
