module.exports = {
    name: 'Average',
    description: 'Toggles average line on your visualization',
    icon: require('images/toggle-average.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Average',
                description: 'Toggles average line on your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleAverage":<!SMSS_SHARED_STATE.toggleAverage>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleAverage");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
