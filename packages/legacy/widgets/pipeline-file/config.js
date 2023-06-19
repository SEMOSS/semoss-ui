const FILES = require('@/core/constants.js').FILES;

// set the child components
let children = [];
for (let connector in FILES) {
    if (FILES.hasOwnProperty(connector)) {
        children.push({
            name: FILES[connector].name,
            description: 'Extract data from ' + FILES[connector].name,
            icon: FILES[connector].image,
            content: {
                template: {
                    name: 'pipeline-file',
                    options: {
                        fileType: FILES[connector].fileType,
                    },
                },
            },
        });
    }
}

module.exports = {
    name: 'File',
    description: 'Extract data from a file or pasted text',
    icon: require('images/file.svg'),
    widgetList: {
        showOn: 'none',
    },
    children: children,
    content: {
        template: {
            name: 'pipeline-file',
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
