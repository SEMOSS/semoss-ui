module.exports = {
    name: 'Grid',
    description: 'Toggles the grid on/off',
    icon: require('images/toggle-grid.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Grid',
                description: 'Toggles the grid on/off',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleGrid":<!SMSS_SHARED_STATE.toggleGrid>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleGrid");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
