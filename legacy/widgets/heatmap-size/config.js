module.exports = {
    name: 'Heatmap Size',
    description: 'Set the % width and height of the heatmap',
    icon: require('images/heatmap-size.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Heatmap Size',
                description: 'Set the % width and height of the heatmap',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"individual":{"heatmap-echarts":{"heatmapWidth":"<heatmapWidth>%", "heatmapHeight":"<heatmapHeight>%"}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.individual");',
                params: [
                    {
                        paramName: 'heatmapWidth',
                        view: {
                            displayType: 'number',
                            label: 'Heatmap Width:',
                        },
                        model: {
                            defaultValue: 100,
                        },
                        required: true,
                    },
                    {
                        paramName: 'heatmapHeight',
                        view: {
                            displayType: 'number',
                            label: 'Heatmap Height:',
                        },
                        model: {
                            defaultValue: 100,
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
