import React from "react";
import { TextField } from "./TextField";
import { Input } from "../Input";

export default {
    title: "Components/TextField",
    component: TextField,
    // argTypes: {
    //     spacing: {
    //         options: ["small", "medium"],
    //         control: { type: "radio" },
    //     },
    //     variant: {
    //         options: ["circular", "rounded"],
    //         control: { type: "select" },
    //     },
    // },
};

const Template = (args) => {
    return <TextField {...args} />;
};

export const Default = Template.bind({});

Default.args = {
    label: "Default",
    variant: "outlined",
};
