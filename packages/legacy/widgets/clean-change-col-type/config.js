module.exports = {
    name: 'Change Column Type',
    description: 'Change the column type (String, Number, Date)',
    icon: require('images/copy.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        template: {
            name: 'clean-change-col',
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
            CHANGE_COLUMN_TYPE: {
                type: 'CHANGE_COLUMN_TYPE',
            },
        },
        pixel: '<SOURCE.name> | ChangeColumnType(<CHANGE_COLUMN_TYPE>);',
    },
    lazy: true,
};
