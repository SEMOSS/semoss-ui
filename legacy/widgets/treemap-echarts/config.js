module.exports = {
    name: 'TreeMap',
    icon: require('images/treemap.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: [
            'events',
            'color-by-value',
            'color-panel-mode',
            'show-parent',
            'infinite-viz',
        ],
    },
    content: {
        template: {
            name: 'treemap-echarts',
        },
    },
    visualization: {
        type: ['echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'TreeMap',
        visibleModes: ['zoom-mode', 'default-mode', 'comment-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'color-by-value',
            'format-data-values',
            'color-panel',
            'show-parent',
            'toggle-tooltips',
            'reset-state',
            'events',
            'param',
            'purge',
            'refresh-cache',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Part-to-whole',
        },
        initialMode: 'zoom-mode',
        format: 'table',
        fields: [
            {
                model: 'series',
                name: 'Series',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Movie Genre). Each instnace of this dimension will represent a different colored group within the treemap.',
            },
            {
                model: 'label',
                name: 'Label',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Movie Title). Each instnace of this dimension will represent a box within its respective group.',
            },
            {
                model: 'size',
                name: 'Size',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding one numerical dimension (i.e. Movie Budget). The numerical value of this dimension represents the size of each box.',
            },
            {
                model: 'tooltip',
                name: 'Tooltip',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'math',
                optional: true,
                multiField: true,
                description:
                    'Try adding one or several dimensions (i.e. Producer). Each instance of this dimension will appear in the tooltip when hovering.',
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
            series: {
                multiField: false,
                instances: true,
            },
        },
    },
    lazy: true,
};
