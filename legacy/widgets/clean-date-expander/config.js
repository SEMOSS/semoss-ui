module.exports = {
    name: 'Date Expander',
    description: 'Extract specific options from a date column',
    icon: require('images/date-range.svg'),
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
                query: '<SMSS_FRAME.name> | DateExpander(column = ["<property>"], options = [<opts>]);<SMSS_AUTO>',
                label: 'Store Column Values',
                description: 'Extract specific date elements to a new column.',
                params: [
                    {
                        paramName: 'property',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a column:',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["DATE", "TIMESTAMP"]);',
                        },
                        required: true,
                    },
                    {
                        paramName: 'opts',
                        required: false,
                        view: {
                            label: 'Select values to extract:',
                            displayType: 'checklist',
                            attributes: {
                                searchable: true,
                                multiple: true,
                                quickselect: true,
                                display: 'display',
                                value: 'value',
                            },
                        },
                        model: {
                            defaultValue: [],
                            defaultOptions: [
                                {
                                    display: 'Year',
                                    value: 'year',
                                },
                                {
                                    display: 'Month',
                                    value: 'month',
                                },
                                {
                                    display: 'Name of Month',
                                    value: 'month-name',
                                },
                                {
                                    display: 'Day',
                                    value: 'day',
                                },
                                {
                                    display: 'Day of Week',
                                    value: 'weekday',
                                },
                            ],
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
