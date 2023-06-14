module.exports = {
    name: 'Force Variables',
    description: 'Customize the repulsion, gravity, and edge length',
    icon: require('images/repulsion.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'node-repulsion',
        },
    },
    lazy: true,
};
