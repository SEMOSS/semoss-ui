module.exports = {
    name: 'Numerical Correlation',
    description:
        'Run a statistical correlation between numerical attributes (one-to-one).',
    icon: require('images/analytics-numerical-correlation.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                label: 'Numerical Correlation',
                description:
                    'Run a statistical correlation between numerical attributes (one-to-one). Results will be shown in a heatmap.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                query: 'Panel("<SMSS_PANEL_ID>")|SetPanelView("visualization", "<encode>{"type":"echarts"}</encode>");<SMSS_FRAME.name> | RunNumericalCorrelation(attributes=[<selectors>], panel=["<SMSS_PANEL_ID>"]);',
                params: [
                    {
                        paramName: 'selectors',
                        view: {
                            displayType: 'checklist',
                            label: 'Select numerical columns to correlate with each other: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["NUMBER"]);',
                        },
                        required: true,
                        link: 'instance',
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
