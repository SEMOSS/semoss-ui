module.exports = {
    name: 'Sunburst',
    icon: require('images/sunburst.svg'),
    widgetList: {
        tags: ['Visualization', 'JVChart'],
        showOn: 'none',
        hideHandles: [],
        quickMenu: ['events', 'unfilter', 'color-by-value', 'color-panel-mode'],
    },
    content: {
        template: {
            name: 'sunburst-standard',
        },
    },
    visualization: {
        type: ['standard'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Sunburst',
        visibleModes: ['default-mode', 'edit-mode', 'comment-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'color-panel',
            'color-by-value',
            'display-values',
            'format-data-values',
            'sort-values',
            'toggle-canvas',
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
                model: 'group',
                name: 'Group',
                acceptableTypes: ['STRING'],
                group: 'validate',
                optional: false,
                multiField: true,
                description:
                    'Try adding categorical dimensions (i.e. Nominated and Movie Genre). Each dimension will represent a new ring of the sunburst.',
            },
            {
                model: 'value',
                name: 'Value',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding one numerical dimension (i.e. Count of Movie Title). This will represent the section size of its respectice instance.',
            },
        ],
        color: {
            group: {
                multiField: true,
                instances: true,
            },
        },
    },
    lazy: true,
};
