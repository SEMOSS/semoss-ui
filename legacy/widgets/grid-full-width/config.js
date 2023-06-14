module.exports = {
    name: 'Full-width Grid',
    description: 'Auto sizes the columns to take the full width of the panel',
    icon: require('images/grid-full-width.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Full-width Grid',
                description:
                    'Auto sizes the columns to take the full width of the panel',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"gridFullWidth":<!SMSS_SHARED_STATE.gridFullWidth>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.gridFullWidth");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
