module.exports = {
    name: 'Expand / Fit',
    description: 'Expand to prevent overlapping nodes or fit to panel size',
    icon: require('images/square-compass.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Expand / Fit',
                description: '',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"fitToView":<!SMSS_SHARED_STATE.fitToView>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.fitToView");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
