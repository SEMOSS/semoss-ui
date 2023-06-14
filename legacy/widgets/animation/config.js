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
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"animation":{"animationSpeed":"<animationSpeed>","animationDuration":"<animationDuration>","chooseType":"<chooseType>"}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.animation");',
                params: [
                    {
                        paramName: 'chooseType',
                        view: {
                            displayType: 'dropdown',
                            label: 'Choose Animation Type:',
                        },
                        model: {
                            defaultValue: 'No Animation',
                            defaultOptions: [
                                'No Animation',
                                'linear',
                                'bounceOut',
                                'bounceIn',
                                'bounceInOut',
                                'quadraticln',
                                'quadraticOut',
                                'quadraticInOut',
                                'cubicIn',
                                'cubicOut',
                                'cubicInOut',
                                'quarticIn',
                                'quarticOut',
                                'quarticInOut',
                                'quinticIn',
                                'quinticOut',
                                'quinticInOut',
                                'sinusoidalIn',
                                'sinusoidalOut',
                                'sinusoidalInOut',
                                'exponentialIn',
                                'exponentialOut',
                                'exponentialInOut',
                                'circularIn',
                                'circularOut',
                                'circularInOut',
                                'elasticIn',
                                'elasticOut',
                                'elasticInOut',
                                'backIn',
                                'backOut',
                                'backInOut',
                            ],
                        },
                        required: true,
                    },
                    {
                        paramName: 'animationSpeed',
                        view: {
                            displayType: 'number',
                            label: 'Insert Delay (No delay = 1, One second delay = 1000)',
                        },
                        model: {
                            defaultValue: 1,
                            defaultOptions: [],
                        },
                        required: true,
                    },
                    {
                        paramName: 'animationDuration',
                        view: {
                            displayType: 'number',
                            label: 'Insert Duration (Default = 500)',
                        },
                        model: {
                            defaultValue: 500,
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
