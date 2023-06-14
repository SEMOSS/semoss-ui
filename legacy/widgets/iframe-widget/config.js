module.exports = {
    name: 'Iframe',
    description: 'Load content from an external source into an Iframe',
    icon: require('images/htmlwidget.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
    },
    content: {
        template: {
            name: 'iframe-widget',
        },
    },
    dimensions: {
        template: {
            name: 'iframe-widget-dimensions',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Iframe',
        view: 'iframe-widget',
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
