module.exports = {
    name: 'Sort',
    description: 'Toggle between ascending and descending order',
    icon: require('images/sort-sunburst.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Sort',
                description: 'Toggle between ascending and descending order',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"sortSunburst":<!SMSS_SHARED_STATE.sortSunburst>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.sortSunburst");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
