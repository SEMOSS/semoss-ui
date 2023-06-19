module.exports = {
    name: 'Map Layer',
    description: 'Change the type of map layer',
    icon: require('images/folded-map.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Map Layer',
                description: 'Change the type of map layer',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"mapLayer":<mapLayer>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.mapLayer");',
                params: [
                    {
                        paramName: 'mapLayer',
                        view: {
                            displayType: 'checklist',
                            label: 'Select a Map Layer:',
                            attributes: {
                                searchable: true,
                            },
                        },
                        required: true,
                        model: {
                            defaultValue: ['openStreet'],
                            defaultOptions: [
                                'Streets',
                                'openStreet',
                                'Satellite',
                                'Satellite (Esri)',
                                'Streets (Esri)',
                                'Light',
                                'City Lights',
                                'Topographic',
                                'No Label',
                                'Dark',
                                'None',
                            ],
                        },
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
