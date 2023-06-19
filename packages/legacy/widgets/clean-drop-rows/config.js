module.exports = {
    name: 'Drop Rows',
    description: 'Drop rows where column contains a value',
    icon: require('images/eraser.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | DropRows(qs=[Filter(<column> <comparator> "<value>")]);<SMSS_REFRESH_INSIGHT>',
                label: 'Drop Rows',
                description:
                    "Drop rows in your data based on values in the selected column that successfully meet the defined criteria.\nNote, regex string match is case sensitive, so the regex search of 'a' is different the regex search of 'A'. If you wish to count all a's regardless of case, you will need to enter 'a|A'.\nIf you wish to do a prefix/suffix search, you will need to add '^'/'$' at the beginning/end, respectively, of the value input.",
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'column',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a column to remove values from:',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                    },
                    {
                        paramName: 'comparator',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a comparator:',
                        },
                        model: {
                            defaultOptions: [
                                '==',
                                '<',
                                '>',
                                '!=',
                                '<=',
                                '>=',
                                '?like',
                            ],
                            defaultValue: '==',
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
                        paramName: 'value',
                        view: {
                            displayType: 'typeahead',
                            label: 'Enter value to compare against:',
                            description:
                                'Rows containing a match will be removed.',
                        },
                        model: {
                            dependsOn: ['column', 'search'],
                            defaultValue: '',
                            query: '(dropRowValues = Frame(<SMSS_FRAME.name>) | Select(<column>) | Filter(<column> ?like "<search>") | Sort(cols=[<column>], direction=[asc]) | Iterate()) | Collect(50);',
                            infiniteQuery: 'dropRowValues | Collect(50);',
                            searchParam: 'search',
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
