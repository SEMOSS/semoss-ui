module.exports = {
    name: 'Sankey',
    icon: require('images/sankey.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['events', 'unfilter', 'color-panel-mode', 'color-by-value'],
    },
    content: {
        template: {
            name: 'sankey-echarts',
        },
    },
    visualization: {
        type: ['echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Sankey',
        visibleModes: ['default-mode', 'comment-mode'],
        tools: [
            'custom-legend',
            'adjust-canvas-dimensions',
            'filter',
            'unfilter',
            'toggle-tooltips',
            'color-panel',
            'color-by-value',
            'reset-state',
            'events',
            'purge',
            'refresh-cache',
            'chart-title',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Pipeline',
        },
        format: 'table',
        fields: [
            {
                model: 'label',
                name: 'Label',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: true,
                description:
                    'Try adding two or more dimensions (i.e. Nominated and Movie Genre). The dimensions are linked to show their connection and flow.',
            },
            {
                model: 'value',
                name: 'Value',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding one numerical dimension (i.e. Movie Budget). The value of this dimension represents the size of its respective link between nodes.',
            },
            {
                model: 'tooltip',
                name: 'Tooltip',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'math',
                optional: true,
                multiField: true,
                description:
                    'Try adding one or several dimensions (i.e. Movie Revenue). Each instance of this dimension will appear in the tooltip when hovering.',
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
        color: {
            label: {
                multiField: true,
                instances: false,
            },
        },
    },
    lazy: true,
};
