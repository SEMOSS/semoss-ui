import { BlockComponent } from "../../../store";
import { Stack, styled, ToggleTabsGroup } from "@semoss/ui";
import { AIGenerationSettings, JsonSettings } from "../../block-settings";
import { useBlock } from "../../../hooks";
import { useState } from "react";
import { GanttFrameSection } from "../echart-visualization-block/variant/Gantt/GanttFrameSection";
import { GanttToolsSection } from "../echart-visualization-block/variant/Gantt/GanttToolsSection";
// import { UpgradedVisualizationTool } from './Variants/bar-chart/UpgradedVisualizationTool';
// import { FrameOperations } from './Variants/bar-chart/FrameOperations';
// import { FrameOperationsPie } from './Variants/PieChart/FrameOperationsPie';
// import { ScatterPlotBlockSettings } from './Variants/ScatterPlot/ScatterPlotBlockSettings';

const StyledContainer = styled("div")(() => ({
    maxHeight: "50vh",
}));
const StyledSubSection = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
}));
const StyledToolsSection = styled("div")(() => ({
    display: "flex",
    justifyContent: "space-around",
    width: "100%",
}));
const StyledStack = styled(Stack)(() => ({
    ">.MuiBox-root": {
        width: "100%",
    },
}));
const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    border: "1px",
    minHeight: "42px",
    color: theme.palette.secondary.light,
    borderRadius: theme.shape.borderRadius,
    alignItems: "center",
    padding: "0px 3px",
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    ">.MuiTabs-scroller": {
        display: "flex",
        justifyContent: "space-around",
    },
}));
const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: "38px",
    // width:'33%',
    padding: "8px 11px",
    "&.MuiTab-root": {
        borderRadius: theme.shape.borderRadius,
    },
    "&.Mui-selected": {
        boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.05)",
    },
}));

export const VisualizationBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlock(id);
    const [selectedTab, setSelectedTab] = useState("Tools");
    function updateFrame() {}
    return (
        <StyledStack>
            {/* CodeEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON */}
            {/* Not sure if we want to delete JsonSettings but it's no longer in use here */}
            {/* <JsonSettings id={id} path="option" /> */}
            {/* <CodeEditorSettings id={id} path="specJson" /> */}
            <StyledToggleTabsGroup
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
                        {data.variation === "echart-gantt-chart" && (
                            <GanttFrameSection id={id} />
                        )}
                    </StyledSubSection>
                )}
                {selectedTab === "Tools" && (
                    <StyledToolsSection>
                        {/* Render UpgradedVisualizationTool component when 'Tools' tab is selected */}
                        {/* <UpgradedVisualizationTool id={id} /> */}
                        <GanttToolsSection id={id} />
                    </StyledToolsSection>
                )}
                {selectedTab === "JSON" && (
                    <StyledSubSection>
                        <JsonSettings id={id} path="option" height="100vh" />
                    </StyledSubSection>
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
