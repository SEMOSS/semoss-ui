module.exports = {
    name: 'Tooltip Null Values',
    description: 'Toggles null values in the tooltip on/off',
    icon: require('images/null.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Tooltip Null Values',
                description: 'Toggles null values in the tooltip on/off',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"showNullTooltips":<!SMSS_SHARED_STATE.showNullTooltips>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.showNullTooltips");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
