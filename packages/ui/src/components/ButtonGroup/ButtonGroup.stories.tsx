import React from "react";
import { ButtonGroup } from "./";

export default {
    title: "Components/ButtonGroup",
    component: ButtonGroup,
};

const Template = (args) => {
    return (
        <ButtonGroup {...args}>
            <ButtonGroup.Item>Button 1</ButtonGroup.Item>
            <ButtonGroup.Item>Button 2</ButtonGroup.Item>
        </ButtonGroup>
    );
};

export const Default = Template.bind({});

Default.args = {
    label: "Default",
};
