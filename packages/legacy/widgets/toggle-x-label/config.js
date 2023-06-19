module.exports = {
    name: 'Hide Axis Values',
    description: 'Hide/Show axis values',
    icon: require('images/toggle-x-label.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Hide Axis Values',
                description: 'Hide/Show axis values',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleXLabel":<!SMSS_SHARED_STATE.toggleXLabel>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleXLabel");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
