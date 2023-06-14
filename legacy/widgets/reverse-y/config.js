module.exports = {
    name: 'Reverse Y-Axis',
    description: 'Displays the Y Axis values in reverse order',
    icon: require('images/reverse-y.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Reverse Y-Axis',
                description: 'Displays the Y Axis values in reverse order',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"yReversed":<!SMSS_SHARED_STATE.yReversed>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.yReversed");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
