import { useState } from "react";
import { observer } from "mobx-react-lite";
import ImageIcon from "@mui/icons-material/Image";
import { InfoOutlined } from "@mui/icons-material";
import {
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Autocomplete,
    TextField,
    Box,
} from "@mui/material";

import { List, Stack, styled } from "@semoss/ui";

import { useBlockSettings } from "../../../hooks";

import { SelectInputSettings, BaseSettingSection } from "../../block-settings";
import { GridBlockDef } from "./GridBlock";
import { HeaderStyling } from "./operations/HeaderStyling";

interface GridBlockToolProps {
    id: string;
}
//Styled list item with contents type display
const StyledListItem = styled(ListItem)(({}) => ({
    display: "contents !important",
}));

const StyledItem = styled("div")(() => ({
    display: "block",
    width: "100%",
    padding: "0.5rem 1rem",
}));

export const GridBlockTool = observer<GridBlockToolProps>(({ id }) => {
    const { data, setData } = useBlockSettings<GridBlockDef>(id);
    const [selectedList, setSelectedList] = useState(""); // maintain the current selected list, for expansion and collapsing
    const [generalSettings, setGeneralSettings] = useState({
        showBlock: data.show,
    });

    function updateChart() {}
    return (
        <>
            <List style={{ width: "100%" }}>
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
                            {/* <SelectInputSettings
                                id={id}
                                path={"show"}
                                label={"Show Block"}
                                options={[]}
                            />
                            <p>Some contents will show here</p> */}
                            <HeaderStyling id={id} path={"option"} />
                        </StyledItem>
                    )}
                </ListItem>
            </List>
        </>
    );
});
