import type { Meta, StoryObj } from "@storybook/react";
import { ListItemText } from "./ListItemText";
import React from "react";

const meta: Meta<typeof ListItemText> = {
    title: "Components/List/ListItemText",
    component: ListItemText,
    args: {
        primary: "Primary",
        secondary: "Secondary",
    },
    argTypes: {
        primary: {
            options: ["Primary", "Text"],
        },
        secondary: {
            options: ["Secondary", "Text"],
        },
    },
};

export default meta;

type Story = StoryObj<typeof ListItemText>;

export const Default: Story = {
    render: (args) => <ListItemText {...args} />,
};
