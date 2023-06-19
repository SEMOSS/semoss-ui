module.exports = {
    name: 'Bucket',
    description: 'Group your data',
    icon: require('images/bucket.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'bucket',
        },
    },
    lazy: true,
};
