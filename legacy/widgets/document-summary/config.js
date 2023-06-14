module.exports = {
    name: 'Document Summary',
    description: 'Document Summarization',
    icon: require('images/document-summary.svg'),
    widgetList: {
        showOn: 'all',
    },
    required: {
        R: [
            'readtext',
            'xml2',
            'rvest',
            'lexRankr',
            'textrank',
            'udpipe',
            'textreuse',
            'stringr',
            'textmineR',
            'textreadr',
            'pdftools',
            'antiword',
            'tm',
            'dplyr',
        ],
    },
    content: {
        template: {
            name: 'document-summary',
        },
    },
    lazy: true,
};
