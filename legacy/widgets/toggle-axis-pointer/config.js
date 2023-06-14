module.exports = {
    name: 'Axis Pointer Toggle',
    description: 'Toggles axis pointer on your visualization',
    icon: require('images/axis-pointer.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Axis Pointer',
                description: 'Toggles axis pointer on your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleAxisPointer":<!SMSS_SHARED_STATE.toggleAxisPointer>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleAxisPointer");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
