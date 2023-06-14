/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
'use strict';

/**
 * @name Utility
 * @desc simplie utlity functions
 * @returns {object} methods
 */
function Utility() {
    /** General Methods */

    /**
     * @name isEmpty
     * @param {*} item  - checked for emptiness
     * @desc checks whether an item is empty or not
     * @returns {boolean} truthy value if the passed in item is empty or not
     */
    function isEmpty(item) {
        // check if null or undefined
        if (item === null || item === undefined) {
            return true;
        }

        // string check
        if (typeof item === 'string') {
            return item.length === 0;
        }

        // object check
        if (typeof item === 'object') {
            // array check
            if (Array.isArray(item)) {
                return item.length === 0;
            }

            // object check
            for (let i in item) {
                if (item.hasOwnProperty(i)) {
                    return false;
                }
            }

            return JSON.stringify(item) === JSON.stringify({});
        }

        return false;
    }

    /**
     * @name freeze
     * @param {*} item  - frozen
     * @desc makes the passed in item immutable via stringification
     * @returns {*} frozen item
     */
    function freeze(item) {
        // non primative
        if (typeof item === 'object') {
            return JSON.parse(JSON.stringify(item));
        }

        // primative
        return item;
    }

    /**
     * @name random
     * @param {string} id - id to generate off of
     * @returns {string} a randomly generated string
     */
    function random(id) {
        let number = Math.round(Math.random() * 1000000);
        if (!id) {
            return String(number);
        }
        return String(id) + String(number);
    }

    /** Array Methods */
    /**
     * @name sort
     * @param {array} arr - the array to search
     * @param {string} accessor - string to get to the object. In the form of 'a.b.c'
     * @desc sort the array
     * @returns {array} sorted array
     */
    function sort(arr, accessor) {
        return arr.sort(function (a, b) {
            var valA = getter(a, accessor),
                valB = getter(b, accessor),
                compA = typeof valA === 'string' ? valA.toUpperCase() : valA,
                compB = typeof valB === 'string' ? valB.toUpperCase() : valB;

            if (compA < compB) {
                return -1;
            }
            if (compA > compB) {
                return 1;
            }

            return 0;
        });
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

        const convertedTerm = String(term).replace(/ /g, '_').toUpperCase();
        return raw.filter((val) => {
            let displayed = getter(val, model);

            // object check
            if (typeof displayed === 'object') {
                return false;
            }

            displayed = displayed.replace(/ /g, '_').toUpperCase();
            if (displayed.indexOf(convertedTerm) > -1) {
                return true;
            }

            return false;
        });
    }

    /** Object Methods */

    /**
     * @name setter
     * @param {object} root - initial object to set
     * @param {string} accessor - string to get to the object. In the form of 'a.b.c'
     * @param {object} value - new value to set the object too
     * @returns {void}
     */
    function setter(root, accessor, value) {
        if (typeof accessor !== 'string' || accessor.length === 0) {
            console.error('Modifying by reference so an accessor is needed');
            return;
        }

        const path = accessor.split('.'),
            last = path.length - 1;

        for (let i = 0; i < last; i++) {
            // move to the next key in the path, reset the root
            if (!root[path[i]]) {
                root[path[i]] = {};
            }
            root = root[path[i]];
        }

        // set it in the actaul path
        root[path[last]] = value;
    }

    /**
     * @name getter
     * @param {object} root - initial object to set
     * @param {string} accessor - string to get to the object. In the form of 'a.b.c'
     * @returns {*} value of the requested object
     */
    function getter(root, accessor) {
        if (accessor) {
            let accessors = accessor.split('.');
            for (let aIdx = 0, aLen = accessors.length; aIdx < aLen; aIdx++) {
                // move to the next key in the path, reset the root
                if (typeof root[accessors[aIdx]] === 'undefined') {
                    // eslint-disable-next-line no-undefined
                    return undefined;
                }
                root = root[accessors[aIdx]];
            }
        }

        return freeze(root); // immutable
    }

    /**
     * @name queryStringToJSON
     * @param {string} query - query string to convert
     * @returns {object} new object
     */
    function queryStringToJSON(query) {
        const split = (query || '').split('&'),
            converted = {};

        // convert
        for (
            let splitIdx = 0, splitLen = split.length;
            splitIdx < splitLen;
            splitIdx++
        ) {
            const pair = split[splitIdx].split('='),
                key = pair[0],
                value = decodeURIComponent(pair[1] || '');

            if (converted[key]) {
                if (Array.isArray(converted[key])) {
                    converted[key].push(converted);
                } else {
                    converted[key] = [converted[key], value];
                }
            } else {
                converted[key] = value;
            }
        }

        return JSON.parse(JSON.stringify(converted));
    }

    /**
     * @name JSONToQueryString
     * @param {object} obj - object to convert
     * @returns {string} new query string
     */
    function JSONToQueryString(obj) {
        let split = [];
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (Array.isArray(obj[key])) {
                    for (
                        let valueIdx = 0, valueLen = obj[key].length;
                        valueIdx < valueLen;
                        valueIdx++
                    ) {
                        split.push(
                            `${encodeURIComponent(key)}=${encodeURIComponent(
                                obj[key][valueIdx]
                            )}`
                        );
                    }
                } else {
                    split.push(
                        `${encodeURIComponent(key)}=${encodeURIComponent(
                            obj[key]
                        )}`
                    );
                }
            }
        }

        return split.join['&'];
    }

    return {
        isEmpty: isEmpty,
        freeze: freeze,
        random: random,
        sort: sort,
        filter: filter,
        setter: setter,
        getter: getter,
        queryStringToJSON: queryStringToJSON,
        JSONToQueryString: JSONToQueryString,
    };
}

export default new Utility();
