module.exports = {
    name: 'Column Average',
    description: 'Find average across columns.',
    icon: require('images/average.svg'),
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
                query: "<SMSS_FRAME.name> | ColumnAverage(columns = [<cols>], newCol=['<newCol>']);<SMSS_AUTO>",
                label: 'Add Column',
                description: 'Determine the average of a number of columns.',
                params: [
                    {
                        paramName: 'cols',
                        view: {
                            displayType: 'checklist',
                            label: 'Select column(s):',
                            attributes: {
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["NUMBER"]);',
                        },
                        useSelectedValues: true,
                    },
                    {
                        paramName: 'newCol',
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
                lazy: true,
            },
        ],
    },
    pipeline: {
        group: 'Transform',
    },
};
