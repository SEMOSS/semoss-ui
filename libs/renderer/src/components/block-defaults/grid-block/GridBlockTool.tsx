import { useState } from "react";
import { observer } from "mobx-react-lite";
import ImageIcon from "@mui/icons-material/Image";
import { InfoOutlined } from "@mui/icons-material";
import {
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
} from "@mui/material";

import { Button, List, Stack, styled } from "@semoss/ui";

import { useBlockSettings } from "../../../hooks";

import { GridBlockDef } from "./GridBlock";
import { HeaderStyling } from "./operations/HeaderStyling";
import { CellStyling } from "./operations/CellStyling";
import { ChartTitle } from "./operations/ChartTitle";
import { ColumnTextWrap } from "./operations/WrapTextSettings";
import { RowSpanning } from "./operations/RowSpanning";
import { GridResizeSettings } from "./operations/GridResizeSettings";
import { PathValue } from "@/types";
import { ColorByValue } from "./operations/ColorByValue";

interface GridBlockToolProps {
    id: string;
}

const StyledItem = styled("div")(() => ({
    display: "block",
    width: "100%",
    padding: "0.5rem 1rem",
}));

const StyledItemWithoutPadding = styled("div")(() => ({
    display: "block",
    width: "100%",
    padding: "0.5rem 0",
}));

export const GridBlockTool = observer<GridBlockToolProps>(({ id }) => {
    const { data, setData } = useBlockSettings<GridBlockDef>(id);
    const [selectedList, setSelectedList] = useState(""); // maintain the current selected list, for expansion and collapsing

    const resetToInitialState = () => {
        const defaultState = {
            width: "450px",
            height: "350px",
        };

        const newOption = {
            ...data.style,
            ...defaultState,
        };
        setData("style", newOption as PathValue<GridBlockDef["data"], "style">);
    };

    return (
        <>
            <List style={{ width: "100%" }}>
                {/* Header Styling Section  */}
                <ListItem disablePadding style={{ display: "block" }}>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "generalchartsettings"
                                    ? ""
                                    : "generalchartsettings",
                            )
                        }
                        selected={selectedList === "generalchartsettings"}
                    >
                        <ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "generalchartsettings"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <Box display="flex" alignItems="center" gap={1}>
                            <ListItemText primary="Header Styling" />
                            <InfoOutlined color="disabled" />
                        </Box>
                    </ListItemButton>
                    {selectedList === "generalchartsettings" && (
                        <StyledItem>
                            <HeaderStyling id={id} path={"option"} />
                        </StyledItem>
                    )}
                </ListItem>

                {/* Cell Styling section */}
                <ListItem disablePadding style={{ display: "block" }}>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "cellStylingSettings"
                                    ? ""
                                    : "cellStylingSettings",
                            )
                        }
                        selected={selectedList === "cellStylingSettings"}
                    >
                        <ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "cellStylingSettings"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <Box display="flex" alignItems="center" gap={1}>
                            <ListItemText primary="Cell Styling" />
                            <InfoOutlined color="disabled" />
                        </Box>
                    </ListItemButton>
                    {selectedList === "cellStylingSettings" && (
                        <StyledItem>
                            {/* <SelectInputSettings
                                id={id}
                                path={"show"}
                                label={"Show Block"}
                                options={[]}
                            />
                            <p>Some contents will show here</p> */}
                            <CellStyling id={id} path={"option"} />
                        </StyledItem>
                    )}
                </ListItem>

                {/* Title section  */}
                <ListItem disablePadding style={{ display: "block" }}>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "titleSettings"
                                    ? ""
                                    : "titleSettings",
                            )
                        }
                        selected={selectedList === "titleSettings"}
                    >
                        <ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "titleSettings"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <Box display="flex" alignItems="center" gap={1}>
                            <ListItemText primary="Title" />
                            <InfoOutlined color="disabled" />
                        </Box>
                    </ListItemButton>
                    {selectedList === "titleSettings" && (
                        <StyledItem>
                            <ChartTitle id={id} path={"option"} />
                        </StyledItem>
                    )}
                </ListItem>

                {/* Color By Value  */}
                <ListItem disablePadding style={{ display: "block" }}>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "colorByValue"
                                    ? ""
                                    : "colorByValue",
                            )
                        }
                        selected={selectedList === "colorByValue"}
                    >
                        <ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "colorByValue"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <Box display="flex" alignItems="center" gap={1}>
                            <ListItemText primary="Color By Value" />
                            <InfoOutlined color="disabled" />
                        </Box>
                    </ListItemButton>
                    {selectedList === "colorByValue" && (
                        <StyledItemWithoutPadding>
                            <ColorByValue id={id} path={"option"} />
                        </StyledItemWithoutPadding>
                    )}
                </ListItem>

                {/* Text Wrap  */}
                <ListItem disablePadding style={{ display: "block" }}>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "wrapText" ? "" : "wrapText",
                            )
                        }
                        selected={selectedList === "wrapText"}
                    >
                        <ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "wrapText"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <Box display="flex" alignItems="center" gap={1}>
                            <ListItemText primary="Wrap Text" />
                            <InfoOutlined color="disabled" />
                        </Box>
                    </ListItemButton>
                    {selectedList === "wrapText" && (
                        <StyledItem>
                            <ColumnTextWrap id={id} path={"option"} />
                        </StyledItem>
                    )}
                </ListItem>

                {/* Row Spanning  */}
                <ListItem disablePadding style={{ display: "block" }}>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "rowSpanning" ? "" : "rowSpanning",
                            )
                        }
                        selected={selectedList === "rowSpanning"}
                    >
                        <ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "rowSpanning"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <Box display="flex" alignItems="center" gap={1}>
                            <ListItemText primary="Row Spanning" />
                            <InfoOutlined color="disabled" />
                        </Box>
                    </ListItemButton>
                    {selectedList === "rowSpanning" && (
                        <StyledItem>
                            {/* <ColumnTextWrap id={id} path={"option"} /> */}
                            <RowSpanning id={id} path={"option"} />
                        </StyledItem>
                    )}
                </ListItem>

                {/* Resizing  */}
                <ListItem disablePadding style={{ display: "block" }}>
                    <ListItemButton
                        onClick={(e) =>
                            setSelectedList((prevList) =>
                                prevList === "resizing" ? "" : "resizing",
                            )
                        }
                        selected={selectedList === "resizing"}
                    >
                        <ListItemIcon sx={{ minWidth: 0, marginRight: "16px" }}>
                            <ImageIcon
                                fontSize="large"
                                color={
                                    selectedList === "resizing"
                                        ? "primary"
                                        : "disabled"
                                }
                            />
                        </ListItemIcon>
                        <Box display="flex" alignItems="center" gap={1}>
                            <ListItemText primary="Resizing" />
                            <InfoOutlined color="disabled" />
                        </Box>
                    </ListItemButton>
                    {selectedList === "resizing" && (
                        <StyledItem>
                            <Stack
                                display="flex"
                                flexDirection="column"
                                gap={1}
                            >
                                <GridResizeSettings
                                    path={"style.height"}
                                    id={id}
                                    label={"Height"}
                                ></GridResizeSettings>
                                <GridResizeSettings
                                    path={"style.width"}
                                    id={id}
                                    label={"Width"}
                                ></GridResizeSettings>
                                <Stack display="flex" alignItems="end">
                                    <Button
                                        size="small"
                                        color="primary"
                                        variant="contained"
                                        onClick={resetToInitialState}
                                    >
                                        Reset
                                    </Button>
                                </Stack>
                            </Stack>
                        </StyledItem>
                    )}
                </ListItem>
            </List>
        </>
    );
});
