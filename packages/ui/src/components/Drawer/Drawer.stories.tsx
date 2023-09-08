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
    Box,
    styled,
    Stack,
    Slide,
} from "@mui/material";

export default {
    title: "Components/Drawer",
    component: Drawer,
};

const EmbeddedDrawerAnchorLeft = styled(Drawer)({
    position: "absolute",
    right: 0,
    left: 0,
    "& .MuiBackdrop-root": {
        position: "absolute",
    },
    "& .MuiDrawer-paper": {
        position: "absolute",
    },
});

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

const PositioningExample = (args) => {
    const [open, setOpen] = useState(false);
    const [nest, setNest] = useState(false);

    const containerRef = React.useRef(null);

    const handleClick = () => {
        setOpen(!open);
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
                {open ? "Close Drawer" : "Open Drawer"}
            </Button>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    width: "100%",
                    height: "500px",
                    gap: "16px",
                }}
                id="home"
            >
                <Box
                    sx={{
                        position: "relative",
                        bgcolor: "pink",
                        overflow: "auto",
                        width: "500px",
                        border: "1px solid green",
                    }}
                >
                    Box #1
                </Box>
                <Box
                    ref={containerRef}
                    sx={{ overflow: "hidden", width: open ? "320px" : "" }}
                >
                    <Slide
                        direction="right"
                        in={open}
                        container={containerRef.current}
                    >
                        <Box
                            sx={{
                                position: "relative",
                                bgcolor: "pink",
                                overflow: "auto",
                                width: "500px",
                                border: "1px solid green",
                                height: "500px",
                            }}
                        >
                            <EmbeddedDrawerAnchorLeft
                                open={open}
                                {...args}
                                anchor="left"
                                variant="temporary"
                                setOpen={setOpen}
                                disablePortal={true}
                            >
                                <Drawer.Header text={"Drawer Header"} />
                                <Drawer.Item
                                    startcontent={
                                        <StarRounded sx={{ mr: 2 }} />
                                    }
                                    endcontent={<StarRounded />}
                                    textcontent={"Menu Item #1"}
                                />
                                <Drawer.Item
                                    startcontent={
                                        <StarRounded sx={{ mr: 2 }} />
                                    }
                                    endcontent={<StarRounded />}
                                    textcontent={"Menu Item #2"}
                                />
                                <Drawer.Item
                                    startcontent={
                                        <StarRounded sx={{ mr: 2 }} />
                                    }
                                    endcontent={<StarRounded />}
                                    textcontent={"Menu Item #3"}
                                />
                                <Drawer.Divider />
                                <Drawer.Item
                                    startcontent={
                                        <StarRounded sx={{ mr: 2 }} />
                                    }
                                    endcontent={<StarRounded />}
                                    textcontent={"Menu Item #4"}
                                />
                                <Drawer.Item
                                    startcontent={<StarRounded />}
                                    endcontent={
                                        nest ? (
                                            <ExpandLess
                                                onClick={handleNestClick}
                                            />
                                        ) : (
                                            <ExpandMore
                                                onClick={handleNestClick}
                                            />
                                        )
                                    }
                                    textcontent={"Menu Item #5"}
                                />
                                <Collapse
                                    in={nest}
                                    timeout="auto"
                                    unmountOnExit
                                >
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
                            </EmbeddedDrawerAnchorLeft>
                        </Box>
                    </Slide>
                </Box>
                <Box sx={{ border: "1px solid red" }}>Box #3</Box>
            </Box>
        </>
    );
};

const Clickaway = (args) => {
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
                clickaway={true}
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
export const PositionedExample = PositioningExample.bind({});
export const ClickawayDrawer = Clickaway.bind({});

Default.args = {
    label: "Default",
    hideBackdrop: true,
};
