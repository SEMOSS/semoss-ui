module.exports = {
    name: 'Show Direction',
    description: 'Toggle arrows to indicate direction',
    icon: require('images/show-direction.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Show Direction',
                description: 'Toggle arrows to indicate direction',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"showDirection":<!SMSS_SHARED_STATE.showDirection>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.showDirection");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
