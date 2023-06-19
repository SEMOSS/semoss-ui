module.exports = {
    name: 'Show New Column',
    description: 'Shows the new column for formula entry on the Grid',
    icon: require('images/show-new-column.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Show New Column',
                description:
                    'Shows the new column for formula entry on the Grid',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"showNewColumn":<!SMSS_SHARED_STATE.showNewColumn>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.showNewColumn");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
