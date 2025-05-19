import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import {
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import styled from "@emotion/styled";
import { List, Switch } from "@semoss/ui";
import { GrainTwoTone, InfoOutlined } from "@mui/icons-material";
import ImageIcon from "@mui/icons-material/Image";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { useBlockSettings } from "../../../../../hooks";
import { GanttTargetLine } from "./GanttTargetLine";
import { CustomizeSymbol } from "./CustomizeSymbol";
import { GanttLegend } from "./GanttLegend";
import { GanttGroupView } from "./GanttGroupView";
import { GanttDisplayValueLabels } from "./GanttDisplayValueLabels";
import { GanttFiscal } from "./GanttFiscal";

interface GanttToolsSectionProps {
    id: string;
}

//Styled list item with contents type display
const StyledListItem = styled(ListItem)(({}) => ({
    display: "contents !important",
}));

export const GanttToolsSection = observer(({ id }: GanttToolsSectionProps) => {
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
    const [selectedList, setSelectedList] = useState("");
    return (
        <>
            <List style={{ width: "100%" }}>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "fiscalaxis" ? "" : "fiscalaxis",
                            )
                        }
                        selected={selectedList === "fiscalaxis"}
                    >
                        <ListItemIcon>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "fiscalaxis"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <ListItemText
                            primary="Fiscal Axis"
                            style={{ flex: "0.5 1 auto" }}
                        />
                        <InfoOutlined />
                    </ListItemButton>
                </ListItem>
                {selectedList === "fiscalaxis" && (
                    <GanttFiscal id={id} path={"option"} />
                )}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "targetdate" ? "" : "targetdate",
                            )
                        }
                        selected={selectedList === "targetdate"}
                    >
                        <ListItemIcon>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "targetdate"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <ListItemText
                            primary="Target Date"
                            style={{ flex: "0.5 1 auto" }}
                        />
                        <InfoOutlined />
                    </ListItemButton>
                </ListItem>
                {selectedList === "targetdate" && (
                    <GanttTargetLine id={id} path={"option"} />
                )}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "customizesymbol"
                                    ? ""
                                    : "customizesymbol",
                            )
                        }
                        selected={selectedList === "customizesymbol"}
                    >
                        <ListItemIcon>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "customizesymbol"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <ListItemText
                            primary="Customize Symbol"
                            style={{ flex: "0.5 1 auto" }}
                        />
                        <InfoOutlined />
                    </ListItemButton>
                </ListItem>
                {selectedList === "customizesymbol" && (
                    <CustomizeSymbol id={id} path={"option"} />
                )}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "togglelegendgantt"
                                    ? ""
                                    : "togglelegendgantt",
                            )
                        }
                        selected={selectedList === "togglelegendgantt"}
                    >
                        <ListItemIcon>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "togglelegendgantt"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <ListItemText
                            primary="Legend"
                            style={{ flex: "0.5 1 auto" }}
                        />
                        <InfoOutlined />
                    </ListItemButton>
                </ListItem>
                {selectedList === "togglelegendgantt" && (
                    <>
                        <GanttLegend id={id} path={"option"} />
                    </>
                )}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "togglegroupview"
                                    ? ""
                                    : "togglegroupview",
                            )
                        }
                        selected={selectedList === "togglegroupview"}
                    >
                        <ListItemIcon>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "togglegroupview"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <ListItemText
                            primary="Group View"
                            style={{ flex: "0.5 1 auto" }}
                        />
                        <InfoOutlined />
                    </ListItemButton>
                </ListItem>
                {selectedList === "togglegroupview" && (
                    <>
                        <GanttGroupView id={id} path={"option"} />
                    </>
                )}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "displayvaluelabels"
                                    ? ""
                                    : "displayvaluelabels",
                            )
                        }
                        selected={selectedList === "displayvaluelabels"}
                    >
                        <ListItemIcon>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "displayvaluelabels"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <ListItemText
                            primary="Display Value Labels"
                            style={{ flex: "0.5 1 auto" }}
                        />
                        <InfoOutlined />
                    </ListItemButton>
                </ListItem>
                {selectedList === "displayvaluelabels" && (
                    <>
                        <GanttDisplayValueLabels id={id} path="option" />
                    </>
                )}
            </List>
        </>
    );
});
