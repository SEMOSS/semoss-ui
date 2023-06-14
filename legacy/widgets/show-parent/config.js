module.exports = {
    name: 'Show Parent Relationships',
    description: 'Toggles showing parent relationships on your treemap',
    icon: require('images/show-parent.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Show Parent Relationships',
                description:
                    'Toggles showing parent relationships on your treemap',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"showParent":<!SMSS_SHARED_STATE.showParent>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.showParent");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
