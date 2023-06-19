module.exports = {
    name: 'Join',
    description:
        'Merge/Blend data based on different join types (Inner Join, Left Partial Join, Right Partial Join, Full Outer Join)',
    icon: require('images/blend.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'pipeline-merge',
            options: {},
        },
    },
    pipeline: {
        group: 'Transform',
        parameters: {
            SOURCE: {
                frame: true,
            },
            DESTINATION: {
                frame: true,
            },
            QUERY_STRUCT: {
                type: 'QUERY_STRUCT',
            },
            JOINS: {
                type: 'JOINS',
            },
            REMOVE: {},
        },
        preview: 'DESTINATION',
        input: ['SOURCE', 'DESTINATION'],
        pixel: 'Frame(<SOURCE.name>) | <QUERY_STRUCT> | Merge(joins=[<JOINS>], frame=[<DESTINATION.name>]);', // <REMOVE>'
    },
    lazy: true,
};
