module.exports = {
    name: 'Database Profile',
    description: 'Get Database Profile',
    icon: require('images/database-profile.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        json: [
            {
                query: 'CreateFrame ( grid ) .as ( [ \'DATABASE_PROFILE\' ] ) | DatabaseProfile(database=["<database>"], concepts=[<concepts>]); Panel ( 0 ) | SetPanelView ( "visualization" ) ; Frame(DATABASE_PROFILE) | QueryAll()|AutoTaskOptions(panel=[0], layout=["Grid"])|Collect(500)',
                label: 'Get Database info',
                description: 'Generate a profile for a selected database.',
                params: [
                    {
                        paramName: 'database',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a Database:',
                            attributes: {
                                display: 'database_name',
                                value: 'database_id',
                            },
                        },
                        model: {
                            query: 'GetDatabaseList();',
                        },
                    },
                    {
                        paramName: 'concepts',
                        required: true,
                        view: {
                            displayType: 'checklist',
                            label: 'Select Concepts to Profile:',
                            attributes: {
                                searchable: true,
                                multiple: true,
                                quickselect: true,
                            },
                        },
                        model: {
                            dependsOn: ['database'],
                            query: 'GetDatabaseConcepts(database=["<database>"]);',
                        },
                        useSelectedValues: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
