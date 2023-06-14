module.exports = {
    name: 'Legend',
    description: 'Customize and toggle the legend on/off',
    icon: require('images/toggle-legend.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'legend-viz',
        },
    },
    lazy: true,
};
