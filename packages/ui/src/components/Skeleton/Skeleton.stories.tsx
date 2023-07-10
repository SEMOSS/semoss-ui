import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "../Skeleton/index";

const meta: Meta<typeof Skeleton> = {
    title: "Components/Skeleton",
    component: Skeleton,
    args: {
        variant: "rectangular",
        height: 40,
        width: 40,
    },
    argTypes: {
        variant: {
            options: ["rectangular", "circular", "text", "rounded"],
            control: { type: "select" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
    render: (args) => <Skeleton {...args} />,
};
