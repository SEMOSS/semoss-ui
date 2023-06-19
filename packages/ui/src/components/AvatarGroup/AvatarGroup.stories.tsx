import React from "react";
import { AvatarGroup } from "../AvatarGroup/index";
import { Avatar } from "../Avatar/index";

export default {
    title: "Components/AvatarGroup",
    component: AvatarGroup,
    argTypes: {
        spacing: {
            options: ["small", "medium"],
            control: { type: "radio" },
        },
        variant: {
            options: ["circular", "rounded"],
            control: { type: "select" },
        },
    },
};

const Template = (args) => {
    return (
        <AvatarGroup {...args}>
            <Avatar sx={{ bgcolor: "#9F2B68" }}>S</Avatar>
            <Avatar sx={{ bgcolor: "#00FFFF" }}>T</Avatar>
            <Avatar sx={{ bgcolor: "#FFA500" }}>A</Avatar>
            <Avatar sx={{ bgcolor: "#880808" }}>J</Avatar>
        </AvatarGroup>
    );
};

export const Default = Template.bind({});

Default.args = {
    spacing: "medium",
    max: 4,
    variant: "circular",
    total: 20,
};
