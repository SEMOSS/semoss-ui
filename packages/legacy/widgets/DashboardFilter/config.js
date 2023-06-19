module.exports = {
    name: 'DashboardFilter',
    icon: require('images/dashboardfilter.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'dashboard-filter-legacy',
        },
    },
    display: {
        position: 'inline',
    },
    lazy: true,
};
