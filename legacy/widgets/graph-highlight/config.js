module.exports = {
    name: 'Highlight',
    description: 'Highlights Nodes and Edges',
    icon: require('images/highlight.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'graph-highlight',
        },
    },
    lazy: true,
};
