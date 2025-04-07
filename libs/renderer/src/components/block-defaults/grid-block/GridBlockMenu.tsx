import { useState } from "react";
import { Stack, styled, ToggleTabsGroup } from "@semoss/ui";

import { useBlock } from "../../../hooks";
import { BlockComponent } from "../../../store";
import { GridBlockColumnSettings } from "../grid-block/GridBlockColumnSettings";
import { GridBlockTool } from "./GridBlockTool";

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
    border: "1px ",
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

export const GridBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlock(id);

    const [selectedTab, setSelectedTab] = useState("Tools");
    console.log(data, "Variation");
    function updateFrame() {}
    return (
        <StyledStack>
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
                        {data.variation === "grid-block" && (
                            <GridBlockColumnSettings id={id} />
                        )}
                    </StyledSubSection>
                )}
                {selectedTab === "Tools" && (
                    <StyledToolsSection>
                        {/* Render UpgradedVisualizationTool component when 'Tools' tab is selected */}
                        {/* <UpgradedVisualizationTool id={id} /> */}
                        <GridBlockTool id={id} />
                    </StyledToolsSection>
                )}
                {selectedTab === "JSON" && (
                    <StyledSubSection>
                        {/* <JsonSettings id={id} path="option" height="100vh" /> */}
                    </StyledSubSection>
                )}
            </StyledContainer>
        </StyledStack>
    );
};
