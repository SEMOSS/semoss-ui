module.exports = {
    name: 'Filter',
    icon: require('images/dashboardfilter.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
    },
    content: {
        template: {
            name: 'dashboard-filter',
        },
    },
    dimensions: {
        template: {
            name: 'dashboard-filter-dimensions',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Filter',
        view: 'dashboard-filter',
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
