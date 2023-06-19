module.exports = {
    name: 'Calculate Sentiment',
    description:
        'Add sentence sentiment for a given column. Score column is between -1 and 1 and represents the overall emotional leaning of the sentence (-1 is negative, while +1 is positive). Magnitude column is between 0 and +Inf and indicates the overall strength of emotion within the sentence.',
    icon: require('images/anxious-face.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Calculates the sentiment for a given column',
                description:
                    'Adds sentence, score, and magnitude columns to the current data table',
                query: 'Frame(<SMSS_FRAME.name>) | Select(<text>) | FlatMapLambda(lambda=["googlesentiment"], columns=["<text>"]) | Merge(joins=[(<text>, inner.join, <text>)], frame=[<SMSS_FRAME.name>]);<SMSS_AUTO>',
                params: [
                    {
                        paramName: 'text',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select the text column: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["STRING"]);',
                        },
                        required: true,
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
