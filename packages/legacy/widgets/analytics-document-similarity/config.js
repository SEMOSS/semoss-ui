module.exports = {
    name: 'Text Similarity',
    description: 'Determine the similairty between text and value instances.',
    icon: require('images/analytics-description-generator.svg'),
    widgetList: {
        groups: ['analytics'],
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'text2vec', 'lsa'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                label: 'Text Similarity',
                description:
                    'Determine the similairty between text and value instances.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                query: 'if((<override>),((<SMSS_FRAME.name> | RunDocCosSimilarity(instance=[<instance>], description=[<description>], override=[true]); if((<SMSS_FRAME.name> | HasDuplicates(sourceCol,targetCol)) , (Frame(<SMSS_FRAME.name>) | Select(sourceCol, targetCol, Average(distance)).as([sourceCol, targetCol, Average_of_Distance])|Group(sourceCol,targetCol)|With(Panel(0))|Format(type=[\'table\'])|TaskOptions({"0":{"layout":"HeatMap","alignment":{"x":["sourceCol"],"y":["targetCol"],"heat":["Average_of_Distance"],"facet":[],"tooltip":[]}}})|Collect(500)) , (Frame(<SMSS_FRAME.name>) | Select(sourceCol, targetCol, distance).as([sourceCol, targetCol, distance])|With(Panel(0))|Format(type=[\'table\'])|TaskOptions({"0":{"layout":"HeatMap","alignment":{"x":["sourceCol"],"y":["targetCol"],"heat":["distance"],"facet":[],"tooltip":[]}}})|Collect(500)));)),((SimFrame = (<SMSS_FRAME.name> | RunDocCosSimilarity(instance=[<instance>], description=[<description>], override=[false])); AddPanel(1);Panel(1)|AddPanelEvents({"onSingleClick":{"Unfilter":[{"panel":"","query":"<encode><Frame> | UnfilterFrame(<instance>);</encode>","options":{},"refresh":false,"default":true,"disabledVisuals":["Grid","Sunburst"],"disabled":false}]},"onDoubleClick":{"Filter":[{"panel":"0","query":"<encode><SMSS_FRAME.name> | AddFrameFilter(<instance>==<SelectedValues>);</encode>","options":{},"refresh":false,"default":true,"disabled":false}]}}); Panel(1)|RetrievePanelEvents(); Panel ( 1 ) | SetPanelView("visualization", "<encode>{"type":"echarts"}</encode>"); if((SimFrame | HasDuplicates(columns=[sourceCol,targetCol])) , (Frame(SimFrame)| Select(sourceCol, targetCol, Average(distance)).as([sourceCol, targetCol, Average_of_Distance])|Group(sourceCol,targetCol)|With(Panel(1))|Format(type=[\'table\'])|TaskOptions({"1":{"layout":"HeatMap","alignment":{"x":["sourceCol"],"y":["targetCol"],"heat":["Average_of_Distance"],"facet":[],"tooltip":[]}}})|Collect(500)) , (Frame(SimFrame)|Select(sourceCol, targetCol, distance).as([sourceCol, targetCol, distance])|With(Panel(1))|Format(type=[\'table\'])|TaskOptions({"1":{"layout":"HeatMap","alignment":{"x":["sourceCol"],"y":["targetCol"],"heat":["distance"],"facet":[],"tooltip":[]}}})|Collect(500)));)));',
                params: [
                    {
                        paramName: 'instance',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select instance column: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                        required: true,
                    },
                    {
                        paramName: 'description',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select text column: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                        required: true,
                    },
                    {
                        paramName: 'override',
                        view: {
                            displayType: 'dropdown',
                            label: 'Replace existing data frame:',
                            attributes: {
                                display: 'display',
                                value: 'value',
                            },
                        },
                        model: {
                            defaultOptions: [
                                {
                                    value: 'true',
                                    display: 'Yes',
                                },
                                {
                                    value: 'false',
                                    display: 'No',
                                },
                            ],
                            defaultValue: 'false',
                        },
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
