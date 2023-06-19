module.exports = {
    name: 'Update Row',
    description: 'Update row values where a column contains a specific value',
    icon: require('images/clean-update-row.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        template: {
            name: 'clean-update-row',
        },
    },
    pipeline: {
        group: 'Transform',
        input: ['SOURCE'],
        parameters: {
            SOURCE: {
                frame: true,
            },
            FILTERS: {
                type: 'FILTERS',
            },
            UPDATE_ROW: {
                type: 'UPDATE_ROW',
            },
        },
        pixel: '<SOURCE.name> | UpdateRowValues(<UPDATE_ROW>, Filter(<FILTERS>));',
    },
    lazy: true,
};
