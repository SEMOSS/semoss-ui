module.exports = {
    name: 'Random Forest',
    description:
        'Build or Predict from a random forest model for a set of data',
    icon: require('images/vertical-tree.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'ranger', 'plyr', 'missRanger'],
        Frame: ['R'],
    },
    content: {
        template: {
            name: 'analytics-random-forest',
        },
    },
    lazy: true,
};
