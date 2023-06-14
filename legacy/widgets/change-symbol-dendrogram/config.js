module.exports = {
    name: 'Customize Symbol',
    description: 'Customize the symbols on your visualization',
    icon: require('images/triangle.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Customize Symbol',
                description: 'Customize the symbols on your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"changeSymbolDendrogram":{"chooseType":"<chooseType>","symbolUrl":"<symbolUrl>","symbolSize":"<symbolSize>"}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.changeSymbolDendrogram");',
                params: [
                    {
                        paramName: 'chooseType',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select Symbol Shape:',
                        },
                        model: {
                            defaultValue: 'Empty Circle',
                            defaultOptions: [
                                'Empty Circle',
                                'Circle',
                                'Rectangle',
                                'Round Rectangle',
                                'Triangle',
                                'Diamond',
                                'Pin',
                                'Arrow',
                            ],
                        },
                        required: true,
                    },
                    {
                        paramName: 'symbolUrl',
                        view: {
                            displayType: 'freetext',
                            label: 'Insert URL of Image:',
                        },
                        model: {
                            defaultValue: '',
                            defaultOptions: [],
                        },
                        required: false,
                    },
                    {
                        paramName: 'symbolSize',
                        view: {
                            displayType: 'number',
                            label: 'Select Symbol Size (Default: 12):',
                        },
                        model: {
                            defaultValue: 12,
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
