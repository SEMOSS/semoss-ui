module.exports = {
    name: 'Show Heat',
    description: 'Add heat color to your chart',
    icon: require('images/show-heat.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Show Heat',
                description: 'Add heat color to your chart',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"showHeat":<!SMSS_SHARED_STATE.showHeat>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.showHeat");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
