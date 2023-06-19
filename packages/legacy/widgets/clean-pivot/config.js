module.exports = {
    name: 'Pivot',
    description: 'Pivot a column',
    icon: require('images/pivot.svg'),
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
                query: '<SMSS_FRAME.name> | Pivot(pivotCol = ["<pivotColumn>"], valueCol = ["<valueColumn>"], function = ["<aggregate>"], maintainCols = [<pivotKeepColumns>]);<SMSS_AUTO>',
                label: 'Pivot',
                description:
                    'Transform values of a column into new headers in your data.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'pivotColumn',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a column to pivot:',
                            description:
                                'The unique values in this column will be converted into new headers.',
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
                        paramName: 'valueColumn',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select an existing column to populate newly created pivot columns:',
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
                        paramName: 'aggregate',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select aggregation method for the values:',
                            attributes: {
                                display: 'display',
                                value: 'value',
                            },
                            description:
                                'This method will be applied to the values of the existing column selected above.',
                        },
                        model: {
                            defaultOptions: [
                                {
                                    display: 'Sum',
                                    value: 'sum',
                                },
                                {
                                    display: 'Mean',
                                    value: 'mean',
                                },
                                {
                                    display: 'Median',
                                    value: 'median',
                                },
                                {
                                    display: 'None',
                                    value: '',
                                },
                            ],
                            defaultValue: '',
                        },
                        required: false,
                    },
                    {
                        paramName: 'pivotKeepColumns',
                        view: {
                            displayType: 'checklist',
                            label: 'Specify additional columns to keep in your data:',
                            description:
                                'All other columns (not selected) will be removed from your data.',
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
