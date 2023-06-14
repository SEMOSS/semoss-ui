module.exports = {
    name: 'Toggle Colors',
    description: 'Cycles Through Custom Color Options',
    icon: require('images/painter-palette.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'color-panel-mode',
        },
    },
    lazy: true,
};
