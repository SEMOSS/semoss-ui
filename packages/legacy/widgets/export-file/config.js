module.exports = {
    name: 'Export File',
    description: 'Export data into a file',
    icon: require('images/file.svg'),
    widgetList: {
        showOn: ['none'],
    },
    content: {
        template: {
            name: 'export-file',
        },
    },
    lazy: true,
};
