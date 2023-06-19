module.exports = {
    name: 'Pivot Table',
    icon: require('images/pivottable.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['events', 'unfilter', 'infinite-viz'],
    },
    required: {
        PY: [],
    },
    content: {
        template: {
            name: 'grid-pivot',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Other',
        view: 'visualization',
        layout: 'PivotTable',
        visibleModes: ['default-mode'],
        tools: [
            'filter',
            'format-data-values',
            'grid-pivot-style',
            'unfilter',
            'events',
            'purge',
            'refresh-cache',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Metrics',
        },
        format: 'pivot',
        fields: [
            {
                model: 'rows',
                name: 'Rows',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: true,
                description:
                    'One or more dimensions to be plotted on the rows of the pivot table.',
            },
            {
                model: 'columns',
                name: 'Columns',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: true,
                multiField: true,
                description:
                    'One or more dimensions to be plotted on the column of the pivot table.',
            },
            {
                model: 'calculations',
                name: 'Calculations',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: true,
                description:
                    'One or more summary calculations to use to calculate the values of the cells in the pivot table.',
            },
            {
                model: 'sections',
                name: 'Sections',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: true,
                multiField: false,
                description: 'Column to break into multiple pivot tables.',
            },
            {
                model: 'optional',
                name: 'Optional Columns',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: true,
                multiField: true,
                description:
                    'Additional columns to be added when exported in a report.',
            },
        ],
    },
    lazy: true,
};
