module.exports = {
    name: 'HeatMap',
    icon: require('images/heatmap.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['events', 'unfilter'],
    },
    content: {
        template: {
            name: 'heatmap-echarts',
        },
    },
    visualization: {
        type: ['echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'HeatMap',
        visibleModes: ['default-mode', 'comment-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'sort-values',
            'heatmap-legend',
            'font-settings',
            'color-scheme',
            'heat-range',
            'heatmap-square-size',
            'format-data-values',
            'edit-x-axis',
            'edit-y-axis',
            'edit-grid',
            'toggle-zoom-x',
            'toggle-zoom-y',
            'toggle-tooltips',
            'toggle-legend',
            'bucket',
            'fit-to-view',
            'fit-vertical',
            'fit-horizontal',
            'display-values',
            'reset-state',
            'events',
            'param',
            'purge',
            'refresh-cache',
            'chart-title',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Distribution',
        },
        format: 'table',
        fields: [
            {
                model: 'x',
                name: 'X-Axis',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Studio). The values of this dimension will represent the x-axis.',
            },
            {
                model: 'y',
                name: 'Y-Axis',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Release Month). The values of this dimension will represent the y-axis.',
            },
            {
                model: 'heat',
                name: 'Heat',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding one numerical dimension (i.e. Movie Budget). The values of this dimension will represent the heat color.',
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
        ],
        color: {
            value: {
                multiField: false,
                instances: false,
            },
            group: {
                multiField: true,
                instances: false,
            },
        },
    },
    tools: {
        heatmapWidth: '100%',
        heatmapHeight: '100%',
        squareHeight: 25,
        squareWidth: 25,
    },
    lazy: true,
};
