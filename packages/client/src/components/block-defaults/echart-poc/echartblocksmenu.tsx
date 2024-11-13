import { BlockComponent } from '@/stores';
import { Stack, styled } from '@semoss/ui';
import {
    AIGenerationSettings,
    CodeEditorSettings,
    JsonSettings,
} from '@/components/block-settings';
import { useBlock } from '@/hooks';
import { useState } from 'react';
import EChartVisualizationTool from './echartblocktools';
import E_PieChart from './pie-chart-feature';

const tabStyles = {
    padding: '10px 20px',
    marginRight: '10px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 0.3s ease',
};

const tabStyle = {
    padding: '10px 20px',
    marginRight: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
};
const activeTabStyle = {
    ...tabStyle,
    borderBottom: '3px solid green',
};
const containerStyle = {
    display: 'flex',
    marginBottom: '15px',
};

export const EchartVisualizationBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlock(id);
    const [activeTab, setActiveTab] = useState('Data');
    console.log(data);
    debugger;
    const renderTabContent = () => {
        switch (activeTab) {
            case 'Visualization':
                return (
                    <div>
                        <h3>Graph Data</h3>
                        {/* {graphData.map((dataPoint, index) => (
                      <div key={index}>
                        <label>{dataPoint.name}:</label>
                        <input
                          type="number"
                          value={dataPoint.value}
                          onChange={(e) => handleValueChange(index, parseInt(e.target.value, 10))}
                        />
                      </div>
                    ))} */}
                    </div>
                );
            case 'Data':
                return (
                    <div>
                        <h3>Chart Type</h3>
                        <label>Change Chart Type:</label>
                        {/* <select onChange={handleChartTypeChange} value={charts[selectedChart].graphType}>
                      <option value="bar">Bar</option>
                      <option value="pie">Pie</option>
                      {/* You can add more chart types here */}
                        {/* </select> */}
                    </div>
                );
            case 'Tools':
                return (
                    <div>
                        <h3>Tools</h3>
                        <p>
                            Other settings or functionalities can be added here.
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Stack padding={2} height="100%">
            {/* <div>Renderingggggg</div> */}
            {/* CodeEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON */}
            {/* Not sure if we want to delete JsonSettings but it's no longer in use here */}
            <JsonSettings id={id} path="option" />

            {/* <CodeEditorSettings id={id} path="specJson" /> */}
            {!data.variation && (
                <AIGenerationSettings
                    id={id}
                    path="option"
                    appendPrompt={
                        'Use vega lite version 5 and make the schema as simple as possible. Return the response as JSON. Ensure "data" is a top-level key in the JSON object.'
                    }
                    placeholder="Ex: Generate a bar graph."
                    valueAsObject
                />
            )}
            {/* {data.variation === 'echart-pie-chart' &&( */}
            <E_PieChart showTool={true} id={id}></E_PieChart>
            {/* )}  */}
            {/* <EChartVisualizationTool showTool={true} id={id} ></EChartVisualizationTool> */}
        </Stack>
    );

    // return (
    //         <div style={{padding:'10px'}}>
    //           {/* Tab Navigation */}
    //           <div style={containerStyle} >
    //           <div
    //             style = {activeTab === 'Visualization' ? activeTabStyle: tabStyle}
    //             onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'lightgreen')}
    //             onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
    //             // style={activeTab === 'Visualization' ? activeTabStyles : tabStyles}
    //             // onMouseEnter={(e) => (e.target.style.backgroundColor = 'lightgreen')}
    //             // onMouseLeave={(e) => (e.target.style.backgroundColor = '')}
    //             onClick={() => setActiveTab('Visualization')} > Visual </div>

    //             <div
    //             style = {activeTab === 'Data' ? activeTabStyle: tabStyle}
    //             onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'lightgreen')}
    //             onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
    //             // style={activeTab === 'Visualization' ? activeTabStyles : tabStyles}
    //             // onMouseEnter={(e) => (e.target.style.backgroundColor = 'lightgreen')}
    //             // onMouseLeave={(e) => (e.target.style.backgroundColor = '')}
    //             onClick={() => setActiveTab('Data')} > Data </div>

    //             <div
    //             style = {activeTab === 'Tools' ? activeTabStyle: tabStyle}
    //             onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'lightgreen')}
    //             onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
    //             // style={activeTab === 'Visualization' ? activeTabStyles : tabStyles}
    //             // onMouseEnter={(e) => (e.target.style.backgroundColor = 'lightgreen')}
    //             // onMouseLeave={(e) => (e.target.style.backgroundColor = '')}
    //             onClick={() => setActiveTab('Tools')} > Tools </div>
    //           </div>
    //           {/* Render the content of the selected tab */}
    //           <div className="tab-content">{renderTabContent()}</div>
    //         </div>
    //       );
};
