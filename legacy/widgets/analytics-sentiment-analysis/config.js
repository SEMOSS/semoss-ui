module.exports = {
    name: 'Sentiment Analysis',
    description:
        'Run sentiment analysis on a text column to determine positive or negative sentiment, and any associated emotions.',
    icon: require('images/sentiment-analysis.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['sentimentr'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                label: 'Sentiment Analysis',
                description:
                    'Run sentiment analysis on a text column. Results will be added to the data frame.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                query: '<SMSS_FRAME.name>|RunSentimentAnalysis(sentimentCol=["<sentimentCol>"],groupCol=["<groupCol>"],addEmotionCols=[<addEmotionCols>], panel=[<SMSS_PANEL_ID>]);<SMSS_AUTO>',
                params: [
                    {
                        paramName: 'sentimentCol',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a Column to run Sentiment Analysis',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["STRING"]);',
                        },
                        required: true,
                        link: 'instance',
                    },
                    {
                        paramName: 'groupCol',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a Column to Group Sentiment Analysis',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["STRING"]);',
                        },
                        required: false,
                        link: 'instance',
                    },
                    {
                        paramName: 'addEmotionCols',
                        view: {
                            displayType: 'checkbox',
                            attributes: {
                                label: 'Add Emotion Columns (anger, sadness, trust, etc.)',
                            },
                        },
                        model: {
                            defaultValue: true,
                        },
                        required: false,
                    },
                ],
                execute: 'button',
            },
        ],
    },
    pipeline: {
        group: 'Transform',
    },
};
