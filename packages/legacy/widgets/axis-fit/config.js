module.exports = {
    name: 'Axis Fit',
    description: 'Set minimum value of X and Y-axis to 0',
    icon: require('images/axis-fit.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Axis Fit',
                description: 'Set minimum value of X and Y-axis to 0',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"axisFit":<!SMSS_SHARED_STATE.axisFit>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.axisFit");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
