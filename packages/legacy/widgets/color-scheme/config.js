module.exports = {
    name: 'Color Scheme',
    description: 'Choose the color scheme for the visualization',
    icon: require('images/painter-palette.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'color-scheme',
        },
    },
    lazy: true,
};
