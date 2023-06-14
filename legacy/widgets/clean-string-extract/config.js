module.exports = {
    name: 'String Trim',
    description: 'Trim/Extract characters from a string.',
    icon: require('images/scissors.svg'),
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
                query: "<SMSS_FRAME.name> | StringExtract(column = ['<col>'], where=['<where>'], option = ['<opt>'], amount = [<amount>],newCol = ['<newCol>']);<SMSS_AUTO>",
                label: 'String Trim',
                description: 'Trim/Keep part of a string.',
                params: [
                    {
                        paramName: 'col',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select column:',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["STRING"]);',
                        },
                        useSelectedValues: true,
                        requried: true,
                    },
                    {
                        paramName: 'where',
                        requried: true,
                        view: {
                            displayType: 'dropdown',
                            label: 'Where',
                            attributes: {
                                display: 'display',
                                value: 'value',
                            },
                        },
                        model: {
                            defaultOptions: [
                                {
                                    display: 'Left',
                                    value: 'left',
                                },
                                {
                                    display: 'Right',
                                    value: 'right',
                                },
                            ],
                            defaultValue: [],
                        },
                    },
                    {
                        paramName: 'opt',
                        view: {
                            displayType: 'dropdown',
                            label: 'Keep or Remove',
                            attributes: {
                                display: 'display',
                                value: 'value',
                            },
                        },
                        model: {
                            defaultValue: [],
                            defaultOptions: [
                                {
                                    display: 'Keep',
                                    value: 'keep',
                                },
                                {
                                    display: 'Remove',
                                    value: 'remove',
                                },
                            ],
                        },
                    },
                    {
                        paramName: 'amount',
                        view: {
                            displayType: 'number',
                            label: 'Choose number of characters to keep/remove',
                        },
                        model: {
                            defaultValue: 0,
                        },
                        requried: true,
                    },
                    {
                        paramName: 'newCol',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter name of the new column',
                        },
                        model: {
                            replaceSpacesWithUnderscores: true,
                            defaultValue: '',
                        },
                    },
                ],
                execute: 'button',
                lazy: true,
            },
        ],
    },
    pipeline: {
        group: 'Transform',
    },
};
