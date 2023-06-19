module.exports = {
    name: 'Change Type of Choropleth',
    description: 'Changes the type of the choropleth',
    icon: require('images/folded-map-with-globe.svg'),
    widgetList: {
        showOn: ['Choropleth'],
    },
    content: {
        json: [
            {
                label: 'Change Choropleth Type',
                description: 'Changes the type of the map',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"chloroType":<chloroType>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.chloroType");',
                params: [
                    {
                        paramName: 'chloroType',
                        view: {
                            displayType: 'radio',
                            label: 'Choropleth Type',
                        },
                        required: true,
                        model: {
                            defaultValue: '',
                            defaultOptions: [
                                'State',
                                'Country',
                                'Counties',
                                'Regions',
                            ],
                        },
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
