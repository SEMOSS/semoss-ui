module.exports = {
    name: 'Map Marker Size',
    description: 'Changes the default marker size for data points.',
    icon: require('images/circle-resize.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Change Marker Size',
                description: 'Changes the default marker size for data points.',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"mapMarkerSize":<size>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.mapMarkerSize");',
                params: [
                    {
                        paramName: 'size',
                        view: {
                            displayType: 'number',
                            label: 'Marker Size',
                        },
                        required: true,
                        model: {
                            defaultValue: 5,
                            defaultOptions: [],
                            valueQuery: '<SMSS_SHARED_STATE.mapMarkerSize>',
                        },
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
