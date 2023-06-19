module.exports = {
    name: 'Events',
    description: 'Add an event to the visualization',
    icon: require('images/events.svg'),
    widgetList: {
        showOn: ['Visualization'],
    },
    content: {
        template: {
            name: 'events',
        },
    },
    lazy: true,
};
