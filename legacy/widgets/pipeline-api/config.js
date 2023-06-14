module.exports = {
    name: 'API',
    description: 'Extract data from an api',
    icon: require('images/api.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'pipeline-api',
            options: {},
        },
    },
    pipeline: {
        group: 'Source',
        parameters: {
            IMPORT_FRAME: {
                frame: true,
                type: 'CREATE_FRAME',
            },
            QUERY_STRUCT: {
                type: 'QUERY_STRUCT',
            },
        },
        input: [],
        pixel: '<QUERY_STRUCT> | Import(frame=[<IMPORT_FRAME>]);',
        showPreview: true,
    },
    lazy: true,
};
