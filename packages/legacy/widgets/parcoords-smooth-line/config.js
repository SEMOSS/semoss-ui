module.exports = {
    name: 'Smooth Line',
    description: 'Make Lines Smoother',
    icon: require('images/line-curve.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'parcoords-smooth-line',
        },
    },
};
