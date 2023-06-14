module.exports = {
    name: 'Toggle Axis Values',
    description: 'Hide/Show axis values',
    icon: require('images/toggle-axis-labels.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Axis Values',
                description: 'Hide/Show axis values',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleAxisLabels":<!SMSS_SHARED_STATE.toggleAxisLabels>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleAxisLabels");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
