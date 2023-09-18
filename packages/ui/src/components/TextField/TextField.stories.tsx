import React from "react";
import { TextField } from "./TextField";

export default {
    title: "Components/TextField",
    component: TextField,
};

const Template = (args) => {
    return <TextField {...args} />;
};

export const Default = Template.bind({});

Default.args = {
    label: "Default",
    variant: "outlined",
};
