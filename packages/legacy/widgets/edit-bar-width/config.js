module.exports = {
    name: 'Edit Bar Width',
    description: 'Customize the width of the bars in your column chart',
    icon: require('images/edit-bar-width.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Edit Bar Width',
                description:
                    'Customize the width of the bars in your column chart',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"editBarWidth":{"barWidth":"<barWidth>"}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.editBarWidth");',
                params: [
                    {
                        paramName: 'barWidth',
                        view: {
                            displayType: 'number',
                            label: 'Set the bar width percentage. 0 resets the bar width to auto adjust.',
                            attributes: {
                                min: 0,
                                max: 100,
                            },
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
