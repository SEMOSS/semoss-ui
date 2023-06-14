module.exports = {
    name: 'Implied Insights',
    description: 'Automatically creates a dashboard to explore your dataset.',
    icon: require('images/brain.svg'),
    widgetList: {
        showOn: ['none'],
    },
    required: {
        R: [
            'data.table',
            'arules',
            'Boruta',
            'rlang',
            'tidyselect',
            'skimr',
            'FSelector',
        ],
        Frame: ['R'],
    },
    content: {
        template: {
            name: 'implied-insights',
        },
    },
    lazy: true,
};
