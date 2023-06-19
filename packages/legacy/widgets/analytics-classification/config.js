module.exports = {
    name: 'Classification',
    description:
        'Predict outcomes by comparing your data to relevant situations.',
    icon: require('images/file-tree.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'dplyr', 'partykit', 'naniar'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                label: 'Classification',
                description:
                    'Predict outcomes by comparing your data to relevant situations.',
                query: 'Panel("<SMSS_PANEL_ID>")|SetPanelView("visualization", "<encode>{"type":"echarts"}</encode>");<SMSS_FRAME.name> | RunClassification(classify=[<instance>], attributes=[<selectors>], panel=["<SMSS_PANEL_ID>"]);',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'instance',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a column to classify: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                        required: true,
                    },
                    {
                        paramName: 'selectors',
                        view: {
                            displayType: 'checklist',
                            label: 'Select attribute(s) to use for the classification: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                        required: true,
                        useSelectedValues: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
    pipeline: {
        group: 'Transform',
    },
};
