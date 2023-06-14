module.exports = {
    name: 'HTML',
    description: 'Utilize HTML to create a custom view.',
    icon: require('images/htmlwidget.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
    },
    content: {
        template: {
            name: 'html-widget',
        },
    },
    dimensions: {
        template: {
            name: 'html-widget-dimensions',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Other',
        view: 'html-widget',
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
