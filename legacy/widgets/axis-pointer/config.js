module.exports = {
    name: 'Axis Pointer',
    description: 'Choose your axis pointer style',
    icon: require('images/cursor.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Axis-Pointer',
                description: 'Select your axis pointer style',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"axisPointer":<pointerType>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.axisPointer");',
                params: [
                    {
                        paramName: 'pointerType',
                        view: {
                            displayType: 'checklist',
                            label: 'Axis Pointer Type:',
                            attributes: {
                                searchable: true,
                            },
                        },
                        model: {
                            defaultValue: ['shadow'],
                            defaultOptions: ['shadow', 'cross', 'line'],
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
