import React, { useState } from "react";
import { Button } from "../..";
import { Collapse } from ".";

export default {
    title: "Components/Collapse",
    component: Collapse,
};

const Template = (args) => {
    const [open, setOpen] = useState(false);
    return (
        <div>
            <Button onClick={() => setOpen(!open)}>
                {open ? "Collapse" : "Open"}
            </Button>
            <Collapse in={open} timeout="auto" unmountOnExit {...args}>
                Open Collapse component
            </Collapse>
        </div>
    );
};

export const Default = Template.bind({});

Default.args = {
    label: "Default",
};
