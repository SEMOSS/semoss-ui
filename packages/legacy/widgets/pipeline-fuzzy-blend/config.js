module.exports = {
    name: 'Fuzzy Join',
    description: 'Blend/Merge data based on fuzzy matching',
    icon: require('images/circle-view.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        Frame: ['R'],
    },
    content: {
        template: {
            name: 'pipeline-fuzzy-blend',
            options: {},
        },
    },
    pipeline: {
        group: 'Transform',
        parameters: {
            SOURCE: {
                frame: true,
            },
            DESTINATION: {
                frame: true,
            },
            QUERY_STRUCT: {
                type: 'QUERY_STRUCT',
            },
            FUZZY_MERGE: {
                required: true,
                type: 'FUZZY_MERGE',
            },
        },
        input: ['SOURCE', 'DESTINATION'],
        preview: 'DESTINATION',
        pixel: '<QUERY_STRUCT> | QueryAll() | FuzzyMerge(<FUZZY_MERGE>);',
    },
    lazy: true,
};
