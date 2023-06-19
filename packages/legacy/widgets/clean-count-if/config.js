module.exports = {
    name: 'Count If',
    description:
        'Insert a new column based on the count of values from another column',
    icon: require('images/hand.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'stringr'],
        Frame: ['R', 'PY'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | CountIf(column=[<colName>], regex=["<strFind>"], newCol=["<newCol>"]);<SMSS_AUTO>',
                label: 'Count if',
                description:
                    "Create a new column based on the count of regex matches from an existing column.\nNote, regex string match is case sensitive, so the regex search of 'a' is different the regex search of 'A'. If you wish to count all a's regardless of case, you will need to enter 'a|A'.\nIf you wish to do a prefix/suffix search, you will need to add '^'/'$' at the beginning/end, respectively, of the search string.",
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'colName',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select the column to regex search:',
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
                        paramName: 'strFind',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter regex string to match:',
                        },
                    },
                    {
                        paramName: 'newCol',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter a name for the new column to show results:',
                        },
                        model: {
                            replaceSpacesWithUnderscores: true,
                        },
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
