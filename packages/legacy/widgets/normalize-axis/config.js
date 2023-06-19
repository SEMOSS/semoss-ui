module.exports = {
    name: 'Normalize Axes',
    description: 'Use a common axis for all values',
    icon: require('images/axis.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Area',
                description: 'Toggle area color fill of your radar',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"normalizeAxis":<!SMSS_SHARED_STATE.normalizeAxis>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.normalizeAxis");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
