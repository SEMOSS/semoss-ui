import React from "react";
import { ToggleButton } from "./";

export default {
    title: "Components/ToggleButton",
    component: ToggleButton,
};

const Template = (args) => {
    return <ToggleButton {...args}>Button</ToggleButton>;
};

export const Default = Template.bind({});

Default.args = {
    label: "Default",
};
