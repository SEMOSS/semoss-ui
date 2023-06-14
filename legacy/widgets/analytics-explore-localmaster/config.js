module.exports = {
    name: 'Explore Local Databases',
    description:
        'Compare a database againsts all other databases in SEMOSS and see which columns have similar meaning.',
    icon: require('images/analytics-explore-localmaster.svg'),
    widgetList: {
        groups: ['analytics'],
        showOn: 'none',
    },
    required: {
        R: ['lsa', 'text2vec'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | MetaSemanticSimilarity(app=["<database>"], updatedBool=[<updatedBool>]);AddPanel(0);Panel ( 0 ) | SetPanelView ( "visualization" , "<encode>{"type":"echarts"}</encode>" ) ;Frame(semanticResults)|Select(LocalMasterColumns, <database>, NCol).as([LocalMasterColumns, <database>, NCol])|With(Panel(0))|Format(type=[\'table\'])|TaskOptions({"0":{"layout":"HeatMap","alignment":{"x":["LocalMasterColumns"],"y":["<database>"],"heat":["NCol"],"facet":[],"tooltip":[]}}})|Collect(-1);Panel(0)|AddPanelOrnaments({"tools":{"individual":{"heatmap-echarts":{"colorPalette":["#fff2d8","#F8EEA8","#EECF96","#E3B28B","#DD9080","#D9776D","#CE6661","#C75756","#C0444E"]}}}});Panel(0)|RetrievePanelOrnaments("tools");Panel(0)|SetPanelSort(columns=["LocalMasterColumns","<database>"], sort=["DESC","asc"]);Frame(semanticResults)|Select(NCol, LocalMasterColumns, <database>).as([NCol, LocalMasterColumns, <database>])|Group(LocalMasterColumns,<database>)|With(Panel(0))|Format(type=[\'table\'])|TaskOptions({"0":{"layout":"HeatMap","alignment":{"heat":["NCol"],"x":["LocalMasterColumns"],"y":["<database>"]}}})|Collect(-1);Panel ( 0 ) | Clone ( 1 ) ; Panel ( 1 ) | SetPanelView ( "visualization" , "<encode>{"type":"echarts"}</encode>" ) ;Frame(semanticResults)|Select(LocalMasterTables, <database>Table, NTable).as([LocalMasterTables, <database>Table, NTable])|With(Panel(1))|Format(type=[\'table\'])|TaskOptions({"1":{"layout":"HeatMap","alignment":{"x":["LocalMasterTables"],"y":["<database>Table"],"heat":["NTable"],"facet":[],"tooltip":[]}}})|Collect(-1);Panel(1)|AddPanelOrnaments({"tools":{"individual":{"heatmap-echarts":{"colorPalette":["#fff2d8","#F8EEA8","#EECF96","#E3B28B","#DD9080","#D9776D","#CE6661","#C75756","#C0444E"]}}}});Panel(1)|RetrievePanelOrnaments("tools");Panel(1)|SetPanelSort(columns=["LocalMasterTables","<database>Table"], sort=["DESC","asc"]);Frame(semanticResults)|Select(NTable, LocalMasterTables, <database>Table).as([NTable, LocalMasterTables, <database>Table])|Group(LocalMasterTables,<database>Table)|With(Panel(1))|Format(type=[\'table\'])|TaskOptions({"1":{"layout":"HeatMap","alignment":{"heat":["NTable"],"x":["LocalMasterTables"],"y":["<database>Table"]}}})|Collect(-1);Panel ( 0 ) | Clone ( 2 ) ;Panel ( 2 ) | SetPanelView ( "visualization" , "<encode>{"type":"echarts"}</encode>" ) ;Frame(semanticResults)|Select(LocalMasterDatabases, NDb).as([LocalMasterDatabases,  NDb])|With(Panel(2))|Format(type=[\'table\'])|TaskOptions({"2":{"layout":"HeatMap","alignment":{"x":["LocalMasterDatabases"],"y":["LocalMasterDatabases"],"heat":["NDb"],"facet":[],"tooltip":[]}}})|Collect(-1);Panel(2)|AddPanelOrnaments({"tools":{"individual":{"heatmap-echarts":{"colorPalette":["#fff2d8","#F8EEA8","#EECF96","#E3B28B","#DD9080","#D9776D","#CE6661","#C75756","#C0444E"]}}}});Panel(2)|RetrievePanelOrnaments("tools");Panel(2)|SetPanelSort(columns=["LocalMasterDatabases"], sort=["DESC","asc"]);Frame(semanticResults)|Select(NDb, LocalMasterDatabases, <database>Db).as([NDb,LocalMasterDatabases,<database>Db])|Group(LocalMasterDatabases)|With(Panel(2))|Format(type=[\'table\'])|TaskOptions({"2":{"layout":"HeatMap","alignment":{"heat":["NDb"],"x":["LocalMasterDatabases"],"y":["<database>Db"]}}})|Collect(-1);',
                label: 'Explore Local Databases',
                description:
                    'Compare a database againsts all other databases in SEMOSS and see which columns have similar meaning.',
                listeners: [
                    'addedData',
                    'updateFrame',
                    'updateTask',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'database',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select database to explore: ',
                            attributes: {
                                display: 'app_name',
                                value: 'app_name',
                            },
                        },
                        model: {
                            query: 'GetDatabaseList();',
                        },
                        required: true,
                    },
                    {
                        paramName: 'updatedBool',
                        view: {
                            displayType: 'dropdown',
                            label: 'New or Updated Database? ',
                        },
                        model: {
                            defaultOptions: ['true', 'false'],
                            defaultValue: 'false',
                        },
                        required: false,
                    },
                ],
                execute: 'button',
            },
        ],
    },
    pipeline: {
        group: 'Transform',
    },
};
