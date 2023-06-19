module.exports = {
    name: 'Git Clone',
    description: 'Clone a git repository to your insight.',
    icon: require('images/git-icon-black.png'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                query: "GitClone(url=['<url>']);",
                label: 'Git Clone',
                description: 'Clone a git repository to your insight.',
                params: [
                    {
                        paramName: 'url',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter the url of your git repository',
                        },
                        required: true,
                    },
                ],
                execute: 'button',
                lazy: true,
            },
        ],
    },
};
