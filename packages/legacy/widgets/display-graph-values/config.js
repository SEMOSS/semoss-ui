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
                description: 'Toggle the labels on your graph',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"displayGraphValues":<!SMSS_SHARED_STATE.displayGraphValues>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.displayGraphValues");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
