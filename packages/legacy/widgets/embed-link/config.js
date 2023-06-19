module.exports = {
    name: 'Embed',
    description: 'Embed your insight into any HTML document',
    icon: require('images/code.svg'),
    widgetList: {
        showOn: 'none',
        showCondition: ['saved-insight'],
    },
    content: {
        template: {
            name: 'embed-link',
        },
    },
    lazy: true,
};
