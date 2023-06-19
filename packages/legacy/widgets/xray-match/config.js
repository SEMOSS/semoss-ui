module.exports = {
    name: 'X-Ray',
    description:
        'Compare values in databases to identify similaries between columns.',
    icon: require('images/overlap.svg'),
    widgetList: {
        showOn: 'all',
    },
    required: {
        R: ['data.table', 'textreuse'],
    },
    view: {
        template: {
            name: 'xray-match',
        },
    },
    lazy: true,
};
