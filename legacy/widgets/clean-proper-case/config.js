module.exports = {
    name: 'Proper Case',
    description: 'Changes the values of a column to proper case',
    icon: require('images/proper-case.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'stringi'],
        Frame: ['R', 'PY'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | ToProperCase(columns=[<properCaseCols>]);<SMSS_REFRESH_INSIGHT>',
                label: 'Proper Case',
                description:
                    'Change the values of a column to proper case (the first letter of every word will be capitalized).',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'properCaseCols',
                        view: {
                            displayType: 'checklist',
                            label: 'Select column(s):',
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
