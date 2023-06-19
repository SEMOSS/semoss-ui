module.exports = {
    name: 'Pivot Table Settings',
    description: 'Configure settings for Pivot Table',
    icon: require('images/grid-col-style.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'grid-pivot-style',
        },
    },
    lazy: true,
};
