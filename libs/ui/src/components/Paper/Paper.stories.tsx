import React from "react";
import { Paper } from ".";

export default {
    title: "Components/Paper",
    component: Paper,
};

const Template = (args) => {
    return <Paper {...args}>Paper component</Paper>;
};

export const Default = Template.bind({});

Default.args = {
    elevation: 1,
};
