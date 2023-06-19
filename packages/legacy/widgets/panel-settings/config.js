module.exports = {
    name: 'Panel Settings',
    description: 'Edit settings for the panel',
    icon: require('images/gears.svg'),
    widgetList: {
        tags: [],
        showOn: 'none',
    },
    content: {
        template: {
            name: 'panel-settings',
            options: {},
        },
    },
    lazy: true,
};
