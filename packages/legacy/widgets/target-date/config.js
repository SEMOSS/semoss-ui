module.exports = {
    name: 'Target Date',
    description: 'Add a target date line and label to your gantt chart',
    icon: require('images/target.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'target-date',
        },
    },
    lazy: true,
};
