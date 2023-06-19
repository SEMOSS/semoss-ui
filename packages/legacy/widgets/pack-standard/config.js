module.exports = {
    name: 'Pack',
    icon: require('images/pack.svg'),
    widgetList: {
        tags: ['Visualization', 'JVChart'],
        showOn: 'none',
        hideHandles: [],
        quickMenu: ['events', 'unfilter', 'color-panel-mode', 'color-by-value'],
    },
    content: {
        template: {
            name: 'pack-standard',
        },
    },
    visualization: {
        type: ['standard', 'echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Pack',
        visibleModes: ['default-mode', 'edit-mode', 'comment-mode'],
        tools: [
            'custom-legend',
            'display-values',
            'filter',
            'unfilter',
            'color-by-value',
            'color-panel',
            'format-data-values',
            'toggle-legend',
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
                model: 'group',
                name: 'Group',
                acceptableTypes: ['STRING'],
                group: 'validate',
                optional: false,
                multiField: true,
                description:
                    'Try adding one or several categorical dimensions (i.e. Movie Genre and Rating). Each instance of these dimensions will represent a circle within the pack.',
            },
            {
                model: 'value',
                name: 'Value',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding one numerical dimension (i.e. Movie Budget). The values of this dimension will represent the size of their respective circle.',
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
    lazy: true,
};
