require('./default-handle.directive.js');

module.exports = {
    name: 'Default Handle',
    description: '',
    icon: require('images/file-code.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'default-handle',
            module: 'app.default-handle.directive',
        },
    },
    lazy: false,
};
