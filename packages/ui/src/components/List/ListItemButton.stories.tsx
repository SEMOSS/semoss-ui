import type { Meta, StoryObj } from "@storybook/react";
import { ListItemButton } from "./ListItemButton";
import Icons from "../Icons";
import React from "react";

const meta: Meta<typeof ListItemButton> = {
    title: "Components/List/ListItemButton",
    component: ListItemButton,
    args: {
        dense: false,
        autoFocus: false,
        disabled: false,
        divider: false,
        selected: false,
    },
    argTypes: {
        dense: {
            options: [true, false],
        },
        autoFocus: {
            options: [true, false],
        },
        disabled: {
            options: [true, false],
        },
        divider: {
            options: [true, false],
        },
        selected: {
            options: [true, false],
        },
    },
};

export default meta;

type Story = StoryObj<typeof ListItemButton>;

export const Default: Story = {
    render: (args) => (
        <ListItemButton {...args}>
            <Icons.SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
        </ListItemButton>
    ),
};
