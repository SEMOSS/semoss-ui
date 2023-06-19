module.exports = {
    name: 'Discretize Column',
    description: 'Place numerical values of a column into discrete bin ranges.',
    icon: require('images/histogram-bw.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        template: {
            name: 'clean-discretize',
        },
    },
    pipeline: {
        group: 'Transform',
        input: ['SOURCE'],
        parameters: {
            SOURCE: {
                frame: true,
            },
            DISCRETIZE: {
                type: 'DISCRETIZE',
            },
        },
        pixel: '<SOURCE.name> | Discretize(<DISCRETIZE>);',
    },
    lazy: true,
};
