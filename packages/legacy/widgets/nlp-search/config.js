module.exports = {
    name: 'NLP Search',
    description:
        'Use this assisted query builder to analyze your data by creating Insights.',
    icon: require('images/search-analytics.svg'),
    widgetList: {
        showOn: 'all',
    },
    required: {
        R: [
            'igraph',
            'SteinerNet',
            'data.table',
            'plyr',
            'udpipe',
            'stringdist',
        ],
    },
    view: {
        template: {
            name: 'nlp-search',
        },
    },
    lazy: true,
};
