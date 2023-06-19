module.exports = {
    name: 'Date Difference',
    description: 'Determine the time difference between columns.',
    icon: require('images/time-remove.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        template: {
            name: 'clean-date-diff',
            options: {},
        },
    },
    pipeline: {
        group: 'Transform',
        input: ['SOURCE'],
        parameters: {
            SOURCE: {
                frame: true,
            },
            DATE_DIFFERENCE: {
                type: 'DATE_DIFFERENCE',
            },
        },
        pixel: '<SOURCE.name> | DateDifference(<DATE_DIFFERENCE>);',
    },
    lazy: true,
};
