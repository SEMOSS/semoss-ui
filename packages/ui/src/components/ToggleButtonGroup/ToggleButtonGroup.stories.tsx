import React, { useState } from "react";
import { ToggleButtonGroup } from "./";
import { ToggleButton } from "../ToggleButton";

export default {
    title: "Components/ToggleButtonGroup",
    component: ToggleButtonGroup,
};

const Template = (args) => {
    const [value, setValue] = useState<string>("");
    return (
        <ToggleButtonGroup value={value} {...args}>
            <ToggleButton onClick={(e, v: string) => setValue(v)} value={"1"}>
                Button 1
            </ToggleButton>
            <ToggleButton onClick={(e, v: string) => setValue(v)} value={"2"}>
                Button 2
            </ToggleButton>
        </ToggleButtonGroup>
    );
};

export const Default = Template.bind({});

Default.args = {
    label: "Default",
};
