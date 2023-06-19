module.exports = {
    name: 'Merge Lookup',
    description: 'Match and merge data with values from a lookup table.',
    icon: require('images/merge-table.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: [],
        Frame: ['R'],
    },
    content: {
        template: {
            name: 'lookup-merge',
        },
    },
    pipeline: {
        group: 'Transform',
        input: ['FRAME'],
        parameters: {
            FRAME: {
                frame: true,
                required: true,
            },
            COLUMN: {
                type: 'PIXEL',
                required: true,
            },
            MATCHES: {
                type: 'PIXEL',
            },
        },
        pixel: '<FRAME.name> | LookupMerge(column=[<COLUMN>], matches=[<MATCHES>]);',
    },
    lazy: true,
};
