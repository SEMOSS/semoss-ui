import Utility from '../utility.js';

/**
 * @name smss-date-picker.directive.js
 * @desc smss-date-picker field
 */
export default angular
    .module('smss-style.date-picker', [])
    .directive('smssDatePicker', smssDatePicker);

import './smss-date-picker.scss';

smssDatePicker.$inject = ['$timeout'];

function smssDatePicker($timeout) {
    smssDatepickerCompile.$inject = ['tElement', 'tAttributes'];
    smssDatePickerLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: require('./smss-date-picker.directive.html'),
        scope: {
            model: '=',
            format: '=?',
            disabled: '=?ngDisabled',
            change: '&',
            time: '=?',
            show: '&?',
            hide: '&?',
        },
        transclude: true,
        replace: true,
        compile: smssDatepickerCompile,
    };

    function smssDatepickerCompile(tElement, tAttributes) {
        var popoverEle = tElement[0].querySelector('smss-popover-content');
        // att the special attributes
        if (tAttributes.hasOwnProperty('body')) {
            popoverEle.setAttribute('body', !(tAttributes.body === 'false'));
        }

        if (tAttributes.hasOwnProperty('container')) {
            popoverEle.setAttribute('container', tAttributes.container);
        }

        return smssDatePickerLink;
    }

    function smssDatePickerLink(scope, ele, attrs) {
        var toggleEle;

        scope.todayDate = new Date();
        scope.today = {
            day: scope.todayDate.getDate(),
            month: scope.todayDate.getMonth(),
            year: scope.todayDate.getFullYear(),
        };
        scope.day = undefined;
        scope.month = undefined;
        scope.year = undefined;
        scope.level = 'day';
        scope.title = '';
        scope.items = [];
        scope.week = Utility.constants.week;
        scope.renderedMonth = undefined;
        scope.renderedYear = undefined;
        scope.input = {
            searchTerm: '',
        };
        scope.errorMessage = '';
        scope.showError = false;
        scope.bordered = false;
        scope.timestamp = {
            show: false,
            a: 'AM',
            aCase: 'upper',
            hr: 12,
            hrCycle: '12',
            min: 0,
            sec: 0,
        };
        scope.formatHasDay = true;
        scope.formatHasYear = true;

        scope.showPicker = showPicker;
        scope.hidePicker = hidePicker;
        scope.previousLevel = previousLevel;
        scope.exitLevel = exitLevel;
        scope.nextLevel = nextLevel;
        scope.enterLevel = enterLevel;
        scope.validateDate = validateDate;
        scope.resetTimestamp = resetTimestamp;
        scope.saveTimestamp = saveTimestamp;
        scope.switchTimeperiod = switchTimeperiod;

        /**Picker */
        /**
         * @name showPicker
         * @desc build (or rebuild) the picker whenever activated.
         * @returns {void}
         */
        function showPicker(contentEle) {
            buildPicker();
            renderLevel();
            if (scope.show) {
                scope.show({
                    contentEle: contentEle,
                });
            }
        }

        /**
         * @name hidePicker
         * @desc called when the picker is closed
         * @returns {void}
         */
        function hidePicker(contentEle) {
            if (toggleEle) {
                toggleEle.focus();
            }
            if (scope.hide) {
                scope.hide({
                    contentEle: contentEle,
                });
            }
        }

        /**
         * @name buildPicker
         * @desc build (or rebuild) the picker whenever activated.
         * @param {boolean} refresh - if true, will refresh the UI by calling renderLevel
         * @returns {void}
         */
        function buildPicker(refresh = false) {
            var val = scope.model;

            // convert to a date object
            if (val) {
                if (scope.timestamp.show) {
                    val = Utility.toDateTime(val, scope.format);
                } else {
                    val = Utility.toDate(val, scope.format);
                }

                // if not valid try to convert to date
                if (!Utility.isDate(val)) {
                    val = new Date(scope.model);
                }
            }

            // set the variables
            if (Utility.isDate(val)) {
                scope.day = val.getDate();
                scope.month = val.getMonth();
                scope.year = val.getFullYear();
                scope.renderedMonth = scope.month;
                scope.renderedYear = scope.year;
                scope.showError = false;

                // timestamp specific
                if (scope.timestamp.show) {
                    scope.timestamp.hr = val.getHours();
                    scope.timestamp.min = val.getMinutes();
                    scope.timestamp.sec = val.getSeconds();
                    // convert to am/pm
                    if (scope.timestamp.hrCycle === '12') {
                        if (scope.timestamp.hr >= 12) {
                            scope.timestamp.a =
                                scope.timestamp.aCase === 'upper' ? 'PM' : 'pm';
                            if (scope.timestamp.hr !== 12) {
                                scope.timestamp.hr = scope.timestamp.hr - 12;
                            }
                        } else {
                            scope.timestamp.a =
                                scope.timestamp.aCase === 'upper' ? 'AM' : 'am';
                            if (scope.timestamp.hr === 0) {
                                scope.timestamp.hr = 12;
                            }
                        }
                    }
                }

                scope.input.searchTerm = Utility.toDateString(
                    val,
                    scope.format
                );
            } else {
                val = new Date();
                scope.day = '';
                scope.month = '';
                scope.year = '';
                scope.renderedMonth = val.getMonth();
                scope.renderedYear = val.getFullYear();

                scope.input.searchTerm = '';
            }

            if (scope.input.searchTerm) {
                scope.showPlaceholder = false;
            } else {
                scope.showPlaceholder = true;
            }

            // format specific
            if (!scope.formatHasDay) {
                scope.level = 'month'; // show the month view instead of day view
            }

            if (refresh) {
                scope.level = scope.formatHasDay ? 'day' : 'month';
                renderLevel();
            }
        }

        /**
         * @name validateDate
         * @desc called whenever a user types in the input.
         * will validate that the entered input is a valid date
         * @param {string} searchTerm - the input entered by the user
         * @returns {void}
         */
        function validateDate(searchTerm) {
            var value;

            scope.input.searchTerm = searchTerm;
            if (searchTerm.length > 0) {
                if (scope.timestamp.show) {
                    value = Utility.toDateTime(searchTerm, scope.format);
                } else {
                    value = Utility.toDate(searchTerm, scope.format);
                }
                if (Utility.isDate(value)) {
                    scope.model = Utility.toDateString(value, scope.format);
                    scope.errorMessage = '';
                    scope.showError = false;
                    if (scope.change) {
                        scope.change({
                            model: scope.model,
                            delta: {
                                type: 'replace',
                                value: value,
                            },
                        });
                    }
                    buildPicker(true);
                } else {
                    scope.errorMessage = `Your date is in the incorrect format. Expecting: ${scope.format}`;
                    scope.showError = true;
                }
            }
        }

        /**
         * @name renderLevel
         * @desc set the items for the current level
         * @returns {void}
         */
        function renderLevel() {
            var currentMonthObj,
                firstDateObj,
                firstDateDay,
                previousMonth,
                previousYear,
                previousMonthObj,
                previousMonthLength,
                b,
                bLen,
                currentMonthLength,
                d,
                nextMonth,
                nextYear,
                nextMonthObj,
                mIdx,
                mLen,
                min,
                max,
                y;

            //TODO: validate w/ minimum + maximum date ranges
            scope.items = [];

            if (scope.level === 'day') {
                currentMonthObj = Utility.constants.month[scope.renderedMonth];

                scope.title =
                    currentMonthObj.abbreviation + ' ' + scope.renderedYear;

                //add any buffer days
                firstDateObj = new Date(
                    scope.renderedYear,
                    scope.renderedMonth,
                    1
                );
                firstDateDay = firstDateObj.getDay();

                if (firstDateDay > 0) {
                    // get the previously rendered month
                    if (scope.renderedMonth === 0) {
                        previousMonth = Utility.constants.month.length - 1;
                        previousYear = scope.renderedYear - 1;
                    } else {
                        previousMonth = scope.renderedMonth - 1;
                        previousYear = scope.renderedYear;
                    }

                    previousMonthObj = Utility.constants.month[previousMonth];
                    previousMonthLength = previousMonthObj.length;

                    // leapyear check
                    if (
                        previousMonth === 1 &&
                        Utility.isLeapYear(previousYear)
                    ) {
                        previousMonthLength++;
                    }

                    for (
                        b = previousMonthLength - firstDateDay + 1;
                        b <= previousMonthLength;
                        b++
                    ) {
                        scope.items.push({
                            title:
                                previousMonthObj.name +
                                ' ' +
                                b +
                                ', ' +
                                previousYear,
                            display: b,
                            year: previousYear,
                            month: previousMonth,
                            day: b,
                        });
                    }
                }

                // add the days of the current rendered month
                // leapyear check
                currentMonthLength = currentMonthObj.length;
                if (
                    scope.renderedMonth === 1 &&
                    Utility.isLeapYear(scope.renderedYear)
                ) {
                    currentMonthLength++;
                }

                for (d = 1; d <= currentMonthLength; d++) {
                    scope.items.push({
                        title:
                            currentMonthObj.name +
                            ' ' +
                            d +
                            ', ' +
                            scope.renderedYear,
                        display: d,
                        year: scope.renderedYear,
                        month: scope.renderedMonth,
                        day: d,
                    });
                }

                if (scope.items.length % 7 > 0) {
                    // get the next month

                    if (scope.renderedMonth === 11) {
                        nextMonth = 0;
                        nextYear = scope.renderedYear + 1;
                    } else {
                        nextMonth = scope.renderedMonth + 1;
                        nextYear = scope.renderedYear;
                    }

                    nextMonthObj = Utility.constants.month[nextMonth];
                    for (
                        b = 1, bLen = 7 - (scope.items.length % 7);
                        b <= bLen;
                        b++
                    ) {
                        scope.items.push({
                            title:
                                nextMonthObj.name + ' ' + b + ', ' + nextYear,
                            display: b,
                            year: nextYear,
                            month: nextMonth,
                            day: b,
                        });
                    }
                }
            } else if (scope.level === 'month') {
                scope.title = scope.renderedYear;

                for (
                    mIdx = 0, mLen = Utility.constants.month.length;
                    mIdx < mLen;
                    mIdx++
                ) {
                    scope.items.push({
                        title:
                            Utility.constants.month[mIdx].name +
                            ' ' +
                            scope.renderedYear,
                        display: Utility.constants.month[mIdx].abbreviation,
                        year: scope.renderedYear,
                        month: mIdx,
                    });
                }
            } else if (scope.level === 'year') {
                currentMonthObj = Utility.constants.month[scope.renderedMonth];
                scope.title =
                    currentMonthObj.abbreviation + ' ' + scope.renderedYear;
                min = scope.renderedYear - 12;
                max = min + 23;

                for (y = min; min <= y && y <= max; y++) {
                    scope.items.push({
                        title: y,
                        display: y,
                        year: y,
                    });
                }
            }
        }
        /**
         * @name nextLevel
         * @desc go to the next part of the current level and set the items
         * @returns {void}
         */
        function nextLevel() {
            var renderedMonth = scope.renderedMonth,
                renderedYear = scope.renderedYear;

            if (scope.level === 'day') {
                if (renderedMonth === 11) {
                    renderedMonth = 0;
                    renderedYear++;
                } else {
                    renderedMonth++;
                }
            } else if (scope.level === 'month') {
                renderedYear++;
            } else if (scope.level === 'year') {
                renderedYear += 24;
            }

            scope.renderedMonth = renderedMonth;
            scope.renderedYear = renderedYear;

            renderLevel();
        }
        /**
         * @name previousLevel
         * @desc go to the previous part of the current level and set the items
         * @returns {void}
         */
        function previousLevel() {
            var renderedMonth = scope.renderedMonth,
                renderedYear = scope.renderedYear;

            if (scope.level === 'day') {
                if (renderedMonth === 0) {
                    renderedMonth = Utility.constants.month.length - 1;
                    renderedYear--;
                } else {
                    renderedMonth--;
                }
            } else if (scope.level === 'month') {
                renderedYear--;
            } else if (scope.level === 'year') {
                renderedYear -= 24;
            }

            scope.renderedMonth = renderedMonth;
            scope.renderedYear = renderedYear;

            renderLevel();
        }
        /**
         * @name exitLevel
         * @desc exit the current level and set the items
         * @returns {void}
         */
        function exitLevel() {
            if (scope.level === 'year') {
                return;
            }

            if (scope.level === 'day') {
                scope.day = 1;
                scope.level = 'month';
            } else if (scope.level === 'month') {
                scope.month = 0;
                scope.level = 'year';
            }

            renderLevel();
        }

        /**
         * @name enterLevel
         * @desc select the day, and the month, and enter the next level
         * @param {number} year - selected year
         * @param {number} month - selected month
         * @param {number} day - selected day
         * @returns {void}
         */
        function enterLevel(year, month, day) {
            scope.year = year;
            scope.month = month;
            scope.day = day;
            scope.renderedYear = year;
            scope.renderedMonth = month;
            let value;

            if (scope.level === 'day') {
                if (
                    Utility.isDefined(scope.month) &&
                    Utility.isDefined(scope.day) &&
                    Utility.isDefined(scope.year)
                ) {
                    if (scope.timestamp.show) {
                        saveTimestamp();
                        return;
                    }

                    value = new Date(scope.year, scope.month, scope.day);
                    if (Utility.isDate(value)) {
                        value = Utility.toDateString(value, scope.format);
                        changeDatepicker(value);
                    }
                }

                scope.open = false;
                return;
            }

            if (scope.level === 'month') {
                if (!scope.formatHasDay) {
                    // format does not require day
                    if (
                        Utility.isDefined(scope.month) &&
                        Utility.isDefined(scope.year)
                    ) {
                        value = new Date(scope.year, scope.month);
                        if (Utility.isDate(value)) {
                            value = Utility.toDateString(value, scope.format);
                            changeDatepicker(value);
                        }
                    }
                    scope.open = false;
                    return;
                }
                scope.level = 'day';
            } else if (scope.level === 'year') {
                scope.level = 'month';
            }

            renderLevel();
        }

        /** TIMESTAMP FUNCTIONS */
        /**
         * @name saveTimestamp
         * @desc save the selected timestamp
         * @returns {void}
         */
        function saveTimestamp() {
            let value;

            // make sure date is selected
            if (
                Utility.isDefined(scope.month) &&
                scope.month !== '' &&
                Utility.isDefined(scope.day) &&
                scope.day !== '' &&
                Utility.isDefined(scope.year) &&
                scope.year !== ''
            ) {
                // validate timestamp before closing popup
                if (!validateTimestamp()) {
                    return;
                }
                // convert AM/PM to 24 hr clock
                if (scope.timestamp.hrCycle === '12') {
                    if (scope.timestamp.hr === 12) {
                        if (
                            scope.timestamp.a === 'AM' ||
                            scope.timestamp.a === 'am'
                        ) {
                            scope.timestamp.hr = 0;
                        }
                    } else if (
                        scope.timestamp.a === 'PM' ||
                        scope.timestamp.a === 'pm'
                    ) {
                        scope.timestamp.hr = scope.timestamp.hr + 12;
                    }
                }

                // create new date
                value = new Date(
                    scope.year,
                    scope.month,
                    scope.day,
                    scope.timestamp.hr,
                    scope.timestamp.min,
                    scope.timestamp.sec
                );

                if (Utility.isDate(value)) {
                    value = Utility.toDateString(value, scope.format);

                    changeDatepicker(value);
                }
            } else {
                scope.errorMessage =
                    'Select valid date before saving timestamp';
                scope.showError = true;
            }
        }

        /**
         * @name validateTimestamp
         * @desc called whenever a user types in the input.
         * will validate that the entered input is a valid timestamp
         * @returns {boolean} valid whether the timestamp is valid
         */
        function validateTimestamp() {
            let valid = true;
            if (scope.timestamp.hrCycle === '12') {
                if (
                    !Utility.isDefined(scope.timestamp.hr) ||
                    !scope.timestamp.hr
                ) {
                    scope.errorMessage =
                        'Timestamp hours must be between 1 and 12';
                    scope.showError = true;
                    valid = false;
                }
            } else if (
                !Utility.isDefined(scope.timestamp.hr) ||
                (!scope.timestamp.hr && scope.timestamp.hr !== 0)
            ) {
                scope.errorMessage = 'Timestamp hours must be between 0 and 23';
                scope.showError = true;
                valid = false;
            }
            if (
                !Utility.isDefined(scope.timestamp.min) ||
                (scope.timestamp.min !== 0 && !scope.timestamp.min)
            ) {
                scope.errorMessage =
                    'Timestamp minutes must be between 0 and 59';
                scope.showError = true;
                valid = false;
            }
            if (
                !Utility.isDefined(scope.timestamp.sec) ||
                (scope.timestamp.sec !== 0 && !scope.timestamp.sec)
            ) {
                scope.errorMessage =
                    'Timestamp seconds must be between 0 and 59';
                scope.showError = true;
                valid = false;
            }

            return valid;
        }

        /**
         * @name switchTimeperiod
         * @desc switch selection from am to pm
         * @returns {void}
         */
        function switchTimeperiod() {
            if (scope.timestamp.a === 'PM' || scope.timestamp.a === 'pm') {
                scope.timestamp.a =
                    scope.timestamp.aCase === 'upper' ? 'AM' : 'am';
            } else {
                scope.timestamp.a =
                    scope.timestamp.aCase === 'upper' ? 'PM' : 'pm';
            }
        }

        /**
         * @name resetTimestamp
         * @desc reset timestamp selection
         * @returns {void}
         */
        function resetTimestamp() {
            scope.timestamp = {
                show: true,
                a: scope.timestamp.aCase === 'upper' ? 'AM' : 'am',
                hr: 12,
                min: 0,
                sec: 0,
            };
        }

        /**
         * @name changeDatepicker
         * @param {*} value - selected value
         * @desc trigger a change in the model
         * @returns {void}
         */
        function changeDatepicker(value) {
            scope.model = value;
            scope.errorMessage = '';
            scope.showError = false;
            $timeout(function () {
                if (scope.change) {
                    scope.change({
                        model: scope.model,
                        delta: {
                            type: 'replace',
                            value: value,
                        },
                    });
                }

                scope.open = false;
            });
        }

        /**
         * @name keyupToggle
         * @param {event} $event - DOM event
         * @desc key up event for the toggle
         * @returns {void}
         */
        function keyupToggle($event) {
            if ($event.keyCode === 27) {
                // esc
                changeDatepicker('');
            }
        }

        /**Utility */

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            var initializeTimeout;

            // get the toggle
            toggleEle = ele[0].querySelector('#smss-date-picker__toggle');

            // from dashboard-filter if datatype of filter is timestamp
            if (scope.time) {
                scope.timestamp.show = true;
            }

            toggleEle.addEventListener('keyup', keyupToggle);
            if (
                attrs.hasOwnProperty('class') &&
                attrs.class.indexOf('smss-date-picker--bordered') > -1
            ) {
                scope.bordered = true;
            }
            if (attrs.hasOwnProperty('compact')) {
                scope.compact = true;
            }

            if (typeof scope.format === 'undefined' || !scope.format) {
                if (scope.timestamp.show) {
                    scope.format = 'MM/DD/YYYY hh:mm:ss A';
                } else {
                    scope.format = 'MM/DD/YYYY';
                }
            } else {
                if (scope.timestamp.show && scope.format.indexOf('a') > -1) {
                    scope.timestamp.aCase = 'lower';
                }
                if (scope.timestamp.show && scope.format.indexOf('H') > -1) {
                    scope.timestamp.hrCycle = '24';
                }
            }

            scope.formatHasDay = scope.format.indexOf('D') > -1;
            scope.formatHasYear = scope.format.indexOf('Y') > -1;

            if (attrs.hasOwnProperty('placeholder')) {
                scope.placeholder = attrs.placeholder;
            } else {
                scope.placeholder = 'mm/dd/yyyy';
            }

            //set the view and update after the digest is complete
            initializeTimeout = $timeout(function () {
                // set the inital one
                buildPicker();

                scope.$watch('model', function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        buildPicker();
                    }
                });

                scope.$watch('format', function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        scope.format = newValue;
                        scope.formatHasDay = scope.format.indexOf('D') > -1;
                        scope.formatHasYear = scope.format.indexOf('Y') > -1;

                        buildPicker();
                    }
                });

                if (attrs.hasOwnProperty('autofocus')) {
                    if (toggleEle) {
                        toggleEle.focus();
                    }
                }

                scope.$on('$destroy', function () {
                    scope.errorMessage = '';
                    scope.showError = false;
                });

                $timeout.cancel(initializeTimeout);
            });
        }

        initialize();
    }
}
