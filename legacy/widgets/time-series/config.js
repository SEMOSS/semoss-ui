module.exports = {
    name: 'Time Series',
    description: 'Add a time series to your visualization',
    icon: require('images/clock.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Time Series',
                description: 'Add a time series to your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"timeSeries":<!SMSS_SHARED_STATE.timeSeries>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.timeSeries");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
