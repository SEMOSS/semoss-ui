module.exports = {
    name: 'Unfilter Insight',
    description: 'Removes the filter on an insight.',
    icon: require('images/unfilter.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            execute: 'auto',
            name: 'unfilter',
        },
    },
    lazy: true,
};
