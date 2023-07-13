import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SearchRounded } from "@mui/icons-material";

// Do we want to export in index
import { ListItemButton } from "./ListItemButton";

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
            <SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
        </ListItemButton>
    ),
};
