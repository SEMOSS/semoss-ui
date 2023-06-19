module.exports = {
    name: 'Target Area',
    description: 'Add multiple target areas to your visualization',
    icon: require('images/target.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'mark-area',
            object: {},
        },
    },
    lazy: true,
};
