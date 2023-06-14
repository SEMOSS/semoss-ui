module.exports = {
    name: 'Change Type of Axis',
    description: 'Changes the type of the axis based on the type of data',
    icon: require('images/axis-type.svg'),
    widgetList: {
        showOn: ['Area', 'Column', 'Line', 'Scatter'],
    },
    content: {
        json: [
            {
                label: 'Change Axis Type',
                description:
                    'Changes the type of the axis based on the type of data',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"axisType":<axisType>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.axisType");',
                params: [
                    {
                        paramName: 'axisType',
                        view: {
                            displayType: 'dropdown',
                            label: 'Change Axis Type ',
                        },
                        required: true,
                        model: {
                            defaultValue: '',
                            defaultOptions: ['Numerical', 'Logarithmic'],
                        },
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
