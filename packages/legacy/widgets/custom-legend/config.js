module.exports = {
    name: 'Custom Legend',
    description: 'Create A Custom Legend',
    icon: require('images/check.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'custom-legend',
        },
    },
    lazy: true,
};
