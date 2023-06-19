module.exports = {
    name: 'Customize Label',
    description: 'Customize the labels on your graph',
    icon: require('images/bookmark.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'customize-graph-label',
        },
    },
    lazy: true,
};
