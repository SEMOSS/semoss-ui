/* eslint-disable no-console */
'use strict';

import Utility from '@/core/utility/utility.js';

import REACTORS from './reactors/index.js';
import ENUMS from './enums/index.js';

/**
 * @name Pixel
 * @desc useful for pixel manipulation and replacement
 * @returns {object} methods for pixel manipulation
 */
function Pixel() {
    /**
     * @name buildPixel
     * @param {array} command - list of commands that will be used to create a pixel string
     * @return {string} build pixel string
     */
    function build(command) {
        let built = '';
        for (
            let commandIdx = 0, commandLen = command.length;
            commandIdx < commandLen;
            commandIdx++
        ) {
            try {
                let builtCommand = REACTORS[command[commandIdx].type].apply(
                    {
                        build: build,
                        trim: trim,
                        prepend: prepend,
                        append: append,
                        convertJoin: convertJoin,
                        REACTORS: REACTORS,
                        ENUMS: ENUMS,
                    },
                    command[commandIdx].components
                );

                if (builtCommand) {
                    if (command[commandIdx].meta) {
                        builtCommand = prepend(builtCommand, ENUMS.PIPE);
                        builtCommand = prepend(builtCommand, ENUMS.META);
                    }

                    if (command[commandIdx].terminal) {
                        builtCommand = append(builtCommand, ENUMS.END);
                    } else {
                        builtCommand = append(builtCommand, ENUMS.PIPE);
                    }
                    built += builtCommand;
                }
            } catch (err) {
                console.error(command[commandIdx], err);
            }
        }

        // if (!built) {
        //     console.warn('Error?');
        // }

        // validate last has a ;
        built = append(built, ENUMS.END);

        return built;
    }

    /**
     * @name tokenize
     * @desc break a string into the important tokens and extract parameters
     * @param {string} string - string to token ize
     * @returns {array} tokens
     */
    function tokenize(string) {
        let tokens = [],
            active = false,
            start;

        const length = string.length;

        start = 0;
        while (start < length) {
            let token = {
                    active: active,
                    string: '',
                    parameter: '',
                    accessor: '',
                    toggle: false,
                },
                end = start;

            for (; end < length; end++) {
                const char = string.charAt(end);

                if (char === '<') {
                    active = true;
                    break;
                }

                if (char === '>') {
                    active = false;
                    break;
                }

                token.string += char;
            }

            // special formatting for the token
            if (token.active) {
                // this extracts the raw parameter, toggle, and accessor
                let split = token.string.split('.');

                // wrap it again (to keep the original)
                token.string = `<${token.string}>`;

                // parameter
                token.parameter = split.shift();

                // special toggle, remove the ! and indicate it
                if (token.parameter.charAt(0) === '!') {
                    token.parameter = token.parameter.substr(1);
                    token.toggle = true;
                } else {
                    token.toggle = false;
                }

                token.accessor = split.join('.');
            }

            tokens.push(token);

            // start to grab a new one
            start = end + 1;
        }

        return tokens;
    }

    /**
     * @name parameterize
     * @desc extract parameters from a list of tokens
     * @param {array} tokens - array of tokens
     * @returns {array} parameters
     */
    function parameterize(tokens) {
        let parameters = {};
        for (let token of tokens) {
            parameters[token.parameter] = true;
        }

        return Object.keys(parameters);
    }

    /**
     * @name construct
     * @desc reconstruct a string from a list of tokens
     * @param {array} tokens - array of tokens
     * @param {object} values - map of tokens (parameter - value)
     * @returns {string} reconstructed string
     */
    function construct(tokens, values) {
        let built = '';

        // look at the parsed and start to update the string
        for (let token of tokens) {
            // not a parameter, just append it
            if (!token.active) {
                built += token.string;
                continue;
            }

            // the value is undefined, so we don't use it
            if (!values.hasOwnProperty(token.parameter)) {
                built += token.string;
                continue;
            }

            // raw value
            let value = values[token.parameter];

            // accessor value
            if (token.accessor) {
                // get it
                value = Utility.getter(value, token.accessor);
            }

            // special logic
            if (token.toggle && typeof value === 'boolean') {
                value = !value;
            }

            // it should be a 'string' at the end
            // convert arrays to be '"test", "test"'
            if (Array.isArray(value)) {
                value = JSON.stringify(value).slice(1, -1);
            } else if (typeof value === 'object') {
                value = JSON.stringify(value);
            }

            // escape character trick?
            // JSON.stringify(String(value)).slice(1, -1);
            // make it a string and add it
            built += String(value);
        }

        return built;
    }

    /** Helpers */
    /**
     * @name trim
     * @param {STRING} query - pixel Query
     * @param {STRING} match - string to match from
     * @desc removes the trailing match from the query
     * @returns {string} query
     */
    function trim(query, match) {
        let regExp = new RegExp('(' + match + '(\\s+)?$)');
        return query.replace(regExp, '');
    }

    /**
     * @name prepend
     * @param {STRING} query - pixel Query
     * @param {STRING} match - string to match to
     * @desc adds the match to start of the query
     * @returns {string} query
     */
    function prepend(query, match) {
        let regExp = new RegExp('^(s+)?' + '\\' + match + '(s+)?');
        if (query.search(regExp) === -1) {
            return match + query;
        }
        return query;
    }

    /**
     * @name append
     * @param {STRING} query - pixel Query
     * @param {STRING} match - string to match to
     * @desc adds the match to end of the query
     * @returns {string} query
     */
    function append(query, match) {
        let regExp = new RegExp('(s+)?' + '\\' + match + '(s+)?$');
        if (query.trim().search(regExp) === -1) {
            return query + match;
        }
        return query;
    }

    /**
     * @name convertJoin
     * @param {STRING} joinType - type of join
     * @desc adds a semicolon to the query
     * @returns {string} join query
     */
    function convertJoin(joinType) {
        if (joinType === 'inner') {
            return 'inner.join';
        } else if (joinType === 'partial_left') {
            return 'left.outer.join';
        } else if (joinType === 'partial_right') {
            return 'right.outer.join';
        } else if (joinType === 'outer') {
            return 'outer.join';
        }

        return joinType;
    }

    return {
        build: build,
        tokenize: tokenize,
        parameterize: parameterize,
        construct: construct,
    };
}

export default new Pixel();
