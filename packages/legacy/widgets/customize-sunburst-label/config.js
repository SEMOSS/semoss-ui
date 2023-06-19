module.exports = {
    name: 'Customize Value Labels',
    description: 'Customize the label settings of your sunburst chart',
    icon: require('images/font.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Customize Value Labels',
                description:
                    'Customize the label settings of your sunburst chart',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"displayValues":true,"customizeSunburstLabel":{"orientation":"<orientation>","fontSize":"<fontSize>"}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.customizeSunburstLabel");Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.displayValues");',
                params: [
                    {
                        paramName: 'orientation',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select Orientation:',
                        },
                        model: {
                            defaultValue: 'radial',
                            defaultOptions: [
                                'radial',
                                'tangential',
                                'horizontal',
                            ],
                        },
                        required: true,
                    },
                    {
                        paramName: 'fontSize',
                        view: {
                            displayType: 'number',
                            label: 'Select Font Size of Labels:',
                        },
                        model: {
                            defaultValue: 12,
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
