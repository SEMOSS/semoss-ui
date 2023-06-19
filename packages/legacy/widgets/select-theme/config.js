module.exports = {
    name: 'Select Theme',
    description: 'Apply a theme to your dashboard.',
    icon: require('images/brush.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        template: {
            name: 'select-theme',
        },
    },
    lazy: true,
};
