module.exports = {
    name: 'Line Curve',
    description: 'Select what kind of curve to ',
    icon: require('images/line-curve.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Line Curve',
                description:
                    'Options to choose how the line displays on the visual',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"lineCurveType":"<curveType>"}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.lineCurveType");',
                params: [
                    {
                        paramName: 'curveType',
                        view: {
                            displayType: 'dropdown',
                            label: 'Curve Type:',
                        },
                        model: {
                            defaultValue: 'Linear',
                            defaultOptions: [
                                'Linear',
                                'Step',
                                'Step Before',
                                'Step After',
                                'Basis',
                                'Cardinal',
                                'Monotone X',
                                'Catmull Rom',
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
