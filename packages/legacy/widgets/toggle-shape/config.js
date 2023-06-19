module.exports = {
    name: 'Shape Toggle',
    description: 'Toggle between Polygon and Circle shape of your radar',
    icon: require('images/toggle-shape.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Shape',
                description:
                    'Toggle between Polygon and Circle shape of your radar',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleShape":<!SMSS_SHARED_STATE.toggleShape>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleShape");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
