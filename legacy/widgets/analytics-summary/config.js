module.exports = {
    name: 'Analytics Summary',
    description: 'View a summary of your data',
    icon: require('images/analytics-summary.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'graphics', 'stats'],
        Frame: ['R'],
    },
    content: {
        template: {
            name: 'analytics-summary',
        },
    },
    lazy: true,
};
