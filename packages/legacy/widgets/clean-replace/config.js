module.exports = {
    name: 'Replace',
    description: 'Replace column values with another value',
    icon: require('images/replace.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'splitstackshape'],
        Frame: ['R', 'PY'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | <replaceType>(column=[<columnName>], value=["<curValue>"], newValue=["<newValue>"]);<SMSS_REFRESH_INSIGHT>',
                label: 'Replace',
                description:
                    "Replace values within a column with another value. \nNote, regex string match is case sensitive, so the regex search of 'a' is different the regex search of 'A'. If you wish to count all a's regardless of case, you will need to enter 'a|A'.\nIf you wish to do a prefix/suffix search, you will need to add '^'/'$' at the beginning/end, respectively, of the value input.",
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'replaceType',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select replacement method:',
                            description:
                                'Regex will perform a regex search and replace all portions of the current cell value that match the input value.',
                            attributes: {
                                display: 'display',
                                value: 'value',
                            },
                        },
                        model: {
                            defaultOptions: [
                                {
                                    value: 'ReplaceColumnValue',
                                    display: 'Exact Match',
                                },
                                {
                                    value: 'RegexReplaceColumnValue',
                                    display: 'Regex',
                                },
                            ],
                            defaultValue: 'ReplaceColumnValue',
                            replaceSpacesWithUnderscores: true,
                            filter: 'camelCaseToTitleCase',
                        },
                    },
                    {
                        paramName: 'columnName',
                        view: {
                            displayType: 'checklist',
                            label: 'Select columns:',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                                multiple: true,
                                searchable: true,
                                quickselect: true,
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                    },
                    {
                        paramName: 'search',
                        view: false,
                        model: {
                            defaultValue: '',
                        },
                    },
                    {
                        paramName: 'curValue',
                        view: {
                            displayType: 'freetext',
                            label: 'Select a value to replace:',
                        },
                        model: {
                            defaultValue: '',
                            defaultOptions: [],
                        },
                        required: false,
                    },
                    {
                        paramName: 'newValue',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter the new value:',
                        },
                        model: {
                            defaultValue: '',
                            defaultOptions: [],
                        },
                        required: false,
                    },
                ],
                execute: 'button',
            },
        ],
    },
    pipeline: {
        group: 'Transform',
    },
};
