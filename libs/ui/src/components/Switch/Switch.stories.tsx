import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./index";

const meta: Meta<typeof Switch> = {
    title: "Components/Switch",
    component: Switch,
    args: {
        defaultChecked: true,
        color: "secondary",
        centerRipple: false,
        disableTouchRipple: false,
        focusRipple: false,
        disabled: false,
        edge: "end",
    },
    argTypes: {
        color: {
            options: ["secondary", "warning", "primary"],
            control: { type: "select" },
        },
        edge: {
            options: ["end", "start"],
            control: { type: "select" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Switch>;

const label = { inputProps: { "aria-label": "Color switch demo" } };

export const Default: Story = {
    render: (args) => <Switch {...label} {...args} />,
};
