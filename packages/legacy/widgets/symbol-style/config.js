module.exports = {
    name: 'Symbol Style',
    description: 'Select the point style',
    icon: require('images/customize-symbol.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Symbol Style',
                description: 'Select the point style',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"symbolStyle":{"type":<selectedType>,"size":<size>}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.symbolStyle");',
                params: [
                    {
                        paramName: 'selectedType',
                        view: {
                            attributes: {
                                searchable: true,
                            },
                            displayType: 'checklist',
                            label: 'Symbol Style:',
                        },
                        model: {
                            defaultValue: ['circle'],
                            defaultOptions: [
                                'Arrow',
                                'Circle',
                                'Diamond',
                                'Pin',
                                'Rectangle',
                                'Round Rectangle',
                                'Triangle',
                                'None',
                            ],
                        },
                        required: true,
                    },
                    {
                        paramName: 'size',
                        view: {
                            displayType: 'number',
                            label: 'Choose Symbol Size (Default = 4):',
                        },
                        model: {
                            defaultValue: 4,
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
