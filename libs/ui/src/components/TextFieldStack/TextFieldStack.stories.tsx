import React from "react";
import { TextFieldStack } from "./TextFieldStack";

export default {
    title: "Components/TextFieldStack",
    component: TextFieldStack,
};

const Template = (args) => {
    return <TextFieldStack {...args} />;
};

export const Default = Template.bind({});

Default.args = {
    label: "Default",
    variant: "outlined",
};
