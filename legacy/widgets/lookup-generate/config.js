module.exports = {
    name: 'Generate Lookup',
    description:
        'Generate a table to lookup values that can be later matched and merged.',
    icon: require('images/add-table.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: [],
        Frame: ['R'],
    },
    content: {
        template: {
            name: 'lookup-generate',
        },
    },
    lazy: true,
};
