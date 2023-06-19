module.exports = {
    name: 'Regression',
    description: 'Add a line of regression',
    icon: require('images/regression-line.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Regression',
                description:
                    'Add a line of regression to the current data being shown.',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"regressionLine":<regressionType>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.regressionLine");',
                params: [
                    {
                        paramName: 'regressionType',
                        view: {
                            displayType: 'checklist',
                            label: 'Choose Regression Type:',
                            attributes: {},
                        },
                        model: {
                            defaultValue: ['None'],
                            defaultOptions: [
                                'None',
                                'Linear',
                                'Exponential',
                                'Logarithmic',
                                'Polynomial',
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
