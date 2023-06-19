module.exports = {
    name: 'Funnel',
    icon: require('images/funnel.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['events', 'unfilter', 'color-panel-mode', 'color-by-value'],
    },
    content: {
        template: {
            name: 'funnel-echarts',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Funnel',
        visibleModes: ['default-mode', 'comment-mode'],
        tools: [
            'legend-viz',
            'custom-legend',
            'filter',
            'unfilter',
            'color-panel',
            //'toggle-legend',
            'toggle-tooltips',
            'display-values',
            'format-data-values',
            'customize-funnel-label',
            'toggle-shadow',
            'bucket',
            'flip-order',
            'change-alignment',
            'color-by-value',
            'facet-headers',
            'reset-state',
            'events',
            'purge',
            'refresh-cache',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Pipeline',
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
                    'Try adding one dimension (i.e. Movie Genre). Each instance of this dimension will represent a section in the funnel.',
            },
            {
                model: 'value',
                name: 'Value',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding one numerical dimension (i.e. Movie Budget).  The value of this dimension will represent the size of its respective section.',
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
        color: {
            label: {
                multiField: true,
                instances: true,
            },
        },
    },
    lazy: true,
};
