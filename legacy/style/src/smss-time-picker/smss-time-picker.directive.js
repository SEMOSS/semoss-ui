import angular from 'angular';
import Utility from '../utility.js';

/**
 * @name smss-time-picker.directive.js
 * @desc smss-time-picker field
 */
export default angular
    .module('smss-style.time-picker', [])
    .directive('smssTimePicker', smssTimePicker);

import './smss-time-picker.scss';

smssTimePicker.$inject = ['$timeout'];

function smssTimePicker($timeout) {
    smssTimePickerLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: require('./smss-time-picker.directive.html'),
        scope: {},
        bindToController: {
            model: '=',
            format: '=?',
            disabled: '=?ngDisabled',
            change: '&?',
        },
        controllerAs: 'smssTimepicker',
        transclude: true,
        replace: true,
        link: smssTimePickerLink,
        controller: smssTimePickerController,
    };

    function smssTimePickerController() {}

    function smssTimePickerLink(scope, ele, attrs) {
        scope.smssTimepicker.showPopover = false;
        scope.smssTimepicker.displayTime = '';

        scope.smssTimepicker.hr = {
            selected: '',
            options: {
                double: {
                    // 01 - 12
                    12: Array.apply(null, Array(12)).map((val, index) =>
                        index + 1 < 10 ? `0${index + 1}` : String(index + 1)
                    ),
                    // 00 - 23
                    24: Array.apply(null, Array(24)).map((val, index) =>
                        index < 10 ? `0${index}` : String(index)
                    ),
                },
                single: {
                    // 1 - 12
                    12: Array.apply(null, Array(12)).map((val, index) =>
                        String(index + 1)
                    ),
                    // 0 - 23
                    24: Array.apply(null, Array(24)).map((val, index) =>
                        String(index)
                    ),
                },
            },
            cycle: '12', // 12 or 24
            digit: 'double', // single or double
        };

        scope.smssTimepicker.min = {
            selected: '',
            // 00 - 59
            options: Array.apply(null, Array(60)).map((val, index) =>
                index < 10 ? `0${index}` : String(index)
            ),
        };

        scope.smssTimepicker.sec = {
            selected: '',
            // 00 - 59
            options: Array.apply(null, Array(60)).map((val, index) =>
                index < 10 ? `0${index}` : String(index)
            ),
            show: false,
        };

        scope.smssTimepicker.a = {
            selected: 'AM',
            options: {
                upper: ['AM', 'PM'],
                lower: ['am', 'pm'],
            },
            case: 'upper',
            show: true,
        };

        // scope.smssTimepicker.timezone = {
        //     selected: '',
        //     options: [],
        //     show: false
        // };

        scope.smssTimepicker.updateTime = updateTime;
        scope.smssTimepicker.getCurrentTime = getCurrentTime;
        scope.smssTimepicker.setTime = setTime;
        scope.smssTimepicker.scrollIntoView = scrollIntoView;

        /**
         * @name buildPicker
         * @desc sets the selected values
         * @param {*} timestamp the time
         * @returns {void}
         */
        function buildPicker(timestamp) {
            let val = Utility.getTimeTokens(
                timestamp,
                scope.smssTimepicker.format
            );
            if (val) {
                scope.smssTimepicker.hr.selected = String(val.hr);
                scope.smssTimepicker.min.selected = String(val.min);
                scope.smssTimepicker.sec.selected = String(val.sec);
                scope.smssTimepicker.a.selected = val.a;
            }
        }

        /**
         * @name updateTime
         * @desc updates the selected time tokens
         * @param {*} value - selected value
         * @param {*} token - token to update (hr, min, sec)
         * @returns {void}
         */
        function updateTime(value, token) {
            if (value && token) {
                scope.smssTimepicker[token].selected = value;
            }
        }

        /**
         * @name toTimeString
         * @desc converts Date into a string timestamp
         * @param {*} value timestamp values
         * @param {string} format format of timestamp
         * @returns {void}
         */
        function toTimeString(value, format) {
            let tokens = {
                    HH: value.hr, // 00-23
                    H: value.hr, // 0-23
                    hh: value.hr, // 01-12
                    h: value.hr, // 1-12
                    mm: value.min, // 00-59
                    ss: value.sec, // 00-59
                    a: value.a, // am, pm
                    A: value.a, // AM, PM
                    '-': '-',
                    '/': '/',
                    ' ': ' ',
                    ',': ',',
                    ':': ':',
                },
                remaining = format,
                formatted = '';

            while (remaining.length > 0) {
                //go reverse
                let char = remaining.length;
                for (; char >= 0; char--) {
                    if (tokens.hasOwnProperty(remaining.substr(0, char))) {
                        break;
                    }
                }

                if (char >= 0) {
                    formatted += tokens[remaining.substr(0, char)];
                    remaining = remaining.slice(char);
                } else {
                    formatted += remaining.substr(0, 1);
                    remaining = remaining.slice(1);
                }
            }

            return formatted;
        }

        /**
         * @name setTime
         * @desc sets the model
         * @returns {void}
         */
        function setTime() {
            scope.smssTimepicker.model = toTimeString(
                {
                    hr: scope.smssTimepicker.hr.selected,
                    min: scope.smssTimepicker.min.selected,
                    sec: scope.smssTimepicker.sec.selected,
                    a: scope.smssTimepicker.a.selected,
                },
                scope.smssTimepicker.format
            );
            scope.smssTimepicker.showPopover = false;
            setDisplay();

            if (scope.smssTimepicker.change) {
                scope.smssTimepicker.change({
                    model: scope.smssTimepicker.model,
                });
            }
        }

        /**
         * @name getCurrentTime
         * @desc gets the current time
         * @returns {void}
         */
        function getCurrentTime() {
            let date = new Date(),
                currentHr = date.getHours(),
                currentMin = date.getMinutes(),
                currentSec = date.getSeconds(),
                newHr =
                    scope.smssTimepicker.hr.cycle !== '24' && currentHr > 12
                        ? currentHr - 12
                        : currentHr,
                newMin = currentMin < 10 ? `0${currentMin}` : currentMin,
                newSec = currentSec < 10 ? `0${currentSec}` : currentSec;

            if (scope.smssTimepicker.hr.digit === 'double' && newHr < 10) {
                newHr = `0${newHr}`;
            }

            scope.smssTimepicker.hr.selected = String(newHr);
            scope.smssTimepicker.min.selected = String(newMin);
            scope.smssTimepicker.sec.selected = String(newSec);
            scope.smssTimepicker.a.selected = currentHr >= 12 ? 'PM' : 'AM';

            setTime();
        }

        /**
         * @name scrollIntoView
         * @desc scrolls the selected options into view when the popover is opened
         * @param {*} contentEle - the popover element
         * @returns {void}
         */
        function scrollIntoView(contentEle) {
            let hrEle = contentEle.querySelector(
                    `#hr-${scope.smssTimepicker.hr.selected}`
                ),
                minEle = contentEle.querySelector(
                    `#min-${scope.smssTimepicker.min.selected}`
                ),
                secEle = scope.smssTimepicker.sec.show
                    ? contentEle.querySelector(
                          `#sec-${scope.smssTimepicker.sec.selected}`
                      )
                    : undefined;
            if (hrEle) {
                hrEle.scrollIntoView();
            }
            if (minEle) {
                minEle.scrollIntoView();
            }
            if (secEle) {
                secEle.scrollIntoView();
            }
        }

        /**
         * @name setDisplay
         * @desc sets the display time
         * @returns {void}
         */
        function setDisplay() {
            let displayValue = scope.smssTimepicker.model
                .replace('AM', '')
                .replace('PM', '')
                .replace('am', '')
                .replace('pm', '');
            scope.smssTimepicker.displayTime = displayValue.length
                ? displayValue
                : scope.smssTimepicker.model;
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            $timeout(function () {
                if (
                    typeof scope.smssTimepicker.format === 'undefined' ||
                    !scope.smssTimepicker.format
                ) {
                    scope.smssTimepicker.format = 'hh:mm A';
                } else {
                    // Check if 24 hour format (HH or H)
                    if (scope.smssTimepicker.format.indexOf('H') > -1) {
                        scope.smssTimepicker.hr.cycle = '24';
                        scope.smssTimepicker.a.show = false;
                    }
                    // Check if hours contains a single digit (H or h)
                    let shortHrRegex = /\bH\b/i;
                    if (shortHrRegex.test(scope.smssTimepicker.format)) {
                        scope.smssTimepicker.hr.digit = 'single';
                    }
                    // Check if seconds should be included (ss)
                    if (scope.smssTimepicker.format.indexOf('ss') > -1) {
                        scope.smssTimepicker.sec.show = true;
                    }
                    // Check case for a (a or A)
                    if (scope.smssTimepicker.format.indexOf('a') > -1) {
                        scope.smssTimepicker.a.case = 'lower';
                    }
                }
                buildPicker(scope.smssTimepicker.model);
                setDisplay();
            });
            scope.$watch('smssTimepicker.model', function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue)) {
                    buildPicker(newValue);
                    setDisplay();
                }
            });
        }

        initialize();
    }
}
