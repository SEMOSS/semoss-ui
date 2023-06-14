module.exports = {
    name: 'Unfilter',
    description: 'Unfilter the sheet.',
    icon: require('images/dashboardunfilter.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'dashboard-unfilter',
        },
    },
    dimensions: {
        template: {
            name: 'dashboard-unfilter-dimensions',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Filter',
        view: 'dashboard-unfilter',
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
