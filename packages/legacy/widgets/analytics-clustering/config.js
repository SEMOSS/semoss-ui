module.exports = {
    name: 'Clustering',
    description:
        'Discover trends and similar tendencies by dividing your data into a specified number of clusters.',
    icon: require('images/analytics-clustering.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'dplyr', 'cluster', 'stats'],
        Frame: ['R'],
    },
    content: {
        template: {
            name: 'analytics-clustering',
        },
    },
    lazy: true,
};
