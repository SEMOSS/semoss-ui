module.exports = {
    name: 'Area',
    icon: require('images/area.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: [
            'events',
            'unfilter',
            'color-panel-mode',
            'color-by-value',
            'toggle-zoom-x',
            'toggle-zoom-y',
            'flip-axis',
            'reverse-y',
            'toggle-trendline-mode',
            'infinite-viz',
        ],
    },
    content: {
        template: {
            name: 'area-echarts',
        },
    },
    visualization: {
        type: ['echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Area',
        visibleModes: ['default-mode', 'comment-mode'],
        tools: [
            'legend-viz',
            'custom-legend',
            'filter',
            'unfilter',
            'curve-type',
            'line-style-area',
            'display-values',
            'format-data-values',
            'customize-bar-label',
            'font-settings',
            'color-panel',
            'flip-axis',
            'flip-series',
            'reverse-y',
            'sort-values',
            'edit-x-axis',
            'edit-y-axis',
            'edit-grid',
            'mark-line',
            'mark-area',
            'toggle-extremes',
            'toggle-average',
            //'toggle-legend',
            'toggle-tooltips',
            'toggle-stack',
            'display-sum',
            'toggle-trendline',
            'toggle-zoom-x',
            'toggle-zoom-y',
            'save-data-zoom',
            'axis-pointer',
            'color-by-value',
            'facet-headers',
            'reset-state',
            'events',
            'param',
            'purge',
            'refresh-cache',
            'chart-title',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Trends',
        },
        format: 'table',
        fields: [
            {
                model: 'label',
                name: 'X-Axis',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: false,
                description:
                    'Try adding one categorical dimension (i.e. Movie Genre). Each instance within this dimension will appear on the x-axis.',
            },
            {
                model: 'value',
                name: 'Y-Axis',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: true,
                description:
                    'Try adding one or several numerical dimensions (i.e. Movie Budget). Each dimension will be represented by a colored area.',
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
        layers: ['Area', 'Column', 'Line'],
    },
    lazy: true,
};
