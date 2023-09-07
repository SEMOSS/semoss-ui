import React, { useState } from "react";
import { Drawer } from "./";
import { Button } from "../../";
import { StarRounded, ExpandLess, ExpandMore } from "@mui/icons-material";
import {
    ListItemButton,
    ListItemIcon,
    ListItemText,
    List,
    Collapse,
    MenuItem,
} from "@mui/material";

export default {
    title: "Components/Drawer",
    component: Drawer,
};

const Template = (args) => {
    const [open, setOpen] = useState(false);
    const [nest, setNest] = useState(false);

    const handleClick = () => {
        setOpen(true);
    };

    const handleNestClick = () => {
        setNest(!nest);
    };

    return (
        <>
            <Button
                onClick={(e) => {
                    //** IMPORTANT -- use stopPropagation, otherwise the onClickAway functionality will not work */
                    e.stopPropagation();
                    handleClick();
                }}
            >
                Open Drawer
            </Button>
            <Drawer
                open={open}
                {...args}
                anchor="left"
                variant="persistent"
                setOpen={setOpen}
            >
                <Drawer.Header text={"Drawer Header"} />
                <Drawer.Item
                    startcontent={<StarRounded sx={{ mr: 2 }} />}
                    endcontent={<StarRounded />}
                    textcontent={"Menu Item #1"}
                />
                <Drawer.Item
                    startcontent={<StarRounded sx={{ mr: 2 }} />}
                    endcontent={<StarRounded />}
                    textcontent={"Menu Item #2"}
                />
                <Drawer.Item
                    startcontent={<StarRounded sx={{ mr: 2 }} />}
                    endcontent={<StarRounded />}
                    textcontent={"Menu Item #3"}
                />
                <Drawer.Divider />
                <Drawer.Item
                    startcontent={<StarRounded sx={{ mr: 2 }} />}
                    endcontent={<StarRounded />}
                    textcontent={"Menu Item #4"}
                />
                <Drawer.Item
                    startcontent={<StarRounded />}
                    endcontent={
                        nest ? (
                            <ExpandLess onClick={handleNestClick} />
                        ) : (
                            <ExpandMore onClick={handleNestClick} />
                        )
                    }
                    textcontent={"Menu Item #5"}
                />
                <Collapse in={nest} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton sx={{ pl: 4 }}>
                            <ListItemIcon>
                                <StarRounded />
                            </ListItemIcon>
                            <ListItemText primary="Starred" />
                        </ListItemButton>
                    </List>
                </Collapse>
                <Drawer.Footer divider={false}>
                    Footer Content Here
                </Drawer.Footer>
            </Drawer>
        </>
    );
};

export const Default = Template.bind({});

Default.args = {
    label: "Default",
    hideBackdrop: true,
};
