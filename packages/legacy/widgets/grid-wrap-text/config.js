module.exports = {
    name: 'Wrap Text',
    description: 'Show all content in a cell by wrapping text to fit',
    icon: require('images/wrap-text.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"gridWrapCols":[<cols>]}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared");',
                label: 'Wrap Text',
                description:
                    'Select only the columns where you want the text to wrap (selecting all columns will affect the performance).',
                params: [
                    {
                        paramName: 'cols',
                        view: {
                            displayType: 'checklist',
                            label: 'Select Columns to Wrap:',
                            description:
                                'If no columns are selected, then the word wrap will be removed on execute.',
                            attributes: {
                                multiple: true,
                                searchable: true,
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        useSelectedValues: true,
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                        required: false,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
