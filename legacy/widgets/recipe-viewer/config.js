module.exports = {
    name: 'Recipe Viewer',
    description: 'View and delete steps from your current recipe.',
    icon: require('images/file.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        template: {
            name: 'recipe-viewer',
        },
    },
    lazy: true,
};
