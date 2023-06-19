module.exports = {
    name: 'Share Session',
    description: 'Share Session Dashboard or JDBC URLs',
    icon: require('images/share.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        template: {
            name: 'share-session',
        },
    },
    lazy: true,
};
