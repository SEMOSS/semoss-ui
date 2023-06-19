module.exports = {
    name: 'Toggle Trendline',
    description: 'Cycles Through Trendline Options',
    icon: require('images/toggle-trendline.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'toggle-trendline-mode',
        },
    },
    lazy: true,
};
