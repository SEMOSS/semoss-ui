module.exports = {
    name: 'Sort Values',
    description:
        'Sorts the values of a visualization in either ascending or descending order',
    icon: require('images/sort-desc.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'sort-values',
        },
    },
    lazy: true,
};
