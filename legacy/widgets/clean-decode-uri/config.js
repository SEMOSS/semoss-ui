module.exports = {
    name: 'Decode URI',
    description: "Decode URI's in selected columns",
    icon: require('images/url-decode.svg'),
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
                query: '<SMSS_FRAME.name> | DecodeURI(columns=[<uriCols>]);<SMSS_REFRESH_INSIGHT>',
                label: 'Decode URI',
                description: "Decode URI's in selected columns",
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
