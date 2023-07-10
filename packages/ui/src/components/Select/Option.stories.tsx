import type { Meta, StoryObj } from "@storybook/react";
import { Option } from "./Option";
import Icons from "../Icons/index";
import { Box } from "../Box/index";
import React from "react";

const meta: Meta<typeof Option> = {
    title: "Components/Select/Option",
    component: Option,
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
            <Option {...args}>
                <Icons.SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
                <Box sx={{ mr: 2 }}>Option Item #1</Box>
            </Option>
            <Option {...args}>
                <Icons.SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
                <Box sx={{ mr: 2 }}>Option Item #2</Box>
            </Option>
            <Option {...args}>
                <Icons.SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
                <Box sx={{ mr: 2 }}>Option Item #3</Box>
            </Option>
            <Option {...args}>
                <Icons.SearchRounded sx={{ color: "#40a0ff", mr: 2 }} />
                <Box sx={{ mr: 2 }}>Option Item #4</Box>
            </Option>
        </>
    ),
};
