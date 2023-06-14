module.exports = {
    name: 'Separate',
    description: 'Separate column by index',
    icon: require('images/split.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'tidyr'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | SeparateColumn(column=[<col>], index=["<index>"], lName=["<lName>"], rName=["<rName>"]);<SMSS_AUTO>',
                label: 'Split',
                description:
                    'Split values within a column based on a index. This will create two new columns.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'col',
                        view: {
                            displayType: 'dropdown',
                            label: 'Choose column to split:',
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
                    },
                    {
                        paramName: 'index',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter the index:',
                        },
                    },
                    {
                        paramName: 'lName',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter the left hand side column name:',
                        },
                    },
                    {
                        paramName: 'rName',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter the right hand side column name:',
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
