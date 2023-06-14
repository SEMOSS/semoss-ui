module.exports = {
    name: 'Zoom Toggle',
    description: 'Toggles zooming within your visualization',
    icon: require('images/toggle-polar-zoom.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Toggle Zoom',
                description: 'Toggles zooming within your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"togglePolarZoom":"<zoomType>"}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.togglePolarZoom");',
                params: [
                    {
                        paramName: 'zoomType',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select Zoom:',
                        },
                        model: {
                            defaultValue: 'No Zoom',
                            defaultOptions: [
                                'No Zoom',
                                'Radius Zoom',
                                'Angle Zoom',
                            ],
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
