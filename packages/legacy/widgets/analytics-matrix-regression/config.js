module.exports = {
    name: 'Matrix Regression',
    description:
        'Model the relationship between a numerical dependent variable and independent varaible(s).',
    icon: require('images/analytics-explore-localmaster.svg'),
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
                label: 'Matrix Regression',
                description:
                    'Model the relationship between a numerical dependent variable and independent varaible(s).',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                query: 'p1=AddPanel();p2=AddPanel();p1|SetPanelView("visualization", "<encode>{"type":"echarts"}</encode>"); p2|SetPanelView("visualization", "<encode>{"type":"echarts"}</encode>"); p1|SetPanelLabel("Regression Output Scatterplot"); p2|SetPanelLabel("Coefficient of Regression Columns"); <SMSS_FRAME.name> | RunMatrixRegression(yColumn=[<instance>], xColumns=[<selectors>], panel=[GetPanelId(p1), GetPanelId(p2)]); RemoveVariable(p1); RemoveVariable(p2);',
                params: [
                    {
                        paramName: 'instance',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select the dependent variable (y-variable): ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["NUMBER"]);',
                        },
                        required: true,
                    },
                    {
                        paramName: 'selectors',
                        view: {
                            displayType: 'checklist',
                            label: 'Select the explanatory variables (x-variables): ',
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
