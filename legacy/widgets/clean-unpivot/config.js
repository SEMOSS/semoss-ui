module.exports = {
    name: 'Unpivot',
    description:
        'Select columns to unpivot. The columns selected will be removed and combined to generate 2 new columns "variable" and "value". Column "variable" will contain the original column headers. Column "value" will contain the value for that original column header. For each column that is selected in the list, the row will be represented for each combination of column header and value.',
    icon: require('images/unpivot.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'reshape2'],
        Frame: ['R', 'PY'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | Unpivot(columns=[<unpivotColumns>]);<SMSS_AUTO>',
                label: 'Unpivot',
                description:
                    'Select columns to unpivot. The columns selected will be removed and combined to generate 2 new columns "variable" and "value". Column "variable" will contain the original column headers. Column "value" will contain the value for that original column header. For each column that is selected in the list, the row will be represented for each combination of column header and value.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'unpivotColumns',
                        view: {
                            displayType: 'checklist',
                            label: 'Select column(s) to unpivot:',
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
                ],
                execute: 'button',
            },
        ],
    },
    pipeline: {
        group: 'Transform',
    },
};
