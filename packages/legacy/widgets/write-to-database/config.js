module.exports = {
    name: 'Write to Database',
    description: 'Save the data into a database table',
    icon: require('images/database.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'write-to-database',
        },
    },
    lazy: true,
};
