import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AppBar } from "./index";

const meta: Meta<typeof AppBar> = {
    title: "Components/AppBar",
    component: AppBar,
    args: {
        children: "This is our Appbar component",
    },
    argTypes: {},
};

export default meta;

type Story = StoryObj<typeof AppBar>;

export const Default: Story = {
    render: (args) => <AppBar {...args} />,
};
