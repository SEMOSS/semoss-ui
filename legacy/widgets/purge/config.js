module.exports = {
    name: 'Purge',
    description: 'Purge the data: remove the filtered out data.',
    icon: require('images/arrows-pointing-in.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'purge',
        },
    },
    pipeline: {
        group: 'Transform',
        input: ['SOURCE'],
        parameters: {
            SOURCE: {
                frame: true,
            },
            OPERATION: {
                type: 'PIXEL',
            },
        },
        pixel: '<SOURCE.name> | Purge(<OPERATION>);',
    },
    lazy: true,
};
