module.exports = {
    name: 'ParallelCoordinates',
    icon: require('images/parallelcoordinate.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['events', 'unfilter'],
    },
    content: {
        template: {
            name: 'parallel-coordinates-echarts',
        },
    },
    visualization: {
        type: ['echarts'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'ParallelCoordinates',
        visibleModes: ['default-mode', 'comment-mode'],
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'fit-horizontal',
            'fit-vertical',
            'parcoords-add-count',
            'parcoords-add-filter',
            'parcoords-clear-filter',
            'flip-axis',
            'toggle-legend',
            'color-panel',
            'reset-state',
            'events',
            'param',
            'purge',
            'refresh-cache',
            'format-data-values',
            'chart-title',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Connections',
        },
        format: 'table',
        fields: [
            {
                model: 'dimension',
                name: 'Dimension',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: false,
                optional: false,
                multiField: true,
                description:
                    'Try adding two or more dimensions (i.e. Movie Budget and Revenue). Each dimension will represent a vertical line.',
            },
            {
                model: 'series',
                name: 'Series',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: false,
                optional: true,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Movie Genre). Each instnane of this dimension will represent a different color. This dimension will also represent a new vertical line.',
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
        color: {},
    },
    tools: {
        widthFitToScreen: false,
        heightFitToScreen: false,
        count: false,
        smoothLine: false,
    },
    state: {
        overlapRelated: '',
    },
    lazy: true,
};
