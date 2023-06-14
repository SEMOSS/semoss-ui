module.exports = {
    name: 'Cumulative Sum',
    description: 'Generate the cumulative sum of a column',
    icon: require('images/pivot.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'dplyr'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | CumulativeSum(newCol = ["<newColumn>"], value = ["<valueColumn>"], sortCols = [<sortColumns>], groupByCols = [<groupByColumns>]);<SMSS_AUTO>',
                label: 'Cumulative Sum',
                description: 'Generate the cumulative sum of a column',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'newColumn',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter name of the new column:',
                        },
                        model: {
                            replaceSpacesWithUnderscores: true,
                        },
                        required: true,
                    },
                    {
                        paramName: 'valueColumn',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select value to aggregate:',
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
                        paramName: 'sortColumns',
                        view: {
                            displayType: 'checklist',
                            label: 'Specify columns to sort by:',
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
                        useSelectedValues: true,
                        required: false,
                    },
                    {
                        paramName: 'groupByColumns',
                        view: {
                            displayType: 'checklist',
                            label: 'Specify columns to group by:',
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
                        useSelectedValues: true,
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
