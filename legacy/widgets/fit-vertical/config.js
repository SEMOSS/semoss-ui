module.exports = {
    name: 'Fit Vertical',
    description:
        'Resizes the visualization to fit all vertical labels to screen',
    icon: require('images/vertical.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Expand / Fit',
                description: '',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"heightFitToScreen":<!SMSS_SHARED_STATE.heightFitToScreen>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.heightFitToScreen");',
                params: [],
                execute: 'auto',
            },
        ],
    },
    lazy: true,
};
