module.exports = {
    name: 'Change Alignment',
    description: 'Choose alignment of the filter',
    icon: require('images/change-alignment.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Change Alignment',
                description: 'Choose alignment of the filter',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"changeAlignment":<alignmentType>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.changeAlignment");',
                params: [
                    {
                        paramName: 'alignmentType',
                        view: {
                            attributes: {},
                            displayType: 'checklist',
                            label: 'Choose Alignment Type:',
                        },
                        model: {
                            defaultValue: ['center'],
                            defaultOptions: ['center', 'left', 'right'],
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
