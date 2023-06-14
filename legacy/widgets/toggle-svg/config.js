module.exports = {
    name: 'Toggle SVG',
    description:
        'Renders the current Canvas visualization as an SVG Visualization',
    icon: require('images/toggle-svg.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: '',
                description: '',
                query: 'Panel(<SMSS_PANEL_ID>)|SetPanelView("visualization", "<encode>{"type":"standard"}</encode>");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
