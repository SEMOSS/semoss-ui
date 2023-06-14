module.exports = {
    name: 'Box',
    icon: require('images/box.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['events', 'unfilter', 'color-by-value'],
    },
    content: {
        template: {
            name: 'boxwhisker-echarts',
        },
    },
    visualization: {
        type: ['echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'BoxWhisker',
        visibleModes: ['default-mode', 'comment-mode', 'brush-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'color-panel',
            'color-by-value',
            'sort-values',
            'flip-axis',
            'edit-x-axis',
            'edit-y-axis',
            'edit-grid',
            'format-data-values',
            'toggle-zoom-x',
            'toggle-zoom-y',
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
                name: 'X-Axis',
                acceptableTypes: ['STRING'],
                group: 'validate',
                optional: false,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Movie Genre). Each instance of this dimension will be shown on the x-axis.',
            },
            {
                model: 'value',
                name: 'Y-Axis',
                acceptableTypes: ['NUMBER'],
                optional: false,
                multiField: false,
                description:
                    'Try adding one numerical dimension (i.e. Movie Budget). The values of this dimension will be shown on the y-axis.',
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
