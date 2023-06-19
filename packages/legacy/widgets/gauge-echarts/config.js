module.exports = {
    name: 'Gauge',
    icon: require('images/gauge.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['events', 'time-series', 'toggle-axis-labels', 'unfilter'],
    },
    content: {
        template: {
            name: 'gauge-echarts',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Gauge',
        visibleModes: ['default-mode', 'comment-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'min-max',
            'format-data-values',
            'time-series',
            'toggle-axis-labels',
            'toggle-tooltips',
            'color-scheme',
            'param',
            'reset-state',
            'events',
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
                model: 'label',
                name: 'Label',
                acceptableTypes: ['STRING'],
                group: 'validate',
                optional: false,
                multifield: false,
                description:
                    'Try adding one categorical dimension (i.e. Movie Genre). Each instance of this dimension will represent a dial on the gauge.',
            },
            {
                model: 'value',
                name: 'Value',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding one numerical dimension (i.e. Movie Budget). The value of this dimension will determine the position of its respective dial.',
            },
            {
                model: 'tooltip',
                name: 'Tooltip',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'math',
                optional: true,
                multiField: true,
                description:
                    'Try adding one or several dimensions (i.e. Director). Each instance of this dimension will appear in the tooltip when hovering.',
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
