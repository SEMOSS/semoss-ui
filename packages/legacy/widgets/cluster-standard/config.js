module.exports = {
    name: 'Cluster',
    icon: require('images/cluster.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        hideHandles: [],
        quickMenu: ['events', 'color-by-value', 'infinite-viz'],
    },
    content: {
        template: {
            name: 'cluster-standard',
        },
    },
    visualization: {
        type: ['standard', 'echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Cluster',
        visibleModes: ['default-mode', 'brush-mode'],
        tools: [
            'custom-legend',
            'color-panel',
            'color-by-value',
            'toggle-tooltips',
            'filter',
            'unfilter',
            'reset-state',
            'events',
            'purge',
            'refresh-cache',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Distribution',
        },
        format: 'table',
        fields: [
            {
                model: 'cluster',
                name: 'Cluster',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: false,
                optional: false,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Movie Genre). Each instance of this dimension will represent its own cluster.',
            },
            {
                model: 'label',
                name: 'Label',
                acceptableTypes: ['NUMBER'],
                group: false,
                optional: false,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Movie Title). Each instance of this dimension will represent a point within its respective cluster.',
            },
            {
                model: 'tooltip',
                name: 'Tooltip',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: false,
                optional: true,
                multiField: true,
                description:
                    'Try adding one or several dimensions (i.e. Movie Budget). Each instance of this dimension will appear in the tooltip when hovering.',
            },
        ],
        color: {},
    },
    lazy: true,
};
