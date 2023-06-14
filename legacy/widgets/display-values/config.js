module.exports = {
    name: 'Display Value Labels',
    description: 'Displays the value labels of the visualization',
    icon: require('images/font.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Display Value Labels',
                description: 'Displays the value labels of the visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"displayValues":<!SMSS_SHARED_STATE.displayValues>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.displayValues");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
