module.exports = {
    name: 'Min-Max',
    description:
        'Toggles extreme value (max and min) markers on your visualization',
    icon: require('images/toggle-extremes.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Min-Max',
                description:
                    'Toggles extreme value (max and min) markers on your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleExtremes":<!SMSS_SHARED_STATE.toggleExtremes>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleExtremes");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
