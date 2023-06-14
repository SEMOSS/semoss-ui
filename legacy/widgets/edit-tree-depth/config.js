module.exports = {
    name: 'Edit Tree Depth',
    description: 'Customize the depth at which the Dendrogram displays',
    icon: require('images/edit-bar-width.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Edit Tree Depth',
                description:
                    'Customize the depth at which the Dendrogram displays',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"treeDepth": <treeDepth>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.treeDepth");',
                params: [
                    {
                        paramName: 'treeDepth',
                        view: {
                            displayType: 'number',
                            label: 'Insert desired tree depth',
                        },
                        model: {
                            defaultValue: 0,
                            defaultOptions: [],
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
