module.exports = {
    name: 'Flip Axis',
    description: 'Flips the axis on the visualization',
    icon: require('images/flip.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Flip Axis',
                description: 'Flips the axis on the visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"rotateAxis":<!SMSS_SHARED_STATE.rotateAxis>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.rotateAxis");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
