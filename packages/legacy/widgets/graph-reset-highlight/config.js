module.exports = {
    name: 'Reset Highlight',
    description: 'Clears the Graph Highlight',
    icon: require('images/reset.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'graph-reset-highlight',
        },
    },
    lazy: true,
};
