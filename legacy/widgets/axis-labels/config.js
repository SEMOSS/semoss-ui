module.exports = {
    name: 'Edit Axis Labels',
    description: 'Edit visualization x and y axis labels',
    icon: require('images/tag.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Edit Axis Labels',
                description: 'Edit visualization x and y axis labels',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"axisLabels":{"xlabel":"<xlabel>","ylabel":"<ylabel>"}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.axisLabels");',
                params: [
                    {
                        paramName: 'xlabel',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter New X-Axis Label:',
                        },
                        model: {
                            defaultValue: '',
                            defaultOptions: [],
                        },
                        required: false,
                    },
                    {
                        paramName: 'ylabel',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter New Y-Axis Label:',
                        },
                        model: {
                            defaultValue: '',
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
