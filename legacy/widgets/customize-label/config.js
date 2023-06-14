module.exports = {
    name: 'Customize Label',
    description: 'Customize the labels on your visualization',
    icon: require('images/bookmark.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'customize-label',
        },
    },
    lazy: true,
};
