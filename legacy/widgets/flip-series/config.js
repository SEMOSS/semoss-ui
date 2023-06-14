module.exports = {
    name: 'Flip Series',
    description: 'Flips the series on the visualization',
    icon: require('images/flip.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Flip Series',
                description: 'Flips the series on the visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"seriesFlipped":<!SMSS_SHARED_STATE.seriesFlipped>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.seriesFlipped");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
