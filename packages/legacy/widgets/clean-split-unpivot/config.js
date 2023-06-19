module.exports = {
    name: 'Split Unpivot',
    description: 'Split column based on a separator',
    icon: require('images/unpivot.svg'),
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
                query: '<SMSS_FRAME.name> | SplitUnpivot(columns = [<splitCols>], delimiter = ["<separator>"]);<SMSS_AUTO>',
                label: 'Split Unpivot',
                description:
                    'Split values within a column based on a separator. This will unpivot the data to combine split values into their existing column.',
                listeners: ['updateTask', 'updateFrame', 'selectedData'],
                params: [
                    {
                        paramName: 'splitCols',
                        view: {
                            displayType: 'checklist',
                            label: 'Choose column to split:',
                            attributes: {
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                                display: 'alias',
                                value: 'alias',
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
                ],
                execute: 'button',
            },
        ],
    },
    pipeline: {
        group: 'Transform',
    },
};
