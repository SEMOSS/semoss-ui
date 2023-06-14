module.exports = {
    name: 'Radial',
    icon: require('images/radial.svg'),
    widgetList: {
        tags: ['Visualization', 'JVChart'],
        showOn: 'none',
        hideHandles: [],
        quickMenu: ['events', 'unfilter', 'color-panel-mode', 'color-by-value'],
    },
    content: {
        template: {
            name: 'radial-standard',
        },
    },
    visualization: {
        type: ['standard', 'echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Radial',
        visibleModes: ['default-mode', 'edit-mode', 'comment-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'color-panel',
            'color-by-value',
            'format-data-values',
            'toggle-tooltips',
            'sort-values',
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
                    'Try adding one dimension (i.e. Movie Genre). Each instance within this dimension will represent a radial slice.',
            },
            {
                model: 'value',
                name: 'Value',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Movie Budget). The numerical value of this dimension will represent the size of its respective radial slice.',
            },
            {
                model: 'tooltip',
                name: 'Tooltip',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'concat',
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
                    'Try adding one dimension (i.e. Project Team). The data will be grouped by each instance of the selected dimension.',
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
