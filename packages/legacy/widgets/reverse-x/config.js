module.exports = {
    name: 'Reverse X-Axis',
    description: 'Displays the X Axis values in reverse order',
    icon: require('images/reverse-x.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Reverse X-Axis',
                description: 'Displays the X Axis values in reverse order',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"xReversed":<!SMSS_SHARED_STATE.xReversed>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.xReversed");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
