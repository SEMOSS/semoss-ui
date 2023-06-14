module.exports = {
    name: 'SVG Export',
    icon: require('images/file-image-o.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'export-svg',
        },
    },
    lazy: true,
};
