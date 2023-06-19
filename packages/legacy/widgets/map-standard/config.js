module.exports = {
    name: 'Map',
    icon: require('images/map.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: [
            'events',
            'unfilter',
            'map-layer',
            'color-panel-mode',
            'color-by-value',
        ],
    },
    content: {
        template: {
            name: 'map-standard',
        },
    },
    visualization: {
        type: ['standard'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'Map',
        tools: [
            'custom-legend',
            'filter',
            'unfilter',
            'map-layer',
            'map-marker-size',
            'color-panel',
            'color-by-value',
            'toggle-legend',
            'toggle-tooltips',
            'reset-state',
            'events',
            'param',
            'purge',
            'refresh-cache',
            'format-data-values',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Map',
        },
        format: 'table',
        fields: [
            {
                model: 'label',
                name: 'Label',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multifield: false,
                description:
                    'Try adding one dimension (i.e. City Name). Each instnace of this dimension will represent a point on the map.',
            },
            {
                model: 'latitude',
                name: 'Latitude',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multifield: false,
                description:
                    'Each instance of the label dimension needs to be accompanied by a latitude and longitude to appear on the map.',
            },
            {
                model: 'longitude',
                name: 'Longitude',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Each instance of the label dimension needs to be accompanied by a latitude and longitude to appear on the map.',
            },
            {
                model: 'size',
                name: 'Size',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: true,
                multiField: false,
                description:
                    'Try adding one numerical dimension (i.e. City Population). This will represent the size of each point on the map.',
            },
            {
                model: 'color',
                name: 'Color',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'concat',
                optional: true,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Political Alignment). Each instance within this dimension will represent a color.',
            },
            {
                model: 'tooltip',
                name: 'Tooltip',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: true,
                multiField: true,
                description:
                    'Try adding one or several dimensions (i.e. Average Income). Each instance of this dimension will appear in the tooltip when hovering.',
            },
            {
                model: 'facet',
                name: 'Facet',
                acceptableTypes: ['STRING', 'DATE'],
                group: 'validate',
                optional: true,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Country). The data will be grouped by each instance of the selected dimension.',
            },
        ],
        color: {},
        layers: ['Map'],
    },
    tools: {
        colorByValue: false,
    },
    lazy: true,
};
