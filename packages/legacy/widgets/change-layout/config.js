module.exports = {
    name: 'Change Layout',
    description: 'Change the layout of your graph',
    icon: require('images/change-layout.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'change-layout',
        },
    },
    lazy: true,
};
