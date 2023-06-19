module.exports = {
    name: 'Remove Drill Down',
    description: 'Removes Drilled Down Selection',
    icon: require('images/filter-blue.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'parcoords-clear-filter',
        },
    },
    lazy: true,
};
