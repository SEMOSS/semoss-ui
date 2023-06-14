module.exports = {
    name: 'Toggle Canvas',
    description:
        'Renders the current SVG visualization as a Canvas Visualization',
    icon: require('images/toggle-canvas.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: '',
                description: '',
                query: 'Panel(<SMSS_PANEL_ID>)|SetPanelView("visualization", "<encode>{"type":"echarts"}</encode>");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
