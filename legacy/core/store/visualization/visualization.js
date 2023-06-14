/* eslint-disable no-console */
'use strict';

import UtilityStyle from '../../../style/src/utility.js';

function Visualization() {
    var _state = {
        VIZ_COLORS: {},
    };

    /** Public */

    /**
     * @name getTableData
     * @param {object} headers - initial object to set
     * @param {string} data - string to get to the object. In the form of 'a.b.c'
     * @param {object} aliasList - alias that maps to the headers list
     * @desc format pixel data to table data that the visualization can use
     * @return {void}
     */
    function getTableData(headers, data, aliasList) {
        var formattedData = {
                viewHeaders: [],
                rawData: [],
                viewData: [],
                labelData: {},
            },
            header;

        // check if data is formatted for Clustergram
        if (data.gridData) {
            return data;
        }

        if (data.length === 0) {
            return formattedData;
        }

        for (header in headers) {
            if (headers.hasOwnProperty(header)) {
                formattedData.labelData[headers[header].replace(/_/g, ' ')] =
                    [];
            }
        }

        // create array of objects from the scope.data.data array using the headers
        data.forEach(function (item) {
            var rawDataRow = {},
                viewDataRow = {},
                i,
                tempHeader;

            for (i = 0; i < item.length; i++) {
                if (headers[i] || headers[i] === '') {
                    if (rawDataRow[headers[i]] && aliasList) {
                        tempHeader = aliasList[i];
                    } else {
                        tempHeader = headers[i];
                    }
                    rawDataRow[tempHeader] = item[i];
                    if (typeof item[i] === 'string') {
                        viewDataRow[tempHeader.replace(/_/g, ' ')] = item[
                            i
                        ].replace(/_/g, ' ');
                    } else {
                        viewDataRow[tempHeader.replace(/_/g, ' ')] = item[i];
                    }
                    if (
                        formattedData.labelData.hasOwnProperty(
                            tempHeader.replace(/_/g, ' ')
                        )
                    ) {
                        if (typeof item[i] === 'string') {
                            formattedData.labelData[
                                tempHeader.replace(/_/g, ' ')
                            ].push(item[i].replace(/_/g, ' '));
                        } else {
                            formattedData.labelData[
                                tempHeader.replace(/_/g, ' ')
                            ].push(item[i]);
                        }
                    }
                }
            }
            formattedData.rawData.push(rawDataRow);
            formattedData.viewData.push(viewDataRow);
        });

        // add the headers as objects
        headers.forEach(function (col) {
            if (col) {
                formattedData.viewHeaders.push(col.replace(/_/g, ' '));
            }
        });

        return formattedData;
    }

    /**
     * @name getDataTableAlign
     * @param {array} currentKeys - array of objects to describe how to build the visual
     * @desc format the keys array into a dataTableAlignObject
     * @return {object} dataTableAlign - key:value mapping of current alignment
     */
    function getDataTableAlign(currentKeys) {
        var dataTableAlign = {},
            i,
            len,
            keyMapping = {};

        if (!currentKeys) {
            return dataTableAlign;
        }

        // iterate over current keys to create new object with key:value mapping instead of key:array mapping
        for (i = 0, len = currentKeys.length; i < len; i++) {
            if (!keyMapping.hasOwnProperty(currentKeys[i].model)) {
                keyMapping[currentKeys[i].model] = 0;
                dataTableAlign[currentKeys[i].model] = currentKeys[
                    i
                ].alias.replace(/_/g, ' ');
            } else {
                keyMapping[currentKeys[i].model] += 1;
                dataTableAlign[
                    currentKeys[i].model +
                        ' ' +
                        keyMapping[currentKeys[i].model]
                ] = currentKeys[i].alias.replace(/_/g, ' ');
            }
        }

        return dataTableAlign;
    }

    /**
     * @name isJson
     * @param {string} str additionalDataType from header info
     * @desc checks if additionalDataType is a default option string or a json obj of custom format rules
     * @returns {boolean} true or false
     */
    function isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    /**
     * @name getFormat
     * @param {*} keys - keys information
     * @param {*} options - options information
     * @desc get the final format rules for the visualization
     * @returns {*} formatRules that define how to manipulate the value
     */
    function getFormat(keys, options) {
        const format = {};
        for (let keyIdx = 0, keyLen = keys.length; keyIdx < keyLen; keyIdx++) {
            // save the format
            format[keys[keyIdx].alias] = mapFormatOpts(keys[keyIdx]);
        }

        // add in the tool options
        if (options.formatDataValues && options.formatDataValues.formats) {
            for (
                let formatIdx = 0,
                    formatLen = options.formatDataValues.formats.length;
                formatIdx < formatLen;
                formatIdx++
            ) {
                if (
                    format.hasOwnProperty(
                        options.formatDataValues.formats[formatIdx].dimension
                    )
                ) {
                    format[
                        options.formatDataValues.formats[formatIdx].dimension
                    ] = options.formatDataValues.formats[formatIdx];
                }
            }
        }

        return format;
    }

    function getCustomOptions() {
        let customOptions = {};
        customOptions = {
            type: [
                {
                    display: 'None',
                    value: 'Default',
                },
                {
                    display: 'Thousand (e.g. 1.00k)',
                    value: 'Thousand',
                },
                {
                    display: 'Million (e.g. 1.00M)',
                    value: 'Million',
                },
                {
                    display: 'Billion (e.g. 1.00B)',
                    value: 'Billion',
                },
                {
                    display: 'Trillion (e.g. 1.00T)',
                    value: 'Trillion',
                },
                {
                    display: 'Accounting ($)',
                    value: 'Accounting',
                },
                {
                    display: 'Scientific (1.00E+03)',
                    value: 'Scientific',
                },
                {
                    display: 'Percentage (%)',
                    value: 'Percentage',
                },
            ],
            delimiter: [
                {
                    display: 'None',
                    value: 'Default',
                },
                {
                    display: 'Comma (1,000)',
                    value: ',',
                },
                {
                    display: 'Period (1.000)',
                    value: '.',
                },
            ],
        };
        return customOptions;
    }

    function getDefaultOptions() {
        let formatOptions = [];
        formatOptions = [
            {
                display: 'String',
                value: 'STRING',
                formats: [],
            },
            {
                display: 'Integer',
                value: 'INT',
                formats: [
                    {
                        display: '1000',
                        value: 'int_default',
                        isDefault: true,
                    },
                    {
                        display: '1,000',
                        value: 'int_comma',
                    },
                    {
                        display: '$1000',
                        value: 'int_currency',
                    },
                    {
                        display: '$1,000',
                        value: 'int_currency_comma',
                    },
                    {
                        display: '10%',
                        value: 'int_percent',
                    },
                    {
                        display: '1.00k',
                        value: 'thousand',
                    },
                    {
                        display: '1.00M',
                        value: 'million',
                    },
                    {
                        display: '1.00B',
                        value: 'billion',
                    },
                    {
                        display: '1.00T',
                        value: 'trillion',
                    },
                    {
                        display: 'Accounting ($)',
                        value: 'accounting',
                    },
                    {
                        display: 'Scientific (1.00E+03)',
                        value: 'scientific',
                    },
                    {
                        value: 'Custom',
                        display: 'Custom Number Format',
                        options: {
                            dimension: '',
                            dimensionType: '',
                            model: '',
                            type: 'Default',
                            delimiter: 'Default',
                            prepend: '',
                            append: '',
                            round: 0,
                            appliedString: '',
                            layout: '',
                            date: 'Default',
                        },
                    },
                ],
            },
            {
                display: 'Double',
                value: 'DOUBLE',
                formats: [
                    {
                        display: '1000.00',
                        value: 'double_round2',
                        isDefault: true,
                    },
                    {
                        display: '1000.0',
                        value: 'double_round1',
                    },
                    {
                        display: '1000.000',
                        value: 'double_round3',
                    },
                    {
                        display: '1,000.0',
                        value: 'double_comma_round1',
                    },
                    {
                        display: '1,000.00',
                        value: 'double_comma_round2',
                    },
                    {
                        display: '$1,000.00',
                        value: 'double_currency_comma_round2',
                    },
                    {
                        display: '10.0%',
                        value: 'double_percent_round1',
                    },
                    {
                        display: '10.00%',
                        value: 'double_percent_round2',
                    },
                    {
                        display: '1.00k',
                        value: 'thousand',
                    },
                    {
                        display: '1.00M',
                        value: 'million',
                    },
                    {
                        display: '1.00B',
                        value: 'billion',
                    },
                    {
                        display: '1.00T',
                        value: 'trillion',
                    },
                    {
                        display: 'Accounting ($)',
                        value: 'accounting',
                    },
                    {
                        display: 'Scientific (1.00E+03)',
                        value: 'scientific',
                    },
                    {
                        value: 'Custom',
                        display: 'Custom Number Format',
                        options: {
                            dimension: '',
                            dimensionType: '',
                            model: '',
                            type: 'Default',
                            delimiter: 'Default',
                            prepend: '',
                            append: '',
                            round: 2,
                            appliedString: '',
                            layout: '',
                            date: 'Default',
                        },
                    },
                ],
            },
            {
                display: 'Date',
                value: 'DATE',
                formats: [
                    {
                        display: '1879-03-14',
                        value: 'yyyy-MM-dd',
                        isDefault: true,
                    },

                    {
                        display: '03/14/1879',
                        value: 'MM/dd/yyyy',
                    },
                    {
                        display: '3/14/1879',
                        value: 'M/d/yyyy',
                    },

                    {
                        display: '03/14/79',
                        value: 'MM/dd/yy',
                    },

                    {
                        display: '03/14',
                        value: 'MM/dd',
                    },

                    {
                        display: 'March 14, 1879',
                        value: 'MMMMM d, yyyy',
                    },

                    {
                        display: '14-Mar',
                        value: 'dd-MMM',
                    },

                    {
                        display: '14-Mar-79',
                        value: 'dd-MMM-yy',
                    },

                    {
                        display: '14-Mar-1879',
                        value: 'dd-MMM-yyyy',
                    },

                    {
                        display: 'Mar-79',
                        value: 'MMM-yy',
                    },

                    {
                        display: 'Friday, March 14, 1879',
                        value: 'EEEEE, MMMMM d, yyyy',
                    },
                    {
                        display: '1879',
                        value: 'yyyy',
                    },
                    {
                        display: '187903',
                        value: 'yyyyMM',
                    },
                    {
                        display: '18790314',
                        value: 'yyyyMMdd',
                    },
                    {
                        display: 'Custom Date Format',
                        value: 'Custom',
                        options: {
                            dimension: '',
                            dimensionType: '',
                            model: '',
                            type: 'Default',
                            delimiter: 'Default',
                            prepend: '',
                            append: '',
                            round: '',
                            appliedString: '',
                            layout: '',
                            date: '',
                        },
                    },
                ],
            },
            {
                display: 'Timestamp',
                value: 'TIMESTAMP',
                formats: [
                    {
                        display: '1879-03-14 13:30:55',
                        value: 'yyyy-MM-dd HH:mm:ss',
                        isDefault: true,
                    },
                    {
                        display: '1879-03-14 1:30 PM',
                        value: 'yyyy-MM-dd hh:mm a',
                    },
                    {
                        display: '1879-03-14 13:30',
                        value: 'yyyy-MM-dd HH:mm',
                    },
                    {
                        display: '1879-03-14 1:30',
                        value: 'yyyy-MM-dd hh:mm',
                    },
                    {
                        display: '3/14/79 13:30:55',
                        value: 'M/d/yy HH:mm:ss',
                    },
                    {
                        display: '3/14/79 1:30 PM',
                        value: 'M/d/yy hh:mm a',
                    },
                    {
                        display: '3/14/79 13:30',
                        value: 'M/d/yy HH:mm',
                    },
                    {
                        display: '3/14/79 1:30',
                        value: 'M/d/yy hh:mm',
                    },
                    {
                        display: 'Custom Timestamp Format',
                        value: 'Custom',
                        options: {
                            dimension: '',
                            dimensionType: '',
                            model: '',
                            type: 'Default',
                            delimiter: 'Default',
                            prepend: '',
                            append: '',
                            round: '',
                            appliedString: '',
                            layout: '',
                            date: '',
                        },
                    },
                ],
            },
        ];
        return formatOptions;
    }

    /**
     * @name mapFormatOpts
     * @param {*} headerInfo object containing header information and configurations
     * @desc function that maps default format options string to format rules
     * @returns {*} formatRules that define how to manipulate the value
     */
    function mapFormatOpts(headerInfo) {
        var formatString,
            customFormat = {},
            dataType,
            defaultRound,
            formatRules = {
                dimension: '',
                dimensionType: '',
                type: 'Default',
                date: 'Default',
                delimiter: 'Default',
                prepend: '',
                append: '',
                round: '',
                appliedString: '',
                layout: '',
                model: '',
            };

        // pull data type and default format string from headerInfo
        if (headerInfo) {
            formatRules.dimension = headerInfo.alias;
            formatRules.dimensionType = headerInfo.dataType;
            formatRules.model = headerInfo.model;
            dataType = headerInfo.dataType;
            // check if additionalDataType present otherwise apply default formats
            if (headerInfo.hasOwnProperty('additionalDataType')) {
                formatString = headerInfo.additionalDataType;
            } else {
                formatString = '';
            }
        }

        if (dataType === 'DATE') {
            if (
                formatString !== '' &&
                (formatString === 'yyyy-MM-dd' ||
                    formatString === 'MM/dd/yyyy' ||
                    formatString === 'M/d/yyyy' ||
                    formatString === 'MM/dd/yy' ||
                    formatString === 'MM/dd' ||
                    formatString === 'MMMMM d, yyyy' ||
                    formatString === 'dd-MMM' ||
                    formatString === 'dd-MMM-yy' ||
                    formatString === 'dd-MMM-yyyy' ||
                    formatString === 'MMM-yy' ||
                    formatString === 'EEEEE, MMMMM d, yyyy' ||
                    isJson(formatString))
            ) {
                if (isJson(formatString)) {
                    customFormat = JSON.parse(formatString);
                    return customFormat;
                }
                formatRules.date = formatString;
            } else {
                formatRules.date = 'yyyy-MM-dd';
            }
        }

        if (dataType === 'TIMESTAMP') {
            if (
                formatString !== '' &&
                (formatString === 'yyyy-MM-dd HH:mm:ss' ||
                    formatString === 'yyyy-MM-dd hh:mm a' ||
                    formatString === 'yyyy-MM-dd HH:mm' ||
                    formatString === 'yyyy-MM-dd hh:mm' ||
                    formatString === 'M/d/yy hh:mm a' ||
                    formatString === 'M/d/yy HH:mm' ||
                    formatString === 'M/d/yy HH:mm:ss' ||
                    formatString === 'M/d/yy hh:mm' ||
                    isJson(formatString))
            ) {
                if (isJson(formatString)) {
                    customFormat = JSON.parse(formatString);
                    return customFormat;
                }
                formatRules.date = formatString;
            } else {
                formatRules.date = 'yyyy-MM-dd HH:mm:ss';
            }
        }

        if (
            dataType === 'INT' ||
            dataType === 'DOUBLE' ||
            dataType === 'NUMBER'
        ) {
            // default rules based on either int or double
            if (dataType === 'INT') {
                defaultRound = 0;
            } else {
                defaultRound = '';
            }

            switch (formatString) {
                // 1000
                case 'int_default':
                    // same as default
                    formatRules.round = 0;
                    break;
                // 1,000
                case 'int_comma':
                    formatRules.round = 0;
                    formatRules.delimiter = ',';
                    break;
                case 'int_currency':
                    formatRules.round = 0;
                    formatRules.prepend = '$';
                    break;
                case 'int_currency_comma':
                    formatRules.round = 0;
                    formatRules.delimiter = ',';
                    formatRules.prepend = '$';
                    break;
                case 'int_percent':
                    formatRules.round = 0;
                    formatRules.append = '%';
                    break;
                case 'thousand':
                    formatRules.type = 'Thousand';
                    formatRules.delimiter = ',';
                    break;
                case 'million':
                    formatRules.type = 'Million';
                    formatRules.delimiter = ',';
                    break;
                case 'billion':
                    formatRules.type = 'Billion';
                    formatRules.delimiter = ',';
                    break;
                case 'trillion':
                    formatRules.type = 'Trillion';
                    formatRules.delimiter = ',';
                    break;
                case 'accounting':
                    // same as $1,000 but negatives are in parentheses
                    formatRules.type = 'Accounting';
                    formatRules.delimiter = ',';
                    formatRules.prepend = '$';
                    formatRules.round = 2;
                    break;
                case 'scientific':
                    formatRules.type = 'Scientific';
                    formatRules.delimiter = 'Default';
                    break;
                case 'double_round1':
                    formatRules.round = 1;
                    break;
                case 'double_round2':
                    // same as default
                    formatRules.round = 2;
                    break;
                case 'double_round3':
                    formatRules.round = 3;
                    break;
                case 'double_comma_round1':
                    formatRules.round = 2;
                    formatRules.delimiter = ',';
                    break;
                case 'double_comma_round2':
                    formatRules.round = 2;
                    formatRules.delimiter = ',';
                    break;
                case 'double_currency_comma_round2':
                    // same as accounting
                    formatRules.round = 2;
                    formatRules.delimiter = ',';
                    formatRules.prepend = '$';
                    break;
                case 'double_percent_round1':
                    formatRules.round = 1;
                    formatRules.append = '%';
                    break;
                case 'double_percent_round2':
                    formatRules.round = 2;
                    formatRules.append = '%';
                    break;
                default:
                    // if additionalDataType isn't a default option and isn't empty, custom formats applied
                    if (isJson(formatString)) {
                        customFormat = JSON.parse(formatString);
                        customFormat.round = customFormat.round || defaultRound;
                        return customFormat;
                    }
                    // 1000 or 1000.00 default
                    formatRules.round = defaultRound;
            }
        }
        return formatRules;
    }

    /**
     * @name formatValue
     * @desc This is a universal formatter for all visualizations.
     * It first formats based on the headers (type) and
     * then will check for additional formatting from the format-data-values widget.
     * @param {string} value - the value to format
     * @param {*} format - additional formatting set from the format-data-values widget (optional)
     * @returns {string} formatted value
     */
    function formatValue(value, format) {
        let formatted = value,
            parts,
            dontRound = false,
            date;

        /**
         * TODO: there are times when the value is passed as undefined
         * in the grid visualizaiton - this happens by:
         * loading a grid with an additional data type defined (MovieBudget as $)
         * then change the grid to be just Title
         * then change the grid to be Title, MovieBudget
         * it runs through the task data twice
         */
        if (typeof value !== 'undefined' && format && formatted !== null) {
            // strings only replace underscore
            if (
                format.dimensionType === 'STRING' &&
                typeof formatted === 'string'
            ) {
                formatted = formatted.replace(/_/g, ' ');
            }
            // dont run if string or date
            if (
                format.dimensionType === 'INT' ||
                format.dimensionType === 'DOUBLE' ||
                format.dimensionType === 'NUMBER'
            ) {
                if (format.type && format.type !== 'Default') {
                    if (format.type === 'Thousand') {
                        if (!isNaN(formatted)) {
                            formatted =
                                (Math.abs(Number(formatted)) / 1.0e3).toFixed(
                                    2
                                ) + '';
                            while (formatted[formatted.length - 1] === '0') {
                                formatted = formatted.slice(0, -1);
                            }

                            if (formatted[formatted.length - 1] === '.') {
                                formatted = formatted.slice(0, -1);
                            }

                            formatted = formatted + 'k';
                        }
                    } else if (format.type === 'Million') {
                        if (!isNaN(formatted)) {
                            formatted =
                                (Math.abs(Number(formatted)) / 1.0e6).toFixed(
                                    2
                                ) + '';
                            while (formatted[formatted.length - 1] === '0') {
                                formatted = formatted.slice(0, -1);
                            }

                            if (formatted[formatted.length - 1] === '.') {
                                formatted = formatted.slice(0, -1);
                            }

                            formatted = formatted + 'M';
                        }
                    } else if (format.type === 'Billion') {
                        if (!isNaN(formatted)) {
                            formatted = (
                                Math.abs(Number(formatted)) / 1.0e9
                            ).toFixed(2);
                            while (formatted[formatted.length - 1] === '0') {
                                formatted = formatted.slice(0, -1);
                            }

                            if (formatted[formatted.length - 1] === '.') {
                                formatted = formatted.slice(0, -1);
                            }

                            formatted = formatted + 'B';
                        }
                    } else if (format.type === 'Trillion') {
                        if (!isNaN(formatted)) {
                            formatted = (
                                Math.abs(Number(formatted)) / 1.0e12
                            ).toFixed(2);
                            while (formatted[formatted.length - 1] === '0') {
                                formatted = formatted.slice(0, -1);
                            }

                            if (formatted[formatted.length - 1] === '.') {
                                formatted = formatted.slice(0, -1);
                            }

                            formatted = formatted + 'T';
                        }
                    } else if (format.type === 'Scientific') {
                        if (
                            !isNaN(formatted) &&
                            typeof formatted === 'number'
                        ) {
                            if (format.round || format.round === 0) {
                                formatted = formatted.toExponential(
                                    format.round
                                );
                            } else {
                                formatted = formatted.toExponential();
                            }
                            // do not apply rounding or delimiter after scientific format applied
                            dontRound = true;
                            format.delimiter = 'Default';
                        }
                    } else if (format.type === 'Accounting') {
                        var negative = false;
                        // if no custom prepend symbol is added, use $
                        if (
                            format.hasOwnProperty('prepend') &&
                            format.prepend === ''
                        ) {
                            format.prepend = '$';
                        }
                        if (!isNaN(formatted)) {
                            // negatives display $ (500.00)
                            if (formatted < 0) {
                                formatted = formatted * -1;
                                negative = true;
                            }
                            // round before converted to string
                            if (format.round || format.round === 0) {
                                let shift = Math.pow(10, format.round);
                                if (!isNaN(formatted)) {
                                    formatted = (
                                        Math.round(shift * Number(formatted)) /
                                        shift
                                    ).toFixed(format.round);
                                }
                                dontRound = true;
                            }

                            // add commas
                            parts = formatted.toString().split('.');
                            parts[0] = parts[0].replace(
                                /\B(?=(\d{3})+(?!\d))/g,
                                ','
                            );
                            formatted = parts.join('.');
                            // zero display
                            if (formatted === '0') {
                                formatted = ' - ';
                            }
                            if (negative) {
                                formatted = '(' + formatted + ')';
                            } else {
                                formatted = formatted;
                            }
                        }
                    } else if (format.type === 'Percentage') {
                        if (!isNaN(formatted)) {
                            formatted = formatted * 100;
                            let shift = Math.pow(10, format.round);
                            formatted = (
                                Math.round(shift * Number(formatted)) / shift
                            ).toFixed(format.round);
                            formatted = formatted + '%';
                            dontRound = true;
                        }
                    }
                }

                // don't round for scientific notation (already rounded)
                if ((format.round || format.round === 0) && !dontRound) {
                    let shift = Math.pow(10, format.round);
                    if (!isNaN(formatted)) {
                        formatted = (
                            Math.round(shift * Number(formatted)) / shift
                        ).toFixed(format.round);
                    }
                }

                if (format.delimiter && format.delimiter !== 'Default') {
                    // if (!isNaN(formatted) && format.delimiter !== 'Default') {
                    parts = formatted.toString().split('.');
                    parts[0] = parts[0].replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        format.delimiter
                    );
                    formatted = parts.join('.');
                }
            }

            if (format.date && format.date !== 'Default') {
                date = new Date(formatted);
                if (date instanceof Date && !isNaN(date)) {
                    if (format.dimensionType === 'TIMESTAMP') {
                        formatted = UtilityStyle.toDateString(
                            date,
                            format.date
                        );
                    } else {
                        let offsetDate = new Date(
                            date.getTime() + date.getTimezoneOffset() * 60000
                        );
                        formatted = UtilityStyle.toDateString(
                            offsetDate,
                            format.date
                        );
                    }
                }
            }

            if (format.prepend && format.prepend !== 0) {
                // prepend the value to beginning of string
                formatted = format.prepend + formatted;
            }

            if (format.append && format.prepend !== 0) {
                // append the value to the end
                formatted = formatted + format.append;
            }
        }
        if (formatted === null) {
            formatted = 'null';
        }
        return formatted;
    }

    /**
     * @name setTooltipModel
     * @param {*} tooltipScope the scope to set the model to
     * @param {string} modelName the name of the object to set it to in the scope
     * @param {*} modelList the model to go through to set to the passed in scope
     * @desc loop through the list of model to set to the scope.
     * @returns {void}
     */
    function setTooltipModel(tooltipScope, modelName, modelList) {
        tooltipScope.tooltip = {};
        for (let i = 0; i < modelList.length; i++) {
            tooltipScope[modelName][modelList[i].name] = modelList[i].value;
        }
    }

    /**
     * @name initialize
     * @desc called when the module is loaded
     * @param {object} VIZ_COLORS - object of colors
     * @return {void}
     */
    function initialize(VIZ_COLORS) {
        _state.VIZ_COLORS = VIZ_COLORS;
    }

    return {
        getTableData: getTableData,
        getDataTableAlign: getDataTableAlign,
        getFormat: getFormat,
        initialize: initialize,
        mapFormatOpts: mapFormatOpts,
        formatValue: formatValue,
        getDefaultOptions: getDefaultOptions,
        getCustomOptions: getCustomOptions,
        isJson: isJson,
        setTooltipModel: setTooltipModel,
    };
}

export default new Visualization();
