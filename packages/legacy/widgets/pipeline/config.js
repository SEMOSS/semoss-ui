module.exports = {
    name: 'Pipeline',
    description: 'Extend current dataset',
    icon: require('images/database.svg'),
    widgetList: {
        showOn: 'all',
    },
    view: {
        template: {
            name: 'pipeline',
        },
    },
    lazy: true,
};
