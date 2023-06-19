module.exports = {
    name: 'Search Twitter',
    description: 'Find top searches from twitter for each row in input column.',
    icon: require('images/twitter-search.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Find top tweets',
                description:
                    'Adds review, author, and retweet count to the current data table',
                query: 'Frame(<SMSS_FRAME.name>) | Select(<text>) | FlatMapLambda(lambda=["twittersearch"], columns=["<text>"], params=[{"output":"<output_count>", "result_type":"<result_type>", "geo_code": "<geo_code>"}]) | Merge(joins=[(<text>, inner.join, <text>)], frame=[<SMSS_FRAME.name>]);<SMSS_AUTO>',
                params: [
                    {
                        paramName: 'text',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select the column to use for the search: ',
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
                    {
                        paramName: 'output_count',
                        view: {
                            displayType: 'freetext',
                            label: 'Number of reviews: ',
                        },
                        required: true,
                    },
                    {
                        paramName: 'result_type',
                        view: {
                            displayType: 'dropdown',
                            label: 'Popular vs. Latest vs. Mixed: ',
                            attributes: {
                                display: 'display',
                                value: 'value',
                            },
                        },
                        model: {
                            defaultOptions: [
                                {
                                    value: 'Popular',
                                    display: 'Popular',
                                },
                                {
                                    value: 'Recent',
                                    display: 'Latest',
                                },
                                {
                                    value: 'Mixed',
                                    display: 'Latest + Popular',
                                },
                            ],
                            defaultValue: 'Mixed',
                            replaceSpacesWithUnderscores: true,
                            filter: 'camelCaseToTitleCase',
                        },
                        required: true,
                    },
                    {
                        paramName: 'geo_code',
                        view: {
                            displayType: 'freetext',
                            label: 'Distance with Address :',
                        },
                        required: false,
                        model: {
                            defaultValue:
                                '5, 5203 Leesburg Pike Falls Church...',
                        },
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
