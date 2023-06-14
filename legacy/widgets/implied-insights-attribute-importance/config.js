module.exports = {
    name: 'Attribute Importance',
    description:
        "Shows the importance of other columns' effects on one column.",
    icon: '',
    widgetList: {
        showOn: ['none'],
    },
    view: {
        template: {
            name: 'implied-insights-attribute-importance',
        },
    },
    lazy: true,
};
