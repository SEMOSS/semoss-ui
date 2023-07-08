import type { Meta, StoryObj } from "@storybook/react";
import { ListItemIcon } from "./ListItemIcon";
import Icons from "../Icons/index";
import React from "react";

const meta: Meta<typeof ListItemIcon> = {
    title: "Components/List/ListItemIcon",
    component: ListItemIcon,
    args: {
        sx: {},
    },
};

export default meta;

type Story = StoryObj<typeof ListItemIcon>;

export const Default: Story = {
    render: (args) => (
        <ListItemIcon {...args}>
            <Icons.StartRounded />
        </ListItemIcon>
    ),
};
