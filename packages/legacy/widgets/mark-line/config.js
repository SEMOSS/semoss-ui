module.exports = {
    name: 'Target Line',
    description: 'Add multiple target lines to your visualization',
    icon: require('images/target.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'mark-line',
            object: {},
        },
    },
    lazy: true,
};
