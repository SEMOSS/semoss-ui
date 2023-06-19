module.exports = {
    name: 'Remove Duplicate Rows',
    description: 'Remove Duplicate Rows',
    icon: require('images/remove-duplicate-rows.svg'),
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
                query: '<SMSS_FRAME.name> | RemoveDuplicateRows();<SMSS_REFRESH_INSIGHT>',
                label: 'Remove Duplicate Rows',
                description: 'Remove duplicate rows within the table.',
                params: [],
                execute: 'auto',
            },
        ],
    },
    pipeline: {
        group: 'Transform',
    },
};
