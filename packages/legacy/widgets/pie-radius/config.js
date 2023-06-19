module.exports = {
    name: 'Pie Radius',
    description: 'Control the radius of the pie chart.',
    icon: require('images/radius.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'pie-radius',
        },
    },
    lazy: true,
};
