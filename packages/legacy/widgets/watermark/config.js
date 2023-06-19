module.exports = {
    name: 'Watermark',
    description: 'Add/Remove a watermark on your visualization',
    icon: require('images/watermark.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Watermark',
                description: 'Add/Remove a watermark on your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"watermark":"<watermarkText>"}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.watermark");',
                params: [
                    {
                        paramName: 'watermarkText',
                        view: {
                            displayType: 'freetext',
                            label: 'Add a Watermark (any watermark will make the background color of your chart white by default)',
                        },
                        model: {
                            defaultValue: '',
                            defaultOptions: [],
                        },
                        required: false,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
