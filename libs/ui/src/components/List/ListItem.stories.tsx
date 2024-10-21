import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SearchRounded } from "@mui/icons-material";
import { Box } from "../..";

// Do we want to export in index
import { ListItem } from "./ListItem";

const meta: Meta<typeof ListItem> = {
    title: "Components/List/ListItem",
    component: ListItem,
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

type Story = StoryObj<typeof ListItem>;

export const Default: Story = {
    render: (args) => (
        <ListItem {...args}>
            <SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
            <Box sx={{ mr: 2 }}>Menu Item #1</Box>
        </ListItem>
    ),
};
