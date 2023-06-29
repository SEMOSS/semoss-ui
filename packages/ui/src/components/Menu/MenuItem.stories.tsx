import type { Meta, StoryObj } from "@storybook/react";
import { MenuItem } from "./MenuItem";
import Icons from "../Icons/index";
import { Box } from "../Box/index";
import React from "react";

const meta: Meta<typeof MenuItem> = {
    title: "Components/Menu/MenuItem",
    component: MenuItem,
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

type Story = StoryObj<typeof MenuItem>;

export const Default: Story = {
    render: (args) => (
        <MenuItem {...args}>
            <Icons.SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
            <Box sx={{ mr: 2 }}>Menu Item #1</Box>
        </MenuItem>
    ),
};
