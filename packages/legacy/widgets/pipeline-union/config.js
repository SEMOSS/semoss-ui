module.exports = {
    name: 'Union',
    description:
        'Combines the results of two or more notebooks into a distinct single result set',
    icon: require('images/vector-union.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'pipeline-union',
            options: {},
        },
    },
    pipeline: {
        group: 'Transform',
        parameters: {
            FRAME1: {
                frame: true,
            },
            FRAME2: {
                frame: true,
            },
            UNIONS: {
                type: 'UNIONS',
                UnionType: 'false',
            },
        },
        preview: 'FRAME1',
        input: ['FRAME1', 'FRAME2'],
        pixel: ' <UNIONS>;',
    },
    lazy: true,
};
