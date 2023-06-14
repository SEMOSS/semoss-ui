module.exports = {
    name: 'Database',
    description: 'Select data from a database',
    icon: require('images/database.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'pipeline-app',
            options: {
                type: 'database',
            },
        },
    },
    pipeline: {
        group: 'Source',
        parameters: {
            QUERY_STRUCT: {
                type: 'QUERY_STRUCT',
            },
            IMPORT_FRAME: {
                frame: true,
                type: 'CREATE_FRAME',
            },
        },
        input: [],
        pixel: '<QUERY_STRUCT> | Import(frame=[<IMPORT_FRAME>]);',
        showPreview: true,
    },
    lazy: true,
};
