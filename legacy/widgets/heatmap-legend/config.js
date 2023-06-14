module.exports = {
    name: 'Legend Type',
    description: 'Choose legend type for your heat map',
    icon: require('images/stacked-rectangles.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Legend Type',
                description: 'Choose legend type for your heat map',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"heatmapLegend":<legendType>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.heatmapLegend");',
                params: [
                    {
                        paramName: 'legendType',
                        view: {
                            attributes: {},
                            displayType: 'checklist',
                            label: 'Heatmap Legend Type:',
                        },
                        model: {
                            defaultValue: ['continuous'],
                            defaultOptions: ['continuous', 'piecewise'],
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
