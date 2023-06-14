import Utility from '../utility.js';

/**
 * @name smss-slider.directive.js
 * @desc smss-slider field
 */
export default angular
    .module('smss-style.slider', [])
    .directive('smssSlider', smssSlider);

import './smss-slider.scss';

smssSlider.$inject = ['$timeout', '$filter'];

function smssSlider($timeout, $filter) {
    smssSliderLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: require('./smss-slider.directive.html'),
        scope: {
            model: '=',
            options: '=?',
            min: '=?',
            max: '=?',
            sensitivity: '=?',
            format: '=?',
            start: '=?',
            end: '=?',
            change: '&',
            disabled: '=?ngDisabled',
        },
        replace: true,
        link: smssSliderLink,
    };

    function smssSliderLink(scope, ele, attrs) {
        var trackEle,
            thumbLeftEle,
            thumbRightEle,
            activeThumb,
            start,
            end,
            renderedValue;

        scope.setView = setView;
        scope.onThumbActionStart = onThumbActionStart;
        scope.onThumbKeydown = onThumbKeydown;

        scope.thumbLeft = {
            left: 0,
            display: '',
        };

        scope.thumbRight = {
            left: 0,
            display: '',
        };

        /**
         * @name buildSlider
         * @desc build (or rebuild) the slider whenever activated.
         * @returns {void}
         */
        function buildSlider() {
            var model = Utility.freeze(scope.model);

            if (scope.type === 'categorical') {
                if (scope.multiple) {
                    if (!Array.isArray(model)) {
                        model = scope.options;
                    }
                }
            } else if (scope.type === 'numerical') {
                if (scope.multiple) {
                    if (!Array.isArray(model)) {
                        model = [scope.min, scope.max];
                    }
                }
            } else if (scope.type === 'date') {
                if (scope.multiple) {
                    if (!Array.isArray(model)) {
                        model = [new Date(), new Date()];
                    } else {
                        model[0] = Utility.toDate(model[0], scope.format);

                        if (!Utility.isDate(model[0])) {
                            model[0] = new Date(model[0]);
                        }

                        model[1] = Utility.toDate(model[1], scope.format);

                        if (!Utility.isDate(model[1])) {
                            model[1] = new Date(model[1]);
                        }
                    }
                } else {
                    model = Utility.toDate(model, scope.format);

                    if (!Utility.isDate(model)) {
                        model = new Date();
                    }
                }
            }

            renderedValue = model;

            updateSlider();
        }

        /**
         * @name updateSlider
         * @desc called to position the highlight and thumb
         * @returns {void}
         */
        function updateSlider() {
            // clear it
            scope.thumbLeft = {
                left: 0,
                display: '',
            };

            scope.thumbRight = {
                left: 0,
                display: '',
            };

            if (scope.type === 'categorical') {
                if (scope.multiple) {
                    scope.thumbLeft = getPos(renderedValue[0]);
                    scope.thumbRight = getPos(
                        renderedValue[renderedValue.length - 1]
                    );
                } else {
                    scope.thumbRight = getPos(renderedValue);
                }
            } else if (scope.type === 'numerical') {
                if (scope.multiple) {
                    scope.thumbLeft = getPos(renderedValue[0]);
                    scope.thumbRight = getPos(renderedValue[1]);
                } else {
                    scope.thumbRight = getPos(renderedValue);
                }
            } else if (scope.type === 'date') {
                if (scope.multiple) {
                    scope.thumbLeft = getPos(renderedValue[0]);
                    scope.thumbRight = getPos(renderedValue[1]);
                } else {
                    scope.thumbRight = getPos(renderedValue);
                }
            }
        }

        /**
         * @name changeSlider
         * @desc trigger a change in the model
         * @returns {void}
         */
        function changeSlider() {
            var model;

            // need to remember that
            if (scope.type === 'date') {
                if (scope.multiple) {
                    model = [
                        Utility.toDateString(renderedValue[0], scope.format),
                        Utility.toDateString(renderedValue[1], scope.format),
                    ];
                } else {
                    model = Utility.toDateString(renderedValue, scope.format);
                }
            } else {
                model = renderedValue;
            }

            scope.model = model;

            scope.$evalAsync(function () {
                if (scope.change) {
                    scope.change({
                        model: scope.model,
                    });
                }
            });
        }

        /**
         * @name onThumbActionStart
         * @desc called when the thumb is pressed down
         * @param {event} event - dom event
         * @param {string} active -  which is the active thumb
         * @returns {void}
         */
        function onThumbActionStart(event, active) {
            event.stopPropagation();
            event.preventDefault();

            activeThumb = active;

            if (activeThumb === 'left') {
                thumbLeftEle.focus();
            } else if (activeThumb === 'right') {
                thumbRightEle.focus();
            }

            document.addEventListener('mousemove', onThumbActionMove);
            document.addEventListener('mouseup', onThumbActionEnd);
            document.addEventListener('touchmove', onThumbActionMove);
            document.addEventListener('touchend', onThumbActionEnd);
        }

        /**
         * @name onThumbActionMove
         * @desc called when the thumb is pressed down and moved
         * @param {event} event - dom event
         * @returns {void}
         */
        function onThumbActionMove(event) {
            var val,
                trackBoundingClientRect = trackEle.getBoundingClientRect(),
                optionsLen,
                base,
                shift,
                pageX = 0;

            event.stopPropagation();

            if (event.type === 'touchmove') {
                pageX = event.touches[0].pageX;
            } else if (event.type === 'mousemove') {
                pageX = event.pageX;
            }

            if (scope.type === 'categorical') {
                optionsLen = scope.options.length;
                val = Math.round(
                    ((pageX -
                        (window.pageXOffset + trackBoundingClientRect.left)) /
                        trackBoundingClientRect.width) *
                        optionsLen -
                        0.5
                );

                if (val < 0) {
                    val = 0;
                }

                if (val >= optionsLen) {
                    val = optionsLen - 1;
                }
            } else if (scope.type === 'numerical') {
                val =
                    ((pageX -
                        (window.pageXOffset + trackBoundingClientRect.left)) /
                        trackBoundingClientRect.width) *
                        (scope.max - scope.min) +
                    scope.min;

                if (val < scope.min) {
                    val = scope.min;
                }

                if (val > scope.max) {
                    val = scope.max;
                }

                // adjust for the sensitivity
                // adjust for floating point.....
                if (scope.sensitivity < 1) {
                    val =
                        Math.round(
                            (val *
                                Math.pow(
                                    10,
                                    Math.ceil(
                                        (-1 * Math.log(scope.sensitivity)) /
                                            Math.LN10
                                    )
                                )) /
                                (scope.sensitivity *
                                    Math.pow(
                                        10,
                                        Math.ceil(
                                            (-1 * Math.log(scope.sensitivity)) /
                                                Math.LN10
                                        )
                                    ))
                        ) * scope.sensitivity;
                    val = +val.toFixed(
                        Math.ceil(
                            (-1 * Math.log(scope.sensitivity)) / Math.LN10
                        )
                    );

                    base =
                        -1 *
                        Math.floor(Math.log(scope.sensitivity) / Math.LN10);
                    shift = Math.pow(10, base);
                    val =
                        Math.round(
                            (val * shift) / (scope.sensitivity * shift)
                        ) * scope.sensitivity;
                    val = +val.toFixed(base);
                } else {
                    val =
                        Math.round(val / scope.sensitivity) * scope.sensitivity;
                }
            } else if (scope.type === 'date') {
                val =
                    ((pageX -
                        (window.pageXOffset + trackBoundingClientRect.left)) /
                        trackBoundingClientRect.width) *
                        (end.getTime() - start.getTime()) +
                    start.getTime();

                if (val < start.getTime()) {
                    val = start.getTime();
                }

                if (val > end.getTime()) {
                    val = end.getTime();
                }

                // round to the nearest date
                shift = 60 * 60 * 1000 * 24; // milliseconds in an day
                val = Math.round(val / shift) * shift;
            }

            setValue(val);
        }

        /**
         * @name onThumbActionEnd
         * @desc called when the thumb is let go
         * @param {event} event - dom event
         * @returns {void}
         */
        function onThumbActionEnd(event) {
            event.stopPropagation();

            activeThumb = '';

            document.removeEventListener('mousemove', onThumbActionMove);
            document.removeEventListener('mouseup', onThumbActionEnd);
            document.removeEventListener('touchmove', onThumbActionMove);
            document.removeEventListener('touchend', onThumbActionEnd);
        }

        /**
         * @name onThumbKeydown
         * @desc called when a key is presset on the key
         * @param {event} event - dom event
         * @param {string} active -  which is the active thumb
         * @returns {void}
         */
        function onThumbKeydown(event, active) {
            var direction, leftValue, rightValue, shift;

            if (event.keyCode === 37) {
                // left (decrement)
                event.stopPropagation();
                event.preventDefault();

                direction = 'decrement';
            } else if (event.keyCode === 39) {
                // right
                event.stopPropagation();
                event.preventDefault();

                direction = 'increment';
            }

            if (direction) {
                if (scope.type === 'categorical') {
                    if (scope.multiple) {
                        leftValue = getOptionIdx(renderedValue[0]);
                        rightValue = getOptionIdx(
                            renderedValue[renderedValue.length - 1]
                        );

                        if (active === 'left') {
                            if (direction === 'decrement') {
                                leftValue--;
                            } else if (direction === 'increment') {
                                leftValue++;
                            }

                            if (leftValue === -1) {
                                leftValue = 0;
                            }

                            if (leftValue > rightValue) {
                                leftValue = rightValue;
                            }
                        } else if (active === 'right') {
                            if (direction === 'decrement') {
                                rightValue--;
                            } else if (direction === 'increment') {
                                rightValue++;
                            }

                            if (rightValue >= scope.options.length) {
                                rightValue = scope.options.length - 1;
                            }

                            if (rightValue < leftValue) {
                                rightValue = leftValue;
                            }
                        }

                        renderedValue = [];
                        while (leftValue <= rightValue) {
                            renderedValue.push(
                                getValue(scope.options[leftValue])
                            );
                            leftValue++;
                        }
                    } else if (active === 'left') {
                        //noop
                    } else if (active === 'right') {
                        rightValue = getOptionIdx(renderedValue);

                        if (direction === 'decrement') {
                            rightValue--;
                        } else if (direction === 'increment') {
                            rightValue++;
                        }

                        if (rightValue === -1) {
                            rightValue = 0;
                        }

                        if (rightValue >= scope.options.length) {
                            rightValue = scope.options.length - 1;
                        }

                        renderedValue = getValue(scope.options[rightValue]);
                    }
                } else if (scope.type === 'numerical') {
                    if (scope.multiple) {
                        if (active === 'left') {
                            if (direction === 'decrement') {
                                leftValue =
                                    renderedValue[0] - scope.sensitivity;
                            } else if (direction === 'increment') {
                                leftValue =
                                    renderedValue[0] + scope.sensitivity;
                            }

                            if (leftValue < scope.min) {
                                leftValue = scope.min;
                            }

                            if (leftValue > renderedValue[1]) {
                                leftValue = renderedValue[1];
                            }

                            renderedValue[0] = leftValue;
                        } else if (active === 'right') {
                            if (direction === 'decrement') {
                                rightValue =
                                    renderedValue[1] - scope.sensitivity;
                            } else if (direction === 'increment') {
                                rightValue =
                                    renderedValue[1] + scope.sensitivity;
                            }

                            if (rightValue > scope.max) {
                                rightValue = scope.max;
                            }

                            if (rightValue < renderedValue[0]) {
                                rightValue = renderedValue[0];
                            }

                            renderedValue[1] = rightValue;
                        }
                    } else if (active === 'left') {
                        //noop
                    } else if (active === 'right') {
                        if (direction === 'decrement') {
                            renderedValue = renderedValue - scope.sensitivity;
                        } else if (direction === 'increment') {
                            renderedValue = renderedValue + scope.sensitivity;
                        }

                        if (renderedValue < scope.min) {
                            renderedValue = scope.min;
                        }

                        if (renderedValue > scope.max) {
                            renderedValue = scope.max;
                        }
                    }
                } else if (scope.type === 'date') {
                    shift = 60 * 60 * 1000 * 24; // milliseconds in an day

                    if (scope.multiple) {
                        if (active === 'left') {
                            leftValue = renderedValue[0].getTime();

                            if (direction === 'decrement') {
                                leftValue = leftValue - shift;
                            } else if (direction === 'increment') {
                                leftValue = leftValue + shift;
                            }

                            if (leftValue < start.getTime()) {
                                leftValue = start.getTime();
                            }

                            if (leftValue > renderedValue[1]) {
                                leftValue = renderedValue[1];
                            }

                            renderedValue[0] = new Date(leftValue);
                        } else if (active === 'right') {
                            rightValue = renderedValue[1].getTime();

                            if (direction === 'decrement') {
                                rightValue = rightValue - shift;
                            } else if (direction === 'increment') {
                                rightValue = rightValue + shift;
                            }

                            if (rightValue > end.getTime()) {
                                rightValue = end.getTime();
                            }
                            if (rightValue < renderedValue[0]) {
                                rightValue = renderedValue[0];
                            }

                            renderedValue[1] = new Date(rightValue);
                        }
                    } else if (active === 'left') {
                        //noop
                    } else if (active === 'right') {
                        rightValue = renderedValue.getTime();

                        if (direction === 'decrement') {
                            rightValue = rightValue - shift;
                        } else if (direction === 'increment') {
                            rightValue = rightValue + shift;
                        }

                        if (rightValue < start.getTime()) {
                            rightValue = start.getTime();
                        }

                        if (rightValue > end.getTime()) {
                            rightValue = end.getTime();
                        }

                        renderedValue = new Date(rightValue);
                    }
                }

                //reposition
                updateSlider();

                changeSlider();
            }
        }

        /*** Helpers */
        /**
         * @name getPos
         * @desc called to get the position
         * @param {*} value - model backing this option
         * @returns {*} {percentage (on the scale), view}
         */
        function getPos(value) {
            if (scope.type === 'categorical') {
                const optIdx = getOptionIdx(value);
                if (optIdx !== -1) {
                    return {
                        display: setView(scope.options[optIdx]),
                        left: ((optIdx + 0.5) * 100) / scope.options.length,
                    };
                }
            } else if (scope.type === 'numerical') {
                return {
                    display: value,
                    left: ((value - scope.min) / (scope.max - scope.min)) * 100,
                };
            } else if (scope.type === 'date') {
                return {
                    display: Utility.toDateString(value, 'MM/DD/YYYY'),
                    left:
                        ((value.getTime() - start.getTime()) /
                            (end.getTime() - start.getTime())) *
                        100,
                };
            }

            return undefined;
        }

        /**
         * @name setValue
         * @desc called to set the actual model value
         * @param {*} val - value to set
         * @returns {void}
         */
        function setValue(val) {
            var leftValue, rightValue;

            // update the model
            if (scope.type === 'categorical') {
                if (scope.multiple) {
                    if (activeThumb === 'left') {
                        leftValue = val;
                        rightValue = getOptionIdx(
                            renderedValue[renderedValue.length - 1]
                        );

                        if (rightValue === -1) {
                            rightValue = renderedValue.length - 1;
                        }

                        if (leftValue > rightValue) {
                            leftValue = rightValue;
                        }
                    } else if (activeThumb === 'right') {
                        leftValue = getOptionIdx(renderedValue[0]);
                        rightValue = val;

                        if (leftValue === -1) {
                            leftValue = 0;
                        }

                        if (rightValue < leftValue) {
                            rightValue = leftValue;
                        }
                    }

                    renderedValue = [];
                    while (leftValue <= rightValue) {
                        renderedValue.push(getValue(scope.options[leftValue]));
                        leftValue++;
                    }
                } else if (activeThumb === 'left') {
                    //noop
                } else if (activeThumb === 'right') {
                    renderedValue = getValue(scope.options[val]);
                }
            } else if (scope.type === 'numerical') {
                if (scope.multiple) {
                    if (activeThumb === 'left') {
                        leftValue = val;
                        if (leftValue > renderedValue[1]) {
                            leftValue = renderedValue[1];
                        }

                        renderedValue[0] = leftValue;
                    } else if (activeThumb === 'right') {
                        rightValue = val;
                        if (rightValue < renderedValue[0]) {
                            rightValue = renderedValue[0];
                        }

                        renderedValue[1] = rightValue;
                    }
                } else if (activeThumb === 'left') {
                    //noop
                } else if (activeThumb === 'right') {
                    renderedValue = val;
                }
            } else if (scope.type === 'date') {
                if (scope.multiple) {
                    if (activeThumb === 'left') {
                        leftValue = val;
                        if (leftValue > renderedValue[1].getTime()) {
                            leftValue = renderedValue[1].getTime();
                        }

                        renderedValue[0] = new Date(leftValue);
                    } else if (activeThumb === 'right') {
                        rightValue = val;

                        if (rightValue < renderedValue[0].getTime()) {
                            rightValue = renderedValue[0].getTime();
                        }

                        renderedValue[1] = new Date(rightValue);
                    }
                } else if (activeThumb === 'left') {
                    //noop
                } else if (activeThumb === 'right') {
                    renderedValue = new Date(val);
                }
            }

            //reposition
            updateSlider();

            changeSlider();
        }

        /**
         * @name getOptionIdx
         * @desc called to get the actual model value
         * @param {*} value - value to find the option of
         * @returns {*} value
         */
        function getOptionIdx(value) {
            var i, len;

            for (i = 0, len = scope.options.length; i < len; i++) {
                if (angular.equals(getValue(scope.options[i]), value)) {
                    return i;
                }
            }

            return -1;
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
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            //set the view and update after the digest is complete
            var initializeTimeout = $timeout(function () {
                trackEle = ele[0].querySelector(
                    '#smss-slider__track__background'
                );
                thumbLeftEle = ele[0].querySelector(
                    '#smss-slider__track__thumb--left'
                );
                thumbRightEle = ele[0].querySelector(
                    '#smss-slider__track__thumb--right'
                );

                if (attrs.hasOwnProperty('categorical')) {
                    scope.type = 'categorical';

                    if (!Array.isArray(scope.options)) {
                        scope.options = [];
                    }

                    if (attrs.hasOwnProperty('display')) {
                        scope.display = attrs.display.split('.');
                    }

                    if (attrs.hasOwnProperty('value')) {
                        scope.value = attrs.value.split('.');
                    }
                } else if (attrs.hasOwnProperty('numerical')) {
                    scope.type = 'numerical';

                    if (typeof scope.min === 'undefined' || isNaN(scope.min)) {
                        scope.min = 0;
                    }

                    if (typeof scope.max === 'undefined' || isNaN(scope.max)) {
                        scope.max = 100;
                    }

                    if (
                        typeof scope.sensitivity === 'undefined' ||
                        isNaN(scope.sensitivity)
                    ) {
                        scope.sensitivity = 1;
                    }
                } else if (attrs.hasOwnProperty('date')) {
                    scope.type = 'date';

                    if (typeof scope.format === 'undefined' || !scope.format) {
                        scope.format = 'YYYY-MM-DD';
                    }

                    start = Utility.toDate(scope.start, scope.format);
                    if (!Utility.isDate(start)) {
                        start = new Date(0);
                    }

                    end = Utility.toDate(scope.end, scope.format);
                    if (!Utility.isDate(end)) {
                        end = new Date(
                            new Date().setFullYear(
                                new Date(0).getFullYear() + 100
                            )
                        );
                    }
                } else {
                    console.warn('Need a valid type');
                }

                if (attrs.hasOwnProperty('multiple')) {
                    scope.multiple = true;
                }

                if (attrs.hasOwnProperty('invert')) {
                    scope.invert = true;
                }

                if (attrs.hasOwnProperty('hideAxis')) {
                    scope.hideAxis = true;
                }

                //add listeners
                if (scope.multiple) {
                    scope.$watchCollection(
                        'model',
                        function (newValue, oldValue) {
                            if (!angular.equals(newValue, oldValue)) {
                                buildSlider();
                            }
                        }
                    );
                } else {
                    scope.$watch('model', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            buildSlider();
                        }
                    });
                }

                if (scope.type === 'categorical') {
                    scope.$watchCollection(
                        'options',
                        function (newValue, oldValue) {
                            if (!angular.equals(newValue, oldValue)) {
                                if (!Array.isArray(scope.options)) {
                                    scope.options = [];
                                }

                                updateSlider();
                            }
                        }
                    );
                } else if (scope.type === 'numerical') {
                    scope.$watch('min', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            scope.min = +newValue;

                            updateSlider();
                        }
                    });

                    scope.$watch('max', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            scope.max = +newValue;

                            updateSlider();
                        }
                    });

                    scope.$watch('sensitivity', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            scope.sensitivity = +newValue;

                            updateSlider();
                        }
                    });
                } else if (scope.type === 'date') {
                    scope.$watch('format', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            scope.format = newValue;

                            buildSlider();
                        }
                    });

                    scope.$watch('start', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            start = Utility.toDate(newValue, scope.format);

                            if (!Utility.isDate(start)) {
                                start = new Date(0);
                            }

                            updateSlider();
                        }
                    });

                    scope.$watch('end', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            end = Utility.toDate(newValue, scope.format);

                            if (!Utility.isDate(end)) {
                                end = new Date(
                                    new Date().setFullYear(
                                        new Date(0).getFullYear() + 100
                                    )
                                );
                            }

                            updateSlider();
                        }
                    });
                }

                // default events
                // touch is funky on this element, so block the default fully
                ele[0].addEventListener('touchstart', function (event) {
                    event.preventDefault();
                });

                if (attrs.hasOwnProperty('autofocus')) {
                    $timeout(function () {
                        if (thumbLeftEle) {
                            thumbLeftEle.focus();
                        } else if (thumbRightEle) {
                            thumbRightEle.focus();
                        }
                    });
                }

                buildSlider();

                $timeout.cancel(initializeTimeout);
            });
        }

        initialize();
    }
}
