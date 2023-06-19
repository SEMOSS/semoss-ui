module.exports = {
    name: 'Split',
    description: 'Split column based on a separator',
    icon: require('images/split.svg'),
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
                query: '<SMSS_FRAME.name> | SplitColumns(columns=[<splitCols>], delimiter=["<separator>"], search=["<regex>"]);<SMSS_AUTO>',
                label: 'Split',
                description:
                    'Split values within a column based on a separator. This will create multiple new columns based on the split matching.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'splitCols',
                        view: {
                            displayType: 'checklist',
                            label: 'Choose column to split:',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                        useSelectedValues: true,
                    },
                    {
                        paramName: 'separator',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter a string separator:',
                        },
                    },
                    {
                        paramName: 'regex',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select search method:',
                        },
                        model: {
                            defaultOptions: ['Regex', 'Exact Match'],
                            defaultValue: 'Regex',
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
