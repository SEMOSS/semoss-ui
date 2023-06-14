module.exports = {
    name: 'KPI Settings',
    description: 'Configure settings for a KPI',
    icon: require('images/font.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'kpi-settings',
        },
    },
    lazy: true,
};
