module.exports = {
    name: 'Font Settings',
    description: 'Configure the font for the visualization',
    icon: require('images/font-settings.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Configure Font',
                description: 'Set the font configuration for the visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"fontSize":"<fontSize>px","fontColor":"<fontColor>"}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.fontSize");Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.fontColor");',
                params: [
                    {
                        paramName: 'fontSize',
                        view: {
                            displayType: 'number',
                            label: 'Set Font Size:',
                        },
                        model: {
                            defaultValue: 12,
                            min: 0,
                            defaultOptions: [],
                        },
                        required: true,
                    },
                    {
                        paramName: 'fontColor',
                        view: {
                            displayType: 'color-picker',
                            label: 'Set Font Color:',
                        },
                        model: {
                            defaultValue: '#000000',
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
