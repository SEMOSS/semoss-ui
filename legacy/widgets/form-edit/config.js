module.exports = {
    name: 'Edit Form',
    description: 'Edit the saved form',
    icon: require('images/form-edit.svg'),
    widgetList: {
        showOn: 'all',
        showCondition: ['form'],
    },
    content: {
        template: {
            name: 'form-edit',
            execute: 'auto',
        },
    },
    lazy: true,
};
