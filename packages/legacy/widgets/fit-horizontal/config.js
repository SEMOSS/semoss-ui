module.exports = {
    name: 'Fit Horizontal',
    description:
        'Resizes the visualization to fit all horizontal labels to screen',
    icon: require('images/horizontal.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Expand / Fit',
                description: '',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"widthFitToScreen":<!SMSS_SHARED_STATE.widthFitToScreen>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.widthFitToScreen");',
                params: [],
                execute: 'auto',
            },
        ],
    },
    lazy: true,
};
