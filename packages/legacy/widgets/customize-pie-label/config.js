module.exports = {
    name: 'Customize Value Labels',
    description: 'Customize the value label settings of your pie chart',
    icon: require('images/bookmark.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Customize Value Labels',
                description:
                    'Customize the value label settings of your pie chart',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"displayValues": true,"customizePieLabel":{"position":"<position>","dimension":[<dimension>],"fontSize":"<fontSize>","dynamicView":"<dynamicView>", "labelLineLength": "<labelLineLength>"}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.customizePieLabel");Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.displayValues");',
                params: [
                    {
                        paramName: 'position',
                        view: {
                            displayType: 'dropdown',
                            label: 'Choose a Position for the Label:',
                        },
                        model: {
                            defaultValue: 'Outside',
                            defaultOptions: ['Outside', 'Inside'],
                        },
                        required: true,
                    },
                    {
                        paramName: 'dimension',
                        view: {
                            displayType: 'checklist',
                            label: 'Select dimension to show:',
                            attributes: {
                                multiple: true,
                            },
                        },
                        model: {
                            defaultValue: ['Name'],
                            defaultOptions: ['Name', 'Value', 'Percentage'],
                        },
                        useSelectedValues: true,
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
                    {
                        paramName: 'labelLineLength',
                        view: {
                            displayType: 'number',
                            label: 'Set Label Line Length:',
                        },
                        model: {
                            defaultValue: 15,
                            defaultOptions: [],
                            min: 0,
                        },
                        required: true,
                    },
                    {
                        paramName: 'dynamicView',
                        view: {
                            displayType: 'dropdown',
                            label: 'Include dynamic view:',
                        },
                        model: {
                            defaultValue: 'No',
                            defaultOptions: ['Yes', 'No'],
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
