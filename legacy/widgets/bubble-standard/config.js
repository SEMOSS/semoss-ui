module.exports = {
    name: 'Bubble',
    icon: require('images/bubble.svg'),
    widgetList: {
        tags: ['Visualization', 'JVChart'],
        showOn: 'none',
        hideHandles: [],
        quickMenu: ['events', 'unfilter', 'color-panel-mode', 'color-by-value'],
    },
    showOn: 'none',
    content: {
        template: {
            name: 'bubble-standard',
        },
    },
    visualization: {
        type: ['standard', 'echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Bubble',
        visibleModes: ['default-mode', 'comment-mode', 'edit-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'color-panel',
            'color-by-value',
            'toggle-legend',
            'display-values',
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
            USE: 'Comparison',
        },
        format: 'table',
        fields: [
            {
                model: 'label',
                name: 'Bubbles',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multifield: false,
                description:
                    'Try adding one dimension (i.e. Movie Genre). Each instance of this dimension will represent a bubble.',
            },
            {
                model: 'value',
                name: 'Size',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multifield: false,
                description:
                    'Try adding one numerical dimension (i.e. Movie Budget). The value of this dimension will represent the size of its respective bubble.',
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
    },
    lazy: true,
};
