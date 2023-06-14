module.exports = {
    name: 'Stack/Unstack',
    description: 'Stack items in your visualization',
    icon: require('images/toggle-stack.svg'),
    widgetList: {
        showOn: 'none',
        showCondition: ['multi-value-dimensions'],
    },
    content: {
        json: [
            {
                label: 'Stack/Unstack',
                description: 'Stack/Unstack items in your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleStack":<!SMSS_SHARED_STATE.toggleStack>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleStack");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
