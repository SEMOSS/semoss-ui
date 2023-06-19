module.exports = {
    name: 'Infographic',
    description: 'Dynamically display content in a panel',
    icon: require('images/infographic.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        hideHandles: ['filter'],
    },
    content: {
        template: {
            name: 'infographic',
            options: {},
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Other',
        view: 'visualization',
        layout: 'infographic',
        visibleModes: ['default-mode'],
        tools: [],
        showOnVisualPanel: false,
        fields: [],
        format: 'table',
        color: {},
    },
    lazy: true,
};
