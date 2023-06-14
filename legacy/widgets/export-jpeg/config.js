module.exports = {
    name: 'JPEG Export',
    icon: require('images/file-image-o.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'export-jpeg',
        },
    },
    lazy: true,
};
