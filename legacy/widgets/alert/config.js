module.exports = {
    name: 'Alert',
    description: 'View previous alert messages',
    icon: require('images/x-circle-closed.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        template: {
            name: 'alert',
        },
    },
    lazy: true,
};
