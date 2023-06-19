module.exports = {
    name: 'Show Adjacent',
    description: 'Show adjacent nodes when hovering',
    icon: require('images/show-adjacent.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Show Adjacent',
                description: 'Show adjacent nodes when hovering',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"showAdjacent":<!SMSS_SHARED_STATE.showAdjacent>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.showAdjacent");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
