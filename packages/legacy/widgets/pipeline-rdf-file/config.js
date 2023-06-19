module.exports = {
    name: 'RDF File Query',
    description: 'Load data by executing a SELECT query against a RDF file',
    icon: require('images/rdf-file.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        template: {
            name: 'pipeline-rdf-file',
            options: {},
        },
    },
    pipeline: {
        parameters: {
            IMPORT_FRAME: {
                frame: true,
                type: 'CREATE_FRAME',
            },
            RDF_FILE: {
                type: 'RDF_FILE_SOURCE',
                frame: false,
            },
            QUERY: {
                frame: false,
                value: '',
            },
        },
        group: 'Source',
        input: [],
        pixel: '<RDF_FILE> | Query("<encode> <QUERY> </encode>") | Import(frame=[<IMPORT_FRAME>]);',
        showPreview: true,
    },
    lazy: true,
};
