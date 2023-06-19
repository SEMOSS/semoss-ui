module.exports = {
    name: 'Trendline',
    description: 'Toggles trendline on your visualization',
    icon: require('images/toggle-trendline.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Trendline',
                description: 'Toggles trendline on your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleTrendline":<trendlineType>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleTrendline");',
                params: [
                    {
                        paramName: 'trendlineType',
                        view: {
                            attributes: {
                                change: 'execute',
                                searchable: true,
                            },
                            displayType: 'checklist',
                            label: 'Trendline Style:',
                        },
                        model: {
                            defaultValue: ['No Trendline'],
                            defaultOptions: [
                                'No Trendline',
                                'Smooth',
                                'Exact',
                                'Step (start)',
                                'Step (middle)',
                                'Step (end)',
                            ],
                        },
                        required: true,
                    },
                ],
            },
        ],
    },
};
