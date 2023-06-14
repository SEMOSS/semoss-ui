module.exports = {
    name: 'Value Description Generator',
    description: 'Retrieve a semantic description for values within a column.',
    icon: require('images/analytics-description-generator.svg'),
    widgetList: {
        groups: ['analytics'],
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'WikidataR'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                label: 'Value Description Generator',
                description:
                    'Retrieve a semantic description for values within a column.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                query: '<SMSS_FRAME.name> | RunDescriptionGenerator(instance=[<instance>]);',
                params: [
                    {
                        paramName: 'instance',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select column to generate descriptions for: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                        required: true,
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
