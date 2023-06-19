module.exports = {
    name: 'Toggle Row Spanning',
    description: 'Enable row spanning for like values on a grid',
    icon: require('images/grid-row-span.png'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'grid-span-rows',
            execute: 'auto',
        },
    },
    lazy: true,
    // 'content': {
    //     'json': [
    //         {
    //             'label': 'Toggle Row Spanning',
    //             'description': 'Enable row spanning for like values on a grid',
    //             'query': 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"gridSpanRows":<!SMSS_SHARED_STATE.gridSpanRows>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.gridSpanRows");',
    //             'params': [],
    //             'execute': 'auto'
    //         }
    //     ]
    // }
};
