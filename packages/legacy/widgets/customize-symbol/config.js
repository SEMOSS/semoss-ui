module.exports = {
    name: 'Customize Symbol',
    description: 'Customize the node symbol of your graph',
    icon: require('images/customize-symbol.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'customize-symbol',
            options: {},
        },
    },
    lazy: true,
};
