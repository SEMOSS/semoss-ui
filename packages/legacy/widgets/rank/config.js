module.exports = {
    name: 'Rank',
    description: 'Rank the selected columns from your data.',
    icon: require('images/rank.png'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        template: {
            name: 'rank',
        },
    },
    pipeline: {
        group: 'Transform',
        input: ['SOURCE'],
        parameters: {
            SOURCE: {
                frame: true,
            },
            RANK_COLUMN: {
                type: 'RANK_COLUMN',
            },
        },
        pixel: '<SOURCE.name> | Rank(<RANK_COLUMN>);',
    },
    lazy: true,
};
