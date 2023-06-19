module.exports = {
    name: 'Grid Column Styling',
    description: 'Identifies a column by giving it styling',
    icon: require('images/grid-col-style.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"gridStylingCols":[<cols>], "gridColStyle": "<gridColStyle>", "gridHeaderColor": "<gridHeaderColor>", "gridHeaderFontColor": "<gridHeaderFontColor>"}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared");',
                label: 'Grid Column Styling',
                description: 'Identifies a column by giving it styling',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                    'resetGrid',
                ],
                params: [
                    {
                        paramName: 'cols',
                        view: {
                            displayType: 'checklist',
                            label: 'Select Columns to Style:',
                            attributes: {
                                multiple: true,
                                quickselect: true,
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
                    {
                        paramName: 'gridColStyle',
                        view: {
                            displayType: 'dropdown',
                            label: 'Column Styling:',
                        },
                        model: {
                            defaultValue: 'Highlight header',
                            defaultOptions: [
                                'Highlight header',
                                'Rows as links',
                            ],
                        },
                        required: true,
                    },
                    {
                        paramName: 'gridHeaderColor',
                        view: {
                            displayType: 'color-picker',
                            label: 'Highlight Header Background:',
                        },
                        model: {
                            defaultValue: '<SMSS_SHARED_STATE.gridHeaderColor>',
                        },
                        required: false,
                    },
                    {
                        paramName: 'gridHeaderFontColor',
                        view: {
                            displayType: 'color-picker',
                            label: 'Highlight Header Font Color:',
                        },
                        model: {
                            defaultValue:
                                '<SMSS_SHARED_STATE.gridHeaderFontColor>',
                        },
                        required: false,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
