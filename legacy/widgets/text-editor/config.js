module.exports = {
    name: 'Text Editor',
    description: 'Create static text component through an editor.',
    icon: require('images/text-widget.svg'),
    widgetList: {
        tags: [],
        showOn: 'none',
    },
    content: {
        template: {
            name: 'text-editor',
        },
    },
    visualization: {
        type: ['echarts', 'standard'],
        group: 'Other',
        view: 'text-editor',
        layout: '',
        visibleModes: ['default-mode'],
        tools: [],
        showOnVisualPanel: false,
        visualPanelMenu: {
            USE: 'Report Widgets',
        },
        fields: [],
        format: 'table',
        color: {},
    },
    lazy: true,
};
