module.exports = {
    name: 'Color',
    description: 'Color your visualization',
    icon: require('images/painter-palette.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'color-panel',
        },
    },
    lazy: true,
};
