module.exports = {
    name: 'Curve Type',
    description: 'Select line curve type',
    icon: require('images/curve.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Curve Type',
                description: 'Select line curve type',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"curveType":<selectedType>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.curveType");',
                params: [
                    {
                        paramName: 'selectedType',
                        view: {
                            attributes: {
                                searchable: true,
                            },
                            displayType: 'checklist',
                            label: 'Curve Type:',
                        },
                        model: {
                            defaultValue: ['Smooth'],
                            defaultOptions: [
                                'Exact',
                                'Smooth',
                                'StepStart',
                                'StepMiddle',
                                'StepEnd',
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
