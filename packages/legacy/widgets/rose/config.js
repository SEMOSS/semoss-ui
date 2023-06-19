module.exports = {
    name: 'Rose',
    description:
        'Convert to Rose chart (radius of pie slice is representative of value)',
    icon: require('images/rose.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Rose',
                description:
                    'Convert to Rose chart (radius of pie slice is representative of value)',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"rose":<roseType>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.rose");',
                params: [
                    {
                        paramName: 'roseType',
                        view: {
                            attributes: {
                                searchable: true,
                            },
                            displayType: 'checklist',
                            label: 'Select Chart Type:',
                        },
                        model: {
                            defaultValue: ['Default'],
                            defaultOptions: [
                                'Default',
                                'RoseRadius',
                                'RoseArea',
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
