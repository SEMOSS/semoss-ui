const SOCIAL = require('@/core/constants.js').SOCIAL;

// set the child components
let children = [];
for (let connector in SOCIAL) {
    if (SOCIAL.hasOwnProperty(connector)) {
        children.push({
            name: SOCIAL[connector].name,
            description: 'Query data from ' + SOCIAL[connector].name,
            icon: SOCIAL[connector].image,
            content: {
                template: {
                    name: 'pipeline-social',
                    options: {
                        provider: SOCIAL[connector].provider,
                    },
                },
            },
        });
    }
}

module.exports = {
    name: 'Social Data',
    description: 'Query data from an social data source',
    icon: require('images/external.svg'),
    widgetList: {
        showOn: 'none',
    },
    children: children,
    content: {
        template: {
            name: 'pipeline-social',
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
