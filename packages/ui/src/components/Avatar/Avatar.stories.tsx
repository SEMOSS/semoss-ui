import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "../Avatar/index";

const meta: Meta<typeof Avatar> = {
    title: "Components/Avatar",
    component: Avatar,
    args: {
        children: "S",
        variant: "rounded",
    },
    argTypes: {
        variant: {
            options: ["circular", "rounded"],
        },
    },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
    render: (args) => <Avatar {...args} />,
};
