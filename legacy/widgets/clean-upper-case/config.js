module.exports = {
    name: 'Upper Case',
    description: 'Changes the values of a column to upper case',
    icon: require('images/upper-case.svg'),
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
                query: '<SMSS_FRAME.name> | ToUpperCase(columns=[<upperCaseCols>]);<SMSS_REFRESH_INSIGHT>',
                label: 'Upper Case',
                description: 'Change the values of a column to upper case.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'upperCaseCols',
                        view: {
                            displayType: 'checklist',
                            label: 'Select column(s)',
                            description:
                                'Note: Selected numerical/date columns will converted into a string.',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["STRING"]);',
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
