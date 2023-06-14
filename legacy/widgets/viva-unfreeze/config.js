module.exports = {
    name: 'Unfreeze Graph',
    description: 'Unreezes the Graph',
    icon: require('images/unlock.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'viva-unfreeze',
        },
    },
    lazy: true,
};
