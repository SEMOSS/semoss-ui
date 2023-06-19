module.exports = {
    name: 'Toggle Event Axis',
    description:
        'Toggles the axis used in click and brush events. X-axis values are used by default.',
    icon: require('images/font.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Event Axis',
                description:
                    'Toggle the axis used in events such as click and brush. Default is using the x-axis values.',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleEventAxis":<!SMSS_SHARED_STATE.toggleEventAxis>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleEventAxis");',
                params: [],
                execute: 'auto',
            },
        ],
    },
};
