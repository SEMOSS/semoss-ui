module.exports = {
    name: 'Reset Visualization',
    description: 'Resets the state of the current visualization',
    icon: require('images/undo.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        template: {
            name: 'reset-state',
            execute: 'auto',
        },
    },
    lazy: true,
};
