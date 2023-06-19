module.exports = {
    name: 'Color By Value',
    description: 'Color your visualization based on configurable rulesets',
    icon: require('images/color-by-value.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'color-by-value',
            object: {},
        },
    },
    lazy: true,
};
