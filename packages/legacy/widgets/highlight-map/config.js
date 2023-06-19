module.exports = {
    name: 'Highlight Map',
    description: 'Highlight the top values on your map',
    icon: require('images/lightbulb.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'highlight-map',
        },
    },
    lazy: true,
};
