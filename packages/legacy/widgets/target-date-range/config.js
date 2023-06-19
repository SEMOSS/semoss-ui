module.exports = {
    name: 'Target Date Range',
    description: 'Add a target date range and label to your Gantt chart',
    icon: require('images/date-range.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'target-date-range',
        },
    },
    lazy: true,
};
