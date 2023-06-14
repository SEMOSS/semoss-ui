module.exports = {
    name: 'Customize Value Labels',
    description: 'Customize the value label settings of your funnel chart',
    icon: require('images/bookmark.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Customize Value Labels',
                description:
                    'Customize the value label settings of your funnel chart',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"displayValues":true,"customizeFunnelLabel":{"position":"<position>","dimension":"<dimension>","fontSize":"<fontSize>","fontFamily":"<fontFamily>","fontWeight":"<fontWeight>","fontColor":"<fontColor>"}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.displayValues");Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.customizeFunnelLabel");',
                params: [
                    {
                        paramName: 'position',
                        view: {
                            displayType: 'dropdown',
                            label: 'Choose a Position for the Label:',
                        },
                        model: {
                            defaultValue: 'Inside',
                            defaultOptions: ['Outside', 'Inside'],
                        },
                        required: true,
                    },
                    {
                        paramName: 'dimension',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select dimension to show:',
                        },
                        model: {
                            defaultValue: 'Name',
                            defaultOptions: ['Name', 'Value', 'Percentage'],
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
                            defaultValue: 15,
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
