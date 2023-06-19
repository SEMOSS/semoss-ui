module.exports = {
    name: 'Similarity',
    description:
        'Evaluate similarity of a single item to the overall data set by determining the most frequent values for each.',
    icon: require('images/analytics-similarity.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'dplyr'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                label: 'Similarity',
                description:
                    'Evaluate similarity of a single item to the overall data set by determining the most frequent values for each.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                query: '<SMSS_FRAME.name> | RunSimilarity(instance=[<instance>], attributes=[<selectors>]);',
                params: [
                    {
                        paramName: 'instance',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a column: ',
                            description:
                                'Each instance within this column will recieve a similarity score.',
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
                    {
                        paramName: 'selectors',
                        view: {
                            displayType: 'checklist',
                            label: 'Select the attributes to compare: ',
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
                        required: true,
                        link: 'instance',
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
