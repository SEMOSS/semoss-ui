module.exports = {
    name: 'Facet Format',
    description: 'Customize facet settings',
    icon: require('images/facet-headers.svg'),
    widgetList: {
        showOn: 'none',
        showCondition: ['facet-all'],
    },
    content: {
        template: {
            name: 'facet-headers',
        },
    },
    lazy: true,
};
