module.exports = {
    name: 'Animation',
    description: 'Toggles animation when loading your visualization',
    icon: require('images/play-button.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Animation',
                description:
                    'Toggles animation when loading your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"animationPie":<animationType>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.animationPie");',
                params: [
                    {
                        paramName: 'animationType',
                        view: {
                            displayType: 'checklist',
                            label: 'Choose Animation Type:',
                            attributes: {
                                change: 'execute',
                            },
                        },
                        model: {
                            defaultValue: ['None'],
                            defaultOptions: [
                                'None',
                                'Linear',
                                'Exponential',
                                'Elastic',
                                'Expansion',
                            ],
                        },
                        required: true,
                    },
                ],
            },
        ],
    },
};
