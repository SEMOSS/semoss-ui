module.exports = {
    name: 'Zoom Y-Axis',
    description: 'Toggles zooming on the y-axis of your visualization',
    icon: require('images/toggle-zoom-y.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Zoom Y-Axis',
                description:
                    'Toggles zooming on the y-axis of your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleZoomY":<!SMSS_SHARED_STATE.toggleZoomY>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleZoomY");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
