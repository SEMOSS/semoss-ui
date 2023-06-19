module.exports = {
    name: 'Console',
    description:
        'Toggle your console on/off to execute Pixel, R, or Python on your insight',
    icon: require('images/terminal.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'terminal',
            options: {
                location: 'panel',
            },
        },
    },
};
