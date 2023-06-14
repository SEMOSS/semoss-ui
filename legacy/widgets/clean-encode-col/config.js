module.exports = {
    name: 'Encode Column',
    description: 'Obfuscate the values of a column',
    icon: require('images/encode-column.svg'),
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
                query: '<SMSS_FRAME.name> | EncodeColumn(columns=[<obfuscateCols>]);<SMSS_REFRESH_INSIGHT>',
                label: 'Obfuscate',
                description: 'Obfuscate the values of a column.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'obfuscateCols',
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
