module.exports = {
    name: 'Bar Style',
    description: 'Customize the style of the bar',
    icon: require('images/bar-image.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'bar-image',
            options: {},
        },
    },
    lazy: true,
};
