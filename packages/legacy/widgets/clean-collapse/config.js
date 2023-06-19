module.exports = {
    name: 'Collapse',
    description: 'Collapse data',
    icon: require('images/collapse.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'stats'],
        Frame: ['R', 'PY'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | Collapse(groupByColumn=[<frameHeader1>], value = ["<frameHeader2>"], delimiter=["<separator>"], maintainCols = [<keepColumns>]);<SMSS_AUTO>',
                label: 'Collapse',
                description:
                    'Aggregate data for a group based on the delimiter.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'frameHeader1',
                        view: {
                            displayType: 'checklist',
                            label: 'Select group by columns:',
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
                    {
                        paramName: 'frameHeader2',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select value column:',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                        useSelectedValues: true,
                    },
                    {
                        paramName: 'separator',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter a string separator:',
                        },
                    },
                    {
                        paramName: 'keepColumns',
                        view: {
                            displayType: 'checklist',
                            label: 'Select the other columns to maintain in the new table:',
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
