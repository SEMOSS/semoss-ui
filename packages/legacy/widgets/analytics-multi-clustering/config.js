module.exports = {
    name: 'Clustering Optimization',
    description:
        'Discover trends and similar tendencies by dividing your data into an optimal number of clusters.',
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
            name: 'analytics-multi-clustering',
        },
    },
    lazy: true,
};
