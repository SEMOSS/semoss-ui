module.exports = {
    name: 'Lower Case',
    description: 'Changes the values of a column to lower case',
    icon: require('images/lower-case.svg'),
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
                query: '<SMSS_FRAME.name> | ToLowerCase(columns=[<lowerCaseCols>]);<SMSS_REFRESH_INSIGHT>',
                label: 'Lower Case',
                description: 'Change the values of a column to lower case.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'lowerCaseCols',
                        view: {
                            displayType: 'checklist',
                            label: 'Select column(s):',
                            description:
                                'Note: Selected numerical/date columns will converted into a string.',
                            attributes: {
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                                display: 'alias',
                                value: 'alias',
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
