module.exports = {
    name: 'Document Query',
    description: 'Ask a question of a set of documents',
    icon: require('images/search-analytics.svg'),
    widgetList: {
        showOn: 'all',
    },
    required: {
        PY: [],
    },
    view: {
        template: {
            name: 'document-query',
        },
    },
    lazy: true,
};
