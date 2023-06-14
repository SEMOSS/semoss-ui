module.exports = {
    name: 'Toggle Graph Table',
    description: 'Toggles the Graph Table',
    icon: require('images/list.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'graph-toggle-table',
        },
    },
    lazy: true,
};
