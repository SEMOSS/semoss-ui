module.exports = {
    name: 'Button',
    icon: require('images/button.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
    },
    content: {
        template: {
            name: 'dashboard-button',
        },
    },
    dimensions: {
        template: {
            name: 'dashboard-button-dimensions',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Button',
        view: 'dashboard-button',
        layout: '',
        visibleModes: ['default-mode'],
        tools: [],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Report Widgets',
        },
        fields: [],
        format: 'table',
        color: {},
    },
    lazy: true,
};
