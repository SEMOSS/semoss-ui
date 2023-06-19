module.exports = {
    name: 'Numerical Column Similarity',
    description:
        'Analyze the distribution of numerical values to determine similarity.',
    icon: require('images/analytics-numerical-column-similarity.svg'),
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
                label: 'Numerical Column Similarity',
                description:
                    'Analyze the distribution of numerical values to determine similarity. Results will be shown in a heatmap.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                query: 'Panel("<SMSS_PANEL_ID>")|SetPanelView("visualization", "<encode>{"type":"echarts"}</encode>"); <SMSS_FRAME.name> | RunNumericalColumnSimilarity(columns=[<selectors>], panel=["<SMSS_PANEL_ID>"] , sampleSize = ["<sampleSize>"], significance = ["0.05"], showAll = ["TRUE"]  );', //
                params: [
                    {
                        paramName: 'selectors',
                        view: {
                            displayType: 'checklist',
                            label: 'Select numerical columns to compare against eachother: ',
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
                    {
                        paramName: 'sampleSize',
                        view: {
                            displayType: 'slider',
                            label: 'Select the sample size of each column:',
                            attributes: {
                                type: 'numerical',
                                min: 0,
                                max: 500,
                            },
                        },
                        model: {
                            defaultValue: 100,
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
