module.exports = {
    name: 'Formula Builder',
    description: 'Define a formula to create a new column.',
    icon: require('images/plus.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        Frame: ['R', 'PY', 'NATIVE'],
    },
    content: {
        template: {
            name: 'add',
        },
    },
    pipeline: {
        group: 'Transform',
        parameters: {
            SOURCE: {
                frame: true,
            },
            QUERY: {
                type: 'PIXEL',
            },
        },
        input: ['SOURCE'],
        pixel: 'Frame(frame = [<SOURCE.name>]) | <QUERY>;',
    },
    lazy: true,
};
