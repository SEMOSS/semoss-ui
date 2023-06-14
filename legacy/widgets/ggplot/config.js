module.exports = {
    name: 'GGPlot',
    icon: require('images/ggplot.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        quickMenu: ['events', 'unfilter', 'infinite-viz'],
    },
    required: {
        R: [],
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
        layout: 'GGPlot',
        visibleModes: ['default-mode'],
        tools: ['filter', 'unfilter', 'events', 'purge', 'refresh-cache'],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'External Library',
        },
        format: 'ggplot',
        fields: [
            {
                model: 'selectors',
                name: 'Selectors',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: true,
                description: 'Selectors to be used for the ggplot.',
            },
            {
                model: 'ggplot',
                name: 'GGPlot',
                acceptableTypes: [],
                group: 'validate',
                type: 'input',
                placeholder:
                    'ggplot=["ggplot(plotterframe, aes(x=MovieBudget, y=Revenue_Domestic)) + geom_point()"], format=["jpeg"]',
                optional: false,
                multiField: false,
                description: 'Script to be used to generate a ggplot.',
            },
        ],
    },
    lazy: true,
};
