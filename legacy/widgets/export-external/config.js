module.exports = {
    name: 'Export to External',
    description: 'Export data into an external datasource',
    icon: require('images/external.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'export-external',
        },
    },
    lazy: true,
};
