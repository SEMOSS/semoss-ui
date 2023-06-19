module.exports = {
    name: 'Heatmap Square Size',
    description: 'Set the size of the squares in a heatmap',
    icon: require('images/heatmap-size.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Heatmap Square Size',
                description:
                    'Expand / Fit must be disabled to customize square size.',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"individual":{"heatmap-echarts":{"squareHeight":"<squareHeight>", "squareWidth":"<squareWidth>"}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.individual");',
                params: [
                    {
                        paramName: 'squareHeight',
                        view: {
                            displayType: 'number',
                            label: 'Square Height:',
                        },
                        required: true,
                        model: {
                            defaultValue: 25,
                        },
                    },
                    {
                        paramName: 'squareWidth',
                        view: {
                            displayType: 'number',
                            label: 'Square Width:',
                        },
                        required: true,
                        model: {
                            defaultValue: 25,
                        },
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
