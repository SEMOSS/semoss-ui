module.exports = {
    name: 'Custom Legend',
    description: 'Create a legend based on user input',
    icon: '',
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
    },
    content: {
        template: {
            name: 'legend-panel',
            options: {},
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        view: 'legend-panel',
        layout: 'legend-panel',
        visibleModes: ['default-mode'],
        tools: [],
        showOnVisualPanel: false,
        fields: [],
        format: 'table',
        color: {},
    },
    lazy: true,
};
