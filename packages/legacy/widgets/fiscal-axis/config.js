module.exports = {
    name: 'Fiscal Axis',
    description: 'Enable fiscal axis with a given start month and color',
    icon: require('images/edit-bar-width.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Fiscal Axis',
                description: 'Enable a fiscal axis for your chart.',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"fiscalAxis":{"enabled":"<enabled>","startMonth":"<startmonth>","axisColor":"<axiscolor>"}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.fiscalAxis");',
                params: [
                    {
                        paramName: 'enabled',
                        view: {
                            displayType: 'radio',
                            label: 'Enable fiscal axis?',
                        },
                        model: {
                            defaultValue: 'Yes',
                            defaultOptions: ['Yes', 'No'],
                        },
                        required: true,
                    },
                    {
                        paramName: 'startmonth',
                        view: {
                            displayType: 'dropdown',
                            label: 'Fiscal Year Start',
                        },
                        model: {
                            defaultValue: 'January',
                            defaultOptions: [
                                'January',
                                'February',
                                'March',
                                'April',
                                'May',
                                'June',
                                'July',
                                'August',
                                'September',
                                'October',
                                'November',
                                'December',
                            ],
                        },
                        required: false,
                    },
                    {
                        paramName: 'axiscolor',
                        view: {
                            displayType: 'freetext',
                            label: 'Input a color hex code for axis if desired',
                        },
                        model: {
                            defaultValue: '#40A0FF',
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
