module.exports = {
    name: 'Bullet',
    icon: require('images/bullet.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['unfilter', 'flip-axis'],
    },
    content: {
        template: {
            name: 'bullet-echarts',
        },
    },
    visualization: {
        type: ['echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Bullet',
        visibleModes: ['default-mode', 'comment-mode', 'polygon-brush-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'color-panel',
            'edit-x-axis',
            'edit-y-axis',
            'flip-axis',
            'format-data-values',
            'reverse-y',
            'sort-values',
            'edit-grid',
            'toggle-tooltips',
            'reset-state',
            'events',
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
                name: 'Value',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding a single numerical dimension. The numerical value of this dimensions will represent the respective height of the current value data quality bar.',
            },
            {
                model: 'targetValue',
                name: 'Target Value',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding a single numerical dimension. The numerical value of this dimensions will represent the ideal height for your value bar.',
            },
            {
                model: 'badMarker',
                name: 'Poor Data Indicator',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: true,
                multiField: false,
                description:
                    "Try adding a single numerical dimension. The numerical value of this dimensions will represent the respective height of the 'Bad' data quality bar.",
            },
            {
                model: 'satisfactoryMarker',
                name: 'Satisfactory Data Indicator',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: true,
                multiField: false,
                description:
                    "Try adding a single numerical dimension. The numerical value of this dimensions will represent the respective height of the 'Satisfactory' data quality bar.",
            },
            {
                model: 'excellentMarker',
                name: 'Excellent Data Indicator',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: true,
                multiField: false,
                description:
                    "Try adding a single numerical dimension. The numerical value of this dimensions will represent the respective height of the 'Excellent' data quality bar.",
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
