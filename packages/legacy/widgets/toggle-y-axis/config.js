module.exports = {
    name: 'Toggle Y Axis',
    description: 'Shows or hides the Y-Axis',
    icon: require('images/toggle-y-axis.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Y Axis',
                description: 'Shows or hides the Y-Axis',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleYAxis":<!SMSS_SHARED_STATE.toggleYAxis>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleYAxis");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
