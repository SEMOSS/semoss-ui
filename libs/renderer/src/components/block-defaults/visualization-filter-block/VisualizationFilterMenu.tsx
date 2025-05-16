import { useEffect, useMemo, useState } from "react";
import {
    Autocomplete,
    MenuItem,
    Select,
    Stack,
    styled,
    Switch,
    TextField,
    ToggleTabsGroup,
    Typography,
} from "@semoss/ui";
import { useBlock, useBlockSettings } from "../../../hooks";
import { BlockComponent } from "../../../store";
import { getValueByPath } from "../../../utility";
import { computed } from "mobx";

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

const StyledContainer = styled("div")(() => ({
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
}));

const StyledSubSection = styled("div")(() => ({
    display: "flex",
    padding: "8px 16px",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px",
    alignSelf: "stretch",
}));

const StyleHorizontalSection = styled("div")(() => ({
    display: "flex",
    padding: "8px 16px",
    alignItems: "center",
    gap: "8px",
    alignSelf: "stretch",
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: "143%",
    letterSpacing: "0.17px",
    alignSelf: "stretch",
}));

const DATA = {
    displayType: ["Checklist", "Dropdown", "Multiselect", "Slider"],
    frame: ["Frame 1", "Frame 2", "Frame 3"],
    column: ["Column 1", "Column 2", "Column 3"],
    filterType: ["Default", "Dynamic", "Cache"],
};
export const VisualizationFilterMenu: BlockComponent = ({ id }) => {
    const { data, setData } = useBlockSettings(id);
    const [selectedTab, setSelectedTab] = useState("Tools");
    const path = "dataType";
    const [value, setValue] = useState("");

    //update the local state value when computed value is getting updated
    useEffect(() => {
        console.log("data", data);
    }, [data]);

    const handleOnChange = (field: string, value: any) => {
        console.log("field", field, "value", value);
        setData(field, value);
    };
    return (
        <StyledStack>
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
                    <StyledSubSection>data</StyledSubSection>
                )}
                {selectedTab === "Tools" && (
                    <>
                        <StyledSubSection>
                            <StyledTypography variant="body2">
                                Select Display Type
                            </StyledTypography>
                            <Autocomplete
                                options={DATA.displayType} //[{label: "Checklist", value: "Checklist"}, {label: "Dropdown", value: "Dropdown"}, {label: "Multiselect", value: "Multiselect"}, {label: "Slider", value: "Slider"}]
                                value={data.displayType}
                                onChange={(_, value) => {
                                    handleOnChange("displayType", value);
                                }}
                                size="small"
                                fullWidth={true}
                                multiple={false}
                                renderInput={(params) => (
                                    <TextField {...params} size="small" />
                                )}
                            />
                        </StyledSubSection>
                        <StyledSubSection>
                            <StyledTypography variant="body2">
                                Select Frame
                            </StyledTypography>
                            <Autocomplete
                                options={DATA.frame}
                                value={data.frame}
                                onChange={(_, value) =>
                                    handleOnChange("frame", value)
                                }
                                size="small"
                                fullWidth={true}
                                multiple={false}
                                renderInput={(params) => (
                                    <TextField {...params} size="small" />
                                )}
                            />
                        </StyledSubSection>
                        <StyledSubSection>
                            <StyledTypography variant="body2">
                                Select Column
                            </StyledTypography>
                            <Autocomplete
                                options={DATA.column}
                                value={data.column}
                                onChange={(_, value) =>
                                    handleOnChange("column", value)
                                }
                                size="small"
                                fullWidth={true}
                                multiple={false}
                                renderInput={(params) => (
                                    <TextField {...params} size="small" />
                                )}
                            />
                        </StyledSubSection>
                        <StyledSubSection>
                            <StyledTypography variant="body2">
                                Filter type
                            </StyledTypography>
                            <Autocomplete
                                options={DATA.filterType}
                                value={data.filterType}
                                onChange={(_, value) =>
                                    handleOnChange("filterType", value)
                                }
                                size="small"
                                fullWidth={true}
                                multiple={false}
                                renderInput={(params) => (
                                    <TextField {...params} size="small" />
                                )}
                            />
                        </StyledSubSection>
                        <StyleHorizontalSection>
                            <Switch
                                // checked={false}
                                onChange={(e: any) =>
                                    handleOnChange(
                                        "showPanelTitle",
                                        e.target.checked,
                                    )
                                }
                                size="medium"
                                color="secondary"
                            />
                            <StyledTypography
                                variant="body2"
                                sx={{ alignSelf: "center" }}
                            >
                                Show Panel Title
                            </StyledTypography>
                        </StyleHorizontalSection>
                        <StyleHorizontalSection>
                            <Switch
                                // checked={false}
                                onChange={(e: any) =>
                                    handleOnChange(
                                        "searchable",
                                        e.target.checked,
                                    )
                                }
                                size="medium"
                                color="secondary"
                            />
                            <StyledTypography
                                variant="body2"
                                sx={{ alignSelf: "center" }}
                            >
                                Searchable
                            </StyledTypography>
                        </StyleHorizontalSection>
                        <>{console.log("TESTING >> ", data)}</>
                        <StyleHorizontalSection
                            style={{
                                display:
                                    data.displayType === "Multiselect"
                                        ? "none"
                                        : "flex",
                            }}
                        >
                            <Switch
                                // checked={false}
                                onChange={(e: any) =>
                                    handleOnChange(
                                        "multipleSelection",
                                        e.target.checked,
                                    )
                                }
                                size="medium"
                                color="secondary"
                            />
                            <StyledTypography
                                variant="body2"
                                sx={{ alignSelf: "center" }}
                            >
                                Allow Multiple Selection
                            </StyledTypography>
                        </StyleHorizontalSection>
                        <StyleHorizontalSection>
                            <Switch
                                // checked={false}
                                onChange={(e: any) =>
                                    handleOnChange(
                                        "restriction",
                                        e.target.checked,
                                    )
                                }
                                size="medium"
                                color="secondary"
                            />
                            <StyledTypography
                                variant="body2"
                                sx={{ alignSelf: "center" }}
                            >
                                Restriction
                            </StyledTypography>
                        </StyleHorizontalSection>
                    </>
                )}
                {selectedTab === "JSON" && (
                    <StyledSubSection>json</StyledSubSection>
                )}
            </StyledContainer>
        </StyledStack>
    );
};
