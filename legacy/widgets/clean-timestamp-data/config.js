module.exports = {
    name: 'Timestamp Data',
    description: "Add today's date as a column",
    icon: require('images/timestamp.svg'),
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
                query: '<SMSS_FRAME.name> | TimestampData(newCol=["<newColName>"],time=["<newColType>"]);<SMSS_AUTO>',
                label: 'Timestamp Data',
                description:
                    "Add a new column with Today's date. Specify if its a normal date (year-month-day) or a full timestamp (year-month-day hour:minutes:seconds).",
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
                            label: 'Select to include date or date with time:',
                            attributes: {
                                display: 'display',
                                value: 'value',
                            },
                        },
                        model: {
                            defaultOptions: [
                                {
                                    value: 'false',
                                    display: 'Date',
                                },
                                {
                                    value: 'true',
                                    display: 'Date and Time',
                                },
                            ],
                            defaultValue: 'false',
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
