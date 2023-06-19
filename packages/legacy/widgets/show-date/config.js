module.exports = {
    name: 'Toggle Todays Date',
    description: 'Toggles showing todays date on your gantt chart',
    icon: require('images/show-date.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Todays Date',
                description: 'Toggles showing todays date on your gantt chart',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"showDate":<!SMSS_SHARED_STATE.showDate>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.showDate");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
