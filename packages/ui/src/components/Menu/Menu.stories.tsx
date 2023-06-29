import type { Meta, StoryObj } from "@storybook/react";
import { Menu } from "../Menu/index";
import Icons from "../Icons/index";
import { Box } from "../Box/index";
import React from "react";

const meta: Meta<typeof Menu> = {
    title: "Components/Menu",
    component: Menu,
    args: {
        open: true,
        autoFocus: false,
        variant: "menu",
        sx: {},
    },
    argTypes: {
        open: {
            options: [true, false],
        },
        autoFocus: {
            options: [true, false],
        },
        variant: {
            options: ["menu", "selectedMenu"],
        },
    },
};

export default meta;

type Story = StoryObj<typeof Menu>;

export const Default: Story = {
    render: (args) => (
        <>
            <Menu {...args}>
                <Menu.Item dense>
                    <Icons.SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
                    <Box sx={{ mr: 2 }}>Menu Item #1</Box>
                </Menu.Item>
                <Menu.Item>
                    <Icons.FileUploadRounded sx={{ color: "#40a0ff", mr: 2 }} />
                    <Box sx={{ mr: 2 }}>Menu Item #2</Box>
                </Menu.Item>
                <Menu.Item>
                    <Icons.AbcRounded sx={{ color: "#40a0ff", mr: 2 }} />
                    <Box sx={{ mr: 2 }}>Menu Item #3</Box>
                </Menu.Item>
            </Menu>
        </>
    ),
};
