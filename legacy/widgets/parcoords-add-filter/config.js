module.exports = {
    name: 'Drill Down',
    description: 'Filters on Brushed Area of Parcoords',
    icon: require('images/filter-blue.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'parcoords-add-filter',
        },
    },
    lazy: true,
};
