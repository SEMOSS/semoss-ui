module.exports = {
    name: 'Concatenate',
    description: 'Join columns together to create a new column',
    icon: require('images/merge.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | JoinColumns(newCol=["<newColumn>"], delimiter=["<separator>"], columns=[<joinCols>]);<SMSS_AUTO>',
                label: 'Join Columns',
                description:
                    'Create a new column by joining the values of existing columns.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'joinCols',
                        view: {
                            displayType: 'checklist',
                            label: 'Select columns to join:',
                            description:
                                'The order of the concatenation will be the same order of the selected columns above.',
                            attributes: {
                                multiple: true,
                                quickselect: true,
                                searchable: true,
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
                            label: 'Enter separator (between joined values):',
                        },
                        model: {
                            defaultValue: ',',
                        },
                        required: false,
                    },
                    {
                        paramName: 'newColumn',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter name of new column:',
                        },
                        model: {
                            replaceSpacesWithUnderscores: true,
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
