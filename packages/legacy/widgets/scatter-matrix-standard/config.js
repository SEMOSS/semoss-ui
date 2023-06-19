module.exports = {
    name: 'ScatterplotMatrix',
    icon: require('images/scatterplotmatrix.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['events', 'unfilter', 'color-by-value'],
    },
    content: {
        template: {
            name: 'scatter-matrix-standard',
        },
    },
    visualization: {
        type: ['standard', 'echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'ScatterplotMatrix',
        visibleModes: ['default-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'color-panel',
            'color-by-value',
            'sort-values',
            'events',
            'param',
            'purge',
            'reset-state',
            'refresh-cache',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Distribution',
        },
        format: 'table',
        fields: [
            {
                model: 'dimension',
                name: 'Dimension',
                acceptableTypes: ['NUMBER'],
                optional: false,
                multiField: true,
                description:
                    'Try adding two or more numerical dimensions (i.e. Movie Budget and Revenue). Each dimension will represent the x and y-axis on different plots.',
            },
            {
                model: 'facet',
                name: 'Facet',
                acceptableTypes: ['STRING', 'DATE'],
                group: 'validate',
                optional: true,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Project Team). The data will be grouped by each instance of the selected dimension.',
            },
        ],
        color: {},
    },
    lazy: true,
};
