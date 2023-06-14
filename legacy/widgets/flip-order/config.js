module.exports = {
    name: 'Flip Order',
    description: 'Toggle ascending / descending order',
    icon: require('images/flip-order.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Flip Order',
                description: 'Toggle ascending / descending order',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"flipOrder":<!SMSS_SHARED_STATE.flipOrder>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.flipOrder");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
