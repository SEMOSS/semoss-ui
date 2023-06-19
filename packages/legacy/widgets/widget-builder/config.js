module.exports = {
    name: 'Widget Builder',
    description: 'Build and save a widget',
    icon: require('images/file-code.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        template: {
            name: 'widget-builder',
        },
    },
    lazy: true,
};
