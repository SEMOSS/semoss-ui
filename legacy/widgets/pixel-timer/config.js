module.exports = {
    name: 'Pixel Timer',
    description: 'Run a Pixel at a set interval',
    icon: require('images/stopwatch.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        template: {
            name: 'pixel-timer',
        },
    },
    lazy: true,
};
