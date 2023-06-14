module.exports = {
    name: 'Color Theme',
    description: 'Choose the color theme for your map',
    icon: require('images/painter-palette.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Color Theme',
                description: 'Choose the color theme for your map',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"mapColorTheme":<colorTheme>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.mapColorTheme");',
                params: [
                    {
                        paramName: 'colorTheme',
                        view: {
                            displayType: 'checklist',
                            label: 'Select Color Theme:',
                            attributes: {
                                searchable: true,
                            },
                        },
                        model: {
                            defaultValue: ['Light 1'],
                            defaultOptions: [
                                'Light 1',
                                'Light 2',
                                'Dark',
                                'Geo',
                            ],
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
