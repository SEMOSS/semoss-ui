module.exports = {
    name: 'Radial',
    description: 'Toggle between Orthogonal and Radial tree layout',
    icon: require('images/toggle-radial.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Radial',
                description: 'Toggle between Orthogonal and Radial tree layout',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleRadial":<!SMSS_SHARED_STATE.toggleRadial>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleRadial");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
