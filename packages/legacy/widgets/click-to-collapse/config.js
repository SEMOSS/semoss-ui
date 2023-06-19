module.exports = {
    name: 'Click to Collapse',
    description: 'Toggle default click event to collapse/expand children nodes',
    icon: require('images/click-to-collapse.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Click to Collapse',
                description: 'widgets/click-to-collapse/click-to-collapse.svg',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"clickToCollapse":<!SMSS_SHARED_STATE.clickToCollapse>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.clickToCollapse");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
