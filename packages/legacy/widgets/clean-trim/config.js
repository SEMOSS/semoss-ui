module.exports = {
    name: 'Trim',
    description:
        'Remove excess spaces around the values for specified column(s)',
    icon: require('images/scissors.svg'),
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
                query: '<SMSS_FRAME.name> | TrimColumns(columns=[<trimCols>]);<SMSS_REFRESH_INSIGHT>',
                label: 'Trim',
                description:
                    'Remove excess spaces around the values for specified column(s).',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'trimCols',
                        view: {
                            displayType: 'checklist',
                            label: 'Choose column(s) to trim:',
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
