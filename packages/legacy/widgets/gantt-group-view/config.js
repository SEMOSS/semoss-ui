module.exports = {
    name: 'Toggle Group View',
    description:
        'Toggles between group view and individual task view if group dimension exists',
    icon: require('images/gantt-group-view.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Group View',
                description:
                    'Toggles between group view and individual task view if group dimension exists',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"ganttGroupView":<!SMSS_SHARED_STATE.ganttGroupView>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.ganttGroupView");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
