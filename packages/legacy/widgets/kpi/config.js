module.exports = {
    name: 'KPI',
    icon: require('images/kpi.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        hideHandles: [],
        quickMenu: ['events', 'color-by-value', 'infinite-viz'],
    },
    content: {
        template: {
            name: 'kpi',
        },
    },
    visualization: {
        type: ['standard', 'echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'KPI',
        visibleModes: ['default-mode'],
        tools: [
            'kpi-settings',
            'format-data-values',
            'color-by-value',
            'color-panel',
            'filter',
            'unfilter',
            'reset-state',
            'purge',
            'refresh-cache',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Metrics',
        },
        format: 'table',
        fields: [
            {
                model: 'dimension',
                name: 'Dimension',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: true,
                description: 'Add a dimension to create a KPI.',
            },
            {
                model: 'facet',
                name: 'Facet',
                acceptableTypes: ['STRING', 'DATE'],
                group: 'validate',
                optional: true,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Nominated). The data will be grouped by each instance of the selected dimension.',
            },
        ],
        color: {},
    },
    lazy: true,
};
