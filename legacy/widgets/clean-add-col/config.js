module.exports = {
    name: 'Add Column',
    description: 'Add an empty column',
    icon: require('images/plus.svg'),
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
                query: '<SMSS_FRAME.name> | AddColumn(newCol=["<newColName>"],dataType=["<newColType>"]);<SMSS_AUTO>',
                label: 'Add Column',
                description:
                    "Add an empty column or copy values from an existing column.\nThis is useful for when you want to add a column based on conditional values (see 'Update Row' widget).",
                params: [
                    {
                        paramName: 'newColName',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter name of the new column:',
                        },
                        model: {
                            replaceSpacesWithUnderscores: true,
                        },
                    },
                    {
                        paramName: 'newColType',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select desired data type of the new column:',
                        },
                        model: {
                            defaultOptions: ['STRING', 'NUMBER', 'DATE'],
                            defaultValue: 'STRING',
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
