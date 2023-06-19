module.exports = {
    name: 'Convert Frame',
    description: 'Change the frame type',
    icon: require('images/replace.svg'),
    widgetList: {
        showOn: ['none'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | Convert("<type>");',
                label: 'Convert Frame',
                description: 'Change the frame type',
                params: [
                    {
                        paramName: 'type',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select frame type',
                            attributes: {
                                display: 'display',
                                value: 'value',
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                            },
                        },
                        model: {
                            defaultOptions: [
                                {
                                    value: 'GRID',
                                    display: 'Grid',
                                },
                                {
                                    value: 'R',
                                    display: 'R',
                                },
                                {
                                    value: 'PY',
                                    display: 'Python',
                                },
                            ],
                            defaultValue: 'GRID',
                        },
                    },
                ],
                execute: 'button',
            },
        ],
    },
    pipeline: {
        group: 'Transform',
        preview: 'SOURCE',
    },
};
