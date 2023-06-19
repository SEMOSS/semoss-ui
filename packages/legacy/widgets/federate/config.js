module.exports = {
    name: 'Federate',
    description: 'Federate to other data sources.',
    icon: require('images/plus.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {},
    content: {
        template: {
            name: 'federate',
        },
    },
    pipeline: {
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
