module.exports = {
    name: 'Adjust Canvas Dimensions',
    description: 'Change height and width of the canvas',
    icon: require('images/adjust-canvas-dimensions.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'adjust-canvas-dimensions',
            options: {},
        },
    },
    lazy: true,
};
