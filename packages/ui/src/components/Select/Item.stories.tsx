import type { Meta, StoryObj } from "@storybook/react";
import { Item } from "./Item";
import Icons from "../Icons/index";
import { Box } from "../Box/index";
import React from "react";

const meta: Meta<typeof Item> = {
    title: "Components/Select/Item",
    component: Item,
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

type Story = StoryObj<typeof Option>;

export const Default: Story = {
    render: (args) => (
        <>
            <Item value={1} {...args}>
                <Icons.SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
                <Box sx={{ mr: 2 }}>Item Item #1</Box>
            </Item>
            <Item value={2} {...args}>
                <Icons.SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
                <Box sx={{ mr: 2 }}>Item Item #2</Box>
            </Item>
            <Item value={3} {...args}>
                <Icons.SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
                <Box sx={{ mr: 2 }}>Item Item #3</Box>
            </Item>
            <Item value={4} {...args}>
                <Icons.SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
                <Box sx={{ mr: 2 }}>Item Item #4</Box>
            </Item>
        </>
    ),
};
