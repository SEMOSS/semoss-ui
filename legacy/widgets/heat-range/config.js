module.exports = {
    name: 'Heat Range',
    description: 'Edit the minimum and maximum values for the heat range.',
    icon: require('images/flame.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'heat-range',
        },
    },
    lazy: true,
};
