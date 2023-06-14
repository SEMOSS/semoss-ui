module.exports = {
    name: 'Add Count',
    description: 'Adds Count Axis',
    icon: require('images/plus-circle.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'parcoords-add-count',
        },
    },
    lazy: true,
};
