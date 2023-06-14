module.exports = {
    name: 'Quadrants Toggle',
    description: 'Toggles the line guide on/off',
    icon: require('images/eraser-blue.svg'),
    widgetList: {
        showOn: ['Scatter'],
    },
    content: {
        json: [
            {
                label: 'Toggle Quadrants',
                description: 'Toggles the line guide on and off',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"lineGuide":<!SMSS_SHARED_STATE.lineGuide>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.lineGuide");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
