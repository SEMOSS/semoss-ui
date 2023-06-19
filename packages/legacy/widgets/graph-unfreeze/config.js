module.exports = {
    name: 'Unfreeze Graph',
    description: 'Unfreezes the Graph',
    icon: require('images/unlock.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'graph-unfreeze',
        },
    },
    lazy: true,
};
