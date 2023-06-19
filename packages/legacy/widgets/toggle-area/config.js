module.exports = {
    name: 'Area Toggle',
    description: 'Toggle area color fill of your radar',
    icon: require('images/toggle-area.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Area',
                description: 'Toggle area color fill of your radar',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleArea":<!SMSS_SHARED_STATE.toggleArea>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleArea");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
