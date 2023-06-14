module.exports = {
    name: 'To Percent',
    description: 'Turn a column to percent format',
    icon: require('images/percent.png'),
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
                query: '<SMSS_FRAME.name> | ToPercent(column = ["<col>"], sigDigits =[<sigDigits>], by100 = [<by100>], newCol = ["<newCol>"]);<SMSS_AUTO>',
                label: 'To Percent',
                description: 'Convert column to percentage',
                params: [
                    {
                        paramName: 'col',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select column',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["NUMBER"]);',
                        },
                        useSelectedValues: true,
                        requried: true,
                    },
                    {
                        paramName: 'sigDigits',
                        view: {
                            displayType: 'number',
                            label: 'Choose number of significant digits to keep',
                        },
                        model: {
                            defaultValue: 0,
                        },
                        requried: true,
                    },
                    {
                        paramName: 'by100',
                        view: {
                            displayType: 'checkbox',
                            attributes: {
                                label: 'Check if you would like to multiply the value by 100',
                            },
                        },
                        model: {
                            defaultValue: false,
                        },
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
                        requried: false,
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
