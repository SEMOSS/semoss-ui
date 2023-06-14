module.exports = {
    name: 'Dashboard Assistant',
    description: 'Show the dashboard assistant',
    icon: require('images/search-analytics.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'dashboard-assistant',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Assistant',
        view: 'dashboard-assistant',
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
