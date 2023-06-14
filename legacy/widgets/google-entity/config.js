module.exports = {
    name: 'Entity Recognition',
    description:
        'Inspect text for known entities and returns information about those entities. Will generate five columns around each entity: entity name, entity type, wikipedia url for more information about the entity, content of how the entity is used, and the types of the contents in which they are used.',
    icon: require('images/open-book.svg'),
    widgetList: {
        showOn: 'all',
    },
    required: {
        Social: ['GOOGLE'],
    },
    content: {
        json: [
            {
                label: 'Inspect text for known entities and returns information about those entities',
                description:
                    'Generates five columns around each entity: entity name, entity type, wikipedia url for more information about the entity, content of how the entity is used, and the types of the contents in which they are used',
                query: 'Frame(<SMSS_FRAME.name>) | Select(<text>) | FlatMapLambda(lambda=["googleentity"], columns=["<text>"]) | Merge(joins=[(<text>, inner.join, <text>)], frame=[<SMSS_FRAME.name>]);<SMSS_AUTO>',
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
