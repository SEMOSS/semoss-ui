module.exports = {
    name: 'Load View Data',
    description: 'Load data into your view',
    icon: require('images/plus.svg'),
    widgetList: {
        showOn: ['Visualization'],
    },
    content: {
        template: {
            name: 'infinite-viz',
        },
    },
    lazy: true,
};
