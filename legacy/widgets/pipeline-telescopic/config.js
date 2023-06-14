module.exports = {
    name: 'Telescopic',
    description: 'Query data from an existing frame',
    icon: require('images/plus.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'pipeline-app',
            options: {
                type: 'frame',
            },
        },
    },
    pipeline: {
        group: 'Transform',
        parameters: {
            SOURCE: {
                frame: true,
            },
            QUERY_STRUCT: {
                type: 'QUERY_STRUCT',
            },
            IMPORT_FRAME: {
                frame: true,
                type: 'CREATE_FRAME',
            },
        },
        input: ['SOURCE'],
        pixel: '<QUERY_STRUCT> | Import(frame=[<IMPORT_FRAME>]);',
        showPreview: false, // right now this is false because I need to fix it
    },
    lazy: true,
};
