module.exports = {
    name: 'Radar',
    icon: require('images/radar.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['events', 'unfilter', 'color-panel-mode', 'color-by-value'],
    },
    content: {
        template: {
            name: 'radar-echarts',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Radar',
        visibleModes: ['default-mode', 'comment-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'display-values',
            'format-data-values',
            'toggle-legend',
            'toggle-tooltips',
            'toggle-shape',
            'toggle-area',
            'normalize-axis',
            'color-by-value',
            'color-panel',
            'reset-state',
            'events',
            'purge',
            'refresh-cache',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Comparison',
        },
        format: 'table',
        fields: [
            {
                model: 'label',
                name: 'Dimensions',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Movie Genre). Each instance of this dimension will represent a colored line in the radar.',
            },
            {
                model: 'value',
                name: 'Value',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: true,
                description:
                    'Try adding three or more numerical dimensions (i.e. Movie Budget, Revenue, and IMBD Score). Each dimension will represent a scale on the radar.',
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
        color: {
            label: {
                multiField: false,
                instances: true,
            },
        },
    },
    lazy: true,
};
