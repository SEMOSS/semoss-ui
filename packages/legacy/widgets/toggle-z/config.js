module.exports = {
    name: 'Z-Index Toggle',
    description: 'Toggles the z-axis on/off',
    icon: require('images/toggle-z.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Z-Index',
                description: 'Toggles off/on the z-axis',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleZ":<!SMSS_SHARED_STATE.toggleZ>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleZ");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
