module.exports = {
    name: 'PolarBar',
    icon: require('images/polarbar.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['events', 'unfilter', 'color-panel-mode', 'color-by-value'],
    },
    content: {
        template: {
            name: 'polar-bar-echarts',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Polar',
        visibleModes: ['default-mode', 'comment-mode'],
        tools: [
            'legend-viz',
            'custom-legend',
            'filter',
            'unfilter',
            'color-panel',
            'sort-values',
            'min-max',
            'format-data-values',
            'toggle-x-label',
            //'toggle-legend',
            'toggle-tooltips',
            'toggle-stack',
            'toggle-polar-zoom',
            'toggle-shadow',
            'axis-pointer',
            'color-by-value',
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
                    'Try adding one categorical dimension (i.e. Movie Genre). Each instance within this dimension will appear on the radius-axis.',
            },
            {
                model: 'value',
                name: 'Value',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: true,
                description:
                    'Try adding one or several dimensions (i.e. Movie Budget). The numerical values of these dimensions will represent their respective column size.',
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
