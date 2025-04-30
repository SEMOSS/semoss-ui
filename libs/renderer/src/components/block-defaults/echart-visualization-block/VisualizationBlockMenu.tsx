import { useState } from "react";

import { Stack, styled, ToggleTabsGroup } from "@semoss/ui";

import { useBlock } from "../../../hooks";
import { BlockComponent } from "../../../store";
import { AIGenerationSettings, JsonSettings } from "../../block-settings";
import { UpgradedVisualizationTool } from "./variant/bar-chart/UpgradedVisualizationTool";
import { FrameOperations } from "./variant/bar-chart/FrameOperations";
import { FrameOperationsPie } from "./variant/pie-chart/FrameOperationsPie";
import { ScatterPlotBlockSettings } from "./variant/scatter-plot/ScatterPlotBlockSettings";
import { MapChartBlockSettings } from "./variant/map-chart/MapChartBlockSettings";
import { FrameOperationsLine } from "./variant/line-chart/FrameOperationsLine";
import { StackChartBlockSettings } from "./variant/stack-chart/StackChartBlockSettings";
import { Bar, Pie, ScatterPlot, StackChart, Line, WorldMap, Gantt, Dendrogram } from "./variant/Constant";
import { GanttFrameSection } from "./variant/Gantt/GanttFrameSection";

const StyledContainer = styled("div")(() => ({
    height: "100%",
}));
const StyledSubSection = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "8px 16px",
}));
const StyledJsonSection = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    height: "100%",
}));
const StyledToolsSection = styled("div")(() => ({
    display: "flex",
    justifyContent: "space-around",
    width: "100%",
}));
const StyledStack = styled(Stack)(() => ({
    ">.MuiBox-root": {
        width: "90%",
        margin: "auto",
    },
}));
const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    minHeight: "42px",
    color: theme.palette.secondary.light,
    borderRadius: theme.shape.borderRadius,
    alignItems: "center",
    padding: "0px 3px",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    ">.MuiTabs-scroller": {
        display: "flex",
        justifyContent: "space-around",
        ".MuiTabs-flexContainer": {
            flex: 1,
        },

        ">.MuiTabs-flexContainer": {
            width: "100%",
            justifyContent: "space-around",
        },
    },

}));
const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: "38px",
    padding: "8px 16px",

    "&.MuiTab-root": {
        borderRadius: theme.shape.borderRadius,
        width: "30%",
        padding: "4px 8px",
    },
    "&.Mui-selected": {
        boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.05)",
    },
}));

export const VisualizationBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlock(id);
    const [selectedTab, setSelectedTab] = useState("Tools");
    const [selectedColumn, setSelectedColumn] = useState<string[]>([]);
    function updateFrame() { }

    function handleStoreData(storeData: any[]) {
        const hasValues = storeData.some(item => item?.values && item?.values.length > 0);
        if (hasValues) {
            setSelectedColumn(storeData);
        }
    }
    return (
        <StyledStack>
            {/* CodeEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON */}
            {/* Not sure if we want to delete JsonSettings but it's no longer in use here */}
            {/* <JsonSettings id={id} path="option" /> */}
            {/* <CodeEditorSettings id={id} path="specJson" /> */}
            <StyledToggleTabsGroup
                variant="fullWidth"
                value={selectedTab}
                style={{
                    width: "100% !important",
                }}
                onChange={(e: React.SyntheticEvent, val: string) => {
                    setSelectedTab(val);
                }}
            >
                <StyledToggleTabsGroupItem label="Data" value={"Data"} />
                <StyledToggleTabsGroupItem label="Tools" value={"Tools"} />
                <StyledToggleTabsGroupItem label="JSON" value={"JSON"} />
            </StyledToggleTabsGroup>
            <StyledContainer>
                {selectedTab === "Data" && (
                    <StyledSubSection>
                        {data.variation === "echart-bar-graph" && (
                            <FrameOperations
                                id={id}
                                updateFrame={updateFrame}
                                path="option"
                                chart={Bar}
                                storedColumns={selectedColumn}
                                handleStoreData={handleStoreData}
                            />
                        )}
                        {data.variation === "echart-line-graph" && (
                            <FrameOperations
                                id={id}
                                updateFrame={updateFrame}
                                path="option"
                                chart={Line}
                                storedColumns={selectedColumn}
                                handleStoreData={handleStoreData}
                            />
                        )}
                        {data.variation === "echart-pie-chart" && (
                            <FrameOperations
                                id={id}
                                updateFrame={updateFrame}
                                path="option"
                                chart={Pie}
                                storedColumns={selectedColumn}
                                handleStoreData={handleStoreData}
                            />
                        )}
                        {data.variation === "echart-scatter-plots" && (
                            <FrameOperations
                                id={id}
                                updateFrame={updateFrame}
                                path="option"
                                chart={ScatterPlot}
                                storedColumns={selectedColumn}
                                handleStoreData={handleStoreData}
                            />
                        )}
                        {data.variation === "echart-world-map-chart" && (
                            <FrameOperations
                                id={id}
                                updateFrame={updateFrame}
                                path="option"
                                chart={WorldMap}
                                storedColumns={selectedColumn}
                                handleStoreData={handleStoreData}
                            />
                        )}
                        {/* Render StackChartBlockSettings component when 'Data' tab is selected */}
                        {data.variation === "echart-stack-chart" && (
                            <FrameOperations
                                id={id}
                                updateFrame={updateFrame}
                                path="option"
                                chart={StackChart}
                                storedColumns={selectedColumn}
                                handleStoreData={handleStoreData}
                            />
                        )}
                        {data.variation === "echart-gantt-chart" && (
                            <FrameOperations
                                id={id}
                                updateFrame={updateFrame}
                                path="option"
                                chart={Gantt}
                                storedColumns={selectedColumn}
                                handleStoreData={handleStoreData}
                            />
                        )}
                        {data.variation === "echart-dendrogram-chart" && (
                            <FrameOperations
                                id={id}
                                updateFrame={updateFrame}
                                path="option"
                                chart={Dendrogram}
                                storedColumns={selectedColumn}
                                handleStoreData={handleStoreData}
                            />
                        )}
                    </StyledSubSection>
                )}
                {selectedTab === "Tools" && (
                    <StyledToolsSection>
                        {/* Render UpgradedVisualizationTool component when 'Tools' tab is selected */}
                        <UpgradedVisualizationTool id={id} />
                    </StyledToolsSection>
                )}
                {selectedTab === "JSON" && (
                    <StyledJsonSection>
                        <JsonSettings id={id} path="option" height="100vh" />
                    </StyledJsonSection>
                )}
            </StyledContainer>
            {!data.variation && (
                <AIGenerationSettings
                    id={id}
                    path="option"
                    appendPrompt={"An EChart graph"}
                    placeholder="Ex: Generate a E-Chart bar graph."
                    valueAsObject
                />
            )}
        </StyledStack>
    );
};
