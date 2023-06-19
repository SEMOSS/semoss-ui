module.exports = {
    name: 'Impute Null Values',
    description:
        'Impute values for incomplete data based on other columns in your dataset',
    icon: require('images/impute_null_values.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['missRanger'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                label: 'Impute Null Values',
                description:
                    'Impute values for incomplete data based on other columns in your dataset.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                query: '<SMSS_FRAME.name> | ImputeNullValues( columns=[<imputeCols>] );',
                params: [
                    {
                        paramName: 'imputeCols',
                        view: {
                            displayType: 'checklist',
                            label: 'Select columns to impute null values: ',
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
