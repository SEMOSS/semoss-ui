module.exports = {
    name: 'Shadow',
    description: 'Toggles shadow on your visualization',
    icon: require('images/toggle-shadow.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Shadow',
                description: 'Toggles shadow on your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleShadow":<!SMSS_SHARED_STATE.toggleShadow>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleShadow");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
