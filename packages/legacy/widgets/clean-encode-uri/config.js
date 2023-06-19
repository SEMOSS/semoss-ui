module.exports = {
    name: 'Encode URI',
    description: "Encode URI's in selected columns",
    icon: require('images/url-encode.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['urltools', 'data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | EncodeURI(columns=[<uriCols>]);<SMSS_REFRESH_INSIGHT>',
                label: 'Encode URI',
                description: "Encode URI's in selected columns",
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'uriCols',
                        view: {
                            displayType: 'checklist',
                            label: 'Select column(s):',
                            description: '',
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
