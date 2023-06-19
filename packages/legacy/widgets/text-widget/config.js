module.exports = {
    name: 'Text Widget',
    description: 'Develop a data backed freeform UI',
    icon: require('images/text-widget.svg'),
    widgetList: {
        tags: ['Visualization'],
        showOn: 'none',
    },
    content: {
        template: {
            name: 'text-widget',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        view: 'text-widget',
        layout: 'text-widget',
        visibleModes: ['default-mode'],
        tools: [],
        showOnVisualPanel: false,
        fields: [],
        format: 'table',
        color: {},
    },
    lazy: true,
};
