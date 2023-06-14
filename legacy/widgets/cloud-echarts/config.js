module.exports = {
    name: 'Cloud',
    icon: require('images/word-cloud.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['events', 'unfilter', 'color-panel-mode', 'color-by-value'],
    },
    content: {
        template: {
            name: 'cloud-echarts',
        },
    },
    visualization: {
        type: ['echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Cloud',
        visibleModes: ['default-mode', 'comment-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'color-panel',
            'color-by-value',
            'format-data-values',
            'toggle-tooltips',
            'reset-state',
            'events',
            'param',
            'purge',
            'refresh-cache',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Words',
        },
        format: 'table',
        fields: [
            {
                model: 'label',
                name: 'Words',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Movie Studio). The value of each instance of this dimension will be displayed in the cloud.',
            },
            {
                model: 'value',
                name: 'Size',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding one numerical dimension (i.e. Movie Budget). This represents the size of its respective label.',
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
            value: {
                multiField: true,
                instances: false,
            },
        },
    },
    lazy: true,
};
