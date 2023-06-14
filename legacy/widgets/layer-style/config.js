module.exports = {
    name: 'Layer Style',
    description: 'Customize the look and feel of your selected map layer',
    icon: require('images/layer-style.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'layer-style',
            object: {},
        },
    },
    lazy: true,
};
