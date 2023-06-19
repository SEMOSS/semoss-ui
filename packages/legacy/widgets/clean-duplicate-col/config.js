module.exports = {
    name: 'Duplicate Column',
    description: 'Duplicate an existing column.',
    icon: require('images/duplicate.svg'),
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
                query: '<SMSS_FRAME.name> | DuplicateColumn(column=["<column>"],newCol=["<newColName>"]);<SMSS_AUTO>',
                label: 'Duplicate Column',
                description: 'Duplicate an existing column in your data.',
                params: [
                    {
                        paramName: 'column',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a column to duplicate:',
                            attributes: {
                                quickselect: false,
                                searchable: true,
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                        required: true,
                    },
                    {
                        paramName: 'newColName',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter name of new column:',
                        },
                        model: {
                            replaceSpacesWithUnderscores: true,
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
