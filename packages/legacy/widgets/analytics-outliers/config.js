module.exports = {
    name: 'Outliers',
    description: 'Determine the probability of data values being an outlier.',
    icon: require('images/analytics-description-generator.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: [
            'mclust',
            'flashClust',
            'leaps',
            'FNN',
            'FactoMineR',
            'HDoutliers',
            'missRanger',
        ],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                label: 'Outliers',
                description:
                    'Determine the probability of data values being an outlier.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                query: '<SMSS_FRAME.name> | RunOutlier(attributes=[<selectors>], alpha=[<alpha>], nullHandleType=["<nullHandleType>"]);',
                params: [
                    {
                        paramName: 'selectors',
                        view: {
                            displayType: 'checklist',
                            label: 'Select the attributes to use to determine if an instance is an outlier: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["NUMBER", "STRING"]);',
                        },
                        required: true,
                        link: 'instance',
                    },
                    {
                        paramName: 'alpha',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter a value between 0 and 1 used as cutoff for outliers:',
                        },
                        model: {
                            defaultValue: '0.05',
                        },
                        required: true,
                    },
                    {
                        paramName: 'nullHandleType',
                        view: {
                            displayType: 'dropdown',
                            label: 'Null values are not allowed. Select how to handle them:',
                        },
                        model: {
                            defaultOptions: ['As_Is', 'Impute', 'Drop'],
                            defaultValue: 'As_Is',
                        },
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
