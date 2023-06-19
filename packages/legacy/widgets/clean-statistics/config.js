module.exports = {
    name: 'Clean Statistics',
    description: 'View your Stats',
    icon: require('images/ordered-list.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'graphics', 'stats'],
        Frame: ['R'],
    },
    content: {
        template: {
            name: 'clean-statistics',
        },
    },
    lazy: true,
};
