module.exports = {
    name: 'Freeze Motion',
    description: 'Freeze/Unfreeze graph motion',
    icon: require('images/toggle-lock.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Lock',
                description: 'Freeze/Unfreeze graph motion',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleLock":<!SMSS_SHARED_STATE.toggleLock>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleLock");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
