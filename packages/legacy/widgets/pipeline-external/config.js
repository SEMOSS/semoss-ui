const CONNECTORS = require('@/core/constants.js').CONNECTORS;

// set the child components
let children = [];
for (let connector in CONNECTORS) {
    if (CONNECTORS.hasOwnProperty(connector)) {
        children.push({
            name: CONNECTORS[connector].name,
            description: 'Query data from ' + CONNECTORS[connector].name,
            icon: CONNECTORS[connector].image,
            content: {
                template: {
                    name: 'pipeline-external',
                    options: {
                        driver: CONNECTORS[connector].driver,
                    },
                },
            },
        });
    }
}

module.exports = {
    name: 'External Database',
    description: 'Query data from an external database',
    icon: require('images/external.svg'),
    widgetList: {
        showOn: 'none',
    },
    children: children,
    content: {
        template: {
            name: 'pipeline-external',
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
