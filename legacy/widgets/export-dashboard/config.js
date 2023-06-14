module.exports = {
    name: 'Export Dashboard',
    description: 'Export dashboard into a file',
    icon: require('images/chart.svg'),
    widgetList: {
        showOn: ['none'],
    },
    content: {
        template: {
            name: 'export-dashboard',
        },
    },
    lazy: true,
};
