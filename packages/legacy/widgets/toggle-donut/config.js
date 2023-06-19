module.exports = {
    name: 'Donut',
    description: 'Toggle to and from a donut chart',
    icon: require('images/toggle-donut.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Donut',
                description: 'Toggle to and from a donut chart',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleDonut":<!SMSS_SHARED_STATE.toggleDonut>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleDonut");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
