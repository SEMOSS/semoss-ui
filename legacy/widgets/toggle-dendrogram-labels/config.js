module.exports = {
    name: 'Toggle Labels',
    description: 'Hide/Show dendrogram labels',
    icon: require('images/toggle-dendrogram-labels.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Labels',
                description: 'Hide/Show dendrogram labels',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleDendrogramLabels":<!SMSS_SHARED_STATE.toggleDendrogramLabels>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleDendrogramLabels");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
