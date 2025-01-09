import React, { useState } from "react";
import { Drawer } from ".";
import { Button } from "../..";

export default {
    title: "Components/Drawer",
    component: Drawer,
};

const Template = (args) => {
    const [open, setOpen] = useState(false);

    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <>
            <Button onClick={() => setOpen(true)}>Open Drawer</Button>
            <Drawer
                open={open}
                onClose={(e, v) => {
                    console.log("here", e, v);
                    setOpen(false);
                }}
                {...args}
            >
                Drawer Container
            </Drawer>
        </>
    );
};

export const Default = Template.bind({});

Default.args = {
    label: "Default",
    hideBackdrop: true,
};
