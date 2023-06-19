module.exports = {
    name: 'SingleAxisCluster',
    icon: require('images/singleaxiscluster.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
    },
    content: {
        template: {
            name: 'single-axis-echarts',
        },
    },
    visualization: {
        type: ['echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'SingleAxisCluster',
        visibleModes: ['default-mode', 'comment-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'color-panel',
            'color-by-value',
            'sort-values',
            'format-data-values',
            'edit-x-axis',
            'customize-bar-label',
            'toggle-tooltips',
            'reset-state',
            'events',
            'param',
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
                model: 'label',
                name: 'Label',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Movie Genre). Each instance within this dimension will represent a point on the plot.',
            },
            {
                model: 'x',
                name: 'X-Axis',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding one numerical dimension (i.e. Movie Budget). The values of this dimension will represent the x-axis.',
            },
            {
                model: 'size',
                name: 'Size',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: true,
                multiField: false,
                description:
                    'Try adding one numerical dimension (i.e. Movie Revenue). The values of this dimension will represent the size of their respective point on the plot.',
            },
            {
                model: 'facet',
                name: 'Facet',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: true,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Movie Rating). Each instance of this dimension will represent a new x-axis line.',
            },
            {
                model: 'tooltip',
                name: 'Tooltip',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'math',
                optional: true,
                multiField: true,
                description:
                    'Try adding one or several dimensions (i.e. Producer). Each instance of this dimension will appear in the tooltip when hovering',
            },
        ],
        color: {},
    },
    lazy: true,
};
