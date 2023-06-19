function Utility() {
    let API = {
        freeze: freeze,
        convert: convert,
        filter: filter,
        isEqual: isEqual,
        isEmpty: isEmpty,
        isDefined: isDefined,
        isDate: isDate,
        isLeapYear: isLeapYear,
        toDisplay: toDisplay,
        toValue: toValue,
        toSearch: toSearch,
        toDate: toDate,
        toDateTime: toDateTime,
        toDateString: toDateString,
        getTimeTokens: getTimeTokens,
        constants: {
            month: [
                {
                    name: 'January',
                    abbreviation: 'Jan',
                    length: 31,
                },
                {
                    name: 'February',
                    abbreviation: 'Feb',
                    length: 28,
                },
                {
                    name: 'March',
                    abbreviation: 'Mar',
                    length: 31,
                },
                {
                    name: 'April',
                    abbreviation: 'Apr',
                    length: 30,
                },
                {
                    name: 'May',
                    abbreviation: 'May',
                    length: 31,
                },
                {
                    name: 'June',
                    abbreviation: 'Jun',
                    length: 30,
                },
                {
                    name: 'July',
                    abbreviation: 'Jul',
                    length: 31,
                },
                {
                    name: 'August',
                    abbreviation: 'Aug',
                    length: 31,
                },
                {
                    name: 'September',
                    abbreviation: 'Sep',
                    length: 30,
                },
                {
                    name: 'October',
                    abbreviation: 'Oct',
                    length: 31,
                },
                {
                    name: 'November',
                    abbreviation: 'Nov',
                    length: 30,
                },
                {
                    name: 'December',
                    abbreviation: 'Dec',
                    length: 31,
                },
            ],
            week: [
                {
                    name: 'Sunday',
                    abbreviation: 'S',
                },
                {
                    name: 'Monday',
                    abbreviation: 'M',
                },
                {
                    name: 'Tuesday',
                    abbreviation: 'T',
                },
                {
                    name: 'Wednesday',
                    abbreviation: 'W',
                },
                {
                    name: 'Thursday',
                    abbreviation: 'Th',
                },
                {
                    name: 'Friday',
                    abbreviation: 'F',
                },
                {
                    name: 'Saturday',
                    abbreviation: 'Sa',
                },
            ],
        },
    };
    const GET_TOKEN = {
        year: {
            YYYY: (chunk) => {
                let val = Number(chunk);

                if (typeof val !== 'number' || chunk.length < 4) {
                    return undefined;
                }

                return val;
            },
            YY: (chunk) => {
                let today = (today = new Date()),
                    val = Number(
                        String(today.getFullYear()).substr(0, 2) + chunk
                    );

                if (typeof val !== 'number') {
                    return undefined;
                }

                return val;
            },
        },
        month: {
            MMMM: (chunk) => {
                for (
                    let monthIdx = 0, monthLength = API.constants.month.length;
                    monthIdx < monthLength;
                    monthIdx++
                ) {
                    if (API.constants.month[monthIdx].name === chunk) {
                        return monthIdx;
                    }
                }

                return undefined;
            },
            MMM: (chunk) => {
                for (
                    let monthIdx = 0, monthLength = API.constants.month.length;
                    monthIdx < monthLength;
                    monthIdx++
                ) {
                    if (API.constants.month[monthIdx].abbreviation === chunk) {
                        return monthIdx;
                    }
                }

                return undefined;
            },
            MM: (chunk) => {
                let val = Number(chunk);

                if (typeof val !== 'number') {
                    return undefined;
                }

                return val - 1;
            },
        },
        day: {
            DD: (chunk) => {
                if (chunk.length < 2) {
                    return undefined;
                }
                let val = Number(chunk);

                if (typeof val !== 'number') {
                    return undefined;
                }

                return val;
            },
        },
        hr: {
            HH: (chunk) => {
                let val = Number(chunk);

                if (typeof val !== 'number' || chunk.length < 2) {
                    return undefined;
                }

                return chunk;
            },
            H: (chunk) => {
                let val = Number(chunk);

                if (typeof val !== 'number' || chunk.length < 1) {
                    return undefined;
                }

                return val;
            },
            hh: (chunk) => {
                let val = Number(chunk);

                if (typeof val !== 'number' || chunk.length < 2) {
                    return undefined;
                }

                return chunk;
            },
            h: (chunk) => {
                let val = Number(chunk);

                if (typeof val !== 'number' || chunk.length < 1) {
                    return undefined;
                }

                return val;
            },
        },
        min: {
            mm: (chunk) => {
                let val = Number(chunk);

                if (typeof val !== 'number' || chunk.length < 2) {
                    return undefined;
                }

                return val;
            },
        },
        sec: {
            ss: (chunk) => {
                let val = Number(chunk);

                if (typeof val !== 'number' || chunk.length < 2) {
                    return undefined;
                }

                return val;
            },
        },
        a: {
            a: (chunk) => {
                let val = chunk.toLowerCase();

                if (val !== 'am' && val !== 'pm') {
                    return undefined;
                }

                return val;
            },
            A: (chunk) => {
                let val = chunk.toUpperCase();

                if (val !== 'AM' && val !== 'PM') {
                    return undefined;
                }

                return val;
            },
        },
    };

    /*** Utility */
    /**
     * @name freeze
     * @param {*} a  - frozen
     * @desc makes the passed in item immutable via stringification
     * @returns {*} frozen item
     */
    function freeze(a) {
        // non primative
        if (typeof a === 'object') {
            return JSON.parse(JSON.stringify(a));
        }

        // primative
        return a;
    }

    /**
     * @name convert
     * @param {*} raw - raw value
     * @param {*} model - model to grab the value of (in format of a.b.c)
     * @desc traverse based on the model and convert the value
     * @returns {*} converted value
     */
    function convert(raw, model) {
        let convertedRaw = freeze(raw),
            convertedModel = freeze(model); // needs to be immutable

        if (convertedModel && convertedRaw) {
            if (typeof convertedModel === 'string') {
                convertedModel = convertedModel.split('.'); //convert to array so we can traverse over the proerty
            }

            for (
                let aIdx = 0, aLen = convertedModel.length;
                aIdx < aLen;
                aIdx++
            ) {
                if (!convertedRaw) {
                    break;
                }

                convertedRaw = convertedRaw[convertedModel[aIdx]];
            }
        }

        return convertedRaw;
    }

    /**
     * @name filter
     * @param {array} raw - array value
     * @param {string} term - term to compare it against
     * @param {*} model - model to grab the value of (in format of a.b.c)
     * @desc filter the raw values and traverse based on the term
     * @returns {*} converted value
     */
    function filter(raw, term, model) {
        if (typeof term !== 'string' || term.length === 0) {
            return freeze(raw);
        }

        const convertedTerm = toSearch(term);
        return raw.filter((val) => {
            let displayed = convert(val, model);

            // object check
            if (typeof displayed === 'object') {
                if (isDate(displayed)) {
                    displayed = displayed.toString();
                } else {
                    return false;
                }
            }

            displayed = toSearch(displayed);
            if (displayed.indexOf(convertedTerm) > -1) {
                return true;
            }

            return false;
        });
    }

    /** Validity */
    /**
     * @name isEqual
     * @param {*} a - a value to compare
     * @param {*} b - b value to compare
     * @desc check if two values are equal
     * @returns {boolean} - equality check
     */
    function isEqual(a, b) {
        // TODO: Put in a proper equality check
        return JSON.stringify(a) === JSON.stringify(b);
    }

    /**
     * @name isEmpty
     * @param {*} a  - checked for emptiness
     * @desc checks whether an item is empty or not
     * @returns {boolean} truthy value if the passed in item is empty or not
     */
    function isEmpty(a) {
        // check if null or undefined
        if (a === null || a === undefined) {
            return true;
        }

        // string check
        if (typeof a === 'string') {
            return !a.length;
        }

        // object check
        if (typeof a === 'object') {
            // array check
            if (Array.isArray(a)) {
                return !a.length;
            }

            // object check
            for (let i in a) {
                if (a.hasOwnProperty(i)) {
                    return false;
                }
            }

            return JSON.stringify(a) === JSON.stringify({});
        }

        return false;
    }

    /**
     * @name isDefined
     * @param {*} a  - checked if it is defined
     * @desc checks whether an item is defined
     * @returns {boolean} truthy value if the passed in item is defined
     */
    function isDefined(a) {
        return !(a === undefined);
    }

    /**
     * @name isDate
     * @param {Date} d  - date to check
     * @desc check if passed in value is a valid date
     * @returns {boolean} truthy value if the passed in item is a valid date object
     */
    function isDate(d) {
        return !(
            Object.prototype.toString.call(d) !== '[object Date]' ||
            isNaN(d.getTime())
        );
    }

    /**
     * @name isLeapYear
     * @param {number} y  - year to check
     * @desc check if passed in value is a leap year
     * @returns {boolean} truthy value if the passed in item is a leap year
     */
    function isLeapYear(y) {
        return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    }

    /*** Transformation */
    /**
     * @name toDisplay
     * @desc  format a string into a display value
     * @param {string} raw - raw value
     * @returns {date} return a cleaned display string
     */
    function toDisplay(raw) {
        if (raw === null) {
            return 'null';
        }

        return String(raw).replace(/_/g, ' ');
    }

    /**
     * @name toValue
     * @desc  format a string into a value value
     * @param {string} raw - raw value
     * @returns {date} return a cleaned value string
     */
    function toValue(raw) {
        if (raw === 'null') {
            return null;
        }

        return raw;
    }

    /**
     * @name toSearch
     * @desc  format a string into a search value
     * @param {string} raw - raw value
     * @returns {date} return a cleaned search string
     */
    function toSearch(raw) {
        return String(raw).replace(/ /g, '_').toUpperCase();
    }

    /**
     * @name toDate
     * @desc  format a string into a date
     * @param {string} raw - raw value
     * @param {*} format - format to convert into
     * @returns {date} return a date object
     */
    function toDate(raw, format) {
        let date = {
                year: undefined,
                month: undefined,
                day: undefined,
            },
            containsFullMonth = format.indexOf('MMMM') > -1;

        if (raw && typeof raw === 'string') {
            let dateTokens = ['year', 'month', 'day'];

            for (let tokenId = 0; tokenId < dateTokens.length; tokenId++) {
                let tokenGroup = dateTokens[tokenId];
                if (GET_TOKEN.hasOwnProperty(tokenGroup)) {
                    for (let token in GET_TOKEN[tokenGroup]) {
                        if (GET_TOKEN[tokenGroup].hasOwnProperty(token)) {
                            let idx = format.indexOf(token);
                            if (idx !== -1 && idx < raw.length) {
                                // If the format contains "MMMM", need to calculate the index differently because month names are different lengths
                                if (containsFullMonth) {
                                    let startId, endId;
                                    if (token === 'MMMM') {
                                        startId = idx;
                                        // Because the other trailing characters are set lengths, we will use the trailing characters to determine the correct end index
                                        let tokenEnd = startId + token.length,
                                            trailingChar =
                                                format.length - tokenEnd;
                                        endId = raw.length - trailingChar;
                                    } else {
                                        // If the index of the token comes after the month, need to calculate the correct starting index
                                        if (idx > format.indexOf('MMMM')) {
                                            startId =
                                                raw.length -
                                                (format.length - idx);
                                        } else {
                                            startId = idx;
                                        }
                                        endId = startId + token.length;
                                    }
                                    date[tokenGroup] = GET_TOKEN[tokenGroup][
                                        token
                                    ](raw.substring(startId, endId));
                                } else {
                                    date[tokenGroup] = GET_TOKEN[tokenGroup][
                                        token
                                    ](raw.substring(idx, idx + token.length));
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (date.year === undefined) {
            if (format.indexOf('Y') > -1) {
                return undefined;
            }
            date.year = new Date().getFullYear();
        }
        if (date.month === undefined && format.indexOf('M') > -1) {
            return undefined;
        }
        if (date.day === undefined) {
            if (format.indexOf('D') > -1) {
                return undefined;
            }
            return new Date(date.year, date.month);
        }

        return new Date(date.year, date.month, date.day);
    }

    /**
     * @name toDateTime
     * @desc  format a string into a date with a timestamp
     * @param {string} raw - raw value
     * @param {*} format - format to convert into
     * @returns {date} return a date object
     */
    function toDateTime(raw, format) {
        let date = {
                year: undefined,
                month: undefined,
                day: undefined,
                hr: undefined,
                min: undefined,
                sec: undefined,
                a: undefined,
            },
            containsFullMonth = format.indexOf('MMMM') > -1,
            containsTimeperiod =
                format.indexOf('a') > -1 || format.indexOf('A') > -1,
            shortHrRegex = /\bH\b/i,
            containsShortHrs = shortHrRegex.test(format),
            offsetIndex = false;

        if (raw && typeof raw === 'string') {
            let dateTimeTokens = [
                'year',
                'month',
                'day',
                'hr',
                'min',
                'sec',
                'a',
            ];
            for (let tokenId = 0; tokenId < dateTimeTokens.length; tokenId++) {
                let tokenGroup = dateTimeTokens[tokenId];
                if (GET_TOKEN.hasOwnProperty(tokenGroup)) {
                    for (let token in GET_TOKEN[tokenGroup]) {
                        if (GET_TOKEN[tokenGroup].hasOwnProperty(token)) {
                            let idx = format.indexOf(token),
                                tokenLength = token.length;

                            if (idx !== -1 && idx <= raw.length) {
                                // If the format contains "MMMM", need to calculate the index differently because month names are different lengths
                                if (containsFullMonth) {
                                    let startId, endId;
                                    if (token === 'MMMM') {
                                        startId = idx;
                                        // Because the other trailing characters are set lengths, we will use the trailing characters to determine the correct end index
                                        let tokenEnd = startId + token.length,
                                            trailingChar =
                                                format.length - tokenEnd;
                                        endId = raw.length - trailingChar;
                                    } else {
                                        // If the index of the token comes after the month, need to calculate the correct starting index
                                        if (idx > format.indexOf('MMMM')) {
                                            startId =
                                                raw.length -
                                                (format.length - idx);
                                        } else {
                                            startId = idx;
                                        }
                                        endId = startId + token.length;
                                    }
                                    date[tokenGroup] = GET_TOKEN[tokenGroup][
                                        token
                                    ](raw.substring(startId, endId));
                                } else {
                                    if (containsShortHrs) {
                                        if (token === 'h' || token === 'H') {
                                            tokenLength = 2;
                                            // Check if it is a single or double digit
                                            let tempChunk = Number(
                                                raw.substring(
                                                    idx,
                                                    idx + tokenLength
                                                )
                                            );
                                            if (isNaN(tempChunk)) {
                                                tokenLength = 1;
                                            } else {
                                                offsetIndex = true;
                                            }
                                        } else if (offsetIndex) {
                                            // if short hours is a double digit (10+), then increase the index to get the correct chunk
                                            idx = idx + 1;
                                        }
                                    }
                                    // for timeperiod AM or PM check if the string is at least 2 characters otherwise it will be undefined
                                    if (
                                        (token === 'a' || token === 'A') &&
                                        idx + 2 <= raw.length
                                    ) {
                                        tokenLength = 2;
                                    }
                                    date[tokenGroup] = GET_TOKEN[tokenGroup][
                                        token
                                    ](raw.substring(idx, idx + tokenLength));
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (
            date.year === undefined ||
            date.month === undefined ||
            date.day === undefined ||
            date.hr === undefined ||
            date.min === undefined ||
            date.sec === undefined ||
            (containsTimeperiod && date.a === undefined)
        ) {
            return undefined;
        }
        if (containsTimeperiod) {
            // convert AM/PM to 24 hr clock
            let hr = Number(date.hr);
            if (hr === 12) {
                if (date.a === 'AM' || date.a === 'am') {
                    date.hr = 0;
                }
            } else if (date.a === 'PM' || date.a === 'pm') {
                date.hr = hr + 12;
            }
        }
        return new Date(
            date.year,
            date.month,
            date.day,
            date.hr,
            date.min,
            date.sec
        );
    }

    /**
     * @name getTimeTokens
     * @desc  gets the individual tokens from a string representing a time
     * @param {string} raw - raw value
     * @param {*} format - format to convert into
     * @returns {*} return a date object
     */
    function getTimeTokens(raw, format) {
        let date = {
                hr: undefined,
                min: undefined,
                sec: undefined,
                a: undefined,
            },
            containsTimeperiod =
                format.indexOf('a') > -1 || format.indexOf('A') > -1,
            shortHrRegex = /\bH\b/i,
            containsShortHrs = shortHrRegex.test(format),
            containsSeconds = format.indexOf('ss') > -1,
            offsetIndex = false;

        if (raw && typeof raw === 'string') {
            let timeTokens = ['hr', 'min', 'sec', 'a'];
            for (let tokenId = 0; tokenId < timeTokens.length; tokenId++) {
                let tokenGroup = timeTokens[tokenId];
                if (GET_TOKEN.hasOwnProperty(tokenGroup)) {
                    for (let token in GET_TOKEN[tokenGroup]) {
                        if (GET_TOKEN[tokenGroup].hasOwnProperty(token)) {
                            let idx = format.indexOf(token),
                                tokenLength = token.length;

                            if (idx !== -1 && idx <= raw.length) {
                                if (containsShortHrs) {
                                    if (token === 'h' || token === 'H') {
                                        tokenLength = 2;
                                        // Check if it is a single or double digit
                                        let tempChunk = Number(
                                            raw.substring(
                                                idx,
                                                idx + tokenLength
                                            )
                                        );
                                        if (isNaN(tempChunk)) {
                                            tokenLength = 1;
                                        } else {
                                            offsetIndex = true;
                                        }
                                    } else if (offsetIndex) {
                                        // if short hours is a double digit (10+), then increase the index to get the correct chunk
                                        idx = idx + 1;
                                    }
                                }
                                // for timeperiod AM or PM check if the string is at least 2 characters otherwise it will be undefined
                                if (
                                    (token === 'a' || token === 'A') &&
                                    idx + 2 <= raw.length
                                ) {
                                    tokenLength = 2;
                                }
                                date[tokenGroup] = GET_TOKEN[tokenGroup][token](
                                    raw.substring(idx, idx + tokenLength)
                                );
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (
            date.hr === undefined ||
            date.min === undefined ||
            (containsSeconds && date.sec === undefined) ||
            (containsTimeperiod && date.a === undefined)
        ) {
            return undefined;
        }

        return date;
    }

    /**
     * @name get12HourFormat
     * @desc  converts 24 hour into 12 hour format
     * @param {number} hour - raw value
     * @returns {number} return 12 hour format
     */
    function get12HourFormat(hour) {
        if (hour > 12) {
            return hour - 12;
        } else if (hour === 0) {
            return '12';
        }
        return hour;
    }

    /**
     * @name toDateString
     * @desc  format a date into a dateString
     * @param {date} raw - raw value
     * @param {string} format - format to convert into
     * @returns {string} return a dateString
     */
    function toDateString(raw, format) {
        let tokens = {
                YYYY: raw.getFullYear(),
                yyyy: raw.getFullYear(),
                yy: String(raw.getFullYear()).substr(-2),
                MMMM: API.constants.month[raw.getMonth()].name,
                MMMMM: API.constants.month[raw.getMonth()].name,
                MMM: API.constants.month[raw.getMonth()].abbreviation,
                MM:
                    raw.getMonth() >= 9
                        ? raw.getMonth() + 1
                        : `0${raw.getMonth() + 1}`,
                m: raw.getMonth() + 1,
                M: raw.getMonth() + 1,
                DDDD: API.constants.week[raw.getDay()].name,
                EEEEE: API.constants.week[raw.getDay()].name,
                DDD: API.constants.week[raw.getDay()].abbreviation,
                EEE: API.constants.week[raw.getDay()].abbreviation,
                DD: raw.getDate() >= 10 ? raw.getDate() : `0${raw.getDate()}`,
                dd: raw.getDate() >= 10 ? raw.getDate() : `0${raw.getDate()}`,
                d: raw.getDate(),
                HH:
                    raw.getHours() >= 10
                        ? raw.getHours()
                        : `0${raw.getHours()}`,
                H: raw.getHours(),
                hh:
                    get12HourFormat(raw.getHours()) >= 10
                        ? get12HourFormat(raw.getHours())
                        : `0${get12HourFormat(raw.getHours())}`,
                h: get12HourFormat(raw.getHours()),
                mm:
                    raw.getMinutes() >= 10
                        ? raw.getMinutes()
                        : `0${raw.getMinutes()}`,
                ss:
                    raw.getSeconds() >= 10
                        ? raw.getSeconds()
                        : `0${raw.getSeconds()}`,
                //'SSSS': String(raw.getMilliseconds()),
                a: raw.getHours() >= 12 ? 'pm' : 'am',
                A: raw.getHours() >= 12 ? 'PM' : 'AM',
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

    return API;
}

export default Utility();
