module.exports = {
    name: 'Zoom X-Axis',
    description: 'Toggles zooming on the x-axis of your visualization',
    icon: require('images/toggle-zoom-x.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Zoom X-Axis',
                description:
                    'Toggles zooming on the x-axis of your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleZoomXEnabled":<!SMSS_SHARED_STATE.toggleZoomXEnabled>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleZoomXEnabled");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
