module.exports = {
    name: 'Column Cleaner',
    description: 'Condense values in a column by matching similar values',
    icon: require('images/column-cleaner.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        Frame: ['R', 'PY'],
    },
    content: {
        template: {
            name: 'column-cleaner',
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
            COLUMN_CLEANER: {
                type: 'COLUMN_CLEANER',
            },
        },
        pixel: '<SOURCE.name> | UpdateMatchColumnValues(<COLUMN_CLEANER>);',
    },
    lazy: true,
};
