module.exports = {
    name: 'Toggle Rose',
    description: 'Cycles Through Rose Options',
    icon: require('images/rose.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'rose-mode',
        },
    },
    lazy: true,
};
