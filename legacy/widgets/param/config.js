module.exports = {
    name: 'Show Parameters',
    description: 'Change your parameter for your insight and reload the visual',
    icon: require('images/list-o.svg'),
    widgetList: {
        showOn: 'all',
        showCondition: ['param'],
    },
    content: {
        template: {
            name: 'default-handle',
        },
    },
};
