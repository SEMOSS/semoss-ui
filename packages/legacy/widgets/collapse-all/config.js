module.exports = {
    name: 'Collapse All',
    description: 'Collapse/Expand all nodes',
    icon: require('images/minus-circle.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Collapse All',
                description: 'Collapse/Expand all nodes',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"collapseAll":<!SMSS_SHARED_STATE.collapseAll>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.collapseAll");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
