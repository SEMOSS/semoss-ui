module.exports = {
    name: 'Seaborn',
    icon: require('images/seaborn.svg'),
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
            name: 'view-loader',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Other',
        view: 'visualization',
        layout: 'Seaborn',
        visibleModes: ['default-mode'],
        tools: ['filter', 'unfilter', 'events', 'purge', 'refresh-cache'],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'External Library',
        },
        format: 'seaborn',
        fields: [
            {
                model: 'selectors',
                name: 'Selectors',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: true,
                description: 'Selectors to be used for seaborn.',
            },
            {
                model: 'seaborn',
                name: 'Seaborn',
                acceptableTypes: [],
                group: 'validate',
                type: 'input',
                placeholder:
                    "splot=[\"x='MovieBudget', y='Revenue_Domestic', hue='Nominated', style='Genre', data=plotterFrame\"]",
                optional: false,
                multiField: false,
                description: 'Script to be used to generate seaborn.',
            },
        ],
    },
    lazy: true,
};
