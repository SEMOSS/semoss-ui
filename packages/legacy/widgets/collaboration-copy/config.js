module.exports = {
    name: 'Copy Database',
    description: 'Copy a database from the Marketplace',
    icon: require('images/collaboration-copy.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Enable Collaboration',
                description: 'Copy a database from the marketplace',
                query: 'META | CopyAppRepo(repository=["<remote>"], app=["<appName>"]) ;',
                params: [
                    {
                        paramName: 'remote',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter the remote URL to grab the database from:',
                        },
                        model: {},
                        required: true,
                    },
                    {
                        paramName: 'appName',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter a name for the copied database:',
                        },
                        model: {},
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
