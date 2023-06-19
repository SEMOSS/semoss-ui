module.exports = {
    name: 'Query',
    description:
        'Query data from a database using a raw query (SQL, SPARQL, ETC.)',
    icon: require('images/query.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'pipeline-query',
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
            SELECTED_APP: {
                frame: false,
            },
        },
        input: [],
        pixel: '<QUERY_STRUCT> | Import(frame=[<IMPORT_FRAME>]);',
        showPreview: true,
    },
    lazy: true,
};
