module.exports = {
    name: 'Legend',
    description: 'Toggles the legend on/off',
    icon: require('images/toggle-legend.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Legend',
                description: 'Toggles the legend on/off',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleLegend":<!SMSS_SHARED_STATE.toggleLegend>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleLegend");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
