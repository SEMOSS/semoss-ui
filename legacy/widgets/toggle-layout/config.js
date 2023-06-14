module.exports = {
    name: 'Circular',
    description: 'Toggle between Force and Circular graph layout',
    icon: require('images/toggle-layout.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Circular',
                description: 'Toggle between Force and Circular graph layout',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleLayout":<!SMSS_SHARED_STATE.toggleLayout>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleLayout");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
