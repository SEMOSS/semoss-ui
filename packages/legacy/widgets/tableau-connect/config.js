module.exports = {
    name: 'Connect to Tableau',
    icon: require('images/horizontal.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'tableau-connect',
        },
    },
    lazy: true,
};
