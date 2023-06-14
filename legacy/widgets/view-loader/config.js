module.exports = {
    name: 'ViewLoader',
    icon: require('images/file-image-o.svg'),
    widgetList: {
        tags: [
            // 'Visualization'
        ],
        showOn: 'none',
        quickMenu: ['events', 'unfilter', 'infinite-viz'],
    },
    content: {
        template: {
            name: 'view-loader',
        },
    },
    dimensions: {
        template: {
            name: 'visualization-dimensions',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'view-loader',
        visibleModes: ['default-mode'],
        tools: ['filter', 'unfilter', 'events', 'purge', 'refresh-cache'],
        showOnVisualPanel: false,
        format: 'view-loader',
        fields: [],
    },
    lazy: true,
};
