module.exports = {
    name: 'Column Division',
    description: 'Divide the values between two columns',
    icon: require('images/divide.svg'),
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
                query: "<SMSS_FRAME.name> | Division(numerator = ['<numerator>'], denominator=['<denominator>'], newCol = ['<newColName>'], round=[<round>]);<SMSS_AUTO>",
                label: 'Add Column',
                description: 'Perform division between two columns.',
                params: [
                    {
                        paramName: 'numerator',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select the numerator column',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: 'FrameHeaders(headerTypes=["NUMBER"]);',
                        },
                        required: true,
                    },
                    {
                        paramName: 'denominator',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select the denominator column',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: 'FrameHeaders(headerTypes=["NUMBER"]);',
                        },
                        required: true,
                    },
                    {
                        paramName: 'round',
                        view: {
                            displayType: 'number',
                            label: 'Enter how many decimal places to round to',
                        },
                        model: {
                            defaultValue: 2,
                        },
                    },
                    {
                        paramName: 'newColName',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter name of the new column',
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
    lazy: true,
};
