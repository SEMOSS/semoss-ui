module.exports = {
    name: 'Transpose',
    description: 'Transpose (rotate) data from rows to columns.',
    icon: require('images/transpose.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | Transpose();<SMSS_AUTO>',
                label: 'Transpose',
                description: 'Transpose (rotate) data from rows to columns.',
                params: [],
                execute: 'auto',
            },
        ],
    },
    pipeline: {
        group: 'Transform',
    },
};
