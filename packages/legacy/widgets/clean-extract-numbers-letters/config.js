module.exports = {
    name: 'Extract Numbers or Letters',
    description: 'Extracts numbers or letters from specific columns.',
    icon: require('images/extract.svg'),
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
                query: '<SMSS_FRAME.name> | <extractorType>(columns=[<cols>],override=[<override>]);<SMSS_AUTO>',
                label: 'Extract values',
                description:
                    'Extracts values (numbers or letters) from a specific column.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'extractorType',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select what values to keep:',
                            attributes: {
                                display: 'display',
                                value: 'value',
                            },
                        },
                        model: {
                            defaultOptions: [
                                {
                                    value: 'ExtractLetters',
                                    display: 'Keep Letters',
                                },
                                {
                                    value: 'ExtractNumbers',
                                    display: 'Keep Numbers',
                                },
                            ],
                            defaultValue: 'ExtractLetters',
                            replaceSpacesWithUnderscores: true,
                            filter: 'camelCaseToTitleCase',
                        },
                    },
                    {
                        paramName: 'cols',
                        view: {
                            displayType: 'checklist',
                            label: 'Choose column(s) to extract from:',
                            attributes: {
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["STRING"]);',
                        },
                        useSelectedValues: true,
                    },
                    {
                        paramName: 'override',
                        view: {
                            displayType: 'dropdown',
                            label: 'Create new column(s) with results:',
                            description:
                                "'No' will override the existing column values with the results.",
                            attributes: {
                                display: 'display',
                                value: 'value',
                            },
                        },
                        model: {
                            defaultOptions: [
                                {
                                    value: 'true',
                                    display: 'No',
                                },
                                {
                                    value: 'false',
                                    display: 'Yes',
                                },
                            ],
                            defaultValue: 'false',
                            replaceSpacesWithUnderscores: true,
                            filter: 'camelCaseToTitleCase',
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
