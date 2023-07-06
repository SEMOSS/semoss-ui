import React from "react";
import { ToggleGroup, ToggleList, Toggle } from "../ToggleGroup/index";

export default {
    title: "Components/ToggleGroup",
    component: ToggleGroup,
    args: {
        orientation: "horizontal",
        color: "neutral",
    },
    argTypes: {
        color: {
            options: [
                "danger",
                "info",
                "neutral",
                "primary",
                "success",
                "warning",
            ],
            control: { type: "select" },
        },
    },
};

const Template = (args) => {
    return (
        <ToggleGroup {...args}>
            <ToggleList>
                <Toggle>First Toggle</Toggle>
                <Toggle>Second Toggle</Toggle>
            </ToggleList>
        </ToggleGroup>
    );
};

export const Default = Template.bind({});
