module.exports = {
    name: 'Traverse',
    description:
        'Traverse your data set from a selected node or category of nodes',
    icon: require('images/link.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'traverse',
        },
    },
    lazy: true,
};
