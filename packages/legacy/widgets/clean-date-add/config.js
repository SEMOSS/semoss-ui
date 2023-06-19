module.exports = {
    name: 'Date Adder',
    description: 'Add a value to a date column.',
    icon: require('images/time-add.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        template: {
            name: 'clean-date-add',
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
            FILTERS: {
                type: 'FILTERS',
            },
            DATE_ADD_VALUE: {
                type: 'DATE_ADD_VALUE',
            },
        },
        pixel: '<SOURCE.name> | DateAddValue(<DATE_ADD_VALUE>);',
    },
    lazy: true,
};
