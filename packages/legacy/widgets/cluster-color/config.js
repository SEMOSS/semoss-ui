module.exports = {
    name: 'Cluster',
    description: 'Cluster graph by color',
    icon: require('images/cluster-color.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        Frame: ['GRAPH'],
    },
    content: {
        template: {
            name: 'cluster-color',
        },
    },
    lazy: true,
};
