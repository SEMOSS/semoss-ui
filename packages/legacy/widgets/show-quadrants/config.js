module.exports = {
    name: 'Quadrants',
    description: 'Toggles the quadrants on and off',
    icon: require('images/show-quadrants.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Quadrants',
                description: 'Toggles the quadrants on and off',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"showQuadrants":<!SMSS_SHARED_STATE.showQuadrants>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.showQuadrants");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
