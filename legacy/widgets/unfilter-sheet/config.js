module.exports = {
    name: 'Unfilter',
    description: 'Unfilter the sheet.',
    icon: require('images/unfilter.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'unfilter-sheet',
        },
    },
    lazy: true,
};
