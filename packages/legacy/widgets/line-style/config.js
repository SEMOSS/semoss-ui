module.exports = {
    name: 'Line Style',
    description: 'Customize the line style of your visualization',
    icon: require('images/square-ellipsis.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Line Style',
                description: 'Customize the line style of your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"lineStyle":{"type":"<type>","width":"<width>"}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.lineStyle");',
                params: [
                    {
                        paramName: 'type',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select Line Type:',
                        },
                        model: {
                            defaultValue: 'solid',
                            defaultOptions: ['solid', 'dashed', 'dotted'],
                        },
                        required: true,
                    },
                    {
                        paramName: 'width',
                        view: {
                            displayType: 'number',
                            label: 'Choose Line Width (Default = 3):',
                        },
                        model: {
                            defaultValue: 3,
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
