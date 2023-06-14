module.exports = {
    name: 'Conceptual - Logical - Physical Model',
    description:
        'Generate the Conceptual - Logical - Physical Model for the specified conceptual names',
    icon: require('images/conceptual-logical-physical-model.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        json: [
            {
                query: 'clpModelVar = CLPModel(<conceptualnames>) ; Panel ( <SMSS_PANEL_ID> ) | SetPanelView ( "visualization" , "<encode>{"type":"echarts"}</encode>" ) ; Panel ( <SMSS_PANEL_ID> ) | AddPanelOrnaments ( { "tools" : { "shared" : { "displayValues" : true } } } ) ; Panel ( <SMSS_PANEL_ID> ) | RetrievePanelOrnaments ( "tools.shared.displayValues" ) ; Panel ( <SMSS_PANEL_ID> ) | AddPanelOrnaments ( { "tools" : { "shared" : { "changeSymbolDendrogram" : { "chooseType" : "Rectangle" , "symbolUrl" : "" , "symbolSize" : "12" } } } } ) ; Panel ( <SMSS_PANEL_ID> ) | RetrievePanelOrnaments ( "tools.shared.changeSymbolDendrogram" ) ; Frame ( clpModelVar ) | Select ( ConceptualName , LogicalName , PhysicalName , Datasource ) | Format ( type = [ \'table\' ] ) | TaskOptions ( { "<SMSS_PANEL_ID>" : { "layout" : "Dendrogram" , "alignment" : { "dimension" : [ "ConceptualName" , "LogicalName" , "PhysicalName" , "LogicalName" , "PhysicalName" , "Datasource" ] } } } ) | Collect ( 2000 ) ;  Panel ( <SMSS_PANEL_ID> ) | SetPanelLabel ( "Conceptual - Logical - Physical Model Hierarchy" ) ; Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"toggleLegend":true}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.toggleLegend");Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"dendrogramColor":["#40A0FF","#9A74B6","#FBB83A","#F18630","#51ACA8","#187637","#CD5498","#364A90"]}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools");',
                description:
                    'Generate a Network Diagram of the CMD - LDM - PDM',
                params: [
                    {
                        paramName: 'conceptualnames',
                        required: true,
                        view: {
                            displayType: 'checklist',
                            label: 'Select The Conceptual Names To Explore:',
                            attributes: {
                                searchable: true,
                                multiple: true,
                                quickselect: true,
                            },
                        },
                        model: {
                            query: 'AllConceptualNames();',
                        },
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
