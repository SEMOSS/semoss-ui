module.exports = {
    name: 'DashboardParam',
    icon: require('images/param.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
        hideHandles: ['filter'],
    },
    content: {
        template: {
            name: 'dashboard-param',
        },
    },
    visualization: {
        type: ['standard', 'echarts'],
        view: 'DashboardParam',
        layout: 'DashboardParam',
        visibleModes: ['default-mode'],
        tools: [],
        showOnVisualPanel: false,
        format: 'table',
        fields: [],
        color: {},
    },
    lazy: true,
};
