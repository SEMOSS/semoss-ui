module.exports = {
    name: 'Min/Max',
    description: 'Edit the minimum and maximum value for the axis.',
    icon: require('images/45-deg-angle.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'min-max',
        },
    },
    lazy: true,
};
