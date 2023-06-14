module.exports = {
    name: 'Display Total',
    description: 'Displays the total on visualization',
    icon: require('images/display-sum.svg'),
    widgetList: {
        showOn: 'none',
        showCondition: ['multi-value-dimensions'],
    },
    content: {
        json: [
            {
                label: 'Display Total',
                description: 'Displays the total on visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"displaySum":<!SMSS_SHARED_STATE.displaySum>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.displaySum");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
