module.exports = {
    name: 'Tooltips',
    description: 'Toggles the tooltips on/off',
    icon: require('images/toggle-tooltips.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Tooltips',
                description: 'Toggles the tooltips on/off',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"showTooltips":<!SMSS_SHARED_STATE.showTooltips>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.showTooltips");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
