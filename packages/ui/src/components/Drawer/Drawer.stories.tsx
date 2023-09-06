import React, { useState } from "react";
import { Drawer } from "./";
import { Button } from "../../";

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
                divider
            >
                <Drawer.Header>Drawer Header</Drawer.Header>
                <Drawer.Item value="test">Drawer Item #1</Drawer.Item>
                <Drawer.Item value="test">Drawer Item #2</Drawer.Item>
                <Drawer.Divider />
                <Drawer.Item value="test">Drawer Item #3</Drawer.Item>
                <Drawer.Item value="test">Drawer Item #4</Drawer.Item>
                <Drawer.Item value="test">Drawer Item #5</Drawer.Item>
                <Drawer.Footer>Footer</Drawer.Footer>
            </Drawer>
        </>
    );
};

export const Default = Template.bind({});

Default.args = {
    label: "Default",
    hideBackdrop: true,
};
