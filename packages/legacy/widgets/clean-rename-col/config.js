module.exports = {
    name: 'Rename Column',
    description: 'Rename a selected column',
    icon: require('images/font.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        template: {
            name: 'clean-rename-col',
        },
    },
    pipeline: {
        group: 'Transform',
        input: ['SOURCE'],
        parameters: {
            SOURCE: {
                frame: true,
            },
            RENAME_COLUMN: {
                type: 'RENAME_COLUMN',
            },
        },
        pixel: '<SOURCE.name> | RenameColumn(<RENAME_COLUMN>);',
    },
    lazy: true,
};
