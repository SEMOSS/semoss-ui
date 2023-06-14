module.exports = {
    name: 'Refresh Recipe',
    description: 'Delete the cache and refresh the recipe',
    icon: require('images/refresh.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        template: {
            name: 'refresh-cache',
            execute: 'auto',
        },
    },
    lazy: true,
};
