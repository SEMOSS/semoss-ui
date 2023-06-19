module.exports = {
    name: 'Local Outline Factor',
    description:
        'Determine anomalous data-points in your data through local outlier factor analysis.',
    icon: require('images/analytics-lof.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'dplyr', 'VGAM', 'Rlof'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                label: 'Local Outline Factor',
                description:
                    'Determine anomalous data-points in your data through local outlier factor analysis.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                query: '<SMSS_FRAME.name> | RunLOF(instance=[<instance>], uniqInstPerRow=["<uniqInstPerRow>"], kNeighbors=[<k>], attributes=[<selectors>]);<SMSS_AUTO>',
                params: [
                    {
                        paramName: 'instance',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a column: ',
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
                            label: 'Select attribute(s) to use to determine outliers: ',
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
                        useSelectedValues: true,
                    },
                    {
                        paramName: 'k',
                        view: {
                            displayType: 'freetext',
                            label: 'K Neighbor (Single Integer, Multiple Integers, or Vector Notation): ',
                        },
                        model: {
                            defaultValue: 10,
                        },
                        required: true,
                    },
                    {
                        paramName: 'uniqInstPerRow',
                        view: {
                            displayType: 'dropdown',
                            label: 'Group dimension by duplicate instances:',
                        },
                        model: {
                            defaultValue: 'no',
                            defaultOptions: ['yes', 'no'],
                        },
                        required: false,
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
